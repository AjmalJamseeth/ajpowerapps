// Arc Flash incident energy, arc-flash boundary and PPE category.
//
// Three methods:
//  - IEEE 1584-2002 (empirical) — core. Valid 0.208-15kV, 0.7-106kA.
//  - Ralph Lee (theoretical) — core. No upper voltage limit; the
//    fallback method above 15kV or wherever the empirical model doesn't
//    apply. Simpler, generally more conservative.
//  - IEEE 1584-2018 (empirical) — the full model (208 V - 15 kV, enclosure
//    correction, arcing-current variation, <= 600 V equation) lives in
//    ./arcflash2018.ts and is verified against Annex D of the standard.

import type { ElectrodeConfig } from "./arcflash2018";

export type ArcFlashMethod = "ieee2002" | "ieee2018" | "lee";
export type Enclosure = "box" | "open";
export type Grounding = "grounded" | "ungrounded";
export type EquipClassKey = "lv_mcc" | "lv_swgr" | "mv5_swgr" | "mv15_swgr" | "cable";
export type { ElectrodeConfig } from "./arcflash2018";

export const EB_CAL = 1.2; // cal/cm² — second-degree burn threshold (arc flash boundary)

export const AF_EQUIP_CLASSES: Record<EquipClassKey, { label: string; G: number; x: number; D: number }> = {
  lv_mcc: { label: "LV MCC / Panelboard", G: 25, x: 1.641, D: 455 },
  lv_swgr: { label: "LV Switchgear", G: 32, x: 1.473, D: 610 },
  mv5_swgr: { label: "5kV Switchgear", G: 102, x: 0.973, D: 914 },
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
