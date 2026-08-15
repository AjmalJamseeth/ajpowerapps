// Emergency Power (Genset+UPS) Load Sequencing — NFPA 110 Type/Class
// classification, UPS-to-genset bridge timing check, and staged load-step
// pickup planner. Ported and verified from the AJ Apps Suite's
// `EmergencyPower` module. Entirely a subscriber feature in the source app.

export type EpsStandard = "nfpa" | "general";
export type EpsPriority = "emergency" | "legal" | "optional";

const TYPES: [string, number][] = [["U", 0], ["10", 10], ["60", 60], ["120", 120], ["M", Infinity]];
const CLASSES: [string, number][] = [["0.083", 0.083], ["0.25", 0.25], ["2", 2], ["6", 6], ["48", 48], ["X", Infinity]];
export const PRIORITY_RANK: Record<EpsPriority, number> = { emergency: 0, legal: 1, optional: 2 };
export const PRIORITY_LABEL: Record<EpsPriority, string> = { emergency: "Emergency (NEC 700)", legal: "Legally-Req'd Standby (NEC 701)", optional: "Optional Standby (NEC 702)" };
const PRIORITY_MAXTIME: Record<EpsPriority, number> = { emergency: 10, legal: 60, optional: Infinity };

export interface LoadStep {
  desc: string;
  priority: EpsPriority;
  kw: number | null;
  timeS: number | null;
}

export interface EmergencyPowerInput {
  standard: EpsStandard;
  level: "1" | "2";
  maxInterruptS: number | null;
  minRuntimeH: number | null;
  atsStartDelayS: number;
  crankToRatedS: number | null;
  atsTransferTimeS: number;
  upsAutonomyS: number | null;
  genRatedKw: number | null;
  maxStepPct: number | null;
  steps: LoadStep[];
}

export const DEFAULT_EMERGENCYPOWER_INPUT: EmergencyPowerInput = {
  standard: "nfpa",
  level: "1",
  maxInterruptS: 10,
  minRuntimeH: 48,
  atsStartDelayS: 1.5,
  crankToRatedS: 10,
  atsTransferTimeS: 0.3,
  upsAutonomyS: 30,
  genRatedKw: 500,
  maxStepPct: 30,
  steps: [
    { desc: "Life-Safety Lighting", priority: "emergency", kw: 50, timeS: 5 },
    { desc: "Load 2", priority: "legal", kw: 80, timeS: 10 },
    { desc: "Load 3", priority: "optional", kw: 150, timeS: 15 },
  ],
};

export interface EmergencyPowerResult {
  type: string | null;
  class: string | null;
  gensetReadyS: number | null;
  bridgeStatus: "pass" | "marginal" | "fail" | null;
  bridgeMargin: number | null;
  typeCompare: boolean | null;
  stepLines: string[];
  warnings: string[];
}

export function calcEmergencyPower(input: EmergencyPowerInput): EmergencyPowerResult {
  const nfpa = input.standard === "nfpa";
  let type: string | null = null,
    cls: string | null = null;
  if (nfpa) {
    if (input.maxInterruptS != null) {
      const t = TYPES.find(([, sec]) => (input.maxInterruptS as number) <= sec);
      type = t ? `Type ${t[0]}${t[1] === Infinity ? " (manual, no time limit)" : ` (≤${t[1]}s)`}` : "exceeds all standard Types — verify with AHJ";
    }
    if (input.minRuntimeH != null) {
      const c = CLASSES.find(([, hr]) => (input.minRuntimeH as number) <= hr);
      cls = c ? `Class ${c[0]}${c[1] === Infinity ? " (X — as required, commonly ~96h)" : ` (≥${c[1]}h)`}` : null;
    }
  }

  const startDelay = input.atsStartDelayS || 0,
    xferT = input.atsTransferTimeS || 0;
  let gensetReadyS: number | null = null;
  if (input.crankToRatedS != null) gensetReadyS = startDelay + input.crankToRatedS + xferT;

  let bridgeStatus: EmergencyPowerResult["bridgeStatus"] = null;
  let bridgeMargin: number | null = null;
  if (gensetReadyS != null && input.upsAutonomyS != null) {
    const margin = gensetReadyS * 1.25;
    bridgeMargin = margin;
    if (input.upsAutonomyS >= margin) bridgeStatus = "pass";
    else if (input.upsAutonomyS >= gensetReadyS) bridgeStatus = "marginal";
    else bridgeStatus = "fail";
  }

  let typeCompare: boolean | null = null;
  if (nfpa && gensetReadyS != null && input.maxInterruptS != null) typeCompare = gensetReadyS <= input.maxInterruptS;

  const rows = input.steps
    .filter((r) => r.kw != null && r.kw > 0)
    .map((r) => ({ ...r, kw: r.kw as number }))
    .sort((a, b) => (a.timeS ?? 0) - (b.timeS ?? 0));

  const stepLines: string[] = [];
  const warnings: string[] = [];
  if (rows.length && input.genRatedKw != null && input.maxStepPct != null) {
    let cum = 0;
    let prevRank = -1;
    rows.forEach((r) => {
      const t = r.timeS ?? 0;
      const incrPct = (r.kw / (input.genRatedKw as number)) * 100;
      cum += r.kw;
      const cumPct = (cum / (input.genRatedKw as number)) * 100;
      let flag = "";
      if (incrPct > (input.maxStepPct as number)) {
        flag += ` ⚠ step exceeds max single-step acceptance (${incrPct.toFixed(1)}% > ${input.maxStepPct}%)`;
        warnings.push(`Step "${r.desc}": incremental load ${incrPct.toFixed(1)}% exceeds max single-step acceptance of ${input.maxStepPct}%.`);
      }
      if (cum > (input.genRatedKw as number)) {
        flag += " ⚠ cumulative load exceeds generator rating";
        warnings.push(`After "${r.desc}": cumulative load (${cum.toFixed(1)}kW) exceeds generator rated output (${input.genRatedKw}kW).`);
      }
      const rank = PRIORITY_RANK[r.priority] ?? 2;
      if (rank < prevRank) {
        flag += " ⚠ out of priority order";
        warnings.push(`"${r.desc}" (${PRIORITY_LABEL[r.priority]}) is scheduled after a lower-priority load — NFPA 110 Ch.6.3 requires higher-priority loads to connect first.`);
      }
      prevRank = Math.max(prevRank, rank);
      const ceil = PRIORITY_MAXTIME[r.priority];
      if (ceil !== Infinity && t > ceil) {
        flag += ` ⚠ exceeds ${ceil}s restoration limit for ${PRIORITY_LABEL[r.priority]}`;
        warnings.push(`"${r.desc}" connects at ${t}s, exceeding the ${ceil}s restoration ceiling for ${PRIORITY_LABEL[r.priority]}.`);
      }
      stepLines.push(`t=${t}s: +${r.kw}kW "${r.desc}" [${PRIORITY_LABEL[r.priority]}] → cumulative ${cum.toFixed(1)}kW (${cumPct.toFixed(0)}% of rating)${flag}`);
    });
  }

  return { type, class: cls, gensetReadyS, bridgeStatus, bridgeMargin, typeCompare, stepLines, warnings };
}
