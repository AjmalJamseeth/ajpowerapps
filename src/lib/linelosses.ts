// Distribution Line Technical Losses — annual energy loss estimate from
// peak load, diversity factor, and load factor, using the commonly-cited
// empirical loss-factor approximation LSF ~ 0.3*LF + 0.7*LF^2 (a widely
// referenced empirical relation for converting load factor to loss factor
// when interval data isn't available; clearly caveated in the UI as an
// approximation, not an exact relationship). Designed from scratch; no
// equivalent module in the source app.

export interface LineLossesInput {
  peakLoadKw: number | null;
  diversityFactor: number; // >= 1, coincident peak = sum of individual peaks / diversity factor
  loadFactorPct: number; // average load / peak load, 0-100
  lineResistanceOhm: number; // total line resistance (per phase, or as modeled)
  currentAtPeakA: number | null; // optional direct current input for I^2R loss calc; if provided, used instead of back-calculating from kW
  systemVoltageKv: number;
  powerFactor: number;
  costPerKwh: number;
}

export const DEFAULT_LINE_LOSSES_INPUT: LineLossesInput = {
  peakLoadKw: 500,
  diversityFactor: 1.2,
  loadFactorPct: 60,
  lineResistanceOhm: 0.5,
  currentAtPeakA: null,
  systemVoltageKv: 11,
  powerFactor: 0.9,
  costPerKwh: 0.12,
};

export interface LineLossesResult {
  coincidentPeakKw: number | null;
  loadFactor: number;
  lossFactor: number;
  peakCurrentA: number | null;
  peakLossKw: number | null;
  annualEnergyLossKwh: number | null;
  annualLossCost: number | null;
}

export function calcLineLosses(input: LineLossesInput): LineLossesResult {
  const { peakLoadKw, diversityFactor, loadFactorPct, lineResistanceOhm, currentAtPeakA, systemVoltageKv, powerFactor, costPerKwh } = input;

  const loadFactor = loadFactorPct / 100;
  const lossFactor = 0.3 * loadFactor + 0.7 * loadFactor * loadFactor;

  if (peakLoadKw == null) {
    return { coincidentPeakKw: null, loadFactor, lossFactor, peakCurrentA: null, peakLossKw: null, annualEnergyLossKwh: null, annualLossCost: null };
  }

  const df = diversityFactor > 0 ? diversityFactor : 1;
  const coincidentPeakKw = peakLoadKw / df;

  const peakCurrentA = currentAtPeakA != null && currentAtPeakA > 0
    ? currentAtPeakA
    : (coincidentPeakKw * 1000) / (Math.sqrt(3) * systemVoltageKv * 1000 * powerFactor);

  // I^2R loss, x3 for three phases (lineResistanceOhm is per-phase resistance)
  const peakLossKw = (3 * peakCurrentA * peakCurrentA * lineResistanceOhm) / 1000;

  const hoursPerYear = 8760;
  const annualEnergyLossKwh = peakLossKw * lossFactor * hoursPerYear;
  const annualLossCost = annualEnergyLossKwh * costPerKwh;

  return { coincidentPeakKw, loadFactor, lossFactor, peakCurrentA, peakLossKw, annualEnergyLossKwh, annualLossCost };
}
