// IEEE Std 1584-2018 arc-flash model: arcing current, incident energy and
// arc-flash boundary for 208 V – 15 kV three-phase systems, with the
// enclosure-size correction, arcing-current variation, voltage interpolation
// and the <= 600 V equations (Eq. 25). Coefficient tables below were generated
// directly from the standard; the code is verified against both worked
// examples in the standard's Annex D (4.16 kV VCB and 480 V VCB) in
// scripts/regression-test.ts.

export type ElectrodeConfig = "VCB" | "VCBB" | "HCB" | "VOA" | "HOA";
export type VoltKey = "600" | "2700" | "14300";

// GENERATED coefficient tables — IEEE Std 1584-2018 Tables 1, 2, 3, 4, 5 and 7.
/** Table 1 — k1..k10 for Equation (1), keyed by open-circuit voltage (V). */
const T1: Record<ElectrodeConfig, Record<VoltKey, number[]>> = {
  VCB: {
    "600": [-0.04287, 1.035, -0.083, 0.0, 0.0, -4.783e-09, 1.962e-06, -0.000229, 0.003141, 1.092],
    "2700": [0.0065, 1.001, -0.024, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729],
    "14300": [0.005795, 1.015, -0.011, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729],
  },
  VCBB: {
    "600": [-0.017432, 0.98, -0.05, 0.0, 0.0, -5.767e-09, 2.524e-06, -0.00034, 0.01187, 1.013],
    "2700": [0.002823, 0.995, -0.0125, 0.0, -9.204e-11, 2.901e-08, -3.262e-06, 0.0001569, -0.004003, 0.9825],
    "14300": [0.014827, 1.01, -0.01, 0.0, -9.204e-11, 2.901e-08, -3.262e-06, 0.0001569, -0.004003, 0.9825],
  },
  HCB: {
    "600": [0.054922, 0.988, -0.11, 0.0, 0.0, -5.382e-09, 2.316e-06, -0.000302, 0.0091, 0.9725],
    "2700": [0.001011, 1.003, -0.0249, 0.0, 0.0, 4.859e-10, -1.814e-07, -9.128e-06, -0.0007, 0.9881],
    "14300": [0.008693, 0.999, -0.02, 0.0, -5.043e-11, 2.233e-08, -3.046e-06, 0.000116, -0.001145, 0.9839],
  },
  VOA: {
    "600": [0.043785, 1.04, -0.18, 0.0, 0.0, -4.783e-09, 1.962e-06, -0.000229, 0.003141, 1.092],
    "2700": [-0.02395, 1.006, -0.0188, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729],
    "14300": [0.005371, 1.0102, -0.029, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729],
  },
  HOA: {
    "600": [0.111147, 1.008, -0.24, 0.0, 0.0, -3.895e-09, 1.641e-06, -0.000197, 0.002615, 1.1],
    "2700": [0.000435, 1.006, -0.038, 0.0, 0.0, 7.859e-10, -1.914e-07, -9.128e-06, -0.0007, 0.9981],
    "14300": [0.000904, 0.999, -0.02, 0.0, 0.0, 7.859e-10, -1.914e-07, -9.128e-06, -0.0007, 0.9981],
  },
};
/** Table 2 — k1..k7 for Equation (2) (arcing-current variation). */
const T2: Record<ElectrodeConfig, number[]> = {
  VCB: [0.0, -1.4269e-06, 8.3137e-05, -0.0019382, 0.022366, -0.12645, 0.30226],
  VCBB: [1.138e-06, -6.0287e-05, 0.0012758, -0.013778, 0.080217, -0.24066, 0.33524],
  HCB: [0.0, -3.097e-06, 0.00016405, -0.0033609, 0.033308, -0.16182, 0.34627],
  VOA: [9.5606e-07, -5.1543e-05, 0.0011161, -0.01242, 0.075125, -0.23584, 0.33696],
  HOA: [0.0, -3.1555e-06, 0.0001682, -0.0034607, 0.034124, -0.1599, 0.34629],
};
/** Table 3 — k1..k13 for Equations (3), (6), (7), (10) at 600 V. */
const T3: Record<ElectrodeConfig, number[]> = {
  VCB: [0.753364, 0.566, 1.752636, 0.0, 0.0, -4.783e-09, 1.962e-06, -0.000229, 0.003141, 1.092, 0.0, -1.598, 0.957],
  VCBB: [3.068459, 0.26, -0.098107, 0.0, 0.0, -5.767e-09, 2.524e-06, -0.00034, 0.01187, 1.013, -0.06, -1.809, 1.19],
  HCB: [4.073745, 0.344, -0.370259, 0.0, 0.0, -5.382e-09, 2.316e-06, -0.000302, 0.0091, 0.9725, 0.0, -2.03, 1.036],
  VOA: [0.679294, 0.746, 1.222636, 0.0, 0.0, -4.783e-09, 1.962e-06, -0.000229, 0.003141, 1.092, 0.0, -1.598, 0.997],
  HOA: [3.470417, 0.465, -0.261863, 0.0, 0.0, -3.895e-09, 1.641e-06, -0.000197, 0.002615, 1.1, 0.0, -1.99, 1.04],
};
/** Table 4 — k1..k13 for Equations (4), (8) at 2700 V. */
const T4: Record<ElectrodeConfig, number[]> = {
  VCB: [2.40021, 0.165, 0.354202, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729, 0.0, -1.569, 0.9778],
  VCBB: [3.870592, 0.185, -0.736618, 0.0, -9.204e-11, 2.901e-08, -3.262e-06, 0.0001569, -0.004003, 0.9825, 0.0, -1.742, 1.09],
  HCB: [3.486391, 0.177, -0.193101, 0.0, 0.0, 4.859e-10, -1.814e-07, -9.128e-06, -0.0007, 0.9881, 0.027, -1.723, 1.055],
  VOA: [3.880724, 0.105, -1.906033, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729, 0.0, -1.515, 1.115],
  HOA: [3.616266, 0.149, -0.761561, 0.0, 0.0, 7.859e-10, -1.914e-07, -9.128e-06, -0.0007, 0.9981, 0.0, -1.639, 1.078],
};
/** Table 5 — k1..k13 for Equations (5), (9) at 14 300 V. */
const T5: Record<ElectrodeConfig, number[]> = {
  VCB: [3.825917, 0.11, -0.999749, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729, 0.0, -1.568, 0.99],
  VCBB: [3.644309, 0.215, -0.585522, 0.0, -9.204e-11, 2.901e-08, -3.262e-06, 0.0001569, -0.004003, 0.9825, 0.0, -1.677, 1.06],
  HCB: [3.044516, 0.125, 0.245106, 0.0, -5.043e-11, 2.233e-08, -3.046e-06, 0.000116, -0.001145, 0.9839, 0.0, -1.655, 1.084],
  VOA: [3.405454, 0.12, -0.93245, -1.557e-12, 4.556e-10, -4.186e-08, 8.346e-07, 5.482e-05, -0.003191, 0.9729, 0.0, -1.534, 0.979],
  HOA: [2.04049, 0.177, 1.005092, 0.0, 0.0, 7.859e-10, -1.914e-07, -9.128e-06, -0.0007, 0.9981, -0.05, -1.633, 1.151],
};
/** Table 7 — b1..b3 for Equations (14), (15). */
const T7: Record<"Typical" | "Shallow", Record<"VCB" | "VCBB" | "HCB", number[]>> = {
  Typical: {
    VCB: [-0.000302, 0.03441, 0.4325],
    VCBB: [-0.0002976, 0.032, 0.479],
    HCB: [-0.0001923, 0.01935, 0.6899],
  },
  Shallow: {
    VCB: [0.002222, -0.02556, 0.6222],
    VCBB: [-0.002778, 0.1194, -0.2778],
    HCB: [-0.0005556, 0.03722, 0.4778],
  },
};

// ============================================================================
// IEEE Std 1584-2018 model (208 V – 15 kV, three-phase)
// ============================================================================

export const ELECTRODE_CONFIG_INFO: { value: ElectrodeConfig; label: string; hint: string }[] = [
  { value: "VCB", label: "VCB — vertical electrodes in a metal box (enclosure)", hint: "Typical switchgear, MCC and panelboard bus: vertical conductors terminating in an insulating barrier-free box. The usual worst-case choice." },
  { value: "VCBB", label: "VCBB — vertical electrodes, insulating barrier, in a box", hint: "Vertical conductors ending at an insulating barrier (e.g. breaker stabs, molded-case terminals)." },
  { value: "HCB", label: "HCB — horizontal electrodes in a box", hint: "Horizontal conductors in a box (e.g. horizontal bus, some switchboards and cable compartments)." },
  { value: "VOA", label: "VOA — vertical electrodes in open air", hint: "Vertical conductors with no enclosure (open busbars, overhead/outdoor)." },
  { value: "HOA", label: "HOA — horizontal electrodes in open air", hint: "Horizontal conductors with no enclosure." },
];

export const J_PER_CAL = 4.184;
/** Arc-flash boundary threshold: 5.0 J/cm² (1.2 cal/cm²), IEEE 1584-2018 cl. 6.11. */
export const AFB_THRESHOLD_CAL = 1.2;

const lg = Math.log10;
const poly7 = (c: number[], x: number) =>
  c[3] * x ** 7 + c[4] * x ** 6 + c[5] * x ** 5 + c[6] * x ** 4 + c[7] * x ** 3 + c[8] * x ** 2 + c[9] * x;

const keyOf = (v: VoltKey) => v;
const T345 = (v: VoltKey, c: ElectrodeConfig) => (v === "600" ? T3[c] : v === "2700" ? T4[c] : T5[c]);

/** Equation (1): intermediate arcing current (kA) at 600 / 2700 / 14300 V. */
export function iarcIntermediate(v: VoltKey, ibfKa: number, gapMm: number, config: ElectrodeConfig): number {
  const k = T1[config][keyOf(v)];
  const p = k[3] * ibfKa ** 6 + k[4] * ibfKa ** 5 + k[5] * ibfKa ** 4 + k[6] * ibfKa ** 3 + k[7] * ibfKa ** 2 + k[8] * ibfKa + k[9];
  return 10 ** (k[0] + k[1] * lg(ibfKa) + k[2] * lg(gapMm)) * p;
}

/** Equation (2): arcing-current variation correction factor VarCf. */
export function varCf(vocKv: number, config: ElectrodeConfig): number {
  const k = T2[config];
  return k[0] * vocKv ** 6 + k[1] * vocKv ** 5 + k[2] * vocKv ** 4 + k[3] * vocKv ** 3 + k[4] * vocKv ** 2 + k[5] * vocKv + k[6];
}

/**
 * Equations (3)–(6): incident energy (J/cm²) at an intermediate voltage.
 * `iarcK3` is the arcing current in the k3 term and `iarcK13` the one in the
 * k13 term. They are equal for 600 V < Voc ≤ 15 kV; for Voc ≤ 600 V (Eq. 6)
 * the k3 term uses Iarc_600 while the k13 term uses the final Iarc.
 */
export function energyIntermediate(
  v: VoltKey, ibfKa: number, gapMm: number, tMs: number, dMm: number, cf: number, iarcK3: number, iarcK13: number, config: ElectrodeConfig
): number {
  const k = T345(v, config);
  const exponent =
    k[0] + k[1] * lg(gapMm) + (k[2] * iarcK3) / poly7(k, ibfKa) + k[10] * lg(ibfKa) + k[11] * lg(dMm) + k[12] * lg(iarcK13) + lg(1 / cf);
  return ((12.552 * tMs) / 50) * 10 ** exponent;
}

/** Equations (7)–(10): arc-flash boundary (mm) at an intermediate voltage. */
export function boundaryIntermediate(
  v: VoltKey, ibfKa: number, gapMm: number, tMs: number, cf: number, iarcK3: number, iarcK13: number, config: ElectrodeConfig
): number {
  const k = T345(v, config);
  const num = k[0] + k[1] * lg(gapMm) + (k[2] * iarcK3) / poly7(k, ibfKa) + k[10] * lg(ibfKa) + k[12] * lg(iarcK13) + lg(1 / cf) - lg(20 / tMs);
  return 10 ** (num / -k[11]);
}

/** Equation (25): final arcing current for 208 V ≤ Voc ≤ 600 V. */
export function iarcLowVoltage(vocKv: number, ibfKa: number, iarc600Ka: number): number {
  const inner = 1 / (iarc600Ka * iarc600Ka) - (0.6 * 0.6 - vocKv * vocKv) / (0.6 * 0.6 * ibfKa * ibfKa);
  return 1 / Math.sqrt((0.6 / vocKv) ** 2 * inner);
}

/** Equations (16)–(24): interpolate intermediate values to the actual Voc (kV). */
export function interpolateVoltage(v600: number, v2700: number, v14300: number, vocKv: number): number {
  const a1 = ((v2700 - v600) / 2.1) * (vocKv - 2.7) + v2700;
  const a2 = ((v14300 - v2700) / 11.6) * (vocKv - 14.3) + v14300;
  if (vocKv > 2.7) return a2;
  return (a1 * (2.7 - vocKv)) / 2.1 + (a2 * (vocKv - 0.6)) / 2.1;
}

export interface EnclosureCf {
  cf: number;
  ees: number;
  width1: number;
  height1: number;
  shallow: boolean;
}

/** Clause 4.8: enclosure size correction factor (CF = 1 for open-air configurations). */
export function enclosureCorrection(
  config: ElectrodeConfig, vocKv: number, widthMm: number, heightMm: number, depthMm: number
): EnclosureCf {
  if (config === "VOA" || config === "HOA") return { cf: 1, ees: 0, width1: 0, height1: 0, shallow: false };
  const shallow = vocKv < 0.6 && widthMm < 508 && heightMm < 508 && depthMm <= 203.2;
  const A = config === "VCB" ? 4 : 10;
  const B = config === "VCB" ? 20 : config === "VCBB" ? 24 : 22;
  const eq = (dim: number) => (660.4 + (dim - 660.4) * ((vocKv + A) / B)) / 25.4; // Eq (11)/(12)

  // Width1 (Table 6)
  let width1: number;
  if (widthMm < 508) width1 = shallow ? 0.03937 * widthMm : 20;
  else if (widthMm <= 660.4) width1 = 0.03937 * widthMm;
  else width1 = eq(Math.min(widthMm, 1244.6));

  // Height1 (Table 6) — VCB uses the height directly up to 1244.6 mm, then 49 in.
  let height1: number;
  if (heightMm < 508) height1 = shallow ? 0.03937 * heightMm : 20;
  else if (heightMm <= 660.4) height1 = 0.03937 * heightMm;
  else if (config === "VCB") height1 = heightMm <= 1244.6 ? 0.03937 * heightMm : 49;
  else height1 = eq(Math.min(heightMm, 1244.6));

  let ees = (height1 + width1) / 2;
  const b = T7[shallow ? "Shallow" : "Typical"][config as "VCB" | "VCBB" | "HCB"];
  if (!shallow && ees < 20) ees = 20;
  const p = b[0] * ees * ees + b[1] * ees + b[2];
  return { cf: shallow ? 1 / p : p, ees, width1, height1, shallow };
}

// ----------------------------------------------------------------------------
// Public model
// ----------------------------------------------------------------------------

export interface Af2018Input {
  ibfKa: number; // bolted three-phase fault current (kA rms symmetrical)
  vocKv: number; // open-circuit / system voltage, kV line-to-line
  gapMm: number;
  workingDistMm: number;
  config: ElectrodeConfig;
  widthMm: number;
  heightMm: number;
  depthMm: number;
  /** Arc duration in ms, or a function returning it for a given arcing current (kA). */
  durationMs: number | ((iarcKa: number) => number);
  /** Optional separate rule for the reduced-current case (defaults to durationMs). */
  durationMinMs?: number | ((iarcKa: number) => number);
}

export interface Af2018Case {
  label: "Average arcing current" | "Reduced arcing current";
  iarcKa: number;
  tMs: number;
  eJcm2: number;
  eCal: number;
  afbMm: number;
  intermediates: { iarc: [number, number, number] | [number]; e: [number, number, number] | [number]; afb: [number, number, number] | [number] };
}

export interface Af2018Result {
  cf: EnclosureCf;
  varCf: number;
  normal: Af2018Case;
  reduced: Af2018Case;
  governing: Af2018Case;
  eCal: number;
  afbMm: number;
  warnings: string[];
  steps: string[];
}

export function af2018Warnings(i: Pick<Af2018Input, "ibfKa" | "vocKv" | "gapMm" | "workingDistMm" | "widthMm" | "heightMm" | "config">): string[] {
  const w: string[] = [];
  const lowV = i.vocKv <= 0.6;
  if (i.vocKv < 0.208 || i.vocKv > 15) w.push(`Voltage ${i.vocKv} kV is outside the 0.208–15 kV range of the IEEE 1584-2018 model.`);
  if (lowV) {
    if (i.ibfKa < 0.5 || i.ibfKa > 106) w.push("Bolted fault current is outside the model range for 208–600 V (0.5–106 kA).");
    if (i.gapMm < 6.35 || i.gapMm > 76.2) w.push("Electrode gap is outside the model range for 208–600 V (6.35–76.2 mm).");
  } else {
    if (i.ibfKa < 0.2 || i.ibfKa > 65) w.push("Bolted fault current is outside the model range for 601 V–15 kV (0.2–65 kA).");
    if (i.gapMm < 19.05 || i.gapMm > 254) w.push("Electrode gap is outside the model range for 601 V–15 kV (19.05–254 mm).");
  }
  if (i.workingDistMm < 305) w.push("Working distance is below the 305 mm minimum of the model.");
  if (i.config === "VCB" || i.config === "VCBB" || i.config === "HCB") {
    if (i.widthMm < 4 * i.gapMm) w.push("Enclosure width should be larger than four times the electrode gap.");
    if (i.widthMm > 1244.6 || i.heightMm > 1244.6) w.push("Enclosure larger than 1244.6 mm: the model treats width/height as 1244.6 mm.");
  }
  if (lowV && i.vocKv <= 0.24 && i.ibfKa < 2) w.push("Sustainable arcs are possible but less likely at ≤240 V with less than 2 kA available.");
  return w;
}

function runCase(i: Af2018Input, cf: EnclosureCf, reduced: boolean, vcf: number): Af2018Case {
  const { ibfKa, vocKv, gapMm, workingDistMm, config } = i;
  const dur = reduced ? i.durationMinMs ?? i.durationMs : i.durationMs;
  const timeFor = (iarc: number) => (typeof dur === "function" ? dur(iarc) : dur);
  const factor = reduced ? 1 - 0.5 * vcf : 1;

  if (vocKv > 0.6) {
    const i600 = iarcIntermediate("600", ibfKa, gapMm, config) * factor;
    const i2700 = iarcIntermediate("2700", ibfKa, gapMm, config) * factor;
    const i14300 = iarcIntermediate("14300", ibfKa, gapMm, config) * factor;
    const iarc = interpolateVoltage(i600, i2700, i14300, vocKv);
    const t = timeFor(iarc);
    const e600 = energyIntermediate("600", ibfKa, gapMm, t, workingDistMm, cf.cf, i600, i600, config);
    const e2700 = energyIntermediate("2700", ibfKa, gapMm, t, workingDistMm, cf.cf, i2700, i2700, config);
    const e14300 = energyIntermediate("14300", ibfKa, gapMm, t, workingDistMm, cf.cf, i14300, i14300, config);
    const a600 = boundaryIntermediate("600", ibfKa, gapMm, t, cf.cf, i600, i600, config);
    const a2700 = boundaryIntermediate("2700", ibfKa, gapMm, t, cf.cf, i2700, i2700, config);
    const a14300 = boundaryIntermediate("14300", ibfKa, gapMm, t, cf.cf, i14300, i14300, config);
    const e = interpolateVoltage(e600, e2700, e14300, vocKv);
    return {
      label: reduced ? "Reduced arcing current" : "Average arcing current",
      iarcKa: iarc, tMs: t, eJcm2: e, eCal: e / J_PER_CAL, afbMm: interpolateVoltage(a600, a2700, a14300, vocKv),
      intermediates: { iarc: [i600, i2700, i14300], e: [e600, e2700, e14300], afb: [a600, a2700, a14300] },
    };
  }
  // 208 V – 600 V
  const i600 = iarcIntermediate("600", ibfKa, gapMm, config);
  const iarcAvg = iarcLowVoltage(vocKv, ibfKa, i600);
  const iarc = iarcAvg * factor;
  const t = timeFor(iarc);
  // Eq (6)/(10): the k3 term uses Iarc_600 (unreduced); the k13 term uses the final (or reduced) Iarc.
  const e = energyIntermediate("600", ibfKa, gapMm, t, workingDistMm, cf.cf, i600, iarc, config);
  const afb = boundaryIntermediate("600", ibfKa, gapMm, t, cf.cf, i600, iarc, config);
  return {
    label: reduced ? "Reduced arcing current" : "Average arcing current",
    iarcKa: iarc, tMs: t, eJcm2: e, eCal: e / J_PER_CAL, afbMm: afb,
    intermediates: { iarc: [iarc], e: [e], afb: [afb] },
  };
}

/** Complete IEEE 1584-2018 calculation for 208 V ≤ Voc ≤ 15 kV. */
export function calcAf2018(i: Af2018Input): Af2018Result {
  const cf = enclosureCorrection(i.config, i.vocKv, i.widthMm, i.heightMm, i.depthMm);
  const vcf = varCf(i.vocKv, i.config);
  const normal = runCase(i, cf, false, vcf);
  const reduced = runCase(i, cf, true, vcf);
  const governing = reduced.eJcm2 > normal.eJcm2 ? reduced : normal;
  const afbMm = Math.max(normal.afbMm, reduced.afbMm);

  const f = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "n/a");
  const steps: string[] = [];
  const low = i.vocKv <= 0.6;
  steps.push(
    `Inputs: Voc = ${f(i.vocKv, 3)} kV, Ibf = ${f(i.ibfKa)} kA, gap G = ${f(i.gapMm, 1)} mm, working distance D = ${f(i.workingDistMm, 1)} mm, configuration ${i.config}, enclosure ${f(i.heightMm, 0)} × ${f(i.widthMm, 0)} × ${f(i.depthMm, 0)} mm (H×W×D).`
  );
  if (i.config === "VOA" || i.config === "HOA") steps.push("Enclosure correction: open-air configuration → CF = 1 (Clause 4.8).");
  else
    steps.push(
      `Enclosure correction (4.8): ${cf.shallow ? "Shallow" : "Typical"} enclosure; Width1 = ${f(cf.width1, 3)} in, Height1 = ${f(cf.height1, 3)} in, EES = (H1+W1)/2 = ${f(cf.ees, 3)}; CF = ${cf.shallow ? "1/(b1·EES²+b2·EES+b3)" : "b1·EES²+b2·EES+b3"} = ${f(cf.cf, 3)}.`
    );
  const n = normal.intermediates;
  if (!low) {
    steps.push(
      `Intermediate arcing currents, Eq (1): Iarc_600 = ${f(n.iarc[0], 3)} kA, Iarc_2700 = ${f((n.iarc as number[])[1], 3)} kA, Iarc_14300 = ${f((n.iarc as number[])[2], 3)} kA.`,
      `Interpolated to Voc = ${f(i.vocKv, 3)} kV, Eqs (16)–(18): Iarc = ${f(normal.iarcKa, 3)} kA.`,
      `Arc duration from the protective device at Iarc: T = ${f(normal.tMs, 0)} ms.`,
      `Intermediate incident energy, Eqs (3)–(5): E600 = ${f(n.e[0], 3)}, E2700 = ${f((n.e as number[])[1], 3)}, E14300 = ${f((n.e as number[])[2], 3)} J/cm²; interpolated (Eqs 19–21) E = ${f(normal.eJcm2, 3)} J/cm² = ${f(normal.eCal, 3)} cal/cm².`,
      `Intermediate arc-flash boundary, Eqs (7)–(9): ${f(n.afb[0], 0)}, ${f((n.afb as number[])[1], 0)}, ${f((n.afb as number[])[2], 0)} mm; interpolated (Eqs 22–24) AFB = ${f(normal.afbMm, 0)} mm.`
    );
  } else {
    const i600 = iarcIntermediate("600", i.ibfKa, i.gapMm, i.config);
    steps.push(
      `Arcing current at 600 V, Eq (1): Iarc_600 = ${f(i600, 3)} kA; final arcing current at ${f(i.vocKv, 3)} kV, Eq (25): Iarc = ${f(normal.iarcKa, 3)} kA.`,
      `Arc duration from the protective device at Iarc: T = ${f(normal.tMs, 0)} ms.`,
      `Incident energy, Eq (6): E = ${f(normal.eJcm2, 3)} J/cm² = ${f(normal.eCal, 3)} cal/cm²; arc-flash boundary, Eq (10): AFB = ${f(normal.afbMm, 0)} mm.`
    );
  }
  steps.push(
    `Arcing-current variation, Eq (2): VarCf = ${f(vcf, 4)}; reduction factor (1 − 0.5·VarCf) = ${f(1 - 0.5 * vcf, 4)}.`,
    `Reduced arcing current Iarc_min = ${f(reduced.iarcKa, 3)} kA → arc duration ${f(reduced.tMs, 0)} ms → E = ${f(reduced.eJcm2, 3)} J/cm² = ${f(reduced.eCal, 3)} cal/cm², AFB = ${f(reduced.afbMm, 0)} mm.`,
    `Final result = the higher of the two: E = ${f(governing.eCal, 2)} cal/cm² (${f(governing.eJcm2, 2)} J/cm², ${governing.label.toLowerCase()}), AFB = ${f(afbMm, 0)} mm (boundary at ${f(AFB_THRESHOLD_CAL, 1)} cal/cm² = 5.0 J/cm²). 1 cal = 4.184 J.`
  );

  return { cf, varCf: vcf, normal, reduced, governing, eCal: governing.eCal, afbMm, warnings: af2018Warnings(i), steps };
}

// ----------------------------------------------------------------------------
// Equipment defaults — IEEE 1584-2018 Table 8 (gaps, enclosure) and Table 10 (working distance)
// ----------------------------------------------------------------------------

export type EquipClassId = "sg15" | "mcc15" | "sg5" | "mcc5" | "lvsg" | "lvmcc" | "lvmccDeep" | "jbox" | "custom";

export interface EquipClass {
  id: EquipClassId;
  label: string;
  gapMm: number;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  workingDistMm: number;
  vocRangeKv: [number, number];
}

export const EQUIPMENT_CLASSES: EquipClass[] = [
  { id: "sg15", label: "15 kV switchgear", gapMm: 152, heightMm: 1143, widthMm: 762, depthMm: 762, workingDistMm: 914.4, vocRangeKv: [5.5, 15] },
  { id: "mcc15", label: "15 kV MCC", gapMm: 152, heightMm: 914.4, widthMm: 914.4, depthMm: 914.4, workingDistMm: 914.4, vocRangeKv: [5.5, 15] },
  { id: "sg5", label: "5 kV switchgear", gapMm: 104, heightMm: 914.4, widthMm: 914.4, depthMm: 914.4, workingDistMm: 914.4, vocRangeKv: [1, 5.5] },
  { id: "mcc5", label: "5 kV MCC", gapMm: 104, heightMm: 660.4, widthMm: 660.4, depthMm: 660.4, workingDistMm: 914.4, vocRangeKv: [1, 5.5] },
  { id: "lvsg", label: "Low-voltage switchgear", gapMm: 32, heightMm: 508, widthMm: 508, depthMm: 508, workingDistMm: 609.6, vocRangeKv: [0.208, 1] },
  { id: "lvmcc", label: "Shallow LV MCC / panelboard (≤ 203 mm deep)", gapMm: 25, heightMm: 355.6, widthMm: 304.8, depthMm: 203.2, workingDistMm: 457.2, vocRangeKv: [0.208, 1] },
  { id: "lvmccDeep", label: "Deep LV MCC / panelboard (> 203 mm deep)", gapMm: 25, heightMm: 355.6, widthMm: 304.8, depthMm: 254, workingDistMm: 457.2, vocRangeKv: [0.208, 1] },
  { id: "jbox", label: "Cable junction box", gapMm: 13, heightMm: 355.6, widthMm: 304.8, depthMm: 203.2, workingDistMm: 457.2, vocRangeKv: [0.208, 15] },
  { id: "custom", label: "Custom (enter your own)", gapMm: 32, heightMm: 508, widthMm: 508, depthMm: 508, workingDistMm: 609.6, vocRangeKv: [0, 1000] },
];

export function defaultEquipClassFor(vocKv: number): EquipClassId {
  if (vocKv <= 1) return "lvsg";
  if (vocKv <= 5.5) return "sg5";
  return "sg15";
}

// ----------------------------------------------------------------------------
// PPE categories and shock boundaries (NFPA 70E — reference values)
// NOTE: NFPA 70E uses PPE categories with its table method (130.7(C)(15)). When an
// incident-energy analysis is done, arc-rated PPE is chosen with an arc rating at
// least equal to the calculated incident energy, and a label shows either the
// incident energy or the PPE category, not both (130.5(H)). The category returned
// here is an indicative mapping of the calculated energy to the 4/8/25/40 cal/cm²
// clothing levels, for convenience only.
// ----------------------------------------------------------------------------

export interface PpeCategory {
  cat: 0 | 1 | 2 | 3 | 4 | 5; // 5 = exceeds Category 4
  name: string;
  minArcRating: number | null; // cal/cm²
  summary: string;
  color: string;
}

export function ppeForEnergy(eCal: number): PpeCategory {
  if (eCal < AFB_THRESHOLD_CAL)
    return { cat: 0, name: "Below 1.2 cal/cm²", minArcRating: null, summary: "Below the arc-flash threshold at this distance; follow normal electrical safe work practices.", color: "#34d399" };
  if (eCal <= 4)
    return { cat: 1, name: "PPE Category 1", minArcRating: 4, summary: "Arc-rated long-sleeve shirt and pants (or coverall), arc-rated face shield or arc flash suit hood, hard hat, safety glasses, hearing protection, heavy-duty leather gloves (or rubber insulating gloves with leather protectors), leather footwear as needed.", color: "#a3e635" };
  if (eCal <= 8)
    return { cat: 2, name: "PPE Category 2", minArcRating: 8, summary: "Category 1 clothing at the higher rating, with arc-rated balaclava and face shield or arc flash suit hood.", color: "#fbbf24" };
  if (eCal <= 25)
    return { cat: 3, name: "PPE Category 3", minArcRating: 25, summary: "Arc flash suit (jacket, pants or coverall) with hood, arc-rated gloves, hard hat liner, hearing protection and leather footwear.", color: "#fb923c" };
  if (eCal <= 40)
    return { cat: 4, name: "PPE Category 4", minArcRating: 40, summary: "Multi-layer arc flash suit with hood, arc-rated gloves, hard hat liner, hearing protection and leather footwear.", color: "#f87171" };
  return { cat: 5, name: "DANGER — exceeds 40 cal/cm²", minArcRating: null, summary: "No standard PPE category is adequate. Do not work energized: de-energize, or reduce the incident energy first (faster clearing, maintenance mode, current limiting, remote racking/operation).", color: "#e11d48" };
}

export interface ShockBoundaries {
  limitedMovableM: number | null;
  limitedFixedM: number | null;
  restricted: string;
  restrictedM: number | null;
}

/** NFPA 70E-2018 Table 130.4(E)(a), AC systems. Reference only — confirm against the edition in force. */
export function shockBoundaries(vocKv: number): ShockBoundaries {
  const v = vocKv * 1000;
  if (v < 50) return { limitedMovableM: null, limitedFixedM: null, restricted: "Not specified (< 50 V)", restrictedM: null };
  if (v <= 150) return { limitedMovableM: 3.0, limitedFixedM: 1.0, restricted: "Avoid contact", restrictedM: null };
  if (v <= 750) return { limitedMovableM: 3.0, limitedFixedM: 1.0, restricted: "0.30 m (1 ft 0 in)", restrictedM: 0.3 };
  if (v <= 15000) return { limitedMovableM: 3.0, limitedFixedM: 1.5, restricted: "0.66 m (2 ft 2 in)", restrictedM: 0.66 };
  if (v <= 36000) return { limitedMovableM: 3.0, limitedFixedM: 1.8, restricted: "0.78 m (2 ft 7 in)", restrictedM: 0.78 };
  return { limitedMovableM: 3.0, limitedFixedM: 2.5, restricted: "See NFPA 70E Table 130.4(E)(a)", restrictedM: null };
}

/** Ralph Lee theoretical method (indicative only; used outside the IEEE 1584 voltage range). */
export function leeEnergyCal(vocKv: number, ibfKa: number, tS: number, dMm: number): number {
  return (2.142e6 * vocKv * ibfKa * tS) / (dMm * dMm) / J_PER_CAL;
}
export function leeBoundaryMm(vocKv: number, ibfKa: number, tS: number): number {
  return Math.sqrt((2.142e6 * vocKv * ibfKa * tS) / (J_PER_CAL * AFB_THRESHOLD_CAL));
}
