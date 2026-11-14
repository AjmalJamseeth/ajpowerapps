// Power asset tools: circuit-breaker contact wear from the interrupted-current
// history, transformer top-oil and hot-spot temperatures and ageing to
// IEC 60076-7, and distance protection zone settings (IEC 60255-121 /
// IEEE C37.113 practice).

import { parseTime } from "./timeline";

export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string }
const split = (l: string, d: string) => l.split(d).map((x) => x.trim().replace(/^"|"$/g, ""));
function table(text: string) {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const d = [",", ";", "\t"].sort((a, b) => (lines[0] ?? "").split(b).length - (lines[0] ?? "").split(a).length)[0];
  return { h: split(lines[0] ?? "", d), rows: lines.slice(1).map((l) => split(l, d)) };
}

/* ------------------------------------------------------------ breaker wear */
export interface CbData { isc: number; nsc: number; ir: number; nr: number; mech: number; openMs: number; tolMs: number }
export interface CbOp { t: number; type: string; ia: number; ib: number; ic: number; openMs: number | null }
export function parseCbOps(text: string): { ops: CbOp[]; err?: string } {
  const { h, rows } = table(text), ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const ct = ci(/^(date|time|timestamp)/i), cty = ci(/type|reason|cause/i), ca = ci(/(i|current).*(a|l1)\b|^ia|^i_?a|ka a/i), cb = ci(/(i|current).*(b|l2)\b|^ib|^i_?b/i), cc = ci(/(i|current).*(c|l3)\b|^ic|^i_?c/i), ci1 = ci(/^(i|current|interrupted|ka|i \(ka\)|interrupted current)/i), co = ci(/open.*(ms|time)|opening/i);
  if (ct < 0 || (ca < 0 && ci1 < 0)) return { ops: [], err: `Columns needed: date and interrupted current (kA), per phase or one value. Found: ${h.join(", ")}.` };
  const ops: CbOp[] = [];
  for (const r of rows) { const t = parseTime(/\d{2}:\d{2}/.test(r[ct] ?? "") ? r[ct] : `${r[ct]} 00:00:00`); if (t === null) continue; const one = Number(r[ci1]); const g = (c: number) => (c >= 0 && r[c] !== "" ? Number(r[c]) : one); ops.push({ t, type: cty >= 0 ? r[cty] : "", ia: g(ca) || 0, ib: g(cb) || 0, ic: g(cc) || 0, openMs: co >= 0 && r[co] !== "" ? Number(r[co]) : null }); }
  return { ops: ops.sort((a, b) => a.t - b.t) };
}
export function breakerWear(cb: CbData, ops: CbOp[]) {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  // electrical endurance curve through (Ir, Nr) and (Isc, Nsc): N(I) = Nr · (Ir / I)^n
  const n = Math.log(cb.nr / cb.nsc) / Math.log(cb.isc / cb.ir);
  const N = (I: number) => (I <= cb.ir ? cb.nr : cb.nr * Math.pow(cb.ir / I, n));
  const wear = { A: 0, B: 0, C: 0 };
  const rows = ops.map((o) => { const w = { A: o.ia > 0 ? 1 / N(o.ia * 1000) : 0, B: o.ib > 0 ? 1 / N(o.ib * 1000) : 0, C: o.ic > 0 ? 1 / N(o.ic * 1000) : 0 }; wear.A += w.A; wear.B += w.B; wear.C += w.C; return { ...o, w }; });
  const worst = (Object.entries(wear) as [string, number][]).sort((a, b) => b[1] - a[1])[0];
  const used = worst[1] * 100;
  add(used > 90 ? "error" : used > 70 ? "warning" : "ok", `Contact wear: pole ${worst[0]} has used ${used.toFixed(1)} % of its electrical endurance (A ${(100 * wear.A).toFixed(1)} %, B ${(100 * wear.B).toFixed(1)} %, C ${(100 * wear.C).toFixed(1)} %).${used > 70 ? " Plan contact inspection or replacement." : ""}`);
  add(ops.length > 0.8 * cb.mech ? "warning" : "info", `${ops.length} operations recorded against a mechanical endurance of ${cb.mech} (${((100 * ops.length) / cb.mech).toFixed(1)} %).`);
  const big = rows.filter((o) => Math.max(o.ia, o.ib, o.ic) * 1000 >= 0.5 * cb.isc);
  if (big.length) add("info", `${big.length} interruption(s) at or above 50 % of the rated short-circuit breaking current; each of them uses ${(100 / N(0.5 * cb.isc)).toFixed(1)} % of the life or more.`);
  const ot = rows.filter((o) => o.openMs !== null);
  if (ot.length && cb.openMs > 0) { const bad = ot.filter((o) => Math.abs(o.openMs! - cb.openMs) > cb.tolMs); if (bad.length) add("warning", `${bad.length} operation(s) with an opening time outside ${cb.openMs} ± ${cb.tolMs} ms (latest ${bad[bad.length - 1].openMs} ms): check the trip coil, mechanism and lubrication.`); const trend = ot.length > 2 ? ot[ot.length - 1].openMs! - ot[0].openMs! : 0; if (trend > cb.tolMs / 2) add("info", `Opening time increased by ${trend.toFixed(1)} ms over the record — a slowing mechanism.`); }
  // remaining fault interruptions at a given current
  const rem = (I: number) => Math.max(0, (1 - worst[1]) * N(I));
  return { n, wear, used, rows, remainingAt: [0.25, 0.5, 1].map((f) => ({ ka: (f * cb.isc) / 1000, ops: rem(f * cb.isc) })), findings: F };
}

/* ------------------------------------------------------------ transformer thermal (IEC 60076-7) */
export interface XfmrData { cooling: "ONAN" | "ONAF" | "OF" | "OD"; dThOr: number; dThHr: number; R: number; x: number; y: number; k11: number; k21: number; k22: number; tauO: number; tauW: number; upgraded: boolean }
export const COOLING: Record<string, Pick<XfmrData, "x" | "y" | "k11" | "k21" | "k22" | "tauO" | "tauW">> = {
  ONAN: { x: 0.8, y: 1.3, k11: 0.5, k21: 2.0, k22: 2.0, tauO: 210, tauW: 10 },
  ONAF: { x: 0.8, y: 1.3, k11: 0.5, k21: 2.0, k22: 2.0, tauO: 150, tauW: 7 },
  OF: { x: 1.0, y: 1.3, k11: 1.0, k21: 1.3, k22: 1.0, tauO: 90, tauW: 7 },
  OD: { x: 1.0, y: 2.0, k11: 1.0, k21: 1.0, k22: 1.0, tauO: 90, tauW: 7 },
};
export interface ThermalRow { t: number; K: number; amb: number; top: number; hs: number; V: number }
export function parseLoadProfile(text: string): { pts: { t: number; K: number; amb: number | null }[]; err?: string } {
  const { h, rows } = table(text), ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const ct = ci(/^(time|timestamp|date)/i), ck = ci(/^(k|load|load ?\(pu\)|pu|per unit|load factor|mva|kva|a|current)/i), ca = ci(/amb|temp/i);
  if (ct < 0 || ck < 0) return { pts: [], err: `Columns needed: time and load (per unit of rating). Found: ${h.join(", ")}.` };
  return { pts: rows.map((r) => ({ t: parseTime(r[ct] ?? "") ?? NaN, K: Number(r[ck]), amb: ca >= 0 && r[ca] !== "" ? Number(r[ca]) : null })).filter((p) => Number.isFinite(p.t) && Number.isFinite(p.K)) };
}
export const ageing = (hs: number, upgraded: boolean) => (upgraded ? Math.exp(15000 / (110 + 273) - 15000 / (hs + 273)) : Math.pow(2, (hs - 98) / 6));
export function steadyHotSpot(d: XfmrData, K: number, amb: number) { const top = amb + d.dThOr * Math.pow((1 + K * K * d.R) / (1 + d.R), d.x); return { top, hs: top + d.dThHr * Math.pow(K, d.y) }; }
export function maxLoad(d: XfmrData, amb: number, hsLimit: number) { let lo = 0, hi = 3; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (steadyHotSpot(d, m, amb).hs > hsLimit) hi = m; else lo = m; } return lo; }
export function thermal(d: XfmrData, pts: { t: number; K: number; amb: number | null }[], ambDefault: number, limits = { hs: 120, top: 105 }) {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  // initial steady state at the first load, then IEC 60076-7 Annex difference equations with a 1-minute step
  const p0 = pts[0], amb0 = p0.amb ?? ambDefault;
  let thO = amb0 + d.dThOr * Math.pow((1 + p0.K * p0.K * d.R) / (1 + d.R), d.x), dh1 = d.k21 * d.dThHr * Math.pow(p0.K, d.y), dh2 = (d.k21 - 1) * d.dThHr * Math.pow(p0.K, d.y);
  const rows: ThermalRow[] = [];
  const step = 60;
  let L = 0, k = 0;
  for (let t = p0.t; t <= pts[pts.length - 1].t; t += step) {
    while (k + 1 < pts.length && pts[k + 1].t <= t) k++;
    const K = pts[k].K, amb = pts[k].amb ?? ambDefault, Dt = step / 60;
    thO += (Dt / (d.k11 * d.tauO)) * (Math.pow((1 + K * K * d.R) / (1 + d.R), d.x) * d.dThOr - (thO - amb));
    dh1 += (Dt / (d.k22 * d.tauW)) * (d.k21 * d.dThHr * Math.pow(K, d.y) - dh1);
    dh2 += (Dt / ((1 / d.k22) * d.tauO)) * ((d.k21 - 1) * d.dThHr * Math.pow(K, d.y) - dh2);
    const hs = thO + dh1 - dh2, V = ageing(hs, d.upgraded);
    L += V * Dt;
    rows.push({ t, K, amb, top: thO, hs, V });
  }
  const hours = rows.length / 60, maxHs = Math.max(...rows.map((r) => r.hs)), maxTop = Math.max(...rows.map((r) => r.top)), maxK = Math.max(...pts.map((p) => p.K));
  const atHs = rows.find((r) => r.hs === maxHs)!;
  add(maxHs > limits.hs ? "error" : maxHs > limits.hs - 10 ? "warning" : "ok", `Hot-spot maximum ${maxHs.toFixed(1)} °C at ${new Date(atHs.t * 1000).toISOString().slice(11, 16)} (load ${atHs.K.toFixed(2)} pu, ambient ${atHs.amb.toFixed(0)} °C); limit for normal cyclic loading ${limits.hs} °C.`);
  add(maxTop > limits.top ? "error" : "ok", `Top-oil maximum ${maxTop.toFixed(1)} °C (limit ${limits.top} °C).`);
  if (maxK > 1.5) add("error", `Load reaches ${maxK.toFixed(2)} pu — above 1.5 pu, the IEC 60076-7 current limit for normal cyclic loading of distribution and medium power transformers.`);
  const eq = L / 60;
  add(eq > hours ? "warning" : "ok", `Ageing over ${hours.toFixed(1)} h equals ${eq.toFixed(2)} h at the reference hot-spot (${d.upgraded ? "110 °C, thermally upgraded paper" : "98 °C, normal paper"}) — relative ageing ${(eq / hours).toFixed(2)}.${eq > hours ? " The transformer ages faster than normal on such days." : ""}`);
  if (maxHs > 140) add("error", "Above 140 °C gas bubbles can form in the insulation (IEC 60076-7): a dielectric risk, not only ageing.");
  return { rows, maxHs, maxTop, equivalentHours: eq, hours, relAgeing: eq / Math.max(hours, 1e-9), findings: F };
}

/* ------------------------------------------------------------ distance protection zones */
export interface DistInput { r1: number; x1: number; r0: number; x0: number; len: number; shortAdjLen: number; shortAdjZ: number; longAdjLen: number; longAdjZ: number; ctPri: number; ctSec: number; vtPri: number; vtSec: number; vKv: number; maxLoadMva: number; loadAngle: number; zsOhm: number; rf: number; rfPP: number }
export function distanceSettings(p: DistInput) {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const z1 = Math.hypot(p.r1, p.x1), ang = (Math.atan2(p.x1, p.r1) * 180) / Math.PI, ZL = z1 * p.len;
  const d = p.r1 * p.r1 + p.x1 * p.x1, nr = (p.r0 - p.r1) / 3, ni = (p.x0 - p.x1) / 3, k0 = { mag: Math.hypot((nr * p.r1 + ni * p.x1) / d, (ni * p.r1 - nr * p.x1) / d), ang: (Math.atan2((ni * p.r1 - nr * p.x1) / d, (nr * p.r1 + ni * p.x1) / d) * 180) / Math.PI };
  const zAdjS = p.shortAdjZ * p.shortAdjLen, zAdjL = p.longAdjZ * p.longAdjLen;
  const Z1 = 0.8 * ZL;
  let Z2 = Math.max(1.2 * ZL, ZL + 0.5 * zAdjS);
  if (zAdjS > 0 && Z2 > ZL + 0.8 * 0.8 * zAdjS) { add("warning", `Zone 2 (${Z2.toFixed(2)} Ω) would reach beyond zone 1 of the shortest adjacent line; it is limited to ${(ZL + 0.64 * zAdjS).toFixed(2)} Ω — check the time grading with that line's zone 2.`); Z2 = ZL + 0.64 * zAdjS; }
  const Z3 = 1.2 * (ZL + zAdjL), Z4 = 0.15 * ZL;
  const ratio = p.ctPri / p.ctSec / (p.vtPri / p.vtSec), sec = (z: number) => z * ratio;
  const vmin = 0.9 * p.vKv * 1000, zLoad = (vmin * vmin) / (p.maxLoadMva * 1e6), rLoadLim = 0.8 * zLoad * Math.cos((p.loadAngle * Math.PI) / 180);
  const rPG = Math.min(1.2 * 2 * p.rf, rLoadLim), rPP = Math.min(1.2 * p.rfPP, rLoadLim); // ×2 remote infeed allowance (earth faults), ×1.2 margin
  if (Z3 * Math.cos(((ang - p.loadAngle) * Math.PI) / 180) > 0.8 * zLoad) add("warning", `Zone 3 reach (${Z3.toFixed(1)} Ω at ${ang.toFixed(0)}°) comes within 80 % of the minimum load impedance (${zLoad.toFixed(1)} Ω at ${p.loadAngle}°): enable load encroachment blinders or reduce the resistive reach.`);
  if (2.4 * p.rf > rLoadLim) add("warning", `The phase-earth resistive reach needed for ${p.rf} Ω fault resistance is limited by load to ${rLoadLim.toFixed(1)} Ω.`);
  const sir = p.zsOhm > 0 ? p.zsOhm / ZL : null;
  if (sir !== null && sir > 4) add("warning", `Source impedance ratio SIR = ${sir.toFixed(1)} (> 4): zone 1 may overreach on CVT transients or underreach at the reach point; reduce zone 1 to 70–75 % or use relay CVT filtering.`);
  if (p.len < 10) add("info", `Short line (${p.len} km): zone 1 at 80 % covers only ${(0.8 * p.len).toFixed(1)} km, and the resistive coverage relative to the line impedance is large; consider line differential or a teleprotection scheme (POTT / PUTT).`);
  add("info", `Residual compensation k0 = (Z0 − Z1) / 3Z1 = ${k0.mag.toFixed(3)} ∠ ${k0.ang.toFixed(1)}°; line angle ${ang.toFixed(1)}°. Secondary ohms = primary × CT ratio / VT ratio = primary × ${ratio.toFixed(4)}.`);
  const zones = [
    { zone: "Zone 1", reach: Z1, t: 0, basis: "80 % of the protected line (instantaneous; margin for CT/VT, line data and relay errors)" },
    { zone: "Zone 2", reach: Z2, t: 0.35, basis: "≥ 120 % of the line, ≤ line + 50 % of the shortest adjacent line" },
    { zone: "Zone 3", reach: Z3, t: 0.9, basis: "120 % of line + longest adjacent line (remote back-up)" },
    { zone: "Zone 4 (reverse)", reach: Z4, t: 1.2, basis: "15 % reverse, for busbar back-up / blocking schemes" },
  ].map((z) => ({ ...z, sec: sec(z.reach), rPG, rPP, rPGsec: sec(rPG), rPPsec: sec(rPP) }));
  return { ZL, z1, ang, k0, zones, zLoad, rLoadLim, ratio, sir, findings: F };
}
