// Standalone Motor Calculator — NEC Article 430 (FLC tables, branch-circuit/
// OCPD/overload/disconnect sizing) or IEC general method. Independent of any
// protection-relay motor tab. Ported and verified from the AJ Apps Suite's
// `MotorCalc` module. Entirely a subscriber feature in the source app.

export type MotorStandard = "nec" | "iec";
export type MotorPhase = "1" | "3";
export type MotorType = "squirrel" | "wound" | "sync";
export type StartMethod = "dol" | "stardelta" | "softstarter" | "vfd";
export type DeviceType = "ntd" | "td" | "itb";

export const STD_SIZES = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];

// NEC Table 430.248 — Single-Phase FLC. {hp: [115V,200V,208V,230V]}
export const T430_248: Record<string, (number | null)[]> = {
  "1/6": [4.4, 2.5, 2.4, 2.2], "1/4": [5.8, 3.3, 3.2, 2.9], "1/3": [7.2, 4.1, 4.0, 3.6],
  "1/2": [9.8, 5.6, 5.4, 4.9], "3/4": [13.8, 7.9, 7.6, 6.9], "1": [16, 9.2, 8.8, 8.0],
  "1.5": [20, 11.5, 11.0, 10], "2": [24, 13.8, 13.2, 12], "3": [34, 19.6, 18.7, 17],
  "5": [56, 32.2, 30.8, 28], "7.5": [80, 46.0, 44.0, 40], "10": [100, 57.5, 55.0, 50],
};
export const V_248 = [115, 200, 208, 230];

// NEC Table 430.250 — Three-Phase Induction FLC. {hp: [115,200,208,230,460,575,2300]}
export const T430_250_IND: Record<string, (number | null)[]> = {
  "0.5": [4.4, 2.5, 2.4, 2.2, 1.1, 0.9, null], "0.75": [6.4, 3.7, 3.5, 3.2, 1.6, 1.3, null],
  "1": [8.4, 4.8, 4.6, 4.2, 2.1, 1.7, null], "1.5": [12.0, 6.9, 6.6, 6.0, 3.0, 2.4, null],
  "2": [13.6, 7.8, 7.5, 6.8, 3.4, 2.7, null], "3": [null, 11.0, 10.6, 9.6, 4.8, 3.9, null],
  "5": [null, 17.5, 16.7, 15.2, 7.6, 6.1, null], "7.5": [null, 25.3, 24.2, 22, 11, 9, null],
  "10": [null, 32.2, 30.8, 28, 14, 11, null], "15": [null, 48.3, 46.2, 42, 21, 17, null],
  "20": [null, 62.1, 59.4, 54, 27, 22, null], "25": [null, 78.2, 74.8, 68, 34, 27, null],
  "30": [null, 92, 88, 80, 40, 32, null], "40": [null, 120, 114, 104, 52, 41, null],
  "50": [null, 150, 143, 130, 65, 52, null], "60": [null, 177, 169, 154, 77, 62, 16],
  "75": [null, 221, 211, 192, 96, 77, 20], "100": [null, 285, 273, 248, 124, 99, 26],
  "125": [null, 359, 343, 312, 156, 125, 31], "150": [null, 414, 396, 360, 180, 144, 37],
  "200": [null, 552, 528, 480, 240, 192, 49], "250": [null, null, null, null, 302, 242, 60],
  "300": [null, null, null, null, 361, 289, 72], "350": [null, null, null, null, 414, 336, 83],
  "400": [null, null, null, null, 477, 382, 95], "450": [null, null, null, null, 515, 412, 103],
  "500": [null, null, null, null, 590, 472, 118],
};
// Synchronous-type unity PF (footnote: for 90%/80% PF, multiply by 1.1 / 1.25)
export const T430_250_SYNC: Record<string, (number | null)[]> = {
  "25": [53, 26, 21, null], "30": [63, 32, 26, null], "40": [83, 41, 33, null],
  "50": [104, 52, 42, null], "60": [123, 61, 49, 12], "75": [155, 78, 62, 15],
  "100": [202, 101, 81, 20], "125": [253, 126, 101, 25], "150": [302, 151, 121, 30],
  "200": [400, 201, 161, 40],
};
export const V_250 = [115, 200, 208, 230, 460, 575, 2300];
export const V_250_SYNC = [230, 460, 575, 2300];

// NEC Table 430.52(C)(1) — max % of FLC for branch-circuit OCPD
const T430_52 = {
  other: { ntd: 300, td: 175, itb: 250 },
  wound: { ntd: 150, td: 150, itb: 150 },
};
function exceptionPct(device: DeviceType, flc: number): number {
  if (device === "ntd") return 400;
  if (device === "td") return 225;
  return flc > 100 ? 300 : 400; // itb
}
function roundUpStd(val: number): number {
  const s = STD_SIZES.find((s) => s >= val);
  return s === undefined ? STD_SIZES[STD_SIZES.length - 1] : s;
}
function roundDownStd(val: number): number {
  const arr = STD_SIZES.filter((s) => s <= val);
  return arr.length ? arr[arr.length - 1] : STD_SIZES[0];
}

export function hpOptions(phase: MotorPhase, type: MotorType): string[] {
  const table = phase === "1" ? T430_248 : type === "sync" ? T430_250_SYNC : T430_250_IND;
  const toNum = (h: string) => (h.includes("/") ? (() => { const [a, b] = h.split("/").map(Number); return a / b; })() : parseFloat(h));
  return Object.keys(table).sort((a, b) => toNum(a) - toNum(b));
}
export function voltageOptions(phase: MotorPhase, type: MotorType, hp: string): number[] {
  const { table, vlist } = pickTable(phase, type);
  const row = table[hp];
  if (!row) return [];
  return vlist.map((v, i) => (row[i] != null ? v : null)).filter((v): v is number => v != null);
}
function pickTable(phase: MotorPhase, type: MotorType): { table: Record<string, (number | null)[]>; vlist: number[] } {
  if (phase === "1") return { table: T430_248, vlist: V_248 };
  if (type === "sync") return { table: T430_250_SYNC, vlist: V_250_SYNC };
  return { table: T430_250_IND, vlist: V_250 };
}
function lookupFLC(phase: MotorPhase, type: MotorType, hp: string, voltage: number, syncPf: "100" | "90" | "80"): number | null {
  const { table, vlist } = pickTable(phase, type);
  const row = table[hp];
  if (!row) return null;
  const idx = vlist.indexOf(voltage);
  if (idx < 0 || row[idx] == null) return null;
  let flc = row[idx] as number;
  if (phase === "3" && type === "sync") {
    if (syncPf === "90") flc *= 1.1;
    else if (syncPf === "80") flc *= 1.25;
  }
  return flc;
}
function ocpdCategory(phase: MotorPhase, type: MotorType) {
  return phase === "3" && type === "wound" ? T430_52.wound : T430_52.other;
}

export interface FeedRow {
  desc: string;
  flc: number | null;
  wound: boolean;
}

export interface MotorInput {
  standard: MotorStandard;
  phase: MotorPhase;
  type: MotorType;
  hp: string;
  voltage: number;
  syncPf: "100" | "90" | "80";
  nameplateFlc: number | null;
  iecMargin: number;
  sfHighTemp: boolean; // true = 125%, false = 115%
  deviceType: DeviceType;
  startMethod: StartMethod;
  lra: number | null;
  currentLimitMult: number | null;
  sysVoltage: number | null;
  scCapacityKva: number | null;
  maxDipPct: number | null;
  feedRows: FeedRow[];
  feedDeviceType: DeviceType;
  feedIecMargin: number;
}

export const DEFAULT_MOTOR_INPUT: MotorInput = {
  standard: "nec",
  phase: "3",
  type: "squirrel",
  hp: "25",
  voltage: 460,
  syncPf: "100",
  nameplateFlc: 42,
  iecMargin: 1.0,
  sfHighTemp: false,
  deviceType: "td",
  startMethod: "dol",
  lra: 180,
  currentLimitMult: 3,
  sysVoltage: 460,
  scCapacityKva: 5000,
  maxDipPct: 15,
  feedRows: [
    { desc: "Largest Motor", flc: 28, wound: false },
    { desc: "Motor 2", flc: 14, wound: false },
  ],
  feedDeviceType: "td",
  feedIecMargin: 1.0,
};

export interface MotorResult {
  flc: number | null;
  branchAmpacityA: number | null;
  discA: number | null;
  overloadA: number | null;
  maxOcpdA: number | null;
  maxOcpdExceptionA: number | null;
  iecDesignA: number | null;
  startCurrentA: number | null;
  startKva: number | null;
  dipPct: number | null;
  dipPass: boolean | null;
  feed: {
    largestDesc: string;
    ampacityA: number;
    ocpdA: number | null;
    iecDesignA: number | null;
  } | null;
}

export function calcMotor(input: MotorInput): MotorResult {
  const nec = input.standard === "nec";
  let flc: number | null = nec ? lookupFLC(input.phase, input.type, input.hp, input.voltage, input.syncPf) : input.nameplateFlc;

  let branchAmpacityA: number | null = null,
    discA: number | null = null,
    overloadA: number | null = null,
    maxOcpdA: number | null = null,
    maxOcpdExceptionA: number | null = null,
    iecDesignA: number | null = null;

  if (flc != null) {
    branchAmpacityA = 1.25 * flc;
    discA = 1.15 * flc;
    const ovlPct = input.sfHighTemp ? 125 : 115;
    overloadA = (ovlPct / 100) * flc;
    if (nec) {
      const cat = ocpdCategory(input.phase, input.type);
      const pct = { ntd: cat.ntd, td: cat.td, itb: cat.itb }[input.deviceType];
      maxOcpdA = roundUpStd((pct / 100) * flc);
      maxOcpdExceptionA = roundDownStd((exceptionPct(input.deviceType, flc) / 100) * flc);
    } else {
      iecDesignA = flc * (input.iecMargin || 1);
    }
  }

  let startCurrentA: number | null = null;
  if (input.startMethod === "dol" || input.startMethod === "stardelta") {
    if (input.lra != null) startCurrentA = input.startMethod === "stardelta" ? input.lra / 3 : input.lra;
  } else {
    if (input.currentLimitMult != null && flc != null) startCurrentA = flc * input.currentLimitMult;
  }

  let startKva: number | null = null,
    dipPct: number | null = null,
    dipPass: boolean | null = null;
  if (startCurrentA != null && input.sysVoltage != null) {
    startKva = ((input.phase === "3" ? Math.sqrt(3) : 1) * input.sysVoltage * startCurrentA) / 1000;
    if (input.scCapacityKva != null) {
      dipPct = (startKva / (input.scCapacityKva + startKva)) * 100;
      if (input.maxDipPct != null) dipPass = dipPct <= input.maxDipPct;
    }
  }

  let feed: MotorResult["feed"] = null;
  const rows = input.feedRows.filter((r) => r.flc != null && r.flc > 0) as { desc: string; flc: number; wound: boolean }[];
  if (rows.length) {
    let largest = rows[0];
    rows.forEach((r) => { if (r.flc > largest.flc) largest = r; });
    const sumAll = rows.reduce((a, r) => a + r.flc, 0);
    const sumOthers = sumAll - largest.flc;
    const ampacityA = 1.25 * largest.flc + sumOthers;
    let ocpdA: number | null = null,
      iecFeedA: number | null = null;
    if (nec) {
      const cat = largest.wound ? T430_52.wound : T430_52.other;
      const pct = { ntd: cat.ntd, td: cat.td, itb: cat.itb }[input.feedDeviceType];
      ocpdA = roundUpStd((pct / 100) * largest.flc) + sumOthers;
    } else {
      iecFeedA = sumAll * (input.feedIecMargin || 1);
    }
    feed = { largestDesc: largest.desc + (largest.wound ? ", wound-rotor" : ""), ampacityA, ocpdA, iecDesignA: iecFeedA };
  }

  return { flc, branchAmpacityA, discA, overloadA, maxOcpdA, maxOcpdExceptionA, iecDesignA, startCurrentA, startKva, dipPct, dipPass, feed };
}
