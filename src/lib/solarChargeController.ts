// Solar Charge Controller Sizing Calculator — required continuous current
// rating for an off-grid PV charge controller, either from the array's
// short-circuit current (PWM controllers, which track close to array
// current) or from array power and battery voltage (MPPT controllers,
// which regulate on the DC bus and draw current based on power balance).
// Both paths apply the NEC 690.8(A) 125% continuous-current factor.
// Designed from scratch; no equivalent module exists elsewhere in AJapps
// (the existing Solar PV Sizing calculator covers grid-tied string/
// inverter sizing, not off-grid charge controller selection).

export type ChargeControllerType = "pwm" | "mppt";

export interface SolarChargeControllerInput {
  controllerType: ChargeControllerType;
  pvStringIscA: number | null; // PWM path
  numParallelStrings: number;
  arrayMaxPowerW: number | null; // MPPT path
  nominalBatteryVoltageV: number; // MPPT path
  designMarginPct: number;
}

export const DEFAULT_SOLAR_CHARGE_CONTROLLER_INPUT: SolarChargeControllerInput = {
  controllerType: "mppt",
  pvStringIscA: 10.5,
  numParallelStrings: 2,
  arrayMaxPowerW: 4000,
  nominalBatteryVoltageV: 48,
  designMarginPct: 10,
};

export type ChargeControllerGrade = "SMALL" | "STANDARD" | "LARGE" | "VERY LARGE";

// Common commercially available charge controller current ratings — a
// practical rounding reference, not an official standard series.
const COMMON_RATINGS_A = [10, 20, 30, 40, 45, 50, 60, 80, 100, 150, 200];

function roundUpCommon(val: number): number {
  const r = COMMON_RATINGS_A.find((r) => r >= val);
  return r === undefined ? Math.ceil(val / 10) * 10 : r;
}

export function gradeChargeController(ratingA: number): ChargeControllerGrade {
  if (ratingA <= 30) return "SMALL";
  if (ratingA <= 60) return "STANDARD";
  if (ratingA <= 100) return "LARGE";
  return "VERY LARGE";
}

export interface SolarChargeControllerResult {
  baseCurrentA: number | null;
  requiredControllerA: number | null;
  recommendedCommonRatingA: number | null;
  grade: ChargeControllerGrade | null;
}

export function calcSolarChargeController(input: SolarChargeControllerInput): SolarChargeControllerResult {
  const margin = 1 + Math.max(0, input.designMarginPct) / 100;

  let baseCurrentA: number | null = null;
  if (input.controllerType === "pwm") {
    if (input.pvStringIscA != null && input.pvStringIscA > 0 && input.numParallelStrings > 0) {
      baseCurrentA = input.pvStringIscA * input.numParallelStrings;
    }
  } else {
    if (input.arrayMaxPowerW != null && input.arrayMaxPowerW > 0 && input.nominalBatteryVoltageV > 0) {
      baseCurrentA = input.arrayMaxPowerW / input.nominalBatteryVoltageV;
    }
  }

  if (baseCurrentA == null) {
    return { baseCurrentA: null, requiredControllerA: null, recommendedCommonRatingA: null, grade: null };
  }

  const requiredControllerA = baseCurrentA * 1.25 * margin;
  const recommendedCommonRatingA = roundUpCommon(requiredControllerA);
  const grade = gradeChargeController(recommendedCommonRatingA);

  return { baseCurrentA, requiredControllerA, recommendedCommonRatingA, grade };
}
