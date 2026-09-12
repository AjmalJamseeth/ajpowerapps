// Emergency Lighting Duration — battery-backed emergency/egress lighting
// runtime check or sizing. NFPA 101 (Life Safety Code) §7.9.2.1 requires
// emergency illumination for a minimum of 1.5 hours (90 minutes) in the
// event of normal lighting failure; NEC 700.12 cross-references this by
// requiring the alternate power supply for emergency systems to restore
// power within the time the system is designed to bridge, with unit
// equipment (NEC 700.12(F) / UL 924) specifically required to supply
// emergency luminaires for not less than 90 minutes. The 90-minute figure
// is applied here as the common code-minimum default — always confirm
// against the specific occupancy requirements and AHJ. Designed from
// scratch; no equivalent module exists elsewhere in AJapps.

export type EmergencyLightingMode = "check" | "size";

export interface EmergencyLightingInput {
  mode: EmergencyLightingMode;
  loadW: number | null;

  // check mode
  batteryWh: number | null;

  // size mode
  requiredDurationMin: number;

  // shared derating factors
  usableDodPct: number; // usable depth of discharge, %
  inverterEfficiencyPct: number; // DC->AC / regulation efficiency, %
  agingFactorPct: number; // extra capacity margin for end-of-life battery fade, % added to nameplate (e.g. 25% = size for 125% of the bare calculated Wh)
  systemVoltageV: number; // for the Ah figure
}

export const DEFAULT_EMERGENCY_LIGHTING_INPUT: EmergencyLightingInput = {
  mode: "check",
  loadW: 60,
  batteryWh: 108,
  requiredDurationMin: 90,
  usableDodPct: 80,
  inverterEfficiencyPct: 90,
  agingFactorPct: 25,
  systemVoltageV: 12,
};

export const NFPA_101_MIN_DURATION_MIN = 90;

export type EmergencyLightingGrade = "BELOW MINIMUM" | "MEETS MINIMUM" | "COMFORTABLE MARGIN" | "GENEROUS MARGIN";

export interface EmergencyLightingResult {
  // check mode
  runtimeMin: number | null;
  meetsMinimum: boolean | null;

  // size mode
  requiredNameplateWh: number | null;
  requiredAh: number | null;

  grade: EmergencyLightingGrade | null;
}

function gradeRuntime(runtimeMin: number): EmergencyLightingGrade {
  if (runtimeMin < NFPA_101_MIN_DURATION_MIN) return "BELOW MINIMUM";
  if (runtimeMin < NFPA_101_MIN_DURATION_MIN * 1.15) return "MEETS MINIMUM";
  if (runtimeMin < NFPA_101_MIN_DURATION_MIN * 1.5) return "COMFORTABLE MARGIN";
  return "GENEROUS MARGIN";
}

export function calcEmergencyLighting(input: EmergencyLightingInput): EmergencyLightingResult {
  const empty: EmergencyLightingResult = {
    runtimeMin: null,
    meetsMinimum: null,
    requiredNameplateWh: null,
    requiredAh: null,
    grade: null,
  };

  const dod = input.usableDodPct / 100;
  const eff = input.inverterEfficiencyPct / 100;
  if (input.loadW == null || input.loadW <= 0 || dod <= 0 || eff <= 0) return empty;

  if (input.mode === "check") {
    if (input.batteryWh == null || input.batteryWh <= 0) return empty;
    const usableWh = input.batteryWh * dod * eff;
    const runtimeMin = (usableWh / input.loadW) * 60;
    return { ...empty, runtimeMin, meetsMinimum: runtimeMin >= NFPA_101_MIN_DURATION_MIN, grade: gradeRuntime(runtimeMin) };
  }

  // size
  if (input.requiredDurationMin <= 0) return empty;
  const usableWhNeeded = input.loadW * (input.requiredDurationMin / 60);
  const bareNameplateWh = usableWhNeeded / (dod * eff);
  const agingMult = 1 + Math.max(0, input.agingFactorPct) / 100;
  const requiredNameplateWh = bareNameplateWh * agingMult;
  const requiredAh = input.systemVoltageV > 0 ? requiredNameplateWh / input.systemVoltageV : null;

  return {
    ...empty,
    requiredNameplateWh,
    requiredAh,
    grade: gradeRuntime(input.requiredDurationMin),
  };
}
