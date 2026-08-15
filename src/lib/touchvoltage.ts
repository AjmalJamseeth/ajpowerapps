// Touch Voltage from Neutral/Earth Imbalance — estimates the touch voltage
// appearing on exposed conductive parts from an unbalanced neutral/earth
// fault current flowing through a ground-path impedance (Vtouch = Ifault x
// Zground x touch-voltage factor), and compares it against the IEC
// 60364-4-41 conventional touch-voltage limits (UL = 50V in dry/normal
// conditions, 25V in wet/conductive locations). Designed from scratch; no
// equivalent module in the source app.

export type TouchVoltageEnvironment = "dry" | "wet";

export interface TouchVoltageInput {
  imbalanceCurrentA: number | null; // unbalanced neutral / earth fault current
  groundPathOhms: number; // total earth/bonding path impedance carrying that current
  touchFactor: number; // fraction of the total ground-potential-rise appearing across the body (site/geometry dependent, default 1.0 = worst case)
  environment: TouchVoltageEnvironment;
}

export const DEFAULT_TOUCH_VOLTAGE_INPUT: TouchVoltageInput = {
  imbalanceCurrentA: 15,
  groundPathOhms: 2,
  touchFactor: 1.0,
  environment: "dry",
};

export interface TouchVoltageResult {
  groundPotentialRiseV: number | null;
  touchVoltageV: number | null;
  limitV: number;
  pass: boolean | null;
  // rough body current estimate using a commonly-cited 1000 ohm body resistance assumption (IEC 60479-1 reference value), for context only
  estimatedBodyCurrentMa: number | null;
}

const BODY_RESISTANCE_OHM = 1000; // IEC 60479-1 commonly-cited reference hand-to-hand/hand-to-foot body resistance

export function calcTouchVoltage(input: TouchVoltageInput): TouchVoltageResult {
  const { imbalanceCurrentA, groundPathOhms, touchFactor, environment } = input;
  const limitV = environment === "wet" ? 25 : 50;

  if (imbalanceCurrentA == null || groundPathOhms < 0) {
    return { groundPotentialRiseV: null, touchVoltageV: null, limitV, pass: null, estimatedBodyCurrentMa: null };
  }

  const groundPotentialRiseV = imbalanceCurrentA * groundPathOhms;
  const touchVoltageV = groundPotentialRiseV * touchFactor;
  const pass = touchVoltageV <= limitV;
  const estimatedBodyCurrentMa = (touchVoltageV / BODY_RESISTANCE_OHM) * 1000;

  return { groundPotentialRiseV, touchVoltageV, limitV, pass, estimatedBodyCurrentMa };
}
