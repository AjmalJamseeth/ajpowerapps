// Thermocouple (NIST ITS-90) and RTD (IEC 60751) temperature conversion.
//
// THERMOCOUPLES: implements the official NIST ITS-90 "inverse" polynomial
// functions (millivolts -> °C) for the four most common base-metal types
// used in general industrial instrumentation — K, J, T, E — which together
// cover the large majority of real-world process/HVAC/industrial thermocouple
// installations. Source: NIST Monograph 175 / ITS-90 thermocouple database
// (its90.nist.gov, successor to srdata.nist.gov/its90). Rare-metal/
// high-temperature types (N, R, S, B) are NOT yet implemented — seeing them
// this honestly in the UI rather than risking unverified coefficients.
//
// Cold-junction compensation uses the superposition law of thermoelectric
// circuits (E(Thot,0) = E(Thot,Tcj) + E(Tcj,0)) and gets the "equivalent mV"
// of the cold-junction temperature by NUMERICALLY INVERTING the same trusted
// inverse polynomial (bisection) rather than relying on a separately-fitted
// forward polynomial — this halves the amount of hand-transcribed NIST
// coefficient data that has to be correct, since only the inverse table is
// used in both directions.
//
// RTD: Callendar-Van Dusen equation, IEC 60751 standard "alpha-385" platinum
// coefficients. Above-zero branch inverted via exact quadratic formula;
// below-zero (quartic) branch inverted via Newton-Raphson iteration.

export type TcType = "K" | "J" | "T" | "E";

interface TcRange {
  minMv: number;
  maxMv: number;
  d: number[]; // d0 + d1*E + d2*E^2 + ... , E in mV, result in °C
}

// NIST ITS-90 inverse coefficients (E in mV). Each type's ranges cover its
// standard thermocouple-grade span.
const TC_INVERSE: Record<TcType, TcRange[]> = {
  K: [
    { minMv: -5.891, maxMv: 0, d: [0.0, 2.5173462e1, -1.1662878e0, -1.0833638e0, -8.9773540e-1, -3.7342377e-1, -8.6632643e-2, -1.0450598e-2, -5.1920577e-4] },
    { minMv: 0, maxMv: 20.644, d: [0.0, 2.508355e1, 7.860106e-2, -2.503131e-1, 8.31527e-2, -1.228034e-2, 9.804036e-4, -4.41303e-5, 1.057734e-6, -1.052755e-8] },
    { minMv: 20.644, maxMv: 54.886, d: [-1.318058e2, 4.830222e1, -1.646031e0, 5.464731e-2, -9.650715e-4, 8.802193e-6, -3.11081e-8] },
  ],
  J: [
    { minMv: -8.095, maxMv: 0, d: [0.0, 1.9528268e1, -1.2286185e0, -1.0752178e0, -5.9086933e-1, -1.7256713e-1, -2.8131513e-2, -2.3963370e-3, -8.3823321e-5] },
    { minMv: 0, maxMv: 42.919, d: [0.0, 1.978425e1, -2.001204e-1, 1.036969e-2, -2.549687e-4, 3.585153e-6, -5.344285e-8, 5.09989e-10] },
    { minMv: 42.919, maxMv: 69.553, d: [-3.11358187e3, 3.00543684e2, -9.9477323e0, 1.7027663e-1, -1.43033468e-3, 4.73886084e-6] },
  ],
  T: [
    { minMv: -5.603, maxMv: 0, d: [0.0, 2.5949192e1, -2.1316967e-1, 7.9018692e-1, 4.2527777e-1, 1.3304473e-1, 2.0241446e-2, 1.2668171e-3] },
    { minMv: 0, maxMv: 20.872, d: [0.0, 2.5928e1, -7.602961e-1, 4.637791e-2, -2.165394e-3, 6.048144e-5, -7.293422e-7] },
  ],
  E: [
    { minMv: -8.825, maxMv: 0, d: [0.0, 1.6977288e1, -4.351497e-1, -1.5859697e-1, -9.2502871e-2, -2.6084314e-2, -4.1360199e-3, -3.403403e-4, -1.156489e-5] },
    { minMv: 0, maxMv: 76.373, d: [0.0, 1.7057035e1, -2.3301759e-1, 6.5435585e-3, -7.3562749e-5, -1.7896001e-6, 8.4036165e-8, -1.3735879e-9, 1.0629823e-11, -3.2447087e-14] },
  ],
};

// Overall thermocouple-grade mV span used as the bisection search domain for
// numeric inversion (temperature -> equivalent mV).
const TC_SPAN: Record<TcType, { minMv: number; maxMv: number }> = {
  K: { minMv: -5.891, maxMv: 54.886 },
  J: { minMv: -8.095, maxMv: 69.553 },
  T: { minMv: -5.603, maxMv: 20.872 },
  E: { minMv: -8.825, maxMv: 76.373 },
};

function polyEval(d: number[], x: number): number {
  let result = 0;
  let xp = 1;
  for (const c of d) {
    result += c * xp;
    xp *= x;
  }
  return result;
}

// Millivolts -> °C using the official NIST inverse polynomial.
export function tcMvToTempC(type: TcType, mv: number): number | null {
  const ranges = TC_INVERSE[type];
  for (const r of ranges) {
    if (mv >= r.minMv - 1e-9 && mv <= r.maxMv + 1e-9) {
      return polyEval(r.d, mv);
    }
  }
  return null; // out of the standard thermocouple-grade range
}

// °C -> millivolts, by numerically inverting tcMvToTempC via bisection.
// tcMvToTempC is monotonically increasing in mv over the standard range, so
// bisection is safe and converges quickly.
export function tcTempCToMv(type: TcType, tempC: number): number | null {
  const span = TC_SPAN[type];
  let lo = span.minMv;
  let hi = span.maxMv;
  const tLo = tcMvToTempC(type, lo);
  const tHi = tcMvToTempC(type, hi);
  if (tLo == null || tHi == null) return null;
  if (tempC < tLo - 0.5 || tempC > tHi + 0.5) return null; // outside range

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const tMid = tcMvToTempC(type, mid);
    if (tMid == null) return null;
    if (tMid < tempC) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface TcCjcInput {
  type: TcType;
  measuredMv: number | null;
  coldJunctionTempC: number | null;
}

export interface TcCjcResult {
  cjcEquivalentMv: number | null;
  totalMv: number | null;
  hotJunctionTempC: number | null;
}

// Compensated hot-junction temperature from a measured (raw) thermocouple
// voltage plus the known cold-junction (reference) temperature.
export function calcTcCjc(input: TcCjcInput): TcCjcResult {
  const { type, measuredMv, coldJunctionTempC } = input;
  if (measuredMv == null || coldJunctionTempC == null) {
    return { cjcEquivalentMv: null, totalMv: null, hotJunctionTempC: null };
  }
  const cjcEquivalentMv = tcTempCToMv(type, coldJunctionTempC);
  if (cjcEquivalentMv == null) {
    return { cjcEquivalentMv: null, totalMv: null, hotJunctionTempC: null };
  }
  const totalMv = measuredMv + cjcEquivalentMv;
  const hotJunctionTempC = tcMvToTempC(type, totalMv);
  return { cjcEquivalentMv, totalMv, hotJunctionTempC };
}

// ---------------------------------------------------------------------------
// RTD — IEC 60751 Callendar-Van Dusen, alpha = 0.00385 ("alpha-385")
// ---------------------------------------------------------------------------

export type RtdNominal = 100 | 500 | 1000; // Pt100 / Pt500 / Pt1000, R0 in Ω
export type RtdWiring = "2-wire" | "3-wire" | "4-wire";

const CVD_A = 3.9083e-3;
const CVD_B = -5.775e-7;
const CVD_C = -4.183e-12;

// Resistance at temperature t (°C), R0 = resistance at 0°C.
export function rtdResistanceAtTemp(r0: number, tempC: number): number {
  if (tempC >= 0) {
    return r0 * (1 + CVD_A * tempC + CVD_B * tempC * tempC);
  }
  const t = tempC;
  return r0 * (1 + CVD_A * t + CVD_B * t * t + CVD_C * (t - 100) * t * t * t);
}

// Temperature from measured resistance. Tries the exact quadratic form for
// the t>=0 branch first; if that gives a negative result (or R < R0), falls
// back to Newton-Raphson on the full quartic (t<0) form.
export function rtdTempFromResistance(r0: number, r: number): number | null {
  if (r <= 0) return null;

  if (r >= r0) {
    // Quadratic: R0*B*t^2 + R0*A*t - (R - R0) = 0
    const a = r0 * CVD_B;
    const b = r0 * CVD_A;
    const c = -(r - r0);
    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;
    const t = (-b + Math.sqrt(disc)) / (2 * a);
    return t;
  }

  // Below 0°C: Newton-Raphson on the quartic Callendar-Van Dusen form.
  let t = -50;
  for (let i = 0; i < 50; i++) {
    const f = rtdResistanceAtTemp(r0, t) - r;
    const h = 1e-4;
    const dF = (rtdResistanceAtTemp(r0, t + h) - rtdResistanceAtTemp(r0, t - h)) / (2 * h);
    if (Math.abs(dF) < 1e-12) break;
    const tNext = t - f / dF;
    if (Math.abs(tNext - t) < 1e-7) {
      t = tNext;
      break;
    }
    t = tNext;
  }
  return t;
}

export interface RtdInput {
  nominal: RtdNominal;
  wiring: RtdWiring;
  measuredOhms: number | null;
  leadOhmsPerWire: number; // per-conductor lead resistance, if known (0 if unknown/negligible)
}

export const DEFAULT_RTD_INPUT: RtdInput = {
  nominal: 100,
  wiring: "3-wire",
  measuredOhms: 108.5,
  leadOhmsPerWire: 0,
};

export interface RtdResult {
  compensatedOhms: number | null;
  tempC: number | null;
  leadErrorNote: string;
}

export function calcRtd(input: RtdInput): RtdResult {
  const { nominal, wiring, measuredOhms, leadOhmsPerWire } = input;
  if (measuredOhms == null) {
    return { compensatedOhms: null, tempC: null, leadErrorNote: "" };
  }

  let compensatedOhms = measuredOhms;
  let leadErrorNote = "";
  if (wiring === "2-wire") {
    compensatedOhms = measuredOhms - 2 * leadOhmsPerWire;
    leadErrorNote = "2-wire: both lead resistances subtracted directly — largest source of error over long runs.";
  } else if (wiring === "3-wire") {
    compensatedOhms = measuredOhms - leadOhmsPerWire;
    leadErrorNote = "3-wire: lead resistance substantially cancelled, assuming matched lead lengths/gauge — small residual error remains in practice.";
  } else {
    leadErrorNote = "4-wire (Kelvin): lead resistance fully excluded from the measurement.";
  }

  const tempC = rtdTempFromResistance(nominal, compensatedOhms);
  return { compensatedOhms, tempC, leadErrorNote };
}
