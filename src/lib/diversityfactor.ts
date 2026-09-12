// Diversity Factor — Coincident Demand. Standard definition (used by
// utilities and distribution planners): the diversity factor of a group of
// loads on a shared feeder/transformer/panel is the ratio of the sum of
// their individual (non-coincident) maximum demands to the coincident
// (system) maximum demand of the group as a whole:
//
//   DF = (ΣMD_individual) / MD_system         (DF ≥ 1 always, since the
//                                               individual peaks rarely
//                                               occur at the same instant)
//
// This is the reciprocal convention of "demand factor" (which relates a
// single load's connected load to its own maximum demand — see the
// existing Maximum Demand calculator for that). Designed from scratch; no
// equivalent module exists elsewhere in AJapps. Supports three modes so the
// same relation can be solved for whichever quantity is unknown.

export type DiversityMode = "compute" | "solveSystemMd" | "solveSumMd";

export interface DiversityFactorInput {
  mode: DiversityMode;
  sumIndividualMaxKw: number | null; // ΣMD_individual
  systemMaxKw: number | null; // MD_system (coincident)
  diversityFactor: number | null; // DF, used when solving for one of the above
}

export const DEFAULT_DIVERSITY_FACTOR_INPUT: DiversityFactorInput = {
  mode: "compute",
  sumIndividualMaxKw: 850,
  systemMaxKw: 620,
  diversityFactor: 1.5,
};

export type DiversityGrade = "LOW DIVERSITY" | "TYPICAL" | "HIGH DIVERSITY" | "VERY HIGH DIVERSITY";

export function gradeDiversityFactor(df: number): DiversityGrade {
  if (df < 1.15) return "LOW DIVERSITY";
  if (df < 1.5) return "TYPICAL";
  if (df < 2.2) return "HIGH DIVERSITY";
  return "VERY HIGH DIVERSITY";
}

export interface DiversityFactorResult {
  diversityFactor: number | null;
  sumIndividualMaxKw: number | null;
  systemMaxKw: number | null;
  noncoincidenceSavingsPct: number | null; // (ΣMDi - MDsystem) / ΣMDi × 100
  grade: DiversityGrade | null;
}

export function calcDiversityFactor(input: DiversityFactorInput): DiversityFactorResult {
  const empty: DiversityFactorResult = {
    diversityFactor: null,
    sumIndividualMaxKw: null,
    systemMaxKw: null,
    noncoincidenceSavingsPct: null,
    grade: null,
  };

  if (input.mode === "compute") {
    const { sumIndividualMaxKw, systemMaxKw } = input;
    if (sumIndividualMaxKw == null || systemMaxKw == null || sumIndividualMaxKw <= 0 || systemMaxKw <= 0) return empty;
    const diversityFactor = sumIndividualMaxKw / systemMaxKw;
    const noncoincidenceSavingsPct = ((sumIndividualMaxKw - systemMaxKw) / sumIndividualMaxKw) * 100;
    return {
      diversityFactor,
      sumIndividualMaxKw,
      systemMaxKw,
      noncoincidenceSavingsPct,
      grade: gradeDiversityFactor(diversityFactor),
    };
  }

  if (input.mode === "solveSystemMd") {
    const { sumIndividualMaxKw, diversityFactor } = input;
    if (sumIndividualMaxKw == null || diversityFactor == null || sumIndividualMaxKw <= 0 || diversityFactor <= 0) return empty;
    const systemMaxKw = sumIndividualMaxKw / diversityFactor;
    const noncoincidenceSavingsPct = ((sumIndividualMaxKw - systemMaxKw) / sumIndividualMaxKw) * 100;
    return {
      diversityFactor,
      sumIndividualMaxKw,
      systemMaxKw,
      noncoincidenceSavingsPct,
      grade: gradeDiversityFactor(diversityFactor),
    };
  }

  // solveSumMd
  const { systemMaxKw, diversityFactor } = input;
  if (systemMaxKw == null || diversityFactor == null || systemMaxKw <= 0 || diversityFactor <= 0) return empty;
  const sumIndividualMaxKw = systemMaxKw * diversityFactor;
  const noncoincidenceSavingsPct = ((sumIndividualMaxKw - systemMaxKw) / sumIndividualMaxKw) * 100;
  return {
    diversityFactor,
    sumIndividualMaxKw,
    systemMaxKw,
    noncoincidenceSavingsPct,
    grade: gradeDiversityFactor(diversityFactor),
  };
}
