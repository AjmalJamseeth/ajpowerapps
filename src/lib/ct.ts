// CT Sizing & Saturation — IEC 61869-2 / BS EN 61869-2 / (superseding IEC 60044-1)
// Ported and verified from the AJ Apps Suite's `CT` module.

export interface CtBurdenItem {
  label: string;
  va: number;
}

export interface CtMatchItem {
  label: string;
  ip: number;
  is: number;
}

export interface CtInput {
  // Free
  ip: number; // rated primary current, A
  is: 1 | 5; // rated secondary current, A
  alfRated: number; // required accuracy limit factor (e.g. 20 for protection CTs)
  vk: number; // knee-point voltage, V (0 = not yet known)
  rct: number; // CT secondary winding resistance, ohm
  burdenItems: CtBurdenItem[];
  cableL: number; // one-way lead length, m
  cableA: number; // lead conductor CSA, mm^2
  returnFactor: 1 | 2; // 1 = one-way (shared neutral/common return), 2 = go-and-return loop
  freqHz: number;

  // Subscriber
  ifKa: number; // system fault current, kA rms symmetrical
  xr: number; // system X/R ratio at the fault point
  tf: number; // fault clearance duration, s
  ith: number; // rated short-time thermal current, kA (1s rating unless ithT given)
  ithT: number; // rated duration for Ith, s
  idyn: number; // rated dynamic (peak) withstand current, kA (0 = derive as 2.5x Ith)
  meterClass: "" | "0.1" | "0.2" | "0.5" | "1" | "3" | "5";
  taps: number[]; // available tap primary currents for multi-ratio CTs
  matchList: CtMatchItem[];
  matchCheckI: number; // primary current (A) at which to evaluate REF/differential spill
}

export const DEFAULT_CT_INPUT: CtInput = {
  ip: 400,
  is: 1,
  alfRated: 20,
  vk: 150,
  rct: 2.5,
  burdenItems: [{ label: "Protection Relay", va: 2.5 }],
  cableL: 20,
  cableA: 2.5,
  returnFactor: 2,
  freqHz: 50,
  ifKa: 20,
  xr: 10,
  tf: 0.1,
  ith: 20,
  ithT: 1,
  idyn: 0,
  meterClass: "0.5",
  taps: [400, 300, 200],
  matchList: [
    { label: "CT-1 (Phase)", ip: 400, is: 1 },
    { label: "CT-2 (Neutral)", ip: 400, is: 1 },
  ],
  matchCheckI: 400,
};

const RHO_CU = 0.0175; // ohm.mm^2/m

export const CT_METER_LIMITS: Record<string, [number, number, number][]> = {
  "0.1": [[5, 0.4, 15], [20, 0.2, 8], [100, 0.1, 5], [120, 0.1, 5]],
  "0.2": [[5, 0.75, 30], [20, 0.35, 15], [100, 0.2, 10], [120, 0.2, 10]],
  "0.5": [[5, 1.5, 90], [20, 0.75, 45], [100, 0.5, 30], [120, 0.5, 30]],
  "1": [[5, 3.0, 180], [20, 1.5, 90], [100, 1.0, 60], [120, 1.0, 60]],
  "3": [[50, 3.0, 0], [120, 3.0, 0]],
  "5": [[50, 5.0, 0], [120, 5.0, 0]],
};

export interface CtFaultRow {
  multiple: number;
  primaryA: number;
  secondaryIdealA: number;
  secondaryAtAlfA: number;
}

export interface CtTapRow {
  tapIp: number;
  vkTap: number;
  alfAchievable: number;
  meets: boolean;
  isFullTap: boolean;
}

export interface CtMatchRow {
  label: string;
  ip: number;
  is: number;
  ratio: number;
  isReference: boolean;
  matches: boolean;
  spillA: number;
}

export interface CtResult {
  n: number;
  in_: number;
  rlead: number;
  rrelay: number;
  rb: number;
  burdenVa: number;
  vkReq: number;
  alfActual: number;
  alfPass: boolean;
  faultTable: CtFaultRow[];

  // subscriber
  saturation: {
    tau: number;
    ktd: number;
    ifSecA: number;
    vkTd: number;
    tsMs: number | null;
    instantSaturation: boolean;
    satPass: boolean;
  } | null;
  thermal: {
    ithScaledKa: number;
    thermPass: boolean;
    idynKa: number;
    ipeakActualKa: number;
    dynPass: boolean;
  } | null;
  meterTable: { pct: number; ratioErrPct: number; phaseMin: number }[] | null;
  tapTable: CtTapRow[] | null;
  bestTap: number | null;
  matchTable: CtMatchRow[] | null;
  matchAnyMismatch: boolean;
}

export function calcCt(input: CtInput, premiumEnabled: boolean): CtResult | null {
  const { ip, is, alfRated, vk, rct, burdenItems, cableL, cableA, returnFactor } = input;
  if (!ip || !is) return null;

  const n = ip / is;
  const in_ = is;
  const relayVa = burdenItems.reduce((s, it) => s + (it.va || 0), 0) || 2.5;
  const rlead = (RHO_CU * returnFactor * cableL) / (cableA || 1);
  const rrelay = relayVa / (in_ * in_);
  const rb = rlead + rrelay;
  const burdenVa = rb * in_ * in_;

  const vkReq = alfRated * in_ * (rct + rb);
  const alfActual = vk > 0 ? vk / (in_ * (rct + rb)) : 0;
  const alfPass = vkReq > 0 && vk >= vkReq;

  const levels = [0.2, 0.5, 1, 2, 5, 10, 20, 50];
  const faultTable: CtFaultRow[] = levels.map((m) => {
    const primaryA = m * ip;
    const secondaryIdealA = m * in_;
    const secondaryAtAlfA = Math.min(secondaryIdealA, alfRated * in_);
    return { multiple: m, primaryA, secondaryIdealA, secondaryAtAlfA };
  });

  let saturation: CtResult["saturation"] = null;
  let thermal: CtResult["thermal"] = null;
  let meterTable: CtResult["meterTable"] = null;
  let tapTable: CtResult["tapTable"] = null;
  let bestTap: number | null = null;
  let matchTable: CtResult["matchTable"] = null;
  let matchAnyMismatch = false;

  if (premiumEnabled) {
    // Saturation / transient analysis
    const ifA = input.ifKa * 1000;
    const xr = input.xr || 10;
    const tf = input.tf || 0.1;
    if (ifA > 0) {
      const omega = 2 * Math.PI * (input.freqHz || 50);
      const tau = xr / omega;
      const ktd = 1 + omega * tau * (1 - Math.exp(-tf / tau));
      const ifSecA = ifA / n;
      const vkTd = ktd * ifSecA * (rct + rb);
      const denom = ktd * ifSecA * (rct + rb);
      let tsMs: number | null = null;
      let instantSaturation = false;
      if (vk > 0 && denom > 0) {
        const ratio = vk / denom;
        if (ratio >= 1) {
          tsMs = null; // no saturation within tf
        } else if (ratio <= 0) {
          instantSaturation = true;
        } else {
          const ts = -tau * Math.log(1 - ratio);
          tsMs = ts * 1000;
        }
      }
      saturation = {
        tau,
        ktd,
        ifSecA,
        vkTd,
        tsMs,
        instantSaturation,
        satPass: vk >= vkTd,
      };
    }

    // Thermal & mechanical withstand
    const ithA = input.ith,
      ithT = input.ithT || 1,
      ifKa = input.ifKa,
      tfActual = input.tf || 0.1;
    if (ithA > 0 && ifKa > 0) {
      const ithScaledKa = ithA * Math.sqrt(ithT / tfActual);
      const thermPass = ifKa <= ithScaledKa;
      const idynKa = input.idyn > 0 ? input.idyn : 2.5 * ithA;
      const kappa = 1.02 + 0.98 * Math.exp(-3 / (input.xr || 10));
      const ipeakActualKa = kappa * Math.sqrt(2) * ifKa;
      const dynPass = ipeakActualKa <= idynKa;
      thermal = { ithScaledKa, thermPass, idynKa, ipeakActualKa, dynPass };
    }

    // Metering accuracy class
    if (input.meterClass && CT_METER_LIMITS[input.meterClass]) {
      meterTable = CT_METER_LIMITS[input.meterClass].map(([pct, re, pd]) => ({
        pct,
        ratioErrPct: re,
        phaseMin: pd,
      }));
    }

    // Multi-ratio taps
    if (input.taps && input.taps.length && ip && vk) {
      const sorted = [...input.taps].filter((t) => t > 0).sort((a, b) => b - a);
      tapTable = sorted.map((tapIp) => {
        const vkTap = vk * (tapIp / ip);
        const alfAchievable = rct + rb > 0 ? vkTap / (is * (rct + rb)) : 0;
        const meets = alfAchievable >= alfRated;
        return { tapIp, vkTap, alfAchievable, meets, isFullTap: Math.abs(tapIp - ip) < 1e-6 };
      });
      const best = tapTable.find((t) => t.meets);
      bestTap = best ? best.tapIp : null;
    }

    // REF / differential ratio matching
    const list = (input.matchList || []).filter((c) => c.ip > 0 && c.is > 0);
    if (list.length >= 2) {
      const checkI = input.matchCheckI || list[0].ip;
      const ref = list[0];
      const refRatio = ref.ip / ref.is;
      matchTable = list.map((c, i) => {
        const ratio = c.ip / c.is;
        const matches = i === 0 ? true : Math.abs(ratio - refRatio) < 1e-6;
        const secRef = checkI / refRatio;
        const secThis = checkI / ratio;
        const spillA = i === 0 ? 0 : Math.abs(secRef - secThis);
        if (!matches) matchAnyMismatch = true;
        return { label: c.label, ip: c.ip, is: c.is, ratio, isReference: i === 0, matches, spillA };
      });
    }
  }

  return {
    n,
    in_,
    rlead,
    rrelay,
    rb,
    burdenVa,
    vkReq,
    alfActual,
    alfPass,
    faultTable,
    saturation,
    thermal,
    meterTable,
    tapTable,
    bestTap,
    matchTable,
    matchAnyMismatch,
  };
}
