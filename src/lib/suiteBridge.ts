// Phase 1 link between the embedded Protection Coordination Workbench (PCW-PRO)
// and the Arc-Flash & Protection Setting Optimiser.
//
// The workbench runs unchanged inside an iframe; the host page reads its
// project JSON (formatVersion 1) through postMessage. This module converts that
// project into optimiser relays and converts an optimiser proposal back into
// edits of the project. Everything here is a pure function so it can be tested.
//
// Scope and limits (stated so nobody over-trusts the link):
//  - only devices whose curve is an IEC or IEEE IDMT relay are converted; every
//    other device type (LSIG, MCB, fuse, differential, motor...) stays in the
//    workbench untouched and is reported as skipped;
//  - the workbench draws the IDMT curve only: an instantaneous element on an
//    IDMT relay exists there as text ("5000 A @ 0.05 s"), which is parsed on the
//    way in and written back as text;
//  - the workbench does not store the maximum load current, so it is left at 0
//    and the optimiser then keeps the pickup unchanged until it is entered.

import type { RelayDef } from "./protsettings";

export const HANDOFF_TO_OPTIMISER = "ajapps-handoff-to-optimiser";
export const HANDOFF_TO_SUITE = "ajapps-handoff-to-suite";

/** The parts of a PCW-PRO project (formatVersion 1) that the link reads or edits. */
export interface SuiteDevice {
  id: string;
  name: string;
  circuit: string;
  kv: number;
  upstream?: string;
  pickup?: string;
  tms?: string;
  inst?: string;
  curveType?: string;
  engine?: { type: string; key?: string; tms?: number; pickup_a?: number; [k: string]: unknown };
  elements?: { el: string; amps: string; dial: string; [k: string]: unknown }[];
  [k: string]: unknown;
}
export interface SuitePair {
  up: string;
  down: string;
  base?: number;
  cti?: number;
  maxFaultA?: number;
  [k: string]: unknown;
}
export interface SuiteProject {
  formatVersion: number;
  projectName?: string;
  plotRefKV?: number;
  curves: SuiteDevice[];
  gradingPairs?: SuitePair[];
  [k: string]: unknown;
}

const IEC_KEY_TO_TYPE: Record<string, string> = { standard_inverse: "SI", very_inverse: "VI", extremely_inverse: "EI", long_time_inverse: "LTI" };
const IEEE_KEY_TO_TYPE: Record<string, string> = { moderately_inverse: "MI", very_inverse: "VI", extremely_inverse: "EI" };
const IEC_TYPE_TO_KEY = Object.fromEntries(Object.entries(IEC_KEY_TO_TYPE).map(([k, v]) => [v, k]));
const IEEE_TYPE_TO_KEY = Object.fromEntries(Object.entries(IEEE_KEY_TO_TYPE).map(([k, v]) => [v, k]));

/** Curve labels the workbench uses (same strings as its own import table). */
const CURVE_LABELS: Record<string, Record<string, string>> = {
  iec: { standard_inverse: "IEC Standard Inverse", very_inverse: "IEC Very Inverse", extremely_inverse: "IEC Extremely Inverse", long_time_inverse: "IEC Long-Time Inverse" },
  ieee: { moderately_inverse: "IEEE Moderately Inverse", very_inverse: "IEEE Very Inverse", extremely_inverse: "IEEE Extremely Inverse" },
};

export const isSuiteProject = (d: unknown): d is SuiteProject => {
  const p = d as Partial<SuiteProject> | null;
  return !!p && typeof p === "object" && p.formatVersion === 1 && Array.isArray(p.curves);
};

const idmtType = (c: SuiteDevice): { family: "IEC" | "IEEE"; type: string } | null => {
  const e = c.engine;
  if (!e || (e.type !== "iec" && e.type !== "ieee") || !e.key) return null;
  const t = (e.type === "iec" ? IEC_KEY_TO_TYPE : IEEE_KEY_TO_TYPE)[e.key];
  if (!t || !(Number(e.pickup_a) > 0) || !(Number(e.tms) > 0)) return null;
  return { family: e.type === "iec" ? "IEC" : "IEEE", type: t };
};

/** "5000 A @ 0.05 s", "6 kA @ 50 ms" → pickup in amps and time in ms; null when not parsable. */
export function parseInstText(text: string | undefined): { pickupA: number; ms: number } | null {
  if (!text) return null;
  const m = /([\d.]+)\s*(k?)A\s*@\s*([\d.]+)\s*(m?)s/i.exec(text.replace(/,/g, ""));
  if (!m) return null;
  const a = parseFloat(m[1]) * (m[2] ? 1000 : 1);
  const t = parseFloat(m[3]) * (m[4] ? 1 : 1000);
  return a > 0 && t >= 0 ? { pickupA: a, ms: t } : null;
}

export interface SuiteImport {
  relays: RelayDef[];
  skipped: { name: string; circuit: string; reason: string }[];
  notes: string[];
}

/** Convert the IDMT devices of a workbench project into optimiser relays (grading links preserved, skipped devices bridged over). */
export function suiteToRelays(project: SuiteProject): SuiteImport {
  const devices = project.curves;
  const conv = new Map<string, NonNullable<ReturnType<typeof idmtType>>>();
  const skipped: SuiteImport["skipped"] = [];
  for (const c of devices) {
    const t = idmtType(c);
    if (t) conv.set(c.id, t);
    else skipped.push({ name: c.name, circuit: c.circuit, reason: c.engine ? `${c.engine.type} device — not an IEC/IEEE IDMT relay` : "no curve model" });
  }

  // parent (upstream) of each device: explicit grading pairs first, then the upstream label "circuit.name"
  const parent = new Map<string, string>();
  const byLabel = new Map(devices.map((c) => [`${c.circuit}.${c.name}`, c.id]));
  for (const c of devices) {
    const p = c.upstream ? byLabel.get(c.upstream) : undefined;
    if (p && p !== c.id) parent.set(c.id, p);
  }
  for (const g of project.gradingPairs ?? []) if (g.up && g.down && g.up !== g.down) parent.set(g.down, g.up);

  const children = new Map<string, string[]>();
  for (const [child, p] of parent) children.set(p, [...(children.get(p) ?? []), child]);
  const convertibleBelow = (id: string, depth = 0): string[] => {
    if (depth > 12) return [];
    const out: string[] = [];
    for (const ch of children.get(id) ?? []) {
      if (conv.has(ch)) out.push(ch);
      else out.push(...convertibleBelow(ch, depth + 1));
    }
    return out;
  };

  const relays: RelayDef[] = [];
  for (const c of devices) {
    const t = conv.get(c.id);
    if (!t || !c.engine) continue;
    const inst = parseInstText(c.inst);
    relays.push({
      id: c.id,
      name: c.name,
      busId: "",
      deviceKv: Number(c.kv) > 0 ? Number(c.kv) : 0,
      downstream: [...new Set(convertibleBelow(c.id))],
      loadA: 0,
      inrushA: 0,
      curveFamily: t.family,
      curveType: t.type,
      pickupA: Number(c.engine.pickup_a),
      tms: Number(c.engine.tms),
      instPickupA: inst ? inst.pickupA : 0,
      instMs: inst ? inst.ms : 50,
      breakerMs: 50,
      locked: false,
    });
  }

  const notes: string[] = [];
  if (relays.length === 0) notes.push("The project has no IEC/IEEE IDMT relay devices to import.");
  if (skipped.length > 0) notes.push(`${skipped.length} device(s) are not IDMT relays and stay in the workbench; grading links through them are bridged.`);
  notes.push("Assign each relay to the bus it feeds and enter its maximum load current; the workbench does not store either. Until the load current is entered the pickup is left unchanged.");
  return { relays, skipped, notes };
}

export interface SuiteUpdate {
  id: string;
  name: string;
  curveType: string;
  curveFamily: "IEC" | "IEEE";
  pickupA: number;
  tms: number;
  instPickupA: number;
  instMs: number;
}
export interface SuiteFault {
  downId: string;
  maxFaultA: number; // at the downstream device's own voltage
}
export interface SuiteHandoff {
  at: string;
  updates: SuiteUpdate[];
  faults: SuiteFault[];
}

const fmt = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : String(Math.round(x * 1000) / 1000));

/** Apply an optimiser proposal to a workbench project. Returns a modified copy and a readable list of what changed. */
export function applyHandoff(project: SuiteProject, h: SuiteHandoff): { project: SuiteProject; lines: string[] } {
  const p: SuiteProject = JSON.parse(JSON.stringify(project));
  const lines: string[] = [];

  for (const u of h.updates) {
    const c = p.curves.find((x) => x.id === u.id);
    if (!c || !c.engine || (c.engine.type !== "iec" && c.engine.type !== "ieee")) {
      lines.push(`${u.name}: not found as an IDMT device in the workbench — skipped.`);
      continue;
    }
    const e = c.engine;
    const oldPickup = Number(e.pickup_a);
    const oldTms = Number(e.tms);
    const oldKey = e.key;
    const oldInst = parseInstText(c.inst);
    const parts: string[] = [];

    const newKey = (e.type === "iec" ? IEC_TYPE_TO_KEY : IEEE_TYPE_TO_KEY)[u.curveType];
    if (newKey && newKey !== oldKey) {
      e.key = newKey;
      c.curveType = CURVE_LABELS[e.type]?.[newKey] ?? c.curveType;
      parts.push(`curve ${oldKey} → ${newKey}`);
    }
    if (Math.abs(oldPickup - u.pickupA) > 1e-9) {
      e.pickup_a = u.pickupA;
      c.pickup = `${fmt(u.pickupA)} A`;
      parts.push(`pickup ${fmt(oldPickup)} → ${fmt(u.pickupA)} A`);
    }
    if (Math.abs(oldTms - u.tms) > 1e-9) {
      e.tms = u.tms;
      c.tms = String(u.tms);
      parts.push(`TMS ${fmt(oldTms)} → ${fmt(u.tms)}`);
    }
    const instChanged = !oldInst ? u.instPickupA > 0 : Math.abs(oldInst.pickupA - u.instPickupA) > 1e-9 || Math.abs(oldInst.ms - u.instMs) > 1e-9;
    if (instChanged) {
      c.inst = u.instPickupA > 0 ? `${fmt(u.instPickupA)} A @ ${fmt(u.instMs / 1000)} s` : "—";
      parts.push(`instantaneous ${oldInst ? `${fmt(oldInst.pickupA)} A` : "off"} → ${u.instPickupA > 0 ? `${fmt(u.instPickupA)} A @ ${fmt(u.instMs)} ms` : "off"}`);
    }
    // keep the settings-sheet rows in step where they can be recognised
    for (const row of c.elements ?? []) {
      if (Math.abs(parseFloat(row.amps) - oldPickup) < 1e-6 && /51|idmt|oc|overcurrent|phase/i.test(row.el) && !/inst|50\b/i.test(row.el)) {
        row.amps = String(u.pickupA);
        row.dial = String(u.tms);
      } else if (oldInst && /inst|50\b/i.test(row.el) && Math.abs(parseFloat(row.amps) - oldInst.pickupA) < 1e-6) {
        row.amps = u.instPickupA > 0 ? String(u.instPickupA) : row.amps;
        row.dial = u.instPickupA > 0 ? `${fmt(u.instMs / 1000)} s` : row.dial;
      }
    }
    if (parts.length > 0) lines.push(`${c.name} (${c.circuit}): ${parts.join(", ")}.`);
  }

  for (const f of h.faults) {
    const down = p.curves.find((x) => x.id === f.downId);
    if (!down) continue;
    for (const g of p.gradingPairs ?? []) {
      if (g.down !== f.downId) continue;
      const up = p.curves.find((x) => x.id === g.up);
      if (!up || Math.abs(Number(up.kv) - Number(down.kv)) > 1e-9) {
        lines.push(`Grading ${up?.name ?? g.up} / ${down.name}: different voltage levels — maximum fault current not written.`);
        continue;
      }
      if (Math.abs((g.maxFaultA ?? 0) - f.maxFaultA) > 1) {
        g.maxFaultA = Math.round(f.maxFaultA);
        lines.push(`Grading ${up.name} / ${down.name}: maximum fault current set to ${fmt(f.maxFaultA)} A from the short-circuit study.`);
      }
    }
  }
  return { project: p, lines };
}

/** Build the hand-off from an optimiser proposal (only relays whose settings changed are sent). */
export function buildHandoff(original: RelayDef[], proposed: RelayDef[], faultsA: Record<string, number>): SuiteHandoff {
  const updates: SuiteUpdate[] = [];
  for (const r of proposed) {
    const o = original.find((x) => x.id === r.id);
    if (!o) continue;
    if (o.pickupA !== r.pickupA || o.tms !== r.tms || o.curveType !== r.curveType || o.instPickupA !== r.instPickupA || o.instMs !== r.instMs) {
      updates.push({ id: r.id, name: r.name, curveType: r.curveType, curveFamily: r.curveFamily, pickupA: r.pickupA, tms: r.tms, instPickupA: r.instPickupA, instMs: r.instMs });
    }
  }
  const faults: SuiteFault[] = Object.entries(faultsA)
    .filter(([, a]) => Number.isFinite(a) && a > 0)
    .map(([downId, maxFaultA]) => ({ downId, maxFaultA }));
  return { at: new Date().toISOString(), updates, faults };
}

// ---- hand-off storage (same browser; localStorage may be unavailable) ----
export function putHandoff(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function takeHandoff<T>(key: string, peek = false): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    if (!peek) localStorage.removeItem(key);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
