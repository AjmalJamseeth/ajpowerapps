// Network arc-flash study: takes the IEC 60909 short-circuit results for every
// bus, adds each bus's equipment data and protective device, and runs the
// IEEE 1584-2018 model at both the maximum and minimum fault current (the
// standard recommends checking both — clause 6.4), keeping the worse case.
// Also computes the energy-reducing "maintenance mode" what-if, the longest
// clearing time that would still meet a PPE target, and report steps.

import { tripTime, type CurveType, type RelaySettings } from "./idmt";
import {
  calcAf2018,
  defaultEquipClassFor,
  EQUIPMENT_CLASSES,
  leeBoundaryMm,
  leeEnergyCal,
  ppeForEnergy,
  shockBoundaries,
  type Af2018Result,
  type EquipClassId,
  type PpeCategory,
  type ShockBoundaries,
} from "./arcflash2018";
import { DEFAULT_SC_NETWORK, type BusArcFlashIn, type BusIn, type ProtectionIn, type ScNetwork, type ScResult } from "./iec60909";

export const DEFAULT_MAX_ARC_MS = 2000;

export function defaultProtection(): ProtectionIn {
  return {
    mode: "fixed",
    fixedMs: 200,
    deviceKv: 0,
    curveFamily: "IEC",
    curveType: "SI",
    pickupA: 400,
    tms: 0.1,
    instPickupA: 0,
    instMs: 50,
    breakerMs: 50,
  };
}

/** Default arc-flash data derived from the bus voltage (IEEE 1584-2018 Tables 8 and 10). */
export function defaultBusAf(unKv: number): BusArcFlashIn {
  const id = defaultEquipClassFor(unKv);
  const c = EQUIPMENT_CLASSES.find((e) => e.id === id)!;
  return {
    equipClass: id,
    config: "VCB",
    gapMm: c.gapMm,
    workingMm: c.workingDistMm,
    heightMm: c.heightMm,
    widthMm: c.widthMm,
    depthMm: c.depthMm,
    protection: defaultProtection(),
    maintenanceOn: false,
    maintenanceMs: 50,
  };
}

export const afOf = (b: BusIn): BusArcFlashIn => b.af ?? defaultBusAf(b.unKv);

/** Clearing time (ms) as a function of arcing current (kA at the bus voltage). */
export function clearingTimeFn(p: ProtectionIn, busKv: number, maxMs: number): (iarcKa: number) => number {
  if (p.mode === "fixed") return () => Math.min(maxMs, Math.max(1, p.fixedMs));
  const relay: RelaySettings = {
    label: "Upstream device",
    curveFamily: p.curveFamily,
    curveType: p.curveType as CurveType,
    pickupCurrent: Math.max(1e-6, p.pickupA),
    ctRatio: 1,
    timeDial: p.tms,
  };
  const ratio = p.deviceKv > 0 ? busKv / p.deviceKv : 1;
  return (iarcKa: number) => {
    const amps = iarcKa * 1000 * ratio;
    const tr = tripTime(relay, amps);
    let t = Number.isFinite(tr) ? tr * 1000 : Infinity;
    if (p.instPickupA > 0 && amps >= p.instPickupA) t = Math.min(t, p.instMs);
    if (!Number.isFinite(t)) return maxMs; // device never operates at this current
    return Math.min(maxMs, t + p.breakerMs);
  };
}

export interface AfScenario {
  label: string;
  ibfKa: number;
  res: Af2018Result | null;
  eCal: number;
  afbMm: number;
  iarcKa: number;
  iarcMinKa: number;
  tMs: number;
  tMinMs: number;
}

export interface ArcFlashBusResult {
  busId: string;
  name: string;
  unKv: number;
  model: "ieee2018" | "lee" | "none";
  equipLabel: string;
  config: string;
  gapMm: number;
  workingMm: number;
  enclosure: string;
  ibfMaxKa: number;
  ibfMinKa: number;
  governing: AfScenario | null;
  scenarios: AfScenario[];
  eCal: number; // governing incident energy, cal/cm²
  afbMm: number;
  ppe: PpeCategory;
  shock: ShockBoundaries;
  mitigated: { eCal: number; afbMm: number; ppe: PpeCategory; tMs: number } | null;
  reqMsForCat2: number | null; // clearing time needed at the governing current for ≤ 8 cal/cm²
  reqMsForLow: number | null; // … for ≤ 1.2 cal/cm² (boundary equals working distance)
  warnings: string[];
  steps: string[];
  /** Re-evaluate the governing incident energy (cal/cm²) at another working distance or with a fixed total clearing time. */
  energyFn: ((o: { dMm?: number; tMs?: number }) => number) | null;
}

function runScenario(
  bus: BusIn,
  af: BusArcFlashIn,
  ibfKa: number,
  label: string,
  clearing: (i: number) => number
): AfScenario {
  const res = calcAf2018({
    ibfKa,
    vocKv: bus.unKv,
    gapMm: af.gapMm,
    workingDistMm: af.workingMm,
    config: af.config,
    widthMm: af.widthMm,
    heightMm: af.heightMm,
    depthMm: af.depthMm,
    durationMs: clearing,
  });
  return {
    label,
    ibfKa,
    res,
    eCal: res.eCal,
    afbMm: res.afbMm,
    iarcKa: res.normal.iarcKa,
    iarcMinKa: res.reduced.iarcKa,
    tMs: res.normal.tMs,
    tMinMs: res.reduced.tMs,
  };
}

export function analyseArcFlash(net: ScNetwork, sc: ScResult): ArcFlashBusResult[] {
  const maxMs = net.settings.afMaxArcMs ?? DEFAULT_MAX_ARC_MS;
  const nominal = net.settings.afNominalC ?? true;
  const out: ArcFlashBusResult[] = [];

  for (const bus of net.buses) {
    const r = sc.buses.find((b) => b.busId === bus.id);
    const af = afOf(bus);
    const eq = EQUIPMENT_CLASSES.find((e) => e.id === (af.equipClass as EquipClassId));
    const base: ArcFlashBusResult = {
      busId: bus.id, name: bus.name, unKv: bus.unKv, model: "none",
      equipLabel: eq?.label ?? "Custom", config: af.config, gapMm: af.gapMm, workingMm: af.workingMm,
      enclosure: `${af.heightMm.toFixed(0)} × ${af.widthMm.toFixed(0)} × ${af.depthMm.toFixed(0)} mm`,
      ibfMaxKa: 0, ibfMinKa: 0, governing: null, scenarios: [], eCal: 0, afbMm: 0,
      ppe: ppeForEnergy(0), shock: shockBoundaries(bus.unKv), mitigated: null, reqMsForCat2: null, reqMsForLow: null,
      warnings: [], steps: [], energyFn: null,
    };
    if (!r || !r.energised) {
      base.warnings.push("No source connected — nothing to study at this bus.");
      out.push(base);
      continue;
    }
    const ibfMax = nominal ? r.ik3Nom : r.ik3;
    const ibfMin = nominal ? r.ik3NomMin : r.ik3Min;
    base.ibfMaxKa = ibfMax;
    base.ibfMinKa = ibfMin;
    const clearing = clearingTimeFn(af.protection, bus.unKv, maxMs);

    if (bus.unKv >= 0.208 && bus.unKv <= 15) {
      const cases = [runScenario(bus, af, ibfMax, "Maximum fault current", clearing)];
      if (ibfMin > 0 && Math.abs(ibfMin - ibfMax) > 1e-6) cases.push(runScenario(bus, af, ibfMin, "Minimum fault current", clearing));
      const gov = cases.reduce((a, b) => (b.eCal > a.eCal ? b : a));
      base.model = "ieee2018";
      base.scenarios = cases;
      base.governing = gov;
      base.eCal = gov.eCal;
      base.afbMm = Math.max(...cases.map((c) => c.afbMm));
      base.warnings.push(...(gov.res?.warnings ?? []));

      // Mitigation what-if: maintenance mode shortens the clearing time.
      if (af.maintenanceOn) {
        const fast = (i: number) => Math.min(clearing(i), af.maintenanceMs);
        const mc = [runScenario(bus, af, ibfMax, "max", fast)];
        if (cases.length > 1) mc.push(runScenario(bus, af, ibfMin, "min", fast));
        const mg = mc.reduce((a, b) => (b.eCal > a.eCal ? b : a));
        base.mitigated = { eCal: mg.eCal, afbMm: Math.max(...mc.map((c) => c.afbMm)), ppe: ppeForEnergy(mg.eCal), tMs: mg.tMs };
      }

      // Required clearing time: E is linear in arc duration for a given current.
      const need = (target: number) => {
        const g = gov.res;
        if (!g) return null;
        const t1 = gov.res!.normal.eCal > 0 ? (g.normal.tMs * target) / g.normal.eCal : Infinity;
        const t2 = g.reduced.eCal > 0 ? (g.reduced.tMs * target) / g.reduced.eCal : Infinity;
        return Math.min(t1, t2);
      };
      base.energyFn = (o) => {
        const af2: BusArcFlashIn = { ...af, workingMm: o.dMm ?? af.workingMm };
        const clr = o.tMs !== undefined ? () => o.tMs! : clearing;
        return Math.max(...cases.map((c) => runScenario(bus, af2, c.ibfKa, c.label, clr).eCal));
      };
      base.reqMsForCat2 = base.eCal > 8 ? need(8) : null;
      base.reqMsForLow = base.eCal > 1.2 ? need(1.2) : null;

      base.steps.push(
        `Fault current from the short-circuit study: maximum Ibf = ${ibfMax.toFixed(2)} kA, minimum Ibf = ${ibfMin.toFixed(2)} kA${nominal ? " (referred to nominal voltage, c = 1)" : ""}.`
      );
      for (const c of cases) {
        base.steps.push(`— ${c.label} (Ibf = ${c.ibfKa.toFixed(2)} kA) —`);
        base.steps.push(...(c.res?.steps ?? []));
      }
      base.steps.push(`Governing case: ${gov.label}, E = ${gov.eCal.toFixed(2)} cal/cm² at ${af.workingMm.toFixed(0)} mm → ${base.ppe.name}.`);
    } else if (bus.unKv > 15) {
      const t = clearing(r.ik3);
      const e = leeEnergyCal(bus.unKv, ibfMax, t / 1000, af.workingMm);
      base.model = "lee";
      base.eCal = e;
      base.afbMm = leeBoundaryMm(bus.unKv, ibfMax, t / 1000);
      base.warnings.push("Above 15 kV the IEEE 1584-2018 model does not apply. The Ralph Lee theoretical method is shown as an indication only (conservative).");
      base.steps.push(`Ralph Lee: E = 2.142×10⁶·V·Ibf·t/D² (J/cm²) = ${e.toFixed(2)} cal/cm² for t = ${t.toFixed(0)} ms; boundary ${base.afbMm.toFixed(0)} mm.`);
    } else {
      base.warnings.push("Below 208 V: outside the IEEE 1584-2018 model (arc flash is normally assessed only for systems above 240 V or above 125 kVA source).");
    }
    base.ppe = ppeForEnergy(base.eCal);
    out.push(base);
  }
  return out;
}

/** Starting network for the arc-flash study page: the sample IEC 60909 network with protection data. */
export function makeDefaultAfNetwork(): ScNetwork {
  const n: ScNetwork = JSON.parse(JSON.stringify(DEFAULT_SC_NETWORK));
  n.buses = n.buses.map((b, i) => {
    const af = defaultBusAf(b.unKv);
    if (i === 0) af.protection = { ...af.protection, fixedMs: 300 };
    if (i === 1) {
      af.protection = {
        ...af.protection,
        mode: "idmt",
        curveFamily: "IEC",
        curveType: "SI",
        deviceKv: 11,
        pickupA: 100,
        tms: 0.15,
        instPickupA: 0,
        breakerMs: 50,
      };
      af.maintenanceOn = true;
      af.maintenanceMs = 50;
    }
    if (i === 2) {
      af.equipClass = "lvmcc";
      af.gapMm = 25;
      af.workingMm = 457.2;
      af.heightMm = 355.6;
      af.widthMm = 304.8;
      af.depthMm = 203.2;
      af.protection = { ...af.protection, fixedMs: 100 };
    }
    return { ...b, af };
  });
  return n;
}
