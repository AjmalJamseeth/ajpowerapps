// Busbar & Switchgear Rating Check — continuous ampacity via first-principles
// heat balance (Ohm's law + linearized Stefan-Boltzmann radiation + McAdams
// natural-convection correlation), IEC 60364-5-54-style bare-conductor
// short-time thermal withstand (reusing the same k-factor table as CPC
// sizing), and an IEC 60865-1-style electrodynamic force check.
// Ported and verified from the AJ Apps Suite's `Busbar` module.
//
// This is a transparent engineering approximation for preliminary sizing —
// every coefficient (emissivity, McAdams constant, Ks, Kp) is exposed as an
// input, not a hidden constant — not a substitute for formal IEC 60890
// type-test verification where that is required.

import { CPC_K_BARE } from "./cable";

export type BusMaterial = "Cu" | "Al";
export type BusOrientation = "vertical" | "horizontal";
export type BusMounting = "open" | "enclosed";
export type BusFinish = "bare" | "painted" | "tin" | "silver";
export type BusEndCondition = "simple" | "fixed";

export interface BusbarInput {
  // Free
  material: BusMaterial;
  nBars: number;
  widthMm: number;
  thickMm: number;
  gapMm: number;
  phaseSpacingMm: number;
  orientation: BusOrientation;
  mounting: BusMounting;
  ambientC: number;
  loadIA: number;
  finish: BusFinish;
  emissivity: number;
  mcadamsC: number;
  lcMm: number;
  ks: number;
  kp: number;
  maxRiseK: number;

  // Subscriber
  ifKa: number;
  tfS: number;
  ipKa: number;
  spanMm: number;
  endCond: BusEndCondition;
  yieldMPa: number;
  sf: number;
}

export const DEFAULT_BUSBAR_INPUT: BusbarInput = {
  material: "Cu",
  nBars: 1,
  widthMm: 100,
  thickMm: 10,
  gapMm: 10,
  phaseSpacingMm: 150,
  orientation: "vertical",
  mounting: "open",
  ambientC: 35,
  loadIA: 1200,
  finish: "bare",
  emissivity: 0.3,
  mcadamsC: 1.42,
  lcMm: 100,
  ks: 1.0,
  kp: 1.0,
  maxRiseK: 65,
  ifKa: 40,
  tfS: 1.0,
  ipKa: 100,
  spanMm: 600,
  endCond: "simple",
  yieldMPa: 55,
  sf: 1.67,
};

export const BUS_FINISH_EPS: Record<BusFinish, number> = { bare: 0.3, painted: 0.9, tin: 0.35, silver: 0.4 };
const RHO20: Record<BusMaterial, number> = { Cu: 0.0175, Al: 0.0282 }; // ohm.mm^2/m at 20C
const ALPHA: Record<BusMaterial, number> = { Cu: 0.00393, Al: 0.00403 }; // per C

function solveDeltaT(
  I: number,
  areaMm2: number,
  perimMm: number,
  material: BusMaterial,
  ambient: number,
  eps: number,
  mcadamsC: number,
  lcM: number,
  ks: number,
  kp: number,
) {
  const rho20 = RHO20[material],
    alpha = ALPHA[material];
  const rdc20PerM = rho20 / areaMm2; // ohm/m
  const pM = perimMm / 1000; // m
  const sigma = 5.67e-8;
  const taK = ambient + 273;
  const lcSafe = Math.max(lcM, 0.01);
  let deltaT = 30;
  for (let iter = 0; iter < 40; iter++) {
    const ts = ambient + deltaT,
      tsK = ts + 273;
    const rac = rdc20PerM * (1 + alpha * (ts - 20)) * ks * kp;
    const ploss = I * I * rac; // W/m
    const hc = mcadamsC * Math.pow(Math.max(deltaT, 1) / lcSafe, 0.25);
    const hr = eps * sigma * (tsK * tsK + taK * taK) * (tsK + taK);
    const denom = (hc + hr) * pM;
    const deltaTNew = denom > 0 ? ploss / denom : deltaT;
    if (Math.abs(deltaTNew - deltaT) < 0.005) {
      deltaT = deltaTNew;
      break;
    }
    deltaT = deltaT + 0.5 * (deltaTNew - deltaT);
  }
  const ts = ambient + deltaT;
  const tsFinal = ts + 273;
  const rac = rdc20PerM * (1 + alpha * (ts - 20)) * ks * kp;
  return { deltaT, rac, ploss: I * I * rac, tsK: tsFinal };
}

function solveMaxCurrent(
  targetDT: number,
  areaMm2: number,
  perimMm: number,
  material: BusMaterial,
  ambient: number,
  eps: number,
  mcadamsC: number,
  lcM: number,
  ks: number,
  kp: number,
) {
  let lo = 0,
    hi = areaMm2 * 50;
  for (let iter = 0; iter < 40; iter++) {
    const mid = (lo + hi) / 2;
    const r = solveDeltaT(mid, areaMm2, perimMm, material, ambient, eps, mcadamsC, lcM, ks, kp);
    if (r.deltaT > targetDT) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export interface BusbarResult {
  areaTotalMm2: number;
  racMOhmPerM: number | null;
  plossWPerM: number | null;
  deltaTK: number | null;
  tsC: number | null;
  tempPass: boolean | null;
  maxIA: number;

  // subscriber
  thermal: {
    kUsed: number;
    minCsaMm2: number;
    pass: boolean;
  } | null;
  mech: {
    forceNPerM: number;
    momentNm: number;
    stressMPa: number;
    allowStressMPa: number;
    pass: boolean;
  } | null;
}

export function calcBusbar(input: BusbarInput, premiumEnabled: boolean): BusbarResult | null {
  const { material, ambientC: ambient, emissivity: eps, mcadamsC, ks, kp, maxRiseK: maxRise } = input;
  const nBars = Math.max(1, input.nBars || 1);
  const width = input.widthMm,
    thick = input.thickMm;
  if (!width || !thick) return null;

  const lcM = (input.lcMm || width || 100) / 1000;
  const areaBar = width * thick;
  const areaTotal = areaBar * nBars;
  const perimBar = 2 * (width + thick);
  const perimTotal = perimBar * nBars;

  let racMOhmPerM: number | null = null,
    plossWPerM: number | null = null,
    deltaTK: number | null = null,
    tsC: number | null = null,
    tempPass: boolean | null = null;

  if (input.loadIA > 0) {
    const r = solveDeltaT(input.loadIA, areaTotal, perimTotal, material, ambient, eps, mcadamsC, lcM, ks, kp);
    racMOhmPerM = r.rac * 1000;
    plossWPerM = r.ploss;
    deltaTK = r.deltaT;
    tsC = ambient + r.deltaT;
    tempPass = r.deltaT <= maxRise;
  }

  const maxIA = solveMaxCurrent(maxRise, areaTotal, perimTotal, material, ambient, eps, mcadamsC, lcM, ks, kp);

  let thermal: BusbarResult["thermal"] = null;
  let mech: BusbarResult["mech"] = null;

  if (premiumEnabled) {
    const If = input.ifKa,
      tf = input.tfS || 1.0;
    const k = CPC_K_BARE[material] || (material === "Cu" ? 159 : 105);
    if (If > 0) {
      const iA = If * 1000;
      const minCsaMm2 = (iA * Math.sqrt(tf)) / k;
      thermal = { kUsed: k, minCsaMm2, pass: areaTotal >= minCsaMm2 };
    }

    const Ip = input.ipKa,
      span = input.spanMm || 600,
      phaseSpacing = input.phaseSpacingMm || 150;
    if (Ip > 0 && phaseSpacing > 0) {
      const ipA = Ip * 1000;
      const dM = phaseSpacing / 1000,
        lM = span / 1000;
      const forceNPerM = (2e-7 * ipA * ipA) / dM;
      const divisor = input.endCond === "fixed" ? 12 : 8;
      const momentNm = (forceNPerM * lM * lM) / divisor;
      const zMm3 = (nBars * (width * thick * thick)) / 6;
      const zM3 = zMm3 * 1e-9;
      const stressPa = zM3 > 0 ? momentNm / zM3 : 0;
      const stressMPa = stressPa / 1e6;
      const allowStressMPa = (input.yieldMPa || 55) / (input.sf || 1.67);
      mech = { forceNPerM, momentNm, stressMPa, allowStressMPa, pass: stressMPa <= allowStressMPa };
    }
  }

  return { areaTotalMm2: areaTotal, racMOhmPerM, plossWPerM, deltaTK, tsC, tempPass, maxIA, thermal, mech };
}
