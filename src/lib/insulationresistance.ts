// Insulation Resistance Checker — IEEE 43-2013 Table 3 recommended minimum
// insulation resistance IR1min at 40 °C for rotating machinery, by winding type:
//   - kV + 1 MΩ : most windings made before about 1970, all field windings
//   - 100 MΩ    : most dc armature and ac windings built after about 1970 (form-wound coils)
//   - 5 MΩ      : most machines with random-wound stator coils, and form-wound coils rated below 1 kV
// Using kV + 1 for a modern form-wound winding would accept a reading far below
// the IEEE 43 recommendation, so the winding type must be chosen.

export type WindingType = "formWoundPost1970" | "randomWoundOrBelow1kV" | "pre1970OrField";

export const WINDING_TYPE_LABEL: Record<WindingType, string> = {
  formWoundPost1970: "AC/DC armature winding built after ~1970, form-wound (100 MΩ)",
  randomWoundOrBelow1kV: "Random-wound stator, or form-wound below 1 kV (5 MΩ)",
  pre1970OrField: "Winding made before ~1970, or field winding (kV + 1 MΩ)",
};

export interface InsulationResistanceInput {
  windingType: WindingType;
  ratedVoltageKv: number;
  measuredIrMegohm: number | null;
  measuredTempC: number; // temperature at time of test
}

export const DEFAULT_INSULATION_RESISTANCE_INPUT: InsulationResistanceInput = {
  windingType: "formWoundPost1970",
  ratedVoltageKv: 6.6,
  measuredIrMegohm: 250,
  measuredTempC: 40,
};

export interface InsulationResistanceResult {
  minimumRequiredMegohm: number;
  correctedIrMegohm: number | null; // IR corrected to 40°C using the common doubling-per-10°C rule of thumb
  pass: boolean | null;
}

// Common field rule of thumb: IR approximately halves for every 10°C rise
// (doubles for every 10°C fall) above/below 40°C reference — a widely used
// approximation (not a precise physical law), applied here only to correct
// a measurement taken at a different temperature back to the 40°C reference
// the IEEE 43 minimum values assume. Caveated in the UI as an approximation.
function correctTo40C(irMegohm: number, tempC: number): number {
  const deltaDecades = (tempC - 40) / 10;
  return irMegohm * Math.pow(2, deltaDecades);
}

export function calcInsulationResistance(input: InsulationResistanceInput): InsulationResistanceResult {
  const { ratedVoltageKv, measuredIrMegohm, measuredTempC } = input;

  const minimumRequiredMegohm =
    input.windingType === "formWoundPost1970" ? 100 : input.windingType === "randomWoundOrBelow1kV" ? 5 : ratedVoltageKv + 1;

  if (measuredIrMegohm == null) {
    return { minimumRequiredMegohm, correctedIrMegohm: null, pass: null };
  }

  const correctedIrMegohm = correctTo40C(measuredIrMegohm, measuredTempC);
  const pass = correctedIrMegohm >= minimumRequiredMegohm;

  return { minimumRequiredMegohm, correctedIrMegohm, pass };
}
