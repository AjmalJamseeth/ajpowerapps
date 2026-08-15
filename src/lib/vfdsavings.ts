// Pump/Fan VFD Energy Savings — affinity-law energy savings estimate for
// switching a centrifugal pump/fan from throttled (valve/damper) flow
// control to VFD speed control. Basis: the standard centrifugal-load
// affinity laws (flow proportional to speed, power proportional to speed
// cubed) — textbook fluid-machinery physics, widely used in DOE/utility
// VFD retrofit guidance. The throttled-baseline power is a conservative,
// commonly-used simplifying assumption (see notes below), not a fitted
// pump/fan curve — for a bankable savings estimate, use actual pump/fan
// curve data or trended power at the throttled condition. Designed from
// scratch; no equivalent module in the source app. Feeds naturally into
// the Life-Cycle Cost calculator for a full payback analysis.

export interface VfdSavingsInput {
  motorRatedPowerKw: number | null;
  flowReductionPct: number; // 0-100, e.g. 30 means operating at 70% of full flow
  baselinePowerPct: number; // 0-100, throttled/undamped power as % of rated at the reduced flow — default 100 (conservative: throttling barely reduces motor power)
  operatingHoursPerYear: number;
  electricityRate: number; // currency per kWh
}

export const DEFAULT_VFD_SAVINGS_INPUT: VfdSavingsInput = {
  motorRatedPowerKw: 75,
  flowReductionPct: 30,
  baselinePowerPct: 100,
  operatingHoursPerYear: 6000,
  electricityRate: 0.12,
};

export interface VfdSavingsResult {
  flowFraction: number;
  vfdPowerKw: number | null;
  baselinePowerKw: number | null;
  powerSavingsKw: number | null;
  annualEnergySavingsKwh: number | null;
  annualCostSavings: number | null;
}

export function calcVfdSavings(input: VfdSavingsInput): VfdSavingsResult {
  const { motorRatedPowerKw, flowReductionPct, baselinePowerPct, operatingHoursPerYear, electricityRate } = input;

  const flowFraction = Math.max(0, 1 - flowReductionPct / 100);

  if (motorRatedPowerKw == null) {
    return {
      flowFraction,
      vfdPowerKw: null,
      baselinePowerKw: null,
      powerSavingsKw: null,
      annualEnergySavingsKwh: null,
      annualCostSavings: null,
    };
  }

  // Cubic affinity law: power ∝ speed^3, and for a centrifugal load with a
  // pure quadratic system curve, speed reduction ≈ flow reduction, so
  // power ∝ flow^3.
  const vfdPowerKw = motorRatedPowerKw * Math.pow(flowFraction, 3);
  const baselinePowerKw = motorRatedPowerKw * (baselinePowerPct / 100);
  const powerSavingsKw = Math.max(0, baselinePowerKw - vfdPowerKw);
  const annualEnergySavingsKwh = powerSavingsKw * operatingHoursPerYear;
  const annualCostSavings = annualEnergySavingsKwh * electricityRate;

  return { flowFraction, vfdPowerKw, baselinePowerKw, powerSavingsKw, annualEnergySavingsKwh, annualCostSavings };
}
