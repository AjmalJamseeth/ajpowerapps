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
  /** Step-by-step "how to use" guide, shown first on the full applications (Engineering Suites). */
  howTo?: { title: string; steps: { title: string; text: string }[] };
}

export const CALC_ARTICLES: Record<string, CalcArticle> = {
  "/calculators/dga-analyzer": {
    howTo: {
      title: "How to use the DGA Analyzer",
      steps: [
        { title: "Start with the demonstration fleet", text: "Six transformers with sample histories are loaded the first time you open the analyzer. The Fleet dashboard ranks them by condition: TX-204, TX-101 and its tap changer TX-101-LTC are critical, TX-118 and TX-225 are at caution, and TX-330 is normal. Click any row to open its diagnosis." },
        { title: "Read the diagnosis of one transformer", text: "Asset diagnosis shows the most probable fault with a confidence, the other candidates, the probable physical location and recommended actions, then every method side by side: IEEE C57.104-2019 status, IEC 60599 ratios, Rogers, Duval Triangles 1, 4 and 5 and Pentagons 1 and 2, plus CO2/CO. Click a result in the fleet table to jump to the Interpretation Guide for that method." },
        { title: "Check the trend, not just the latest sample", text: "The gas-trend charts, the TDCG history and the gassing events show how fast each gas is rising. A gassing event opens when the IEEE rate-of-rise limit is exceeded on two consecutive samples (one for acetylene), so a developing fault is caught before it crosses an absolute threshold." },
        { title: "Add your own transformers and samples", text: "Use ≡ Manage assets to add a transformer (manufacturer, year, voltage, MVA, cooling, oil type and conservator or sealed design all affect the thresholds). Add samples with + Add DGA sample, or use ↓ Import lab data to read the gas values from a laboratory PDF and check them before saving." },
        { title: "Report and back up", text: "Generate PDF report gives a printable diagnosis for one transformer; Export CSV gives the fleet table. Your fleet is stored only in your browser, so use Backup data regularly and Restore data on another computer." },
      ],
    },
    heading: "Dissolved gas analysis (DGA) of transformer oil",
    paragraphs: [
      "Faults inside an oil-filled transformer break down the oil and the paper insulation and release gases that dissolve in the oil. Which gases appear, and in what proportions, points to the type of fault: partial discharge produces mainly hydrogen, arcing produces acetylene, and overheating produces methane, ethane and ethylene in proportions that rise with temperature. Carbon monoxide and carbon dioxide indicate that the paper is involved.",
      "IEC 60599 interprets a sample with three gas ratios and assigns one of six fault types. The Duval Triangle method plots the relative amounts of methane, ethylene and acetylene and is used alongside it because it always gives an answer. IEEE C57.104-2019 decides whether the gas levels and their rate of increase are high enough to act on.",
    ],
    formula: [
      { label: "IEC 60599 ratios", text: "R1 = C2H2 / C2H4,  R2 = CH4 / H2,  R3 = C2H4 / C2H6" },
      { label: "Duval Triangle 1 coordinates", text: "%CH4 = CH4 / (CH4 + C2H4 + C2H2) × 100, and likewise for C2H4 and C2H2" },
    ],
    table: {
      caption: "IEC 60599 fault types and gas ratios",
      headers: ["Fault", "Meaning", "C2H2/C2H4", "CH4/H2", "C2H4/C2H6"],
      rows: [
        ["PD", "Partial discharges", "NS", "< 0.1", "< 0.2"],
        ["D1", "Discharges of low energy", "> 1", "0.1 – 0.5", "> 1"],
        ["D2", "Discharges of high energy", "0.6 – 2.5", "0.1 – 1", "> 2"],
        ["T1", "Thermal fault < 300 °C", "NS", "> 1 (NS)", "< 1"],
        ["T2", "Thermal fault 300 – 700 °C", "< 0.1", "> 1", "1 – 4"],
        ["T3", "Thermal fault > 700 °C", "< 0.2", "> 1", "> 4"],
      ],
      note: "NS = non-significant whatever the value. Ratios are only meaningful when gas levels are above typical values; confirm with a repeat sample.",
    },
    faqs: [
      { q: "What does acetylene in transformer oil mean?", a: "Acetylene (C2H2) forms only at very high temperatures, typically in an electrical arc or a hot spot above about 700 °C. Even a few ppm rising between samples needs investigation." },
      { q: "What is the Duval Triangle?", a: "A graphical method that plots the relative percentages of methane, ethylene and acetylene. The point falls in a zone that identifies the fault type (PD, D1, D2, T1, T2, T3 or a mixture DT)." },
      { q: "How often should transformer oil be sampled for DGA?", a: "Typically once a year for large power transformers, more often after a fault, a Buchholz alarm or when gas levels are rising. Online DGA monitors give continuous data." },
      { q: "Is my data uploaded?", a: "No. The analyzer runs in your browser and stores the fleet only there. Use Backup data to keep a copy as a file." },
    ],
  },

  "/calculators/cable-engineering-suite": {
    howTo: {
      title: "How to use the Cable Engineering Suite",
      steps: [
        { title: "Open Getting Started & Help", text: "It is the first item in the suite's menu. It explains the three ways to work (one cable, a whole project, or a single check), what the worked example project contains, the standards used and what ORANGE values mean." },
        { title: "Size one cable with Quick Size", text: "Choose the load type, power, voltage, route length and installation method. The suite returns the smallest cable that passes current capacity, voltage drop, short circuit, earth-fault loop impedance and motor starting, and says why the next size down fails." },
        { title: "Set up a project in Project & Design Basis", text: "Enter the site conditions once: air and ground temperature, solar gain, soil resistivity and depth, system voltages and earthing, cmax/cmin and the voltage-drop limits for each circuit category. Every circuit in the project uses them. Save the project file to keep your work." },
        { title: "Size every circuit in the Sizing Engine", text: "Enter the buses with their fault levels and clearing times from your short-circuit and protection studies, then one row per circuit. Click Load worked example project to see ten finished circuits (11 kV feeders, LV incomer, MCC and lighting feeders, motors and a heater). Each circuit shows the recommended size, the governing criterion and every check." },
        { title: "Run the detailed studies you need", text: "The numbered modules cover derating, voltage drop, short-circuit withstand, IEC 60287 thermal rating with mutual heating, sheath bonding, HV sequence impedance and induced voltage, pulling tension, tray, duct and trench fill, drum cutting, glands and lugs, and site tests (insulation resistance, conductor resistance, VLF/AC withstand)." },
        { title: "Issue the results", text: "Print the calculation sheet for one circuit, the full submission report, the cable schedule and the drum schedule, or export the schedule to Excel. Each module also has its own PDF report." },
      ],
    },
    heading: "Cable sizing: the checks every cable must pass",
    paragraphs: [
      "A cable is correctly sized when it carries the design current continuously without overheating in its actual installation, keeps the voltage at the load within limits, survives the fault current until the protection clears it, and, on TN systems, lets the protective device disconnect an earth fault within the required time. Motor circuits add a fifth check: the voltage dip while the motor starts.",
      "The tabulated current ratings in IEC 60364-5-52 (LV) and IEC 60502-2 (MV) apply to reference conditions — 30 °C air, 20 °C ground, one circuit, a set soil resistivity and depth. Real installations are hotter, grouped and buried deeper, so the rating is multiplied by correction factors. The Sizing Engine checks every standard size against all criteria and recommends the smallest one that passes, naming the criterion that governs.",
    ],
    formula: [
      { label: "Derated capacity", text: "Iz = n × Itab × kT × kG × kS × kD ≥ In (or Ib for motor starters)" },
      { label: "Temperature factor", text: "kT = √((θmax − θa) / (θmax − θref)), θref = 30 °C in air, 20 °C in ground" },
      { label: "Voltage drop (3-phase)", text: "ΔU% = √3 · Ib · L · (R cos φ + X sin φ) / U × 100" },
      { label: "Short-circuit withstand", text: "S ≥ √(I²t) / k, k = 143 for Cu/XLPE (90 → 250 °C)" },
      { label: "Earth-fault loop", text: "Zs = Ze + |(R1 + R2) + j·2X| · L / n ≤ cmin · U0 / Ia" },
    ],
    faqs: [
      { q: "Which standards does the suite use?", a: "IEC 60364-5-52:2009 Annex B for LV ratings and correction factors, IEC 60502-2:2014 Annex B for MV ratings and factors, IEC 60228 for conductor resistance, IEC 60287 for AC resistance and thermal rating, IEC 60909 for fault level and IEC 60364-4-41, 4-43 and 5-54 for protection and earth-fault checks." },
      { q: "What do ORANGE values mean?", a: "A rating or factor outside the published tables, for example a group of more than 20 circuits or a depth beyond the table. The suite holds the nearest safe-side value and flags it so you can confirm it with the manufacturer or a full IEC 60287 calculation." },
      { q: "Is my project uploaded?", a: "No. The suite runs in your browser. Save the project file to your computer and open it again later." },
    ],
  },

  "/calculators/protection-suite": {
    howTo: {
      title: "How to use the Protection Coordination Suite",
      steps: [
        { title: "Open the demo project", text: "On the start screen choose ▶ Demo Project. It loads a seven-device HV–LV study: a 400 kV grid intertie relay (REL-01, IEEE EI), a 250 MVA transformer differential (REL-02, 87T), a 33 kV incomer (REL-04, IEC SI) and feeder (REL-05, IEC VI), a 6.6 kV motor relay, a 400 V LSIG MCCB (MCCB-12) and a 32 A type C MCB." },
        { title: "Read the time-current chart", text: "All curves are drawn on one log–log chart, referred to the plot reference voltage (0.4 kV in the demo) so devices on different voltage levels can be compared. Reference curves such as the transformer through-fault withstand and the cable ampacity line are drawn as well." },
        { title: "Check grading", text: "The Protection Grading Check table lists each upstream/downstream pair with the time margin at 2, 3, 5, 8, 12 and 20 times the downstream pickup, against the required coordination time interval (CTI). Hover a cell to see the current and both operating times. In the demo, REL-05 over MCCB-12 fails at ×3 and ×5." },
        { title: "Use Suggest — then re-check upstream", text: "💡 Suggest proposes the smallest TMS that gives the CTI at every checked multiple. Applying it to one relay often breaks the pair above it, so work up the system from the load end and re-check every pair. The worked example on this page walks through the demo." },
        { title: "Add your own devices", text: "＋ Add Circuit/Device creates IDMT, definite-time, LSIG, thermal-magnetic, MCB, fuse, motor or custom-equation devices; 📥 Import Devices reads a device list from a spreadsheet. Link each device to its upstream device so the grading pairs are created." },
        { title: "Use the setting tools and issue sheets", text: "The tools cover OC setting checks, 87T/87B/87L, distance (21), 46/49/51V, 81/27/59, CT and VT sizing, Metrosil/high-impedance sizing, LV board coordination and RCDs. 📄 Settings Sheet and 📑 Export All Settings Sheets produce the relay setting sheets; 💾 Save Project keeps the study as a file." },
      ],
    },
    heading: "Protection coordination: what the grading check shows",
    paragraphs: [
      "Protection coordination makes sure that the device nearest a fault operates first and that each upstream device waits long enough to let it clear. For inverse-time relays this means a minimum time margin, the coordination time interval (CTI), between the downstream and upstream curves at every fault current both can see. Typical CTIs are 0.3–0.4 s for electromechanical relays and 0.2–0.3 s between numerical relays with fast breakers.",
      "Checking a single fault level is not enough: inverse curves of different shapes (standard, very and extremely inverse) converge or cross, so the suite checks the margin at several multiples of the downstream pickup and at the maximum fault level. Each change to a setting moves the margin to the next device up, which is why grading is always worked from the load end towards the source.",
    ],
    formula: [
      { label: "IEC 60255-151 inverse time", text: "t = TMS × k / ((I/Is)^α − 1); SI: k = 0.14, α = 0.02; VI: k = 13.5, α = 1; EI: k = 80, α = 2" },
      { label: "Grading margin", text: "Δt = t_upstream − t_downstream ≥ CTI at every current both devices see" },
    ],
    faqs: [
      { q: "Why does fixing one pair break another?", a: "Raising the TMS of a relay to grade above the device below it also slows that relay, so the relay above it now has less margin. Grade from the load end upwards and re-check every pair after each change." },
      { q: "Why are differential relays excluded from the grading table?", a: "Differential protection (87T, 87B, 87L) is unit protection: it only operates for faults inside its zone, so it has no time margin to grade. The suite shows its operate/restraint characteristic separately." },
      { q: "Is my project uploaded?", a: "No. The workbench runs in your browser; save the project as a file to keep it." },
    ],
  },

  "/calculators/engineering-sketch-studio": {
    howTo: {
      title: "How to use Engineering Sketch Studio",
      steps: [
        { title: "Look at the demo drawing", text: "The studio opens with a transformer feeder: busbar BUS A, breaker CB-1, current transformer CT-1, transformer T1 (Dyn11), breaker CB-2, busbar BUS B and a 50/51 relay R1, inside a title block. Click Load demo at any time to bring it back, and Help or Manual for the full guide." },
        { title: "Place symbols", text: "Search the library on the left (620 symbols in Electrical, Instrumentation, Mechanical, Civil, IT & networking, Control logic, Flowchart and Annotation) and drag a symbol onto the sheet, or click it and click on the sheet. R rotates the selected symbol." },
        { title: "Wire and tag", text: "Choose Wire and click from one terminal to another; wires snap to the symbol terminals on a 2.5 mm grid. Auto-tag numbers the devices (CB-1, CT-1 …), Wire nos and Number terminals number the wires and terminals, and Check tags finds duplicates and missing tags. Set the properties of the selected symbol in the panel on the right." },
        { title: "Use the wizards and templates", text: "Wizards draw a transformer feeder, a switchboard or a flowchart from a list of steps; Templates start a drawing from a saved layout. Add sheets with + Add sheet and fill the title block with Title block…." },
        { title: "Generate the schedules", text: "Reports builds lists from the drawing: bill of materials, parts database, instrument index, terminal schedule, cabinet labels, loop sheets, process line list, protection functions and settings, ANSI ↔ IEC cross-reference, LAN/fibre cable schedule and CSV equipment and connection lists." },
        { title: "Save and export", text: "Save downloads the project file (nothing is uploaded). Export writes SVG, DXF for CAD, PNG at 150–600 DPI, vector PDF through the browser's print dialog, or all sheets as a ZIP." },
      ],
    },
    heading: "Single-line diagrams and schematics",
    paragraphs: [
      "A single-line diagram (SLD) shows a three-phase power system with one line per circuit: sources, busbars, breakers, transformers, instrument transformers, protection relays and loads, with their ratings. It is the first drawing of any electrical project and the reference for the short-circuit, coordination and arc-flash studies.",
      "Engineering Sketch Studio draws SLDs, schematics, loop sheets, P&ID-style process sketches, network diagrams and flowcharts with symbols in the style of IEC 60617 and IEEE 315. Because the symbols carry tags and properties, the schedules — bill of materials, terminal and cable lists, protection functions — come straight from the drawing.",
    ],
    faqs: [
      { q: "Can I open the drawing in AutoCAD?", a: "Yes. Export ▸ DXF writes the current sheet, or all sheets in one file, with lines, circles, polylines, text and layers." },
      { q: "Are the symbols to IEC 60617?", a: "They are original artwork in the style of IEC 60617 and IEEE 315, with ANSI device numbers for protection functions. Check them against your company's drawing standard before issue." },
      { q: "Where are my drawings stored?", a: "In your browser while you work. Use Save to download the project file and Open to reopen it later; nothing is uploaded." },
    ],
  },

  "/calculators/ct-sizing": {
    heading: "How to size a protection CT",
    paragraphs: [
      "A protection current transformer must reproduce the fault current accurately enough for the relay to operate correctly. If the secondary voltage needed to drive the fault current through the CT's own winding resistance and the connected burden exceeds the knee-point voltage, the core saturates and the secondary current collapses.",
      "The burden is the relay plus the leads. Lead resistance often dominates at 5 A secondary, which is one reason 1 A secondaries are preferred for long runs. For differential and distance protection, the DC offset of the fault current also matters, which the calculator's transient (Ktd) check covers.",
    ],
    formula: [
      { label: "Lead resistance", text: "R lead = ρ × L × (1 or 2) / A   (ρ = 0.0175 Ω·mm²/m for copper)" },
      { label: "Total burden", text: "Rb = R lead + VA relay / In²" },
      { label: "Required knee-point voltage", text: "Vk ≥ ALF × In × (Rct + Rb)" },
      { label: "Transient factor", text: "Ktd = 1 + ω·T1·(1 − e^(−t/T1)), T1 = X/R ÷ ω" },
    ],
    table: {
      caption: "Common CT accuracy classes (IEC 61869-2)",
      headers: ["Class", "Use", "Meaning"],
      rows: [
        ["0.2, 0.5, 1", "Metering", "Ratio error ±0.2%, ±0.5% or ±1% at rated current"],
        ["5P10, 5P20", "Protection", "Composite error ≤ 5% up to 10 or 20 × rated current"],
        ["10P10, 10P20", "Protection", "Composite error ≤ 10% up to 10 or 20 × rated current"],
        ["PX", "Differential, distance", "Defined by knee-point voltage Vk, Rct and magnetising current"],
      ],
      note: "Preferred rated outputs are 2.5, 5, 10, 15 and 30 VA; rated secondary current is 1 A or 5 A.",
    },
    faqs: [
      { q: "What does 5P20 mean?", a: "A protection CT whose composite error stays within 5% up to 20 times rated current, when connected to its rated burden." },
      { q: "Why choose a 1 A CT instead of 5 A?", a: "Lead burden is I²R, so for the same leads a 1 A secondary loads the CT 25 times less than a 5 A secondary. That allows smaller CTs or longer cable runs." },
    ],
  },

  "/calculators/transformer-sizer": {
    heading: "How to size a transformer (kVA)",
    paragraphs: [
      "Start from the maximum demand in kVA, add margins for future growth and uncertainty, then correct for site conditions. IEC 60076 transformers are rated for an ambient of at most 40 °C, a monthly average of 30 °C and a yearly average of 20 °C, at altitudes up to 1,000 m; hotter or higher sites need derating.",
      "Where supply must survive the loss of one transformer, size each unit so the remaining units (N−1) carry the full load. Then pick the next standard rating above the result.",
    ],
    formula: [
      { label: "Design load", text: "S (kVA) = P (kW) / power factor" },
      { label: "With margins", text: "S required = S × (1 + growth) × (1 + safety) / derating" },
      { label: "N−1 redundancy", text: "S per unit = S required / (N − 1)" },
    ],
    table: {
      caption: "Standard transformer ratings (kVA)",
      headers: ["Series", "Ratings"],
      rows: [
        ["IEC (R10 preferred)", "100, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150"],
        ["ANSI / IEEE", "75, 112.5, 150, 225, 300, 500, 750, 1000, 1500, 2000, 2500, 3750"],
      ],
    },
    faqs: [
      { q: "How much spare capacity should a transformer have?", a: "A common design target is 15–25% above the calculated maximum demand, depending on how certain the load estimate is and how much growth is expected." },
      { q: "Can a transformer be loaded above its nameplate?", a: "Yes, for limited periods. IEC 60076-7 (oil) and IEC 60076-12 (dry-type) loading guides allow overloads based on hot-spot temperature and insulation ageing." },
    ],
  },

  "/calculators/harmonic-analysis": {
    heading: "IEEE 519 harmonic limits",
    paragraphs: [
      "IEEE 519-2014 sets limits at the point of common coupling with the utility. Voltage limits depend on the bus voltage; current limits depend on the ratio of short-circuit current to maximum demand load current (Isc/IL), because a stiff supply can absorb more harmonic current with less voltage distortion.",
      "Current distortion is judged as total demand distortion (TDD), referred to the maximum demand current, not to the current at the moment of measurement. A lightly loaded site can show a high THD that is still within the TDD limit.",
    ],
    table: {
      caption: "IEEE 519-2014 Table 1 — voltage distortion limits",
      headers: ["Bus voltage at PCC", "Individual harmonic", "Total THD"],
      rows: [
        ["V ≤ 1.0 kV", "5.0%", "8.0%"],
        ["1 kV < V ≤ 69 kV", "3.0%", "5.0%"],
        ["69 kV < V ≤ 161 kV", "1.5%", "2.5%"],
        ["V > 161 kV", "1.0%", "1.5%"],
      ],
      note: "Current limits (Table 2, 120 V–69 kV): TDD of 5%, 8%, 12%, 15% or 20% for Isc/IL below 20, 20–50, 50–100, 100–1000 and above 1000.",
    },
    faqs: [
      { q: "What is the difference between THD and TDD?", a: "THD is relative to the fundamental current measured at that moment. TDD is relative to the maximum demand current, so it does not exaggerate distortion at light load." },
      { q: "Where do IEEE 519 limits apply?", a: "At the point of common coupling (PCC) between the facility and the utility, not at each piece of equipment." },
    ],
  },

  "/calculators/lightning-protection": {
    heading: "Lightning risk assessment (IEC 62305-2)",
    paragraphs: [
      "IEC 62305-2 decides whether a structure needs lightning protection by comparing the calculated risk of loss of human life, R1, with the tolerable risk RT = 10⁻⁵ per year. The risk grows with the local flash density, the collection area of the structure and any connected lines, and with how many people are present and for how long.",
      "If R1 exceeds RT, protection measures are added until it falls below: a lightning protection system (LPS) of class IV to I, surge protection on incoming lines, and measures against touch and step voltages.",
    ],
    formula: [
      { label: "Collection area", text: "AD = L·W + 2·(3H)·(L + W) + π·(3H)²" },
      { label: "Dangerous events per year", text: "ND = NG · AD · CD · 10⁻⁶" },
      { label: "Risk components", text: "R1 = RA + RB + RU + RV (+ others for special structures)" },
    ],
    table: {
      caption: "LPS classes (IEC 62305)",
      headers: ["LPS class", "Probability of damage PB", "Rolling sphere radius", "Mesh size"],
      rows: [
        ["I", "0.02", "20 m", "5 × 5 m"],
        ["II", "0.05", "30 m", "10 × 10 m"],
        ["III", "0.1", "45 m", "15 × 15 m"],
        ["IV", "0.2", "60 m", "20 × 20 m"],
      ],
    },
    faqs: [
      { q: "What is a tolerable risk of 10⁻⁵?", a: "A one-in-100,000 chance per year of loss of human life due to lightning. IEC 62305-2 uses it as the threshold for R1." },
    ],
  },

  "/calculators/power-converter": {
    heading: "kW, kVA, kVAr and amps",
    paragraphs: [
      "Real power (kW) does the work, reactive power (kVAr) magnetises motors and transformers, and apparent power (kVA) is their vector sum, which sets the current and therefore the size of cables, breakers and transformers. Power factor is the ratio kW / kVA.",
    ],
    formula: [
      { label: "Apparent power", text: "kVA = kW / PF = √(kW² + kVAr²)" },
      { label: "Three-phase current", text: "I = kVA × 1000 / (√3 × V line-to-line)" },
      { label: "Single-phase current", text: "I = kVA × 1000 / V" },
    ],
    table: {
      caption: "Three-phase current per kW (A/kW)",
      headers: ["Line voltage", "PF 1.0", "PF 0.9", "PF 0.85", "PF 0.8"],
      rows: [
        ["400 V", "1.44", "1.60", "1.70", "1.80"],
        ["415 V", "1.39", "1.55", "1.64", "1.74"],
        ["480 V", "1.20", "1.34", "1.42", "1.50"],
      ],
      note: "Single-phase 230 V: 4.35 A per kW at unity power factor. Multiply by the load in kW.",
    },
    faqs: [
      { q: "How many amps is 100 kW at 400 V?", a: "At 0.85 power factor, 100 × 1.70 ≈ 170 A per phase. At unity power factor it would be about 144 A." },
      { q: "How do I convert kVA to kW?", a: "Multiply kVA by the power factor: 100 kVA at 0.8 PF is 80 kW." },
    ],
  },

  "/calculators/ground-resistance": {
    heading: "Ground rod resistance",
    paragraphs: [
      "The resistance of a single driven rod depends mainly on soil resistivity and rod length, and only weakly on diameter. Doubling the length roughly halves the resistance, while doubling the diameter reduces it by only about 10%.",
      "In the US, NEC 250.53(A)(2) allows a single rod without a supplemental electrode if it measures 25 Ω or less. Other installations set their own targets, and substations and lightning protection systems usually need much lower values achieved with several rods or a grid.",
    ],
    formula: [{ label: "Single rod (BS 7430)", text: "R = ρ / (2πL) × [ln(8L/d) − 1]" }],
    table: {
      caption: "Resistance of a 16 mm rod in 100 Ω·m soil",
      headers: ["Rod length (m)", "Resistance (Ω)"],
      rows: [["1.2", "71.6"], ["1.5", "59.6"], ["2.4", "40.4"], ["3.0", "33.5"], ["4.8", "22.5"], ["6.0", "18.6"]],
      note: "Resistance scales directly with soil resistivity: in 200 Ω·m soil every value doubles.",
    },
    faqs: [
      { q: "How do I lower ground rod resistance?", a: "Drive the rod deeper, add rods spaced at least one rod length apart, or use a ground ring or grid. Soil treatment helps but needs maintenance." },
    ],
  },

  "/calculators/scl-netstudio": {
    howTo: {
      title: "How to use SCL NetStudio",
      steps: [
        { title: "Start from the sample substation", text: "The tool opens with S13, a 132/33 kV substation: a gateway, HMI, GPS clock, three protection IEDs, a bay controller and two merging units on three switches (two station bus, one process bus), with four GOOSE and two sampled-value streams. The Project page shows a nine-step checklist with the status of every tool — work down it, or jump to any tool from the left rail." },
        { title: "Enter or import the devices", text: "On Project, list each device with its bay, role and the networks it is connected to (station bus, process bus, management, SCADA DMZ, engineering) and its switch. Or use Import SCD to fill devices and streams from your SCD. Load sample project brings S13 back; New empty project starts from scratch." },
        { title: "Plan the IP addresses", text: "IP plan has a subnet calculator and a VLSM planner: give the address block (10.13.0.0/22 in the sample) and the host count and growth for each segment; the largest segments are placed first so each starts on its natural boundary. Assign addresses to all devices then numbers them in a fixed order (gateway, HMI, time server, protection, control, merging units)." },
        { title: "Allocate GOOSE and SV addressing", text: "VLAN & multicast gives each stream a MAC address, APPID, VLAN and priority from your rules (in the sample GOOSE VLAN 10, SV VLAN 11, trip GOOSE priority 6), checks them against the IEC 61850 ranges and for duplicates, checks the VLAN plan itself (a stream on the untagged data VLAN, overlapping per-bay VLAN ranges, priorities below 4, publishers or subscribers without a switch on that network), works out which VLANs each switch port must carry, and writes a vendor-neutral switch configuration template." },
        { title: "Check bandwidth, latency, redundancy and time", text: "Bandwidth shows the load of every port and uplink, steady and during a GOOSE avalanche. Latency adds sender, network and receiver times for a GOOSE and compares the total with the transfer time class (TT6 = 3 ms for trips). Redundancy sizes an HSR ring or a PRP network. Time sync adds up the PTP error budget and compares it with the accuracy class the function needs." },
        { title: "Plan the firewall", text: "Firewall planner: define zones with a target security level, list the services each conduit needs, and read the warnings — unencrypted MMS, a corporate network reaching the station LAN directly, GOOSE that needs layer 2 rather than a routed rule. Copy the generated rule table for the firewall team." },
        { title: "Verify on site with a capture", text: "Capture analyser opens a Wireshark capture and compares it with the plan: GOOSE stNum/sqNum and time allowed to live, sampled-value continuity and synchronisation, addresses and VLANs, streams missing from the capture and publishers the project does not know. Load sample capture shows a 10-second capture generated from the project with typical site faults." },
        { title: "Schedule ports and cables", text: "Ports & cables gives every device link and every switch-to-switch link a switch port and a cable ID: devices from port 1, uplinks from the top, PRP links doubled for LAN A and B. Set the number of ports of each switch, the cable types and default lengths, and override any port, medium or length. The checks flag a port used twice, a switch without enough ports, a device without a switch and cables beyond their length limit — in the sample, the 115 m copper link of BCU_J01 exceeds the 100 m channel. The VLAN page and switch configuration use the same port numbers." },
        { title: "Complete the asset register", text: "Asset register lists every device and switch with panel, manufacturer, model, firmware, serial number and MAC address next to its IP addresses, switch port and VLANs. Fill it in, or export it, complete it in Excel and import it back as CSV (matched by tag). It flags duplicate serials, MAC and IP addresses and a model running several firmware versions — in the sample, the two DP-700 line protections run 3.2.1 and 3.1.4." },
        { title: "Export", text: "Every tool exports to Excel (IP plan, streams, switch ports, cable schedule, asset register, bandwidth, firewall rules, capture findings), and Export SCD writes the addresses back into the SCD Communication section. The project is kept in your browser; nothing is uploaded." },
      ],
    },
    heading: "Designing an IEC 61850 substation network",
    paragraphs: [
      "An IEC 61850 substation carries three kinds of traffic with very different needs. MMS (client/server) carries reports, controls and file transfer between the IEDs and the gateway or HMI over TCP/IP; it is tolerant of delay. GOOSE carries trips, interlocks and status between IEDs as layer-2 multicast; a trip must reach the subscriber within 3 ms (transfer time class TT6 in IEC 61850-5). Sampled values carry currents and voltages from merging units at 4,000 frames per second per stream at 50 Hz (9-2LE), about 5 Mb/s each, and must not be lost.",
      "The network design therefore has to answer a few questions before anything is bought. Which IP subnets and VLANs keep the traffic apart, and which switch ports must carry which multicast streams? Is every link comfortably below its capacity even when every GOOSE changes at once during a busbar fault? Does a trip GOOSE reach its subscriber in time through the chosen number of switches? Which redundancy scheme (RSTP, MRP, PRP or HSR) gives the recovery time the protection needs? Is the time synchronisation accurate enough for sampled values (±4 µs for protection, class T4)? And which services may cross between the station LAN, the SCADA DMZ, engineering access and the corporate network?",
      "SCL NetStudio answers each question with its own tool, all working from one inventory of devices and streams that can be imported from, and written back to, the SCD file. A capture analyser then checks the commissioned network against the plan.",
    ],
    formula: [
      { label: "Frame rate of a 9-2LE SV stream", text: "80 samples/cycle × 50 Hz = 4 000 frames/s; load = (frame bytes + 20) × 8 × 4 000 b/s (preamble and inter-frame gap included)" },
      { label: "GOOSE transfer time (IEC 61850-5)", text: "t = ta + tb + tc; trips (type 1A, P2/P3) must meet TT6: t ≤ 3 ms" },
      { label: "PTP time error (IEC 61850-9-3 budget)", text: "grandmaster 250 ns + 50 ns per transparent clock + 200 ns per boundary clock + end device ≤ class limit" },
    ],
    table: {
      caption: "Typical figures used in the design",
      headers: ["Item", "Typical value", "Source"],
      rows: [
        ["GOOSE MAC / APPID range", "01-0C-CD-01-00-00 … 01-FF / 0000–3FFF (Type 1A 8000–BFFF)", "IEC 61850-8-1"],
        ["SV MAC / APPID range", "01-0C-CD-04-00-00 … 01-FF / 4000–7FFF (Type 1A C000–FFFF)", "IEC 61850-9-2"],
        ["Default VLAN priority", "4 (trips often 6)", "IEC 61850-8-1 / 9-2"],
        ["Trip GOOSE transfer time", "TT6: 3 ms", "IEC 61850-5"],
        ["Time class for SV protection / metering", "T4 ±4 µs / T5 ±1 µs", "IEC 61850-5"],
        ["PTP budget", "1 µs after 15 transparent clocks", "IEC 61850-9-3"],
        ["PRP / HSR recovery", "0 ms (both copies always sent)", "IEC 62439-3"],
        ["Link loading target", "steady < 50 %, burst < 80 %", "Engineering practice"],
      ],
      note: "Engineering practice values are rules of thumb; follow the project specification where it differs.",
    },
    faqs: [
      { q: "What is the difference between SCL Studio and SCL NetStudio?", a: "SCL Studio opens, validates and edits the SCL files themselves (data model, data sets, GOOSE/SV/report control blocks, references). SCL NetStudio designs the network around the IEDs: IP plan, VLANs and multicast, bandwidth, latency, redundancy, time synchronisation, firewall zones and on-site verification. Both read and write the SCD." },
      { q: "Does the bandwidth calculation include the GOOSE burst after a fault?", a: "Yes. The burst figure assumes every GOOSE changes state at the same moment (avalanche) and is retransmitted at the MinTime / MaxTime scheme — about 9 frames in the first second per stream with MinTime 4 ms." },
      { q: "Can it configure my switches?", a: "It writes a vendor-neutral configuration template (VLANs, port membership, priority trust, multicast filtering) to translate into your switch's CLI or web interface. It does not connect to the switches." },
      { q: "Is the project uploaded anywhere?", a: "No. The project is stored in your browser and capture files are analysed locally. Export to Excel or SCD to keep a copy." },
    ],
  },

  "/calculators/scada-connectivity": {
    heading: "Why a laptop cannot reach an IED — and how to read the result",
    paragraphs: [
      "Every IPv4 device decides on its own whether a destination is on its own LAN. It applies its own subnet mask to its own address and to the destination: if both give the same network address, it sends the frame directly (after an ARP request for the destination's MAC address). If not, it sends the frame to its default gateway. If it has no gateway, it cannot send at all.",
      "Because each side uses its own mask, two devices can disagree. A laptop on 10.13.0.200/24 sees an IED at 10.13.0.14 as local and sends directly. The IED on 10.13.0.14/25 sees 10.13.0.200 as outside its range 10.13.0.0–127 and sends its reply to its gateway. The request arrives, the reply goes to the router and is normally lost. Ping fails, but the IED's counters show that requests came in — a typical one-way fault on site.",
      "The assistant repeats the decision from both sides and gives one of four results: can talk directly (same subnet on both sides), only through a router (different subnets, both have gateways), mask mismatch (the two sides disagree), or cannot talk. It also flags addresses that can never work: duplicates, the network or broadcast address of a subnet, 169.254.x.x link-local addresses (the adapter was set to DHCP and got no answer), and gateways outside the device's own subnet.",
      "When the addressing is right, the next step is the service. IEC 61850 MMS uses TCP 102, IEC 60870-5-104 uses TCP 2404, DNP3 uses TCP 20000 and Modbus TCP uses 502. If ping works but the engineering tool does not connect, the cause is usually the Windows firewall, a switch port in a different VLAN, the service disabled on the IED, or the IED's limit on simultaneous client connections.",
    ],
    formula: [
      { label: "Network address", text: "network = IP AND mask (bit by bit). Two addresses are on the same subnet when IP₁ AND mask = IP₂ AND mask — evaluated with each device's OWN mask." },
      { label: "Usable range", text: "first host = network + 1, last host = broadcast − 1, broadcast = network OR (NOT mask); usable hosts = 2^(32 − prefix) − 2 (for prefixes up to /30)." },
    ],
    table: {
      caption: "Common masks on substation networks",
      headers: ["Prefix", "Mask", "Addresses", "Usable hosts"],
      rows: [["/24", "255.255.255.0", "256", "254"], ["/25", "255.255.255.128", "128", "126"], ["/26", "255.255.255.192", "64", "62"], ["/27", "255.255.255.224", "32", "30"], ["/28", "255.255.255.240", "16", "14"], ["/29", "255.255.255.248", "8", "6"], ["/30", "255.255.255.252", "4", "2"]],
    },
    faqs: [
      { q: "Do I need a default gateway on my laptop to talk to the IED?", a: "Not if the laptop is in the IED's subnet — the traffic goes directly over the LAN. A gateway is needed only to reach other subnets. A gateway outside the laptop's own subnet is ignored by Windows." },
      { q: "Ping works but the IEC 61850 client cannot connect. Why?", a: "The network is fine; check TCP 102. Common causes are the Windows firewall blocking the tool, the MMS server disabled or limited to a few clients on the IED, or an access list on a router or firewall in between." },
      { q: "Why does my laptop show 169.254.x.x?", a: "The adapter is set to obtain an address automatically and found no DHCP server, so Windows picked a link-local address. Set a static address in the IED's subnet." },
      { q: "Can two devices with different masks talk?", a: "Yes, if each sees the other inside its own subnet (for example /24 and /25 with both addresses in the lower half). It is still poor practice: all devices on one LAN should use the same mask." },
    ],
  },
  "/calculators/fibre-link-budget": {
    heading: "How a fibre link budget works",
    paragraphs: [
      "The power budget of a link is the difference between the transmitter's minimum launch power and the receiver's sensitivity, both from the transceiver datasheet. Everything between them uses up that budget: fibre attenuation (dB per km times length), each mated connector pair and each splice. What is left must cover a safety margin for ageing, temperature, repair splices and dirty connectors — 3 dB is common practice.",
      "Connector and splice loss can be taken at the maximum allowed by TIA-568.3-D (0.75 dB per mated pair, 0.3 dB per splice), which is the safe design basis, or at typical installed values for factory-polished connectors and fusion splices (around 0.5 dB and 0.1 dB). If a link passes only on typical values, measure the installed loss before commissioning.",
      "On multimode fibre the distance is often limited by modal bandwidth, not by loss. 1000BASE-SX reaches 275 m on OM1 and 550 m on OM2 according to IEEE 802.3, even though the power budget would allow more. A link longer than the standard's reach can fail with power to spare, so the calculator checks both limits and reports the smaller one as the maximum usable length.",
      "Short single-mode links with high-power optics can overload the receiver. The calculator compares the strongest transmitter with a low estimate of the link loss against the receiver overload level; if exceeded, an in-line attenuator is needed.",
    ],
    formula: [
      { label: "Power budget", text: "PB = Ptx,min − Prx,sens  (dB)" },
      { label: "Link loss", text: "L = α·ℓ + Nc·Lc + Ns·Ls  (fibre attenuation α in dB/km, length ℓ, connector pairs Nc, splices Ns)" },
      { label: "Margin left", text: "M = PB − L − Msafety ≥ 0 for the link to pass" },
      { label: "Maximum length by loss", text: "ℓmax = (PB − Msafety − Nc·Lc − Ns·Ls) / α" },
    ],
    table: {
      caption: "IEEE 802.3 reach used by the calculator",
      headers: ["Standard", "Wavelength", "Fibre", "Reach"],
      rows: [["100BASE-FX", "1300 nm", "OM1 / OM2 multimode", "2 km"], ["100BASE-LX10", "1310 nm", "OS2 single-mode", "10 km"], ["1000BASE-SX", "850 nm", "OM1 / OM2 (OM3, OM4)", "275 m / 550 m"], ["1000BASE-LX", "1310 nm", "Single-mode / OM1–OM2 with mode-conditioning cord", "5 km / 550 m"], ["1000BASE-LX10", "1310 nm", "OS2 single-mode", "10 km"]],
      note: "1000BASE-ZX is a manufacturer specification, not an IEEE 802.3 standard. OM3 and OM4 are taken at the OM2 reach for 1000BASE-SX, which is conservative.",
    },
    faqs: [
      { q: "How many connectors should I count?", a: "Count every mated pair: the patch cord into the panel at each end and any intermediate patch panels. A simple panel-to-panel link with patch cords at both ends usually has 2 mated pairs on the permanent link, plus the equipment connections if the budget includes the patch cords." },
      { q: "Is 3 dB margin enough?", a: "It is the usual design margin for substation and industrial links. Use more for long outdoor routes where repair splices are likely, and keep a record of the measured loss at commissioning to compare later." },
      { q: "Why does my 1000BASE-SX link fail at 400 m on OM1 with power to spare?", a: "The IEEE 802.3 reach for 1000BASE-SX on OM1 (62.5 µm, 200 MHz·km) is 275 m. Beyond that the pulses spread (modal dispersion) and bit errors rise regardless of power. Use OM3/OM4 or single-mode with LX optics." },
      { q: "Where do the transceiver values come from?", a: "The presets are representative datasheet values. Real modules differ, so enter the minimum transmit power and receiver sensitivity from the datasheet of the module you use." },
    ],
  },
  "/calculators/ip-register-checker": {
    heading: "What the IP register checker looks for",
    paragraphs: [
      "The IP address register is usually a spreadsheet: one line per device with its name, IP address, subnet mask, gateway, MAC address and VLAN. It is written early, copied between documents and edited by several people, so typing errors survive until commissioning. Checking the whole list at once is faster than finding the faults one by one on site.",
      "Per device the checker verifies the format of the IP, mask and MAC, and flags addresses that cannot be assigned: the network or broadcast address of the subnet, loopback, multicast and 169.254.x.x link-local addresses. It checks that the gateway is inside the device's own subnet and is not the device itself.",
      "Across the register it finds duplicate IP addresses, MAC addresses and device names; masks or gateways that differ inside one VLAN or network (the majority value is taken as intended); subnets that overlap, which means devices disagree about who is local; and one subnet spread over several VLANs, which cannot work without routing.",
      "Paste the table directly from Excel (it is tab separated), or open a CSV file. The checker reads the column headings to find the columns, accepts IP/prefix notation such as 10.13.0.14/25, and gives the line number of every finding. The data stays in your browser.",
    ],
    table: {
      caption: "Findings and their meaning",
      headers: ["Code", "Severity", "Meaning"],
      rows: [["DUP-IP", "Error", "The same IP address on two or more devices"], ["DUP-MAC", "Error", "The same MAC address on two devices (often a copied line)"], ["IP-NETBC", "Error", "Network or broadcast address given to a device"], ["IP-SPECIAL", "Error", "Loopback, link-local (169.254.x.x), multicast or reserved address"], ["GW-OUTSIDE", "Error", "Gateway outside the device's own subnet"], ["SUBNET-OVERLAP", "Error", "Two different subnets cover the same addresses"], ["MASK-MIX / GW-MIX", "Warning", "Mask or gateway differs from the rest of the VLAN or network"], ["SUBNET-VLANS", "Warning", "One subnet appears in more than one VLAN"], ["VLAN-SUBNETS", "Info", "A VLAN carries more than one subnet"]],
    },
    faqs: [
      { q: "Which columns does the checker need?", a: "At least an IP address column. A subnet mask column (or IP/prefix notation) enables the mask, gateway and subnet checks; gateway, MAC, VLAN and network columns enable the rest. Column names such as Device, IP address, Subnet mask, Gateway, MAC address, VLAN are recognised." },
      { q: "Is my register uploaded anywhere?", a: "No. The file is read and checked in your browser; nothing is sent to a server." },
      { q: "Why is an overlap an error and not a warning?", a: "When two subnets overlap, a device on the wider subnet treats addresses as local that the device on the narrower subnet sends to its gateway. The result is the one-way fault that the SCADA Connectivity Assistant explains — it nearly always means one mask is wrong." },
    ],
  },
  "/calculators/goose-sv-analyzer": {
    howTo: {
      title: "How to use the GOOSE & SV Capture Analyzer",
      steps: [
        { title: "Try the demo", text: "Click Load demo. It opens a five-second capture of one bay with its SCD file: a trip GOOSE with a lost repetition, a status GOOSE whose time allowed to live has no margin and which then goes silent for three seconds, an interlocking GOOSE in simulation with low VLAN priority whose data changes without a new stNum, and a 9-2LE merging unit with eight lost samples and a neutral that does not match the phases." },
        { title: "Capture the traffic", text: "In Wireshark, capture on a switch port that receives the GOOSE / SV multicast (a mirror port or a TAP), for long enough to include a few state changes. Save as .pcap or .pcapng. A filter such as eth.type == 0x88b8 || eth.type == 0x88ba keeps only GOOSE and SV." },
        { title: "Open the capture and, if you have it, the SCD", text: "Open the capture with Open capture, or drag it onto the page. Add the SCD with Open SCL to compare every stream with its configuration: APPID, MAC address, VLAN, confRev, data set, goID, number of entries, MaxTime and smpRate." },
        { title: "Read the streams and findings", text: "The streams table shows each GOOSE control block and SV stream with its worst verdict; click a stream to see only its findings. Each finding opens to show the standard reference, what was expected and observed, an explanation, likely causes, what to do and the impact, with the frame numbers where it occurred." },
        { title: "Check the rule list", text: "The tab Checks & standard references lists all 86 checks with their verdict and the clause they are based on." },
        { title: "Report", text: "Print report produces a one-document summary of streams and findings; Export CSV gives every finding for Excel." },
      ],
    },
    heading: "GOOSE and sampled values: what goes wrong on the network",
    paragraphs: [
      "GOOSE messages (IEC 61850-8-1) carry trips, interlocks and status between IEDs. Each message repeats the whole data set: when a value changes, the publisher increments stNum, resets sqNum to 0 and sends the message several times in quick succession, then slows down to the steady repetition interval (MaxTime). Every message carries a time allowed to live (TAL); a subscriber that hears nothing within TAL treats the data as lost. Most field problems show up as gaps in stNum or sqNum, repetitions arriving too close to TAL, a changed data set without a new confRev, or a device left in simulation.",
      "Sampled values (IEC 61850-9-2, usually to the 9-2LE profile) stream currents and voltages from a merging unit at 80 samples per cycle — 4,000 frames per second at 50 Hz. Lost or out-of-order samples, a sample counter that wraps at the wrong value, loss of time synchronisation (smpSynch) or invalid channel quality can block or mis-operate protection.",
    ],
    faqs: [
      { q: "Can the analyzer capture live traffic?", a: "No. Browsers cannot read raw Ethernet frames. Capture with Wireshark (or a hardware capture device) and open the file here." },
      { q: "Which standard editions do the clause references follow?", a: "IEC 61850-7-2:2010, IEC 61850-8-1:2011 and IEC 61850-9-2:2011 (Edition 2), the UCA 9-2LE guideline, IEC 61869-9, IEC 62439-3 and IEEE 802.1Q. Confirm the clause against your copy of the standard before quoting it." },
      { q: "Is my capture uploaded?", a: "No. The capture and the SCD are read in your browser and never leave your computer." },
      { q: "Why does the analyzer warn about time allowed to live without margin?", a: "If TAL is close to the repetition interval, a single delayed or lost repetition makes subscribers declare the GOOSE lost. A TAL of about twice the repetition interval is common practice." },
    ],
  },

  "/calculators/iec-61850-scl-editor": {
    howTo: {
      title: "How to use SCL Studio",
      steps: [
        { title: "Open a file or the sample substation", text: "Choose Open file (or drop an .scd, .icd, .cid, .iid or .ssd file on the page), or click Sample to load S13_Sample.scd: a 132/33 kV substation with a line distance IED (P132_Q01), a transformer differential IED (P87T_T1) and a station gateway (GW1). The file is read in your browser and never uploaded." },
        { title: "Get the overview", text: "Overview counts the IEDs, logical devices, logical nodes, data sets, GOOSE, sampled values, reports and ExtRef inputs, and shows the validation result. The sample has 3 IEDs, 4 data sets, 2 GOOSE control blocks and 2 report control blocks, with no errors or warnings." },
        { title: "Follow the data flows", text: "Data flow shows the subscription matrix and every control block with its data set, confRev, address and subscribers. In the sample, P132_Q01 sends a trip GOOSE (APPID 0011) to P87T_T1, P87T_T1 sends a differential intertrip GOOSE (APPID 0021) back, and GW1 receives two reports from P132_Q01." },
        { title: "Validate and correct", text: "Validation lists errors and warnings with the element they refer to: duplicate MAC/APPID, IP addresses outside the subnet, unresolved ExtRefs, data-set members that do not exist, report settings and more. Edit addresses in Communication (or use Auto-assign MAC/APPID), or any attribute in Explorer, then validate again." },
        { title: "Produce engineering documents", text: "Registers exports the IED, communication, GOOSE/SV, report and signal lists to one Excel workbook. Test sheets generates FAT/SAT point-to-point sheets from the data sets (5 signals for the sample's gateway reports). Compare shows what changed between two revisions, and SCADA check compares a SCADA tag list with the file." },
        { title: "Export", text: "Export writes the corrected SCD, or a CID for one IED. Always import a CID into the manufacturer's configuration tool before loading it into the device." },
      ],
    },
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
      { q: "Is an earth mat the same as an earthing grid?", a: "Yes. Earth mat, earthing grid, ground grid and earth grid all describe the same thing: a mesh of buried bare conductors, usually with rods, under a substation or plant area. The calculation method in IEEE 80 is the same whichever name is used." },
      { q: "Do I need dedicated earthing software for a substation?", a: "For a uniform-soil grid of regular shape, the IEEE 80 equations used here give the grid resistance, GPR and touch and step voltages directly. Two-layer or multi-layer soil, irregular grids and transferred potentials need numerical earthing modelling software." },
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
