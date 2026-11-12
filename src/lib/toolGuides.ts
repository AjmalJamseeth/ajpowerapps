// Tool guides: the "know before you use" section shown at the top of the
// written content under a tool. Every tool guide answers the same questions in
// the same order, so an engineer understands what the tool does, what it needs,
// how it works inside and how far its answer can be trusted — instead of using
// it blindly. Statements here must match what the tool actually does; the
// regression suite checks every guide is complete.

export interface ToolGuide {
  /** One or two sentences: what the tool is. */
  what: string;
  /** What it can do. */
  can: string[];
  /** Why an engineer needs it: the problem it solves. */
  why: string[];
  /** The concepts to understand first, so the result is not used blindly. */
  understand: string[];
  /** What you need before you start: data, files, access. */
  need: string[];
  /** How to use it — only for tools without a step-by-step how-to guide. */
  use?: string[];
  /** What the tool gives you. */
  output: string[];
  /** How to read and act on the results. */
  interpret: string[];
  /** Technical basis: methods, formulas, standards, assumptions — nothing hidden. */
  basis: string[];
  /** What it does not do, and when not to rely on it. */
  limits: string[];
}

const BROWSER = "A current browser (Chrome, Edge, Firefox or Safari). Nothing is installed and your data is never uploaded; it is processed on your own computer.";

export const TOOL_GUIDES: Record<string, ToolGuide> = {
  "/calculators/scada-connectivity": {
    what: "A two-device IPv4 checker. It tells you whether a laptop or SCADA server and an IED, RTU or gateway can communicate at the IP level, and if not, exactly why and what to change.",
    can: [
      "Validate both IP addresses, subnet masks (dotted or /prefix) and default gateways.",
      "Repeat the routing decision each device makes, from both sides, and show how each one sends to the other: directly, through its gateway, or not at all.",
      "Find one-way mask mismatches, duplicate addresses, network or broadcast addresses given to a device, 169.254.x.x link-local addresses and gateways outside their own subnet.",
      "Suggest a laptop address inside the IED's subnet and name the service port to test next (IEC 61850 MMS, IEC 60870-5-104, DNP3, Modbus, HTTP/HTTPS, SSH).",
    ],
    why: [
      "Most \"no communication\" problems during commissioning are addressing errors, not faulty devices.",
      "A mask mismatch makes traffic one-way: requests arrive, replies go to the router and are lost. Ping simply times out and gives no reason, so the problem is usually escalated and waits for the network team.",
      "With this check the SCADA engineer can fix the common cases on the spot, and escalate the rest with evidence instead of a guess.",
    ],
    understand: [
      "An IP address and its subnet mask define a subnet: the range of addresses the device treats as local.",
      "A device sends directly (after an ARP request) to addresses inside its own subnet, and to its default gateway for everything else. With no gateway it cannot reach other subnets at all.",
      "Each device decides with its OWN mask. Two devices only talk directly when both see the other as local.",
      "IP reachability is only the first layer. A working ping does not prove the service works (MMS on TCP 102, IEC 104 on TCP 2404), and it says nothing about GOOSE or sampled values, which are Layer 2 multicast and never routed.",
    ],
    need: [
      "IP address, subnet mask and default gateway of the laptop or server: on Windows, run ipconfig /all.",
      "The same three values for the IED: from its front panel, its configuration tool, or the Communication section of the SCD (SCL Studio shows them).",
      "Which protocol you want to use, so the right port can be suggested.",
      BROWSER,
    ],
    output: [
      "A verdict: can talk directly, only through a router, mask mismatch (one-way), or cannot talk.",
      "How each device sends to the other, the subnet and usable address range of each.",
      "A list of findings marked Problem, Check or Next step, and a list of changes to make.",
      "A suggested laptop address and mask when the devices are not on the same subnet.",
    ],
    interpret: [
      "Can talk directly: the addressing is right. If it still fails, check the cable or fibre, the switch port and its VLAN, the Windows firewall, and whether the IED answers ping at all (some do not).",
      "Only through a router: both have gateways but are on different subnets. This works only if a router or layer-3 switch connects them and the firewalls allow the traffic — that is a question for the network team, and the result gives you the exact subnets to quote.",
      "Mask mismatch: correct the masks so both devices use the IED's subnet and mask. Never change a protection IED's addressing to suit a laptop.",
      "Cannot talk: follow the changes listed. Before using the suggested address, check it is unused in the IP address register.",
    ],
    basis: [
      "IPv4 subnet arithmetic (RFC 791, RFC 950): network = IP AND mask; broadcast = network OR (NOT mask); usable hosts = network + 1 to broadcast − 1.",
      "Private ranges (RFC 1918) and link-local 169.254.0.0/16 (RFC 3927) are recognised; loopback, multicast and reserved ranges are flagged.",
      "Routing decision per device: destination inside own subnet → local; otherwise gateway if one is set and valid; otherwise no route. A gateway outside the device's own subnet is treated as unusable, as Windows does.",
      "Suggested address = the last usable address of the IED's subnet minus 9, skipping the IED and its gateway — near the top of the range, away from the IEDs that usually sit at the bottom.",
    ],
    use: [
      "Enter the laptop's IP address, mask and gateway (leave the gateway empty if there is none), then the IED's.",
      "Choose the protocol you want to test next.",
      "Read the verdict and the two lines under it that show how each device sends to the other.",
      "Work through Why and What to change. Apply the change, then ping the IED and test the service port.",
    ],
    limits: [
      "Checks addressing only. It does not send anything on a network and cannot test the cable, the switch, VLANs, firewalls or the IED's services.",
      "It cannot know about a third device already using an address; check the register or ask before using the suggested address.",
      "IPv4 only; NAT, VPN and policy routing are not modelled.",
    ],
  },

  "/calculators/fibre-link-budget": {
    what: "A power-budget and reach calculator for Ethernet fibre links between switches, IEDs and merging units.",
    can: [
      "Calculate the optical power budget from the transmitter's minimum launch power and the receiver's sensitivity.",
      "Add fibre attenuation, connector and splice loss on the TIA-568.3-D maximum basis or on typical installed values, and subtract a safety margin.",
      "Check the distance limit of the Ethernet standard for the chosen fibre (often the real limit on multimode fibre) and receiver overload on short links.",
      "Give the maximum usable length, the smaller of the loss limit and the reach limit.",
    ],
    why: [
      "A link with too little margin works on the day of commissioning and fails later as connectors get dirty, a repair splice is added or the transmitter ages.",
      "On multimode fibre a link can have power to spare and still fail because it is longer than the standard allows; a power meter alone will not show that.",
      "High-power optics on short single-mode links can saturate the receiver, which looks like a faulty transceiver.",
    ],
    understand: [
      "dBm is absolute power (0 dBm = 1 mW); dB is a ratio. Losses in dB simply add.",
      "Budget = transmit power minimum − receiver sensitivity. Everything between them — fibre, connectors, splices — uses up that budget, and what is left must cover the safety margin.",
      "Multimode reach is limited by modal bandwidth, single-mode reach mostly by loss.",
      "Each mated connector pair counts, including the patch panels and the equipment connections included in the budget.",
    ],
    need: [
      "The transceiver type and, ideally, its datasheet values: minimum transmit power, receiver sensitivity, maximum transmit power and receiver overload.",
      "Fibre type (OS2 single-mode or OM1–OM4 multimode) and the wavelength used.",
      "Route length, number of mated connector pairs and splices (from the cable schedule or drawings), and your required safety margin.",
      BROWSER,
    ],
    output: [
      "Power budget, fibre, connector and splice losses, total link loss and the margin left after the safety margin.",
      "Worst-case received power, the overload check, maximum length by loss, the standard's reach and the maximum usable length.",
      "Notes on mismatched fibre and wavelength, the mode-conditioning cord needed for 1000BASE-LX on multimode, and the vendor-specific nature of 1000BASE-ZX.",
    ],
    interpret: [
      "Margin left ≥ 0 dB with the reach respected: the design works on paper. Measure the installed loss at commissioning and record it.",
      "Negative margin on the maximum basis but positive on typical values: the link depends on good workmanship. Measure it, clean the connectors, or choose optics with a bigger budget.",
      "Beyond the standard's reach: choose better fibre (OM3/OM4 or single-mode) or different optics; extra power does not help.",
      "Overload: fit an in-line attenuator of the size needed to bring the received power below the overload level.",
    ],
    basis: [
      "PB = Ptx,min − Prx,sens; L = α·ℓ + Nc·Lc + Ns·Ls; margin left = PB − L − safety margin; ℓmax = (PB − margin − Nc·Lc − Ns·Ls) / α.",
      "Component loss on the TIA-568.3-D maximum basis: 0.75 dB per mated connector pair, 0.3 dB per splice. Typical basis: 0.5 dB and 0.1 dB.",
      "Fibre attenuation defaults: 0.4 dB/km at 1310 nm and 0.3 dB/km at 1550 nm (single-mode, typical ITU-T G.652); 3.0 dB/km at 850 nm and 1.5 dB/km at 1300 nm (multimode, TIA-568.3-D maximum).",
      "Reach: IEEE 802.3 values for 100BASE-FX, 100BASE-LX10, 1000BASE-SX, -LX and -LX10; 1000BASE-ZX is a manufacturer value.",
      "Overload check: maximum transmit power minus a low estimate of the link loss (85 % of the fibre loss, 0.25 dB per connector pair, 0.05 dB per splice).",
      "Transceiver presets are representative datasheet values, labelled as such.",
    ],
    use: [
      "Choose the transceiver; its typical power values fill in. Replace them with the datasheet values of the actual module.",
      "Choose the fibre type and wavelength, enter the route length, connector pairs and splices.",
      "Choose the loss basis (TIA maximum for design, typical for an estimate) and the safety margin.",
      "Read the result, the margin left and the distance check; read every note.",
    ],
    limits: [
      "Uses the values you enter; a real module's datasheet overrides the presets.",
      "Does not model bend loss, chromatic dispersion beyond the standard's reach, or ageing beyond your safety margin.",
      "A calculation is not a test: confirm every installed link with a light source and power meter or an OTDR.",
    ],
  },

  "/calculators/ip-register-checker": {
    what: "A consistency checker for the IP address list (register) of a substation or SCADA network.",
    can: [
      "Read comma, semicolon or tab separated text, including a direct copy from Excel, and find the columns from their headings.",
      "Check each device: IP, mask and MAC format, network or broadcast address used, special addresses, gateway outside its subnet.",
      "Check the whole register: duplicate IPs, MACs and names, mixed masks or gateways in one VLAN, overlapping subnets, a subnet spread over several VLANs.",
      "List every finding with its line number and export the findings to CSV.",
    ],
    why: [
      "The register is the reference for configuring IEDs, switches, gateways and SCADA. One wrong line becomes a fault that takes hours to find on site.",
      "Registers are copied and edited by several people; duplicated lines and unchanged addresses are common.",
      "Checking before issue costs seconds; finding a duplicate IP during commissioning costs a day.",
    ],
    understand: [
      "Devices on one LAN must share the same mask and gateway, or some will not reach others.",
      "Two subnets that overlap mean devices disagree about which addresses are local — usually one mask is wrong.",
      "A device's own MAC address is unique; a repeated MAC in a register is almost always a copying error.",
    ],
    need: [
      "The register as CSV, or the table copied from Excel. The first line must hold the column headings.",
      "At least an IP address column. A mask column (or IP/prefix notation) enables the subnet checks; gateway, MAC, VLAN and network columns enable the rest.",
      BROWSER,
    ],
    output: [
      "A result line with the number of devices, errors, warnings and notes.",
      "A table of the subnets found, with the number of devices, VLANs, gateways and networks in each.",
      "The findings list with code, severity, line numbers and explanation, filterable and exportable to CSV.",
    ],
    interpret: [
      "Errors must be corrected before the register is issued: duplicates, unusable addresses, gateways outside the subnet, overlapping subnets.",
      "Warnings point to the odd one out in a VLAN; the majority value is assumed to be the intended one, so check it really is.",
      "Notes are information, for example a VLAN that carries several subnets because of a wrong mask; they usually disappear when the errors are fixed.",
    ],
    basis: [
      "The same IPv4 arithmetic as the SCADA Connectivity Assistant (RFC 791, RFC 950, RFC 1918, RFC 3927).",
      "MAC addresses are accepted in the common formats (hyphen, colon, dot) and compared after normalisation (IEEE EUI-48).",
      "Mask and gateway consistency is judged per VLAN, or per network name when there is no VLAN column.",
      "Overlaps are grouped so that each wider subnet is reported once.",
    ],
    limits: [
      "It checks the register against itself. It cannot tell whether an entry matches the device actually installed — confirm on site or against the SCL file.",
      "IPv4 only; IPv6 addresses are not checked.",
    ],
    use: [
      "Click Load sample register to see the kind of errors it finds, or paste your own table (copy from Excel) or open a CSV file.",
      "Read the result line, then the subnet table: it shows at a glance which subnets and VLANs exist.",
      "Work through the findings, starting with errors. Filter by severity and export the list to send back to whoever owns the register.",
      "Correct the register and paste it again until no errors remain.",
    ],
  },

  "/calculators/iec-61850-scl-editor": {
    what: "SCL Studio: a viewer, validator and editor for IEC 61850 SCL files (SCD, ICD, CID, IID, SSD, SED) that runs in the browser.",
    can: [
      "Show the substation structure, the IEDs with their data model, data sets, GOOSE, sampled-value, report and log control blocks, and the communication section.",
      "Validate the file with more than 40 rules: duplicate MAC or APPID, IP addresses outside their subnet, unresolved ExtRefs, missing data-set members, report settings and more.",
      "Edit addresses and attributes, compare two revisions with a change-impact report, export signal lists and registers to Excel, generate FAT/SAT test sheets, check a SCADA tag list, and export a CID for one IED.",
    ],
    why: [
      "The SCD is the single reference for a substation automation system, but vendor tools often show only their own IEDs and are not available to every engineer.",
      "Errors in the SCD — a duplicate GOOSE address, a subscription to a data set that changed — appear only during testing, or worse, in service.",
      "Engineers need to review, document and test from the SCD without retyping signal lists.",
    ],
    understand: [
      "SCL file types: ICD describes what an IED type can do, SCD the whole substation, CID the configuration of one IED, IID one configured IED returned to the system tool, SSD the specification, SED data exchanged between projects.",
      "A data set lists the signals sent by a GOOSE, sampled-value or report control block; confRev identifies its version, and subscribers decode members by position.",
      "ExtRef elements in a subscriber point to the signals it receives; an ExtRef that points to nothing is a broken signal.",
      "The Communication section holds IP addresses and the multicast MAC address, APPID, VLAN and priority of each GOOSE and SV stream.",
    ],
    need: [
      "The SCL file: the SCD from the system integrator, or an ICD/CID from the IED manufacturer's tool. The built-in sample shows every feature.",
      "For Compare: two revisions of the file. For SCADA check: the SCADA tag list as a spreadsheet.",
      BROWSER,
    ],
    output: [
      "An overview with counts and the validation result; a list of errors, warnings and notes, each linked to the element concerned.",
      "Data-flow matrix, registers workbook (IEDs, communication, GOOSE/SV, reports, signals), FAT/SAT test sheets, change-impact report, SCADA check results.",
      "The corrected SCD, or a CID for one IED.",
    ],
    interpret: [
      "Errors break communication or the file's validity and must be fixed: a duplicate MAC address or APPID, an unresolved ExtRef, an IP outside its subnet.",
      "Warnings are probable problems or poor practice; decide case by case and record the reason when you keep one.",
      "In Compare, every changed data set or confRev means the publisher AND every subscriber must be reloaded and the signal retested.",
    ],
    basis: [
      "IEC 61850-6 SCL structure (Edition 1, 2 and 2.1 files) and schema-guided editing.",
      "Address ranges per IEC 61850-8-1 (GOOSE) and IEC 61850-9-2 (sampled values); IPv4 subnet checks for the communication section.",
      "Validation rules check structure and references across the file; each message names the element so you can verify it yourself.",
    ],
    limits: [
      "Not a replacement for the manufacturer's configuration tool: always import a CID into that tool before loading it into the IED, because it checks device-specific limits.",
      "Validation is structural. A file can be valid and still be functionally wrong (a signal mapped to the wrong input); test every signal.",
      "Very large files (tens of MB) depend on the computer's memory.",
    ],
  },

  "/calculators/scl-netstudio": {
    what: "SCL NetStudio: a network engineering suite for IEC 61850 substations, working on one shared project that can be imported from and written back to the SCD.",
    can: [
      "Plan IP addresses with a subnet calculator and VLSM planner; allocate GOOSE and SV MAC addresses, APPIDs, VLANs and priorities and derive switch-port VLAN membership.",
      "Calculate bandwidth per port and uplink, GOOSE transfer time against IEC 61850-5 classes, PRP/HSR sizing and a PTP time-error budget.",
      "Plan firewall zones and conduits, schedule switch ports and cables, keep a network asset register, and compare a Wireshark capture with the plan.",
    ],
    why: [
      "Substation networks are usually designed in spreadsheets that are not checked against each other: the IP plan, the VLAN plan and the switch configuration drift apart.",
      "Problems such as an overloaded process-bus port, a GOOSE that exceeds its transfer time or a VLAN missing on an uplink are cheap to fix on paper and expensive on site.",
      "One project feeding every calculation means nothing is typed twice.",
    ],
    understand: [
      "MMS (reports, controls) runs over TCP/IP; GOOSE and sampled values are Layer 2 multicast that depends on VLANs and multicast filtering in each switch, not on IP routing.",
      "Sampled values at 80 samples per cycle send 4,000 frames per second per stream at 50 Hz; that load decides process-bus port sizing.",
      "GOOSE transfer time t = ta + tb + tc (sender, network, receiver); trips usually need TT6, 3 ms.",
      "PTP accuracy depends on every clock in the chain: grandmaster, transparent and boundary clocks and the end device.",
    ],
    need: [
      "The device and switch inventory — or an SCD to import it from.",
      "The address block for the substation, the number of hosts per network and the growth allowance.",
      "Switch port speeds and counts, cable types and route lengths, and asset data (manufacturer, model, firmware, serial) when you build the register.",
      "For the capture analyser, a Wireshark capture taken on site.",
      BROWSER,
    ],
    output: [
      "IP plan, stream addressing, switch-port VLAN tables and vendor-neutral switch configuration templates.",
      "Bandwidth, latency, redundancy and time-sync results with pass/fail against the stated limits.",
      "Firewall rule table, port and cable schedule with cable quantities, asset register, capture findings, an Excel design workbook and an updated SCD.",
    ],
    interpret: [
      "Treat every check result as a design review item: errors must be resolved, warnings justified.",
      "Bandwidth: keep steady load well below 50 % and bursts below 80 % of a port, as engineering practice; above that, filter multicast or split traffic.",
      "Latency and time-sync results are estimates from your inputs; confirm with manufacturer data and site tests.",
      "The switch configuration template must be translated to the switch vendor's syntax and reviewed before use.",
    ],
    basis: [
      "VLSM: largest segments placed first on their natural boundary; addresses assigned in a fixed order by role and bay.",
      "Multicast ranges and priorities per IEC 61850-8-1 and -9-2; Edition 2 Type 1A APPID ranges accepted.",
      "Frame load = (frame bytes + 20) × 8 × frames per second (preamble and inter-frame gap included).",
      "Transfer time per IEC 61850-5 with frame transmission, switch latency, worst-case queuing behind a full-size frame and propagation; PTP budget per IEC 61850-9-3; PRP/HSR per IEC 62439-3; zones and conduits in the style of IEC 62443.",
      "Cable limits: 100 m twisted-pair channel (IEEE 802.3, ISO/IEC 11801); multimode reach by speed.",
    ],
    limits: [
      "Engineering estimates from stated assumptions, not a network simulation.",
      "The firewall planner proposes rules for review; it is not a security assessment.",
      "Switch templates are vendor-neutral; PRP/HSR and PTP behaviour depends on the actual products.",
    ],
  },

  "/calculators/goose-sv-analyzer": {
    what: "An offline analyser that checks GOOSE and sampled-value traffic in a Wireshark capture against IEC 61850, optionally compared with the SCD.",
    can: [
      "Decode every GOOSE and SV stream in a .pcap or .pcapng file.",
      "Run 86 checks: addressing, stNum/sqNum sequence, time allowed to live, retransmission, data-set consistency, simulation and test flags, lost samples, sample rate and synchronisation.",
      "Compare each stream with its configuration in the SCD and give every finding with its clause reference, frame numbers, likely causes and what to do.",
    ],
    why: [
      "A GOOSE or SV fault rarely announces itself: the publisher looks healthy while a subscriber silently rejects or misses the messages.",
      "A capture is the evidence. Reading thousands of frames by hand in Wireshark is slow and easy to get wrong.",
    ],
    understand: [
      "stNum changes when the data changes; sqNum counts repetitions of the same state; time allowed to live tells the subscriber when to expect the next message.",
      "confRev identifies the data-set version; subscribers reject a stream whose confRev does not match their configuration.",
      "Sampled values (9-2LE) send 80 samples per cycle with a counter that wraps once per second, and a smpSynch flag that shows whether the merging unit is time-synchronised.",
      "A capture shows only what reached the point where it was taken.",
    ],
    need: [
      "A Wireshark capture (.pcap or .pcapng) from a switch mirror port or a TAP that receives the multicast, long enough to include a few state changes.",
      "Optionally the SCD file, to compare traffic with configuration.",
      BROWSER,
    ],
    output: [
      "A streams table with the worst verdict per GOOSE control block and SV stream.",
      "Findings with standard reference, expected and observed values, explanation, likely causes, action and frame numbers.",
      "The full list of checks with their verdicts; a printable report and a CSV export.",
    ],
    interpret: [
      "Start with errors on trip and interlocking GOOSE and on SV streams used by protection.",
      "A stream missing from the capture means \"not observed at this capture point\" — check the capture position, VLAN and multicast filtering before concluding the publisher is silent.",
      "Timing findings are based on capture timestamps; small differences can come from the capture PC rather than the network.",
    ],
    basis: [
      "IEC 61850-7-2:2010, -8-1:2011 and -9-2:2011 (Edition 2), the UCA 9-2LE guideline, IEC 61869-9, IEC 62439-3 and IEEE 802.1Q.",
      "Clause references are given for each check; confirm them against your copy of the standard before quoting them.",
    ],
    limits: [
      "Browsers cannot capture traffic; capture with Wireshark or a hardware device and open the file.",
      "Software capture timestamps are not accurate enough to verify sub-millisecond or PTP-level timing.",
      "It analyses what was captured; it does not prove that a subscriber accepted or acted on a message.",
    ],
  },

  "/calculators/iec-61850-academy": {
    what: "61850 Academy: a training simulator of a 132/33 kV substation that shows how IEC 61850 behaves, with ten guided labs and quizzes.",
    can: [
      "Operate breakers from a SCADA HMI with select-before-operate and interlocking.",
      "Apply faults and watch distance, differential, overcurrent and breaker-failure protection trip, with GOOSE between IEDs.",
      "Change confRev, test mode, VLANs or unplug cables and see subscriptions go lost or be ignored; read every message in a sniffer, slowed down to 0.01×.",
    ],
    why: [
      "GOOSE, supervision and reports happen in milliseconds and silently. Most engineers only see them during a fault or a test, under time pressure.",
      "A simulator lets you cause each fault on purpose, without risk, and see exactly what each device does and why.",
    ],
    understand: [
      "This is a learning tool. Start with Lab 1 and follow the order; each lab builds on the previous one.",
      "Read the explanation of every quiz answer — that is where the knowledge is.",
    ],
    need: [
      "No files or data: the substation is built in.",
      "About 10–15 minutes per lab.",
      BROWSER,
    ],
    output: [
      "Ticked lab steps, quiz results with explanations, an incident timeline with fault clearance times, and decoded messages in the sniffer.",
    ],
    interpret: [
      "Use the timeline to measure fault clearance time and the sniffer to relate each event to its message.",
      "When a lab shows an unexpected result, that is usually the lesson: read the step text again and compare with the IED view.",
    ],
    basis: [
      "Simplified models of IEC 61850 GOOSE (retransmission, time allowed to live, LGOS supervision, confRev, test flag), MMS select-before-operate and buffered reports, and basic protection functions.",
    ],
    limits: [
      "Training only: timings, settings and screens are representative, not those of a particular manufacturer.",
      "It never connects to a real device or network.",
    ],
  },

  "/calculators/protection-suite": {
    what: "A time-current coordination workbench for relays, breakers, fuses and motor protection, with setting tools for the common protection functions.",
    can: [
      "Plot IDMT, definite-time, LSIG, thermal-magnetic, MCB, fuse, motor and custom-equation curves on one log–log chart referred to a common voltage.",
      "Check grading margins between each upstream and downstream pair at several fault multiples and suggest settings.",
      "Provide setting and check tools for overcurrent, transformer, busbar and line differential, distance, voltage, frequency, CT/VT sizing and more, and issue setting sheets.",
    ],
    why: [
      "Coordination decides whether a fault trips one feeder or the whole substation.",
      "Inverse curves of different shapes converge or cross, so checking one fault level is not enough.",
    ],
    understand: [
      "The coordination time interval (CTI) is the minimum time margin between the downstream and upstream device at every current both can see: typically 0.2–0.4 s depending on relay and breaker type.",
      "Raising one relay's setting reduces the margin of the relay above it; grade from the load towards the source.",
      "Unit protection (differential) has no grading margin because it only operates for faults inside its zone.",
    ],
    need: [
      "Maximum and minimum fault levels at each bus from a short-circuit study.",
      "Device data: CT ratios, curve types, pickup and time settings, fuse and breaker types; load and motor starting data.",
      "Equipment withstand data (transformer through-fault, cable short-circuit) for the damage curves.",
      BROWSER,
    ],
    output: [
      "The time-current chart with all devices and damage curves, the grading table with margins at each multiple, suggested settings and setting sheets.",
    ],
    interpret: [
      "A margin below the CTI at any checked multiple is a grading failure; fix it and re-check every pair above.",
      "A device curve crossing a damage curve means the equipment is not protected for that fault.",
      "Suggested settings are a starting point; check sensitivity at minimum fault and stability under load and inrush.",
    ],
    basis: [
      "IEC 60255-151 inverse curves: t = TMS × k / ((I/Is)^α − 1) with SI k = 0.14, α = 0.02; VI 13.5, 1; EI 80, 2; IEEE C37.112 curves for the IEEE family.",
      "Grading check at 2, 3, 5, 8, 12 and 20 × the downstream pickup and at the maximum fault level.",
    ],
    limits: [
      "Final settings must be approved by a qualified protection engineer.",
      "Manufacturer curves (especially fuses and LV breakers) can differ from generic curves; use their data where available.",
      "Static coordination only: no dynamic or transient simulation.",
    ],
  },

  "/calculators/cable-engineering-suite": {
    what: "A cable engineering application for LV and MV cables: sizing, derating, voltage drop, short circuit, earth-fault loop, thermal rating, installation and testing.",
    can: [
      "Size one cable quickly, or a whole project of circuits against current capacity, voltage drop, short-circuit withstand, earth-fault loop impedance and motor starting.",
      "Run detailed studies: IEC 60287 thermal rating with mutual heating, sheath bonding, sequence impedance, pulling tension, tray, duct and trench fill, glands and lugs, site tests.",
      "Issue calculation sheets, submission reports, cable and drum schedules.",
    ],
    why: [
      "A cable sized only on current can fail on voltage drop, fault withstand or disconnection time.",
      "Real installations are hotter, grouped and buried deeper than the reference conditions of the tables.",
    ],
    understand: [
      "Tabulated ratings apply to reference conditions (30 °C air, 20 °C ground, one circuit); correction factors bring them to the real installation.",
      "The governing criterion is the one that needs the largest cable; the suite names it.",
    ],
    need: [
      "Site conditions: air and ground temperature, soil thermal resistivity, depth, grouping.",
      "Load data, route lengths, installation method, fault levels and clearing times from the short-circuit and protection studies, earthing system.",
      BROWSER,
    ],
    output: [
      "Recommended size per circuit with every check and the governing criterion; module reports, schedules and Excel export.",
    ],
    interpret: [
      "ORANGE values are outside the published tables: the suite holds the nearest safe-side value — confirm with the manufacturer or a full IEC 60287 calculation.",
      "A pass on all criteria at the recommended size is the design answer; the reason the next size down fails tells you how much margin you have.",
    ],
    basis: [
      "IEC 60364-5-52:2009 Annex B (LV), IEC 60502-2:2014 Annex B (MV), IEC 60228, IEC 60287, IEC 60909, IEC 60364-4-41, -4-43 and -5-54.",
      "Iz = n × Itab × kT × kG × kS × kD; ΔU% = √3·Ib·L·(R cos φ + X sin φ)/U × 100; S ≥ √(I²t)/k.",
    ],
    limits: [
      "Uses the standards' tables and methods; manufacturer data overrides them where it differs.",
      "Fault levels and clearing times come from your studies; the suite does not compute the network.",
    ],
  },

  "/calculators/dga-analyzer": {
    what: "A dissolved gas analysis (DGA) application for oil-filled transformers and tap changers, for one unit or a whole fleet.",
    can: [
      "Interpret each sample with IEEE C57.104-2019 status, IEC 60599 ratios, Rogers ratios, Duval Triangles 1, 4 and 5, Duval Pentagons 1 and 2 and the CO2/CO ratio.",
      "Track gas trends and rates of rise, open gassing events, rank the fleet by condition and produce PDF reports.",
      "Read gas values from a laboratory PDF for checking before saving.",
    ],
    why: [
      "DGA is the earliest warning of internal transformer faults, but each method sees the data differently and a single ratio can mislead.",
      "Trends matter more than one sample: a fast-rising gas at a low level can be more serious than a high but stable one.",
    ],
    understand: [
      "Gases point to fault types: hydrogen to partial discharge, acetylene to arcing or very hot spots, methane/ethane/ethylene to overheating, CO and CO2 to paper involvement.",
      "Ratio methods are only meaningful when gas levels are above typical values.",
      "Transformer design (sealed or conservator, oil type, age) changes what is normal.",
    ],
    need: [
      "Laboratory DGA results (ppm of H2, CH4, C2H6, C2H4, C2H2, CO, CO2, and O2/N2 if available) with sample dates.",
      "Transformer data: manufacturer, year, voltage, MVA, cooling, oil type, conservator or sealed.",
      BROWSER,
    ],
    output: [
      "Most probable fault with confidence, other candidates, probable location and recommended actions; results of every method; trend charts and fleet ranking.",
    ],
    interpret: [
      "Act on the combination of status, trend and agreement between methods, not on one ratio.",
      "Confirm an abnormal result with a repeat sample before major action, unless acetylene is rising quickly.",
    ],
    basis: [
      "IEC 60599 ratios R1 = C2H2/C2H4, R2 = CH4/H2, R3 = C2H4/C2H6; Duval Triangle and Pentagon zones; IEEE C57.104-2019 levels and rate-of-rise limits.",
    ],
    limits: [
      "DGA is diagnostic evidence, not a verdict: combine it with electrical tests, loading history and inspection.",
      "Results are only as good as the sampling and the laboratory.",
    ],
  },

  "/calculators/engineering-sketch-studio": {
    what: "A drawing tool for single-line diagrams, schematics, loop sheets, process sketches, network diagrams and flowcharts, with schedules generated from the drawing.",
    can: [
      "Place 620 symbols, wire them with terminal snapping, tag and number devices, wires and terminals.",
      "Generate bills of materials, instrument index, terminal and cable schedules, protection function lists and more.",
      "Export SVG, DXF, PNG and PDF.",
    ],
    why: [
      "Engineers often need a clear SLD or schematic quickly, without a CAD licence on hand.",
      "Schedules drawn from the same tagged drawing stay consistent with it.",
    ],
    understand: [
      "Symbols carry tags and properties; the reports are only as complete as those properties.",
      "An SLD shows a three-phase system with one line per circuit, with ratings, and is the reference for the system studies.",
    ],
    need: [
      "The single-line or schematic information: equipment, ratings, tags.",
      BROWSER,
    ],
    output: [
      "The drawing sheets with title blocks, the generated schedules and exported files.",
    ],
    interpret: [
      "Run Check tags before issuing to find duplicate and missing tags.",
      "Check exported symbols against your company's drawing standard.",
    ],
    basis: [
      "Original symbols in the style of IEC 60617 and IEEE 315, with ANSI C37.2 device numbers for protection functions.",
    ],
    limits: [
      "Not a full CAD system; for issued drawings, follow your company's CAD standard.",
    ],
  },
};
