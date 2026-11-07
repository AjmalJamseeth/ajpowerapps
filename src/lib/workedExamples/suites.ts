// Worked examples for the Engineering Suites (full applications).
// Every number was read from the application itself, run with the stated
// inputs (Cable Suite worked example project C01/C04 and Thermal module;
// Protection Suite demo project; DGA Analyzer demonstration fleet; SCL Studio
// sample substation; Sketch Studio demo drawing). The arithmetic steps are
// re-checked in scripts/regression-test.ts ("Engineering Suites worked examples").

import type { WorkedExample } from "./types";

const CABLE = "/calculators/cable-engineering-suite";
const CABLE_NAME = "Cable Engineering Suite (full workbench)";
const PROT = "/calculators/protection-suite";
const PROT_NAME = "Protection Coordination Suite (full workbench)";
const DGA = "/calculators/dga-analyzer";
const DGA_NAME = "DGA Analyzer (Transformer Oil)";
const SCL = "/calculators/iec-61850-scl-editor";
const SCL_NAME = "IEC 61850 SCL Editor (SCL Studio)";
const ESS = "/calculators/engineering-sketch-studio";
const ESS_NAME = "Engineering Sketch Studio (drawing tool)";

export const SUITES_EXAMPLES: WorkedExample[] = [
  // ------------------------------------------------------------------ Cable Suite
  {
    slug: "cable-suite-75-kw-motor-feeder-voltage-drop-earth-fault-loop",
    groupId: "cables",
    calculatorHref: CABLE,
    calculatorName: CABLE_NAME,
    title: "Worked Example: Sizing a 75 kW DOL Motor Cable — Derating, Voltage Drop, Motor Start and Earth-Fault Loop",
    dek: "Circuit C04 of the suite's worked example project. Current capacity alone would allow 70 mm²; cumulative voltage drop and the earth-fault loop push the cable to 95 mm².",
    standard: "IEC 60364-5-52 / IEC 60364-4-41",
    readTime: "10 min read",
    scenario: [
      { label: "Load", value: "Process pump P-101, 75 kW DOL motor, η 0.95, cos φ 0.86, starting current 7 × FLC at cos φ 0.3" },
      { label: "Supply", value: "400 V TN-S, from MCC-01 (Ik3 30 kA, Ik1 min 12 kA); upstream feeder C03 already drops 2.46 %" },
      { label: "Cable", value: "Cu/XLPE/SWA multicore, 150 m, on ladder (method E), 1 tier, 6 circuits touching" },
      { label: "Site", value: "Outdoor, shaded, air 50 °C" },
      { label: "Protection", value: "Motor starter: magnetic-only MCCB + overload relay, let-through I²t 1 × 10⁶ A²s" },
      { label: "Limits", value: "Circuit VD 3 %, total LV VD 5 %, starting VD 15 % (including 3 % bus dip)" },
    ],
    scenarioNote: "Open the Sizing Engine, click Load worked example project and select C04 to follow along.",
    steps: [
      { title: "Design current", equation: "Ib = P / (√3 · U · η · cos φ)", substitution: "Ib = 75 000 / (√3 × 400 × 0.95 × 0.86)", result: "Ib = 132.5 A", note: "With a motor starter the overload relay is set to Ib, so the cable must carry Iz ≥ 132.5 A." },
      { title: "Correction factors", equation: "kT = √((90 − θa) / (90 − 30)); kG from IEC 60364-5-52 Table B.52.20", substitution: "kT = √(40/60) = 0.816; ladder, 1 tier, 6 cables: kG = 0.79", result: "k = 0.816 × 0.79 = 0.645" },
      { title: "Current capacity", body: "IEC 60364-5-52 Table B.52.5, method E, three loaded conductors, Cu/XLPE:", table: { headers: ["Size", "Itab", "Iz = 0.645 × Itab", "≥ 132.5 A?"], rows: [["50 mm²", "192 A", "123.8 A", "No"], ["70 mm²", "246 A", "158.7 A", "Yes"], ["95 mm²", "298 A", "192.2 A", "Yes"]] }, result: "70 mm² would pass on current capacity" },
      { title: "Running voltage drop", equation: "ΔU% = √3 · Ib · L · (R cos φ + X sin φ) / U × 100", substitution: "95 mm² at 90 °C: R = 0.2475 Ω/km, X = 0.082 Ω/km → √3 × 132.5 × 0.150 × (0.2475 × 0.86 + 0.082 × 0.510) / 400", result: "Circuit 2.19 %; total 2.46 + 2.19 = 4.65 % ≤ 5 %", note: "70 mm² gives 2.90 % for the circuit but 5.35 % in total — over the 5 % limit. The upstream drop matters." },
      { title: "Motor starting", equation: "ΔU% = √3 · Ist · L · (R cos φst + X sin φst) / U × 100 + bus dip", substitution: "Ist = 7 × 132.5 = 927.5 A at cos φ 0.3 → 9.19 % + 3 %", result: "12.19 % ≤ 15 %" },
      { title: "Short-circuit withstand", equation: "S ≥ √(I²t) / k", substitution: "√(1 × 10⁶) / 143", result: "S ≥ 7.0 mm² — not limiting" },
      { title: "Earth-fault loop impedance", body: "CPC to IEC 60364-5-54 Table 54.2: S/2 = 47.5 → 50 mm² (R2 = 0.4935 Ω/km at 90 °C). Ze from the bus: cmin·U0/Ik1 min = 0.95 × 230.9 / 12 000 = 0.0183 Ω. The MCCB magnetic pick-up Ia = 12 × 132.5 = 1 590 A.", equation: "Zs = Ze + |(R1 + R2) + j·2X| · L ≤ cmin · U0 / Ia", substitution: "Zs = 0.0183 + |(0.2475 + 0.4935) + j0.164| × 0.150 = 0.0183 + 0.1138", result: "Zs = 0.1321 Ω ≤ Zs,max = 0.95 × 230.9 / 1 590 = 0.1380 Ω", note: "70 mm² gives Zs = 0.172 Ω, which fails. The resistive part alone (0.1294 Ω) matches the hand calculation most designers do; the suite adds the loop reactance, which is safe side." },
    ],
    resultSummary: [
      { check: "Current capacity", requirement: "Iz ≥ 132.5 A", actual: "192.2 A (95 mm²)", pass: true },
      { check: "Total voltage drop", requirement: "≤ 5 %", actual: "4.65 %", pass: true },
      { check: "Motor starting drop", requirement: "≤ 15 %", actual: "12.19 %", pass: true },
      { check: "Short circuit", requirement: "S ≥ 7.0 mm²", actual: "95 mm²", pass: true },
      { check: "Earth-fault loop", requirement: "Zs ≤ 0.1380 Ω", actual: "0.1321 Ω", pass: true },
    ],
    finalAnswer: "4-core 95 mm² Cu/XLPE/SWA (3C + E, 50 mm² CPC). The suite reports the governing criteria as voltage drop and earth-fault loop: 70 mm² carries the current but gives 5.35 % total voltage drop and Zs = 0.172 Ω.",
    keyInsight: "On long motor circuits the cable is rarely sized by current. Always carry the upstream voltage drop into the check, and check the earth-fault loop against the magnetic pick-up of a motor-starter MCCB, which is high.",
    faqs: [
      { q: "Why is Ia 12 × In for this circuit?", a: "A motor-starter MCCB is magnetic-only; its instantaneous pick-up is typically 10–14 × the overload setting. The suite uses 12 × by default — enter the actual setting in the Ia override field." },
      { q: "Where does the upstream 2.46 % come from?", a: "From circuit C03 (main switchboard to MCC-01), which the engine evaluates first because C04 starts at the bus C03 feeds." },
    ],
  },
  {
    slug: "cable-suite-11-kv-transformer-feeder-short-circuit-governs",
    groupId: "cables",
    calculatorHref: CABLE,
    calculatorName: CABLE_NAME,
    title: "Worked Example: 11 kV Transformer Feeder Where the Short-Circuit Rating, Not the Load, Sets the Size",
    dek: "Circuit C01 of the worked example project: a 2 MVA transformer needs 105 A, but 25 kA for 0.47 s needs a 120 mm² conductor. Includes the MV screen check.",
    standard: "IEC 60502-2 / IEC 60949",
    readTime: "8 min read",
    scenario: [
      { label: "Load", value: "11 kV feeder to a 2 000 kVA transformer" },
      { label: "Cable", value: "Single-core Cu/XLPE 6/10 kV, trefoil, buried direct, 180 m, two circuits 0.2 m apart" },
      { label: "Ground", value: "40 °C, soil 2.0 K·m/W, depth 0.8 m" },
      { label: "Fault level", value: "25 kA three-phase; earth fault 1 kA (low-resistance earthed)" },
      { label: "Clearing time", value: "Relay 0.40 s + breaker 0.07 s = 0.47 s" },
      { label: "Screen", value: "25 mm² copper wire screen" },
    ],
    steps: [
      { title: "Design current", equation: "Ib = S / (√3 · U)", substitution: "2 000 / (√3 × 11)", result: "Ib = 105.0 A" },
      { title: "Correction factors (IEC 60502-2 Annex B)", table: { headers: ["Factor", "Basis", "Value"], rows: [["Ground temperature", "40 °C, Table B.11 (√((90−40)/(90−20)))", "0.845"], ["Grouping", "2 trefoil circuits, 0.2 m, Table B.19", "0.83"], ["Soil resistivity", "2.0 K·m/W, Table B.14 (lowest value over sizes)", "0.88"], ["Depth", "0.8 m (reference)", "1.00"]] }, result: "k = 0.845 × 0.83 × 0.88 × 1.00 = 0.617" },
      { title: "Current capacity", body: "Table B.2, Cu single-core trefoil buried: 70 mm² 239 A, 95 mm² 285 A, 120 mm² 323 A.", result: "Even 70 mm²: Iz = 0.617 × 239 = 147.5 A ≥ 105 A" },
      { title: "Short-circuit withstand (adiabatic)", equation: "S ≥ Ik · √t / k, k = 226 · √ln((250 + 234.5)/(90 + 234.5)) = 143.1", substitution: "25 000 × √0.47 / 143.1", result: "S ≥ 119.8 mm² → 120 mm²", note: "95 mm² fails this check only; it is fine for current and voltage drop." },
      { title: "Voltage drop", substitution: "120 mm²: R = 0.196 Ω/km, X = 0.104 Ω/km, 180 m, 105 A, cos φ 0.9", result: "0.066 % — negligible" },
      { title: "Screen short-circuit check", equation: "S_screen ≥ Ik1 · √t / k, k = 128.5 (Cu, 80 → 200 °C)", substitution: "1 000 × √0.47 / 128.5", result: "5.3 mm² required ≤ 25 mm² fitted" },
    ],
    resultSummary: [
      { check: "Current capacity", requirement: "Iz ≥ 105 A", actual: "199.4 A (120 mm²)", pass: true },
      { check: "Conductor short circuit", requirement: "S ≥ 119.8 mm²", actual: "120 mm²", pass: true },
      { check: "Screen short circuit", requirement: "≥ 5.3 mm²", actual: "25 mm²", pass: true },
      { check: "Voltage drop", requirement: "≤ 2 %", actual: "0.07 %", pass: true },
    ],
    finalAnswer: "3 × 1C 120 mm² Cu/XLPE 6/10 kV, 25 mm² copper screen. The suite names short circuit as the governing criterion: 95 mm² carries the load easily but cannot withstand 25 kA for 0.47 s.",
    keyInsight: "On MV feeders close to the source the fault level and the backup clearing time decide the conductor size. Use the actual primary clearing time from the coordination study — the backup time here (0.8 s relay + 0.07 s breaker) would require 163 mm², i.e. 185 mm².",
    faqs: [
      { q: "Why is the soil factor 0.88 and not interpolated by size?", a: "IEC 60502-2 gives soil factors per conductor size. The suite uses the lowest value over all sizes at each resistivity, which is safe side (the spread is under 0.02 at 2.0 K·m/W)." },
      { q: "Which clearing time should be used?", a: "The suite's Design Basis lets you choose primary or backup clearing; the example uses primary (relay + breaker). Many specifications require the backup time for feeders." },
    ],
  },
  {
    slug: "cable-suite-iec-60287-current-rating-three-core-vs-trefoil",
    groupId: "cables",
    calculatorHref: CABLE,
    calculatorName: CABLE_NAME,
    title: "Worked Example: IEC 60287 Current Rating of a Buried MV Cable — Three-Core vs Three Single-Core Cables",
    dek: "The suite's IEC 60287 module with its default inputs: external thermal resistance T4, the rating equation in Ω/m, and how mutual heating changes T4 for a trefoil group.",
    standard: "IEC 60287-1-1 / IEC 60287-2-1",
    readTime: "8 min read",
    scenario: [
      { label: "Conductor", value: "θmax 90 °C, ground 30 °C, Rac = 0.161 Ω/km at 90 °C" },
      { label: "Losses", value: "Sheath loss factor λ1 = 0.10, armour λ2 = 0, dielectric loss neglected" },
      { label: "Thermal resistances", value: "T1 = 0.35, T2 = 0.03, T3 = 0.05 K·m/W (from the data sheet)" },
      { label: "Installation", value: "Buried at L = 1.0 m in soil of 1.2 K·m/W, cable diameter De = 95 mm" },
    ],
    steps: [
      { title: "External thermal resistance, one isolated cable", equation: "T4 = (ρ/2π) · ln(u + √(u² − 1)), u = 2L/De", substitution: "u = 2000/95 = 21.05 → T4 = (1.2/2π) × ln(42.08)", result: "T4 = 0.714 K·m/W" },
      { title: "Continuous rating, three-core cable (n = 3)", equation: "I = √[ Δθ / (R · (T1 + n(1+λ1)T2 + n(1+λ1+λ2)(T3+T4))) ]", substitution: "R = 0.161 × 10⁻³ Ω/m; denominator = 0.35 + 3 × 1.1 × 0.03 + 3 × 1.1 × (0.05 + 0.714) = 2.971 K·m/W → I = √(60 / (0.161 × 10⁻³ × 2.971))", result: "I = 354 A", note: "R must be in Ω/m. Using Ω/km in this formula gives a rating about 32 times too high." },
      { title: "Three single-core cables in trefoil (mutual heating)", body: "For three equally loaded single-core cables touching in trefoil, IEC 60287-2-1 gives T4 for the group, which already includes the heating of each cable by the other two. Use n = 1 for each single-core cable.", equation: "T4 = (1.5/π) · ρ · [ln(2u) − 0.630]", substitution: "(1.5/π) × 1.2 × [ln(42.1) − 0.630]", result: "T4 = 1.782 K·m/W (2.5 × the isolated value)" },
    ],
    resultSummary: [
      { check: "T4, isolated cable", requirement: "IEC 60287-2-1 §2.2.2", actual: "0.714 K·m/W", pass: true },
      { check: "Rating, three-core cable", requirement: "IEC 60287-1-1 eq. (1)", actual: "354 A", pass: true },
      { check: "T4, trefoil group", requirement: "IEC 60287-2-1 §2.2.3", actual: "1.782 K·m/W", pass: true },
    ],
    finalAnswer: "The three-core cable is rated 354 A continuously in these conditions. For single-core cables in trefoil, T4 rises to 1.782 K·m/W because the cables heat each other; select the trefoil formation in the module so the rating includes it.",
    keyInsight: "Ignoring mutual heating is the most common error in hand IEC 60287 calculations for single-core cables: the group's T4 is two to three times that of one isolated cable.",
    faqs: [
      { q: "Where do T1, T2 and T3 come from?", a: "From the cable's dimensions and material resistivities (IEC 60287-2-1 §2.1), or the manufacturer's data sheet. The suite's module takes them as inputs." },
      { q: "What about cables in ducts?", a: "Use module H3 (Current Rating — Trench / Duct Bank), which adds the duct air space T4′ and duct wall T4″ and the mutual heating of several circuits." },
    ],
  },

  // ------------------------------------------------------------------ Protection Suite
  {
    slug: "protection-suite-demo-project-grading-check-and-suggest",
    groupId: "protection",
    calculatorHref: PROT,
    calculatorName: PROT_NAME,
    title: "Worked Example: Fixing Grading Failures in the Demo Project — Why Each Fix Moves the Problem Upstream",
    dek: "Follow the Protection Suite's demo project from load to source: the grading check, the Suggest tool, and why the grid-intertie boundary needs a different fix than a bigger TMS.",
    standard: "IEC 60255-151 / IEEE C37.112",
    readTime: "9 min read",
    scenario: [
      { label: "Project", value: "Demo Project (▶ Demo Project on the start screen), plot reference 0.4 kV" },
      { label: "Devices graded", value: "MCB-45 (32 A type C) → MCCB-12 (LSIG, Ir 320 A) → REL-05 (33 kV feeder, IEC VI, 420 A, TMS 0.30) → REL-04 (33 kV incomer, IEC SI, 625 A, TMS 0.25) → REL-01 (400 kV intertie, IEEE EI, 900 A, TD 0.15)" },
      { label: "Required margin (CTI)", value: "0.3 s, and 0.4 s at the grid intertie boundary" },
    ],
    scenarioNote: "Margins are checked at 2, 3, 5, 8, 12 and 20 times the downstream device's pickup. Hover a cell in the grading table to see the current and both operating times.",
    steps: [
      { title: "Read the grading check as loaded", table: { headers: ["Pair (upstream / downstream)", "×2", "×3", "×5", "×8", "×12", "×20", "Result"], rows: [["MCCB-12 / MCB-45", "25.84", "28.18", "28.93", "14.21", "6.31", "2.27", "PASS"], ["REL-05 / MCCB-12", "19.16", "−0.59", "−0.03", "0.88", "0.62", "0.35", "FAIL ×3, ×5"], ["REL-04 / REL-05", "4.77", "0.49", "0.41", "0.45", "0.45", "0.44", "PASS"], ["REL-01 / REL-04", "3.62", "−0.20", "−0.66", "−0.67", "−0.61", "−0.53", "FAIL ×3…×20"]] }, note: "Margins in seconds. Differential REL-02 (87T) is unit protection and is not time-graded." },
      { title: "Fix the lowest failing pair first", body: "💡 Suggest on REL-05 / MCCB-12 proposes the smallest TMS that gives 0.3 s at every multiple.", result: "REL-05 TMS 0.300 → 0.355; the pair now passes (0.36 s at ×3, 0.34 s at ×5)" },
      { title: "Re-check the pair above", body: "REL-05 is now slower, so the incomer above it has less margin.", result: "REL-04 / REL-05 now FAILS at ×3 and ×5 (0.09 s and 0.21 s)" },
      { title: "Fix the incomer", body: "💡 Suggest on REL-04 / REL-05:", result: "REL-04 TMS 0.250 → 0.272; margins 0.33 / 0.34 / 0.43 / 0.46 / 0.46 s — PASS" },
      { title: "The grid boundary needs judgement, not a bigger TMS", body: "Suggest on REL-01 / REL-04 proposes TD 0.15 → 3.675 (24.5 ×). It would pass, but the margin would become 151.6 s at ×2 and 33.7 s at ×3 — REL-01 would take minutes to clear a fault just above the incomer's pickup. An extremely inverse curve cannot be made to track a standard inverse curve by time dial alone.", result: "Instead, agree the boundary with the grid operator: a definite-time or standard-inverse element on REL-01, a higher pickup, or faster incomer settings." },
    ],
    resultSummary: [
      { check: "MCCB-12 over MCB-45", requirement: "≥ 0.3 s", actual: "Passes at all multiples", pass: true },
      { check: "REL-05 over MCCB-12", requirement: "≥ 0.3 s", actual: "After TMS 0.355: ≥ 0.34 s", pass: true },
      { check: "REL-04 over REL-05", requirement: "≥ 0.3 s", actual: "After TMS 0.272: ≥ 0.33 s", pass: true },
      { check: "REL-01 over REL-04", requirement: "≥ 0.4 s", actual: "Needs a curve/pickup change agreed with the grid operator", pass: false },
    ],
    finalAnswer: "Working from the load end, REL-05 TMS 0.355 and REL-04 TMS 0.272 give at least 0.3 s at every checked multiple. The grid-intertie pair cannot be solved sensibly by time dial; it needs a change of curve type or pickup agreed at the boundary.",
    keyInsight: "Grading is a chain: every TMS increase restores one margin and takes it from the next device up. Accept a suggestion only after checking the pair above it and the resulting clearing time at the source.",
    faqs: [
      { q: "Does Suggest change the pickup or curve?", a: "No. It only changes the TMS (or time dial) of the upstream device, keeping its curve family and pickup. Re-run it if you change either device afterwards." },
      { q: "Why are the margins shown at multiples of the downstream pickup?", a: "Inverse curves of different shapes converge or cross, so a single fault level can hide a failure. The suite also checks the exact maximum fault level when you enter it for the pair." },
    ],
  },

  // ------------------------------------------------------------------ DGA Analyzer
  {
    slug: "dga-analyzer-low-energy-discharge-d1-iec-60599-duval",
    groupId: "transformers",
    calculatorHref: DGA,
    calculatorName: DGA_NAME,
    title: "Worked Example: Diagnosing a Low-Energy Discharge (D1) from a DGA Sample — IEC 60599 Ratios and Duval Triangle 1",
    dek: "Transformer TX-204 in the analyzer's demonstration fleet: acetylene has more than doubled in six months. Ratios, Duval coordinates, IEEE C57.104 status and what to do next.",
    standard: "IEC 60599:2022 / IEEE C57.104-2019",
    readTime: "8 min read",
    scenario: [
      { label: "Transformer", value: "TX-204, 220/132 kV, 160 MVA, OFAF, sealed, mineral oil, built 2014" },
      { label: "Latest sample (ppm)", value: "H2 210, CH4 70, C2H6 18, C2H4 55, C2H2 140, CO 360, CO2 2 800" },
      { label: "Trend", value: "TDCG 424 → 607 → 853 ppm over two years; C2H2 rising 0.40 ppm/day" },
    ],
    scenarioNote: "Open the DGA Analyzer and click TX-204 in the fleet to follow along.",
    steps: [
      { title: "IEC 60599 gas ratios", table: { headers: ["Ratio", "Value", "D1 range (Table 1)"], rows: [["C2H2/C2H4", "140/55 = 2.55", "> 1"], ["CH4/H2", "70/210 = 0.33", "0.1 – 0.5"], ["C2H4/C2H6", "55/18 = 3.06", "> 1"]] }, result: "All three ratios fall in the D1 row: discharges of low energy" },
      { title: "Duval Triangle 1", equation: "%gas = gas / (CH4 + C2H4 + C2H2) × 100", substitution: "Sum = 70 + 55 + 140 = 265 ppm → CH4 26 %, C2H4 21 %, C2H2 53 %", result: "Zone D1 (C2H4 < 23 %, C2H2 > 13 %)" },
      { title: "Other methods", body: "Rogers ratios and Duval Pentagon 1 point to D2 (high-energy arcing); Pentagon 2 to D1. The analyzer weighs the methods and reports D1 with 42 % confidence, D2 29 % as the next candidate.", result: "Electrical discharge in oil; arcing cannot be ruled out" },
      { title: "Is it serious? IEEE C57.104-2019", body: "Acetylene is at more than 5 × the Table 2 limit and H2, C2H4 and C2H2 all show significant increases between samples.", result: "DGA Status 3 — Extreme; a C2H2 gassing event is open" },
      { title: "Paper involvement", equation: "CO2/CO", substitution: "2 800 / 360", result: "7.8 — inside the normal 3–10 band: no evidence that paper is involved" },
    ],
    resultSummary: [
      { check: "IEC 60599 fault type", requirement: "Table 1", actual: "D1 — low-energy discharge", pass: false },
      { check: "Duval Triangle 1", requirement: "Zone", actual: "D1", pass: false },
      { check: "IEEE C57.104 status", requirement: "Status 1 = normal", actual: "Status 3 — Extreme", pass: false },
      { check: "Paper involvement (CO2/CO)", requirement: "3 – 10", actual: "7.8", pass: true },
    ],
    finalAnswer: "TX-204 shows a low-energy discharge (D1) — sparking or tracking — with acetylene rising quickly enough for IEEE Status 3. Re-sample within days to confirm, then shorten the sampling interval and plan an internal inspection; check tap-changer leakage if the unit has a communicating OLTC.",
    keyInsight: "Methods disagree near the D1/D2 boundary. The rate of increase of acetylene, not the exact zone, decides how urgent the response is.",
    faqs: [
      { q: "Why do Rogers and Pentagon 1 say D2?", a: "D1 and D2 sit next to each other on every method. A sample near the boundary can fall on either side; the analyzer shows all methods so you can see the spread." },
      { q: "Could this be from the tap changer?", a: "Yes, if the OLTC compartment leaks into the main tank. IEC 60599 §5.7 flags C2H2/H2 above about 2–3; here it is 0.67, which does not indicate contamination." },
    ],
  },
  {
    slug: "dga-analyzer-thermal-fault-t3-oltc-contamination-check",
    groupId: "transformers",
    calculatorHref: DGA,
    calculatorName: DGA_NAME,
    title: "Worked Example: Thermal Fault or Tap-Changer Leak? Reading a Mixed DGA Result (T3 / DT)",
    dek: "Transformer TX-101 in the demonstration fleet: ethylene and acetylene both high. How the analyzer separates a hot spot from tap-changer contamination, and why the methods disagree.",
    standard: "IEC 60599:2022 / IEEE C57.104-2019",
    readTime: "9 min read",
    scenario: [
      { label: "Transformer", value: "TX-101, 132/33 kV, 40 MVA, ONAF, conservator, communicating on-load tap changer, built 2009" },
      { label: "Latest sample (ppm)", value: "H2 50, CH4 150, C2H6 50, C2H4 270, C2H2 120, CO 380, CO2 3 200" },
      { label: "Trend", value: "TDCG 349 → 433 → 593 → 1 020 ppm; four gassing events open" },
    ],
    steps: [
      { title: "IEC 60599 ratios", table: { headers: ["Ratio", "Value"], rows: [["C2H2/C2H4", "120/270 = 0.44"], ["CH4/H2", "150/50 = 3.0"], ["C2H4/C2H6", "270/50 = 5.4"]] }, result: "No Table 1 row matches (C2H2/C2H4 too high for T3): a mixed or boundary case" },
      { title: "Duval Triangle 1 and Pentagon 1", substitution: "Sum = 150 + 270 + 120 = 540 → CH4 28 %, C2H4 50 %, C2H2 22 %", result: "Triangle 1: DT (thermal + electrical); Pentagon 1: T3" },
      { title: "Tap-changer contamination check", equation: "C2H2 / H2 (IEC 60599 §5.7)", substitution: "120 / 50", result: "2.4 > 2 on a unit with a communicating OLTC — probable OLTC contamination", note: "Arcing in the diverter switch produces acetylene with little hydrogen. Oil leaking into the main tank adds acetylene that has nothing to do with the main tank's condition." },
      { title: "Weigh the evidence", body: "Ethylene (270 ppm) and C2H4/C2H6 = 5.4 point to a hot spot above 700 °C in the main tank; the acetylene may come partly from the OLTC. The analyzer reports T3 (38 %), DT (26 %), C (17 %), D2 (16 %) and IEEE Status 3.", result: "Most probable: thermal fault > 700 °C, with the acetylene to be explained" },
      { title: "Paper", equation: "CO2/CO", substitution: "3 200 / 380", result: "8.4 — normal band" },
    ],
    resultSummary: [
      { check: "IEC 60599 Table 1", requirement: "Match a fault row", actual: "No match (mixed)", pass: false },
      { check: "Duval Pentagon 1", requirement: "Zone", actual: "T3", pass: false },
      { check: "OLTC contamination (C2H2/H2)", requirement: "< 2", actual: "2.4", pass: false },
      { check: "IEEE C57.104 status", requirement: "Status 1", actual: "Status 3 — Extreme", pass: false },
    ],
    finalAnswer: "TX-101 most likely has a severe hot spot (T3) — a bad joint, core fault or blocked oil duct — but the acetylene may be OLTC leakage. Sample the main tank, the OLTC compartment and the conservators together, subtract the OLTC background, then reduce load and carry out thermography and winding-resistance tests.",
    keyInsight: "When methods disagree, check for contamination before diagnosing. On units with a communicating OLTC, C2H2/H2 above 2 in the main tank is a strong sign that some of the gas is not from the main tank.",
    faqs: [
      { q: "Why does Triangle 1 say DT but Pentagon 1 say T3?", a: "The pentagon uses five gases including H2 and C2H6, so it separates thermal faults better; the triangle uses only CH4, C2H4 and C2H2 and is pulled towards D by the acetylene." },
      { q: "What is TX-101-LTC in the fleet?", a: "The tap changer of TX-101, entered as its own asset. Comparing its DGA with the main tank is how OLTC contamination is confirmed." },
    ],
  },

  // ------------------------------------------------------------------ SCL Studio
  {
    slug: "scl-studio-sample-substation-data-flow-and-fat-test-sheets",
    groupId: "iec-61850",
    calculatorHref: SCL,
    calculatorName: SCL_NAME,
    title: "Worked Example: Reviewing an SCD File and Producing FAT Test Sheets — the Sample Substation",
    dek: "Open SCL Studio's sample 132/33 kV substation, trace every GOOSE and report from publisher to subscriber, and generate the point-to-point test sheet for the SCADA signals.",
    standard: "IEC 61850-6 / 61850-8-1",
    readTime: "7 min read",
    scenario: [
      { label: "File", value: "S13_Sample.scd (click Sample in SCL Studio), SCL 2007 B4, Edition 2.1" },
      { label: "IEDs", value: "P132_Q01 line distance protection, P87T_T1 transformer differential, GW1 station gateway" },
      { label: "Network", value: "StationBus, 8-MMS, 100 Mb/s, IP 10.13.1.11 / .21 / .200" },
    ],
    steps: [
      { title: "Overview and validation", body: "The overview counts the model and runs the semantic checks.", table: { headers: ["Item", "Count"], rows: [["IEDs", "3"], ["Logical devices", "4"], ["Logical nodes", "14"], ["Data sets", "4"], ["GOOSE control blocks", "2"], ["Report control blocks", "2"], ["ExtRef inputs", "2"]] }, result: "0 errors, 0 warnings" },
      { title: "Trace the GOOSE messages", table: { headers: ["Publisher / control block", "Data set", "MAC / APPID", "Subscriber"], rows: [["P132_Q01 PROT/LLN0.GCB_TRIP", "DS_TRIP (3 members)", "01-0C-CD-01-00-11 / 0011, VLAN 00A", "P87T_T1"], ["P87T_T1 PROT/LLN0.GCB_DIFF", "DS_DIFF (2 members)", "01-0C-CD-01-00-21 / 0021, VLAN 00A", "P132_Q01"]] }, result: "Both GOOSE streams have unique addresses and a resolved subscriber" },
      { title: "Trace the reports to SCADA", table: { headers: ["Report control block", "Data set", "Settings", "Client"], rows: [["URCB urcbMeas (unbuffered)", "DS_MEAS (3)", "max 4 instances, integrity period 5 000 ms", "GW1"], ["BRCB brcbEvents (buffered)", "DS_EVT (2)", "max 2 instances", "GW1"]] } },
      { title: "Generate the FAT test sheet", body: "Test sheets ▸ All IEDs ▸ Sent to SCADA (reports) ▸ FAT:", table: { headers: ["No.", "Signal", "CDC", "Check"], rows: [["1", "P132_Q01 PROT/MMXU1.TotW", "MV", "Inject a known value and one change beyond the dead band"], ["2", "PROT/MMXU1.Hz", "MV", "As above"], ["3", "PROT/MMXU1.A.phsA", "CMV", "As above"], ["4", "PROT/PTRC1.Str", "ACD", "Activate and reset; check state, quality and time stamp"], ["5", "CTRL/XCBR1.Pos", "DPC", "Operate open and close; check state, quality and time stamp"]] }, result: "5 signals, printable or exported to Excel for the FAT record" },
    ],
    resultSummary: [
      { check: "Semantic validation", requirement: "No errors", actual: "0 errors, 0 warnings", pass: true },
      { check: "GOOSE addresses unique", requirement: "MAC and APPID unique on the subnetwork", actual: "0011 and 0021", pass: true },
      { check: "Every report has a client", requirement: "ClientLN present", actual: "GW1 for both", pass: true },
      { check: "FAT sheet", requirement: "One line per SCADA signal", actual: "5 signals", pass: true },
    ],
    finalAnswer: "The sample SCD is clean: two GOOSE streams with unique addresses and resolved subscribers, two reports to the gateway, and a five-line FAT sheet generated directly from the data sets.",
    keyInsight: "Generating test sheets from the SCD means the test covers exactly what is configured — no signal is missed, and none is tested that does not exist.",
    faqs: [
      { q: "Can I test GOOSE signals with the same tool?", a: "Yes. Choose GOOSE and SV in Test sheets to list every subscribed signal, and use GOOSE capture to check a Wireshark capture against the SCD." },
      { q: "What does integrity period 5 000 ms mean?", a: "The unbuffered report sends all data-set values every 5 s even if nothing changes, so the gateway always has a recent value." },
    ],
  },

  // ------------------------------------------------------------------ Sketch Studio
  {
    slug: "sketch-studio-transformer-feeder-single-line-diagram-bom",
    groupId: "instrumentation",
    calculatorHref: ESS,
    calculatorName: ESS_NAME,
    title: "Worked Example: Drawing a Transformer Feeder Single-Line Diagram and Generating the Bill of Materials",
    dek: "Rebuild the Sketch Studio demo drawing step by step — busbars, breakers, CT, transformer and a 50/51 relay — then tag it and produce the BOM and protection list from the drawing.",
    standard: "IEC 60617 / IEEE 315 style, ANSI C37.2",
    readTime: "6 min read",
    scenario: [
      { label: "Drawing", value: "Transformer feeder: BUS A → CB-1 → CT-1 → T1 (Dyn11) → CB-2 → BUS B, with relay R1 (50/51) on CT-1" },
      { label: "Title block", value: "Drawing no. ESS-P0-001, status Conceptual, not to scale" },
    ],
    scenarioNote: "Click New to start an empty sheet, or Load demo to see the finished drawing.",
    steps: [
      { title: "Place the busbars and breakers", body: "Search the library for 'bus' and place two Bus-bar symbols (ES-017), one at the top and one at the bottom of the sheet. Place two Circuit breaker symbols (ES-001) below BUS A and above BUS B." },
      { title: "Add the CT, transformer and relay", body: "Place a Current transformer (ET-010) under CB-1 and a Two-winding transformer (ET-001) below it. Set the transformer's Vector group property to Dyn11. Place a Protection relay (EP-025) beside the CT and set its ANSI number to 50/51." },
      { title: "Wire it", body: "Choose Wire and click terminal to terminal down the feeder; wires snap to the symbol terminals on the 2.5 mm grid. Connect the relay to the CT secondary." },
      { title: "Tag and check", body: "Auto-tag numbers the devices by type; the demo uses BUS A, BUS B, CB-1, CB-2, CT-1, T1 and R1. Check tags confirms there are no duplicates or missing tags." },
      { title: "Generate the schedules", body: "Reports ▸ Bill of materials counts every symbol by type:", table: { headers: ["Item", "Symbol", "Code", "Qty", "Tags"], rows: [["1", "Bus-bar", "ES-017", "2", "BUS A, BUS B"], ["2", "Circuit breaker", "ES-001", "2", "CB-1, CB-2"], ["3", "Protection relay", "EP-025", "1", "R1"], ["4", "Current transformer", "ET-010", "1", "CT-1"], ["5", "Two-winding transformer", "ET-001", "1", "T1"]] }, result: "Reports ▸ Protection functions lists R1: ANSI 50/51, IEC 60255 marks I>, I>>, IEC 61850 logical nodes PTOC + PIOC" },
      { title: "Fill the title block and export", body: "Title block… sets the drawing number, title and revision. Export ▸ PDF for the issue copy, DXF to continue in CAD, or PNG 300 DPI for a report." },
    ],
    resultSummary: [
      { check: "Bill of materials", requirement: "Every symbol counted", actual: "5 lines, 7 items", pass: true },
      { check: "Tags", requirement: "Unique and complete", actual: "BUS A/B, CB-1/2, CT-1, T1, R1", pass: true },
      { check: "Protection list", requirement: "Relay functions documented", actual: "R1: 50/51 (PTOC + PIOC)", pass: true },
    ],
    finalAnswer: "A complete transformer feeder SLD with seven tagged items, a five-line bill of materials and a protection-function list, all generated from the drawing and exportable to PDF, DXF or PNG.",
    keyInsight: "Because each symbol carries its tag and properties, the schedules update when the drawing changes — there is no separate list to keep in step.",
    faqs: [
      { q: "Can I add manufacturer and part numbers to the BOM?", a: "Yes. Reports ▸ Parts database maps symbol types to manufacturer, part number and description; the BOM then fills those columns." },
      { q: "Can the drawing go into AutoCAD?", a: "Yes, Export ▸ DXF writes lines, circles, polylines, text and layers for the sheet or all sheets." },
    ],
  },
];
