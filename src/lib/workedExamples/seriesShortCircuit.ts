// Short-circuit learning series (6 examples), IEC 60909-0. Every result was
// produced with the IEC 60909 calculator's engine (analyseShortCircuit) and is
// pinned in scripts/regression-test.ts ("Learning series — short circuit").
// The common network: 250 MVA 11 kV grid (R/X 0.1) → 1.6 MVA 11/0.4 kV Dyn
// transformer, uk 6 %, load losses 15 kW.

import type { WorkedExample } from "./types";

const HREF = "/calculators/iec-60909";
const NAME = "IEC 60909 Short-Circuit Calculator";
const NET = { label: "Network", value: "250 MVA, 11 kV grid (R/X = 0.1) → 1.6 MVA, 11/0.4 kV Dyn transformer, uk = 6 %, Pk = 15 kW" };

export const SERIES_SC_EXAMPLES: WorkedExample[] = [
  {
    slug: "short-circuit-basics-mva-method-vs-per-unit-iec-60909",
    groupId: "short-circuit",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Short Circuit Calculation Basics: MVA Method vs Per-Unit (IEC 60909) for a 1.6 MVA Transformer",
    dek: "Part 1 of the short-circuit series. The same LV board fault worked two ways — the quick MVA method and the IEC 60909 per-unit method — and why they differ by 7.6 %.",
    standard: "IEC 60909-0",
    readTime: "10 min read",
    scenario: [NET, { label: "Fault", value: "Three-phase bolted fault on the 0.4 kV LV board" }, { label: "LV tolerance", value: "+6 % (cmax = 1.05 at LV, 1.10 at 11 kV)" }],
    steps: [
      {
        title: "Quick check: the MVA method",
        body: "Each element is turned into its own short-circuit power and the powers are combined like resistors in parallel.",
        equation: "S_T = Sr / uk;  1/S = 1/S_grid + 1/S_T;  Ik = S / (√3 × U)",
        substitution: "S_T = 1.6 / 0.06 = 26.67 MVA;  S = 1 / (1/250 + 1/26.67) = 24.10 MVA;  Ik = 24.10 / (√3 × 0.4)",
        result: "Ik ≈ 34.8 kA",
      },
      {
        title: "IEC 60909 — grid impedance in per unit (Sbase = 100 MVA)",
        equation: "Z_Q = c × Sbase / Sk″",
        substitution: "Z_Q = 1.10 × 100 / 250 = 0.440 pu;  with R/X = 0.1:  Z_Q = 0.0438 + j0.4378 pu",
        result: "Z_Q = 0.0438 + j0.4378 pu",
      },
      {
        title: "Transformer impedance and correction factor KT",
        equation: "ukr = Pk / Sr;  ux = √(uk² − ukr²);  KT = 0.95 × cmax / (1 + 0.6 × xT)",
        substitution: "ukr = 15 kW / 1600 kVA = 0.9375 %;  ux = 5.926 %;  Z_T = (0.9375 + j5.926) % × 100/1.6 = 0.586 + j3.704 pu;  KT = 0.95 × 1.05 / (1 + 0.6 × 0.05926) = 0.9632",
        result: "KT × Z_T = 0.5644 + j3.5678 pu",
      },
      {
        title: "Total impedance and fault current",
        equation: "Ik″ = c × Ibase / |Z|,  Ibase = Sbase / (√3 × Un)",
        substitution: "Z = 0.6082 + j4.0056 pu, |Z| = 4.0515 pu;  Ibase = 100 / (√3 × 0.4) = 144.34 kA;  Ik″ = 1.05 × 144.34 / 4.0515",
        result: "Ik″ = 37.41 kA",
        note: "In ohms at 0.4 kV: Z = 0.000973 + j0.006409 Ω (Zbase = 0.4²/100 = 0.0016 Ω).",
      },
      {
        title: "Why the two answers differ",
        body: "The MVA method ignores the voltage factor c and the transformer correction KT, and treats impedances as pure reactances. IEC 60909 deliberately uses cmax = 1.05 for LV with +6 % tolerance, giving the maximum current needed for equipment ratings. The MVA method is a good sense check, but the equipment duty should be taken from IEC 60909.",
      },
    ],
    resultSummary: [
      { check: "MVA method", requirement: "Sense check", actual: "34.8 kA", pass: true },
      { check: "IEC 60909 maximum Ik″", requirement: "Used for equipment rating", actual: "37.41 kA", pass: true },
      { check: "LV board rating", requirement: "≥ 37.41 kA", actual: "50 kA", pass: true },
    ],
    finalAnswer: "The IEC 60909 maximum three-phase fault current on the LV board is 37.41 kA, 7.6 % above the quick MVA-method estimate of 34.8 kA. A 50 kA board is adequate.",
    keyInsight: "Over 85 % of the impedance comes from the transformer. For LV boards fed by a transformer, the transformer impedance sets the fault level; the grid strength matters much less.",
    faqs: [
      { q: "Why is c = 1.10 used for the 11 kV grid but 1.05 at LV?", a: "IEC 60909-0 Table 1 gives cmax = 1.10 above 1 kV, and 1.05 (or 1.10 with a +10 % tolerance) at low voltage. The grid impedance is calculated with the factor of its own network." },
      { q: "What is KT for?", a: "It corrects the transformer impedance for the real operating conditions before the fault, so the equivalent voltage source method gives the right maximum current." },
    ],
  },

  {
    slug: "short-circuit-at-mcc-cable-impedance-effect",
    groupId: "short-circuit",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Short Circuit at an MCC 80 m From the Transformer: How Much Does the Cable Reduce It?",
    dek: "Part 2 of the short-circuit series. Adding an 80 m feeder cuts the fault level from 37.4 kA to 22.9 kA and changes the X/R ratio — which affects the peak current and equipment selection.",
    standard: "IEC 60909-0",
    readTime: "8 min read",
    scenario: [NET, { label: "Feeder", value: "2 × 185 mm² Cu cables in parallel, 80 m; r = 0.0991 Ω/km, x = 0.0739 Ω/km per cable" }, { label: "Fault", value: "Three-phase and line-to-earth faults at the MCC" }],
    steps: [
      { title: "Impedance at the LV board (from Part 1)", result: "Z_board = 0.000973 + j0.006409 Ω" },
      {
        title: "Cable impedance",
        equation: "Z_c = (r + jx) × L / n",
        substitution: "Z_c = (0.0991 + j0.0739) × 0.08 / 2",
        result: "Z_c = 0.003964 + j0.002956 Ω",
      },
      {
        title: "Fault current at the MCC",
        equation: "Ik″ = c × Un / (√3 × |Z|)",
        substitution: "Z = 0.004937 + j0.009365 Ω, |Z| = 0.010587 Ω;  Ik″ = 1.05 × 400 / (√3 × 0.010587)",
        result: "Ik″ = 22.90 kA",
      },
      {
        title: "Peak factor from the new R/X",
        equation: "κ = 1.02 + 0.98 × e^(−3R/X);  ip = κ × √2 × Ik″",
        substitution: "R/X = 0.527;  κ = 1.02 + 0.98 × e^(−1.581) = 1.222;  ip = 1.222 × 1.414 × 22.90",
        result: "ip = 39.57 kA (at the board: κ = 1.641, ip = 86.8 kA)",
      },
      {
        title: "Line-to-earth fault",
        body: "The calculator also solves the zero-sequence network (transformer Dyn earthed at the star point, cable zero-sequence impedance about 4 × the positive-sequence).",
        result: "Ik1 = 17.06 kA at the MCC",
      },
    ],
    resultSummary: [
      { check: "MCC three-phase Ik″", requirement: "≤ MCC rating 36 kA", actual: "22.90 kA", pass: true },
      { check: "MCC peak ip", requirement: "≤ making capacity", actual: "39.6 kA", pass: true },
    ],
    finalAnswer: "The 80 m feeder reduces the fault level from 37.41 kA at the board to 22.90 kA at the MCC, and the peak from 86.8 kA to 39.6 kA because the cable raises the R/X ratio.",
    keyInsight: "A short LV cable has as much impedance as the transformer. Equipment far from the transformer can often use lower-rated devices, but the minimum fault current (for protection) falls too — see Part 5.",
    faqs: [
      { q: "Should I use the cable resistance at 20 °C or at operating temperature?", a: "For maximum fault current IEC 60909 uses 20 °C (lower resistance, higher current). For the minimum fault current it uses the resistance at the end of the fault, typically 80 °C." },
      { q: "Why does the peak drop more than the r.m.s. current?", a: "Cable resistance damps the DC offset. A higher R/X gives a lower peak factor κ." },
    ],
  },

  {
    slug: "short-circuit-motor-contribution-lv-board",
    groupId: "short-circuit",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Motor Contribution to Short Circuit: 600 kW of Motors on an LV Board",
    dek: "Part 3 of the short-circuit series. Running motors feed the fault for the first cycles. 600 kW of motors add 6.8 kA to the 37.4 kA from the transformer.",
    standard: "IEC 60909-0",
    readTime: "8 min read",
    scenario: [NET, { label: "Motors", value: "600 kW total on the LV board, cos φ = 0.85, efficiency 0.94, locked-rotor current 6 × rated, R/X = 0.42" }],
    steps: [
      {
        title: "Motor rated apparent power and current",
        equation: "SrM = Pr / (η × cos φ);  IrM = SrM / (√3 × U)",
        substitution: "SrM = 600 / (0.94 × 0.85) = 750.9 kVA;  IrM = 750.9 / (√3 × 0.4) = 1084 A",
        result: "IrM = 1084 A",
      },
      {
        title: "Motor impedance",
        equation: "ZM = (1 / (ILR/IrM)) × UrM² / SrM",
        substitution: "ZM = (1/6) × 0.4² / 0.7509",
        result: "ZM = 0.0355 Ω",
      },
      {
        title: "Motor contribution",
        equation: "Ik″M = c × Un / (√3 × ZM)",
        substitution: "Ik″M = 1.05 × 400 / (√3 × 0.0355)",
        result: "Ik″M = 6.83 kA (about 6.3 × the motors' rated current)",
      },
      {
        title: "Total at the LV board",
        body: "The grid and motor contributions are added as phasors, which gives slightly less than the arithmetic sum (37.41 + 6.83 = 44.24 kA).",
        result: "Ik″ = 44.06 kA",
      },
      {
        title: "Breaking current",
        body: "Motor contribution decays quickly. IEC 60909 allows the breaking current of asynchronous motors to be reduced by factors μ and q. The calculator keeps the full motor contribution in Ib, which is on the safe side.",
        result: "Ib = 44.06 kA (conservative)",
      },
    ],
    resultSummary: [
      { check: "Without motors", requirement: "—", actual: "37.41 kA", pass: true },
      { check: "With motors", requirement: "≤ board rating 50 kA", actual: "44.06 kA", pass: true },
    ],
    finalAnswer: "The motors raise the LV board fault level from 37.41 kA to 44.06 kA (+18 %). The 50 kA board still has margin, but leaving the motors out would have hidden most of it.",
    keyInsight: "A quick estimate of motor contribution is the locked-rotor multiple times the total rated current of running motors — typically 4 to 7 times motor full-load current.",
    faqs: [
      { q: "Are motors included in the minimum fault current?", a: "No. IEC 60909 leaves motors out of the minimum case, because they may not be running." },
      { q: "Do motors behind a VFD contribute?", a: "Usually not significantly. A drive without regenerative capability does not feed a fault on its supply side, so drive-fed motors are normally left out." },
    ],
  },

  {
    slug: "short-circuit-two-transformers-in-parallel-bus-coupler",
    groupId: "short-circuit",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Two Transformers in Parallel: What Happens to the Fault Level When the Bus Coupler Closes?",
    dek: "Part 4 of the short-circuit series. Each 1.6 MVA transformer gives 37.4 kA on its own. Closing the bus coupler raises the fault level to 67.5 kA — beyond the 50 kA switchboard.",
    standard: "IEC 60909-0",
    readTime: "7 min read",
    scenario: [
      { label: "Supply", value: "250 MVA, 11 kV grid feeding two identical 1.6 MVA, 6 %, Dyn transformers T1 and T2" },
      { label: "LV switchboard", value: "Two sections A and B, each rated 50 kA, with a bus coupler between them" },
    ],
    steps: [
      { title: "Bus coupler open", body: "Each section is fed by one transformer, exactly as in Part 1.", result: "Ik″ = 37.41 kA on each section" },
      {
        title: "Bus coupler closed — impedances in parallel",
        body: "The two transformer impedances are now in parallel, but both are fed through the same grid impedance, so the current does not quite double.",
        equation: "Z = Z_Q + (KT × Z_T) / 2",
        substitution: "Z = (0.0438 + j0.4378) + (0.5644 + j3.5678)/2 = 0.326 + j2.222 pu → |Z| = 2.246 pu",
        result: "Ik″ = 1.05 × 144.34 / 2.246 = 67.49 kA",
      },
      {
        title: "Earth fault and peak with the coupler closed",
        result: "Ik1 = 72.2 kA;  ip = 157.6 kA",
      },
      {
        title: "Options",
        body: "Either keep the coupler open in normal service and interlock it so it can only close when one incomer is open (the common solution), or specify switchgear rated for the parallel fault level, or limit the current with a reactor or a fault-current limiter.",
      },
    ],
    resultSummary: [
      { check: "Coupler open", requirement: "≤ 50 kA", actual: "37.41 kA", pass: true },
      { check: "Coupler closed (paralleled)", requirement: "≤ 50 kA", actual: "67.49 kA", pass: false },
    ],
    finalAnswer: "With the coupler closed the fault level is 67.5 kA (72.2 kA for an earth fault), well above the 50 kA rating. The transformers must not run in parallel unless the switchgear is rated for it; an interlock is the usual answer.",
    keyInsight: "Paralleling sources is one of the most common ways a fault level grows beyond the switchgear rating after commissioning — for example when a second transformer or a generator is added later.",
    faqs: [
      { q: "Is a short-time parallel during changeover acceptable?", a: "Only if the switchgear is rated for the paralleled fault level, or the parallel period is so short and controlled that the user accepts the risk. Many specifications require the rating to cover it." },
      { q: "Why is the earth fault higher than the three-phase fault?", a: "For Dyn transformers the zero-sequence impedance is close to the positive-sequence impedance and there is no grid zero-sequence path in series, so the single-phase fault can exceed the three-phase fault near the transformer." },
    ],
  },

  {
    slug: "earth-fault-current-minimum-c-factor-protection-check",
    groupId: "short-circuit",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Minimum Earth Fault Current and the c-Factor: Will the Breaker Trip Instantaneously?",
    dek: "Part 5 of the short-circuit series. Maximum currents size equipment; minimum currents prove the protection works. At a DB 150 m away the minimum earth fault is 2.85 kA — too low for a 250 A breaker set at 10 × In.",
    standard: "IEC 60909-0",
    readTime: "9 min read",
    scenario: [
      NET,
      { label: "Feeder", value: "4-core 95 mm² Cu, 150 m; r = 0.193, x = 0.0779 Ω/km; r0 = 0.772, x0 = 0.234 Ω/km" },
      { label: "Protection", value: "250 A MCCB at the LV board, instantaneous setting 10 × In, tolerance ±20 %" },
    ],
    steps: [
      { title: "Maximum fault currents at the DB", result: "Ik3 = 6.93 kA;  Ik1 = 3.78 kA (cmax = 1.05, cable at 20 °C)" },
      {
        title: "Earth fault formula",
        equation: "Ik1 = √3 × c × Un / |2Z1 + Z0|",
        substitution: "Z1 = 0.0299 + j0.0181 Ω;  Z0 = 0.1167 + j0.0408 Ω (transformer + cable);  |2Z1 + Z0| = 0.1926 Ω;  Ik1 = √3 × 1.05 × 400 / 0.1926",
        result: "Ik1 max = 3.78 kA",
      },
      {
        title: "Minimum case",
        body: "IEC 60909 uses cmin = 0.95 at LV, leaves motors out and takes cable resistance at the end of the fault (×1.24 for copper at 80 °C).",
        result: "Ik1 min = 2.85 kA",
      },
      {
        title: "Check the instantaneous trip",
        equation: "Ii,max = setting × In × (1 + tolerance)",
        substitution: "10 × 250 × 1.2 = 3,000 A > 2,845 A",
        result: "Instantaneous operation is not guaranteed",
        note: "The fault would then be cleared by the slower long-time element, which may exceed the disconnection time required by IEC 60364-4-41.",
      },
      {
        title: "Fix",
        substitution: "Set 8 × In: 8 × 250 × 1.2 = 2,400 A < 2,845 A",
        result: "Instantaneous operation assured (check selectivity with downstream devices)",
      },
    ],
    resultSummary: [
      { check: "Ik1 min vs 10 × In upper limit", requirement: "Ik1 min > 3,000 A", actual: "2,845 A", pass: false },
      { check: "Ik1 min vs 8 × In upper limit", requirement: "Ik1 min > 2,400 A", actual: "2,845 A", pass: true },
    ],
    finalAnswer: "The minimum earth fault at the DB is 2.85 kA. A 250 A breaker at 10 × In might not trip instantaneously (upper limit 3.0 kA); reducing the setting to 8 × In (upper limit 2.4 kA) restores reliable fast clearing.",
    keyInsight: "Always calculate two values at every bus: the maximum current for equipment ratings and the minimum current for protection sensitivity. Long cables affect the minimum far more than the maximum.",
    faqs: [
      { q: "Why is the earth fault so much lower than the three-phase fault here?", a: "The cable's zero-sequence impedance (including the return path) is about four times its positive-sequence impedance, and the cable dominates the loop at 150 m." },
      { q: "What else can fix a low minimum fault current?", a: "A larger cable or a separate protective conductor, an RCD or earth-fault relay, or a breaker with an electronic trip unit and earth-fault (G) protection." },
    ],
  },

  {
    slug: "breaker-duty-peak-making-current-icu-icm-icw",
    groupId: "short-circuit",
    calculatorHref: HREF,
    calculatorName: NAME,
    title: "Breaker Duty Check: Icu, Icm and Icw for a 2.5 MVA Main LV Switchboard",
    dek: "Part 6 of the short-circuit series. A 65 kA board looks right until the motor contribution is added: 68.8 kA r.m.s. and 175 kA peak. How to check breaking, making and short-time ratings.",
    standard: "IEC 60909-0 / IEC 60947-2",
    readTime: "10 min read",
    scenario: [
      { label: "Supply", value: "500 MVA, 11 kV grid → 2.5 MVA, 11/0.4 kV Dyn transformer, uk = 6.25 %, Pk = 22 kW" },
      { label: "Motors", value: "1,000 kW of running motors on the main LV switchboard" },
      { label: "Candidate", value: "Switchboard and ACB rated Icu = 65 kA" },
      { label: "Settings", value: "tmin = 0.1 s, Ith duration tk = 1 s" },
    ],
    steps: [
      { title: "Initial symmetrical current", body: "From the transformer 57.75 kA and from the motors 11.38 kA.", result: "Ik″ = 68.81 kA" },
      {
        title: "Breaking capacity (Icu)",
        body: "Ik″ must not exceed the breaker's rated ultimate short-circuit breaking capacity. With the motor contribution kept in full, Ib = Ik″.",
        result: "68.81 kA > 65 kA — not adequate. Without motors (57.75 kA) it would have looked adequate.",
      },
      {
        title: "Peak current and making capacity (Icm)",
        equation: "κ = 1.02 + 0.98 e^(−3R/X);  several sources → κ(b) = 1.15 κ ≤ 1.8 (LV);  ip = κ √2 Ik″",
        substitution: "R/X = 0.182 → κ = 1.588;  1.15 × 1.588 = 1.83 → limited to 1.8;  ip = 1.8 × 1.414 × 68.81",
        result: "ip = 175.2 kA",
        note: "IEC 60947-2 Table 2: for Icu above 50 kA the minimum making capacity is Icm = 2.2 × Icu. A 65 kA breaker gives 143 kA < 175 kA; an 85 kA breaker gives 187 kA ≥ 175 kA.",
      },
      {
        title: "Short-time withstand (Icw) for selectivity",
        equation: "Ith = Ik″ × √(m + n)",
        result: "Ith (1 s) = 69.5 kA — the ACB needs Icw ≥ 69.5 kA for 1 s if it uses a short-time delay",
      },
    ],
    resultSummary: [
      { check: "Icu 65 kA vs Ik″", requirement: "≥ 68.81 kA", actual: "65 kA", pass: false },
      { check: "Icu 85 kA vs Ik″", requirement: "≥ 68.81 kA", actual: "85 kA", pass: true },
      { check: "Icm = 2.2 × 85 kA vs ip", requirement: "≥ 175.2 kA", actual: "187 kA", pass: true },
      { check: "Icw (1 s)", requirement: "≥ 69.5 kA", actual: "Select ACB with Icw ≥ 70 kA, 1 s", pass: true },
    ],
    finalAnswer: "The main switchboard needs at least 85 kA breaking capacity (Ik″ = 68.8 kA), a making capacity of at least 175 kA peak and, if short-time delays are used for selectivity, a 1 s withstand of about 70 kA. The 65 kA proposal fails on both breaking and making capacity.",
    keyInsight: "Three different ratings protect against three different stresses: Icu for interrupting, Icm for the first asymmetrical peak, and Icw for carrying the fault while a downstream device clears it.",
    faqs: [
      { q: "Why does the calculator use method B for κ?", a: "When several sources feed the fault, IEC 60909 method B (1.15 κ) is a safe single-value approach. For purely radial sources the standard also allows summing the partial peak currents, which can give a somewhat lower ip." },
      { q: "Is Ics important?", a: "Ics is the service breaking capacity, after which the breaker remains usable. Many specifications require Ics = 100 % Icu for main breakers." },
    ],
  },
];
