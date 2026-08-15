// Insulation Resistance Checker — IEEE 43-2013 recommended minimum
// insulation resistance for rotating machinery: IR(1min, 40°C) >= kV_rated + 1
// megohms (the traditional/older formula, still widely cited as a quick
// field-acceptance check; IEEE 43 also offers a newer, winding-specific
// formula but this older kV+1 rule remains the common "quick check" and is
// what's reproduced here). Verified via web search before coding. Designed
// from scratch; no equivalent module in the source app.

export interface InsulationResistanceInput {
  ratedVoltageKv: number;
  measuredIrMegohm: number | null;
  measuredTempC: number; // temperature at time of test
}

export const DEFAULT_INSULATION_RESISTANCE_INPUT: InsulationResistanceInput = {
  ratedVoltageKv: 6.6,
  measuredIrMegohm: 12,
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
// the IEEE 43 kV+1 threshold assumes. Caveated in the UI as an approximation.
function correctTo40C(irMegohm: number, tempC: number): number {
  const deltaDecades = (tempC - 40) / 10;
  return irMegohm * Math.pow(2, deltaDecades);
}

export function calcInsulationResistance(input: InsulationResistanceInput): InsulationResistanceResult {
  const { ratedVoltageKv, measuredIrMegohm, measuredTempC } = input;

  const minimumRequiredMegohm = ratedVoltageKv + 1;

  if (measuredIrMegohm == null) {
    return { minimumRequiredMegohm, correctedIrMegohm: null, pass: null };
  }

  const correctedIrMegohm = correctTo40C(measuredIrMegohm, measuredTempC);
  const pass = correctedIrMegohm >= minimumRequiredMegohm;

  return { minimumRequiredMegohm, correctedIrMegohm, pass };
}
