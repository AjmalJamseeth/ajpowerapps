// Motor Acceleration Time Calculator — time for a motor-load system to
// accelerate from standstill to rated speed, from the rotational form of
// Newton's second law: t = (J × ω) / T_avg, where J is the total
// (motor + load, reflected to the motor shaft) moment of inertia, ω is the
// target angular velocity (rated speed in rad/s), and T_avg is the average
// net accelerating torque available over the run-up (motor torque minus
// load torque, averaged over the acceleration period). Designed from
// scratch; no equivalent module exists elsewhere in AJapps.

export type AccelGrade = "VERY FAST" | "NORMAL" | "SLOW" | "VERY SLOW";

export interface MotorAccelInput {
  momentOfInertiaKgm2: number | null; // total J, motor + load reflected to shaft
  ratedSpeedRpm: number | null;
  avgAcceleratingTorqueNm: number | null; // net average torque during run-up (motor avg - load avg)
}

export const DEFAULT_MOTOR_ACCEL_INPUT: MotorAccelInput = {
  momentOfInertiaKgm2: 2.5,
  ratedSpeedRpm: 1480,
  avgAcceleratingTorqueNm: 180,
};

export interface MotorAccelResult {
  angularVelocityRadPerS: number | null;
  accelTimeS: number | null;
  grade: AccelGrade | null;
}

export function gradeAccelTime(seconds: number): AccelGrade {
  if (seconds < 2) return "VERY FAST";
  if (seconds < 10) return "NORMAL";
  if (seconds < 30) return "SLOW";
  return "VERY SLOW";
}

export function calcMotorAccel(input: MotorAccelInput): MotorAccelResult {
  const { momentOfInertiaKgm2, ratedSpeedRpm, avgAcceleratingTorqueNm } = input;
  if (momentOfInertiaKgm2 == null || momentOfInertiaKgm2 <= 0 || ratedSpeedRpm == null || ratedSpeedRpm <= 0 || avgAcceleratingTorqueNm == null || avgAcceleratingTorqueNm <= 0) {
    return { angularVelocityRadPerS: null, accelTimeS: null, grade: null };
  }

  const angularVelocityRadPerS = (2 * Math.PI * ratedSpeedRpm) / 60;
  const accelTimeS = (momentOfInertiaKgm2 * angularVelocityRadPerS) / avgAcceleratingTorqueNm;

  return { angularVelocityRadPerS, accelTimeS, grade: gradeAccelTime(accelTimeS) };
}
