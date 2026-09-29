// VFD Sizing Calculator — recommends the minimum VFD rated output current
// needed for a given motor once ambient temperature, altitude and duty-type
// (Variable Torque vs Constant Torque) are accounted for. Distinct from
// VFD Parameter Selection (`vfdparameter.ts`), which screens a specific,
// already-chosen VFD's nameplate against a motor for compatibility — this
// tool instead answers "what rated current do I need to shop for?" before
// a candidate has been picked. Designed from scratch; no equivalent module
// exists elsewhere in AJapps.
//
// Temperature/altitude derating rates (≈1%/°C above 40°C, ≈1%/100m above
// 1000m) mirror the same generic manufacturer-typical figures already used
// in soft-starter sizing (`softstarter.ts`) on this site — commonly
// published screening figures, not a literal reproduction of any single
// manufacturer's datasheet curve.
//
// Constant-Torque duty multiplier: most VFD frames publish two output
// current ratings for the same physical hardware — a higher "Variable
// Torque" (VT, light-overload, ~110% for 60s) rating and a lower "Constant
// Torque" (CT, heavy-overload, ~150% for 60s) rating, with the CT rating
// commonly around 85-87% of the VT rating for the same frame. So sizing
// for a constant-torque load (conveyors, extruders, hoists, positive-
// displacement pumps) effectively needs ~1.15x more VT-equivalent rated
// current than sizing for a variable-torque load (centrifugal pumps/fans)
// with the same motor FLA — a widely cited rule of thumb, not a fixed
// standard value; always confirm against the specific drive model's
// published VT/CT current tables.

export type VfdDutyType = "vt" | "ct";

const DUTY_MULTIPLIER: Record<VfdDutyType, number> = {
  vt: 1.0,
  ct: 1.15,
};

export interface VfdSizingInput {
  motorFlaA: number | null;
  motorRatedVoltageV: number;
  dutyType: VfdDutyType;
  safetyMarginPct: number;
  ambientTempC: number;
  altitudeM: number;
  candidateVfdRatedCurrentA: number | null;
  candidateVfdRatedVoltageV: number | null;
}

export const DEFAULT_VFD_SIZING_INPUT: VfdSizingInput = {
  motorFlaA: 65,
  motorRatedVoltageV: 400,
  dutyType: "vt",
  safetyMarginPct: 10,
  ambientTempC: 40,
  altitudeM: 1000,
  candidateVfdRatedCurrentA: null,
  candidateVfdRatedVoltageV: null,
};

export interface VfdSizingResult {
  tempFactor: number;
  altitudeFactor: number;
  dutyMultiplier: number;
  requiredOutputCurrentA: number | null;
  minRequiredRatedCurrentA: number | null;
  candidateVoltageOk: boolean | null;
  candidateCurrentOk: boolean | null;
  candidateOverallOk: boolean | null;
}

function tempDeratingFactor(ambientTempC: number): number {
  if (ambientTempC <= 40) return 1.0;
  return Math.max(0.5, 1 - 0.01 * (ambientTempC - 40));
}

function altitudeDeratingFactor(altitudeM: number): number {
  if (altitudeM <= 1000) return 1.0;
  return Math.max(0.6, 1 - ((altitudeM - 1000) / 100) * 0.01);
}

export function calcVfdSizing(input: VfdSizingInput): VfdSizingResult {
  const tempFactor = tempDeratingFactor(input.ambientTempC);
  const altitudeFactor = altitudeDeratingFactor(input.altitudeM);
  const dutyMultiplier = DUTY_MULTIPLIER[input.dutyType];

  if (input.motorFlaA == null || input.motorFlaA <= 0) {
    return {
      tempFactor,
      altitudeFactor,
      dutyMultiplier,
      requiredOutputCurrentA: null,
      minRequiredRatedCurrentA: null,
      candidateVoltageOk: null,
      candidateCurrentOk: null,
      candidateOverallOk: null,
    };
  }

  const requiredOutputCurrentA = input.motorFlaA * (1 + input.safetyMarginPct / 100) * dutyMultiplier;
  const deratedAvailableFactor = tempFactor * altitudeFactor;
  const minRequiredRatedCurrentA = requiredOutputCurrentA / deratedAvailableFactor;

  let candidateVoltageOk: boolean | null = null;
  let candidateCurrentOk: boolean | null = null;
  let candidateOverallOk: boolean | null = null;
  if (input.candidateVfdRatedCurrentA != null && input.candidateVfdRatedCurrentA > 0) {
    candidateVoltageOk =
      input.candidateVfdRatedVoltageV != null ? input.candidateVfdRatedVoltageV >= input.motorRatedVoltageV : null;
    candidateCurrentOk = input.candidateVfdRatedCurrentA >= minRequiredRatedCurrentA;
    candidateOverallOk = (candidateVoltageOk ?? true) && candidateCurrentOk;
  }

  return {
    tempFactor,
    altitudeFactor,
    dutyMultiplier,
    requiredOutputCurrentA,
    minRequiredRatedCurrentA,
    candidateVoltageOk,
    candidateCurrentOk,
    candidateOverallOk,
  };
}
