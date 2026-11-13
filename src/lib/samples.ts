// Downloadable sample files for the IEC 61850 and SCADA tools. Each one is
// built from the tools' own demonstration data, so what you see after opening
// it matches the guides and worked examples. Files live in public/samples.

export interface SampleFile {
  file: string;
  title: string;
  format: string;
  openIn: { name: string; href: string }[];
  what: string;
  expect: string[];
}

export const SAMPLE_FILES: SampleFile[] = [
  {
    file: "S13_Sample.scd",
    title: "S13 132/33 kV substation — SCD",
    format: "IEC 61850 SCL (SCD, Edition 2)",
    openIn: [
      { name: "SCL Studio", href: "/calculators/iec-61850-scl-editor" },
      { name: "SCL NetStudio", href: "/calculators/scl-netstudio" },
    ],
    what: "A small but complete substation configuration: a line distance IED (P132_Q01), a transformer differential IED (P87T_T1) and a station gateway (GW1), with data sets, GOOSE and report control blocks, ExtRef subscriptions and communication addresses.",
    expect: [
      "SCL Studio: 3 IEDs, 4 data sets, 2 GOOSE and 2 report control blocks, and no validation errors.",
      "Data flow: a trip GOOSE (APPID 0011) from P132_Q01 to P87T_T1, a differential intertrip (APPID 0021) back, and two reports to GW1.",
      "SCL NetStudio (Import SCD or Open in NetStudio): the IEDs and GOOSE streams become a network project with the addresses kept.",
    ],
  },
  {
    file: "GOOSE_SV_demo_bay1.pcap",
    title: "One bay, five seconds — capture with deliberate faults",
    format: "Wireshark capture (.pcap)",
    openIn: [{ name: "GOOSE & SV Capture Analyzer", href: "/calculators/goose-sv-analyzer" }],
    what: "GOOSE and sampled-value traffic of one bay: a trip GOOSE, a status GOOSE, an interlocking GOOSE and a 9-2LE merging unit, with faults built in so every kind of finding can be seen.",
    expect: [
      "A trip GOOSE with a lost repetition, and a status GOOSE whose time allowed to live has no margin and which then goes silent for three seconds.",
      "An interlocking GOOSE in simulation with low VLAN priority whose data changes without a new stNum.",
      "A merging unit with eight lost samples and a neutral current that does not match the phases.",
    ],
  },
  {
    file: "GOOSE_SV_demo_bay1.scd",
    title: "SCD for the demonstration capture",
    format: "IEC 61850 SCL (SCD)",
    openIn: [{ name: "GOOSE & SV Capture Analyzer", href: "/calculators/goose-sv-analyzer" }],
    what: "The configuration of the bay in the demonstration capture. Open it together with the capture to compare every stream with its configured APPID, MAC address, VLAN, confRev and data set.",
    expect: ["With the SCD loaded, the analyzer adds configuration-versus-traffic findings to the capture findings."],
  },
  {
    file: "S13_NetStudio_project.nsproj.json",
    title: "S13 network design — SCL NetStudio project",
    format: "SCL NetStudio project file (.json)",
    openIn: [{ name: "SCL NetStudio", href: "/calculators/scl-netstudio" }],
    what: "The complete sample network design: devices and switches, IP plan, GOOSE/SV addressing, bandwidth, latency, redundancy, time sync, firewall zones, port and cable schedule with a fibre trunk, and the asset register.",
    expect: [
      "Ports & cables: one error (the 115 m copper run to BCU_J01) and fibre trunk FT-YARD-01 with cores 1-2 and 3-4.",
      "Asset register: a warning that the two DP-700 relays run firmware 3.2.1 and 3.1.4, and a note that MU_Q01 has no serial number.",
      "Firewall: one error, corporate IT reaching the station LAN directly by remote desktop.",
    ],
  },
  {
    file: "S13_IP_register_with_errors.csv",
    title: "IP address register with seeded errors",
    format: "CSV (opens in Excel)",
    openIn: [{ name: "IP Address Register Checker", href: "/calculators/ip-register-checker" }],
    what: "A 16-device register for station bus, process bus, switch management and SCADA DMZ, with typical copying and typing errors.",
    expect: [
      "7 errors: a duplicate IP, a duplicate MAC, a broadcast address, a link-local address, a gateway outside its subnet and two overlapping subnets.",
      "3 warnings and 2 notes on mixed masks and gateways.",
    ],
  },
  {
    file: "AJCollector_SAMPLE_SCADA-SRV01.json",
    title: "AJ Collector report of a SCADA server, with deliberate faults",
    format: "AJ Collector report (.json)",
    openIn: [{ name: "Windows Health Analyser", href: "/calculators/windows-health-analyser" }],
    what: "A report as the AJ Collector writes it, for a Windows Server 2019 SCADA server with typical problems: a crashing historian, slow logon, open remote access, weak settings and an expired certificate.",
    expect: [
      "Services: Historian Service stopped after five crashes (7031) with historian.exe faults (1000).",
      "Boot and logon: 185 s boot with Group Policy 1129 and Netlogon 5719 at start-up.",
      "Security: NLA off, SMBv1 on, Public firewall profile off, a remote support agent open to any address, an operator account in Administrators, a passwordless commissioning account.",
    ],
  },
  {
    file: "S13_asset_register.csv",
    title: "Asset register — export format and import template",
    format: "CSV (opens in Excel)",
    openIn: [{ name: "SCL NetStudio → Asset register", href: "/calculators/scl-netstudio" }],
    what: "The asset register of the sample substation in the format SCL NetStudio exports. Edit it in Excel and import it back with Import asset data; rows are matched by Tag.",
    expect: ["Columns: Tag, asset type, description, bay, panel, manufacturer, model, firmware, serial number, MAC address, IP addresses, switch port, tagged VLANs and status."],
  },
];
