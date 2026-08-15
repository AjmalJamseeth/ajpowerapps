// Cable Pulling Tension — IEEE 1185 tension/capstan equations, sidewall
// bearing pressure & jam ratio. Ported and verified from the AJ Apps Suite's
// `CablePulling` module. Entirely a subscriber feature in the source app.

export type PullUnits = "imperial" | "metric";
export type SegmentType = "none" | "straightH" | "straightUp" | "straightDown" | "bend";

const G = 9.81; // m/s^2, metric weight (mass) -> force conversion

export interface PullSegment {
  type: SegmentType;
  lengthM: number | null; // ft if imperial, m if metric
  angleDeg: number | null;
  radiusM: number | null; // ft if imperial, m if metric
}

export interface CablePullingInput {
  units: PullUnits;
  frictionCoeff: number | null;
  cableWeight: number | null; // lb/ft if imperial, kg/m if metric
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
}

export function calcCablePulling(input: CablePullingInput): CablePullingResult | null {
  const f = input.frictionCoeff;
  const metric = input.units === "metric";
  const wRaw = input.cableWeight;
  if (f == null || wRaw == null) return null;
  const w = metric ? wRaw * G : wRaw; // force/length
  const t0 = input.startTension || 0;

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
      const dT = f * w * L;
      t += dT;
      lines.push({ text: `Seg ${idx} (straight-H, L=${L}): +${dT.toFixed(1)} → T = ${t.toFixed(1)}`, tension: t });
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
      t = t * Math.exp(f * theta);
      let swLine = "";
      if (rad != null && rad > 0) {
        const sw = t / rad;
        maxSw = Math.max(maxSw, sw);
        swLine = `, SWBP = ${sw.toFixed(1)} ${metric ? "N/m" : "lb/ft"}`;
      }
      lines.push({ text: `Seg ${idx} (bend, ${ang}°): T ×= e^(f·θ) → T = ${t.toFixed(1)}${swLine}`, tension: t });
    }
  });

  let jamRatio: number | null = null;
  let jamDanger: boolean | null = null;
  if (input.jamConduitId != null && input.jamCableOd != null && input.jamCableOd !== 0) {
    jamRatio = input.jamConduitId / input.jamCableOd;
    jamDanger = jamRatio >= 2.6 && jamRatio <= 3.2;
  }

  if (!any) {
    return { lines: [{ text: "No segments defined.", tension: t0 }], finalTension: t0, tensionPass: null, maxSidewallPressure: 0, sidewallPass: null, jamRatio, jamDanger };
  }

  const tensionPass = input.maxTension != null ? t <= input.maxTension : null;
  const sidewallPass = input.maxSidewallPressure != null ? maxSw <= input.maxSidewallPressure : null;

  return { lines, finalTension: t, tensionPass, maxSidewallPressure: maxSw, sidewallPass, jamRatio, jamDanger };
}
