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
const NS = "/calculators/scl-netstudio";
const NS_NAME = "SCL NetStudio (IEC 61850 network design)";

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
  // ------------------------------------------------------------------ SCL NetStudio
  {
    slug: "iec-61850-process-bus-bandwidth-sampled-values-vlan-filtering",
    groupId: "iec-61850",
    calculatorHref: NS,
    calculatorName: NS_NAME,
    title: "Worked Example: Process Bus Bandwidth — Sampled Values, GOOSE Bursts and Multicast Filtering",
    dek: "How much of a 100 Mb/s port do two 9-2LE merging units use, why a protection IED receives both streams with VLAN filtering, and what a GOOSE avalanche adds. Numbers from the SCL NetStudio sample substation.",
    standard: "IEC 61850-9-2 / UCA 9-2LE",
    readTime: "8 min read",
    scenario: [
      { label: "Process bus", value: "Switch PB1, 100 Mb/s device ports, 1 Gb/s uplink" },
      { label: "SV streams", value: "MU_Q01 and MU_T1, 9-2LE: 80 samples per cycle, 1 ASDU per frame, 8 channels, 50 Hz; frames of 131 and 130 bytes, VLAN 11" },
      { label: "Subscribers", value: "P132_Q01 subscribes to MU_Q01 only; P87T_T1 to MU_T1 only" },
      { label: "GOOSE", value: "Trip GOOSE of 184–202 bytes, MinTime 4 ms, MaxTime 1000 ms" },
      { label: "Multicast filtering", value: "By VLAN (every port in VLAN 11 receives every SV stream)" },
    ],
    scenarioNote: "Open SCL NetStudio ▸ Bandwidth with the sample project loaded.",
    steps: [
      { title: "Frame rate of one SV stream", equation: "frames/s = samples per cycle × frequency ÷ ASDUs per frame", substitution: "80 × 50 ÷ 1", result: "4 000 frames/s" },
      { title: "Bandwidth of one SV stream", body: "Each frame occupies its own bytes plus 8 bytes of preamble and 12 bytes of inter-frame gap on the wire.", equation: "load = (frame + 20) × 8 × frames/s", substitution: "MU_Q01: (131 + 20) × 8 × 4 000 = 4.832 Mb/s;  MU_T1: (130 + 20) × 8 × 4 000 = 4.800 Mb/s", result: "≈ 4.8 Mb/s per stream" },
      { title: "What a protection IED port receives", body: "With filtering by VLAN, the switch sends every frame of VLAN 11 to every port that is a member of VLAN 11. P132_Q01 therefore receives MU_T1's stream as well as its own.", substitution: "4.832 + 4.800 = 9.632 Mb/s on a 100 Mb/s port", result: "9.6 % — the busiest device port in the sample", note: "With per-stream filtering (static multicast entries or MMRP) the port would carry only MU_Q01: 4.8 %. On a larger process bus with ten merging units in one VLAN, VLAN-only filtering would put about 48 Mb/s on every IED port." },
      { title: "GOOSE in steady state and in a burst", equation: "steady: 1 frame per MaxTime; burst: MinTime doubling 4, 8, 16 … ms", substitution: "184-byte trip GOOSE: (184 + 20) × 8 × 1 = 1.6 kb/s steady; about 8 frames/s averaged over the first second after a change = 0.013 Mb/s", result: "Negligible next to sampled values, even when every GOOSE changes at once" },
    ],
    resultSummary: [
      { check: "SV stream load", requirement: "≈ 5 Mb/s for 9-2LE at 50 Hz", actual: "4.83 / 4.80 Mb/s", pass: true },
      { check: "Busiest device port (burst)", requirement: "< 50 % steady, < 80 % burst", actual: "9.6 %", pass: true },
      { check: "Uplinks", requirement: "< 50 %", actual: "< 0.1 % of 1 Gb/s", pass: true },
    ],
    finalAnswer: "Each 9-2LE stream needs about 4.8 Mb/s. With VLAN filtering every IED in the SV VLAN receives every stream, so P132_Q01's 100 Mb/s port carries 9.6 % instead of 4.8 %. That is comfortable for two merging units, but filtering per stream (or one VLAN per bay) becomes necessary as the process bus grows.",
    keyInsight: "On the process bus, size ports for every SV stream they can receive, not just the ones the IED subscribes to — the multicast filtering method decides which that is.",
    faqs: [
      { q: "Why add 20 bytes per frame?", a: "Every Ethernet frame is preceded by an 8-byte preamble and start delimiter and followed by a 12-byte inter-frame gap; the wire is busy for that time too." },
      { q: "What about 256 samples per cycle?", a: "Metering streams at 256 samples per cycle usually pack 8 ASDUs per frame: 1 600 frames/s at 50 Hz but much larger frames — enter the stream with its smpRate and nofASDU and the tool recalculates." },
    ],
  },
  {
    slug: "iec-61850-goose-trip-transfer-time-tt6-switch-latency",
    groupId: "iec-61850",
    calculatorHref: NS,
    calculatorName: NS_NAME,
    title: "Worked Example: Does a Trip GOOSE Meet TT6 (3 ms) Through Three Switches?",
    dek: "Transfer time t = ta + tb + tc for a 184-byte trip GOOSE through three store-and-forward switches, with worst-case queuing behind full-size frames. Every term worked by hand and compared with SCL NetStudio.",
    standard: "IEC 61850-5 / IEC 61850-10",
    readTime: "9 min read",
    scenario: [
      { label: "Message", value: "P132_Q01 trip GOOSE, 184-byte frame, priority 6" },
      { label: "Requirement", value: "Type 1A trip, performance class P2/P3: TT6, t ≤ 3 ms" },
      { label: "Path", value: "3 store-and-forward switches: 2 device links at 100 Mb/s, 2 backbone links at 1 Gb/s, 5 µs switch latency each, 300 m of cable" },
      { label: "Devices", value: "Sender processing ta = 1 ms, receiver processing tc = 1 ms" },
      { label: "Queuing", value: "A 1 522-byte frame already being sent at each egress port, plus 2 frames of the same priority ahead" },
    ],
    steps: [
      { title: "Frame transmission at each link", equation: "t = (frame + 20 bytes) × 8 / link speed", substitution: "(184 + 20) × 8 = 1 632 bits: 16.32 µs at 100 Mb/s, 1.63 µs at 1 Gb/s. Two links of each: 2 × 16.32 + 2 × 1.63", result: "35.9 µs (store-and-forward: the frame is received completely at each switch)" },
      { title: "Switch fabric latency", substitution: "3 × 5 µs", result: "15.0 µs" },
      { title: "Worst-case queuing", body: "At each egress port a maximum-size frame may have just started; priority cannot interrupt it. The two backbone egress ports run at 1 Gb/s, the last one to the receiver at 100 Mb/s.", substitution: "(1 522 + 20) × 8 = 12 336 bits: 2 × 12.34 µs + 123.36 µs, plus 2 same-priority GOOSE frames ahead at 100 Mb/s: 2 × 16.32 µs", result: "180.7 µs" },
      { title: "Cable propagation", substitution: "300 m × 5 ns/m", result: "1.5 µs" },
      { title: "Network time and total", equation: "tb = 35.9 + 15.0 + 180.7 + 1.5;  t = ta + tb + tc", substitution: "tb = 233.1 µs;  t = 1 000 + 233.1 + 1 000 µs", result: "t = 2.233 ms — meets TT6 with 0.77 ms margin" },
    ],
    resultSummary: [
      { check: "Network part tb", requirement: "Small share of 3 ms", actual: "0.233 ms", pass: true },
      { check: "Total transfer time", requirement: "≤ 3 ms (TT6)", actual: "2.233 ms", pass: true },
    ],
    finalAnswer: "The trip GOOSE takes 2.233 ms from application to application, of which only 0.233 ms is the network. TT6 is met with 0.77 ms margin. The IED processing times ta and tc (1 ms each here) dominate — use the manufacturer's figures, which can be much shorter.",
    keyInsight: "With 100 Mb/s device ports the worst case is set by queuing behind one full-size frame at the last egress port (123 µs). Gigabit links and strict priority keep the network part well below 1 ms even through many switches.",
    faqs: [
      { q: "Why 1 522 bytes?", a: "The largest tagged Ethernet frame (1 518 bytes plus the 4-byte VLAN tag). Strict priority cannot pre-empt a frame that has started; it only chooses the next frame." },
      { q: "How is TT6 tested?", a: "IEC 61850-10 describes performance tests; in practice a test set publishes a GOOSE and measures the round trip to the subscriber's reply, which includes ta and tc of both devices." },
    ],
  },
  {
    slug: "iec-61850-9-3-ptp-time-synchronisation-error-budget",
    groupId: "iec-61850",
    calculatorHref: NS,
    calculatorName: NS_NAME,
    title: "Worked Example: PTP Time Error Budget for Sampled Values (IEC 61850-9-3)",
    dek: "Add up grandmaster, transparent clock and end-device errors, check the result against the time class sampled values need, and estimate how long the merging units stay accurate if GPS is lost.",
    standard: "IEC 61850-9-3 / IEC 61850-5",
    readTime: "7 min read",
    scenario: [
      { label: "Function", value: "Sampled values for protection — class T4, ±4 µs" },
      { label: "Method", value: "PTP power profile (IEC 61850-9-3)" },
      { label: "Error contributions", value: "Grandmaster 250 ns, 4 transparent clocks of 50 ns, no boundary clocks, end device 200 ns" },
      { label: "Holdover", value: "Device oscillator TCXO, 1 ppm" },
    ],
    steps: [
      { title: "Worst-case sum", equation: "error = GM + n_TC × e_TC + n_BC × e_BC + end device", substitution: "250 + 4 × 50 + 0 + 200 ns", result: "650 ns = ±0.65 µs" },
      { title: "Which class is reached", body: "IEC 61850-5 time performance classes: T3 ±25 µs, T4 ±4 µs, T5 ±1 µs.", result: "±0.65 µs achieves T5 — better than the T4 that protection SV needs" },
      { title: "The profile's own limit", body: "IEC 61850-9-3 allows 250 ns at the grandmaster, 50 ns per transparent clock and 200 ns per boundary clock, so that 1 µs is held after 15 transparent clocks: 250 + 15 × 50 = 1 000 ns.", result: "The 4-switch design is well inside the profile" },
      { title: "Holdover after loss of GPS", equation: "time to reach the limit = (requirement − error) / oscillator drift", substitution: "(4 − 0.65) µs ÷ 1 µs/s (1 ppm)", result: "≈ 3.4 s" },
    ],
    resultSummary: [
      { check: "Time error", requirement: "≤ ±4 µs (T4)", actual: "±0.65 µs", pass: true },
      { check: "Holdover with TCXO", requirement: "Long enough to ride through a GPS outage", actual: "≈ 3.4 s", pass: false },
    ],
    finalAnswer: "The PTP design reaches ±0.65 µs, comfortably inside the ±4 µs sampled values need. But a 1 ppm oscillator keeps that accuracy for only about 3.4 s after the grandmaster loses GPS; for protection schemes that compare samples from different merging units, specify grandmasters with OCXO or rubidium holdover, or a redundant grandmaster.",
    keyInsight: "The accuracy budget is usually easy to meet with PTP; holdover is where designs fall short. Check what happens when the GPS antenna fails, not only when it works.",
    faqs: [
      { q: "Should the errors be added or combined statistically?", a: "The worst-case sum is conservative. The tool can also show the root-sum-square, which is closer to what is measured when errors are independent." },
      { q: "What does smpSynch tell me?", a: "In each sampled-value frame smpSynch shows whether the merging unit is synchronised to a global source (2), a local one (1) or none (0); the capture analyser flags frames that are not synchronised." },
    ],
  },
  {
    slug: "iec-61850-network-capture-vs-plan-goose-sv-commissioning",
    groupId: "iec-61850",
    calculatorHref: NS,
    calculatorName: NS_NAME,
    title: "Worked Example: Checking a Commissioning Capture Against the Network Plan",
    dek: "A 10-second capture of the sample substation compared with the planned streams: a missing merging unit, a confRev mismatch, an unknown test publisher with a clashing APPID, lost GOOSE and unsynchronised samples.",
    standard: "IEC 61850-8-1 / 9-2",
    readTime: "8 min read",
    scenario: [
      { label: "Capture", value: "Sample capture generated from the project: 40 099 frames in 10 s (SV 39 997, GOOSE 61, MMS 31, PTP 10)" },
      { label: "Plan", value: "4 GOOSE and 2 SV streams from the VLAN & multicast table" },
    ],
    scenarioNote: "Open SCL NetStudio ▸ Capture analyser ▸ Load sample capture.",
    steps: [
      { title: "Plan check", table: { headers: ["Planned stream", "Seen", "Result"], rows: [["GOOSE P132_Q01/GCB_TRIP · 0001", "Yes", "Matches"], ["GOOSE P132_Q02/GCB_TRIP · 0002", "Yes", "Matches"], ["GOOSE P87T_T1/GCB_DIFF · 0003", "Yes", "confRev 2 (plan 1)"], ["GOOSE BCU_J01/GCB_IL · 0004", "Yes", "Matches"], ["SV MU_Q01/MSVCB01 · 4001", "Yes", "VLAN 0 (plan 11)"], ["SV MU_T1/MSVCB01 · 4002", "No", "Missing"], ["— (not in the project)", "TEST_IEDLD0/LLN0$GO$gcb01 · 0001", "Unexpected"]] } },
      { title: "GOOSE findings", body: "P132_Q01: stNum jumped 6 → 8 — one state change was never seen. P132_Q02: no message for 3 000 ms against a TAL of 2 000 ms — subscribers would declare the stream lost — and sqNum jumped 6 → 9. TEST_IED publishes APPID 0001, the same as P132_Q01's trip, untagged and with the test flag set." },
      { title: "Sampled-value findings", body: "MU_Q01: 3 samples missing before smpCnt 2003, and smpSynch = 0 in 1 599 samples (not time synchronised). It is only priority-tagged (VLAN 0), so it is not in the planned SV VLAN 11." },
      { title: "MMS", body: "One TCP retransmission between the gateway (10.13.0.11) and P132_Q01 (port 102): packet loss or congestion on the station bus." },
    ],
    resultSummary: [
      { check: "All planned streams present", requirement: "6 of 6", actual: "5 of 6 (MU_T1 missing)", pass: false },
      { check: "No unknown publishers", requirement: "None", actual: "TEST_IED with APPID 0001", pass: false },
      { check: "GOOSE continuity", requirement: "No lost state changes, TAL respected", actual: "stNum gap; TAL exceeded", pass: false },
      { check: "SV synchronisation", requirement: "smpSynch = 2", actual: "0 in 1 599 samples", pass: false },
    ],
    finalAnswer: "Before energisation: find and remove the test set publishing APPID 0001, put MU_Q01 in VLAN 11, restore its time synchronisation, bring MU_T1 on line, re-load P87T_T1's CID (confRev 2 against the planned 1, or update the plan if the change is intended), and investigate the lost GOOSE messages from P132_Q01 and P132_Q02.",
    keyInsight: "A capture compared with the plan finds the problems that each device's own configuration tool cannot: missing and unknown publishers, address clashes between vendors, and devices that are configured correctly but not on the right VLAN or clock.",
    faqs: [
      { q: "Where should the capture be taken?", a: "On a mirror port or TAP that receives the multicast traffic of interest — for sampled values, on the process bus switch; for GOOSE, on the station bus. Capture for long enough to include a few state changes." },
      { q: "How is this different from the GOOSE & SV Capture Analyzer?", a: "SCL NetStudio checks the capture against the network plan. The GOOSE & SV Capture Analyzer runs 86 detailed conformance checks per frame with clause references; the two complement each other." },
    ],
  },
];
