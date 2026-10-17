// Operating time of any protection device described the way the Protection
// Coordination Workbench stores it (`engine` descriptor in a project file),
// built on the shared curve engine. Mirrors the workbench's own
// `generateNativePoints` (project-model.js) so the optimiser and the workbench
// agree on what every device does.

import * as CE from "./curveEngine";

/** Device descriptor as stored by the workbench (`curve.engine`), plus an optional point table for hand-authored curves. */
export interface DeviceEngine {
  type: string; // iec | ieee | dt | instantaneous | lsig | thermalmag | mcb | fuse | motor | negseq | custom_equation | points
  key?: string;
  tms?: number;
  pickup_a?: number;
  delayS?: number;
  operateS?: number;
  lsig?: CE.LsigParams;
  bandTolerance?: number;
  tm?: CE.ThermalMagParams;
  mcbType?: string;
  InAmps?: number;
  motor?: { tau: number; Ith: number; Ip?: number };
  lockedRotor?: { pickupA: number; stallTimeS: number };
  negseq?: { K: number; I1rated: number; pickupPu?: number; minTimeS?: number };
  customParams?: CE.CustomEqParams;
  points?: CE.Pt[]; // custom point table, native amps
}

export const DEVICE_TYPE_LABEL: Record<string, string> = {
  iec: "IEC IDMT",
  ieee: "IEEE IDMT",
  dt: "Definite time",
  instantaneous: "Instantaneous",
  lsig: "LSIG breaker",
  thermalmag: "Thermal-magnetic breaker",
  mcb: "MCB",
  fuse: "Fuse",
  motor: "Motor protection",
  negseq: "Negative sequence",
  custom_equation: "Custom curve (equation)",
  points: "Custom curve (points)",
};

/** True when the descriptor can be evaluated by deviceTimeS. */
export function isTimeDevice(e: DeviceEngine | undefined): boolean {
  if (!e) return false;
  switch (e.type) {
    case "iec":
    case "ieee":
      return !!e.key && Number(e.pickup_a) > 0 && Number(e.tms) > 0;
    case "dt":
      return Number(e.pickup_a) > 0 && Number(e.delayS) >= 0;
    case "instantaneous":
      return Number(e.pickup_a) > 0;
    case "lsig":
      return !!e.lsig && Number(e.lsig.Ir) > 0;
    case "thermalmag":
      return !!e.tm && Number(e.tm.Ir) > 0;
    case "mcb":
      return !!e.mcbType && Number(e.InAmps) > 0;
    case "fuse":
      return Number(e.InAmps) > 0;
    case "motor":
      return !!e.motor && Number(e.motor.Ith) > 0 && Number(e.motor.tau) > 0;
    case "negseq":
      return !!e.negseq;
    case "custom_equation":
      return !!e.customParams && Number(e.pickup_a) > 0 && Number(e.tms) > 0;
    case "points":
      return Array.isArray(e.points) && e.points.length >= 2;
    default:
      return false;
  }
}

/** The current a device is "based on" (pickup / rated / long-time pickup) — used as the lower end of grading sweeps. */
export function baseCurrentA(e: DeviceEngine): number {
  switch (e.type) {
    case "iec":
    case "ieee":
    case "dt":
    case "instantaneous":
    case "custom_equation":
      return Number(e.pickup_a) || 0;
    case "lsig":
      return e.lsig ? e.lsig.Ir : 0;
    case "thermalmag":
      return e.tm ? e.tm.Ir : 0;
    case "mcb":
    case "fuse":
      return Number(e.InAmps) || 0;
    case "motor":
      return e.motor ? e.motor.Ith : 0;
    case "negseq":
      return e.negseq ? e.negseq.I1rated : 0;
    case "points":
      return e.points && e.points.length ? Math.min(...e.points.map((p) => p[0])) : 0;
    default:
      return 0;
  }
}

/** Operating time in seconds at `amps` (native device current). Infinity = does not operate. Never throws. */
export function deviceTimeS(e: DeviceEngine, amps: number): number {
  try {
    switch (e.type) {
      case "iec":
        return CE.iecTime(e.key as string, e.tms as number, amps / (e.pickup_a as number));
      case "ieee":
        return CE.ieeeTime(e.key as string, e.tms as number, amps / (e.pickup_a as number));
      case "dt":
        return CE.definiteTime(e.pickup_a as number, e.delayS as number, amps);
      case "instantaneous":
        return CE.instantaneousTime(e.pickup_a as number, amps, e.operateS);
      case "lsig":
        return CE.lsigTime(e.lsig as CE.LsigParams, amps);
      case "thermalmag":
        return CE.thermalMagneticTime(e.tm as CE.ThermalMagParams, amps);
      case "mcb":
        return tableTime(CE.mcbCurvePoints(e.mcbType as string, e.InAmps as number), amps);
      case "fuse":
        return tableTime(CE.fuseTotalClearPoints(e.InAmps as number), amps);
      case "motor": {
        const m = e.motor as { tau: number; Ith: number; Ip?: number };
        const tTh = CE.motorThermalTime(m, amps);
        const lr = e.lockedRotor;
        const tLr = lr && lr.pickupA > 0 && amps >= lr.pickupA ? lr.stallTimeS : Infinity;
        return Math.min(tTh, tLr);
      }
      case "negseq":
        return CE.negSeqTime(e.negseq as { K: number; I1rated: number }, amps);
      case "custom_equation":
        return CE.customEquationTime(e.customParams as CE.CustomEqParams, e.tms as number, amps / (e.pickup_a as number));
      case "points":
        return tableTime(e.points as CE.Pt[], amps);
      default:
        return Infinity;
    }
  } catch {
    return Infinity;
  }
}

// The workbench plots MCB, fuse and point-table devices as tables; outside the table the end value is held.
function tableTime(pts: CE.Pt[], amps: number): number {
  const t = CE.pointTableTime(pts, amps);
  return t === null ? Infinity : t;
}

/** ± tolerance on operating time for devices that publish a band (LSIG); 0 otherwise. */
export function bandTolerance(e: DeviceEngine, bandOn: boolean): number {
  if (e.type === "lsig" && bandOn) return typeof e.bandTolerance === "number" ? e.bandTolerance : 0.2;
  return 0;
}

/** Device kinds the studio can create. "idmt" is the tunable IEC/IEEE relay (no engine); every other kind carries an engine. */
export const DEVICE_KINDS: { value: string; label: string }[] = [
  { value: "idmt", label: "IDMT relay (IEC / IEEE) — tuned by the solver" },
  { value: "dt", label: "Definite-time overcurrent" },
  { value: "instantaneous", label: "Instantaneous element" },
  { value: "lsig", label: "LSIG breaker (electronic trip unit)" },
  { value: "thermalmag", label: "Thermal-magnetic breaker" },
  { value: "mcb", label: "MCB (B / C / D)" },
  { value: "fuse", label: "Fuse (gG)" },
  { value: "motor", label: "Motor protection (thermal + locked rotor)" },
  { value: "negseq", label: "Negative-sequence (46)" },
  { value: "custom_equation", label: "Custom curve — equation" },
  { value: "points", label: "Custom curve — point table" },
];

/** Typical starting values for a new device of the given kind, scaled to a pickup / rated current. */
export function defaultEngine(kind: string, baseA = 100): DeviceEngine | undefined {
  const b = Math.max(1, Math.round(baseA));
  switch (kind) {
    case "dt":
      return { type: "dt", pickup_a: b, delayS: 0.5 };
    case "instantaneous":
      return { type: "instantaneous", pickup_a: b * 8, operateS: 0.02 };
    case "lsig":
      return { type: "lsig", lsig: { Ir: b, TL: 8, Ist: b * 5, TS: 0.2, stI2tOn: false, Iinst: b * 10, instDelay: 0.02 }, bandTolerance: 0.2 };
    case "thermalmag":
      return { type: "thermalmag", tm: { Ir: b, TL: 8, Iinst: b * 10, instDelay: 0.02 } };
    case "mcb":
      return { type: "mcb", mcbType: "C", InAmps: Math.min(63, b) };
    case "fuse":
      return { type: "fuse", InAmps: b };
    case "motor":
      return { type: "motor", motor: { tau: 600, Ith: b }, lockedRotor: { pickupA: b * 6, stallTimeS: 10 } };
    case "negseq":
      return { type: "negseq", negseq: { K: 10, I1rated: b, pickupPu: 0.05, minTimeS: 0.2 } };
    case "custom_equation":
      return { type: "custom_equation", pickup_a: b, tms: 0.2, customParams: { k: 0.14, alpha: 0.02, L: 0 } };
    case "points":
      return { type: "points", points: [[b * 1.5, 100], [b * 5, 5], [b * 20, 0.2]] };
    default:
      return undefined;
  }
}
