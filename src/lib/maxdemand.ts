// Maximum Demand calculator — load-category demand-factor method.
// General practice per IEC 60439-style guidance: each load category has its
// own demand factor (not every fitting/appliance/motor in a category runs
// at full rated power simultaneously), summed to a diversified maximum
// demand, then converted to a design current and matched to standard
// breaker and transformer sizes.

export type Phase = "1ph" | "3ph";

export interface CategoryKey {
  key: string;
  label: string;
  defaultDF: number; // %
}

export const CATEGORIES: CategoryKey[] = [
  { key: "lighting", label: "Lighting", defaultDF: 90 },
  { key: "sockets", label: "Socket Outlets", defaultDF: 70 },
  { key: "hvac", label: "HVAC / AC", defaultDF: 80 },
  { key: "heating", label: "Heating / Water Heating", defaultDF: 100 },
  { key: "motors", label: "Motors", defaultDF: 75 },
  { key: "cooking", label: "Cooking", defaultDF: 50 },
  { key: "ev", label: "EV Charging", defaultDF: 100 },
  { key: "other", label: "Other", defaultDF: 100 },
];

export const BREAKERS = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320, 400, 500, 630, 800, 1000, 1250, 1600];
export const XFMR_SIZES = [100, 160, 200, 315, 500, 630, 800, 1000, 1250, 1600, 2000];

export function pickBreaker(minA: number): number | null {
  return BREAKERS.find((b) => b >= minA) ?? null;
}
export function pickTransformer(minKva: number): number | null {
  return XFMR_SIZES.find((s) => s >= minKva) ?? null;
}

export interface CategoryInput {
  key: string;
  loadKw: number;
  dfPct: number;
}

export interface CategoryRow {
  key: string;
  label: string;
  loadKw: number;
  dfPct: number;
  demandKw: number;
}

export interface MaxDemandInput {
  supplyVoltage: number;
  phase: Phase;
  powerFactor: number;
  categories: CategoryInput[];

  // subscriber: multi-board site aggregation
  premiumEnabled: boolean;
  numBoards: number;
  siteDiversityPct: number;
  growthMarginPct: number;
}

export interface MaxDemandResult {
  rows: CategoryRow[];
  totalConnectedKw: number;
  totalDemandKw: number;
  effectiveDfPct: number | null;
  currentA: number | null;
  recommendedBreaker: number | null;

  site: {
    siteMdKw: number;
    transformerKva: number;
    recommendedTransformer: number | null;
  } | null;
}

export function calcMaxDemand(input: MaxDemandInput): MaxDemandResult {
  const rows: CategoryRow[] = input.categories.map((c) => {
    const cat = CATEGORIES.find((x) => x.key === c.key);
    const demandKw = c.loadKw * (c.dfPct / 100);
    return { key: c.key, label: cat?.label ?? c.key, loadKw: c.loadKw, dfPct: c.dfPct, demandKw };
  });

  const totalConnectedKw = rows.reduce((s, r) => s + r.loadKw, 0);
  const totalDemandKw = rows.reduce((s, r) => s + r.demandKw, 0);
  const effectiveDfPct = totalConnectedKw > 0 ? (totalDemandKw / totalConnectedKw) * 100 : null;

  let currentA: number | null = null;
  if (totalDemandKw > 0 && input.supplyVoltage) {
    currentA =
      input.phase === "3ph"
        ? (totalDemandKw * 1000) / (Math.sqrt(3) * input.supplyVoltage * input.powerFactor)
        : (totalDemandKw * 1000) / (input.supplyVoltage * input.powerFactor);
  }
  const recommendedBreaker = currentA !== null ? pickBreaker(currentA) : null;

  let site: MaxDemandResult["site"] = null;
  if (input.premiumEnabled && totalDemandKw > 0) {
    const n = Math.max(1, Math.round(input.numBoards || 1));
    const siteMdKw = n * totalDemandKw * (input.siteDiversityPct / 100);
    const kvaBase = input.powerFactor > 0 ? siteMdKw / input.powerFactor : siteMdKw;
    const transformerKva = kvaBase * (1 + input.growthMarginPct / 100);
    site = { siteMdKw, transformerKva, recommendedTransformer: pickTransformer(transformerKva) };
  }

  return { rows, totalConnectedKw, totalDemandKw, effectiveDfPct, currentA, recommendedBreaker, site };
}

export const DEFAULT_MAXDEMAND_INPUT: MaxDemandInput = {
  supplyVoltage: 400,
  phase: "3ph",
  powerFactor: 0.9,
  categories: CATEGORIES.map((c) => ({ key: c.key, loadKw: 0, dfPct: c.defaultDF })),
  premiumEnabled: false,
  numBoards: 1,
  siteDiversityPct: 90,
  growthMarginPct: 20,
};
