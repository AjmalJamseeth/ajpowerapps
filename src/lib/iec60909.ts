// IEC 60909-0 short-circuit current calculator (3-phase AC systems).
//
// Model: any number of buses (each with a nominal voltage), joined by
// transformers, cables/lines and bus ties, with any number of network
// feeders (grid sources), synchronous generators and induction motors
// connected to any bus. The network is solved with a nodal impedance matrix
// on a 100 MVA per-unit base, so several sources on the same bus, parallel
// paths and tie breakers are all handled exactly (this is the matrix form of
// the IEC 60909 "equivalent voltage source at the fault location" method).
//
// Implemented from IEC 60909-0:
//   - Voltage factor c (cmax / cmin) per voltage level          (Table 1)
//   - Network feeder     Zq = c*Un^2 / Sk"Q                      (cl. 3.2)
//   - Transformer        ZT = uk*Ur^2/Sr, KT = 0.95*cmax/(1+0.6*xT)   (cl. 3.3.3)
//   - Generator          ZG = KG*(RG + jXd"), KG = Un/UrG * cmax/(1+xd"*sin(phi))  (cl. 3.6.1)
//   - Asynchronous motor ZM = 1/(ILR/IrM) * UrM^2/SrM            (cl. 3.8)
//   - Ik" three-phase, line-to-line, line-to-earth, line-line-earth (cl. 4)
//   - Peak current ip = kappa*sqrt(2)*Ik", kappa = 1.02+0.98*exp(-3R/X)  (method A, cl. 4.3)
//   - Breaking current Ib = sum(mu_i * Ik"_i)                    (cl. 4.5)
//   - Thermal equivalent Ith = Ik" * sqrt(m+n)                   (cl. 4.8, n = 1 conservative)
//
// Simplifications (all disclosed in the UI): no steady-state Ik (lambda
// factors), motor breaking decay (mu*q) taken as 1 (conservative), uniform
// R/X ratio method A for ip (may differ from method B/C for branches with
// very different X/R), transformer tap changers and loads ignored.

export interface C {
  re: number;
  im: number;
}
const cx = (re: number, im = 0): C => ({ re, im });
const add = (a: C, b: C): C => cx(a.re + b.re, a.im + b.im);
const sub = (a: C, b: C): C => cx(a.re - b.re, a.im - b.im);
const mul = (a: C, b: C): C => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
const scale = (a: C, k: number): C => cx(a.re * k, a.im * k);
const abs = (a: C): number => Math.hypot(a.re, a.im);
const inv = (a: C): C => div(cx(1), a);

export const S_BASE_MVA = 100;
const A_OP = cx(-0.5, Math.sqrt(3) / 2); // a = 1∠120°
const A2_OP = mul(A_OP, A_OP);
const TINY = 1e-9; // keeps floating (un-energised) buses invertible
const NOT_ENERGISED = 1e4; // |Zkk| above this (pu) means no source / no earth path

// ----------------------------------------------------------------------------
// Input model
// ----------------------------------------------------------------------------

export type VectorGroup = "Dyn" | "YNd" | "YNyn" | "Yy";

export interface BusIn {
  id: string;
  name: string;
  unKv: number;
  ratingKa: number; // switchgear short-circuit rating; 0 = do not check
}
export interface GridIn {
  id: string;
  name: string;
  busId: string;
  skMva: number; // initial symmetrical short-circuit power Sk"Q
  rToX: number;
  z0ToZ1: number;
}
export interface GenIn {
  id: string;
  name: string;
  busId: string;
  srMva: number;
  urKv: number;
  xdPct: number; // subtransient reactance xd" (%)
  cosPhi: number;
  rToX: number; // RG / Xd"
  x0Pct: number; // zero-sequence reactance (%)
  neutralOhm: number; // neutral earthing resistance (Ω, at generator voltage)
}
export interface MotorIn {
  id: string;
  name: string;
  busId: string;
  prKw: number;
  urKv: number;
  cosPhi: number;
  eff: number; // efficiency 0-1
  ilrRatio: number; // locked-rotor current / rated current
  rToX: number;
}
interface BranchBase {
  id: string;
  name: string;
  fromBus: string;
  toBus: string;
}
export interface TrafoIn extends BranchBase {
  kind: "transformer";
  srMva: number;
  ukPct: number;
  pkKw: number; // load (copper) loss at rated current
  group: VectorGroup; // from-side winding listed first (Dyn: from = Delta, to = grounded Star)
  z0ToZ1: number;
  neutralFromOhm: number;
  neutralToOhm: number;
  applyKt: boolean;
}
export interface CableIn extends BranchBase {
  kind: "cable";
  rOhmKm: number;
  xOhmKm: number;
  r0OhmKm: number;
  x0OhmKm: number;
  lengthKm: number;
  parallel: number;
}
export interface TieIn extends BranchBase {
  kind: "tie";
  closed: boolean;
}
export type BranchIn = TrafoIn | CableIn | TieIn;

export interface ScSettings {
  lvTolerancePct: 6 | 10;
  frequencyHz: 50 | 60;
  tminS: number; // minimum time delay before breaking
  tkS: number; // short-circuit duration for Ith
}

export interface ScNetwork {
  settings: ScSettings;
  buses: BusIn[];
  grids: GridIn[];
  gens: GenIn[];
  motors: MotorIn[];
  branches: BranchIn[];
}

// ----------------------------------------------------------------------------
// Typical values (used for presets and the reference table in the UI)
// ----------------------------------------------------------------------------

/** IEC 60909-0 Table 1 voltage factor c. */
export function voltageFactor(unKv: number, tolPct: 6 | 10): { cMax: number; cMin: number } {
  if (unKv <= 1) return { cMax: tolPct === 6 ? 1.05 : 1.1, cMin: 0.95 };
  return { cMax: 1.1, cMin: 1.0 };
}

/** IEC 60909-0 cl. 3.6.1: RG/Xd" when no manufacturer value is known. */
export function typicalGenRToX(urKv: number, srMva: number): number {
  if (urKv <= 1) return 0.15;
  return srMva >= 100 ? 0.05 : 0.07;
}

/** IEC 60909-0 cl. 3.8: RM/XM for induction motors. */
export function typicalMotorRToX(urKv: number, prKw: number, polePairs = 1): number {
  if (urKv <= 1) return 0.42;
  return prKw / 1000 / polePairs >= 1 ? 0.1 : 0.15;
}

export interface Preset<T> {
  label: string;
  values: Partial<T>;
}

export const GRID_PRESETS: Preset<GridIn>[] = [
  { label: "11 kV, 250 MVA (typical utility, X/R≈10)", values: { skMva: 250, rToX: 0.1, z0ToZ1: 1 } },
  { label: "11 kV, 500 MVA (strong 11 kV supply)", values: { skMva: 500, rToX: 0.1, z0ToZ1: 1 } },
  { label: "33 kV, 1000 MVA", values: { skMva: 1000, rToX: 0.07, z0ToZ1: 1 } },
  { label: "33 kV, 1500 MVA (≈26 kA)", values: { skMva: 1500, rToX: 0.07, z0ToZ1: 1 } },
  { label: "132 kV, 5000 MVA (≈22 kA)", values: { skMva: 5000, rToX: 0.05, z0ToZ1: 1 } },
  { label: "0.4 kV LV supply, 20 MVA", values: { skMva: 20, rToX: 0.3, z0ToZ1: 1 } },
];

export const TRAFO_PRESETS: Preset<TrafoIn>[] = [
  { label: "100 kVA — 4 %, 1.75 kW", values: { srMva: 0.1, ukPct: 4, pkKw: 1.75 } },
  { label: "250 kVA — 4 %, 3.25 kW", values: { srMva: 0.25, ukPct: 4, pkKw: 3.25 } },
  { label: "400 kVA — 4 %, 4.6 kW", values: { srMva: 0.4, ukPct: 4, pkKw: 4.6 } },
  { label: "630 kVA — 4 %, 6.5 kW", values: { srMva: 0.63, ukPct: 4, pkKw: 6.5 } },
  { label: "1000 kVA — 6 %, 10.5 kW", values: { srMva: 1, ukPct: 6, pkKw: 10.5 } },
  { label: "1600 kVA — 6 %, 15 kW", values: { srMva: 1.6, ukPct: 6, pkKw: 15 } },
  { label: "2500 kVA — 6 %, 22 kW", values: { srMva: 2.5, ukPct: 6, pkKw: 22 } },
  { label: "5 MVA — 7.5 %, 40 kW", values: { srMva: 5, ukPct: 7.5, pkKw: 40 } },
  { label: "10 MVA — 10 %, 65 kW", values: { srMva: 10, ukPct: 10, pkKw: 65 } },
  { label: "20 MVA — 12.5 %, 110 kW", values: { srMva: 20, ukPct: 12.5, pkKw: 110 } },
  { label: "40 MVA — 14 %, 180 kW", values: { srMva: 40, ukPct: 14, pkKw: 180 } },
];

// Cu, XLPE, 3-core; r at 20 °C. Zero-sequence ≈ 4×r, 3×x (typical, 3-core).
const z0 = (r: number, x: number) => ({ r0OhmKm: +(r * 4).toFixed(4), x0OhmKm: +(x * 3).toFixed(4) });
export const CABLE_PRESETS: Preset<CableIn>[] = [
  { label: "LV 3C 16 mm² Cu", values: { rOhmKm: 1.15, xOhmKm: 0.094, ...z0(1.15, 0.094) } },
  { label: "LV 3C 35 mm² Cu", values: { rOhmKm: 0.524, xOhmKm: 0.086, ...z0(0.524, 0.086) } },
  { label: "LV 3C 70 mm² Cu", values: { rOhmKm: 0.268, xOhmKm: 0.082, ...z0(0.268, 0.082) } },
  { label: "LV 3C 120 mm² Cu", values: { rOhmKm: 0.153, xOhmKm: 0.08, ...z0(0.153, 0.08) } },
  { label: "LV 3C 185 mm² Cu", values: { rOhmKm: 0.0991, xOhmKm: 0.079, ...z0(0.0991, 0.079) } },
  { label: "LV 3C 240 mm² Cu", values: { rOhmKm: 0.0754, xOhmKm: 0.078, ...z0(0.0754, 0.078) } },
  { label: "LV 3C 300 mm² Cu", values: { rOhmKm: 0.0601, xOhmKm: 0.077, ...z0(0.0601, 0.077) } },
  { label: "11 kV 3C 95 mm² Cu XLPE", values: { rOhmKm: 0.193, xOhmKm: 0.108, ...z0(0.193, 0.108) } },
  { label: "11 kV 3C 185 mm² Cu XLPE", values: { rOhmKm: 0.0991, xOhmKm: 0.1, ...z0(0.0991, 0.1) } },
  { label: "11 kV 3C 300 mm² Cu XLPE", values: { rOhmKm: 0.0601, xOhmKm: 0.095, ...z0(0.0601, 0.095) } },
  { label: "Overhead line ACSR 100 mm² (Dog)", values: { rOhmKm: 0.272, xOhmKm: 0.35, r0OhmKm: 0.42, x0OhmKm: 1.2 } },
];

export const GEN_PRESETS: Preset<GenIn>[] = [
  { label: "500 kVA, 0.4 kV standby set (xd″ 14 %)", values: { srMva: 0.5, urKv: 0.4, xdPct: 14, cosPhi: 0.8, rToX: 0.15, x0Pct: 7 } },
  { label: "1.25 MVA, 0.4 kV set (xd″ 15 %)", values: { srMva: 1.25, urKv: 0.4, xdPct: 15, cosPhi: 0.8, rToX: 0.15, x0Pct: 7 } },
  { label: "2.5 MVA, 11 kV set (xd″ 14 %)", values: { srMva: 2.5, urKv: 11, xdPct: 14, cosPhi: 0.8, rToX: 0.07, x0Pct: 7 } },
  { label: "10 MVA, 11 kV gas turbine (xd″ 14 %)", values: { srMva: 10, urKv: 11, xdPct: 14, cosPhi: 0.85, rToX: 0.07, x0Pct: 7 } },
  { label: "125 MVA, 13.8 kV turbo (xd″ 18 %)", values: { srMva: 125, urKv: 13.8, xdPct: 18, cosPhi: 0.85, rToX: 0.05, x0Pct: 9 } },
];

export const MOTOR_PRESETS: Preset<MotorIn>[] = [
  { label: "37 kW, 0.4 kV (ILR 7)", values: { prKw: 37, urKv: 0.4, cosPhi: 0.87, eff: 0.93, ilrRatio: 7, rToX: 0.42 } },
  { label: "160 kW, 0.4 kV (ILR 7)", values: { prKw: 160, urKv: 0.4, cosPhi: 0.88, eff: 0.95, ilrRatio: 7, rToX: 0.42 } },
  { label: "500 kW, 3.3 kV (ILR 6)", values: { prKw: 500, urKv: 3.3, cosPhi: 0.88, eff: 0.95, ilrRatio: 6, rToX: 0.15 } },
  { label: "1 MW, 6.6 kV (ILR 6)", values: { prKw: 1000, urKv: 6.6, cosPhi: 0.89, eff: 0.96, ilrRatio: 6, rToX: 0.1 } },
  { label: "2 MW, 11 kV (ILR 5.5)", values: { prKw: 2000, urKv: 11, cosPhi: 0.9, eff: 0.96, ilrRatio: 5.5, rToX: 0.1 } },
];

/** Reference table shown in the UI ("typical values of the constants"). */
export const TYPICAL_CONSTANTS: { group: string; rows: { name: string; value: string; note: string }[] }[] = [
  {
    group: "Voltage factor c (IEC 60909-0 Table 1)",
    rows: [
      { name: "LV 100–1000 V, +6 % tolerance", value: "cmax 1.05 / cmin 0.95", note: "Default for 230/400 V public networks." },
      { name: "LV 100–1000 V, +10 % tolerance", value: "cmax 1.10 / cmin 0.95", note: "Use where the supply voltage may reach +10 %." },
      { name: "MV and HV > 1 kV", value: "cmax 1.10 / cmin 1.00", note: "Applies to 3.3, 6.6, 11, 33, 132 kV etc." },
    ],
  },
  {
    group: "Network feeder",
    rows: [
      { name: "R/X of source", value: "0.1 (HV), 0.3 (LV)", note: "IEC: XQ = 0.995 ZQ when R = 0.1 X. Use the utility's X/R if known." },
      { name: "Typical Sk″ at 11 kV", value: "150 – 500 MVA", note: "8 – 26 kA. Ask the utility for the real value." },
      { name: "Typical Sk″ at 33 kV", value: "500 – 1500 MVA", note: "Up to 25 – 31.5 kA switchgear." },
      { name: "Z0/Z1 of source", value: "1.0 (typical)", note: "Depends on utility earthing; 0.5–3 possible." },
    ],
  },
  {
    group: "Transformer",
    rows: [
      { name: "uk, up to 630 kVA", value: "4 %", note: "IEC 60076-5 / EN 50464 distribution range." },
      { name: "uk, 800 – 3150 kVA", value: "6 %", note: "" },
      { name: "uk, 5 – 40 MVA", value: "7.5 – 14 %", note: "Check the nameplate; rises with rating and voltage." },
      { name: "KT = 0.95·cmax/(1+0.6·xT)", value: "≈ 0.93 – 1.0", note: "Applied to Z1 and Z0; not applied to power-station unit transformers." },
      { name: "Z0/Z1", value: "0.85 – 1.0", note: "Dyn ≈ 1.0; 3-limb YNyn 0.8–1.0." },
    ],
  },
  {
    group: "Generator",
    rows: [
      { name: "RG/Xd″ when UrG ≤ 1 kV", value: "0.15", note: "IEC 60909-0 cl. 3.6.1." },
      { name: "RG/Xd″ when UrG > 1 kV, SrG < 100 MVA", value: "0.07", note: "" },
      { name: "RG/Xd″ when UrG > 1 kV, SrG ≥ 100 MVA", value: "0.05", note: "" },
      { name: "xd″", value: "12 – 20 %", note: "Salient-pole 12–25 %; turbo 10–20 %." },
      { name: "x0", value: "≈ 0.4 – 0.6 xd″", note: "Use the datasheet where available." },
    ],
  },
  {
    group: "Induction motor",
    rows: [
      { name: "RM/XM, LV motor groups", value: "0.42", note: "IEC 60909-0 cl. 3.8 (includes connection cables)." },
      { name: "RM/XM, MV motor < 1 MW per pole pair", value: "0.15", note: "" },
      { name: "RM/XM, MV motor ≥ 1 MW per pole pair", value: "0.10", note: "" },
      { name: "ILR/IrM", value: "5 – 7", note: "Locked-rotor to rated current." },
      { name: "Efficiency × cos φ", value: "0.80 – 0.90", note: "Used to get SrM = Pr/(η·cos φ)." },
    ],
  },
  {
    group: "Cable",
    rows: [
      { name: "Cu 3C XLPE 240 mm² LV", value: "r 0.0754, x 0.078 Ω/km", note: "r at 20 °C; code raises r to 80 °C (×1.24) for the minimum case." },
      { name: "Z0 of 3-core cable", value: "r0 ≈ 4 r, x0 ≈ 3 x", note: "Use manufacturer data for single-core/screen returns." },
    ],
  },
];

// ----------------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------------

export const DEFAULT_SC_SETTINGS: ScSettings = { lvTolerancePct: 6, frequencyHz: 50, tminS: 0.1, tkS: 1 };

export const DEFAULT_SC_NETWORK: ScNetwork = {
  settings: DEFAULT_SC_SETTINGS,
  buses: [
    { id: "b1", name: "11 kV Switchboard", unKv: 11, ratingKa: 25 },
    { id: "b2", name: "0.4 kV LV Board", unKv: 0.4, ratingKa: 50 },
    { id: "b3", name: "Motor Control Centre", unKv: 0.4, ratingKa: 36 },
  ],
  grids: [{ id: "g1", name: "Utility incomer", busId: "b1", skMva: 250, rToX: 0.1, z0ToZ1: 1 }],
  gens: [
    { id: "gn1", name: "Gen G1", busId: "b1", srMva: 2.5, urKv: 11, xdPct: 14, cosPhi: 0.8, rToX: 0.07, x0Pct: 7, neutralOhm: 0 },
  ],
  motors: [{ id: "m1", name: "Motor M1", busId: "b3", prKw: 160, urKv: 0.4, cosPhi: 0.88, eff: 0.95, ilrRatio: 7, rToX: 0.42 }],
  branches: [
    {
      id: "t1", kind: "transformer", name: "T1 11/0.4 kV", fromBus: "b1", toBus: "b2",
      srMva: 1.6, ukPct: 6, pkKw: 15, group: "Dyn", z0ToZ1: 1, neutralFromOhm: 0, neutralToOhm: 0, applyKt: true,
    },
    {
      id: "c1", kind: "cable", name: "Cable to MCC", fromBus: "b2", toBus: "b3",
      rOhmKm: 0.0754, xOhmKm: 0.078, r0OhmKm: 0.3016, x0OhmKm: 0.234, lengthKm: 0.05, parallel: 1,
    },
  ],
};

// ----------------------------------------------------------------------------
// Results
// ----------------------------------------------------------------------------

export interface Contribution {
  name: string;
  kind: "Grid" | "Generator" | "Motor";
  ikKa: number; // contribution to Ik" at the fault bus (kA)
  mu: number; // breaking decay factor used
}

export interface BusResult {
  busId: string;
  name: string;
  unKv: number;
  energised: boolean;
  cMax: number;
  cMin: number;
  z1Pu: C | null;
  z1Ohm: C | null; // at the bus voltage
  rToX: number;
  kappa: number;
  ik3: number; // Ik" three-phase, kA
  ip: number;
  ib: number;
  ith: number;
  m: number;
  ik2: number; // line-to-line
  ikLG: number | null; // line-to-earth, null if no earth return path
  ikLLG: number | null; // max phase current, line-line-earth
  ieLLG: number | null; // earth current in LLG fault
  ik3Min: number;
  ik2Min: number;
  ikLGMin: number | null;
  contributions: Contribution[];
  ratingKa: number;
  ratingOk: boolean | null;
  maxIk: number; // max(ik3, ikLG) used for rating check
  steps: string[];
}

export interface ScResult {
  buses: BusResult[];
  elementLines: string[];
  warnings: string[];
}

// ----------------------------------------------------------------------------
// Solver helpers
// ----------------------------------------------------------------------------

function invertMatrix(m: C[][]): C[][] {
  const n = m.length;
  const a: C[][] = m.map((row, i) => [...row.map((v) => ({ ...v })), ...Array.from({ length: n }, (_, j) => cx(i === j ? 1 : 0))]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (abs(a[r][col]) > abs(a[piv][col])) piv = r;
    [a[col], a[piv]] = [a[piv], a[col]];
    const p = a[col][col];
    for (let j = 0; j < 2 * n; j++) a[col][j] = div(a[col][j], p);
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = a[r][col];
      if (f.re === 0 && f.im === 0) continue;
      for (let j = 0; j < 2 * n; j++) a[r][j] = sub(a[r][j], mul(f, a[col][j]));
    }
  }
  return a.map((row) => row.slice(n));
}

const f2 = (x: number, d = 2) => (Number.isFinite(x) ? x.toFixed(d) : "n/a");
const zStr = (z: C, d = 4) => `${f2(z.re, d)} ${z.im < 0 ? "−" : "+"} j${f2(Math.abs(z.im), d)}`;

/** Interpolated mu factor for a generator (IEC 60909-0 eq. 69-72). */
export function muFactor(x: number, tminS: number): number {
  if (x <= 2) return 1;
  const rows = [
    { t: 0.02, a: 0.84, b: 0.26, c: 0.26 },
    { t: 0.05, a: 0.71, b: 0.51, c: 0.3 },
    { t: 0.1, a: 0.62, b: 0.72, c: 0.32 },
    { t: 0.25, a: 0.56, b: 0.94, c: 0.38 },
  ];
  const val = (r: (typeof rows)[number]) => r.a + r.b * Math.exp(-r.c * x);
  let mu: number;
  if (tminS <= rows[0].t) mu = val(rows[0]);
  else if (tminS >= rows[3].t) mu = val(rows[3]);
  else {
    let i = 0;
    while (tminS > rows[i + 1].t) i++;
    const w = (tminS - rows[i].t) / (rows[i + 1].t - rows[i].t);
    mu = val(rows[i]) * (1 - w) + val(rows[i + 1]) * w;
  }
  return Math.min(1, mu);
}

export function peakFactor(rToX: number): number {
  return 1.02 + 0.98 * Math.exp(-3 * Math.max(0, rToX));
}

export function thermalM(kappa: number, f: number, tk: number): number {
  const l = kappa - 1;
  if (l <= 1e-6 || tk <= 0) return 0;
  const q = 2 * f * tk * Math.log(l);
  return (Math.exp(2 * q) - 1) / q;
}

interface ShuntSrc {
  kind: "Grid" | "Generator" | "Motor";
  name: string;
  busIdx: number;
  y1: C;
  srcId: string;
}

interface Built {
  Z1: C[][];
  Z0: C[][];
  shunts: ShuntSrc[];
  lines: string[];
  warnings: string[];
}

function build(net: ScNetwork, mode: "max" | "min"): Built {
  const { buses, settings } = net;
  const n = buses.length;
  const idx = new Map(buses.map((b, i) => [b.id, i]));
  const tol = settings.lvTolerancePct;
  const cMaxOf = (kv: number) => voltageFactor(kv, tol).cMax;
  const cCaseOf = (kv: number) => (mode === "max" ? voltageFactor(kv, tol).cMax : voltageFactor(kv, tol).cMin);
  const S = S_BASE_MVA;
  const lines: string[] = [];
  const warnings: string[] = [];

  const Y1: C[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => cx(0)));
  const Y0: C[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => cx(0)));
  for (let i = 0; i < n; i++) {
    Y1[i][i] = cx(TINY);
    Y0[i][i] = cx(TINY);
  }
  const addShunt = (Y: C[][], i: number, y: C) => (Y[i][i] = add(Y[i][i], y));
  const addSeries = (Y: C[][], i: number, j: number, y: C) => {
    Y[i][i] = add(Y[i][i], y);
    Y[j][j] = add(Y[j][j], y);
    Y[i][j] = sub(Y[i][j], y);
    Y[j][i] = sub(Y[j][i], y);
  };
  const shunts: ShuntSrc[] = [];
  const note = (s: string) => {
    if (mode === "max") lines.push(s);
  };

  note(`Per-unit base: Sbase = ${S} MVA, Vbase = nominal voltage of each bus (Zbase = Un²/Sbase).`);

  // Network feeders
  for (const g of net.grids) {
    const i = idx.get(g.busId);
    if (i === undefined || g.skMva <= 0) continue;
    const un = buses[i].unKv;
    const c = cCaseOf(un);
    const zMag = (c * S) / g.skMva;
    const x = zMag / Math.sqrt(1 + g.rToX * g.rToX);
    const z1 = cx(g.rToX * x, x);
    const z0 = scale(z1, g.z0ToZ1);
    addShunt(Y1, i, inv(z1));
    addShunt(Y0, i, inv(z0));
    shunts.push({ kind: "Grid", name: g.name, busIdx: i, y1: inv(z1), srcId: g.id });
    note(
      `${g.name} (grid): ZQ = c·Un²/Sk″ = ${f2(c, 2)}×${f2(un, 3)}²/${f2(g.skMva, 1)} = ${f2((c * un * un) / g.skMva, 4)} Ω → ${f2(zMag, 5)} pu; R/X = ${f2(g.rToX, 3)} → ZQ = ${zStr(z1, 5)} pu.`
    );
  }

  // Generators
  for (const g of net.gens) {
    const i = idx.get(g.busId);
    if (i === undefined || g.srMva <= 0 || g.urKv <= 0) continue;
    const un = buses[i].unKv;
    const sinPhi = Math.sqrt(Math.max(0, 1 - g.cosPhi * g.cosPhi));
    const kg = ((un / g.urKv) * cMaxOf(un)) / (1 + (g.xdPct / 100) * sinPhi);
    const xdOhm = (g.xdPct / 100) * ((g.urKv * g.urKv) / g.srMva);
    const xPu = (xdOhm * S) / (un * un);
    const rPu = g.rToX * xPu;
    const z1 = scale(cx(rPu, xPu), kg);
    const x0Pu = ((g.x0Pct / 100) * ((g.urKv * g.urKv) / g.srMva) * S) / (un * un);
    const zn = (3 * g.neutralOhm * S) / (un * un);
    const z0 = add(scale(cx(rPu, x0Pu), kg), cx(zn, 0));
    addShunt(Y1, i, inv(z1));
    addShunt(Y0, i, inv(z0));
    shunts.push({ kind: "Generator", name: g.name, busIdx: i, y1: inv(z1), srcId: g.id });
    note(
      `${g.name} (generator): KG = (Un/UrG)·cmax/(1+xd″·sinφ) = ${f2(kg, 4)}; Xd″ = ${f2(xdOhm, 4)} Ω = ${f2(xPu, 5)} pu; RG = ${f2(g.rToX, 3)}·Xd″; ZG = KG(RG + jXd″) = ${zStr(z1, 5)} pu.`
    );
  }

  // Motors (maximum case only; IEC 60909 neglects motors for minimum currents)
  if (mode === "max") {
    for (const m of net.motors) {
      const i = idx.get(m.busId);
      if (i === undefined || m.prKw <= 0 || m.urKv <= 0 || m.ilrRatio <= 0) continue;
      const un = buses[i].unKv;
      const srM = m.prKw / 1000 / Math.max(0.05, m.eff * m.cosPhi);
      const zMag = (1 / m.ilrRatio) * (S / srM) * Math.pow(m.urKv / un, 2);
      const x = zMag / Math.sqrt(1 + m.rToX * m.rToX);
      const z1 = cx(m.rToX * x, x);
      addShunt(Y1, i, inv(z1));
      shunts.push({ kind: "Motor", name: m.name, busIdx: i, y1: inv(z1), srcId: m.id });
      note(
        `${m.name} (motor): SrM = Pr/(η·cosφ) = ${f2(srM * 1000, 1)} kVA; ZM = (1/ILR)·UrM²/SrM → ${f2(zMag, 5)} pu; R/X = ${f2(m.rToX, 3)} → ZM = ${zStr(z1, 5)} pu.`
      );
    }
  }

  // Branches
  for (const b of net.branches) {
    const i = idx.get(b.fromBus);
    const j = idx.get(b.toBus);
    if (i === undefined || j === undefined || i === j) continue;
    if (b.kind === "tie") {
      if (!b.closed) {
        note(`${b.name} (tie): OPEN — buses are separated.`);
        continue;
      }
      const z = cx(1e-5, 1e-4);
      addSeries(Y1, i, j, inv(z));
      addSeries(Y0, i, j, inv(z));
      note(`${b.name} (tie): CLOSED — modelled as a negligible impedance.`);
    } else if (b.kind === "cable") {
      const unF = buses[i].unKv;
      if (Math.abs(unF - buses[j].unKv) > 1e-6) warnings.push(`${b.name}: cable ends have different nominal voltages — use a transformer to change voltage.`);
      const par = Math.max(1, b.parallel);
      const rk = mode === "min" ? 1.24 : 1; // 20 °C -> 80 °C for Cu (IEC 60909 minimum case)
      const base = (un: number) => (S / (un * un)) * (b.lengthKm / par);
      const z1 = cx(b.rOhmKm * rk * base(unF), b.xOhmKm * base(unF));
      const z0c = cx(b.r0OhmKm * rk * base(unF), b.x0OhmKm * base(unF));
      addSeries(Y1, i, j, inv(z1));
      addSeries(Y0, i, j, inv(z0c));
      note(
        `${b.name} (cable): Z = (r+jx)·L/n = (${f2(b.rOhmKm, 4)}+j${f2(b.xOhmKm, 4)})×${f2(b.lengthKm, 3)}/${par} = ${zStr(
          cx((b.rOhmKm * b.lengthKm) / par, (b.xOhmKm * b.lengthKm) / par),
          5
        )} Ω → ${zStr(z1, 5)} pu.`
      );
    } else {
      if (b.srMva <= 0 || b.ukPct <= 0) continue;
      const ukr = Math.min(b.ukPct, (b.pkKw / 1000 / b.srMva) * 100);
      const ux = Math.sqrt(Math.max(0, b.ukPct * b.ukPct - ukr * ukr));
      const k = S / b.srMva;
      const rPu = (ukr / 100) * k;
      const xPu = (ux / 100) * k;
      const xT = ux / 100;
      const unLow = Math.min(buses[i].unKv, buses[j].unKv);
      const kt = b.applyKt ? (0.95 * cMaxOf(unLow)) / (1 + 0.6 * xT) : 1;
      const z1 = scale(cx(rPu, xPu), kt);
      addSeries(Y1, i, j, inv(z1));
      const zT0 = scale(cx(rPu, xPu), kt * b.z0ToZ1);
      const znPu = (ohm: number, un: number) => (3 * ohm * S) / (un * un);
      let zeroNote = "";
      if (b.group === "Dyn") {
        const zz = add(zT0, cx(znPu(b.neutralToOhm, buses[j].unKv), 0));
        addShunt(Y0, j, inv(zz));
        zeroNote = "zero-sequence: shunt to earth on the 'to' side (Delta on 'from' side)";
      } else if (b.group === "YNd") {
        const zz = add(zT0, cx(znPu(b.neutralFromOhm, buses[i].unKv), 0));
        addShunt(Y0, i, inv(zz));
        zeroNote = "zero-sequence: shunt to earth on the 'from' side (Delta on 'to' side)";
      } else if (b.group === "YNyn") {
        const zz = add(zT0, cx(znPu(b.neutralFromOhm, buses[i].unKv) + znPu(b.neutralToOhm, buses[j].unKv), 0));
        addSeries(Y0, i, j, inv(zz));
        zeroNote = "zero-sequence: passes through (both sides earthed star)";
      } else {
        zeroNote = "zero-sequence: blocked (no earthed winding)";
      }
      note(
        `${b.name} (transformer): ZT = uk·Sbase/Sr: ukr = ${f2(ukr, 3)} %, ux = ${f2(ux, 3)} %; KT = 0.95·cmax/(1+0.6·xT) = ${f2(kt, 4)}; ZT·KT = ${zStr(z1, 5)} pu; ${zeroNote}.`
      );
    }
  }

  return { Z1: invertMatrix(Y1), Z0: invertMatrix(Y0), shunts, lines, warnings };
}

// ----------------------------------------------------------------------------
// Main analysis
// ----------------------------------------------------------------------------

export function analyseShortCircuit(net: ScNetwork): ScResult {
  const { buses, settings } = net;
  if (buses.length === 0) return { buses: [], elementLines: [], warnings: [] };
  const mx = build(net, "max");
  const mn = build(net, "min");
  const S = S_BASE_MVA;
  const out: BusResult[] = [];
  const sqrt3 = Math.sqrt(3);

  buses.forEach((bus, k) => {
    const un = Math.max(bus.unKv, 1e-6);
    const { cMax, cMin } = voltageFactor(un, settings.lvTolerancePct);
    const iBase = S / (sqrt3 * un); // kA
    const zBase = (un * un) / S; // Ω
    const z1 = mx.Z1[k][k];
    const z0 = mx.Z0[k][k];
    const energised = abs(z1) < NOT_ENERGISED;

    const empty: BusResult = {
      busId: bus.id, name: bus.name, unKv: bus.unKv, energised: false, cMax, cMin, z1Pu: null, z1Ohm: null,
      rToX: 0, kappa: 0, ip: 0, ib: 0, ith: 0, m: 0, ik3: 0, ik2: 0, ikLG: null, ikLLG: null, ieLLG: null,
      ik3Min: 0, ik2Min: 0, ikLGMin: null, contributions: [], ratingKa: bus.ratingKa, ratingOk: null, maxIk: 0,
      steps: [`${bus.name}: no source is connected to this bus (check open ties and branch connections), so there is no fault current.`],
    };
    if (!energised) {
      out.push(empty);
      return;
    }

    // --- Maximum case ------------------------------------------------------
    const i3pu = cMax / abs(z1);
    const ik3 = i3pu * iBase;
    const rx = z1.im > 1e-12 ? z1.re / z1.im : 10;
    const kappa = peakFactor(rx);
    const ip = kappa * Math.SQRT2 * ik3;
    const m = thermalM(kappa, settings.frequencyHz, settings.tkS);
    const ith = ik3 * Math.sqrt(m + 1);

    // Contributions: bus-voltage change at each source from a fault current injected at k
    const ifc = div(cx(cMax), z1);
    const contributions: Contribution[] = [];
    let ibPhasor = cx(0);
    const ibaseOf = (bi: number) => S / (sqrt3 * Math.max(buses[bi].unKv, 1e-6));
    for (const s of mx.shunts) {
      const vs = mul(mx.Z1[s.busIdx][k], ifc);
      const ii = mul(s.y1, vs);
      const ikAtFault = abs(ii) * iBase;
      let mu = 1;
      if (s.kind === "Generator") {
        const g = net.gens.find((q) => q.id === s.srcId);
        if (g) {
          const irG = g.srMva / (sqrt3 * g.urKv);
          const ikG = abs(ii) * ibaseOf(s.busIdx);
          mu = muFactor(ikG / irG, settings.tminS);
        }
      }
      contributions.push({ name: s.name, kind: s.kind, ikKa: ikAtFault, mu });
      ibPhasor = add(ibPhasor, scale(ii, mu));
    }
    const ib = abs(ibPhasor) * iBase;

    // Unbalanced faults (Z2 = Z1)
    const ik2 = ((cMax * sqrt3) / (2 * abs(z1))) * iBase;
    const hasEarth = abs(z0) < NOT_ENERGISED;
    let ikLG: number | null = null;
    let ikLLG: number | null = null;
    let ieLLG: number | null = null;
    if (hasEarth) {
      ikLG = ((3 * cMax) / abs(add(scale(z1, 2), z0))) * iBase;
      const par = div(mul(z1, z0), add(z1, z0));
      const ia1 = div(cx(cMax), add(z1, par));
      const ia2 = scale(div(mul(ia1, z0), add(z1, z0)), -1);
      const ia0 = scale(div(mul(ia1, z1), add(z1, z0)), -1);
      const ib_ = add(add(mul(A2_OP, ia1), mul(A_OP, ia2)), ia0);
      const ic_ = add(add(mul(A_OP, ia1), mul(A2_OP, ia2)), ia0);
      ikLLG = Math.max(abs(ib_), abs(ic_)) * iBase;
      ieLLG = 3 * abs(ia0) * iBase;
    }

    // --- Minimum case ------------------------------------------------------
    const z1n = mn.Z1[k][k];
    const z0n = mn.Z0[k][k];
    const ik3Min = (cMin / abs(z1n)) * iBase;
    const ik2Min = ((cMin * sqrt3) / (2 * abs(z1n))) * iBase;
    const ikLGMin = abs(z0n) < NOT_ENERGISED ? ((3 * cMin) / abs(add(scale(z1n, 2), z0n))) * iBase : null;

    const maxIk = Math.max(ik3, ikLG ?? 0);
    const ratingOk = bus.ratingKa > 0 ? bus.ratingKa >= maxIk : null;

    // --- Manual-calculation steps ----------------------------------------
    const zOhm = scale(z1, zBase);
    const steps: string[] = [
      `1. Voltage factor: Un = ${f2(un, 3)} kV → cmax = ${f2(cMax, 2)}, cmin = ${f2(cMin, 2)} (IEC 60909-0 Table 1).`,
      `2. Thevenin positive-sequence impedance at the bus (all sources, transformers and cables combined by network reduction): Z1 = ${zStr(z1, 5)} pu = ${zStr(zOhm, 5)} Ω (|Z1| = ${f2(abs(zOhm), 5)} Ω), R/X = ${f2(rx, 3)}.`,
      `3. Initial symmetrical current: Ik″ = c·Un/(√3·|Z1|) = ${f2(cMax, 2)}×${f2(un, 3)}/(1.7321×${f2(abs(zOhm), 5)}) = ${f2(ik3, 2)} kA.`,
      `4. Peak factor: κ = 1.02 + 0.98·e^(−3R/X) = 1.02 + 0.98·e^(−3×${f2(rx, 3)}) = ${f2(kappa, 3)}; ip = κ·√2·Ik″ = ${f2(kappa, 3)}×1.4142×${f2(ik3, 2)} = ${f2(ip, 2)} kA.`,
    ];
    if (contributions.length > 1 || contributions.some((c2) => c2.kind === "Generator")) {
      steps.push(
        `5. Source contributions to Ik″ (current division from the impedance matrix): ${contributions
          .map((c2) => `${c2.name} ${f2(c2.ikKa, 2)} kA (μ = ${f2(c2.mu, 2)})`)
          .join("; ")}.`
      );
    } else {
      steps.push(`5. Single source in the fault path: far-from-generator, so μ = 1 and Ib = Ik″.`);
    }
    steps.push(
      `6. Breaking current: Ib = Σ μ·Ik″(source) = ${f2(ib, 2)} kA (tmin = ${f2(settings.tminS, 2)} s; motor decay not credited — conservative).`,
      `7. Thermal equivalent: m = (e^(4·f·Tk·ln(κ−1)) − 1)/(2·f·Tk·ln(κ−1)) = ${f2(m, 4)} for f = ${settings.frequencyHz} Hz, Tk = ${f2(settings.tkS, 2)} s; n = 1 (conservative); Ith = Ik″·√(m+n) = ${f2(ik3, 2)}×√(${f2(m, 4)}+1) = ${f2(ith, 2)} kA.`,
      `8. Line-to-line: Ik2″ = √3/2 · Ik″ (Z2 = Z1) = ${f2(ik2, 2)} kA.`
    );
    if (hasEarth && ikLG !== null) {
      steps.push(
        `9. Zero-sequence impedance at the bus: Z0 = ${zStr(z0, 5)} pu. Line-to-earth: Ik1″ = √3·c·Un/|Z1+Z2+Z0| = 3·c/|2Z1+Z0| × Ibase = ${f2(ikLG, 2)} kA.`,
        `10. Line-line-earth: largest phase current = ${f2(ikLLG ?? 0, 2)} kA, earth current 3I0 = ${f2(ieLLG ?? 0, 2)} kA.`
      );
    } else {
      steps.push(`9. No zero-sequence (earth-return) path to this bus — earth-fault current is not available (check transformer vector groups and earthing).`);
    }
    steps.push(
      `${hasEarth ? 11 : 10}. Minimum case (cmin = ${f2(cMin, 2)}, motors neglected, cables at 80 °C): Ik″min = ${f2(ik3Min, 2)} kA (3-phase), ${f2(ik2Min, 2)} kA (line-to-line)${ikLGMin !== null ? `, ${f2(ikLGMin, 2)} kA (line-to-earth)` : ""}.`
    );
    if (bus.ratingKa > 0) {
      steps.push(
        `Rating check: switchgear rating ${f2(bus.ratingKa, 1)} kA ${ratingOk ? "≥" : "<"} maximum Ik″ ${f2(maxIk, 2)} kA → ${ratingOk ? "ADEQUATE" : "INADEQUATE"}.`
      );
    }

    out.push({
      busId: bus.id, name: bus.name, unKv: bus.unKv, energised: true, cMax, cMin, z1Pu: z1, z1Ohm: zOhm, rToX: rx, kappa,
      ik3, ip, ib, ith, m, ik2, ikLG, ikLLG, ieLLG, ik3Min, ik2Min, ikLGMin, contributions,
      ratingKa: bus.ratingKa, ratingOk, maxIk, steps,
    });
  });

  return { buses: out, elementLines: mx.lines, warnings: mx.warnings };
}
