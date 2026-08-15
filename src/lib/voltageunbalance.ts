// Phase Voltage Unbalance & Motor Derating — NEMA-style percentage voltage
// unbalance (max deviation from average / average x 100) and the associated
// recommended motor derating factor, linearly interpolated between the
// published NEMA MG1 / ANSI C84.1 Figure D1 curve points (verified via web
// search before coding): 1%->0.98pu, 2%->0.95pu, 3%->0.88pu, 4%->0.82pu,
// 5%->0.75pu. Motors should not be operated above 5% unbalance without
// manufacturer consultation - flagged rather than extrapolated. Designed
// from scratch; no equivalent module in the source app.

export interface VoltageUnbalanceInput {
  vab: number | null;
  vbc: number | null;
  vca: number | null;
}

export const DEFAULT_VOLTAGE_UNBALANCE_INPUT: VoltageUnbalanceInput = {
  vab: 415,
  vbc: 408,
  vca: 420,
};

export interface VoltageUnbalanceResult {
  average: number | null;
  maxDeviation: number | null;
  unbalancePct: number | null;
  deratingFactor: number | null; // per-unit of nameplate rating
  exceedsRecommendedLimit: boolean | null; // > 5%
}

// Published NEMA MG1 / ANSI C84.1 Figure D1 points
const CURVE: [number, number][] = [
  [0, 1.0],
  [1, 0.98],
  [2, 0.95],
  [3, 0.88],
  [4, 0.82],
  [5, 0.75],
];

function interpolateDerating(unbalancePct: number): number | null {
  if (unbalancePct > 5) return null; // beyond the published curve
  for (let i = 0; i < CURVE.length - 1; i++) {
    const [x0, y0] = CURVE[i];
    const [x1, y1] = CURVE[i + 1];
    if (unbalancePct >= x0 && unbalancePct <= x1) {
      const t = (unbalancePct - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return CURVE[CURVE.length - 1][1];
}

export function calcVoltageUnbalance(input: VoltageUnbalanceInput): VoltageUnbalanceResult {
  const { vab, vbc, vca } = input;

  if (vab == null || vbc == null || vca == null) {
    return { average: null, maxDeviation: null, unbalancePct: null, deratingFactor: null, exceedsRecommendedLimit: null };
  }

  const average = (vab + vbc + vca) / 3;
  const maxDeviation = Math.max(Math.abs(vab - average), Math.abs(vbc - average), Math.abs(vca - average));
  const unbalancePct = (maxDeviation / average) * 100;
  const exceedsRecommendedLimit = unbalancePct > 5;
  const deratingFactor = exceedsRecommendedLimit ? null : interpolateDerating(unbalancePct);

  return { average, maxDeviation, unbalancePct, deratingFactor, exceedsRecommendedLimit };
}
