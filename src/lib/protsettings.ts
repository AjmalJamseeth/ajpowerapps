// Arc-flash aware protection setting proposal.
//
// Combines three existing models: the IEC 60909 short-circuit network, the
// IEEE 1584-2018 arc-flash study and IDMT relay grading. The user states a
// target PPE category per bus; the solver looks for the smallest change to the
// relay settings that reaches it without breaking coordination:
//
//   1. lower the time multiplier (TMS) to the grading limit (preferred margin)
//   2. … down to the minimum allowed grading margin
//   3. lower the pickup toward the overload limit (load × factor)
//   4. add / lower an instantaneous element above the downstream maximum fault
//   5. change to a more inverse curve family member
//   6. report maintenance (arc-flash) mode as a separate temporary measure
//
// Grading is always re-checked numerically over the whole current range, so a
// proposal never silently breaks selectivity. If a target cannot be met, the
// best achievable setting is returned together with the blocking constraint
// and hardware recommendations (ZSI, arc-flash relay, bus differential...).

import { IEC_CURVES, IEEE_CURVES } from "./idmt";
import { cableDamagePoints, iecTime, ieeeTime, transformerCategoryFromKVA, transformerWithstandPointsAmps, type Pt } from "./curveEngine";
import { DEVICE_TYPE_LABEL, deviceTimeS, type DeviceEngine } from "./deviceModels";
import { analyseShortCircuit, DEFAULT_SC_NETWORK, type BusIn, type ScNetwork, type ScResult } from "./iec60909";
import { afOf, defaultBusAf, DEFAULT_MAX_ARC_MS, runScenario } from "./arcflashstudy";
import { leeBoundaryMm, leeEnergyCal, ppeForEnergy, type PpeCategory } from "./arcflash2018";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RelayDef {
  id: string;
  name: string;
  busId: string; // bus on the load side that this device clears / backs up ("" = none)
  deviceKv: number; // kV at the CT (0 = same as the bus)
  downstream: string[]; // ids of the relays this one must grade over
  loadA: number; // maximum continuous load current (primary A at the device kV); sets the pickup floor
  inrushA: number; // inrush / motor-start current (A) the instantaneous element must stay above (0 = ignore)
  curveFamily: "IEC" | "IEEE";
  curveType: string;
  pickupA: number;
  tms: number;
  instPickupA: number; // 0 = off
  instMs: number;
  breakerMs: number;
  locked: boolean; // never changed by the solver
  engine?: DeviceEngine; // fixed non-IDMT device (LSIG, thermal-magnetic, MCB, fuse, motor, DT, ...) evaluated by the shared curve engine
  damage?: DamageAsset; // asset this relay must protect: its operating time must stay below the asset's withstand curve
  bandTol?: number; // ± tolerance on the operating time used for the arc-flash clearing time (e.g. 0.2 for an LSIG band)
}

export type DamageAsset =
  | { kind: "transformer"; mva: number; zPct: number; kvLine?: number }
  | { kind: "cable"; material: "copper" | "aluminum"; insulation: "pvc" | "xlpe"; csaMm2: number };

export interface DamageCheck {
  relayId: string;
  name: string;
  asset: string;
  pass: boolean | null; // null = no overlap with the relay's operating range
  minMargin: number | null; // smallest withstand-time / total-clearing-time ratio (≥ 1 passes)
  atA: number | null;
  note: string;
}

export interface ProtOptions {
  minMarginS: number; // smallest grading margin the solver may use
  prefMarginS: number; // margin tried first
  overloadFactor: number; // pickup floor = factor × load current
  instMarginX: number; // instantaneous pickup ≥ factor × downstream maximum fault
  instMs: number; // operating time given to a new instantaneous element
  tmsMin: number;
  tmsMax: number;
  allowPickup: boolean;
  allowInst: boolean;
  allowCurve: boolean;
  allowDownstream: boolean; // may also speed up downstream relays (within their own grading limits)
  allowMaintenance: boolean;
  maintenanceMs: number;
}

export interface ProtStudy {
  net: ScNetwork;
  relays: RelayDef[];
  targets: Record<string, number>; // busId → target PPE category 0..4 (−1 = no target)
  opt: ProtOptions;
  suiteLink?: { projectName: string }; // set when the relays were imported from the Protection Coordination Workbench
  alt?: RelayDef[]; // optional second set of settings (e.g. the arc-flash consultant's proposal) to compare
}

export const TARGET_ENERGY: Record<number, number> = { 0: 1.2, 1: 4, 2: 8, 3: 25, 4: 40 };
export const targetEnergy = (cat: number | undefined) => (cat === undefined || cat < 0 ? Infinity : TARGET_ENERGY[cat] ?? Infinity);

export const DEFAULT_PROT_OPTIONS: ProtOptions = {
  minMarginS: 0.3,
  prefMarginS: 0.4,
  overloadFactor: 1.1,
  instMarginX: 1.2,
  instMs: 50,
  tmsMin: 0.025,
  tmsMax: 1.5,
  allowPickup: true,
  allowInst: true,
  allowCurve: false,
  allowDownstream: true,
  allowMaintenance: true,
  maintenanceMs: 50,
};

export const MAX_RELAYS = 8;

// ---------------------------------------------------------------------------
// Context + basic helpers
// ---------------------------------------------------------------------------

interface Ctx {
  study: ProtStudy;
  sc: ScResult;
  busById: Map<string, BusIn>;
  scById: Map<string, ScResult["buses"][number]>;
  maxMs: number;
}

export function buildCtx(study: ProtStudy, sc?: ScResult): Ctx {
  const res = sc ?? analyseShortCircuit(study.net);
  return {
    study,
    sc: res,
    busById: new Map(study.net.buses.map((b) => [b.id, b])),
    scById: new Map(res.buses.map((b) => [b.busId, b])),
    maxMs: study.net.settings.afMaxArcMs ?? DEFAULT_MAX_ARC_MS,
  };
}

export function devKv(r: RelayDef, ctx: Ctx): number {
  if (r.deviceKv > 0) return r.deviceKv;
  return ctx.busById.get(r.busId)?.unKv ?? 1;
}

/** Optimiser curve code → curve-engine key (and back). */
export const CURVE_KEY: Record<"IEC" | "IEEE", Record<string, string>> = {
  IEC: { SI: "standard_inverse", VI: "very_inverse", EI: "extremely_inverse", LTI: "long_time_inverse" },
  IEEE: { MI: "moderately_inverse", VI: "very_inverse", EI: "extremely_inverse" },
};

/** IDMT operating time from the shared curve engine (Infinity at or just above pickup, like the original relay model). */
function idmtTimeS(r: RelayDef, amps: number, tms = r.tms): number {
  const ratio = amps / Math.max(1e-6, r.pickupA);
  if (!isFinite(ratio) || ratio <= 1.0001) return Infinity;
  const key = CURVE_KEY[r.curveFamily]?.[r.curveType];
  if (!key) return Infinity;
  try {
    return r.curveFamily === "IEC" ? iecTime(key, tms, ratio) : ieeeTime(key, tms, ratio);
  } catch {
    return Infinity;
  }
}

/** Fixed devices (locked, or any non-IDMT device described by an engine) are never changed by the solver. */
export const isFixed = (r: RelayDef): boolean => r.locked || !!r.engine;

/** Relay / device operating time in seconds (curve + instantaneous), excluding the breaker. Infinity = does not operate. */
export function relayTimeS(r: RelayDef, amps: number): number {
  if (r.engine) return deviceTimeS(r.engine, amps);
  const t = idmtTimeS(r, amps);
  let out = Number.isFinite(t) ? t : Infinity;
  if (r.instPickupA > 0 && amps >= r.instPickupA) out = Math.min(out, r.instMs / 1000);
  return out;
}

const cloneRelay = (r: RelayDef): RelayDef => ({ ...r, downstream: [...r.downstream] });

function ancestorsOf(id: string, relays: RelayDef[], seen = new Set<string>()): RelayDef[] {
  const out: RelayDef[] = [];
  for (const p of relays) {
    if (p.downstream.includes(id) && !seen.has(p.id)) {
      seen.add(p.id);
      out.push(p, ...ancestorsOf(p.id, relays, seen));
    }
  }
  return out;
}

/** Relays that can clear an arc at this bus: the relays assigned to it and every upstream relay (backup). */
function servingRelays(busId: string, relays: RelayDef[]): RelayDef[] {
  const out = new Map<string, RelayDef>();
  for (const r of relays) {
    if (r.busId !== busId) continue;
    out.set(r.id, r);
    for (const a of ancestorsOf(r.id, relays)) out.set(a.id, a);
  }
  return [...out.values()];
}

function clearingFor(bus: BusIn, relays: RelayDef[], ctx: Ctx): ((iarcKa: number) => number) | null {
  const serve = servingRelays(bus.id, relays);
  if (serve.length === 0) return null;
  return (iarcKa: number) => {
    let t = Infinity;
    for (const r of serve) {
      const amps = (iarcKa * 1000 * bus.unKv) / devKv(r, ctx);
      t = Math.min(t, relayTimeS(r, amps) * (1 + (r.bandTol ?? 0)) * 1000 + r.breakerMs);
    }
    return Number.isFinite(t) ? Math.min(ctx.maxMs, t) : ctx.maxMs;
  };
}

// ---------------------------------------------------------------------------
// Arc-flash evaluation of one bus
// ---------------------------------------------------------------------------

export interface BusOutcome {
  busId: string;
  name: string;
  unKv: number;
  model: "ieee2018" | "lee" | "none";
  eCal: number;
  afbMm: number;
  ppe: PpeCategory;
  tMs: number; // clearing time at the governing arcing current
  iarcKa: number;
  iarcMinKa: number;
  ibfMaxKa: number;
  ibfMinKa: number;
  workingMm: number;
  targetCat: number;
  targetE: number;
  met: boolean | null; // null = no target or no model
  reqMs: number | null; // clearing time needed for the target at the governing current
  maintE: number | null; // incident energy in maintenance (arc-flash) mode
  relayNames: string[];
  unprotected: boolean;
}

function evalBus(bus: BusIn, relays: RelayDef[], ctx: Ctx, full = false): BusOutcome {
  const targetCat = ctx.study.targets[bus.id] ?? -1;
  const targetE = targetEnergy(targetCat);
  const r = ctx.scById.get(bus.id);
  const af = afOf(bus);
  const serve = servingRelays(bus.id, relays);
  const out: BusOutcome = {
    busId: bus.id, name: bus.name, unKv: bus.unKv, model: "none", eCal: 0, afbMm: 0, ppe: ppeForEnergy(0), tMs: 0,
    iarcKa: 0, iarcMinKa: 0, ibfMaxKa: 0, ibfMinKa: 0, workingMm: af.workingMm, targetCat, targetE, met: null,
    reqMs: null, maintE: null, relayNames: serve.map((s) => s.name), unprotected: serve.length === 0,
  };
  if (!r || !r.energised) return out;
  const nominal = ctx.study.net.settings.afNominalC ?? true;
  const ibfMax = nominal ? r.ik3Nom : r.ik3;
  const ibfMin = nominal ? r.ik3NomMin : r.ik3Min;
  out.ibfMaxKa = ibfMax;
  out.ibfMinKa = ibfMin;
  const clearing = clearingFor(bus, relays, ctx) ?? (() => ctx.maxMs);

  if (bus.unKv >= 0.208 && bus.unKv <= 15) {
    const cases = [runScenario(bus, af, ibfMax, "max", clearing)];
    if (ibfMin > 0 && Math.abs(ibfMin - ibfMax) > 1e-6) cases.push(runScenario(bus, af, ibfMin, "min", clearing));
    const gov = cases.reduce((a, b) => (b.eCal > a.eCal ? b : a));
    out.model = "ieee2018";
    out.eCal = gov.eCal;
    out.afbMm = Math.max(...cases.map((c) => c.afbMm));
    out.tMs = gov.tMs;
    out.iarcKa = gov.iarcKa;
    out.iarcMinKa = Math.min(...cases.map((c) => c.iarcMinKa));
    if (full) {
      const g = gov.res;
      if (g && Number.isFinite(targetE) && gov.eCal > targetE) {
        const t1 = g.normal.eCal > 0 ? (g.normal.tMs * targetE) / g.normal.eCal : Infinity;
        const t2 = g.reduced.eCal > 0 ? (g.reduced.tMs * targetE) / g.reduced.eCal : Infinity;
        out.reqMs = Math.min(t1, t2);
      }
      if (ctx.study.opt.allowMaintenance) {
        const fast = (i: number) => Math.min(clearing(i), ctx.study.opt.maintenanceMs);
        const mc = [runScenario(bus, af, ibfMax, "max", fast)];
        if (cases.length > 1) mc.push(runScenario(bus, af, ibfMin, "min", fast));
        out.maintE = Math.max(...mc.map((c) => c.eCal));
      }
    }
  } else if (bus.unKv > 15) {
    const t = clearing(r.ik3);
    out.model = "lee";
    out.eCal = leeEnergyCal(bus.unKv, ibfMax, t / 1000, af.workingMm);
    out.afbMm = leeBoundaryMm(bus.unKv, ibfMax, t / 1000);
    out.tMs = t;
    out.iarcKa = ibfMax;
    out.iarcMinKa = ibfMax;
  }
  out.ppe = ppeForEnergy(out.eCal);
  out.met = out.model === "none" || !Number.isFinite(targetE) ? null : out.eCal <= targetE * (1 + 1e-9);
  return out;
}

export function evaluateBuses(study: ProtStudy, relays: RelayDef[], ctx?: Ctx): BusOutcome[] {
  const c = ctx ?? buildCtx(study);
  return study.net.buses.map((b) => evalBus(b, relays, c, true));
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------

export interface GradePair {
  upId: string;
  upName: string;
  downId: string;
  downName: string;
  minMarginS: number | null;
  atDownA: number | null; // current (at the downstream device) where the margin is smallest
  rangeA: [number, number] | null;
  pass: boolean | null; // null = the curves never overlap in the checked range
  preferred: boolean | null;
}

function hiAmps(d: RelayDef, relays: RelayDef[], ctx: Ctx, depth = 0): number {
  const bus = ctx.busById.get(d.busId);
  const r = bus ? ctx.scById.get(bus.id) : undefined;
  if (bus && r && r.energised) return (r.ik3 * 1000 * bus.unKv) / devKv(d, ctx);
  if (depth < 6) {
    let m = 0;
    for (const id of d.downstream) {
      const dd = relays.find((x) => x.id === id);
      if (dd) m = Math.max(m, (hiAmps(dd, relays, ctx, depth + 1) * devKv(dd, ctx)) / devKv(d, ctx));
    }
    if (m > 0) return m;
  }
  return 20 * d.pickupA;
}

const NSAMPLE = 48;

export function gradePairs(relays: RelayDef[], ctx: Ctx): GradePair[] {
  const out: GradePair[] = [];
  for (const u of relays) {
    for (const did of u.downstream) {
      const d = relays.find((x) => x.id === did);
      if (!d) continue;
      const k = devKv(d, ctx) / devKv(u, ctx);
      const lo = d.pickupA * 1.05;
      const hi = hiAmps(d, relays, ctx);
      let minM = Infinity;
      let at: number | null = null;
      if (hi > lo) {
        for (let i = 0; i <= NSAMPLE; i++) {
          const a = lo * Math.pow(hi / lo, i / NSAMPLE);
          const tD = relayTimeS(d, a);
          const tU = relayTimeS(u, a * k);
          if (!Number.isFinite(tD) || !Number.isFinite(tU)) continue;
          if (tU - tD < minM) {
            minM = tU - tD;
            at = a;
          }
        }
      }
      const has = Number.isFinite(minM);
      out.push({
        upId: u.id, upName: u.name, downId: d.id, downName: d.name,
        minMarginS: has ? minM : null, atDownA: at, rangeA: hi > lo ? [lo, hi] : null,
        pass: has ? minM >= ctx.study.opt.minMarginS - 1e-6 : null,
        preferred: has ? minM >= ctx.study.opt.prefMarginS - 1e-6 : null,
      });
    }
  }
  return out;
}

/** Smallest TMS for relay u (other settings as given) that keeps `margin` seconds to every downstream relay. */
function fitTms(u: RelayDef, relays: RelayDef[], ctx: Ctx, margin: number): { tms: number; infeasible: boolean; binding: string } {
  const opt = ctx.study.opt;
  let need = opt.tmsMin;
  let infeasible = false;
  let binding = "";
  for (const did of u.downstream) {
    const d = relays.find((x) => x.id === did);
    if (!d) continue;
    const k = devKv(d, ctx) / devKv(u, ctx);
    const lo = d.pickupA * 1.05;
    const hi = hiAmps(d, relays, ctx);
    if (!(hi > lo)) continue;
    for (let i = 0; i <= NSAMPLE; i++) {
      const a = lo * Math.pow(hi / lo, i / NSAMPLE);
      const tD = relayTimeS(d, a);
      if (!Number.isFinite(tD)) continue;
      const au = a * k;
      if (u.instPickupA > 0 && au >= u.instPickupA) {
        if (u.instMs / 1000 < tD + margin - 1e-9) {
          infeasible = true;
          binding = `instantaneous element of ${u.name} overlaps ${d.name} at ${Math.round(a)} A`;
        }
        continue;
      }
      const f = idmtTimeS(u, au, 1);
      if (!Number.isFinite(f)) continue;
      const n = (tD + margin) / f;
      if (n > need) {
        need = n;
        binding = `${d.name} at ${Math.round(a)} A`;
      }
    }
  }
  need = Math.ceil(need * 200 - 1e-9) / 200;
  if (need > opt.tmsMax) infeasible = true;
  return { tms: Math.min(need, opt.tmsMax), infeasible, binding };
}

// ---------------------------------------------------------------------------
// Solver
// ---------------------------------------------------------------------------

/** Compare each relay's total clearing time (incl. breaker and band) with the withstand curve of the asset it protects. */
export function damageChecks(relays: RelayDef[], ctx: Ctx): DamageCheck[] {
  const out: DamageCheck[] = [];
  for (const r of relays) {
    const d = r.damage;
    if (!d) continue;
    let pts: Pt[] = [];
    let asset = "";
    let note = "";
    try {
      if (d.kind === "transformer") {
        const kv = d.kvLine && d.kvLine > 0 ? d.kvLine : devKv(r, ctx);
        const cat = transformerCategoryFromKVA(d.mva * 1000);
        const w = transformerWithstandPointsAmps(d.mva, kv, { impedancePct: d.zPct, category: cat });
        pts = w.points;
        asset = `${d.mva} MVA transformer, ${d.zPct} %Z, category ${cat}`;
        note = w.truncatedForMechanicalDuty ? "Thermal part of the withstand curve only (mechanical duty not calculated)." : "";
      } else {
        const lo = Math.max(1, r.pickupA * 1.05);
        const w = cableDamagePoints({ material: d.material, insulation: d.insulation, csaMm2: d.csaMm2, minA: lo, maxA: Math.max(lo * 2, hiAmps(r, relays, ctx)), points: 24 });
        pts = w.points;
        asset = `${d.csaMm2} mm² ${d.material} ${d.insulation.toUpperCase()} cable`;
      }
    } catch (e) {
      out.push({ relayId: r.id, name: r.name, asset: "invalid asset data", pass: null, minMargin: null, atA: null, note: (e as Error).message });
      continue;
    }
    let min = Infinity;
    let at: number | null = null;
    for (const [I, tw] of pts) {
      const tr = relayTimeS(r, I) * (1 + (r.bandTol ?? 0)) + r.breakerMs / 1000;
      if (!Number.isFinite(tr) || tr <= 0) continue;
      const m = tw / tr;
      if (m < min) {
        min = m;
        at = I;
      }
    }
    const has = Number.isFinite(min);
    out.push({ relayId: r.id, name: r.name, asset, pass: has ? min >= 1 : null, minMargin: has ? min : null, atA: at, note });
  }
  return out;
}

export interface RelayChange {
  id: string;
  name: string;
  before: RelayDef;
  after: RelayDef;
  stage: string;
  notes: string[];
}

export interface ProtSolution {
  proposed: RelayDef[];
  before: BusOutcome[];
  after: BusOutcome[];
  gradingBefore: GradePair[];
  gradingAfter: GradePair[];
  damageBefore: DamageCheck[];
  damageAfter: DamageCheck[];
  changes: RelayChange[];
  cautions: string[];
  recommendations: string[];
  log: string[];
  counts: { total: number; alreadyMet: number; achieved: number; maintenanceOnly: number; partial: number };
}

const f1 = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "n/a");
const f0 = (x: number) => (Number.isFinite(x) ? x.toFixed(0) : "n/a");

function roundUpStep(p: number): number {
  const step = p >= 1000 ? 10 : p >= 100 ? 5 : p >= 10 ? 1 : 0.5;
  return Math.ceil(p / step - 1e-9) * step;
}

function topoOrder(relays: RelayDef[]): RelayDef[] {
  const seen = new Set<string>();
  const out: RelayDef[] = [];
  const visit = (r: RelayDef) => {
    if (seen.has(r.id)) return;
    seen.add(r.id);
    for (const id of r.downstream) {
      const d = relays.find((x) => x.id === id);
      if (d) visit(d);
    }
    out.push(r);
  };
  relays.forEach(visit);
  return out;
}

interface Stage {
  name: string;
  margin: "pref" | "min";
  pickup: boolean;
  inst: boolean;
  curve: boolean;
}

export function solveProtection(study: ProtStudy): ProtSolution {
  const ctx = buildCtx(study);
  const opt = study.opt;
  const original = study.relays.map(cloneRelay);
  const cur = study.relays.map(cloneRelay);
  const log: string[] = [];
  const cautions: string[] = [];
  const blockers = new Map<string, string[]>(); // busId → reasons
  const noteMap = new Map<string, string[]>();
  const stageMap = new Map<string, string>();
  const addNote = (id: string, s: string) => noteMap.set(id, [...(noteMap.get(id) ?? []), s]);
  const addBlock = (busId: string, s: string) => blockers.set(busId, [...(blockers.get(busId) ?? []), s]);

  const before = evaluateBuses(study, original, ctx);
  const gradingBefore = gradePairs(original, ctx);
  const damageBefore = damageChecks(original, ctx);

  const stages: Stage[] = [
    { name: "TMS lowered to the grading limit (preferred margin)", margin: "pref", pickup: false, inst: false, curve: false },
    { name: "TMS lowered to the grading limit (minimum margin)", margin: "min", pickup: false, inst: false, curve: false },
  ];
  if (opt.allowPickup) stages.push({ name: "pickup lowered toward the overload limit + TMS", margin: "min", pickup: true, inst: false, curve: false });
  if (opt.allowInst) stages.push({ name: "instantaneous element added / lowered + pickup + TMS", margin: "min", pickup: opt.allowPickup, inst: true, curve: false });
  if (opt.allowCurve) stages.push({ name: "more inverse curve + instantaneous + pickup + TMS", margin: "min", pickup: opt.allowPickup, inst: opt.allowInst, curve: true });

  const targetOf = (u: RelayDef) => {
    const bus = ctx.busById.get(u.busId);
    return bus && Number.isFinite(targetEnergy(study.targets[bus.id])) ? bus : null;
  };
  const unmet = (u: RelayDef, relays: RelayDef[]): boolean => {
    const bus = targetOf(u);
    return !!bus && evalBus(bus, relays, ctx).met === false;
  };
  const ratio = (u: RelayDef, relays: RelayDef[]): number => {
    const bus = targetOf(u);
    if (!bus) return 0;
    const o = evalBus(bus, relays, ctx);
    return o.eCal / o.targetE;
  };

  interface Best { cand: RelayDef; score: number; stage: string; floorTms: boolean; floorPickup: boolean; bind: string }

  /** Search the settings of one relay (others fixed). Returns the least-change setting that meets the target, else the best found. */
  const ladder = (u: RelayDef): { found: boolean; best: Best | null; instOk: boolean; minInst: number; iarcLowAmps: number } => {
    const bus = ctx.busById.get(u.busId)!;
    const oNow = evalBus(bus, cur, ctx);
    const iarcLowAmps = (oNow.iarcMinKa * 1000 * bus.unKv) / devKv(u, ctx);
    const pmin = u.loadA > 0 ? opt.overloadFactor * u.loadA : u.pickupA; // no load current known → pickup is left unchanged
    const trial = (cand: RelayDef) => cur.map((x) => (x.id === u.id ? cand : x));

    let minInst = 0;
    if (u.downstream.length > 0) {
      for (const did of u.downstream) {
        const d = cur.find((x) => x.id === did);
        if (d) minInst = Math.max(minInst, (opt.instMarginX * hiAmps(d, cur, ctx) * devKv(d, ctx)) / devKv(u, ctx));
      }
    } else {
      minInst = 1.5 * u.pickupA;
    }
    minInst = roundUpStep(Math.max(minInst, u.inrushA, 1.1 * u.pickupA));
    const instOk = minInst <= 0.8 * iarcLowAmps;

    let best: Best | null = null;
    let found = false;
    for (const stage of stages) {
      const curves = stage.curve
        ? [u.curveType, ...Object.keys(u.curveFamily === "IEC" ? IEC_CURVES : IEEE_CURVES).filter((c) => c !== u.curveType)]
        : [u.curveType];
      const instList = [...new Set(stage.inst && instOk ? [u.instPickupA, u.instPickupA > 0 ? Math.min(minInst, u.instPickupA) : minInst] : [u.instPickupA])];
      let pickups = [u.pickupA];
      if (stage.pickup && pmin < u.pickupA) {
        pickups = [];
        for (let i = 0; i <= 8; i++) {
          const p = i === 8 ? roundUpStep(pmin) : roundUpStep(u.pickupA * Math.pow(pmin / u.pickupA, i / 8));
          if (p <= u.pickupA + 1e-9 && !pickups.includes(p)) pickups.push(p);
        }
      }
      for (const c of curves) {
        for (const ins of instList) {
          for (const p of pickups) {
            const cand: RelayDef = { ...cloneRelay(u), curveType: c, pickupA: p, instPickupA: ins };
            if (ins > 0 && ins !== u.instPickupA) cand.instMs = opt.instMs;
            const fMin = fitTms(cand, cur, ctx, opt.minMarginS);
            if (fMin.infeasible) continue;
            const same = c === u.curveType;
            let floor = fMin.tms;
            if (stage.margin === "pref") {
              const fPref = fitTms(cand, cur, ctx, opt.prefMarginS);
              floor = Math.max(fMin.tms, same ? Math.min(fPref.tms, u.tms) : fPref.tms);
            }
            const upper = same ? Math.max(u.tms, floor) : opt.tmsMax;
            const meets = () => !unmet(cand, trial(cand));
            cand.tms = floor;
            if (meets()) {
              let lo = floor;
              let hi = upper;
              cand.tms = hi;
              if (meets()) lo = hi;
              else {
                for (let it = 0; it < 14; it++) {
                  const mid = (lo + hi) / 2;
                  cand.tms = mid;
                  if (meets()) lo = mid;
                  else hi = mid;
                }
              }
              let t = Math.floor(lo * 200 + 1e-9) / 200;
              if (t < floor) t = floor;
              cand.tms = t;
              if (meets()) {
                best = { cand, score: 0, stage: stage.name, floorTms: t <= fMin.tms + 1e-9, floorPickup: p <= roundUpStep(pmin) + 1e-9, bind: fMin.binding };
                found = true;
                break;
              }
              cand.tms = floor;
            }
            const sc = ratio(cand, trial(cand));
            if (!best || sc < best.score - 1e-9) {
              best = { cand: cloneRelay(cand), score: sc, stage: stage.name, floorTms: true, floorPickup: p <= roundUpStep(pmin) + 1e-9, bind: fMin.binding };
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (found) break;
    }
    return { found, best, instOk, minInst, iarcLowAmps };
  };

  /** Make every unlocked downstream relay (recursively) as fast as its own grading allows: lowest TMS and, if safe, an instantaneous element. */
  const tighten = (u: RelayDef, depth = 0) => {
    if (depth > 6) return;
    for (const did of u.downstream) {
      const d = cur.find((x) => x.id === did);
      if (!d || isFixed(d)) continue;
      tighten(d, depth + 1);
      const o = { tms: d.tms, inst: d.instPickupA, ms: d.instMs };
      const bus = ctx.busById.get(d.busId);
      if (opt.allowInst && bus) {
        const oD = evalBus(bus, cur, ctx);
        const low = (oD.iarcMinKa * 1000 * bus.unKv) / devKv(d, ctx);
        let mi = 0;
        if (d.downstream.length > 0) {
          for (const gid of d.downstream) {
            const g = cur.find((x) => x.id === gid);
            if (g) mi = Math.max(mi, (opt.instMarginX * hiAmps(g, cur, ctx) * devKv(g, ctx)) / devKv(d, ctx));
          }
        } else mi = 1.5 * d.pickupA;
        mi = roundUpStep(Math.max(mi, d.inrushA, 1.1 * d.pickupA));
        if (mi <= 0.8 * low && (d.instPickupA === 0 || mi < d.instPickupA)) {
          d.instPickupA = mi;
          d.instMs = opt.instMs;
        }
      }
      const fit = fitTms(d, cur, ctx, opt.minMarginS);
      if (!fit.infeasible && fit.tms < d.tms) d.tms = fit.tms;
      if (o.tms !== d.tms || o.inst !== d.instPickupA) {
        const parts: string[] = [];
        if (o.tms !== d.tms) parts.push(`TMS ${f1(o.tms, 3)} → ${f1(d.tms, 3)}`);
        if (o.inst !== d.instPickupA) parts.push(`instantaneous ${o.inst > 0 ? f0(o.inst) + " A" : "off"} → ${f0(d.instPickupA)} A at ${f0(d.instMs)} ms`);
        addNote(d.id, `Speeded up to let ${u.name} clear faster: ${parts.join(", ")}.`);
        stageMap.set(d.id, "downstream relay speeded up");
      }
    }
  };

  for (const u0 of topoOrder(cur)) {
    const u = cur.find((x) => x.id === u0.id)!;
    const orig = original.find((x) => x.id === u.id)!;

    // keep coordination with the (possibly faster) downstream relays
    if (!isFixed(u)) {
      const fit = fitTms(u, cur, ctx, opt.minMarginS);
      if (!fit.infeasible && u.tms < fit.tms - 1e-9) {
        addNote(u.id, `TMS raised from ${f1(u.tms, 3)} to ${f1(fit.tms, 3)} to keep ${opt.minMarginS.toFixed(2)} s grading over ${fit.binding}.`);
        stageMap.set(u.id, "coordination repaired");
        u.tms = fit.tms;
      } else if (fit.infeasible) {
        cautions.push(`${u.name}: cannot hold the minimum grading margin with the current instantaneous / TMS limits (${fit.binding || "TMS limit"}).`);
      }
    }
    if (!unmet(u, cur)) continue;
    const bus = ctx.busById.get(u.busId)!;
    if (isFixed(u)) {
      addBlock(u.busId, u.engine ? `${u.name} is a fixed ${DEVICE_TYPE_LABEL[u.engine.type] ?? "device"} and is not tuned here` : `${u.name} is locked and cannot be changed`);
      continue;
    }

    const e0 = ratio(u, cur);
    const snapshot = cur.map(cloneRelay);
    let res = ladder(u);
    const apply = (r: typeof res) => {
      if (!r.best) return;
      const c = r.best.cand;
      Object.assign(u, { curveType: c.curveType, pickupA: c.pickupA, tms: c.tms, instPickupA: c.instPickupA, instMs: c.instMs });
    };
    let stageName = res.best?.stage ?? "";
    let usedDownstream = false;
    if (res.found) apply(res);
    else {
      // try speeding up the downstream relays as well
      if (opt.allowDownstream && u.downstream.length > 0) {
        const keep = cur.map(cloneRelay);
        const keepNotes = new Map(noteMap);
        const keepStage = new Map(stageMap);
        apply(res);
        const eAfterOwn = ratio(u, cur);
        // restore u, tighten the downstream chain, search again
        cur.forEach((x, i) => Object.assign(x, keep[i]));
        tighten(u);
        const res2 = ladder(u);
        const sc2 = res2.found ? 0 : res2.best?.score ?? Infinity;
        const sc1 = res.found ? 0 : Math.min(eAfterOwn, res.best?.score ?? Infinity);
        if (res2.best && sc2 < sc1 - 0.01) {
          res = res2;
          usedDownstream = true;
          stageName = res2.best.stage + " (downstream relays speeded up)";
          apply(res);
        } else {
          cur.forEach((x, i) => Object.assign(x, keep[i]));
          noteMap.clear();
          keepNotes.forEach((v, k) => noteMap.set(k, v));
          stageMap.clear();
          keepStage.forEach((v, k) => stageMap.set(k, v));
          apply(res);
        }
      } else apply(res);
    }

    const o = evalBus(bus, cur, ctx);
    if (!res.found) {
      // keep the attempt only if it actually helped
      if (ratio(u, cur) >= e0 * 0.995 && !usedDownstream) {
        cur.forEach((x, i) => Object.assign(x, snapshot[i]));
        stageName = "";
      } else if (res.best) {
        stageName = `best achievable — ${stageName}`;
        const why: string[] = [];
        if (res.best.floorTms && res.best.bind) why.push(`TMS is limited by grading over ${res.best.bind} (minimum margin ${opt.minMarginS.toFixed(2)} s)`);
        if (res.best.floorPickup && opt.allowPickup) why.push(`pickup is already at the overload limit (${opt.overloadFactor}× ${f0(u.loadA)} A)`);
        if (!opt.allowPickup) why.push("pickup changes are switched off");
        if (!opt.allowInst) why.push("instantaneous changes are switched off");
        else if (!res.instOk) why.push(`an instantaneous element would have to pick up above ${f0(res.minInst)} A to stay selective (${opt.instMarginX}× the downstream maximum fault / inrush) but the lowest arcing current at ${u.name} is only ${f0(res.iarcLowAmps)} A`);
        why.forEach((w) => addBlock(u.busId, w));
        log.push(`${bus.name}: best achievable E = ${f1(o.eCal, 1)} cal/cm² (target ${f1(o.targetE, 1)}).`);
      }
    }
    if (stageName) stageMap.set(u.id, stageName);
    void orig;
  }

  // ----- change list -----
  const changes: RelayChange[] = [];
  for (const u of cur) {
    const o = original.find((x) => x.id === u.id)!;
    const diff = o.tms !== u.tms || o.pickupA !== u.pickupA || o.curveType !== u.curveType || o.instPickupA !== u.instPickupA || o.instMs !== u.instMs;
    if (!diff) continue;
    const notes: string[] = [];
    const sped = (noteMap.get(u.id) ?? []).some((n) => n.startsWith("Speeded up"));
    if (o.tms !== u.tms && !sped) notes.push(`TMS ${f1(o.tms, 3)} → ${f1(u.tms, 3)}.`);
    if (o.pickupA !== u.pickupA) notes.push(`Pickup ${f0(o.pickupA)} A → ${f0(u.pickupA)} A (floor ${f0(opt.overloadFactor * u.loadA)} A = ${opt.overloadFactor} × load).`);
    if (o.curveType !== u.curveType) notes.push(`Curve ${o.curveType} → ${u.curveType}.`);
    if (o.instPickupA !== u.instPickupA && !sped) {
      notes.push(
        u.instPickupA > 0
          ? `Instantaneous ${o.instPickupA > 0 ? f0(o.instPickupA) + " A" : "off"} → ${f0(u.instPickupA)} A at ${f0(u.instMs)} ms (≥ ${opt.instMarginX}× downstream maximum fault / inrush).`
          : "Instantaneous switched off."
      );
    }
    for (const n of noteMap.get(u.id) ?? []) if (!notes.some((x) => x === n)) notes.push(n);
    changes.push({ id: u.id, name: u.name, before: o, after: cloneRelay(u), stage: stageMap.get(u.id) ?? "settings adjusted", notes });
  }

  const after = evaluateBuses(study, cur, ctx);
  const gradingAfter = gradePairs(cur, ctx);
  const damageAfter = damageChecks(cur, ctx);

  // ----- status counts -----
  let alreadyMet = 0, achieved = 0, maintenanceOnly = 0, partial = 0, total = 0;
  const recs: string[] = [];
  for (const a of after) {
    if (a.met === null) continue;
    total++;
    const b = before.find((x) => x.busId === a.busId)!;
    if (a.met) {
      if (b.met) alreadyMet++;
      else achieved++;
    } else if (a.maintE !== null && a.maintE <= a.targetE * (1 + 1e-9)) {
      maintenanceOnly++;
    } else {
      partial++;
    }
    if (!a.met) {
      const rs = blockers.get(a.busId) ?? [];
      cautions.push(
        `${a.name}: target ${a.targetCat === 0 ? "< 1.2" : `Cat ${a.targetCat}`} (${f1(a.targetE, 1)} cal/cm²) not met by settings alone — best ${f1(a.eCal, 1)} cal/cm² with ${f0(a.tMs)} ms total clearing; about ${a.reqMs !== null ? f0(a.reqMs) : "?"} ms is needed.` +
          (rs.length ? ` Limits: ${[...new Set(rs)].join("; ")}.` : "") +
          (a.maintE !== null && a.maintE <= a.targetE ? ` Maintenance mode would give ${f1(a.maintE, 1)} cal/cm².` : "")
      );
    }
  }
  if (partial > 0 || maintenanceOnly > 0) {
    recs.push("Zone-selective interlocking (ZSI) between the incomer and the feeders: the incomer trips in about 100 ms for a fault on its own bus while still waiting for the feeders for downstream faults — no loss of selectivity.");
    recs.push("Arc-flash detection relay (light + current) on the affected switchboard: total clearing is typically 35–60 ms including the breaker, independent of the overcurrent grading.");
    recs.push("Busbar differential protection (or a fast bus-zone protection) on the affected switchboard.");
    recs.push("An energy-reducing maintenance switch (ARMS) with a fast instantaneous setting group while people work on the equipment.");
    recs.push("Reduce the arcing energy at source: current-limiting fuses or breakers, a high-resistance earthed system (limits earth-fault arcs), remote racking and remote operation to increase the working distance.");
  }
  for (const g of gradingAfter) {
    if (g.pass === false) cautions.push(`Grading ${g.downName} → ${g.upName} is below the minimum margin (${f1(g.minMarginS ?? 0, 2)} s < ${opt.minMarginS.toFixed(2)} s).`);
  }
  for (const dmg of damageAfter) {
    if (dmg.pass === false) cautions.push(`${dmg.name}: operates too slowly for ${dmg.asset} — ${f1(dmg.minMargin ?? 0, 2)}× the withstand time at ${f0(dmg.atA ?? 0)} A (needs ≥ 1).`);
  }
  for (const g of gradingAfter) {
    if (g.pass && g.preferred === false) cautions.push(`Grading ${g.downName} → ${g.upName} uses a reduced margin of ${f1(g.minMarginS ?? 0, 2)} s (preferred ${opt.prefMarginS.toFixed(2)} s). Confirm with the relay and breaker operating times and CT errors.`);
  }
  if (changes.some((c) => c.after.instPickupA > 0 && c.before.instPickupA !== c.after.instPickupA)) {
    cautions.push("A new or lowered instantaneous element was proposed: confirm CT saturation, breaker making capacity and that the setting stays above the transformer inrush and motor starting current.");
  }
  cautions.push("Grading is checked for three-phase faults at the maximum fault level, with currents referred through transformers by the voltage ratio (no phase-shift or L-L correction). Earth-fault grading is not verified, and transformer / cable damage curves are checked only for relays that have a protected asset entered.");
  for (const r of cur) {
    if (!isFixed(r) && !(r.loadA > 0) && opt.allowPickup) cautions.push(`${r.name}: no maximum load current entered, so its pickup was left unchanged. Enter the load current to let the solver lower the pickup safely.`);
  }
  cautions.push("This is a proposal: a protection engineer must review it against the manufacturer's time-current curves, CT data and the site's operating modes before it is applied.");

  log.push(
    `Grading margin: preferred ${opt.prefMarginS.toFixed(2)} s, minimum ${opt.minMarginS.toFixed(2)} s. Relays are processed from the load end to the source end so each upstream relay sees its downstream relay's final setting.`,
    "TMS for a given pickup and curve: TMS ≥ max over the overlap range of (t_down(I) + Δt) / t_up(I at TMS = 1), because the operating time scales linearly with TMS.",
    "Incident energy is proportional to the arc duration, so the clearing time needed for a target is t_req = t × E_target / E.",
    "Instantaneous pickup ≥ k × (maximum fault current at the downstream device) and ≥ the inrush; it must also stay below ~80 % of the lowest arcing current to be reliable."
  );

  return {
    proposed: cur,
    before,
    after,
    gradingBefore,
    gradingAfter,
    damageBefore,
    damageAfter,
    changes,
    cautions: [...new Set(cautions)],
    recommendations: recs,
    log,
    counts: { total, alreadyMet, achieved, maintenanceOnly, partial },
  };
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function makeDefaultProtStudy(): ProtStudy {
  const net: ScNetwork = JSON.parse(JSON.stringify(DEFAULT_SC_NETWORK));
  net.buses = net.buses.map((b, i) => {
    const af = defaultBusAf(b.unKv);
    if (i === 2) {
      af.equipClass = "lvmcc";
      af.gapMm = 25;
      af.workingMm = 457.2;
      af.heightMm = 355.6;
      af.widthMm = 304.8;
      af.depthMm = 203.2;
    }
    return { ...b, af };
  });
  const base = { curveFamily: "IEC" as const, curveType: "SI", inrushA: 0, breakerMs: 50, instMs: 50, instPickupA: 0, locked: false };
  const relays: RelayDef[] = [
    { ...base, id: "r1", name: "R1 MCC feeder", busId: "b3", deviceKv: 0.4, downstream: [], loadA: 270, inrushA: 1900, pickupA: 300, tms: 0.08 },
    { ...base, id: "r2", name: "R2 LV incomer", busId: "b2", deviceKv: 0.4, downstream: ["r1"], loadA: 2310, pickupA: 2500, tms: 0.2 },
    { ...base, id: "r3", name: "R3 T1 HV relay", busId: "b2", deviceKv: 11, downstream: ["r2"], loadA: 84, inrushA: 700, pickupA: 100, tms: 0.28 },
    { ...base, id: "r4", name: "R4 11 kV incomer", busId: "b1", deviceKv: 11, downstream: ["r3"], loadA: 150, pickupA: 200, tms: 0.4 },
  ];
  return {
    net,
    relays,
    targets: { b1: 2, b2: 2, b3: 2 },
    opt: { ...DEFAULT_PROT_OPTIONS },
  };
}

/** CT-side voltage of a relay (its own value, or the voltage of the bus it feeds). */
export function deviceKvOf(r: RelayDef, net: ScNetwork): number {
  if (r.deviceKv > 0) return r.deviceKv;
  return net.buses.find((b) => b.id === r.busId)?.unKv ?? 1;
}

export function isProtStudy(d: unknown): d is ProtStudy {
  const s = d as Partial<ProtStudy> | null;
  return !!s && typeof s === "object" && !!s.net && Array.isArray(s.net.buses) && Array.isArray(s.net.branches) && Array.isArray(s.relays) && !!s.targets && !!s.opt;
}

/** Evaluate any set of relay settings (no solving): arc-flash result per bus and grading margins. */
export function evaluateSet(study: ProtStudy, relays: RelayDef[]): { buses: BusOutcome[]; grading: GradePair[] } {
  const ctx = buildCtx(study);
  return { buses: evaluateBuses(study, relays, ctx), grading: gradePairs(relays, ctx) };
}

/** Alternative (e.g. consultant) settings merged onto the present relays by id; relays without an entry keep the present values. */
export function mergeAlt(relays: RelayDef[], alt: RelayDef[] | undefined): RelayDef[] {
  return relays.map((r) => {
    const a = alt?.find((x) => x.id === r.id);
    return a
      ? { ...r, curveType: a.curveType, pickupA: a.pickupA, tms: a.tms, instPickupA: a.instPickupA, instMs: a.instMs }
      : { ...r, downstream: [...r.downstream] };
  });
}
