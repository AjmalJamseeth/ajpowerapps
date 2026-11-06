// Reference tables shown under calculators. Every value is generated from the
// same data or formula the calculator itself uses, so a table can never
// disagree with the tool above it. Full tables from copyrighted standards
// (for example the complete IEC 60364-5-52 current-rating tables) are not
// reproduced; short factor tables and computed values are.

import { MVAM, SC_K, CPC_K_SEPARATE, CPC_K_BARE, deratingCa, deratingCg } from "./cable";
import { STD_XFMR_KVA_IEC, STD_XFMR_KVA_ANSI } from "./xfmrsizer";
import { STD_SIZES as NEC_STD_OCPD } from "./breakerfuse";
import { STD_ATS_AMPS } from "./transferswitch";

export interface RefTable {
  caption: string;
  headers: string[];
  rows: string[][];
  note?: string;
}

const f = (n: number, d = 0) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
const flc3 = (kva: number, v: number) => (kva * 1000) / (Math.sqrt(3) * v);

// ISA standard atmosphere density (kg/m³) at altitude h (m).
export const airDensity = (h: number) => 1.225 * Math.pow(1 - 2.25577e-5 * h, 4.2559);

const SIZES_SHOWN = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300];

export const REFERENCE_TABLES: Record<string, RefTable[]> = {
  "/calculators/cable-sizing": [
    {
      caption: "Cable voltage drop table — mV/A/m (single-phase loop values)",
      headers: ["Size (mm²)", "Cu r", "Cu x", "Al r", "Al x"],
      rows: SIZES_SHOWN.map((s) => [String(s), f(MVAM.Cu[s].r, 2), f(MVAM.Cu[s].x, 3), s < 2.5 ? "—" : f(MVAM.Al[s].r, 2), s < 2.5 ? "—" : f(MVAM.Al[s].x, 3)]),
      note: "Typical published values for PVC-insulated cables at 70 °C; use the manufacturer's data where available. For three-phase drop per conductor, halve the loop value: ΔV = √3 × I × L × (r cos φ + x sin φ) / 2000.",
    },
    {
      caption: "Ambient temperature correction factors (cables in air) — IEC 60364-5-52 Table B.52.14",
      headers: ["Ambient (°C)", "PVC 70 °C", "XLPE/EPR 90 °C"],
      rows: [25, 30, 35, 40, 45, 50, 55, 60].map((t) => [String(t), f(deratingCa(t, "PVC70", false), 2), f(deratingCa(t, "XLPE90", false), 2)]),
    },
    {
      caption: "Grouping factors — circuits bunched in air or on a surface (IEC 60364-5-52 Table B.52.17, item 1)",
      headers: ["Number of circuits", "1", "2", "3", "4", "5", "6", "7", "8", "9", "12", "16", "20"],
      rows: [["Factor", ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20].map((n) => f(deratingCg(n), 2))]],
    },
    {
      caption: "k values for the adiabatic equation S = I√t / k (IEC 60364-5-54 / 60364-4-43)",
      headers: ["Conductor", "Copper", "Aluminium"],
      rows: [
        ["Live conductor, PVC 70 °C", String(SC_K["Cu-PVC70"]), String(SC_K["Al-PVC70"])],
        ["Live conductor, XLPE/EPR 90 °C", String(SC_K["Cu-XLPE90"]), String(SC_K["Al-XLPE90"])],
        ["Separate insulated protective conductor, PVC", String(CPC_K_SEPARATE["Cu-PVC70"]), String(CPC_K_SEPARATE["Al-PVC70"])],
        ["Separate insulated protective conductor, XLPE/EPR", String(CPC_K_SEPARATE["Cu-XLPE90"]), String(CPC_K_SEPARATE["Al-XLPE90"])],
        ["Bare protective conductor (not exposed to touch or fire risk)", String(CPC_K_BARE.Cu), String(CPC_K_BARE.Al)],
      ],
    },
  ],

  "/calculators/transformer-sizer": [
    {
      caption: "Transformer full-load current table (three-phase, secondary side)",
      headers: ["kVA", "400 V (A)", "415 V (A)", "480 V (A)", "11 kV (A)"],
      rows: STD_XFMR_KVA_IEC.filter((k) => k >= 100 && k <= 5000).map((k) => [f(k), f(flc3(k, 400)), f(flc3(k, 415)), f(flc3(k, 480)), f(flc3(k, 11000), 1)]),
      note: "I = kVA × 1000 / (√3 × V). ANSI ratings: " + STD_XFMR_KVA_ANSI.join(", ") + " kVA.",
    },
  ],

  "/calculators/switchgear-short-circuit-rating": [
    {
      caption: "Transformer secondary fault current (kA) — infinite source, no cable impedance",
      headers: ["kVA", "%Z", "208 V", "400 V", "415 V", "480 V"],
      rows: ([[500, 5.0], [750, 5.75], [1000, 5.75], [1500, 5.75], [2000, 5.75], [2500, 5.75], [3000, 6.0]] as [number, number][]).map(([k, z]) => [
        f(k), f(z, 2), ...[208, 400, 415, 480].map((v) => f(flc3(k, v) / (z / 100) / 1000, 1)),
      ]),
      note: "I_SC = I_FL / (%Z/100). Real fault levels are lower once utility and cable impedance are included, and higher when motor contribution is added.",
    },
  ],

  "/calculators/breaker-fuse-sizer": [
    {
      caption: "Standard ampere ratings of fuses and inverse-time breakers — NEC 240.6(A)",
      headers: ["Ratings (A)"],
      rows: [[NEC_STD_OCPD.join(", ")]],
      note: "Additional standard fuse ratings are 1, 3, 6, 10 and 601 A. IEC 60898 MCB ratings: 6, 10, 13, 16, 20, 25, 32, 40, 50, 63 A.",
    },
  ],

  "/calculators/transfer-switch-sizing": [
    {
      caption: "Common transfer switch ampere ratings",
      headers: ["Ratings (A)"],
      rows: [[STD_ATS_AMPS.join(", ")]],
      note: "Ratings vary by manufacturer; check the UL 1008 listing for the withstand and closing rating at the available fault current.",
    },
  ],

  "/calculators/wind-turbine-power-output": [
    {
      caption: "Air density by altitude (ISA standard atmosphere, 15 °C at sea level)",
      headers: ["Altitude (m)", "Density (kg/m³)", "Power vs sea level"],
      rows: [0, 250, 500, 750, 1000, 1500, 2000, 2500, 3000].map((h) => [f(h), f(airDensity(h), 3), f((airDensity(h) / 1.225) * 100, 1) + " %"]),
      note: "Wind power is proportional to air density, so output falls by the same percentage. Hot air is also less dense: about 3.5% less at 25 °C than at 15 °C.",
    },
    {
      caption: "Power vs wind speed (cube law), relative to 10 m/s",
      headers: ["Wind speed (m/s)", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
      rows: [["Relative power", ...[4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => f(Math.pow(v / 10, 3) * 100, 0) + " %")]],
      note: "Applies below the turbine's rated wind speed only.",
    },
  ],

  "/calculators/solar-charge-controller-sizing": [
    {
      caption: "MPPT output current per kW of array (before the 1.25 factor)",
      headers: ["Battery voltage", "12 V", "24 V", "48 V"],
      rows: [["Current per kW (A)", ...[12, 24, 48].map((v) => f(1000 / v, 1))]],
    },
  ],

  "/calculators/solar-panel-tilt-angle": [
    {
      caption: "Fixed tilt by latitude (rule of thumb)",
      headers: ["Latitude", "Year-round", "Winter bias", "Summer bias"],
      rows: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((l) => [l + "°", l + "°", Math.min(90, l + 15) + "°", Math.max(0, l - 15) + "°"]),
      note: "A minimum of about 10° is usually kept so rain can clean the modules.",
    },
  ],

  "/calculators/ground-resistance": [
    {
      caption: "Typical soil resistivity by soil type (IEEE 142)",
      headers: ["Soil", "Resistivity (Ω·m)"],
      rows: [
        ["Surface soils, loam", "1 – 50"],
        ["Clay", "2 – 100"],
        ["Shale", "5 – 100"],
        ["Slate", "10 – 100"],
        ["Sandstone", "20 – 2,000"],
        ["Sand and gravel", "50 – 1,000"],
        ["Surface limestone", "100 – 10,000"],
        ["Granite, basalt", "≈ 1,000 and above"],
      ],
      note: "Ranges only. Measure the resistivity on site (Wenner method) before design; it varies with moisture, temperature and depth.",
    },
  ],
};
REFERENCE_TABLES["/calculators/ground-ring-resistance"] = REFERENCE_TABLES["/calculators/ground-resistance"];
