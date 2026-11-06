// Cable Pulling Tension — IEEE 1185 tension/capstan equations, sidewall
// bearing pressure & jam ratio. Ported and verified from the AJ Apps Suite's
// `CablePulling` module.
//
// Several cables pulled together press harder on the conduit wall than their
// weight alone, so straight-section friction and the bend multiplier use the
// weight correction factor wc (IEEE 1185 / standard cable-pulling practice):
//   one cable:              wc = 1
//   three in triangular:    wc = 1 / sqrt(1 - (d/(D-d))^2)
//   three cradled:          wc = 1 + (4/3)·(d/(D-d))^2
// with D = conduit inside diameter and d = one cable's outside diameter.
// Straight horizontal: T_out = T_in + wc·f·w·L, w = TOTAL weight of all
// cables per unit length. Bend: T_out = T_in·e^(wc·f·θ). Vertical sections
// add or subtract w·L (gravity, no friction factor).
// Sidewall bearing pressure on the most heavily loaded cable at a bend of
// radius R: single T/R; triangular wc·T/(2R); cradled (3wc − 2)·T/(3R).

export type PullUnits = "imperial" | "metric";
export type SegmentType = "none" | "straightH" | "straightUp" | "straightDown" | "bend";

const G = 9.81; // m/s^2, metric weight (mass) -> force conversion

export type PullConfiguration = "single" | "triangular" | "cradled";

export interface PullSegment {
  type: SegmentType;
  lengthM: number | null; // ft if imperial, m if metric
  angleDeg: number | null;
  radiusM: number | null; // ft if imperial, m if metric
}

export interface CablePullingInput {
  units: PullUnits;
  frictionCoeff: number | null;
  configuration: PullConfiguration; // one cable, or three identical cables
  cableWeight: number | null; // TOTAL of all cables pulled: lb/ft if imperial, kg/m if metric
  startTension: number; // lbf or N
  maxTension: number | null;
  maxSidewallPressure: number | null; // lb/ft or N/m
  segments: PullSegment[]; // up to 6
  jamConduitId: number | null; // in or mm
  jamCableOd: number | null; // in or mm
}

export const DEFAULT_CABLEPULLING_INPUT: CablePullingInput = {
  units: "imperial",
  frictionCoeff: 0.35,
  configuration: "cradled",
  cableWeight: 3.3,
  startTension: 0,
  maxTension: 5000,
  maxSidewallPressure: 300,
  segments: [
    { type: "straightH", lengthM: 50, angleDeg: null, radiusM: null },
    { type: "straightH", lengthM: 50, angleDeg: null, radiusM: null },
    { type: "bend", lengthM: null, angleDeg: 90, radiusM: 2 },
    { type: "none", lengthM: null, angleDeg: null, radiusM: null },
    { type: "none", lengthM: null, angleDeg: null, radiusM: null },
    { type: "none", lengthM: null, angleDeg: null, radiusM: null },
  ],
  jamConduitId: 4,
  jamCableOd: 1.45,
};

export interface PullSegLine {
  text: string;
  tension: number;
}
export interface CablePullingResult {
  lines: PullSegLine[];
  finalTension: number;
  tensionPass: boolean | null;
  maxSidewallPressure: number;
  sidewallPass: boolean | null;
  jamRatio: number | null;
  jamDanger: boolean | null;
  weightCorrection: number;
  cableCount: number;
  warnings: string[];
}

// Weight correction factor for the configuration; null when it cannot be
// evaluated (three cables with no conduit/cable diameters, or a triangular
// arrangement that cannot fit the conduit).
export function weightCorrectionFactor(config: PullConfiguration, conduitId: number | null, cableOd: number | null): number | null {
  if (config === "single") return 1;
  if (conduitId == null || cableOd == null || cableOd <= 0 || conduitId <= cableOd) return null;
  const k = cableOd / (conduitId - cableOd);
  if (config === "cradled") return 1 + (4 / 3) * k * k;
  if (k >= 1) return null;
  return 1 / Math.sqrt(1 - k * k);
}

export function calcCablePulling(input: CablePullingInput): CablePullingResult | null {
  const f = input.frictionCoeff;
  const metric = input.units === "metric";
  const wRaw = input.cableWeight;
  if (f == null || wRaw == null) return null;
  const w = metric ? wRaw * G : wRaw; // force/length
  const t0 = input.startTension || 0;
  const config = input.configuration ?? "single";
  const cableCount = config === "single" ? 1 : 3;
  const warnings: string[] = [];
  const wcCalc = weightCorrectionFactor(config, input.jamConduitId, input.jamCableOd);
  let wc = wcCalc ?? 1;
  if (wcCalc == null) {
    const D = input.jamConduitId, d = input.jamCableOd;
    if (D != null && d != null && d > 0 && D / d < 1 + 2 / Math.sqrt(3)) {
      warnings.push(`Three cables of ${d} OD cannot fit side by side in a ${D} conduit (ID/OD must exceed 2.15).`);
    } else {
      warnings.push("Enter conduit ID and cable OD to apply the weight correction factor for three cables. Without it (wc = 1) tension and sidewall pressure are underestimated.");
    }
    wc = 1;
  }
  const swFactor = (T: number, R: number) =>
    config === "single" ? T / R : config === "triangular" ? (wc * T) / (2 * R) : ((3 * wc - 2) * T) / (3 * R);

  let t = t0;
  let maxSw = 0;
  const lines: PullSegLine[] = [{ text: `Start: T = ${t0.toFixed(1)} ${metric ? "N" : "lbf"}`, tension: t0 }];
  let any = false;

  input.segments.forEach((seg, i) => {
    if (seg.type === "none") return;
    any = true;
    const idx = i + 1;
    if (seg.type === "straightH") {
      const L = seg.lengthM || 0;
      const dT = wc * f * w * L;
      t += dT;
      lines.push({ text: `Seg ${idx} (straight-H, L=${L}): +wc·f·w·L = ${dT.toFixed(1)} → T = ${t.toFixed(1)}`, tension: t });
    } else if (seg.type === "straightUp") {
      const L = seg.lengthM || 0;
      const dT = w * L;
      t += dT;
      lines.push({ text: `Seg ${idx} (vertical-up, L=${L}): +${dT.toFixed(1)} → T = ${t.toFixed(1)}`, tension: t });
    } else if (seg.type === "straightDown") {
      const L = seg.lengthM || 0;
      const dT = w * L;
      t = Math.max(0, t - dT);
      lines.push({ text: `Seg ${idx} (vertical-down, L=${L}): -${dT.toFixed(1)} → T = ${t.toFixed(1)}`, tension: t });
    } else if (seg.type === "bend") {
      const ang = seg.angleDeg || 0;
      const rad = seg.radiusM;
      const theta = (ang * Math.PI) / 180;
      t = t * Math.exp(wc * f * theta);
      let swLine = "";
      if (rad != null && rad > 0) {
        const sw = swFactor(t, rad);
        maxSw = Math.max(maxSw, sw);
        swLine = `, SWBP = ${sw.toFixed(1)} ${metric ? "N/m" : "lb/ft"}`;
      }
      lines.push({ text: `Seg ${idx} (bend, ${ang}°): T ×= e^(wc·f·θ) → T = ${t.toFixed(1)}${swLine}`, tension: t });
    }
  });

  let jamRatio: number | null = null;
  let jamDanger: boolean | null = null;
  if (input.jamConduitId != null && input.jamCableOd != null && input.jamCableOd !== 0) {
    jamRatio = input.jamConduitId / input.jamCableOd;
    // Jamming is a three-cable phenomenon; a single cable cannot jam.
    jamDanger = cableCount === 3 ? jamRatio >= 2.6 && jamRatio <= 3.2 : null;
  }
  if (cableCount === 3) {
    lines.splice(1, 0, {
      text: `Three cables ${config}, total w = ${wRaw} ${metric ? "kg/m" : "lb/ft"}, weight correction wc = ${wc.toFixed(3)}`,
      tension: t0,
    });
  }

  if (!any) {
    return { lines: [{ text: "No segments defined.", tension: t0 }], finalTension: t0, tensionPass: null, maxSidewallPressure: 0, sidewallPass: null, jamRatio, jamDanger, weightCorrection: wc, cableCount, warnings };
  }

  const tensionPass = input.maxTension != null ? t <= input.maxTension : null;
  const sidewallPass = input.maxSidewallPressure != null ? maxSw <= input.maxSidewallPressure : null;

  return { lines, finalTension: t, tensionPass, maxSidewallPressure: maxSw, sidewallPass, jamRatio, jamDanger, weightCorrection: wc, cableCount, warnings };
}
