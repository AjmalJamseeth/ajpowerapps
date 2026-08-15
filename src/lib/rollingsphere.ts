// Lightning Protection — Rolling Sphere Method — protection radius of a
// single air-terminal (mast) of height h against a rolling sphere of radius
// R (IEC 62305 LPS class rolling-sphere radii, reused from lightning.ts for
// consistency: Class I=20m, II=30m, III=45m, IV=60m). Self-derived geometry
// (sphere resting on the ground, just touching the tip of the mast):
// rp = sqrt(2*R*h - h^2) for h <= R. If h > R, the mast height exceeds the
// class's rolling sphere radius and the simple single-mast formula no
// longer applies (a multi-terminal / mesh study is required) - flagged
// rather than computed. Designed from scratch; no equivalent module in the
// source app.

export type LpsClass = "I" | "II" | "III" | "IV";

// Same figures as the (unexported) LPS_DESIGN constant in lightning.ts, redefined here for consistency.
export const ROLLING_SPHERE_RADIUS_M: Record<LpsClass, number> = {
  I: 20,
  II: 30,
  III: 45,
  IV: 60,
};

export interface RollingSphereInput {
  lpsClass: LpsClass;
  mastHeightM: number | null;
}

export const DEFAULT_ROLLING_SPHERE_INPUT: RollingSphereInput = {
  lpsClass: "III",
  mastHeightM: 10,
};

export interface RollingSphereResult {
  sphereRadiusM: number;
  protectionRadiusM: number | null;
  heightExceedsSphere: boolean | null;
}

export function calcRollingSphere(input: RollingSphereInput): RollingSphereResult {
  const { lpsClass, mastHeightM } = input;
  const sphereRadiusM = ROLLING_SPHERE_RADIUS_M[lpsClass];

  if (mastHeightM == null || mastHeightM <= 0) {
    return { sphereRadiusM, protectionRadiusM: null, heightExceedsSphere: null };
  }

  if (mastHeightM > sphereRadiusM) {
    return { sphereRadiusM, protectionRadiusM: null, heightExceedsSphere: true };
  }

  const protectionRadiusM = Math.sqrt(2 * sphereRadiusM * mastHeightM - mastHeightM * mastHeightM);

  return { sphereRadiusM, protectionRadiusM, heightExceedsSphere: false };
}
