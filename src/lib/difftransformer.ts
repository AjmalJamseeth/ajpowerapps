// Transformer Differential Protection (87T) — percentage-bias (percentage
// differential) restraint characteristic setting check. Standard
// two-slope percentage-differential principle used throughout transformer
// protection practice (consistent with the approach in IEEE C37.91 guide
// for transformer protection): differential current Id = |I1-I2| and bias
// (restraint) current Ir = (I1+I2)/2, both referred to a common base (CT
// secondary, ratio/vector-group compensated); Id is compared against a
// dual-slope characteristic (a minimum pickup, a first low slope for normal
// operation covering on-load tap-changer range and CT mismatch, and a
// steeper second slope above a "knee" restraint current to stay secure
// during CT saturation on close-in through-faults). Designed from scratch;
// no equivalent module in the source app.

export interface DiffTransformerInput {
  i1Primary: number | null; // current into the transformer, referred to CT secondary / relay per-unit base
  i2Primary: number | null; // current out of the transformer, same base
  minPickupPu: number; // Id0, minimum differential pickup (p.u. of rated current), e.g. 0.2-0.3
  slope1Pct: number; // first-slope percentage, e.g. 25%
  knee2Pu: number; // restraint current where the second slope begins, e.g. 2.0 p.u.
  slope2Pct: number; // second-slope percentage above the knee, e.g. 60-80%
}

export const DEFAULT_DIFF_TRANSFORMER_INPUT: DiffTransformerInput = {
  i1Primary: 1.05,
  i2Primary: 0.98,
  minPickupPu: 0.3,
  slope1Pct: 25,
  knee2Pu: 2.0,
  slope2Pct: 60,
};

export interface DiffTransformerResult {
  differentialCurrentPu: number | null; // Id
  restraintCurrentPu: number | null; // Ir (bias)
  operatePickupPu: number | null; // the restraint characteristic's threshold at this Ir
  trips: boolean | null;
}

function operateThreshold(ir: number, minPickupPu: number, slope1Pct: number, knee2Pu: number, slope2Pct: number): number {
  const slope1Threshold = minPickupPu + (slope1Pct / 100) * ir;
  if (ir <= knee2Pu) {
    return slope1Threshold;
  }
  const thresholdAtKnee = minPickupPu + (slope1Pct / 100) * knee2Pu;
  return thresholdAtKnee + (slope2Pct / 100) * (ir - knee2Pu);
}

export function calcDiffTransformer(input: DiffTransformerInput): DiffTransformerResult {
  const { i1Primary, i2Primary, minPickupPu, slope1Pct, knee2Pu, slope2Pct } = input;

  if (i1Primary == null || i2Primary == null) {
    return { differentialCurrentPu: null, restraintCurrentPu: null, operatePickupPu: null, trips: null };
  }

  const differentialCurrentPu = Math.abs(i1Primary - i2Primary);
  const restraintCurrentPu = (i1Primary + i2Primary) / 2;
  const operatePickupPu = operateThreshold(restraintCurrentPu, minPickupPu, slope1Pct, knee2Pu, slope2Pct);
  const trips = differentialCurrentPu >= operatePickupPu;

  return { differentialCurrentPu, restraintCurrentPu, operatePickupPu, trips };
}
