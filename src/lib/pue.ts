// Data Center Power Usage Effectiveness (PUE) — ISO/IEC 30134-2 / Green Grid.
// PUE = Total Facility Energy / IT Equipment Energy. Also computes DCiE
// (Data Center infrastructure Efficiency, the reciprocal expressed as a
// percentage), non-IT "overhead" energy and its annual cost, and an
// efficiency-band classification against the commonly-cited Green Grid PUE
// scale (2007 white paper) — a widely-used informal industry scale, not a
// formal ISO/IEC-mandated classification (ISO/IEC 30134-2 standardizes the
// metric and measurement methodology, not efficiency bands). Designed from
// scratch; no equivalent module in the source app.

export interface PueInput {
  totalFacilityEnergyKwh: number | null; // over the measurement period (e.g. one month/year)
  itEquipmentEnergyKwh: number | null; // over the same period
  electricityRate: number; // currency per kWh, for the overhead-cost estimate
}

export const DEFAULT_PUE_INPUT: PueInput = {
  totalFacilityEnergyKwh: 1500000,
  itEquipmentEnergyKwh: 1000000,
  electricityRate: 0.12,
};

export type PueBand = "world-class" | "efficient" | "moderate" | "poor" | "inefficient" | "very-inefficient";

export interface PueResult {
  pue: number | null;
  dciePct: number | null;
  overheadEnergyKwh: number | null;
  overheadPct: number | null; // overhead as % of total facility energy
  overheadAnnualCost: number | null; // using electricityRate, same period basis as the inputs
  band: PueBand | null;
  bandLabel: string;
}

const BAND_LABELS: Record<PueBand, string> = {
  "world-class": "World-class (PUE < 1.2)",
  efficient: "Efficient (PUE 1.2–1.5)",
  moderate: "Moderate (PUE 1.5–2.0)",
  poor: "Poor (PUE 2.0–2.5)",
  inefficient: "Inefficient (PUE 2.5–3.0)",
  "very-inefficient": "Very inefficient (PUE ≥ 3.0)",
};

function classifyPue(pue: number): PueBand {
  if (pue < 1.2) return "world-class";
  if (pue < 1.5) return "efficient";
  if (pue < 2.0) return "moderate";
  if (pue < 2.5) return "poor";
  if (pue < 3.0) return "inefficient";
  return "very-inefficient";
}

export function calcPue(input: PueInput): PueResult {
  const { totalFacilityEnergyKwh: total, itEquipmentEnergyKwh: it, electricityRate } = input;

  if (total == null || it == null || it <= 0 || total < it) {
    return {
      pue: null,
      dciePct: null,
      overheadEnergyKwh: null,
      overheadPct: null,
      overheadAnnualCost: null,
      band: null,
      bandLabel: "",
    };
  }

  const pue = total / it;
  const dciePct = (it / total) * 100;
  const overheadEnergyKwh = total - it;
  const overheadPct = (overheadEnergyKwh / total) * 100;
  const overheadAnnualCost = overheadEnergyKwh * electricityRate;
  const band = classifyPue(pue);

  return {
    pue,
    dciePct,
    overheadEnergyKwh,
    overheadPct,
    overheadAnnualCost,
    band,
    bandLabel: BAND_LABELS[band],
  };
}
