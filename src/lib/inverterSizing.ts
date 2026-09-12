// Inverter Sizing Calculator — Solar/Off-Grid/ILR. Grid-tied mode
// evaluates the DC:AC ratio (ILR, Inverter Load Ratio) between a PV
// array's STC DC rating and the inverter's continuous AC output rating —
// a deliberate oversizing practice (ILR typically 1.1-1.35) used to keep
// the inverter closer to full output for more of the day, accepting some
// clipping loss at solar noon in exchange for a smaller/cheaper inverter.
// Off-grid mode sizes an inverter's continuous and surge (motor-starting)
// capacity from a connected load. Designed from scratch; no equivalent
// module exists elsewhere in AJapps (the existing Solar PV Sizing
// calculator covers string voltage window/cable sizing, not DC:AC ratio
// or off-grid surge sizing).

export type InverterSizingMode = "gridTied" | "offGrid";

export interface InverterSizingInput {
  mode: InverterSizingMode;

  // gridTied
  arrayDcKw: number | null;
  targetIlr: number;
  candidateInverterAcKw: number | null;

  // offGrid
  continuousLoadKw: number | null;
  outputPowerFactor: number;
  surgeMultiple: number;
}

export const DEFAULT_INVERTER_SIZING_INPUT: InverterSizingInput = {
  mode: "gridTied",
  arrayDcKw: 12,
  targetIlr: 1.2,
  candidateInverterAcKw: 10,
  continuousLoadKw: 3.5,
  outputPowerFactor: 0.9,
  surgeMultiple: 3,
};

export type IlrGrade = "CONSERVATIVE (inverter oversized)" | "LOW DC:AC" | "TYPICAL" | "AGGRESSIVE (clipping likely)";

export function gradeIlr(ilr: number): IlrGrade {
  if (ilr < 1.0) return "CONSERVATIVE (inverter oversized)";
  if (ilr < 1.15) return "LOW DC:AC";
  if (ilr <= 1.35) return "TYPICAL";
  return "AGGRESSIVE (clipping likely)";
}

export interface InverterSizingResult {
  // gridTied
  recommendedInverterAcKw: number | null;
  actualIlr: number | null;
  ilrGrade: IlrGrade | null;

  // offGrid
  requiredContinuousKva: number | null;
  requiredSurgeKva: number | null;
}

export function calcInverterSizing(input: InverterSizingInput): InverterSizingResult {
  const empty: InverterSizingResult = {
    recommendedInverterAcKw: null, actualIlr: null, ilrGrade: null,
    requiredContinuousKva: null, requiredSurgeKva: null,
  };

  if (input.mode === "gridTied") {
    if (input.arrayDcKw == null || input.arrayDcKw <= 0 || input.targetIlr <= 0) return empty;
    const recommendedInverterAcKw = input.arrayDcKw / input.targetIlr;
    let actualIlr: number | null = null;
    let ilrGrade: IlrGrade | null = null;
    if (input.candidateInverterAcKw != null && input.candidateInverterAcKw > 0) {
      actualIlr = input.arrayDcKw / input.candidateInverterAcKw;
      ilrGrade = gradeIlr(actualIlr);
    }
    return { ...empty, recommendedInverterAcKw, actualIlr, ilrGrade };
  }

  // offGrid
  if (input.continuousLoadKw == null || input.continuousLoadKw <= 0 || input.outputPowerFactor <= 0) return empty;
  const requiredContinuousKva = input.continuousLoadKw / input.outputPowerFactor;
  const requiredSurgeKva = requiredContinuousKva * Math.max(1, input.surgeMultiple);
  return { ...empty, requiredContinuousKva, requiredSurgeKva };
}
