// Fire & Gas Detection Loop Power Budget — standby and alarm-condition
// voltage budget for a two-wire initiating device circuit (IDC) carrying
// multiple detectors and an end-of-line (EOL) resistor, checking that the
// farthest device still sees adequate operating voltage in both states.
// This is a generic loop-budget model built the same way as this suite's
// 4-20mA loop calculator — the same Ohm's-law reasoning fire alarm/gas
// detection panels use internally (consistent with NFPA 72 IDC design
// practice), not a single fixed published formula, since exact loop
// topology (e.g. whether the EOL is bypassed during alarm) is panel/
// manufacturer-specific. Designed from scratch; no equivalent module in
// the source app.

export interface FgLoopInput {
  supplyVoltageV: number | null;
  numDevices: number;
  standbyMaPerDevice: number; // quiescent current draw per device
  alarmMaPerDevice: number; // current draw per device while in alarm
  numDevicesAlarming: number; // worst-case simultaneous alarm count
  eolResistorOhms: number; // 0 = no EOL / addressable loop without a discrete EOL resistor
  loopResistanceOhms: number | null; // round-trip wiring resistance
  minOperatingVoltageV: number; // minimum voltage the farthest device needs to operate correctly
}

export const DEFAULT_FG_LOOP_INPUT: FgLoopInput = {
  supplyVoltageV: 24,
  numDevices: 10,
  standbyMaPerDevice: 0.5,
  alarmMaPerDevice: 30,
  numDevicesAlarming: 1,
  eolResistorOhms: 10000,
  loopResistanceOhms: 20,
  minOperatingVoltageV: 16,
};

export interface FgLoopResult {
  standbyCurrentA: number | null;
  standbyVoltageAtDevice: number | null;
  standbyPass: boolean | null;
  alarmCurrentA: number | null;
  alarmVoltageAtDevice: number | null;
  alarmPass: boolean | null;
}

export function calcFgLoop(input: FgLoopInput): FgLoopResult {
  const {
    supplyVoltageV,
    numDevices,
    standbyMaPerDevice,
    alarmMaPerDevice,
    numDevicesAlarming,
    eolResistorOhms,
    loopResistanceOhms,
    minOperatingVoltageV,
  } = input;

  if (supplyVoltageV == null || loopResistanceOhms == null) {
    return {
      standbyCurrentA: null,
      standbyVoltageAtDevice: null,
      standbyPass: null,
      alarmCurrentA: null,
      alarmVoltageAtDevice: null,
      alarmPass: null,
    };
  }

  // Standby: every device draws its quiescent current, plus the EOL
  // resistor's own supervisory current (if present).
  const eolCurrentA = eolResistorOhms > 0 ? supplyVoltageV / eolResistorOhms : 0;
  const standbyCurrentA = (numDevices * standbyMaPerDevice) / 1000 + eolCurrentA;
  const standbyVoltageAtDevice = supplyVoltageV - standbyCurrentA * loopResistanceOhms;
  const standbyPass = standbyVoltageAtDevice >= minOperatingVoltageV;

  // Alarm: the worst-case number of devices switch to their (much higher)
  // alarm current draw; the remaining devices stay at standby draw. The
  // EOL resistor's contribution is small relative to alarm current and is
  // included for completeness.
  const nAlarm = Math.min(numDevicesAlarming, numDevices);
  const nStandby = numDevices - nAlarm;
  const alarmCurrentA = (nAlarm * alarmMaPerDevice + nStandby * standbyMaPerDevice) / 1000 + eolCurrentA;
  const alarmVoltageAtDevice = supplyVoltageV - alarmCurrentA * loopResistanceOhms;
  const alarmPass = alarmVoltageAtDevice >= minOperatingVoltageV;

  return { standbyCurrentA, standbyVoltageAtDevice, standbyPass, alarmCurrentA, alarmVoltageAtDevice, alarmPass };
}
