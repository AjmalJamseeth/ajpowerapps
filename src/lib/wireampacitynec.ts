// Wire Size / Ampacity Calculator — NEC Article 310. Applies the full
// four-step conductor ampacity derating chain used throughout NEC field
// practice: (1) base allowable ampacity from Table 310.16 at the
// conductor's insulation temperature rating, 30°C ambient, ≤3
// current-carrying conductors; (2) ambient temperature correction factor
// (Table 310.15(B)(1)); (3) adjustment factor for more than 3
// current-carrying conductors in a raceway/cable/earth (Table
// 310.15(C)(1)); (4) the 110.14(C) termination-temperature cap, which
// limits the *usable* ampacity to the Table 310.16 value at the
// termination's own temperature rating (typically 60°C ≤100A, 75°C
// >100A or where equipment is listed for it), evaluated at the base
// (unadjusted) 30°C/≤3-conductor condition — a higher-temperature-rated
// insulation lets you apply steps 2–3 from its own column, but the final
// number can never exceed what the terminal itself is rated to accept.
//
// Table 310.16 ampacity values and the Table 310.15(B)(1)/(C)(1)
// correction/adjustment factors are the standard published NEC figures,
// unchanged across the 2014/2017/2020/2023 NEC editions for this table —
// always confirm against the specific code edition adopted by the AHJ.
// Designed from scratch; no equivalent module exists elsewhere in AJapps
// (the existing Cable Sizing calculator uses the IEC 60364-5-52 method).

export type WireMaterial = "Cu" | "Al";
export type InsulationTemp = 60 | 75 | 90;
export type TerminationTemp = 60 | 75;
export type WireCalcMode = "autoSize" | "check";

export const AWG_SIZES = [
  "14", "12", "10", "8", "6", "4", "3", "2", "1", "1/0", "2/0", "3/0", "4/0",
  "250", "300", "350", "400", "500", "600", "700", "750", "800", "900", "1000",
  "1250", "1500", "1750", "2000",
] as const;
export type AwgSize = (typeof AWG_SIZES)[number];

// NEC Table 310.16 — allowable ampacities (A), 30°C ambient, ≤3 current-carrying conductors.
export const AMPACITY_CU: Record<AwgSize, Record<InsulationTemp, number>> = {
  "14": { 60: 15, 75: 20, 90: 25 },
  "12": { 60: 20, 75: 25, 90: 30 },
  "10": { 60: 30, 75: 35, 90: 40 },
  "8": { 60: 40, 75: 50, 90: 55 },
  "6": { 60: 55, 75: 65, 90: 75 },
  "4": { 60: 70, 75: 85, 90: 95 },
  "3": { 60: 85, 75: 100, 90: 110 },
  "2": { 60: 95, 75: 115, 90: 130 },
  "1": { 60: 110, 75: 130, 90: 145 },
  "1/0": { 60: 125, 75: 150, 90: 170 },
  "2/0": { 60: 145, 75: 175, 90: 195 },
  "3/0": { 60: 165, 75: 200, 90: 225 },
  "4/0": { 60: 195, 75: 230, 90: 260 },
  "250": { 60: 215, 75: 255, 90: 290 },
  "300": { 60: 240, 75: 285, 90: 320 },
  "350": { 60: 260, 75: 310, 90: 350 },
  "400": { 60: 280, 75: 335, 90: 380 },
  "500": { 60: 320, 75: 380, 90: 430 },
  "600": { 60: 350, 75: 420, 90: 475 },
  "700": { 60: 385, 75: 460, 90: 520 },
  "750": { 60: 400, 75: 475, 90: 535 },
  "800": { 60: 410, 75: 490, 90: 555 },
  "900": { 60: 435, 75: 520, 90: 585 },
  "1000": { 60: 455, 75: 545, 90: 615 },
  "1250": { 60: 495, 75: 590, 90: 665 },
  "1500": { 60: 520, 75: 625, 90: 705 },
  "1750": { 60: 545, 75: 650, 90: 735 },
  "2000": { 60: 560, 75: 665, 90: 750 },
};

export const AMPACITY_AL: Record<AwgSize, Record<InsulationTemp, number>> = {
  "14": { 60: 0, 75: 0, 90: 0 }, // not manufactured below #12 AWG
  "12": { 60: 15, 75: 20, 90: 25 },
  "10": { 60: 25, 75: 30, 90: 35 },
  "8": { 60: 30, 75: 40, 90: 45 },
  "6": { 60: 40, 75: 50, 90: 55 },
  "4": { 60: 55, 75: 65, 90: 75 },
  "3": { 60: 65, 75: 75, 90: 85 },
  "2": { 60: 75, 75: 90, 90: 100 },
  "1": { 60: 85, 75: 100, 90: 115 },
  "1/0": { 60: 100, 75: 120, 90: 135 },
  "2/0": { 60: 115, 75: 135, 90: 150 },
  "3/0": { 60: 130, 75: 155, 90: 175 },
  "4/0": { 60: 150, 75: 180, 90: 205 },
  "250": { 60: 170, 75: 205, 90: 230 },
  "300": { 60: 190, 75: 230, 90: 260 },
  "350": { 60: 210, 75: 250, 90: 280 },
  "400": { 60: 225, 75: 270, 90: 305 },
  "500": { 60: 260, 75: 310, 90: 350 },
  "600": { 60: 285, 75: 340, 90: 385 },
  "700": { 60: 315, 75: 375, 90: 425 },
  "750": { 60: 320, 75: 385, 90: 435 },
  "800": { 60: 330, 75: 395, 90: 445 },
  "900": { 60: 355, 75: 425, 90: 480 },
  "1000": { 60: 375, 75: 445, 90: 500 },
  "1250": { 60: 405, 75: 485, 90: 545 },
  "1500": { 60: 435, 75: 520, 90: 585 },
  "1750": { 60: 455, 75: 545, 90: 615 },
  "2000": { 60: 470, 75: 560, 90: 630 },
};

// NEC Table 310.15(B)(1) — ambient temperature correction factors, 5°C bands, by insulation temp column.
const AMBIENT_BANDS: { maxC: number; factors: Record<InsulationTemp, number> }[] = [
  { maxC: 25, factors: { 60: 1.08, 75: 1.05, 90: 1.04 } },
  { maxC: 30, factors: { 60: 1.00, 75: 1.00, 90: 1.00 } },
  { maxC: 35, factors: { 60: 0.91, 75: 0.94, 90: 0.96 } },
  { maxC: 40, factors: { 60: 0.82, 75: 0.88, 90: 0.91 } },
  { maxC: 45, factors: { 60: 0.71, 75: 0.82, 90: 0.87 } },
  { maxC: 50, factors: { 60: 0.58, 75: 0.75, 90: 0.82 } },
  { maxC: 55, factors: { 60: 0.41, 75: 0.67, 90: 0.76 } },
  { maxC: 60, factors: { 60: 0.00, 75: 0.58, 90: 0.71 } },
  { maxC: 65, factors: { 60: 0.00, 75: 0.47, 90: 0.65 } },
  { maxC: 70, factors: { 60: 0.00, 75: 0.33, 90: 0.58 } },
  { maxC: 75, factors: { 60: 0.00, 75: 0.00, 90: 0.50 } },
  { maxC: 80, factors: { 60: 0.00, 75: 0.00, 90: 0.41 } },
  { maxC: 85, factors: { 60: 0.00, 75: 0.00, 90: 0.29 } },
];

export function ambientCorrectionFactor(ambientC: number, insulationTemp: InsulationTemp): number {
  const band = AMBIENT_BANDS.find((b) => ambientC <= b.maxC);
  return band ? band.factors[insulationTemp] : 0;
}

// NEC Table 310.15(C)(1) — adjustment factor for number of current-carrying conductors.
export function bundlingAdjustmentFactor(count: number): number {
  if (count <= 3) return 1.0;
  if (count <= 6) return 0.8;
  if (count <= 9) return 0.7;
  if (count <= 20) return 0.5;
  if (count <= 30) return 0.45;
  if (count <= 40) return 0.4;
  return 0.35;
}

export interface WireAmpacityInput {
  mode: WireCalcMode;
  material: WireMaterial;
  insulationTemp: InsulationTemp;
  terminationTemp: TerminationTemp;
  loadAmps: number | null;
  ambientC: number;
  currentCarryingCount: number;
  selectedSize: AwgSize; // used in "check" mode
}

export const DEFAULT_WIRE_AMPACITY_INPUT: WireAmpacityInput = {
  mode: "autoSize",
  material: "Cu",
  insulationTemp: 75,
  terminationTemp: 75,
  loadAmps: 65,
  ambientC: 30,
  currentCarryingCount: 3,
  selectedSize: "6",
};

export interface WireSizeCandidate {
  size: AwgSize;
  baseAmpacity: number;
  adjustedAmpacity: number;
  terminationCapAmpacity: number;
  effectiveAmpacity: number;
}

export interface WireAmpacityResult {
  ambientFactor: number;
  bundlingFactor: number;
  candidate: WireSizeCandidate | null; // selected size result (autoSize picks smallest that passes; check mode evaluates selectedSize)
  passes: boolean | null;
}

function table(material: WireMaterial): Record<AwgSize, Record<InsulationTemp, number>> {
  return material === "Cu" ? AMPACITY_CU : AMPACITY_AL;
}

function evaluateSize(size: AwgSize, input: WireAmpacityInput, ambientFactor: number, bundlingFactor: number): WireSizeCandidate {
  const t = table(input.material);
  const baseAmpacity = t[size][input.insulationTemp];
  const adjustedAmpacity = baseAmpacity * ambientFactor * bundlingFactor;
  const terminationCapAmpacity = t[size][input.terminationTemp];
  const effectiveAmpacity = Math.min(adjustedAmpacity, terminationCapAmpacity);
  return { size, baseAmpacity, adjustedAmpacity, terminationCapAmpacity, effectiveAmpacity };
}

export function calcWireAmpacity(input: WireAmpacityInput): WireAmpacityResult {
  const ambientFactor = ambientCorrectionFactor(input.ambientC, input.insulationTemp);
  const bundlingFactor = bundlingAdjustmentFactor(input.currentCarryingCount);

  if (input.loadAmps == null || input.loadAmps <= 0) {
    return { ambientFactor, bundlingFactor, candidate: null, passes: null };
  }

  if (input.mode === "check") {
    const candidate = evaluateSize(input.selectedSize, input, ambientFactor, bundlingFactor);
    return { ambientFactor, bundlingFactor, candidate, passes: candidate.effectiveAmpacity >= input.loadAmps };
  }

  // autoSize: smallest AWG size (Cu skips index 0 which is a placeholder for Al-only list) that meets the load.
  const sizesForMaterial = input.material === "Al" ? AWG_SIZES.filter((s) => s !== "14") : AWG_SIZES;
  for (const size of sizesForMaterial) {
    const candidate = evaluateSize(size, input, ambientFactor, bundlingFactor);
    if (candidate.effectiveAmpacity >= input.loadAmps) {
      return { ambientFactor, bundlingFactor, candidate, passes: true };
    }
  }
  // Nothing in the table satisfies the load — return the largest size with passes:false.
  const largest = sizesForMaterial[sizesForMaterial.length - 1];
  const candidate = evaluateSize(largest, input, ambientFactor, bundlingFactor);
  return { ambientFactor, bundlingFactor, candidate, passes: false };
}
