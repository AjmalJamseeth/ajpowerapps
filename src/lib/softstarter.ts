// Soft Starter Sizing Calculator — screens whether a candidate soft
// starter's rated current is adequate for a motor's full-load current
// once ambient temperature, altitude, and duty-cycle (starts per hour)
// derating are applied, plus a voltage-rating adequacy check. The
// temperature/altitude/duty derating *rates* used here (≈1%/°C above
// 40°C, ≈1%/100m above 1000m, and the starts-per-hour bands) are generic
// figures commonly published across soft-starter manufacturer selection
// guides (broadly consistent with the kind of thermal-capacity/duty
// screening IEC 60947-4-2 AC-53a ratings address) — not a literal
// reproduction of any single manufacturer's or IEC's published table,
// since actual derating curves are model-specific. Always confirm the
// final selection against the chosen manufacturer's own datasheet.
// Designed from scratch; no equivalent module exists elsewhere in AJapps.

export interface SoftStarterInput {
  motorFlaA: number | null;
  motorRatedVoltageV: number;
  softStarterRatedCurrentA: number | null;
  softStarterRatedVoltageV: number;
  ambientTempC: number;
  altitudeM: number;
  startsPerHour: number;
}

export const DEFAULT_SOFT_STARTER_INPUT: SoftStarterInput = {
  motorFlaA: 85,
  motorRatedVoltageV: 400,
  softStarterRatedCurrentA: 105,
  softStarterRatedVoltageV: 400,
  ambientTempC: 40,
  altitudeM: 1000,
  startsPerHour: 5,
};

export interface SoftStarterResult {
  tempFactor: number;
  altitudeFactor: number;
  dutyFactor: number;
  deratedCapacityA: number | null;
  voltageOk: boolean | null;
  currentOk: boolean | null;
  overallOk: boolean | null;
}

function tempDeratingFactor(ambientTempC: number): number {
  if (ambientTempC <= 40) return 1.0;
  return Math.max(0.5, 1 - 0.01 * (ambientTempC - 40));
}

function altitudeDeratingFactor(altitudeM: number): number {
  if (altitudeM <= 1000) return 1.0;
  return Math.max(0.6, 1 - ((altitudeM - 1000) / 100) * 0.01);
}

function dutyDeratingFactor(startsPerHour: number): number {
  if (startsPerHour <= 10) return 1.0;
  if (startsPerHour <= 20) return 0.9;
  if (startsPerHour <= 30) return 0.8;
  return 0.7;
}

export function calcSoftStarter(input: SoftStarterInput): SoftStarterResult {
  const tempFactor = tempDeratingFactor(input.ambientTempC);
  const altitudeFactor = altitudeDeratingFactor(input.altitudeM);
  const dutyFactor = dutyDeratingFactor(input.startsPerHour);

  if (input.motorFlaA == null || input.motorFlaA <= 0 || input.softStarterRatedCurrentA == null || input.softStarterRatedCurrentA <= 0) {
    return { tempFactor, altitudeFactor, dutyFactor, deratedCapacityA: null, voltageOk: null, currentOk: null, overallOk: null };
  }

  const deratedCapacityA = input.softStarterRatedCurrentA * tempFactor * altitudeFactor * dutyFactor;
  const voltageOk = input.softStarterRatedVoltageV >= input.motorRatedVoltageV;
  const currentOk = deratedCapacityA >= input.motorFlaA;
  const overallOk = voltageOk && currentOk;

  return { tempFactor, altitudeFactor, dutyFactor, deratedCapacityA, voltageOk, currentOk, overallOk };
}
