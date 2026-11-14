// Indexable landing page for each calculator category (/calculators/<slug>).
// Keyed by CALCULATOR_GROUPS[].id. Slugs must never match a calculator's own
// folder name under src/app/calculators.

export interface CategoryPage {
  slug: string;
  title: string; // search title, about 50 characters
  intro: string[];
}

export const CATEGORY_PAGES: Record<string, CategoryPage> = {
  "short-circuit": {
    slug: "short-circuit-arc-flash",
    title: "Short Circuit & Arc Flash Calculators",
    intro: [
      "Calculate fault currents and arc-flash hazards from a single bus up to a full network. The IEC 60909 calculator solves every bus of a multi-source network with a single-line diagram, and the arc-flash tools apply IEEE 1584-2018 to give incident energy, arc-flash boundary and PPE for labels.",
      "Quicker checks cover fault current by the base kVA method, generator contributions and switchgear short-circuit ratings against NEC 110.9 and 110.10.",
    ],
  },
  protection: {
    slug: "protection-relaying",
    title: "Protection & Relay Coordination Calculators",
    intro: [
      "Set and check protection: IDMT overcurrent and earth-fault relays to IEC 60255 and IEEE C37.112, grading across the full fault-current range, transformer differential slopes, breaker and fuse sizing, and the full protection coordination workbench with time-current curves.",
      "Supporting tools cover generator synchronising checks, AFCI and GFCI requirements and surge protective device ratings.",
    ],
  },
  "iec-61850": {
    slug: "iec-61850",
    title: "IEC 61850 Tools – SCL, SCD, GOOSE & Network Design",
    intro: [
      "Tools for substation automation engineers. SCL Studio opens, validates and edits SCD, ICD, CID, IID and SSD files; SCL NetStudio designs the station network; the GOOSE & SV Capture Analyzer checks Wireshark captures against the standard; and 61850 Academy teaches IEC 61850 on a live virtual substation.",
      "For network, Windows and protocol problems on site, see SCADA Communications, Network & IT. Every tool explains its method and limits, and files never leave your computer.",
    ],
  },
  "scada-it": {
    slug: "scada-communications-it",
    title: "SCADA Communications, Network & IT Tools",
    intro: [
      "Tools for the network, Windows and protocol questions SCADA engineers meet every day — written so that an engineer without an IT background can diagnose the common problems and escalate the rest with evidence.",
      "Start with the Troubleshooting & Escalation Assistant, read command outputs with the Command Output Explainer, look up error and event codes, check addressing, registers, fibre links, SNMP counters and certificates, and convert Modbus and IEC 104 values. Everything runs in your browser; nothing is uploaded.",
    ],
  },
  commissioning: {
    slug: "commissioning-change-configuration",
    title: "Commissioning, Change & Configuration Management Tools",
    intro: [
      "A substation automation system is only as reliable as the control of its changes. These tools compare the approved and current versions of registers, tag lists and network designs, log which configuration file is approved and installed in every device by its SHA-256 fingerprint, validate SCADA tag databases before loading, and keep Windows patches in line with the SCADA vendor's approvals.",
      "Everything runs in your browser; files are never uploaded. Download the logs and reports and keep them with the project records.",
    ],
  },
  cables: {
    slug: "cables-line-engineering",
    title: "Cable Sizing & Line Engineering Calculators",
    intro: [
      "Size LV and MV cables and check installations: current rating with derating and voltage drop to IEC 60364-5-52, IEC 60287 MV cable ratings, NEC wire ampacity, conduit and cable tray fill, pulling tension, duct bank heating, and overhead line voltage regulation and losses.",
    ],
  },
  earthing: {
    slug: "earthing-lightning",
    title: "Earthing, Lightning & Static Calculators",
    intro: [
      "Design earthing grids to IEEE 80 with touch and step voltage checks, size rod, plate and strip electrodes to BS 7430 and ring electrodes to IEEE 142, assess lightning risk to IEC 62305-2 and size protection with the rolling sphere method, and check static bonding and ESD ignition risk.",
    ],
  },
  transformers: {
    slug: "transformers-ct-vt",
    title: "Transformer, CT & VT Calculators",
    intro: [
      "Size transformers, current transformers and voltage transformers: CT knee-point voltage and saturation to IEC 61869-2, VT burden and voltage factor to IEC 61869-3, transformer kVA sizing, losses and regulation, generator sizing, busbar ratings, and insulation resistance and polarization index tests to IEEE 43.",
    ],
  },
  "power-quality": {
    slug: "power-quality-demand",
    title: "Power Quality & Maximum Demand Calculators",
    intro: [
      "Estimate maximum demand and diversity, correct power factor, check harmonics against IEEE 519, assess voltage unbalance and motor derating, balance panels, convert kW, kVA and amps, and estimate electricity bills and NEC 220 residential loads.",
    ],
  },
  motors: {
    slug: "motors-drives",
    title: "Motor & Drive Calculators (NEC 430, VFD)",
    intro: [
      "Size motor circuits and drives: NEC 430 full-load current, conductors and overcurrent protection, overloads and contactors, torque and acceleration time, VFD and soft starter selection, and VFD energy savings on pumps and fans.",
    ],
  },
  "backup-power": {
    slug: "backup-power-ups-generators",
    title: "UPS, Battery & Generator Sizing Calculators",
    intro: [
      "Size backup power systems: stationary batteries to IEEE 485, UPS and battery autonomy, generators and fuel, transfer switches, NFPA 110 emergency power, battery energy storage, emergency lighting, CHP, microgrids and peak shaving.",
    ],
  },
  instrumentation: {
    slug: "instrumentation-process-control",
    title: "Instrumentation & Process Control Calculators",
    intro: [
      "Check instrument circuits: 4–20 mA loop voltage budgets, intrinsic safety entity parameters to IEC 60079, thermocouple and RTD conversion with cold-junction and lead compensation, and fire and gas detection loop voltage.",
    ],
  },
  "solar-ev": {
    slug: "solar-ev-renewables",
    title: "Solar PV, EV Charging & Renewables Calculators",
    intro: [
      "Design solar PV strings and cables, size inverters and charge controllers, choose panel tilt, size EV charge-point cables, breakers and RCDs to IEC 60364-7-722, and estimate wind turbine output.",
    ],
  },
  "building-services": {
    slug: "building-services",
    title: "Building Services Electrical Calculators",
    intro: [
      "Electrical design for buildings and facilities: HVAC circuits to NEC 440, lighting by the lumen method, elevator demand and energy, data-center PUE, life-cycle cost, heat tracing and enclosure cooling.",
    ],
  },
};

/** URL of a category landing page (falls back to the directory anchor if a group has no page yet). */
export function categoryHref(groupId: string): string {
  const c = CATEGORY_PAGES[groupId];
  return c ? `/calculators/${c.slug}` : `/calculators#${groupId}`;
}

export function groupIdForSlug(slug: string): string | undefined {
  return Object.keys(CATEGORY_PAGES).find((id) => CATEGORY_PAGES[id].slug === slug);
}
