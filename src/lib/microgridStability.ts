// Microgrid Stability Estimator — a simplified composite screening
// heuristic (0-100 Stability Index) for islanded microgrid design,
// combining three factors commonly cited as first-order drivers of
// islanded stability: generation headroom above the load (source support
// ratio), system inertia (rotating mass or synthetic/virtual inertia from
// grid-forming inverters, normalized 0-1), and planned operating reserve
// margin. This is NOT a substitute for a real small-signal or transient
// stability study (frequency/voltage dynamics, protection coordination,
// inverter control-loop interactions) — it is a first-pass screening
// indicator only, clearly flagged as such. Designed from scratch; no
// equivalent module exists elsewhere in AJapps.

export type MicrogridStabilityClass = "UNSTABLE" | "MARGINAL" | "STABLE" | "ROBUST";

export interface MicrogridStabilityInput {
  sourceSupportCapacityKw: number | null; // total dispatchable generation capacity available on the microgrid
  loadDemandKw: number | null;
  inertiaFactor: number; // normalized 0-1: 0 = pure grid-following inverters with no synthetic inertia, 1 = strong synchronous/synthetic inertia
  reserveMarginPct: number; // planned operating reserve margin, %
}

export const DEFAULT_MICROGRID_STABILITY_INPUT: MicrogridStabilityInput = {
  sourceSupportCapacityKw: 1200,
  loadDemandKw: 800,
  inertiaFactor: 0.6,
  reserveMarginPct: 15,
};

export interface MicrogridStabilityResult {
  supportRatio: number | null;
  headroomScore: number | null;
  inertiaScore: number | null;
  marginScore: number | null;
  stabilityIndex: number | null;
  stabilityClass: MicrogridStabilityClass | null;
}

export function classifyStabilityIndex(index: number): MicrogridStabilityClass {
  if (index < 40) return "UNSTABLE";
  if (index < 60) return "MARGINAL";
  if (index < 85) return "STABLE";
  return "ROBUST";
}

export function calcMicrogridStability(input: MicrogridStabilityInput): MicrogridStabilityResult {
  const { sourceSupportCapacityKw, loadDemandKw, inertiaFactor, reserveMarginPct } = input;
  if (sourceSupportCapacityKw == null || sourceSupportCapacityKw <= 0 || loadDemandKw == null || loadDemandKw <= 0) {
    return { supportRatio: null, headroomScore: null, inertiaScore: null, marginScore: null, stabilityIndex: null, stabilityClass: null };
  }

  const supportRatio = sourceSupportCapacityKw / loadDemandKw;
  const headroomFraction = Math.max(0, supportRatio - 1);
  const headroomScore = 40 * Math.min(1, headroomFraction / 0.5);
  const inertiaScore = 30 * Math.min(1, Math.max(0, inertiaFactor));
  const marginScore = 30 * Math.min(1, Math.max(0, reserveMarginPct) / 20);

  const stabilityIndex = Math.min(100, headroomScore + inertiaScore + marginScore);

  return { supportRatio, headroomScore, inertiaScore, marginScore, stabilityIndex, stabilityClass: classifyStabilityIndex(stabilityIndex) };
}
