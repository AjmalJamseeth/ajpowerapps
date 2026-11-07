// Shared site facts quoted on several pages. The regression suite checks that
// AUTOMATED_CHECKS equals its own total, so the published figure cannot drift.
export const AUTOMATED_CHECKS = 820;

export interface ChangeEntry {
  date: string; // e.g. "November 2026"
  title: string;
  items: string[];
}

// Public change log for calculation results and published content, newest first.
export const CHANGE_LOG: ChangeEntry[] = [
  {
    date: "November 2026",
    title: "Engineering Suites and Engineering Sketch Studio",
    items: [
      "How-to guides on all five application pages, eight new worked examples followed in the applications themselves (Cable Suite motor and 11 kV feeders and IEC 60287 rating, Protection Suite demo grading, two DGA diagnoses, SCL Studio sample substation, Sketch Studio feeder drawing), and a Getting Started page inside the Cable Engineering Suite.",
      "New Engineering Suites menu and page bringing the full applications together; each one also stays listed in its own category.",
      "New: Engineering Sketch Studio for single-line diagrams, schematics, loop sheets and process sketches, with 620 symbols, schedules generated from the drawing and SVG/DXF/PDF export. All features are open.",
    ],
  },
  {
    date: "November 2026",
    title: "Cable Engineering Suite",
    items: [
      "New: Cable Engineering Suite, a full LV/MV cable design workbench. It covers cable schedule sizing, derating, fault level, earth-fault loop, IEC 60287 rating, sheath bonding, pulling, fill, drums and site tests. All features are open.",
      "Before publishing, its tables were checked against IEC 60364-5-52:2009 and IEC 60502-2:2014. 98 buried (D1/D2) LV ratings were corrected, and the duct grouping factors for single-core circuits now use the single-core values. Above 2.5 K·m/W the direct-buried soil factor row is now used.",
      "Fixes made during the review: the IEC 60287 module now uses Ω/m, insulation-resistance temperature correction runs in the right direction, harmonic neutral current follows IEC 60364-5-52 Annex E, and the IEC 60909 KT factor is applied. The earth-fault loop includes cable reactance, pulling handles three cables in a duct, and duct-bank ratings include the duct air space and wall.",
    ],
  },
  {
    date: "November 2026",
    title: "SCL Studio engineering tools",
    items: [
      "Engineering registers (IEDs, communication, GOOSE/SV, reports, data sets, signal list, logical nodes, GOOSE inputs) exported as one Excel workbook.",
      "Change-impact report when comparing two SCL revisions, including a check for data sets changed without a new confRev.",
      "FAT/SAT point-to-point test sheets, SCADA tag-list checker, GOOSE/SV capture analyzer (pcap/pcapng) and a reference and quality explainer.",
      "More data-set and report checks: trigger options, intgPd, bufTime, report clients and instances, entryID, FCs in report and GOOSE data sets, unused data sets.",
    ],
  },
  {
    date: "November 2026",
    title: "DGA Analyzer",
    items: [
      "New: DGA Analyzer for transformer oil — IEC 60599:2022 gas ratios, Duval Triangles and Pentagons, IEEE C57.104-2019 status, gas trends, fleet dashboard and lab PDF import. All features are open.",
    ],
  },
  {
    date: "November 2026",
    title: "Learning series and earthing conductor sizing correction",
    items: [
      "21 new worked examples in four learning series: short circuit (6), earthing (5), arc flash (5) and protection coordination (5), each with results pinned by tests.",
      "Earthing Grid Design: the earthing conductor size used k = 226 A/mm² for copper, which BS 7430 Table 4 gives only for welded joints at about 450–500 °C. k is now calculated from BS 7430 9.7 for a chosen maximum temperature (default 250 °C for bolted joints, k = 176), so earlier results were about 22 % too small. Stainless steel used k = 106; it is now about 33 at 250 °C (IEEE 80 constants for AISI 304).",
      "The conductor is now sized for the full fault current If × Df, not the grid current IG, which excludes the share returning through cable sheaths and earth wires.",
    ],
  },
  {
    date: "November 2026",
    title: "Earth electrode formulas checked against BS 7430:2011+A1:2015",
    items: [
      "Strip electrode (Earthing Grid Design): now uses BS 7430 9.5.5, R = ρ/(2πL)·ln(L²/(1.36·h·w)). The previous formula read about 10% low (12.1 Ω instead of 13.5 Ω for the default 10 m strip).",
      "Ring electrode (Earthing Grid Design and Ground Ring Resistance): BS 7430 gives no ring formula, so the pages no longer cite it. The ring-of-wire formula of IEEE Std 142 (Dwight) is now used. The previous formula read about 10% low (5.67 Ω instead of 6.33 Ω for the default ring), lower even than a straight wire of the same length.",
      "Rod and plate formulas confirmed against BS 7430 9.5.3 and 9.5.2. Added a worked example for a perimeter ring electrode.",
    ],
  },
  {
    date: "November 2026",
    title: "Worked examples, reference tables, report details, share links and unit toggles",
    items: [
      "Nine new worked examples: motor run-up time, soft starter derating, MPPT charge controller, inverter DC:AC ratio, wind turbine output, solar tilt angle, switchgear short-circuit rating, NEC 25-ft tap rule and transfer switch sizing. Each result is pinned by a test.",
      "Reference tables under calculators (voltage drop mV/A/m, ambient and grouping factors, k values, transformer full-load and fault currents, standard device ratings, air density, soil resistivity), generated from the same data the calculators use.",
      "PDF reports can carry project, client, document reference, revision, prepared-by and checked-by fields, and now include the report title block.",
      "Share inputs: a link that reopens a calculator with the same inputs.",
      "Length, temperature and power fields can be switched between m/ft, °C/°F and kW/hp.",
    ],
  },
  {
    date: "November 2026",
    title: "Protection, IEC 61850 and EV checks",
    items: [
      "Protection Coordination Workbench: the UK rule for 30 mA additional protection now follows BS 7671:2018+A2:2022 (socket-outlets up to 32 A). The previous 20 A limit came from the superseded 2008 edition and could miss 25 A and 32 A socket circuits.",
      "Settings philosophy sweep: rules with no data are shown as \"not assessed\", and the summary states that the assessment is incomplete, so a pass covers only the checks actually run.",
      "IEC 61850 SCL editor and guide: Type 1A GOOSE APPIDs (0x8000–0xBFFF) and Type 1A sampled-value APPIDs (0xC000–0xFFFF) are now recognised instead of being flagged. The report troubleshooting text now covers runtime reservation, enabling, data sets and trigger options.",
      "EV Charging: the cable is now sized so its rating covers the selected breaker (Ib ≤ In ≤ Iz), not just the design current. A list beside the result shows which checks are and are not performed.",
      "CT knee-point conversions are described as conventions (about 80 % or 1/1.2), not as exact relationships.",
      "Added two IEC 61850 worked examples (duplicate GOOSE addresses; tracing an unresolved GOOSE subscription), site search, and a Terms of use & disclaimer page.",
    ],
  },
  {
    date: "November 2026",
    title: "Installation method B2 and multi-cable pulling",
    items: [
      "LV Cable Sizing, EV Charging, Solar PV and BESS: installation method B1 is now correctly described as insulated conductors or single-core cables in conduit on a wall. Method B2 (multicore cable in conduit on a wall) has been added from IEC 60364-5-52 Tables B.52.4 and B.52.5. Previously a multicore cable in conduit could only be modelled as B1, which overstates its current rating by up to about 16%.",
      "Cable Pulling Tension: added one cable, three cables triangular and three cables cradled. The weight correction factor is now applied to straight sections and bends, and sidewall pressure uses the formula for each configuration. For three cables this raises the calculated tension; in the worked example it rises from 200 lbf to 363 lbf.",
      "The cable-pulling worked example now states the number of cables, the weight of each cable and the total, and the configuration.",
    ],
  },
  {
    date: "November 2026",
    title: "Second technical review",
    items: [
      "VFD energy savings: the affinity-law result is described as an upper bound on savings, not a conservative estimate.",
      "CT sizing: the fault-current table no longer extends beyond the CT's actual accuracy limit factor.",
      "Intrinsic safety, NFPA 110 and catalog descriptions: wording corrected to match the standards.",
      "Added a Short Circuit & Arc Flash guide, six worked examples and written guides under six more calculators.",
    ],
  },
  {
    date: "October 2026",
    title: "Full accuracy audit",
    items: [
      "Voltage drop (cable, EV, PV, BESS): the mV/A/m values are single-phase loop values and are now halved per conductor before the 2 or √3 factor. Results were previously about twice the correct drop.",
      "Earthing (IEEE 80): corrected the Km corner term, n = na·nb, the Lm term for rods, and the BS 7430 plate formula.",
      "Power factor correction: capacitance is now shown correctly in µF at the system voltage.",
      "VT sizing: IEC 61869-3 voltage factors and the open-delta winding voltage corrected.",
      "IEC 60909: the peak current uses method B (1.15·κ) when several sources feed the fault.",
      "MV cable: trefoil mutual heating for direct burial and the air gap for ducts included in T4.",
      "NEC: rounding rules for 430.62 and 440.22, the 240.4(D) small-conductor limit, 2000 kcmil at 60 °C, 220.57 EVSE load and the 392.22 mixed-cable tray rule corrected.",
      "IEEE 43: minimum insulation resistance by winding type.",
    ],
  },
];
