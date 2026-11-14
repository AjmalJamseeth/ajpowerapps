// SCADA tag database validator: checks a tag / point list exported from a SCADA,
// gateway or RTU configuration (CSV or a copy from Excel) for duplicate names and
// addresses, missing descriptions and units, engineering ranges, alarm-limit
// order, Modbus and IEC 104 addressing, naming conventions and copy errors.

import { parseTable } from "./changecompare";
import { parseNotation } from "./scadaconvert";

export type Sev = "error" | "warning" | "info";
export interface TagFinding {
  sev: Sev;
  code: string;
  rows: number[]; // 1-based line numbers (header = line 1)
  text: string;
}

const COLS: [string, RegExp][] = [
  ["tag", /^(tag|tag ?name|point ?name|name|signal ?name|object ?name)$/i],
  ["desc", /^(description|desc|text|signal ?text|comment)$/i],
  ["device", /^(device|rtu|ied|station|connection|channel|node|source)$/i],
  ["protocol", /^(protocol|driver)$/i],
  ["address", /^(address|addr|register|ioa|object ?address|point ?address|offset)$/i],
  ["casdu", /^(casdu|ca|common ?address|asdu ?address|link ?address)$/i],
  ["type", /^(type|data ?type|point ?type|signal ?type|object ?type|kind)$/i],
  ["unit", /^(unit|units|eng ?unit|eu)$/i],
  ["euLo", /^(eu ?lo(w)?|range ?min|min|low ?range|eng ?min|scale ?min)$/i],
  ["euHi", /^(eu ?hi(gh)?|range ?max|max|high ?range|eng ?max|scale ?max)$/i],
  ["lolo", /^(lolo|low ?low|ll|alarm ?lolo)$/i],
  ["lo", /^(lo|low|l|alarm ?lo)$/i],
  ["hi", /^(hi|high|h|alarm ?hi)$/i],
  ["hihi", /^(hihi|high ?high|hh|alarm ?hihi)$/i],
  ["normal", /^(normal ?state|normal|nominal ?state)$/i],
  ["deadband", /^(deadband|db|dead ?band)$/i],
];

export interface TagResult {
  columns: Record<string, number>;
  headers: string[];
  rowCount: number;
  analog: number;
  digital: number;
  findings: TagFinding[];
  counts: Record<Sev, number>;
}

const isAnalog = (t: string) => /analog|^ai$|^ao$|float|real|int(eger)?|meas|^mv$|^me_|scaled|normali[sz]ed|register|word|counter/i.test(t);
const isDigital = (t: string) => /digital|^di$|^do$|bool|status|^sp$|^dp$|single|double|coil|discrete|bit|binary|indication|command/i.test(t);

export function validateTags(text: string, opts: { naming?: string } = {}): TagResult {
  const { headers, rows } = parseTable(text);
  const columns: Record<string, number> = {};
  for (const [k, re] of COLS) {
    const i = headers.findIndex((h, j) => re.test(h.trim()) && !Object.values(columns).includes(j));
    if (i >= 0) columns[k] = i;
  }
  const F: TagFinding[] = [];
  const add = (sev: Sev, code: string, r: number[], t: string) => F.push({ sev, code, rows: r, text: t });
  const g = (r: string[], k: string) => (columns[k] != null ? String(r[columns[k]] ?? "").trim() : "");
  const num = (v: string) => (v === "" ? NaN : Number(v.replace(",", ".")));
  if (columns.tag == null) add("error", "COL", [1], `No tag name column found (columns: ${headers.join(", ")}). Name one "Tag".`);
  let re: RegExp | null = null;
  if (opts.naming?.trim()) {
    try {
      re = new RegExp(opts.naming.trim());
    } catch {
      add("warning", "NAMING", [1], "The naming rule is not a valid regular expression.");
    }
  }
  const byTag = new Map<string, number[]>(), byAddr = new Map<string, number[]>(), byDesc = new Map<string, number[]>();
  const addrLabel = new Map<string, string>();
  const unitSpell = new Map<string, Set<string>>();
  let analog = 0, digital = 0;
  rows.forEach((r, i) => {
    const line = i + 2;
    const tag = g(r, "tag"), desc = g(r, "desc"), type = g(r, "type"), unit = g(r, "unit"), dev = g(r, "device"), addr = g(r, "address"), proto = g(r, "protocol");
    if (!r.some((c) => String(c).trim())) return;
    if (!tag) add("error", "TAG-EMPTY", [line], "Row without a tag name.");
    else byTag.set(tag.toLowerCase(), [...(byTag.get(tag.toLowerCase()) ?? []), line]);
    if (tag && re && !re.test(tag)) add("warning", "NAMING", [line], `${tag} does not follow the naming rule ${opts.naming}.`);
    if (tag && /\s/.test(tag)) add("warning", "TAG-SPACE", [line], `${tag} contains a space; many SCADA systems and gateways reject or mangle it.`);
    if (!desc) add("warning", "DESC-EMPTY", [line], `${tag || "(no name)"}: no description — operators see an empty text in alarms and lists.`);
    else byDesc.set(desc.toLowerCase(), [...(byDesc.get(desc.toLowerCase()) ?? []), line]);
    const an = type ? isAnalog(type) && !isDigital(type) : columns.euHi != null && g(r, "euHi") !== "";
    const di = type ? isDigital(type) : false;
    if (an) analog++;
    if (di) digital++;
    if (addr) {
      const key = `${dev}|${g(r, "casdu")}|${proto}|${/coil|discrete|^di|^do/i.test(type) ? "bit" : "word"}|${addr}`.toLowerCase();
      byAddr.set(key, [...(byAddr.get(key) ?? []), line]);
      if (!addrLabel.has(key)) addrLabel.set(key, `${addr}${dev ? ` on ${dev}` : ""}${g(r, "casdu") ? ` (common address ${g(r, "casdu")})` : ""}${proto ? ` [${proto}]` : ""}`);
    } else if (columns.address != null) add("error", "ADDR-EMPTY", [line], `${tag}: no address.`);
    // protocol-specific addressing
    if (addr && (/modbus/i.test(proto) || /^[0134]\d{4,5}$/.test(addr))) {
      const n = parseNotation(addr);
      if (n) {
        if (an && (n.table === "coil" || n.table === "input")) add("error", "MODBUS-TYPE", [line], `${tag}: analog value at ${addr} (${n.table === "coil" ? "coil" : "discrete input"} table). Analog values live in holding (4xxxx) or input (3xxxx) registers.`);
        if (di && /coil|discrete/i.test(type) && (n.table === "holding" || n.table === "inreg")) add("warning", "MODBUS-TYPE", [line], `${tag}: ${type} at register ${addr}. Check whether the device packs the bit in a register (then also record the bit number).`);
      }
    }
    if (addr && /104|iec ?60870|101/i.test(proto)) {
      const ioa = Number(addr);
      if (!Number.isInteger(ioa) || ioa < 1 || ioa > 16777215) add("error", "IOA-RANGE", [line], `${tag}: IOA ${addr} is outside 1–16 777 215 (3-octet information object address).`);
    }
    if (an) {
      if (!unit && columns.unit != null) add("warning", "UNIT-EMPTY", [line], `${tag}: analog value without a unit.`);
      if (unit) {
        const k = unit.toLowerCase();
        unitSpell.set(k, (unitSpell.get(k) ?? new Set()).add(unit));
      }
      const lo = num(g(r, "euLo")), hi = num(g(r, "euHi"));
      if (Number.isFinite(lo) && Number.isFinite(hi) && lo >= hi) add("error", "RANGE", [line], `${tag}: engineering range low ${lo} is not below high ${hi}.`);
      const L = { lolo: num(g(r, "lolo")), lo: num(g(r, "lo")), hi: num(g(r, "hi")), hihi: num(g(r, "hihi")) };
      const seq = (["lolo", "lo", "hi", "hihi"] as const).filter((k) => Number.isFinite(L[k]));
      for (let k = 0; k + 1 < seq.length; k++) if (L[seq[k]] > L[seq[k + 1]] || (seq[k] === "lo" && seq[k + 1] === "hi" && L.lo >= L.hi)) add("error", "LIMITS", [line], `${tag}: alarm limits out of order (${seq.map((x) => `${x.toUpperCase()} ${L[x]}`).join(", ")}). Expected LoLo ≤ Lo < Hi ≤ HiHi.`);
      if (Number.isFinite(lo) && Number.isFinite(hi)) for (const k of seq) if (L[k] < lo || L[k] > hi) add("warning", "LIMIT-RANGE", [line], `${tag}: ${k.toUpperCase()} ${L[k]} is outside the engineering range ${lo}–${hi}, so it can never be reached.`);
      const db = num(g(r, "deadband"));
      if (Number.isFinite(db) && Number.isFinite(lo) && Number.isFinite(hi) && db > 0.1 * (hi - lo)) add("info", "DEADBAND", [line], `${tag}: deadband ${db} is more than 10 % of the range; small changes will not be reported.`);
    }
    if (di && columns.normal != null && !g(r, "normal") && /alarm|trip|fail|fault/i.test(`${tag} ${desc}`)) add("info", "NORMAL-EMPTY", [line], `${tag}: alarm or trip signal without a normal state; the SCADA cannot tell which state is abnormal.`);
  });
  for (const [t, ls] of byTag) if (ls.length > 1) add("error", "TAG-DUP", ls, `Tag ${rows[ls[0] - 2][columns.tag]} appears ${ls.length} times.`);
  for (const [k, ls] of byAddr) if (ls.length > 1) {
    add("error", "ADDR-DUP", ls, `Address ${addrLabel.get(k)} is used by ${ls.length} tags: ${ls.map((l) => rows[l - 2][columns.tag]).join(", ")}. One will overwrite or hide the other.`);
  }
  for (const [d, ls] of byDesc) if (ls.length > 1) add("info", "DESC-DUP", ls, `Same description on ${ls.length} tags (${ls.map((l) => rows[l - 2][columns.tag]).join(", ")}): "${rows[ls[0] - 2][columns.desc]}". Often a copied row that was not edited.`);
  for (const [, sp] of unitSpell) if (sp.size > 1) add("warning", "UNIT-SPELL", [], `The same unit is written differently: ${[...sp].join(", ")}. Use one spelling (kV, MW, A) so reports and trends group correctly.`);
  const counts: Record<Sev, number> = { error: 0, warning: 0, info: 0 };
  for (const f of F) counts[f.sev]++;
  return { columns, headers, rowCount: rows.length, analog, digital, findings: F, counts };
}
