// Parallel Generator Fault Contribution — per-generator fault current
// contribution at a common bus, using the standard subtransient-reactance
// method: Ifault_i = (Vrated / (sqrt(3) x Xd''_pu x Zbase_i)) referred to
// the common bus, i.e. each generator's own-base fault contribution
// converted to the bus base and summed arithmetically (generators in
// parallel simply add their individual contributions at a common bus, to a
// first approximation ignoring inter-machine reactance / network
// impedance between them). Designed from scratch; no equivalent module in
// the source app.

export interface GeneratorEntry {
  label: string;
  ratedKva: number;
  xdSubtransientPu: number; // subtransient reactance, per unit on the generator's own rated kVA
}

export interface GenSyncFaultInput {
  systemKv: number; // line-to-line at the common bus
  generators: GeneratorEntry[];
}

export const DEFAULT_GEN_SYNC_FAULT_INPUT: GenSyncFaultInput = {
  systemKv: 0.415,
  generators: [
    { label: "Genset 1", ratedKva: 500, xdSubtransientPu: 0.12 },
    { label: "Genset 2", ratedKva: 500, xdSubtransientPu: 0.12 },
  ],
};

export interface GeneratorContribution {
  label: string;
  ratedCurrentA: number;
  faultContributionKa: number;
}

export interface GenSyncFaultResult {
  contributions: GeneratorContribution[];
  totalFaultKa: number | null;
}

export function calcGenSyncFault(input: GenSyncFaultInput): GenSyncFaultResult {
  const { systemKv, generators } = input;

  if (systemKv <= 0 || generators.length === 0) {
    return { contributions: [], totalFaultKa: null };
  }

  const contributions: GeneratorContribution[] = generators.map((g) => {
    const ratedCurrentA = (g.ratedKva * 1000) / (Math.sqrt(3) * systemKv * 1000);
    const xd = g.xdSubtransientPu > 0 ? g.xdSubtransientPu : 0.01;
    const faultContributionKa = (ratedCurrentA / xd) / 1000;
    return { label: g.label, ratedCurrentA, faultContributionKa };
  });

  const totalFaultKa = contributions.reduce((sum, c) => sum + c.faultContributionKa, 0);

  return { contributions, totalFaultKa };
}
