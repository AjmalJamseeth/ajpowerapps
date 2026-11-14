// DNP3 (IEEE 1815) capture decoding over TCP or UDP: data link frames with CRC
// check, transport segments, application requests and responses with function
// code, internal indications (IIN) and object headers.

import { type TcpConn, type Packet, markAt } from "./pcapnet";

export function crcDnp(d: Uint8Array, o = 0, n = d.length): number {
  let c = 0;
  for (let i = o; i < o + n; i++) { c ^= d[i]; for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xa6bc : c >>> 1; }
  return ~c & 0xffff;
}

export const AFC: Record<number, string> = {
  0: "CONFIRM", 1: "READ", 2: "WRITE", 3: "SELECT", 4: "OPERATE", 5: "DIRECT OPERATE", 6: "DIRECT OPERATE NO ACK", 7: "IMMEDIATE FREEZE", 8: "IMMEDIATE FREEZE NO ACK",
  9: "FREEZE CLEAR", 13: "COLD RESTART", 14: "WARM RESTART", 20: "ENABLE UNSOLICITED", 21: "DISABLE UNSOLICITED", 22: "ASSIGN CLASS", 23: "DELAY MEASURE",
  24: "RECORD CURRENT TIME", 129: "RESPONSE", 130: "UNSOLICITED RESPONSE", 131: "AUTHENTICATION RESPONSE",
};
export const IIN1 = ["broadcast", "class 1 events", "class 2 events", "class 3 events", "need time", "local control", "device trouble", "device restart"];
export const IIN2 = ["function code not supported", "object unknown", "parameter error", "event buffer overflow", "already executing", "configuration corrupt", "reserved", "reserved"];
export const GROUPS: Record<number, string> = {
  1: "Binary input", 2: "Binary input event", 3: "Double-bit input", 4: "Double-bit input event", 10: "Binary output status", 12: "Control relay output block (CROB)",
  20: "Counter", 21: "Frozen counter", 22: "Counter event", 30: "Analog input", 32: "Analog input event", 40: "Analog output status", 41: "Analog output (set point)",
  50: "Time and date", 51: "Common time of occurrence", 52: "Time delay", 60: "Class data", 80: "Internal indications", 110: "Octet string", 120: "Authentication",
};
// object size in bytes for the common group/variations (null = no data / not decoded)
const SIZE: Record<string, number> = {
  "1:2": 1, "2:1": 1, "2:2": 7, "2:3": 3, "3:2": 1, "4:1": 1, "4:2": 7, "10:2": 1, "12:1": 11, "20:1": 5, "20:2": 3, "20:5": 4, "20:6": 2, "21:1": 5, "22:1": 5, "22:2": 3,
  "30:1": 5, "30:2": 3, "30:3": 4, "30:4": 2, "30:5": 5, "30:6": 9, "32:1": 5, "32:2": 3, "32:3": 11, "32:4": 9, "32:5": 5, "32:7": 11, "40:1": 5, "40:2": 3, "40:3": 5,
  "41:1": 5, "41:2": 3, "41:3": 5, "50:1": 6, "51:1": 6, "51:2": 6, "52:2": 2,
};

export interface ObjHdr { g: number; v: number; q: number; range: string; count: number; name: string; values: string[]; err?: string }
export interface AppMsg { t: number; no: number; src: number; dst: number; dir: "master" | "outstation"; fir: boolean; fin: boolean; con: boolean; uns: boolean; seq: number; fc: number; iin?: [number, number]; objs: ObjHdr[]; err?: string }
export interface LinkFrame { t: number; no: number; ctrl: number; dst: number; src: number; prm: boolean; lfc: number; crcOk: boolean; user: Uint8Array; badBlocks: number }
export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string; no?: number }
export interface Dnp3Result { links: LinkFrame[]; apps: AppMsg[]; findings: Finding[]; pairs: { master: number; outstation: number; ip: string }[] }

export function parseLinkFrames(bytes: Uint8Array, at: (off: number) => { t: number; no: number }): { frames: LinkFrame[]; junk: number } {
  const out: LinkFrame[] = [];
  let o = 0, junk = 0;
  while (o + 10 <= bytes.length) {
    if (bytes[o] !== 0x05 || bytes[o + 1] !== 0x64) { o++; junk++; continue; }
    const len = bytes[o + 2];
    if (len < 5) { o++; junk++; continue; }
    const ud = len - 5, total = 10 + ud + 2 * Math.ceil(ud / 16);
    if (o + total > bytes.length) break;
    const hdrOk = crcDnp(bytes, o, 8) === (bytes[o + 8] | (bytes[o + 9] << 8));
    const user = new Uint8Array(ud);
    let p = o + 10, w = 0, bad = 0;
    while (w < ud) {
      const n = Math.min(16, ud - w);
      if (crcDnp(bytes, p, n) !== (bytes[p + n] | (bytes[p + n + 1] << 8))) bad++;
      user.set(bytes.subarray(p, p + n), w); w += n; p += n + 2;
    }
    const ctrl = bytes[o + 3], m = at(o);
    out.push({ t: m.t, no: m.no, ctrl, dst: bytes[o + 4] | (bytes[o + 5] << 8), src: bytes[o + 6] | (bytes[o + 7] << 8), prm: !!(ctrl & 0x40), lfc: ctrl & 0x0f, crcOk: hdrOk && !bad, user, badBlocks: bad + (hdrOk ? 0 : 1) });
    o += total;
  }
  return { frames: out, junk };
}

function objects(d: Uint8Array, o: number): { objs: ObjHdr[]; err?: string } {
  const objs: ObjHdr[] = [];
  while (o + 3 <= d.length) {
    const g = d[o], v = d[o + 1], q = d[o + 2], pc = (q >> 4) & 7, rc = q & 15;
    o += 3;
    const h: ObjHdr = { g, v, q, range: "", count: 0, name: `g${g}v${v} ${GROUPS[g] ?? ""}`.trim(), values: [] };
    let start = 0;
    if (rc === 0 || rc === 1) { const w = rc === 0 ? 1 : 2; if (o + 2 * w > d.length) { h.err = "truncated range"; objs.push(h); return { objs }; } start = w === 1 ? d[o] : d[o] | (d[o + 1] << 8); const stop = w === 1 ? d[o + 1] : d[o + 2] | (d[o + 3] << 8); o += 2 * w; h.count = stop - start + 1; h.range = `${start}–${stop}`; }
    else if (rc === 6) { h.range = "all"; }
    else if (rc === 7 || rc === 8 || rc === 9) { const w = rc === 7 ? 1 : rc === 8 ? 2 : 4; h.count = d[o] | (w > 1 ? d[o + 1] << 8 : 0); o += w; h.range = `count ${h.count}`; }
    else { h.err = `range qualifier ${rc} not decoded`; objs.push(h); return { objs }; }
    const sz = SIZE[`${g}:${v}`];
    const prefix = pc === 1 ? 1 : pc === 2 ? 2 : pc === 3 ? 4 : 0;
    if (rc === 6 || h.count === 0 || g === 60) { objs.push(h); continue; }
    if (g === 80 && v === 1) { const bytes = Math.ceil(h.count / 8); o += bytes; objs.push(h); continue; }
    if (sz === undefined) { h.err = "object size not known: following objects not decoded"; objs.push(h); return { objs }; }
    for (let i = 0; i < h.count; i++) {
      let idx = start + i;
      if (prefix) { idx = d[o] | (prefix > 1 ? d[o + 1] << 8 : 0); o += prefix; }
      if (o + sz > d.length) { h.err = "truncated objects"; break; }
      const flags = d[o];
      let val = "";
      const dv = new DataView(d.buffer, d.byteOffset + o, sz);
      if (g === 1 || g === 2 || g === 10) val = flags & 0x80 ? "ON" : "OFF";
      else if (g === 3 || g === 4) val = ["intermediate", "OFF", "ON", "indeterminate"][(flags >> 6) & 3];
      else if ((g === 30 || g === 32 || g === 40) && (v === 1 || v === 3)) val = String(dv.getInt32(sz === 4 ? 0 : 1, true));
      else if ((g === 30 || g === 32 || g === 40) && (v === 2 || v === 4)) val = String(dv.getInt16(sz === 2 ? 0 : 1, true));
      else if ((g === 30 && v === 5) || (g === 32 && (v === 5 || v === 7)) || (g === 40 && v === 3) || (g === 41 && v === 3)) val = String(+dv.getFloat32(g === 41 ? 0 : 1, true).toPrecision(7));
      else if ((g === 20 || g === 21 || g === 22) && (v === 1 || v === 5)) val = String(dv.getUint32(v === 5 ? 0 : 1, true));
      else if (g === 12 && v === 1) { const code = d[o]; val = `${["NUL", "PULSE ON", "PULSE OFF", "LATCH ON", "LATCH OFF"][code & 15] ?? "op " + (code & 15)}${code & 0x40 ? " TRIP" : code & 0x80 ? " CLOSE" : ""}, count ${d[o + 1]}, on ${dv.getUint32(2, true)} ms, status ${d[o + 10]}`; }
      else if (g === 50 || g === 51) { const ms = dv.getUint32(0, true) + dv.getUint16(4, true) * 4294967296; val = new Date(ms).toISOString(); }
      const qf = g === 12 || g === 41 || g === 50 || g === 51 || (g === 30 && v >= 3 && v <= 4) || (g === 20 && v >= 5) || g === 52 ? "" : [flags & 1 ? "" : "OFFLINE", flags & 2 ? "RESTART" : "", flags & 4 ? "COMM_LOST" : "", flags & 8 ? "REMOTE_FORCED" : "", flags & 0x10 ? "LOCAL_FORCED" : ""].filter(Boolean).join(" ");
      if (h.values.length < 50) h.values.push(`${idx}: ${val}${qf ? ` [${qf}]` : ""}`);
      o += sz;
    }
    objs.push(h);
  }
  return { objs };
}

export function parseApp(seg: Uint8Array, t: number, no: number, src: number, dst: number, fromMaster: boolean): AppMsg {
  const ac = seg[0], fc = seg[1];
  const m: AppMsg = { t, no, src, dst, dir: fromMaster ? "master" : "outstation", fir: !!(ac & 0x80), fin: !!(ac & 0x40), con: !!(ac & 0x20), uns: !!(ac & 0x10), seq: ac & 15, fc, objs: [] };
  let o = 2;
  if (fc >= 129) { m.iin = [seg[2], seg[3]]; o = 4; }
  if (seg.length < o) { m.err = "application header truncated"; return m; }
  const r = objects(seg, o);
  m.objs = r.objs;
  return m;
}

export function analyseDnp3(conns: TcpConn[], pk: Packet[], port = 20000): Dnp3Result {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
  const links: LinkFrame[] = [], apps: AppMsg[] = [];
  const streams: { bytes: Uint8Array; at: (o: number) => { t: number; no: number }; ip: string }[] = [];
  for (const c of conns.filter((c) => c.port === port)) for (const d of [c.c2s, c.s2c]) streams.push({ bytes: d.bytes, at: (o) => markAt(d, o), ip: d.from });
  for (const p of pk.filter((p) => p.proto === "udp" && (p.sport === port || p.dport === port))) streams.push({ bytes: p.payload, at: () => ({ t: p.t, no: p.no }), ip: `${p.src}:${p.sport}` });
  const pairs = new Map<string, { master: number; outstation: number; ip: string }>();
  let junk = 0;
  for (const s of streams) {
    const r = parseLinkFrames(s.bytes, s.at);
    junk += r.junk;
    const tseg = new Map<string, { parts: Uint8Array[]; t: number; no: number; seq: number }>();
    for (const f of r.frames) {
      links.push(f);
      if (!f.crcOk) { add("error", `Link frame ${f.src} → ${f.dst}: ${f.badBlocks} CRC error(s). The receiver discards this frame; on serial or radio links it points to noise or wrong line settings, on TCP to a faulty device or gateway.`, f.no); continue; }
      if (!f.user.length) continue; // link-layer only (reset, status)
      const th = f.user[0], fir = !!(th & 0x40), fin = !!(th & 0x80), seq = th & 0x3f, k = `${f.src}>${f.dst}`;
      let cur = tseg.get(k);
      if (fir) { cur = { parts: [], t: f.t, no: f.no, seq }; tseg.set(k, cur); }
      else if (!cur) { add("warning", `Transport segment without a first segment (${f.src} → ${f.dst}).`, f.no); continue; }
      else if (seq !== ((cur.seq + 1) & 0x3f)) add("warning", `Transport sequence jumps from ${cur.seq} to ${seq} (${f.src} → ${f.dst}): a segment was lost.`, f.no);
      cur.seq = seq; cur.parts.push(f.user.subarray(1));
      if (fin) {
        const len = cur.parts.reduce((n, x) => n + x.length, 0), seg = new Uint8Array(len);
        let o = 0; for (const x of cur.parts) { seg.set(x, o); o += x.length; }
        const fromMaster = !!(f.ctrl & 0x80); // DIR bit: set when sent by the master
        const m = parseApp(seg, cur.t, cur.no, f.src, f.dst, fromMaster);
        apps.push(m); tseg.delete(k);
        const mk = fromMaster ? `${f.src}>${f.dst}` : `${f.dst}>${f.src}`;
        if (!pairs.has(mk)) pairs.set(mk, { master: fromMaster ? f.src : f.dst, outstation: fromMaster ? f.dst : f.src, ip: s.ip });
      }
    }
  }
  if (junk) add("warning", `${junk} byte(s) outside DNP3 link frames (no 0x05 0x64 start): data loss in the capture or another protocol on the port.`);
  apps.sort((a, b) => a.t - b.t);
  // IIN and behaviour
  const seen = new Set<string>();
  for (const m of apps) {
    if (m.objs.some((o) => o.err)) add("info", `${AFC[m.fc] ?? "FC " + m.fc}: ${m.objs.find((o) => o.err)!.name} — ${m.objs.find((o) => o.err)!.err}.`, m.no);
    if (!m.iin) continue;
    const [a, b] = m.iin, key = (s: string) => { if (seen.has(s + m.src)) return false; seen.add(s + m.src); return true; };
    if (a & 0x80 && key("rst")) {
      const cleared = apps.some((x) => x.t > m.t && x.dir === "master" && x.dst === m.src && x.fc === 2 && x.objs.some((o) => o.g === 80));
      add(cleared ? "info" : "warning", `Outstation ${m.src} reports DEVICE RESTART${cleared ? "; the master cleared it (write g80v1)" : " and the master never cleared it: events may have been lost and the master should do an integrity poll"}.`, m.no);
    }
    if (a & 0x10 && key("time")) add("warning", `Outstation ${m.src} reports NEED TIME: its clock is not synchronised; event time stamps from it are unreliable until the master (or another source) sets the time.`, m.no);
    if (a & 0x40 && key("trouble")) add("error", `Outstation ${m.src} reports DEVICE TROUBLE (an internal fault).`, m.no);
    if (a & 0x20 && key("local")) add("info", `Outstation ${m.src} is in LOCAL control: remote commands will be refused.`, m.no);
    if (b & 0x08 && key("ovf")) add("error", `Outstation ${m.src} reports EVENT BUFFER OVERFLOW: events were lost. Poll events more often or enlarge the buffer.`, m.no);
    if (b & 0x01) add("warning", `Outstation ${m.src} does not support the requested function code.`, m.no);
    if (b & 0x02) add("warning", `Outstation ${m.src}: object unknown — the master asked for a group/variation or point index the outstation does not have.`, m.no);
    if (b & 0x04) add("warning", `Outstation ${m.src}: parameter error in the request.`, m.no);
    if (b & 0x20 && key("cfg")) add("error", `Outstation ${m.src} reports CONFIGURATION CORRUPT.`, m.no);
  }
  // response times and confirms
  const req = apps.filter((m) => m.dir === "master" && m.fc !== 0);
  const rts: number[] = [];
  for (const r of req) {
    const rsp = apps.find((x) => x.t >= r.t && x.fc === 129 && x.src === r.dst && x.seq === r.seq);
    if (!rsp && r.fc !== 6 && r.fc !== 8) add("error", `${AFC[r.fc] ?? "FC " + r.fc} from master ${r.src} to outstation ${r.dst} (sequence ${r.seq}) got no response.`, r.no);
    else if (rsp) rts.push((rsp.t - r.t) * 1000);
    if ((r.fc === 3) && !apps.some((x) => x.t > r.t && x.fc === 4 && x.dst === r.dst)) add("warning", `SELECT without OPERATE to outstation ${r.dst}.`, r.no);
  }
  for (const u of apps.filter((m) => m.fc === 130 && m.con)) {
    if (!apps.some((x) => x.t >= u.t && x.fc === 0 && x.dst === u.src && x.uns)) add("warning", `Unsolicited response from outstation ${u.src} requested confirmation but the master did not confirm it; the outstation will repeat it.`, u.no);
  }
  if (rts.length) { const mx = Math.max(...rts); if (mx > 2000) add("warning", `Slowest DNP3 response ${mx.toFixed(0)} ms.`); }
  const ops = apps.filter((m) => [3, 4, 5, 6].includes(m.fc) && m.dir === "master");
  if (ops.length) add("info", `${ops.length} control request(s) seen. Check that DNP3 Secure Authentication or another protection is used where controls cross untrusted networks.`);
  if (!F.some((f) => f.sev === "error" || f.sev === "warning") && apps.length) add("ok", `${apps.length} application messages decoded without errors.`);
  return { links, apps, findings: F, pairs: [...pairs.values()] };
}
