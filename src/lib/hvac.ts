// HVAC Electrical Sizing — motor-compressor branch-circuit sizing per NEC
// Article 440, or IEC 60364-5-52/60947-4-1 general method. Single motor
// free — multi-motor combination-load and VFD-fed motor are advanced
// features. Ported and verified from the AJ Apps Suite's `HVACElec` module.

export type HvacStandard = "nec" | "iec";

// NEC 240.6(A) standard fuse/breaker ampere ratings
export const STD_SIZES = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];

// NEC 440.22(A): the device rating shall NOT EXCEED 175% of RLA; if that is not enough to
// start the compressor it may be increased, but shall not exceed 225% of RLA. Both are
// maximums, so a non-standard result rounds DOWN (there is no next-size-up allowance in
// 440.22), and the device need not be smaller than 15 A (440.22(A) exception).
function roundDownStd(val: number): number {
  const lower = STD_SIZES.filter((s) => s <= val);
  return lower.length ? lower[lower.length - 1] : STD_SIZES[0];
}
function ocpdForAmps(base175: number, base225: number): { mocp: number; mocpMax: number } {
  return { mocp: Math.max(15, roundDownStd(base175)), mocpMax: Math.max(15, roundDownStd(base225)) };
}

export interface ComboRow {
  desc: string;
  rla: number | null;
}

export interface HvacInput {
  standard: HvacStandard;
  rlaA: number | null;
  lraA: number | null; // NEC only, optional
  iecMargin: number; // NEC:false uses this
  comboRows: ComboRow[];
  comboIecMargin: number;
  vfdInputA: number | null;
  vfdMotorRlaA: number | null;
  vfdIecMargin: number;
}

export const DEFAULT_HVAC_INPUT: HvacInput = {
  standard: "nec",
  rlaA: 18,
  lraA: 110,
  iecMargin: 1.0,
  comboRows: [
    { desc: "Compressor", rla: 18 },
    { desc: "Fan 1", rla: 4 },
  ],
  comboIecMargin: 1.0,
  vfdInputA: 25,
  vfdMotorRlaA: 22,
  vfdIecMargin: 1.0,
};

export interface HvacSingleResult {
  mcaA: number | null;
  mocpA: number | null; // 175 % basis, rounded down
  mocpMaxA: number | null; // 225 % ceiling if 175 % will not start the compressor, rounded down
  discA: number | null;
  iecDesignA: number | null;
}
export interface HvacComboResult {
  largestDesc: string | null;
  largestRla: number | null;
  mcaA: number | null;
  mocpA: number | null;
  mocpMaxA: number | null;
  discA: number | null;
  iecDesignA: number | null;
}
export interface HvacVfdResult {
  inMcaA: number | null;
  outMcaA: number | null;
  inIecA: number | null;
  outIecA: number | null;
}
export interface HvacResult {
  single: HvacSingleResult;
  combo: HvacComboResult | null;
  vfd: HvacVfdResult | null;
}

export function calcHvac(input: HvacInput, premiumEnabled: boolean): HvacResult {
  const nec = input.standard === "nec";
  const rla = input.rlaA;

  let single: HvacSingleResult = { mcaA: null, mocpA: null, mocpMaxA: null, discA: null, iecDesignA: null };
  if (rla != null && rla > 0) {
    if (nec) {
      const o = ocpdForAmps(1.75 * rla, 2.25 * rla);
      single = { mcaA: 1.25 * rla, mocpA: o.mocp, mocpMaxA: o.mocpMax, discA: 1.15 * rla, iecDesignA: null };
    } else {
      single = { mcaA: null, mocpA: null, mocpMaxA: null, discA: null, iecDesignA: rla * (input.iecMargin || 1) };
    }
  }

  let combo: HvacComboResult | null = null;
  if (premiumEnabled) {
    const rows = input.comboRows.filter((r) => r.rla != null && r.rla > 0) as { desc: string; rla: number }[];
    if (rows.length) {
      let largest = rows[0];
      rows.forEach((r) => {
        if (r.rla > largest.rla) largest = r;
      });
      const sumAll = rows.reduce((a, r) => a + r.rla, 0);
      const sumOthers = sumAll - largest.rla;
      if (nec) {
        combo = {
          largestDesc: largest.desc,
          largestRla: largest.rla,
          mcaA: 1.25 * largest.rla + sumOthers,
          ...(() => {
            const o = ocpdForAmps(1.75 * largest.rla + sumOthers, 2.25 * largest.rla + sumOthers);
            return { mocpA: o.mocp, mocpMaxA: o.mocpMax };
          })(),
          discA: 1.15 * sumAll,
          iecDesignA: null,
        };
      } else {
        combo = { largestDesc: largest.desc, largestRla: largest.rla, mcaA: null, mocpA: null, mocpMaxA: null, discA: null, iecDesignA: sumAll * (input.comboIecMargin || 1) };
      }
    }
  }

  let vfd: HvacVfdResult | null = null;
  if (premiumEnabled && (input.vfdInputA != null || input.vfdMotorRlaA != null)) {
    if (nec) {
      vfd = {
        inMcaA: input.vfdInputA != null ? 1.25 * input.vfdInputA : null,
        outMcaA: input.vfdMotorRlaA != null ? 1.25 * input.vfdMotorRlaA : null,
        inIecA: null,
        outIecA: null,
      };
    } else {
      const margin = input.vfdIecMargin || 1;
      vfd = {
        inMcaA: null,
        outMcaA: null,
        inIecA: input.vfdInputA != null ? input.vfdInputA * margin : null,
        outIecA: input.vfdMotorRlaA != null ? input.vfdMotorRlaA * margin : null,
      };
    }
  }

  return { single, combo, vfd };
}
