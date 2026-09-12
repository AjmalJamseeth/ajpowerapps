// Transfer Switch (ATS) Sizing — sizes an automatic/manual transfer switch
// in amperes from the connected standby load, per the general NEC feeder/
// service continuous-load practice (Article 700/701/702 equipment is fed
// like other service/feeder equipment: continuous loads sized at 125% —
// NEC 215.2(A)(1)/230.42(A)(1) — non-continuous at 100%), then rounds up
// to the next standard commercially available transfer switch ampere
// rating (the same rating steps UL 1008-listed switches are commonly
// offered in). Designed from scratch; no equivalent module exists
// elsewhere in AJapps.

export type TsLoadMethod = "amps" | "kw" | "kva";
export type TsSystemType = "emergency" | "legally-required" | "optional-standby";

// Common UL 1008 transfer switch ampere ratings.
export const STD_ATS_AMPS = [30, 40, 60, 70, 100, 150, 200, 225, 260, 300, 400, 600, 800, 1000, 1200, 1600, 2000, 3000, 4000];

function roundUpAts(val: number): number {
  const s = STD_ATS_AMPS.find((s) => s >= val);
  return s === undefined ? STD_ATS_AMPS[STD_ATS_AMPS.length - 1] : s;
}

export interface TransferSwitchInput {
  systemType: TsSystemType;
  loadMethod: TsLoadMethod;
  connectedAmps: number | null;
  connectedKw: number | null;
  connectedKva: number | null;
  voltageV: number;
  phase: 1 | 3;
  powerFactor: number;
  continuousFractionPct: number; // % of the load that runs continuously (≥3hr) — the rest is non-continuous
}

export const DEFAULT_TRANSFER_SWITCH_INPUT: TransferSwitchInput = {
  systemType: "optional-standby",
  loadMethod: "kw",
  connectedAmps: null,
  connectedKw: 250,
  connectedKva: null,
  voltageV: 480,
  phase: 3,
  powerFactor: 0.9,
  continuousFractionPct: 100,
};

export interface TransferSwitchResult {
  totalLoadAmps: number | null;
  continuousAmps: number | null;
  nonContinuousAmps: number | null;
  minSwitchAmps: number | null;
  recommendedSwitchAmps: number | null;
}

function loadToAmps(input: TransferSwitchInput): number | null {
  const { loadMethod, connectedAmps, connectedKw, connectedKva, voltageV, phase, powerFactor } = input;
  if (voltageV <= 0) return null;

  if (loadMethod === "amps") return connectedAmps != null && connectedAmps > 0 ? connectedAmps : null;

  if (loadMethod === "kva") {
    if (connectedKva == null || connectedKva <= 0) return null;
    const va = connectedKva * 1000;
    return phase === 3 ? va / (Math.sqrt(3) * voltageV) : va / voltageV;
  }

  // kw
  if (connectedKw == null || connectedKw <= 0 || powerFactor <= 0) return null;
  const kva = connectedKw / powerFactor;
  const va = kva * 1000;
  return phase === 3 ? va / (Math.sqrt(3) * voltageV) : va / voltageV;
}

export function calcTransferSwitch(input: TransferSwitchInput): TransferSwitchResult {
  const totalLoadAmps = loadToAmps(input);
  if (totalLoadAmps == null || totalLoadAmps <= 0) {
    return { totalLoadAmps: null, continuousAmps: null, nonContinuousAmps: null, minSwitchAmps: null, recommendedSwitchAmps: null };
  }

  const contFrac = Math.min(100, Math.max(0, input.continuousFractionPct)) / 100;
  const continuousAmps = totalLoadAmps * contFrac;
  const nonContinuousAmps = totalLoadAmps * (1 - contFrac);

  const minSwitchAmps = 1.25 * continuousAmps + 1.0 * nonContinuousAmps;
  const recommendedSwitchAmps = roundUpAts(minSwitchAmps);

  return { totalLoadAmps, continuousAmps, nonContinuousAmps, minSwitchAmps, recommendedSwitchAmps };
}
