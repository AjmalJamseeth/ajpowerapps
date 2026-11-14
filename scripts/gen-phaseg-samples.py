"""Generate the Phase G sample files: GOOSE troubleshooting capture, PRP/RSTP
and HSR captures, PTP and NTP captures, w32tm output, and a test disturbance
recorded by several sources (IED SOE lists, SCADA event list, switch syslog,
GOOSE capture). RSTP BPDUs, NTP and PTP are built with Scapy's layers; GOOSE,
PRP and HSR with the small encoders below (independent of the website code).

    pip install scapy
    python scripts/gen-phaseg-samples.py
"""
import struct, datetime
from scapy.all import Ether, Dot1Q, IP, UDP, Raw, LLC, wrpcap
from scapy.layers.l2 import STP, Dot3
from scapy.layers.ntp import NTPHeader
from scapy.contrib.ptp_v2 import PTP

OUT = "public/samples/"
T0 = 1794636720.0  # 2026-11-14 06:12:00 UTC


def ber(tag, data):
    n = len(data)
    if n < 128:
        return bytes([tag, n]) + data
    if n < 256:
        return bytes([tag, 0x81, n]) + data
    return bytes([tag, 0x82, n >> 8, n & 255]) + data


def u(tag, v, size=None):
    b = v.to_bytes(size or max(1, (v.bit_length() + 8) // 8), "big")
    return ber(tag, b)


def utctime(t, q=0x0A):
    s = int(t)
    f = int((t - s) * 16777216)
    return struct.pack(">I", s) + f.to_bytes(3, "big") + bytes([q])


def goose_frame(src, dst, appid, vlan, prio, gocb, tal, ds, goid, t, st, sq, conf, members, sim=False, test=False, tq=0x0A):
    alld = b"".join(members)
    pdu = (ber(0x80, gocb.encode()) + u(0x81, tal) + ber(0x82, ds.encode()) + ber(0x83, goid.encode()) + ber(0x84, utctime(t, tq)) + u(0x85, st) + u(0x86, sq)
           + ber(0x87, bytes([1 if test else 0])) + u(0x88, conf) + ber(0x89, b"\x00") + u(0x8A, len(members)) + ber(0xAB, alld))
    apdu = ber(0x61, pdu)
    hdr = struct.pack(">HHHH", appid, 8 + len(apdu), 0x8000 if sim else 0, 0)
    e = Ether(src=src, dst=dst)
    if vlan is None:
        return e / Raw(struct.pack(">H", 0x88B8) + hdr + apdu) if False else Ether(src=src, dst=dst, type=0x88B8) / Raw(hdr + apdu)
    return e / Dot1Q(prio=prio, vlan=vlan, type=0x88B8) / Raw(hdr + apdu)


B_ = lambda v: ber(0x83, bytes([1 if v else 0]))
Q_GOOD = ber(0x84, bytes([3, 0, 0]))  # 13-bit quality, 3 unused bits


def goose_stream(pk, t_start, t_end, events, **kw):
    """Publish with the IEC 61850-8-1 retransmission scheme: on change, 4 ms, then doubling up to MaxTime (1 s)."""
    st, sq, t, state = 1, 0, t_start, events[0][1]
    ev = list(events[1:])
    nxt = 1.0
    while t <= t_end:
        if ev and t >= ev[0][0]:
            t = ev[0][0]
            state = ev[0][1]
            ev.pop(0)
            st += 1
            sq = 0
            nxt = 0.004
        tal = int(min(2000, max(8, nxt * 2 * 1000)))
        f = kw["mk"](t, st, sq, state, tal)
        f.time = t
        pk.append(f)
        sq += 1
        step = nxt
        nxt = min(1.0, nxt * 2)
        t_next = t + step
        if ev and ev[0][0] < t_next:
            t = ev[0][0]
        else:
            t = t_next


def s13_goose():
    pk = []
    # GCB_TRIP: the IED still uses the vendor default goID (gocbRef) instead of the SCD appID
    goose_stream(pk, T0 + 28, T0 + 34, [(0, False), (T0 + 31.231, True), (T0 + 31.331, False)], mk=lambda t, st, sq, v, tal: goose_frame(
        "02:aa:00:00:02:01", "01:0c:cd:01:00:11", 0x0011, 10, 4, "P132_Q01PROT/LLN0$GO$GCB_TRIP", tal, "P132_Q01PROT/LLN0$DS_TRIP", "P132_Q01PROT/LLN0$GO$GCB_TRIP", t, st, sq, 1, [B_(v), Q_GOOD, B_(v)]))
    # GCB_DIFF: correct, but sent in VLAN 11 instead of 10
    goose_stream(pk, T0 + 28.1, T0 + 34, [(0, False)], mk=lambda t, st, sq, v, tal: goose_frame(
        "02:aa:00:00:02:03", "01:0c:cd:01:00:21", 0x0021, 11, 4, "P87T_T1PROT/LLN0$GO$GCB_DIFF", tal, "P87T_T1PROT/LLN0$DS_DIFF", "P87T_T1PROT/LLN0.GCB_DIFF", t, st, sq, 2, [B_(v), Q_GOOD]))
    # a stream from a replaced IED still running its old configuration
    goose_stream(pk, T0 + 28.2, T0 + 34, [(0, False)], mk=lambda t, st, sq, v, tal: goose_frame(
        "02:aa:00:00:09:09", "01:0c:cd:01:00:31", 0x0031, 10, 4, "BCU_J01CTRL/LLN0$GO$GCB_OLD", tal, "BCU_J01CTRL/LLN0$DS_OLD", "BCU_J01CTRL/LLN0.GCB_OLD", t, st, sq, 1, [B_(v)]))
    pk.sort(key=lambda p: p.time)
    wrpcap(OUT + "S13_GOOSE_station_bus.pcap", pk)


def rct(seq, lan, lsdu):
    return struct.pack(">HH", seq, ((0xA if lan == "A" else 0xB) << 12) | lsdu) + b"\x88\xfb"


def prp_rstp():
    pk = []
    nodes = {"P132_Q01": "02:aa:00:00:02:01", "P87T_T1": "02:aa:00:00:02:03", "GW1": "02:aa:00:00:01:01", "BCU_J01": "02:aa:00:00:03:01"}
    seq = {k: 100 for k in nodes}
    t = T0
    for k in range(60):  # 6 s of traffic, every 100 ms
        t = T0 + k * 0.1
        for n, m in nodes.items():
            payload = bytes(46)
            lan = "B" if n == "GW1" else "A"  # GW1's LAN B port is patched into the LAN A switch
            seq[n] += 1
            if n == "P87T_T1" and 20 <= k < 25:
                continue  # frames lost on LAN A
            lsdu = len(payload) + 6 + (4 if n == "BCU_J01" and k == 33 else 0)  # one wrong LSDU size
            f = Ether(src=m, dst="02:aa:00:00:0c:01", type=0x0800) / Raw(payload + rct(seq[n], lan, lsdu))
            f.time = t + 0.001 * list(nodes).index(n)
            pk.append(f)
    # PRP supervision frames every 2 s (DANPs, a RedBox with two VDANs); BCU_J01 sends none
    for k in range(3):
        for n, m in list(nodes.items())[:3]:
            body = struct.pack(">HH", 0x0001, k) + bytes([20, 6]) + bytes.fromhex(m.replace(":", "")) + bytes([0, 0])
            f = Ether(src=m, dst="01:15:4e:00:01:00", type=0x88FB) / Raw(body + bytes(max(0, 46 - len(body))) + rct(k, "B" if n == "GW1" else "A", 46 + 6))
            f.time = T0 + 0.05 + 2 * k
            pk.append(f)
        body = struct.pack(">HH", 0x0001, k) + bytes([20, 6]) + bytes.fromhex("02aa00000e01") + bytes([30, 6]) + bytes.fromhex("02aa00000e01") + bytes([31, 6]) + bytes.fromhex("02aa00000701") + bytes([31, 6]) + bytes.fromhex("02aa00000702") + bytes([0, 0])
        f = Ether(src="02:aa:00:00:0e:01", dst="01:15:4e:00:01:00", type=0x88FB) / Raw(body + rct(k, "A", len(body) + 6))
        f.time = T0 + 0.06 + 2 * k
        pk.append(f)
    # RSTP: SW1 is root; at 3.0 s SW2 claims root (its priority was set lower by mistake) and topology changes follow
    def bp(t, root_prio, root_mac, cost, br_prio, br_mac, port, flags):
        f = Dot3(src=br_mac, dst="01:80:c2:00:00:00") / LLC(dsap=0x42, ssap=0x42, ctrl=3) / STP(proto=0, version=2, bpdutype=2, bpduflags=flags, rootid=root_prio, rootmac=root_mac, pathcost=cost, bridgeid=br_prio, bridgemac=br_mac, portid=port, age=0 if cost == 0 else 1, maxage=20, hellotime=2, fwddelay=15)
        f.time = t
        return f
    for k in range(4):
        tt = T0 + 2 * k + 0.2
        if tt < T0 + 3:
            pk.append(bp(tt, 32768, "02:aa:00:00:0f:01", 0, 32768, "02:aa:00:00:0f:01", 0x8008, 0x3C))
        else:
            pk.append(bp(tt, 4096, "02:aa:00:00:0f:02", 0, 4096, "02:aa:00:00:0f:02", 0x8008, 0x3D))  # TC set
    pk.append(bp(T0 + 3.0, 4096, "02:aa:00:00:0f:02", 0, 4096, "02:aa:00:00:0f:02", 0x8008, 0x3F))
    # an IED port sending BPDUs (bridging enabled in the IED)
    pk.append(bp(T0 + 4.1, 32768, "02:aa:00:00:03:01", 0, 32768, "02:aa:00:00:03:01", 0x8001, 0x3C))
    pk.sort(key=lambda p: p.time)
    wrpcap(OUT + "S13_PRP_RSTP_capture.pcap", pk)


def hsr():
    pk = []
    nodes = {"MU_Q01": "02:aa:00:00:04:01", "MU_T1": "02:aa:00:00:04:02", "P132_Q01": "02:aa:00:00:02:01"}
    seq = {k: 500 for k in nodes}
    for k in range(40):
        t = T0 + k * 0.05
        for i, (n, m) in enumerate(nodes.items()):
            seq[n] += 1
            payload = bytes(46)
            tag = struct.pack(">HHH", (0x0 << 12) | (len(payload) + 6), seq[n], 0x0800)
            f = Ether(src=m, dst="02:aa:00:00:0c:01", type=0x892F) / Raw(tag + payload)
            f.time = t + 0.001 * i
            pk.append(f)
            if n == "MU_T1" and k in (10, 11, 12):  # the same frame seen again: it circulates (a node does not remove its own frames)
                g = f.copy()
                g.time = f.time + 0.0004
                pk.append(g)
            if n == "MU_Q01" and k == 30:
                seq[n] += 3  # 3 frames missing on this port
    pk.sort(key=lambda p: p.time)
    wrpcap(OUT + "S13_HSR_ring_capture.pcap", pk)


def ptp():
    pk = []
    gm1 = "02:aa:00:00:01:03"  # GPS1 grandmaster
    gm2 = "02:aa:00:00:0d:01"  # a device that should not be a grandmaster
    mc = "01:1b:19:00:00:00"
    pdm = "01:80:c2:00:00:0e"
    cid = lambda m: int(m.replace(":", "")[:6] + "fffe" + m.replace(":", "")[6:], 16)

    def frame(src, dst, **kw):
        p = PTP(version=2, domainNumber=kw.pop("domain", 0), clockIdentity=cid(src), portNumber=1, **kw)
        f = Ether(src=src, dst=dst, type=0x88F7) / Raw(bytes(p))
        return f

    for k in range(10):
        t = T0 + k
        cls = 6 if k < 5 else 7  # GPS lost at 5 s: holdover
        f = frame(gm1, mc, messageType=0xB, flags=0x003C if k < 5 else 0x002C, sequenceId=k, logMessageInterval=0, currentUtcOffset=37, grandmasterPriority1=128, grandmasterClockClass=cls,
                  grandmasterClockAccuracy=0x21, grandmasterClockVariance=0x4E5D, grandmasterPriority2=128, grandmasterIdentity=cid(gm1), stepsRemoved=0, timeSource=0x20 if k < 5 else 0xA0,
                  originTimestamp_seconds=int(t) + 37, originTimestamp_nanoseconds=0)
        f.time = t + 0.0002
        pk.append(f)
        f = frame(gm1, mc, messageType=0x0, flags=0x0200, sequenceId=k, logMessageInterval=0, originTimestamp_seconds=int(t) + 37, originTimestamp_nanoseconds=0)
        f.time = t
        pk.append(f)
        if k != 7:  # Follow_Up missing for sequence 7
            f = frame(gm1, mc, messageType=0x8, flags=0, sequenceId=k, logMessageInterval=0, preciseOriginTimestamp_seconds=int(t) + 37, preciseOriginTimestamp_nanoseconds=120)
            f.time = t + 0.00005
            pk.append(f)
        f = frame("02:aa:00:00:02:01", pdm, messageType=0x2, flags=0, sequenceId=k, logMessageInterval=0)
        f.time = t + 0.3
        pk.append(f)
        f = frame(gm1, pdm, messageType=0x3, flags=0x0200, sequenceId=k, logMessageInterval=0x7F)
        f.time = t + 0.30002
        pk.append(f)
    # a second "grandmaster" with priority1 64, free-running (class 248), wrong UTC offset
    for k in range(6, 10):
        f = frame(gm2, mc, messageType=0xB, flags=0x0000, sequenceId=k, logMessageInterval=0, currentUtcOffset=36, grandmasterPriority1=64, grandmasterClockClass=248, grandmasterClockAccuracy=0xFE,
                  grandmasterClockVariance=0xFFFF, grandmasterPriority2=128, grandmasterIdentity=cid(gm2), stepsRemoved=0, timeSource=0xA0, originTimestamp_seconds=int(T0) + k + 36, originTimestamp_nanoseconds=0)
        f.time = T0 + k + 0.5
        pk.append(f)
    # an end device using delay request-response (E2E) in a peer-to-peer network
    f = frame("02:aa:00:00:03:01", mc, messageType=0x1, flags=0, sequenceId=1, logMessageInterval=0x7F)
    f.time = T0 + 4.4
    pk.append(f)
    # a device in another domain
    f = frame("02:aa:00:00:02:02", mc, messageType=0xB, domain=93, flags=0x0000, sequenceId=1, logMessageInterval=0, currentUtcOffset=37, grandmasterPriority1=128, grandmasterClockClass=248, grandmasterClockAccuracy=0xFE,
              grandmasterClockVariance=0xFFFF, grandmasterPriority2=128, grandmasterIdentity=cid("02:aa:00:00:02:02"), stepsRemoved=0, timeSource=0xA0)
    f.time = T0 + 2.7
    pk.append(f)
    pk.sort(key=lambda p: p.time)
    wrpcap(OUT + "S13_PTP_capture.pcap", pk)


NTP_BASE = 2208988800


def ntp_bytes(li, mode, stratum, poll, prec, rdelay, rdisp, refid, ref, orig, recv, xmt):
    ts = lambda t: (0, 0) if not t else (int(t + NTP_BASE), int(((t + NTP_BASE) % 1) * 4294967296) & 0xFFFFFFFF)
    rid = refid.encode().ljust(4, b"\0")[:4] if isinstance(refid, str) else bytes(refid)
    b = struct.pack(">BBbbiI", (li << 6) | (4 << 3) | mode, stratum, poll, prec, int(rdelay * 65536), int(rdisp * 65536)) + rid
    for t in (ref, orig, recv, xmt):
        b += struct.pack(">II", *ts(t))
    return b


def ntp():
    pk = []
    cl, cmac = "10.13.0.12", "02:aa:00:00:01:02"
    off = 0.85  # client clock is 0.85 s ahead of true time; the capture is taken on the client
    E = lambda s, d: Ether(src=s, dst=d)
    for k in range(6):
        t = T0 + 64 * k  # capture (client) clock
        true_t = t - off
        q = E(cmac, "02:aa:00:00:01:03") / IP(src=cl, dst="10.13.0.13") / UDP(sport=123, dport=123) / Raw(ntp_bytes(0, 3, 0, 6, -20, 0, 0, b"\0\0\0\0", 0, 0, 0, t))
        q.time = t
        r = E("02:aa:00:00:01:03", cmac) / IP(src="10.13.0.13", dst=cl) / UDP(sport=123, dport=123) / Raw(ntp_bytes(0, 4, 1, 6, -22, 0, 0.0002, "GPS", true_t - 0.5, t, true_t + 0.0004, true_t + 0.0005))
        r.time = t + 0.0012
        pk += [q, r]
        # second configured server: not synchronised (stratum 16, alarm)
        q = E(cmac, "02:aa:00:00:0e:01") / IP(src=cl, dst="10.13.1.1") / UDP(sport=123, dport=123) / Raw(ntp_bytes(0, 3, 0, 6, -20, 0, 0, b"\0\0\0\0", 0, 0, 0, t + 0.5))
        q.time = t + 0.5
        r = E("02:aa:00:00:0e:01", cmac) / IP(src="10.13.1.1", dst=cl) / UDP(sport=123, dport=123) / Raw(ntp_bytes(3, 4, 16, 6, -18, 0, 16, "INIT", 0, t + 0.5, true_t + 0.5 + 2.3, true_t + 0.5 + 2.3))
        r.time = t + 0.502
        pk += [q, r]
    wrpcap(OUT + "S13_NTP_capture.pcap", pk)
    open(OUT + "S13_HMI1_w32tm.txt", "w", newline="\r\n").write("""C:\\>w32tm /query /status
Leap Indicator: 0(no warning)
Stratum: 2 (secondary reference - syncd by (S)NTP)
Precision: -23 (119.209ns per tick)
Root Delay: 0.0012000s
Root Dispersion: 7.7754118s
ReferenceId: 0x0A0D000D (source IP:  10.13.0.13)
Last Successful Sync Time: 14/11/2026 05:41:13
Source: 10.13.0.13,0x8
Poll Interval: 15 (32768s)

C:\\>w32tm /stripchart /computer:10.13.0.13 /samples:5 /dataonly
Tracking 10.13.0.13 [10.13.0.13:123].
Collecting 5 samples.
The current time is 14/11/2026 10:12:31.
10:12:31, -00.8512301s
10:12:33, -00.8509922s
10:12:35, -00.8514118s
10:12:37, -00.8511004s
10:12:39, -00.8512777s
""")


def disturbance():
    """A line fault on Q01 at 06:12:31.200 UTC, recorded by several sources."""
    t = lambda s: datetime.datetime(2026, 11, 14, 6, 12, 0) + datetime.timedelta(seconds=s)
    f = lambda d: d.strftime("%Y-%m-%d %H:%M:%S.") + f"{d.microsecond // 1000:03d}"
    # P132_Q01, synchronised
    rows = [(31.212, "PROT/PDIS1.Str.general", "1", "Distance zone 1 start", "synchronised"), (31.231, "PROT/PDIS1.Op.general", "1", "Distance zone 1 operate", "synchronised"),
            (31.231, "PROT/PTRC1.Tr.general", "1", "Trip", "synchronised"), (31.281, "CTRL/XCBR1.Pos.stVal", "off", "QA1 open", "synchronised"),
            (31.330, "PROT/PTRC1.Tr.general", "0", "Trip reset", "synchronised"), (31.335, "PROT/PDIS1.Str.general", "0", "Start reset", "synchronised")]
    open(OUT + "S13_SOE_P132_Q01.csv", "w", newline="").write("Time (UTC),Device,Signal,Value,Description,Time quality\r\n" + "".join(f"{f(t(s))},P132_Q01,{sig},{v},{d},{q}\r\n" for s, sig, v, d, q in rows))
    # P87T_T1: clock 312 ms behind and flagged not synchronised; a chattering alarm
    rows = [(31.236 - 0.312, "PROT/PTRC1.Ind_LINE_TRIP", "1", "Intertrip received from P132_Q01 (GOOSE)", "not synchronised"), (31.336 - 0.312, "PROT/PTRC1.Ind_LINE_TRIP", "0", "Intertrip reset", "not synchronised")]
    for k in range(8):
        rows.append((30.0 + 0.4 * k - 0.312, "SYS/GGIO1.Alm3", "1" if k % 2 == 0 else "0", "Cooling fan supply", "not synchronised"))
    rows.sort()
    open(OUT + "S13_SOE_P87T_T1.csv", "w", newline="").write("Time (UTC),Device,Signal,Value,Description,Time quality\r\n" + "".join(f"{f(t(s))},P87T_T1,{sig},{v},{d},{q}\r\n" for s, sig, v, d, q in rows))
    # SCADA event list (local time UTC+4), events time-stamped by the IED via IEC 104, received later; one duplicate
    ev = [(31.231, 31.402, "S13 Q01 Line 1 protection trip", "ON"), (31.281, 31.415, "S13 Q01 CB QA1", "OPEN"), (31.281, 31.415, "S13 Q01 CB QA1", "OPEN"), (31.330, 31.611, "S13 Q01 Line 1 protection trip", "OFF")]
    loc = lambda s: t(s) + datetime.timedelta(hours=4)
    open(OUT + "S13_SCADA_event_list.csv", "w", newline="").write("Event time,Received,Point,State,Priority\r\n" + "".join(f"{f(loc(a))},{f(loc(b))},{p},{st},1\r\n" for a, b, p, st in ev))
    # switch syslog (RFC 3164, UTC)
    sl = [(31.298, "SW1", "%LINK-3-UPDOWN: Interface port 3, changed state to down"), (31.904, "SW1", "%LINK-3-UPDOWN: Interface port 3, changed state to up"), (32.010, "SW1", "%STP-6-TOPOLOGY_CHANGE: topology change detected on port 3")]
    open(OUT + "S13_switch_syslog.log", "w", newline="").write("".join(f"<187>{t(s).strftime('%b %d %H:%M:%S')}.{t(s).microsecond // 1000:03d} {h} {m}\r\n" for s, h, m in sl))


if __name__ == "__main__":
    s13_goose()
    prp_rstp()
    hsr()
    ptp()
    ntp()
    disturbance()
    print("written")
