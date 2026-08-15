// Worked examples for the Cables & Line Engineering group. Every numeric
// value was produced by running the calculator's own verified engine
// (cable.ts / mvcable.ts / conduitfill.ts / cabletray.ts / cablepulling.ts /
// controlcable.ts / ohlvoltagereg.ts / linelosses.ts) directly with tsx
// against the stated inputs — most of which are each calculator's own
// default input set — not hand-typed.

import type { WorkedExample } from "./types";

export const CABLES_EXAMPLES: WorkedExample[] = [
  {
    slug: "cable-sizing-voltage-drop-50kw-feeder",
    groupId: "cables",
    calculatorHref: "/calculators/cable-sizing",
    calculatorName: "Cable Sizing & Voltage Drop",
    title: "Worked Example: Sizing a 50 kW Three-Phase Feeder per IEC 60364-5-52",
    dek: "A 50 kW/415 V feeder where the smaller cable that looks fine on paper actually fails the ampacity check — and the next size up clears both checks comfortably.",
    standard: "IEC 60364-5-52",
    readTime: "9 min read",
    scenario: [
      { label: "Load", value: "50 kW, 415 V three-phase, power factor 0.85" },
      { label: "Conductor / insulation", value: "Copper, PVC (70°C)" },
      { label: "Installation method", value: "Method C (clipped direct)" },
      { label: "Route length", value: "50 m" },
      { label: "Maximum permitted voltage drop", value: "5%" },
    ],
    steps: [
      {
        title: "Compute the design current (Ib)",
        equation: "Ib = (kW x 1000) / (√3 x V x PF)",
        substitution: "Ib = 50,000 / (1.732 x 415 x 0.85)",
        result: "Ib = 81.8 A",
      },
      {
        title: "Check a 16 mm² cable against ampacity",
        body: "IEC 60364-5-52 Table B.52.4 (Method C, PVC 70°C, copper, three loaded conductors) gives the tabulated current-carrying capacity.",
        table: {
          headers: ["Size", "Table ampacity", "Required (Ib)", "Result"],
          rows: [["16 mm²", "76 A", "81.8 A", "FAILS — 76 A < 81.8 A"]],
        },
        note: "16 mm² looks like a reasonable first guess for an 82 A load, but it's 5.8 A short of the table rating.",
      },
      {
        title: "Step up to 25 mm² and recheck ampacity",
        table: {
          headers: ["Size", "Table ampacity", "Required (Ib)", "Result"],
          rows: [["25 mm²", "96 A", "81.8 A", "PASSES — 96 A ≥ 81.8 A"]],
        },
        result: "25 mm² clears the ampacity check with 14.2 A of margin",
      },
      {
        title: "Verify voltage drop at 25 mm²",
        equation: "vd% = (mV/A·m x Ib x L) / (1000 x V) x 100",
        substitution: "Using the app's mV/A/m table for 25 mm² Cu at PF 0.85, L = 50 m",
        result: "vd = 10.98 V = 2.64%",
        note: "2.64% is comfortably under the 5% limit, so voltage drop does not override the ampacity-driven selection here.",
      },
    ],
    resultSummary: [
      { check: "16 mm² ampacity", requirement: "≥ 81.8 A", actual: "76 A", pass: false },
      { check: "25 mm² ampacity", requirement: "≥ 81.8 A", actual: "96 A", pass: true },
      { check: "25 mm² voltage drop", requirement: "≤ 5%", actual: "2.64%", pass: true },
    ],
    finalAnswer: "25 mm² Cu/PVC70 is the smallest cable that satisfies both checks — ampacity is the governing constraint for this relatively short 50 m run, not voltage drop.",
    keyInsight: "Ampacity and voltage drop are independent checks and either one can govern, depending on run length. Short, heavily loaded runs like this one are usually ampacity-limited; long, lightly loaded runs are usually voltage-drop-limited. Always check both rather than assuming one.",
    faqs: [
      {
        q: "At what length would voltage drop start to govern instead?",
        a: "Voltage drop scales linearly with length while ampacity doesn't change with length at all, so there's always some length beyond which voltage drop overtakes ampacity as the limiting factor. For this 25 mm² cable at 2.64% for 50 m, voltage drop would reach the 5% limit at roughly 95 m — beyond that, a longer run at the same load would need a larger cable purely to control voltage drop, even though 25 mm² would still pass on ampacity alone.",
      },
      {
        q: "Why does this calculator's ampacity table matter so much?",
        a: "This is exactly the table that was cross-checked cell-by-cell against the official IEC 60364-5-52:2009 standard PDF — two genuine transcription errors were found and corrected in that review (see the standards audit report), which is why every ampacity figure quoted in this example traces directly back to the standard's own published tables rather than a secondary/approximated source.",
      },
    ],
  },

  {
    slug: "mv-cable-sizing-132kv-thermal-circuit",
    groupId: "cables",
    calculatorHref: "/calculators/mv-cable",
    calculatorName: "MV Cable Sizing",
    title: "Worked Example: First-Principles Thermal Rating of a 132 kV Single-Core Cable",
    dek: "Instead of looking up a table value, this calculator solves the IEC 60287 thermal circuit directly — the same method behind CIGRE's own published verification cases.",
    standard: "IEC 60287-1-1 / -2-1",
    readTime: "11 min read",
    scenario: [
      { label: "System voltage", value: "132 kV" },
      { label: "Conductor", value: "Copper, 30.3 mm diameter, R₀ = 0.0283 Ω/km at 20°C" },
      { label: "Insulation", value: "XLPE, 15.5 mm thick, max conductor temp 90°C" },
      { label: "Sheath", value: "Aluminium, solid bonded" },
      { label: "Installation", value: "Buried in duct, 1000 mm depth, soil resistivity 1.0 K·m/W" },
      { label: "Ambient (soil)", value: "20°C" },
      { label: "Reference case", value: "CIGRE Technical Brochure 880, Case #0-1" },
    ],
    steps: [
      {
        title: "Build the cable's thermal-resistance network",
        body: "IEC 60287 models heat flow from conductor to ambient as a series of thermal resistances: T1 (conductor to sheath, through the insulation), T3 (sheath to any armour/serving) and T4 (cable surface to ambient, through the soil).",
        table: {
          headers: ["Thermal resistance", "Value"],
          rows: [
            ["T1 — conductor to sheath", "0.420 K·m/W"],
            ["T3 — sheath to surface (duct-corrected)", "0.087 K·m/W"],
            ["T4 — surface to ambient (soil)", "1.595 K·m/W"],
          ],
        },
      },
      {
        title: "Account for sheath circulating-current loss (solid bonding)",
        body: "With both sheath ends solidly bonded, circulating currents flow in the sheath and add loss on top of the conductor's own I²R loss — captured by the sheath loss factor lambda1.",
        result: "lambda1 = 0.294 (sheath losses add about 29% on top of conductor loss)",
      },
      {
        title: "Solve the rating equation iteratively",
        body: "The conductor's own resistance rises with its temperature, which is exactly what the rating current is trying to find — so IEC 60287's rating equation is solved iteratively: guess a temperature, compute current, recompute temperature, repeat until it converges.",
        result: "Converges in 5 iterations to a conductor temperature of exactly 90°C (the stated maximum)",
      },
      {
        title: "Read off the rating current and sheath temperature",
        table: {
          headers: ["Quantity", "Result"],
          rows: [
            ["Conductor temperature", "90.0°C (at the stated maximum)"],
            ["Sheath temperature", "78.7°C"],
            ["Continuous current rating", "821.8 A"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "Conductor temperature at rated current", requirement: "= 90°C (design maximum)", actual: "90.0°C", pass: true },
      { check: "Continuous current rating", requirement: "n/a (this is the computed result)", actual: "821.8 A", pass: true },
    ],
    finalAnswer: "This 132 kV single-core cable, buried in duct under the stated soil conditions, has a continuous current rating of 821.8 A — found by solving the full IEC 60287 thermal circuit rather than reading a generic table, and matching CIGRE TB880's own published verification case for this exact configuration.",
    keyInsight: "Unlike LV/MV cable tables (which pre-compute ratings for a fixed set of standard configurations), MV/HV single-core cable ratings are genuinely project-specific — burial depth, soil resistivity, bonding method and sheath material all change the answer meaningfully, which is why IEC 60287 solves the thermal circuit from first principles rather than publishing one universal table the way IEC 60364-5-52 does for LV cables.",
    faqs: [
      {
        q: "Why does solid bonding matter so much?",
        a: "Solid bonding (both sheath ends earthed) allows circulating current to flow in the sheath whenever the conductor carries current, adding real I²R loss (captured here as lambda1 = 0.294, roughly 29% extra heat on top of the conductor's own loss). Single-point bonding eliminates this circulating current at the cost of needing sheath voltage limiters and different fault-current withstand considerations — the choice is a real engineering trade-off, not just a wiring preference.",
      },
      {
        q: "Why does the rating change so much with burial depth and soil resistivity?",
        a: "T4 (surface-to-ambient thermal resistance) is the dominant term in this example (1.595 K·m/W, more than 3x T1 and T3 combined) precisely because soil is a much worse heat conductor than the cable's own insulation — deeper burial or drier/higher-resistivity soil both increase T4 and directly reduce the current the cable can carry before exceeding 90°C.",
      },
    ],
  },

  {
    slug: "conduit-fill-6-conductor-emt",
    groupId: "cables",
    calculatorHref: "/calculators/conduit-fill",
    calculatorName: "Conduit Fill",
    title: "Worked Example: NEC Chapter 9 Conduit Fill for Six 12 AWG Conductors",
    dek: "Six THHN conductors in 3/4-inch EMT pass with plenty of room to spare — enough room that a smaller, cheaper conduit would technically work too.",
    standard: "NEC Chapter 9, Tables 1, 4 & 5",
    readTime: "8 min read",
    scenario: [
      { label: "Conduit type", value: "EMT (Electrical Metallic Tubing), 3/4\" trade size" },
      { label: "Conductors", value: "6 x #12 AWG THHN" },
      { label: "Fill rule", value: "3+ conductors → 40% maximum fill (NEC Table 1)" },
    ],
    steps: [
      {
        title: "Look up each conductor's cross-sectional area",
        body: "NEC Chapter 9 Table 5 gives the area of #12 AWG THHN as 0.0133 in².",
        equation: "Total conductor area = area per conductor x quantity",
        substitution: "0.0133 x 6",
        result: "Total conductor area = 0.0798 in²",
      },
      {
        title: "Look up the conduit's total internal area",
        result: "3/4\" EMT — 100% internal area = 0.533 in² (NEC Chapter 9 Table 4)",
      },
      {
        title: "Apply the fill-percentage tier for 3 or more conductors",
        equation: "Max allowed area = 40% x total internal area",
        substitution: "0.40 x 0.533",
        result: "Max allowed area = 0.213 in²",
      },
      {
        title: "Compute the actual fill percentage and compare",
        equation: "Fill% = (total conductor area / total internal area) x 100",
        substitution: "(0.0798 / 0.533) x 100",
        result: "Fill = 15.0%, well under the 40% limit",
      },
    ],
    resultSummary: [
      { check: "Fill percentage", requirement: "≤ 40%", actual: "15.0%", pass: true },
    ],
    finalAnswer: "Six #12 AWG THHN conductors fill only 15.0% of a 3/4\" EMT conduit — comfortably within the 40% limit, and in fact the calculator's own sizing suggestion shows even 1/2\" EMT would satisfy the fill rule for this exact conductor count.",
    keyInsight: "Passing the fill-percentage check doesn't automatically mean the smallest theoretically-compliant conduit is the right practical choice — pulling tension, future spare capacity, and simply being able to physically pull six conductors through a tight radius all matter too. Fill percentage is a maximum, not a target to design toward.",
    faqs: [
      {
        q: "Why does the maximum fill percentage change with conductor count?",
        a: "NEC Table 1 sets the allowable fill lower as conductor count increases — 53% for a single conductor, 31% for exactly two, 40% for three or more. This reflects how much free space is actually needed to physically pull conductors through a conduit without excessive friction or jamming, which changes as more conductors compete for the same round cross-section.",
      },
      {
        q: "Does this account for conductor jamming, not just area?",
        a: "No — this fill-percentage check is purely an area-based rule from NEC Chapter 9. A separate jam-ratio check (comparing conduit ID to conductor OD, most relevant for exactly three same-size conductors) covers physical jamming risk during the pull, which the Cable Pulling Tension calculator on this site addresses directly.",
      },
    ],
  },

  {
    slug: "cable-tray-fill-ladder-tray-power-mixed",
    groupId: "cables",
    calculatorHref: "/calculators/cable-tray-fill",
    calculatorName: "Cable Tray Fill",
    title: "Worked Example: NEC §392.22 Ladder Tray Fill for Mixed Power Cables",
    dek: "A 12-inch ladder tray loaded with smaller power cables only, checked against the area-based fill rule for cables under 4/0 AWG.",
    standard: "NEC §392.22",
    readTime: "8 min read",
    scenario: [
      { label: "Tray type", value: "Ladder tray" },
      { label: "Category", value: "Power/mixed cables" },
      { label: "Tray dimensions", value: "12 in wide x 4 in deep" },
      { label: "Cables (all smaller than 4/0 AWG)", value: "6 cables, 0.6 in diameter each" },
    ],
    steps: [
      {
        title: "Identify the applicable rule",
        body: "With no 4/0 AWG-or-larger cables present, NEC §392.22(A)(1)(b) applies: total cable cross-sectional area must not exceed a percentage of the tray's cross-sectional area, with usable depth capped at 3 inches for this category.",
        result: "Effective depth = min(4 in actual, 3 in cap) = 3 in",
      },
      {
        title: "Compute total cable area",
        equation: "Area = π/4 x d² x quantity, summed",
        substitution: "π/4 x 0.6² x 6",
        result: "Total cable area = 1.696 in²",
      },
      {
        title: "Compute the maximum allowed area",
        equation: "Max area = 38.9% x effective depth x width",
        substitution: "0.389 x 3 x 12",
        result: "Max area = 14.004 in²",
      },
      {
        title: "Compare",
        equation: "Total cable area ≤ max area?",
        substitution: "1.696 ≤ 14.004",
        result: "Passes with a large margin",
      },
    ],
    resultSummary: [
      { check: "Cable tray fill area", requirement: "≤ 14.004 in²", actual: "1.696 in²", pass: true },
    ],
    finalAnswer: "Six 0.6-inch power cables occupy only 1.696 in² against a 14.004 in² allowance in this 12-inch ladder tray — well within limits, leaving substantial room for future circuits.",
    keyInsight: "The 3-inch depth cap in the area formula means a deeper tray doesn't keep buying more allowed fill area indefinitely — beyond 3 inches of usable depth for this cable category, NEC caps the calculation at 3 inches regardless of the tray's actual physical depth, so oversizing tray depth has diminishing returns for fill capacity specifically (though it may still help with cable bend radius or future additions).",
    faqs: [
      {
        q: "Why is single-conductor cable handled completely differently?",
        a: "Single-conductor cables use a sum-of-diameters rule against tray width instead of an area-against-depth rule, and are not permitted in solid-bottom trays at all under §392.22(B) — the area-fill approach assumes multiconductor cables stacking somewhat randomly, which doesn't represent how single-conductor cables (often run in trefoil or flat formation for magnetic field cancellation) actually sit in a tray.",
      },
      {
        q: "What changes if some cables are 4/0 AWG or larger?",
        a: "Once any cable reaches 4/0 AWG or larger, NEC switches to a hybrid width-based rule combining a sum-of-diameters term for the large cables with an area term for the smaller ones — reflecting that large cables are assumed to lie in a single layer across the tray width rather than stacking, which the pure area-fill rule for small cables doesn't capture.",
      },
    ],
  },

  {
    slug: "cable-pulling-tension-90-degree-bend",
    groupId: "cables",
    calculatorHref: "/calculators/cable-pulling-tension",
    calculatorName: "Cable Pulling Tension",
    title: "Worked Example: Pulling Tension and Jam Ratio Through a 90° Conduit Bend",
    dek: "Tension and sidewall pressure both pass comfortably for this pull — but the jam ratio lands right inside the danger band, the one check that actually fails.",
    standard: "IEEE 1185",
    readTime: "10 min read",
    scenario: [
      { label: "Route", value: "50 ft straight, 50 ft straight, then a 90° bend of 2 ft radius" },
      { label: "Cable weight", value: "3.3 lb/ft" },
      { label: "Coefficient of friction", value: "0.35" },
      { label: "Conduit ID", value: "4 in" },
      { label: "Cable OD", value: "1.45 in" },
      { label: "Limits", value: "Max tension 5000 lbf, max sidewall pressure 300 lb/ft" },
    ],
    steps: [
      {
        title: "Accumulate tension across the first straight section",
        equation: "ΔT = f x w x L",
        substitution: "0.35 x 3.3 x 50",
        result: "T after segment 1 = 57.75 lbf",
      },
      {
        title: "Accumulate tension across the second straight section",
        substitution: "T = 57.75 + (0.35 x 3.3 x 50)",
        result: "T after segment 2 = 115.5 lbf",
      },
      {
        title: "Apply the capstan equation through the 90° bend",
        equation: "T_out = T_in x e^(f x θ)",
        substitution: "θ = 90° = 1.571 rad; T_out = 115.5 x e^(0.35 x 1.571)",
        result: "Final tension = 200.1 lbf",
      },
      {
        title: "Compute sidewall bearing pressure at the bend",
        equation: "SWBP = T_out / bend radius",
        substitution: "200.1 / 2",
        result: "SWBP = 100.1 lb/ft",
      },
      {
        title: "Compute the jam ratio",
        equation: "Jam ratio = conduit ID / cable OD",
        substitution: "4 / 1.45",
        result: "Jam ratio = 2.76",
        note: "Jam ratios between roughly 2.6 and 3.2 are the recognized danger band for three cables jamming against each other and the conduit wall.",
      },
    ],
    resultSummary: [
      { check: "Final pulling tension", requirement: "≤ 5000 lbf", actual: "200.1 lbf", pass: true },
      { check: "Sidewall bearing pressure", requirement: "≤ 300 lb/ft", actual: "100.1 lb/ft", pass: true },
      { check: "Jam ratio", requirement: "Outside 2.6–3.2 danger band", actual: "2.76 — inside the danger band", pass: false },
    ],
    finalAnswer: "Tension and sidewall pressure both pass with large margins, but the jam ratio of 2.76 falls squarely inside the recognized 2.6–3.2 danger band — this pull needs a different conduit size (or a different cable configuration) even though the tension math looks fine.",
    keyInsight: "A pull can pass every tension-based check and still be a bad pull. Jam ratio is a purely geometric risk (three similarly-sized round objects wedging against a circular boundary) that has nothing to do with how much force is being applied — which is exactly why it's checked as a completely separate, independent criterion rather than folded into the tension limit.",
    faqs: [
      {
        q: "Why is 2.6–3.2 specifically the danger zone for jam ratio?",
        a: "This range is where three same-size round cables lying inside a circular conduit can wedge tightly against each other and the conduit wall simultaneously — geometrically, ratios noticeably below 2.6 leave enough clearance to avoid a tight three-way wedge, and ratios above about 3.2 give the cables enough room to shift past each other rather than lock in place.",
      },
      {
        q: "What fixes a jam-ratio failure?",
        a: "Either increase the conduit size (pushing the ratio above roughly 3.2) or use a different cable configuration — for example, a single larger multiconductor cable instead of three separate single-conductor cables removes the three-cable jamming geometry entirely, since jam ratio specifically applies to the classic three-cable-in-round-conduit case.",
      },
    ],
  },

  {
    slug: "control-cable-sizing-hart-loop-length",
    groupId: "cables",
    calculatorHref: "/calculators/control-cable-sizing",
    calculatorName: "Control / Instrumentation Cable Sizing",
    title: "Worked Example: Maximum HART Cable Length from Capacitance Limits",
    dek: "An 800 m HART loop checked against the host system's total capacitance limit — and how much further the same cable could actually run before capacitance becomes the constraint.",
    standard: "General HART/4-20mA wiring practice",
    readTime: "7 min read",
    scenario: [
      { label: "Loop type", value: "HART" },
      { label: "Cable run length", value: "800 m" },
      { label: "Cable capacitance", value: "150 pF/m (typical shielded twisted-pair instrument cable)" },
      { label: "Host/barrier maximum system capacitance", value: "200 nF" },
    ],
    steps: [
      {
        title: "Compute total cable capacitance for the run",
        equation: "Total capacitance = (cable pF/m x length) / 1000",
        substitution: "(150 x 800) / 1000",
        result: "Total capacitance = 120 nF",
      },
      {
        title: "Compare against the host system's maximum",
        equation: "Total capacitance ≤ max system capacitance?",
        substitution: "120 nF ≤ 200 nF",
        result: "Passes, with 80 nF of headroom",
      },
      {
        title: "Back-calculate the maximum length this cable could reach",
        equation: "Max length = (max system capacitance x 1000) / cable pF/m",
        substitution: "(200 x 1000) / 150",
        result: "Max length = 1333 m",
      },
      {
        title: "Check the recommended minimum conductor size for this run length",
        result: "800 m ≤ 1500 m → #24 AWG is typically adequate, subject to confirming the loop's own voltage budget",
      },
    ],
    resultSummary: [
      { check: "Total cable capacitance vs. host limit", requirement: "≤ 200 nF", actual: "120 nF", pass: true },
      { check: "Conductor size for an 800 m run", requirement: "General guidance", actual: "#24 AWG typically adequate", pass: true },
    ],
    finalAnswer: "This 800 m HART run is well within its capacitance budget (120 nF against a 200 nF limit), with room to extend to roughly 1333 m before capacitance alone would force a shorter run or lower-capacitance cable.",
    keyInsight: "Capacitance limits and voltage-budget limits are two separate, independent constraints on HART/4-20mA loop length — this calculator checks capacitance, but the loop's voltage budget (transmitter headroom, barrier drop, wire resistance) is a completely separate check handled by the 4-20mA Current Loop calculator, and a real installation needs both to pass, not just one.",
    faqs: [
      {
        q: "Why does cable capacitance matter for a HART loop at all?",
        a: "HART superimposes a small AC communication signal on the 4-20mA DC loop current. Excess cable capacitance attenuates and distorts that AC signal (acting like a low-pass filter across the line), which can corrupt or block HART communication even though the underlying 4-20mA analog signal keeps working fine — this is why host systems and safety barriers publish a maximum total system capacitance rating specifically for HART compatibility.",
      },
      {
        q: "Is #24 AWG always fine for HART wiring?",
        a: "Only up to a point — this guidance reflects common industry practice, not a single universal standard figure, and #24 AWG's higher resistance per meter becomes a voltage-budget problem on longer runs well before it becomes a capacitance problem. Beyond roughly 1500 m, #20 AWG or larger is the usual recommendation, and any run's actual voltage budget should always be confirmed with the transmitter and barrier manufacturers' own documentation.",
      },
    ],
  },

  {
    slug: "overhead-line-voltage-regulation-11kv-feeder",
    groupId: "cables",
    calculatorHref: "/calculators/ohl-voltage-regulation",
    calculatorName: "Overhead Line Voltage Regulation",
    title: "Worked Example: Voltage Regulation on a 5 km, 11 kV Overhead Feeder",
    dek: "Using the conductor's own R and X per kilometre to find how much voltage a rural 11 kV feeder loses over 5 km of overhead line.",
    standard: "Standard short-line approximate voltage-drop formula",
    readTime: "8 min read",
    scenario: [
      { label: "Sending-end voltage", value: "11 kV line-to-line" },
      { label: "Load current", value: "100 A" },
      { label: "Power factor", value: "0.85 lagging" },
      { label: "Conductor resistance", value: "0.4 Ω/km" },
      { label: "Conductor reactance", value: "0.35 Ω/km" },
      { label: "Line length", value: "5 km" },
    ],
    steps: [
      {
        title: "Scale resistance and reactance to the full line length",
        equation: "R = r x L,   X = x x L",
        substitution: "R = 0.4 x 5 = 2.0 Ω,   X = 0.35 x 5 = 1.75 Ω",
        result: "R = 2.0 Ω, X = 1.75 Ω",
      },
      {
        title: "Find sin(phi) from the power factor",
        equation: "sin(phi) = √(1 - PF²)",
        substitution: "√(1 - 0.85²)",
        result: "sin(phi) = 0.527",
      },
      {
        title: "Apply the approximate three-phase line-line voltage drop formula",
        equation: "Vdrop = √3 x I x (R x PF + X x sin(phi))",
        substitution: "√3 x 100 x (2.0 x 0.85 + 1.75 x 0.527)",
        result: "Vdrop = 454.1 V",
      },
      {
        title: "Express as a percentage and find the receiving-end voltage",
        equation: "Reg% = Vdrop / Vsending x 100",
        substitution: "454.1 / 11,000 x 100",
        result: "Regulation = 4.13%, receiving-end voltage = 10.546 kV",
      },
    ],
    resultSummary: [
      { check: "Voltage regulation", requirement: "Typically ≤5% for a distribution feeder (project-specific)", actual: "4.13%", pass: true },
    ],
    finalAnswer: "Over 5 km, this feeder loses 454 V (4.13%), dropping from 11.000 kV to an effective 10.546 kV at the receiving end — inside a commonly used 5% distribution-feeder guideline, though the actual limit should always come from the relevant utility or grid code.",
    keyInsight: "Both resistance and reactance terms matter for overhead lines the way they usually don't for short LV cable runs — X is 1.75 Ω here, not far behind R's 2.0 Ω, because overhead conductors are spaced much further apart than cores in a cable, which increases per-km reactance substantially. Ignoring the reactance term (as some simplified LV-style formulas do) would understate the voltage drop on a line like this.",
    faqs: [
      {
        q: "Where do R and X per km actually come from?",
        a: "This calculator deliberately doesn't embed an ACSR/AAAC/AAC conductor table, to avoid the transcription risk of hand-copying dozens of conductor geometries — R and X per km are entered from the specific conductor's own datasheet (which itself depends on conductor size, stranding and phase spacing), which is the only way to get a value that's actually correct for the real installation rather than a generic placeholder.",
      },
      {
        q: "What's the difference between 'voltage drop' and 'regulation' here?",
        a: "In this calculator they describe the same underlying number from two angles: voltage drop is the absolute loss in volts, and regulation is that same loss expressed as a percentage of the sending-end voltage — regulation is the figure usually compared against a grid code or utility limit, since a fixed volt drop matters differently at 400 V than at 33 kV.",
      },
    ],
  },

  {
    slug: "distribution-line-losses-annual-energy-cost",
    groupId: "cables",
    calculatorHref: "/calculators/line-losses",
    calculatorName: "Distribution Line Technical Losses",
    title: "Worked Example: Estimating a Feeder's Annual I²R Loss Cost from Load Factor",
    dek: "Converting a feeder's peak load and load factor into an annual energy-loss estimate — without needing a full year of interval load data.",
    standard: "Loss-factor approximation (LSF ≈ 0.3·LF + 0.7·LF²)",
    readTime: "8 min read",
    scenario: [
      { label: "Peak load (individual, pre-diversity)", value: "500 kW" },
      { label: "Diversity factor", value: "1.2" },
      { label: "Load factor", value: "60%" },
      { label: "Line resistance (per phase)", value: "0.5 Ω" },
      { label: "System voltage", value: "11 kV" },
      { label: "Power factor", value: "0.9" },
      { label: "Energy cost", value: "$0.12 / kWh" },
    ],
    steps: [
      {
        title: "Apply the diversity factor to find coincident peak demand",
        equation: "Coincident peak = individual peak / diversity factor",
        substitution: "500 / 1.2",
        result: "Coincident peak = 416.7 kW",
      },
      {
        title: "Convert load factor to loss factor",
        body: "Loss factor estimates how loss (which scales with current squared) averages over time, given only the load factor (which is a simple linear average) — using the widely referenced empirical approximation.",
        equation: "LSF ≈ 0.3 x LF + 0.7 x LF²",
        substitution: "0.3 x 0.6 + 0.7 x 0.6²",
        result: "Loss factor = 0.432",
      },
      {
        title: "Find peak current and peak I²R loss",
        equation: "I = P / (√3 x V x PF)          Ploss = 3 x I² x R",
        substitution: "I = 416,667 / (1.732 x 11,000 x 0.9) = 24.3 A\nPloss = 3 x 24.3² x 0.5",
        result: "Peak current = 24.3 A, peak loss = 0.886 kW",
      },
      {
        title: "Scale peak loss to an annual energy total and cost",
        equation: "Annual loss = peak loss x loss factor x 8760 hours",
        substitution: "0.886 x 0.432 x 8760",
        result: "Annual energy loss = 3352 kWh -> annual cost = $402.20",
      },
    ],
    resultSummary: [
      { check: "Peak I²R loss", requirement: "n/a (informational)", actual: "0.886 kW", pass: true },
      { check: "Annual energy loss", requirement: "n/a (informational)", actual: "3352 kWh/year", pass: true },
      { check: "Annual loss cost", requirement: "n/a (informational)", actual: "$402.20/year", pass: true },
    ],
    finalAnswer: "This feeder's technical losses cost an estimated $402 per year — a small figure at 500 kW peak load, but the same method scales directly to much larger feeders where loss cost becomes a real factor in conductor upsizing decisions.",
    keyInsight: "Loss factor (0.432) is always less than load factor (0.6) whenever load factor is below 1.0, because loss scales with the square of current — a feeder that runs at partial load most of the time wastes proportionally less energy to resistive loss than one that runs flat-out constantly, even at the same average load factor.",
    faqs: [
      {
        q: "Why not just use load factor directly to estimate energy loss?",
        a: "Because I²R loss is proportional to the square of current, not current itself, so simply averaging loss using the linear load factor would overstate annual losses whenever load varies over time — the loss-factor approximation exists specifically to correct for this squaring effect without requiring a full year of interval (load-duration) data, which most sites don't have readily available.",
      },
      {
        q: "How accurate is the 0.3·LF + 0.7·LF² approximation?",
        a: "It's a widely cited empirical fit, not an exact relationship — the true loss factor for a given load factor depends on the actual shape of the load curve over time, which this approximation doesn't know. Where real interval/AMI data is available, computing loss factor directly from the actual load curve will always be more accurate than this formula.",
      },
    ],
  },
];
