// Battery & DC System Sizing — IEEE 485 (vented/VRLA lead-acid duty-cycle
// section method) plus an IEEE 946-style practical charger-sizing addition.
// Ported and verified from the AJ Apps Suite's `Battery` module.
//
// IEEE 485 defines the calculation method, not the capacity-rating (Kt)
// table itself — that is specific to each battery product and must come
// from the manufacturer's own published data sheet. The default Kt table
// below is illustrative only, not real product data.

export interface BattPeriod {
  current: number; // A
  duration: number; // min
}

export interface BattRandomLoad {
  label: string;
  current: number; // A
  duration: number; // min
}

export interface BattKtPoint {
  t: number; // min
  kt: number; // capacity-rating factor
}

export interface BatteryInput {
  // Free
  periods: BattPeriod[];
  randomLoads: BattRandomLoad[]; // subscriber, but kept in one input type
  ktTable: BattKtPoint[];
  tempCF: number;
  agingCF: number;
  marginCF: number;

  // Subscriber
  sysV: number;
  vNomCell: number;
  vEqCell: number;
  vEodCell: number;
  eqMaxV: number;
  eqMinV: number;
  chgLoad: number; // A, continuous steady-state DC load
  chgTime: number; // hr, target recharge time
  chgEff: number; // recharge efficiency factor
}

export const DEFAULT_BATTERY_INPUT: BatteryInput = {
  periods: [
    { current: 5, duration: 15 },
    { current: 35, duration: 10 },
    { current: 15, duration: 75 },
    { current: 45, duration: 10 },
  ],
  randomLoads: [],
  ktTable: [
    { t: 1, kt: 0.8 },
    { t: 5, kt: 1.15 },
    { t: 15, kt: 1.75 },
    { t: 30, kt: 2.35 },
    { t: 60, kt: 3.1 },
    { t: 120, kt: 4.6 },
    { t: 480, kt: 11.5 },
  ],
  tempCF: 1.0,
  agingCF: 1.25,
  marginCF: 1.1,
  sysV: 125,
  vNomCell: 2.17,
  vEqCell: 2.33,
  vEodCell: 1.75,
  eqMaxV: 140,
  eqMinV: 105,
  chgLoad: 5,
  chgTime: 12,
  chgEff: 1.15,
};

function ktAt(t: number, table: BattKtPoint[]): number {
  if (!table.length) return 0;
  const sorted = [...table].sort((a, b) => a.t - b.t);
  if (t <= sorted[0].t) return sorted[0].kt;
  if (t >= sorted[sorted.length - 1].t) return sorted[sorted.length - 1].kt;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i],
      b = sorted[i + 1];
    if (t >= a.t && t <= b.t) {
      const frac = (t - a.t) / (b.t - a.t);
      return a.kt + frac * (b.kt - a.kt);
    }
  }
  return sorted[sorted.length - 1].kt;
}

export interface BattSectionRow {
  section: number;
  i: number;
  t: number; // cumulative minutes
  kt: number;
  a: number; // required section capacity
}

function computeSections(periods: BattPeriod[], ktTable: BattKtPoint[]) {
  if (!periods.length) return null;
  let cum = 0;
  const secs = periods.map((p) => {
    cum += p.duration || 0;
    return { i: p.current || 0, t: cum };
  });
  let prevI = 0,
    prevA = 0,
    prevT = 0;
  const rows: BattSectionRow[] = [];
  secs.forEach((s, idx) => {
    const ktj = ktAt(s.t, ktTable);
    let aj: number;
    if (idx === 0) {
      aj = s.i * ktj;
    } else {
      const ktPrev = ktAt(prevT, ktTable);
      aj = prevA * (ktPrev > 0 ? ktj / ktPrev : 1) + (s.i - prevI) * ktj;
    }
    rows.push({ section: idx + 1, i: s.i, t: s.t, kt: ktj, a: aj });
    prevI = s.i;
    prevA = aj;
    prevT = s.t;
  });
  let maxRow = rows[0];
  rows.forEach((r) => {
    if (r.a > maxRow.a) maxRow = r;
  });
  return { rows, maxA: maxRow.a, maxSection: maxRow.section };
}

export interface BatteryResult {
  rows: BattSectionRow[];
  maxA: number;
  maxSection: number;
  randomSum: number;
  uncorrected: number;
  final: number;

  // subscriber
  cell: {
    nCells: number;
    vEqString: number;
    eqPass: boolean | null;
    vEodString: number;
    eodPass: boolean | null;
  } | null;
  charger: {
    dischargedAh: number;
    rechargeA: number;
    totalChgA: number;
  } | null;
}

export function calcBattery(input: BatteryInput, premiumEnabled: boolean): BatteryResult | null {
  const periods = input.periods.filter((p) => p.duration > 0);
  const ktTable = input.ktTable.filter((k) => k.t > 0);
  const sectionResult = computeSections(periods, ktTable);
  if (!sectionResult) return null;

  const randomLoads = premiumEnabled ? input.randomLoads.filter((r) => r.duration > 0) : [];
  const randomSum = randomLoads.reduce((s, r) => s + (r.current || 0) * ktAt(r.duration, ktTable), 0);

  const tempCF = input.tempCF || 1,
    agingCF = input.agingCF || 1,
    marginCF = input.marginCF || 1;
  const uncorrected = sectionResult.maxA + randomSum;
  const final = uncorrected * tempCF * agingCF * marginCF;

  let cell: BatteryResult["cell"] = null;
  let charger: BatteryResult["charger"] = null;

  if (premiumEnabled) {
    const sysV = input.sysV,
      vNom = input.vNomCell || 2.0,
      vEq = input.vEqCell || 2.33,
      vEod = input.vEodCell || 1.75;
    if (sysV > 0 && vNom > 0) {
      const nCells = Math.round(sysV / vNom);
      const vEqString = nCells * vEq;
      const vEodString = nCells * vEod;
      cell = {
        nCells,
        vEqString,
        eqPass: input.eqMaxV > 0 ? vEqString <= input.eqMaxV : null,
        vEodString,
        eodPass: input.eqMinV > 0 ? vEodString >= input.eqMinV : null,
      };
    }

    const contLoad = input.chgLoad,
      rechargeTime = input.chgTime || 12,
      chgEff = input.chgEff || 1.15;
    const dischargedAh = final; // assumes the Kt table (and hence `final`) is expressed in Ah
    const rechargeA = rechargeTime > 0 ? (dischargedAh / rechargeTime) * chgEff : 0;
    charger = { dischargedAh, rechargeA, totalChgA: contLoad + rechargeA };
  }

  return {
    rows: sectionResult.rows,
    maxA: sectionResult.maxA,
    maxSection: sectionResult.maxSection,
    randomSum,
    uncorrected,
    final,
    cell,
    charger,
  };
}
