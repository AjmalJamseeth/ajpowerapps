// Validation register: each case compares a calculator's result with a reference
// value that was obtained independently of the site's code — a value printed in a
// standard's table, a worked example published in the standard itself, or a hand
// calculation from the standard's formula done separately from the code.
// scripts/regression-test.ts runs every case before each release, and
// /validation publishes the register (with a CSV download).

import { AMPACITY, CABLE_SIZES, deratingCa, deratingCg, deratingCi, scMinSize, voltDropPct, conductorRX } from "./cable";
import type { ConductorMaterial, InstallMethod, InsulationType } from "./cable";
import * as E from "./earthing";
import { iecTime, ieeeTime } from "./curveEngine";
import { tripTime, DEFAULT_RELAY } from "./idmt";
import { calcAf2018 } from "./arcflash2018";

export type ReferenceType = "Standard table" | "Standard worked example" | "Hand calculation from the standard's formula";

export interface ValidationCase {
  id: string;
  area: "Cables" | "Protection" | "Earthing" | "Arc flash";
  tool: string;
  href: string;
  quantity: string;
  reference: string; // standard, edition, clause / table / example
  referenceType: ReferenceType;
  inputs: string;
  expected: number;
  unit: string;
  tolerancePct: number; // acceptance tolerance, fixed before testing
  note?: string;
  compute: () => number;
}

export interface ValidationRow extends Omit<ValidationCase, "compute"> {
  actual: number;
  deviationPct: number;
  pass: boolean;
}

const amp = (m: ConductorMaterial, ins: InsulationType, method: InstallMethod, size: number) =>
  AMPACITY[m][ins][method]?.[CABLE_SIZES.indexOf(size)] ?? NaN;

const CABLE = "/calculators/cable-sizing";
const EARTH = "/calculators/earthing";
const ROD = "/calculators/ground-resistance";
const RING = "/calculators/ground-ring-resistance";
const IDMT = "/calculators/idmt";
const PROT = "/calculators/protection-suite";
const AF = "/calculators/arc-flash";

// IEEE Std 80-2013 Annex B, Example 1: 70 m × 70 m grid, 1540 m of conductor, no rods,
// ρ = 400 Ω·m, 0.102 m surface layer of 2500 Ω·m, h = 0.5 m, d = 0.01 m, D = 7 m,
// tf = 0.5 s, IG = 1908 A, 70 kg body.
const ex1 = (() => {
  const n = E.calcNGeom(1540, 70, 70);
  const Cs = E.calcCs(400, 2500, 0.102);
  const Km = E.calcKm(7, 0.5, 0.01, n, false);
  const Ki = E.calcKi(n);
  const Rg = E.calcRg(400, 1540, 4900, 0.5) ?? NaN;
  return {
    Rg,
    Cs,
    Km,
    Em: E.calcEm(400, 1908, Km, Ki, E.calcLm(1540, 0, 0)),
    Et: E.calcEtouch(2500, Cs, 0.5, 70),
    Es: E.calcEstep(2500, Cs, 0.5, 70),
    gpr: Rg * 1908,
  };
})();
const EX1_INPUTS = "70 m × 70 m grid, 1540 m conductor, no rods, ρ 400 Ω·m, surface 2500 Ω·m × 0.102 m, h 0.5 m, d 0.01 m, D 7 m, tf 0.5 s, IG 1908 A, 70 kg";
const EX1_REF = "IEEE Std 80-2013, Annex B, Example 1 (square grid without rods)";

const afD1 = calcAf2018({ ibfKa: 15, vocKv: 4.16, gapMm: 104, workingDistMm: 914.4, config: "VCB", widthMm: 762, heightMm: 1143, depthMm: 762, durationMs: 197, durationMinMs: 223 });
const afD2 = calcAf2018({ ibfKa: 45, vocKv: 0.48, gapMm: 32, workingDistMm: 609.6, config: "VCB", widthMm: 610, heightMm: 610, depthMm: 254, durationMs: 61.3, durationMinMs: 319 });
const D1_INPUTS = "4.16 kV, VCB, Ibf 15 kA, gap 104 mm, working distance 914.4 mm, enclosure 762 × 1143 × 762 mm, T 197 ms";
const D2_INPUTS = "0.48 kV, VCB, Ibf 45 kA, gap 32 mm, working distance 609.6 mm, enclosure 610 × 610 × 254 mm, T 61.3 ms";

export const VALIDATION_CASES: ValidationCase[] = [
  // ---------------------------------------------------------------- Cables
  { id: "CAB-01", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Current rating Itab, Cu/PVC, method C, 25 mm², 3 loaded conductors", reference: "IEC 60364-5-52:2009 Table B.52.4, column C", referenceType: "Standard table", inputs: "Cu, PVC 70 °C, method C, 25 mm², 3 loaded", expected: 96, unit: "A", tolerancePct: 0, compute: () => amp("Cu", "PVC70", "C", 25) },
  { id: "CAB-02", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Current rating Itab, Cu/PVC, method A1, 2.5 mm²", reference: "IEC 60364-5-52:2009 Table B.52.4, column A1", referenceType: "Standard table", inputs: "Cu, PVC 70 °C, method A1, 2.5 mm², 3 loaded", expected: 18, unit: "A", tolerancePct: 0, compute: () => amp("Cu", "PVC70", "A1", 2.5) },
  { id: "CAB-03", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Current rating Itab, Cu/XLPE, method B2, 35 mm²", reference: "IEC 60364-5-52:2009 Table B.52.5, column B2", referenceType: "Standard table", inputs: "Cu, XLPE 90 °C, method B2 (multicore in conduit on a wall), 35 mm², 3 loaded", expected: 128, unit: "A", tolerancePct: 0, compute: () => amp("Cu", "XLPE90", "B2", 35) },
  { id: "CAB-04", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Current rating Itab, Cu/XLPE, method C, 95 mm²", reference: "IEC 60364-5-52:2009 Table B.52.5, column C", referenceType: "Standard table", inputs: "Cu, XLPE 90 °C, method C, 95 mm², 3 loaded", expected: 278, unit: "A", tolerancePct: 0, compute: () => amp("Cu", "XLPE90", "C", 95) },
  { id: "CAB-05", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Current rating Itab, Al/XLPE, method D1 (buried duct), 120 mm²", reference: "IEC 60364-5-52:2009 Table B.52.5, column D1", referenceType: "Standard table", inputs: "Al, XLPE 90 °C, method D1, 120 mm², 3 loaded", expected: 174, unit: "A", tolerancePct: 0, compute: () => amp("Al", "XLPE90", "D1", 120) },
  { id: "CAB-06", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Ambient temperature factor, PVC in air at 40 °C", reference: "IEC 60364-5-52:2009 Table B.52.14", referenceType: "Standard table", inputs: "PVC 70 °C, air 40 °C", expected: 0.87, unit: "—", tolerancePct: 0, compute: () => deratingCa(40, "PVC70", false) },
  { id: "CAB-07", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Ground temperature factor, XLPE at 30 °C", reference: "IEC 60364-5-52:2009 Table B.52.15", referenceType: "Standard table", inputs: "XLPE 90 °C, ground 30 °C", expected: 0.93, unit: "—", tolerancePct: 0, compute: () => deratingCa(30, "XLPE90", true) },
  { id: "CAB-08", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Grouping factor, 6 circuits bunched", reference: "IEC 60364-5-52:2009 Table B.52.17, item 1", referenceType: "Standard table", inputs: "6 circuits bunched in air / on a surface", expected: 0.57, unit: "—", tolerancePct: 0, compute: () => deratingCg(6) },
  { id: "CAB-09", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Soil resistivity factor, buried ducts, 1.5 K·m/W", reference: "IEC 60364-5-52:2009 Table B.52.16", referenceType: "Standard table", inputs: "Cables in buried ducts, soil 1.5 K·m/W", expected: 1.1, unit: "—", tolerancePct: 0, compute: () => deratingCi(1.5) },
  { id: "CAB-10", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Minimum conductor size for short-circuit withstand", reference: "IEC 60364-4-43:2008 434.5.2 (S = √(I²t)/k), k = 143 for Cu/XLPE (Table 43A)", referenceType: "Hand calculation from the standard's formula", inputs: "10 kA for 1.0 s, Cu/XLPE", expected: 69.93, unit: "mm²", tolerancePct: 0.05, compute: () => scMinSize(10, 1, "Cu", "XLPE90") },
  { id: "CAB-11", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Three-phase voltage drop", reference: "ΔU = √3·I·L·(r cos φ + x sin φ), IEC 60364-5-52 Annex G form", referenceType: "Hand calculation from the standard's formula", inputs: "Cu/PVC 25 mm² (r 0.875 mΩ/m, x 0.058 mΩ/m per conductor at 70 °C), 81.82 A, 50 m, 415 V, cos φ 0.85", expected: 1.322, unit: "%", tolerancePct: 0.2, note: "Checks the formula with per-conductor values. Using the single-phase loop value (1.75 mV/A/m) with √3 would double the drop to about 2.6 %.", compute: () => voltDropPct("Cu", 25, 81.82, 50, 415, "3ph", 0.85)?.vd_pct ?? NaN },
  { id: "CAB-12", area: "Cables", tool: "Cable Sizing & Voltage Drop", href: CABLE, quantity: "Conductor resistance per conductor at 70 °C, Cu 25 mm²", reference: "IEC 60228:2004 Table 2 (0.727 Ω/km at 20 °C) corrected to 70 °C with α = 0.00393 /K", referenceType: "Hand calculation from the standard's formula", inputs: "Cu, 25 mm² class 2, 70 °C", expected: 0.8699, unit: "mΩ/m", tolerancePct: 1, note: "The calculator uses a typical published cable value (0.875 mΩ/m), 0.6 % above the IEC 60228 maximum corrected to 70 °C.", compute: () => conductorRX("Cu", 25)?.r ?? NaN },

  // ---------------------------------------------------------------- Protection
  { id: "PRO-01", area: "Protection", tool: "IDMT Relay Coordination", href: IDMT, quantity: "Operating time, IEC Standard Inverse", reference: "IEC 60255-151:2009 equation (k = 0.14, α = 0.02)", referenceType: "Hand calculation from the standard's formula", inputs: "Pickup 100 A, TMS 0.10, fault 2000 A (M = 20)", expected: 0.2267, unit: "s", tolerancePct: 0.1, compute: () => tripTime(DEFAULT_RELAY("R1"), 2000) },
  { id: "PRO-02", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEC Standard Inverse", reference: "IEC 60255-151:2009 equation (k = 0.14, α = 0.02)", referenceType: "Hand calculation from the standard's formula", inputs: "TMS 0.30, M = 5", expected: 1.2839, unit: "s", tolerancePct: 0.1, compute: () => iecTime("standard_inverse", 0.3, 5) },
  { id: "PRO-03", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEC Very Inverse", reference: "IEC 60255-151:2009 equation (k = 13.5, α = 1)", referenceType: "Hand calculation from the standard's formula", inputs: "TMS 1.0, M = 10", expected: 1.5, unit: "s", tolerancePct: 0.1, compute: () => iecTime("very_inverse", 1, 10) },
  { id: "PRO-04", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEC Extremely Inverse", reference: "IEC 60255-151:2009 equation (k = 80, α = 2)", referenceType: "Hand calculation from the standard's formula", inputs: "TMS 1.0, M = 10", expected: 0.8081, unit: "s", tolerancePct: 0.1, compute: () => iecTime("extremely_inverse", 1, 10) },
  { id: "PRO-05", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEC Long-Time Inverse", reference: "IEC 60255-151:2009 equation (k = 120, α = 1)", referenceType: "Hand calculation from the standard's formula", inputs: "TMS 1.0, M = 10", expected: 13.333, unit: "s", tolerancePct: 0.1, compute: () => iecTime("long_time_inverse", 1, 10) },
  { id: "PRO-06", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEEE Moderately Inverse", reference: "IEEE C37.112-2018 equation (A = 0.0515, B = 0.114, p = 0.02)", referenceType: "Hand calculation from the standard's formula", inputs: "TD 1.0, M = 10", expected: 1.2068, unit: "s", tolerancePct: 0.1, compute: () => ieeeTime("moderately_inverse", 1, 10) },
  { id: "PRO-07", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEEE Very Inverse", reference: "IEEE C37.112-2018 equation (A = 19.61, B = 0.491, p = 2)", referenceType: "Hand calculation from the standard's formula", inputs: "TD 1.0, M = 10", expected: 0.6891, unit: "s", tolerancePct: 0.1, compute: () => ieeeTime("very_inverse", 1, 10) },
  { id: "PRO-08", area: "Protection", tool: "Protection Coordination Suite", href: PROT, quantity: "Operating time, IEEE Extremely Inverse", reference: "IEEE C37.112-2018 equation (A = 28.2, B = 0.1217, p = 2)", referenceType: "Hand calculation from the standard's formula", inputs: "TD 1.0, M = 10", expected: 0.4065, unit: "s", tolerancePct: 0.1, compute: () => ieeeTime("extremely_inverse", 1, 10) },

  // ---------------------------------------------------------------- Earthing
  { id: "EAR-01", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Grid resistance Rg (Sverak, Eq. 57)", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 2.78, unit: "Ω", tolerancePct: 0.5, compute: () => ex1.Rg },
  { id: "EAR-02", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Ground potential rise GPR = IG·Rg", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 5304, unit: "V", tolerancePct: 0.5, compute: () => ex1.gpr },
  { id: "EAR-03", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Surface-layer derating factor Cs", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 0.74, unit: "—", tolerancePct: 0.5, note: "The standard rounds Cs to 0.74; the calculator keeps 0.743.", compute: () => ex1.Cs },
  { id: "EAR-04", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Tolerable touch voltage, 70 kg", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 838.2, unit: "V", tolerancePct: 0.5, note: "The 0.3 % difference comes from the standard rounding Cs to 0.74.", compute: () => ex1.Et },
  { id: "EAR-05", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Tolerable step voltage, 70 kg", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 2686.6, unit: "V", tolerancePct: 0.5, note: "The 0.4 % difference comes from the standard rounding Cs to 0.74.", compute: () => ex1.Es },
  { id: "EAR-06", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Spacing factor for mesh voltage Km", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 0.89, unit: "—", tolerancePct: 0.5, compute: () => ex1.Km },
  { id: "EAR-07", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Mesh voltage Em", reference: EX1_REF, referenceType: "Standard worked example", inputs: EX1_INPUTS, expected: 1002.1, unit: "V", tolerancePct: 0.5, compute: () => ex1.Em },
  { id: "EAR-08", area: "Earthing", tool: "Ground Resistance (single rod)", href: ROD, quantity: "Rod electrode resistance", reference: "BS 7430:2011+A1:2015 9.5.3, R = ρ/(2πL)·(ln(8L/d) − 1)", referenceType: "Hand calculation from the standard's formula", inputs: "ρ 100 Ω·m, rod 3 m long, 16 mm diameter", expected: 33.49, unit: "Ω", tolerancePct: 0.05, compute: () => E.calcRodR(100, 3, 0.008) ?? NaN },
  { id: "EAR-09", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Plate electrode resistance", reference: "BS 7430:2011+A1:2015 9.5.2, R = (ρ/4)·√(π/A)", referenceType: "Hand calculation from the standard's formula", inputs: "ρ 100 Ω·m, plate 1 m × 1 m", expected: 44.31, unit: "Ω", tolerancePct: 0.05, compute: () => E.calcPlateR(100, 1, 1) },
  { id: "EAR-10", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Strip electrode resistance", reference: "BS 7430:2011+A1:2015 9.5.5, R = ρ/(2πL)·ln(L²/(1.36·h·w))", referenceType: "Hand calculation from the standard's formula", inputs: "ρ 100 Ω·m, strip 10 m × 25 mm, buried 0.6 m", expected: 13.52, unit: "Ω", tolerancePct: 0.05, compute: () => E.calcStripR(100, 10, 0.025, 0.6) ?? NaN },
  { id: "EAR-11", area: "Earthing", tool: "Ground Ring Resistance", href: RING, quantity: "Ring electrode resistance", reference: "IEEE Std 142-2007 Table 4-5 (Dwight ring formula)", referenceType: "Hand calculation from the standard's formula", inputs: "ρ 100 Ω·m, ring 10 m diameter, 10 mm conductor, buried 0.6 m", expected: 6.329, unit: "Ω", tolerancePct: 0.05, compute: () => E.calcRingR(100, 10, 0.005, 0.6) ?? NaN },
  { id: "EAR-12", area: "Earthing", tool: "Earthing Grid Design", href: EARTH, quantity: "Earthing conductor k, copper, bolted joints", reference: "BS 7430:2011+A1:2015 9.7 and Table 7, k = 226·√ln((θf + 234.5)/(θi + 234.5))", referenceType: "Hand calculation from the standard's formula", inputs: "Copper, θi 30 °C, θf 250 °C", expected: 175.8, unit: "A/mm² (1 s)", tolerancePct: 0.05, compute: () => E.kAdiabatic("Cu", 250) },

  // ---------------------------------------------------------------- Arc flash
  { id: "AF-01", area: "Arc flash", tool: "Arc Flash", href: AF, quantity: "Arcing current", reference: "IEEE Std 1584-2018 Annex D.1", referenceType: "Standard worked example", inputs: D1_INPUTS, expected: 12.979, unit: "kA", tolerancePct: 0.1, compute: () => afD1.normal.iarcKa },
  { id: "AF-02", area: "Arc flash", tool: "Arc Flash", href: AF, quantity: "Incident energy", reference: "IEEE Std 1584-2018 Annex D.1", referenceType: "Standard worked example", inputs: D1_INPUTS, expected: 12.152, unit: "J/cm²", tolerancePct: 0.1, compute: () => afD1.normal.eJcm2 },
  { id: "AF-03", area: "Arc flash", tool: "Arc Flash", href: AF, quantity: "Arc-flash boundary", reference: "IEEE Std 1584-2018 Annex D.1", referenceType: "Standard worked example", inputs: D1_INPUTS, expected: 1606, unit: "mm", tolerancePct: 0.2, compute: () => afD1.normal.afbMm },
  { id: "AF-04", area: "Arc flash", tool: "Arc Flash", href: AF, quantity: "Arcing current", reference: "IEEE Std 1584-2018 Annex D.2", referenceType: "Standard worked example", inputs: D2_INPUTS, expected: 28.793, unit: "kA", tolerancePct: 0.1, compute: () => afD2.normal.iarcKa },
  { id: "AF-05", area: "Arc flash", tool: "Arc Flash", href: AF, quantity: "Incident energy", reference: "IEEE Std 1584-2018 Annex D.2", referenceType: "Standard worked example", inputs: D2_INPUTS, expected: 11.585, unit: "J/cm²", tolerancePct: 0.1, compute: () => afD2.normal.eJcm2 },
  { id: "AF-06", area: "Arc flash", tool: "Arc Flash", href: AF, quantity: "Arc-flash boundary", reference: "IEEE Std 1584-2018 Annex D.2", referenceType: "Standard worked example", inputs: D2_INPUTS, expected: 1029, unit: "mm", tolerancePct: 0.2, compute: () => afD2.normal.afbMm },
];

export function runValidation(): ValidationRow[] {
  return VALIDATION_CASES.map(({ compute, ...c }) => {
    const actual = compute();
    const deviationPct = c.expected !== 0 ? ((actual - c.expected) / c.expected) * 100 : actual * 100;
    const pass = Number.isFinite(actual) && Math.abs(deviationPct) <= c.tolerancePct + 1e-9;
    return { ...c, actual, deviationPct, pass };
  });
}

/** Same check, rounded the way the register shows it, for CSV export. */
export function validationCsv(rows: ValidationRow[], buildLabel: string): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = ["ID", "Area", "Tool", "Page", "Quantity", "Reference", "Reference type", "Inputs", "Expected", "Actual", "Unit", "Deviation %", "Tolerance %", "Result", "Note", "Build"];
  const lines = rows.map((r) =>
    [r.id, r.area, r.tool, `https://www.ajpowerapps.com${r.href}`, r.quantity, r.reference, r.referenceType, r.inputs, r.expected, Number(r.actual.toPrecision(6)), r.unit, r.deviationPct.toFixed(3), r.tolerancePct, r.pass ? "PASS" : "FAIL", r.note ?? "", buildLabel].map(esc).join(",")
  );
  return [head.join(","), ...lines].join("\n");
}
