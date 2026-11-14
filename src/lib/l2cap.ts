// Layer-2 and time-protocol decoders for the capture tools: Ethernet with
// VLAN, PRP redundancy control trailer and supervision frames, HSR tag, RSTP
// BPDUs, GOOSE and sampled values (IEC 61850-8-1 / 9-2), PTP (IEEE 1588 /
// IEC/IEEE 61850-9-3) over Ethernet or UDP, and NTP.

import { type RawFrame } from "./pcapnet";

export const mac = (d: Uint8Array, o: number) => Array.from(d.subarray(o, o + 6), (b) => b.toString(16).padStart(2, "0").toUpperCase()).join("-");

export interface Eth {
  no: number; t: number; dst: string; src: string; vlan: number | null; prio: number | null; etype: number; payload: Uint8Array; len: number;
  hsr?: { path: number; size: number; seq: number }; prp?: { seq: number; lan: "A" | "B" | "?"; size: number; sizeOk: boolean };
  udp?: { src: string; dst: string; sport: number; dport: number; data: Uint8Array };
}

export function eth(frames: RawFrame[]): Eth[] {
  const out: Eth[] = [];
  frames.forEach((f, i) => {
    if (f.link !== 1) return;
    const d = f.data;
    if (d.length < 14) return;
    let o = 12, et = (d[o] << 8) | d[o + 1], vlan: number | null = null, prio: number | null = null;
    o += 2;
    if (et === 0x8100 && d.length >= 18) { prio = d[14] >> 5; vlan = ((d[14] & 15) << 8) | d[15]; et = (d[16] << 8) | d[17]; o = 18; }
    const e: Eth = { no: i + 1, t: f.t, dst: mac(d, 0), src: mac(d, 6), vlan, prio, etype: et, payload: d.subarray(o), len: d.length };
    if (et === 0x892f && d.length >= o + 6) {
      e.hsr = { path: d[o] >> 4, size: ((d[o] & 15) << 8) | d[o + 1], seq: (d[o + 2] << 8) | d[o + 3] };
      e.etype = (d[o + 4] << 8) | d[o + 5]; e.payload = d.subarray(o + 6);
    }
    // PRP redundancy control trailer: SeqNr(2) LanId(4 bit)+LSDUsize(12 bit) PRPsuffix 0x88FB
    if (d.length >= o + 6 && d[d.length - 2] === 0x88 && d[d.length - 1] === 0xfb) {
      const t = d.length - 6, lanId = d[t + 2] >> 4, size = ((d[t + 2] & 15) << 8) | d[t + 3];
      const expect = d.length - (vlan !== null ? 18 : 14);
      e.prp = { seq: (d[t] << 8) | d[t + 1], lan: lanId === 0xa ? "A" : lanId === 0xb ? "B" : "?", size, sizeOk: size === expect };
    }
    if (e.etype === 0x0800 && e.payload.length >= 28) {
      const p = e.payload, ihl = (p[0] & 15) * 4;
      if (p[9] === 17 && p.length >= ihl + 8) e.udp = { src: `${p[12]}.${p[13]}.${p[14]}.${p[15]}`, dst: `${p[16]}.${p[17]}.${p[18]}.${p[19]}`, sport: (p[ihl] << 8) | p[ihl + 1], dport: (p[ihl + 2] << 8) | p[ihl + 3], data: p.subarray(ihl + 8) };
    }
    out.push(e);
  });
  return out;
}

/* ---------------------------------------------------------------- BER (GOOSE / SV) */
interface Tlv { tag: number; s: number; l: number }
function tlvs(d: Uint8Array, o: number, end: number): Tlv[] {
  const out: Tlv[] = [];
  while (o + 2 <= end) {
    const tag = d[o]; let l = d[o + 1], h = 2;
    if (l & 0x80) { const n = l & 0x7f; l = 0; for (let k = 0; k < n; k++) l = l * 256 + d[o + 2 + k]; h = 2 + n; }
    if (o + h + l > end) break;
    out.push({ tag, s: o + h, l }); o += h + l;
  }
  return out;
}
const uint = (d: Uint8Array, s: number, l: number) => { let v = 0; for (let k = 0; k < l; k++) v = v * 256 + d[s + k]; return v; };
const sint = (d: Uint8Array, s: number, l: number) => { let v = uint(d, s, l); if (l && d[s] & 0x80) v -= Math.pow(256, l); return v; };
const str = (d: Uint8Array, s: number, l: number) => String.fromCharCode(...d.subarray(s, s + l));
export const utc = (d: Uint8Array, s: number) => { const sec = uint(d, s, 4), frac = uint(d, s + 4, 3) / 16777216, q = d[s + 7]; return { t: sec + frac, q, notSync: !!(q & 0x20), leap: !!(q & 0x80), fail: !!(q & 0x40), acc: q & 0x1f }; };

export type DataVal = boolean | number | string | { bits: string } | DataVal[];
function data(d: Uint8Array, s: number, l: number): DataVal[] {
  return tlvs(d, s, s + l).map((x) => {
    switch (x.tag) {
      case 0x83: return d[x.s] !== 0;
      case 0x84: { const unused = d[x.s]; let b = ""; for (let k = 1; k < x.l; k++) b += d[x.s + k].toString(2).padStart(8, "0"); return { bits: b.slice(0, b.length - unused) }; }
      case 0x85: return sint(d, x.s, x.l);
      case 0x86: return uint(d, x.s, x.l);
      case 0x87: return x.l === 5 ? new DataView(d.buffer, d.byteOffset + x.s + 1, 4).getFloat32(0, false) : x.l === 9 ? new DataView(d.buffer, d.byteOffset + x.s + 1, 8).getFloat64(0, false) : NaN;
      case 0x89: case 0x8a: return str(d, x.s, x.l);
      case 0x91: return new Date(utc(d, x.s).t * 1000).toISOString();
      case 0xa1: case 0xa2: return data(d, x.s, x.l);
      default: return `tag 0x${x.tag.toString(16)}`;
    }
  });
}
export function fmtVal(v: DataVal): string {
  if (Array.isArray(v)) return "{" + v.map(fmtVal).join(", ") + "}";
  if (typeof v === "object") { const b = v.bits; if (b.length === 2) return ["intermediate", "off", "on", "bad"][parseInt(b, 2)]; if (b.length === 13) return `q=${["good", "invalid", "reserved", "questionable"][parseInt(b.slice(0, 2), 2)]}${b[11] === "1" ? "+test" : ""}${b[12] === "1" ? "+operatorBlocked" : ""}`; return "bits " + b; }
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(+v.toPrecision(6));
  return v;
}

export interface Goose { appid: number; sim: boolean; gocbRef: string; tal: number; datSet: string; goID: string; t: number; tq: number; stNum: number; sqNum: number; test: boolean; confRev: number; ndsCom: boolean; n: number; data: DataVal[]; err?: string }
export function goose(e: Eth): Goose | null {
  if (e.etype !== 0x88b8 || e.payload.length < 8) return null;
  const p = e.payload, appid = (p[0] << 8) | p[1], len = (p[2] << 8) | p[3], sim = !!(p[4] & 0x80);
  const g: Goose = { appid, sim, gocbRef: "", tal: 0, datSet: "", goID: "", t: 0, tq: 0, stNum: 0, sqNum: 0, test: false, confRev: 0, ndsCom: false, n: 0, data: [] };
  const top = tlvs(p, 8, Math.min(p.length, len))[0];
  if (!top || top.tag !== 0x61) { g.err = "no GOOSE PDU (tag 0x61)"; return g; }
  for (const x of tlvs(p, top.s, top.s + top.l)) {
    switch (x.tag) {
      case 0x80: g.gocbRef = str(p, x.s, x.l); break;
      case 0x81: g.tal = uint(p, x.s, x.l); break;
      case 0x82: g.datSet = str(p, x.s, x.l); break;
      case 0x83: g.goID = str(p, x.s, x.l); break;
      case 0x84: { const u = utc(p, x.s); g.t = u.t; g.tq = u.q; break; }
      case 0x85: g.stNum = uint(p, x.s, x.l); break;
      case 0x86: g.sqNum = uint(p, x.s, x.l); break;
      case 0x87: g.test = p[x.s] !== 0; break;
      case 0x88: g.confRev = uint(p, x.s, x.l); break;
      case 0x89: g.ndsCom = p[x.s] !== 0; break;
      case 0x8a: g.n = uint(p, x.s, x.l); break;
      case 0xab: g.data = data(p, x.s, x.l); break;
    }
  }
  if (!g.goID) g.goID = g.gocbRef;
  return g;
}

export interface SvAsdu { svID: string; smpCnt: number; confRev: number; smpSynch: number; vals: number[]; q: number[] }
export interface Sv { appid: number; sim: boolean; asdu: SvAsdu[] }
export function sv(e: Eth): Sv | null {
  if (e.etype !== 0x88ba || e.payload.length < 8) return null;
  const p = e.payload, appid = (p[0] << 8) | p[1], len = (p[2] << 8) | p[3];
  const r: Sv = { appid, sim: !!(p[4] & 0x80), asdu: [] };
  const top = tlvs(p, 8, Math.min(p.length, len))[0];
  if (!top || top.tag !== 0x60) return r;
  for (const x of tlvs(p, top.s, top.s + top.l)) if (x.tag === 0xa2) for (const a of tlvs(p, x.s, x.s + x.l)) {
    const s: SvAsdu = { svID: "", smpCnt: 0, confRev: 0, smpSynch: 0, vals: [], q: [] };
    for (const y of tlvs(p, a.s, a.s + a.l)) {
      if (y.tag === 0x80) s.svID = str(p, y.s, y.l);
      else if (y.tag === 0x82) s.smpCnt = uint(p, y.s, y.l);
      else if (y.tag === 0x83) s.confRev = uint(p, y.s, y.l);
      else if (y.tag === 0x85) s.smpSynch = p[y.s];
      else if (y.tag === 0x87) for (let k = 0; k + 8 <= y.l; k += 8) { s.vals.push(sint(p, y.s + k, 4)); s.q.push(uint(p, y.s + k + 4, 4)); }
    }
    r.asdu.push(s);
  }
  return r;
}

/* ---------------------------------------------------------------- PRP supervision, RSTP */
export interface PrpSup { path: number; ver: number; seq: number; mode: "DANP" | "DANH" | "?"; node: string; redbox: string | null; vdan: string[] }
export function prpSup(e: Eth): PrpSup | null {
  if (e.etype !== 0x88fb || !e.dst.startsWith("01-15-4E-00-01")) return null;
  const p = e.payload, r: PrpSup = { path: p[0] >> 4, ver: ((p[0] & 15) << 8) | p[1], seq: (p[2] << 8) | p[3], mode: "?", node: "", redbox: null, vdan: [] };
  let o = 4;
  while (o + 2 <= p.length) {
    const ty = p[o], l = p[o + 1];
    if (ty === 0) break;
    if (l >= 6) {
      const m = mac(p, o + 2);
      if (ty === 20 || ty === 21 || ty === 23) { r.node = m; r.mode = ty === 20 ? "DANP" : ty === 23 ? "DANH" : "DANP"; }
      else if (ty === 30) r.redbox = m;
      else if (ty === 31) r.vdan.push(m);
    }
    o += 2 + l;
  }
  return r;
}
export interface Bpdu { ver: number; type: number; tc: boolean; tca: boolean; proposal: boolean; agreement: boolean; role: string; learning: boolean; forwarding: boolean; root: string; cost: number; bridge: string; port: number; age: number }
export function bpdu(e: Eth): Bpdu | null {
  if (e.dst !== "01-80-C2-00-00-00" || (e.etype > 0x05ff && e.etype !== 0x8870)) return null;
  const p = e.payload;
  if (p[0] !== 0x42 || p[1] !== 0x42 || p.length < 3 + 4) return null;
  const b = p.subarray(3);
  if (b[0] !== 0 || b[1] !== 0) return null;
  const ver = b[2], type = b[3], fl = b[4] ?? 0;
  const id = (o: number) => `${((b[o] << 8) | b[o + 1]).toString()}/${mac(b, o + 2)}`;
  if (type === 0x80) return { ver, type, tc: true, tca: false, proposal: false, agreement: false, role: "TCN", learning: false, forwarding: false, root: "", cost: 0, bridge: "", port: 0, age: 0 };
  return { ver, type, tc: !!(fl & 1), proposal: !!(fl & 2), role: ["unknown", "alternate/backup", "root", "designated"][(fl >> 2) & 3], learning: !!(fl & 16), forwarding: !!(fl & 32), agreement: !!(fl & 64), tca: !!(fl & 128), root: id(5), cost: ((b[13] << 24) >>> 0) + (b[14] << 16) + (b[15] << 8) + b[16], bridge: id(17), port: (b[25] << 8) | b[26], age: ((b[27] << 8) | b[28]) / 256 };
}

/* ---------------------------------------------------------------- PTP */
export const PTPMSG: Record<number, string> = { 0: "Sync", 1: "Delay_Req", 2: "Pdelay_Req", 3: "Pdelay_Resp", 8: "Follow_Up", 9: "Delay_Resp", 10: "Pdelay_Resp_Follow_Up", 11: "Announce", 12: "Signaling", 13: "Management" };
export interface Ptp {
  type: number; ver: number; domain: number; flags: number; twoStep: boolean; unicast: boolean; corrNs: number; clock: string; port: number; seq: number; logInt: number;
  ts?: number; // origin / precise origin / receive timestamp in seconds (PTP timescale)
  ann?: { utcOffset: number; prio1: number; cls: number; acc: number; variance: number; prio2: number; gm: string; steps: number; src: number; utcValid: boolean; ptpTimescale: boolean; timeTraceable: boolean; freqTraceable: boolean; leap61: boolean; leap59: boolean };
  tlv: number[];
}
export function ptp(e: Eth): Ptp | null {
  let p: Uint8Array | null = null;
  if (e.etype === 0x88f7) p = e.payload;
  else if (e.udp && (e.udp.dport === 319 || e.udp.dport === 320)) p = e.udp.data;
  if (!p || p.length < 34) return null;
  const dv = new DataView(p.buffer, p.byteOffset, p.length), type = p[0] & 15, len = dv.getUint16(2);
  const flags = dv.getUint16(6), corr = Number(dv.getBigInt64(8)) / 65536;
  const r: Ptp = { type, ver: p[1] & 15, domain: p[4], flags, twoStep: !!(flags & 0x0200), unicast: !!(flags & 0x0400), corrNs: corr, clock: Array.from(p.subarray(20, 28), (b) => b.toString(16).padStart(2, "0")).join(":"), port: dv.getUint16(28), seq: dv.getUint16(30), logInt: dv.getInt8(33), tlv: [] };
  if (p.length >= 44) r.ts = dv.getUint16(34) * 4294967296 + dv.getUint32(36) + dv.getUint32(40) / 1e9;
  let body = 44;
  if (type === 11 && p.length >= 64) {
    r.ann = { utcOffset: dv.getInt16(44), prio1: p[47], cls: p[48], acc: p[49], variance: dv.getUint16(50), prio2: p[52], gm: Array.from(p.subarray(53, 61), (b) => b.toString(16).padStart(2, "0")).join(":"), steps: dv.getUint16(61), src: p[63], utcValid: !!(flags & 0x0004), ptpTimescale: !!(flags & 0x0008), timeTraceable: !!(flags & 0x0010), freqTraceable: !!(flags & 0x0020), leap61: !!(flags & 0x0001), leap59: !!(flags & 0x0002) };
    body = 64;
  } else if (type === 9 || type === 3 || type === 10) body = 54;
  let o = body;
  while (o + 4 <= Math.min(len, p.length)) { const tt = dv.getUint16(o), tl = dv.getUint16(o + 2); r.tlv.push(tt); o += 4 + tl; if (!tl) break; }
  return r;
}

/* ---------------------------------------------------------------- NTP */
export interface Ntp { li: number; vn: number; mode: number; stratum: number; poll: number; precision: number; rootDelay: number; rootDisp: number; refid: string; ref: number; orig: number; recv: number; xmt: number }
const NTP_EPOCH = 2208988800;
export function ntp(e: Eth): Ntp | null {
  if (!e.udp || (e.udp.sport !== 123 && e.udp.dport !== 123) || e.udp.data.length < 48) return null;
  const d = e.udp.data, dv = new DataView(d.buffer, d.byteOffset, d.length);
  const ts = (o: number) => { const s = dv.getUint32(o), f = dv.getUint32(o + 4); return s === 0 && f === 0 ? 0 : s - NTP_EPOCH + f / 4294967296; };
  const stratum = d[1];
  const refid = stratum <= 1 || stratum === 16 ? String.fromCharCode(...d.subarray(12, 16)).replace(/\0/g, "") : `${d[12]}.${d[13]}.${d[14]}.${d[15]}`;
  return { li: d[0] >> 6, vn: (d[0] >> 3) & 7, mode: d[0] & 7, stratum, poll: dv.getInt8(2), precision: dv.getInt8(3), rootDelay: dv.getInt32(4) / 65536, rootDisp: dv.getUint32(8) / 65536, refid, ref: ts(16), orig: ts(24), recv: ts(32), xmt: ts(40) };
}
