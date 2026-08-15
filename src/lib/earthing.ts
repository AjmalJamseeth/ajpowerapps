// Earthing (grounding) grid design — IEEE Std 80 (grid resistance, touch/step
// voltage, ground potential rise) and BS 7430:2011 (electrode sizing).
// Ported from the AJ Apps Suite's Earthing Grid Design module.

export type BodyWeight = 50 | 70;
export type ConductorMaterial = "Cu" | "CuEC" | "GS" | "SS";
export type ElectrodeType = "rod" | "plate" | "strip" | "ring";
export type SurfaceMaterial = "none" | "crushed_wet" | "crushed_dry" | "asphalt" | "concrete" | "gravel";

export const SURFACE_RHO: Record<SurfaceMaterial, number | null> = {
  none: null,
  crushed_wet: 3000,
  crushed_dry: 10000,
  asphalt: 1e6,
  concrete: 10000,
  gravel: 5000,
};

export const KADIABATIC: Record<ConductorMaterial, number> = { Cu: 226, CuEC: 226, GS: 80, SS: 106 };

// ---- IEEE 80 formulas ----
export function calcCs(rho: number, rhos: number | null, hs: number): number {
  if (!rhos || rho === rhos) return 1.0;
  return 1.0 - (0.09 * (1 - rho / rhos)) / (2 * hs + 0.09);
}
export function calcEtouch(rhos: number, Cs: number, tf: number, bw: BodyWeight): number {
  const Ib = bw === 70 ? 0.116 / Math.sqrt(tf) : 0.157 / Math.sqrt(tf);
  return (1000 + 1.5 * rhos * Cs) * Ib;
}
export function calcEstep(rhos: number, Cs: number, tf: number, bw: BodyWeight): number {
  const Ib = bw === 70 ? 0.116 / Math.sqrt(tf) : 0.157 / Math.sqrt(tf);
  return (1000 + 6 * rhos * Cs) * Ib;
}
/** Sverak grid resistance, IEEE 80 Eq. 57. */
export function calcRg(rho: number, Lt: number, A: number, h: number): number | null {
  if (Lt <= 0 || A <= 0) return null;
  return rho * (1 / Lt + (1 / Math.sqrt(20 * A)) * (1 + 1 / (1 + h * Math.sqrt(20 / A))));
}
/** Mesh spacing factor Km, IEEE 80 Eq. 80, with the Eq. 81 Kii corner correction. */
export function calcKm(D: number, h: number, d: number, n: number, hasRods: boolean): number {
  if (D <= 0 || d <= 0 || h <= 0) return 1;
  const Kii = hasRods ? 1.0 : Math.pow(2 * n, -2 / n);
  const Kh = Math.sqrt(1 + h);
  const t1 = Math.log(
    (D * D) / (16 * h * d) + Math.pow(D + 2 * h, 2) / (8 * D * d) - h / (4 * d)
  );
  const t2 = (1 / (2 * n)) * Math.log(8 / (Math.PI * (2 * n - 1)));
  return (1 / (2 * Math.PI)) * (t1 + (Kii / Kh) * t2);
}
export function calcKi(n: number): number {
  return 0.644 + 0.148 * n;
}
export function calcLm(Lc: number, nr: number, lr: number): number {
  return Lc + 1.55 * nr * lr;
}
export function calcEm(rho: number, IG: number, Km: number, Ki: number, Lm: number): number {
  return (rho * IG * Km * Ki) / Lm;
}
/** Step spacing factor Ks, IEEE 80 Eq. 92. */
export function calcKs(D: number, h: number, n: number): number {
  if (D <= 0 || h <= 0) return 1;
  return (1 / Math.PI) * (1 / (2 * h) + 1 / (D + h) + (1 / D) * (1 - Math.pow(0.5, n - 2)));
}
export function calcLs(Lc: number, nr: number, lr: number): number {
  return 0.75 * Lc + 0.85 * nr * lr;
}
export function calcEs(rho: number, IG: number, Ks: number, Ki: number, Ls: number): number {
  return (rho * IG * Ks * Ki) / Ls;
}
/** Adiabatic conductor sizing, S = IG*sqrt(tf)/k (BS 7430 / IEEE 80). */
export function calcSmin(IG: number, tf: number, mat: ConductorMaterial): number {
  return (IG * Math.sqrt(tf)) / (KADIABATIC[mat] || 226);
}
/** Two-layer soil reflection coefficient K. */
export function calcK(rho1: number, rho2: number): number {
  return (rho2 - rho1) / (rho2 + rho1);
}
export function calcRhoApp(rho1: number, rho2: number, h1: number, a: number): number {
  const K = calcK(rho1, rho2);
  let s = 0;
  for (let n = 1; n <= 5; n++) s += Math.pow(K, n) / Math.sqrt(1 + Math.pow((2 * n * h1) / a, 2));
  return rho1 * (1 + 4 * s);
}
export function wennerRho(a: number, R: number): number {
  return 2 * Math.PI * a * R;
}

// ---- BS 7430 electrode formulas ----
export function calcRodR(rho: number, L: number, a: number): number | null {
  if (L <= 0 || a <= 0) return null;
  return (rho / (2 * Math.PI * L)) * (Math.log((4 * L) / a) - 1);
}
export function calcPlateR(rho: number, a: number, b: number): number {
  return rho / (8 * Math.sqrt((a * b) / Math.PI));
}
export function calcStripR(rho: number, L: number, w: number, d: number): number | null {
  if (L <= 0 || w <= 0 || d <= 0) return null;
  const a = Math.sqrt(w * d) / 2;
  return (rho / (2 * Math.PI * L)) * (Math.log((2 * L * L) / (d * a)) - 1);
}
export function calcRingR(rho: number, D: number, a: number, h: number): number | null {
  if (D <= 0 || a <= 0) return null;
  return (rho / (2 * Math.PI * Math.PI * D)) * (Math.log((8 * D) / a) + Math.log((2 * D) / h) - 2);
}
export function calcParallelR(RE: number, n: number, s: number, L: number, rho: number): number {
  if (n <= 1) return RE;
  const Rm = (rho / (2 * Math.PI * L)) * (Math.log((2 * L) / s) - 1 + s / (2 * L));
  return (RE + (n - 1) * Rm) / n;
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface EarthingInput {
  rho: number; // Ω·m
  hs: number; // surface layer depth, m
  surface: SurfaceMaterial;
  tf: number; // fault clearing time, s
  bw: BodyWeight;

  Lx: number;
  Ly: number;
  nx: number;
  ny: number;
  h: number; // burial depth, m
  lr: number; // rod length, m
  nr: number; // number of rods
  diam: number; // conductor diameter, m

  If: number; // symmetrical fault current, A
  Sf: number; // current division factor
  Df: number; // decrement factor

  condMat: ConductorMaterial;

  premiumEnabled: boolean;
}

export interface EarthingResult {
  Cs: number;
  rhos: number;
  IG: number;
  Etouch: number;
  Estep: number;
  Smin: number;
  Lc: number;
  A: number;
  Lt: number;
  Rg: number | null;
  GPR: number | null;

  // subscriber
  mesh: {
    Km: number;
    Ki: number;
    Lm: number;
    Em: number;
    Ks: number;
    Ls: number;
    Es: number;
    D_avg: number;
    n_geom: number;
    touchPass: boolean;
    stepPass: boolean;
  } | null;
}

export function calcEarthing(input: EarthingInput): EarthingResult {
  const rhosRaw = SURFACE_RHO[input.surface];
  const rhos = rhosRaw ?? input.rho;
  const Cs = calcCs(input.rho, rhos, input.hs);
  const Lc = input.nx * input.Ly + input.ny * input.Lx;
  const A = input.Lx * input.Ly;
  const Lt = Lc + input.lr * input.nr;
  const IG = input.If * input.Sf * input.Df;
  const Rg = calcRg(input.rho, Lt, A, input.h);
  const GPR = Rg !== null ? IG * Rg : null;
  const Etouch = calcEtouch(rhos, Cs, input.tf, input.bw);
  const Estep = calcEstep(rhos, Cs, input.tf, input.bw);
  const Smin = calcSmin(IG, input.tf, input.condMat);

  let mesh: EarthingResult["mesh"] = null;
  if (input.premiumEnabled && Rg !== null && input.nx > 1 && input.ny > 1) {
    const n_geom = Math.sqrt(input.nx * input.ny);
    const Dx = input.Lx / (input.nx - 1);
    const Dy = input.Ly / (input.ny - 1);
    const D_avg = (Dx + Dy) / 2;
    const hasRods = input.nr > 0;
    const Km = calcKm(D_avg, input.h, input.diam, n_geom, hasRods);
    const Ki = calcKi(n_geom);
    const Lm = calcLm(Lc, input.nr, input.lr);
    const Em = calcEm(input.rho, IG, Km, Ki, Lm);
    const Ks = calcKs(D_avg, input.h, n_geom);
    const Ls = calcLs(Lc, input.nr, input.lr);
    const Es = calcEs(input.rho, IG, Ks, Ki, Ls);
    mesh = { Km, Ki, Lm, Em, Ks, Ls, Es, D_avg, n_geom, touchPass: Em <= Etouch, stepPass: Es <= Estep };
  }

  return { Cs, rhos, IG, Etouch, Estep, Smin, Lc, A, Lt, Rg, GPR, mesh };
}

export const DEFAULT_EARTHING_INPUT: EarthingInput = {
  rho: 100,
  hs: 0.1,
  surface: "none",
  tf: 0.5,
  bw: 70,
  Lx: 30,
  Ly: 20,
  nx: 4,
  ny: 3,
  h: 0.6,
  lr: 3,
  nr: 4,
  diam: 0.01,
  If: 10000,
  Sf: 1,
  Df: 1,
  condMat: "Cu",
  premiumEnabled: false,
};
