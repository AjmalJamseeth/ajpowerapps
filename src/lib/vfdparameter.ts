// VFD Parameter Selection Calculator — screens a motor's nameplate data
// against a candidate VFD's ratings: voltage match, current loading, the
// motor's base V/Hz ratio, synchronous speed, and slip. Designed from
// scratch; no equivalent module exists elsewhere in AJapps (the existing
// Pump/Fan VFD Energy Savings calculator addresses affinity-law energy
// savings, not drive/motor compatibility screening).

export type VfdMatchStatus = "WELL MATCHED" | "ADEQUATE" | "MARGINAL" | "PARAMETER MISMATCH";

export interface VfdParameterInput {
  motorRatedVoltageV: number | null;
  motorRatedCurrentA: number | null;
  motorRatedFrequencyHz: number;
  motorRatedSpeedRpm: number | null;
  motorPoles: number;
  vfdRatedVoltageV: number | null;
  vfdRatedCurrentA: number | null;
}

export const DEFAULT_VFD_PARAMETER_INPUT: VfdParameterInput = {
  motorRatedVoltageV: 400,
  motorRatedCurrentA: 65,
  motorRatedFrequencyHz: 50,
  motorRatedSpeedRpm: 1480,
  motorPoles: 4,
  vfdRatedVoltageV: 400,
  vfdRatedCurrentA: 75,
};

export interface VfdParameterResult {
  voltageMatch: boolean | null;
  currentLoadingPct: number | null;
  baseVHzRatio: number | null;
  synchronousSpeedRpm: number | null;
  slipPct: number | null;
  status: VfdMatchStatus | null;
}

export function calcVfdParameter(input: VfdParameterInput): VfdParameterResult {
  const empty: VfdParameterResult = {
    voltageMatch: null, currentLoadingPct: null, baseVHzRatio: null,
    synchronousSpeedRpm: null, slipPct: null, status: null,
  };

  const { motorRatedVoltageV, motorRatedCurrentA, motorRatedFrequencyHz, motorRatedSpeedRpm, motorPoles, vfdRatedVoltageV, vfdRatedCurrentA } = input;
  if (motorRatedVoltageV == null || motorRatedVoltageV <= 0 || motorRatedCurrentA == null || motorRatedCurrentA <= 0 || vfdRatedVoltageV == null || vfdRatedVoltageV <= 0 || vfdRatedCurrentA == null || vfdRatedCurrentA <= 0 || motorPoles <= 0) {
    return empty;
  }

  // Voltage should be within a practical -0%/+10% window of the motor's rating (VFD output
  // voltage can't exceed what it's supplied, and running well below the motor rating under-fluxes it).
  const voltageMatch = vfdRatedVoltageV >= motorRatedVoltageV && vfdRatedVoltageV <= motorRatedVoltageV * 1.1;
  const currentLoadingPct = (motorRatedCurrentA / vfdRatedCurrentA) * 100;
  const baseVHzRatio = motorRatedFrequencyHz > 0 ? motorRatedVoltageV / motorRatedFrequencyHz : null;
  const synchronousSpeedRpm = (120 * motorRatedFrequencyHz) / motorPoles;
  const slipPct = motorRatedSpeedRpm != null && motorRatedSpeedRpm > 0 && synchronousSpeedRpm > 0
    ? ((synchronousSpeedRpm - motorRatedSpeedRpm) / synchronousSpeedRpm) * 100
    : null;

  let status: VfdMatchStatus;
  if (!voltageMatch) {
    status = "PARAMETER MISMATCH";
  } else if (currentLoadingPct > 100) {
    status = "PARAMETER MISMATCH";
  } else if (currentLoadingPct > 90) {
    status = "MARGINAL";
  } else if (currentLoadingPct > 70) {
    status = "ADEQUATE";
  } else {
    status = "WELL MATCHED";
  }

  return { voltageMatch, currentLoadingPct, baseVHzRatio, synchronousSpeedRpm, slipPct, status };
}
