// Worked examples for the Earthing, Lightning & Static Safety group. Every
// numeric value was produced by running the calculator's own verified
// engine (earthing.ts / lightning.ts / rollingsphere.ts / touchvoltage.ts /
// staticbonding.ts / esdenergy.ts) directly with tsx, not hand-typed.

import type { WorkedExample } from "./types";

export const EARTHING_EXAMPLES: WorkedExample[] = [
  {
    slug: "earthing-grid-mesh-voltage-vs-grid-resistance",
    groupId: "earthing",
    calculatorHref: "/calculators/earthing",
    calculatorName: "Earthing Grid Design",
    title: "Worked Example: Why a Low Grid Resistance Doesn't Guarantee a Safe Earthing Grid",
    dek: "A 30m x 20m grid with a perfectly reasonable-looking resistance and GPR still fails the actual touch and step voltage safety checks by a wide margin.",
    standard: "IEEE 80",
    readTime: "12 min read",
    scenario: [
      { label: "Grid size", value: "30 m x 20 m, 4 x 3 mesh, burial depth 0.6 m" },
      { label: "Ground rods", value: "4 rods, 3 m long" },
      { label: "Soil resistivity", value: "100 Ω·m (no surface layer)" },
      { label: "Symmetrical fault current", value: "10,000 A (current division & decrement factors = 1)" },
      { label: "Fault clearing time", value: "0.5 s" },
      { label: "Body weight category", value: "70 kg" },
    ],
    steps: [
      {
        title: "Compute grid resistance and ground potential rise (GPR)",
        equation: "Rg = ρ x [1/Lt + (1/√(20A)) x (1 + 1/(1 + h√(20/A)))]        GPR = IG x Rg",
        substitution: "Total conductor length Lt = 182 m, grid area A = 600 m²",
        result: "Rg = 2.285 Ω, GPR = 22,851 V",
      },
      {
        title: "Compute the tolerable touch and step voltage limits",
        body: "These are the maximum voltages a person is allowed to experience — a completely separate quantity from GPR itself, which is why a high GPR alone doesn't automatically mean a failed design.",
        equation: "Etouch = (1000 + 1.5·ρs·Cs) x Ib          Estep = (1000 + 6·ρs·Cs) x Ib",
        result: "Etouch = 188.7 V, Estep = 262.5 V (no surface layer, so Cs = 1.0)",
      },
      {
        title: "Compute the actual mesh (touch) and step voltages the grid produces",
        body: "This is the calculation GPR alone can't substitute for — it depends on mesh geometry (spacing, depth, rod placement), not just total resistance.",
        equation: "Em = ρ x IG x Km x Ki / Lm          Es = ρ x IG x Ks x Ki / Ls",
        substitution: "Km = 1.111, Ki = 1.157, Lm = 188.6 m       Ks = 0.316, Ls = 137.7 m",
        result: "Em = 6813 V, Es = 2651 V",
      },
      {
        title: "Compare actual voltages against the tolerable limits",
        table: {
          headers: ["Check", "Tolerable limit", "Actual", "Result"],
          rows: [
            ["Touch (mesh) voltage", "188.7 V", "6813 V (36x over)", "FAIL"],
            ["Step voltage", "262.5 V", "2651 V (10x over)", "FAIL"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "Grid resistance / GPR", requirement: "n/a (informational — not itself a pass/fail limit)", actual: "Rg = 2.285 Ω, GPR = 22,851 V", pass: true },
      { check: "Mesh (touch) voltage", requirement: "≤ 188.7 V", actual: "6813 V", pass: false },
      { check: "Step voltage", requirement: "≤ 262.5 V", actual: "2651 V", pass: false },
    ],
    finalAnswer: "This grid's resistance (2.285 Ω) and GPR look like unremarkable, almost reassuring numbers on their own — but the actual mesh and step voltages a person would experience near the grid are 36x and 10x over the tolerable limits respectively. As designed, this grid is not safe and needs a fundamental redesign, not a minor tweak.",
    keyInsight: "Grid resistance and GPR describe the whole grid's behavior relative to remote earth; mesh and step voltage describe what a specific person standing at a specific point actually experiences, which depends heavily on mesh spacing and geometry, not just total resistance. A grid can have an excellent (low) resistance and still be dangerous to stand near if the conductor spacing is too wide — which is exactly the trap a resistance-only check falls into.",
    faqs: [
      {
        q: "Does tightening the mesh spacing alone fix this grid?",
        a: "Not on its own — narrowing the mesh from 4x3 to a much finer 16x11 grid (D_avg dropping from 10 m to 2 m) reduces the mesh voltage from 6813 V to about 2755 V, real progress, but still far above the 188.7 V limit. At this fault current and soil resistivity, mesh spacing alone has diminishing returns; other levers have to be combined with it.",
      },
      {
        q: "What combination of changes would actually make this design pass?",
        a: "Adding a high-resistivity surface layer (e.g. a crushed-rock surface, resistivity ~10,000 Ω·m) raises the tolerable touch-voltage limit dramatically — because Cs and ρs both increase, Etouch rises from 188.7 V to about 1869 V in this case. Combined with a much finer mesh (which still helps reduce Em, just not enough alone), step voltage moves to a clear pass, and touch voltage gets close but can still fall short — showing why real designs typically stack several levers together (mesh density, surface treatment, faster protection clearing time, or lower soil resistivity via treatment) rather than relying on any single one.",
      },
      {
        q: "Why does fault clearing time (tf) matter so much?",
        a: "Both Etouch and Estep are inversely proportional to the square root of clearing time, since IEEE 80's tolerable body-current limit itself assumes a shorter exposure allows a higher survivable current — halving the clearing time (e.g. from 0.5 s to 0.2 s via faster protection) raises both tolerable limits by roughly 58%, which is often cheaper to achieve than physically rebuilding a grid.",
      },
    ],
  },

  {
    slug: "lightning-protection-risk-assessment-warehouse",
    groupId: "earthing",
    calculatorHref: "/calculators/lightning-protection",
    calculatorName: "Lightning Protection",
    title: "Worked Example: IEC 62305 Risk Assessment — Does This Structure Need a Lightning Protection System?",
    dek: "Running the full risk-of-loss-of-life calculation for a modest warehouse finds the risk is already below the tolerable threshold — no LPS is strictly required by the standard's own numbers.",
    standard: "IEC 62305-2",
    readTime: "10 min read",
    scenario: [
      { label: "Structure dimensions", value: "15 m x 20 m x 6 m high" },
      { label: "Ground flash density", value: "4 flashes/km²/year" },
      { label: "Existing LPS", value: "None" },
      { label: "Persons in the zone of loss", value: "5 of 5 total occupants" },
      { label: "Time occupied", value: "8760 h/year (continuously staffed)" },
      { label: "Tolerable risk (R1, per IEC 62305)", value: "1 x 10⁻⁵ per year" },
    ],
    scenarioNote: "This example covers the free-tier structure-only risk (loss of human life from direct strikes to the structure). Risk contributions from connected power/telecom lines are a separate subscriber-tier calculation and are not included here.",
    steps: [
      {
        title: "Compute the structure's equivalent collection area",
        equation: "Ad = L·W + 2(3H)(L+W) + π(3H)²",
        substitution: "Ad = (15x20) + 2(18)(35) + π(18)²",
        result: "Ad = 2578 m²",
      },
      {
        title: "Compute expected annual lightning strikes to the structure",
        equation: "Nd = Ng x Ad x Cd x 10⁻⁶",
        substitution: "4 x 2578 x 1 x 10⁻⁶",
        result: "Nd = 0.0103 strikes/year",
      },
      {
        title: "Compute R_A — risk from touch/step voltage near the structure during a direct strike",
        body: "With no LPS installed, the probability factor Pb (damage probability) is at its maximum (1.0), reflecting no protection at all.",
        result: "Ra ≈ 1.0 x 10⁻⁹ (negligible)",
      },
      {
        title: "Compute R_B — risk of physical damage / fire from a direct strike",
        result: "Rb ≈ 1.03 x 10⁻⁶",
      },
      {
        title: "Sum the risk components and compare to the tolerable threshold",
        equation: "R1 = Ra + Rb (+ Ru + Rv, not evaluated in this free-tier example)",
        substitution: "1.0e-9 + 1.03e-6",
        result: "R1 = 1.03 x 10⁻⁶",
      },
    ],
    resultSummary: [
      { check: "Total risk of loss of human life (R1)", requirement: "≤ 1 x 10⁻⁵ per year", actual: "1.03 x 10⁻⁶ per year", pass: true },
    ],
    finalAnswer: "At 1.03 x 10⁻⁶ per year, this structure's risk is already about 10x below the 1 x 10⁻⁵ tolerable threshold — based purely on the structure-only risk components, IEC 62305 does not mandate installing a lightning protection system here.",
    keyInsight: "A 'no LPS required' result from this kind of risk assessment is a legitimate, standard-compliant outcome, not a sign the assessment is incomplete — IEC 62305 is explicitly a risk-based standard, not a blanket 'every building needs lightning rods' rule. That said, this example only evaluates structure-only risk; connected overhead power or telecom lines can add meaningfully to total risk, and a full assessment for a real building should include them.",
    faqs: [
      {
        q: "Would this result change with a more valuable or more hazardous structure?",
        a: "Yes — the loss factor terms (LA, LB in this calculation) scale with the type of loss being evaluated and the specific structure's fire risk provisions, so a structure storing flammable materials or serving a higher-risk occupancy type would show meaningfully higher risk for the same physical dimensions and lightning flash density, potentially crossing the tolerable threshold and requiring an LPS.",
      },
      {
        q: "What would including connected power and telecom lines change here?",
        a: "Overhead lines entering a structure give lightning current an additional path in, which is why IEC 62305 adds separate risk terms (Ru, Rv) for connected lines based on their length, routing, shielding and the equipment's withstand voltage — for a structure with long unshielded overhead service lines, these terms can be the dominant contributor to total risk, sometimes tipping an otherwise-tolerable result over the threshold.",
      },
    ],
  },

  {
    slug: "rolling-sphere-method-single-mast-protection-radius",
    groupId: "earthing",
    calculatorHref: "/calculators/rolling-sphere",
    calculatorName: "LPS Rolling Sphere Method",
    title: "Worked Example: Protection Radius of a Single Air Terminal Using the Rolling Sphere Method",
    dek: "A simple geometric check — how far from the base of a 10 m mast does an IEC 62305 Class III lightning protection zone actually extend?",
    standard: "IEC 62305-1 (rolling sphere geometry)",
    readTime: "6 min read",
    scenario: [
      { label: "LPS protection class", value: "Class III" },
      { label: "Rolling sphere radius for Class III", value: "45 m" },
      { label: "Air terminal (mast) height", value: "10 m" },
    ],
    steps: [
      {
        title: "Confirm the mast height doesn't exceed the sphere radius",
        equation: "h ≤ R?",
        substitution: "10 m ≤ 45 m",
        result: "Yes — the simple single-mast formula applies (if h > R, a mesh/multi-terminal study would be required instead)",
      },
      {
        title: "Apply the rolling-sphere protection-radius geometry",
        body: "This is the radius at ground level within which the sphere cannot touch the ground without first touching the mast tip — geometrically, a sphere resting on the ground and just grazing the top of the mast.",
        equation: "rp = √(2·R·h - h²)",
        substitution: "√(2 x 45 x 10 - 10²) = √(900 - 100)",
        result: "rp = √800 = 28.28 m",
      },
    ],
    resultSummary: [
      { check: "Mast height within sphere radius", requirement: "h ≤ R", actual: "10 m ≤ 45 m", pass: true },
      { check: "Protection radius at ground level", requirement: "n/a (this is the computed result)", actual: "28.28 m", pass: true },
    ],
    finalAnswer: "A single 10 m air terminal designed to Class III provides a protection radius of 28.28 m at ground level — meaning equipment or structures within that radius of the mast base are considered shielded from direct strikes under the rolling-sphere model.",
    keyInsight: "Protection radius grows with mast height, but not linearly — doubling the mast height doesn't double the protection radius, because the geometry is governed by a square-root relationship. There are real diminishing returns to just building a taller mast, which is why multi-terminal or mesh-conductor systems are typically more practical than a single very tall mast for protecting a large area.",
    faqs: [
      {
        q: "What happens if the mast is taller than the rolling sphere radius?",
        a: "The simple single-mast formula stops being valid once mast height exceeds the sphere radius for the chosen LPS class — physically, the sphere can then roll past the tip and touch a wider area at a different geometry, which requires a full multi-terminal or mesh-conductor rolling-sphere study rather than the single closed-form equation used here.",
      },
      {
        q: "Why does a higher protection class (I) use a smaller sphere radius than a lower class (IV)?",
        a: "A smaller rolling sphere radius represents a more stringent protection level — it means the model assumes lightning can strike from a shorter final jump distance, which is associated with lower-current, more localized strikes that are harder to intercept. Class I (20 m radius) is therefore the most protective and demanding classification, while Class IV (60 m) is the least stringent.",
      },
    ],
  },

  {
    slug: "touch-voltage-neutral-earth-imbalance",
    groupId: "earthing",
    calculatorHref: "/calculators/touch-voltage",
    calculatorName: "Touch Voltage from Imbalance",
    title: "Worked Example: Touch Voltage from an Unbalanced Neutral/Earth Current",
    dek: "A modest 15 A imbalance current through a 2 Ω ground path produces a touch voltage that comfortably clears the IEC 60364-4-41 dry-location limit.",
    standard: "IEC 60364-4-41",
    readTime: "7 min read",
    scenario: [
      { label: "Neutral/earth imbalance current", value: "15 A" },
      { label: "Ground path impedance", value: "2 Ω" },
      { label: "Touch factor", value: "1.0 (worst case — full ground potential rise appears across the body)" },
      { label: "Environment", value: "Dry / normal (50 V limit)" },
    ],
    steps: [
      {
        title: "Compute the ground potential rise (GPR)",
        equation: "GPR = Iimbalance x Zground",
        substitution: "15 x 2",
        result: "GPR = 30 V",
      },
      {
        title: "Apply the touch factor to find actual touch voltage",
        equation: "Vtouch = GPR x touch factor",
        substitution: "30 x 1.0",
        result: "Vtouch = 30 V",
      },
      {
        title: "Compare against the IEC 60364-4-41 conventional touch-voltage limit",
        equation: "Vtouch ≤ UL?",
        substitution: "30 V ≤ 50 V (dry/normal locations)",
        result: "Passes, with 20 V of margin",
      },
      {
        title: "Estimate the resulting body current for context",
        body: "Using the commonly-cited IEC 60479-1 reference body resistance of 1000 Ω.",
        equation: "Ibody ≈ Vtouch / Rbody",
        substitution: "30 / 1000",
        result: "≈30 mA (informational only, not itself the pass/fail check)",
      },
    ],
    resultSummary: [
      { check: "Touch voltage vs. dry-location limit", requirement: "≤ 50 V", actual: "30 V", pass: true },
    ],
    finalAnswer: "At 30 V, this scenario's touch voltage stays under the 50 V dry-location limit with a reasonable margin — but the same 15 A imbalance current in a wet or conductive location (25 V limit) would fail outright.",
    keyInsight: "The touch-voltage limit itself is environment-dependent, not just the touch voltage being checked against it — the exact same electrical fault (15 A through a 2 Ω path) is a comfortable pass in a dry office and a clear fail in a wet or conductive location, which is why IEC 60364-4-41 sets two different limits rather than one universal number.",
    faqs: [
      {
        q: "What does the touch factor of 1.0 actually represent?",
        a: "A touch factor of 1.0 is the worst-case assumption — that the full ground potential rise appears directly across the body (hand to feet, or hand to hand). In practice, the geometry of where a person stands relative to the earthing point, and any additional resistance in the contact path, often reduces the fraction of GPR that actually reaches the body — but assuming the full value by default is the conservative, safety-first starting point.",
      },
      {
        q: "Would this same fault pass in a wet location?",
        a: "No — the wet/conductive-location limit is 25 V, and 30 V exceeds that. This is exactly the kind of case where the environment classification, not just the raw electrical numbers, determines whether a design is acceptable — the same physical installation might need additional bonding or a lower-impedance ground path specifically because of where it's located.",
      },
    ],
  },

  {
    slug: "static-bonding-resistance-check-tank-truck-loading",
    groupId: "earthing",
    calculatorHref: "/calculators/static-bonding",
    calculatorName: "Static Bonding & Grounding Check",
    title: "Worked Example: Static Dissipation Bonding Resistance at a Tank Truck Loading Rack",
    dek: "The same NFPA 77 threshold, applied to two very different real-world bonding-clip readings — one a clean pass, one a clear failure needing immediate attention.",
    standard: "NFPA 77 (static-electricity dissipation guidance)",
    readTime: "6 min read",
    scenario: [
      { label: "Threshold", value: "1,000,000 Ω (1 MΩ) — commonly-cited NFPA 77 static-dissipation guidance" },
      { label: "Case A — measured bonding resistance", value: "25,000 Ω (a bonding clip on a truck with some surface corrosion)" },
      { label: "Case B — measured bonding resistance", value: "2,500,000 Ω (a clip with a failed or missing connection)" },
    ],
    steps: [
      {
        title: "Compare Case A against the threshold",
        equation: "Measured resistance ≤ threshold?",
        substitution: "25,000 Ω ≤ 1,000,000 Ω",
        result: "Passes — 40x below the threshold",
      },
      {
        title: "Classify Case A's connection quality",
        body: "The calculator distinguishes a tight metallic bond (very low resistance) from one that merely clears the static-dissipation threshold.",
        result: "25,000 Ω is well above a true metallic bond (which would read under about 10 Ω) — adequate for static dissipation, but worth investigating for corrosion or a loose connection.",
      },
      {
        title: "Compare Case B against the threshold",
        equation: "Measured resistance ≤ threshold?",
        substitution: "2,500,000 Ω ≤ 1,000,000 Ω",
        result: "Fails — 2.5x over the threshold",
      },
    ],
    resultSummary: [
      { check: "Case A bonding resistance", requirement: "≤ 1,000,000 Ω", actual: "25,000 Ω", pass: true },
      { check: "Case B bonding resistance", requirement: "≤ 1,000,000 Ω", actual: "2,500,000 Ω", pass: false },
    ],
    finalAnswer: "Case A's 25,000 Ω reading passes comfortably but flags a connection worth inspecting (a proper metallic bond should read far lower). Case B's 2,500,000 Ω reading is a clear failure — the bond will not reliably dissipate static charge and must be repaired before loading resumes.",
    keyInsight: "There's a meaningful difference between 'passes the threshold' and 'is a good connection.' A reading like Case A's 25,000 Ω clears the 1 MΩ static-dissipation limit with huge margin, but is still two to three orders of magnitude higher than a properly tight all-metal bond — which is exactly the kind of early warning sign (corrosion, a loose clamp, paint on the contact surface) worth acting on before it degrades into an actual failure like Case B.",
    faqs: [
      {
        q: "Why is 1 MΩ the threshold instead of a much lower number?",
        a: "Static charge dissipation doesn't need a low-impedance path the way a fault-current or lightning path does — it only needs to bleed off a slow accumulation of static charge fast enough to prevent a dangerous voltage buildup, and NFPA 77's commonly-cited 1 MΩ guidance reflects that far more modest requirement, which is why a bonding path can be orders of magnitude worse than a proper equipment ground and still work for its intended static-dissipation purpose.",
      },
      {
        q: "Does passing this check mean the bond is also adequate for fault current or lightning?",
        a: "No — static dissipation, equipment (fault-current) grounding, and lightning protection all have different, unrelated impedance requirements. A bonding clip that passes this static-dissipation check at 25,000 Ω would be completely inadequate as an equipment safety ground, which typically needs an impedance low enough to ensure protective devices operate quickly during a fault.",
      },
    ],
  },

  {
    slug: "esd-spark-energy-vs-minimum-ignition-energy",
    groupId: "earthing",
    calculatorHref: "/calculators/esd-energy",
    calculatorName: "ESD Spark Energy Check",
    title: "Worked Example: A Charged Isolated Part Carries 20x More Energy Than a Flammable Atmosphere Needs to Ignite",
    dek: "A modest 100 pF part charged to 10 kV — a completely plausible static charge in an industrial process — stores twenty times the minimum ignition energy of a typical hydrocarbon atmosphere.",
    standard: "IEC 60079-32-1 (screening method)",
    readTime: "8 min read",
    scenario: [
      { label: "Isolated part capacitance", value: "100 pF" },
      { label: "Charged voltage", value: "10,000 V" },
      { label: "Atmosphere", value: "IIA gas group (e.g. propane, typical hydrocarbons)" },
      { label: "Minimum Ignition Energy (MIE)", value: "0.25 mJ" },
    ],
    steps: [
      {
        title: "Compute the stored capacitive discharge energy",
        equation: "E = 0.5 x C x V²",
        substitution: "0.5 x (100 x 10⁻¹²) x 10,000²",
        result: "E = 5 x 10⁻³ J = 5 mJ",
      },
      {
        title: "Compare against the atmosphere's Minimum Ignition Energy",
        equation: "E < MIE?",
        substitution: "5 mJ < 0.25 mJ?",
        result: "No — 5 mJ is 20x larger than the 0.25 mJ MIE",
      },
      {
        title: "Compute the margin factor",
        equation: "Margin = MIE / E",
        substitution: "0.25 / 5",
        result: "Margin factor = 0.05 (the spark energy is 20x the ignition threshold, not below it)",
      },
    ],
    resultSummary: [
      { check: "Spark energy below atmosphere's MIE", requirement: "E < 0.25 mJ", actual: "5 mJ", pass: false },
    ],
    finalAnswer: "This isolated conductive part, charged to a realistic 10 kV, stores about 20 times the minimum energy needed to ignite this IIA-group atmosphere — a real, serious ignition risk that requires bonding/grounding the part or eliminating the charge-generating process, not just noting the result.",
    keyInsight: "Because stored energy scales with the square of voltage, relatively modest changes in charging voltage have an outsized effect — halving the voltage to 5000 V would cut stored energy to 1.25 mJ (still over MIE), while a 10x voltage reduction to 1000 V would bring it to 0.05 mJ, comfortably under. This quadratic relationship is exactly why controlling charge generation (flow velocity, humidity, material selection) is often more effective than trying to shrink an isolated part's capacitance, which is usually a smaller lever.",
    faqs: [
      {
        q: "Why is MIE always a user-supplied input rather than a built-in constant?",
        a: "Minimum Ignition Energy is a genuinely substance-specific property — it varies enormously even within one gas group, and using a single default value across different atmospheres could understate real risk. Gas group (IIA/IIB/IIC) or dust classification gives general guidance on typical ranges, but the actual MIE for the specific substance present (from its own IEC 60079-20-1 data or manufacturer safety data) must always be used for a real assessment.",
      },
      {
        q: "What's the practical fix for a result like this one?",
        a: "The two main levers are eliminating the isolated conductor (bonding/grounding it so charge can't accumulate in the first place) or controlling the process that generates the charge (reducing flow velocity, adding humidity, or changing materials to reduce triboelectric charging) — bonding is almost always the more reliable and immediate fix, since it removes the hazard regardless of how much charge the process generates.",
      },
    ],
  },
];
