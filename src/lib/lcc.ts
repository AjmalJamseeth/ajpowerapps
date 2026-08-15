// Life-Cycle Cost (LCC) — standard discounted-cash-flow engineering
// economics: LCC = initial cost + present worth of annual operating/
// maintenance costs (optionally escalating) - present worth of salvage
// value. Also computes the Equivalent Annual Cost (EAC, via the capital
// recovery factor) and a two-option comparison with simple payback —
// commonly used in electrical engineering to compare a standard vs.
// premium-efficiency option (e.g. transformer, motor, luminaire). This is
// general discounted-cash-flow / engineering-economics method (consistent
// with the approach in references such as IEEE 1013 and standard
// engineering economics texts), not a single numbered standard. Designed
// from scratch; no equivalent module in the source app.

export interface LccOptionInput {
  label: string;
  initialCost: number | null;
  annualOperatingCost: number | null; // energy + O&M, year-1 basis
  escalationRatePct: number; // annual nominal escalation of the operating cost, %
  salvageValue: number; // at end of analysis period
}

export interface LccGlobalInput {
  discountRatePct: number; // annual real/nominal discount rate, %
  analysisPeriodYears: number;
}

export const DEFAULT_LCC_GLOBAL: LccGlobalInput = {
  discountRatePct: 6,
  analysisPeriodYears: 20,
};

export const DEFAULT_LCC_OPTION_A: LccOptionInput = {
  label: "Standard efficiency",
  initialCost: 50000,
  annualOperatingCost: 12000,
  escalationRatePct: 3,
  salvageValue: 0,
};

export const DEFAULT_LCC_OPTION_B: LccOptionInput = {
  label: "Premium efficiency",
  initialCost: 68000,
  annualOperatingCost: 8500,
  escalationRatePct: 3,
  salvageValue: 0,
};

export interface LccOptionResult {
  label: string;
  presentWorthOperating: number | null;
  presentWorthSalvage: number | null;
  lcc: number | null;
  equivalentAnnualCost: number | null; // EAC = LCC x capital recovery factor
}

export function calcLccOption(opt: LccOptionInput, global: LccGlobalInput): LccOptionResult {
  const { initialCost, annualOperatingCost, escalationRatePct, salvageValue } = opt;
  const { discountRatePct, analysisPeriodYears: N } = global;

  if (initialCost == null || annualOperatingCost == null || N <= 0) {
    return { label: opt.label, presentWorthOperating: null, presentWorthSalvage: null, lcc: null, equivalentAnnualCost: null };
  }

  const r = discountRatePct / 100;
  const e = escalationRatePct / 100;

  let presentWorthOperating = 0;
  for (let t = 1; t <= N; t++) {
    const costAtT = annualOperatingCost * Math.pow(1 + e, t - 1);
    presentWorthOperating += costAtT / Math.pow(1 + r, t);
  }

  const presentWorthSalvage = salvageValue / Math.pow(1 + r, N);
  const lcc = initialCost + presentWorthOperating - presentWorthSalvage;

  // Capital recovery factor: r(1+r)^N / ((1+r)^N - 1). At r=0, CRF = 1/N.
  const crf = r === 0 ? 1 / N : (r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
  const equivalentAnnualCost = lcc * crf;

  return { label: opt.label, presentWorthOperating, presentWorthSalvage, lcc, equivalentAnnualCost };
}

export interface LccCompareResult {
  a: LccOptionResult;
  b: LccOptionResult;
  lccSavingsBvsA: number | null; // positive = B is cheaper over the life cycle
  simplePaybackYears: number | null; // extra initial cost of B recovered by B's lower year-1 operating cost
  lowerLifeCycleCostOption: "A" | "B" | null;
}

export function calcLccCompare(a: LccOptionInput, b: LccOptionInput, global: LccGlobalInput): LccCompareResult {
  const resultA = calcLccOption(a, global);
  const resultB = calcLccOption(b, global);

  let lccSavingsBvsA: number | null = null;
  let lowerLifeCycleCostOption: "A" | "B" | null = null;
  if (resultA.lcc != null && resultB.lcc != null) {
    lccSavingsBvsA = resultA.lcc - resultB.lcc;
    lowerLifeCycleCostOption = resultB.lcc < resultA.lcc ? "B" : "A";
  }

  let simplePaybackYears: number | null = null;
  if (a.initialCost != null && b.initialCost != null && a.annualOperatingCost != null && b.annualOperatingCost != null) {
    const extraInitial = b.initialCost - a.initialCost;
    const annualSavings = a.annualOperatingCost - b.annualOperatingCost;
    if (extraInitial > 0 && annualSavings > 0) {
      simplePaybackYears = extraInitial / annualSavings;
    } else if (extraInitial <= 0) {
      simplePaybackYears = 0; // B is cheaper upfront AND (if annualSavings>=0) to run — immediate payback
    }
  }

  return { a: resultA, b: resultB, lccSavingsBvsA, simplePaybackYears, lowerLifeCycleCostOption };
}
