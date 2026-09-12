// Surge Protection Device (SPD) Rating Calculator — recommends an SPD
// Type by installation location, computes a minimum recommended MCOV
// (Maximum Continuous Operating Voltage) rating from system voltage and
// grounding configuration, and checks a candidate SPD's SCCR against the
// available fault current at the installation point, per NEC 230.67
// (service equipment), 242 (overvoltage protection, 2020+ NEC numbering),
// and 285.6/285.7 (installation, and use with other equipment). The
// 1.15× MCOV margin over line-to-neutral (or line-to-line for
// ungrounded/high-resistance systems, where a ground fault can drive
// that "line-to-ground" voltage up toward the full line-to-line value) is
// a commonly used manufacturer/IEEE-guidance safety margin, not a single
// literal NEC-mandated multiplier — actual minimum MCOV selection should
// also cross-check the SPD manufacturer's own UL 1449 listed voltage
// options. Designed from scratch; no equivalent module exists elsewhere
// in AJapps.

export type SpdGroundingType = "solidlyGroundedWye" | "highResistanceOrUngrounded" | "cornerGroundedDelta";
export type SpdInstallLocation = "serviceEntrance" | "downstreamPanelboard" | "pointOfUse";

export interface SpdRatingInput {
  systemVoltageLlV: number | null;
  groundingType: SpdGroundingType;
  installLocation: SpdInstallLocation;
  availableFaultCurrentA: number | null;
  candidateSpdMcovV: number | null;
  candidateSpdSccrA: number | null;
}

export const DEFAULT_SPD_RATING_INPUT: SpdRatingInput = {
  systemVoltageLlV: 480,
  groundingType: "solidlyGroundedWye",
  installLocation: "serviceEntrance",
  availableFaultCurrentA: 25000,
  candidateSpdMcovV: 320,
  candidateSpdSccrA: 65000,
};

const RECOMMENDED_TYPE: Record<SpdInstallLocation, string> = {
  serviceEntrance: "Type 1 (line side) or Type 2 (load side of main disconnect)",
  downstreamPanelboard: "Type 2",
  pointOfUse: "Type 3 (requires an upstream Type 1/2 SPD with sufficient conductor length per manufacturer instructions)",
};

export interface SpdRatingResult {
  recommendedType: string;
  referenceVoltageV: number | null; // the L-N (or worst-case L-L) voltage the MCOV margin is based on
  minRecommendedMcovV: number | null;
  mcovOk: boolean | null;
  sccrOk: boolean | null;
  overallOk: boolean | null;
}

const MCOV_MARGIN = 1.15;

export function calcSpdRating(input: SpdRatingInput): SpdRatingResult {
  const recommendedType = RECOMMENDED_TYPE[input.installLocation];
  const { systemVoltageLlV, groundingType, availableFaultCurrentA, candidateSpdMcovV, candidateSpdSccrA } = input;

  if (systemVoltageLlV == null || systemVoltageLlV <= 0) {
    return { recommendedType, referenceVoltageV: null, minRecommendedMcovV: null, mcovOk: null, sccrOk: null, overallOk: null };
  }

  const referenceVoltageV = groundingType === "solidlyGroundedWye" ? systemVoltageLlV / Math.sqrt(3) : systemVoltageLlV;
  const minRecommendedMcovV = referenceVoltageV * MCOV_MARGIN;

  const mcovOk = candidateSpdMcovV != null ? candidateSpdMcovV >= minRecommendedMcovV : null;
  const sccrOk = candidateSpdSccrA != null && availableFaultCurrentA != null ? candidateSpdSccrA >= availableFaultCurrentA : null;
  const overallOk = mcovOk != null && sccrOk != null ? mcovOk && sccrOk : null;

  return { recommendedType, referenceVoltageV, minRecommendedMcovV, mcovOk, sccrOk, overallOk };
}
