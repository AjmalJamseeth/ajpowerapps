// Smart Grid Peak Shaving Calculator — sizes a Battery Energy Storage
// System (BESS) to shave a facility's peak demand down to a target level,
// and estimates the resulting demand-charge savings and simple payback.
// Designed from scratch; no equivalent module exists elsewhere in AJapps
// (the existing Energy Storage (BESS) calculator sizes storage from
// IEEE 1547/IEC 62933 usable-energy/PCS voltage-window requirements, not
// from a demand-charge peak-shaving economic target).

export type PeakShavingClass = "NO REDUCTION NEEDED" | "STANDARD" | "LONG-DURATION" | "HIGH-REDUCTION" | "LOW-BENEFIT" | "INFEASIBLE";

export interface PeakShavingInput {
  peakDemandKw: number | null;
  targetPeakKw: number | null;
  peakDurationHours: number;
  roundTripEfficiencyPct: number;
  inverterMarginPct: number;
  demandChargeRatePerKwMonth: number;
  bessCapitalCostPerKwh: number | null;
}

export const DEFAULT_PEAK_SHAVING_INPUT: PeakShavingInput = {
  peakDemandKw: 1000,
  targetPeakKw: 750,
  peakDurationHours: 2,
  roundTripEfficiencyPct: 90,
  inverterMarginPct: 10,
  demandChargeRatePerKwMonth: 15,
  bessCapitalCostPerKwh: 400,
};

export interface PeakShavingResult {
  requiredShaveKw: number | null;
  bessPowerRatingKw: number | null;
  bessEnergyCapacityKwh: number | null;
  monthlyDemandChargeSavings: number | null;
  annualSavings: number | null;
  totalCapitalCost: number | null;
  simplePaybackYears: number | null;
  shaveClass: PeakShavingClass | null;
}

export function calcPeakShaving(input: PeakShavingInput): PeakShavingResult {
  const empty: PeakShavingResult = {
    requiredShaveKw: null, bessPowerRatingKw: null, bessEnergyCapacityKwh: null,
    monthlyDemandChargeSavings: null, annualSavings: null, totalCapitalCost: null,
    simplePaybackYears: null, shaveClass: null,
  };

  const { peakDemandKw, targetPeakKw, peakDurationHours, roundTripEfficiencyPct, inverterMarginPct, demandChargeRatePerKwMonth, bessCapitalCostPerKwh } = input;
  if (peakDemandKw == null || peakDemandKw <= 0 || targetPeakKw == null || targetPeakKw < 0 || peakDurationHours <= 0 || roundTripEfficiencyPct <= 0) {
    return empty;
  }

  const requiredShaveKw = Math.max(0, peakDemandKw - targetPeakKw);

  if (requiredShaveKw === 0) {
    return { ...empty, requiredShaveKw: 0, shaveClass: "NO REDUCTION NEEDED" };
  }

  const bessPowerRatingKw = requiredShaveKw * (1 + Math.max(0, inverterMarginPct) / 100);
  const bessEnergyCapacityKwh = (requiredShaveKw * peakDurationHours) / (roundTripEfficiencyPct / 100);

  const monthlyDemandChargeSavings = requiredShaveKw * demandChargeRatePerKwMonth;
  const annualSavings = monthlyDemandChargeSavings * 12;

  let totalCapitalCost: number | null = null;
  let simplePaybackYears: number | null = null;
  if (bessCapitalCostPerKwh != null && bessCapitalCostPerKwh > 0) {
    totalCapitalCost = bessEnergyCapacityKwh * bessCapitalCostPerKwh;
    simplePaybackYears = annualSavings > 0 ? totalCapitalCost / annualSavings : null;
  }

  const shaveRatio = requiredShaveKw / peakDemandKw;
  let shaveClass: PeakShavingClass;
  if (simplePaybackYears != null && simplePaybackYears > 15) {
    shaveClass = "LOW-BENEFIT";
  } else if (annualSavings <= 0) {
    shaveClass = "INFEASIBLE";
  } else if (peakDurationHours > 4) {
    shaveClass = "LONG-DURATION";
  } else if (shaveRatio > 0.3) {
    shaveClass = "HIGH-REDUCTION";
  } else {
    shaveClass = "STANDARD";
  }

  return {
    requiredShaveKw, bessPowerRatingKw, bessEnergyCapacityKwh,
    monthlyDemandChargeSavings, annualSavings, totalCapitalCost, simplePaybackYears, shaveClass,
  };
}
