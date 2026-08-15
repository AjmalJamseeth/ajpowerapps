// Cable Tray Fill — NEC §392.22 (US) and IEC 61537-style area-fill (International).
// Ported and verified from the AJ Apps Suite's `CableTray` module. Entirely a
// subscriber feature in the source app — no free tier at all.

export type TrayType = "ladder" | "ventilatedTrough" | "solid";
export type TrayCategory = "powerMixed" | "controlSignal" | "singleConductor";

export interface DiaQtyRow {
  diaMm: number | null; // NEC rows use inches, IEC rows use mm — unit tracked by caller
  qty: number;
}

function sumRows(rows: DiaQtyRow[]) {
  let sd = 0,
    area = 0,
    any = false;
  for (const r of rows) {
    if (r.qty <= 0 || r.diaMm == null) continue;
    any = true;
    sd += r.diaMm * r.qty;
    area += Math.PI * Math.pow(r.diaMm / 2, 2) * r.qty;
  }
  return { sd, area, any };
}

export interface CableTrayInput {
  standard: "nec" | "iec";
  necType: TrayType;
  necCategory: TrayCategory;
  necWidthIn: number | null;
  necDepthIn: number | null;
  necLargeRows: DiaQtyRow[]; // 4/0 AWG and larger, single layer
  necSmallRows: DiaQtyRow[]; // smaller than 4/0 AWG
  necSingleRows: DiaQtyRow[]; // single-conductor cables
  iecType: TrayType;
  iecWidthMm: number | null;
  iecDepthMm: number | null;
  iecCableRows: DiaQtyRow[];
}

export const DEFAULT_CABLETRAY_INPUT: CableTrayInput = {
  standard: "nec",
  necType: "ladder",
  necCategory: "powerMixed",
  necWidthIn: 12,
  necDepthIn: 4,
  necLargeRows: [{ diaMm: null, qty: 0 }],
  necSmallRows: [{ diaMm: 0.6, qty: 6 }],
  necSingleRows: [{ diaMm: null, qty: 0 }],
  iecType: "ladder",
  iecWidthMm: 300,
  iecDepthMm: 100,
  iecCableRows: [{ diaMm: 15, qty: 6 }],
};

export interface NecTrayResult {
  rule: string;
  sd: string;
  area: string;
  maxArea: string;
  widthNote: string;
  pass: boolean | null;
  notPermitted: boolean;
}
export interface IecTrayResult {
  trayAreaMm2: number;
  maxPct: number;
  maxAreaMm2: number;
  sumAreaMm2: number;
  fillPct: number;
  pass: boolean;
}

export function calcCableTrayNec(input: CableTrayInput): NecTrayResult | null {
  const { necType: type, necCategory: cat, necWidthIn: width, necDepthIn: depth } = input;
  if (width == null) return null;

  if (cat === "singleConductor") {
    if (type === "solid") {
      return { rule: "§392.22(B) — single-conductor cable NOT permitted in solid-bottom tray", sd: "—", area: "—", maxArea: "—", widthNote: "—", pass: false, notPermitted: true };
    }
    const r = sumRows(input.necSingleRows);
    if (!r.any) return null;
    return {
      rule: "§392.22(B)(1) — sum of diameters ≤ tray width, single layer",
      sd: `${r.sd.toFixed(3)} in`,
      area: "n/a (width-based rule)",
      maxArea: "n/a",
      widthNote: `${r.sd.toFixed(3)} in required vs ${width.toFixed(3)} in actual`,
      pass: r.sd <= width,
      notPermitted: false,
    };
  }

  const depthCap = cat === "controlSignal" ? 6 : 3;
  const pct = cat === "controlSignal" ? (type === "solid" ? 0.4 : 0.5) : type === "solid" ? 0.305 : 0.389;
  if (depth == null) return null;
  const effDepth = Math.min(depth, depthCap);
  const maxArea = pct * effDepth * width;

  if (cat === "controlSignal") {
    const r = sumRows(input.necSmallRows);
    if (!r.any) return null;
    return {
      rule: `§392.22(A)(2)/(4) — control/signal-only, ${(pct * 100).toFixed(1)}% of area (depth capped at ${depthCap}in)`,
      sd: "n/a",
      area: `${r.area.toFixed(3)} in²`,
      maxArea: `${maxArea.toFixed(3)} in²`,
      widthNote: `${width.toFixed(3)} in (actual)`,
      pass: r.area <= maxArea,
      notPermitted: false,
    };
  }

  const rLarge = sumRows(input.necLargeRows);
  const rSmall = sumRows(input.necSmallRows);
  if (!rLarge.any && !rSmall.any) return null;

  if (!rLarge.any) {
    return {
      rule: `§392.22(A)(1)(b)/(3)(b) — area ≤ ${(pct * 100).toFixed(1)}% (depth capped at ${depthCap}in)`,
      sd: "0 in (no 4/0+ cables)",
      area: `${rSmall.area.toFixed(3)} in²`,
      maxArea: `${maxArea.toFixed(3)} in²`,
      widthNote: `${width.toFixed(3)} in (actual)`,
      pass: rSmall.area <= maxArea,
      notPermitted: false,
    };
  }

  const sdMult = type === "solid" ? 1.111 : 1.0;
  const areaMult = type === "solid" ? 6 / 5.5 : 6 / 7;
  const reqWidth = rLarge.sd * sdMult + rSmall.area * areaMult;
  return {
    rule: "§392.22(A)(1)(c)/(3)(c) — 4/0+ cables (single layer) mixed with smaller cables",
    sd: `${rLarge.sd.toFixed(3)} in`,
    area: `${rSmall.area.toFixed(3)} in²`,
    maxArea: "n/a (hybrid width rule)",
    widthNote: `${reqWidth.toFixed(3)} in required vs ${width.toFixed(3)} in actual`,
    pass: reqWidth <= width,
    notPermitted: false,
  };
}

export function calcCableTrayIec(input: CableTrayInput): IecTrayResult | null {
  const { iecType: type, iecWidthMm: width, iecDepthMm: depth } = input;
  if (width == null || depth == null) return null;
  const r = sumRows(input.iecCableRows);
  if (!r.any) return null;
  const trayArea = width * depth;
  const maxPct = type === "solid" ? 0.4 : 0.5;
  const maxArea = trayArea * maxPct;
  const fillPct = (r.area / trayArea) * 100;
  return { trayAreaMm2: trayArea, maxPct, maxAreaMm2: maxArea, sumAreaMm2: r.area, fillPct, pass: r.area <= maxArea };
}
