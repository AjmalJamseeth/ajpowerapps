// Energy, demand and power quality file analysis: maximum demand and load
// factor from an interval load profile, and EN 50160 compliance from 10-minute
// power quality records (voltage, THD, flicker, unbalance, frequency).

import { parseTime } from "./timeline";

const split = (l: string, d: string) => l.split(d).map((x) => x.trim().replace(/^"|"$/g, ""));
function table(text: string) {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const d = [",", ";", "\t"].sort((a, b) => (lines[0] ?? "").split(b).length - (lines[0] ?? "").split(a).length)[0];
  return { h: split(lines[0] ?? "", d), rows: lines.slice(1).map((l) => split(l, d)) };
}
export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string }
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] : NaN; };

/* ------------------------------------------------------------ load profile */
export interface LoadResult {
  interval: number; points: number; days: number; energy: number; maxDemand: number; maxAt: number; avg: number; loadFactor: number; window: number;
  daily: { day: string; max: number; energy: number }[]; profile: number[]; peaks: { t: number; kw: number }[]; peakEnergy: number; offEnergy: number; findings: Finding[];
}
export function analyseLoad(text: string, windowMin = 30, peakFrom = 8, peakTo = 22): LoadResult | { err: string } {
  const { h, rows } = table(text), ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const ct = ci(/^(time|timestamp|date|date ?time|interval|period)/i), ckw = ci(/^(kw|demand|power|p|active power|load)(\s*\(kw\))?$/i), ckwh = ci(/kwh|energy/i);
  if (ct < 0 || (ckw < 0 && ckwh < 0)) return { err: `Columns needed: time and kW (or kWh per interval). Found: ${h.join(", ")}.` };
  const pts: { t: number; kw: number }[] = [];
  const raw = rows.map((r) => ({ t: parseTime(r[ct] ?? ""), v: Number((ckw >= 0 ? r[ckw] : r[ckwh]) ?? "") })).filter((x) => x.t !== null && Number.isFinite(x.v)) as { t: number; v: number }[];
  raw.sort((a, b) => a.t - b.t);
  if (raw.length < 3) return { err: "Fewer than three readings." };
  const dts = raw.slice(1).map((x, i) => x.t - raw[i].t).sort((a, b) => a - b), interval = dts[Math.floor(dts.length / 2)];
  const cum = ckw < 0 && raw.every((x, i) => i === 0 || x.v >= raw[i - 1].v) && raw[raw.length - 1].v > 10 * raw[0].v + 1;
  for (let i = 0; i < raw.length; i++) {
    if (ckw >= 0) pts.push({ t: raw[i].t, kw: raw[i].v });
    else if (cum) { if (i) pts.push({ t: raw[i].t, kw: ((raw[i].v - raw[i - 1].v) * 3600) / (raw[i].t - raw[i - 1].t) }); }
    else pts.push({ t: raw[i].t, kw: (raw[i].v * 3600) / interval });
  }
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const energy = pts.reduce((s, p) => s + (p.kw * interval) / 3600, 0);
  // demand over fixed windows aligned to the clock
  const win = windowMin * 60, blocks = new Map<number, { sum: number; n: number }>();
  for (const p of pts) { const b = Math.floor((p.t - interval) / win); const e = blocks.get(b) ?? { sum: 0, n: 0 }; e.sum += p.kw; e.n++; blocks.set(b, e); }
  const dem = [...blocks.entries()].map(([b, e]) => ({ t: (b + 1) * win, kw: e.sum / e.n })).sort((a, b) => b.kw - a.kw);
  const span = pts[pts.length - 1].t - pts[0].t + interval, days = span / 86400, avg = (energy * 3600) / span;
  const maxDemand = dem[0]?.kw ?? 0, maxAt = dem[0]?.t ?? 0;
  const dm = new Map<string, { max: number; energy: number }>();
  for (const p of pts) { const d = new Date((p.t - interval) * 1000).toISOString().slice(0, 10), e = dm.get(d) ?? { max: 0, energy: 0 }; e.max = Math.max(e.max, p.kw); e.energy += (p.kw * interval) / 3600; dm.set(d, e); }
  const prof = Array(24).fill(0), cnt = Array(24).fill(0);
  let pe = 0, oe = 0;
  for (const p of pts) { const hr = new Date((p.t - interval) * 1000).getUTCHours(); prof[hr] += p.kw; cnt[hr]++; const kwh = (p.kw * interval) / 3600; if (hr >= peakFrom && hr < peakTo) pe += kwh; else oe += kwh; }
  const lf = maxDemand ? avg / maxDemand : 0;
  add("info", `Maximum ${windowMin}-minute demand ${maxDemand.toFixed(0)} kW at ${new Date(maxAt * 1000).toISOString().slice(0, 16).replace("T", " ")}; average ${avg.toFixed(0)} kW; load factor ${(100 * lf).toFixed(0)} %.`);
  if (lf < 0.4) add("warning", `Low load factor (${(100 * lf).toFixed(0)} %): short peaks set the demand charge. Shifting or capping the few highest peaks lowers it.`);
  const top = dem.slice(0, 10), second = dem.find((x) => Math.abs(x.t - maxAt) > 86400);
  if (second && maxDemand > 1.15 * second.kw) add("info", `The maximum is ${((100 * (maxDemand - second.kw)) / second.kw).toFixed(0)} % above the highest peak on any other day — a single event sets the demand.`);
  const gaps = dts.filter((x) => x > 1.5 * interval).length;
  if (gaps) add("warning", `${gaps} gap(s) in the readings (missing intervals): energy and load factor are underestimated.`);
  return { interval, points: pts.length, days, energy, maxDemand, maxAt, avg, loadFactor: lf, window: windowMin, daily: [...dm.entries()].map(([day, e]) => ({ day, ...e })), profile: prof.map((s, i) => (cnt[i] ? s / cnt[i] : 0)), peaks: top, peakEnergy: pe, offEnergy: oe, findings: F };
}

/* ------------------------------------------------------------ EN 50160 */
export interface PqParam { name: string; limit: string; compliance: number | null; required: number; worst: string; pass: boolean | null }
export interface PqResult { n: number; days: number; params: PqParam[]; dips: { t: number; v: number; ph: string }[]; findings: Finding[] }
export function analysePq(text: string, vn: number, level: "LV" | "MV" = "MV", fn = 50): PqResult | { err: string } {
  const { h, rows } = table(text), ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const ct = ci(/^(time|timestamp|date)/i);
  const cv = [ci(/^(v1|va|u1|ua|v12|u12|vl1|ul1|v_?a|voltage ?(l1|a|1))/i), ci(/^(v2|vb|u2|ub|v23|u23|vl2|ul2|v_?b|voltage ?(l2|b|2))/i), ci(/^(v3|vc|u3|uc|v31|u31|vl3|ul3|v_?c|voltage ?(l3|c|3))/i)].filter((x) => x >= 0);
  if (!cv.length) { const c = ci(/^(v|u|voltage|vrms)/i); if (c >= 0) cv.push(c); }
  const cthd = ci(/thd/i), cplt = ci(/plt/i), cpst = ci(/pst/i), cunb = ci(/unb|imbal|u2\/u1|negative/i), cf = ci(/^(f|freq|frequency)/i);
  if (ct < 0 || !cv.length) return { err: `Columns needed: time and voltage (V1/V2/V3 or V); optional THD, Pst, Plt, unbalance, frequency. Found: ${h.join(", ")}.` };
  const R = rows.map((r) => ({ t: parseTime(r[ct] ?? "") ?? NaN, v: cv.map((c) => Number(r[c])), thd: Number(r[cthd]), plt: Number(r[cplt]), pst: Number(r[cpst]), unb: Number(r[cunb]), f: Number(r[cf]) })).filter((x) => Number.isFinite(x.t));
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const params: PqParam[] = [];
  const share = (xs: number[], ok: (x: number) => boolean) => { const v = xs.filter(Number.isFinite); return v.length ? (100 * v.filter(ok).length) / v.length : null; };
  const vs = R.flatMap((r) => r.v.filter(Number.isFinite).map((x) => x / vn));
  const need = level === "LV" ? 95 : 99;
  const c95 = share(vs, (x) => x >= 0.9 && x <= 1.1), c100 = share(vs, (x) => x >= 0.85 && x <= 1.1);
  params.push({ name: "Supply voltage variation (10-min mean)", limit: `Un ± 10 % for ${need} % of the week (${level})`, compliance: c95, required: need, worst: vs.length ? `${(100 * Math.min(...vs)).toFixed(1)} – ${(100 * Math.max(...vs)).toFixed(1)} % of Un` : "—", pass: c95 === null ? null : c95 >= need });
  params.push({ name: "Supply voltage variation, all values", limit: "Un + 10 % / − 15 % for 100 %", compliance: c100, required: 100, worst: "", pass: c100 === null ? null : c100 >= 100 });
  const thd = R.map((r) => r.thd).filter(Number.isFinite);
  if (thd.length) { const c = share(thd, (x) => x <= 8); params.push({ name: "Total harmonic distortion THDu", limit: "≤ 8 % for 95 % of the week", compliance: c, required: 95, worst: `95th percentile ${pct(thd, 95).toFixed(2)} %, maximum ${Math.max(...thd).toFixed(2)} %`, pass: c === null ? null : c >= 95 }); }
  const plt = R.map((r) => r.plt).filter(Number.isFinite);
  if (plt.length) { const c = share(plt, (x) => x <= 1); params.push({ name: "Long-term flicker Plt", limit: "≤ 1 for 95 % of the week", compliance: c, required: 95, worst: `95th percentile ${pct(plt, 95).toFixed(2)}, maximum ${Math.max(...plt).toFixed(2)}`, pass: c === null ? null : c >= 95 }); }
  const unb = R.map((r) => r.unb).filter(Number.isFinite);
  if (unb.length) { const c = share(unb, (x) => x <= 2); params.push({ name: "Voltage unbalance (negative / positive sequence)", limit: "≤ 2 % for 95 % of the week", compliance: c, required: 95, worst: `95th percentile ${pct(unb, 95).toFixed(2)} %`, pass: c === null ? null : c >= 95 }); }
  const fr = R.map((r) => r.f).filter(Number.isFinite);
  if (fr.length) { const c1 = share(fr, (x) => Math.abs(x - fn) <= 0.01 * fn), c2 = share(fr, (x) => x >= fn * 0.94 && x <= fn * 1.04); params.push({ name: "Power frequency (10-s means; 10-min values used here)", limit: `${fn} Hz ± 1 % for 99.5 %, + 4 % / − 6 % for 100 %`, compliance: c1, required: 99.5, worst: `${Math.min(...fr).toFixed(3)} – ${Math.max(...fr).toFixed(3)} Hz`, pass: c1 === null ? null : c1 >= 99.5 && (c2 ?? 100) >= 100 }); }
  const dips: PqResult["dips"] = [];
  for (const r of R) r.v.forEach((x, i) => { if (Number.isFinite(x) && x / vn < 0.9) dips.push({ t: r.t, v: x / vn, ph: ["L1", "L2", "L3"][i] ?? "" }); });
  const days = R.length > 1 ? (R[R.length - 1].t - R[0].t) / 86400 : 0;
  if (days < 6.9) add("warning", `The record covers ${days.toFixed(1)} days; EN 50160 assesses a full week (1008 ten-minute values).`);
  for (const p of params) if (p.pass === false) add("error", `${p.name}: ${p.compliance!.toFixed(1)} % of values within the limit (${p.limit}) — does not comply. ${p.worst}.`); else if (p.pass) add("ok", `${p.name}: ${p.compliance!.toFixed(1)} % within the limit (${p.limit}).`);
  if (dips.length) add("info", `${dips.length} ten-minute value(s) below 90 % of Un (dips or sustained undervoltage) — check the event log of the analyser for their depth and duration.`);
  return { n: R.length, days, params, dips: dips.slice(0, 50), findings: F };
}
