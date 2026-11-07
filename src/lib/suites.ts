// The full engineering applications, shown together on /suites, in the
// "Engineering Suites" menu and on the home page. Each one also stays listed
// in its own calculator category.

export interface Suite {
  name: string;
  short: string; // menu label
  href: string;
  tagline: string;
  points: string[];
  standards: string;
}

export const SUITES: Suite[] = [
  {
    name: "Protection Coordination Suite",
    short: "Protection Coordination",
    href: "/calculators/protection-suite",
    tagline: "Time-current coordination workbench for relays, breakers, fuses and motors.",
    points: [
      "IDMT, definite-time, LSIG, MCB, fuse, motor and custom curves on one TCC chart",
      "Grading checks, damage curves and suggested setting changes",
      "Transformer, busbar, line and generator protection setting tools; CT/VT sizing",
    ],
    standards: "IEC 60255, IEEE C37.112, IEC 60909, IEC 60947, BS 7671",
  },
  {
    name: "Cable Engineering Suite",
    short: "Cable Engineering",
    href: "/calculators/cable-engineering-suite",
    tagline: "LV and MV cable design and sizing, from the cable schedule to site tests.",
    points: [
      "Cable schedule sizing: current capacity, voltage drop, short circuit, earth-fault loop, motor starting",
      "IEC 60287 rating with mutual heating, duct banks and sheath bonding",
      "Pulling tension, fill, drums, glands and VLF/IR test planning",
    ],
    standards: "IEC 60364-5-52, IEC 60502-2, IEC 60287, IEC 60909, IEC 60228",
  },
  {
    name: "SCL Studio",
    short: "SCL Studio (IEC 61850)",
    href: "/calculators/iec-61850-scl-editor",
    tagline: "View, validate and edit IEC 61850 SCL files in the browser.",
    points: [
      "SCD, ICD, CID, IID and SSD: data model, GOOSE, sampled values and reports",
      "Validation, revision compare and change-impact report",
      "Signal lists to Excel, FAT/SAT test sheets, SCADA tag check and GOOSE capture analysis",
    ],
    standards: "IEC 61850-6, IEC 61850-7, IEC 61850-8-1, IEC 61850-9-2",
  },
  {
    name: "DGA Analyzer",
    short: "DGA Analyzer",
    href: "/calculators/dga-analyzer",
    tagline: "Dissolved gas analysis of transformer oil for a whole fleet.",
    points: [
      "IEC 60599 gas ratios, Duval Triangles and Pentagons",
      "IEEE C57.104-2019 status, gas trends and fleet dashboard",
      "Lab PDF import and printable reports",
    ],
    standards: "IEC 60599:2022, IEEE C57.104-2019",
  },
];
