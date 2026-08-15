// Solar PV Sizing — IEC 62548 (PV array design requirements) and
// IEC 60364-7-712 (electrical installations — solar photovoltaic power
// supply systems). Ported and verified from the AJ Apps Suite's `PV` module.

import {
  ConductorMaterial,
  InstallMethod,
  CABLE_SIZES,
  lookupAmpacity,
  deratingCa,
  deratingCg,
  voltDropPct,
} from "./cable";

export type PvPhase = "1ph" | "3ph";

export interface PvInput {
  // Free — PV module
  voc: number; // Voc STC, V
  vmpp: number; // Vmpp STC, V
  isc: number; // Isc STC, A
  impp: number; // Impp STC, A
  pmaxWp: number; // Pmax STC, Wp
  tempCoeffVocPct: number; // %/°C, typically negative

  // Free — array & site conditions
  ns: number; // modules per string
  np: number; // strings in parallel
  siteTempMinC: number;
  siteTempMaxC: number;

  // Free — inverter
  mpptMinV: number;
  mpptMaxV: number;
  maxDcV: number;
  maxDcA: number; // max DC input current per MPPT
  acPowerKw: number;
  phase: PvPhase;
  acVoltage: number;

  // Free — DC cable
  dcMaterial: ConductorMaterial;
  dcMethod: InstallMethod;
  dcLengthM: number;
  dcAmbientC: number;

  // Free — AC cable
  acMaterial: ConductorMaterial;
  acMethod: InstallMethod;
  acLengthM: number;
  acAmbientC: number;
  acGrouping: number;
}

export const DEFAULT_PV_INPUT: PvInput = {
  voc: 49.5,
  vmpp: 41.5,
  isc: 13.9,
  impp: 13.0,
  pmaxWp: 550,
  tempCoeffVocPct: -0.29,
  ns: 20,
  np: 1,
  siteTempMinC: 5,
  siteTempMaxC: 65,
  mpptMinV: 200,
  mpptMaxV: 850,
  maxDcV: 1000,
  maxDcA: 16,
  acPowerKw: 10,
  phase: "3ph",
  acVoltage: 400,
  dcMaterial: "Cu",
  dcMethod: "C",
  dcLengthM: 30,
  dcAmbientC: 40,
  acMaterial: "Cu",
  acMethod: "C",
  acLengthM: 15,
  acAmbientC: 30,
  acGrouping: 1,
};

export const PV_FUSES = [1, 2, 3, 4, 6, 8, 10, 12, 15, 16, 20, 25, 30, 32, 40, 50];

function pickFuse(minA: number): number | null {
  for (const f of PV_FUSES) if (f >= minA) return f;
  return null;
}

interface CableSizeResult {
  size: number | null;
  amp: number | null;
  vd: number | null;
}

function sizeCableDC(ibDesign: number, material: ConductorMaterial, method: InstallMethod, length: number, ambient: number, voltNom: number): CableSizeResult {
  if (!ibDesign || !length) return { size: null, amp: null, vd: null };
  const buried = method === "D1";
  const ca = deratingCa(ambient, "XLPE90", buried);
  for (let i = 0; i < CABLE_SIZES.length; i++) {
    const sz = CABLE_SIZES[i];
    const base = lookupAmpacity(material, "XLPE90", method, i);
    if (!base) continue;
    const derated = base * ca;
    if (derated >= ibDesign) {
      const vdResult = voltDropPct(material, sz, ibDesign, length, voltNom, "dc", 1.0);
      if (vdResult && vdResult.vd_pct <= 2) {
        return { size: sz, amp: derated, vd: vdResult.vd_pct };
      }
    }
  }
  return { size: null, amp: null, vd: null };
}

function sizeCableAC(ibDesign: number, material: ConductorMaterial, method: InstallMethod, length: number, ambient: number, grouping: number, volt: number, phase: PvPhase): CableSizeResult {
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
      const vdResult = voltDropPct(material, sz, ibDesign, length, volt, phase, 1.0);
      if (vdResult && vdResult.vd_pct <= 3) {
        return { size: sz, amp: derated, vd: vdResult.vd_pct };
      }
    }
  }
  return { size: null, amp: null, vd: null };
}

export interface PvResult {
  vMax: number; // worst-case high, cold, Voc basis
  vMaxPass: boolean | null;
  vMppCold: number;
  vMppHot: number;
  mpptPass: boolean | null;
  iscDesign: number;
  iscPass: boolean | null;
  dc: CableSizeResult;
  ac: CableSizeResult;
  dcAcRatio: { ratio: number; arrayKwp: number; note: string } | null;

  // subscriber
  multiString: {
    combinedIscA: number;
    ocpdRequired: boolean;
    minRatingA: number;
    maxRatingA: number;
    fuseA: number | null;
  } | null;
}

export function calcPv(input: PvInput, premiumEnabled: boolean): PvResult | null {
  const { voc, vmpp, isc, tempCoeffVocPct: tc, ns, np } = input;
  if (!voc || !vmpp || !isc || !tc || !ns) return null;

  // --- String voltage window (IEC 62548 §7.2) ---
  const coldFactor = 1 + (tc / 100) * (input.siteTempMinC - 25);
  const hotFactor = 1 + (tc / 100) * (input.siteTempMaxC - 25);
  const vMax = voc * ns * coldFactor;
  const vMppCold = vmpp * ns * coldFactor;
  const vMppHot = vmpp * ns * hotFactor;

  const vMaxPass = input.maxDcV ? vMax <= input.maxDcV : null;
  const mpptPass = input.mpptMinV && input.mpptMaxV ? vMppHot >= input.mpptMinV && vMppCold <= input.mpptMaxV : null;

  // --- String current (IEC 62548 §7, 1.25x margin) ---
  const iscDesign = isc * 1.25;
  const iscPass = input.maxDcA ? iscDesign <= input.maxDcA : null;

  // --- DC cable ---
  const vNomString = vmpp * ns;
  const dc = sizeCableDC(iscDesign, input.dcMaterial, input.dcMethod, input.dcLengthM, input.dcAmbientC || 40, vNomString);

  // --- AC cable ---
  let acCurrent: number | null = null;
  if (input.acPowerKw && input.acVoltage) {
    acCurrent = input.phase === "3ph" ? (input.acPowerKw * 1000) / (Math.sqrt(3) * input.acVoltage) : (input.acPowerKw * 1000) / input.acVoltage;
  }
  const acDesignI = acCurrent ? acCurrent * 1.25 : 0;
  const ac = sizeCableAC(acDesignI, input.acMaterial, input.acMethod, input.acLengthM, input.acAmbientC || 30, input.acGrouping || 1, input.acVoltage, input.phase);

  // --- DC:AC ratio ---
  let dcAcRatio: PvResult["dcAcRatio"] = null;
  if (input.pmaxWp && ns && input.acPowerKw) {
    const arrayKwp = (ns * np * input.pmaxWp) / 1000;
    const ratio = arrayKwp / input.acPowerKw;
    let note = "";
    if (ratio < 0.8) note = "undersized array";
    else if (ratio > 1.3) note = "check inverter clipping";
    dcAcRatio = { ratio, arrayKwp, note };
  }

  let multiString: PvResult["multiString"] = null;
  if (premiumEnabled) {
    const npInt = Math.max(1, Math.round(np || 1));
    const combinedIscA = npInt * isc * 1.25;
    const ocpdRequired = npInt >= 3;
    const minRatingA = 1.5 * isc,
      maxRatingA = 2.4 * isc;
    const fuseA = ocpdRequired ? pickFuse(minRatingA) : null;
    multiString = { combinedIscA, ocpdRequired, minRatingA, maxRatingA, fuseA };
  }

  return { vMax, vMaxPass, vMppCold, vMppHot, mpptPass, iscDesign, iscPass, dc, ac, dcAcRatio, multiString };
}
