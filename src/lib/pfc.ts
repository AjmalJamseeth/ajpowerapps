// Power Factor Correction — IEC 60831 (capacitor banks), IEEE Std 18 /
// IEEE 1036, harmonic resonance guidance per IEC 61000-4-7.
// Ported from the AJ Apps Suite's Power Factor Correction module.

export type SystemType = "3ph" | "1ph";
export type BankConnection = "delta" | "star";

export interface PfcInput {
  system: SystemType;
  frequency: 50 | 60;
  voltage: number; // V, line-line for 3ph
  activeLoadKw: number;
  pf1: number; // existing power factor
  pf2: number; // target power factor

  connection: BankConnection;
  capVoltage: number; // V, capacitor voltage rating

  premiumEnabled: boolean;
  shortCircuitMva: number | null; // Ssc, for harmonic resonance check
  detuningPct: 5.67 | 7 | 14;
  lineResistanceMOhm: number; // cable resistance from supply, mΩ
  opHoursPerYear: number;
  tariffEnergy: number; // per kWh
  tariffDemand: number; // per kVA/month
}

export interface PfcResult {
  phi1: number;
  phi2: number;
  Q1: number;
  Q2: number;
  Qc: number; // kVAr required
  S1: number; // kVA existing
  S2: number; // kVA improved
  I1: number; // A existing
  I2: number; // A improved
  C_uF: number; // capacitance per phase
  Ic: number; // capacitor current, A
  currentReductionPct: number;
  kvaSaving: number;

  resonance: { fr: number; hr: number; risk: "high" | "moderate" | "low" } | null;
  reactor: { ft: number; XL: number; reactorKvar: number } | null;
  savings: { lossKw: number; energyKwhPerYr: number; demandSavingKva: number; annualCost: number } | null;
}

export function calcPfc(input: PfcInput): PfcResult | null {
  const { system, voltage: V, activeLoadKw: P, pf1, pf2, frequency: f } = input;
  if (!P || pf1 <= 0 || pf2 <= 0) return null;

  const phi1 = Math.acos(pf1);
  const phi2 = Math.acos(pf2);
  const Q1 = P * Math.tan(phi1);
  const Q2 = P * Math.tan(phi2);
  const Qc = Q1 - Q2;
  const S1 = P / pf1;
  const S2 = P / pf2;
  const sqr3 = Math.sqrt(3);
  const I1 = system === "3ph" ? (S1 * 1000) / (sqr3 * V) : (S1 * 1000) / V;
  const I2 = system === "3ph" ? (S2 * 1000) / (sqr3 * V) : (S2 * 1000) / V;

  const Vcap = input.capVoltage || V;
  let C_uF: number;
  let Ic: number;
  if (system === "3ph") {
    C_uF =
      input.connection === "delta"
        ? (Qc * 1e6) / 3 / (2 * Math.PI * f * Vcap * Vcap)
        : (Qc * 1e6) / 3 / (2 * Math.PI * f * Math.pow(Vcap / sqr3, 2));
    Ic = (Qc * 1000) / (sqr3 * V);
  } else {
    C_uF = (Qc * 1e6) / (2 * Math.PI * f * Vcap * Vcap);
    Ic = (Qc * 1000) / V;
  }

  const currentReductionPct = ((I1 - I2) / I1) * 100;
  const kvaSaving = S1 - S2;

  let resonance: PfcResult["resonance"] = null;
  let reactor: PfcResult["reactor"] = null;
  let savings: PfcResult["savings"] = null;

  if (input.premiumEnabled) {
    if (input.shortCircuitMva && input.shortCircuitMva > 0) {
      const fr = f * Math.sqrt((input.shortCircuitMva * 1000) / Qc);
      const hr = fr / f;
      const risk = hr < 5 ? "high" : hr < 7 ? "moderate" : "low";
      resonance = { fr, hr, risk };
    }

    const p = input.detuningPct;
    const ft = f / Math.sqrt(p / 100);
    const XL = (p / 100) * ((V * V) / (Qc * 1000)) * 3;
    const reactorKvar = Qc * (p / 100);
    reactor = { ft, XL, reactorKvar };

    const Rl = input.lineResistanceMOhm / 1000;
    const phases = system === "3ph" ? 3 : 1;
    const lossKw = (phases * Rl * (I1 * I1 - I2 * I2)) / 1000;
    const energyKwhPerYr = lossKw * input.opHoursPerYear;
    const demandSavingKva = S1 - S2;
    const annualCost = energyKwhPerYr * input.tariffEnergy + demandSavingKva * input.tariffDemand * 12;
    savings = { lossKw, energyKwhPerYr, demandSavingKva, annualCost };
  }

  return { phi1, phi2, Q1, Q2, Qc, S1, S2, I1, I2, C_uF, Ic, currentReductionPct, kvaSaving, resonance, reactor, savings };
}

export const DEFAULT_PFC_INPUT: PfcInput = {
  system: "3ph",
  frequency: 50,
  voltage: 415,
  activeLoadKw: 500,
  pf1: 0.75,
  pf2: 0.95,
  connection: "delta",
  capVoltage: 440,
  premiumEnabled: false,
  shortCircuitMva: null,
  detuningPct: 5.67,
  lineResistanceMOhm: 10,
  opHoursPerYear: 4000,
  tariffEnergy: 0.1,
  tariffDemand: 5.0,
};
