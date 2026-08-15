// Motor Protection Sizer — overload relay, contactor and ground-fault
// protection sizing for different motor duty classes. No equivalent
// module exists in the source app — designed from scratch.
//
// Standards / references:
//  - Overload relay setting: NEC 430.32(A)(1) — 125% FLA if the motor has
//    a marked service factor ≥1.15 or a marked temperature rise ≤40°C,
//    otherwise 115% FLA (identical rule to the standalone Motor Calculator
//    and HVAC Electrical Sizing modules, so results stay consistent).
//  - Overload relay trip class: IEC 60947-4-1's standard trip classes
//    (10A/10/20/30, named for their max trip time in seconds at 7.2×Ie),
//    selected here from the motor's accelerating time — a well-established
//    industry rule of thumb (light/quick starts → Class 10A/10, medium
//    starts e.g. pumps → Class 20, heavy high-inertia starts e.g. large
//    fans/compressors/crushers → Class 30).
//  - Motor duty class: IEC 60034-1 S1-S8 duty types (S1 continuous ... S8
//    continuous-periodic with speed changes) — used here only to flag
//    when a simple bimetal overload isn't appropriate (cyclic/intermittent
//    duty needs an electronic relay with thermal memory).
//  - Contactor sizing: IEC 60947-4-1 utilization categories AC-3 (normal
//    starting/stopping of squirrel-cage motors — the default case) and
//    AC-4 (jogging/plugging/reversing — more severe switching duty).
//    CAVEAT: there is no single universal AC-4:AC-3 rating ratio in the
//    standard — it is manufacturer/model specific. The 2.0x rule-of-thumb
//    multiplier used here for AC-4 duty is a conservative approximation
//    only; always confirm against the specific contactor's own AC-3/AC-4
//    utilization tables before final selection.
//  - Ground-fault pickup guidance: CAVEAT — this is typical-practice
//    guidance, not a substitute for a proper protective-device
//    coordination study. Actual settings depend on the full system's
//    fault current, CT ratios and upstream/downstream coordination.

export type DutyClass = "S1" | "S2" | "S3" | "S4" | "S5";
export type ContactorDuty = "ac3" | "ac4";
export type GroundingSystem = "solid" | "hrg" | "ungrounded";
export type TripClass = "10A" | "10" | "20" | "30";

export const DUTY_CLASS_LABEL: Record<DutyClass, string> = {
  S1: "S1 — Continuous running duty",
  S2: "S2 — Short-time duty",
  S3: "S3 — Intermittent periodic duty",
  S4: "S4 — Intermittent periodic duty with starting",
  S5: "S5 — Intermittent periodic duty with starting and electric braking",
};

// IEC 60947-4-1-style AC-3 contactor rated current steps (common catalog
// frame sizes, A).
export const STD_CONTACTOR_SIZES = [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 170, 205, 225, 265, 300, 400, 450, 500, 630];
const AC4_FACTOR = 2.0; // conservative rule-of-thumb — see module header caveat

function roundUpContactor(val: number): number {
  const s = STD_CONTACTOR_SIZES.find((s) => s >= val);
  return s === undefined ? STD_CONTACTOR_SIZES[STD_CONTACTOR_SIZES.length - 1] : s;
}

function tripClassFromStartTime(startingTimeS: number): TripClass {
  if (startingTimeS <= 2) return "10A";
  if (startingTimeS <= 10) return "10";
  if (startingTimeS <= 20) return "20";
  return "30";
}

export interface MotorProtectionInput {
  motorFlaA: number | null;
  sfHighTemp: boolean; // SF≥1.15 or temp rise ≤40°C → 125%, else 115% (NEC 430.32)
  startingTimeS: number | null;
  dutyClass: DutyClass;
  startsPerHour: number | null;
  contactorDuty: ContactorDuty;
  groundingSystem: GroundingSystem;
  systemChargingCurrentA: number | null; // HRG systems only
}

export const DEFAULT_MOTORPROTECTION_INPUT: MotorProtectionInput = {
  motorFlaA: 34,
  sfHighTemp: false,
  startingTimeS: 8,
  dutyClass: "S1",
  startsPerHour: 4,
  contactorDuty: "ac3",
  groundingSystem: "solid",
  systemChargingCurrentA: 5,
};

export interface OverloadResult {
  settingPct: number;
  settingA: number;
  tripClass: TripClass;
  needsThermalMemory: boolean;
}
export interface ContactorResult {
  requiredEquivalentA: number;
  recommendedSizeA: number;
}
export interface GroundFaultResult {
  pickupA: number | null;
  timeDelayS: number;
  basis: string;
}

export interface MotorProtectionResult {
  overload: OverloadResult;
  contactor: ContactorResult;
  groundFault: GroundFaultResult;
}

export function calcMotorProtection(input: MotorProtectionInput): MotorProtectionResult | null {
  const fla = input.motorFlaA;
  if (fla == null || fla <= 0) return null;

  const settingPct = input.sfHighTemp ? 125 : 115;
  const settingA = fla * (settingPct / 100);
  const startTime = input.startingTimeS ?? 10;
  const tripClass = tripClassFromStartTime(startTime);
  const needsThermalMemory = input.dutyClass === "S4" || input.dutyClass === "S5" || (input.startsPerHour ?? 0) > 15;

  const overload: OverloadResult = { settingPct, settingA, tripClass, needsThermalMemory };

  const requiredEquivalentA = input.contactorDuty === "ac4" ? fla * AC4_FACTOR : fla;
  const recommendedSizeA = roundUpContactor(requiredEquivalentA);
  const contactor: ContactorResult = { requiredEquivalentA, recommendedSizeA };

  let groundFault: GroundFaultResult;
  if (input.groundingSystem === "solid") {
    groundFault = { pickupA: Math.max(0.2 * fla, 5), timeDelayS: 0.1, basis: "20% of FLA (min. 5A), fast definite-time — typical practice for solidly/low-resistance grounded systems" };
  } else if (input.groundingSystem === "hrg") {
    const icg = input.systemChargingCurrentA;
    groundFault = icg != null && icg > 0
      ? { pickupA: Math.max(2 * icg, 1), timeDelayS: 1.0, basis: "≈2× system charging current, alarm/delayed-trip — coordinate with the NGR resistor sizing (see Generator & Transformer Analysis module)" }
      : { pickupA: null, timeDelayS: 1.0, basis: "enter the system's own charging current to estimate a pickup setting" };
  } else {
    groundFault = { pickupA: 5, timeDelayS: 1.0, basis: "fixed low pickup (≈5A), alarm-only — ungrounded systems have inherently low fault magnitude; confirm against a ground-detection coordination study" };
  }

  return { overload, contactor, groundFault };
}
