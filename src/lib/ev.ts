// EV Charging — IEC 61851-1 (EV conductive charging system), IEC 60364-7-722
// (electrical installations — supplies for electric vehicles), and IEC 62955
// (residual direct current detecting devices, RDC-DD). Ported and verified
// from the AJ Apps Suite's `EV` module.

import {
  ConductorMaterial,
  InsulationType,
  InstallMethod,
  CABLE_SIZES,
  lookupAmpacity,
  deratingCa,
  deratingCg,
  voltDropPct,
} from "./cable";

export type EvMode = "mode1" | "mode2" | "mode3" | "mode4";
export type EvPhase = "1ph" | "3ph";
export type EvEarthing = "tns" | "tncs" | "tt" | "it";
export type EvRcdChoice = "typeb" | "typea_rdcdd";

export interface EvInput {
  // Free — charge point
  mode: EvMode;
  phase: EvPhase;
  voltage: number;
  ratedCurrentA: number; // EVSE rated current
  pf: number;

  // Free — cable & installation
  material: ConductorMaterial;
  insulation: InsulationType;
  method: InstallMethod;
  routeLengthM: number;
  ambientC: number;
  grouping: number;

  // Free — protection & earthing
  earthing: EvEarthing;
  rcdChoice: EvRcdChoice;

  // Subscriber — multi charge point site
  numPoints: number;
  perPointCurrentA: number; // 0 = defaults to ratedCurrentA
  hasLms: boolean;
  diversityFactor: number;
  siteFeederLengthM: number;
}

export const DEFAULT_EV_INPUT: EvInput = {
  mode: "mode3",
  phase: "3ph",
  voltage: 400,
  ratedCurrentA: 32,
  pf: 1.0,
  material: "Cu",
  insulation: "XLPE90",
  method: "C",
  routeLengthM: 25,
  ambientC: 30,
  grouping: 1,
  earthing: "tns",
  rcdChoice: "typea_rdcdd",
  numPoints: 10,
  perPointCurrentA: 0,
  hasLms: false,
  diversityFactor: 0.6,
  siteFeederLengthM: 40,
};

export const EV_BREAKERS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200];

interface CableSizeResult {
  size: number | null;
  amp: number | null;
  vd: number | null;
}

function sizeCable(
  ib: number,
  material: ConductorMaterial,
  insulation: InsulationType,
  method: InstallMethod,
  length: number,
  ambient: number,
  grouping: number,
  volt: number,
  phase: EvPhase,
  pf: number,
): CableSizeResult {
  if (!ib || !length) return { size: null, amp: null, vd: null };
  const buried = method === "D1";
  const ca = deratingCa(ambient, insulation, buried);
  const cg = deratingCg(grouping);
  const cf = ca * cg;
  for (let i = 0; i < CABLE_SIZES.length; i++) {
    const sz = CABLE_SIZES[i];
    const base = lookupAmpacity(material, insulation, method, i);
    if (!base) continue;
    const derated = base * cf;
    if (derated >= ib) {
      const vdResult = voltDropPct(material, sz, ib, length, volt, phase, pf);
      if (vdResult && vdResult.vd_pct <= 5) {
        return { size: sz, amp: derated, vd: vdResult.vd_pct };
      }
    }
  }
  return { size: null, amp: null, vd: null };
}

function pickBreaker(ib: number): number | null {
  if (!ib) return null;
  for (const b of EV_BREAKERS) if (b >= ib) return b;
  return null;
}

export function getModeNote(mode: EvMode): string {
  if (mode === "mode4") {
    return "DC fast charging (Mode 4) sites are typically fed as a dedicated supply sized like any other large three-phase load — use the Cable Sizing or Maximum Demand calculators directly for the supply-side design; this module is scoped to AC Mode 1–3 charge points.";
  }
  if (mode === "mode1") {
    return "Mode 1 (basic, no communication) is prohibited or restricted in many jurisdictions — check local regulations before relying on it.";
  }
  return "";
}

export function getEarthingWarning(earthing: EvEarthing): string | null {
  if (earthing === "tncs") {
    return "⚠ TN-C-S (PME): per IEC 60364-7-722, the final circuit to a charge point must not include a PEN conductor — convert this circuit to TN-S, and fit an open-PEN detection device or a local earth electrode (TT-style) regardless of which RCD type is used.";
  }
  return null;
}

export function getRcdNote(rcdChoice: EvRcdChoice): string {
  return rcdChoice === "typeb"
    ? "Type B RCD — detects AC, pulsed DC, and smooth DC residual current in one device. Type AC/A alone must not be used for EV charging."
    : "Type A (or F) RCD + RDC-DD per IEC 62955 — the RDC-DD trips on ≥6mA smooth DC before it can blind the upstream Type A RCD; together this is treated as equivalent protection to a Type B RCD.";
}

export interface EvResult {
  designCurrentA: number;
  cable: CableSizeResult;
  breakerA: number | null;
  modeNote: string;
  earthingWarning: string | null;
  rcdNote: string;

  // subscriber
  multiSite: {
    rawA: number;
    diversifiedA: number;
    feeder: CableSizeResult;
    note: string;
  } | null;
}

export function calcEv(input: EvInput, premiumEnabled: boolean): EvResult {
  const ib = input.ratedCurrentA;
  const pf = input.pf || 1.0;
  const cable = sizeCable(ib, input.material, input.insulation, input.method, input.routeLengthM, input.ambientC || 30, input.grouping || 1, input.voltage, input.phase, pf);
  const breakerA = pickBreaker(ib);

  let multiSite: EvResult["multiSite"] = null;
  if (premiumEnabled) {
    const n = Math.max(0, Math.round(input.numPoints || 0));
    const perPoint = input.perPointCurrentA || input.ratedCurrentA || 0;
    const diversity = input.hasLms ? input.diversityFactor || 1 : 1;
    const rawA = n * perPoint;
    const diversifiedA = rawA * diversity;
    const note = input.hasLms
      ? "Load Management System declared — IEC 60364-7-722 does not specify an exact diversity value with an LMS in place; use your LMS/DSO-approved figure and verify it independently."
      : "No Load Management System — IEC 60364-7-722.311 requires a diversity factor of 1 (no reduction): design as if every charge point could run at full rated current simultaneously.";
    const feeder = sizeCable(diversifiedA, input.material, input.insulation, input.method, input.siteFeederLengthM, input.ambientC || 30, input.grouping || 1, input.voltage, "3ph", 1.0);
    multiSite = { rawA, diversifiedA, feeder, note };
  }

  return {
    designCurrentA: ib,
    cable,
    breakerA,
    modeNote: getModeNote(input.mode),
    earthingWarning: getEarthingWarning(input.earthing),
    rcdNote: getRcdNote(input.rcdChoice),
    multiSite,
  };
}
