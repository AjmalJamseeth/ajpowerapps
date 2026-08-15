// Harmonic Analysis — IEEE 519-2014 Table 1 (voltage distortion limits) and
// Table 2 (current distortion limits, TDD-referenced to max demand load
// current IL). Ported and verified from the AJ Apps Suite's `Harmonics` module.

export const HARMONIC_ORDERS = [2, 3, 5, 7, 9, 11, 13] as const;
export type HarmonicOrder = (typeof HARMONIC_ORDERS)[number];

export type IscIlBand = 20 | 50 | 100 | 1000 | 9999;

interface Table1Row {
  maxKv: number;
  individual: number;
  thd: number;
}
const TABLE1: Table1Row[] = [
  { maxKv: 1.0, individual: 5.0, thd: 8.0 },
  { maxKv: 69, individual: 3.0, thd: 5.0 },
  { maxKv: 161, individual: 1.5, thd: 2.5 },
  { maxKv: Infinity, individual: 1.0, thd: 1.5 },
];

// [h<11, 11<=h<17, 17<=h<23, 23<=h<35, 35<=h<=50, TDD]
const TABLE2: Record<IscIlBand, number[]> = {
  20: [4.0, 2.0, 1.5, 0.6, 0.3, 5.0],
  50: [7.0, 3.5, 2.5, 1.0, 0.5, 8.0],
  100: [10.0, 4.5, 4.0, 1.5, 0.7, 12.0],
  1000: [12.0, 5.5, 5.0, 2.0, 1.0, 15.0],
  9999: [15.0, 7.0, 6.0, 2.5, 1.4, 20.0],
};

export const ISC_IL_BAND_LABEL: Record<IscIlBand, string> = {
  20: "< 20",
  50: "20–50",
  100: "50–100",
  1000: "100–1000",
  9999: "> 1000",
};

function table1Row(busKv: number): Table1Row {
  for (const row of TABLE1) if (busKv <= row.maxKv) return row;
  return TABLE1[TABLE1.length - 1];
}
function orderBandIndex(h: number): number {
  if (h < 11) return 0;
  if (h < 17) return 1;
  if (h < 23) return 2;
  if (h < 35) return 3;
  return 4;
}
function table2Limit(band: IscIlBand, h: number): number {
  const row = TABLE2[band] || TABLE2[50];
  let limit = row[orderBandIndex(h)];
  if (h % 2 === 0) limit *= 0.25; // even harmonics limited to 25% of odd limit
  return limit;
}
function rss(vals: number[]): number {
  return Math.sqrt(vals.reduce((s, x) => s + x * x, 0));
}

export interface HarmonicsInput {
  busVoltageKv: number;
  iscIlBand: IscIlBand;
  measuredCurrentA: number | null;
  maxDemandCurrentA: number | null;
  vPct: Record<HarmonicOrder, number>;
  iPctOfI1: Record<HarmonicOrder, number>;
  vResidualPct: number;
  iResidualPct: number;
}

export const DEFAULT_HARMONICS_INPUT: HarmonicsInput = {
  busVoltageKv: 0.4,
  iscIlBand: 50,
  measuredCurrentA: 200,
  maxDemandCurrentA: 250,
  vPct: { 2: 0.3, 3: 1.5, 5: 2.0, 7: 1.0, 9: 0.5, 11: 0.4, 13: 0.3 },
  iPctOfI1: { 2: 0.5, 3: 3.0, 5: 5.0, 7: 2.5, 9: 1.0, 11: 1.5, 13: 0.8 },
  vResidualPct: 0,
  iResidualPct: 0,
};

export interface HarmonicsResult {
  vthd: number;
  vthdPass: boolean;
  vthdLimit: number;
  worstV: { h: HarmonicOrder; pct: number } | null;
  vIndPass: boolean | null;
  vIndLimit: number;
  ithd: number;
  itdd: number | null;
  itddPass: boolean | null;
  itddLimit: number;
  worstI: { h: HarmonicOrder; tddPct: number; limit: number } | null;
  iIndPass: boolean | null;
  pro: {
    rows: { h: HarmonicOrder; pctI1: number; pctIL: number | null; limit: number; pass: boolean | null }[];
    kFactor: number;
  } | null;
}

export function calcHarmonics(input: HarmonicsInput, premiumEnabled: boolean): HarmonicsResult | null {
  const busKv = input.busVoltageKv;
  if (!busKv) return null;

  const vVals = input.vPct;
  const iVals = input.iPctOfI1;

  // --- Voltage side (Table 1) ---
  const vthd = rss([...HARMONIC_ORDERS.map((h) => vVals[h] || 0), input.vResidualPct || 0]);
  const t1 = table1Row(busKv);
  const vthdPass = vthd <= t1.thd;
  let worstV: { h: HarmonicOrder; pct: number } | null = null;
  for (const h of HARMONIC_ORDERS) {
    const pct = vVals[h] || 0;
    if (worstV === null || pct > worstV.pct) worstV = { h, pct };
  }
  const vIndPass = worstV !== null ? worstV.pct <= t1.individual : null;

  // --- Current side (Table 2, TDD-referenced) ---
  const ithd = rss([...HARMONIC_ORDERS.map((h) => iVals[h] || 0), input.iResidualPct || 0]);
  let itdd: number | null = null;
  let ratio: number | null = null;
  let itddPass: boolean | null = null;
  const tddLimit = (TABLE2[input.iscIlBand] || TABLE2[50])[5];
  if (input.measuredCurrentA && input.maxDemandCurrentA) {
    ratio = input.measuredCurrentA / input.maxDemandCurrentA;
    itdd = ithd * ratio;
    itddPass = itdd <= tddLimit;
  }

  let worstI: HarmonicsResult["worstI"] = null;
  if (ratio) {
    let bestMargin = -Infinity;
    HARMONIC_ORDERS.forEach((h) => {
      const tddPct = (iVals[h] || 0) * (ratio as number);
      const limit = table2Limit(input.iscIlBand, h);
      const margin = limit > 0 ? tddPct / limit : 0;
      if (margin > bestMargin) {
        bestMargin = margin;
        worstI = { h, tddPct, limit };
      }
    });
  }
  const iIndPass = worstI ? (worstI as { tddPct: number; limit: number }).tddPct <= (worstI as { tddPct: number; limit: number }).limit : null;

  let pro: HarmonicsResult["pro"] = null;
  if (premiumEnabled) {
    const rows = HARMONIC_ORDERS.map((h) => {
      const pctI1 = iVals[h] || 0;
      const pctIL = ratio ? pctI1 * ratio : null;
      const limit = table2Limit(input.iscIlBand, h);
      const pass = pctIL == null ? null : pctIL <= limit;
      return { h, pctI1, pctIL, limit, pass };
    });
    let kSum = 1; // h=1 term: 1^2 * 1^2
    HARMONIC_ORDERS.forEach((h) => {
      kSum += h * h * Math.pow((iVals[h] || 0) / 100, 2);
    });
    kSum += Math.pow((input.iResidualPct || 0) / 100, 2) * Math.pow(20, 2);
    pro = { rows, kFactor: kSum };
  }

  return {
    vthd,
    vthdPass,
    vthdLimit: t1.thd,
    worstV,
    vIndPass,
    vIndLimit: t1.individual,
    ithd,
    itdd,
    itddPass,
    itddLimit: tddLimit,
    worstI,
    iIndPass,
    pro,
  };
}
