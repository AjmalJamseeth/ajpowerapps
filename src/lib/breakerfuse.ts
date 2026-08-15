// Circuit Breaker & Fuse Sizer — general-purpose overcurrent protective
// device (OCPD) selection for continuous/non-continuous loads (NEC
// 210.19(A)(1)/215.2(A)(1) + 240.4/240.6(A), or IEC 60364-4-43 general
// method Ib≤In≤Iz with I2≤1.45·Iz), plus a motor-starting-current
// withstand path reusing the same NEC 430.52(C)(1) percentage-of-FLC
// method as the standalone Motor Calculator. No equivalent single module
// exists in the source app — designed from scratch, cross-checked against
// the Motor Calculator's own verified NEC 430.52 figures for the motor
// path so both tools stay consistent.

export type BfStandard = "nec" | "iec";
export type LoadKind = "general" | "motor";
export type OcpdKind = "breaker" | "fuse"; // used for IEC I2 multiplier
export type NecMotorDevice = "ntd" | "td" | "itb";
export type MotorCategory = "other" | "wound"; // NEC 430.52(C)(1) table columns

// NEC 240.6(A) standard fuse/breaker ampere ratings — also used as a
// generic international standard-size list for the IEC path.
export const STD_SIZES = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];

function roundUpStd(val: number): number {
  const s = STD_SIZES.find((s) => s >= val);
  return s === undefined ? STD_SIZES[STD_SIZES.length - 1] : s;
}
function roundDownStd(val: number): number {
  const arr = STD_SIZES.filter((s) => s <= val);
  return arr.length ? arr[arr.length - 1] : STD_SIZES[0];
}

// NEC Table 430.52(C)(1) — max % of FLC for branch-circuit OCPD.
const T430_52: Record<MotorCategory, Record<NecMotorDevice, number>> = {
  other: { ntd: 300, td: 175, itb: 250 },
  wound: { ntd: 150, td: 150, itb: 150 },
};
// 430.52(C)(1)(b) exception ceilings (only if standard sizing is genuinely
// insufficient to start the motor).
function exceptionPct(device: NecMotorDevice, flc: number): number {
  if (device === "ntd") return 400;
  if (device === "td") return 225;
  return flc > 100 ? 300 : 400; // itb
}

export interface BreakerFuseInput {
  standard: BfStandard;
  loadKind: LoadKind;
  ocpdKind: OcpdKind;

  // General / continuous load
  continuousA: number | null;
  nonContinuousA: number | null;
  cableAmpacityA: number | null; // Iz

  // Motor load (starting-current withstand)
  motorFlaA: number | null;
  necMotorDevice: NecMotorDevice;
  motorCategory: MotorCategory;
  iecMarginFactor: number;
}

export const DEFAULT_BREAKERFUSE_INPUT: BreakerFuseInput = {
  standard: "nec",
  loadKind: "general",
  ocpdKind: "breaker",
  continuousA: 80,
  nonContinuousA: 20,
  cableAmpacityA: 130,
  motorFlaA: 34,
  necMotorDevice: "td",
  motorCategory: "other",
  iecMarginFactor: 1.1,
};

export interface GeneralOcpdResult {
  minOcpdA: number;
  recommendedOcpdA: number;
  cableProtected: boolean | null;
  via240_4B: boolean; // NEC only: passed via the "next standard size up" exception
  i2A: number | null; // IEC conventional operating current
  i2Ok: boolean | null;
}
export interface MotorOcpdResult {
  minOcpdA: number;
  recommendedOcpdA: number | null; // NEC standard size, or null on IEC path
  exceptionCeilingA: number | null; // NEC 430.52(C)(1)(b), or null on IEC path
  iecDesignA: number | null;
}

export function calcBreakerFuseGeneral(input: BreakerFuseInput): GeneralOcpdResult | null {
  const cont = input.continuousA ?? 0;
  const nonCont = input.nonContinuousA ?? 0;
  if (cont <= 0 && nonCont <= 0) return null;

  const minOcpdA = 1.25 * cont + 1.0 * nonCont;
  const recommendedOcpdA = roundUpStd(minOcpdA);

  if (input.standard === "nec") {
    const iz = input.cableAmpacityA;
    if (iz == null || iz <= 0) return { minOcpdA, recommendedOcpdA, cableProtected: null, via240_4B: false, i2A: null, i2Ok: null };
    const direct = recommendedOcpdA <= iz;
    // NEC 240.4(B): where Iz doesn't correspond to a standard OCPD size,
    // the next higher standard size is permitted (≤800A).
    const izIsStandard = STD_SIZES.includes(iz);
    const via240_4B = !direct && !izIsStandard && roundUpStd(iz) === recommendedOcpdA && iz <= 800;
    return { minOcpdA, recommendedOcpdA, cableProtected: direct || via240_4B, via240_4B, i2A: null, i2Ok: null };
  }

  // IEC 60364-4-43: Ib ≤ In ≤ Iz, and I2 ≤ 1.45·Iz.
  const iz = input.cableAmpacityA;
  const i2Mult = input.ocpdKind === "fuse" ? 1.6 : 1.45;
  const i2A = recommendedOcpdA * i2Mult;
  if (iz == null || iz <= 0) return { minOcpdA, recommendedOcpdA, cableProtected: null, via240_4B: false, i2A, i2Ok: null };
  const inOk = recommendedOcpdA <= iz;
  const i2Ok = i2A <= 1.45 * iz;
  return { minOcpdA, recommendedOcpdA, cableProtected: inOk && i2Ok, via240_4B: false, i2A, i2Ok };
}

export function calcBreakerFuseMotor(input: BreakerFuseInput): MotorOcpdResult | null {
  const flc = input.motorFlaA;
  if (flc == null || flc <= 0) return null;

  if (input.standard === "nec") {
    const pct = T430_52[input.motorCategory][input.necMotorDevice];
    const minOcpdA = (pct / 100) * flc;
    const recommendedOcpdA = roundUpStd(minOcpdA);
    const excPct = exceptionPct(input.necMotorDevice, flc);
    const exceptionCeilingA = roundDownStd((excPct / 100) * flc);
    return { minOcpdA, recommendedOcpdA, exceptionCeilingA, iecDesignA: null };
  }

  const margin = input.iecMarginFactor || 1;
  const iecDesignA = flc * margin;
  return { minOcpdA: iecDesignA, recommendedOcpdA: null, exceptionCeilingA: null, iecDesignA };
}
