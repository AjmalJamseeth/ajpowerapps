// Capture reader for the SCADA protocol analysers: pcap and pcapng files,
// Ethernet / VLAN / Linux cooked / raw IP link layers, IPv4, TCP and UDP, and
// TCP stream reassembly per direction (retransmissions dropped, gaps recorded).

export interface RawFrame {
  t: number; // seconds since 1970 (UTC)
  data: Uint8Array;
  link: number;
}

export function readCapture(buf: Uint8Array): RawFrame[] {
  if (buf.length < 24) throw new Error("File too small to be a capture.");
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const m = dv.getUint32(0, false);
  const out: RawFrame[] = [];
  if (m === 0x0a0d0d0a) {
    // pcapng
    let o = 0, le = true;
    const ifs: { link: number; res: number }[] = [];
    while (o + 12 <= buf.length) {
      if (dv.getUint32(o, false) === 0x0a0d0d0a) le = dv.getUint32(o + 8, true) === 0x1a2b3c4d;
      const type = dv.getUint32(o, le), len = dv.getUint32(o + 4, le);
      if (len < 12 || o + len > buf.length) break;
      if (type === 1) {
        let res = 1e-6;
        let p = o + 16;
        while (p + 4 <= o + len - 4) {
          const code = dv.getUint16(p, le), l = dv.getUint16(p + 2, le);
          if (code === 0) break;
          if (code === 9 && l >= 1) { const v = buf[p + 4]; res = v & 0x80 ? Math.pow(2, -(v & 0x7f)) : Math.pow(10, -v); }
          p += 4 + Math.ceil(l / 4) * 4;
        }
        ifs.push({ link: dv.getUint16(o + 8, le), res });
      } else if (type === 6) {
        const id = dv.getUint32(o + 8, le), hi = dv.getUint32(o + 12, le), lo = dv.getUint32(o + 16, le), cap = dv.getUint32(o + 20, le);
        const f = ifs[id] ?? { link: 1, res: 1e-6 };
        out.push({ t: (hi * 4294967296 + lo) * f.res, data: buf.subarray(o + 28, o + 28 + cap), link: f.link });
      } else if (type === 3) {
        const f = ifs[0] ?? { link: 1, res: 1e-6 };
        out.push({ t: out.length ? out[out.length - 1].t : 0, data: buf.subarray(o + 12, o + len - 4), link: f.link });
      }
      o += len;
    }
    return out;
  }
  let le: boolean, ns = false;
  if (m === 0xa1b2c3d4) le = false;
  else if (m === 0xd4c3b2a1) le = true;
  else if (m === 0xa1b23c4d) { le = false; ns = true; }
  else if (m === 0x4d3cb2a1) { le = true; ns = true; }
  else throw new Error("Not a pcap or pcapng file.");
  const link = dv.getUint32(20, le);
  let o = 24;
  while (o + 16 <= buf.length) {
    const s = dv.getUint32(o, le), f = dv.getUint32(o + 4, le), cap = dv.getUint32(o + 8, le);
    if (o + 16 + cap > buf.length) break;
    out.push({ t: s + f / (ns ? 1e9 : 1e6), data: buf.subarray(o + 16, o + 16 + cap), link });
    o += 16 + cap;
  }
  return out;
}

export interface Packet {
  no: number;
  t: number;
  src: string;
  dst: string;
  proto: "tcp" | "udp";
  sport: number;
  dport: number;
  seq: number;
  ack: number;
  flags: number; // TCP flags: FIN 1, SYN 2, RST 4, PSH 8, ACK 16
  win: number;
  payload: Uint8Array;
}

const ip4 = (d: Uint8Array, o: number) => `${d[o]}.${d[o + 1]}.${d[o + 2]}.${d[o + 3]}`;

/** IPv4 TCP/UDP packets of the capture (other traffic skipped). */
export function packets(frames: RawFrame[]): Packet[] {
  const out: Packet[] = [];
  frames.forEach((f, i) => {
    const d = f.data;
    let o = 0, et = 0;
    if (f.link === 1) { if (d.length < 14) return; et = (d[12] << 8) | d[13]; o = 14; }
    else if (f.link === 113) { if (d.length < 16) return; et = (d[14] << 8) | d[15]; o = 16; }
    else if (f.link === 276) { if (d.length < 20) return; et = (d[0] << 8) | d[1]; o = 20; }
    else if (f.link === 101 || f.link === 12 || f.link === 14 || f.link === 228) { et = 0x0800; o = 0; }
    else return;
    while (et === 0x8100 || et === 0x88a8) { if (d.length < o + 4) return; et = (d[o + 2] << 8) | d[o + 3]; o += 4; }
    if (et !== 0x0800 || d.length < o + 20 || d[o] >> 4 !== 4) return;
    const ihl = (d[o] & 15) * 4, tot = (d[o + 2] << 8) | d[o + 3], pr = d[o + 9];
    const frag = ((d[o + 6] & 0x1f) << 8) | d[o + 7];
    if (frag) return; // fragments are not reassembled
    const end = Math.min(d.length, o + (tot || d.length - o));
    const src = ip4(d, o + 12), dst = ip4(d, o + 16), p = o + ihl;
    if (pr === 6 && end >= p + 20) {
      const off = (d[p + 12] >> 4) * 4;
      const u32 = (k: number) => ((d[k] << 24) >>> 0) + (d[k + 1] << 16) + (d[k + 2] << 8) + d[k + 3];
      out.push({ no: i + 1, t: f.t, src, dst, proto: "tcp", sport: (d[p] << 8) | d[p + 1], dport: (d[p + 2] << 8) | d[p + 3], seq: u32(p + 4), ack: u32(p + 8), flags: d[p + 13], win: (d[p + 14] << 8) | d[p + 15], payload: d.subarray(Math.min(end, p + off), end) });
    } else if (pr === 17 && end >= p + 8) {
      out.push({ no: i + 1, t: f.t, src, dst, proto: "udp", sport: (d[p] << 8) | d[p + 1], dport: (d[p + 2] << 8) | d[p + 3], seq: 0, ack: 0, flags: 0, win: 0, payload: d.subarray(p + 8, end) });
    }
  });
  return out;
}

export interface Direction {
  from: string; // ip:port
  to: string;
  bytes: Uint8Array;
  /** time and frame number of each byte range start, ascending offsets */
  marks: { off: number; t: number; no: number }[];
  gaps: number; // missing byte ranges (capture loss)
  retrans: number;
}
export interface TcpConn {
  client: string; // ip:port of the side that connects (or the non-server port)
  server: string;
  port: number; // server port
  start: number;
  end: number;
  syn: boolean;
  fin: boolean;
  rst: boolean;
  zeroWin: number;
  c2s: Direction;
  s2c: Direction;
  packets: number;
}

/** Reassemble TCP connections whose server port is in `ports`. */
export function tcpConns(pk: Packet[], ports: number[]): TcpConn[] {
  const map = new Map<string, { pk: Packet[]; server: string; client: string; port: number }>();
  for (const p of pk) {
    if (p.proto !== "tcp") continue;
    const sv = ports.includes(p.dport) ? "d" : ports.includes(p.sport) ? "s" : "";
    if (!sv) continue;
    const server = sv === "d" ? `${p.dst}:${p.dport}` : `${p.src}:${p.sport}`, client = sv === "d" ? `${p.src}:${p.sport}` : `${p.dst}:${p.dport}`;
    const k = client + ">" + server;
    if (!map.has(k)) map.set(k, { pk: [], server, client, port: sv === "d" ? p.dport : p.sport });
    map.get(k)!.pk.push(p);
  }
  const out: TcpConn[] = [];
  for (const c of map.values()) {
    const dir = (fromCl: boolean): Direction => {
      const from = fromCl ? c.client : c.server, to = fromCl ? c.server : c.client;
      const seg = c.pk.filter((p) => `${p.src}:${p.sport}` === from);
      const syn = seg.find((p) => p.flags & 2);
      let base = syn ? (syn.seq + 1) >>> 0 : seg.find((p) => p.payload.length)?.seq ?? 0;
      const data = seg.filter((p) => p.payload.length).map((p) => ({ rel: ((p.seq - base) >>> 0) > 0x7fffffff ? (p.seq - base) | 0 : (p.seq - base) >>> 0, p }));
      data.sort((a, b) => a.rel - b.rel || a.p.no - b.p.no);
      const parts: Uint8Array[] = [], marks: Direction["marks"] = [];
      let next = data.length ? Math.min(0, data[0].rel) : 0, gaps = 0, retrans = 0, len = 0;
      if (data.length && data[0].rel > 0 && !syn) next = data[0].rel;
      for (const { rel, p } of data) {
        const end = rel + p.payload.length;
        if (end <= next) { retrans++; continue; }
        if (rel > next) { gaps++; next = rel; }
        const from0 = next - rel, chunk = p.payload.subarray(from0);
        marks.push({ off: len, t: p.t, no: p.no });
        parts.push(chunk); len += chunk.length; next = end;
      }
      const bytes = new Uint8Array(len);
      let o = 0;
      for (const x of parts) { bytes.set(x, o); o += x.length; }
      return { from, to, bytes, marks, gaps, retrans };
    };
    out.push({
      client: c.client, server: c.server, port: c.port, start: c.pk[0].t, end: c.pk[c.pk.length - 1].t,
      syn: c.pk.some((p) => p.flags & 2), fin: c.pk.some((p) => p.flags & 1), rst: c.pk.some((p) => p.flags & 4),
      zeroWin: c.pk.filter((p) => p.win === 0 && !(p.flags & 4)).length, c2s: dir(true), s2c: dir(false), packets: c.pk.length,
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

/** Time and frame of the segment that carried byte `off` of a direction. */
export function markAt(d: Direction, off: number): { t: number; no: number } {
  let lo = 0, hi = d.marks.length - 1, r = d.marks[0] ?? { off: 0, t: 0, no: 0 };
  while (lo <= hi) { const m = (lo + hi) >> 1; if (d.marks[m].off <= off) { r = d.marks[m]; lo = m + 1; } else hi = m - 1; }
  return { t: r.t, no: r.no };
}

export const hex = (d: Uint8Array, max = 64) => Array.from(d.subarray(0, max), (b) => b.toString(16).padStart(2, "0")).join(" ") + (d.length > max ? " …" : "");
export const isoT = (t: number) => new Date(t * 1000).toISOString().replace("T", " ").replace("Z", "");
