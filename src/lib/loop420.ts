// 4-20mA Current Loop Calculator — loop voltage budget, wire voltage drop,
// power supply headroom, and maximum cable length by wire gauge. Designed
// from scratch: standard 2-wire loop-powered transmitter power-budget
// arithmetic (Ohm's law), cross-checked against published worked examples
// (BAPI "Designing 4 to 20 mA Current Loops" application note and
// industry loop-voltage calculators). No equivalent module in the source app.

export type WireAwg = 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28;

// Standard annealed copper wire DC resistance at 20°C, Ω per 1000 ft
// (published AWG wire tables — e.g. Engineering ToolBox / NIST handbook 100).
export const AWG_OHMS_PER_1000FT: Record<WireAwg, number> = {
  12: 1.588,
  14: 2.525,
  16: 4.016,
  18: 6.385,
  20: 10.15,
  22: 16.14,
  24: 25.67,
  26: 40.81,
  28: 65.31,
};

export type LengthUnit = "ft" | "m";

export interface Loop420Input {
  supplyVoltageV: number | null;
  transmitterMinVoltageV: number | null; // transmitter's own min terminal voltage at 20mA, from datasheet
  receiverOhms: number; // load/receiver resistor, PLC AI card input impedance, etc.
  otherOhms: number; // any additional barriers/isolators/indicators in the loop
  wireAwg: WireAwg;
  lengthUnit: LengthUnit;
  cableLength: number | null; // one-way run length, in lengthUnit
}

export const DEFAULT_LOOP420_INPUT: Loop420Input = {
  supplyVoltageV: 24,
  transmitterMinVoltageV: 12,
  receiverOhms: 250,
  otherOhms: 0,
  wireAwg: 22,
  lengthUnit: "ft",
  cableLength: 1000,
};

const MAX_CURRENT_A = 0.02; // 20mA — worst case for voltage-drop budget

function ohmsPerUnitLength(awg: WireAwg, unit: LengthUnit): number {
  const perFt = AWG_OHMS_PER_1000FT[awg] / 1000;
  return unit === "ft" ? perFt : perFt / 0.3048; // Ω/m
}

export interface Loop420Result {
  wireResistanceOhms: number | null; // round-trip (both conductors)
  totalLoopOhms: number | null;
  voltageDropWireV: number | null;
  voltageAtTransmitterV: number | null;
  headroomV: number | null;
  pass: boolean | null;
  maxLoopOhmsAvailable: number | null; // budget at supply for 20mA before transmitter starves
  maxCableLength: number | null; // in lengthUnit, one-way, given receiver+other resistance
}

export function calcLoop420(input: Loop420Input): Loop420Result {
  const { supplyVoltageV: Vs, transmitterMinVoltageV: Vt, receiverOhms: Rr, otherOhms: Ro, cableLength: L } = input;

  const rPerLen = ohmsPerUnitLength(input.wireAwg, input.lengthUnit);

  const wireResistanceOhms = L != null && L >= 0 ? 2 * L * rPerLen : null;

  let totalLoopOhms: number | null = null;
  let voltageDropWireV: number | null = null;
  let voltageAtTransmitterV: number | null = null;
  let headroomV: number | null = null;
  let pass: boolean | null = null;

  if (wireResistanceOhms != null) {
    totalLoopOhms = wireResistanceOhms + Rr + Ro;
    voltageDropWireV = MAX_CURRENT_A * wireResistanceOhms;
    if (Vs != null) {
      voltageAtTransmitterV = Vs - MAX_CURRENT_A * totalLoopOhms;
      if (Vt != null) {
        headroomV = voltageAtTransmitterV - Vt;
        pass = headroomV >= 0;
      }
    }
  }

  let maxLoopOhmsAvailable: number | null = null;
  let maxCableLength: number | null = null;
  if (Vs != null && Vt != null) {
    maxLoopOhmsAvailable = (Vs - Vt) / MAX_CURRENT_A;
    const wireOhmsBudget = maxLoopOhmsAvailable - Rr - Ro;
    maxCableLength = wireOhmsBudget > 0 ? wireOhmsBudget / (2 * rPerLen) : 0;
  }

  return {
    wireResistanceOhms,
    totalLoopOhms,
    voltageDropWireV,
    voltageAtTransmitterV,
    headroomV,
    pass,
    maxLoopOhmsAvailable,
    maxCableLength,
  };
}
