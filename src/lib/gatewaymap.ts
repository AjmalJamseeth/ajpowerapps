// Gateway / protocol mapping builder: reads an SCD, collects the signals each
// IED reports to the gateway (data sets of its report control blocks) and its
// controllable objects, and allocates IEC 60870-5-104 information objects,
// Modbus registers and DNP3 points by stated rules — then checks the mapping
// and compares it with the point list exported from the gateway tool.

/* ------------------------------------------------------------ tiny XML tree */
export interface XEl { name: string; attrs: Record<string, string>; kids: XEl[]; text: string; parent?: XEl }
const ent = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
export function parseXml(src: string): XEl {
  const root: XEl = { name: "#root", attrs: {}, kids: [], text: "" };
  let cur = root;
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<!DOCTYPE[^>]*>|<\/([\w:.-]+)\s*>|<([\w:.-]+)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m[2]) { if (cur.parent) cur = cur.parent; }
    else if (m[3]) {
      const attrs: Record<string, string> = {};
      for (const a of m[4].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1].replace(/^\w+:/, "")] = ent(a[2] ?? a[3] ?? "");
      const el: XEl = { name: m[3].replace(/^\w+:/, ""), attrs, kids: [], text: "", parent: cur };
      cur.kids.push(el);
      if (!m[5]) cur = el;
    } else if (m[6]) cur.text += ent(m[6]);
    else if (m[1]) cur.text += m[1];
  }
  return root;
}
export const kids = (e: XEl | undefined, n: string) => (e ? e.kids.filter((k) => k.name === n) : []);
export const kid = (e: XEl | undefined, n: string) => kids(e, n)[0];
export function all(e: XEl, n: string, out: XEl[] = []): XEl[] { for (const k of e.kids) { if (k.name === n) out.push(k); all(k, n, out); } return out; }

/* ------------------------------------------------------------ signals */
export type Kind = "single" | "double" | "measured" | "integer" | "counter" | "cmd-single" | "cmd-double" | "cmd-setpoint" | "cmd-step" | "cmd-integer";
export interface Signal {
  ied: string; ref: string; ld: string; ln: string; doName: string; da: string; fc: string; cdc: string; kind: Kind;
  desc: string; source: string; // data set or "control"
  ctlModel?: string;
}
const KIND: Record<string, Kind> = { SPS: "single", ACT: "single", ACD: "single", SPC: "single", DPS: "double", DPC: "double", MV: "measured", CMV: "measured", WYE: "measured", DEL: "measured", APC: "measured", SAV: "measured", INS: "integer", ENS: "integer", INC: "integer", ENC: "integer", BSC: "integer", ISC: "integer", BCR: "counter" };
const CMD: Record<string, Kind> = { SPC: "cmd-single", DPC: "cmd-double", APC: "cmd-setpoint", BSC: "cmd-step", INC: "cmd-integer", ENC: "cmd-integer", ISC: "cmd-step" };

export interface SclModel { ieds: string[]; signals: Signal[]; issues: { sev: "error" | "warning" | "info"; text: string }[] }

export function extractSignals(scd: string, gateway = ""): SclModel {
  const R = parseXml(scd), scl = kid(R, "SCL");
  if (!scl) throw new Error("Not an SCL file (no <SCL> root).");
  const T = kid(scl, "DataTypeTemplates");
  const lnT = new Map<string, XEl>(), doT = new Map<string, XEl>();
  for (const e of kids(T, "LNodeType")) lnT.set(e.attrs.id, e);
  for (const e of kids(T, "DOType")) doT.set(e.attrs.id, e);
  const issues: SclModel["issues"] = [], signals: Signal[] = [];
  const ieds = kids(scl, "IED");
  const lnKey = (ld: string, pre: string, cls: string, inst: string) => `${ld}/${pre}${cls}${inst}`;
  for (const ied of ieds) {
    const name = ied.attrs.name;
    const lns = new Map<string, XEl>();
    for (const ld of all(ied, "LDevice")) for (const ln of [...kids(ld, "LN0"), ...kids(ld, "LN")]) lns.set(lnKey(ld.attrs.inst, ln.attrs.prefix ?? "", ln.attrs.lnClass, ln.attrs.inst ?? ""), ln);
    const doType = (ln: XEl | undefined, doName: string): XEl | undefined => {
      if (!ln) return undefined;
      const lt = lnT.get(ln.attrs.lnType);
      const [d0, ...sub] = doName.split(".");
      let t = doT.get(kids(lt, "DO").find((d) => d.attrs.name === d0)?.attrs.type ?? "");
      for (const s of sub) t = doT.get(kids(t, "SDO").find((d) => d.attrs.name === s)?.attrs.type ?? "");
      return t;
    };
    const descOf = (ln: XEl | undefined, doName: string) => {
      const doi = kids(ln, "DOI").find((d) => d.attrs.name === doName.split(".")[0]);
      const du = doi ? all(doi, "DAI").find((a) => a.attrs.name === "dU") : undefined;
      return (du && kid(du, "Val")?.text.trim()) || doi?.attrs.desc || [ied.attrs.desc && ln?.attrs.desc ? ln.attrs.desc : ln?.attrs.desc].filter(Boolean).join("") || "";
    };
    // data sets used by report control blocks (what the IED reports)
    for (const ld of all(ied, "LDevice")) for (const ln0 of [...kids(ld, "LN0"), ...kids(ld, "LN")]) {
      for (const rc of kids(ln0, "ReportControl")) {
        const clients = all(rc, "ClientLN").map((c) => c.attrs.iedName);
        if (gateway && clients.length && !clients.includes(gateway)) continue;
        const ds = kids(ln0, "DataSet").find((d) => d.attrs.name === rc.attrs.datSet);
        if (!ds) { issues.push({ sev: "error", text: `${name}: report ${rc.attrs.name} refers to data set ${rc.attrs.datSet}, which does not exist.` }); continue; }
        if (gateway && !clients.length) issues.push({ sev: "info", text: `${name}/${ld.attrs.inst} report ${rc.attrs.name} has no ClientLN; it is included, but the gateway is not configured as its client in the SCD.` });
        for (const f of kids(ds, "FCDA")) {
          const a = f.attrs, ldI = a.ldInst, ln = lns.get(lnKey(ldI, a.prefix ?? "", a.lnClass, a.lnInst ?? ""));
          const ref = `${name}${ldI}/${a.prefix ?? ""}${a.lnClass}${a.lnInst ?? ""}.${a.doName ?? ""}${a.daName ? "." + a.daName : ""}`;
          if (!a.doName) { issues.push({ sev: "warning", text: `${ref}: data set member without doName is not mapped.` }); continue; }
          if (a.daName && /^(q|t)$/.test(a.daName.split(".").pop()!)) continue; // quality / time carried with the value
          const t = doType(ln, a.doName);
          if (!ln || !t) { issues.push({ sev: "warning", text: `${ref} (data set ${ds.attrs.name}) cannot be resolved in the data type templates; it is not mapped.` }); continue; }
          let cdc = t.attrs.cdc;
          const kind = KIND[cdc];
          if (!kind) { issues.push({ sev: "info", text: `${ref}: CDC ${cdc} has no standard telecontrol mapping; map it by hand if needed.` }); continue; }
          if (signals.some((s) => s.ref === ref)) continue;
          signals.push({ ied: name, ref, ld: ldI, ln: `${a.prefix ?? ""}${a.lnClass}${a.lnInst ?? ""}`, doName: a.doName, da: a.daName ?? "", fc: a.fc, cdc, kind, desc: descOf(ln, a.doName), source: `${ld.attrs.inst}/${ds.attrs.name} (${rc.attrs.name})` });
          cdc = cdc;
        }
      }
    }
    // controllable objects
    for (const [key, ln] of lns) {
      const lt = lnT.get(ln.attrs.lnType);
      for (const d of kids(lt, "DO")) {
        const t = doT.get(d.attrs.type ?? ""), cdc = t?.attrs.cdc ?? "";
        if (!CMD[cdc] || ln.attrs.lnClass === "LLN0" && d.attrs.name === "Mod") continue;
        const doi = kids(ln, "DOI").find((x) => x.attrs.name === d.attrs.name);
        const dai = doi ? kids(doi, "DAI").find((x) => x.attrs.name === "ctlModel") : undefined;
        const tdef = kids(t, "DA").find((x) => x.attrs.name === "ctlModel");
        const cm = (dai && kid(dai, "Val")?.text.trim()) || (tdef && kid(tdef, "Val")?.text.trim()) || "";
        if (!cm || /status-only|^0$/.test(cm)) continue;
        if (d.attrs.name === "Mod" || d.attrs.name === "Beh") continue;
        const [ldI] = key.split("/");
        signals.push({ ied: name, ref: `${name}${key}.${d.attrs.name}`, ld: ldI, ln: key.split("/")[1], doName: d.attrs.name, da: "Oper.ctlVal", fc: "CO", cdc, kind: CMD[cdc], desc: descOf(ln, d.attrs.name) || ln.attrs.desc || "", source: "control", ctlModel: cm });
      }
    }
  }
  return { ieds: ieds.map((i) => i.attrs.name), signals, issues };
}

/* ------------------------------------------------------------ allocation */
export interface MapRules {
  ca: number; iedBlock: number; iedStart: number; withTime: boolean;
  off: Record<"single" | "double" | "measured" | "integer" | "counter" | "command", number>;
  mbWordOrder: "ABCD" | "CDAB";
  dnpClassBin: number; dnpClassAna: number; dnpClassCnt: number;
}
export const DEFAULT_RULES: MapRules = { ca: 1, iedBlock: 1000, iedStart: 1000, withTime: true, off: { single: 1, double: 200, measured: 400, integer: 600, counter: 700, command: 800 }, mbWordOrder: "ABCD", dnpClassBin: 1, dnpClassAna: 2, dnpClassCnt: 3 };

export interface MapRow extends Signal {
  t104: number; t104name: string; ca: number; ioa: number;
  mbTable: string; mbAddr: number; mbCount: number; mbFormat: string;
  dnpGroup: string; dnpIndex: number; dnpClass: number | null;
}
const T104: Record<Kind, [number, number, string]> = {
  single: [1, 30, "single point"], double: [3, 31, "double point"], measured: [13, 36, "short float"], integer: [11, 35, "scaled value"], counter: [15, 37, "integrated total"],
  "cmd-single": [45, 58, "single command"], "cmd-double": [46, 59, "double command"], "cmd-setpoint": [50, 63, "set point, short float"], "cmd-step": [47, 60, "regulating step command"], "cmd-integer": [49, 62, "set point, scaled"],
};
const T104ID: Record<number, string> = { 1: "M_SP_NA_1", 3: "M_DP_NA_1", 11: "M_ME_NB_1", 13: "M_ME_NC_1", 15: "M_IT_NA_1", 30: "M_SP_TB_1", 31: "M_DP_TB_1", 35: "M_ME_TE_1", 36: "M_ME_TF_1", 37: "M_IT_TB_1", 45: "C_SC_NA_1", 46: "C_DC_NA_1", 47: "C_RC_NA_1", 49: "C_SE_NB_1", 50: "C_SE_NC_1", 58: "C_SC_TA_1", 59: "C_DC_TA_1", 60: "C_RC_TA_1", 62: "C_SE_TB_1", 63: "C_SE_TC_1" };
export const t104Id = (n: number) => T104ID[n] ?? String(n);

export function buildMap(sig: Signal[], r: MapRules = DEFAULT_RULES): MapRow[] {
  const ieds = [...new Set(sig.map((s) => s.ied))];
  const cnt: Record<string, number> = {};
  const mb = { coil: 0, discrete: 0, input: 0, holding: 0 }, dnp: Record<string, number> = {};
  return sig.map((s) => {
    const i = ieds.indexOf(s.ied), grp = s.kind.startsWith("cmd") ? "command" : (s.kind as keyof MapRules["off"]);
    const k = `${s.ied}|${grp}`; cnt[k] = (cnt[k] ?? 0);
    const ioa = r.iedStart + i * r.iedBlock + r.off[grp] + cnt[k]++;
    const tt = T104[s.kind], t104 = s.kind.startsWith("cmd") ? (r.withTime ? tt[1] : tt[0]) : r.withTime ? tt[1] : tt[0];
    let mbTable = "", mbAddr = 0, mbCount = 1, mbFormat = "";
    if (s.kind === "single") { mbTable = "discrete"; mbAddr = mb.discrete++; mbFormat = "bit"; }
    else if (s.kind === "double") { mbTable = "input"; mbAddr = mb.input++; mbFormat = "uint16: 0 intermediate, 1 off, 2 on, 3 bad"; }
    else if (s.kind === "measured") { mbTable = "input"; mbAddr = mb.input; mb.input += 2; mbCount = 2; mbFormat = `float32 ${r.mbWordOrder}`; }
    else if (s.kind === "integer") { mbTable = "input"; mbAddr = mb.input++; mbFormat = "int16"; }
    else if (s.kind === "counter") { mbTable = "input"; mbAddr = mb.input; mb.input += 2; mbCount = 2; mbFormat = `uint32 ${r.mbWordOrder}`; }
    else if (s.kind === "cmd-single") { mbTable = "coil"; mbAddr = mb.coil++; mbFormat = "write 1 = on"; }
    else if (s.kind === "cmd-double") { mbTable = "coil"; mbAddr = mb.coil; mb.coil += 2; mbCount = 2; mbFormat = "coil +0 open/off, +1 close/on (pulse)"; }
    else if (s.kind === "cmd-setpoint") { mbTable = "holding"; mbAddr = mb.holding; mb.holding += 2; mbCount = 2; mbFormat = `float32 ${r.mbWordOrder}`; }
    else { mbTable = "holding"; mbAddr = mb.holding++; mbFormat = "int16"; }
    const g = s.kind === "single" ? "g1 binary input" : s.kind === "double" ? "g3 double-bit input" : s.kind === "measured" ? "g30 analog input" : s.kind === "integer" ? "g30 analog input" : s.kind === "counter" ? "g20 counter" : s.kind === "cmd-setpoint" || s.kind === "cmd-integer" ? "g41 analog output" : "g12 CROB";
    const gk = g.split(" ")[0]; dnp[gk] = dnp[gk] ?? 0;
    const dnpClass = s.kind.startsWith("cmd") ? null : s.kind === "counter" ? r.dnpClassCnt : s.kind === "measured" || s.kind === "integer" ? r.dnpClassAna : r.dnpClassBin;
    return { ...s, t104, t104name: tt[2], ca: r.ca, ioa, mbTable, mbAddr, mbCount, mbFormat, dnpGroup: g, dnpIndex: dnp[gk]++, dnpClass };
  });
}

export interface MapFinding { sev: "error" | "warning" | "info" | "ok"; text: string }
export function checkMap(rows: MapRow[], r: MapRules = DEFAULT_RULES): MapFinding[] {
  const F: MapFinding[] = [];
  const by = new Map<string, MapRow[]>();
  for (const x of rows) { const k = `${x.ca}|${x.ioa}`; by.set(k, [...(by.get(k) ?? []), x]); }
  for (const [, xs] of by) if (xs.length > 1) F.push({ sev: "error", text: `IOA ${xs[0].ioa} is used by ${xs.length} signals (${xs.map((x) => x.ref).join(", ")}).` });
  for (const x of rows) if (x.ioa > 16777215 || x.ioa < 1) F.push({ sev: "error", text: `${x.ref}: IOA ${x.ioa} outside 1–16 777 215.` });
  const per = new Map<string, number>();
  for (const x of rows) { const g = x.kind.startsWith("cmd") ? "command" : x.kind; const k = `${x.ied}|${g}`; per.set(k, (per.get(k) ?? 0) + 1); }
  const offs = Object.entries(r.off).sort((a, b) => a[1] - b[1]);
  for (const [k, n] of per) { const g = k.split("|")[1] as keyof MapRules["off"], i = offs.findIndex((o) => o[0] === g), room = (i + 1 < offs.length ? offs[i + 1][1] : r.iedBlock) - r.off[g]; if (n > room) F.push({ sev: "error", text: `${k.split("|")[0]}: ${n} ${g} signals do not fit in the ${room} IOAs reserved for them; they run into the next range. Enlarge the range.` }); }
  for (const x of rows.filter((x) => x.kind === "cmd-double" || x.kind === "cmd-single")) {
    const fb = rows.find((y) => y.ied === x.ied && y.ld === x.ld && y.ln === x.ln && y.doName === x.doName && !y.kind.startsWith("cmd"));
    const anyPos = rows.find((y) => y.ied === x.ied && !y.kind.startsWith("cmd") && y.doName === x.doName && (y.kind === "double" || y.kind === "single"));
    if (!fb) F.push({ sev: anyPos ? "info" : "warning", text: `Command ${x.ref} (${x.ctlModel}) has no status point of the same object in the reported data sets${anyPos ? ` — position is reported from ${anyPos.ref}; confirm the operator display links the two` : ". Operators would control without seeing the result; add stVal to a reported data set"}.` });
  }
  const ctl = new Map<string, MapRow[]>();
  for (const x of rows.filter((x) => x.kind === "cmd-double")) { const k = `${x.ied}|${x.ld}`; ctl.set(k, [...(ctl.get(k) ?? []), x]); }
  for (const [, xs] of ctl) if (xs.some((x) => /^CSWI/.test(x.ln)) && xs.some((x) => /^XCBR|^XSWI/.test(x.ln))) F.push({ sev: "info", text: `${xs[0].ied}/${xs[0].ld}: both ${xs.find((x) => /^CSWI/.test(x.ln))!.ln}.Pos and ${xs.find((x) => /^X/.test(x.ln))!.ln}.Pos are controllable. Control normally goes through CSWI (interlocking and synchrocheck apply there); map only CSWI unless the project says otherwise.` });
  for (const x of rows.filter((x) => x.kind === "measured" && /phs[ABC]|\./.test(x.doName))) { void x; }
  if (!r.withTime && rows.some((x) => x.kind === "single" || x.kind === "double")) F.push({ sev: "warning", text: "IEC 104 types without time tag: the gateway time-stamps events when it sends them, not when the IED detected them; sequence-of-events accuracy is lost. Use M_SP_TB_1 / M_DP_TB_1." });
  if (rows.some((x) => x.mbTable)) F.push({ sev: "info", text: "Modbus carries no quality or time stamp: an invalid IED value looks like a good one. If Modbus is used, map the IED's communication status (or q.validity) to an extra register and alarm on it." });
  if (rows.some((x) => /^cmd/.test(x.kind) && /direct/.test(x.ctlModel ?? ""))) F.push({ sev: "info", text: `${rows.filter((x) => /^cmd/.test(x.kind) && /direct/.test(x.ctlModel ?? "")).map((x) => x.ref).join(", ")}: direct control in the IED; if the control centre uses select-before-operate (S/E bit), the gateway must handle the select itself.` });
  if (!F.some((f) => f.sev === "error" || f.sev === "warning")) F.push({ sev: "ok", text: `${rows.length} signals mapped without conflicts.` });
  return F;
}

export function mapCsv(rows: MapRow[]): string {
  const e = (v: string | number | null) => { const t = String(v ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  return ["IED,Reference,FC,CDC,Description,Source,IEC104 type,IEC104 type id,CA,IOA,Modbus table,Modbus address,Registers,Modbus format,DNP3 group,DNP3 index,DNP3 class,Control model",
    ...rows.map((x) => [x.ied, x.ref, x.fc, x.cdc, x.desc, x.source, t104Id(x.t104), x.t104, x.ca, x.ioa, x.mbTable, x.mbAddr, x.mbCount, x.mbFormat, x.dnpGroup, x.dnpIndex, x.dnpClass ?? "", x.ctlModel ?? ""].map(e).join(","))].join("\r\n");
}

/* ------------------------------------------------------------ compare with a gateway export */
export interface GwRow { ref: string; ca: number; ioa: number; type: number | null; line: number }
export function parseGatewayList(text: string): GwRow[] {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("The point list needs a heading line and rows.");
  const d = [";", "\t", ","].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const split = (l: string) => { const o: string[] = []; let c = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === d) { o.push(c.trim()); c = ""; } else c += ch; } o.push(c.trim()); return o; };
  const h = split(lines[0]);
  const ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const cr = ci(/ref|61850|source|object|signal/i), cio = ci(/^ioa$|information object|address/i), cca = ci(/^ca$|common address|asdu/i), ct = ci(/type/i);
  if (cr < 0 || cio < 0) throw new Error(`Columns not found: the list needs a 61850 reference column and an IOA column (found: ${h.join(", ")}).`);
  return lines.slice(1).map((l, i) => { const r = split(l), tv = ct >= 0 ? r[ct] : ""; const tn = /^\d+$/.test(tv) ? +tv : Object.entries(T104ID).find(([, id]) => id.toLowerCase() === tv.toLowerCase())?.[0]; return { ref: r[cr], ca: cca >= 0 ? +r[cca] || 0 : 0, ioa: +r[cio], type: tn !== undefined && tn !== "" ? +tn : null, line: i + 2 }; }).filter((x) => x.ref);
}
const normRef0 = (s: string) => s.replace(/\$/g, ".").replace(/\[(\w\w)\]/g, "").replace(/\.(stVal|general|mag\.f|cVal\.mag\.f|actVal|ctlVal|Oper\.ctlVal)$/i, "").replace(/\s+/g, "").toLowerCase();
const isCmdG = (g: GwRow) => (g.type !== null && g.type >= 45 && g.type < 70) || /oper|ctlval/i.test(g.ref);
export function compareGateway(rows: MapRow[], gw: GwRow[]): MapFinding[] {
  const F: MapFinding[] = [];
  const key = (ref: string, cmd: boolean) => normRef0(ref) + (cmd ? "#cmd" : "");
  const normRef = (x: MapRow) => key(x.ref, x.kind.startsWith("cmd"));
  const m = new Map(rows.map((x) => [normRef(x), x]));
  const seen = new Set<string>();
  const byIoa = new Map<string, GwRow[]>();
  for (const g of gw) { const k = `${g.ca}|${g.ioa}`; byIoa.set(k, [...(byIoa.get(k) ?? []), g]); }
  for (const [, gs] of byIoa) if (gs.length > 1) F.push({ sev: "error", text: `Gateway list: IOA ${gs[0].ioa} is given to ${gs.length} points (lines ${gs.map((g) => g.line).join(", ")}).` });
  for (const g of gw) {
    const x = m.get(key(g.ref, isCmdG(g)));
    if (!x) { F.push({ sev: "warning", text: `Gateway line ${g.line}: ${g.ref} (IOA ${g.ioa}) is not a reported or controllable signal in the SCD — wrong reference, or a data set member that was removed.` }); continue; }
    seen.add(normRef(x));
    if (g.ioa !== x.ioa) F.push({ sev: "warning", text: `${x.ref}: IOA ${g.ioa} in the gateway, ${x.ioa} in this mapping. Agree one address with the control centre's point list.` });
    if (g.type !== null && g.type !== x.t104 && !(Math.abs(g.type - x.t104) === 29 || [[1, 30], [3, 31], [13, 36], [11, 35], [15, 37], [45, 58], [46, 59], [50, 63]].some(([a, b]) => (a === g.type && b === x.t104) || (b === g.type && a === x.t104)))) F.push({ sev: "error", text: `${x.ref}: the gateway sends type ${t104Id(g.type)}, the signal is ${x.cdc} (${x.t104name}). The control centre will decode it wrongly.` });
    else if (g.type !== null && g.type !== x.t104) F.push({ sev: "info", text: `${x.ref}: type ${t104Id(g.type)} in the gateway, ${t104Id(x.t104)} in this mapping (same information, ${g.type < 30 || (g.type >= 45 && g.type < 58) ? "without" : "with"} time tag).` });
  }
  const miss = rows.filter((x) => !seen.has(normRef(x)));
  if (miss.length) F.push({ sev: "warning", text: `${miss.length} signal(s) of the SCD are not in the gateway list: ${miss.slice(0, 8).map((x) => x.ref).join(", ")}${miss.length > 8 ? " …" : ""}.` });
  if (!F.some((f) => f.sev !== "info")) F.push({ sev: "ok", text: `All ${gw.length} gateway points match the SCD.` });
  return F;
}
