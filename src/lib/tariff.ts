// Demand Charge / Time-of-Use (TOU) Tariff Calculator — estimates a monthly
// electricity bill from itemized TOU energy consumption, a peak demand
// charge, a fixed/service charge, and an optional power-factor penalty.
// Utility tariff structures (rates, TOU period definitions, PF penalty
// formulas) are genuinely utility/region-specific — there is no single
// universal IEC/NEC standard for them, so every rate in this calculator is
// a user-supplied input, not a built-in constant. Designed from scratch; no
// equivalent module in the source app.

export interface TouPeriod {
  label: string;
  kwh: number;
  ratePerKwh: number;
}

export interface TariffInput {
  periods: TouPeriod[];
  peakDemandKw: number | null;
  demandRatePerKw: number;
  fixedMonthlyCharge: number;
  powerFactor: number | null; // measured, 0-1 — leave null to skip the PF penalty check
  pfPenaltyThreshold: number; // 0-1, e.g. 0.9 — utilities commonly require PF above this
  pfPenaltyRatePct: number; // % surcharge applied to the demand charge per the utility's PF penalty formula
}

export const DEFAULT_TARIFF_INPUT: TariffInput = {
  periods: [
    { label: "Peak", kwh: 8000, ratePerKwh: 0.42 },
    { label: "Off-peak", kwh: 15000, ratePerKwh: 0.22 },
  ],
  peakDemandKw: 120,
  demandRatePerKw: 35,
  fixedMonthlyCharge: 100,
  powerFactor: 0.88,
  pfPenaltyThreshold: 0.9,
  pfPenaltyRatePct: 0.5, // 0.5% demand-charge surcharge per 0.01 PF shortfall below threshold — a common utility formula pattern
};

export interface TariffResult {
  totalKwh: number;
  energyCharge: number;
  demandCharge: number;
  pfPenaltyPct: number;
  pfPenaltyCharge: number;
  fixedCharge: number;
  totalBill: number;
  blendedRatePerKwh: number | null;
}

export function calcTariff(input: TariffInput): TariffResult {
  const { periods, peakDemandKw, demandRatePerKw, fixedMonthlyCharge, powerFactor, pfPenaltyThreshold, pfPenaltyRatePct } = input;

  const totalKwh = periods.reduce((sum, p) => sum + (p.kwh || 0), 0);
  const energyCharge = periods.reduce((sum, p) => sum + (p.kwh || 0) * (p.ratePerKwh || 0), 0);

  const demandCharge = peakDemandKw != null ? peakDemandKw * demandRatePerKw : 0;

  // Common utility PF-penalty pattern: a surcharge proportional to how far
  // PF falls below the threshold, applied to the demand charge. Expressed
  // here per 0.01 (1 percentage point) of shortfall — the exact formula and
  // rate vary significantly by utility, so this is illustrative/adjustable,
  // not a fixed constant.
  let pfPenaltyPct = 0;
  if (powerFactor != null && powerFactor < pfPenaltyThreshold) {
    const shortfallPoints = (pfPenaltyThreshold - powerFactor) * 100;
    pfPenaltyPct = shortfallPoints * pfPenaltyRatePct;
  }
  const pfPenaltyCharge = demandCharge * (pfPenaltyPct / 100);

  const fixedCharge = fixedMonthlyCharge;
  const totalBill = energyCharge + demandCharge + pfPenaltyCharge + fixedCharge;
  const blendedRatePerKwh = totalKwh > 0 ? totalBill / totalKwh : null;

  return { totalKwh, energyCharge, demandCharge, pfPenaltyPct, pfPenaltyCharge, fixedCharge, totalBill, blendedRatePerKwh };
}
