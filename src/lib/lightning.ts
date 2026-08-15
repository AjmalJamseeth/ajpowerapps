// Lightning Protection & Risk Assessment — IEC 62305-1/2 aligned.
// Ported and verified from the AJ Apps Suite's `Lightning` module.

export type LpsClass = "none" | "IV" | "III" | "II" | "I";
export type LocationFactor = "1" | "0.5" | "0.25" | "0.01"; // Cd
export type ShieldOption = "unshielded" | "shielded_5_20" | "shielded_1_5" | "shielded_le1" | "protective_conduit";

const PB_BY_CLASS: Record<LpsClass, number> = { none: 1, IV: 0.2, III: 0.1, II: 0.05, I: 0.02 };
const LPS_DESIGN: Record<Exclude<LpsClass, "none">, { sphere: number; mesh: string; down: string }> = {
  I: { sphere: 20, mesh: "5 × 5 m", down: "10 m" },
  II: { sphere: 30, mesh: "10 × 10 m", down: "10 m" },
  III: { sphere: 45, mesh: "15 × 15 m", down: "15 m" },
  IV: { sphere: 60, mesh: "20 × 20 m", down: "20 m" },
};
const CLASS_ORDER: LpsClass[] = ["none", "IV", "III", "II", "I"];
const LT = 0.01; // typical mean value, Table C.2

const PLD_TABLE: Record<ShieldOption, Record<string, number>> = {
  unshielded: { "1": 1, "1.5": 1, "2.5": 1, "4": 1, "6": 1 },
  shielded_5_20: { "1": 1, "1.5": 1, "2.5": 0.95, "4": 0.9, "6": 0.8 },
  shielded_1_5: { "1": 0.9, "1.5": 0.8, "2.5": 0.6, "4": 0.3, "6": 0.1 },
  shielded_le1: { "1": 0.6, "1.5": 0.4, "2.5": 0.2, "4": 0.04, "6": 0.02 },
  protective_conduit: { "1": 0, "1.5": 0, "2.5": 0, "4": 0, "6": 0 },
};
const CLD_BY_OPTION: Record<ShieldOption, number> = { unshielded: 1, shielded_5_20: 1, shielded_1_5: 1, shielded_le1: 1, protective_conduit: 0 };

function ad(L: number, W: number, H: number) {
  return L * W + 2 * (3 * H) * (L + W) + Math.PI * Math.pow(3 * H, 2);
}
function lossLA(rt: number, nz: number, nt: number, tz: number) {
  return rt * LT * (nz / nt) * (tz / 8760);
}
function lossLB(rp: number, rf: number, hz: number, lf: number, nz: number, nt: number, tz: number) {
  return rp * rf * hz * lf * (nz / nt) * (tz / 8760);
}
function lineRisk(ng: number, length: number | null, routing: number, type: number, env: number, shieldOpt: ShieldOption, uw: string, ptu: number, peb: number, lu: number, lv: number) {
  if (!length) return { NL: 0, RU: 0, RV: 0 };
  const al = 40 * length;
  const NL = ng * al * routing * env * type * 1e-6;
  const pldRow = PLD_TABLE[shieldOpt] || PLD_TABLE.unshielded;
  const PLD = pldRow[uw] != null ? pldRow[uw] : 1;
  const CLD = CLD_BY_OPTION[shieldOpt] != null ? CLD_BY_OPTION[shieldOpt] : 1;
  const PU = ptu * peb * PLD * CLD;
  const PV = peb * PLD * CLD;
  return { NL, RU: NL * PU * lu, RV: NL * PV * lv };
}

export interface LightningInput {
  // Free — structure risk
  ng: number; // ground flash density, /km²/yr
  structL: number;
  structW: number;
  structH: number;
  locationFactor: number; // Cd
  lpsClass: LpsClass;
  pta: number;
  floorType: number; // rt
  fireProvision: number; // rp
  fireRisk: number; // rf
  specialHazard: number; // hz
  structureType: number; // LF
  personsInZone: number;
  totalPersons: number;
  timePresentH: number;

  // Subscriber — connected lines
  touchProtectionLine: number; // Ptu
  lineSpd: number; // Peb
  powerLineLengthM: number;
  powerUw: string;
  powerLineRouting: number;
  powerLineHV: number;
  powerLineEnv: number;
  powerShieldOption: ShieldOption;
  telecomLineLengthM: number;
  telecomUw: string;
  telecomLineRouting: number;
  telecomLineEnv: number;
  telecomShieldOption: ShieldOption;
}

export const DEFAULT_LIGHTNING_INPUT: LightningInput = {
  ng: 4,
  structL: 15,
  structW: 20,
  structH: 6,
  locationFactor: 1,
  lpsClass: "none",
  pta: 1,
  floorType: 0.00001,
  fireProvision: 1,
  fireRisk: 0.001,
  specialHazard: 1,
  structureType: 0.1,
  personsInZone: 5,
  totalPersons: 5,
  timePresentH: 8760,
  touchProtectionLine: 1,
  lineSpd: 1,
  powerLineLengthM: 1000,
  powerUw: "1.5",
  powerLineRouting: 0.5,
  powerLineHV: 1,
  powerLineEnv: 1,
  powerShieldOption: "unshielded",
  telecomLineLengthM: 1000,
  telecomUw: "1.5",
  telecomLineRouting: 1,
  telecomLineEnv: 1,
  telecomShieldOption: "unshielded",
};

export interface LightningResult {
  adM2: number;
  ndPerYear: number;
  ra: number;
  rb: number;
  ru: number;
  rv: number;
  r1: number;
  tolerable: boolean;
  minClass: LpsClass | null;
  design: { sphere: number; mesh: string; down: string } | null;
}

export function calcLightning(input: LightningInput, premiumEnabled: boolean): LightningResult | null {
  const { ng, structL: L, structW: W, structH: H, totalPersons: nt, personsInZone: nz, timePresentH: tz } = input;
  if (!ng || !L || !W || !H || !nt || nz == null || tz == null) return null;

  const adM2 = ad(L, W, H);
  const ndPerYear = ng * adM2 * input.locationFactor * 1e-6;

  const pb = PB_BY_CLASS[input.lpsClass];
  const pa = input.pta * pb;
  const la = lossLA(input.floorType, nz, nt, tz);
  const lb = lossLB(input.fireProvision, input.fireRisk, input.specialHazard, input.structureType, nz, nt, tz);
  const ra = ndPerYear * pa * la;
  const rb = ndPerYear * pb * lb;

  let ru = 0,
    rv = 0;
  if (premiumEnabled) {
    const rPower = lineRisk(ng, input.powerLineLengthM, input.powerLineRouting, input.powerLineHV, input.powerLineEnv, input.powerShieldOption, input.powerUw, input.touchProtectionLine, input.lineSpd, la, lb);
    const rTel = lineRisk(ng, input.telecomLineLengthM, input.telecomLineRouting, 1, input.telecomLineEnv, input.telecomShieldOption, input.telecomUw, input.touchProtectionLine, input.lineSpd, la, lb);
    ru = rPower.RU + rTel.RU;
    rv = rPower.RV + rTel.RV;
  }

  const r1 = ra + rb + ru + rv;
  const rt = 1e-5;
  const tolerable = r1 <= rt;

  let minClass: LpsClass | null = null;
  for (const cls of CLASS_ORDER) {
    const pbTry = PB_BY_CLASS[cls];
    const paTry = input.pta * pbTry;
    const raTry = ndPerYear * paTry * la;
    const rbTry = ndPerYear * pbTry * lb;
    const r1Try = raTry + rbTry + ru + rv;
    if (r1Try <= rt) {
      minClass = cls;
      break;
    }
  }

  const design = minClass && minClass !== "none" ? LPS_DESIGN[minClass] : null;

  return { adM2, ndPerYear, ra, rb, ru, rv, r1, tolerable, minClass, design };
}
