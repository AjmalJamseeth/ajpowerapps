// Short written guides shown under the most-searched calculators. They give
// search engines (and readers) real text, a reference table and answers to
// common questions, matching the queries people type in Search Console.
// Every number here is either a standard's published value or computed from
// the same formula the calculator uses.

export interface CalcArticle {
  heading: string;
  paragraphs: string[];
  formula?: { label: string; text: string }[];
  table?: { caption: string; headers: string[]; rows: string[][]; note?: string };
  faqs: { q: string; a: string }[];
}

export const CALC_ARTICLES: Record<string, CalcArticle> = {
  "/calculators/iec-61850-scl-editor": {
    heading: "IEC 61850 SCL files explained",
    paragraphs: [
      "IEC 61850 describes a whole substation automation system in XML files written in SCL, the System Configuration description Language defined in IEC 61850-6. The same language describes what an IED can do, how the substation is built, which IEDs exchange which signals, and the network addresses they use. Different file extensions mark different stages of the engineering process.",
      "In a typical project the system integrator imports each manufacturer's ICD file into a system configuration tool, adds the substation structure and the communication settings, and links the GOOSE, sampled-value and report data flows. The result is the SCD file for the whole substation. Each manufacturer's IED configuration tool then takes the SCD and produces the CID file that is loaded into its own IED.",
      "SCL Studio lets you open any of these files to review or correct them without the vendor tools: check that every subscribed signal has a publisher, that GOOSE and sampled-value APPIDs and MAC addresses are unique, and that IP addresses sit in the right subnet, then export the corrected file.",
    ],
    table: {
      caption: "SCL file types (IEC 61850-6)",
      headers: ["Extension", "Name", "What it contains", "Produced by"],
      rows: [
        ["SSD", "System Specification Description", "Single-line structure and the functions (logical nodes) required, before IEDs are chosen", "System specification tool"],
        ["ICD", "IED Capability Description", "What one IED type can do: its data model, services and a default configuration", "IED manufacturer's tool"],
        ["IID", "Instantiated IED Description (Ed. 2)", "One configured IED instance, returned to the system tool for integration", "IED configuration tool"],
        ["SCD", "Substation Configuration Description", "The complete system: substation, all IEDs, communication, data sets, GOOSE, SV and reports", "System configuration tool"],
        ["CID", "Configured IED Description", "The configuration for one IED, extracted from the SCD and loaded into the device", "IED configuration tool"],
        ["SED", "System Exchange Description (Ed. 2)", "Data exchanged between two projects, for example signals between two substations", "System configuration tool"],
      ],
      note: "All of them use the same SCL schema; the extension tells you which parts are expected to be present.",
    },
    faqs: [
      { q: "How do I open an SCD file?", a: "Open this page, choose Open file and select the .scd file. It is read in your browser and never uploaded. The overview shows the IEDs, logical devices and data flows, and the validation panel lists any errors and warnings." },
      { q: "What is the difference between ICD, CID and SCD files?", a: "An ICD describes what an IED type can do. The SCD describes the whole substation with all IEDs configured and linked. A CID is the part of the SCD for one IED, in the form that IED loads." },
      { q: "Can I edit a CID file and load it straight into the relay?", a: "SCL Studio can edit and export a CID, but always import it into the manufacturer's configuration tool before sending it to the IED. That tool checks device-specific limits, and the GOOSE and sampled-value links should be tested on site." },
      { q: "Which IEC 61850 editions are supported?", a: "Edition 1, Edition 2 and Edition 2.1 SCL files. Some older IEDs that only accept Edition 1 may reject a CID that contains Edition 2 attributes." },
    ],
  },

  "/calculators/max-demand": {
    heading: "How to calculate maximum demand",
    paragraphs: [
      "Maximum demand is the highest load an installation is expected to draw at one time. It is always lower than the total connected load, because lights, sockets, motors and cooking equipment never all run at full rating together. Sizing the incoming cable, main breaker and transformer on maximum demand instead of connected load avoids oversized, more expensive equipment.",
      "The load-category method multiplies the connected load of each category by a demand factor, adds the results, and converts the total to a design current. The demand factors below are typical design values; local codes and utilities (for example the IET On-Site Guide in the UK, DEWA or ADDC regulations in the UAE, or NEC Article 220 in the US) set their own figures, which take priority.",
    ],
    formula: [
      { label: "Demand per category", text: "Demand (kW) = Connected load (kW) × Demand factor" },
      { label: "Maximum demand", text: "MD (kW) = Σ Demand of all categories" },
      { label: "Three-phase design current", text: "I = MD × 1000 / (√3 × V × PF)" },
      { label: "Single-phase design current", text: "I = MD × 1000 / (V × PF)" },
    ],
    table: {
      caption: "Maximum demand table — typical demand factors by load category",
      headers: ["Load category", "Typical demand factor", "Notes"],
      rows: [
        ["Lighting", "90% (70–100%)", "Use 100% for small sites and emergency lighting"],
        ["Socket outlets", "70% (40–80%)", "Lower for large numbers of general-purpose sockets"],
        ["HVAC / air conditioning", "80% (70–100%)", "Close to 100% at peak cooling in hot climates"],
        ["Heating / water heating", "100%", "Thermostatic loads draw full rating when on"],
        ["Motors (general)", "75% (50–100%)", "Continuous process motors 90–100%"],
        ["Cooking (commercial)", "50% (30–70%)", "Check local tables for large kitchens"],
        ["EV charging", "100%", "IEC 60364-7-722: no reduction without a load management system"],
      ],
      note: "Indicative values for preliminary design. NEC 220.42 (dwelling lighting) is an example of a code table: first 3,000 VA at 100%, 3,001–120,000 VA at 35%, remainder at 25%.",
    },
    faqs: [
      { q: "What is the difference between demand factor and diversity factor?", a: "Demand factor is maximum demand divided by connected load for one group (always 1 or less). Diversity factor is the sum of the individual maximum demands divided by the maximum demand of the whole system (1 or more), because the groups peak at different times." },
      { q: "How do I choose the main breaker from maximum demand?", a: "Work out the design current from maximum demand, then pick the next standard breaker rating at or above it, and check the incoming cable can carry that rating after derating. For a 416 kW demand at 415 V and 0.9 PF the current is about 643 A, so an 800 A breaker is the next standard size." },
      { q: "Should I add spare capacity?", a: "Yes. A future growth margin of 15–25% is common for the transformer and main switchboard. The calculator's advanced section adds a growth margin and site-level diversity for several boards." },
    ],
  },

  "/calculators/idmt": {
    heading: "IDMT relay trip time and grading",
    paragraphs: [
      "An IDMT (inverse definite minimum time) overcurrent relay trips faster as fault current rises. Its operating time depends on the curve type, the pickup current setting (plug setting) and the time multiplier setting (TMS, or time dial on IEEE curves).",
      "For selectivity, the upstream relay must be slower than the downstream relay by a grading margin, typically 0.3–0.4 s for electromechanical relays and 0.2–0.3 s for numerical relays, at every fault current both relays can see. This calculator checks the margin across the whole fault-current range, not only at one point, because the curves can converge at high current.",
    ],
    formula: [
      { label: "IEC 60255-151", text: "t = TMS × k / ((I/Is)^α − 1)" },
      { label: "IEEE C37.112", text: "t = TD × (A / ((I/Is)^p − 1) + B)" },
      { label: "Plug setting multiplier", text: "PSM = Fault current at the relay / Pickup current" },
    ],
    table: {
      caption: "IDMT curve constants",
      headers: ["Standard", "Curve", "k or A", "α or p", "B"],
      rows: [
        ["IEC 60255-151", "Standard Inverse (SI)", "0.14", "0.02", "—"],
        ["IEC 60255-151", "Very Inverse (VI)", "13.5", "1", "—"],
        ["IEC 60255-151", "Extremely Inverse (EI)", "80", "2", "—"],
        ["IEC 60255-151", "Long-Time Inverse (LTI)", "120", "1", "—"],
        ["IEEE C37.112", "Moderately Inverse (MI)", "0.0515", "0.02", "0.114"],
        ["IEEE C37.112", "Very Inverse (VI)", "19.61", "2", "0.491"],
        ["IEEE C37.112", "Extremely Inverse (EI)", "28.2", "2", "0.1217"],
      ],
      note: "Example: IEC SI, TMS 0.1, PSM 10 → t = 0.1 × 0.14 / (10^0.02 − 1) ≈ 0.30 s.",
    },
    faqs: [
      { q: "What grading margin should I use between IDMT relays?", a: "A common figure is 0.3–0.4 s. It covers the downstream breaker opening time, relay overshoot and timing errors, and CT errors. Numerical relays with fast breakers often allow 0.2–0.25 s." },
      { q: "Why check grading over a range of fault currents?", a: "Two curves of different shape or setting can be well apart at low current and almost touch at high current. Checking only one current can miss the point where the margin is smallest." },
      { q: "What is the difference between TMS and time dial?", a: "Both scale the curve vertically. IEC curves use a time multiplier setting (typically 0.025–1.2); IEEE curves use a time dial (typically 0.5–15) in a formula with an added constant B." },
    ],
  },

  "/calculators/cable-tray-fill": {
    heading: "NEC cable tray fill rules (392.22)",
    paragraphs: [
      "NEC 392.22 limits how many cables can go in a tray so they stay cool and can be installed without damage. The rule depends on the tray type (ladder or ventilated trough versus solid bottom) and the cable type (multiconductor power and lighting, control and signal, or single conductors).",
      "For multiconductor cables smaller than 4/0 AWG, the total cable cross-sectional area must not exceed the allowable area in Table 392.22(A). Cables 4/0 AWG and larger are laid in a single layer and limited by the sum of their diameters. When both are mixed, the allowable area for the small cables is reduced by 1.2 in² per inch of large-cable diameter (ladder tray).",
    ],
    table: {
      caption: "NEC Table 392.22(A) — allowable fill area, multiconductor cables smaller than 4/0 AWG",
      headers: ["Inside tray width (in)", "Ladder / ventilated trough (in²)", "Solid bottom (in²)"],
      rows: [
        ["6", "7.0", "5.5"],
        ["9", "10.5", "8.0"],
        ["12", "14.0", "11.0"],
        ["18", "21.0", "16.5"],
        ["24", "28.0", "22.0"],
        ["30", "35.0", "27.5"],
        ["36", "42.0", "33.0"],
      ],
      note: "With 4/0 AWG and larger cables in the same tray: allowable area = Column 1 value − 1.2 × Sd (ladder) or Column 3 value − 1.0 × Sd (solid bottom), where Sd is the sum of the large-cable diameters in inches. Outside the US, a 40–50% area fill is common practice.",
    },
    faqs: [
      { q: "What is the maximum fill for a cable tray?", a: "Under the NEC it depends on cable type: for small multiconductor power cables in a ladder tray it is the Table 392.22(A) area (about 7 in² per 6 in of width); for control and signal cables only, 50% of the tray's interior area (40% in solid-bottom tray) for trays up to 6 in deep." },
      { q: "Can single-conductor cables go in a solid-bottom tray?", a: "NEC 392.22(B) gives fill rules for single conductors in ladder, ventilated trough and ventilated channel trays only; single conductors must be 1/0 AWG or larger (392.10(B)(1))." },
    ],
  },

  "/calculators/motor-torque": {
    heading: "kW to torque and HP to torque",
    paragraphs: [
      "Shaft torque follows directly from power and speed. For SI units, torque in newton-metres equals 9,550 times the power in kilowatts divided by the speed in rpm. For US units, torque in pound-feet equals 5,252 times horsepower divided by rpm.",
      "The same relation converts watts to torque (divide watts by 1,000 first) and works for engines as well as motors. Use the motor's rated speed from the nameplate for full-load torque; starting and breakdown torque are multiples of it given by the manufacturer.",
    ],
    formula: [
      { label: "SI", text: "T (N·m) = 9550 × P (kW) / n (rpm)" },
      { label: "US", text: "T (lb·ft) = 5252 × P (hp) / n (rpm)" },
      { label: "Conversion", text: "1 lb·ft = 1.3558 N·m; 1 hp = 0.7457 kW" },
    ],
    table: {
      caption: "Motor torque table — full-load torque (N·m) by power and speed",
      headers: ["Power (kW)", "2-pole, 2900 rpm", "4-pole, 1450 rpm", "6-pole, 960 rpm"],
      rows: [
        ["0.75", "2.5", "4.9", "7.5"],
        ["1.5", "4.9", "9.9", "14.9"],
        ["2.2", "7.2", "14.5", "21.9"],
        ["4", "13.2", "26.3", "39.8"],
        ["5.5", "18.1", "36.2", "54.7"],
        ["7.5", "24.7", "49.4", "74.6"],
        ["11", "36.2", "72.4", "109.4"],
        ["15", "49.4", "98.8", "149.2"],
        ["22", "72.4", "144.9", "218.9"],
        ["30", "98.8", "197.6", "298.4"],
        ["37", "121.8", "243.7", "368.1"],
        ["45", "148.2", "296.4", "447.7"],
        ["55", "181.1", "362.2", "547.1"],
        ["75", "247.0", "494.0", "746.1"],
        ["90", "296.4", "592.8", "895.3"],
        ["110", "362.2", "724.5", "1094.3"],
        ["132", "434.7", "869.4", "1313.1"],
        ["160", "526.9", "1053.8", "1591.7"],
        ["200", "658.6", "1317.2", "1989.6"],
      ],
      note: "Computed with T = 9550 × P / n at the speeds shown; use the nameplate speed for an exact value.",
    },
    faqs: [
      { q: "How do I convert kW to N·m?", a: "Multiply kW by 9,550 and divide by the speed in rpm. A 37 kW motor at 1,480 rpm gives 9550 × 37 / 1480 ≈ 239 N·m." },
      { q: "Where does the 9,550 come from?", a: "Power = torque × angular speed. With power in watts, speed in rpm (ω = 2πn/60) and the kW-to-W factor of 1,000: 60,000 / (2π) ≈ 9,549, rounded to 9,550." },
    ],
  },

  "/calculators/rolling-sphere": {
    heading: "Rolling sphere method for lightning protection",
    paragraphs: [
      "The rolling sphere method (IEC 62305-3, NFPA 780) finds the parts of a structure that a lightning leader could reach. An imaginary sphere is rolled over the structure and the ground; every point the sphere touches needs protection, and points it cannot touch are protected by the air terminals.",
      "The sphere radius depends on the lightning protection level: 20 m for Class I, 30 m for Class II, 45 m for Class III and 60 m for Class IV. For a single vertical mast of height h no greater than the radius R, the protected radius at ground level is √(2Rh − h²).",
    ],
    formula: [{ label: "Protected radius at ground level", text: "r = √(2 × R × h − h²), valid for h ≤ R" }],
    table: {
      caption: "Ground-level protection radius (m) of a single mast",
      headers: ["Mast height (m)", "Class I (R = 20 m)", "Class II (R = 30 m)", "Class III (R = 45 m)", "Class IV (R = 60 m)"],
      rows: [
        ["5", "13.2", "16.6", "20.6", "24.0"],
        ["10", "17.3", "22.4", "28.3", "33.2"],
        ["15", "19.4", "26.0", "33.5", "39.7"],
        ["20", "20.0", "28.3", "37.4", "44.7"],
      ],
      note: "IEC 62305-3 also sets mesh sizes (5, 10, 15, 20 m) and typical down-conductor spacing (10, 10, 15, 20 m) for Class I to IV.",
    },
    faqs: [
      { q: "Which LPS class should I use?", a: "The class comes from an IEC 62305-2 risk assessment. The Lightning Protection Risk Assessment calculator on this site works out the minimum class needed to bring the risk below the tolerable value." },
      { q: "Why does a taller mast not always protect more?", a: "Once the mast is taller than the sphere radius, the sphere can touch its side, and the simple single-mast formula no longer applies. Several shorter masts or a mesh are then used." },
    ],
  },

  "/calculators/power-factor-correction": {
    heading: "Power factor correction: kVAr and capacitor size",
    paragraphs: [
      "Capacitors supply reactive power locally, so less reactive current flows from the supply. The kVAr needed is the active power times the difference between the tangents of the existing and target power-factor angles.",
      "Capacitors are usually rated above the system voltage (for example 440 V or 480 V units on a 400–415 V system) for a longer life. Because output varies with the square of voltage, the nameplate rating must be scaled up by (Vrated / Vsystem)² to deliver the required kVAr. On networks with harmonics, detuned banks with series reactors (typically 5.67%, 7% or 14%) avoid resonance.",
    ],
    formula: [
      { label: "Required compensation", text: "Qc (kVAr) = P (kW) × (tan φ1 − tan φ2)" },
      { label: "Capacitance per phase (delta)", text: "C = Qc / (3 × 2π × f × V²)" },
      { label: "Nameplate rating", text: "Q rated = Qc × (V rated / V system)²" },
    ],
    table: {
      caption: "Power factor correction table — kVAr required per kW of load",
      headers: ["Existing PF", "To 0.90", "To 0.95", "To 0.98", "To 1.00"],
      rows: [
        ["0.60", "0.849", "1.005", "1.130", "1.333"],
        ["0.65", "0.685", "0.840", "0.966", "1.169"],
        ["0.70", "0.536", "0.692", "0.817", "1.020"],
        ["0.75", "0.398", "0.553", "0.679", "0.882"],
        ["0.80", "0.266", "0.421", "0.547", "0.750"],
        ["0.85", "0.135", "0.291", "0.417", "0.620"],
        ["0.90", "—", "0.156", "0.281", "0.484"],
      ],
      note: "Multiply the factor by the load in kW. Example: 500 kW from 0.75 to 0.95 → 500 × 0.553 ≈ 277 kVAr.",
    },
    faqs: [
      { q: "How many kVAr do I need to improve power factor?", a: "Multiply the load in kW by the factor in the table for your existing and target power factor. For 500 kW from 0.75 to 0.95 that is about 277 kVAr." },
      { q: "When is a detuned capacitor bank needed?", a: "When the network carries significant harmonics from drives, UPS or LED lighting, or when the resonance order √(Ssc / Qc) falls near the 5th or 7th harmonic. The calculator's advanced section checks the resonance order." },
    ],
  },

  "/calculators/earthing": {
    heading: "Earthing grid design to IEEE 80",
    paragraphs: [
      "An earthing (grounding) grid must keep the voltages a person can touch or step across below safe limits during an earth fault. A low grid resistance alone is not enough: the mesh (touch) and step voltages depend on conductor spacing, burial depth, rods and the surface layer.",
      "IEEE 80 sets the tolerable touch and step voltages from body weight, fault duration and surface resistivity, then compares them with the mesh and step voltages the grid produces. A crushed-rock surface layer, closer mesh spacing, more rods and faster fault clearing are the usual ways to pass.",
    ],
    formula: [
      { label: "Tolerable touch voltage (70 kg)", text: "E touch = (1000 + 1.5 × Cs × ρs) × 0.157 / √ts" },
      { label: "Tolerable step voltage (70 kg)", text: "E step = (1000 + 6 × Cs × ρs) × 0.157 / √ts" },
      { label: "Grid resistance (Sverak)", text: "Rg = ρ × [1/LT + 1/√(20A) × (1 + 1/(1 + h√(20/A)))]" },
      { label: "Mesh voltage", text: "Em = ρ × IG × Km × Ki / LM" },
    ],
    table: {
      caption: "Typical soil resistivity (IEEE 80)",
      headers: ["Soil type", "Typical resistivity (Ω·m)"],
      rows: [
        ["Wet organic soil", "10"],
        ["Moist soil", "100"],
        ["Dry soil", "1,000"],
        ["Bedrock", "10,000"],
      ],
      note: "Always measure soil resistivity on site (Wenner four-pin method); values vary widely with moisture and temperature.",
    },
    faqs: [
      { q: "What is a good earthing resistance?", a: "There is no single value. Substations usually aim for 1 Ω or less, but the real test is whether touch and step voltages are within the IEEE 80 limits. For a single rod at a building, NEC 250.53(A)(2) waives a second rod if one rod measures 25 Ω or less." },
      { q: "Why does a surface layer help so much?", a: "A high-resistivity layer such as crushed rock (about 3,000 Ω·m or more) adds resistance in series with the person's feet, so a much higher touch and step voltage becomes tolerable." },
    ],
  },

  "/calculators/arc-flash": {
    heading: "Arc flash incident energy and PPE",
    paragraphs: [
      "Incident energy is the heat energy a worker's skin or clothing receives at a working distance during an arc flash, measured in cal/cm². It rises with fault current and, most strongly, with arc duration, so faster protection is the most effective way to reduce it.",
      "IEEE 1584-2018 is the current calculation method for 208 V to 15 kV, with electrode configuration and enclosure size. IEEE 1584-2002 and the Ralph Lee method are also provided for comparison and for voltages outside the 2018 model's range. The arc-flash boundary is the distance at which the energy falls to 1.2 cal/cm², the onset of a second-degree burn.",
    ],
    table: {
      caption: "NFPA 70E arc-rated clothing levels",
      headers: ["Indicative PPE category", "Minimum arc rating"],
      rows: [
        ["1", "4 cal/cm²"],
        ["2", "8 cal/cm²"],
        ["3", "25 cal/cm²"],
        ["4", "40 cal/cm²"],
      ],
      note: "NFPA 70E assigns PPE categories through its table method. With a calculated incident energy, choose clothing with an arc rating at least equal to that energy, and label equipment with either the energy or the category, not both (130.5(H)). Above 40 cal/cm² energized work should be avoided.",
    },
    faqs: [
      { q: "How can arc flash incident energy be reduced?", a: "Shorten the clearing time (instantaneous or zone-selective interlocking, maintenance switches, arc-flash relays), reduce fault current with current-limiting fuses, or increase working distance with remote racking and operation." },
      { q: "Is this calculator a full arc flash study?", a: "No. It calculates one point. A study models the whole network, every operating mode and the real protection settings. The Arc Flash Study calculator on this site does a network-wide IEEE 1584-2018 study with labels." },
    ],
  },

  "/calculators/cable-sizing": {
    heading: "Cable sizing and voltage drop to IEC 60364-5-52",
    paragraphs: [
      "A cable must carry the design current after derating, keep voltage drop within limits, and withstand the fault current until the protection clears it. Each check can govern: short heavily loaded runs are usually limited by current rating, long runs by voltage drop.",
      "Derating factors cover ambient temperature (Table B.52.14), soil temperature and resistivity for buried cables, grouping with other circuits (Table B.52.17) and triplen harmonics in the neutral (Annex E). Voltage drop uses the conductor's resistance and reactance at operating temperature.",
    ],
    formula: [
      { label: "Current rating check", text: "Iz = It × Ca × Cg × Ci ≥ Ib" },
      { label: "Three-phase voltage drop", text: "ΔV = √3 × Ib × L × (r cos φ + x sin φ)" },
      { label: "Single-phase voltage drop", text: "ΔV = 2 × Ib × L × (r cos φ + x sin φ)" },
      { label: "Short-circuit withstand", text: "S ≥ I × √t / k" },
    ],
    table: {
      caption: "Voltage drop limits — IEC 60364-5-52 Annex G",
      headers: ["Supply", "Lighting", "Other uses"],
      rows: [
        ["Public LV distribution network", "3%", "5%"],
        ["Private LV supply (own transformer)", "6%", "8%"],
      ],
      note: "Single-phase mV/A/m tables give the drop for both conductors; halve them per conductor before applying the √3 factor for three-phase circuits.",
    },
    faqs: [
      { q: "What is the k factor for copper cable?", a: "IEC 60364-5-54 gives k = 115 for copper with PVC insulation and 143 for XLPE or EPR (aluminium: 76 and 94)." },
      { q: "Does voltage drop or ampacity decide the cable size?", a: "Whichever needs the larger cable. The calculator checks both, plus short-circuit withstand, and selects the smallest size that passes all of them." },
    ],
  },

  "/calculators/iec-60909": {
    heading: "Short-circuit calculation to IEC 60909",
    paragraphs: [
      "IEC 60909-0 calculates short-circuit currents with an equivalent voltage source c·Un/√3 at the fault location, using the impedances of the network feeder, transformers, generators, motors and cables. The maximum current (cmax, motors included) sizes switchgear; the minimum current (cmin, motors excluded, cables at 80 °C) checks that protection will operate.",
      "From the initial current Ik″ the standard derives the peak current ip (for making capacity and mechanical forces), the breaking current Ib (for breaker interrupting rating) and the thermal equivalent current Ith (for short-time withstand).",
    ],
    formula: [
      { label: "Initial symmetrical current", text: "Ik″ = c × Un / (√3 × |Zk|)" },
      { label: "Peak current", text: "ip = κ × √2 × Ik″, κ = 1.02 + 0.98 × e^(−3R/X)" },
      { label: "Transformer correction", text: "KT = 0.95 × cmax / (1 + 0.6 × xT)" },
    ],
    table: {
      caption: "Voltage factor c — IEC 60909-0 Table 1",
      headers: ["Nominal voltage", "cmax", "cmin"],
      rows: [
        ["100 V – 1 kV (+6% tolerance)", "1.05", "0.95"],
        ["100 V – 1 kV (+10% tolerance)", "1.10", "0.95"],
        ["Above 1 kV", "1.10", "1.00"],
      ],
    },
    faqs: [
      { q: "What is the difference between Ik″, Ib and ip?", a: "Ik″ is the initial symmetrical RMS current. Ib is the RMS current at the moment the breaker contacts separate, lower near generators because their contribution decays. ip is the highest instantaneous value of the first peak, including the DC offset." },
      { q: "Do motors contribute to short-circuit current?", a: "Yes. Induction motors feed the fault for the first few cycles, so IEC 60909 includes them in the maximum short-circuit current." },
    ],
  },

  "/calculators/wire-ampacity-nec": {
    heading: "NEC wire size and ampacity",
    paragraphs: [
      "NEC Table 310.16 gives conductor ampacity at 30 °C ambient with no more than three current-carrying conductors. The value is then corrected for ambient temperature (310.15(B)) and adjusted for more than three conductors in a raceway or cable (310.15(C)(1)).",
      "The usable ampacity can never exceed the rating of the terminals (usually 60 °C for 100 A and below, 75 °C above), and NEC 240.4(D) limits the overcurrent device for 14, 12 and 10 AWG copper to 15, 20 and 30 A.",
    ],
    table: {
      caption: "Common copper conductor ampacities — NEC Table 310.16 (75 °C column)",
      headers: ["Size (AWG/kcmil)", "Ampacity (A)", "Max OCPD per 240.4(D)"],
      rows: [
        ["14", "20", "15 A"],
        ["12", "25", "20 A"],
        ["10", "35", "30 A"],
        ["8", "50", "—"],
        ["6", "65", "—"],
        ["4", "85", "—"],
        ["3", "100", "—"],
        ["2", "115", "—"],
        ["1", "130", "—"],
        ["1/0", "150", "—"],
        ["2/0", "175", "—"],
        ["3/0", "200", "—"],
        ["4/0", "230", "—"],
      ],
    },
    faqs: [
      { q: "Why can't I put a 20 A breaker on 14 AWG wire?", a: "NEC 240.4(D) limits 14 AWG copper to 15 A overcurrent protection in general circuits, even though the 75 °C table ampacity is 20 A. Motor and some special circuits have their own rules." },
      { q: "Can I use the 90 °C column?", a: "Yes, for applying the correction and adjustment factors, but the final ampacity is capped at the value in the terminal temperature column." },
    ],
  },

  "/calculators/conduit-fill": {
    heading: "NEC conduit fill",
    paragraphs: [
      "NEC Chapter 9 Table 1 limits conduit fill so conductors can be pulled without damage and stay cool. The limit depends on the number of conductors: 53% for one, 31% for two and 40% for three or more. Two conductors get the lowest figure because two round cables side by side can jam across the conduit in a bend.",
      "Conductor areas come from Table 5 (by insulation type and size) and conduit internal areas from Table 4 (by conduit type and trade size). The calculator adds the conductor areas and suggests the smallest trade size that complies.",
    ],
    table: {
      caption: "NEC Chapter 9 Table 1 — maximum conduit fill",
      headers: ["Number of conductors", "Maximum fill"],
      rows: [
        ["1", "53%"],
        ["2", "31%"],
        ["3 or more", "40%"],
      ],
      note: "Example: six 12 AWG THHN (0.0133 in² each) = 0.0798 in², 15% of a 3/4 in EMT (0.533 in²).",
    },
    faqs: [
      { q: "How many 12 AWG THHN wires fit in 3/4 inch EMT?", a: "40% of 0.533 in² is 0.213 in²; divided by 0.0133 in² per conductor that is 16 conductors." },
      { q: "Does the ground wire count toward conduit fill?", a: "Yes. Equipment grounding conductors are included in the fill calculation (NEC Chapter 9 Note 3)." },
    ],
  },

  "/calculators/elevator-demand": {
    heading: "Elevator electrical demand",
    paragraphs: [
      "An elevator motor lifts the difference between the car load and the counterweight. With a counterweight balancing 40–50% of the rated load, the motor power is the unbalanced mass times g times speed, divided by the drive efficiency.",
      "When several elevators share a feeder, NEC 620.14 allows a demand factor because they rarely all start and run at full load together.",
    ],
    formula: [{ label: "Motor power", text: "P (kW) = (1 − balance factor) × rated load (kg) × 9.81 × speed (m/s) / (1000 × efficiency)" }],
    table: {
      caption: "NEC Table 620.14 — feeder demand factors for elevators",
      headers: ["Number of elevators on one feeder", "Demand factor"],
      rows: [["1", "1.00"], ["2", "0.95"], ["3", "0.90"], ["4", "0.85"], ["5", "0.82"], ["6", "0.79"], ["7", "0.77"], ["8", "0.75"], ["9", "0.73"], ["10 or more", "0.72"]],
    },
    faqs: [{ q: "What balance factor should I use?", a: "Traction elevators are usually counterweighted to 40–50% of rated load. Use the manufacturer's value when known." }],
  },

  "/calculators/vfd-sizing": {
    heading: "How to size a VFD",
    paragraphs: [
      "Size a variable frequency drive on the motor's full-load current, not its kW, because drive ratings are thermal current limits. Choose the duty rating to match the load: variable torque (pumps and fans, about 110% overload for 60 s) or constant torque (conveyors, hoists, positive-displacement pumps, about 150% overload for 60 s).",
      "Derate the drive above about 40 °C ambient and 1,000 m altitude, and allow a margin for motor nameplate tolerance and future load. The calculator gives the minimum drive current and checks a candidate drive's current and voltage.",
    ],
    faqs: [
      { q: "Can I size a VFD by kW?", a: "Only as a first guess. Motors of the same kW can have different full-load currents, especially at low speed or high pole numbers, so always check the drive's output current against the motor nameplate FLA." },
      { q: "How much should a VFD be derated for temperature and altitude?", a: "A common screening figure is about 1% per °C above 40 °C and 1% per 100 m above 1,000 m, but drive manufacturers publish their own curves, which take priority." },
    ],
  },
};
