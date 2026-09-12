// IDMT (Inverse Definite Minimum Time) overcurrent relay trip-time calculations
// References:
//   IEC 60255-151:2009 — Standard, Very, Extremely, Long-Time Inverse curves
//   IEEE C37.112-2018  — Moderately, Very, Extremely Inverse curves

export type CurveFamily = "IEC" | "IEEE";

export type IecCurveType =
  | "SI" // Standard Inverse
  | "VI" // Very Inverse
  | "EI" // Extremely Inverse
  | "LTI"; // Long-Time (Standard) Inverse

export type IeeeCurveType =
  | "MI" // Moderately Inverse
  | "VI" // Very Inverse
  | "EI"; // Extremely Inverse

export type CurveType = IecCurveType | IeeeCurveType;

export const IEC_CURVES: Record<
  IecCurveType,
  { label: string; k: number; alpha: number }
> = {
  SI: { label: "Standard Inverse (SI)", k: 0.14, alpha: 0.02 },
  VI: { label: "Very Inverse (VI)", k: 13.5, alpha: 1 },
  EI: { label: "Extremely Inverse (EI)", k: 80, alpha: 2 },
  LTI: { label: "Long-Time Inverse (LTI)", k: 120, alpha: 1 },
};

export const IEEE_CURVES: Record<
  IeeeCurveType,
  { label: string; A: number; B: number; p: number }
> = {
  MI: { label: "Moderately Inverse (MI)", A: 0.0515, B: 0.114, p: 0.02 },
  VI: { label: "Very Inverse (VI)", A: 19.61, B: 0.491, p: 2 },
  EI: { label: "Extremely Inverse (EI)", A: 28.2, B: 0.1217, p: 2.0 },
};

export interface RelaySettings {
  label: string;
  curveFamily: CurveFamily;
  curveType: CurveType;
  pickupCurrent: number; // Is, relay-side amps (secondary, or primary if ctRatio = 1)
  ctRatio: number; // primary:secondary ratio used to convert a primary-side fault current down to relay current. Use 1 if faultCurrent is already relay-side.
  timeDial: number; // TMS (IEC) or TD (IEEE)
}

export const DEFAULT_RELAY = (label: string): RelaySettings => ({
  label,
  curveFamily: "IEC",
  curveType: "SI",
  pickupCurrent: 100,
  ctRatio: 1,
  timeDial: 0.1,
});

/**
 * Trip time in seconds for a relay at a given primary-side fault current.
 * Returns Infinity if the fault current does not exceed the pickup setting (relay does not operate).
 */
export function tripTime(relay: RelaySettings, faultCurrentPrimary: number): number {
  const ctRatio = relay.ctRatio > 0 ? relay.ctRatio : 1;
  const relayCurrent = faultCurrentPrimary / ctRatio;
  const ratio = relayCurrent / relay.pickupCurrent;

  if (!isFinite(ratio) || ratio <= 1.0001) return Infinity;

  if (relay.curveFamily === "IEC") {
    const c = IEC_CURVES[relay.curveType as IecCurveType];
    if (!c) return Infinity;
    return relay.timeDial * (c.k / (Math.pow(ratio, c.alpha) - 1));
  } else {
    const c = IEEE_CURVES[relay.curveType as IeeeCurveType];
    if (!c) return Infinity;
    return relay.timeDial * (c.A / (Math.pow(ratio, c.p) - 1) + c.B);
  }
}

export function curveOptions(family: CurveFamily) {
  return family === "IEC"
    ? (Object.entries(IEC_CURVES) as [IecCurveType, { label: string }][]).map(
        ([value, c]) => ({ value, label: c.label })
      )
    : (Object.entries(IEEE_CURVES) as [IeeeCurveType, { label: string }][]).map(
        ([value, c]) => ({ value, label: c.label })
      );
}

export interface CoordinationPoint {
  faultCurrent: number;
  tDownstream: number; // Relay 1
  tUpstream: number; // Relay 2
  margin: number; // tUpstream - tDownstream
  pass: boolean;
}

export interface CoordinationResult {
  points: CoordinationPoint[];
  minMargin: number | null;
  minMarginAt: number | null;
  overallPass: boolean;
  anyEvaluated: boolean;
}

/**
 * Checks grading margin between two relays (Relay 1 = downstream/primary,
 * Relay 2 = upstream/backup) across a log-spaced sweep of fault currents,
 * not just a single point.
 */
export function checkCoordination(
  relay1: RelaySettings,
  relay2: RelaySettings,
  opts: { minCurrent: number; maxCurrent: number; steps?: number; requiredMargin: number }
): CoordinationResult {
  const steps = opts.steps ?? 40;
  const points: CoordinationPoint[] = [];
  const logMin = Math.log10(Math.max(opts.minCurrent, 1));
  const logMax = Math.log10(Math.max(opts.maxCurrent, opts.minCurrent + 1));

  for (let i = 0; i <= steps; i++) {
    const logI = logMin + ((logMax - logMin) * i) / steps;
    const I = Math.pow(10, logI);
    const t1 = tripTime(relay1, I);
    const t2 = tripTime(relay2, I);
    if (!isFinite(t1) || !isFinite(t2)) continue;
    const margin = t2 - t1;
    points.push({
      faultCurrent: I,
      tDownstream: t1,
      tUpstream: t2,
      margin,
      pass: margin >= opts.requiredMargin,
    });
  }

  if (points.length === 0) {
    return { points, minMargin: null, minMarginAt: null, overallPass: false, anyEvaluated: false };
  }

  let minPoint = points[0];
  for (const p of points) if (p.margin < minPoint.margin) minPoint = p;

  return {
    points,
    minMargin: minPoint.margin,
    minMarginAt: minPoint.faultCurrent,
    overallPass: minPoint.margin >= opts.requiredMargin,
    anyEvaluated: true,
  };
}

export interface ChainStepResult {
  label: string; // "Relay 1 -> Relay 2"
  downstreamLabel: string;
  upstreamLabel: string;
  minMargin: number | null;
  minMarginAt: number | null;
  pass: boolean | null;
  anyEvaluated: boolean;
}

export interface ChainCoordinationResult {
  steps: ChainStepResult[];
  allPass: boolean | null;
}

/**
 * Generalizes checkCoordination() from a single relay pair to a full radial
 * chain of N relays (ordered downstream/load-end -> upstream/source): every
 * successive adjacent pair is swept across the full fault-current range
 * (reusing checkCoordination for each step), so the chain check is the
 * full-range equivalent of a multi-relay grading study, not just a
 * single-point check. A 2-relay chain reduces to exactly one step, i.e. the
 * same result as calling checkCoordination() directly.
 */
export function checkChainCoordination(
  relays: RelaySettings[],
  opts: { minCurrent: number; maxCurrent: number; steps?: number; requiredMargin: number }
): ChainCoordinationResult {
  const steps: ChainStepResult[] = [];

  for (let i = 0; i < relays.length - 1; i++) {
    const downstream = relays[i];
    const upstream = relays[i + 1];
    const c = checkCoordination(downstream, upstream, opts);
    steps.push({
      label: `${downstream.label} → ${upstream.label}`,
      downstreamLabel: downstream.label,
      upstreamLabel: upstream.label,
      minMargin: c.minMargin,
      minMarginAt: c.minMarginAt,
      pass: c.anyEvaluated ? c.overallPass : null,
      anyEvaluated: c.anyEvaluated,
    });
  }

  const evaluated = steps.filter((s) => s.anyEvaluated);
  const allPass = evaluated.length > 0 ? evaluated.every((s) => s.pass !== false) : null;

  return { steps, allPass };
}

/** Generates log-spaced sample points of a single relay's TCC curve for plotting. */
export function curvePoints(
  relay: RelaySettings,
  minCurrent: number,
  maxCurrent: number,
  steps = 60
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const logMin = Math.log10(Math.max(minCurrent, 1));
  const logMax = Math.log10(Math.max(maxCurrent, minCurrent + 1));
  for (let i = 0; i <= steps; i++) {
    const logI = logMin + ((logMax - logMin) * i) / steps;
    const I = Math.pow(10, logI);
    const t = tripTime(relay, I);
    if (isFinite(t) && t > 0) pts.push({ x: I, y: t });
  }
  return pts;
}
