// Cogeneration (CHP) Sizing Calculator — preliminary electrical capacity
// screening for a combined heat and power system, sized to the more
// limiting of the site's electrical baseload or thermal baseload (rather
// than the larger of the two), since oversizing against either baseload
// wastes the corresponding output (excess electricity export at a poor
// rate, or dumped/wasted heat) and undermines the economics that justify
// CHP in the first place. Designed from scratch; no equivalent module
// exists elsewhere in AJapps.

export type ChpSizeClass = "SMALL" | "STANDARD" | "LARGE" | "VERY LARGE";

export interface ChpSizingInput {
  electricalDemandKw: number | null; // continuous/baseload electrical demand
  thermalDemandKw: number | null; // continuous/baseload usable thermal demand
  heatToPowerRatio: number; // HPR = thermal output / electrical output, for the candidate CHP technology
}

export const DEFAULT_CHP_SIZING_INPUT: ChpSizingInput = {
  electricalDemandKw: 500,
  thermalDemandKw: 800,
  heatToPowerRatio: 1.3,
};

export function classifyChpSize(kw: number): ChpSizeClass {
  if (kw < 100) return "SMALL";
  if (kw < 1000) return "STANDARD";
  if (kw < 5000) return "LARGE";
  return "VERY LARGE";
}

export interface ChpSizingResult {
  sizeBasedOnElectricalKw: number | null;
  sizeBasedOnThermalKw: number | null;
  recommendedSizeKw: number | null;
  governingBaseload: "electrical" | "thermal" | null;
  sizeClass: ChpSizeClass | null;
}

export function calcChpSizing(input: ChpSizingInput): ChpSizingResult {
  const { electricalDemandKw, thermalDemandKw, heatToPowerRatio } = input;
  if (electricalDemandKw == null || electricalDemandKw <= 0 || thermalDemandKw == null || thermalDemandKw <= 0 || heatToPowerRatio <= 0) {
    return { sizeBasedOnElectricalKw: null, sizeBasedOnThermalKw: null, recommendedSizeKw: null, governingBaseload: null, sizeClass: null };
  }

  const sizeBasedOnElectricalKw = electricalDemandKw;
  const sizeBasedOnThermalKw = thermalDemandKw / heatToPowerRatio;
  const recommendedSizeKw = Math.min(sizeBasedOnElectricalKw, sizeBasedOnThermalKw);
  const governingBaseload = sizeBasedOnElectricalKw <= sizeBasedOnThermalKw ? "electrical" : "thermal";

  return {
    sizeBasedOnElectricalKw, sizeBasedOnThermalKw, recommendedSizeKw, governingBaseload,
    sizeClass: classifyChpSize(recommendedSizeKw),
  };
}
