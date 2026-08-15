// Panel / MCC Enclosure Heat Dissipation & Ventilation — checks whether an
// enclosure's natural-convection dissipating surface is enough to hold
// internal temperature rise within limits for the installed component heat
// losses, and if not, sizes the forced-air fan flow needed. Basis: the
// widely-published (IEC 60890-derived) enclosure heat-rise method used by
// enclosure/cooling manufacturers (e.g. nVent Hoffman, Rittal, Pfannenberg
// application notes): natural-convection coefficient k≈5.5 W/(m²·K) for
// bare/unpainted steel (up to ~6-7 for painted), and forced-air sizing
// V(m³/h) = 3.1 x Ploss(W) / deltaT(K). Designed from scratch; no
// equivalent module in the source app.

export type MountingType = "free-standing" | "wall-mount";

export interface EnclosureCoolingInput {
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  mounting: MountingType;
  internalLossesW: number | null; // sum of all installed component power losses
  ambientTempC: number;
  maxInternalTempC: number;
  convectionCoefficient: number; // W/(m^2*K) — ~5.5 bare steel, ~6-7 painted
}

export const DEFAULT_ENCLOSURE_COOLING_INPUT: EnclosureCoolingInput = {
  heightMm: 2000,
  widthMm: 800,
  depthMm: 600,
  mounting: "free-standing",
  internalLossesW: 600,
  ambientTempC: 35,
  maxInternalTempC: 45,
  convectionCoefficient: 5.5,
};

export interface EnclosureCoolingResult {
  effectiveAreaM2: number | null;
  allowableDeltaT: number | null;
  naturalConvectionCapacityW: number | null; // heat the enclosure can shed by natural convection at the allowable deltaT
  naturalConvectionAdequate: boolean | null;
  requiredFanAirflowM3h: number | null; // only meaningful if natural convection is inadequate
}

function effectiveSurfaceAreaM2(heightM: number, widthM: number, depthM: number, mounting: MountingType): number {
  // Standard simplified enclosure heat-dissipation area convention: count
  // the top, front/back, and both sides; a free-standing enclosure also
  // counts the "back" face (vs. a wall-mounted one, whose rear face is
  // against the wall and doesn't dissipate).
  const top = widthM * depthM;
  const sides = 2 * (heightM * depthM);
  const front = heightM * widthM;
  const back = mounting === "free-standing" ? heightM * widthM : 0;
  return top + sides + front + back;
}

export function calcEnclosureCooling(input: EnclosureCoolingInput): EnclosureCoolingResult {
  const { heightMm, widthMm, depthMm, mounting, internalLossesW, ambientTempC, maxInternalTempC, convectionCoefficient } = input;

  if (heightMm == null || widthMm == null || depthMm == null || internalLossesW == null || convectionCoefficient <= 0) {
    return {
      effectiveAreaM2: null,
      allowableDeltaT: null,
      naturalConvectionCapacityW: null,
      naturalConvectionAdequate: null,
      requiredFanAirflowM3h: null,
    };
  }

  const effectiveAreaM2 = effectiveSurfaceAreaM2(heightMm / 1000, widthMm / 1000, depthMm / 1000, mounting);
  const allowableDeltaT = maxInternalTempC - ambientTempC;
  const naturalConvectionCapacityW = convectionCoefficient * effectiveAreaM2 * Math.max(allowableDeltaT, 0);
  const naturalConvectionAdequate = allowableDeltaT > 0 ? naturalConvectionCapacityW >= internalLossesW : false;

  let requiredFanAirflowM3h: number | null = null;
  if (!naturalConvectionAdequate && allowableDeltaT > 0) {
    requiredFanAirflowM3h = (3.1 * internalLossesW) / allowableDeltaT;
  }

  return { effectiveAreaM2, allowableDeltaT, naturalConvectionCapacityW, naturalConvectionAdequate, requiredFanAirflowM3h };
}
