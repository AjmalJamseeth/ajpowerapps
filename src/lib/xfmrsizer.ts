// Transformer Sizer — sizes a new transformer (or an N-1 redundant pair/
// group) from connected load, growth/safety margins, ambient + altitude
// derating, and standard kVA ratings (ANSI/IEEE or IEC preferred sizes).
// Distinct from `genxfmr.ts`'s Transformer tab, which analyzes the
// losses/efficiency/regulation of an EXISTING transformer from test data
// rather than sizing a new one from load — no equivalent "size from load"
// module exists in the source app, so this was designed from scratch.
//
// Ambient derating: IEC 60076-1 §4.2 / IEC 60076-2 §5.1 define the
// standard reference service conditions used for a transformer's rated
// (nameplate) capacity: max ambient 40°C, 30°C monthly average of the
// hottest month, 20°C yearly average — so the 40°C reference point used
// here is IEC-standard-aligned, not an arbitrary number. The 1.25%-per-°C
// derating rate above that reference, however, is a commonly cited
// engineering rule of thumb (consistent with IEEE C57.96 dry-type
// guidance) — the standards' own loading guides (IEC 60076-7 for
// oil-immersed, IEC 60076-12 for dry-type) instead model this via a full
// hot-spot-temperature/insulation-aging thermal calculation that depends
// on cooling class and load-cycle shape, which is out of scope here.
// Always confirm against the specific manufacturer's thermal rating curve.
//
// Altitude derating: IEC 60076-2 §6.3.2 (liquid-immersed) reduces the
// permitted temperature-rise limit above 1000m — by 1K per 400m for
// naturally-cooled types (ONAN) and 1K per 250m for forced-cooled types
// (ONAF/OFAF) — and IEC 60076-11 (dry-type) applies an analogous
// altitude correction in 500m steps. CAVEAT: converting that
// temperature-rise-limit reduction into an equivalent load-capacity
// derating percentage is common manufacturer/application-guide practice,
// not a figure the standards state directly — the rates used here
// (0.4%/100m natural-cooled, 0.5%/100m forced-cooled, both above 1000m)
// are commonly published approximations; always confirm against the
// specific manufacturer's altitude correction table.
//
// N-1 redundancy: with `totalUnits` (N) identical transformers installed,
// any (N−1) of them must be able to carry the full design load alone —
// so each unit is sized for design load ÷ (N−1). N=2 (the common
// "1-for-1" redundant pair) makes each unit carry 100% of the load.

export type LoadMethod = "kw" | "kva";
export type StandardBasis = "ansi" | "iec";
export type CoolingClass = "oil_onan" | "oil_onaf" | "dry_an" | "dry_af";

export const COOLING_CLASS_LABEL: Record<CoolingClass, string> = {
  oil_onan: "Oil-Immersed, Natural Cooling (ONAN)",
  oil_onaf: "Oil-Immersed, Forced-Air Cooling (ONAF/OFAF)",
  dry_an: "Dry-Type, Natural Air (AN)",
  dry_af: "Dry-Type, Forced Air (AF)",
};
const NATURAL_COOLING: Record<CoolingClass, boolean> = { oil_onan: true, oil_onaf: false, dry_an: true, dry_af: false };
const ALTITUDE_RATE_PCT_PER_100M = 0.4; // natural-cooled (ONAN, dry AN)
const ALTITUDE_RATE_PCT_PER_100M_FORCED = 0.5; // forced-cooled (ONAF/OFAF, dry AF)

// Common ANSI/IEEE (C57.12.00-style) standard three-phase distribution
// transformer kVA ratings.
export const STD_XFMR_KVA_ANSI = [15, 30, 45, 75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 3750, 5000, 7500, 10000];
// IEC 60076-1 preferred-number (R10 series) three-phase kVA ratings.
export const STD_XFMR_KVA_IEC = [25, 50, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000];

function stdSizes(basis: StandardBasis): number[] {
  return basis === "iec" ? STD_XFMR_KVA_IEC : STD_XFMR_KVA_ANSI;
}
function roundUpXfmr(val: number, basis: StandardBasis): number {
  const list = stdSizes(basis);
  const s = list.find((s) => s >= val);
  return s === undefined ? list[list.length - 1] : s;
}

export interface XfmrSizerInput {
  loadMethod: LoadMethod;
  connectedKw: number | null;
  connectedKva: number | null;
  powerFactor: number;
  growthMarginPct: number;
  safetyMarginPct: number;
  ambientC: number;
  altitudeM: number;
  coolingClass: CoolingClass;
  standardBasis: StandardBasis;
  totalUnits: number; // N — any (N-1) must carry the full load
}

export const DEFAULT_XFMRSIZER_INPUT: XfmrSizerInput = {
  loadMethod: "kw",
  connectedKw: 800,
  connectedKva: null,
  powerFactor: 0.9,
  growthMarginPct: 15,
  safetyMarginPct: 10,
  ambientC: 45,
  altitudeM: 1000,
  coolingClass: "oil_onan",
  standardBasis: "ansi",
  totalUnits: 2,
};

export interface XfmrSizerResult {
  designLoadKva: number;
  marginedLoadKva: number;
  ambientDerateFactor: number;
  altitudeDerateFactor: number;
  totalDerateFactor: number;
  effectiveRequiredKva: number;
  perUnitRequiredKva: number;
  recommendedKva: number;
  totalInstalledKva: number;
  redundantUnitsRequired: number; // N-1
}

export function calcXfmrSizer(input: XfmrSizerInput): XfmrSizerResult | null {
  const designLoadKva = input.loadMethod === "kw" ? (input.connectedKw && input.powerFactor > 0 ? input.connectedKw / input.powerFactor : null) : input.connectedKva;
  if (designLoadKva == null || designLoadKva <= 0) return null;

  const marginedLoadKva = designLoadKva * (1 + input.growthMarginPct / 100) * (1 + input.safetyMarginPct / 100);

  const ambientDerateFactor = Math.max(0.5, 1 - Math.max(0, input.ambientC - 40) * 0.0125);

  const isNatural = NATURAL_COOLING[input.coolingClass];
  const altitudeRate = isNatural ? ALTITUDE_RATE_PCT_PER_100M : ALTITUDE_RATE_PCT_PER_100M_FORCED;
  const altitudeDerateFactor = Math.max(0.5, 1 - (altitudeRate / 100) * (Math.max(0, input.altitudeM - 1000) / 100));

  const totalDerateFactor = ambientDerateFactor * altitudeDerateFactor;
  const effectiveRequiredKva = marginedLoadKva / totalDerateFactor;

  const n = Math.max(1, Math.round(input.totalUnits || 1));
  const redundantUnitsRequired = Math.max(1, n - 1);
  const perUnitRequiredKva = effectiveRequiredKva / redundantUnitsRequired;

  const recommendedKva = roundUpXfmr(perUnitRequiredKva, input.standardBasis);
  const totalInstalledKva = recommendedKva * n;

  return { designLoadKva, marginedLoadKva, ambientDerateFactor, altitudeDerateFactor, totalDerateFactor, effectiveRequiredKva, perUnitRequiredKva, recommendedKva, totalInstalledKva, redundantUnitsRequired };
}
