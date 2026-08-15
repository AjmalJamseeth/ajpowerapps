// Residential/Commercial DB Panel Phase Balancer — per-phase load balance
// check for a 3-phase panel and the resulting neutral current using the
// standard three-phase unbalanced-current phasor formula (120 degrees
// apart): In = sqrt(IL1^2 + IL2^2 + IL3^2 - IL1*IL2 - IL2*IL3 - IL1*IL3).
// Designed from scratch; no equivalent module in the source app.

export interface PanelBalanceInput {
  il1: number | null;
  il2: number | null;
  il3: number | null;
}

export const DEFAULT_PANEL_BALANCE_INPUT: PanelBalanceInput = {
  il1: 45,
  il2: 38,
  il3: 52,
};

export interface PanelBalanceResult {
  average: number | null;
  maxDeviationPct: number | null;
  neutralCurrentA: number | null;
  mostLoadedPhase: "L1" | "L2" | "L3" | null;
  leastLoadedPhase: "L1" | "L2" | "L3" | null;
}

export function calcPanelBalance(input: PanelBalanceInput): PanelBalanceResult {
  const { il1, il2, il3 } = input;

  if (il1 == null || il2 == null || il3 == null) {
    return { average: null, maxDeviationPct: null, neutralCurrentA: null, mostLoadedPhase: null, leastLoadedPhase: null };
  }

  const average = (il1 + il2 + il3) / 3;
  const phases: { name: "L1" | "L2" | "L3"; value: number }[] = [
    { name: "L1", value: il1 },
    { name: "L2", value: il2 },
    { name: "L3", value: il3 },
  ];
  const mostLoadedPhase = phases.reduce((a, b) => (b.value > a.value ? b : a)).name;
  const leastLoadedPhase = phases.reduce((a, b) => (b.value < a.value ? b : a)).name;
  const maxDeviation = Math.max(...phases.map((p) => Math.abs(p.value - average)));
  const maxDeviationPct = average > 0 ? (maxDeviation / average) * 100 : 0;

  const neutralCurrentA = Math.sqrt(
    il1 * il1 + il2 * il2 + il3 * il3 - il1 * il2 - il2 * il3 - il1 * il3
  );

  return { average, maxDeviationPct, neutralCurrentA, mostLoadedPhase, leastLoadedPhase };
}
