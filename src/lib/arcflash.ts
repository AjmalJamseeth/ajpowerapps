// Arc Flash incident energy, arc-flash boundary and PPE category.
//
// Three methods:
//  - IEEE 1584-2002 (empirical) — free tier. Valid 0.208-15kV, 0.7-106kA.
//  - Ralph Lee (theoretical) — free tier. No upper voltage limit; the
//    fallback method above 15kV or wherever the empirical model doesn't
//    apply. Simpler, generally more conservative.
//  - IEEE 1584-2018 (empirical) — subscriber tier. Implements the
//    600V < Voc <= 15000V range only. Coefficients verified end-to-end
//    against IEEE's own Annex D worked example (4.16kV, VCB, 15kA,
//    G=104mm, 762x1143mm typical enclosure): arcing current, incident
//    energy and arc-flash boundary all matched IEEE's published values
//    exactly. The <=600V range uses a different final-arcing-current
//    equation (Eq. 25) that could not be sourced/verified with confidence,
//    so it is intentionally left unimplemented — use 2002 or Ralph Lee for
//    LV systems. The enclosure-size correction factor (CF) sub-calculation
//    is only partially verified: it matched exactly on tested Width, but
//    the Height calculation has a residual discrepancy vs. the worked
//    example (results came out modestly MORE conservative in the one case
//    checked, but that direction isn't proven to hold universally) — treat
//    CF-dependent 2018 results as indicative, not final, until resolved.

export type ArcFlashMethod = "ieee2002" | "ieee2018" | "lee";
export type Enclosure = "box" | "open";
export type Grounding = "grounded" | "ungrounded";
export type EquipClassKey = "lv_mcc" | "lv_swgr" | "mv5_swgr" | "mv15_swgr" | "cable";
export type ElectrodeConfig = "VCB" | "VCBB" | "HCB" | "VOA" | "HOA";

export const EB_CAL = 1.2; // cal/cm² — second-degree burn threshold (arc flash boundary)

export const AF_EQUIP_CLASSES: Record<EquipClassKey, { label: string; G: number; x: number; D: number }> = {
  lv_mcc: { label: "LV MCC / Panelboard", G: 25, x: 1.641, D: 455 },
  lv_swgr: { label: "LV Switchgear", G: 32, x: 1.473, D: 610 },
  mv5_swgr: { label: "5kV Switchgear", G: 104, x: 1.641, D: 914 },
  mv15_swgr: { label: "15kV Switchgear", G: 152, x: 0.973, D: 914 },
  cable: { label: "Cable (any voltage)", G: 13, x: 2.0, D: 455 },
};

export const ELECTRODE_CONFIGS: { value: ElectrodeConfig; label: string }[] = [
  { value: "VCB", label: "VCB — vertical conductors in a box" },
  { value: "VCBB", label: "VCBB — vertical, barrier-terminated, in a box" },
  { value: "HCB", label: "HCB — horizontal conductors in a box" },
  { value: "VOA", label: "VOA — vertical conductors, open air" },
  { value: "HOA", label: "HOA — horizontal conductors, open air" },
];

// ---------------------------------------------------------------------------
// IEEE 1584-2002
// ---------------------------------------------------------------------------
// BUG FIX vs. the source app: IEEE 1584-2002 defines TWO separate arcing
// current equations (the standard's Eq. 2a and 2b, reproduced e.g. at
// arcadvisor.com/faq/ieee-1584-calculation-procedure) -- the source app only
// implemented Eq. 2a (for systems <=1kV) and applied it at every voltage,
// including MV. Because Eq. 2a's voltage terms (0.0966*V and, worse,
// 0.5588*V*lg(Ibf)) are linear in V rather than logarithmic, using it above
// 1kV blows up to nonphysical results -- e.g. at 4.16kV/15kA it produced an
// "arcing current" over 3000kA, ~200x the bolted fault current, which is
// impossible (arcing current is always a fraction of bolted fault current).
// This resurfaces as wildly overstated incident energy/PPE category. Fixed
// here by using the standard's own Eq. 2b -- a simple fit independent of V,
// G and enclosure -- for the 1-15kV range, per the standard.
export function calcArcingCurrent(Ibf: number, V: number, G: number, enclosure: Enclosure): number {
  if (V >= 1) {
    // Eq. 2b: valid 1kV <= V <= 15kV. No voltage/gap/enclosure dependency.
    const lgIa = 0.00402 + 0.983 * Math.log10(Ibf);
    return Math.pow(10, lgIa);
  }
  // Eq. 2a: valid 0.208kV <= V <= 1kV.
  const K = enclosure === "open" ? -0.153 : -0.097;
  const lgIbf = Math.log10(Ibf);
  const lgIa = K + 0.662 * lgIbf + 0.0966 * V + 0.000526 * G + 0.5588 * V * lgIbf - 0.00304 * G * lgIbf;
  return Math.pow(10, lgIa);
}
export function calcNormalizedEnergy(Ia: number, G: number, enclosure: Enclosure, grounding: Grounding): number {
  const K1 = enclosure === "open" ? -0.792 : -0.555;
  const K2 = grounding === "grounded" ? -0.113 : 0;
  const lgEn = K1 + K2 + 1.081 * Math.log10(Ia) + 0.0011 * G;
  return Math.pow(10, lgEn);
}
export function calcIncidentEnergy2002(En: number, V: number, t: number, D: number, x: number): number {
  const Cf = V > 1 ? 1.0 : 1.5;
  return Cf * En * (t / 0.2) * (Math.pow(610, x) / Math.pow(D, x));
}
export function calcArcFlashBoundary2002(En: number, V: number, t: number, x: number): number {
  const Cf = V > 1 ? 1.0 : 1.5;
  return Math.pow((Cf * En * (t / 0.2) * Math.pow(610, x)) / EB_CAL, 1 / x);
}

// ---------------------------------------------------------------------------
// PPE category (NFPA 70E-aligned cal/cm² thresholds)
// ---------------------------------------------------------------------------
export interface PpeResult {
  cat: string;
  label: string;
}
export function ppeCategory(E: number): PpeResult {
  if (E < EB_CAL) return { cat: "—", label: "Below arc flash boundary threshold — standard precautions apply" };
  if (E <= 4) return { cat: "1", label: "Category 1 (arc rating ≥4 cal/cm²)" };
  if (E <= 8) return { cat: "2", label: "Category 2 (arc rating ≥8 cal/cm²)" };
  if (E <= 25) return { cat: "3", label: "Category 3 (arc rating ≥25 cal/cm²)" };
  if (E <= 40) return { cat: "4", label: "Category 4 (arc rating ≥40 cal/cm²)" };
  return {
    cat: "DANGER",
    label: "Exceeds Category 4 (40 cal/cm²) — no standard PPE category is adequate. De-energize or apply engineering controls to reduce incident energy.",
  };
}

// ---------------------------------------------------------------------------
// Ralph Lee (theoretical)
// ---------------------------------------------------------------------------
export function calcLeeIncidentEnergy(V: number, Ibf: number, t: number, D: number): number {
  const E_Jcm2 = (2.142e6 * V * Ibf * t) / (D * D);
  return E_Jcm2 / 4.184;
}
export function calcLeeBoundary(V: number, Ibf: number, t: number): number {
  return Math.sqrt((2.142e6 * V * Ibf * t) / (4.184 * EB_CAL));
}

// ---------------------------------------------------------------------------
// IEEE 1584-2018 (600V < Voc <= 15000V)
// ---------------------------------------------------------------------------
interface Table1Coeffs { k10: number; k9: number; k8: number; k7: number; k6: number; k5: number; k4: number; k3: number; k2: number; k1: number; }
interface Table345Coeffs { k13: number; k12: number; k11: number; k10: number; k9: number; k8: number; k7: number; k6: number; k5: number; k4: number; k3: number; k2: number; k1: number; }
interface Table2Coeffs { k1: number; k2: number; k3: number; k4: number; k5: number; k6: number; k7: number; }
interface Table7Coeffs { b1: number; b2: number; b3: number; }

const IEEE2018_TABLE1: Record<ElectrodeConfig, Record<"600" | "2700" | "14300", Table1Coeffs>> = {
  VCB: {
    "600": { k10: 1.092, k9: 0.003141, k8: -0.000229, k7: 1.962e-6, k6: -4.783e-9, k5: 0.0, k4: 0.0, k3: -0.083, k2: 1.035, k1: -0.04287 },
    "2700": { k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -0.024, k2: 1.001, k1: 0.0065 },
    "14300": { k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -0.011, k2: 1.015, k1: 0.005795 },
  },
  VCBB: {
    "600": { k10: 1.013, k9: 0.01187, k8: -0.00034, k7: 2.524e-6, k6: -5.767e-9, k5: 0.0, k4: 0.0, k3: -0.05, k2: 0.98, k1: -0.017432 },
    "2700": { k10: 0.9825, k9: -0.004003, k8: 0.0001569, k7: -3.262e-6, k6: 2.901e-8, k5: -9.204e-11, k4: 0.0, k3: -0.0125, k2: 0.995, k1: 0.002823 },
    "14300": { k10: 0.9825, k9: -0.004003, k8: 0.0001569, k7: -3.262e-6, k6: 2.901e-8, k5: -9.204e-11, k4: 0.0, k3: -0.01, k2: 1.01, k1: 0.014827 },
  },
  HCB: {
    "600": { k10: 0.9725, k9: 0.0091, k8: -0.000302, k7: 2.316e-6, k6: -5.382e-9, k5: 0.0, k4: 0.0, k3: -0.11, k2: 0.988, k1: 0.054922 },
    "2700": { k10: 0.9881, k9: -0.0007, k8: -9.128e-6, k7: -1.814e-7, k6: 4.859e-10, k5: 0.0, k4: 0.0, k3: -0.0249, k2: 1.003, k1: 0.001011 },
    "14300": { k10: 0.9839, k9: -0.001145, k8: 0.000116, k7: -3.046e-6, k6: 2.233e-8, k5: -5.043e-11, k4: 0.0, k3: -0.02, k2: 0.999, k1: 0.008693 },
  },
  VOA: {
    "600": { k10: 1.092, k9: 0.003141, k8: -0.000229, k7: 1.962e-6, k6: -4.783e-9, k5: 0.0, k4: 0.0, k3: -0.18, k2: 1.04, k1: 0.043785 },
    "2700": { k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -0.0188, k2: 1.006, k1: -0.02395 },
    "14300": { k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -0.029, k2: 1.0102, k1: 0.005371 },
  },
  HOA: {
    "600": { k10: 1.1, k9: 0.002615, k8: -0.000197, k7: 1.641e-6, k6: -3.895e-9, k5: 0.0, k4: 0.0, k3: -0.24, k2: 1.008, k1: 0.111147 },
    "2700": { k10: 0.9981, k9: -0.0007, k8: -9.128e-6, k7: -1.914e-7, k6: 7.859e-10, k5: 0.0, k4: 0.0, k3: -0.038, k2: 1.006, k1: 0.000435 },
    "14300": { k10: 0.9981, k9: -0.0007, k8: -9.128e-6, k7: -1.914e-7, k6: 7.859e-10, k5: 0.0, k4: 0.0, k3: -0.02, k2: 0.999, k1: 0.000904 },
  },
};

const IEEE2018_TABLE345: Record<ElectrodeConfig, Record<"600" | "2700" | "14300", Table345Coeffs>> = {
  VCB: {
    "600": { k13: 0.957, k12: -1.598, k11: 0.0, k10: 1.092, k9: 0.003141, k8: -0.000229, k7: 1.962e-6, k6: -4.783e-9, k5: 0.0, k4: 0.0, k3: 1.752636, k2: 0.566, k1: 0.753364 },
    "2700": { k13: 0.9778, k12: -1.569, k11: 0.0, k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: 0.354202, k2: 0.165, k1: 2.40021 },
    "14300": { k13: 0.99, k12: -1.568, k11: 0.0, k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -0.999749, k2: 0.11, k1: 3.825917 },
  },
  VCBB: {
    "600": { k13: 1.19, k12: -1.809, k11: -0.06, k10: 1.013, k9: 0.01187, k8: -0.00034, k7: 2.524e-6, k6: -5.767e-9, k5: 0.0, k4: 0.0, k3: -0.098107, k2: 0.26, k1: 3.068459 },
    "2700": { k13: 1.09, k12: -1.742, k11: 0.0, k10: 0.9825, k9: -0.004003, k8: 0.0001569, k7: -3.262e-6, k6: 2.901e-8, k5: -9.204e-11, k4: 0.0, k3: -0.736618, k2: 0.185, k1: 3.870592 },
    "14300": { k13: 1.06, k12: -1.677, k11: 0.0, k10: 0.9825, k9: -0.004003, k8: 0.0001569, k7: -3.262e-6, k6: 2.901e-8, k5: -9.204e-11, k4: 0.0, k3: -0.585522, k2: 0.215, k1: 3.644309 },
  },
  HCB: {
    "600": { k13: 1.036, k12: -2.03, k11: 0.0, k10: 0.9725, k9: 0.0091, k8: -0.000302, k7: 2.316e-6, k6: -5.382e-9, k5: 0.0, k4: 0.0, k3: -0.370259, k2: 0.344, k1: 4.073745 },
    "2700": { k13: 1.055, k12: -1.723, k11: 0.027, k10: 0.9881, k9: -0.0007, k8: -9.128e-6, k7: -1.814e-7, k6: 4.859e-10, k5: 0.0, k4: 0.0, k3: -0.193101, k2: 0.177, k1: 3.486391 },
    "14300": { k13: 1.084, k12: -1.655, k11: 0.0, k10: 0.9839, k9: -0.001145, k8: 0.000116, k7: -3.046e-6, k6: 2.233e-8, k5: -5.043e-11, k4: 0.0, k3: 0.245106, k2: 0.125, k1: 3.044516 },
  },
  VOA: {
    "600": { k13: 0.997, k12: -1.598, k11: 0.0, k10: 1.092, k9: 0.003141, k8: -0.000229, k7: 1.962e-6, k6: -4.783e-9, k5: 0.0, k4: 0.0, k3: 1.222636, k2: 0.746, k1: 0.679294 },
    "2700": { k13: 1.115, k12: -1.515, k11: 0.0, k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -1.906033, k2: 0.105, k1: 3.880724 },
    "14300": { k13: 0.979, k12: -1.534, k11: 0.0, k10: 0.9729, k9: -0.003191, k8: 5.482e-5, k7: 8.346e-7, k6: -4.186e-8, k5: 4.556e-10, k4: -1.557e-12, k3: -0.93245, k2: 0.12, k1: 3.405454 },
  },
  HOA: {
    "600": { k13: 1.04, k12: -1.99, k11: 0.0, k10: 1.1, k9: 0.002615, k8: -0.000197, k7: 1.641e-6, k6: -3.895e-9, k5: 0.0, k4: 0.0, k3: -0.261863, k2: 0.465, k1: 3.470417 },
    "2700": { k13: 1.078, k12: -1.639, k11: 0.0, k10: 0.9981, k9: -0.0007, k8: -9.128e-6, k7: -1.914e-7, k6: 7.859e-10, k5: 0.0, k4: 0.0, k3: -0.761561, k2: 0.149, k1: 3.616266 },
    "14300": { k13: 1.151, k12: -1.633, k11: -0.05, k10: 0.9981, k9: -0.0007, k8: -9.128e-6, k7: -1.914e-7, k6: 7.859e-10, k5: 0.0, k4: 0.0, k3: 1.005092, k2: 0.177, k1: 2.04049 },
  },
};

const IEEE2018_TABLE2: Record<ElectrodeConfig, Table2Coeffs> = {
  VCB: { k1: 0, k2: -1.4269e-6, k3: 8.3137e-5, k4: -0.0019382, k5: 0.022366, k6: -0.12645, k7: 0.30226 },
  VCBB: { k1: 1.138e-6, k2: -6.0287e-5, k3: 0.0012758, k4: -0.013778, k5: 0.080217, k6: -0.24066, k7: 0.33524 },
  HCB: { k1: 0, k2: -3.097e-6, k3: 0.00016405, k4: -0.0033609, k5: 0.033308, k6: -0.16182, k7: 0.34627 },
  VOA: { k1: 9.5606e-7, k2: -5.1543e-5, k3: 0.0011161, k4: -0.01242, k5: 0.075125, k6: -0.23584, k7: 0.33696 },
  HOA: { k1: 0, k2: -3.1555e-6, k3: 0.0001682, k4: -0.0034607, k5: 0.034124, k6: -0.1599, k7: 0.34629 },
};

const IEEE2018_TABLE7: Record<"Typical" | "Shallow", Record<"VCB" | "VCBB" | "HCB", Table7Coeffs>> = {
  Typical: {
    VCB: { b1: -0.000302, b2: 0.03441, b3: 0.4325 },
    VCBB: { b1: -0.0002976, b2: 0.032, b3: 0.479 },
    HCB: { b1: -0.0001923, b2: 0.01935, b3: 0.6899 },
  },
  Shallow: {
    VCB: { b1: 0.002222, b2: -0.02556, b3: 0.6222 },
    VCBB: { b1: -0.002778, b2: 0.1194, b3: -0.2778 },
    HCB: { b1: -0.0005556, b2: 0.03722, b3: 0.4778 },
  },
};

const IEEE2018_AB: Record<"VCB" | "VCBB" | "HCB", { A: number; B: number }> = {
  VCB: { A: 4, B: 20 },
  VCBB: { A: 10, B: 24 },
  HCB: { A: 10, B: 22 },
};

function calc2018_Iarc(voltKey: "600" | "2700" | "14300", Ibf: number, G: number, config: ElectrodeConfig): number {
  const c = IEEE2018_TABLE1[config][voltKey];
  const lg = Math.log10;
  const exponent = c.k1 + c.k2 * lg(Ibf) + c.k3 * lg(G);
  const poly = c.k4 * Ibf ** 6 + c.k5 * Ibf ** 5 + c.k6 * Ibf ** 4 + c.k7 * Ibf ** 3 + c.k8 * Ibf ** 2 + c.k9 * Ibf + c.k10;
  return Math.pow(10, exponent) * poly;
}
function calc2018_VarCf(Voc: number, config: ElectrodeConfig): number {
  const c = IEEE2018_TABLE2[config];
  return c.k1 * Voc ** 6 + c.k2 * Voc ** 5 + c.k3 * Voc ** 4 + c.k4 * Voc ** 3 + c.k5 * Voc ** 2 + c.k6 * Voc + c.k7;
}
function calc2018_E(voltKey: "600" | "2700" | "14300", Ibf: number, G: number, T: number, D: number, CF: number, IarcAtVolt: number, config: ElectrodeConfig): number {
  const c = IEEE2018_TABLE345[config][voltKey];
  const lg = Math.log10;
  const poly = c.k4 * Ibf ** 7 + c.k5 * Ibf ** 6 + c.k6 * Ibf ** 5 + c.k7 * Ibf ** 4 + c.k8 * Ibf ** 3 + c.k9 * Ibf ** 2 + c.k10 * Ibf;
  const fraction = (c.k3 * IarcAtVolt) / poly;
  const exponent = c.k1 + c.k2 * lg(G) + fraction + c.k11 * lg(Ibf) + c.k12 * lg(D) + c.k13 * lg(IarcAtVolt) + lg(1 / CF);
  return ((12.552 * T) / 50) * Math.pow(10, exponent);
}
function calc2018_AFB(voltKey: "600" | "2700" | "14300", Ibf: number, G: number, T: number, CF: number, IarcAtVolt: number, config: ElectrodeConfig): number {
  const c = IEEE2018_TABLE345[config][voltKey];
  const lg = Math.log10;
  const poly = c.k4 * Ibf ** 7 + c.k5 * Ibf ** 6 + c.k6 * Ibf ** 5 + c.k7 * Ibf ** 4 + c.k8 * Ibf ** 3 + c.k9 * Ibf ** 2 + c.k10 * Ibf;
  const fraction = (c.k3 * IarcAtVolt) / poly;
  const numerator = c.k1 + c.k2 * lg(G) + fraction + c.k11 * lg(Ibf) + c.k13 * lg(IarcAtVolt) + lg(1 / CF) - lg(20 / T);
  return Math.pow(10, numerator / -c.k12);
}
function calc2018_equivDim(dim: number, Voc: number, A: number, B: number): number {
  const dimCapped = Math.min(dim, 1244.6);
  if (dimCapped < 508) return 20; // inches — fixed per Table 6 at the lower range
  return (660.4 + (dimCapped - 660.4) * ((Voc + A) / B)) * 0.03937;
}
function calc2018_CF(Width: number, Height: number, Depth: number, Voc: number, config: ElectrodeConfig): number {
  if (config === "VOA" || config === "HOA") return 1.0;
  const isShallow = Voc <= 0.6 && Width < 508 && Height < 508 && Depth <= 203.2;
  const { A, B } = IEEE2018_AB[config];
  const Width1 = calc2018_equivDim(Width, Voc, A, B);
  const Height1 = calc2018_equivDim(Height, Voc, A, B);
  let EES = (Width1 + Height1) / 2;
  if (EES < 20) EES = 20;
  const b = IEEE2018_TABLE7[isShallow ? "Shallow" : "Typical"][config];
  const poly = b.b1 * EES * EES + b.b2 * EES + b.b3;
  return isShallow ? 1 / poly : poly;
}

export interface Result2018 {
  CF: number;
  normal: { Iarc: number; E: number; AFB: number };
  reduced: { Iarc: number; E: number; AFB: number };
  E: number; // J/cm²
  AFB: number; // mm
  usedReduced: boolean;
}

/** Full IEEE 1584-2018 pipeline for the 600V < Voc <= 15000V range. T in milliseconds. */
export function calc2018_Full(
  Ibf: number,
  G: number,
  T: number,
  D: number,
  Voc: number,
  config: ElectrodeConfig,
  Width: number,
  Height: number,
  Depth: number
): Result2018 {
  const CF = calc2018_CF(Width, Height, Depth, Voc, config);

  function interp(v600: number, v2700: number, v14300: number): number {
    const v1 = ((v2700 - v600) / 2.1) * (Voc - 2.7) + v2700;
    const v2 = ((v14300 - v2700) / 11.6) * (Voc - 14.3) + v14300;
    return Voc > 2.7 ? v2 : v1;
  }

  function runAt(IbfUsed: number) {
    const Iarc600 = calc2018_Iarc("600", IbfUsed, G, config);
    const Iarc2700 = calc2018_Iarc("2700", IbfUsed, G, config);
    const Iarc14300 = calc2018_Iarc("14300", IbfUsed, G, config);
    const E600 = calc2018_E("600", IbfUsed, G, T, D, CF, Iarc600, config);
    const E2700 = calc2018_E("2700", IbfUsed, G, T, D, CF, Iarc2700, config);
    const E14300 = calc2018_E("14300", IbfUsed, G, T, D, CF, Iarc14300, config);
    const AFB600 = calc2018_AFB("600", IbfUsed, G, T, CF, Iarc600, config);
    const AFB2700 = calc2018_AFB("2700", IbfUsed, G, T, CF, Iarc2700, config);
    const AFB14300 = calc2018_AFB("14300", IbfUsed, G, T, CF, Iarc14300, config);
    return {
      Iarc: interp(Iarc600, Iarc2700, Iarc14300),
      E: interp(E600, E2700, E14300),
      AFB: interp(AFB600, AFB2700, AFB14300),
    };
  }

  const normal = runAt(Ibf);

  function runReduced() {
    const Iarc600 = calc2018_Iarc("600", Ibf, G, config) * (1 - 0.5 * calc2018_VarCf(0.6, config));
    const Iarc2700 = calc2018_Iarc("2700", Ibf, G, config) * (1 - 0.5 * calc2018_VarCf(2.7, config));
    const Iarc14300 = calc2018_Iarc("14300", Ibf, G, config) * (1 - 0.5 * calc2018_VarCf(14.3, config));
    const E600 = calc2018_E("600", Ibf, G, T, D, CF, Iarc600, config);
    const E2700 = calc2018_E("2700", Ibf, G, T, D, CF, Iarc2700, config);
    const E14300 = calc2018_E("14300", Ibf, G, T, D, CF, Iarc14300, config);
    const AFB600 = calc2018_AFB("600", Ibf, G, T, CF, Iarc600, config);
    const AFB2700 = calc2018_AFB("2700", Ibf, G, T, CF, Iarc2700, config);
    const AFB14300 = calc2018_AFB("14300", Ibf, G, T, CF, Iarc14300, config);
    return {
      Iarc: interp(Iarc600, Iarc2700, Iarc14300),
      E: interp(E600, E2700, E14300),
      AFB: interp(AFB600, AFB2700, AFB14300),
    };
  }

  const reduced = runReduced();
  return {
    CF,
    normal,
    reduced,
    E: Math.max(normal.E, reduced.E),
    AFB: Math.max(normal.AFB, reduced.AFB),
    usedReduced: reduced.E > normal.E,
  };
}
