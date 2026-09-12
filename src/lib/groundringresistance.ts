// Ground Ring Resistance Calculator — single circular buried bare-conductor
// ring electrode resistance-to-earth, reusing the same BS 7430 ring formula
// already verified in earthing.ts (calcRingR) for consistency with the
// Earthing Grid Design module. Standalone quick-check version of just the
// single-ring case, with the same practical 25Ω grading band used by the
// Ground Resistance (single rod) calculator.

import { calcRingR } from "./earthing";
import { GroundResistanceGrade, gradeGroundResistance } from "./groundresistance";

export interface GroundRingResistanceInput {
  rho: number; // soil resistivity, Ω·m
  ringDiameterM: number; // overall ring diameter, m
  conductorDiameterMm: number; // bare conductor diameter, mm
  burialDepthM: number; // burial depth, m
  targetMaxOhms: number; // comparison threshold, default 25Ω rule of thumb
}

export const DEFAULT_GROUND_RING_RESISTANCE_INPUT: GroundRingResistanceInput = {
  rho: 100,
  ringDiameterM: 10,
  conductorDiameterMm: 10,
  burialDepthM: 0.6,
  targetMaxOhms: 25,
};

export interface GroundRingResistanceResult {
  resistanceOhms: number | null;
  grade: GroundResistanceGrade | null;
  passesTarget: boolean | null;
}

export function calcGroundRingResistance(input: GroundRingResistanceInput): GroundRingResistanceResult {
  const { rho, ringDiameterM, conductorDiameterMm, burialDepthM, targetMaxOhms } = input;
  if (rho <= 0 || ringDiameterM <= 0 || conductorDiameterMm <= 0 || burialDepthM <= 0) {
    return { resistanceOhms: null, grade: null, passesTarget: null };
  }
  const radiusM = conductorDiameterMm / 2000; // mm -> m, diameter -> radius
  const resistanceOhms = calcRingR(rho, ringDiameterM, radiusM, burialDepthM);
  if (resistanceOhms == null) return { resistanceOhms: null, grade: null, passesTarget: null };

  const grade = gradeGroundResistance(resistanceOhms, targetMaxOhms);
  const passesTarget = resistanceOhms <= targetMaxOhms;
  return { resistanceOhms, grade, passesTarget };
}
