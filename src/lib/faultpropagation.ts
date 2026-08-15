// Fault Current Propagation Through a Distribution Network — the classic
// "Base kVA Method" for estimating available short-circuit current at
// successive points down a radial network (source -> transformer -> cable
// -> sub-panel), by converting every element's %impedance to a common kVA
// base and accumulating it along the path. Standard textbook per-unit/
// percentage-impedance method (Base kVA Method), matching how it's taught
// in general power-system-protection references. SIMPLIFICATION: this
// combines %Z magnitudes arithmetically (scalar sum) rather than resolving
// each element into R and X and summing vectorially — the classic
// "quick estimate" version of the method. Arithmetic summation slightly
// OVERSTATES total impedance and therefore UNDERSTATES fault current
// relative to a full R+jX study — clearly caveated in the UI, since
// protective device ratings should never be finalized from the
// understated (non-conservative) figure this method can produce. Designed
// from scratch; no equivalent module in the source app.

export interface FaultElement {
  label: string;
  pctZ: number; // % impedance at the element's own base
  elementBaseKva: number; // the kVA base pctZ is expressed at (e.g. transformer's own rated kVA)
}

export interface FaultPropagationInput {
  baseKva: number;
  systemKv: number; // line-to-line voltage at the point(s) being evaluated
  sourceFaultMva: number | null; // utility/incoming fault level
  elements: FaultElement[]; // in order from source toward the load
}

export const DEFAULT_FAULT_PROPAGATION_INPUT: FaultPropagationInput = {
  baseKva: 1000,
  systemKv: 0.415,
  sourceFaultMva: 250,
  elements: [
    { label: "Transformer (1000kVA, 6%Z)", pctZ: 6, elementBaseKva: 1000 },
    { label: "Cable to Sub-Panel", pctZ: 1.5, elementBaseKva: 1000 },
  ],
}

export interface FaultPropagationPoint {
  label: string;
  cumulativePctZ: number;
  faultMva: number;
  faultCurrentKa: number;
}

export interface FaultPropagationResult {
  sourcePctZ: number | null;
  points: FaultPropagationPoint[];
}

export function calcFaultPropagation(input: FaultPropagationInput): FaultPropagationResult {
  const { baseKva, systemKv, sourceFaultMva, elements } = input;

  if (sourceFaultMva == null || sourceFaultMva <= 0 || systemKv <= 0) {
    return { sourcePctZ: null, points: [] };
  }

  const baseMva = baseKva / 1000;
  const sourcePctZ = (baseMva / sourceFaultMva) * 100;

  const points: FaultPropagationPoint[] = [];
  let cumulativePctZ = sourcePctZ;

  const faultAt = (label: string, pctZ: number): FaultPropagationPoint => {
    const faultMva = (baseMva * 100) / pctZ;
    const faultCurrentKa = (faultMva * 1000) / (Math.sqrt(3) * systemKv * 1000);
    return { label, cumulativePctZ: pctZ, faultMva, faultCurrentKa };
  };

  points.push(faultAt("At source / incoming", cumulativePctZ));

  for (const el of elements) {
    const elBase = el.elementBaseKva > 0 ? el.elementBaseKva : baseKva;
    const pctZAtBase = el.pctZ * (baseKva / elBase);
    cumulativePctZ += pctZAtBase;
    points.push(faultAt(el.label, cumulativePctZ));
  }

  return { sourcePctZ, points };
}
