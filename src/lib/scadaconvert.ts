// SCADA value converters: Modbus register pairs and byte orders, Modbus
// register notation, IEC 60870-5-104 normalised / scaled / short-float values,
// the CP56Time2a time tag, and the quality descriptors of IEC 104 and IEC 61850.

// ------------------------------------------------------------ Modbus registers

export type WordOrder = "ABCD" | "CDAB" | "BADC" | "DCBA";
export const ORDERS: { key: WordOrder; label: string }[] = [
  { key: "ABCD", label: "ABCD — big-endian (Modbus standard, high word first)" },
  { key: "CDAB", label: "CDAB — word swap (low word first), common in PLCs and meters" },
  { key: "BADC", label: "BADC — byte swap within each word" },
  { key: "DCBA", label: "DCBA — little-endian" },
];

/** Parse a 16-bit register given in decimal, hex (0x…, …h) or signed decimal. */
export function parseReg(s: string): number | null {
  const t = String(s || "").trim();
  if (!t) return null;
  let v: number;
  if (/^0x[0-9a-f]{1,4}$/i.test(t)) v = parseInt(t.slice(2), 16);
  else if (/^[0-9a-f]{1,4}h$/i.test(t)) v = parseInt(t.slice(0, -1), 16);
  else if (/^-?\d+$/.test(t)) v = Number(t);
  else return null;
  if (v < -32768 || v > 65535) return null;
  return v < 0 ? v + 65536 : v;
}

function bytesFor(r1: number, r2: number, order: WordOrder): number[] {
  const A = r1 >> 8, B = r1 & 0xff, C = r2 >> 8, D = r2 & 0xff;
  // Reorder so the returned array is the value's big-endian byte sequence.
  switch (order) {
    case "ABCD": return [A, B, C, D];
    case "CDAB": return [C, D, A, B];
    case "BADC": return [B, A, D, C];
    case "DCBA": return [D, C, B, A];
  }
}

export interface RegPairResult {
  order: WordOrder;
  hex: string;
  float32: number;
  int32: number;
  uint32: number;
}

export function decodePair(r1: number, r2: number): RegPairResult[] {
  return ORDERS.map(({ key }) => {
    const b = bytesFor(r1, r2, key);
    const dv = new DataView(new Uint8Array(b).buffer);
    return { order: key, hex: b.map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join(" "), float32: dv.getFloat32(0, false), int32: dv.getInt32(0, false), uint32: dv.getUint32(0, false) };
  });
}

export function decodeSingle(r: number): { uint16: number; int16: number; hex: string; bcd: number | null } {
  const nib = [r >> 12, (r >> 8) & 15, (r >> 4) & 15, r & 15];
  return { uint16: r, int16: r >= 32768 ? r - 65536 : r, hex: r.toString(16).toUpperCase().padStart(4, "0"), bcd: nib.every((n) => n <= 9) ? nib.reduce((a, n) => a * 10 + n, 0) : null };
}

/** Encode a float32 into the two registers to write, for each byte order. */
export function encodeFloat(v: number): { order: WordOrder; r1: number; r2: number }[] {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, v, false);
  const [A, B, C, D] = [0, 1, 2, 3].map((i) => dv.getUint8(i));
  const w = (h: number, l: number) => (h << 8) | l;
  return [
    { order: "ABCD", r1: w(A, B), r2: w(C, D) },
    { order: "CDAB", r1: w(C, D), r2: w(A, B) },
    { order: "BADC", r1: w(B, A), r2: w(D, C) },
    { order: "DCBA", r1: w(D, C), r2: w(B, A) },
  ];
}

// ------------------------------------------------------------ Modbus notation

export const TABLES = {
  coil: { prefix: 0, name: "Coils (read/write bits)", read: "01 Read Coils", write: "05 Write Single Coil / 15 Write Multiple Coils" },
  input: { prefix: 1, name: "Discrete inputs (read-only bits)", read: "02 Read Discrete Inputs", write: "— (read-only)" },
  inreg: { prefix: 3, name: "Input registers (read-only words)", read: "04 Read Input Registers", write: "— (read-only)" },
  holding: { prefix: 4, name: "Holding registers (read/write words)", read: "03 Read Holding Registers", write: "06 Write Single Register / 16 Write Multiple Registers" },
} as const;
export type TableKey = keyof typeof TABLES;

export interface NotationResult {
  table: TableKey;
  protocolAddress: number; // 0-based address sent on the wire
  fiveDigit: string | null; // e.g. 40001
  sixDigit: string; // e.g. 400001
  readFc: string;
  writeFc: string;
  note: string | null;
}

/** "40001" / "400001" / "4x0001" → table + 0-based protocol address. */
export function parseNotation(s: string): NotationResult | null {
  const t = String(s || "").trim().toLowerCase().replace(/x/, "");
  if (!/^[0134]\d{4,5}$/.test(t)) return null;
  const pfx = Number(t[0]), n = Number(t.slice(1));
  if (n < 1 || n > 65536) return null;
  const table = (Object.keys(TABLES) as TableKey[]).find((k) => TABLES[k].prefix === pfx)!;
  return fromAddress(table, n - 1);
}

export function fromAddress(table: TableKey, addr: number): NotationResult | null {
  if (!(addr >= 0 && addr <= 65535)) return null;
  const T = TABLES[table];
  const one = addr + 1;
  return {
    table,
    protocolAddress: addr,
    fiveDigit: one <= 9999 ? `${T.prefix}${String(one).padStart(4, "0")}` : null,
    sixDigit: `${T.prefix}${String(one).padStart(5, "0")}`,
    readFc: T.read,
    writeFc: T.write,
    note: one > 9999 ? "Above 9999 only the six-digit notation exists." : null,
  };
}

// ------------------------------------------------------------ IEC 60870-5-104 values

/** Normalised value (NVA, M_ME_NA_1): 16-bit two's complement, value = raw / 32768, range −1 … +1 − 2⁻¹⁵. */
export function nvaFromRaw(raw: number): number {
  const r = raw >= 32768 ? raw - 65536 : raw;
  return r / 32768;
}
export function rawFromNva(v: number): { raw: number; clipped: boolean } {
  let r = Math.round(v * 32768), clipped = false;
  if (r > 32767) (r = 32767), (clipped = true);
  if (r < -32768) (r = -32768), (clipped = true);
  return { raw: r, clipped };
}

export interface NvaScaling {
  engineering: number; // engineering value
  fullScale: number; // engineering value that maps to NVA 1.0
}
export function nvaFromEngineering(x: NvaScaling) {
  const v = x.engineering / x.fullScale;
  const { raw, clipped } = rawFromNva(v);
  const resolution = x.fullScale / 32768;
  return { nva: raw / 32768, raw, rawHex: ((raw + 65536) % 65536).toString(16).toUpperCase().padStart(4, "0"), clipped, resolution };
}

/** IEC 104 short float (M_ME_NC_1) is IEEE 754 single precision, sent least significant byte first. */
export function shortFloatBytes(v: number): string {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, v, true);
  return [0, 1, 2, 3].map((i) => dv.getUint8(i).toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

// ------------------------------------------------------------ CP56Time2a

export interface Cp56 {
  ok: boolean;
  text: string;
  ms: number;
  minute: number;
  hour: number;
  day: number;
  dow: number;
  month: number;
  year: number;
  invalid: boolean;
  summer: boolean;
  notes: string[];
}

export function decodeCp56(hexText: string): Cp56 | null {
  const h = String(hexText || "").replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "");
  if (h.length !== 14) return null;
  const b = h.match(/../g)!.map((x) => parseInt(x, 16));
  const ms = b[0] | (b[1] << 8);
  const minute = b[2] & 0x3f, invalid = !!(b[2] & 0x80);
  const hour = b[3] & 0x1f, summer = !!(b[3] & 0x80);
  const day = b[4] & 0x1f, dow = b[4] >> 5;
  const month = b[5] & 0x0f, year = b[6] & 0x7f;
  const notes: string[] = [];
  if (invalid) notes.push("IV bit set: the time tag is invalid (for example the clock is not synchronised).");
  if (summer) notes.push("SU bit set: summer (daylight saving) time.");
  if (b[2] & 0x40) notes.push("RES1 bit (minutes byte, bit 6) is set; some vendors use it as a 'genuine time' or substituted-time flag.");
  if (dow === 0) notes.push("Day of week 0: not used.");
  const bad: string[] = [];
  if (ms > 59999) bad.push("milliseconds above 59 999");
  if (minute > 59) bad.push("minute above 59");
  if (hour > 23) bad.push("hour above 23");
  if (day < 1 || day > 31) bad.push("day outside 1–31");
  if (month < 1 || month > 12) bad.push("month outside 1–12");
  const DOW = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  const text = `20${p(year)}-${p(month)}-${p(day)} ${p(hour)}:${p(minute)}:${p(Math.floor(ms / 1000))}.${p(ms % 1000, 3)}${dow ? ` (${DOW[dow]})` : ""}`;
  if (bad.length) notes.unshift(`Not a valid time: ${bad.join(", ")}.`);
  return { ok: !bad.length, text, ms, minute, hour, day, dow, month, year, invalid, summer, notes };
}

export function encodeCp56(d: { year: number; month: number; day: number; hour: number; minute: number; ms: number; dow?: number; invalid?: boolean; summer?: boolean }): string {
  const b = [d.ms & 0xff, (d.ms >> 8) & 0xff, (d.minute & 0x3f) | (d.invalid ? 0x80 : 0), (d.hour & 0x1f) | (d.summer ? 0x80 : 0), (d.day & 0x1f) | ((d.dow ?? 0) << 5), d.month & 0x0f, d.year % 100];
  return b.map((x) => x.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}

// ------------------------------------------------------------ quality descriptors

export type IecQualityKind = "QDS" | "SIQ" | "DIQ";

export function decode104Quality(kind: IecQualityKind, byte: number): { flags: { name: string; set: boolean; meaning: string }[]; value: string | null; summary: string } {
  const f = (bit: number) => !!(byte & (1 << bit));
  const flags = [
    { name: "BL", set: f(4), meaning: "Blocked: the value is blocked for transmission and frozen at its last value." },
    { name: "SB", set: f(5), meaning: "Substituted: the value was set by an operator or an automatic source, not measured." },
    { name: "NT", set: f(6), meaning: "Not topical: the value was not updated successfully in the last refresh period." },
    { name: "IV", set: f(7), meaning: "Invalid: the value is incorrect (acquisition failure); do not use it." },
  ];
  let value: string | null = null;
  if (kind === "QDS") flags.unshift({ name: "OV", set: f(0), meaning: "Overflow: the value is outside its predefined range." });
  if (kind === "SIQ") value = f(0) ? "SPI = 1 (ON)" : "SPI = 0 (OFF)";
  if (kind === "DIQ") value = ["DPI = 0 (indeterminate or intermediate)", "DPI = 1 (OFF)", "DPI = 2 (ON)", "DPI = 3 (indeterminate)"][byte & 3];
  const set = flags.filter((x) => x.set).map((x) => x.name);
  return { flags, value, summary: set.length ? `Flags set: ${set.join(", ")}` : "Good: no quality flags set" };
}

export const Q61850 = [
  "validity (bit 0)",
  "validity (bit 1)",
  "overflow",
  "outOfRange",
  "badReference",
  "oscillatory",
  "failure",
  "oldData",
  "inconsistent",
  "inaccurate",
  "source = substituted",
  "test",
  "operatorBlocked",
];

/** IEC 61850 quality: 13-bit BIT STRING. Input either the bits 0..12 as "0100…" or the 2-byte hex as Wireshark shows it (bit 0 = most significant bit of the first byte). */
export function decode61850Quality(input: string): { bits: boolean[]; validity: string; set: string[] } | null {
  const t = String(input || "").trim();
  let bits: boolean[];
  if (/^[01]{13}$/.test(t)) bits = t.split("").map((c) => c === "1");
  else {
    const h = t.replace(/0x/gi, "").replace(/[^0-9a-f]/gi, "");
    if (h.length !== 4) return null;
    const v = parseInt(h, 16);
    bits = Array.from({ length: 13 }, (_, i) => !!(v & (1 << (15 - i))));
  }
  const validity = !bits[0] && !bits[1] ? "good" : !bits[0] && bits[1] ? "invalid" : bits[0] && !bits[1] ? "reserved" : "questionable";
  const set = Q61850.slice(2).filter((_, i) => bits[i + 2]);
  return { bits, validity, set };
}
