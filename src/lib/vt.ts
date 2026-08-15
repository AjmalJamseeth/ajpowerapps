// Voltage Transformer (VT) Sizing — built from scratch for AJapps.
// There is no equivalent module in the source AJ Apps Suite; this follows
// IEC 61869-3 (inductive voltage transformers) principles, cross-referenced
// against the withdrawn-but-still-cited IEC 60044-2 and common IEEE C57.13
// practice for burden conventions. See README "Verification notes" for the
// specific figures used and their sourcing.

export interface VtBurdenItem {
  label: string;
  va: number;
}

export type VtConnection = "phase-phase" | "phase-earth";
export type VtEarthing =
  | "directEarthed"
  | "resistanceAutoClear"
  | "noAutoClear"
  | "petersenNoAutoClear";

export interface VtInput {
  // Free
  connection: VtConnection;
  earthing: VtEarthing; // only used when connection === "phase-earth"
  primaryLineKv: number; // nominal system line-to-line voltage, kV
  secondaryV: 100 | 110; // standard rated secondary voltage (line value convention)
  burdenItems: VtBurdenItem[];
  ratedOutputVa: number; // 0 = auto-pick smallest standard size
  leadL: number; // one-way lead length, m
  leadA: number; // lead CSA, mm^2
  leadReturnFactor: 1 | 2;
  accuracyClass: "0.1" | "0.2" | "0.5" | "1" | "3";

  // Subscriber
  protectionClass: "" | "3P" | "6P";
  thermalLimitVa: number; // rated thermal limiting output, VA (0 = not specified)
  openDeltaEnabled: boolean;
}

export const DEFAULT_VT_INPUT: VtInput = {
  connection: "phase-earth",
  earthing: "directEarthed",
  primaryLineKv: 11,
  secondaryV: 110,
  burdenItems: [
    { label: "Protection Relay", va: 5 },
    { label: "Multifunction Meter", va: 3 },
  ],
  ratedOutputVa: 0,
  leadL: 30,
  leadA: 2.5,
  leadReturnFactor: 2,
  accuracyClass: "0.5",
  protectionClass: "3P",
  thermalLimitVa: 0,
  openDeltaEnabled: false,
};

const RHO_CU = 0.0175; // ohm.mm^2/m
const SQRT3 = Math.sqrt(3);

export const VT_STANDARD_VA = [10, 15, 25, 30, 50, 75, 100, 150, 200, 300, 400, 500];

// IEC 61869-3 Table of standard rated voltage factors. Simplified to the
// most common cases; always confirm against project earthing philosophy
// and the manufacturer's rating plate.
export function getVoltageFactor(connection: VtConnection, earthing: VtEarthing) {
  if (connection === "phase-phase") {
    return { vf: 1.2, timeLabel: "Continuous", basis: "Phase-to-phase connection, any system earthing" };
  }
  switch (earthing) {
    case "directEarthed":
      return { vf: 1.2, timeLabel: "Continuous", basis: "Phase-to-earth, effectively (solidly) earthed neutral system" };
    case "resistanceAutoClear":
      return { vf: 1.5, timeLabel: "30 s", basis: "Phase-to-earth, non-effectively earthed neutral, with automatic earth-fault clearance" };
    case "noAutoClear":
      return { vf: 1.9, timeLabel: "8 h", basis: "Phase-to-earth, earthed (resistance/isolated) neutral, without automatic earth-fault clearance" };
    case "petersenNoAutoClear":
      return { vf: 1.9, timeLabel: "8 h", basis: "Phase-to-earth, resonant (Petersen coil) earthed neutral, without automatic earth-fault clearance" };
  }
}

export const VT_METER_LIMITS: Record<string, { ratioErrPct: number; phaseMin: number | null }> = {
  "0.1": { ratioErrPct: 0.1, phaseMin: 5 },
  "0.2": { ratioErrPct: 0.2, phaseMin: 10 },
  "0.5": { ratioErrPct: 0.5, phaseMin: 20 },
  "1": { ratioErrPct: 1.0, phaseMin: 40 },
  "3": { ratioErrPct: 3.0, phaseMin: null },
};

export const VT_PROTECTION_LIMITS: Record<"3P" | "6P", { ratioErrPct: number; phaseMin: number }> = {
  "3P": { ratioErrPct: 3, phaseMin: 120 },
  "6P": { ratioErrPct: 6, phaseMin: 240 },
};

function pickStandardVa(burden: number): number {
  const fit = VT_STANDARD_VA.find((v) => v >= burden);
  return fit ?? VT_STANDARD_VA[VT_STANDARD_VA.length - 1];
}

export interface VtResult {
  vf: number;
  vfTimeLabel: string;
  vfBasis: string;
  upKv: number; // rated primary voltage as seen by this VT (kV)
  usV: number; // rated secondary voltage as seen by this VT (V)
  n: number; // turns ratio Up/Us
  burdenVaTotal: number;
  recommendedVa: number;
  selectedVa: number;
  loadPct: number;
  accuracyMaintained: boolean;
  rlead: number;
  ileadA: number;
  vdropV: number;
  vdropPct: number;

  // subscriber
  meterLimits: { ratioErrPct: number; phaseMin: number | null } | null;
  protectionTable: { point: string; ratioErrPct: number; phaseMin: number }[] | null;
  thermal: { thermPass: boolean; marginVa: number } | null;
  openDelta: { vsPhaseEarth: number; residualFaultV: number } | null;
}

export function calcVt(input: VtInput, premiumEnabled: boolean): VtResult | null {
  const { connection, earthing, primaryLineKv, secondaryV, burdenItems } = input;
  if (!primaryLineKv || !secondaryV) return null;

  const { vf, timeLabel: vfTimeLabel, basis: vfBasis } = getVoltageFactor(connection, earthing);

  const upKv = connection === "phase-phase" ? primaryLineKv : primaryLineKv / SQRT3;
  const usV = connection === "phase-phase" ? secondaryV : secondaryV / SQRT3;
  const n = (upKv * 1000) / usV;

  const burdenVaTotal = burdenItems.reduce((s, it) => s + (it.va || 0), 0);
  const recommendedVa = pickStandardVa(burdenVaTotal || 0.001);
  const selectedVa = input.ratedOutputVa > 0 ? input.ratedOutputVa : recommendedVa;
  const loadPct = selectedVa > 0 ? (burdenVaTotal / selectedVa) * 100 : 0;
  const accuracyMaintained = burdenVaTotal > 0 && loadPct >= 25 && loadPct <= 100;

  const rlead = (RHO_CU * input.leadReturnFactor * input.leadL) / (input.leadA || 1);
  const ileadA = usV > 0 ? burdenVaTotal / usV : 0;
  const vdropV = ileadA * rlead;
  const vdropPct = usV > 0 ? (vdropV / usV) * 100 : 0;

  let meterLimits: VtResult["meterLimits"] = null;
  let protectionTable: VtResult["protectionTable"] = null;
  let thermal: VtResult["thermal"] = null;
  let openDelta: VtResult["openDelta"] = null;

  if (premiumEnabled) {
    meterLimits = VT_METER_LIMITS[input.accuracyClass] || null;

    if (input.protectionClass) {
      const lim = VT_PROTECTION_LIMITS[input.protectionClass];
      protectionTable = [
        { point: "5% of rated primary voltage", ratioErrPct: lim.ratioErrPct, phaseMin: lim.phaseMin },
        { point: `Rated voltage × Vf (${vf}×Un, ${vfTimeLabel})`, ratioErrPct: lim.ratioErrPct, phaseMin: lim.phaseMin },
      ];
    }

    if (input.thermalLimitVa > 0) {
      thermal = {
        thermPass: burdenVaTotal <= input.thermalLimitVa,
        marginVa: input.thermalLimitVa - burdenVaTotal,
      };
    }

    if (input.openDeltaEnabled) {
      const vsPhaseEarth = secondaryV / SQRT3;
      openDelta = {
        vsPhaseEarth,
        residualFaultV: 3 * vsPhaseEarth,
      };
    }
  }

  return {
    vf,
    vfTimeLabel,
    vfBasis,
    upKv,
    usV,
    n,
    burdenVaTotal,
    recommendedVa,
    selectedVa,
    loadPct,
    accuracyMaintained,
    rlead,
    ileadA,
    vdropV,
    vdropPct,
    meterLimits,
    protectionTable,
    thermal,
    openDelta,
  };
}
