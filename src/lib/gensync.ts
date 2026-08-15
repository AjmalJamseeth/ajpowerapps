// Generator Paralleling / Synchronization Check — voltage, frequency and
// phase-angle difference between an incoming generator and the bus/system
// it's about to be paralleled with, checked against adjustable acceptance
// windows (the same three quantities a synchroscope / sync-check relay,
// ANSI device 25, monitors before permitting breaker closure). Acceptance
// windows are genuinely application/relay-setting specific (generator size,
// prime mover, utility interconnection requirements all affect the actual
// figures used) — the defaults here are commonly-cited illustrative
// starting points, not a fixed standard, and are fully user-adjustable.
// Designed from scratch; no equivalent module in the source app.

export interface GenSyncInput {
  genVoltageV: number | null;
  busVoltageV: number | null;
  genFrequencyHz: number | null;
  busFrequencyHz: number | null;
  phaseAngleDiffDeg: number | null;
  voltageDiffThresholdPct: number;
  freqDiffThresholdHz: number;
  phaseAngleThresholdDeg: number;
}

export const DEFAULT_GEN_SYNC_INPUT: GenSyncInput = {
  genVoltageV: 415,
  busVoltageV: 412,
  genFrequencyHz: 50.05,
  busFrequencyHz: 50.0,
  phaseAngleDiffDeg: 3,
  voltageDiffThresholdPct: 5,
  freqDiffThresholdHz: 0.2,
  phaseAngleThresholdDeg: 10,
};

export interface GenSyncResult {
  voltageDiffPct: number | null;
  voltageOk: boolean | null;
  freqDiffHz: number | null;
  freqOk: boolean | null;
  phaseOk: boolean | null;
  beatPeriodS: number | null; // time between successive in-phase instants, 1/freqDiff
  overallOk: boolean | null;
}

export function calcGenSync(input: GenSyncInput): GenSyncResult {
  const {
    genVoltageV,
    busVoltageV,
    genFrequencyHz,
    busFrequencyHz,
    phaseAngleDiffDeg,
    voltageDiffThresholdPct,
    freqDiffThresholdHz,
    phaseAngleThresholdDeg,
  } = input;

  let voltageDiffPct: number | null = null;
  let voltageOk: boolean | null = null;
  if (genVoltageV != null && busVoltageV != null && busVoltageV > 0) {
    voltageDiffPct = (Math.abs(genVoltageV - busVoltageV) / busVoltageV) * 100;
    voltageOk = voltageDiffPct <= voltageDiffThresholdPct;
  }

  let freqDiffHz: number | null = null;
  let freqOk: boolean | null = null;
  let beatPeriodS: number | null = null;
  if (genFrequencyHz != null && busFrequencyHz != null) {
    freqDiffHz = Math.abs(genFrequencyHz - busFrequencyHz);
    freqOk = freqDiffHz <= freqDiffThresholdHz;
    beatPeriodS = freqDiffHz > 0 ? 1 / freqDiffHz : null;
  }

  let phaseOk: boolean | null = null;
  if (phaseAngleDiffDeg != null) {
    phaseOk = Math.abs(phaseAngleDiffDeg) <= phaseAngleThresholdDeg;
  }

  const checks = [voltageOk, freqOk, phaseOk];
  const anyChecked = checks.some((c) => c !== null);
  const overallOk = anyChecked ? checks.every((c) => c !== false) : null;

  return { voltageDiffPct, voltageOk, freqDiffHz, freqOk, phaseOk, beatPeriodS, overallOk };
}
