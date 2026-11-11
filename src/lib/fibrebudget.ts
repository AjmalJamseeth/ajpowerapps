// Fibre-optic link budget: optical power budget of the transceivers against the
// loss of the fibre, connectors and splices, plus a safety margin, and the
// reach limit of the Ethernet standard (which on multimode fibre is often set by
// modal bandwidth, not by loss).

export type FibreKey = "os2_1310" | "os2_1550" | "om1_850" | "om1_1300" | "om2_850" | "om3_850" | "om4_850" | "om2_1300" | "custom";

export const FIBRES: Record<FibreKey, { label: string; att: number; mode: "SM" | "MM"; nm: number; mmClass?: "OM1" | "OM2" | "OM3" | "OM4" }> = {
  os2_1310: { label: "Single-mode OS2, 1310 nm", att: 0.4, mode: "SM", nm: 1310 },
  os2_1550: { label: "Single-mode OS2, 1550 nm", att: 0.3, mode: "SM", nm: 1550 },
  om1_850: { label: "Multimode OM1 62.5/125, 850 nm", att: 3.0, mode: "MM", nm: 850, mmClass: "OM1" },
  om1_1300: { label: "Multimode OM1 62.5/125, 1300 nm", att: 1.5, mode: "MM", nm: 1300, mmClass: "OM1" },
  om2_850: { label: "Multimode OM2 50/125, 850 nm", att: 3.0, mode: "MM", nm: 850, mmClass: "OM2" },
  om2_1300: { label: "Multimode OM2 50/125, 1300 nm", att: 1.5, mode: "MM", nm: 1300, mmClass: "OM2" },
  om3_850: { label: "Multimode OM3 50/125, 850 nm", att: 3.0, mode: "MM", nm: 850, mmClass: "OM3" },
  om4_850: { label: "Multimode OM4 50/125, 850 nm", att: 3.0, mode: "MM", nm: 850, mmClass: "OM4" },
  custom: { label: "Custom attenuation", att: 0.5, mode: "SM", nm: 1310 },
};

export type XcvrKey = "100fx" | "100lx10" | "1000sx" | "1000lx" | "1000lx10" | "1000zx" | "custom";

/** Typical transceiver figures. Reach follows the Ethernet standard; power figures are representative datasheet values — always use the actual module's datasheet. */
export const XCVRS: Record<XcvrKey, { label: string; txMin: number; txMax: number; rxSens: number; rxOverload: number; reachKm: Partial<Record<string, number>>; nm: number; mode: "SM" | "MM" | "any" }> = {
  "100fx": { label: "100BASE-FX (1300 nm, multimode)", txMin: -20, txMax: -14, rxSens: -31, rxOverload: -14, reachKm: { OM1: 2, OM2: 2, OM3: 2, OM4: 2 }, nm: 1300, mode: "MM" },
  "100lx10": { label: "100BASE-LX10 (1310 nm, single-mode)", txMin: -15, txMax: -8, rxSens: -25, rxOverload: -8, reachKm: { SM: 10 }, nm: 1310, mode: "SM" },
  "1000sx": { label: "1000BASE-SX (850 nm, multimode)", txMin: -9.5, txMax: -3, rxSens: -17, rxOverload: 0, reachKm: { OM1: 0.275, OM2: 0.55, OM3: 0.55, OM4: 0.55 }, nm: 850, mode: "MM" },
  "1000lx": { label: "1000BASE-LX (1310 nm, single-mode)", txMin: -11.5, txMax: -3, rxSens: -19, rxOverload: -3, reachKm: { SM: 5, OM1: 0.55, OM2: 0.55 }, nm: 1310, mode: "any" },
  "1000lx10": { label: "1000BASE-LX10 (1310 nm, single-mode)", txMin: -9.5, txMax: -3, rxSens: -19.5, rxOverload: -3, reachKm: { SM: 10 }, nm: 1310, mode: "SM" },
  "1000zx": { label: "1000BASE-ZX (1550 nm, vendor long-reach)", txMin: 0, txMax: 5, rxSens: -24, rxOverload: -3, reachKm: { SM: 70 }, nm: 1550, mode: "SM" },
  custom: { label: "Custom (from the datasheet)", txMin: -9.5, txMax: -3, rxSens: -19, rxOverload: -3, reachKm: {}, nm: 1310, mode: "any" },
};

export type LossBasis = "max" | "typical";
export const COMPONENT_LOSS: Record<LossBasis, { connector: number; splice: number; label: string }> = {
  max: { connector: 0.75, splice: 0.3, label: "Maximum allowed (TIA-568.3-D)" },
  typical: { connector: 0.5, splice: 0.1, label: "Typical installed (factory connectors, fusion splices)" },
};

export interface FibreBudgetInput {
  xcvr: XcvrKey;
  fibre: FibreKey;
  lengthKm: number;
  connectors: number; // mated connector pairs, including the patch panels at both ends
  splices: number;
  basis: LossBasis;
  marginDb: number;
  // editable values (filled from the presets)
  txMin: number;
  txMax: number;
  rxSens: number;
  rxOverload: number;
  attDbKm: number;
  connectorDb: number;
  spliceDb: number;
}

export const DEFAULT_FIBRE_BUDGET_INPUT: FibreBudgetInput = {
  xcvr: "1000lx",
  fibre: "os2_1310",
  lengthKm: 3.2,
  connectors: 4,
  splices: 2,
  basis: "max",
  marginDb: 3,
  txMin: XCVRS["1000lx"].txMin,
  txMax: XCVRS["1000lx"].txMax,
  rxSens: XCVRS["1000lx"].rxSens,
  rxOverload: XCVRS["1000lx"].rxOverload,
  attDbKm: FIBRES.os2_1310.att,
  connectorDb: COMPONENT_LOSS.max.connector,
  spliceDb: COMPONENT_LOSS.max.splice,
};

export interface FibreBudgetResult {
  budgetDb: number; // txMin − rxSens
  fibreLossDb: number;
  connectorLossDb: number;
  spliceLossDb: number;
  totalLossDb: number;
  marginLeftDb: number; // budget − loss − margin
  pass: boolean;
  rxMinDbm: number; // worst-case received power (txMin − total loss)
  rxMaxDbm: number; // best case (txMax − loss with no fibre ageing): fibre + components at typical
  overload: boolean;
  maxLengthByLossKm: number | null;
  reachKm: number | null; // standard reach for this fibre
  reachOk: boolean | null;
  maxLengthKm: number | null; // the smaller of the two
  notes: string[];
}

export function calcFibreBudget(i: FibreBudgetInput): FibreBudgetResult {
  const notes: string[] = [];
  const budgetDb = i.txMin - i.rxSens;
  const fibreLossDb = Math.max(0, i.lengthKm) * i.attDbKm;
  const connectorLossDb = Math.max(0, i.connectors) * i.connectorDb;
  const spliceLossDb = Math.max(0, i.splices) * i.spliceDb;
  const totalLossDb = fibreLossDb + connectorLossDb + spliceLossDb;
  const marginLeftDb = budgetDb - totalLossDb - i.marginDb;
  const rxMinDbm = i.txMin - totalLossDb;
  // overload check: strongest transmitter, lowest plausible loss (typical component losses)
  const lowLoss = Math.max(0, i.lengthKm) * i.attDbKm * 0.85 + i.connectors * 0.25 + i.splices * 0.05;
  const rxMaxDbm = i.txMax - lowLoss;
  const overload = rxMaxDbm > i.rxOverload;
  const perKm = i.attDbKm;
  const maxLengthByLossKm = perKm > 0 ? Math.max(0, (budgetDb - i.marginDb - connectorLossDb - spliceLossDb) / perKm) : null;
  const fib = FIBRES[i.fibre], xc = XCVRS[i.xcvr];
  const key = fib.mode === "SM" ? "SM" : fib.mmClass || "";
  const reachKm = i.xcvr === "custom" || i.fibre === "custom" ? null : xc.reachKm[key] ?? null;
  if (i.xcvr !== "custom" && i.fibre !== "custom") {
    if (xc.mode !== "any" && xc.mode !== fib.mode) notes.push(`${xc.label} is specified for ${xc.mode === "SM" ? "single-mode" : "multimode"} fibre; it is not specified over ${fib.mode === "SM" ? "single-mode" : "multimode"} fibre.`);
    else if (reachKm == null) notes.push(`The Ethernet standard gives no reach for ${xc.label} over ${fib.label}.`);
    if (Math.abs(xc.nm - fib.nm) > 100) notes.push(`The transceiver works at ${xc.nm} nm but the attenuation is for ${fib.nm} nm — choose the fibre row for ${xc.nm} nm.`);
    if (i.xcvr === "1000lx" && fib.mode === "MM") notes.push("1000BASE-LX over multimode fibre needs a mode-conditioning patch cord at each end.");
    if (i.xcvr === "1000zx") notes.push("1000BASE-ZX is not an IEEE 802.3 standard; reach and power figures vary by manufacturer. Short links may need an attenuator to avoid overloading the receiver.");
  }
  const reachOk = reachKm == null ? null : i.lengthKm <= reachKm + 1e-9;
  if (reachOk === false) notes.push(`${i.lengthKm} km exceeds the ${reachKm} km reach of the standard for this fibre${fib.mode === "MM" ? " — on multimode fibre the limit is modal bandwidth, so a positive power margin does not make the link work" : ""}.`);
  if (overload) notes.push(`The received power can reach ${rxMaxDbm.toFixed(1)} dBm, above the receiver overload level of ${i.rxOverload} dBm. Fit an in-line attenuator.`);
  if (marginLeftDb < 0) notes.push(`The link loss plus margin exceeds the power budget by ${(-marginLeftDb).toFixed(2)} dB.`);
  const cands = [maxLengthByLossKm, reachKm].filter((x): x is number => x != null);
  const maxLengthKm = cands.length ? Math.min(...cands) : null;
  return { budgetDb, fibreLossDb, connectorLossDb, spliceLossDb, totalLossDb, marginLeftDb, pass: marginLeftDb >= 0 && reachOk !== false && !overload, rxMinDbm, rxMaxDbm, overload, maxLengthByLossKm, reachKm, reachOk, maxLengthKm, notes };
}
