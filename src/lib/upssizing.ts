// UPS Sizing — required Uninterruptible Power Supply kVA rating from
// critical load and redundancy configuration, plus an approximate battery
// energy/Ah figure for the stated backup (ride-through) time. No
// equivalent module exists in the source app — designed from scratch.
//
// The battery-energy figure here is a quick sizing estimate
// (usable energy = load × time, nameplate = usable ÷ (DoD × efficiency),
// same relation used by the Energy Storage (BESS) module). For a full
// IEEE 485 duty-cycle section-by-section battery design, use the
// dedicated Battery & DC System Sizing calculator.
//
// Redundancy: with `totalUnits` (N) identical UPS frames installed, any
// (N−1) of them must be able to carry the full critical load alone — the
// same "N-1 configuration" convention used by the Transformer Sizer,
// which in UPS terminology is usually described as "N+1" (N frames
// needed for the load, +1 spare, total N+1 installed).

export type LoadMethod = "kw" | "kva";

// Common UPS module/frame kVA ratings.
export const STD_UPS_KVA = [10, 15, 20, 30, 40, 60, 80, 100, 120, 160, 200, 250, 300, 400, 500, 600, 800, 1000];

function roundUpUps(val: number): number {
  const s = STD_UPS_KVA.find((s) => s >= val);
  return s === undefined ? STD_UPS_KVA[STD_UPS_KVA.length - 1] : s;
}

export interface UpsSizingInput {
  loadMethod: LoadMethod;
  criticalLoadKw: number | null;
  criticalLoadKva: number | null;
  powerFactor: number;
  marginPct: number;
  totalUnits: number; // N — any (N-1) must carry the full load
  upsOutputPf: number; // rated kW capability = kVA × upsOutputPf
  backupTimeMin: number;
  dodFraction: number; // battery depth of discharge, 0-1
  inverterEfficiency: number; // DC->AC conversion efficiency, 0-1
  dcBusVoltage: number;
}

export const DEFAULT_UPSSIZING_INPUT: UpsSizingInput = {
  loadMethod: "kw",
  criticalLoadKw: 200,
  criticalLoadKva: null,
  powerFactor: 0.9,
  marginPct: 20,
  totalUnits: 2,
  upsOutputPf: 0.9,
  backupTimeMin: 15,
  dodFraction: 0.8,
  inverterEfficiency: 0.92,
  dcBusVoltage: 480,
};

export interface UpsSizingResult {
  designLoadKva: number;
  marginedLoadKva: number;
  perUnitRequiredKva: number;
  recommendedKva: number;
  recommendedKw: number; // capability at rated PF
  redundantUnitsRequired: number; // N-1
  battery: {
    usableEnergyKwh: number;
    nameplateEnergyKwh: number;
    approxAh: number;
  } | null;
}

export function calcUpsSizing(input: UpsSizingInput): UpsSizingResult | null {
  const designLoadKva = input.loadMethod === "kw" ? (input.criticalLoadKw && input.powerFactor > 0 ? input.criticalLoadKw / input.powerFactor : null) : input.criticalLoadKva;
  if (designLoadKva == null || designLoadKva <= 0) return null;

  const marginedLoadKva = designLoadKva * (1 + input.marginPct / 100);

  const n = Math.max(1, Math.round(input.totalUnits || 1));
  const redundantUnitsRequired = Math.max(1, n - 1);
  const perUnitRequiredKva = marginedLoadKva / redundantUnitsRequired;

  const recommendedKva = roundUpUps(perUnitRequiredKva);
  const recommendedKw = recommendedKva * input.upsOutputPf;

  let battery: UpsSizingResult["battery"] = null;
  const loadKwForBattery = input.loadMethod === "kw" ? input.criticalLoadKw : input.criticalLoadKva != null ? input.criticalLoadKva * input.powerFactor : null;
  if (loadKwForBattery != null && loadKwForBattery > 0 && input.backupTimeMin > 0 && input.dodFraction > 0 && input.inverterEfficiency > 0 && input.dcBusVoltage > 0) {
    const usableEnergyKwh = loadKwForBattery * (input.backupTimeMin / 60);
    const nameplateEnergyKwh = usableEnergyKwh / (input.dodFraction * input.inverterEfficiency);
    const approxAh = (nameplateEnergyKwh * 1000) / input.dcBusVoltage;
    battery = { usableEnergyKwh, nameplateEnergyKwh, approxAh };
  }

  return { designLoadKva, marginedLoadKva, perUnitRequiredKva, recommendedKva, recommendedKw, redundantUnitsRequired, battery };
}
