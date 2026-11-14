// IEC 60870-5-104 capture analysis: APCI framing (I, S, U formats), sequence
// numbers, k / w / t1 / t2 / t3 behaviour, ASDU decoding (type, cause, common
// address, information objects with values, quality and CP56Time2a), general
// interrogation and command sequences, and a point list of what was seen.

import { type TcpConn, markAt } from "./pcapnet";

export interface Iec104Params { k: number; w: number; t1: number; t2: number; t3: number; port: number }
export const IEC104_DEFAULTS: Iec104Params = { k: 12, w: 8, t1: 15, t2: 10, t3: 20, port: 2404 };

export const TYPES: Record<number, { id: string; name: string; dir: "mon" | "ctl" | "sys"; size?: number; time?: boolean }> = {
  1: { id: "M_SP_NA_1", name: "Single point", dir: "mon", size: 1 },
  3: { id: "M_DP_NA_1", name: "Double point", dir: "mon", size: 1 },
  5: { id: "M_ST_NA_1", name: "Step position", dir: "mon", size: 2 },
  7: { id: "M_BO_NA_1", name: "Bitstring 32", dir: "mon", size: 5 },
  9: { id: "M_ME_NA_1", name: "Measured, normalised", dir: "mon", size: 3 },
  11: { id: "M_ME_NB_1", name: "Measured, scaled", dir: "mon", size: 3 },
  13: { id: "M_ME_NC_1", name: "Measured, short float", dir: "mon", size: 5 },
  15: { id: "M_IT_NA_1", name: "Integrated total", dir: "mon", size: 5 },
  21: { id: "M_ME_ND_1", name: "Measured, normalised, no quality", dir: "mon", size: 2 },
  30: { id: "M_SP_TB_1", name: "Single point with time", dir: "mon", size: 8, time: true },
  31: { id: "M_DP_TB_1", name: "Double point with time", dir: "mon", size: 8, time: true },
  32: { id: "M_ST_TB_1", name: "Step position with time", dir: "mon", size: 9, time: true },
  33: { id: "M_BO_TB_1", name: "Bitstring 32 with time", dir: "mon", size: 12, time: true },
  34: { id: "M_ME_TD_1", name: "Measured, normalised, with time", dir: "mon", size: 10, time: true },
  35: { id: "M_ME_TE_1", name: "Measured, scaled, with time", dir: "mon", size: 10, time: true },
  36: { id: "M_ME_TF_1", name: "Measured, short float, with time", dir: "mon", size: 12, time: true },
  37: { id: "M_IT_TB_1", name: "Integrated total with time", dir: "mon", size: 12, time: true },
  38: { id: "M_EP_TD_1", name: "Protection event with time", dir: "mon", size: 10, time: true },
  45: { id: "C_SC_NA_1", name: "Single command", dir: "ctl", size: 1 },
  46: { id: "C_DC_NA_1", name: "Double command", dir: "ctl", size: 1 },
  47: { id: "C_RC_NA_1", name: "Regulating step command", dir: "ctl", size: 1 },
  48: { id: "C_SE_NA_1", name: "Set point, normalised", dir: "ctl", size: 3 },
  49: { id: "C_SE_NB_1", name: "Set point, scaled", dir: "ctl", size: 3 },
  50: { id: "C_SE_NC_1", name: "Set point, short float", dir: "ctl", size: 5 },
  58: { id: "C_SC_TA_1", name: "Single command with time", dir: "ctl", size: 8, time: true },
  59: { id: "C_DC_TA_1", name: "Double command with time", dir: "ctl", size: 8, time: true },
  60: { id: "C_RC_TA_1", name: "Regulating step command with time", dir: "ctl", size: 8, time: true },
  61: { id: "C_SE_TA_1", name: "Set point, normalised, with time", dir: "ctl", size: 10, time: true },
  62: { id: "C_SE_TB_1", name: "Set point, scaled, with time", dir: "ctl", size: 10, time: true },
  63: { id: "C_SE_TC_1", name: "Set point, short float, with time", dir: "ctl", size: 12, time: true },
  70: { id: "M_EI_NA_1", name: "End of initialisation", dir: "sys", size: 1 },
  100: { id: "C_IC_NA_1", name: "General interrogation", dir: "sys", size: 1 },
  101: { id: "C_CI_NA_1", name: "Counter interrogation", dir: "sys", size: 1 },
  102: { id: "C_RD_NA_1", name: "Read", dir: "sys", size: 0 },
  103: { id: "C_CS_NA_1", name: "Clock synchronisation", dir: "sys", size: 7, time: true },
  105: { id: "C_RP_NA_1", name: "Reset process", dir: "sys", size: 1 },
  107: { id: "C_TS_TA_1", name: "Test command with time", dir: "sys", size: 9, time: true },
};

export const COT: Record<number, string> = {
  1: "periodic", 2: "background", 3: "spontaneous", 4: "initialised", 5: "request", 6: "activation", 7: "activation confirmation",
  8: "deactivation", 9: "deactivation confirmation", 10: "activation termination", 11: "return info, remote command", 12: "return info, local command",
  13: "file transfer", 20: "interrogated by station interrogation", 37: "requested by general counter request",
  44: "unknown type identification", 45: "unknown cause of transmission", 46: "unknown common address of ASDU", 47: "unknown information object address",
};
export const cotName = (c: number) => COT[c] ?? (c >= 21 && c <= 36 ? `interrogated by group ${c - 20}` : c >= 38 && c <= 41 ? `requested by group ${c - 37} counter request` : `cause ${c}`);

export interface Cp56 { iso: string; invalid: boolean; summer: boolean; epoch: number }
export function cp56(d: Uint8Array, o: number): Cp56 {
  const ms = d[o] | (d[o + 1] << 8), min = d[o + 2] & 0x3f, iv = !!(d[o + 2] & 0x80), hr = d[o + 3] & 0x1f, su = !!(d[o + 3] & 0x80), day = d[o + 4] & 0x1f, mon = d[o + 5] & 0x0f, yr = 2000 + (d[o + 6] & 0x7f);
  const epoch = Date.UTC(yr, mon - 1, day, hr, min, 0, 0) / 1000 + ms / 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return { iso: `${yr}-${p(mon)}-${p(day)} ${p(hr)}:${p(min)}:${p(Math.floor(ms / 1000))}.${p(ms % 1000, 3)}`, invalid: iv, summer: su, epoch };
}

export interface IoObj { ioa: number; value: string; num: number | null; q: string[]; time?: Cp56; raw: string }
export interface Asdu { type: number; sq: boolean; n: number; cot: number; neg: boolean; test: boolean; orig: number; ca: number; objs: IoObj[]; err?: string }
export interface Apdu {
  dir: "c2s" | "s2c"; t: number; no: number; kind: "I" | "S" | "U"; ns?: number; nr?: number; u?: string; asdu?: Asdu; len: number;
}

const QDS = (b: number) => [b & 1 ? "OV" : "", b & 0x10 ? "BL" : "", b & 0x20 ? "SB" : "", b & 0x40 ? "NT" : "", b & 0x80 ? "IV" : ""].filter(Boolean);
const f32 = (d: Uint8Array, o: number) => new DataView(d.buffer, d.byteOffset + o, 4).getFloat32(0, true);
const i16 = (d: Uint8Array, o: number) => new DataView(d.buffer, d.byteOffset + o, 2).getInt16(0, true);
const i32 = (d: Uint8Array, o: number) => new DataView(d.buffer, d.byteOffset + o, 4).getInt32(0, true);
const DPI = ["intermediate (00)", "OFF (01)", "ON (10)", "indeterminate (11)"];

function element(type: number, d: Uint8Array, o: number): { value: string; num: number | null; q: string[] } {
  const b = d[o];
  switch (type) {
    case 1: case 30: return { value: b & 1 ? "ON" : "OFF", num: b & 1, q: QDS(b & 0xf0) };
    case 3: case 31: return { value: DPI[b & 3], num: b & 3, q: QDS(b & 0xf0) };
    case 5: case 32: { const v = ((b & 0x7f) << 25) >> 25; return { value: `${v}${b & 0x80 ? " (transient)" : ""}`, num: v, q: QDS(d[o + 1]) }; }
    case 7: case 33: return { value: "0x" + Array.from(d.subarray(o, o + 4)).reverse().map((x) => x.toString(16).padStart(2, "0")).join(""), num: null, q: QDS(d[o + 4]) };
    case 9: case 34: case 21: { const v = i16(d, o) / 32768; return { value: v.toFixed(5), num: v, q: type === 21 ? [] : QDS(d[o + 2]) }; }
    case 11: case 35: { const v = i16(d, o); return { value: String(v), num: v, q: QDS(d[o + 2]) }; }
    case 13: case 36: { const v = f32(d, o); return { value: +v.toPrecision(7) + "", num: v, q: QDS(d[o + 4]) }; }
    case 15: case 37: { const v = i32(d, o), s = d[o + 4]; return { value: `${v} (seq ${s & 0x1f})`, num: v, q: [s & 0x20 ? "CY" : "", s & 0x40 ? "CA" : "", s & 0x80 ? "IV" : ""].filter(Boolean) }; }
    case 38: return { value: `event ${["indeterminate", "OFF", "ON", "indeterminate"][b & 3]}, elapsed ${d[o + 1] | (d[o + 2] << 8)} ms`, num: b & 3, q: QDS(b & 0xf8) };
    case 45: case 58: return { value: `${b & 1 ? "ON" : "OFF"}${b & 0x80 ? " select" : " execute"}`, num: b & 1, q: [] };
    case 46: case 59: return { value: `${["not permitted (00)", "OFF", "ON", "not permitted (11)"][b & 3]}${b & 0x80 ? " select" : " execute"}`, num: b & 3, q: [] };
    case 47: case 60: return { value: `${["not permitted", "lower", "higher", "not permitted"][b & 3]}${b & 0x80 ? " select" : " execute"}`, num: b & 3, q: [] };
    case 48: case 61: return { value: `${(i16(d, o) / 32768).toFixed(5)}${d[o + 2] & 0x80 ? " select" : ""}`, num: i16(d, o) / 32768, q: [] };
    case 49: case 62: return { value: `${i16(d, o)}${d[o + 2] & 0x80 ? " select" : ""}`, num: i16(d, o), q: [] };
    case 50: case 63: return { value: `${+f32(d, o).toPrecision(7)}${d[o + 4] & 0x80 ? " select" : ""}`, num: f32(d, o), q: [] };
    case 70: return { value: `cause of initialisation ${b & 0x7f}${b & 0x80 ? " (after change of parameters)" : ""}`, num: b, q: [] };
    case 100: return { value: b === 20 ? "station interrogation (QOI 20)" : `group ${b - 20} (QOI ${b})`, num: b, q: [] };
    case 101: return { value: `QCC ${b}`, num: b, q: [] };
    case 107: return { value: `test sequence ${d[o] | (d[o + 1] << 8)}`, num: null, q: [] };
    default: return { value: "", num: null, q: [] };
  }
}

export function decodeAsdu(d: Uint8Array): Asdu {
  if (d.length < 6) return { type: 0, sq: false, n: 0, cot: 0, neg: false, test: false, orig: 0, ca: 0, objs: [], err: "ASDU shorter than its header" };
  const type = d[0], sq = !!(d[1] & 0x80), n = d[1] & 0x7f, cot = d[2] & 0x3f, neg = !!(d[2] & 0x40), test = !!(d[2] & 0x80), orig = d[3], ca = d[4] | (d[5] << 8);
  const a: Asdu = { type, sq, n, cot, neg, test, orig, ca, objs: [] };
  const T = TYPES[type];
  if (!T || T.size === undefined) { a.err = `type ${type} not decoded`; return a; }
  const tsz = T.time && type !== 103 && type !== 107 ? 7 : 0, esz = T.size - tsz;
  let o = 6, ioa = 0;
  for (let i = 0; i < n; i++) {
    if (!sq || i === 0) { if (o + 3 > d.length) { a.err = "truncated"; break; } ioa = d[o] | (d[o + 1] << 8) | (d[o + 2] << 16); o += 3; } else ioa++;
    const need = type === 103 ? 7 : type === 107 ? 9 : T.size;
    if (o + need > d.length) { a.err = `information object ${i + 1} truncated (expected ${need} octets)`; break; }
    const e = element(type, d, o);
    const obj: IoObj = { ioa, ...e, raw: Array.from(d.subarray(o, o + need), (b) => b.toString(16).padStart(2, "0")).join(" ") };
    if (type === 103) { obj.time = cp56(d, o); obj.value = "clock " + obj.time.iso; }
    else if (type === 107) obj.time = cp56(d, o + 2);
    else if (tsz) obj.time = cp56(d, o + esz);
    a.objs.push(obj); o += need;
  }
  if (!a.err && o !== d.length) a.err = `${d.length - o} octet(s) left over: the information object size or the number of objects does not match the type`;
  return a;
}

/** Split one direction of a TCP stream into APDUs. */
export function frame104(bytes: Uint8Array): { off: number; d: Uint8Array }[] | { err: string; frames: { off: number; d: Uint8Array }[]; resync: number } {
  const out: { off: number; d: Uint8Array }[] = [];
  let o = 0, resync = 0;
  while (o + 2 <= bytes.length) {
    if (bytes[o] !== 0x68 || bytes[o + 1] < 4) { resync++; o++; while (o < bytes.length && bytes[o] !== 0x68) o++; continue; }
    const len = bytes[o + 1];
    if (o + 2 + len > bytes.length) break;
    out.push({ off: o, d: bytes.subarray(o, o + 2 + len) });
    o += 2 + len;
  }
  return resync ? { err: "resync", frames: out, resync } : out;
}

const U: Record<number, string> = { 0x07: "STARTDT act", 0x0b: "STARTDT con", 0x13: "STOPDT act", 0x23: "STOPDT con", 0x43: "TESTFR act", 0x83: "TESTFR con" };

export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string; no?: number }
export interface Point { ca: number; ioa: number; type: number; count: number; last: string; lastQ: string[]; cots: Set<number>; qBad: number; first: number; lastT: number }
export interface Conn104 {
  client: string; server: string; start: number; end: number; apdus: Apdu[]; findings: Finding[]; points: Point[];
  stats: { i: number; s: number; u: number; gi: number; cmds: number; maxUnackC: number; maxUnackS: number; timeOffset: number | null };
}

export function analyse104(conns: TcpConn[], P: Iec104Params = IEC104_DEFAULTS): Conn104[] {
  return conns.filter((c) => c.port === P.port).map((c) => {
    const F: Finding[] = [];
    const add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
    const ap: Apdu[] = [];
    for (const [dirName, dir] of [["c2s", c.c2s], ["s2c", c.s2c]] as const) {
      if (dir.gaps) add("warning", `${dirName === "c2s" ? "Controlling → controlled" : "Controlled → controlling"} direction: ${dir.gaps} gap(s) in the captured TCP stream (packets missing from the capture). Frames around them may be misread.`);
      const fr = frame104(dir.bytes), list = Array.isArray(fr) ? fr : fr.frames;
      if (!Array.isArray(fr)) add("error", `${fr.resync} framing error(s): bytes that do not start with 0x68 and a valid length. Either the capture lost data or the device sends malformed APDUs.`);
      for (const f of list) {
        const m = markAt(dir, f.off), d = f.d, c1 = d[2];
        const a: Apdu = { dir: dirName, t: m.t, no: m.no, kind: c1 & 1 ? (c1 & 3) === 3 ? "U" : "S" : "I", len: d[1] };
        if (a.kind === "I") { a.ns = (d[2] | (d[3] << 8)) >> 1; a.nr = (d[4] | (d[5] << 8)) >> 1; a.asdu = decodeAsdu(d.subarray(6)); }
        else if (a.kind === "S") a.nr = (d[4] | (d[5] << 8)) >> 1;
        else a.u = U[c1] ?? `U-format 0x${c1.toString(16)}`;
        if (a.kind !== "I" && d[1] !== 4) add("error", `${a.kind}-format APDU with length ${d[1]} (must be 4).`, a.no);
        ap.push(a);
      }
    }
    ap.sort((x, y) => x.t - y.t || x.no - y.no);
    const name = (dir: string) => (dir === "c2s" ? "controlling station" : "controlled station");
    // STARTDT
    const firstI = ap.find((a) => a.kind === "I" && a.dir === "s2c"), stcon = ap.find((a) => a.u === "STARTDT con");
    if (!ap.some((a) => a.u === "STARTDT act") && c.syn) add("warning", "No STARTDT act seen after the connection was opened: the controlled station must not send data until data transfer is started.");
    if (firstI && stcon && firstI.t < stcon.t) add("error", "The controlled station sent I-frames before STARTDT con.", firstI.no);
    // sequence numbers, k and w, t2
    const st = { c2s: { ns: -1, unack: [] as Apdu[], maxU: 0, recvSince: 0, firstUnack: 0 }, s2c: { ns: -1, unack: [] as Apdu[], maxU: 0, recvSince: 0, firstUnack: 0 } };
    let t1Warned = false;
    for (const a of ap) {
      const me = st[a.dir], other = st[a.dir === "c2s" ? "s2c" : "c2s"];
      if (a.nr !== undefined) {
        // acknowledges frames sent by the other side
        const before = other.unack.length;
        other.unack = other.unack.filter((x) => ((a.nr! - (x.ns! + 1) + 32768) % 32768) > 16384);
        if (before && other.unack.length < before) me.recvSince = 0;
      }
      if (a.kind === "I") {
        if (me.ns >= 0 && a.ns !== (me.ns + 1) % 32768) add("error", `Send sequence number from the ${name(a.dir)} jumps from ${me.ns} to ${a.ns}: I-frames lost or repeated. A receiver must close the connection on a sequence error.`, a.no);
        me.ns = a.ns!;
        me.unack.push(a);
        if (me.unack.length > me.maxU) me.maxU = me.unack.length;
        if (me.unack.length > P.k) add("error", `The ${name(a.dir)} has ${me.unack.length} unacknowledged I-frames, more than k = ${P.k}. It must stop sending at k.`, a.no);
        other.recvSince++;
        if (other.recvSince === P.w + 1) add("warning", `The ${name(a.dir === "c2s" ? "s2c" : "c2s")} has received ${P.w + 1} I-frames without acknowledging them (w = ${P.w}). It should acknowledge at the latest after w frames.`, a.no);
        if (other.recvSince === 1) other.firstUnack = a.t;
      }
      // t2: receiver must acknowledge within t2
      for (const side of ["c2s", "s2c"] as const) {
        const s = st[side];
        if (s.unack.length && a.t - s.unack[0].t > P.t1 && !t1Warned) { t1Warned = true; add("error", `An I-frame from the ${name(side)} stayed unacknowledged for more than t1 = ${P.t1} s; the sender should have closed the connection.`, s.unack[0].no); }
      }
    }
    // ack delay > t2
    const acks = ap.filter((a) => a.kind === "S");
    for (const s of acks) {
      const prev = ap.filter((a) => a.kind === "I" && a.dir !== s.dir && a.t <= s.t && ((s.nr! - (a.ns! + 1) + 32768) % 32768) < 16384);
      const oldest = prev.length ? prev.reduce((m, a) => (a.t < m.t ? a : m)) : null;
      if (oldest && s.t - oldest.t > P.t2 + 0.5 && prev.length < P.w) { add("info", `S-frame from the ${name(s.dir)} acknowledges an I-frame ${(s.t - oldest.t).toFixed(1)} s old, later than t2 = ${P.t2} s.`, s.no); break; }
    }
    // TESTFR / t1 / t3
    for (const a of ap.filter((x) => x.u === "TESTFR act" || x.u === "STARTDT act" || x.u === "STOPDT act")) {
      const want = a.u!.replace("act", "con"), con = ap.find((x) => x.u === want && x.dir !== a.dir && x.t >= a.t);
      if (!con || con.t - a.t > P.t1) add("error", `${a.u} from the ${name(a.dir)} not confirmed within t1 = ${P.t1} s.${con ? ` (${(con.t - a.t).toFixed(1)} s)` : ""} The connection should be closed and re-established.`, a.no);
    }
    for (let i = 1; i < ap.length; i++) {
      const gap = ap[i].t - ap[i - 1].t;
      if (gap > P.t3 + 1 && !ap.slice(i, i + 3).some((x) => x.u === "TESTFR act")) { add("info", `No frames for ${gap.toFixed(0)} s (t3 = ${P.t3} s) and no TESTFR act afterwards: idle supervision may not be active.`, ap[i].no); break; }
    }
    // ASDU checks
    const points = new Map<string, Point>(), mixed = new Set<string>();
    const I = ap.filter((a) => a.kind === "I" && a.asdu);
    let gi = 0, cmds = 0;
    const offsets: number[] = [];
    for (const a of I) {
      const s = a.asdu!, T = TYPES[s.type];
      if (s.err) add("error", `I-frame type ${s.type}${T ? ` ${T.id}` : ""}: ${s.err}.`, a.no);
      if (s.cot >= 44 && s.cot <= 47) add("error", `${a.dir === "s2c" ? "Controlled" : "Controlling"} station answered "${cotName(s.cot)}" (COT ${s.cot}) for type ${T?.id ?? s.type}, CA ${s.ca}${s.objs[0] ? `, IOA ${s.objs[0].ioa}` : ""}: the two configurations do not match.`, a.no);
      if (s.neg && s.cot === 7) add("warning", `Negative activation confirmation for ${T?.id ?? s.type} IOA ${s.objs[0]?.ioa ?? "?"}: the command or request was refused.`, a.no);
      if (s.test) add("info", `ASDU with the test bit set (${T?.id ?? s.type}).`, a.no);
      if (T?.dir === "mon" && a.dir === "s2c") {
        for (const o of s.objs) {
          const k = `${s.ca}|${o.ioa}`;
          let p = points.get(k);
          if (!p) points.set(k, (p = { ca: s.ca, ioa: o.ioa, type: s.type, count: 0, last: "", lastQ: [], cots: new Set(), qBad: 0, first: a.t, lastT: a.t }));
          const base = (n?: string) => (n ?? "").replace(/,? with time$/, "");
          if (p.type !== s.type && base(TYPES[p.type]?.name) !== base(T.name) && !mixed.has(k)) mixed.add(k), add("warning", `CA ${s.ca} IOA ${o.ioa} is sent as ${TYPES[p.type]?.id} and as ${T.id}: one address, two different kinds of information.`, a.no);
          p.count++; p.last = o.value; p.lastQ = o.q; p.cots.add(s.cot); p.lastT = a.t;
          if (o.q.some((q) => q === "IV" || q === "NT")) p.qBad++;
          if (o.time) { if (o.time.invalid) p.qBad += 0; else offsets.push(o.time.epoch - a.t); }
        }
      }
      if (s.type === 100 && s.cot === 6) {
        gi++;
        const con = I.find((x) => x.asdu!.type === 100 && x.asdu!.cot === 7 && x.t >= a.t), term = I.find((x) => x.asdu!.type === 100 && x.asdu!.cot === 10 && x.t >= a.t);
        if (!con) add("error", "General interrogation without activation confirmation.", a.no);
        else if (!term) add("warning", "General interrogation confirmed but never terminated (no ACTTERM in the capture).", a.no);
        else add("ok", `General interrogation: confirmed after ${((con.t - a.t) * 1000).toFixed(0)} ms, ${I.filter((x) => x.asdu!.cot === 20 && x.t > a.t && x.t < term.t).reduce((n, x) => n + x.asdu!.objs.length, 0)} objects, terminated after ${(term.t - a.t).toFixed(2)} s.`, a.no);
      }
      if (T?.dir === "ctl" && s.cot === 6 && a.dir === "c2s") {
        cmds++;
        const o = s.objs[0], con = I.find((x) => x.t >= a.t && x.dir === "s2c" && x.asdu!.type === s.type && (x.asdu!.cot === 7 || x.asdu!.cot >= 44) && x.asdu!.objs[0]?.ioa === o?.ioa);
        if (!con) add("error", `${T.id} to IOA ${o?.ioa}: no activation confirmation.`, a.no);
        else if (!con.asdu!.neg && con.asdu!.cot === 7 && !/select/.test(o?.value ?? "") && !I.some((x) => x.t >= con.t && x.asdu!.type === s.type && x.asdu!.cot === 10 && x.asdu!.objs[0]?.ioa === o?.ioa)) add("info", `${T.id} to IOA ${o?.ioa} confirmed; no activation termination seen (optional for some commands, required by many project specifications).`, a.no);
      }
    }
    const bad = [...points.values()].filter((p) => p.qBad);
    if (bad.length) add("warning", `${bad.length} point(s) reported with invalid (IV) or not topical (NT) quality: ${bad.slice(0, 8).map((p) => `IOA ${p.ioa}`).join(", ")}${bad.length > 8 ? " …" : ""}. Check the source device or the gateway's link to it.`);
    let timeOffset: number | null = null;
    if (offsets.length) {
      offsets.sort((x, y) => x - y);
      timeOffset = offsets[Math.floor(offsets.length / 2)];
      if (Math.abs(timeOffset) > 1) add("warning", `Time tags differ from the capture clock by ${timeOffset.toFixed(2)} s (median of ${offsets.length}). Expected near zero if the station is synchronised and both use UTC; a whole number of hours means local time is used.`);
    }
    if (c.rst) add("info", "The connection was reset (TCP RST).");
    const maxC = st.c2s.maxU, maxS = st.s2c.maxU;
    return { client: c.client, server: c.server, start: c.start, end: c.end, apdus: ap, findings: F, points: [...points.values()].sort((a, b) => a.ca - b.ca || a.ioa - b.ioa), stats: { i: I.length, s: acks.length, u: ap.filter((a) => a.kind === "U").length, gi, cmds, maxUnackC: maxC, maxUnackS: maxS, timeOffset } };
  });
}

export function points104Csv(c: Conn104): string {
  return ["CA,IOA,Type,Type name,Count,Causes,Last value,Last quality", ...c.points.map((p) => [p.ca, p.ioa, TYPES[p.type]?.id ?? p.type, TYPES[p.type]?.name ?? "", p.count, [...p.cots].map(cotName).join(" / "), `"${p.last}"`, p.lastQ.join(" ")].join(","))].join("\r\n");
}
