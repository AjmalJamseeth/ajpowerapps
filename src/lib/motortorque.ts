// Motor Torque Calculator — steady-state shaft torque from motor output
// power and operating speed, using the standard power-torque-speed
// relations: T(N·m) = 9550 × P(kW) / N(rpm), or T(lb-ft) = 5252 × P(hp) /
// N(rpm). Designed from scratch; no equivalent module exists elsewhere in
// AJapps (the existing Motor Calculator covers branch-circuit/OCPD sizing
// and FLC, not shaft torque).

export type TorqueUnitSystem = "metric" | "imperial";

export interface MotorTorqueInput {
  unitSystem: TorqueUnitSystem;
  powerKw: number | null;
  powerHp: number | null;
  speedRpm: number | null;
}

export const DEFAULT_MOTOR_TORQUE_INPUT: MotorTorqueInput = {
  unitSystem: "metric",
  powerKw: 37,
  powerHp: 50,
  speedRpm: 1480,
};

export interface MotorTorqueResult {
  torqueNm: number | null;
  torqueLbFt: number | null;
}

const NM_PER_LBFT = 1.35582;

export function calcMotorTorque(input: MotorTorqueInput): MotorTorqueResult {
  const { unitSystem, powerKw, powerHp, speedRpm } = input;
  if (speedRpm == null || speedRpm <= 0) return { torqueNm: null, torqueLbFt: null };

  if (unitSystem === "metric") {
    if (powerKw == null || powerKw <= 0) return { torqueNm: null, torqueLbFt: null };
    const torqueNm = (9550 * powerKw) / speedRpm;
    return { torqueNm, torqueLbFt: torqueNm / NM_PER_LBFT };
  }

  if (powerHp == null || powerHp <= 0) return { torqueNm: null, torqueLbFt: null };
  const torqueLbFt = (5252 * powerHp) / speedRpm;
  return { torqueNm: torqueLbFt * NM_PER_LBFT, torqueLbFt };
}
