import type { Metadata } from "next";
import { categoryHref } from "@/lib/categories";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { CALC_ARTICLES } from "@/lib/calcArticles";

export const SITE_URL = "https://www.ajpowerapps.com";
const BASE = SITE_URL;

/** Shorten to a search-snippet length at a word boundary. */
export function snippet(text: string, max = 158): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  // prefer ending at a full sentence when one fits
  const sentenceEnd = t.slice(0, max).lastIndexOf(". ");
  if (sentenceEnd >= 90) return t.slice(0, sentenceEnd + 1);
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.—-]+$/, "") + "…";
}

/** Page-level metadata: own title, description and canonical URL. The site title template adds "| AJapps". */
export function pageMeta(path: string, title: string, description: string): Metadata {
  const desc = snippet(description);
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title, description: desc, url: `${BASE}${path}`, siteName: "AJapps", type: "website" },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

// Search-focused titles and descriptions for the pages Google already shows
// for real queries (from Search Console): the words people type go first.
// Keep titles under ~52 characters so " | AJapps" still fits in the result.
const CALC_SEO: Record<string, { title: string; description: string }> = {
  "/calculators/dga-analyzer": {
    title: "DGA Analyzer – Duval Triangle & IEC 60599 Online",
    description: "Transformer oil dissolved gas analysis online: IEC 60599 gas ratios, Duval Triangles and Pentagons, IEEE C57.104-2019 status, gas trends, fleet dashboard and lab PDF import.",
  },
  "/calculators/change-comparison": {
    title: "Compare Two Versions of a Register, Tag List or Network Design",
    description: "Compare approved and current versions of an IP register, asset register, SCADA tag list, cable list or SCL NetStudio project: added, removed and changed items with the impact on testing and documentation.",
  },
  "/calculators/configuration-version-log": {
    title: "SCD / CID Configuration Version Log with SHA-256 Check",
    description: "Log which SCD, CID, switch, RTU, PLC or firmware version is approved and installed in each device by SHA-256 fingerprint, read SCL header history, and check any file against the log.",
  },
  "/calculators/scada-tag-validator": {
    title: "SCADA Tag List Validator – Duplicates, Addresses, Alarm Limits",
    description: "Validate a SCADA tag or point list online: duplicate tags and addresses, IEC 104 IOA and Modbus addressing, missing descriptions and units, engineering ranges and alarm limits out of order.",
  },
  "/calculators/patch-compatibility-register": {
    title: "SCADA Patch Register – Windows Updates vs Vendor Approval",
    description: "Compare Windows updates installed on SCADA servers with the vendor's approved list: unapproved or withdrawn updates, missing approved patches and redundant servers on different patch levels.",
  },
  "/calculators/windows-health-analyser": {
    title: "SCADA Server Health Check – Windows Services, Events, Security",
    description: "Read-only PowerShell collector and online analyser for SCADA servers and HMIs: services, crashes, event logs, slow logon, time sync, domain, open ports, firewall, local admins, hardening baseline, certificates.",
  },
  "/calculators/scada-troubleshooting-assistant": {
    title: "SCADA Troubleshooting Guide – No Comms, IEC 104, Time, GOOSE",
    description: "Step-by-step SCADA troubleshooting: no communication with an IED, IEC 104 link drops, wrong time, slow HMI, logon and domain problems, disk full, GOOSE not received — with a ready escalation ticket.",
  },
  "/calculators/command-output-explainer": {
    title: "ipconfig, ping, route & netstat Output Explained – Online",
    description: "Paste ipconfig /all, ping, tracert, route print, arp -a, netstat -ano, w32tm or nslookup output and get it explained in plain language with problems flagged: duplicate IP, APIPA, wrong gateway, blocked ports.",
  },
  "/calculators/windows-error-event-codes": {
    title: "Windows Error & Event ID Lookup – 10060, 10061, 7031, 1129",
    description: "Meaning, causes and checks for Windows error codes and event IDs on SCADA servers: WinSock 10060/10061, 0x80070005, 1789 trust failure, 7031, 1129, 5719, 4625, DCOM 10016, Schannel, Time-Service.",
  },
  "/calculators/snmp-helper": {
    title: "SNMP OID Decoder & snmpwalk Analyser – Switch Port Errors",
    description: "Decode SNMP OIDs (IF-MIB, BRIDGE, LLDP, ENTITY), analyse an snmpwalk of a switch for down links, CRC errors, duplex mismatch and spanning-tree changes, and check SNMPv3 settings.",
  },
  "/calculators/certificate-inspector": {
    title: "X.509 Certificate Viewer Online – OPC UA & TLS Checker",
    description: "Open a certificate (.cer, .crt, .pem, .der) to see subject, issuer, expiry, key, SAN and usages, with checks for expiry, SHA-1, name mismatch, OPC UA ApplicationUri and thumbprint. Nothing uploaded.",
  },
  "/calculators/performance-log-analyser": {
    title: "Performance Monitor Log Analyser – CPU, Memory, Disk Latency",
    description: "Analyse a Windows Performance Monitor CSV from a SCADA server: CPU, memory, disk latency, free space, network and busiest processes against stated thresholds, with memory-leak detection.",
  },
  "/calculators/mac-frame-decoder": {
    title: "MAC Address & GOOSE Frame Decoder – APPID, VLAN, OUI",
    description: "Decode a MAC address or Ethernet frame online: IEC 61850 GOOSE and SV multicast, PTP, PRP/HSR, VLAN tag and priority, EtherType, APPID range check, GOOSE stNum/sqNum and manufacturer OUI lookup.",
  },
  "/calculators/scada-value-converter": {
    title: "Modbus Float Converter – Byte Order, IEC 104 & CP56Time2a",
    description: "Convert two Modbus registers to float or int32 in ABCD, CDAB, BADC and DCBA order, Modbus 40001 notation to address, IEC 104 normalised values, CP56Time2a time and IEC 104 / IEC 61850 quality bits.",
  },
  "/calculators/iec-104-parameter-checker": {
    title: "IEC 104 Parameters k, w, t0–t3 Checker – Timers Explained",
    description: "Check IEC 60870-5-104 link parameters online: k and w window (w ≤ 2/3 k), t0, t1, t2, t3 timers, defaults and ranges, and whether t1 suits the round-trip time of radio, cellular or satellite links.",
  },
  "/calculators/serial-polling-calculator": {
    title: "Modbus RTU Polling Time Calculator – RS-485 Scan Time",
    description: "Calculate Modbus RTU character time, t3.5 gap, transaction time and polling cycle for N devices on RS-485 or radio links, and compare it with the required SCADA scan time.",
  },
  "/calculators/iec-61850-academy": {
    title: "IEC 61850 Training Simulator – GOOSE, MMS & SCADA Labs",
    description: "Learn IEC 61850 on a virtual 132/33 kV substation: GOOSE retransmission and supervision, confRev, test mode, MMS select-before-operate, buffered reports, VLAN faults, protection trips. Ten guided labs with quizzes.",
  },
  "/calculators/scl-netstudio": {
    title: "IEC 61850 Network Design Tool – VLAN, PTP, PRP/HSR",
    description: "Design an IEC 61850 substation network online: IP plan, GOOSE/SV VLAN and multicast addressing, bandwidth, GOOSE latency (TT6), PRP/HSR, PTP time sync budget, firewall zones and capture check.",
  },
  "/calculators/scada-connectivity": {
    title: "Can My Laptop Talk to the IED? – SCADA IP Checker",
    description: "Check if a laptop or SCADA server can reach an IED: IP, subnet mask and gateway checked from both sides, one-way mask mismatches, duplicates, APIPA, suggested address and IEC 61850 / IEC 104 / DNP3 / Modbus ports.",
  },
  "/calculators/fibre-link-budget": {
    title: "Fibre Optic Link Budget Calculator – SFP Loss & Reach",
    description: "Fibre link budget online: 1000BASE-LX/SX/LX10/ZX and 100BASE-FX power budget, OS2/OM1–OM4 attenuation, connector and splice loss (TIA-568.3-D), margin, IEEE 802.3 reach and receiver overload.",
  },
  "/calculators/ip-register-checker": {
    title: "IP Address List Checker – Duplicate IP, Subnet & Gateway",
    description: "Check a substation or SCADA IP address register online: duplicate IPs and MACs, broadcast addresses, gateways outside the subnet, mixed masks per VLAN and overlapping subnets, with line numbers and CSV export.",
  },
  "/calculators/goose-sv-analyzer": {
    title: "GOOSE Analyzer Online – IEC 61850 Wireshark Check",
    description: "Analyse GOOSE and sampled values in a Wireshark capture online: stNum/sqNum, TAL, retransmission, APPID/VLAN, lost samples and smpSynch, with IEC 61850 clause references and SCD comparison.",
  },
  "/calculators/iec-61850-scl-editor": {
    title: "IEC 61850 SCL Editor – SCD, ICD, CID Viewer",
    description: "Online IEC 61850 SCL viewer and editor: open SCD, ICD and CID files, validate, edit, export signal lists to Excel, compare revisions, make FAT/SAT test sheets and analyse GOOSE captures.",
  },
  "/calculators/max-demand": {
    title: "Maximum Demand Calculator & Demand Factor Table",
    description:
      "Max demand calculation online: maximum demand table of demand factors by load category (lighting, sockets, HVAC, motors, EV), design current, breaker and transformer size.",
  },
  "/calculators/idmt": {
    title: "IDMT Relay Calculator – Curve, Trip Time & Grading",
    description:
      "IDMT relay calculator: trip time for IEC 60255 and IEEE C37.112 curves, plug setting multiplier, TCC plot and grading check for two or more relays.",
  },
  "/calculators/cable-tray-fill": {
    title: "Cable Tray Fill Calculator & Chart – NEC 392.22",
    description:
      "Check cable tray fill to NEC 392.22 for ladder, ventilated and solid-bottom trays and multiconductor, control or single-conductor cables, or 40–50% area fill.",
  },
  "/calculators/motor-torque": {
    title: "Motor Torque Calculator – kW or HP to N·m",
    description:
      "Motor power to torque: T = 9550 × kW / rpm (N·m) or 5252 × HP / rpm (lb-ft). A quick kW-to-torque and watts-to-torque calculator for motors and engines.",
  },
  "/calculators/vfd-sizing": {
    title: "VFD Sizing Calculator – Drive Current & Derating",
    description:
      "Size a variable frequency drive from motor FLA with variable or constant torque duty, margin, and ambient and altitude derating; check a candidate drive.",
  },
  "/calculators/rolling-sphere": {
    title: "Rolling Sphere Method Calculator – Protection Radius",
    description:
      "Rolling sphere method radius calculation for lightning masts and LPS: protected radius at ground and at any height, with the IEC 62305-3 sphere radius of 20, 30, 45 or 60 m.",
  },
  "/calculators/earthing": {
    title: "Earthing Grid Design Calculator – IEEE 80",
    description:
      "Online earthing grid (earth mat) design software to IEEE 80: grid resistance, GPR, touch and step voltage, conductor size, plus BS 7430 rod, plate and strip electrodes.",
  },
  "/calculators/power-factor-correction": {
    title: "Power Factor Correction Capacitor Calculator",
    description:
      "kVAr needed to correct power factor, capacitance per phase in µF, capacitor nameplate rating, current reduction, resonance check and detuning reactor.",
  },
  "/calculators/arc-flash": {
    title: "Arc Flash Calculator – IEEE 1584 Incident Energy",
    description:
      "Arc flash calculator: incident energy, arc-flash boundary and indicative PPE category using IEEE 1584-2018, IEEE 1584-2002 or the Ralph Lee method.",
  },
  "/calculators/arc-flash-study": {
    title: "Arc Flash Study Software – IEEE 1584-2018 Online",
    description:
      "Online arc flash calculation software: IEEE 1584-2018 incident energy, arc-flash boundary and PPE at every bus on a single-line diagram, relay clearing times and printable labels.",
  },
  "/calculators/elevator-demand": {
    title: "Elevator Demand Calculator – NEC 620.14",
    description:
      "Elevator motor power from rated load, speed, counterweight and efficiency, with NEC Table 620.14 demand factors for several elevators on one feeder.",
  },
  "/calculators/cable-sizing": {
    title: "Cable Sizing & Voltage Drop Calculator (IEC)",
    description:
      "LV cable sizing to IEC 60364-5-52: current rating with derating, voltage drop, short-circuit withstand, protective conductor size and life-cycle cost.",
  },
  "/calculators/iec-60909": {
    title: "IEC 60909 Short Circuit Calculator",
    description:
      "IEC 60909 short-circuit calculator: Ik″, peak ip, breaking Ib, Ith, line-to-line and earth faults at every bus, with a single-line diagram and full working.",
  },
  "/calculators/motor-calculator": {
    title: "Motor Calculator – NEC 430 FLC & Breaker Size",
    description:
      "NEC Article 430 motor calculator: FLC tables, conductor size, maximum breaker or fuse, overload setting, disconnect, starting voltage dip and motor feeder.",
  },
  "/calculators/cable-engineering-suite": {
    title: "Cable Sizing Software – IEC 60364 & IEC 60502",
    description:
      "Online cable engineering suite: LV/MV cable schedule sizing to IEC 60364-5-52 and IEC 60502-2, derating, voltage drop, fault level, IEC 60287 rating, pulling tension and test planning.",
  },
  "/calculators/engineering-sketch-studio": {
    title: "Single Line Diagram Software Online – SLD Drawing",
    description:
      "Draw single-line diagrams, schematics, loop sheets and P&ID-style sketches online: 620 engineering symbols, terminal-snapping wires, title blocks, BOM and schedules, SVG/DXF/PDF export.",
  },
  "/calculators/protection-suite": {
    title: "Protection Coordination Software (Online)",
    description:
      "Online protection coordination: time-current curves for relays, breakers, fuses and motors, grading checks, damage curves, 87T/87B/87L and CT/VT sizing.",
  },
  "/calculators/wire-ampacity-nec": {
    title: "Wire Size Calculator – NEC 310.16 Ampacity",
    description:
      "NEC wire size calculator: Table 310.16 ampacity with ambient correction, conductor bundling adjustment, terminal temperature limit and 240.4(D) rule.",
  },
  "/calculators/conduit-fill": {
    title: "Conduit Fill Calculator – NEC Chapter 9",
    description:
      "Conduit fill to NEC Chapter 9 for EMT, RMC, IMC, PVC and flexible conduit, with the smallest compliant trade size, plus the IEC/BS space-factor method.",
  },
};


// Search-focused titles for the remaining calculators (description comes from the catalog card).
const CALC_TITLES: Record<string, string> = {
  "/calculators/fault-propagation": "Fault Current Calculator – Base kVA Method",
  "/calculators/generator-fault-contribution": "Generator Fault Current Contribution Calculator",
  "/calculators/switchgear-short-circuit-rating": "Switchgear SCCR & AIC Check – Transformer Fault",
  "/calculators/idmt-earth-fault": "Earth Fault Relay Calculator (50N/51N IDMT)",
  "/calculators/transformer-differential": "Transformer Differential (87T) Slope Calculator",
  "/calculators/breaker-fuse-sizer": "Breaker & Fuse Size Calculator (NEC / IEC)",
  "/calculators/generator-sync": "Generator Synchronizing Check (ANSI 25)",
  "/calculators/afci-gfci-requirements": "AFCI & GFCI Requirements by Room (NEC 210)",
  "/calculators/spd-rating": "SPD Rating Calculator – Type, MCOV & SCCR",
  "/calculators/mv-cable": "Medium Voltage Cable Sizing Calculator (IEC 60287)",
  "/calculators/cable-pulling-tension": "Cable Pulling Tension & Sidewall Pressure",
  "/calculators/control-cable-sizing": "Instrument Cable Capacitance & Length (HART)",
  "/calculators/ohl-voltage-regulation": "Overhead Line Voltage Drop & Regulation",
  "/calculators/line-losses": "Distribution Line Losses Calculator (kWh/yr)",
  "/calculators/feeder-tap-rule": "NEC 240.21(B) Tap Rule Calculator (10/25 ft)",
  "/calculators/duct-bank-heat-rise": "Duct Bank Heat Rise Calculator",
  "/calculators/cable-tray-ventilation": "Cable Tray Ventilation Ratio Calculator",
  "/calculators/lightning-protection": "Lightning Risk Assessment (IEC 62305-2)",
  "/calculators/touch-voltage": "Touch Voltage Calculator (IEC 60364-4-41)",
  "/calculators/static-bonding": "Static Bonding Resistance Check (NFPA 77)",
  "/calculators/esd-energy": "ESD Spark Energy vs MIE Calculator",
  "/calculators/ground-resistance": "Ground Rod Resistance Calculator",
  "/calculators/ground-ring-resistance": "Ground Ring Electrode Resistance Calculator",
  "/calculators/ct-sizing": "CT Sizing & Knee-Point Voltage (IEC 61869-2)",
  "/calculators/vt-sizing": "VT Sizing – Burden & Voltage Factor (IEC 61869-3)",
  "/calculators/transformer-sizer": "Transformer Sizing Calculator (kVA)",
  "/calculators/gen-xfmr": "Generator Sizing & Transformer Efficiency",
  "/calculators/busbar-rating": "Busbar Current Rating & Short-Circuit Check",
  "/calculators/insulation-resistance": "Insulation Resistance Test Checker (IEEE 43)",
  "/calculators/polarization-index": "Polarization Index (PI) Calculator – IEEE 43",
  "/calculators/harmonic-analysis": "Harmonics Calculator – IEEE 519 THD & TDD",
  "/calculators/voltage-unbalance": "Voltage Unbalance & Motor Derating (NEMA)",
  "/calculators/panel-balance": "Panel Load Balancing & Neutral Current",
  "/calculators/power-converter": "kW to kVA to Amps Converter (1 & 3 Phase)",
  "/calculators/tariff": "Electricity Bill Calculator – TOU & Demand",
  "/calculators/diversity-factor": "Diversity Factor Calculator",
  "/calculators/nec-residential-load": "NEC 220 Residential Load Calculation",
  "/calculators/motor-protection-sizer": "Motor Overload & Contactor Sizing",
  "/calculators/vfd-savings": "VFD Energy Savings Calculator (Pumps & Fans)",
  "/calculators/motor-acceleration-time": "Motor Acceleration Time Calculator",
  "/calculators/soft-starter-sizing": "Soft Starter Sizing Calculator",
  "/calculators/vfd-parameter-selection": "VFD Selection Check – Motor vs Drive",
  "/calculators/battery-sizing": "Battery Sizing Calculator (IEEE 485)",
  "/calculators/ups-sizing": "UPS Sizing Calculator – kVA & Battery",
  "/calculators/emergency-power": "Emergency Power – NFPA 110 Genset & UPS",
  "/calculators/genset-fuel": "Generator Fuel Consumption & Runtime",
  "/calculators/energy-storage": "BESS Sizing Calculator – Battery Storage",
  "/calculators/transfer-switch-sizing": "Automatic Transfer Switch (ATS) Sizing",
  "/calculators/emergency-lighting-duration": "Emergency Lighting Battery Duration",
  "/calculators/chp-sizing": "CHP (Cogeneration) Sizing Calculator",
  "/calculators/microgrid-stability-estimator": "Microgrid Stability Estimator",
  "/calculators/smart-grid-peak-shaving": "Peak Shaving BESS Calculator – Payback",
  "/calculators/current-loop-4-20ma": "4-20 mA Loop Calculator – Voltage & Length",
  "/calculators/intrinsic-safety": "Intrinsic Safety Entity Calculator (IEC 60079)",
  "/calculators/thermocouple-rtd": "Thermocouple & RTD (Pt100) Calculator",
  "/calculators/fg-loop": "Fire & Gas Detection Loop Voltage Drop",
  "/calculators/solar-pv": "Solar PV String & Cable Sizing Calculator",
  "/calculators/ev-charging": "EV Charger Cable & Breaker Sizing",
  "/calculators/solar-charge-controller-sizing": "Solar Charge Controller Size Calculator",
  "/calculators/solar-panel-tilt-angle": "Solar Panel Tilt Angle by Latitude",
  "/calculators/inverter-sizing": "Solar Inverter Sizing & DC/AC Ratio",
  "/calculators/wind-turbine-power-output": "Wind Turbine Power Calculator",
  "/calculators/hvac-electrical-sizing": "HVAC MCA & MOCP Calculator (NEC 440)",
  "/calculators/lighting-design": "Lux Calculator – Lumen Method Lighting",
  "/calculators/elevator-energy": "Elevator Energy Consumption Calculator",
  "/calculators/pue": "Data Center PUE Calculator",
  "/calculators/life-cycle-cost": "Life-Cycle Cost (LCC) Calculator",
  "/calculators/heat-tracing": "Heat Tracing Calculator – Pipe Heat Loss",
  "/calculators/enclosure-cooling": "Enclosure Cooling & Fan Sizing Calculator",
};

/** Metadata for a calculator page, taken from its catalog card (or a search-focused override). */
export function calcMetadata(href: string): Metadata {
  const o = CALC_SEO[href];
  if (o) return pageMeta(href, o.title, o.description);
  for (const g of CALCULATOR_GROUPS) {
    const c = g.calculators.find((x) => x.href === href);
    if (c) {
      // searchers type "... calculator", so make sure the title says it
      const title = CALC_TITLES[href] ?? (/calculator|study|suite|selector/i.test(c.name) ? c.name : `${c.name} Calculator`);
      return pageMeta(href, title, c.description);
    }
  }
  return { alternates: { canonical: href } };
}

/** schema.org structured data for a calculator page (WebApplication + breadcrumb). */
export function calcJsonLd(href: string): object[] {
  for (const g of CALCULATOR_GROUPS) {
    const c = g.calculators.find((x) => x.href === href);
    if (!c) continue;
    const o = CALC_SEO[href];
    const name = o?.title ?? CALC_TITLES[href] ?? (/calculator|study|suite|selector/i.test(c.name) ? c.name : `${c.name} Calculator`);
    const article = CALC_ARTICLES[href];
    const faq = article && article.faqs.length > 0
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }]
      : [];
    return [
      ...faq,
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name,
        url: `${BASE}${href}`,
        description: snippet(o?.description ?? c.description, 300),
        applicationCategory: "EngineeringApplication",
        operatingSystem: "Any (runs in a web browser)",
        publisher: { "@type": "Organization", name: "AJapps", url: BASE },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Calculators", path: "/calculators" },
        { name: g.title, path: categoryHref(g.id) },
        { name, path: href },
      ]),
    ];
  }
  return [];
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${BASE}${it.path}` })),
  };
}
