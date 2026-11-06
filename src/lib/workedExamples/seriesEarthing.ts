// Earthing learning series (5 examples). Numbers come from the earthing engine
// (src/lib/earthing.ts: IEEE 80 grid equations, BS 7430:2011+A1 electrode and
// conductor formulas, IEEE 142 ring) and are pinned in
// scripts/regression-test.ts ("Learning series — earthing").

import type { WorkedExample } from "./types";

const EARTH = "/calculators/earthing";
const EARTH_NAME = "Earthing Grid Design (IEEE 80)";
const GRID_SCENARIO = [
  { label: "Soil", value: "Uniform, ρ = 200 Ω·m" },
  { label: "Grid", value: "50 m × 40 m, buried 0.6 m, conductor diameter 12.6 mm, 20 rods of 3 m" },
  { label: "Fault", value: "Earth fault 5 kA, split factor Sf = 0.6, Df = 1 → grid current IG = 3 kA" },
  { label: "Clearing time", value: "0.5 s, 70 kg body weight" },
];

export const SERIES_EARTHING_EXAMPLES: WorkedExample[] = [
  {
    slug: "soil-resistivity-wenner-test-interpretation",
    groupId: "earthing",
    calculatorHref: EARTH,
    calculatorName: EARTH_NAME,
    title: "Soil Resistivity From a Wenner Test: Turning Readings Into a Design Value",
    dek: "Part 1 of the earthing series. Five Wenner readings at increasing spacings, converted to apparent resistivity — and what the trend says about the soil layers.",
    standard: "IEEE 81 / BS 7430",
    readTime: "7 min read",
    scenario: [
      { label: "Test", value: "Wenner four-pin method, equal spacing a, probes driven to a small depth compared with a" },
      { label: "Readings", value: "a = 1, 2, 4, 8, 16 m;  R = 15.0, 6.9, 2.9, 1.2, 0.55 Ω" },
    ],
    steps: [
      { title: "Apparent resistivity", equation: "ρa = 2π × a × R", body: "Valid when the probe depth is small compared with the spacing." },
      {
        title: "Work through each spacing",
        table: {
          headers: ["Spacing a (m)", "R (Ω)", "ρa = 2πaR (Ω·m)"],
          rows: [["1", "15.0", "94.2"], ["2", "6.9", "86.7"], ["4", "2.9", "72.9"], ["8", "1.2", "60.3"], ["16", "0.55", "55.3"]],
        },
      },
      {
        title: "Read the trend",
        body: "Resistivity falls as spacing rises, and the spacing roughly indicates the depth being sampled. The soil is therefore more conductive at depth: a drier top layer of about 95 Ω·m over a wetter lower layer of about 55 Ω·m.",
      },
      {
        title: "Choose a design value",
        body: "For a grid about 40 m across, the spacings comparable to the grid size (8–16 m) matter most for grid resistance, while the top layer governs touch voltage near the surface. A single uniform value of about 95 Ω·m (the top layer) is conservative for touch and step voltages; a two-layer model gives a more economical design.",
      },
    ],
    resultSummary: [
      { check: "Apparent resistivity at 1 m", requirement: "—", actual: "94.2 Ω·m", pass: true },
      { check: "Apparent resistivity at 16 m", requirement: "—", actual: "55.3 Ω·m", pass: true },
    ],
    finalAnswer: "The readings give 94 Ω·m near the surface falling to 55 Ω·m at depth. Use about 95 Ω·m as a conservative uniform value, or model the soil as two layers when the design margin is tight.",
    keyInsight: "Never design from a single reading. Measure along at least two directions and several spacings; the trend with spacing is as important as the values.",
    faqs: [
      { q: "When should the test be done?", a: "Ideally in dry conditions, which give the highest (worst-case) resistivity, and away from buried metal pipes or cables that distort the readings." },
      { q: "What if resistivity rises with depth?", a: "Then deep rods help less and a larger horizontal grid is usually more effective." },
    ],
  },

  {
    slug: "earth-rod-vs-ring-vs-earth-mat-resistance-comparison",
    groupId: "earthing",
    calculatorHref: EARTH,
    calculatorName: EARTH_NAME,
    title: "Earth Rod vs Ring vs Earth Mat: Which Gives the Lowest Resistance in 100 Ω·m Soil?",
    dek: "Part 2 of the earthing series. One rod gives 33.5 Ω, four rods 9.1 Ω, a 10 m ring 6.3 Ω and a 20 m × 20 m mat 2.7 Ω. Why size beats everything else.",
    standard: "BS 7430 / IEEE 142 / IEEE 80",
    readTime: "8 min read",
    scenario: [{ label: "Soil", value: "Uniform, ρ = 100 Ω·m" }, { label: "Burial depth", value: "0.6 m for horizontal conductors" }],
    steps: [
      { title: "Single rod, 3 m × 16 mm (BS 7430 9.5.3)", equation: "R = ρ/(2πL) × [ln(8L/d) − 1]", substitution: "R = 100/(2π × 3) × [ln(8 × 3/0.016) − 1]", result: "R = 33.5 Ω" },
      {
        title: "Four rods in a line, 3 m apart",
        body: "Rods closer together than about twice their length share the same soil, so the resistance does not fall in proportion to the number of rods.",
        result: "R = 9.14 Ω (not 33.5/4 = 8.4 Ω); at 6 m spacing 8.37 Ω",
      },
      { title: "Ring, 10 m diameter, 10 mm conductor (IEEE 142)", equation: "R = ρ/(2π²D) × [ln(8D/d) + ln(4D/s)],  s = 2h", substitution: "R = 100/(2π² × 10) × [ln(8000) + ln(33.3)]", result: "R = 6.33 Ω" },
      { title: "Earth mat 20 m × 20 m, 4 × 4 conductors (IEEE 80 Sverak)", equation: "Rg = ρ × [1/LT + 1/√(20A) × (1 + 1/(1 + h√(20/A)))]", substitution: "LT = 160 m, A = 400 m², h = 0.6 m", result: "Rg = 2.73 Ω (adding 8 rods of 3 m: 2.65 Ω)" },
    ],
    resultSummary: [
      { check: "Single rod", requirement: "—", actual: "33.5 Ω", pass: true },
      { check: "Four rods", requirement: "—", actual: "9.14 Ω", pass: true },
      { check: "10 m ring", requirement: "—", actual: "6.33 Ω", pass: true },
      { check: "20 m × 20 m mat", requirement: "—", actual: "2.73 Ω", pass: true },
    ],
    finalAnswer: "In 100 Ω·m soil the earth mat gives 2.7 Ω, the ring 6.3 Ω, four rods 9.1 Ω and a single rod 33.5 Ω. The area covered is what lowers resistance most.",
    keyInsight: "Resistance of a grid is roughly ρ/(4r) for an equivalent disc of radius r. Doubling the area lowers resistance by about 30 %; doubling conductor size barely changes it.",
    faqs: [
      { q: "Why add rods to a mat if they change resistance so little?", a: "Rods reach deeper, often wetter soil that stays stable through the seasons, and rods at the perimeter reduce step and touch voltages at the grid edge." },
      { q: "Is low resistance enough for a substation?", a: "No. Touch and step voltages must also be checked — see Part 3." },
    ],
  },

  {
    slug: "substation-earthing-grid-touch-step-voltage-mesh-spacing",
    groupId: "earthing",
    calculatorHref: EARTH,
    calculatorName: EARTH_NAME,
    title: "Substation Earthing Grid: Getting Touch Voltage Within IEEE 80 Limits by Closing the Mesh",
    dek: "Part 3 of the earthing series. A 50 m × 40 m grid with 10 m meshes gives a touch voltage of 1,365 V against a 932 V limit. Halving the mesh spacing brings it to 822 V.",
    standard: "IEEE 80-2013",
    readTime: "11 min read",
    scenario: [...GRID_SCENARIO, { label: "Surface", value: "100 mm crushed rock, 3,000 Ω·m (wet)" }],
    steps: [
      { title: "Tolerable touch voltage", equation: "Cs = 1 − 0.09(1 − ρ/ρs)/(2hs + 0.09);  E touch = (1000 + 1.5 Cs ρs) × 0.157/√ts", substitution: "Cs = 1 − 0.09 × (1 − 200/3000)/0.29 = 0.710;  E touch = (1000 + 1.5 × 0.710 × 3000) × 0.157/√0.5", result: "E touch = 932 V" },
      { title: "Grid resistance and GPR (10 m mesh: 6 × 5 conductors)", substitution: "LT = 490 m + 60 m of rods;  Rg = 2.31 Ω;  GPR = 3,000 × 2.31", result: "GPR = 6,921 V — far above the tolerable touch voltage, so the mesh voltage must be checked" },
      { title: "Mesh voltage, 10 m spacing", equation: "Em = ρ × IG × Km × Ki / LM", substitution: "n = 5.46, Km = 0.918, Ki = 1.452, LM = 586 m;  Em = 200 × 3000 × 0.918 × 1.452 / 586", result: "Em = 1,365 V > 932 V — fails" },
      { title: "Mesh voltage, 5 m spacing (11 × 9 conductors)", substitution: "n = 9.92, Km = 0.640, Ki = 2.112, LM = 986 m;  Em = 200 × 3000 × 0.640 × 2.112 / 986", result: "Em = 822 V < 932 V — passes" },
      { title: "Step voltage", result: "Es = 680 V against a tolerable 3,061 V — passes in both layouts" },
    ],
    resultSummary: [
      { check: "Touch, 10 m mesh", requirement: "Em ≤ 932 V", actual: "1,365 V", pass: false },
      { check: "Touch, 5 m mesh", requirement: "Em ≤ 932 V", actual: "822 V", pass: true },
      { check: "Step, 5 m mesh", requirement: "Es ≤ 3,061 V", actual: "680 V", pass: true },
    ],
    finalAnswer: "With 10 m meshes the touch voltage is 1,365 V and fails; with 5 m meshes it falls to 822 V, within the 932 V limit. The grid resistance hardly changes (2.31 → 2.15 Ω) — the improvement comes from the closer mesh.",
    keyInsight: "Touch voltage is controlled by conductor spacing, not by grid resistance. A grid can have a low resistance and still be unsafe.",
    faqs: [
      { q: "Where is the touch voltage worst?", a: "In the corner meshes of the grid. That is why IEEE 80's Em is the mesh voltage at the centre of a corner mesh, and why extra rods and closer spacing at the perimeter help." },
      { q: "What if the GPR is below the tolerable touch voltage?", a: "Then no person can be exposed to more than the GPR and the design is safe for touch and step without further checks (transferred voltages still need attention)." },
    ],
  },

  {
    slug: "crushed-rock-surface-layer-tolerable-touch-step-voltage",
    groupId: "earthing",
    calculatorHref: EARTH,
    calculatorName: EARTH_NAME,
    title: "Why Substations Use Crushed Rock: Tolerable Touch Voltage With and Without a Surface Layer",
    dek: "Part 4 of the earthing series. The same grid fails without crushed rock (limit 289 V) and passes with 100 mm of it (limit 932 V). How the surface layer factor Cs works.",
    standard: "IEEE 80-2013",
    readTime: "7 min read",
    scenario: [...GRID_SCENARIO, { label: "Layout", value: "5 m mesh (11 × 9 conductors) from Part 3 — mesh voltage Em = 822 V, step Es = 680 V" }],
    steps: [
      { title: "Without a surface layer", body: "The person stands on native soil, ρs = ρ = 200 Ω·m, so Cs = 1.", equation: "E touch = (1000 + 1.5 ρ) × 0.157/√0.5", substitution: "E touch = (1000 + 300) × 0.222", result: "E touch = 289 V;  E step = 489 V" },
      { title: "With 100 mm of wet crushed rock (3,000 Ω·m)", equation: "Cs = 1 − 0.09(1 − ρ/ρs)/(2hs + 0.09)", substitution: "Cs = 1 − 0.09 × 0.933/0.29 = 0.710", result: "E touch = 932 V;  E step = 3,061 V" },
      {
        title: "Compare with the grid",
        table: { headers: ["Case", "Em (V)", "Touch limit (V)", "Es (V)", "Step limit (V)"], rows: [["No surface layer", "822", "289", "680", "489"], ["100 mm crushed rock", "822", "932", "680", "3,061"]] },
      },
    ],
    resultSummary: [
      { check: "Touch, no surface layer", requirement: "≤ 289 V", actual: "822 V", pass: false },
      { check: "Step, no surface layer", requirement: "≤ 489 V", actual: "680 V", pass: false },
      { check: "Touch, crushed rock", requirement: "≤ 932 V", actual: "822 V", pass: true },
      { check: "Step, crushed rock", requirement: "≤ 3,061 V", actual: "680 V", pass: true },
    ],
    finalAnswer: "Without a surface layer the grid fails both touch and step limits. A 100 mm layer of crushed rock raises the touch limit from 289 V to 932 V, so the same grid becomes safe.",
    keyInsight: "Crushed rock does not change the voltages the grid produces — it adds resistance under the person's feet, so they can tolerate much more. It must be kept clean; soil or sand mixed in lowers its resistivity.",
    faqs: [
      { q: "What resistivity should I assume for crushed rock?", a: "Use the wet value. IEEE 80 lists typical values from about 1,000 to over 10,000 Ω·m depending on the stone; 3,000 Ω·m is a common design value." },
      { q: "Does asphalt work the same way?", a: "Yes. Asphalt has a very high resistivity and is often used for roads inside substations." },
    ],
  },

  {
    slug: "earthing-conductor-size-fault-current-bs-7430",
    groupId: "earthing",
    calculatorHref: EARTH,
    calculatorName: EARTH_NAME,
    title: "Earthing Conductor Size for a 25 kA Fault: Bolted vs Welded Joints (BS 7430)",
    dek: "Part 5 of the earthing series. The joint type sets the maximum temperature, and the maximum temperature sets the conductor size: 142 mm² with bolted joints, 113 mm² with welded joints.",
    standard: "BS 7430:2011+A1 9.7",
    readTime: "7 min read",
    scenario: [
      { label: "Fault current", value: "25 kA, through the earthing conductor" },
      { label: "Duration", value: "1 s (back-up protection clearing time)" },
      { label: "Material", value: "Bare copper, initial temperature 30 °C" },
    ],
    steps: [
      { title: "Current density for the final temperature", equation: "k = K × √ln((Tm + β)/(Ti + β)),  copper K = 226, β = 234.5", substitution: "Bolted joints, Tm = 250 °C: k = 226 × √ln(484.5/264.5);  welded, Tm = 450 °C: k = 226 × √ln(684.5/264.5)", result: "k = 176 A/mm² (bolted);  k = 220 A/mm² (welded) — matching BS 7430 Table 4" },
      { title: "Minimum cross-section", equation: "S = I × √t / k", substitution: "Bolted: 25,000 × 1 / 176;  welded: 25,000 × 1 / 220", result: "S = 142 mm² (bolted) → 150 mm²;  S = 113 mm² (welded) → 120 mm²" },
      { title: "Galvanised steel for comparison", body: "Steel: K = 78, β = 202; the zinc coating limits the temperature.", result: "k = 64 A/mm² at 250 °C → S = 392 mm²" },
      { title: "Which duration?", body: "Use the back-up protection clearing time, not the primary relay time, because the conductor must survive if the main protection fails. A 0.5 s duration would reduce the bolted-joint size to 101 mm²." },
    ],
    resultSummary: [
      { check: "Bolted joints (250 °C)", requirement: "S ≥ 142 mm²", actual: "150 mm² selected", pass: true },
      { check: "Welded joints (450 °C)", requirement: "S ≥ 113 mm²", actual: "120 mm² selected", pass: true },
    ],
    finalAnswer: "For 25 kA for 1 s, a bare copper earthing conductor needs 142 mm² with bolted joints (use 150 mm²) or 113 mm² with welded joints (use 120 mm²).",
    keyInsight: "The weakest point is the joint, not the conductor. Sizing with a high k (welded) while installing bolted clamps under-sizes the conductor by about 25 %.",
    faqs: [
      { q: "Should the full fault current or the grid current IG be used?", a: "The full fault current that can flow in the conductor. IG is only the part that flows into the soil and is used for GPR and touch voltages." },
      { q: "Is mechanical strength also a limit?", a: "Yes. BS 7430 gives minimum sizes for buried conductors regardless of fault current, for example 25 mm² copper without corrosion protection." },
    ],
  },
];
