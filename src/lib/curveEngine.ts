// TypeScript port of the Protection Coordination Workbench (PCW-PRO) curve engine.
//
// This is the single place where time-current characteristics are calculated
// for the optimiser and the workbench bridge. It is a line-for-line port of the
// workbench's own `curve-engine.js` (which stays embedded in the workbench file
// unchanged); `scripts/regression-test.ts` extracts that original from
// `public/protection-suite/index.html` and checks this port against it over
// thousands of inputs, so any drift between the two is caught.
//
// Standards and conventions (as documented in the original):
//  - IEC 60255-151 IDMT:  t = TMS · k / ((I/Is)^α − 1)
//  - IEEE C37.112 IDMT:   t = TDS · (A / ((I/Is)^p − 1) + B)
//  - definite time, instantaneous, custom equation / point table (log-log)
//  - LSIG and thermal-magnetic breakers (generic piecewise model, ± band)
//  - MCB (IEC 60898 gates), gG fuse (IEC 60269 gates), motor thermal replica
//    (IEC 60255-8), negative sequence I2²t = K, differential characteristics
//  - transformer through-fault withstand (IEEE C57.109), cable adiabatic limit
//    (IEC 60364-5-54), transformer inrush marker, motor starting current

export type Pt = [number, number];

export const IEC_CURVES = {
  standard_inverse: { k: 0.14, alpha: 0.02, label: "IEC Standard Inverse (IEC Curve A)" },
  very_inverse: { k: 13.5, alpha: 1.0, label: "IEC Very Inverse (IEC Curve B)" },
  extremely_inverse: { k: 80.0, alpha: 2.0, label: "IEC Extremely Inverse (IEC Curve C)" },
  long_time_inverse: { k: 120.0, alpha: 1.0, label: "IEC Long-Time Inverse" },
} as const;

export const IEEE_CURVES = {
  moderately_inverse: { A: 0.0515, p: 0.02, B: 0.114, label: "IEEE Moderately Inverse" },
  very_inverse: { A: 19.61, p: 2.0, B: 0.491, label: "IEEE Very Inverse" },
  extremely_inverse: { A: 28.2, p: 2.0, B: 0.1217, label: "IEEE Extremely Inverse" },
} as const;

export type IecKey = keyof typeof IEC_CURVES;
export type IeeeKey = keyof typeof IEEE_CURVES;

export function iecTime(curveKey: string, tms: number, pickupMultiple: number): number {
  const c = (IEC_CURVES as Record<string, { k: number; alpha: number }>)[curveKey];
  if (!c) throw new Error("Unknown IEC curve: " + curveKey);
  if (!(pickupMultiple > 1)) return Infinity;
  if (!(tms > 0)) throw new Error("TMS must be > 0");
  return (tms * c.k) / (Math.pow(pickupMultiple, c.alpha) - 1);
}

export function ieeeTime(curveKey: string, tds: number, pickupMultiple: number): number {
  const c = (IEEE_CURVES as Record<string, { A: number; p: number; B: number }>)[curveKey];
  if (!c) throw new Error("Unknown IEEE curve: " + curveKey);
  if (!(pickupMultiple > 1)) return Infinity;
  if (!(tds > 0)) throw new Error("TDS must be > 0");
  return tds * (c.A / (Math.pow(pickupMultiple, c.p) - 1) + c.B);
}

export function definiteTime(pickupA: number, delayS: number, I: number): number {
  return I > pickupA ? delayS : Infinity;
}

export function instantaneousTime(pickupA: number, I: number, operateS?: number): number {
  const t = typeof operateS === "number" ? operateS : 0.02;
  return I > pickupA ? t : Infinity;
}

export type CustomEqParams = { k?: number; alpha?: number; L?: number; A?: number; p?: number; B?: number };

export function customEquationTime(params: CustomEqParams, tms: number, pickupMultiple: number): number {
  if (!(pickupMultiple > 1)) return Infinity;
  if ("k" in params && "alpha" in params) {
    const L = params.L || 0;
    return (tms * (params.k as number)) / (Math.pow(pickupMultiple, params.alpha as number) - 1) + L;
  }
  if ("A" in params && "p" in params) {
    const B = params.B || 0;
    return tms * ((params.A as number) / (Math.pow(pickupMultiple, params.p as number) - 1) + B);
  }
  throw new Error("customEquationTime: params must have {k,alpha[,L]} or {A,p[,B]}");
}

/** Log-log interpolation of a (current, time) table; end points are held flat outside the table. */
export function pointTableTime(points: Pt[], I: number): number | null {
  if (!points || points.length < 2) throw new Error("pointTableTime needs at least 2 points");
  const pts = points.slice().sort((a, b) => a[0] - b[0]);
  if (I <= pts[0][0]) return pts[0][1];
  if (I >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [i1, t1] = pts[i];
    const [i2, t2] = pts[i + 1];
    if (I >= i1 && I <= i2) {
      const f = (Math.log10(I) - Math.log10(i1)) / (Math.log10(i2) - Math.log10(i1));
      return Math.pow(10, Math.log10(t1) + f * (Math.log10(t2) - Math.log10(t1)));
    }
  }
  return null;
}

// ---------------------------------------------------------------- LSIG / thermal-magnetic
export interface LsigParams {
  Ir: number;
  TL: number;
  Ist: number;
  TS: number;
  stI2tOn?: boolean;
  Iinst?: number;
  instDelay?: number;
}

/** Long-time thermal-memory approximation anchored at t(2·Ir) = TL. */
export function longTimeSeconds(Ir: number, TL: number, I: number): number {
  if (!(I > Ir)) return Infinity;
  return TL * Math.pow((2 * Ir) / I, 2);
}

export function lsigTime(p: LsigParams, I: number): number {
  const instDelay = typeof p.instDelay === "number" ? p.instDelay : 0.02;
  if (p.Iinst && I >= p.Iinst) return instDelay;
  if (I >= p.Ist) return p.stI2tOn ? p.TS * Math.pow(p.Ist / I, 2) : p.TS;
  if (I > p.Ir) return longTimeSeconds(p.Ir, p.TL, I);
  return Infinity;
}

export function lsigBand(p: LsigParams, tolerancePct: number | undefined, currentSamples: number[]) {
  const tol = typeof tolerancePct === "number" ? tolerancePct : 0.2;
  return currentSamples.map((I) => {
    const t = lsigTime(p, I);
    if (!isFinite(t)) return { current: I, lower: Infinity, upper: Infinity };
    return { current: I, lower: t * (1 - tol), upper: t * (1 + tol) };
  });
}

export interface ThermalMagParams {
  Ir: number;
  TL: number;
  Iinst?: number;
  instDelay?: number;
}

export function thermalMagneticTime(p: ThermalMagParams, I: number): number {
  const instDelay = typeof p.instDelay === "number" ? p.instDelay : 0.02;
  if (p.Iinst && I >= p.Iinst) return instDelay;
  if (I > p.Ir) return longTimeSeconds(p.Ir, p.TL, I);
  return Infinity;
}

// ---------------------------------------------------------------- differential
export interface Diff2Params { pickup: number; slope1: number; breakpoint1: number; slope2: number }
export interface Diff3Params { idMin: number; endSection1: number; endSection2: number; slopeSection2: number; slopeSection3: number; idUnre?: number }

export function diffOperateThreshold(p: Diff2Params, Irestraint: number): number {
  if (!(Irestraint > 0)) return p.pickup;
  if (Irestraint <= p.breakpoint1) return p.pickup + p.slope1 * Irestraint;
  const atBp = p.pickup + p.slope1 * p.breakpoint1;
  return atBp + p.slope2 * (Irestraint - p.breakpoint1);
}

export function diffOperateThreshold3Seg(p: Diff3Params, Irestraint: number): number {
  if (!(Irestraint > 0) || Irestraint <= p.endSection1) return p.idMin;
  if (Irestraint <= p.endSection2) return p.idMin + p.slopeSection2 * (Irestraint - p.endSection1);
  const atEnd2 = p.idMin + p.slopeSection2 * (p.endSection2 - p.endSection1);
  return atEnd2 + p.slopeSection3 * (Irestraint - p.endSection2);
}

export function diffTrips3Seg(p: Diff3Params, Irestraint: number, Ioperate: number): boolean {
  if (typeof p.idUnre === "number" && Ioperate > p.idUnre) return true;
  return Ioperate > diffOperateThreshold3Seg(p, Irestraint);
}

export function diffTrips(p: Diff2Params, Irestraint: number, Ioperate: number): boolean {
  return Ioperate > diffOperateThreshold(p, Irestraint);
}

export function diffCharacteristicPoints(p: Diff2Params, maxRestraint: number, n?: number): Pt[] {
  const count = n || 20;
  const out: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const I = (maxRestraint * i) / count;
    out.push([I, diffOperateThreshold(p, I)]);
  }
  return out;
}

export function diffCharacteristicPoints3Seg(p: Diff3Params, maxRestraint: number, n?: number): Pt[] {
  const count = n || 20;
  const out: Pt[] = [];
  for (let i = 0; i <= count; i++) {
    const I = (maxRestraint * i) / count;
    out.push([I, diffOperateThreshold3Seg(p, I)]);
  }
  return out;
}

// ---------------------------------------------------------------- damage / withstand curves
export const TRANSFORMER_CATEGORY_KVA_RANGES: Record<string, { minKVA: number; maxKVA: number }> = {
  I: { minKVA: 15, maxKVA: 500 },
  II: { minKVA: 501, maxKVA: 5000 },
  III: { minKVA: 5001, maxKVA: 30000 },
  IV: { minKVA: 30001, maxKVA: Infinity },
};
export const TRANSFORMER_MECHANICAL_FRACTION: Record<string, number> = { I: 1, II: 0.7, III: 0.5, IV: 0.5 };

export function transformerCategoryFromKVA(kVA: number): string {
  for (const cat in TRANSFORMER_CATEGORY_KVA_RANGES) {
    const r = TRANSFORMER_CATEGORY_KVA_RANGES[cat];
    if (kVA >= r.minKVA && kVA <= r.maxKVA) return cat;
  }
  throw new Error("transformerCategoryFromKVA: kVA out of any defined range: " + kVA);
}

export function transformerBaseCurrentA(mvaRating: number, kvLine: number): number {
  if (!(mvaRating > 0) || !(kvLine > 0)) throw new Error("transformerBaseCurrentA: mvaRating and kvLine must be > 0");
  return (mvaRating * 1e6) / (Math.sqrt(3) * kvLine * 1e3);
}

export interface WithstandResult {
  points: Pt[];
  maxThroughFaultPu: number;
  thermalUpperBoundPu: number;
  truncatedForMechanicalDuty: boolean;
  note: string;
}

export function transformerWithstandPoints(p: { impedancePct: number; category: string; minPu?: number; points?: number }): WithstandResult {
  const minPu = p.minPu || 2;
  const nPts = p.points || 20;
  const Zpu = p.impedancePct / 100;
  if (!(Zpu > 0)) throw new Error("transformerWithstandPoints: impedancePct must be > 0");
  const mech = TRANSFORMER_MECHANICAL_FRACTION[p.category];
  if (mech === undefined) throw new Error('transformerWithstandPoints: unknown category "' + p.category + '"');
  const Imax = 1 / Zpu;
  const upperPu = mech * Imax;
  const lo = Math.min(minPu, upperPu * 0.99);
  const points: Pt[] = [];
  for (let i = 0; i <= nPts; i++) {
    const Ipu = lo + (upperPu - lo) * (i / nPts);
    points.push([Ipu, 1250 / (Ipu * Ipu)]);
  }
  const truncated = p.category !== "I";
  return {
    points,
    maxThroughFaultPu: Imax,
    thermalUpperBoundPu: upperPu,
    truncatedForMechanicalDuty: truncated,
    note: truncated
      ? "Thermal (I²t=1250) portion only, up to " + Math.round(mech * 100) + "% of maximum through-fault current (" + upperPu.toFixed(1) + " pu). Beyond this, IEEE C57.109\u2019s mechanical-duty withstand applies — consult the standard or the transformer manufacturer; not calculated here (see code comment for why)."
      : "Full combined thermal/mechanical curve per IEEE C57.109 Category I.",
  };
}

export function transformerWithstandPointsAmps(mvaRating: number, kvLine: number, p: { impedancePct: number; category: string; minPu?: number; points?: number }) {
  const baseA = transformerBaseCurrentA(mvaRating, kvLine);
  const pu = transformerWithstandPoints(p);
  return { ...pu, points: pu.points.map(([Ipu, t]) => [Ipu * baseA, t] as Pt) };
}

export const CABLE_K_VALUES: Record<string, Record<string, number>> = {
  copper: { pvc: 115, xlpe: 143 },
  aluminum: { pvc: 76, xlpe: 94 },
};

export function cableDamagePoints(p: { material: string; insulation: string; csaMm2: number; minA?: number; maxA?: number; points?: number }) {
  const k = CABLE_K_VALUES[p.material] && CABLE_K_VALUES[p.material][p.insulation];
  if (k === undefined) throw new Error('cableDamagePoints: unknown material/insulation combination "' + p.material + "/" + p.insulation + '"');
  if (!(p.csaMm2 > 0)) throw new Error("cableDamagePoints: csaMm2 must be > 0");
  const minA = p.minA || 100;
  const maxA = p.maxA || 100000;
  const nPts = p.points || 20;
  const kS = k * p.csaMm2;
  const points: Pt[] = [];
  for (let i = 0; i <= nPts; i++) {
    const I = minA * Math.pow(maxA / minA, i / nPts);
    points.push([I, Math.pow(kS / I, 2)]);
  }
  return { points, k, kS };
}

export function logSpace(min: number, max: number, n: number): number[] {
  const out: number[] = [];
  const lmin = Math.log10(min);
  const lmax = Math.log10(max);
  for (let i = 0; i < n; i++) out.push(Math.pow(10, lmin + (i / (n - 1)) * (lmax - lmin)));
  return out;
}

// ---------------------------------------------------------------- motor, MCB, fuse, negative sequence
export function motorThermalTime(p: { tau: number; Ith: number; Ip?: number }, I: number): number {
  if (!(p.tau > 0)) throw new Error("motorThermalTime: tau must be > 0");
  if (!(p.Ith > 0)) throw new Error("motorThermalTime: Ith must be > 0");
  const Ip = p.Ip || 0;
  if (!(I > p.Ith)) return Infinity;
  return p.tau * Math.log((I * I - Ip * Ip) / (I * I - p.Ith * p.Ith));
}

export const MCB_INSTANTANEOUS_BAND: Record<string, [number, number]> = { B: [3, 5], C: [5, 10], D: [10, 20] };

export function mcbCurvePoints(type: string, InAmps: number): Pt[] {
  const band = MCB_INSTANTANEOUS_BAND[type];
  if (!band) throw new Error('mcbCurvePoints: unknown MCB type "' + type + '" (expected B, C, or D)');
  if (!(InAmps > 0)) throw new Error("mcbCurvePoints: InAmps must be > 0");
  const convTimeS = 3600;
  return [
    [1.13 * InAmps, convTimeS * 2],
    [1.45 * InAmps, convTimeS],
    [2.55 * InAmps, 60],
    [band[0] * InAmps, 0.15],
    [band[1] * InAmps, 0.02],
  ];
}

export function fuseGateForRating(InAmps: number): { Inf: number; If: number; hours: number } {
  if (InAmps <= 4) return { Inf: 1.5, If: 2.1, hours: 1 };
  if (InAmps < 16) return { Inf: 1.5, If: 1.9, hours: 1 };
  if (InAmps <= 63) return { Inf: 1.25, If: 1.6, hours: 1 };
  if (InAmps <= 160) return { Inf: 1.25, If: 1.6, hours: 2 };
  if (InAmps <= 400) return { Inf: 1.25, If: 1.6, hours: 3 };
  return { Inf: 1.25, If: 1.6, hours: 4 };
}

export function fuseCurvePoints(InAmps: number): Pt[] {
  if (!(InAmps > 0)) throw new Error("fuseCurvePoints: InAmps must be > 0");
  const gate = fuseGateForRating(InAmps);
  const conv = gate.hours * 3600;
  return [
    [gate.Inf * InAmps, conv * 1.5],
    [gate.If * InAmps, conv],
    [5 * InAmps, 3],
  ];
}

export function fuseMinMeltPoints(InAmps: number): Pt[] {
  if (!(InAmps > 0)) throw new Error("fuseMinMeltPoints: InAmps must be > 0");
  const gate = fuseGateForRating(InAmps);
  return [
    [gate.Inf * InAmps, gate.hours * 3600],
    [5 * InAmps, 2],
  ];
}

export function fuseTotalClearPoints(InAmps: number): Pt[] {
  if (!(InAmps > 0)) throw new Error("fuseTotalClearPoints: InAmps must be > 0");
  const gate = fuseGateForRating(InAmps);
  return [
    [gate.If * InAmps, gate.hours * 3600],
    [5 * InAmps, 3],
  ];
}

export function negSeqTime(p: { K: number; I1rated: number; pickupPu?: number; minTimeS?: number }, I2: number): number {
  if (!(p.K > 0)) throw new Error("negSeqTime: K must be > 0");
  if (!(p.I1rated > 0)) throw new Error("negSeqTime: I1rated must be > 0");
  const pickupPu = typeof p.pickupPu === "number" ? p.pickupPu : 0.05;
  const minTimeS = typeof p.minTimeS === "number" ? p.minTimeS : 0.2;
  const I2pu = I2 / p.I1rated;
  if (!(I2pu > pickupPu)) return Infinity;
  return Math.max(p.K / (I2pu * I2pu), minTimeS);
}

export function transformerInrushPoint(p: { mvaRating: number; kvLine: number; multiplier?: number; timeS?: number }) {
  const baseA = transformerBaseCurrentA(p.mvaRating, p.kvLine);
  const multiplier = typeof p.multiplier === "number" ? p.multiplier : p.mvaRating >= 3 ? 12 : 8;
  const timeS = typeof p.timeS === "number" ? p.timeS : 0.1;
  return { currentA: baseA * multiplier, timeS, multiplier };
}

export const NEMA_CODE_LETTER_KVA_PER_HP: Record<string, [number, number]> = {
  A: [0, 3.14], B: [3.15, 3.54], C: [3.55, 3.99], D: [4.0, 4.49], E: [4.5, 4.99], F: [5.0, 5.59], G: [5.6, 6.29],
  H: [6.3, 7.09], J: [7.1, 7.99], K: [8.0, 8.99], L: [9.0, 9.99], M: [10.0, 11.19], N: [11.2, 12.49], P: [12.5, 13.99],
  R: [14.0, 15.99], S: [16.0, 17.99], T: [18.0, 19.99], U: [20.0, 22.39], V: [22.4, 22.4],
};

export function motorStartingCurrentByMultiplier(flcA: number, multiplier: number): number {
  if (!(flcA > 0)) throw new Error("motorStartingCurrentByMultiplier: flcA must be > 0");
  if (!(multiplier > 0)) throw new Error("motorStartingCurrentByMultiplier: multiplier must be > 0");
  return flcA * multiplier;
}

export function motorStartingCurrentByNemaCode(hp: number, voltageV: number, codeLetter: string) {
  if (!(hp > 0)) throw new Error("motorStartingCurrentByNemaCode: hp must be > 0");
  if (!(voltageV > 0)) throw new Error("motorStartingCurrentByNemaCode: voltageV must be > 0");
  const range = NEMA_CODE_LETTER_KVA_PER_HP[codeLetter];
  if (!range) throw new Error('motorStartingCurrentByNemaCode: unknown code letter "' + codeLetter + '"');
  const base = (kvaPerHp: number) => (kvaPerHp * hp * 1000) / (Math.sqrt(3) * voltageV);
  const minA = base(range[0]);
  const maxA = base(range[1]);
  return { minA, midA: (minA + maxA) / 2, maxA, kvaPerHpRange: range };
}

export function suggestTmsScaleFactor(pairs: { currentTime: number; requiredTime: number }[]): number | null {
  const SAFETY_BUFFER = 1.01;
  let maxRatio = 1;
  let any = false;
  pairs.forEach((p) => {
    if (isFinite(p.currentTime) && p.currentTime > 0 && isFinite(p.requiredTime)) {
      any = true;
      const ratio = p.requiredTime / p.currentTime;
      if (ratio > maxRatio) maxRatio = ratio;
    }
  });
  if (!any) return null;
  return maxRatio > 1 ? maxRatio * SAFETY_BUFFER : 1;
}
