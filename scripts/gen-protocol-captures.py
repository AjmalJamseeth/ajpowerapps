"""Generate the sample SCADA protocol captures (IEC 104, Modbus TCP, DNP3) with
deliberate faults. IEC 104 and Modbus frames are built with Scapy's protocol
layers (an implementation independent of the website's decoders); DNP3 with a
small encoder below whose CRC is checked against the published example
05 64 05 C0 01 00 00 04 -> E9 21.

    pip install scapy
    python scripts/gen-protocol-captures.py
"""
import struct
from scapy.all import Ether, IP, TCP, wrpcap, Raw
from scapy.contrib.scada.iec104 import (
    IEC104_U_Message, IEC104_S_Message, IEC104_I_Message_SingleIOA as IS,
    IEC104_IO_C_IC_NA_1_IOA, IEC104_IO_M_SP_NA_1_IOA, IEC104_IO_M_DP_NA_1_IOA, IEC104_IO_M_ME_NC_1_IOA,
    IEC104_IO_M_SP_TB_1_IOA, IEC104_IO_M_ME_TF_1_IOA, IEC104_IO_C_DC_NA_1_IOA, IEC104_IO_C_SC_NA_1_IOA, IEC104_IO_M_EI_NA_1_IOA,
)
from scapy.contrib.modbus import (
    ModbusADURequest, ModbusADUResponse, ModbusPDU03ReadHoldingRegistersRequest, ModbusPDU03ReadHoldingRegistersResponse,
    ModbusPDU04ReadInputRegistersRequest, ModbusPDU04ReadInputRegistersResponse, ModbusPDU01ReadCoilsRequest, ModbusPDU01ReadCoilsResponse,
    ModbusPDU06WriteSingleRegisterRequest, ModbusPDU06WriteSingleRegisterResponse, ModbusPDU03ReadHoldingRegistersError,
)

OUT = "public/samples/"
T0 = 1794650400.0  # 2026-11-14 06:00:00 UTC


class Conn:
    """Minimal TCP connection writer with correct sequence numbers."""

    def __init__(self, cmac, smac, cip, sip, cport, sport, t):
        self.c = dict(mac=cmac, ip=cip, port=cport, seq=1000)
        self.s = dict(mac=smac, ip=sip, port=sport, seq=50000)
        self.pk = []
        self.t = t
        self.raw(self.c, self.s, "S", b"", 0.0)
        self.raw(self.s, self.c, "SA", b"", 0.001)
        self.raw(self.c, self.s, "A", b"", 0.0005)

    def raw(self, a, b, flags, data, dt):
        self.t += dt
        p = Ether(src=a["mac"], dst=b["mac"]) / IP(src=a["ip"], dst=b["ip"], ttl=64) / TCP(sport=a["port"], dport=b["port"], seq=a["seq"], ack=b["seq"] + (0 if flags == "S" else 0), flags=flags, window=8192)
        if data:
            p = p / Raw(data)
        p.time = self.t
        self.pk.append(p)
        a["seq"] += len(data) + (1 if "S" in flags or "F" in flags else 0)

    def c2s(self, data, dt):
        self.raw(self.c, self.s, "PA", bytes(data), dt)

    def s2c(self, data, dt):
        self.raw(self.s, self.c, "PA", bytes(data), dt)


def cp56(t, local_offset_h=0):
    import datetime
    d = datetime.datetime.utcfromtimestamp(t + local_offset_h * 3600)
    return dict(sec_milli=d.second * 1000 + d.microsecond // 1000, minutes=d.minute, hours=d.hour, day_of_month=d.day, month=d.month, year=d.year - 2000)


def iec104():
    c = Conn("02:aa:00:00:0c:01", "02:aa:00:00:01:01", "10.13.1.50", "10.13.1.11", 51234, 2404, T0)
    c.c2s(IEC104_U_Message(startdt_act=1), 0.01)
    c.s2c(IEC104_U_Message(startdt_con=1), 0.004)
    ns, nr = {"c": 0, "s": 0}, {"c": 0, "s": 0}

    def I(side, type_id, cot, io, dt, neg=0, ca=1):
        nonlocal ns, nr
        m = IS(tx_seq_num=ns[side], rx_seq_num=nr[side], type_id=type_id, cot=cot, ack=neg, common_asdu_address=ca, io=io)
        ns[side] += 1
        other = "s" if side == "c" else "c"
        nr[other] = ns[side]
        (c.c2s if side == "c" else c.s2c)(m, dt)

    def S(side, dt):
        (c.c2s if side == "c" else c.s2c)(IEC104_S_Message(rx_seq_num=nr[side]), dt)

    I("s", 70, 4, [IEC104_IO_M_EI_NA_1_IOA(information_object_address=0, coi=0)], 0.02)
    I("c", 100, 6, [IEC104_IO_C_IC_NA_1_IOA(information_object_address=0, qoi=20)], 0.05)
    I("s", 100, 7, [IEC104_IO_C_IC_NA_1_IOA(information_object_address=0, qoi=20)], 0.012)
    I("s", 1, 20, [IEC104_IO_M_SP_NA_1_IOA(information_object_address=a, spi_value=v) for a, v in [(1001, 0), (1002, 1), (1003, 0), (1004, 0)]], 0.02)
    I("s", 3, 20, [IEC104_IO_M_DP_NA_1_IOA(information_object_address=2001, dpi_value=2), IEC104_IO_M_DP_NA_1_IOA(information_object_address=2002, dpi_value=1)], 0.01)
    I("s", 13, 20, [IEC104_IO_M_ME_NC_1_IOA(information_object_address=3001, scaled_value=132.4), IEC104_IO_M_ME_NC_1_IOA(information_object_address=3002, scaled_value=412.7),
                    IEC104_IO_M_ME_NC_1_IOA(information_object_address=3003, scaled_value=0.0, iv=1)], 0.01)
    I("s", 100, 10, [IEC104_IO_C_IC_NA_1_IOA(information_object_address=0, qoi=20)], 0.01)
    S("c", 0.03)
    # spontaneous events, time tags in local time (UTC+4): deliberate fault
    t = c.t
    for k in range(10):  # 10 I-frames before the controlling station acknowledges (w = 8)
        I("s", 36, 3, [IEC104_IO_M_ME_TF_1_IOA(information_object_address=3001, scaled_value=132.0 + k * 0.1, **cp56(c.t + 0.4, 4))], 0.4)
    S("c", 0.05)
    I("s", 30, 3, [IEC104_IO_M_SP_TB_1_IOA(information_object_address=1003, spi_value=1, **cp56(c.t + 0.3, 4))], 0.3)
    S("c", 0.02)
    # sequence error: the controlled station skips one send sequence number
    ns["s"] += 1
    I("s", 30, 3, [IEC104_IO_M_SP_TB_1_IOA(information_object_address=1004, spi_value=1, **cp56(c.t + 0.5, 4))], 0.5)
    S("c", 0.02)
    # double command select / execute on IOA 5001 (positive)
    I("c", 46, 6, [IEC104_IO_C_DC_NA_1_IOA(information_object_address=5001, s_or_e=1, dcs=2)], 1.0)
    I("s", 46, 7, [IEC104_IO_C_DC_NA_1_IOA(information_object_address=5001, s_or_e=1, dcs=2)], 0.03)
    I("c", 46, 6, [IEC104_IO_C_DC_NA_1_IOA(information_object_address=5001, s_or_e=0, dcs=2)], 0.5)
    I("s", 46, 7, [IEC104_IO_C_DC_NA_1_IOA(information_object_address=5001, s_or_e=0, dcs=2)], 0.03)
    I("s", 46, 10, [IEC104_IO_C_DC_NA_1_IOA(information_object_address=5001, s_or_e=0, dcs=2)], 0.4)
    # single command to an address the controlled station does not know -> COT 47, negative
    I("c", 45, 6, [IEC104_IO_C_SC_NA_1_IOA(information_object_address=5099, s_or_e=0, scs=1)], 1.0)
    I("s", 45, 47, [IEC104_IO_C_SC_NA_1_IOA(information_object_address=5099, s_or_e=0, scs=1)], 0.02, neg=1)
    S("c", 0.02)
    # TESTFR act from the controlling station is never confirmed (t1 = 15 s)
    c.c2s(IEC104_U_Message(testfr_act=1), 2.0)
    c.s2c(Raw(b""), 0.0) if False else None
    I("s", 36, 3, [IEC104_IO_M_ME_TF_1_IOA(information_object_address=3002, scaled_value=413.1, **cp56(c.t + 17, 4))], 17.0)
    S("c", 0.05)
    wrpcap(OUT + "S13_IEC104_gateway_capture.pcap", c.pk)


def modbus():
    c = Conn("02:aa:00:00:01:02", "02:aa:00:00:05:01", "10.13.0.12", "10.13.0.60", 49800, 502, T0 + 3600)
    tid = 0

    def tx(unit, req, rsp, dt, rdt):
        nonlocal tid
        tid += 1
        c.c2s(ModbusADURequest(transId=tid, unitId=unit) / req, dt)
        if rsp is not None:
            c.s2c(ModbusADUResponse(transId=tid, unitId=unit) / rsp, rdt)

    regs = [struct.unpack(">HH", struct.pack(">f", v)) for v in (11.02, 11.05, 10.98, 412.0, 405.5)]
    for k in range(6):
        vals = [w for p in regs for w in p]
        vals[0] = (vals[0] + k) & 0xFFFF
        tx(1, ModbusPDU03ReadHoldingRegistersRequest(startAddr=0, quantity=10), ModbusPDU03ReadHoldingRegistersResponse(registerVal=vals), 0.9 if k else 0.1, 0.012 if k != 3 else 0.83)
        tx(1, ModbusPDU04ReadInputRegistersRequest(startAddr=100, quantity=4), ModbusPDU04ReadInputRegistersResponse(registerVal=[500, 499 + k, 4980, 1]), 0.02, 0.011)
        tx(1, ModbusPDU01ReadCoilsRequest(startAddr=0, quantity=8), ModbusPDU01ReadCoilsResponse(coilStatus=[0b00000101]), 0.02, 0.01)
        # block beyond the register map -> exception 2
        tx(1, ModbusPDU03ReadHoldingRegistersRequest(startAddr=200, quantity=10), ModbusPDU03ReadHoldingRegistersError(exceptCode=2), 0.02, 0.01)
        # unit 2 behind the gateway does not answer -> exception 11; on cycle 5 no answer at all
        if k != 4:
            tx(2, ModbusPDU03ReadHoldingRegistersRequest(startAddr=0, quantity=2), ModbusPDU03ReadHoldingRegistersError(exceptCode=11), 0.02, 0.35)
        else:
            tx(2, ModbusPDU03ReadHoldingRegistersRequest(startAddr=0, quantity=2), None, 0.02, 0)
    tx(1, ModbusPDU06WriteSingleRegisterRequest(registerAddr=40, registerValue=1), ModbusPDU06WriteSingleRegisterResponse(registerAddr=40, registerValue=1), 1.5, 0.015)
    wrpcap(OUT + "S13_ModbusTCP_meter_capture.pcap", c.pk)


def crc(d):
    c = 0
    for b in d:
        c ^= b
        for _ in range(8):
            c = (c >> 1) ^ 0xA6BC if c & 1 else c >> 1
    return struct.pack("<H", ~c & 0xFFFF)


assert crc(bytes.fromhex("056405C001000004")).hex() == "e921"


def dnp_frame(dst, src, user, master, prm=True, lfc=4, corrupt=False):
    ctrl = (0x80 if master else 0) | (0x40 if prm else 0) | lfc
    h = bytes([0x05, 0x64, 5 + len(user), ctrl]) + struct.pack("<HH", dst, src)
    out = h + crc(h)
    for i in range(0, len(user), 16):
        blk = user[i:i + 16]
        cc = crc(blk)
        if corrupt and i == 0:
            cc = bytes([cc[0] ^ 0xFF, cc[1]])
        out += blk + cc
    return out


def dnp_app(ac, fc, body=b"", iin=None):
    return bytes([ac, fc]) + (bytes(iin) if iin else b"") + body


def dnp3():
    c = Conn("02:aa:00:00:0c:01", "02:aa:00:00:06:01", "10.13.1.50", "10.13.1.21", 40000, 20000, T0 + 7200)
    M, O = 1, 10
    tseq = {"m": 0, "o": 0}

    def send(side, app, dt, corrupt=False):
        t = tseq[side]
        tseq[side] = (t + 1) & 0x3F
        user = bytes([0xC0 | t]) + app
        f = dnp_frame(O if side == "m" else M, M if side == "m" else O, user, master=side == "m", corrupt=corrupt)
        (c.c2s if side == "m" else c.s2c)(f, dt)

    # integrity poll: class 1, 2, 3, 0
    send("m", dnp_app(0xC0, 1, bytes([60, 2, 6, 60, 3, 6, 60, 4, 6, 60, 1, 6])), 0.02)
    body = bytes([1, 2, 0x00, 0, 3]) + bytes([0x81, 0x01, 0x81, 0x01]) + bytes([30, 1, 0x00, 0, 1]) + bytes([0x01]) + struct.pack("<i", 1324) + bytes([0x01]) + struct.pack("<i", -12)
    send("o", dnp_app(0xC0, 129, body, iin=[0x90, 0x00]), 0.045)  # IIN1: device restart + need time
    # master never clears the restart bit (no write g80v1) and never sets the time
    # direct operate CROB on index 2
    crob = bytes([12, 1, 0x28, 1, 0, 2, 0]) + bytes([0x41, 1]) + struct.pack("<II", 500, 0) + bytes([0])
    send("m", dnp_app(0xC1, 5, crob), 2.0)
    send("o", dnp_app(0xC1, 129, crob, iin=[0x90, 0x00]), 0.06)
    # SELECT without OPERATE
    send("m", dnp_app(0xC2, 3, crob), 1.5)
    send("o", dnp_app(0xC2, 129, crob, iin=[0x90, 0x00]), 0.05)
    # unsolicited event response asking for confirmation; the master does not confirm
    ev = bytes([2, 1, 0x28, 1, 0, 1, 0, 0x81])
    send("o", dnp_app(0xF0 | 0x00, 130, ev, iin=[0x92, 0x08]), 3.0)  # class 1 + event buffer overflow
    # frame with a corrupted CRC
    send("o", dnp_app(0xC3, 129, body, iin=[0x90, 0x00]), 1.0, corrupt=True)
    # read with no response
    send("m", dnp_app(0xC4, 1, bytes([60, 2, 6])), 1.0)
    wrpcap(OUT + "S13_DNP3_RTU_capture.pcap", c.pk)


if __name__ == "__main__":
    iec104()
    modbus()
    dnp3()
    print("written")
