// MAC address and Ethernet frame header decoder for substation networks.
// Recognises the IEC 61850, PTP, PRP/HSR, MRP, spanning-tree, LLDP and IP
// multicast destinations, decodes a frame header (VLAN tag, EtherType, and the
// GOOSE / SV / GSSE header), and looks up the manufacturer from an IEEE OUI
// file the user opens (the registry itself is not bundled).

export type MacKind = "broadcast" | "multicast" | "unicast";

export interface MacInfo {
  mac: string; // normalised AA-BB-CC-DD-EE-FF
  bytes: number[];
  kind: MacKind;
  local: boolean; // locally administered (U/L bit set)
  oui: string; // first three bytes, AA-BB-CC
  traffic: string | null; // what this destination carries, when known
  standard: string | null;
  notes: string[];
}

export function normMac(s: string): string | null {
  const t = String(s || "").trim();
  if (!/^[0-9a-f\-:.\s]+$/i.test(t)) return null;
  const h = t.replace(/[^0-9a-f]/gi, "");
  if (h.length !== 12) return null;
  return h.toUpperCase().match(/../g)!.join("-");
}

interface Known {
  test: (b: number[]) => boolean;
  traffic: string;
  standard: string;
  note?: (b: number[]) => string | null;
}

const eq = (b: number[], pre: number[]) => pre.every((x, i) => b[i] === x);
const hx = (n: number, w = 2) => n.toString(16).toUpperCase().padStart(w, "0");

const KNOWN: Known[] = [
  { test: (b) => b.every((x) => x === 0xff), traffic: "Broadcast — every device in the VLAN receives it (ARP, DHCP, some discovery protocols)", standard: "IEEE 802" },
  {
    test: (b) => eq(b, [0x01, 0x0c, 0xcd, 0x01]),
    traffic: "IEC 61850 GOOSE multicast",
    standard: "IEC 61850-8-1",
    note: (b) => ((b[4] << 8) | b[5]) <= 0x01ff ? "Inside the recommended GOOSE range 01-0C-CD-01-00-00 … 01-0C-CD-01-01-FF." : "Outside the recommended range 01-0C-CD-01-00-00 … 01-0C-CD-01-01-FF: allowed by the address prefix, but check the project's addressing rules.",
  },
  { test: (b) => eq(b, [0x01, 0x0c, 0xcd, 0x02]), traffic: "IEC 61850 GSSE multicast (obsolete since Edition 2)", standard: "IEC 61850-8-1" },
  {
    test: (b) => eq(b, [0x01, 0x0c, 0xcd, 0x04]),
    traffic: "IEC 61850 sampled values multicast",
    standard: "IEC 61850-9-2",
    note: (b) => ((b[4] << 8) | b[5]) <= 0x01ff ? "Inside the recommended SV range 01-0C-CD-04-00-00 … 01-0C-CD-04-01-FF." : "Outside the recommended range 01-0C-CD-04-00-00 … 01-0C-CD-04-01-FF.",
  },
  { test: (b) => eq(b, [0x01, 0x1b, 0x19, 0x00, 0x00, 0x00]), traffic: "PTP (IEEE 1588) over Ethernet, general messages: Sync, Follow_Up, Announce", standard: "IEEE 1588 / IEC 61850-9-3" },
  { test: (b) => eq(b, [0x01, 0x80, 0xc2, 0x00, 0x00, 0x0e]), traffic: "Link-local: PTP peer-delay messages and LLDP — never forwarded by switches", standard: "IEEE 1588 / IEEE 802.1AB" },
  { test: (b) => eq(b, [0x01, 0x80, 0xc2, 0x00, 0x00, 0x00]), traffic: "Spanning tree (STP / RSTP / MSTP) BPDUs", standard: "IEEE 802.1D / 802.1Q" },
  { test: (b) => eq(b, [0x01, 0x80, 0xc2, 0x00, 0x00, 0x01]), traffic: "Ethernet flow control (PAUSE frames)", standard: "IEEE 802.3" },
  { test: (b) => eq(b, [0x01, 0x80, 0xc2, 0x00, 0x00, 0x02]), traffic: "Slow protocols: LACP link aggregation, OAM", standard: "IEEE 802.3" },
  { test: (b) => eq(b, [0x01, 0x80, 0xc2, 0x00, 0x00, 0x03]), traffic: "IEEE 802.1X port authentication (EAPOL)", standard: "IEEE 802.1X" },
  { test: (b) => eq(b, [0x01, 0x15, 0x4e, 0x00, 0x01]), traffic: "PRP / HSR supervision frames (last byte is configurable, default 00)", standard: "IEC 62439-3" },
  { test: (b) => eq(b, [0x01, 0x15, 0x4e, 0x00, 0x00]), traffic: "MRP ring protocol (test, topology and link frames)", standard: "IEC 62439-2" },
  { test: (b) => eq(b, [0x01, 0x00, 0x0c, 0xcc, 0xcc, 0xcc]), traffic: "Cisco discovery and VLAN protocols (CDP, VTP, DTP)", standard: "Vendor (Cisco)" },
  { test: (b) => eq(b, [0x01, 0x00, 0x0c, 0xcc, 0xcc, 0xcd]), traffic: "Cisco per-VLAN spanning tree (PVST+)", standard: "Vendor (Cisco)" },
  {
    test: (b) => eq(b, [0x01, 0x00, 0x5e]) && b[3] < 0x80,
    traffic: "IPv4 multicast",
    standard: "RFC 1112",
    note: (b) => `Maps to the IPv4 group x.${b[3] & 0x7f}.${b[4]}.${b[5]} (only the low 23 bits are carried, so 32 IP groups share each MAC). IGMP snooping handles this traffic — it does not filter GOOSE or SV.`,
  },
  { test: (b) => b[0] === 0x33 && b[1] === 0x33, traffic: "IPv6 multicast (neighbour discovery, router advertisements and groups)", standard: "RFC 2464" },
  { test: (b) => eq(b, [0x00, 0x00, 0x5e, 0x00, 0x01]), traffic: "VRRP virtual router (IPv4): a redundant default gateway", standard: "RFC 5798", note: (b) => `Virtual router ID ${b[5]}.` },
  { test: (b) => eq(b, [0x00, 0x00, 0x5e, 0x00, 0x02]), traffic: "VRRP virtual router (IPv6)", standard: "RFC 5798", note: (b) => `Virtual router ID ${b[5]}.` },
];

export function decodeMac(s: string): MacInfo | null {
  const mac = normMac(s);
  if (!mac) return null;
  const b = mac.split("-").map((x) => parseInt(x, 16));
  const notes: string[] = [];
  const bc = b.every((x) => x === 0xff);
  const kind: MacKind = bc ? "broadcast" : b[0] & 1 ? "multicast" : "unicast";
  const local = !bc && !!(b[0] & 2);
  const k = KNOWN.find((x) => x.test(b));
  if (k?.note) {
    const n = k.note(b);
    if (n) notes.push(n);
  }
  if (kind === "unicast") notes.push(local ? "Locally administered unicast address: set by software (virtual machines, some redundancy schemes, or by hand), not by the manufacturer. The first three bytes do not identify a manufacturer." : "Globally unique unicast address: the first three bytes (OUI) are assigned by the IEEE to the manufacturer of the network interface.");
  if (kind === "multicast" && !k) notes.push("Multicast address not in the common substation list. The first byte's lowest bit is set, so switches flood it to every port in the VLAN unless a static multicast filter restricts it.");
  return { mac, bytes: b, kind, local, oui: b.slice(0, 3).map((x) => hx(x)).join("-"), traffic: k?.traffic ?? null, standard: k?.standard ?? null, notes };
}

// ---------------------------------------------------------------- frames

export const ETHERTYPES: Record<number, string> = {
  0x0800: "IPv4",
  0x0806: "ARP",
  0x86dd: "IPv6",
  0x8100: "VLAN tag (IEEE 802.1Q)",
  0x88a8: "Service VLAN tag (IEEE 802.1ad, Q-in-Q)",
  0x88b8: "IEC 61850 GOOSE",
  0x88b9: "IEC 61850 GSSE (obsolete)",
  0x88ba: "IEC 61850 sampled values",
  0x88f7: "PTP (IEEE 1588)",
  0x88cc: "LLDP",
  0x88e3: "MRP (IEC 62439-2)",
  0x88fb: "PRP / HSR supervision (IEC 62439-3)",
  0x892f: "HSR tag (IEC 62439-3)",
  0x888e: "IEEE 802.1X (EAPOL)",
  0x8809: "Slow protocols (LACP)",
  0x8808: "Ethernet flow control",
};

export interface Finding {
  sev: "error" | "warning" | "info" | "ok";
  text: string;
}

export interface FrameInfo {
  dst: MacInfo;
  src: MacInfo;
  vlan: { pcp: number; dei: number; vid: number } | null;
  ethertype: number;
  ethertypeName: string;
  iec: { appid: number; length: number; reserved1: number; reserved2: number; simulation: boolean } | null;
  pdu: { name: string; value: string }[];
  hsr: { path: number; size: number; seq: number } | null;
  prpTrailer: { seq: number; lan: "A" | "B" | "?"; size: number } | null;
  findings: Finding[];
  byteCount: number;
}

export function parseHex(s: string): number[] | null {
  const text = String(s || "");
  const lines = text.split(/\r?\n/);
  const dump = lines.some((l) => /^\s*[0-9a-f]{4,8}\s{1,4}[0-9a-f]{2}\s/i.test(l));
  let hex = "";
  if (dump) {
    // Wireshark hex dump: offset, up to 16 byte pairs, then an ASCII column
    for (const l of lines) {
      const m = l.match(/^\s*[0-9a-f]{4,8}\s{1,4}(.*)$/i);
      if (!m) continue;
      for (const tok of m[1].trim().split(/\s+/)) {
        if (/^[0-9a-f]{2}$/i.test(tok)) hex += tok;
        else break;
      }
    }
  } else hex = text.replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "");
  if (hex.length < 28 || hex.length % 2) return null;
  return hex.match(/../g)!.map((x) => parseInt(x, 16));
}

/** Recommended APPID ranges: GOOSE 0000–3FFF (Ed.2 Type 1A 8000–BFFF), SV 4000–7FFF (Type 1A C000–FFFF). */
export function appidRange(et: number, appid: number): Finding {
  const a = hx(appid, 4);
  if (et === 0x88b8) {
    if (appid <= 0x3fff) return { sev: "ok", text: `GOOSE APPID ${a} is inside 0000–3FFF.` };
    if (appid >= 0x8000 && appid <= 0xbfff) return { sev: "ok", text: `GOOSE APPID ${a} is inside 8000–BFFF, the Edition 2 range for Type 1A (trip) GOOSE.` };
    return { sev: "warning", text: `GOOSE APPID ${a} is outside 0000–3FFF and 8000–BFFF.` };
  }
  if (et === 0x88ba) {
    if (appid >= 0x4000 && appid <= 0x7fff) return { sev: "ok", text: `SV APPID ${a} is inside 4000–7FFF.` };
    if (appid >= 0xc000) return { sev: "ok", text: `SV APPID ${a} is inside C000–FFFF, the Edition 2 range for Type 1A sampled values.` };
    return { sev: "warning", text: `SV APPID ${a} is outside 4000–7FFF and C000–FFFF.` };
  }
  return { sev: "info", text: `APPID ${a}.` };
}

export function decodeFrame(bytes: number[]): FrameInfo | null {
  if (bytes.length < 14) return null;
  const mac = (o: number) => bytes.slice(o, o + 6).map((x) => hx(x)).join("-");
  const dst = decodeMac(mac(0))!, src = decodeMac(mac(6))!;
  const F: Finding[] = [];
  let o = 12, et = (bytes[o] << 8) | bytes[o + 1], vlan: FrameInfo["vlan"] = null;
  if (et === 0x8100 || et === 0x88a8) {
    if (bytes.length < 18) return null;
    const tci = (bytes[14] << 8) | bytes[15];
    vlan = { pcp: tci >> 13, dei: (tci >> 12) & 1, vid: tci & 0xfff };
    o = 16;
    et = (bytes[o] << 8) | bytes[o + 1];
  }
  o += 2;
  let hsr: FrameInfo["hsr"] = null;
  if (et === 0x892f && bytes.length >= o + 6) {
    const w = (bytes[o] << 8) | bytes[o + 1];
    hsr = { path: w >> 12, size: w & 0xfff, seq: (bytes[o + 2] << 8) | bytes[o + 3] };
    et = (bytes[o + 4] << 8) | bytes[o + 5];
    o += 6;
    F.push({ sev: "info", text: `HSR tag: path ${hsr.path}, LSDU size ${hsr.size}, sequence ${hsr.seq}. The frame is on an HSR ring; the payload EtherType follows the tag.` });
  }
  const name = ETHERTYPES[et] ?? (et < 0x0600 ? "IEEE 802.3 length field (LLC frame)" : "Unknown EtherType");
  let iec: FrameInfo["iec"] = null;
  if ((et === 0x88b8 || et === 0x88ba || et === 0x88b9) && bytes.length >= o + 8) {
    const appid = (bytes[o] << 8) | bytes[o + 1], length = (bytes[o + 2] << 8) | bytes[o + 3];
    const r1 = (bytes[o + 4] << 8) | bytes[o + 5], r2 = (bytes[o + 6] << 8) | bytes[o + 7];
    iec = { appid, length, reserved1: r1, reserved2: r2, simulation: !!(r1 & 0x8000) };
    F.push(appidRange(et, appid));
    if (iec.simulation) F.push({ sev: "warning", text: "Reserved 1 has the simulation bit set (Edition 2): the publisher is in simulation. Subscribers in normal operation should not act on it." });
    if (length < 8) F.push({ sev: "error", text: `Length ${length} is shorter than the 8-byte header.` });
    else if (bytes.length >= o + length && bytes.length - o - length >= 6) {
      // PRP trailer check: last 6 bytes = seq(2) | lan(4 bits) size(12 bits) | 0x88FB
      const n = bytes.length;
      if (bytes[n - 2] === 0x88 && bytes[n - 1] === 0xfb) {
        const seq = (bytes[n - 6] << 8) | bytes[n - 5], w = (bytes[n - 4] << 8) | bytes[n - 3];
        const lanId = w >> 12;
        F.push({ sev: "info", text: `PRP trailer found: sequence ${seq}, LAN ${lanId === 0xa ? "A" : lanId === 0xb ? "B" : "?"}.` });
      }
    }
    if (et === 0x88b8 && dst.traffic && !/GOOSE/.test(dst.traffic)) F.push({ sev: "error", text: "GOOSE EtherType but the destination is not a GOOSE multicast address (01-0C-CD-01-…)." });
    if (et === 0x88ba && dst.traffic && !/sampled values/.test(dst.traffic)) F.push({ sev: "error", text: "Sampled-value EtherType but the destination is not an SV multicast address (01-0C-CD-04-…)." });
  }
  let prpTrailer: FrameInfo["prpTrailer"] = null;
  const n = bytes.length;
  if (n >= 20 && bytes[n - 2] === 0x88 && bytes[n - 1] === 0xfb && !F.some((f) => /PRP trailer/.test(f.text))) {
    const w = (bytes[n - 4] << 8) | bytes[n - 3], lanId = w >> 12;
    prpTrailer = { seq: (bytes[n - 6] << 8) | bytes[n - 5], lan: lanId === 0xa ? "A" : lanId === 0xb ? "B" : "?", size: w & 0xfff };
    F.push({ sev: "info", text: `Ends with a possible PRP trailer: sequence ${prpTrailer.seq}, LAN ${prpTrailer.lan}, size ${prpTrailer.size}.` });
  }
  if ((et === 0x88b8 || et === 0x88ba) && !vlan) F.push({ sev: "warning", text: "No VLAN tag: the frame carries no IEEE 802.1Q priority, so switches treat it as normal traffic. GOOSE and SV are normally tagged (priority 4 or higher)." });
  if (vlan) {
    if (vlan.vid === 0) F.push({ sev: "info", text: `Priority-tagged only (VLAN 0): priority ${vlan.pcp}; the switch places the frame in the port's untagged VLAN.` });
    else if (vlan.vid === 4095) F.push({ sev: "error", text: "VLAN ID 4095 is reserved." });
    if ((et === 0x88b8 || et === 0x88ba) && vlan.pcp < 4) F.push({ sev: "warning", text: `Priority ${vlan.pcp} is in the lower half; GOOSE and SV normally use 4 or higher so switches queue them ahead of other traffic.` });
  }
  if (src.kind !== "unicast") F.push({ sev: "error", text: "The source MAC is a multicast or broadcast address; a sender's own address is always unicast." });
  const pdu = iec ? decodePdu(et, bytes.slice(o + 8)) : [];
  if (iec && pdu.some((x) => x.name === "timeAllowedtoLive")) {
    const tal = Number(pdu.find((x) => x.name === "timeAllowedtoLive")!.value.split(" ")[0]);
    if (tal > 0 && tal < 10) F.push({ sev: "warning", text: `timeAllowedtoLive ${tal} ms is very short; check it is not a units error.` });
  }
  return { dst, src, vlan, ethertype: et, ethertypeName: name, iec, pdu, hsr, prpTrailer, findings: F, byteCount: bytes.length };
}

// ---------------------------------------------------------------- GOOSE / SV PDU (BER)

const GOOSE_TAGS: Record<number, string> = { 0x80: "gocbRef", 0x81: "timeAllowedtoLive", 0x82: "datSet", 0x83: "goID", 0x84: "t", 0x85: "stNum", 0x86: "sqNum", 0x87: "simulation", 0x88: "confRev", 0x89: "ndsCom", 0x8a: "numDatSetEntries", 0xab: "allData" };
const ASDU_TAGS: Record<number, string> = { 0x80: "svID", 0x81: "datSet", 0x82: "smpCnt", 0x83: "confRev", 0x84: "refrTm", 0x85: "smpSynch", 0x86: "smpRate", 0x87: "seqData", 0x88: "smpMod" };

function tlvs(b: number[], start = 0, end = b.length): { tag: number; v: number[]; trunc: boolean }[] {
  const out: { tag: number; v: number[]; trunc: boolean }[] = [];
  let i = start;
  while (i < end && i + 1 < b.length) {
    const tag = b[i++];
    let len = b[i++];
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let k = 0; k < n && i < b.length; k++) len = (len << 8) | b[i++];
    }
    const v = b.slice(i, Math.min(i + len, b.length));
    out.push({ tag, v, trunc: v.length < len });
    i += len;
  }
  return out;
}
const uint = (v: number[]) => v.reduce((a, x) => a * 256 + x, 0);
const str = (v: number[]) => String.fromCharCode(...v.filter((x) => x >= 32 && x < 127));
function utc(v: number[]): string {
  if (v.length < 8) return "(truncated)";
  const sec = uint(v.slice(0, 4)), frac = uint(v.slice(4, 7)) / 2 ** 24, q = v[7];
  const d = new Date((sec + frac) * 1000).toISOString();
  return `${d} (time quality 0x${hx(q)}: accuracy ${q & 0x1f} bits${q & 0x20 ? ", clock not synchronised" : ""}${q & 0x40 ? ", clock failure" : ""}${q & 0x80 ? ", leap seconds known" : ""})`;
}

export function decodePdu(et: number, b: number[]): { name: string; value: string }[] {
  const out: { name: string; value: string }[] = [];
  const top = tlvs(b)[0];
  if (!top) return out;
  if (et === 0x88b8 && top.tag === 0x61) {
    for (const t of tlvs(top.v)) {
      const n = GOOSE_TAGS[t.tag] ?? `tag 0x${hx(t.tag)}`;
      let v: string;
      if (t.tag === 0x80 || t.tag === 0x82 || t.tag === 0x83) v = str(t.v);
      else if (t.tag === 0x84) v = utc(t.v);
      else if (t.tag === 0x87 || t.tag === 0x89) v = t.v[0] ? "TRUE" : "FALSE";
      else if (t.tag === 0x81) v = `${uint(t.v)} ms`;
      else if (t.tag === 0xab) v = `${tlvs(t.v).length} values`;
      else v = String(uint(t.v));
      out.push({ name: n, value: v + (t.trunc ? " (truncated)" : "") });
    }
  } else if (et === 0x88ba && top.tag === 0x60) {
    for (const t of tlvs(top.v)) {
      if (t.tag === 0x80) out.push({ name: "noASDU", value: String(uint(t.v)) });
      else if (t.tag === 0xa2) {
        tlvs(t.v).forEach((a, k) => {
          for (const f of tlvs(a.v)) {
            const n = `ASDU ${k + 1} ${ASDU_TAGS[f.tag] ?? `tag 0x${hx(f.tag)}`}`;
            let v: string;
            if (f.tag === 0x80 || f.tag === 0x81) v = str(f.v);
            else if (f.tag === 0x84) v = utc(f.v);
            else if (f.tag === 0x85) v = f.v[0] === 0 ? "0 (not synchronised)" : f.v[0] === 1 ? "1 (local clock)" : f.v[0] === 2 ? "2 (global clock)" : String(f.v[0]);
            else if (f.tag === 0x87) v = `${f.v.length} bytes (${Math.floor(f.v.length / 8)} channels of value + quality)`;
            else v = String(uint(f.v));
            out.push({ name: n, value: v + (f.trunc ? " (truncated)" : "") });
          }
        });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- OUI registry

/** Parse the IEEE MA-L/MA-M/MA-S registry (oui.csv, or the oui.txt text form). Returns prefix → organisation. */
export function parseOui(text: string): Map<string, string> {
  const m = new Map<string, string>();
  const lines = String(text || "").split(/\r?\n/);
  for (const l of lines) {
    let r = l.match(/^\s*([0-9A-F]{2})-([0-9A-F]{2})-([0-9A-F]{2})\s+\(hex\)\s+(.+?)\s*$/i);
    if (r) {
      m.set(`${r[1]}${r[2]}${r[3]}`.toUpperCase(), r[4]);
      continue;
    }
    r = l.match(/^\s*MA-[LMS]\s*,\s*([0-9A-F]{6,9})\s*,\s*("(?:[^"]|"")*"|[^,]*)/i);
    if (r) m.set(r[1].toUpperCase(), r[2].replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  }
  return m;
}

export function lookupOui(reg: Map<string, string>, mac: string): string | null {
  const h = mac.replace(/-/g, "");
  return reg.get(h.slice(0, 9)) ?? reg.get(h.slice(0, 7)) ?? reg.get(h.slice(0, 6)) ?? null;
}

// A trip GOOSE from the sample substation (P132_Q01 → P87T_T1, BCU_J01), VLAN 10, priority 4.
export const SAMPLE_FRAME = [
  "01 0c cd 01 00 11 02 aa 00 00 02 01 81 00 80 0a 88 b8 00 11 00 7e 00 00 00 00 61 74 80 1d 50 31",
  "33 32 5f 51 30 31 50 52 4f 54 2f 4c 4c 4e 30 24 47 4f 24 47 43 42 5f 54 52 49 50 81 02 07 d0 82",
  "19 50 31 33 32 5f 51 30 31 50 52 4f 54 2f 4c 4c 4e 30 24 44 53 5f 54 52 49 50 83 08 47 43 42 5f",
  "54 52 49 50 84 08 6a 6e 3c 40 80 00 00 0a 85 01 05 86 01 00 87 01 00 88 01 01 89 01 00 8a 01 04",
  "ab 0e 83 01 01 84 03 03 00 00 83 01 00 83 01 00",
].join("\n");
