// Lighting Design — lumen method (EN 12464-1 or IES Handbook). Interior room
// types free; exterior/area lighting and EN 1838 emergency lighting check are
// subscriber features. Ported and verified from the AJ Apps Suite's
// `LightingDesign` module.

export type LightingStandard = "en" | "ies";
export type RoomCategory = "interior" | "exterior";
export type EmergAreaType = "escape" | "antipanic" | "highrisk";

const FC_TO_LUX = 10.764;

export interface RoomTypeDef {
  label: string;
  lux: number;
  category: RoomCategory;
}

export const ROOM_TYPES: Record<LightingStandard, RoomTypeDef[]> = {
  en: [
    { label: "Office (general/open plan)", lux: 500, category: "interior" },
    { label: "Office (CAD/technical drawing)", lux: 750, category: "interior" },
    { label: "Corridor", lux: 100, category: "interior" },
    { label: "Stairs", lux: 150, category: "interior" },
    { label: "Classroom", lux: 300, category: "interior" },
    { label: "Retail sales area", lux: 300, category: "interior" },
    { label: "Warehouse — general storage", lux: 150, category: "interior" },
    { label: "Warehouse — picking/loading", lux: 300, category: "interior" },
    { label: "Industrial — rough work", lux: 200, category: "interior" },
    { label: "Industrial — fine work", lux: 500, category: "interior" },
    { label: "Sports hall", lux: 300, category: "interior" },
    { label: "Car park — traffic route", lux: 75, category: "exterior" },
    { label: "Car park — parking area", lux: 20, category: "exterior" },
    { label: "Car park — pedestrian area", lux: 50, category: "exterior" },
  ],
  ies: [
    { label: "Open Office (desk)", lux: Math.round(40 * FC_TO_LUX), category: "interior" },
    { label: "Conference Room (table)", lux: Math.round(30 * FC_TO_LUX), category: "interior" },
    { label: "Circulation/Corridor", lux: Math.round(5 * FC_TO_LUX), category: "interior" },
    { label: "Stairs", lux: Math.round(5 * FC_TO_LUX), category: "interior" },
    { label: "Classroom (typical)", lux: Math.round(15 * FC_TO_LUX), category: "interior" },
    { label: "Classroom (challenging/lab)", lux: Math.round(25 * FC_TO_LUX), category: "interior" },
    { label: "Retail — general (ambient)", lux: Math.round(50 * FC_TO_LUX), category: "interior" },
    { label: "Retail — department store (ambient)", lux: Math.round(40 * FC_TO_LUX), category: "interior" },
    { label: "Warehouse — bulky/large label", lux: Math.round(10 * FC_TO_LUX), category: "interior" },
    { label: "Warehouse — small items/label", lux: Math.round(30 * FC_TO_LUX), category: "interior" },
    { label: "Industrial assembly (simple)", lux: Math.round(30 * FC_TO_LUX), category: "interior" },
    { label: "Industrial assembly (difficult)", lux: Math.round(100 * FC_TO_LUX), category: "interior" },
    { label: "Restroom (general)", lux: Math.round(5 * FC_TO_LUX), category: "interior" },
    { label: "Parking — covered", lux: Math.round(5 * FC_TO_LUX), category: "exterior" },
    { label: "Parking — uncovered, urban", lux: Math.round(1.5 * FC_TO_LUX), category: "exterior" },
    { label: "Parking — uncovered, suburban", lux: Math.round(1 * FC_TO_LUX), category: "exterior" },
    { label: "Building exterior — safety/security", lux: Math.round(1 * FC_TO_LUX), category: "exterior" },
  ],
};

export const EMERG_REQ: Record<EmergAreaType, { min: number; uniformity: number; other: string }> = {
  escape: { min: 1, uniformity: 40, other: "Ra ≥ 40 · 1 hour duration · 50% within 5s, 100% within 60s (≤2m wide routes; 0.5 lux over ≥half the width)" },
  antipanic: { min: 0.5, uniformity: 40, other: "Ra ≥ 40 · 1 hour duration · 50% within 5s, 100% within 60s (0.5m border excluded)" },
  highrisk: { min: 15, uniformity: 10, other: "Or 10% of normal task illuminance if greater · switch-on within 0.5s · duration = as long as hazard persists" },
};

export interface LightingInput {
  standard: LightingStandard;
  roomTypeIndex: number;
  targetE: number;
  lengthM: number;
  widthM: number;
  mountHeightM: number;
  fluxLm: number;
  utilizationFactor: number;
  maintenanceFactor: number;
  emergType: EmergAreaType;
  emergMeasuredMin: number | null;
  emergMeasuredMax: number | null;
}

export const DEFAULT_LIGHTING_INPUT: LightingInput = {
  standard: "en",
  roomTypeIndex: 0,
  targetE: 500,
  lengthM: 10,
  widthM: 8,
  mountHeightM: 2.5,
  fluxLm: 4000,
  utilizationFactor: 0.55,
  maintenanceFactor: 0.8,
  emergType: "escape",
  emergMeasuredMin: 1.2,
  emergMeasuredMax: 15,
};

export interface LightingResult {
  category: RoomCategory;
  areaM2: number | null;
  roomIndexK: number | null;
  nExact: number | null;
  nRequired: number | null;
  achievedLux: number | null;
  emerg: {
    reqMin: number;
    reqUniformity: number;
    other: string;
    minCheck: boolean | null;
    uniformityCheck: boolean | null;
    uniformityRatio: number | null;
  } | null;
}

export function calcLighting(input: LightingInput, premiumEnabled: boolean): LightingResult | null {
  const rows = ROOM_TYPES[input.standard];
  const row = rows[input.roomTypeIndex];
  const category = row ? row.category : "interior";

  let areaM2: number | null = null,
    roomIndexK: number | null = null,
    nExact: number | null = null,
    nRequired: number | null = null,
    achievedLux: number | null = null;

  const locked = category === "exterior" && !premiumEnabled;
  if (!locked && input.targetE && input.lengthM && input.widthM && input.mountHeightM) {
    areaM2 = input.lengthM * input.widthM;
    roomIndexK = (input.lengthM * input.widthM) / (input.mountHeightM * (input.lengthM + input.widthM));
    if (input.fluxLm > 0 && input.utilizationFactor > 0 && input.maintenanceFactor > 0) {
      nExact = (input.targetE * areaM2) / (input.fluxLm * input.utilizationFactor * input.maintenanceFactor);
      nRequired = Math.ceil(nExact);
      achievedLux = (nRequired * input.fluxLm * input.utilizationFactor * input.maintenanceFactor) / areaM2;
    }
  }

  let emerg: LightingResult["emerg"] = null;
  if (premiumEnabled) {
    const req = EMERG_REQ[input.emergType];
    let minCheck: boolean | null = null,
      uniformityCheck: boolean | null = null,
      uniformityRatio: number | null = null;
    if (input.emergMeasuredMin != null) {
      minCheck = input.emergMeasuredMin >= req.min;
      if (input.emergMeasuredMax != null && input.emergMeasuredMin > 0) {
        uniformityRatio = input.emergMeasuredMax / input.emergMeasuredMin;
        uniformityCheck = uniformityRatio <= req.uniformity;
      }
    }
    emerg = { reqMin: req.min, reqUniformity: req.uniformity, other: req.other, minCheck, uniformityCheck, uniformityRatio };
  }

  return { category, areaM2, roomIndexK, nExact, nRequired, achievedLux, emerg };
}
