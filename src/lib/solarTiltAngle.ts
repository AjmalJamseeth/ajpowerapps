// Solar Panel Tilt Angle Calculator — optimal fixed-mount PV tilt angle
// from site latitude, using the widely published rule-of-thumb
// relationships: tilt ≈ latitude for year-round/two-season optimization,
// latitude+15° biased toward winter (lower sun angle) production, and
// latitude−15° biased toward summer production. These are practical
// approximations (the true optimum depends on local weather/cloud
// patterns and requires a full solar-resource simulation), not an exact
// analytical result — flagged accordingly. Designed from scratch; no
// equivalent module exists elsewhere in AJapps.

export type TiltMode = "yearRound" | "summer" | "winter" | "twoSeason";
export type LatitudeRegime = "EQUATORIAL" | "LOW-LATITUDE" | "MID-LATITUDE" | "HIGH-LATITUDE" | "POLAR";

export interface SolarTiltAngleInput {
  latitudeDeg: number | null; // absolute value, 0-90
  mode: TiltMode;
}

export const DEFAULT_SOLAR_TILT_ANGLE_INPUT: SolarTiltAngleInput = {
  latitudeDeg: 35,
  mode: "yearRound",
};

export function classifyLatitude(latitudeDeg: number): LatitudeRegime {
  const a = Math.abs(latitudeDeg);
  if (a < 15) return "EQUATORIAL";
  if (a < 30) return "LOW-LATITUDE";
  if (a < 50) return "MID-LATITUDE";
  if (a < 66.5) return "HIGH-LATITUDE";
  return "POLAR";
}

export interface SolarTiltAngleResult {
  recommendedTiltDeg: number | null;
  latitudeRegime: LatitudeRegime | null;
}

export function calcSolarTiltAngle(input: SolarTiltAngleInput): SolarTiltAngleResult {
  const { latitudeDeg, mode } = input;
  if (latitudeDeg == null) return { recommendedTiltDeg: null, latitudeRegime: null };

  const lat = Math.abs(latitudeDeg);
  let tilt: number;
  if (mode === "winter") tilt = lat + 15;
  else if (mode === "summer") tilt = lat - 15;
  else tilt = lat; // yearRound or twoSeason

  const recommendedTiltDeg = Math.min(90, Math.max(0, tilt));
  const latitudeRegime = classifyLatitude(lat);

  return { recommendedTiltDeg, latitudeRegime };
}
