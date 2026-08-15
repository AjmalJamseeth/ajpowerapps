// Single source of truth for the calculator catalog: every live calculator's
// name/description/href, organized into logical engineering-domain groups,
// plus a short roadmap list of not-yet-built items. Both the home page and
// the /calculators index import from here, so the two pages can never drift
// out of sync with each other the way the old two-separate-arrays setup did.

export type CalcStatus = "live" | "soon";

export interface CalcCard {
  name: string;
  description: string;
  href: string;
  status: CalcStatus;
}

export interface CalcGroup {
  id: string;
  title: string;
  description: string;
  icon: string; // lucide-react icon name
  calculators: CalcCard[];
}

export const CALCULATOR_GROUPS: CalcGroup[] = [
  {
    id: "protection",
    title: "Protection & Relaying",
    description:
      "IDMT relay coordination and grading, differential and earth-fault protection, arc flash, breaker/fuse sizing, and generator paralleling/fault contribution.",
    icon: "ShieldCheck",
    calculators: [
      { name: "IDMT Relay Coordination", description: "IEC 60255 & IEEE C37.112 inverse-time curves. Compare two relays and check grading margin.", href: "/calculators/idmt", status: "live" },
      { name: "IDMT Earth Fault Relay (50N/51N)", description: "Earth-fault IDMT trip time and optional instantaneous stage, reusing the verified IEC 60255-151 / IEEE C37.112 curve engine. Fully free — no subscriber gate.", href: "/calculators/idmt-earth-fault", status: "live" },
      { name: "Multi-Bus IDMT Grading", description: "Cascading grading-margin study across a chain of IDMT relays at a single fault current. Fully free — no subscriber gate.", href: "/calculators/idmt-grading", status: "live" },
      { name: "Transformer Differential Protection (87T)", description: "Percentage-bias dual-slope restraint characteristic trip/no-trip check, IEEE C37.91-consistent. Fully free — no subscriber gate.", href: "/calculators/transformer-differential", status: "live" },
      { name: "Fault Current Propagation (Base kVA Method)", description: "Available fault current at successive points down a radial network using the classic Base kVA Method. Fully free — no subscriber gate.", href: "/calculators/fault-propagation", status: "live" },
      { name: "Arc Flash", description: "Incident energy, arc flash boundary and PPE category — IEEE 1584-2002 and Ralph Lee free, IEEE 1584-2018 as a subscriber feature.", href: "/calculators/arc-flash", status: "live" },
      { name: "Circuit Breaker & Fuse Sizer", description: "General continuous/non-continuous load OCPD sizing (NEC 210.19/215.2 + 240.4, or IEC 60364-4-43) and motor starting-current withstand sizing (NEC 430.52). Fully free — no subscriber gate.", href: "/calculators/breaker-fuse-sizer", status: "live" },
      { name: "Generator Sync Check", description: "Voltage, frequency and phase-angle synchronization check (ANSI device 25 style) before closing a generator paralleling breaker. Fully free — no subscriber gate.", href: "/calculators/generator-sync", status: "live" },
      { name: "Parallel Generator Fault Contribution", description: "Per-generator and total fault current contribution at a common bus, subtransient-reactance method. Fully free — no subscriber gate.", href: "/calculators/generator-fault-contribution", status: "live" },
    ],
  },
  {
    id: "cables",
    title: "Cables & Line Engineering",
    description:
      "Cable and conductor sizing, fill and pulling calculations, and overhead/distribution line voltage regulation and losses.",
    icon: "Cable",
    calculators: [
      { name: "Cable Sizing & Voltage Drop", description: "IEC 60364-5-52 current-carrying capacity and voltage drop, with derating, short-circuit withstand, CPC sizing and lifecycle cost as subscriber features.", href: "/calculators/cable-sizing", status: "live" },
      { name: "MV Cable Sizing", description: "IEC 60287 first-principles thermal-circuit current rating for single-core MV/HV cables, cross-checked against CIGRE TB880. Fully free — no subscriber gate.", href: "/calculators/mv-cable", status: "live" },
      { name: "Conduit Fill", description: "NEC Chapter 9 Table 1/4/5 (US) or IEC/BS 7671 45%/40% space-factor method (International). Fully free — no subscriber gate.", href: "/calculators/conduit-fill", status: "live" },
      { name: "Cable Tray Fill", description: "NEC §392.22 width/area rules by tray type & cable category, or IEC 61537-style area-fill. Entirely a subscriber feature.", href: "/calculators/cable-tray-fill", status: "live" },
      { name: "Cable Pulling Tension", description: "IEEE 1185 tension/capstan equations, sidewall bearing pressure & jam ratio. Entirely a subscriber feature.", href: "/calculators/cable-pulling-tension", status: "live" },
      { name: "Control / Instrumentation Cable Sizing", description: "HART/4-20mA capacitance-limited maximum cable length, minimum conductor size guidance, and general EMI separation-distance practice. Fully free — no subscriber gate.", href: "/calculators/control-cable-sizing", status: "live" },
      { name: "Overhead Line Voltage Regulation", description: "Voltage drop and regulation from your own conductor R/X per km, current, PF and length. Fully free — no subscriber gate.", href: "/calculators/ohl-voltage-regulation", status: "live" },
      { name: "Distribution Line Technical Losses", description: "Annual I²R energy loss estimate from peak load, diversity and load factor, using the loss-factor approximation. Fully free — no subscriber gate.", href: "/calculators/line-losses", status: "live" },
    ],
  },
  {
    id: "earthing",
    title: "Earthing, Lightning & Static Safety",
    description:
      "Earthing grid design, lightning protection and rolling sphere method, touch voltage, and static/ESD hazard checks.",
    icon: "Zap",
    calculators: [
      { name: "Earthing Grid Design", description: "IEEE 80 grid resistance, GPR and tolerable touch/step limits, plus BS 7430 electrode sizing. Mesh/step voltage pass-fail, layered soil and parallel electrodes are subscriber features.", href: "/calculators/earthing", status: "live" },
      { name: "Lightning Protection", description: "IEC 62305-1/2 risk assessment — collection area, structure risk and minimum LPS class. Connected-line risk and SPD/LEMP protection sizing are subscriber features.", href: "/calculators/lightning-protection", status: "live" },
      { name: "LPS Rolling Sphere Method", description: "Single air-terminal protection radius against the IEC 62305 rolling sphere for a given LPS class. Fully free — no subscriber gate.", href: "/calculators/rolling-sphere", status: "live" },
      { name: "Touch Voltage from Imbalance", description: "Ground potential rise and touch voltage from an unbalanced neutral/earth current, checked against IEC 60364-4-41 limits. Fully free — no subscriber gate.", href: "/calculators/touch-voltage", status: "live" },
      { name: "Static Bonding & Grounding Check", description: "Hazardous-area bonding/grounding resistance check against the NFPA 77 static-electricity dissipation threshold. Fully free — no subscriber gate.", href: "/calculators/static-bonding", status: "live" },
      { name: "ESD Spark Energy Check", description: "Capacitive discharge spark energy (E=½CV²) vs. atmosphere Minimum Ignition Energy, per IEC 60079-32-1 screening practice. Fully free — no subscriber gate.", href: "/calculators/esd-energy", status: "live" },
    ],
  },
  {
    id: "transformers",
    title: "Transformers, CT/VT & Condition Testing",
    description:
      "Transformer, CT, VT and busbar sizing/rating, plus insulation resistance and polarization index condition tests.",
    icon: "Waypoints",
    calculators: [
      { name: "CT Sizing & Saturation", description: "IEC 61869-2 CT ratio, itemized burden and ALF/knee-point voltage check. Saturation analysis, metering class, thermal/mechanical withstand and multi-ratio taps are subscriber features.", href: "/calculators/ct-sizing", status: "live" },
      { name: "VT Sizing", description: "IEC 61869-3 voltage transformer ratio, voltage factor by earthing system, and burden vs. standard rated outputs. Protection class, thermal limiting output and open-delta residual voltage are subscriber features.", href: "/calculators/vt-sizing", status: "live" },
      { name: "Transformer Sizer", description: "Sizes a new transformer (or N-1 redundant group) from connected load, growth/safety margins, ambient derating, and standard ANSI/IEEE kVA ratings. Fully free — no subscriber gate.", href: "/calculators/transformer-sizer", status: "live" },
      { name: "Generator & Transformer Analysis", description: "Genset sizing for running + motor-starting load, and transformer loss/efficiency/regulation from test data. NGR/NET earthing resistor sizing is a subscriber feature.", href: "/calculators/gen-xfmr", status: "live" },
      { name: "Busbar & Switchgear Rating", description: "First-principles continuous ampacity and temperature rise for rectangular busbars. Short-time thermal withstand and electrodynamic force check are subscriber features.", href: "/calculators/busbar-rating", status: "live" },
      { name: "Insulation Resistance Checker", description: "IEEE 43 kV+1 minimum-IR check with 40°C temperature correction. Fully free — no subscriber gate.", href: "/calculators/insulation-resistance", status: "live" },
      { name: "Polarization Index (PI)", description: "PI = IR(10min)/IR(1min) with IEEE 43 condition bands and minimum-PI check by insulation class. Fully free — no subscriber gate.", href: "/calculators/polarization-index", status: "live" },
    ],
  },
  {
    id: "power-quality",
    title: "Power Quality, Demand & Metering",
    description:
      "Power factor correction, harmonics, demand studies, voltage/load balance, unit conversion and tariff estimation.",
    icon: "Activity",
    calculators: [
      { name: "Power Factor Correction", description: "IEC 60831 capacitor bank sizing with current/kVA reduction. Harmonic resonance, detuning reactor sizing and energy-savings analysis are subscriber features.", href: "/calculators/power-factor-correction", status: "live" },
      { name: "Harmonic Analysis", description: "IEEE 519-2014 Table 1 (voltage) & Table 2 (current, TDD-referenced) distortion limit checks. Full per-order breakdown table and K-factor estimate are subscriber features.", href: "/calculators/harmonic-analysis", status: "live" },
      { name: "Maximum Demand", description: "Load-category demand-factor method with design current and breaker sizing. Multi-board site aggregation & transformer sizing is a subscriber feature.", href: "/calculators/max-demand", status: "live" },
      { name: "Voltage Unbalance & Motor Derating", description: "NEMA-style % voltage unbalance and motor derating factor from the NEMA MG1 / ANSI C84.1 curve. Fully free — no subscriber gate.", href: "/calculators/voltage-unbalance", status: "live" },
      { name: "DB Panel Balancer", description: "Per-phase load balance and neutral current from the standard 3-phase phasor formula. Fully free — no subscriber gate.", href: "/calculators/panel-balance", status: "live" },
      { name: "kW / kVA / kVAR / Amps Converter", description: "Single-phase and three-phase power-triangle and current conversions from a load profile (voltage, power factor, and any one known quantity). Fully free — no subscriber gate.", href: "/calculators/power-converter", status: "live" },
      { name: "Demand Charge / TOU Tariff", description: "Estimates a monthly electricity bill from itemized time-of-use energy, peak demand charge, fixed charge and an optional power-factor penalty. Fully free — no subscriber gate.", href: "/calculators/tariff", status: "live" },
    ],
  },
  {
    id: "motors",
    title: "Motors & Drives",
    description: "Motor branch-circuit sizing, motor protection, and VFD energy savings.",
    icon: "CircleGauge",
    calculators: [
      { name: "Motor Calculator", description: "NEC Article 430 (FLC tables, branch-circuit/OCPD/overload/disconnect sizing) or IEC general method, plus starting-method voltage-dip check. Entirely a subscriber feature.", href: "/calculators/motor-calculator", status: "live" },
      { name: "Motor Protection Sizer", description: "Overload relay setting & trip class (NEC 430.32 / IEC 60947-4-1), AC-3/AC-4 contactor sizing, and ground-fault pickup guidance by system grounding type. Fully free — no subscriber gate.", href: "/calculators/motor-protection-sizer", status: "live" },
      { name: "Pump/Fan VFD Energy Savings", description: "Affinity-law (power ∝ speed³) energy and cost savings estimate for switching a centrifugal pump/fan from throttled to VFD control. Fully free — no subscriber gate.", href: "/calculators/vfd-savings", status: "live" },
    ],
  },
  {
    id: "backup-power",
    title: "Backup Power: Batteries, UPS & Generators",
    description: "Battery sizing, UPS sizing, emergency power sequencing, genset fuel, and energy storage (BESS).",
    icon: "BatteryCharging",
    calculators: [
      { name: "Battery & DC System Sizing", description: "IEEE 485 duty-cycle section method for lead-acid battery capacity. Random loads, cell/voltage window checks and charger sizing are subscriber features.", href: "/calculators/battery-sizing", status: "live" },
      { name: "UPS Sizing", description: "Required UPS kVA rating from critical load, margin and redundancy configuration, plus approximate battery energy/Ah for the stated backup time. Fully free — no subscriber gate.", href: "/calculators/ups-sizing", status: "live" },
      { name: "Emergency Power (Genset+UPS)", description: "NFPA 110 Type/Class classification, UPS-to-genset bridge timing check, and staged load-step pickup planner. Entirely a subscriber feature.", href: "/calculators/emergency-power", status: "live" },
      { name: "Genset Fuel Consumption & Running Cost", description: "Runtime and hourly cost from tank size and your genset's own fuel consumption rate. Fully free — no subscriber gate.", href: "/calculators/genset-fuel", status: "live" },
      { name: "Energy Storage (BESS)", description: "IEEE 1547 / IEC 62933 usable-energy, nameplate capacity, C-rate and PCS voltage-window sizing with AC cable sizing. Multi-bank site aggregation & cycle-life estimate are subscriber features.", href: "/calculators/energy-storage", status: "live" },
    ],
  },
  {
    id: "instrumentation",
    title: "Instrumentation & Process Controls",
    description: "4-20mA loop budgets, intrinsic safety, thermocouple/RTD conversion, and fire & gas loop power.",
    icon: "Gauge",
    calculators: [
      { name: "4-20mA Current Loop", description: "Loop voltage budget for a 2-wire loop-powered transmitter — wire voltage drop, transmitter headroom, and maximum cable length by AWG. Fully free — no subscriber gate.", href: "/calculators/current-loop-4-20ma", status: "live" },
      { name: "Intrinsic Safety (IS) Verification", description: "IEC 60079-11 entity concept — voltage/current/power and capacitance/inductance checks (with the 1% rule) for combining a barrier with IS field apparatus and cable. Fully free — no subscriber gate.", href: "/calculators/intrinsic-safety", status: "live" },
      { name: "Thermocouple & RTD", description: "NIST ITS-90 thermocouple mV-to-temperature with cold-junction compensation (K/J/T/E), plus IEC 60751 Callendar-Van Dusen RTD conversion with lead-wire compensation. Fully free — no subscriber gate.", href: "/calculators/thermocouple-rtd", status: "live" },
      { name: "Fire & Gas Detection Loop Budget", description: "Standby and alarm-condition voltage budget for a multi-detector fire/gas initiating device circuit with an end-of-line resistor. Fully free — no subscriber gate.", href: "/calculators/fg-loop", status: "live" },
    ],
  },
  {
    id: "solar-ev",
    title: "Solar, EV & Renewables",
    description: "Solar PV string/inverter sizing and EV charge point sizing — with room to grow as more renewables tools ship.",
    icon: "Sun",
    calculators: [
      { name: "Solar PV Sizing", description: "IEC 62548 & IEC 60364-7-712 string voltage window, inverter matching, and DC/AC cable sizing. Multi-string parallel arrays with combiner/feeder sizing are a subscriber feature.", href: "/calculators/solar-pv", status: "live" },
      { name: "EV Charging", description: "IEC 61851-1 / 60364-7-722 / 62955 charge point cable, breaker and RCD sizing. Multi-point site demand with load-management diversity is a subscriber feature.", href: "/calculators/ev-charging", status: "live" },
    ],
  },
  {
    id: "building-services",
    title: "Building Services & Facilities",
    description: "HVAC electrical sizing, lighting design, elevators, data-center PUE, life-cycle cost, and heat management.",
    icon: "Building2",
    calculators: [
      { name: "HVAC Electrical Sizing", description: "Motor-compressor branch-circuit sizing (NEC Art. 440) or IEC general method. Single motor free — multi-motor combination-load & VFD-fed motor are subscriber features.", href: "/calculators/hvac-electrical-sizing", status: "live" },
      { name: "Lighting Design", description: "Lumen method (EN 12464-1 or IES Handbook). Interior room types are free — exterior/area lighting and EN 1838 emergency lighting checks are subscriber features.", href: "/calculators/lighting-design", status: "live" },
      { name: "Elevator Electrical Demand", description: "Traction elevator motor power from load/speed/balance/efficiency, plus NEC Table 620.14 feeder demand factor for a group of elevators. Fully free — no subscriber gate.", href: "/calculators/elevator-demand", status: "live" },
      { name: "Data Center PUE", description: "Power Usage Effectiveness (PUE) & DCiE from facility/IT energy, overhead cost, and a Green Grid efficiency-band classification. Fully free — no subscriber gate.", href: "/calculators/pue", status: "live" },
      { name: "Life-Cycle Cost (LCC)", description: "Discounted-cash-flow life-cycle cost comparison of two options (e.g. standard vs. premium efficiency) with present worth, equivalent annual cost and simple payback. Fully free — no subscriber gate.", href: "/calculators/life-cycle-cost", status: "live" },
      { name: "Heat Tracing Circuit Sizing", description: "Electrical trace-heating power from pipe insulation heat loss, heater cable selection, and circuit voltage-drop/breaker sizing. Fully free — no subscriber gate.", href: "/calculators/heat-tracing", status: "live" },
      { name: "Panel/MCC Enclosure Cooling", description: "Natural-convection heat-dissipation check for panel/MCC enclosures, with IEC 60890-derived forced-air fan sizing if needed. Fully free — no subscriber gate.", href: "/calculators/enclosure-cooling", status: "live" },
    ],
  },
];

export const TOTAL_LIVE_COUNT = CALCULATOR_GROUPS.reduce(
  (sum, g) => sum + g.calculators.length,
  0
);

export const ROADMAP_ITEMS: string[] = [
  "Dissolved gas analysis (DGA) — transformer oil condition interpretation",
  "Real user accounts, subscriptions & payments",
  "Multi-standard cable sizing (AS/NZS 3008, BS 7671, NEC)",
  "IEEE 1584-2018 enclosure size correction factor (pending discrepancy resolution)",
  "Cathodic protection sizing",
  "Vibration monitoring thresholds",
  "SPD/LEMP surge protection coordination (IEC 62305 Annex D)",
  "Transferred potential & grid design assistant (Earthing)",
];
