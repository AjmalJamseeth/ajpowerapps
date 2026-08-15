// MV Cable Sizing — IEC 60287-1-1 (current rating equations), IEC 60287-2-1
// (thermal resistance), IEC 60287-3-1 (sections on operating conditions).
// First-principles thermal-circuit current rating for single-core MV/HV
// cables. Ported and verified from the AJ Apps Suite's `MVCable` module,
// which cross-checks against CIGRE Technical Brochure 880.
//
// v1 scope (matches the source app): single-core, unarmoured, XLPE-insulated
// cable, buried (duct or direct). Free-air installation and armoured cables
// (with their circulating/eddy current losses) are not yet supported.
//
// No subscriber gating — this calculator is fully free in the source app
// ("v1: fully available, no PRO gate yet") and mirrored the same way here.

export type MvConductorMaterial = "Cu" | "Al";
export type MvBonding = "solid" | "single";
export type MvInstallMethod = "duct" | "direct";

export interface MvCableInput {
  voltageKv: number; // system voltage U, kV
  freqHz: number;
  maxCondTempC: number;

  condMaterial: MvConductorMaterial;
  condDiaMm: number;
  condR0OhmKm: number; // DC resistance at 20°C, Ω/km

  condScreenTMm: number;
  insulTMm: number;
  insulScreenTMm: number;
  sheathMaterial: MvConductorMaterial;
  sheathTMm: number;
  oversheathTMm: number;

  bonding: MvBonding;

  installMethod: MvInstallMethod;
  burialDepthMm: number;
  soilRhoKmW: number;
  ambientTempC: number;
}

// CIGRE TB880 Case #0-1: 132kV single-core XLPE, Al sheath, unarmoured,
// buried in duct — used both as the default example and as the
// verification reference (see README "Verification notes").
export const DEFAULT_MVCABLE_INPUT: MvCableInput = {
  voltageKv: 132,
  freqHz: 50,
  maxCondTempC: 90,
  condMaterial: "Cu",
  condDiaMm: 30.3,
  condR0OhmKm: 0.0283,
  condScreenTMm: 1.5,
  insulTMm: 15.5,
  insulScreenTMm: 1.3,
  sheathMaterial: "Al",
  sheathTMm: 0.8,
  oversheathTMm: 3.5,
  bonding: "solid",
  installMethod: "duct",
  burialDepthMm: 1000,
  soilRhoKmW: 1.0,
  ambientTempC: 20,
};

const MAT: Record<MvConductorMaterial, { rho20: number; alpha20: number }> = {
  Cu: { rho20: 1.7241e-8, alpha20: 3.93e-3 },
  Al: { rho20: 2.84e-8, alpha20: 4.03e-3 },
};
const RHO_I = 3.5, // insulation (XLPE) thermal resistivity, K.m/W
  RHO_SC = 2.5, // conductor/insulation screen (semi-con), K.m/W
  EPSILON = 2.5, // XLPE relative permittivity
  TAN_DELTA = 0.001; // XLPE loss angle
const RHO_TOS = 3.5; // oversheath (PVC/PE) thermal resistivity, K.m/W
const K_S = 1,
  K_P = 1; // skin/proximity effect constants — round stranded conductor, extruded insulation

function buildGeometry(condDia: number, condScreenT: number, insulT: number, insulScreenT: number, sheathT: number, oversheathT: number) {
  const thk = [0, condScreenT, insulT, insulScreenT, sheathT, oversheathT];
  const dia = [condDia, 0, 0, 0, 0, 0];
  for (let i = 1; i < dia.length; i++) dia[i] = dia[i - 1] + 2 * thk[i];
  return { thk, dia };
}

export interface MvCableResult {
  ratingA: number;
  thetaCondC: number;
  thetaSheathC: number;
  iterations: number;
  t1: number; // conductor -> sheath thermal resistance, K.m/W
  t3: number; // sheath -> armour/serving thermal resistance, K.m/W
  t4: number; // cable surface -> ambient thermal resistance, K.m/W
  lambda1: number; // sheath loss factor
  dielectricLossWPerM: number;
  capacitanceFPerM: number;
}

export function calcMvCable(input: MvCableInput): MvCableResult | null {
  const { voltageKv: U, condMaterial, sheathMaterial, condDiaMm: condDia, condR0OhmKm: R0kmOhm } = input;
  const f = input.freqHz || 50;
  const condMat = MAT[condMaterial],
    sheathMat = MAT[sheathMaterial];
  const condScreenT = input.condScreenTMm || 0,
    insulT = input.insulTMm,
    insulScreenT = input.insulScreenTMm || 0;
  const sheathT = input.sheathTMm,
    oversheathT = input.oversheathTMm || 0;
  const thetaA = input.ambientTempC;
  const thetaCMax = input.maxCondTempC || 90;

  if (!U || !condDia || !R0kmOhm || !insulT || !sheathT || thetaA === undefined || thetaA === null || !condMat || !sheathMat) {
    return null;
  }

  const { thk, dia } = buildGeometry(condDia, condScreenT, insulT, insulScreenT, sheathT, oversheathT);

  // Capacitance (IEC 60287-1-1 §4.4.1 style)
  const dC = dia[1],
    dI = dia[2];
  const C = (EPSILON / (18 * Math.log(dI / dC))) * 1e-9; // F/m

  // Reactance
  const omega = 2 * Math.PI * f;
  const s = dia[5]; // touching trefoil axis spacing = overall cable diameter
  const dMean = dI + 2 * thk[3] + thk[4]; // mean sheath diameter
  const X = 2 * omega * 1e-7 * Math.log((2 * s) / dMean);

  // Sheath resistance at 20C
  const aS = Math.PI * dMean * sheathT; // mm^2
  const rS0 = sheathMat.rho20 / (aS * 1e-6);

  // T1 — conductor to sheath
  const t1Thk = [thk[1], thk[2], thk[3]];
  const dArr = [dia[0], dia[1], dia[2]];
  const rhoT = [RHO_SC, RHO_I, RHO_SC];
  let T1 = 0;
  for (let i = 0; i < rhoT.length; i++) T1 += (rhoT[i] / (2 * Math.PI)) * Math.log(1 + (2 * t1Thk[i]) / dArr[i]);

  // T3 — sheath to armour/serving
  const dA = dia[4];
  let T3 = (1 / (2 * Math.PI)) * RHO_TOS * Math.log(1 + (2 * oversheathT) / dA);
  if (input.installMethod === "duct") T3 *= 1.6; // IEC 60287-2-1 §4.2.4.3.2 metallic-sheathed duct correction

  // T4 — cable surface to ambient (external thermal resistance)
  const u = (2 * input.burialDepthMm) / dia[5];
  let T4: number;
  if (input.installMethod === "duct") {
    T4 = (1.5 / Math.PI) * input.soilRhoKmW * (Math.log(2 * u) - 0.63);
  } else {
    T4 = (1 / (2 * Math.PI)) * input.soilRhoKmW * Math.log(u + Math.sqrt(u * u - 1));
  }

  // Dielectric loss
  const U0 = (U / Math.sqrt(3)) * 1e3; // phase voltage, V
  const Wd = omega * C * U0 * U0 * TAN_DELTA; // W/m

  // Iterative solve (IEC 60287-1-1 rating equation)
  const n = 1,
    T2 = 0,
    lambda2 = 0;
  const R0 = R0kmOhm / 1000; // ohm/m
  const dcCond = dia[0];
  let thetaC = thetaCMax,
    thetaS = thetaCMax - 10;
  let R = 0,
    Rs = 0,
    lambda1 = 0,
    I: number | null = 0,
    Wc = 0,
    Ws = 0;
  const maxIter = 25;
  let it = 0;
  for (; it < maxIter; it++) {
    const Rprime = R0 * (1 + condMat.alpha20 * (thetaC - 20));
    const xs = Math.sqrt(((8 * Math.PI * f) / Rprime) * 1e-7 * K_S);
    const ys = Math.pow(xs, 4) / (192 + 0.8 * Math.pow(xs, 4));
    const xp = Math.sqrt(((8 * Math.PI * f) / Rprime) * 1e-7 * K_P);
    const ypBase = Math.pow(xp, 4) / (192 + 0.8 * Math.pow(xp, 4));
    const yp = ypBase * Math.pow(dcCond / s, 2) * (0.312 * Math.pow(dcCond / s, 2) + 1.18 / (ypBase + 0.27));
    R = Rprime * (1 + ys + yp);

    Rs = rS0 * (1 + sheathMat.alpha20 * (thetaS - 20));

    lambda1 = input.bonding === "solid" ? (Rs / R) * (1 / (1 + Math.pow(Rs / X, 2))) : 0;

    const deltaTheta = thetaCMax - thetaA;
    const denom = R * T1 + n * R * (1 + lambda1) * T2 + n * R * (1 + lambda1 + lambda2) * (T3 + T4);
    const numer = deltaTheta - Wd * (0.5 * T1 + n * (T2 + T3 + T4));
    if (numer <= 0 || denom <= 0) {
      I = null;
      break;
    }
    I = Math.sqrt(numer / denom);

    Wc = R * I * I;
    Ws = lambda1 * Wc;

    const thetaJ = thetaA + n * (Wc + Ws + Wd) * T4;
    const newThetaS = thetaJ + n * (Wc + Ws + Wd) * T3;
    const newThetaC = newThetaS + n * (Wc + Wd / 2) * T1;
    const converged = Math.abs(newThetaS - thetaS) < 1e-8;
    thetaC = newThetaC;
    thetaS = newThetaS;
    if (converged) {
      it++;
      break;
    }
  }

  if (I === null || !isFinite(I)) return null;

  return {
    ratingA: I,
    thetaCondC: thetaC,
    thetaSheathC: thetaS,
    iterations: it,
    t1: T1,
    t3: T3,
    t4: T4,
    lambda1,
    dielectricLossWPerM: Wd,
    capacitanceFPerM: C,
  };
}
