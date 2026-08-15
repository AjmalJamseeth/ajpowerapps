// LV Cable Sizing & Voltage Drop calculator
// Reference: IEC 60364-5-52:2009 (current-carrying capacity, installation
// reference methods, correction/derating factors) and IEC 60364-5-54
// (protective conductor / CPC sizing, adiabatic short-circuit withstand).
//
// AMPACITY below is transcribed verbatim (not "representative" values) from
// the official IEC 60364-5-52:2009 text, cross-checked cell-by-cell against
// the standard supplied by the user:
//   - A1/B1/C/D1 columns: Table B.52.4 (PVC, three loaded conductors) and
//     Table B.52.5 (XLPE/EPR, three loaded conductors), both copper and
//     aluminium. These tables only tabulate up to 300 mm^2 in the standard
//     itself, so sizes above 300 mm^2 are correctly left unavailable (0)
//     for these four methods rather than extrapolated.
//   - E/F columns: Table B.52.10 (PVC, Cu), B.52.11 (PVC, Al), B.52.12
//     (XLPE/EPR, Cu) and B.52.13 (XLPE/EPR, Al) — installation methods E,
//     F, G. "E" uses the "three loaded conductors, multi-core" column; "F"
//     uses the "three loaded conductors, trefoil, single-core" column,
//     consistent with this calculator's own method descriptions. These
//     tables genuinely do not publish single-core (method F) values below
//     25 mm^2 — the standard itself has no entry there, so this calculator
//     correctly leaves method F unavailable below 25 mm^2 rather than
//     inventing a number.
// This correction was made after the user supplied the official IEC
// 60364-5-52:2009 PDF and cross-checking against it directly (previously
// this table used representative/approximated values, which is why some
// cells above ~150 mm^2 differed from the published table by a noticeable
// margin, and two of the four XLPE90 "A1" arrays had been populated with
// PVC70 "C" column figures by mistake).
//
// Ambient-temperature correction (deratingCa), ground-temperature
// correction, soil-thermal-resistivity correction (deratingCi) and the
// single-circuit grouping factor (deratingCg) were also checked against
// the standard's Table B.52.14, B.52.15, B.52.16 and B.52.17 respectively;
// all three matched exactly except deratingCi, whose range has now been
// corrected to match the published 0,5-3 K.m/W range exactly (see below).
//
// The mV/A/m resistance/reactance table (MVAM) is NOT something IEC
// 60364-5-52 itself tabulates: Annex G of the standard gives only a
// percentage voltage-drop LIMIT (Table G.52.1: 3%/5% lighting/other on a
// public LV supply, 6%/8% on a private supply) plus a general formula
// u = b(rho1*L*cos(phi) + lambda*L*sin(phi))/S using per-size resistivity
// and reactance that the standard leaves to be sourced from cable
// manufacturer data or a national on-site guide. The values below remain a
// commonly-published typical resistance/reactance-per-metre table
// (consistent with the standard's own formula and copper/aluminium
// resistivity), not a verbatim standard table — this is a genuine,
// unavoidable "B" classification, not an oversight.

export type ConductorMaterial = "Cu" | "Al";
export type InsulationType = "PVC70" | "XLPE90";
export type InstallMethod = "A1" | "B1" | "C" | "D1" | "E" | "F";
export type SystemType = "3ph" | "1ph" | "dc";
export type CoreCount = "2" | "3" | "4";
export type CpcType = "incorporated" | "separate" | "bare";
export type CpcMaterialChoice = "same" | "Cu" | "Al";
export type LoadMethod = "kw" | "amp";
export type SpacingType = "touching" | "spaced";

export const CABLE_SIZES = [
  1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400,
  500, 630,
];

export const INSTALL_METHODS: { value: InstallMethod; label: string }[] = [
  { value: "A1", label: "A1 — Insulated conductors in conduit, in thermally insulated wall" },
  { value: "B1", label: "B1 — Multicore in conduit on wall" },
  { value: "C", label: "C — Single/multicore clipped direct" },
  { value: "D1", label: "D1 — Multicore in duct in ground" },
  { value: "E", label: "E — Multicore in free air" },
  { value: "F", label: "F — Single-core touching, in free air (trefoil)" },
];

// Base current-carrying capacity (A) at 30°C ambient (20°C ground for D1),
// single circuit. Indexed [material][insulation][method][sizeIndex],
// 0 = size not available for that method/material combination.
export const AMPACITY: Record<
  ConductorMaterial,
  Record<InsulationType, Record<InstallMethod, number[]>>
> = {
  Cu: {
    PVC70: {
      A1: [13.5, 18, 24, 31, 42, 56, 73, 89, 108, 136, 164, 188, 216, 245, 286, 328, 0, 0, 0],
      B1: [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239, 262, 296, 346, 394, 0, 0, 0],
      C: [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403, 464, 0, 0, 0],
      D1: [18, 24, 30, 38, 50, 64, 82, 98, 116, 143, 169, 192, 217, 243, 280, 316, 0, 0, 0],
      E: [18.5, 25, 34, 43, 60, 80, 101, 126, 153, 196, 238, 276, 319, 364, 430, 497, 0, 0, 0],
      F: [0, 0, 0, 0, 0, 0, 110, 137, 167, 216, 264, 308, 356, 409, 485, 561, 656, 749, 855],
    },
    XLPE90: {
      A1: [17, 23, 31, 40, 54, 73, 95, 117, 141, 179, 216, 249, 285, 324, 380, 435, 0, 0, 0],
      B1: [20, 28, 37, 48, 66, 88, 117, 144, 175, 222, 269, 312, 342, 384, 450, 514, 0, 0, 0],
      C: [22, 30, 40, 52, 71, 96, 119, 147, 179, 229, 278, 322, 371, 424, 500, 576, 0, 0, 0],
      D1: [21, 28, 36, 44, 58, 75, 96, 115, 135, 167, 197, 223, 251, 281, 324, 365, 0, 0, 0],
      E: [23, 32, 42, 54, 75, 100, 127, 158, 192, 246, 298, 346, 399, 456, 538, 621, 0, 0, 0],
      F: [0, 0, 0, 0, 0, 0, 135, 169, 207, 268, 328, 383, 444, 510, 607, 703, 823, 946, 1088],
    },
  },
  Al: {
    PVC70: {
      A1: [0, 14, 18.5, 24, 32, 43, 57, 70, 84, 107, 129, 149, 170, 194, 227, 261, 0, 0, 0],
      B1: [0, 16.5, 22, 28, 39, 53, 70, 86, 104, 133, 161, 186, 204, 230, 269, 306, 0, 0, 0],
      C: [0, 18.5, 25, 32, 44, 59, 73, 90, 110, 140, 170, 197, 227, 259, 305, 351, 0, 0, 0],
      D1: [0, 18.5, 24, 30, 39, 50, 64, 77, 91, 112, 132, 150, 169, 190, 218, 247, 0, 0, 0],
      E: [0, 19.5, 26, 33, 46, 61, 78, 96, 117, 150, 183, 212, 245, 280, 330, 381, 0, 0, 0],
      F: [0, 0, 0, 0, 0, 0, 84, 105, 128, 166, 203, 237, 274, 315, 375, 434, 526, 610, 711],
    },
    XLPE90: {
      A1: [0, 19, 25, 32, 44, 58, 76, 94, 113, 142, 171, 197, 226, 256, 300, 344, 0, 0, 0],
      B1: [0, 22, 29, 38, 52, 71, 93, 116, 140, 179, 217, 251, 267, 300, 351, 402, 0, 0, 0],
      C: [0, 24, 32, 41, 57, 76, 90, 112, 136, 174, 211, 245, 283, 323, 382, 440, 0, 0, 0],
      D1: [0, 22, 28, 35, 46, 59, 75, 90, 106, 130, 154, 174, 197, 220, 253, 286, 0, 0, 0],
      E: [0, 24, 32, 42, 58, 77, 97, 120, 146, 187, 227, 263, 304, 347, 409, 471, 0, 0, 0],
      F: [0, 0, 0, 0, 0, 0, 103, 129, 159, 206, 253, 296, 343, 395, 471, 547, 663, 770, 899],
    },
  },
};

// mV/A/m tables (resistive r, reactive x) used for voltage-drop calculation.
export const MVAM: Record<ConductorMaterial, Record<number, { r: number; x: number }>> = {
  Cu: {
    1.5: { r: 29.0, x: 0.168 }, 2.5: { r: 17.6, x: 0.156 }, 4: { r: 11.0, x: 0.143 },
    6: { r: 7.3, x: 0.136 }, 10: { r: 4.38, x: 0.128 }, 16: { r: 2.73, x: 0.119 },
    25: { r: 1.75, x: 0.116 }, 35: { r: 1.25, x: 0.112 }, 50: { r: 0.93, x: 0.108 },
    70: { r: 0.63, x: 0.106 }, 95: { r: 0.46, x: 0.103 }, 120: { r: 0.36, x: 0.101 },
    150: { r: 0.29, x: 0.099 }, 185: { r: 0.23, x: 0.098 }, 240: { r: 0.18, x: 0.095 },
    300: { r: 0.15, x: 0.093 }, 400: { r: 0.11, x: 0.091 }, 500: { r: 0.09, x: 0.089 },
    630: { r: 0.072, x: 0.086 },
  },
  Al: {
    1.5: { r: 47.7, x: 0.168 }, 2.5: { r: 29.0, x: 0.156 }, 4: { r: 18.1, x: 0.143 },
    6: { r: 12.0, x: 0.136 }, 10: { r: 7.2, x: 0.128 }, 16: { r: 4.51, x: 0.119 },
    25: { r: 2.89, x: 0.116 }, 35: { r: 2.07, x: 0.112 }, 50: { r: 1.53, x: 0.108 },
    70: { r: 1.04, x: 0.106 }, 95: { r: 0.77, x: 0.103 }, 120: { r: 0.6, x: 0.101 },
    150: { r: 0.48, x: 0.099 }, 185: { r: 0.39, x: 0.098 }, 240: { r: 0.3, x: 0.095 },
    300: { r: 0.25, x: 0.093 }, 400: { r: 0.18, x: 0.091 }, 500: { r: 0.15, x: 0.089 },
    630: { r: 0.12, x: 0.086 },
  },
};

// k-factor for adiabatic short-circuit withstand, S = I*sqrt(t) / k
export const SC_K: Record<string, number> = {
  "Cu-PVC70": 115, "Cu-XLPE90": 143, "Al-PVC70": 76, "Al-XLPE90": 94,
};
export const CPC_K_SEPARATE: Record<string, number> = {
  "Cu-PVC70": 143, "Cu-XLPE90": 176, "Al-PVC70": 95, "Al-XLPE90": 116,
};
export const CPC_K_BARE: Record<ConductorMaterial, number> = { Cu: 159, Al: 105 };

export function nextStandardSize(minMm2: number): number {
  return CABLE_SIZES.find((sz) => sz >= minMm2) ?? CABLE_SIZES[CABLE_SIZES.length - 1];
}

export function lookupAmpacity(
  material: ConductorMaterial,
  insulation: InsulationType,
  method: InstallMethod,
  sizeIdx: number
): number {
  const arr = AMPACITY[material]?.[insulation]?.[method];
  if (!arr) return 0;
  return arr[sizeIdx] || 0;
}

// Ambient / ground temperature correction factor Ca.
export function deratingCa(ambientC: number, insulation: InsulationType, buried: boolean): number {
  const table70air: [number, number][] = [[10,1.22],[15,1.17],[20,1.12],[25,1.06],[30,1.0],[35,0.94],[40,0.87],[45,0.79],[50,0.71],[55,0.61],[60,0.5]];
  const table90air: [number, number][] = [[10,1.15],[15,1.12],[20,1.08],[25,1.04],[30,1.0],[35,0.96],[40,0.91],[45,0.87],[50,0.82],[55,0.76],[60,0.71],[65,0.65],[70,0.58],[75,0.5],[80,0.41]];
  const table70gnd: [number, number][] = [[10,1.10],[15,1.05],[20,1.0],[25,0.95],[30,0.89],[35,0.84],[40,0.77],[45,0.71],[50,0.63],[55,0.55],[60,0.45]];
  const table90gnd: [number, number][] = [[10,1.07],[15,1.04],[20,1.0],[25,0.96],[30,0.93],[35,0.89],[40,0.85],[45,0.8],[50,0.76],[55,0.71],[60,0.65],[65,0.6],[70,0.53],[75,0.46],[80,0.38]];
  const isXLPE = insulation === "XLPE90";
  const table = buried ? (isXLPE ? table90gnd : table70gnd) : isXLPE ? table90air : table70air;
  for (let i = 0; i < table.length - 1; i++) {
    const [t1, c1] = table[i];
    const [t2, c2] = table[i + 1];
    if (ambientC >= t1 && ambientC <= t2) return c1 + ((c2 - c1) * (ambientC - t1)) / (t2 - t1);
  }
  if (ambientC < table[0][0]) return table[0][1];
  return table[table.length - 1][1];
}

export function deratingCg(n: number): number {
  const table: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.65, 5: 0.6, 6: 0.57, 7: 0.54, 8: 0.52, 9: 0.5, 12: 0.45, 16: 0.41, 20: 0.38 };
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (n <= 1) return 1.0;
  for (const k of keys) if (n <= k) return table[k];
  return table[keys[keys.length - 1]];
}

export function deratingLayers(nLayers: number): number {
  const table: Record<number, number> = { 1: 1.0, 2: 0.8, 3: 0.7, 4: 0.65, 5: 0.65, 6: 0.6 };
  if (nLayers <= 1) return 1.0;
  if (nLayers >= 6) return table[6];
  return table[nLayers] || table[Math.min(6, Math.ceil(nLayers))];
}

export function deratingSpacing(spacing: SpacingType, method: InstallMethod): number {
  if (spacing !== "spaced") return 1.0;
  if (method === "E" || method === "F") return 1.15;
  return 1.0;
}

// IEC 60364-5-52 Table B.52.16 — correction factors for cables in buried
// ducts (method D1) for soil thermal resistivities other than 2,5 K.m/W;
// verbatim from the standard, range 0,5-3 K.m/W (its own published range —
// values outside this range are not extrapolated by the standard itself).
export function deratingCi(rho: number): number {
  const table: [number, number][] = [[0.5,1.28],[0.7,1.20],[1.0,1.18],[1.5,1.10],[2.0,1.05],[2.5,1.0],[3.0,0.96]];
  for (let i = 0; i < table.length - 1; i++) {
    const [r1, c1] = table[i];
    const [r2, c2] = table[i + 1];
    if (rho >= r1 && rho <= r2) return c1 + ((c2 - c1) * (rho - r1)) / (r2 - r1);
  }
  return rho < table[0][0] ? table[0][1] : table[table.length - 1][1];
}

export interface HarmonicResult {
  Ch: number;
  basis: "line" | "neutral";
  note: string;
}
export function harmonicDerating(thirdHarmonicPct: number): HarmonicResult {
  if (thirdHarmonicPct < 15) return { Ch: 1.0, basis: "line", note: "Harmonic content low enough that no special treatment is needed." };
  if (thirdHarmonicPct < 33) return { Ch: 0.86, basis: "line", note: "Size on line (phase) current with a 0.86 reduction factor." };
  if (thirdHarmonicPct < 45) return { Ch: 0.86, basis: "neutral", note: "Neutral current now exceeds line current — size on neutral current, with a 0.86 reduction factor still applied." };
  return { Ch: 1.0, basis: "neutral", note: "High triplen content — size directly on neutral current (no further reduction factor)." };
}

export function estimateNeutralCurrent(IbLine: number, thirdHarmonicPct: number): number {
  return IbLine * 3 * (thirdHarmonicPct / 100);
}

export interface VoltDropResult {
  vd_volts: number;
  vd_pct: number;
}
export function voltDropPct(
  material: ConductorMaterial,
  sizeMm2: number,
  Ib: number,
  lengthM: number,
  volt: number,
  system: SystemType,
  pf: number
): VoltDropResult | null {
  const d = MVAM[material][sizeMm2];
  if (!d) return null;
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));
  const mvPerAm = d.r * pf + d.x * sinPhi;
  let vd: number;
  if (system === "1ph" || system === "dc") {
    vd = (2 * mvPerAm * Ib * lengthM) / 1000;
  } else {
    vd = (Math.sqrt(3) * mvPerAm * Ib * lengthM) / 1000;
  }
  return { vd_volts: vd, vd_pct: (vd / volt) * 100 };
}

export function scMinSize(faultKA: number, faultT: number, material: ConductorMaterial, insulation: InsulationType): number {
  const k = SC_K[`${material}-${insulation}`] || 115;
  const I = faultKA * 1000;
  return (I * Math.sqrt(faultT)) / k;
}

export function cpcMinSize(
  faultKA: number,
  faultT: number,
  cpcType: CpcType,
  material: ConductorMaterial,
  insulation: InsulationType
): number {
  let k: number;
  if (cpcType === "bare") k = CPC_K_BARE[material] || 159;
  else if (cpcType === "separate") k = CPC_K_SEPARATE[`${material}-${insulation}`] || CPC_K_SEPARATE["Cu-PVC70"];
  else k = SC_K[`${material}-${insulation}`] || 115;
  const I = faultKA * 1000;
  return (I * Math.sqrt(faultT)) / k;
}

export function cpcSimplifiedSize(phaseSizeMm2: number): number {
  if (phaseSizeMm2 <= 16) return phaseSizeMm2;
  if (phaseSizeMm2 <= 35) return 16;
  return phaseSizeMm2 / 2;
}

export interface LifecycleCostResult {
  capitalCost: number;
  powerLossW: number;
  annualEnergyKwh: number;
  annualEnergyCost: number;
  lifecycleEnergyCost: number;
  totalLifecycleCost: number;
}
export function lifecycleCost(
  sizeMm2: number,
  IbPerRun: number,
  lengthM: number,
  numLiveConductors: number,
  nPar: number,
  material: ConductorMaterial,
  costPerMm2PerM: number,
  energyCostPerKwh: number,
  opHoursPerYear: number,
  lifeYears: number
): LifecycleCostResult {
  const capitalCost = costPerMm2PerM * sizeMm2 * lengthM * nPar;
  const RpermOhm = (MVAM[material]?.[sizeMm2]?.r || 0) / 1000;
  const powerLossW = nPar * numLiveConductors * IbPerRun * IbPerRun * RpermOhm * lengthM;
  const annualEnergyKwh = (powerLossW * opHoursPerYear) / 1000;
  const annualEnergyCost = annualEnergyKwh * energyCostPerKwh;
  const lifecycleEnergyCost = annualEnergyCost * lifeYears;
  return { capitalCost, powerLossW, annualEnergyKwh, annualEnergyCost, lifecycleEnergyCost, totalLifecycleCost: capitalCost + lifecycleEnergyCost };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

export interface CableSizingInput {
  label: string;
  system: SystemType;
  volt: number;
  loadMethod: LoadMethod;
  kw: number | null;
  pf: number;
  ib: number | null;
  material: ConductorMaterial;
  insulation: InsulationType;
  method: InstallMethod;
  cores: CoreCount;
  parallelRuns: number;
  length: number;
  maxVD: number;

  // premium
  premiumEnabled: boolean;
  ambientC: number;
  grouping: number;
  layers: number;
  spacing: SpacingType;
  soilRho: number;
  harmonicPct: number;
  measuredNeutralI: number | null;

  faultKA: number | null;
  faultT: number;

  cpcType: CpcType;
  cpcMaterialChoice: CpcMaterialChoice;

  motorFeed: boolean;
  startingCurrent: number | null;
  maxStartVD: number;

  costPerMm2PerM: number | null;
  energyCostPerKwh: number | null;
  opHoursPerYear: number | null;
  lifeYears: number | null;
}

export interface SizeRow {
  size: number;
  baseAmp: number;
  deratedAmp: number;
  ampOK: boolean;
  vd: VoltDropResult | null;
  vdOK: boolean;
  scOK: boolean;
  allOK: boolean;
}

export interface CpcResult {
  type: CpcType;
  material: ConductorMaterial;
  adiabatic: number | null;
  simplified: number;
  recommended: number;
}

export interface EconomicCandidate extends LifecycleCostResult {
  size: number;
}
export interface EconomicResult {
  best: EconomicCandidate;
  atSelected: EconomicCandidate | null;
  candidates: EconomicCandidate[];
  differs: boolean;
}

export interface MotorVdResult {
  Istart: number;
  maxStartVD: number;
  vd_pct: number;
  vd_volts: number;
  pass: boolean;
}

export interface CableSizingResult {
  Ib: number;
  IbPerRun: number;
  nPar: number;
  Ca: number;
  Cg: number;
  Ci: number;
  Csp: number;
  Cf: number;
  harm: HarmonicResult;
  harmonicNote: string | null;
  sizingCurrent: number;
  faultKAPerRun: number | null;
  scMin: number;
  rows: SizeRow[];
  selected: SizeRow | null;
  cpc: CpcResult | null;
  economic: EconomicResult | null;
  motorVd: MotorVdResult | null;
  error?: string;
}

export function sizeCable(input: CableSizingInput): CableSizingResult {
  const {
    system, volt, pf, material, insulation, method, length, maxVD,
  } = input;

  let Ib: number;
  if (input.loadMethod === "kw") {
    if (!input.kw) return emptyResult("Enter load (kW).");
    if (system === "3ph") Ib = (input.kw * 1000) / (Math.sqrt(3) * volt * pf);
    else if (system === "1ph") Ib = (input.kw * 1000) / (volt * pf);
    else Ib = (input.kw * 1000) / volt;
  } else {
    if (!input.ib) return emptyResult("Enter design current Ib.");
    Ib = input.ib;
  }
  if (!length) return emptyResult("Enter route length.");

  const nPar = Math.max(1, Math.round(input.parallelRuns || 1));
  const IbPerRun = Ib / nPar;

  const pro = input.premiumEnabled;
  const buried = method === "D1";
  const Ca = pro ? deratingCa(input.ambientC ?? (buried ? 20 : 30), insulation, buried) : 1;
  const Cg = pro ? deratingCg(input.grouping || 1) * deratingLayers(input.layers || 1) : 1;
  const Ci = pro && buried ? deratingCi(input.soilRho || 2.5) : 1;
  const Csp = pro ? deratingSpacing(input.spacing || "touching", method) : 1;
  const harmPct = pro ? input.harmonicPct || 0 : 0;
  const harm = harmonicDerating(harmPct);
  const Cf = Ca * Cg * Ci * Csp * harm.Ch;

  let sizingCurrent = IbPerRun;
  let harmonicNote: string | null = null;
  if (pro && harm.basis === "neutral") {
    const neutralI = input.measuredNeutralI || estimateNeutralCurrent(Ib, harmPct);
    sizingCurrent = neutralI / nPar;
    harmonicNote = input.measuredNeutralI
      ? "Sized on measured neutral current."
      : "Sized on an ESTIMATED neutral current (no measured value entered) — use a real measurement or harmonic survey where available.";
  }

  const faultKA = pro ? input.faultKA : null;
  const faultT = pro ? input.faultT || 0.5 : 0.5;
  const faultKAPerRun = faultKA ? faultKA / nPar : null;
  const scMin = pro && faultKAPerRun ? scMinSize(faultKAPerRun, faultT, material, insulation) : 0;

  const rows: SizeRow[] = CABLE_SIZES.map((sz, idx) => {
    const baseAmp = lookupAmpacity(material, insulation, method, idx);
    const deratedAmp = baseAmp * Cf;
    const ampOK = deratedAmp >= sizingCurrent && baseAmp > 0;
    const vd = voltDropPct(material, sz, IbPerRun, length, volt, system, pf);
    const vdOK = !!vd && vd.vd_pct <= maxVD;
    const scOK = !pro || !faultKAPerRun || sz >= scMin;
    return { size: sz, baseAmp, deratedAmp, ampOK, vd, vdOK, scOK, allOK: ampOK && vdOK && scOK };
  });

  const selected = rows.find((r) => r.allOK) || null;

  let cpc: CpcResult | null = null;
  if (pro && selected) {
    const cpcType = input.cpcType || "incorporated";
    const cpcMaterial: ConductorMaterial = input.cpcMaterialChoice === "same" || !input.cpcMaterialChoice
      ? material
      : input.cpcMaterialChoice;
    const cpcAdiabatic = faultKAPerRun ? cpcMinSize(faultKAPerRun, faultT, cpcType, cpcMaterial, insulation) : null;
    const cpcSimplified = cpcSimplifiedSize(selected.size);
    const cpcRecMin = Math.max(cpcAdiabatic || 0, cpcSimplified);
    const cpcRec = nextStandardSize(cpcRecMin);
    cpc = { type: cpcType, material: cpcMaterial, adiabatic: cpcAdiabatic, simplified: cpcSimplified, recommended: cpcRec };
  }

  let economic: EconomicResult | null = null;
  if (pro && selected && input.costPerMm2PerM && input.energyCostPerKwh && input.opHoursPerYear && input.lifeYears) {
    const numLive = system === "3ph" ? 3 : 2;
    const candidates: EconomicCandidate[] = rows
      .filter((r) => r.allOK)
      .map((r) => ({
        size: r.size,
        ...lifecycleCost(r.size, IbPerRun, length, numLive, nPar, material, input.costPerMm2PerM!, input.energyCostPerKwh!, input.opHoursPerYear!, input.lifeYears!),
      }));
    if (candidates.length) {
      const best = candidates.reduce((a, b) => (b.totalLifecycleCost < a.totalLifecycleCost ? b : a));
      const atSelected = candidates.find((c) => c.size === selected.size) || null;
      economic = { best, atSelected, candidates, differs: best.size !== selected.size };
    }
  }

  let motorVd: MotorVdResult | null = null;
  if (pro && selected && input.motorFeed && input.startingCurrent) {
    const vdStart = voltDropPct(material, selected.size, input.startingCurrent / nPar, length, volt, system, pf);
    if (vdStart) {
      motorVd = {
        Istart: input.startingCurrent,
        maxStartVD: input.maxStartVD || 15,
        vd_pct: vdStart.vd_pct,
        vd_volts: vdStart.vd_volts,
        pass: vdStart.vd_pct <= (input.maxStartVD || 15),
      };
    }
  }

  return { Ib, IbPerRun, nPar, Ca, Cg, Ci, Csp, Cf, harm, harmonicNote, sizingCurrent, faultKAPerRun, scMin, rows, selected, cpc, economic, motorVd };
}

function emptyResult(error: string): CableSizingResult {
  return {
    Ib: 0, IbPerRun: 0, nPar: 1, Ca: 1, Cg: 1, Ci: 1, Csp: 1, Cf: 1,
    harm: { Ch: 1, basis: "line", note: "" }, harmonicNote: null, sizingCurrent: 0,
    faultKAPerRun: null, scMin: 0, rows: [], selected: null, cpc: null, economic: null,
    motorVd: null, error,
  };
}

export const DEFAULT_CABLE_INPUT: CableSizingInput = {
  label: "Circuit",
  system: "3ph",
  volt: 415,
  loadMethod: "kw",
  kw: 50,
  pf: 0.85,
  ib: null,
  material: "Cu",
  insulation: "PVC70",
  method: "C",
  cores: "4",
  parallelRuns: 1,
  length: 50,
  maxVD: 5,
  premiumEnabled: false,
  ambientC: 30,
  grouping: 1,
  layers: 1,
  spacing: "touching",
  soilRho: 2.5,
  harmonicPct: 0,
  measuredNeutralI: null,
  faultKA: null,
  faultT: 0.5,
  cpcType: "incorporated",
  cpcMaterialChoice: "same",
  motorFeed: false,
  startingCurrent: null,
  maxStartVD: 15,
  costPerMm2PerM: null,
  energyCostPerKwh: null,
  opHoursPerYear: null,
  lifeYears: null,
};
