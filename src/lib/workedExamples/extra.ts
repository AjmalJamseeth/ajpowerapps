// Worked examples added November 2026 for calculators that had none.
// Every figure below was produced by running the calculator's own library
// function with the stated inputs (see scripts/regression-test.ts,
// "Worked examples (November 2026)", which pins these values).

import type { WorkedExample } from "./types";

export const EXTRA_EXAMPLES: WorkedExample[] = [
  {
    slug: "iec-60909-short-circuit-11kv-0-4kv-network-with-generator-and-motor",
    groupId: "short-circuit",
    calculatorHref: "/calculators/iec-60909",
    calculatorName: "IEC 60909 Short-Circuit Calculator",
    title: "Worked Example: IEC 60909 Short-Circuit Currents in an 11/0.4 kV Network with a Generator and a Motor",
    dek: "Initial, peak, breaking and thermal short-circuit currents at three buses fed by the utility, a standby generator and an induction motor — and why the peak current needs the 1.15 factor here.",
    standard: "IEC 60909-0",
    readTime: "10 min read",
    scenario: [
      { label: "Utility supply", value: "11 kV, Sk″ = 250 MVA, R/X = 0.1" },
      { label: "Generator on the 11 kV board", value: "2.5 MVA, 11 kV, xd″ = 14%, cos φ = 0.8" },
      { label: "Transformer", value: "1.6 MVA, 11/0.4 kV Dyn, uk = 6%, Pk = 15 kW" },
      { label: "Cable to the MCC", value: "50 m of 3-core 240 mm² Cu (0.0754 + j0.078 Ω/km)" },
      { label: "Motor on the MCC", value: "160 kW, 0.4 kV, ILR/IrM = 7, η = 0.95, cos φ = 0.88" },
      { label: "Voltage factor", value: "cmax = 1.10 at 11 kV, 1.05 at 0.4 kV (+6% tolerance)" },
    ],
    steps: [
      {
        title: "Build the network impedances on a common base",
        body: "Each element is converted to per-unit on 100 MVA: the utility from its Sk″, the generator with its correction factor KG, the transformer with KT = 0.95·cmax/(1 + 0.6·xT), the cable from its length, and the motor from its locked-rotor current.",
        equation: "ZQ = c·Un²/Sk″     KT = 0.95·cmax/(1 + 0.6·xT)     ZM = (1/(ILR/IrM))·UrM²/SrM",
      },
      {
        title: "Find the initial symmetrical short-circuit current Ik″ at each bus",
        equation: "Ik″ = c·Un / (√3·|Zk|)",
        table: {
          headers: ["Bus", "Ik″ (kA)", "Utility share", "Generator share", "Motor share"],
          rows: [
            ["11 kV switchboard", "14.20", "13.12", "1.01", "0.07"],
            ["0.4 kV LV board", "39.58", "35.00", "2.70", "1.95"],
            ["Motor control centre", "23.49", "19.92", "1.54", "2.03"],
          ],
        },
        note: "Shares are magnitudes from the network solution, so they add up only approximately.",
      },
      {
        title: "Peak current ip with method B",
        body: "Several sources feed each fault, so IEC 60909-0 method B applies: κ from the R/X ratio at the fault, multiplied by 1.15 and limited to 2.0 (HV) or 1.8 (LV).",
        equation: "κ = 1.02 + 0.98·e^(−3R/X)     κ(b) = 1.15·κ     ip = κ(b)·√2·Ik″",
        table: {
          headers: ["Bus", "R/X", "κ(b)", "ip (kA)"],
          rows: [
            ["11 kV switchboard", "0.099", "2.00 (limit)", "40.17"],
            ["0.4 kV LV board", "0.165", "1.80 (limit)", "100.77"],
            ["Motor control centre", "0.458", "1.458", "48.44"],
          ],
        },
      },
      {
        title: "Breaking and thermal currents",
        body: "At the 11 kV board the generator's contribution decays by tmin = 0.1 s, so the breaking current Ib is slightly lower than Ik″. Motor decay is not credited, which is conservative. The thermal equivalent current uses Tk = 1 s and n = 1.",
        result: "11 kV: Ib = 13.88 kA, Ith = 14.44 kA     LV board: Ib = 39.58 kA, Ith = 39.99 kA     MCC: Ib = 23.49 kA, Ith = 23.58 kA",
      },
      {
        title: "Check the switchgear ratings",
        table: {
          headers: ["Bus", "Rating", "Largest fault (3-phase or earth)", "Result"],
          rows: [
            ["11 kV switchboard", "25 kA", "14.50 kA (earth fault)", "Adequate"],
            ["0.4 kV LV board", "50 kA", "40.34 kA (earth fault)", "Adequate"],
            ["Motor control centre", "36 kA", "23.49 kA", "Adequate"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "11 kV board short-circuit rating", requirement: "≥ 14.50 kA", actual: "25 kA", pass: true },
      { check: "LV board short-circuit rating", requirement: "≥ 40.34 kA", actual: "50 kA", pass: true },
      { check: "LV board making capacity (peak)", requirement: "≥ 100.8 kA", actual: "Check breaker Icm", pass: true },
      { check: "MCC short-circuit rating", requirement: "≥ 23.49 kA", actual: "36 kA", pass: true },
    ],
    finalAnswer: "All three switchboards are adequate for the symmetrical fault current. The LV board sees almost 40 kA with a 101 kA peak, so its main breaker needs a making capacity (Icm) of at least about 101 kA — a 50 kA breaker typically has Icm = 105 kA at 400 V, which just covers it.",
    keyInsight: "The motor adds about 2 kA at the MCC, nearly 9% of the fault current there, even though it is a modest 160 kW machine. Leaving motors out of a maximum short-circuit study underestimates both the breaking and the peak duty.",
    faqs: [
      { q: "Why is the 11 kV earth-fault current higher than the three-phase current?", a: "The generator's neutral is solidly earthed and its zero-sequence reactance (7%) is half its subtransient reactance (14%), while the utility's zero-sequence impedance equals its positive-sequence impedance in this model. The zero-sequence impedance at the bus is therefore lower than the positive-sequence impedance, and with Z0 < Z1 the single-phase fault current exceeds the three-phase current. (The transformer's delta winding is on the 11 kV side, so it adds no zero-sequence path there.)" },
      { q: "When can I use κ without the 1.15 factor?", a: "When a single source feeds the fault through a radial (non-meshed) path, κ from that path's R/X is used directly. With several sources in parallel, method B's 1.15 factor covers the different R/X ratios of the branches." },
    ],
  },

  {
    slug: "nec-wire-size-65a-load-40c-ambient-six-conductors",
    groupId: "cables",
    calculatorHref: "/calculators/wire-ampacity-nec",
    calculatorName: "Wire Size / Ampacity Calculator (NEC)",
    title: "Worked Example: NEC Wire Size for a 65 A Load at 40 °C with Six Current-Carrying Conductors",
    dek: "Why the same 65 A load that needs #6 AWG in normal conditions needs #4 AWG when it is hot and bundled — and how the 90 °C column and the 75 °C terminals interact.",
    standard: "NEC 310.16, 310.15, 110.14(C)",
    readTime: "6 min read",
    scenario: [
      { label: "Load", value: "65 A continuous design current (after any 125% factor)" },
      { label: "Conductor", value: "Copper THHN/THWN-2, 90 °C insulation" },
      { label: "Terminals", value: "Rated 75 °C" },
      { label: "Ambient", value: "40 °C" },
      { label: "Current-carrying conductors in the raceway", value: "6" },
    ],
    steps: [
      {
        title: "Find the correction and adjustment factors",
        body: "Because the insulation is rated 90 °C, the factors are taken from the 90 °C column.",
        equation: "Ambient correction (310.15(B)), 36–40 °C, 90 °C column = 0.91     Adjustment for 4–6 conductors (310.15(C)(1)) = 0.80",
        result: "Combined factor = 0.91 × 0.80 = 0.728",
      },
      {
        title: "Try #6 AWG",
        equation: "Adjusted ampacity = 75 A (90 °C column) × 0.728",
        result: "54.6 A — less than 65 A, so #6 fails",
      },
      {
        title: "Try #4 AWG",
        equation: "Adjusted ampacity = 95 A × 0.728 = 69.2 A     Terminal limit (75 °C column) = 85 A",
        result: "Usable ampacity = lower of 69.2 A and 85 A = 69.2 A ≥ 65 A, so #4 passes",
      },
    ],
    resultSummary: [
      { check: "#6 AWG Cu", requirement: "≥ 65 A", actual: "54.6 A", pass: false },
      { check: "#4 AWG Cu", requirement: "≥ 65 A", actual: "69.2 A", pass: true },
    ],
    finalAnswer: "Use #4 AWG copper. In normal conditions (30 °C, three conductors) #6 AWG at 65 A would be enough, but heat and bundling remove more than a quarter of its ampacity.",
    keyInsight: "The 90 °C column gives head-room for derating, but the final value can never exceed the 75 °C terminal rating. Here derating governs (69.2 A < 85 A); in a cool, lightly filled raceway the terminal rating would govern instead.",
    faqs: [
      { q: "Does the neutral count as a current-carrying conductor?", a: "Only in some cases. A neutral carrying only the unbalanced current of a 3-phase 4-wire circuit is not counted, but it is counted when the major part of the load is non-linear (310.15(E))." },
      { q: "Can I use the 90 °C ampacity if my breaker is rated 75 °C?", a: "Only as the starting point for correction and adjustment. The final ampacity used with that breaker is limited to the 75 °C column value (110.14(C))." },
    ],
  },

  {
    slug: "motor-torque-37kw-1480rpm-and-50hp-1780rpm",
    groupId: "motors",
    calculatorHref: "/calculators/motor-torque",
    calculatorName: "Motor Torque Calculator",
    title: "Worked Example: Motor Torque from kW and HP — 37 kW at 1,480 rpm and 50 hp at 1,780 rpm",
    dek: "Full-load torque from power and speed in SI and US units, and why a 50 hp motor at 60 Hz produces less torque than a 37 kW motor at 50 Hz.",
    standard: "Power–torque–speed relation",
    readTime: "4 min read",
    scenario: [
      { label: "Motor A (IEC, 50 Hz)", value: "37 kW, 4-pole, 1,480 rpm rated speed" },
      { label: "Motor B (NEMA, 60 Hz)", value: "50 hp, 4-pole, 1,780 rpm rated speed" },
    ],
    steps: [
      {
        title: "Motor A in SI units",
        equation: "T (N·m) = 9550 × P (kW) / n (rpm)",
        substitution: "9550 × 37 / 1480",
        result: "T = 238.8 N·m (176.1 lb·ft)",
      },
      {
        title: "Motor B in US units",
        equation: "T (lb·ft) = 5252 × P (hp) / n (rpm)",
        substitution: "5252 × 50 / 1780",
        result: "T = 147.5 lb·ft (200.0 N·m)",
      },
    ],
    resultSummary: [
      { check: "Motor A full-load torque", requirement: "n/a", actual: "238.8 N·m", pass: true },
      { check: "Motor B full-load torque", requirement: "n/a", actual: "200.0 N·m", pass: true },
    ],
    finalAnswer: "Motor A produces 238.8 N·m and motor B 200.0 N·m. Although 50 hp (37.3 kW) is about the same power as 37 kW, motor B runs 20% faster at 60 Hz, so it develops less torque.",
    keyInsight: "Torque, not power, decides whether a motor can drive a load at a given speed. When a 60 Hz motor is replaced by a 50 Hz one of the same kW (or the reverse), check the torque and the driven machine's speed, not just the power rating.",
    faqs: [
      { q: "Should I use synchronous speed or rated speed?", a: "Use the rated (nameplate) speed for full-load torque. Synchronous speed (1,500 or 1,800 rpm for 4 poles) gives a slightly lower, non-physical value because the motor never reaches it under load." },
    ],
  },

  {
    slug: "vfd-sizing-constant-torque-hot-high-altitude-site",
    groupId: "motors",
    calculatorHref: "/calculators/vfd-sizing",
    calculatorName: "VFD Sizing Calculator",
    title: "Worked Example: Sizing a VFD for a Constant-Torque Conveyor at 50 °C and 1,500 m",
    dek: "How duty type, ambient temperature and altitude turn a 65 A motor into a 96 A drive requirement — and why a 96 A drive is not quite enough.",
    standard: "Manufacturer derating practice",
    readTime: "5 min read",
    scenario: [
      { label: "Motor", value: "400 V, full-load current 65 A" },
      { label: "Load", value: "Conveyor — constant torque (heavy duty)" },
      { label: "Design margin", value: "10%" },
      { label: "Site", value: "50 °C ambient, 1,500 m altitude" },
      { label: "Candidate drive", value: "400 V, 96 A rated output" },
    ],
    steps: [
      {
        title: "Apply margin and duty",
        body: "A constant-torque load needs the drive's heavy-duty rating, which is roughly 85–87% of its normal-duty rating, so the requirement is raised by about 1.15 when comparing against normal-duty catalogue currents.",
        equation: "I required = FLA × (1 + margin) × duty factor",
        substitution: "65 × 1.10 × 1.15",
        result: "I required = 82.2 A",
      },
      {
        title: "Derate for temperature and altitude",
        equation: "Temperature factor = 1 − 0.01 × (50 − 40) = 0.90     Altitude factor = 1 − 0.01 × (1500 − 1000)/100 = 0.95",
        substitution: "82.2 / (0.90 × 0.95)",
        result: "Minimum drive rating = 96.2 A",
      },
      {
        title: "Check the candidate drive",
        result: "96 A < 96.2 A — the candidate is just too small; the voltage rating is fine",
      },
    ],
    resultSummary: [
      { check: "Drive voltage rating", requirement: "≥ 400 V", actual: "400 V", pass: true },
      { check: "Drive current rating", requirement: "≥ 96.2 A", actual: "96 A", pass: false },
    ],
    finalAnswer: "Select the next drive frame above 96 A (for example a 105–110 A unit), or check the manufacturer's own heavy-duty and derating tables, which may give the 96 A frame a little more capacity than these generic factors.",
    keyInsight: "On a hot, high site a drive can need nearly 50% more rated current than the motor's FLA. Sizing on motor kW alone would have picked a drive about a third too small.",
    faqs: [
      { q: "Are 1%/°C and 1%/100 m standard values?", a: "No. They are common screening figures. Drive manufacturers publish their own derating curves, which take priority for the final selection." },
    ],
  },

  {
    slug: "ground-rod-resistance-3m-vs-6m-rod-100-ohm-m-soil",
    groupId: "earthing",
    calculatorHref: "/calculators/ground-resistance",
    calculatorName: "Ground Resistance Calculator",
    title: "Worked Example: Ground Rod Resistance — Does a 3 m Rod Reach 25 Ω in 100 Ω·m Soil?",
    dek: "A single 3 m rod misses the common 25 Ω target; doubling its length gets there, while a fatter rod barely helps.",
    standard: "BS 7430 rod formula, NEC 250.53(A)(2)",
    readTime: "4 min read",
    scenario: [
      { label: "Soil resistivity", value: "100 Ω·m (uniform)" },
      { label: "Rod", value: "16 mm diameter, driven vertically" },
      { label: "Target", value: "25 Ω (NEC 250.53(A)(2) single-electrode exception)" },
    ],
    steps: [
      {
        title: "Resistance of a 3 m rod",
        equation: "R = ρ / (2πL) × [ln(8L/d) − 1]",
        substitution: "100 / (2π × 3) × [ln(8 × 3 / 0.016) − 1]",
        result: "R = 33.5 Ω — above 25 Ω",
      },
      {
        title: "Resistance of a 6 m rod (or two coupled 3 m sections)",
        substitution: "100 / (2π × 6) × [ln(8 × 6 / 0.016) − 1]",
        result: "R = 18.6 Ω — below 25 Ω",
      },
    ],
    resultSummary: [
      { check: "3 m × 16 mm rod", requirement: "≤ 25 Ω", actual: "33.5 Ω", pass: false },
      { check: "6 m × 16 mm rod", requirement: "≤ 25 Ω", actual: "18.6 Ω", pass: true },
    ],
    finalAnswer: "A single 3 m rod gives 33.5 Ω, so under NEC 250.53(A)(2) a supplemental electrode would be needed. Driving the rod to 6 m gives 18.6 Ω and meets the 25 Ω exception on its own.",
    keyInsight: "Resistance falls almost in proportion to rod length but only weakly with diameter, because diameter appears inside a logarithm. Deeper rods also tend to reach moister, lower-resistivity soil, so in practice the gain is often larger than this uniform-soil estimate.",
    faqs: [
      { q: "Is two rods side by side the same as one rod twice as long?", a: "Only if they are spaced at least about one rod length apart. Closer rods share the same soil and their combined resistance is noticeably higher than half of one rod." },
    ],
  },

  {
    slug: "nec-220-dwelling-service-load-standard-vs-optional-method",
    groupId: "power-quality",
    calculatorHref: "/calculators/nec-residential-load",
    calculatorName: "NEC 220 Residential Electrical Load Calculator",
    title: "Worked Example: NEC 220 Dwelling Service Size — Standard vs Optional Method",
    dek: "A 2,000 ft² house works out at 150 A by the standard method but 125 A by the optional method — here is where the difference comes from.",
    standard: "NEC Article 220 (Parts III and IV)",
    readTime: "7 min read",
    scenario: [
      { label: "Floor area", value: "2,000 ft²" },
      { label: "Small-appliance and laundry circuits", value: "2 × 1,500 VA and 1 × 1,500 VA" },
      { label: "Other fixed appliances", value: "3 appliances totalling 4,500 VA" },
      { label: "Range and dryer", value: "10 kW range, 5,000 VA dryer" },
      { label: "HVAC", value: "4,800 VA cooling, 10,000 VA heat pump heating (larger of the two used)" },
      { label: "Supply", value: "240 V single-phase" },
    ],
    steps: [
      {
        title: "Standard method: general loads with the Table 220.42 demand factors",
        equation: "Lighting 3 VA/ft² × 2,000 = 6,000 VA; + 4,500 VA small appliance and laundry = 10,500 VA",
        substitution: "3,000 × 100% + 7,500 × 35%",
        result: "5,625 VA",
      },
      {
        title: "Standard method: add the other loads",
        table: {
          headers: ["Load", "Rule", "VA"],
          rows: [
            ["General loads", "Table 220.42", "5,625"],
            ["Fixed appliances (fewer than 4)", "220.53 — 100%", "4,500"],
            ["Range, 10 kW", "Table 220.55 Column C", "8,000"],
            ["Dryer", "220.54 — 5,000 VA minimum", "5,000"],
            ["Heating (larger than cooling)", "220.60", "10,000"],
            ["Total", "", "33,125"],
          ],
        },
        result: "33,125 VA / 240 V = 138 A → 150 A service",
      },
      {
        title: "Optional method (220.82)",
        body: "All general loads and appliances at nameplate: 10,500 + 4,500 + 10,000 (range) + 5,000 (dryer) = 30,000 VA. The first 10 kVA at 100% and the rest at 40% gives 18,000 VA. The heat pump is added at 100% under 220.82(C).",
        substitution: "18,000 + 10,000",
        result: "28,000 VA / 240 V = 117 A → 125 A service",
      },
    ],
    resultSummary: [
      { check: "Standard method", requirement: "n/a", actual: "33,125 VA → 150 A", pass: true },
      { check: "Optional method", requirement: "n/a", actual: "28,000 VA → 125 A", pass: true },
    ],
    finalAnswer: "The optional method allows a 125 A service, the standard method 150 A. Either is code-compliant for a single dwelling; many designers still choose 200 A for future loads such as an EV charger.",
    keyInsight: "The optional method's single 40% factor above 10 kVA is more generous than the separate standard-method factors, which is why it usually gives a smaller service for a typical house.",
    faqs: [
      { q: "How is an EV charger added?", a: "NEC 220.57 counts EVSE at 7,200 VA or its nameplate rating, whichever is larger. A 7,680 VA (32 A) charger would add 7,680 VA in the standard method." },
    ],
  },
];
