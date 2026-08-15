// Energy Storage (BESS) Sizing — IEEE 1547 / IEC 62933 / IEC 61427-2 aligned.
// Ported and verified from the AJ Apps Suite's `Storage` module.

import {
  ConductorMaterial,
  InstallMethod,
  CABLE_SIZES,
  lookupAmpacity,
  deratingCa,
  deratingCg,
  voltDropPct,
} from "./cable";

export type BessChemistry = "liion" | "leadacid" | "flow";
export type BessPhase = "1ph" | "3ph";

export const CHEM_DEFAULTS: Record<BessChemistry, { dod: number; rte: number }> = {
  liion: { dod: 90, rte: 92 },
  leadacid: { dod: 50, rte: 85 },
  flow: { dod: 100, rte: 75 },
};

// Approximate DoD vs cycle-life curve (Li-ion order-of-magnitude reference;
// always confirm against the specific manufacturer's cycle-life datasheet).
const CYCLE_LIFE_CURVE: [number, number][] = [
  [20, 12000],
  [40, 8500],
  [50, 7000],
  [60, 6000],
  [80, 4500],
  [100, 3000],
];

function cycleLifeEstimate(dodPct: number | null): number | null {
  if (dodPct == null) return null;
  const c = CYCLE_LIFE_CURVE;
  if (dodPct <= c[0][0]) return c[0][1];
  if (dodPct >= c[c.length - 1][0]) return c[c.length - 1][1];
  for (let i = 0; i < c.length - 1; i++) {
    const [x0, y0] = c[i];
    const [x1, y1] = c[i + 1];
    if (dodPct >= x0 && dodPct <= x1) return y0 + ((y1 - y0) * (dodPct - x0)) / (x1 - x0);
  }
  return null;
}

interface CableSizeResult {
  size: number | null;
  amp: number | null;
  vd: number | null;
}

function sizeCableAC(ibDesign: number | null, material: ConductorMaterial, method: InstallMethod, length: number | null, ambient: number, grouping: number, volt: number, phase: BessPhase): CableSizeResult {
  if (!ibDesign || !length) return { size: null, amp: null, vd: null };
  const buried = method === "D1";
  const ca = deratingCa(ambient, "XLPE90", buried);
  const cg = deratingCg(grouping);
  const cf = ca * cg;
  for (let i = 0; i < CABLE_SIZES.length; i++) {
    const sz = CABLE_SIZES[i];
    const base = lookupAmpacity(material, "XLPE90", method, i);
    if (!base) continue;
    const derated = base * cf;
    if (derated >= ibDesign) {
      const vdResult = voltDropPct(material, sz, ibDesign, length, volt, phase === "3ph" ? "3ph" : "1ph", 1.0);
      if (vdResult && vdResult.vd_pct <= 3) return { size: sz, amp: derated, vd: vdResult.vd_pct };
    }
  }
  return { size: null, amp: null, vd: null };
}

export interface BessInput {
  // Free
  chemistry: BessChemistry;
  loadPowerKw: number;
  backupDurationH: number;
  dodPct: number;
  rtePct: number;
  cRate: number;
  nominalVoltage: number;
  pcsMinDcVoltage: number;
  pcsMaxDcVoltage: number;
  pcsRatedAcPowerKw: number;
  pcsPhase: BessPhase;
  pcsAcVoltage: number;
  acCableMaterial: ConductorMaterial;
  acMethod: InstallMethod;
  acCableLengthM: number;
  acAmbientC: number;
  acGrouping: number;
  // Subscriber
  numBanks: number;
}

export const DEFAULT_BESS_INPUT: BessInput = {
  chemistry: "liion",
  loadPowerKw: 100,
  backupDurationH: 2,
  dodPct: 90,
  rtePct: 92,
  cRate: 0.5,
  nominalVoltage: 700,
  pcsMinDcVoltage: 600,
  pcsMaxDcVoltage: 850,
  pcsRatedAcPowerKw: 100,
  pcsPhase: "3ph",
  pcsAcVoltage: 400,
  acCableMaterial: "Cu",
  acMethod: "C",
  acCableLengthM: 20,
  acAmbientC: 30,
  acGrouping: 1,
  numBanks: 2,
};

export interface BessResult {
  usableEnergyKwh: number;
  nameplateKwh: number;
  maxPowerKw: number;
  cRateOk: boolean;
  voltageOk: boolean | null;
  pcsPowerOk: boolean | null;
  ac: CableSizeResult;
  site: {
    siteEnergyKwh: number;
    sitePowerKw: number;
    cycleLife: number | null;
  } | null;
}

export function calcBess(input: BessInput, premiumEnabled: boolean): BessResult | null {
  const { loadPowerKw: pLoad, backupDurationH: tBackup, dodPct: dod, rtePct: rte, cRate } = input;
  if (!pLoad || !tBackup || !dod || !rte || !cRate) return null;

  const usableEnergyKwh = pLoad * tBackup;
  const nameplateKwh = usableEnergyKwh / ((dod / 100) * (rte / 100));
  const maxPowerKw = cRate * nameplateKwh;
  const cRateOk = maxPowerKw >= pLoad;

  const voltageOk = input.nominalVoltage && input.pcsMinDcVoltage && input.pcsMaxDcVoltage
    ? input.nominalVoltage >= input.pcsMinDcVoltage && input.nominalVoltage <= input.pcsMaxDcVoltage
    : null;

  const pcsPowerOk = input.pcsRatedAcPowerKw ? input.pcsRatedAcPowerKw >= pLoad : null;

  let acCurrent: number | null = null;
  if (input.pcsRatedAcPowerKw && input.pcsAcVoltage) {
    acCurrent = input.pcsPhase === "3ph" ? (input.pcsRatedAcPowerKw * 1000) / (Math.sqrt(3) * input.pcsAcVoltage) : (input.pcsRatedAcPowerKw * 1000) / input.pcsAcVoltage;
  }
  const acDesignI = acCurrent ? acCurrent * 1.25 : null;
  const ac = sizeCableAC(acDesignI, input.acCableMaterial, input.acMethod, input.acCableLengthM, input.acAmbientC || 30, input.acGrouping || 1, input.pcsAcVoltage, input.pcsPhase);

  let site: BessResult["site"] = null;
  if (premiumEnabled) {
    const n = Math.max(1, Math.round(input.numBanks || 0));
    site = {
      siteEnergyKwh: n * nameplateKwh,
      sitePowerKw: n * maxPowerKw,
      cycleLife: cycleLifeEstimate(dod),
    };
  }

  return { usableEnergyKwh, nameplateKwh, maxPowerKw, cRateOk, voltageOk, pcsPowerOk, ac, site };
}
