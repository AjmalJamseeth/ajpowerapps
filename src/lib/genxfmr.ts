// Generator & Transformer Analysis — three independent calculators sharing
// one module, ported and verified from the AJ Apps Suite's `GenXfmr` module:
//  (1) Genset sizing — running load + non-linear derating + motor-starting
//      voltage-dip check, using the simplified linear approximation
//      %VD = (Motor Starting kVA x Xd) / Genset kVA x 100 that's standard
//      across generator-sizing application guides.
//  (2) Transformer losses/efficiency/regulation from OC+SC test data — the
//      standard electrical-machines formulas (loss = Pfe + x^2*Pcu, Kapp's
//      approximate voltage-regulation formula).
//  (3) Neutral Earthing Resistor/Transformer sizing — R = V(LN)/If per
//      IEEE 142, including the "If should exceed system charging current
//      Ic" design check. Subscriber feature in the source app.

// ---------- (1) Generator sizing ----------

export interface GenInput {
  linearKw: number;
  linearPf: number;
  nonlinKva: number;
  nonlinDerate: number;
  motorStartKva: number;
  xd: number;
  maxDipPct: number;
  sfc: number; // L/kWh
  fuelCost: number; // $/L
}

export const DEFAULT_GEN_INPUT: GenInput = {
  linearKw: 300,
  linearPf: 0.85,
  nonlinKva: 100,
  nonlinDerate: 1.5,
  motorStartKva: 240,
  xd: 0.15,
  maxDipPct: 15,
  sfc: 0.25,
  fuelCost: 1.2,
};

export interface GenResult {
  runKva: number;
  dipReqKva: number | null;
  recommendedKva: number;
  governing: "dip" | "running" | null;
  fuelRateLPerHr: number | null;
  fuelCostPerHr: number | null;
}

export function calcGen(input: GenInput): GenResult {
  const linPf = input.linearPf || 0.85;
  const runKva = (linPf > 0 ? input.linearKw / linPf : 0) + input.nonlinKva * (input.nonlinDerate || 1.5);
  let dipReqKva: number | null = null;
  if (input.motorStartKva > 0 && input.maxDipPct > 0) {
    dipReqKva = (input.motorStartKva * (input.xd || 0.15)) / (input.maxDipPct / 100);
  }
  const recommendedKva = Math.max(runKva, dipReqKva || 0);
  const governing: GenResult["governing"] = recommendedKva <= 0 ? null : dipReqKva !== null && dipReqKva > runKva ? "dip" : "running";

  let fuelRateLPerHr: number | null = null,
    fuelCostPerHr: number | null = null;
  if (recommendedKva > 0) {
    const kwAtFull = recommendedKva * 0.8; // genset rated at 0.8 PF, typical convention
    fuelRateLPerHr = (input.sfc || 0.25) * kwAtFull;
    fuelCostPerHr = input.fuelCost > 0 ? fuelRateLPerHr * input.fuelCost : null;
  }

  return { runKva, dipReqKva, recommendedKva, governing, fuelRateLPerHr, fuelCostPerHr };
}

// ---------- (2) Transformer losses / efficiency / regulation ----------

export type PfType = "lag" | "lead";

export interface XfmrInput {
  sKva: number;
  pfeW: number; // no-load loss, open-circuit test
  pcuW: number; // load loss, short-circuit test at rated I
  zPct: number; // %impedance from SC test nameplate
  loadX: number; // loading fraction, 1.0 = full rated load
  loadPf: number;
  pfType: PfType;
  energyRate: number; // $/kWh
  avgLoadX: number;
}

export const DEFAULT_XFMR_INPUT: XfmrInput = {
  sKva: 1000,
  pfeW: 1800,
  pcuW: 11000,
  zPct: 6.0,
  loadX: 1.0,
  loadPf: 0.85,
  pfType: "lag",
  energyRate: 0.12,
  avgLoadX: 0.6,
};

export interface XfmrResult {
  totalLossW: number;
  outputW: number;
  effPct: number;
  maxEffX: number | null;
  maxEffPct: number | null;
  vrPct: number;
  vxPct: number;
  regPct: number;
  annual: { noLoadKwh: number; loadKwh: number; costPerYr: number } | null;
}

export function calcXfmr(input: XfmrInput): XfmrResult | null {
  const { sKva, pfeW: pfe, pcuW: pcu, zPct } = input;
  if (!pfe && !pcu) return null;
  const x = input.loadX || 1.0,
    pf = input.loadPf || 0.85,
    pfType = input.pfType || "lag";

  const totalLossW = pfe + x * x * pcu;
  const outputW = x * sKva * 1000 * pf;
  const effPct = outputW > 0 ? (outputW / (outputW + totalLossW)) * 100 : 0;

  let maxEffX: number | null = null,
    maxEffPct: number | null = null;
  if (pcu > 0) {
    maxEffX = Math.sqrt(pfe / pcu);
    const outAtMax = maxEffX * sKva * 1000 * pf,
      lossAtMax = pfe + maxEffX * maxEffX * pcu;
    maxEffPct = (outAtMax / (outAtMax + lossAtMax)) * 100;
  }

  // Kapp's approximate voltage regulation formula
  const vrPct = pcu > 0 ? (pcu / (sKva * 1000)) * 100 : 0;
  const vxPct = zPct * zPct >= vrPct * vrPct ? Math.sqrt(zPct * zPct - vrPct * vrPct) : 0;
  const phi = Math.acos(Math.min(Math.max(pf, -1), 1));
  const sinPhi = Math.sin(phi);
  let regPct: number;
  if (pfType === "lead") {
    regPct = x * (vrPct * pf - vxPct * sinPhi) + (x * x / 200) * Math.pow(vxPct * pf + vrPct * sinPhi, 2);
  } else {
    regPct = x * (vrPct * pf + vxPct * sinPhi) + (x * x / 200) * Math.pow(vxPct * pf - vrPct * sinPhi, 2);
  }

  let annual: XfmrResult["annual"] = null;
  if (input.energyRate > 0) {
    const avgX = input.avgLoadX || 0.6;
    const noLoadKwh = (pfe / 1000) * 8760;
    const loadKwh = (pcu / 1000) * avgX * avgX * 8760;
    annual = { noLoadKwh, loadKwh, costPerYr: (noLoadKwh + loadKwh) * input.energyRate };
  }

  return { totalLossW, outputW, effPct, maxEffX, maxEffPct, vrPct, vxPct, regPct, annual };
}

// ---------- (3) NGR / NET sizing (subscriber) ----------

export interface NgrInput {
  sysVllKv: number;
  desiredIfA: number;
  chargingIcA: number;
  timeRatingS: number;
  netRatio: number; // 0 = direct-connected resistor, no NET
}

export const DEFAULT_NGR_INPUT: NgrInput = {
  sysVllKv: 11,
  desiredIfA: 10,
  chargingIcA: 3,
  timeRatingS: 10,
  netRatio: 20,
};

export interface NgrResult {
  vPhaseV: number;
  classification: "HRG" | "LRG";
  rOhm: number;
  pKw: number;
  eMj: number;
  icPass: boolean | null;
  net: { netKva: number; rSecOhm: number } | null;
}

export function calcNgr(input: NgrInput, premiumEnabled: boolean): NgrResult | null {
  if (!premiumEnabled) return null;
  const { sysVllKv: vll, desiredIfA: ifA, chargingIcA: ic, timeRatingS: tRating } = input;
  if (!vll || !ifA) return null;

  const vPhaseV = (vll * 1000) / Math.sqrt(3);
  const classification: NgrResult["classification"] = ifA <= 10 ? "HRG" : "LRG";
  const rOhm = vPhaseV / ifA;
  const pKw = (ifA * vPhaseV) / 1000;
  const eMj = (ifA * ifA * rOhm * (tRating || 10)) / 1e6;
  const icPass = ic > 0 ? ifA >= ic : null;

  let net: NgrResult["net"] = null;
  if (input.netRatio > 0) {
    const netKva = (vPhaseV * ifA) / 1000;
    const rSecOhm = rOhm / (input.netRatio * input.netRatio);
    net = { netKva, rSecOhm };
  }

  return { vPhaseV, classification, rOhm, pKw, eMj, icPass, net };
}
