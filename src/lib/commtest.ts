// Commissioning test manager: turns a signal list into FAT / SAT point-to-point
// test steps by signal kind, records results, links evidence from an IEC 104
// capture, and produces progress figures, a punch list and the test report.

export type Kind = "single" | "double" | "analog" | "counter" | "command" | "setpoint";
export interface Point { id: string; device: string; name: string; desc: string; kind: Kind; ca: number | null; ioa: number | null; unit: string; lo: number | null; hi: number | null }
export type Res = "" | "pass" | "fail" | "na";
export interface Step { id: string; pid: string; text: string; expect: string; res: Res; value: string; remark: string; by: string; date: string; evidence: string }
export interface Project { format: "AJapps commissioning tests"; name: string; stage: "FAT" | "SAT"; level: string; points: Point[]; steps: Step[]; witnesses: string }

const split = (l: string, d: string) => { const o: string[] = []; let c = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === d) { o.push(c.trim()); c = ""; } else c += ch; } o.push(c.trim()); return o; };
const kindOf = (t: string): Kind | null => {
  const x = t.toLowerCase();
  if (/c_s[ec]|set ?point|apc|analog output|g41/.test(x)) return "setpoint";
  if (/c_[sdr]c|command|control|spc|dpc|crob|g12|cmd|coil/.test(x)) return "command";
  if (/m_dp|double|dps|dbi|g3|g4\b/.test(x)) return "double";
  if (/m_it|counter|bcr|integrated|g20|g22/.test(x)) return "counter";
  if (/m_me|analog|measur|float|mv|cmv|wye|ins|ens|scaled|g30|g32|register|input reg/.test(x)) return "analog";
  if (/m_sp|single|sps|act|acd|binary|bool|digital|g1\b|g2\b|status|discrete/.test(x)) return "single";
  return null;
};

export function parsePointList(text: string): { points: Point[]; errs: string[] } {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { points: [], errs: ["The list needs a heading line and rows."] };
  const d = [",", ";", "\t"].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const h = split(lines[0], d), ci = (re: RegExp, not?: RegExp) => h.findIndex((x) => re.test(x) && !(not && not.test(x)));
  const cName = ci(/^(tag|point|signal|name|reference|61850 reference|point name|tag name)$/i), cDev = ci(/^(device|ied|rtu|station|source)$/i), cDesc = ci(/desc/i), cType = ci(/^(iec104 type|type|kind|data type|signal type|cdc|iec 104 type)$/i), cTid = ci(/iec104 type id|type id/i), cCa = ci(/^(ca|common address)$/i), cIoa = ci(/^(ioa|information object address|address)$/i), cUnit = ci(/^(unit|units|eu)$/i), cLo = ci(/^(eu ?lo|range ?min|min|lo range)$/i), cHi = ci(/^(eu ?hi|range ?max|max|hi range)$/i), cCdc = ci(/^cdc$/i);
  const errs: string[] = [], points: Point[] = [];
  if (cName < 0 && cDesc < 0) errs.push(`No name / tag / reference column (columns: ${h.join(", ")}).`);
  lines.slice(1).forEach((l, i) => {
    const r = split(l, d), g = (c: number) => (c >= 0 ? r[c] ?? "" : "");
    const t = `${g(cType)} ${g(cTid) ? "id" + g(cTid) : ""} ${g(cCdc)}`;
    let kind = kindOf(t);
    const tid = Number(g(cTid) || g(cType));
    if (!kind && Number.isFinite(tid) && tid > 0) kind = [1, 30].includes(tid) ? "single" : [3, 31].includes(tid) ? "double" : [15, 37].includes(tid) ? "counter" : [45, 46, 47, 58, 59, 60].includes(tid) ? "command" : [48, 49, 50, 61, 62, 63].includes(tid) ? "setpoint" : "analog";
    if (!kind) { errs.push(`Line ${i + 2}: type "${t.trim()}" not recognised; taken as single point.`); kind = "single"; }
    const n = (x: string) => (x.trim() === "" || !Number.isFinite(Number(x)) ? null : Number(x));
    points.push({ id: `p${i + 1}`, device: g(cDev), name: g(cName) || g(cDesc), desc: g(cDesc), kind, ca: n(g(cCa)), ioa: n(g(cIoa)), unit: g(cUnit), lo: n(g(cLo)), hi: n(g(cHi)) });
  });
  return { points, errs };
}

export function stepsFor(p: Point, stage: "FAT" | "SAT"): Omit<Step, "res" | "value" | "remark" | "by" | "date" | "evidence">[] {
  const where = stage === "FAT" ? "the gateway / SCADA test client" : "the control centre and the station HMI";
  const S = (k: string, text: string, expect: string) => ({ id: `${p.id}-${k}`, pid: p.id, text, expect });
  const r = p.lo !== null && p.hi !== null ? [p.lo, p.lo + (p.hi - p.lo) / 2, p.hi] : null;
  switch (p.kind) {
    case "single": return [S("on", `Set ${p.name} to ON at the source (contact, IED or simulation)`, `ON at ${where}, with the correct text and a time stamp from the IED`), S("off", `Return ${p.name} to OFF`, `OFF at ${where}`), S("q", `Make the source invalid (disconnect the IED or force quality invalid)`, `Point shown invalid / not topical, not as a valid OFF`)];
    case "double": return [S("cl", `Close ${p.name} (or simulate 10)`, `CLOSED at ${where}, time-stamped by the IED`), S("op", `Open ${p.name} (or simulate 01)`, `OPEN at ${where}`), S("int", `Simulate intermediate (00) and bad (11) positions`, `Shown as intermediate / faulty, with an alarm after the configured delay`)];
    case "analog": return [S("v", `Inject ${r ? r.map((x) => `${+x.toPrecision(4)}${p.unit ? " " + p.unit : ""}`).join(", ") : "0 %, 50 % and 100 % of range"} at the source`, `Values at ${where} within the stated accuracy, correct unit and scaling`), S("lim", `Cross each alarm limit up and down`, `Limit alarms appear and clear at the configured values (deadband respected)`), S("q", `Make the source invalid`, `Value shown invalid, not frozen at the last value`)];
    case "counter": return [S("cnt", `Generate pulses / energy at the source and freeze the counter`, `Counter increases by the expected amount at ${where}`), S("rst", `Check rollover and reset behaviour`, `As specified`)];
    case "command": return [S("se", `Select and execute ${p.name} ON / CLOSE from ${where}`, `Device operates, positive confirmation, position feedback changes, command termination received`), S("off", `Select and execute OFF / OPEN`, `Device operates and feedback changes`), S("blk", `Command with the interlocking not fulfilled, or in local mode`, `Command refused with a negative confirmation; nothing operates`)];
    case "setpoint": return [S("sp", `Send set point values (minimum, typical, maximum) to ${p.name}`, `Device accepts and reports the new value`), S("rng", `Send a value outside the range`, `Refused with a negative confirmation`)];
  }
}

export function newProject(name: string, stage: "FAT" | "SAT", points: Point[]): Project {
  const steps = points.flatMap((p) => stepsFor(p, stage).map((s) => ({ ...s, res: "" as Res, value: "", remark: "", by: "", date: "", evidence: "" })));
  return { format: "AJapps commissioning tests", name, stage, level: stage === "FAT" ? "Device → gateway (point-to-point)" : "Device → control centre (end-to-end)", points, steps, witnesses: "" };
}

export function progress(P: Project) {
  const by = (pred: (s: Step) => boolean) => P.steps.filter(pred).length;
  const total = P.steps.length, pass = by((s) => s.res === "pass"), fail = by((s) => s.res === "fail"), na = by((s) => s.res === "na"), open = total - pass - fail - na;
  const devices = [...new Set(P.points.map((p) => p.device || "(no device)"))].map((d) => {
    const ids = new Set(P.points.filter((p) => (p.device || "(no device)") === d).map((p) => p.id)), st = P.steps.filter((s) => ids.has(s.pid));
    return { device: d, total: st.length, done: st.filter((s) => s.res).length, fail: st.filter((s) => s.res === "fail").length };
  });
  const pointsDone = P.points.filter((p) => P.steps.filter((s) => s.pid === p.id).every((s) => s.res === "pass" || s.res === "na")).length;
  return { total, pass, fail, na, open, pct: total ? (100 * (pass + fail + na)) / total : 0, devices, pointsDone };
}

/** Evidence from an IEC 104 point list observed in a capture: CA/IOA → values seen. */
export function linkEvidence(P: Project, seen: { ca: number; ioa: number; values: string[]; cots: string[] }[], source: string): { linked: number; notSeen: Point[]; unknown: { ca: number; ioa: number }[] } {
  let linked = 0;
  const notSeen: Point[] = [];
  for (const p of P.points) {
    if (p.ioa === null) continue;
    const s = seen.find((x) => x.ioa === p.ioa && (p.ca === null || x.ca === p.ca));
    if (!s) { notSeen.push(p); continue; }
    linked++;
    for (const st of P.steps.filter((x) => x.pid === p.id)) {
      const vals = s.values.join(", ");
      const ok = st.id.endsWith("-on") ? s.values.some((v) => /^ON/.test(v)) : st.id.endsWith("-off") ? s.values.some((v) => /^OFF/.test(v)) : st.id.endsWith("-cl") ? s.values.some((v) => /ON \(10\)/.test(v)) : st.id.endsWith("-op") ? s.values.some((v) => /OFF \(01\)/.test(v)) : st.id.endsWith("-se") ? s.cots.some((c) => /confirmation/.test(c)) : st.id.endsWith("-v") ? s.values.length > 0 : false;
      if (ok) st.evidence = `${source}: CA ${s.ca} IOA ${s.ioa} seen with ${vals.slice(0, 80)}`;
    }
  }
  const unknown = seen.filter((x) => !P.points.some((p) => p.ioa === x.ioa && (p.ca === null || p.ca === x.ca))).map((x) => ({ ca: x.ca, ioa: x.ioa }));
  return { linked, notSeen, unknown };
}

export function punchList(P: Project) {
  return P.steps.filter((s) => s.res === "fail").map((s) => { const p = P.points.find((x) => x.id === s.pid)!; return { device: p.device, point: p.name, step: s.text, expect: s.expect, remark: s.remark, by: s.by, date: s.date }; });
}

export function resultsCsv(P: Project): string {
  const e = (v: string | number | null) => { const t = String(v ?? ""); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  return ["Device,Point,Description,Kind,CA,IOA,Step,Expected,Result,Measured / observed,Remark,Tested by,Date,Evidence", ...P.steps.map((s) => { const p = P.points.find((x) => x.id === s.pid)!; return [p.device, p.name, p.desc, p.kind, p.ca, p.ioa, s.text, s.expect, s.res || "open", s.value, s.remark, s.by, s.date, s.evidence].map(e).join(","); })].join("\r\n");
}
