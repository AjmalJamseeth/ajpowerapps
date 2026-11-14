// Sampled values (IEC 61850-9-2 / 9-2LE) waveforms and phasors from a capture:
// sample counter continuity, synchronisation, quality, one-cycle DFT phasors,
// frequency, symmetrical components and plausibility checks (neutral sum,
// phase sequence, unbalance).

import { type Eth, sv } from "./l2cap";

export const CH = ["Ia", "Ib", "Ic", "In", "Va", "Vb", "Vc", "Vn"];
export const SCALE = [0.001, 0.001, 0.001, 0.001, 0.01, 0.01, 0.01, 0.01]; // 9-2LE: 1 mA, 10 mV per LSB
export interface SvStream { key: string; appid: number; svID: string; src: string; dst: string; vlan: number | null; prio: number | null; confRev: number; synch: number[]; t: number[]; cnt: number[]; vals: number[][]; q: number[][]; frames: number; sim: boolean }

export function svStreams(E: Eth[]): SvStream[] {
  const m = new Map<string, SvStream>();
  for (const e of E) {
    const s = sv(e);
    if (!s) continue;
    for (const a of s.asdu) {
      const key = `${e.src}|${s.appid}|${a.svID}`;
      let x = m.get(key);
      if (!x) m.set(key, (x = { key, appid: s.appid, svID: a.svID, src: e.src, dst: e.dst, vlan: e.vlan, prio: e.prio, confRev: a.confRev, synch: [], t: [], cnt: [], vals: [], q: [], frames: 0, sim: false }));
      x.frames++; x.sim = x.sim || s.sim;
      if (!x.synch.includes(a.smpSynch)) x.synch.push(a.smpSynch);
      x.t.push(e.t); x.cnt.push(a.smpCnt); x.vals.push(a.vals.map((v, i) => v * (SCALE[i] ?? 1))); x.q.push(a.q);
    }
  }
  return [...m.values()];
}

export interface Phasor { mag: number; ang: number } // RMS, degrees
export interface SvResult {
  s: SvStream; rate: number; perCycle: number; lost: number; lostAt: number[]; wrap: number; phasors: Phasor[]; freq: number | null;
  seq: { i: { pos: number; neg: number; zero: number }; v: { pos: number; neg: number; zero: number } };
  findings: { sev: "error" | "warning" | "info" | "ok"; text: string }[]; qBad: string[];
}
const cplx = (m: number, a: number) => [m * Math.cos((a * Math.PI) / 180), m * Math.sin((a * Math.PI) / 180)];
function dft(x: number[]): Phasor {
  const N = x.length; let re = 0, im = 0;
  for (let n = 0; n < N; n++) { re += x[n] * Math.cos((2 * Math.PI * n) / N); im -= x[n] * Math.sin((2 * Math.PI * n) / N); }
  re *= Math.SQRT2 / N; im *= Math.SQRT2 / N;
  return { mag: Math.hypot(re, im), ang: (Math.atan2(im, re) * 180) / Math.PI };
}
function sym(p: Phasor[]): { pos: number; neg: number; zero: number } {
  const a = (k: number) => cplx(1, 120 * k);
  const v = p.map((x) => cplx(x.mag, x.ang)), mul = (x: number[], y: number[]) => [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]], addc = (...z: number[][]) => z.reduce((s, q) => [s[0] + q[0], s[1] + q[1]], [0, 0]);
  const z0 = addc(v[0], v[1], v[2]), z1 = addc(v[0], mul(a(1), v[1]), mul(a(2), v[2])), z2 = addc(v[0], mul(a(2), v[1]), mul(a(1), v[2]));
  return { zero: Math.hypot(...z0) / 3, pos: Math.hypot(...z1) / 3, neg: Math.hypot(...z2) / 3 };
}
const wrapAng = (a: number) => ((a + 540) % 360) - 180;

export function analyseSv(s: SvStream, f0 = 50, smpRatePerCycle = 80, at = 0): SvResult {
  const F: SvResult["findings"] = [], add = (sev: SvResult["findings"][0]["sev"], text: string) => F.push({ sev, text });
  const perCycle = smpRatePerCycle, rate = perCycle * f0, wrap = rate; // 9-2LE: smpCnt wraps at samples per second
  let lost = 0; const lostAt: number[] = [];
  for (let i = 1; i < s.cnt.length; i++) { const d = (s.cnt[i] - s.cnt[i - 1] + wrap) % wrap; if (d !== 1) { if (d === 0) continue; lost += d - 1; lostAt.push(i); } }
  if (Math.max(...s.cnt) >= wrap) add("warning", `smpCnt reaches ${Math.max(...s.cnt)}, above ${wrap - 1}: the stream is not ${perCycle} samples per cycle at ${f0} Hz — set the right rate and frequency.`);
  if (lost) add("error", `${lost} sample(s) missing (smpCnt jumps at ${lostAt.length} place(s)). The protection function either blocks or interpolates; check network load, the merging unit and the capture point.`);
  if (s.synch.includes(0)) add("warning", "smpSynch = 0: the merging unit is not synchronised. Samples from different merging units cannot be combined (differential, busbar protection).");
  else if (s.synch.includes(1)) add("info", "smpSynch = 1: synchronised to a local clock, not to a global (GPS/PTP) time source.");
  if (s.sim) add("warning", "Simulation bit set: subscribers not in simulation ignore this stream.");
  const qBad: string[] = [];
  s.q.forEach((qq) => qq.forEach((v, i) => { const val = v & 3; const tag = `${CH[i]}: ${val === 1 ? "invalid" : val === 3 ? "questionable" : ""}${v & 0x800 ? " test" : ""}${v & 0x2000 ? " derived" : ""}`.trim(); if ((val || v & 0x800) && !qBad.includes(tag)) qBad.push(tag); }));
  if (qBad.length) add("warning", `Quality not good on ${qBad.join(", ")}.`);
  // phasors over one cycle starting at sample `at`
  const start = Math.min(Math.max(0, at), Math.max(0, s.vals.length - perCycle - 1));
  const win = s.vals.slice(start, start + perCycle);
  const phasors = CH.map((_, c) => (win.length === perCycle ? dft(win.map((v) => v[c] ?? 0)) : { mag: 0, ang: 0 }));
  const ref = phasors[4].mag > 1 ? phasors[4].ang : phasors[0].ang;
  for (const p of phasors) p.ang = wrapAng(p.ang - ref);
  // frequency from the phase advance of Va over one cycle
  let freq: number | null = null;
  const refCh = phasors[4].mag > 1 ? 4 : 0;
  if (s.vals.length >= start + perCycle * 2) { const p1 = dft(s.vals.slice(start, start + perCycle).map((v) => v[refCh])), p2 = dft(s.vals.slice(start + perCycle, start + 2 * perCycle).map((v) => v[refCh])); freq = f0 + wrapAng(p2.ang - p1.ang) / 360 * f0; }
  const seq = { i: sym(phasors.slice(0, 3)), v: sym(phasors.slice(4, 7)) };
  // plausibility
  const iMax = Math.max(...phasors.slice(0, 3).map((p) => p.mag));
  if (iMax > 0.05) {
    const sumI = (() => { const z = phasors.slice(0, 3).map((p) => cplx(p.mag, p.ang)); return Math.hypot(z[0][0] + z[1][0] + z[2][0], z[0][1] + z[1][1] + z[2][1]); })();
    void sumI;
    const order = wrapAng(phasors[1].ang - phasors[0].ang);
    if (order > 0 && phasors[1].mag > 0.05) add("warning", `Current phase sequence A-C-B (Ib leads Ia by ${order.toFixed(0)}°): two phases are swapped in the CT wiring or the channel mapping.`);
    if (seq.i.pos > 0.05 && seq.i.neg / seq.i.pos > 0.1) add("info", `Current unbalance: negative / positive sequence ${(100 * seq.i.neg / seq.i.pos).toFixed(1)} %.`);
  }
  const vMax = Math.max(...phasors.slice(4, 7).map((p) => p.mag));
  if (vMax > 1) {
    const order = wrapAng(phasors[5].ang - phasors[4].ang);
    if (order > 0) add("warning", `Voltage phase sequence A-C-B (Vb leads Va by ${order.toFixed(0)}°).`);
    if (seq.v.pos > 0 && seq.v.neg / seq.v.pos > 0.02) add("info", `Voltage unbalance ${(100 * seq.v.neg / seq.v.pos).toFixed(1)} % (negative / positive sequence).`);
    if (seq.v.pos > 0 && seq.v.zero / seq.v.pos > 0.05) add("info", `Zero-sequence voltage ${(100 * seq.v.zero / seq.v.pos).toFixed(1)} % of positive sequence (earth fault, or VT wiring).`);
  }
  // neutral against the phase sum, sample by sample over the whole stream (instantaneous values)
  let worst = { d: 0, i: -1, n: 0, sum: 0 };
  for (let i = 0; i < s.vals.length; i++) { const v = s.vals[i], sum = v[0] + v[1] + v[2], d = Math.abs(v[3] - sum); if (d > worst.d) worst = { d, i, n: v[3], sum }; }
  const peak = Math.max(1e-9, ...s.vals.map((v) => Math.max(Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]))));
  if (worst.d > 0.05 * peak && worst.d > 0.05) add("warning", `Neutral current does not match the phases: at sample ${worst.i} (smpCnt ${s.cnt[worst.i]}) In = ${worst.n.toFixed(2)} A while Ia + Ib + Ic = ${worst.sum.toFixed(2)} A. A measured neutral should equal the sum: check the neutral CT, its ratio and polarity, or the merging unit's In channel.`);
  if (freq !== null && Math.abs(freq - f0) > 0.5) add("warning", `Frequency ${freq.toFixed(2)} Hz: far from ${f0} Hz — check the nominal frequency setting or the sample rate.`);
  if (!F.some((f) => f.sev === "error" || f.sev === "warning")) add("ok", `${s.cnt.length} samples, continuous, synchronised, plausible phasors.`);
  return { s, rate, perCycle, lost, lostAt, wrap, phasors, freq, seq, findings: F, qBad };
}
