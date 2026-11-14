// COMTRADE (IEEE C37.111 / IEC 60255-24, 1991, 1999 and 2013) reader and
// fault analysis: channels, scaling, ASCII / BINARY / BINARY32 / FLOAT32 data,
// one-cycle DFT phasors, fault inception, fault type, trip and clearance
// times from digital channels, apparent impedance of the faulted loop and
// distance to fault from line data.

export interface AChan { idx: number; id: string; ph: string; ccbm: string; unit: string; a: number; b: number; skew: number; min: number; max: number; primary: number; secondary: number; ps: string; kind: "I" | "V" | "?"; phase: "A" | "B" | "C" | "N" | "" }
export interface DChan { idx: number; id: string; ph: string; ccbm: string; normal: number }
export interface Cfg { station: string; device: string; rev: string; analog: AChan[]; digital: DChan[]; freq: number; rates: { samp: number; end: number }[]; start: string; trigger: string; startT: number; trigT: number; ft: string; timemult: number }
export interface CtRecord { cfg: Cfg; t: number[]; a: number[][]; d: number[][]; n: number; issues: string[] }

const parseDT = (s: string) => {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),\s*(\d{1,2}):(\d{2}):(\d{2}(?:\.\d+)?)$/);
  if (!m) return NaN;
  const y = +m[3] < 100 ? 1900 + +m[3] + (+m[3] < 70 ? 100 : 0) : +m[3];
  // 1999/2013: dd/mm/yyyy; 1991: mm/dd/yy
  const dd = +m[3] < 100 ? +m[2] : +m[1], mm = +m[3] < 100 ? +m[1] : +m[2];
  return Date.UTC(y, mm - 1, dd, +m[4], +m[5], 0) / 1000 + parseFloat(m[6]);
};

export function parseCfg(text: string): Cfg {
  const L = String(text).replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim());
  let i = 0;
  const f = (l: string) => l.split(",").map((x) => x.trim());
  const l1 = f(L[i++] ?? "");
  const l2 = f(L[i++] ?? ""), na = parseInt(l2[1]), nd = parseInt(l2[2]);
  if (!Number.isFinite(na) || !Number.isFinite(nd)) throw new Error("Not a COMTRADE configuration file (line 2 must give the channel counts, e.g. 8,4A,4D).");
  const analog: AChan[] = [], digital: DChan[] = [];
  for (let k = 0; k < na; k++) {
    const x = f(L[i++] ?? ""), unit = x[4] ?? "", id = x[1] ?? "", ph = (x[2] ?? "").toUpperCase();
    const kind = /^k?a$|amp/i.test(unit) ? "I" : /^[km]?v$|volt/i.test(unit) ? "V" : /^i|cur/i.test(id) ? "I" : /^[uv]/i.test(id) ? "V" : "?";
    const pm = (ph + " " + id).match(/\b(?:L)?([ABCN123])\b|(?:I|U|V)(?:L)?([ABCN123])$/i) || id.match(/([ABCN])$/i);
    const pr = (pm ? (pm[1] || pm[2] || "") : "").toUpperCase().replace("1", "A").replace("2", "B").replace("3", "C") as AChan["phase"];
    analog.push({ idx: +x[0], id, ph, ccbm: x[3] ?? "", unit, a: parseFloat(x[5]) || 1, b: parseFloat(x[6]) || 0, skew: parseFloat(x[7]) || 0, min: parseFloat(x[8]), max: parseFloat(x[9]), primary: parseFloat(x[10]) || 1, secondary: parseFloat(x[11]) || 1, ps: (x[12] ?? "P").toUpperCase(), kind, phase: pr });
  }
  for (let k = 0; k < nd; k++) { const x = f(L[i++] ?? ""); digital.push({ idx: +x[0], id: x[1] ?? "", ph: x[2] ?? "", ccbm: x[3] ?? "", normal: parseInt(x[4] ?? "0") || 0 }); }
  const freq = parseFloat(L[i++] ?? "50") || 50;
  const nr = parseInt(L[i++] ?? "0") || 0, rates: Cfg["rates"] = [];
  for (let k = 0; k < Math.max(1, nr); k++) { const x = f(L[i++] ?? "0,0"); rates.push({ samp: parseFloat(x[0]) || 0, end: parseInt(x[1]) || 0 }); }
  const start = L[i++] ?? "", trigger = L[i++] ?? "", ft = (L[i++] ?? "ASCII").toUpperCase(), timemult = parseFloat(L[i++] ?? "1") || 1;
  return { station: l1[0] ?? "", device: l1[1] ?? "", rev: l1[2] ?? "1991", analog, digital, freq, rates: nr ? rates : [], start, trigger, startT: parseDT(start), trigT: parseDT(trigger), ft, timemult };
}

export function parseDat(cfg: Cfg, dat: Uint8Array | string): CtRecord {
  const na = cfg.analog.length, nd = cfg.digital.length, issues: string[] = [];
  const raw: { n: number; ts: number; a: number[]; d: number[] }[] = [];
  if (cfg.ft === "ASCII") {
    const text = typeof dat === "string" ? dat : new TextDecoder().decode(dat);
    for (const l of text.split(/\r?\n/)) { if (!l.trim()) continue; const x = l.split(",").map((v) => v.trim()); raw.push({ n: +x[0], ts: x[1] === "" ? NaN : +x[1], a: x.slice(2, 2 + na).map((v) => (v === "" || /^99999$/.test(v) ? NaN : +v)), d: x.slice(2 + na, 2 + na + nd).map((v) => +v) }); }
  } else {
    const b = typeof dat === "string" ? new TextEncoder().encode(dat) : dat, dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    const asz = cfg.ft === "BINARY" ? 2 : 4, dw = Math.ceil(nd / 16), rec = 8 + na * asz + dw * 2;
    for (let o = 0; o + rec <= b.byteLength; o += rec) {
      const a: number[] = [];
      for (let k = 0; k < na; k++) { const p = o + 8 + k * asz; a.push(cfg.ft === "BINARY" ? (dv.getInt16(p, true) === -32768 ? NaN : dv.getInt16(p, true)) : cfg.ft === "FLOAT32" ? dv.getFloat32(p, true) : dv.getInt32(p, true)); }
      const d: number[] = [];
      for (let k = 0; k < nd; k++) d.push((dv.getUint16(o + 8 + na * asz + Math.floor(k / 16) * 2, true) >> (k % 16)) & 1);
      raw.push({ n: dv.getUint32(o, true), ts: dv.getUint32(o + 4, true), a, d });
    }
    if (b.byteLength % rec) issues.push(`Data file size is not a whole number of samples (${b.byteLength} bytes, ${rec} per sample): the configuration and data files may not belong together.`);
  }
  const t: number[] = [];
  const rate = cfg.rates.length ? cfg.rates : [];
  raw.forEach((r, k) => {
    let tt: number;
    if (rate.length && rate[0].samp > 0) { let n0 = 0, t0 = 0; tt = 0; for (const rr of rate) { if (k + 1 <= rr.end || rr === rate[rate.length - 1]) { tt = t0 + (k - n0) / rr.samp; break; } t0 += (rr.end - n0) / rr.samp; n0 = rr.end; } }
    else tt = (r.ts * cfg.timemult) / 1e6;
    t.push(tt);
  });
  for (let k = 1; k < raw.length; k++) if (raw[k].n !== raw[k - 1].n + 1) { issues.push(`Sample numbers jump from ${raw[k - 1].n} to ${raw[k].n}: samples missing.`); break; }
  const a = cfg.analog.map((c, ci) => raw.map((r) => { const v = r.a[ci] * c.a + c.b; return c.ps === "S" ? v * (c.primary / c.secondary) : v; }));
  cfg.analog.forEach((c, ci) => { const xs = raw.map((r) => r.a[ci]).filter((v) => Number.isFinite(v)); if (Number.isFinite(c.max) && c.max > 0 && xs.some((v) => v >= c.max) && xs.filter((v) => v >= c.max).length > 2) issues.push(`${c.id} reaches the maximum recordable value ${c.max} on several samples: the recorder input or the CT is clipping (saturation).`); });
  const d = cfg.digital.map((_, di) => raw.map((r) => r.d[di] ?? 0));
  return { cfg, t, a, d, n: raw.length, issues };
}

/** COMTRADE 2013 single-file (.cff) */
export function parseCff(text: string): CtRecord {
  const sec = (name: string) => { const m = text.match(new RegExp(`---\\s*file type:\\s*${name}[^\\n]*---\\s*\\n([\\s\\S]*?)(?=\\n---\\s*file type:|$)`, "i")); return m ? m[1] : ""; };
  const cfg = parseCfg(sec("CFG"));
  return parseDat(cfg, sec("DAT"));
}

/* ---------------------------------------------------------------- analysis */
export interface Ph { mag: number; ang: number } // RMS primary, degrees
const C = { add: (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1]], sub: (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1]], mul: (a: number[], b: number[]) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], div: (a: number[], b: number[]) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; } };
const pol = (p: Ph) => [p.mag * Math.cos((p.ang * Math.PI) / 180), p.mag * Math.sin((p.ang * Math.PI) / 180)];
const toPh = (z: number[]): Ph => ({ mag: Math.hypot(z[0], z[1]), ang: (Math.atan2(z[1], z[0]) * 180) / Math.PI });
export function phasorAt(x: number[], t: number[], tEnd: number, f: number): Ph {
  const end = t.findIndex((v) => v >= tEnd), N = Math.round(1 / f / ((t[1] - t[0]) || 1e-3));
  const e = end < 0 ? t.length : end, s = Math.max(0, e - N);
  let re = 0, im = 0; for (let k = s; k < e; k++) { const w = (2 * Math.PI * f * t[k]); re += x[k] * Math.cos(w); im -= x[k] * Math.sin(w); }
  const n = e - s || 1; return { mag: (Math.SQRT2 * Math.hypot(re, im)) / n, ang: (Math.atan2(im, re) * 180) / Math.PI };
}

export interface FaultResult {
  inception: number | null; type: string; faulted: string[]; ground: boolean; pre: Record<string, Ph>; fault: Record<string, Ph>; peak: Record<string, number>;
  trip: { id: string; t: number } | null; cbOpen: { id: string; t: number } | null; cleared: number | null; z: Ph | null; zLoop: string; distanceKm: number | null; i0: Ph | null; findings: { sev: "error" | "warning" | "info" | "ok"; text: string }[];
}
export function analyseFault(r: CtRecord, line?: { z1: number; ang1: number; k0mag: number; k0ang: number }): FaultResult {
  const F: FaultResult["findings"] = [], add = (sev: FaultResult["findings"][0]["sev"], text: string) => F.push({ sev, text });
  const f = r.cfg.freq, ch = (k: "I" | "V", p: string) => r.cfg.analog.findIndex((c) => c.kind === k && c.phase === p);
  const iA = ch("I", "A"), iB = ch("I", "B"), iC = ch("I", "C"), vA = ch("V", "A"), vB = ch("V", "B"), vC = ch("V", "C"), iN = ch("I", "N");
  const res: FaultResult = { inception: null, type: "no fault detected", faulted: [], ground: false, pre: {}, fault: {}, peak: {}, trip: null, cbOpen: null, cleared: null, z: null, zLoop: "", distanceKm: null, i0: null, findings: F };
  if (iA < 0 || iB < 0 || iC < 0) { add("warning", "Phase currents A, B, C not identified (channel unit A/kA and phase A/B/C or names such as IA, IL1). Fault analysis needs them."); return res; }
  const dt = r.t[1] - r.t[0], N = Math.round(1 / f / dt), I = [iA, iB, iC].map((k) => r.a[k]);
  const ref = Math.max(1, ...I.map((x) => Math.max(...x.slice(0, N).map(Math.abs))));
  // inception: first sample where any phase current differs from one cycle earlier by more than 50 % of the pre-fault peak (and 5 % of the record peak)
  const recPeak = Math.max(...I.map((x) => Math.max(...x.map(Math.abs))));
  let inc = -1;
  for (let k = N; k < r.n; k++) if (I.some((x) => Math.abs(x[k] - x[k - N]) > Math.max(0.5 * ref, 0.05 * recPeak))) { inc = k; break; }
  if (inc < 0) { add("info", "No step change in the currents: no fault in this record (or the record starts after the fault)."); return res; }
  res.inception = r.t[inc];
  const names = ["A", "B", "C"], pick = (k: number, tt: number) => phasorAt(r.a[k], r.t, tt, f);
  const tPre = r.t[Math.max(N, inc - Math.round(N / 4))], tF = r.t[Math.min(r.n - 1, inc + Math.round(1.75 * N))];
  for (const [n, k] of [["IA", iA], ["IB", iB], ["IC", iC], ["VA", vA], ["VB", vB], ["VC", vC], ["IN", iN]] as const) if (k >= 0) { res.pre[n] = pick(k, tPre); res.fault[n] = pick(k, tF); res.peak[n] = Math.max(...r.a[k].map(Math.abs)); }
  const preMax = Math.max(res.pre.IA.mag, res.pre.IB.mag, res.pre.IC.mag, 1), fmax = Math.max(res.fault.IA.mag, res.fault.IB.mag, res.fault.IC.mag);
  res.faulted = names.filter((n) => res.fault["I" + n].mag > Math.max(2 * preMax, 0.3 * fmax));
  const i0 = toPh([pol(res.fault.IA), pol(res.fault.IB), pol(res.fault.IC)].reduce((s, z) => C.add(s, z), [0, 0]).map((v) => v / 3));
  res.i0 = i0; res.ground = 3 * i0.mag > 0.15 * fmax;
  res.type = res.faulted.length === 3 ? (res.ground ? "three-phase to ground" : "three-phase") : res.faulted.length ? `${res.faulted.join("")}${res.ground ? "-G" : ""}${res.faulted.length === 1 && !res.ground ? " (no earth current?)" : ""}` : "unclear";
  // digital channels: trip and breaker
  const dIdx = (re: RegExp) => r.cfg.digital.findIndex((c) => re.test(c.id));
  const tr = dIdx(/trip|\btr\b|\.tr|op\b|operate|ptrc/i), cb = dIdx(/cb|52|qa\d|breaker|pos|xcbr/i);
  const edge = (k: number) => { const x = r.d[k], n0 = x[0]; const j = x.findIndex((v) => v !== n0); return j < 0 ? null : r.t[j]; };
  if (tr >= 0) { const te = edge(tr); if (te !== null) res.trip = { id: r.cfg.digital[tr].id, t: te }; }
  if (cb >= 0 && cb !== tr) { const te = edge(cb); if (te !== null) res.cbOpen = { id: r.cfg.digital[cb].id, t: te }; }
  // clearance: all phase currents below 2 x pre-fault for a cycle
  for (let k = inc + N; k + N < r.n; k++) { if (I.every((x) => Math.max(...x.slice(k, k + N).map(Math.abs)) < Math.max(2 * ref, 0.02 * recPeak))) { res.cleared = r.t[k]; break; } }
  // apparent impedance of the faulted loop
  if (vA >= 0 && vB >= 0 && vC >= 0) {
    const V = { A: pol(res.fault.VA), B: pol(res.fault.VB), C: pol(res.fault.VC) }, Ic = { A: pol(res.fault.IA), B: pol(res.fault.IB), C: pol(res.fault.IC) };
    const k0 = line ? pol({ mag: line.k0mag, ang: line.k0ang }) : [0, 0], I0x3 = C.mul(pol(i0), [3, 0]);
    let z: number[] | null = null;
    if (res.faulted.length === 1 && res.ground) { const p = res.faulted[0] as "A" | "B" | "C"; z = C.div(V[p], C.add(Ic[p], C.mul(k0, I0x3))); res.zLoop = `${p}-G (V${p} / (I${p} + k0·3I0)${line ? "" : ", k0 = 0 — enter the line data for the compensated loop"})`; }
    else if (res.faulted.length >= 2) { const [p, q] = res.faulted as ("A" | "B" | "C")[]; z = C.div(C.sub(V[p], V[q]), C.sub(Ic[p], Ic[q])); res.zLoop = `${p}${q} (V${p} − V${q}) / (I${p} − I${q})`; }
    if (z) { res.z = toPh(z); if (line && line.z1 > 0) res.distanceKm = res.z.mag * Math.cos(((res.z.ang - line.ang1) * Math.PI) / 180) / line.z1; }
  }
  // findings
  const ms = (x: number | null) => (x === null || res.inception === null ? "—" : `${((x - res.inception) * 1000).toFixed(1)} ms`);
  add("info", `Fault ${res.type} at ${new Date((r.cfg.startT + res.inception) * 1000).toISOString().replace("T", " ").replace("Z", "")} UTC (record time ${(res.inception * 1000).toFixed(1)} ms): ${res.faulted.map((p) => `I${p} = ${(res.fault["I" + p].mag / 1000).toFixed(2)} kA`).join(", ")}${res.ground ? `, 3I0 = ${((3 * i0.mag) / 1000).toFixed(2)} kA` : ""}.`);
  if (res.trip) add("info", `Trip (${res.trip.id}) ${ms(res.trip.t)} after inception.`); else add("info", "No trip signal identified among the digital channels.");
  if (res.cbOpen) add("info", `Breaker change of state (${res.cbOpen.id}) ${ms(res.cbOpen.t)} after inception${res.trip ? `, ${((res.cbOpen.t - res.trip.t) * 1000).toFixed(1)} ms after the trip (breaker operating time)` : ""}.`);
  if (res.cleared !== null) { const c = (res.cleared - res.inception) * 1000; add(c > 150 ? "warning" : "ok", `Fault current cleared ${c.toFixed(0)} ms after inception.${c > 150 ? " Longer than a typical zone 1 clearance (about 60–100 ms on transmission lines): check relay operating time and breaker." : ""}`); }
  else add("warning", "The fault current is not cleared within the record.");
  if (res.z) add("info", `Apparent impedance of loop ${res.zLoop}: ${res.z.mag.toFixed(2)} Ω ∠ ${res.z.ang.toFixed(1)}° primary${res.distanceKm !== null ? `, about ${res.distanceKm.toFixed(1)} km with the line data entered` : ""}.`);
  const sumDev = iN >= 0 ? Math.abs(res.fault.IN.mag - 3 * i0.mag) : 0;
  if (iN >= 0 && sumDev > 0.1 * Math.max(3 * i0.mag, 100)) add("warning", `Measured IN (${(res.fault.IN.mag / 1000).toFixed(2)} kA) differs from 3I0 = IA + IB + IC (${((3 * i0.mag) / 1000).toFixed(2)} kA): check the neutral channel's scaling or wiring.`);
  for (const iss of r.issues) add("warning", iss);
  return res;
}
