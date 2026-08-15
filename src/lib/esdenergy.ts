// Electrostatic Discharge Spark Energy Check — computes the capacitive
// discharge energy of an isolated conductive part (E = 0.5 x C x V^2) and
// compares it against the atmosphere's Minimum Ignition Energy (MIE), the
// standard spark-ignition risk screening method referenced by IEC
// 60079-32-1 (electrostatic hazards in hazardous areas). MIE is a
// substance-specific property with no single universal value, so it's
// always a user-supplied input here rather than a built-in constant —
// general guidance is tied to the IEC 60079 gas-group classification
// (already used elsewhere in this suite for intrinsic safety), since a
// lower MIE is exactly why a gas is placed in a more stringent group.
// Designed from scratch; no equivalent module in the source app.

export type GasGroupEsd = "IIA" | "IIB" | "IIC" | "dust";

export interface EsdEnergyInput {
  capacitancePf: number | null; // isolated conductive part's capacitance to ground
  voltageV: number | null; // charged voltage (e.g. from a charge-generating process, or a person)
  mieMj: number | null; // Minimum Ignition Energy of the atmosphere, mJ — from the substance's own data (e.g. IEC 60079-20-1 tables)
  gasGroup: GasGroupEsd; // for the general-guidance note only, not used in the pass/fail math
}

export const DEFAULT_ESD_ENERGY_INPUT: EsdEnergyInput = {
  capacitancePf: 100,
  voltageV: 10000,
  mieMj: 0.25,
  gasGroup: "IIA",
};

const GAS_GROUP_GUIDANCE: Record<GasGroupEsd, string> = {
  IIA: "IIA gases (e.g. propane, typical hydrocarbons) generally have higher MIE, often above ~0.2mJ.",
  IIB: "IIB gases (e.g. ethylene) generally have a lower MIE than IIA, often in the ~0.05-0.2mJ range.",
  IIC: "IIC gases (e.g. hydrogen, acetylene) have the lowest MIE of the standard gas groups, often well below 0.02mJ — the most easily ignited by a small spark.",
  dust: "Combustible dust clouds typically have much higher MIE than gases (often several mJ to hundreds of mJ), but MIE varies enormously by dust type/particle size — always use the specific dust's own tested MIE value.",
};

export interface EsdEnergyResult {
  sparkEnergyMj: number | null;
  pass: boolean | null; // true = spark energy below MIE (lower ignition risk from this discharge)
  marginFactor: number | null; // MIE / sparkEnergy — how many times below (>1) or above (<1) the MIE the spark energy is
  gasGroupNote: string;
}

export function calcEsdEnergy(input: EsdEnergyInput): EsdEnergyResult {
  const { capacitancePf, voltageV, mieMj, gasGroup } = input;

  if (capacitancePf == null || voltageV == null) {
    return { sparkEnergyMj: null, pass: null, marginFactor: null, gasGroupNote: GAS_GROUP_GUIDANCE[gasGroup] };
  }

  const capacitanceF = capacitancePf * 1e-12;
  const energyJ = 0.5 * capacitanceF * voltageV * voltageV;
  const sparkEnergyMj = energyJ * 1000; // J -> mJ

  let pass: boolean | null = null;
  let marginFactor: number | null = null;
  if (mieMj != null && mieMj > 0) {
    pass = sparkEnergyMj < mieMj;
    marginFactor = mieMj / sparkEnergyMj;
  }

  return { sparkEnergyMj, pass, marginFactor, gasGroupNote: GAS_GROUP_GUIDANCE[gasGroup] };
}
