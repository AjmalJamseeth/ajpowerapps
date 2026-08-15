// Power / Current Converter — single-phase and three-phase kW ↔ kVA ↔ kVAR
// ↔ Amps conversions from a given load profile (voltage + power factor).
// No equivalent module exists in the AJ Apps Suite source, so this was
// designed from scratch from first-principles AC power triangle relations:
//   S (kVA) = √(P² + Q²),  P = S·PF,  Q = S·sin(φ) = √(S² − P²)
//   3-phase:  S(kVA) = √3 · V(LL) · I(A) / 1000
//   1-phase:  S(kVA) = V · I / 1000
// Free — no subscriber gate, matching the app's other pure-utility
// calculators (Conduit Fill, MV Cable Sizing).

export type ConverterPhase = "1ph" | "3ph";
export type KnownQuantity = "kw" | "kva" | "kvar" | "amps";
export type LoadNature = "lagging" | "leading" | "unity";

export interface PowerConverterInput {
  phase: ConverterPhase;
  voltage: number; // line-to-line for 3ph, single voltage for 1ph
  powerFactor: number; // 0-1
  loadNature: LoadNature; // informational — lagging (inductive) vs leading (capacitive)
  known: KnownQuantity;
  value: number | null;
}

export const DEFAULT_POWERCONVERTER_INPUT: PowerConverterInput = {
  phase: "3ph",
  voltage: 415,
  powerFactor: 0.85,
  loadNature: "lagging",
  known: "kw",
  value: 100,
};

export interface PowerConverterResult {
  kw: number;
  kva: number;
  kvar: number;
  amps: number;
  powerFactor: number;
}

export function calcPowerConverter(input: PowerConverterInput): PowerConverterResult | null {
  const { phase, voltage, powerFactor: pf, known, value } = input;
  if (!voltage || voltage <= 0 || pf < 0 || pf > 1 || value == null || value < 0) return null;

  const vFactor = phase === "3ph" ? Math.sqrt(3) : 1;
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));

  let kva: number | null = null;

  if (known === "kva") {
    kva = value;
  } else if (known === "kw") {
    // P = S·PF — undefined (any S gives P=0) when PF=0.
    if (pf <= 0) return null;
    kva = value / pf;
  } else if (known === "kvar") {
    // Q = S·sinφ — undefined (any S gives Q=0) when PF=1 (sinφ=0).
    if (sinPhi <= 0) return null;
    kva = value / sinPhi;
  } else if (known === "amps") {
    kva = (vFactor * voltage * value) / 1000;
  }

  if (kva == null || !isFinite(kva) || kva < 0) return null;

  const kw = kva * pf;
  const kvar = Math.sqrt(Math.max(0, kva * kva - kw * kw));
  const amps = (kva * 1000) / (vFactor * voltage);

  return { kw, kva, kvar, amps, powerFactor: pf };
}
