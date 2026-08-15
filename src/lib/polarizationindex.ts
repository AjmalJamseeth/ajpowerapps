// Polarization Index (PI) — IEEE 43-2013: PI = IR at 10 minutes / IR at 1
// minute. Assessment bands (verified via web search before coding):
// <1.0 dangerous, 1.0-2.0 questionable, 2.0-4.0 good, >4.0 excellent.
// IEEE 43 recommends a minimum PI of 1.5 for Class A insulation and 2.0 for
// Class B/F/H. Designed from scratch; no equivalent module in the source
// app.

export type InsulationClass = "A" | "B/F/H";

export interface PolarizationIndexInput {
  ir1MinMegohm: number | null;
  ir10MinMegohm: number | null;
  insulationClass: InsulationClass;
}

export const DEFAULT_POLARIZATION_INDEX_INPUT: PolarizationIndexInput = {
  ir1MinMegohm: 15,
  ir10MinMegohm: 33,
  insulationClass: "B/F/H",
};

export type PiBand = "Dangerous" | "Questionable" | "Good" | "Excellent";

export interface PolarizationIndexResult {
  pi: number | null;
  band: PiBand | null;
  minimumRecommendedPi: number;
  meetsMinimum: boolean | null;
}

function bandFor(pi: number): PiBand {
  if (pi < 1.0) return "Dangerous";
  if (pi < 2.0) return "Questionable";
  if (pi < 4.0) return "Good";
  return "Excellent";
}

export function calcPolarizationIndex(input: PolarizationIndexInput): PolarizationIndexResult {
  const { ir1MinMegohm, ir10MinMegohm, insulationClass } = input;
  const minimumRecommendedPi = insulationClass === "A" ? 1.5 : 2.0;

  if (ir1MinMegohm == null || ir10MinMegohm == null || ir1MinMegohm <= 0) {
    return { pi: null, band: null, minimumRecommendedPi, meetsMinimum: null };
  }

  const pi = ir10MinMegohm / ir1MinMegohm;
  const band = bandFor(pi);
  const meetsMinimum = pi >= minimumRecommendedPi;

  return { pi, band, minimumRecommendedPi, meetsMinimum };
}
