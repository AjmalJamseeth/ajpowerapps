// Wind Turbine Power Output Calculator — electrical power output from
// rotor diameter, wind speed, air density, power coefficient (Cp), and
// generator efficiency, using the standard wind power equation:
//   P = 0.5 × ρ × A × v³ × Cp × η_gen
// where A = π×(D/2)² is the swept rotor area. Cp is capped by the Betz
// limit (0.593) for a physically realizable value; typical real-world
// utility-scale turbines run Cp ≈ 0.35-0.45 at rated conditions.
// Designed from scratch; no equivalent module exists elsewhere in AJapps.

export interface WindTurbinePowerInput {
  rotorDiameterM: number | null;
  windSpeedMs: number | null;
  airDensityKgM3: number;
  powerCoefficientCp: number;
  generatorEfficiencyPct: number;
}

export const DEFAULT_WIND_TURBINE_POWER_INPUT: WindTurbinePowerInput = {
  rotorDiameterM: 20,
  windSpeedMs: 10,
  airDensityKgM3: 1.225,
  powerCoefficientCp: 0.4,
  generatorEfficiencyPct: 95,
};

export const BETZ_LIMIT_CP = 0.593;

export type WindPowerGrade = "LOW" | "NORMAL" | "HIGH" | "VERY HIGH";

export function gradeWindPower(powerKw: number): WindPowerGrade {
  if (powerKw < 5) return "LOW";
  if (powerKw < 100) return "NORMAL";
  if (powerKw < 1000) return "HIGH";
  return "VERY HIGH";
}

export interface WindTurbinePowerResult {
  sweptAreaM2: number | null;
  powerOutputW: number | null;
  powerOutputKw: number | null;
  cpExceedsBetzLimit: boolean;
  grade: WindPowerGrade | null;
}

export function calcWindTurbinePower(input: WindTurbinePowerInput): WindTurbinePowerResult {
  const { rotorDiameterM, windSpeedMs, airDensityKgM3, powerCoefficientCp, generatorEfficiencyPct } = input;
  if (rotorDiameterM == null || rotorDiameterM <= 0 || windSpeedMs == null || windSpeedMs <= 0 || airDensityKgM3 <= 0) {
    return { sweptAreaM2: null, powerOutputW: null, powerOutputKw: null, cpExceedsBetzLimit: false, grade: null };
  }

  const sweptAreaM2 = Math.PI * Math.pow(rotorDiameterM / 2, 2);
  const cpExceedsBetzLimit = powerCoefficientCp > BETZ_LIMIT_CP;
  const eff = Math.max(0, generatorEfficiencyPct) / 100;

  const powerOutputW = 0.5 * airDensityKgM3 * sweptAreaM2 * Math.pow(windSpeedMs, 3) * powerCoefficientCp * eff;
  const powerOutputKw = powerOutputW / 1000;

  return { sweptAreaM2, powerOutputW, powerOutputKw, cpExceedsBetzLimit, grade: gradeWindPower(powerOutputKw) };
}
