// Ground Resistance Calculator — single vertical driven rod electrode
// resistance-to-earth, reusing the same BS 7430 rod formula already
// verified in earthing.ts (calcRodR) for consistency with the Earthing
// Grid Design module. This is a standalone quick-check version of just
// the single-rod case, with a practical grading band against the common
// NEC 250.53(A)(2) Exception rule-of-thumb (a single rod/pipe/plate
// electrode is deemed adequate without a supplemental electrode if it
// tests at 25Ω or less) — flagged as a widely-used practical threshold,
// not a universal numeric limit written into NEC 250.53 itself (which
// doesn't mandate a specific ohm value for all electrode types).

import { calcRodR } from "./earthing";

export type GroundResistanceGrade = "LOW" | "NORMAL" | "HIGH" | "VERY HIGH";

export interface GroundResistanceInput {
  rho: number; // soil resistivity, Ω·m
  rodLengthM: number; // driven length, m
  rodDiameterMm: number; // rod diameter, mm
  targetMaxOhms: number; // comparison threshold, default 25Ω (NEC 250.53(A)(2) rule of thumb)
}

export const DEFAULT_GROUND_RESISTANCE_INPUT: GroundResistanceInput = {
  rho: 100,
  rodLengthM: 3,
  rodDiameterMm: 16,
  targetMaxOhms: 25,
};

export interface GroundResistanceResult {
  resistanceOhms: number | null;
  grade: GroundResistanceGrade | null;
  passesTarget: boolean | null;
}

export function gradeGroundResistance(rOhms: number, targetMaxOhms: number): GroundResistanceGrade {
  if (rOhms <= targetMaxOhms * 0.4) return "LOW";
  if (rOhms <= targetMaxOhms) return "NORMAL";
  if (rOhms <= targetMaxOhms * 2) return "HIGH";
  return "VERY HIGH";
}

export function calcGroundResistance(input: GroundResistanceInput): GroundResistanceResult {
  const { rho, rodLengthM, rodDiameterMm, targetMaxOhms } = input;
  if (rho <= 0 || rodLengthM <= 0 || rodDiameterMm <= 0) {
    return { resistanceOhms: null, grade: null, passesTarget: null };
  }
  const radiusM = rodDiameterMm / 2000; // mm -> m, diameter -> radius
  const resistanceOhms = calcRodR(rho, rodLengthM, radiusM);
  if (resistanceOhms == null) return { resistanceOhms: null, grade: null, passesTarget: null };

  const grade = gradeGroundResistance(resistanceOhms, targetMaxOhms);
  const passesTarget = resistanceOhms <= targetMaxOhms;
  return { resistanceOhms, grade, passesTarget };
}
