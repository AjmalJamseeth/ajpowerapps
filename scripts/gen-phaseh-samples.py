"""Generate the Phase H sample files: SCADA alarm journal, communication status
log, COMTRADE record of the S13 line fault, power quality and load profile
files, breaker operation history and a transformer load profile.

    python scripts/gen-phaseh-samples.py
"""
import math, random, datetime, struct

OUT = "public/samples/"
random.seed(13)
D0 = datetime.datetime(2026, 11, 1, 0, 0, 0)
fmt = lambda d: d.strftime("%Y-%m-%d %H:%M:%S.") + f"{d.microsecond // 1000:03d}"


def alarm_journal():
    tags = [("Q01_SF6_LOW", "Q01 CB SF6 pressure low", 1), ("Q01_TCS", "Q01 trip circuit fault", 1), ("J01_SPRING", "J01 CB spring not charged", 2),
            ("T1_OIL_TEMP", "T1 oil temperature high", 2), ("T1_FAN_SUP", "T1 cooling fan supply fail", 2), ("DC_EARTH", "110 V DC earth fault", 2),
            ("BAT_CHG", "Battery charger fault", 1), ("COMM_P132_Q02", "P132_Q02 communication fail", 1), ("GPS_SYNC", "GPS clock not synchronised", 2),
            ("DOOR_S01", "Panel +S01 door open", 3), ("HVAC_S", "Substation HVAC fault", 3), ("Q02_AR_BLK", "Q02 autoreclose blocked", 2)]
    ev = []
    t = D0
    end = D0 + datetime.timedelta(days=7)
    while t < end:  # background alarms, about 5 per hour, each returning after a while
        t += datetime.timedelta(seconds=random.expovariate(5 / 3600))
        tag, desc, pr = random.choice([x for x in tags if x[0] not in ("BAT_CHG", "T1_FAN_SUP")])
        ev.append((t, tag, desc, "ALM", pr))
        ev.append((t + datetime.timedelta(seconds=random.uniform(30, 1800)), tag, desc, "RTN", pr))
    # chattering fan supply alarm on day 3
    c = D0 + datetime.timedelta(days=2, hours=14)
    for k in range(40):
        ev.append((c + datetime.timedelta(seconds=7 * k), "T1_FAN_SUP", "T1 cooling fan supply fail", "ALM", 2))
        ev.append((c + datetime.timedelta(seconds=7 * k + 3), "T1_FAN_SUP", "T1 cooling fan supply fail", "RTN", 2))
    # standing alarm from day 4 on
    ev.append((D0 + datetime.timedelta(days=3, hours=9), "BAT_CHG", "Battery charger fault", "ALM", 1))
    # flood after the line trip on day 5: 70 alarms in 6 minutes, many high priority; consequential pair CB open -> line dead
    f = D0 + datetime.timedelta(days=4, hours=6, minutes=12, seconds=31)
    for k in range(70):
        tag = f"Q01_X{k % 18:02d}"
        ev.append((f + datetime.timedelta(seconds=k * 5), tag, f"Q01 trip consequence {k % 18}", "ALM", 1 if k % 3 else 2))
        ev.append((f + datetime.timedelta(seconds=k * 5 + 600), tag, f"Q01 trip consequence {k % 18}", "RTN", 1 if k % 3 else 2))
    for k in range(12):
        tt = D0 + datetime.timedelta(days=k * 0.55, hours=3)
        ev.append((tt, "Q01_QA1_OPEN", "Q01 CB QA1 open", "ALM", 3))
        ev.append((tt + datetime.timedelta(seconds=1.2), "Q01_LINE_DEAD", "Q01 line dead", "ALM", 2))
        ev.append((tt + datetime.timedelta(seconds=900), "Q01_QA1_OPEN", "Q01 CB QA1 open", "RTN", 3))
        ev.append((tt + datetime.timedelta(seconds=901), "Q01_LINE_DEAD", "Q01 line dead", "RTN", 2))
    ev.sort()
    with open(OUT + "S13_SCADA_alarm_journal.csv", "w", newline="") as fh:
        fh.write("Time,Tag,Description,State,Priority\r\n")
        for t, tag, desc, st, pr in ev:
            fh.write(f"{fmt(t)},{tag},{desc},{st},{pr}\r\n")


def status_log():
    devs = ["GW1-CC link", "P132_Q01", "P132_Q02", "P87T_T1", "BCU_J01", "HMI1"]
    ev = [(D0, d, "OK") for d in devs]
    def out(dev, start, dur):
        ev.append((start, dev, "FAIL"))
        ev.append((start + datetime.timedelta(seconds=dur), dev, "OK"))
    out("GW1-CC link", D0 + datetime.timedelta(days=9, hours=2), 7200)  # telecom outage
    for k in range(9):  # P132_Q02 flapping
        out("P132_Q02", D0 + datetime.timedelta(days=12, hours=k, minutes=7), random.uniform(2, 8))
    s = D0 + datetime.timedelta(days=18, hours=11, minutes=40)  # SW2 power supply failure
    for i, d in enumerate(["GW1-CC link", "HMI1", "BCU_J01"]):
        out(d, s + datetime.timedelta(seconds=i * 1.5), 720 + i * 3)
    out("P87T_T1", D0 + datetime.timedelta(days=25, hours=4), 95)
    ev.append((D0 + datetime.timedelta(days=29, hours=20), "BCU_J01", "FAIL"))  # still down at the end
    ev.sort()
    with open(OUT + "S13_comm_status_log.csv", "w", newline="") as fh:
        fh.write("Time,Device,State\r\n")
        for t, d, st in ev:
            fh.write(f"{fmt(t)},{d},{st}\r\n")
        fh.write(f"{fmt(D0 + datetime.timedelta(days=30))},HMI1,OK\r\n")


def comtrade():
    """S13 line Q01, A-G fault at 10 km, 06:12:31.200 UTC; recorded by P132_Q01 at 1600 Hz (32 samples per cycle)."""
    f, fs, T, tf = 50.0, 1600.0, 0.4, 0.100
    w = 2 * math.pi * f
    z1 = complex(0.08, 0.40); z0 = complex(0.25, 1.20); k0 = (z0 - z1) / (3 * z1); L = 10.0
    V = 132000 / math.sqrt(3)
    va, vb, vc = V, V * complex(math.cos(-2.0944), math.sin(-2.0944)), V * complex(math.cos(2.0944), math.sin(2.0944))
    il = 300 * complex(math.cos(math.radians(-20)), math.sin(math.radians(-20)))
    ia0, ib0, ic0 = il, il * complex(math.cos(-2.0944), math.sin(-2.0944)), il * complex(math.cos(2.0944), math.sin(2.0944))
    iaf = 5000 * complex(math.cos(math.radians(-85)), math.sin(math.radians(-85)))
    i3 = iaf + ib0 + ic0
    vaf = z1 * L * (iaf + k0 * i3)
    tau, t_trip, t_open, t_reset = 0.020, tf + 0.031, tf + 0.081, tf + 0.130
    inst = lambda ph, t: math.sqrt(2) * (ph * complex(math.cos(w * t), math.sin(w * t))).real
    n = int(T * fs)
    rows = []
    off_a = None
    for k in range(n):
        t = k / fs
        if t < tf:
            ia, ib, ic, ua, ub, uc = inst(ia0, t), inst(ib0, t), inst(ic0, t), inst(va, t), inst(vb, t), inst(vc, t)
        elif t < t_open:
            if off_a is None:
                off_a = inst(ia0, tf) - inst(iaf, tf)
            ia = inst(iaf, t) + off_a * math.exp(-(t - tf) / tau)
            ib, ic = inst(ib0, t), inst(ic0, t)
            ua, ub, uc = inst(vaf, t), inst(vb, t), inst(vc, t)
        else:
            ia = ib = ic = 0.0
            ua, ub, uc = inst(va, t), inst(vb, t), inst(vc, t)
        inn = ia + ib + ic
        d_start = 1 if tf + 0.012 <= t < tf + 0.135 else 0
        d_trip = 1 if t_trip <= t < t_reset else 0
        d_cb = 1 if t < t_open else 0
        rows.append((k + 1, int(round(t * 1e6)), [ia, ib, ic, inn], [ua, ub, uc], [d_start, d_trip, d_cb]))
    chans = [("IA", "A", "A", 1.0, 800, 1), ("IB", "B", "A", 1.0, 800, 1), ("IC", "C", "A", 1.0, 800, 1), ("IN", "N", "A", 1.0, 800, 1),
             ("VA", "A", "V", 4.0, 132000, 110), ("VB", "B", "V", 4.0, 132000, 110), ("VC", "C", "V", 4.0, 132000, 110)]
    cfg = ["S13 Substation,P132_Q01,1999", "10,7A,3D"]
    for i, (cid, ph, u, a, pr, se) in enumerate(chans):
        cfg.append(f"{i + 1},{cid},{ph},Q01 Line 1,{u},{a},0,0,-32767,32767,{pr},{se},P")
    for i, nm in enumerate(["PDIS1 Str general", "PTRC1 Tr general", "XCBR1 QA1 closed (52a)"]):
        cfg.append(f"{i + 1},{nm},,Q01,{1 if i == 2 else 0}")
    cfg += ["50", "1", f"{int(fs)},{n}", "14/11/2026,06:12:31.100000", "14/11/2026,06:12:31.200000", "BINARY", "1"]
    open(OUT + "S13_Q01_fault_P132_Q01.cfg", "w", newline="\r\n").write("\n".join(cfg) + "\n")
    with open(OUT + "S13_Q01_fault_P132_Q01.dat", "wb") as fh:
        for nn, ts, ii, uu, dd in rows:
            fh.write(struct.pack("<II", nn, ts))
            for x in ii:
                fh.write(struct.pack("<h", int(round(x / 1.0))))
            for x in uu:
                fh.write(struct.pack("<h", int(round(x / 4.0))))
            bits = dd[0] | (dd[1] << 1) | (dd[2] << 2)
            fh.write(struct.pack("<H", bits))
    print("expected |Z| =", abs(z1 * L), "angle", math.degrees(math.atan2((z1 * L).imag, (z1 * L).real)), "k0 =", abs(k0), math.degrees(math.atan2(k0.imag, k0.real)))


def pq_and_load():
    # one week of 10-minute PQ values at the 33 kV busbar (Un = 33 kV phase-phase)
    with open(OUT + "S13_33kV_PQ_week.csv", "w", newline="") as fh:
        fh.write("Time,U12,U23,U31,THD %,Pst,Plt,Unbalance %,Frequency\r\n")
        t0 = datetime.datetime(2026, 11, 2)
        for k in range(7 * 144):
            t = t0 + datetime.timedelta(minutes=10 * k)
            h = t.hour + t.minute / 60
            base = 33.0 * (1.04 - 0.035 * math.sin(math.pi * max(0, h - 7) / 14) if 7 <= h <= 21 else 1.045)
            u = [base + random.gauss(0, 0.08) for _ in range(3)]
            if k in (430, 431):  # a dip / undervoltage on day 3
                u = [x * 0.86 for x in u]
            thd = 3.5 + 5.2 * math.exp(-((h - 20) ** 2) / 4) + random.gauss(0, 0.25)  # evening harmonic peak from a rectifier load
            pst = 0.45 + random.gauss(0, 0.05) + (0.9 if 9 <= h <= 16 and t.weekday() < 5 else 0)  # arc furnace on working days
            plt = pst * 0.95
            unb = 0.8 + random.gauss(0, 0.1)
            fr = 50 + random.gauss(0, 0.03)
            fh.write(f"{t.strftime('%Y-%m-%d %H:%M:%S')},{u[0]:.3f},{u[1]:.3f},{u[2]:.3f},{thd:.2f},{pst:.2f},{plt:.2f},{unb:.2f},{fr:.3f}\r\n")
    # 30 days of 15-minute demand of an industrial customer on feeder J01
    with open(OUT + "S13_J01_load_profile.csv", "w", newline="") as fh:
        fh.write("Time,kW\r\n")
        t0 = datetime.datetime(2026, 10, 1)
        for k in range(30 * 96):
            t = t0 + datetime.timedelta(minutes=15 * (k + 1))
            h = (t.hour + t.minute / 60)
            work = t.weekday() < 5
            kw = 1800 + (2600 if work and 7 <= h < 17 else 600 if 7 <= h < 22 else 0) + random.gauss(0, 120)
            if t.day == 14 and 10 <= h < 10.5:
                kw += 2500  # chiller and compressor start together: the monthly peak
            fh.write(f"{t.strftime('%Y-%m-%d %H:%M:%S')},{kw:.1f}\r\n")


def assets():
    # breaker QA1 of bay Q01: operations since commissioning
    rows = [("2021-03-10", "commissioning", 0, 0, 0, 30.1), ("2021-03-10", "commissioning", 0, 0, 0, 30.3)]
    d = datetime.date(2021, 4, 1)
    for k in range(180):
        d += datetime.timedelta(days=random.randint(5, 12))
        rows.append((d.isoformat(), "load switching", 0.35, 0.35, 0.35, round(30 + k * 0.012 + random.gauss(0, 0.3), 1)))
    for dd, ia, ib, ic in [("2022-07-19", 8.2, 0.3, 0.3), ("2023-08-02", 21.5, 20.8, 0.4), ("2024-06-25", 6.1, 0.3, 0.3), ("2025-09-11", 31.0, 30.2, 29.6), ("2026-11-14", 5.0, 0.3, 0.3)]:
        rows.append((dd, "fault", ia, ib, ic, 33.8 if dd == "2026-11-14" else 31.2))
    rows.sort()
    with open(OUT + "S13_Q01_QA1_operations.csv", "w", newline="") as fh:
        fh.write("Date,Type,I A (kA),I B (kA),I C (kA),Opening time (ms)\r\n")
        for r in rows:
            fh.write(",".join(str(x) for x in r) + "\r\n")
    # T1 132/33 kV 60 MVA ONAN/ONAF: a summer day, 15-minute load and ambient
    with open(OUT + "S13_T1_summer_day_load.csv", "w", newline="") as fh:
        fh.write("Time,Load (pu),Ambient (C)\r\n")
        for k in range(97):
            t = datetime.datetime(2026, 7, 21) + datetime.timedelta(minutes=15 * k)
            h = t.hour + t.minute / 60
            amb = 36 + 10 * math.sin(math.pi * (h - 8) / 14) if 8 <= h <= 22 else 36 - 2 * math.sin(math.pi * ((h + 2) % 24) / 10)
            load = 0.62 + 0.48 * math.exp(-((h - 15.5) ** 2) / 10)
            fh.write(f"{t.strftime('%Y-%m-%d %H:%M:%S')},{load:.3f},{amb:.1f}\r\n")


if __name__ == "__main__":
    alarm_journal()
    status_log()
    comtrade()
    pq_and_load()
    assets()
    print("written")
