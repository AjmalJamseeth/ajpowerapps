// Conduit Fill — NEC Chapter 9 Table 1/4/5 (US) and IEC/BS 7671 space-factor
// method (conduit 45% / trunking 40%). Ported and verified from the AJ Apps
// Suite's `ConduitFill` module. Entirely free — no subscriber gating in the
// source app.

export type ConduitType = "EMT" | "RMC" | "IMC" | "PVC40" | "PVC80" | "FMC" | "LFMC" | "ENT";
export type WireInsulation = "THHN" | "TW" | "THW_THHW" | "XHHW" | "RHW";
export type WireSize = 14 | 12 | 10 | 8 | 6 | 4 | 3 | 2 | 1 | "1/0" | "2/0" | "3/0" | "4/0" | 250 | 300 | 350 | 400 | 500;
export type IecShape = "conduit" | "trunking";

// NEC Chapter 9 Table 4 — total (100%) internal area, in², by conduit type & trade size
export const NEC_CONDUIT: Record<ConduitType, Record<string, number>> = {
  EMT: { "1/2": 0.304, "3/4": 0.533, "1": 0.864, "1-1/4": 1.496, "1-1/2": 2.036, "2": 3.356, "2-1/2": 5.858, "3": 8.846, "3-1/2": 11.545, "4": 14.753 },
  RMC: { "1/2": 0.314, "3/4": 0.549, "1": 0.887, "1-1/4": 1.526, "1-1/2": 2.071, "2": 3.408, "2-1/2": 4.866, "3": 7.499, "3-1/2": 10.01, "4": 12.882, "5": 20.212, "6": 29.158 },
  IMC: { "1/2": 0.342, "3/4": 0.586, "1": 0.959, "1-1/4": 1.647, "1-1/2": 2.225, "2": 3.63, "2-1/2": 5.135, "3": 7.922, "3-1/2": 10.584, "4": 13.631 },
  PVC40: { "1/2": 0.285, "3/4": 0.508, "1": 0.832, "1-1/4": 1.453, "1-1/2": 1.986, "2": 3.291, "2-1/2": 4.695, "3": 7.268, "3-1/2": 9.737, "4": 12.554, "5": 19.761, "6": 28.567 },
  PVC80: { "1/2": 0.217, "3/4": 0.409, "1": 0.688, "1-1/4": 1.237, "1-1/2": 1.711, "2": 2.874, "2-1/2": 4.119, "3": 6.442, "3-1/2": 8.688, "4": 11.258, "5": 17.855, "6": 25.598 },
  FMC: { "3/8": 0.116, "1/2": 0.317, "3/4": 0.533, "1": 0.817, "1-1/4": 1.277, "1-1/2": 1.858, "2": 3.269, "2-1/2": 4.909, "3": 7.069, "3-1/2": 9.621, "4": 12.566 },
  LFMC: { "3/8": 0.192, "1/2": 0.314, "3/4": 0.541, "1": 0.873, "1-1/4": 1.528, "1-1/2": 1.981, "2": 3.246, "2-1/2": 4.881, "3": 7.475, "3-1/2": 9.731, "4": 12.692 },
  ENT: { "1/2": 0.246, "3/4": 0.454, "1": 0.785, "1-1/4": 1.41, "1-1/2": 1.936, "2": 3.205 },
};
export const TRADE_SIZE_ORDER = ["3/8", "1/2", "3/4", "1", "1-1/4", "1-1/2", "2", "2-1/2", "3", "3-1/2", "4", "5", "6"];

// NEC Chapter 9 Table 5 — conductor area, in², by insulation family & size
export const NEC_WIRE: Record<WireInsulation, Record<string, number>> = {
  THHN: { 14: 0.0097, 12: 0.0133, 10: 0.0211, 8: 0.0366, 6: 0.0507, 4: 0.0824, 3: 0.0973, 2: 0.1158, 1: 0.1562, "1/0": 0.1855, "2/0": 0.2223, "3/0": 0.2679, "4/0": 0.3237, 250: 0.397, 300: 0.4608, 350: 0.5242, 400: 0.5863, 500: 0.7073 },
  TW: { 14: 0.0139, 12: 0.0181, 10: 0.0243, 8: 0.0437, 6: 0.0726, 4: 0.0973, 3: 0.1134, 2: 0.1333, 1: 0.1901, "1/0": 0.2223, "2/0": 0.2624, "3/0": 0.3117, "4/0": 0.3718, 250: 0.4596, 300: 0.5281, 350: 0.5958, 400: 0.6619, 500: 0.7901 },
  THW_THHW: { 14: 0.0139, 12: 0.0181, 10: 0.0243, 8: 0.0437, 6: 0.0726, 4: 0.0973, 3: 0.1134, 2: 0.1333, 1: 0.1901, "1/0": 0.2223, "2/0": 0.2624, "3/0": 0.3117, "4/0": 0.3718, 250: 0.4596, 300: 0.5281, 350: 0.5958, 400: 0.6619, 500: 0.7901 },
  XHHW: { 14: 0.0139, 12: 0.0181, 10: 0.0243, 8: 0.0437, 6: 0.059, 4: 0.0814, 3: 0.0962, 2: 0.1146, 1: 0.1534, "1/0": 0.1825, "2/0": 0.219, "3/0": 0.2642, "4/0": 0.3197, 250: 0.3904, 300: 0.4536, 350: 0.5166, 400: 0.5782, 500: 0.6984 },
  RHW: { 14: 0.0293, 12: 0.0353, 10: 0.0437, 8: 0.0835, 6: 0.1041, 4: 0.1333, 3: 0.1521, 2: 0.175, 1: 0.266, "1/0": 0.3039, "2/0": 0.3505, "3/0": 0.4072, "4/0": 0.4754, 250: 0.6291, 300: 0.7088, 350: 0.787, 400: 0.8626, 500: 1.0082 },
};
export const WIRE_SIZE_ORDER: WireSize[] = [14, 12, 10, 8, 6, 4, 3, 2, 1, "1/0", "2/0", "3/0", "4/0", 250, 300, 350, 400, 500];

export interface NecWireRow {
  insulation: WireInsulation;
  size: WireSize;
  qty: number;
}
export interface IecCableRow {
  diaMm: number | null;
  qty: number;
}

export interface ConduitFillInput {
  standard: "nec" | "iec";
  necConduitType: ConduitType;
  necTradeSize: string;
  necWires: NecWireRow[];
  iecShape: IecShape;
  iecBoreDiaMm: number | null;
  iecWidthMm: number | null;
  iecHeightMm: number | null;
  iecCables: IecCableRow[];
}

export const DEFAULT_CONDUITFILL_INPUT: ConduitFillInput = {
  standard: "nec",
  necConduitType: "EMT",
  necTradeSize: "3/4",
  necWires: [
    { insulation: "THHN", size: 12, qty: 6 },
    { insulation: "THHN", size: 12, qty: 0 },
    { insulation: "THHN", size: 12, qty: 0 },
  ],
  iecShape: "conduit",
  iecBoreDiaMm: 20,
  iecWidthMm: null,
  iecHeightMm: null,
  iecCables: [
    { diaMm: 8.6, qty: 3 },
    { diaMm: null, qty: 0 },
    { diaMm: null, qty: 0 },
  ],
};

export interface NecFillResult {
  count: number;
  tierLabel: string;
  sumArea: number;
  areaTotal: number;
  maxArea: number;
  fillPct: number;
  pass: boolean;
  suggestion: string | null;
}
export interface IecFillResult {
  racewayAreaMm2: number;
  maxPct: number;
  maxAreaMm2: number;
  sumAreaMm2: number;
  fillPct: number;
  pass: boolean;
}

export function calcConduitFillNec(input: ConduitFillInput): NecFillResult | null {
  const area100 = NEC_CONDUIT[input.necConduitType]?.[input.necTradeSize];
  let count = 0,
    sumArea = 0;
  for (const row of input.necWires) {
    if (row.qty <= 0) continue;
    const a = NEC_WIRE[row.insulation]?.[String(row.size)];
    if (a != null) {
      count += row.qty;
      sumArea += a * row.qty;
    }
  }
  if (area100 == null || count === 0) return null;
  const tierPct = count === 1 ? 0.53 : count === 2 ? 0.31 : 0.4;
  const tierLabel = count === 1 ? "53% (1 conductor)" : count === 2 ? "31% (2 conductors)" : "40% (3+ conductors)";
  const maxArea = area100 * tierPct;
  const fillPct = (sumArea / area100) * 100;

  const sizes = NEC_CONDUIT[input.necConduitType] || {};
  let suggestion: string | null = null;
  for (const s of TRADE_SIZE_ORDER) {
    if (sizes[s] == null) continue;
    if (sizes[s] * tierPct >= sumArea) {
      suggestion = s;
      break;
    }
  }

  return { count, tierLabel, sumArea, areaTotal: area100, maxArea, fillPct, pass: sumArea <= maxArea, suggestion };
}

export function calcConduitFillIec(input: ConduitFillInput): IecFillResult | null {
  let racewayArea: number | null = null;
  if (input.iecShape === "conduit") {
    if (input.iecBoreDiaMm != null) racewayArea = Math.PI * Math.pow(input.iecBoreDiaMm / 2, 2);
  } else {
    if (input.iecWidthMm != null && input.iecHeightMm != null) racewayArea = input.iecWidthMm * input.iecHeightMm;
  }
  let sumArea = 0,
    any = false;
  for (const row of input.iecCables) {
    if (row.qty <= 0 || row.diaMm == null) continue;
    any = true;
    sumArea += Math.PI * Math.pow(row.diaMm / 2, 2) * row.qty;
  }
  if (racewayArea == null || !any) return null;
  const maxPct = input.iecShape === "conduit" ? 0.45 : 0.4;
  const maxArea = racewayArea * maxPct;
  const fillPct = (sumArea / racewayArea) * 100;
  return { racewayAreaMm2: racewayArea, maxPct, maxAreaMm2: maxArea, sumAreaMm2: sumArea, fillPct, pass: sumArea <= maxArea };
}
