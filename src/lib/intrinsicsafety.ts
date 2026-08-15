// Intrinsic Safety (IS) Verification — Entity Concept per IEC 60079-11 /
// IEC 60079-14 (system design). Compares associated-apparatus (barrier)
// parameters against intrinsically-safe (field) apparatus parameters plus
// field-wiring capacitance/inductance, the standard "entity concept" check
// used to combine IS apparatus without a full system (control-drawing)
// certification. Designed from scratch, cross-checked against a
// manufacturer's own published entity-parameter control drawing (Pepperl+Fuchs
// KCD2-STC-EX1.HC control drawing 116-0394) and multiple independent
// entity-concept worksheets. No equivalent module in the source app.

export type GasGroup = "IIA" | "IIB" | "IIC";

export interface IsInput {
  // Associated apparatus (barrier / isolator) — from its IS certificate
  voc: number | null; // Uo, V
  isc: number | null; // Io, mA
  po: number | null; // Po, mW — leave null if not stated on the certificate
  ca: number | null; // Co, µF
  la: number | null; // Lo, mH

  // Intrinsically safe apparatus (field device) — from its IS certificate
  ui: number | null; // Vmax, V
  ii: number | null; // Imax, mA
  pi: number | null; // Pmax, mW — leave null if not stated
  ci: number; // Ci, nF
  li: number; // Li, µH

  gasGroup: GasGroup;

  // Field wiring
  cableLengthM: number | null;
  cableCapPfPerM: number; // pF/m — default matches the common "unknown cable" assumption
  cableIndUhPerM: number; // µH/m
}

export const DEFAULT_IS_INPUT: IsInput = {
  voc: 28,
  isc: 93,
  po: 650,
  ca: 0.083,
  la: 4.2,
  ui: 30,
  ii: 130,
  pi: 1000,
  ci: 5,
  li: 0,
  gasGroup: "IIC",
  cableLengthM: 500,
  // 60 pF/ft and 0.2 µH/ft are the standard "unknown cable" defaults used
  // industry-wide (e.g. Pepperl+Fuchs control drawings) when the actual
  // cable's per-length capacitance/inductance isn't available.
  cableCapPfPerM: 197, // ≈60 pF/ft
  cableIndUhPerM: 0.656, // ≈0.2 µH/ft
};

export interface IsResult {
  voltageOk: boolean | null;
  currentOk: boolean | null;
  powerOk: boolean | null; // null = not checked (Po or Pi not provided)
  cableCapTotalNf: number;
  cableIndTotalUh: number;
  totalCiNf: number; // field device Ci + cable capacitance
  totalLiUh: number; // field device Li + cable inductance
  onePercentRuleApplies: boolean; // true → use full Co/Lo; false → halve both
  effectiveCoUf: number | null;
  effectiveLoMh: number | null;
  capacitanceOk: boolean | null;
  inductanceOk: boolean | null;
  overallPass: boolean | null;
}

export function calcIntrinsicSafety(input: IsInput): IsResult {
  const { voc, isc, po, ca, la, ui, ii, pi, ci, li, cableLengthM, cableCapPfPerM, cableIndUhPerM } = input;

  const voltageOk = voc != null && ui != null ? voc <= ui : null;
  const currentOk = isc != null && ii != null ? isc <= ii : null;
  const powerOk = po != null && pi != null ? po <= pi : null;

  const L = cableLengthM ?? 0;
  const cableCapTotalNf = (cableCapPfPerM * L) / 1000; // pF -> nF
  const cableIndTotalUh = cableIndUhPerM * L;

  const totalCiNf = ci + cableCapTotalNf;
  const totalLiUh = li + cableIndTotalUh;

  // IEC 60079-14 "1% rule": the full Co/Lo values from the entity-parameter
  // table may be used if the field-side Li (excluding cable) is < 1% of Lo,
  // OR the field-side Ci (excluding cable) is < 1% of Co. If neither holds,
  // both Co and Lo are halved before the comparison.
  const liPct = la != null && la > 0 ? li / (la * 1000) : 0; // la is mH -> µH
  const ciPct = ca != null && ca > 0 ? ci / (ca * 1000) : 0; // ca is µF -> nF
  const onePercentRuleApplies = liPct < 0.01 || ciPct < 0.01;

  const effectiveCoUf = ca != null ? (onePercentRuleApplies ? ca : ca / 2) : null;
  const effectiveLoMh = la != null ? (onePercentRuleApplies ? la : la / 2) : null;

  const capacitanceOk = effectiveCoUf != null ? effectiveCoUf * 1000 >= totalCiNf : null; // µF -> nF
  const inductanceOk = effectiveLoMh != null ? effectiveLoMh * 1000 >= totalLiUh : null; // mH -> µH

  const checks = [voltageOk, currentOk, powerOk, capacitanceOk, inductanceOk];
  const anyChecked = checks.some((c) => c !== null);
  const overallPass = anyChecked ? checks.every((c) => c !== false) : null;

  return {
    voltageOk,
    currentOk,
    powerOk,
    cableCapTotalNf,
    cableIndTotalUh,
    totalCiNf,
    totalLiUh,
    onePercentRuleApplies,
    effectiveCoUf,
    effectiveLoMh,
    capacitanceOk,
    inductanceOk,
    overallPass,
  };
}
