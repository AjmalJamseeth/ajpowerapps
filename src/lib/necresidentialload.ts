// NEC 220 Residential Electrical Load Calculator — dwelling-unit service
// load calculation using either the Standard Method (NEC Article 220 Part
// III) or the Optional Method (NEC 220.82), producing a total demand load
// in VA and a recommended minimum service size. Simplifications are noted
// inline and in the InfoPanel — this targets the common single-family
// dwelling case, not every edge case in Article 220 (e.g. multi-family
// dwellings, multiple ranges, or detailed heat-pump/electric-heat demand
// factor branching, which is exposed here as a user-selectable factor
// rather than auto-detected). Designed from scratch; no equivalent module
// exists elsewhere in AJapps (the existing Maximum Demand calculator uses
// a generic category demand-factor method, not the Article 220 dwelling
// procedure specifically).

import { STD_SIZES } from "./breakerfuse";

export type NecLoadMethod = "standard" | "optional";

export interface NecResidentialLoadInput {
  method: NecLoadMethod;
  floorAreaSqft: number;
  smallApplianceCircuits: number; // 220.52(A), typically 2, each 1500VA
  laundryCircuits: number; // 220.52(B), typically 1, each 1500VA

  otherFixedApplianceVaSum: number; // sum of nameplate VA for fixed appliances other than range/dryer/HVAC/EV
  otherFixedApplianceCount: number; // used for the Standard Method's 220.53 four-or-more 75% rule

  hasRange: boolean;
  rangeKw: number; // nameplate rating of a single household range

  hasDryer: boolean;
  dryerNameplateVa: number; // NEC 220.54 — use nameplate or 5000VA, whichever is larger

  coolingVa: number; // 0 if none
  heatingVa: number; // 0 if none
  hvacOptionalDemandFactorPct: number; // used only in Optional method — 100 (A/C or heat pump), 65 (electric heat, <=4 units), or 40 (electric heat, 5+ units)

  hasEvCharger: boolean;
  evChargerContinuousVa: number; // nameplate, continuous — 125% factor applied automatically

  voltageV: number; // single-phase 240V typical
}

export const DEFAULT_NEC_RESIDENTIAL_LOAD_INPUT: NecResidentialLoadInput = {
  method: "standard",
  floorAreaSqft: 2000,
  smallApplianceCircuits: 2,
  laundryCircuits: 1,
  otherFixedApplianceVaSum: 4500,
  otherFixedApplianceCount: 3,
  hasRange: true,
  rangeKw: 10,
  hasDryer: true,
  dryerNameplateVa: 5000,
  coolingVa: 4800,
  heatingVa: 10000,
  hvacOptionalDemandFactorPct: 100,
  hasEvCharger: false,
  evChargerContinuousVa: 7680,
  voltageV: 240,
};

export interface NecResidentialLoadResult {
  generalLightingVa: number;
  smallApplianceVa: number;
  laundryVa: number;
  generalLoadsSubtotalVa: number;
  generalLoadsDemandVa: number; // after Table 220.42 demand factor (Standard method only — Optional method folds this into the 10kVA/40% step)

  fixedApplianceDemandVa: number;
  rangeDemandVa: number;
  dryerDemandVa: number;
  hvacDemandVa: number;
  evDemandVa: number;

  totalDemandVa: number | null;
  serviceAmps: number | null;
  recommendedServiceA: number | null;
}

function rangeDemandVaStandard(rangeKw: number): number {
  if (rangeKw <= 0) return 0;
  if (rangeKw <= 12) return 8000;
  // NEC Table 220.55 Note 1: increase the 8kW column-C value by 5% per kW (or major fraction) over 12kW.
  const extraKw = rangeKw - 12;
  return 8000 * (1 + 0.05 * extraKw);
}

export function calcNecResidentialLoad(input: NecResidentialLoadInput): NecResidentialLoadResult {
  const generalLightingVa = Math.max(0, input.floorAreaSqft) * 3;
  const smallApplianceVa = Math.max(0, input.smallApplianceCircuits) * 1500;
  const laundryVa = Math.max(0, input.laundryCircuits) * 1500;
  const generalLoadsSubtotalVa = generalLightingVa + smallApplianceVa + laundryVa;

  const rangeVaNameplate = input.hasRange ? rangeDemandVaStandard(input.rangeKw) : 0; // used as-is for Standard method's Table 220.55 demand
  const dryerVaNameplate = input.hasDryer ? Math.max(5000, input.dryerNameplateVa) : 0;
  const evVa = input.hasEvCharger ? input.evChargerContinuousVa * 1.25 : 0;

  if (input.method === "standard") {
    let generalLoadsDemandVa: number;
    if (generalLoadsSubtotalVa <= 3000) {
      generalLoadsDemandVa = generalLoadsSubtotalVa;
    } else if (generalLoadsSubtotalVa <= 120000) {
      generalLoadsDemandVa = 3000 + (generalLoadsSubtotalVa - 3000) * 0.35;
    } else {
      generalLoadsDemandVa = 3000 + 117000 * 0.35 + (generalLoadsSubtotalVa - 120000) * 0.25;
    }

    const fixedApplianceDemandVa = input.otherFixedApplianceCount >= 4 ? input.otherFixedApplianceVaSum * 0.75 : input.otherFixedApplianceVaSum;
    const rangeDemandVa = rangeVaNameplate;
    const dryerDemandVa = dryerVaNameplate;
    const hvacDemandVa = Math.max(input.coolingVa, input.heatingVa);

    const totalDemandVa = generalLoadsDemandVa + fixedApplianceDemandVa + rangeDemandVa + dryerDemandVa + hvacDemandVa + evVa;
    const serviceAmps = input.voltageV > 0 ? totalDemandVa / input.voltageV : null;
    const recommendedServiceA = serviceAmps != null ? Math.max(100, STD_SIZES.find((s) => s >= serviceAmps) ?? STD_SIZES[STD_SIZES.length - 1]) : null;

    return {
      generalLightingVa, smallApplianceVa, laundryVa, generalLoadsSubtotalVa, generalLoadsDemandVa,
      fixedApplianceDemandVa, rangeDemandVa, dryerDemandVa, hvacDemandVa, evDemandVa: evVa,
      totalDemandVa, serviceAmps, recommendedServiceA,
    };
  }

  // Optional method — NEC 220.82: all "other load" items at nameplate/100%, summed, then
  // demand factor of 100% for the first 10kVA and 40% for the remainder (220.82(B)); HVAC
  // handled separately per 220.82(C) with a user-selected demand factor.
  const otherLoadVa = generalLoadsSubtotalVa + input.otherFixedApplianceVaSum + (input.hasRange ? input.rangeKw * 1000 : 0) + dryerVaNameplate + evVa;
  const generalLoadsDemandVa = otherLoadVa <= 10000 ? otherLoadVa : 10000 + (otherLoadVa - 10000) * 0.4;

  const hvacGoverningVa = Math.max(input.coolingVa, input.heatingVa);
  const hvacDemandVa = hvacGoverningVa * (Math.min(100, Math.max(0, input.hvacOptionalDemandFactorPct)) / 100);

  const totalDemandVa = generalLoadsDemandVa + hvacDemandVa;
  const serviceAmps = input.voltageV > 0 ? totalDemandVa / input.voltageV : null;
  const recommendedServiceA = serviceAmps != null ? Math.max(100, STD_SIZES.find((s) => s >= serviceAmps) ?? STD_SIZES[STD_SIZES.length - 1]) : null;

  return {
    generalLightingVa, smallApplianceVa, laundryVa, generalLoadsSubtotalVa, generalLoadsDemandVa,
    fixedApplianceDemandVa: input.otherFixedApplianceVaSum, rangeDemandVa: input.hasRange ? input.rangeKw * 1000 : 0, dryerDemandVa: dryerVaNameplate, hvacDemandVa, evDemandVa: evVa,
    totalDemandVa, serviceAmps, recommendedServiceA,
  };
}
