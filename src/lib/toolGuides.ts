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

  "/calculators/change-comparison": {
    what: "A comparison tool for two versions of an engineering record: tables (registers, tag and point lists, port and cable lists), SCL NetStudio network projects and AJ Collector reports.",
    can: [
      "Match table rows by a key column (or two) and columns by name, and list added, removed and changed rows with old and new values.",
      "Compare NetStudio projects section by section — devices, switches, IP segments, GOOSE/SV streams, firewall rules, assets, cable overrides — and state the impact of each change.",
      "Compare two AJ Collector reports of the same computer.",
      "Report duplicate keys and columns present in only one version; export all changes to CSV.",
    ],
    why: [
      "Faults introduced by modifications usually come from a difference nobody noticed.",
      "A complete list of differences is the basis of the change request, the test plan and the updated documentation.",
    ],
    understand: [
      "The key identifies the same item in both versions (tag name, device name, cable ID). A wrong key makes everything look added and removed.",
      "A change is only as safe as the tests that follow it; the impact notes say which tests and documents each kind of change touches.",
    ],
    need: ["Both versions: CSV or text copied from Excel with headings in the first row, or two NetStudio project files, or two collector reports.", BROWSER],
    use: [
      "Open or paste version A (approved) and version B (current or proposed), or load an example.",
      "For tables, check the key column (and add a second one if names repeat per device); list columns to ignore, such as comments or dates.",
      "Read the counts, then each section's changes and impacts; export the list for the change record.",
    ],
    output: ["Added, removed and changed items with field-level differences, impact notes for network designs, warnings about duplicate keys and columns, and a CSV export."],
    interpret: [
      "Every difference should correspond to an approved change; anything else needs an explanation before the revision is accepted.",
      "Impact notes are minimum actions: GOOSE data set or confRev changes always mean reloading the publisher and every subscriber and retesting.",
    ],
    basis: ["Keyed comparison of rows with case-insensitive values (case-sensitive for network projects); columns matched by heading; impact rules from IEC 61850-6 engineering practice and IEC 62443 change management."],
    limits: ["Does not understand SCL files themselves — use SCL Studio's Compare for SCD/ICD/CID.", "Cannot judge whether a change is correct, only that it exists."],
  },

  "/calculators/configuration-version-log": {
    what: "A configuration version log that identifies every SCD, CID, switch, RTU, PLC, HMI and firmware file by its SHA-256 fingerprint, with device, version, status, author and reason.",
    can: [
      "Fingerprint files in the browser and fill version, revision, date, author and reason from the SCL Header and History.",
      "Check any file (for example a CID read back from a relay) against the log: approved or installed, superseded, draft, recorded for another device, or unknown.",
      "Flag several Installed versions for one device, approved versions not yet installed, missing reasons and one file under two versions.",
      "Export the log as JSON (to reopen) and CSV.",
    ],
    why: [
      "Years after commissioning nobody is sure which file is the approved one; a fingerprint gives a definite answer.",
      "Configuration control is required by IEC 62443 and is the basis of fault investigation after an incident.",
    ],
    understand: [
      "Any change to a file — even a space — changes its SHA-256. Two files with the same fingerprint are identical.",
      "The same configuration exported twice by a tool may differ (for example a time stamp in the file); record the file that was actually loaded into the device.",
      "The log in the browser is a convenience; the downloaded JSON file is the record.",
    ],
    need: ["The configuration files (from the engineering tools, or read back from the devices).", "Device names, versions and the change request or reason.", BROWSER],
    use: [
      "Load the sample log, or start a new one with the site name.",
      "Add a version: choose the file, complete device, type, version, status and reason, and add it.",
      "When a version is loaded into the device, set its status to Installed and the previous one to Superseded.",
      "Check files read back from devices; download the log after every change.",
    ],
    output: ["The log grouped by device, log checks, file check results, JSON and CSV exports."],
    interpret: [
      "OK: the file is the recorded approved or installed version.",
      "Not a recorded version: find out what changed before using the file.",
      "Superseded or draft: an old or unapproved version is in use.",
    ],
    basis: ["SHA-256 (FIPS 180-4) computed with the browser's Web Crypto API; SCL Header and Hitem attributes per IEC 61850-6."],
    limits: ["It cannot read files from devices itself; use the manufacturer's tool to read back the configuration.", "It does not judge the content of the configuration."],
  },

  "/calculators/scada-tag-validator": {
    what: "A validator for SCADA, gateway and RTU tag or point lists exported as CSV or copied from Excel.",
    can: [
      "Find duplicate tag names and duplicate addresses per device, common address, protocol and data table.",
      "Flag missing descriptions, copied descriptions, missing or inconsistently written units, spaces in names and names that break your naming rule.",
      "Check engineering ranges, alarm limits (LoLo ≤ Lo < Hi ≤ HiHi), limits outside the range, large deadbands, and trip or alarm signals without a normal state.",
      "Check Modbus addressing (analog values in coil or discrete-input tables) and IEC 104 information object addresses.",
    ],
    why: ["Copy errors in large point lists load without complaint and surface only in testing or operation.", "Checking before loading is much cheaper than finding the error point by point."],
    understand: [
      "Columns are recognised from their headings; rename them (Tag, Description, Device, Protocol, Address, Type, Unit, EU Low/High, LoLo/Lo/Hi/HiHi, Normal State) if they are not found.",
      "Analog and digital points are recognised from the Type column; checks that depend on it need that column.",
    ],
    need: ["The tag list with headings in the first row.", "Optionally your naming rule as a regular expression.", BROWSER],
    use: ["Open the CSV, paste the table or load the sample.", "Enter the naming rule if you have one.", "Work through errors, then warnings; export the findings."],
    output: ["Counts, recognised columns, and findings with line numbers, exportable to CSV."],
    interpret: ["Errors cause wrong or lost values and must be fixed before loading.", "Warnings are probable mistakes or poor practice; notes help find copied rows."],
    basis: ["Modbus Application Protocol V1.1b3 data tables; IEC 60870-5-101/104 3-octet information object address (1–16 777 215); alarm management principles of ISA-18.2 / EEMUA 191."],
    limits: ["Checks consistency, not correctness against the device's real register map — confirm in point-to-point testing.", "Vendor-specific address formats may not be interpreted."],
  },

  "/calculators/patch-compatibility-register": {
    what: "A register of the Windows updates installed on each SCADA computer (from AJ Collector reports) against the SCADA vendor's approval list, with checks between redundant servers.",
    can: [
      "Show a matrix of updates × computers with the vendor's status.",
      "Flag updates installed but not approved, withdrawn or still under test; approved updates not installed; updates the vendor has not assessed; old patch levels.",
      "Compare redundant pairs and their operating systems.",
      "Export the matrix to CSV.",
    ],
    why: ["Untested updates can break SCADA drivers, OPC DA or redundancy; missing approved updates leave vulnerabilities open.", "Redundant servers on different patch levels may not fail over as tested."],
    understand: ["The vendor's approval list is the authority for which updates may be installed.", "Windows' installed-update list (Get-HotFix) covers most but not all update types."],
    need: ["AJ Collector reports of the computers.", "The vendor's approval list as CSV (KB, status, date, note).", "The names of redundant pairs.", BROWSER],
    use: ["Add the collector reports (or load the sample).", "Open or paste the vendor list.", "Enter redundant pairs such as SCADA-SRV01=SCADA-SRV02.", "Read the findings and the matrix; export it for the maintenance plan."],
    output: ["Findings per computer and per pair, and the update matrix with vendor status."],
    interpret: ["Not approved or withdrawn updates: ask the vendor and plan removal if required.", "Missing approved updates: plan installation on both servers of a pair in the same window."],
    basis: ["IEC 62443-2-3 patch management practice; KB numbers normalised from the collector reports and the approval list."],
    limits: ["Does not download or install updates.", "Depends on the completeness of the vendor list and the collector reports."],
  },

  "/calculators/windows-health-analyser": {
    what: "A two-part health check for Windows SCADA computers: the AJ Collector, a readable PowerShell script that only reads settings and logs and writes one file, and this analyser, which explains that file in your browser.",
    can: [
      "Report system, patch and disk state; automatic services that are not running, with their crash history and dependency chain; named service accounts and remote access agents.",
      "Group and explain the event log; measure boot duration and find Group Policy and Netlogon delays; judge the time service and clock steps; verify the domain secure channel.",
      "Read ipconfig, route and netstat; compare listening ports with your approved protocol matrix; flag disabled firewall profiles and rules open to any address.",
      "Check local accounts, administrators, password policy and a security baseline (NLA, SMBv1, UAC, USB, AutoRun, LLMNR, antivirus, audit policy); list expiring or weak certificates.",
      "Compare a report with a baseline report of the same computer, and create an anonymised copy for vendors and support teams.",
    ],
    why: [
      "Diagnostic software usually cannot be installed on a SCADA server without vendor approval; a short read-only script that can be read before it runs is much easier to approve.",
      "One report collects in a minute what a support engineer would otherwise ask for piece by piece over days.",
      "A report taken after commissioning becomes the approved baseline; comparing later reports shows unapproved changes immediately.",
    ],
    understand: [
      "The collector reads only; it does not repair anything. Fixes are made by people, through the site's change process and within the SCADA vendor's approved configuration.",
      "Run as administrator for a complete report; without it, Security events, audit policy and the secure channel test are skipped and listed as such.",
      "Findings are judged at the time the report was taken. Thresholds and baseline checks are common practice; the site's own standard and the vendor's requirements take precedence.",
      "A report contains names, addresses and accounts: anonymise it before it leaves the site.",
    ],
    need: [
      "The AJ-Collector.ps1 script (download on this page; check its SHA-256), copied to the computer through the approved transfer process.",
      "Windows PowerShell 5.1 (included in Windows 10/11 and Windows Server 2016 onwards); administrator rights for the complete report.",
      "Optionally an earlier report of the same computer as baseline, and your list of approved listening ports.",
      BROWSER,
    ],
    use: [
      "Download the script, read it, and check the SHA-256 on the target computer (Get-FileHash).",
      "Run it in PowerShell as administrator: powershell.exe -ExecutionPolicy Bypass -File .\\AJ-Collector.ps1 (Bypass applies to that run only).",
      "Open the AJCollector_<computer>_<date>.json file here; enter your approved ports.",
      "Work through Findings (filter by area), then Services, Events, Ports & firewall and Baseline; open a baseline report to see changes.",
      "Use Download anonymised copy before sending the report to anyone.",
    ],
    output: ["Counts by severity, a system summary, findings by area, service and event tables, a listening-port table against the approved list, the security baseline table, a change list against a baseline, and an anonymised JSON copy."],
    interpret: [
      "Problems first: stopped critical services, crashing applications, disk errors, broken secure channel, insecure settings.",
      "Checks are risks or deviations from common practice; decide each one against the site's standard and record the decision.",
      "Notes are context (time hierarchy, administrators list, dynamic ports); they explain rather than accuse.",
      "In the comparison, every added administrator, listening port, service or firewall rule should match an approved change.",
    ],
    basis: [
      "Data as reported by Windows: CIM/WMI classes, Get-Service, Get-WinEvent, Get-NetTCPConnection, Get-NetFirewall*, Get-LocalUser/Group, registry values, w32tm, nltest, net accounts, auditpol.",
      "Event explanations from the Windows Error & Event Code Explainer; network explanations from the Command Output Explainer.",
      "Rules stated in each finding: available disk space below 15 / 5 %, available memory below 10 %, last update older than 90 days, boot longer than 2 minutes, dormant account older than 90 days, password length below 8, antivirus signatures older than 7 days, certificate expiry within 30 / 90 days, keys below 2048 bits, SHA-1 or MD5 signatures.",
      "End-of-support dates: Windows 7 / Server 2008 R2 2020-01-14, Server 2012 / 2012 R2 2023-10-10, Windows 10 2025-10-14, Server 2016 2027-01-12, Server 2019 2029-01-09.",
      "Anonymisation: host, domain and user names replaced; IPv4 addresses mapped keeping the last octet and /24 relationships; MAC addresses keep the manufacturer prefix.",
    ],
    limits: [
      "A snapshot: it does not monitor. Problems that come and go may not appear in a single report; collect during the problem.",
      "Non-English Windows output may reduce what the time, network and event explanations recognise.",
      "It reports configuration, not effectiveness: an enabled antivirus or firewall rule is not proof of protection.",
      "Not a substitute for a security assessment or the vendor's health check.",
    ],
  },

  "/calculators/scada-troubleshooting-assistant": {
    what: "A guided troubleshooting assistant: it asks the questions an experienced engineer would ask, in the right order, and ends with the likely cause, what to do, the tool to use and — when another team must act — a ready escalation ticket.",
    can: [
      "Guide seven common symptoms: no communication with a device, IEC 104 drops, wrong time, slow workstation, logon and domain problems, disk full, GOOSE not received.",
      "Explain why each question matters and what each answer means.",
      "Give the likely cause with the actions and links to the right tool.",
      "Write an escalation ticket with site details, the checks made, the likely cause, a precise request and an evidence checklist.",
    ],
    why: [
      "Support requests from site often wait because they arrive without basic checks or evidence and go back and forth.",
      "Following a fixed order of checks avoids skipping the simple causes (cable, address, VLAN) that cause most problems.",
    ],
    understand: [
      "The assistant cannot see your network; it relies on your answers. Make each check before answering.",
      "Work from the bottom up: physical link, addressing, Ethernet (ARP), IP (ping), then the service port and the application.",
      "A conclusion is the most likely cause given your answers, not a certainty; confirm it with the evidence it lists.",
    ],
    need: [
      "Access to the device, the laptop or server, and the ability to run basic commands (ipconfig, ping, arp, netstat, w32tm).",
      "The device's expected IP address, VLAN and switch port from the IP register or SCD.",
      BROWSER,
    ],
    use: [
      "Choose the symptom card that matches the problem.",
      "Answer each question after making the check it describes; use Back to change an answer.",
      "Read the likely cause, do the actions you can, and use the linked tools.",
      "If escalation is needed, fill in the site fields, replace the <placeholders>, and copy or download the ticket with the evidence attached.",
    ],
    output: ["The path of questions and answers, the likely cause and actions, the tools to use, and an escalation ticket as text."],
    interpret: [
      "Red results are faults to fix; amber results are probable causes to confirm; green means the area checked is healthy and the problem lies elsewhere.",
      "If the actions do not fix it, go back one question and check your answer again before escalating.",
    ],
    basis: [
      "Layered troubleshooting order (physical, link, network, transport, application) and the behaviour of ARP, ICMP and TCP (RFC 826, 792, 9293).",
      "IEC 60870-5-104 link timers, IEC 61850-8-1 GOOSE subscription and supervision, Windows Time, Group Policy and Netlogon behaviour.",
    ],
    limits: [
      "Covers the common causes, not every possible fault; rare or vendor-specific faults need the vendor.",
      "It does not test anything itself.",
    ],
  },

  "/calculators/command-output-explainer": {
    what: "An explainer for the output of the Windows network and time commands that support teams ask for: it reads the text you paste and explains it in plain language, with the problems it shows.",
    can: [
      "Recognise ipconfig /all, route print, arp -a, ping, tracert, netstat -ano, w32tm /query /status, w32tm /stripchart and nslookup automatically.",
      "Flag duplicate and link-local addresses, gateways outside the subnet, several default gateways, VPN and Wi-Fi conflicts and overlapping adapters.",
      "Show which route Windows uses for an address, what 'Destination host unreachable' and time-outs really mean, blocked ports (SYN_SENT), connection leaks and exposed services.",
      "Judge the Windows time service: unsynchronised, local clock, host time provider, dispersion and measured offset.",
    ],
    why: [
      "These outputs contain the answer to most site communication problems, but they are hard to read without network experience.",
      "Understanding them yourself turns 'please help' into 'the laptop has two default gateways' — fixed in minutes, or escalated precisely.",
    ],
    understand: [
      "Each command shows one layer: ipconfig the adapter settings, route print the routing decision, arp the Ethernet neighbours, ping and tracert IP reachability, netstat the connections, w32tm the clock.",
      "A message 'Reply from' your own address is not a reply from the target.",
      "Command outputs are snapshots; repeat them while the problem is happening.",
    ],
    need: [
      "The output of the command, copied from Command Prompt (select and press Enter, or add | clip to the command). English-language Windows output is recognised.",
      "For route print: the address you want to reach.",
      BROWSER,
    ],
    use: [
      "Run the command (the list on the page shows each one and what it is for) and paste the output.",
      "Leave 'Detect automatically' or choose the command if it is not recognised.",
      "Read 'What it says' first, then the values and the table read from the output.",
      "Follow the next steps; paste the next command's output to continue.",
    ],
    output: ["A summary, findings marked Problem, Check, Note or OK, the key values and a table of what was read, and suggested next steps."],
    interpret: [
      "Problems explain a failure on their own (a duplicate address, a gateway outside the subnet, an unsynchronised clock); fix them first.",
      "Checks are conditions that often cause problems (two default gateways, VPN connected); confirm whether they apply to your case.",
    ],
    basis: [
      "IPv4 addressing and routing (RFC 791, 950, 1122): longest-prefix match, then lowest metric.",
      "ICMP messages (RFC 792), ARP (RFC 826), link-local addresses (RFC 3927), TCP states (RFC 9293), NTP as used by the Windows Time service (RFC 5905).",
      "TTL interpretation (64 / 128 / 255 starting values) is labelled as a rule of thumb.",
    ],
    limits: [
      "Reads only the text pasted; it cannot see the network or the time of the test.",
      "Non-English Windows output may not be recognised.",
      "IPv6 lines are ignored.",
    ],
  },

  "/calculators/windows-error-event-codes": {
    what: "A reference of the Windows error codes and event IDs most often met on SCADA servers, historians and engineering workstations, each explained with typical causes and what to check.",
    can: [
      "Find an entry by decimal or hex number, symbolic name or word; a Win32 code entered as 0x8007xxxx is found too.",
      "Filter by area: network, time, domain logon, services and crashes, disk, DCOM/OPC DA, TLS, security, hardware.",
      "Explain logon failure sub-status codes and Kerberos errors.",
    ],
    why: [
      "Problems first appear as an error number or an event ID; knowing what it means points straight at the cause.",
      "Many codes look alike but mean opposite things (10060 timed out versus 10061 refused).",
    ],
    understand: [
      "Event IDs are only unique together with their source: event 47 from Time-Service and event 47 from WHEA-Logger are different.",
      "Some events are normal or harmless on their own (7036 service state change, many DCOM 10016); look at the time and the surrounding events.",
    ],
    need: ["The error number or the event ID and source from Event Viewer (System, Application or Security log).", BROWSER],
    use: [
      "Type the number exactly as shown, or a word from the message.",
      "Check that the source of the entry matches the event's source in Event Viewer.",
      "Read the causes and checks, and compare with the events logged at the same time.",
    ],
    output: ["Matching entries with meaning, typical causes on a SCADA system and what to check."],
    interpret: [
      "Use the 'what to check' list in order; the first items are the most common causes.",
      "Correlate by time: a 7031 crash is explained by the Application Error 1000 logged a moment earlier.",
    ],
    basis: [
      "Microsoft-documented Win32, HRESULT and Windows Sockets error codes; Windows event IDs of Service Control Manager, Kernel-Power, disk, Ntfs, Time-Service, GroupPolicy, NETLOGON, DistributedCOM, Schannel and Security auditing; Kerberos errors (RFC 4120).",
    ],
    limits: [
      "A selection, not the complete Microsoft list. The event text and Microsoft's documentation remain the reference.",
      "Vendor-specific SCADA application codes are not included.",
    ],
  },

  "/calculators/discovery-result-checker": {
    what: "A checker that compares a network scan (what is on the network) with the approved IP or asset register (what should be on it).",
    can: [
      "Read nmap XML, grepable and normal output, a Windows or Linux ARP table, or a CSV / plain list of addresses.",
      "Read the register as an IP register (one row per address), the SCL NetStudio asset register (several addresses per device) or an SCL NetStudio project.",
      "Find unknown devices, registered addresses not found in the scanned range, addresses answered by a different MAC address, devices found at another address (their MAC is registered elsewhere), and one MAC answering for several addresses.",
      "Check every open port against an approved-services list per device name or IP, and call out clear-text and high-risk services.",
    ],
    why: [
      "An unregistered laptop, a replaced relay with a new MAC, an IED at the wrong address or Telnet left enabled are found only by comparing reality with the register — and IEC 62443 requires the asset owner to know what is connected and to disable what is not needed.",
      "A scan of a substation subnet gives hundreds of lines; comparing it with a register by eye is slow and misses things.",
    ],
    understand: [
      "On the local subnet a scan uses ARP, which every device must answer, and sees each device's MAC address; from another subnet it can only use ping or TCP probes, which many devices ignore, and it sees no MAC addresses.",
      "A MAC address identifies the network interface: a different MAC on a registered IP means a different device (or a replaced one); the same MAC on another IP means the device was given a different address.",
      "An open port means a service is listening. Every service that is not needed is an attack surface (IEC 62443-3-3 SR 7.7, least functionality).",
      "Scanning can disturb old devices: scan only with permission, in an agreed window, and start with host discovery before a port scan.",
    ],
    need: [
      "A scan result of the subnet (for example nmap -sn 10.13.0.0/25 for discovery, nmap -sS -p 1-1024,2404,3389,5900,8080 -oX scan.xml for ports), an ARP table (arp -a) or a list of addresses.",
      "The approved IP or asset register (CSV with a heading line) or the SCL NetStudio project.",
      "The list of approved services per device type (edit the example).",
      BROWSER,
    ],
    use: [
      "Open or paste the scan and the register, or load the samples.",
      "Edit the approved-services list: one line per device name or IP pattern (* and ? as wildcards), then the ports, for example GW*: 2404/tcp, 22/tcp. Lines add up, and * applies to every device.",
      "Check the scanned range (taken from the nmap command line when the file has it) so registered addresses outside the scan are not reported as missing.",
      "Work through the findings and export the table as CSV for the change record.",
    ],
    output: ["A summary, the findings with severity, and a table of every address with its status (in register, unknown, not found, MAC mismatch), the MAC and vendor seen, the open ports and the ports not approved."],
    interpret: [
      "Unknown device: identify it; register it if it belongs, remove it if not.",
      "MAC mismatch: if the device was replaced, update the register (and any MAC-based port security); if not, look for a duplicate IP address.",
      "Device found at another address: correct the device or the register — SCADA, the gateway and firewall rules use the registered address.",
      "Not found: the device may be off, disconnected or ignoring probes; confirm on site before concluding.",
      "Port not approved: disable the service on the device, or approve it with a documented reason. Telnet, FTP, TFTP and HTTP send passwords in clear text.",
    ],
    basis: [
      "Matching by IP address first, then by MAC address for devices not found at their registered address.",
      "Scope: the targets on the nmap command line, the range you enter, or else the /24 networks of the hosts found.",
      "Port approval: a port is approved when any rule whose pattern matches the device's register name or its IP lists the port (protocol optional).",
      "IEC 62443-2-1 (asset inventory), IEC 62443-3-3 SR 7.7 (least functionality) and SR 7.8 (control system component inventory); ARP (RFC 826).",
    ],
    limits: [
      "It analyses a scan you ran; it does not scan (a browser cannot).",
      "A port scan shows what answered at that moment from where it ran; filtered ports and UDP services are not seen unless scanned for.",
      "Vendor names come from the scan file (the scanner's OUI database).",
    ],
  },
  "/calculators/snmp-helper": {
    what: "A helper for SNMP: an OID decoder, an analyser for snmpwalk output from switches and devices, and an SNMPv3 settings check.",
    can: [
      "Decode common OIDs (system, interfaces, EtherLike, bridge, VLAN, LLDP, entity, host resources, standard traps) and identify vendor OIDs.",
      "Turn an snmpwalk into a port table and flag down links, CRC errors, duplex mismatches, 10 Mb/s links, output discards and spanning-tree changes; list LLDP neighbours.",
      "Assess SNMPv3 security level and protocols and list what both ends must match.",
      "Compare two readings of the same switch: new errors, discards and late collisions per port (with the rate per minute), link and spanning-tree changes, and the average traffic and utilisation of each port from the octet counters.",
    ],
    why: [
      "Switch port counters reveal most cabling and port faults without waiting for the network team.",
      "SNMP configuration errors (wrong version, user or protocol) are a common reason monitoring shows devices as down.",
    ],
    understand: [
      "Interface counters are totals since the last reset: compare two readings some minutes apart to see whether errors are still rising.",
      "An OID ends with an instance: .0 for single values, the interface index for table rows.",
      "SNMPv1/v2c communities travel in clear text; SNMPv3 authPriv authenticates and encrypts.",
    ],
    need: [
      "An snmpwalk of the device (from the management system or a read-only command such as snmpwalk -v2c -c <community> <address> 1.3.6.1.2.1), in named or numeric form.",
      "Or an OID from a trap, alarm or manual.",
      BROWSER,
    ],
    use: [
      "Paste an OID to see what it is.",
      "Paste an snmpwalk (or load the sample switch) and read the port table and findings.",
      "To see whether a fault is active now, take a second walk 5–15 minutes later and paste it as the second reading (or load the sample second reading).",
      "Choose the SNMPv3 settings planned for the switch and the management system and read the assessment.",
    ],
    output: ["The OID meaning and instance; device information, port table, LLDP neighbours and findings; the change between two readings with rates and utilisation; an SNMPv3 assessment."],
    interpret: [
      "Rising CRC errors on one port: replace the patch cord or SFP, then check again.",
      "Half duplex or late collisions: fix negotiation on both ends.",
      "Output discards: the port is congested — check the traffic (multicast filtering, bandwidth).",
    ],
    basis: ["Two readings: interval = difference of sysUpTime (hundredths of a second), or the interval you enter; rate = counter change ÷ interval; a 32-bit counter that went backwards is counted as one wrap at 2^32; a lower sysUpTime means the device restarted and the counters started again; utilisation = octets × 8 ÷ interval ÷ port speed (ifHighSpeed), the higher of in and out — an average over the interval, peaks are higher.", "SNMPv2-MIB, IF-MIB (RFC 2863), EtherLike-MIB (RFC 3635), BRIDGE-MIB (RFC 4188), Q-BRIDGE-MIB (RFC 4363), LLDP-MIB (IEEE 802.1AB), ENTITY-MIB (RFC 6933), HOST-RESOURCES-MIB (RFC 2790), SNMPv3 USM (RFC 3414), AES (RFC 3826), SHA-2 (RFC 7860)."],
    limits: [
      "It does not poll devices (a browser cannot send SNMP); it analyses output you paste.",
      "Vendor-private OIDs need the vendor's MIB file.",
    ],
  },

  "/calculators/certificate-inspector": {
    what: "A certificate viewer and checker for OPC UA, HTTPS, VPN and IEC 62351 certificates, working entirely in the browser.",
    can: [
      "Read PEM (single or chain) and DER certificate files.",
      "Show subject, issuer, validity, key, signature, key usages, extended key usages, alternative names, key identifiers, CRL locations, SHA-1 thumbprint and SHA-256 fingerprint.",
      "Check expiry, not-yet-valid, SHA-1/MD5 signatures, short RSA keys, self-signed status, name or IP mismatch, OPC UA ApplicationUri and key usages, and chain order.",
    ],
    why: [
      "Secure connections fail with vague errors when a certificate expires, is not trusted, or does not match the name or ApplicationUri.",
      "Certificate expiry is a common cause of sudden OPC UA or HTTPS outages; knowing the dates lets you renew in time.",
    ],
    understand: [
      "A certificate binds a public key to names, signed by an issuer; clients trust it if they trust the issuer — or this exact certificate when it is self-signed.",
      "Modern TLS clients check the subject alternative names, not the CN.",
      "OPC UA clients compare the URI in the certificate with the server's ApplicationUri.",
    ],
    need: [
      "The certificate only (.cer, .crt, .der, .pem) — never the private key. Export it from the Windows certificate manager or the OPC UA application's PKI folder.",
      BROWSER,
    ],
    use: [
      "Open the file or paste the PEM text (or load the sample).",
      "Choose what the certificate is for: OPC UA, TLS server or general; for TLS enter the name or address clients use.",
      "Read the checks, then the details; note the expiry date and thumbprint for the asset register.",
    ],
    output: ["Checks marked Problem, Check, Note or OK, and the full certificate details with thumbprints."],
    interpret: [
      "Expired or soon-expiring: renew and distribute the new certificate to every system that trusts it before the date.",
      "Name or URI mismatch: reissue with the correct names; changing the client's connection name to match is a workaround only.",
      "SHA-1 or short keys: reissue — current clients may already reject it.",
    ],
    basis: ["X.509 v3 (RFC 5280) parsed with ASN.1 DER rules; TLS server identity checks (RFC 6125); OPC UA application instance certificate conventions (OPC 10000-4 and -6); fingerprints computed with the browser's Web Crypto API."],
    limits: [
      "It does not check revocation (CRL/OCSP) or validate signatures against a trust store.",
      "Password-protected .pfx/.p12 files are not read.",
    ],
  },

  "/calculators/performance-log-analyser": {
    what: "An analyser for Windows Performance Monitor logs from SCADA servers, HMIs and historians, that turns counters into a verdict on CPU, memory, disk, network and processes.",
    can: [
      "Read CSV logs from typeperf, relog or a Data Collector Set.",
      "Give min, average, maximum and 95th percentile per counter and the share of time above warning and critical levels.",
      "List the busiest processes and the processes whose memory keeps growing.",
      "Provide the counter list and the typeperf command to record the log.",
    ],
    why: [
      "'Slow' has many causes; a log shows which resource is saturated and when, instead of guessing.",
      "A leaking process or an antivirus scan during operation is easy to see in a log and hard to see any other way.",
    ],
    understand: [
      "Short peaks are normal; what matters is how long a counter stays above its level.",
      "Disk latency (seconds per read or write) shows a slow disk better than disk queue length.",
      "Process CPU in Performance Monitor is per core (it can exceed 100 %); the analyser divides by the number of cores.",
    ],
    need: [
      "A Performance Monitor log in CSV, recorded during the slow period (the page gives the counter file and the typeperf command).",
      "The number of CPU cores and the installed RAM of the computer.",
      BROWSER,
    ],
    use: [
      "Download counters.txt, run the typeperf command on the server during the slow period, and copy the CSV.",
      "Open the CSV and enter the cores and RAM.",
      "Read the findings, then the busiest processes and the counter table.",
    ],
    output: ["Findings by area, busiest processes, memory growth and a table of every counter with its statistics and rule."],
    interpret: [
      "A resource above its critical level for a large share of the time is the bottleneck; fix it first.",
      "If nothing exceeds its level, the delay is probably in the application or a remote server.",
    ],
    basis: [
      "Rules of thumb stated with each counter: CPU above 80 / 90 %, processor queue above 2 per core, available memory below 10 % of RAM, committed memory above 80 %, disk latency above 20 / 50 ms, available disk space below 15 / 5 %, network above 70 % of the link speed.",
      "Memory growth: a positive least-squares trend with at least 30 % and 100 MB growth over the log.",
    ],
    limits: [
      "Thresholds are guidance; follow the vendor's sizing requirements where they differ.",
      "Short logs can mislead; record several hours.",
      ".blg files must be converted to CSV first (relog file.blg -f csv -o file.csv).",
    ],
  },

  "/calculators/mac-frame-decoder": {
    what: "A decoder for MAC addresses and the first bytes of an Ethernet frame, tuned to substation traffic: GOOSE, sampled values, PTP, PRP/HSR, MRP, spanning tree and IP multicast.",
    can: [
      "Tell whether an address is broadcast, multicast or unicast, manufacturer-assigned or locally administered, and which protocol uses a well-known multicast address.",
      "Decode a frame header from hex or a Wireshark hex dump: VLAN ID and priority, EtherType, HSR tag, PRP trailer.",
      "For GOOSE and SV: check the APPID against the IEC 61850 ranges, show the simulation bit and decode the PDU fields (gocbRef, time allowed to live, data set, stNum, sqNum, confRev, svID, smpCnt, smpSynch).",
      "Look up the manufacturer of a unicast address from the IEEE registry file you open.",
    ],
    why: [
      "Switch MAC tables, alarms and captures show raw addresses; knowing at a glance that 01-0C-CD-04-… is sampled values or 01-80-C2-00-00-0E never crosses a switch saves time when tracing a fault.",
      "Wrong APPID ranges, missing VLAN tags and low priorities are common GOOSE configuration errors that are easy to see in the first 26 bytes.",
    ],
    understand: [
      "The lowest bit of the first byte marks a multicast address; switches flood multicast to every port in the VLAN unless a static filter limits it.",
      "GOOSE and SV are Layer 2 multicast. IGMP snooping filters IP multicast (01-00-5E-…), not GOOSE or SV.",
      "The VLAN tag (0x8100) carries the VLAN ID and the 802.1Q priority (0–7) that switches use to queue the frame.",
      "The first three bytes of a manufacturer-assigned unicast address are the OUI registered to the maker of the network interface — not necessarily the maker of the device.",
    ],
    need: [
      "A MAC address in any common format, and/or the bytes of a frame: in Wireshark select the frame and use Copy → as Hex Dump or as Hex Stream.",
      "Optionally the IEEE OUI registry (oui.csv or oui.txt) downloaded from standards-oui.ieee.org, for manufacturer names.",
      BROWSER,
    ],
    output: [
      "Address type, the protocol it belongs to and notes on ranges and flooding.",
      "The decoded header and GOOSE/SV fields, and checks marked Problem, Check, Note or OK.",
    ],
    interpret: [
      "An APPID or MAC outside the recommended range is allowed by the protocol but usually breaks a project's addressing rules or a switch's static filter.",
      "No VLAN tag, or priority below 4, means switches treat GOOSE/SV as ordinary traffic: fix the publisher's VLAN-ID and VLAN-PRIORITY.",
      "Simulation bit set, or GOOSE 'simulation' TRUE: the publisher is in test or simulation mode and normal subscribers should ignore it.",
      "sqNum 0 with a new stNum is the first transmission after a change; rising sqNum are repetitions.",
    ],
    basis: [
      "Multicast and APPID ranges per IEC 61850-8-1 and -9-2 (Edition 2 Type 1A ranges 8000–BFFF and C000–FFFF accepted).",
      "Well-known addresses from IEEE 802.1D/Q, IEEE 802.1AB, IEEE 1588, IEC 62439-2/-3, RFC 1112, RFC 2464 and RFC 5798.",
      "PDU fields decoded with ASN.1 BER (tags 0x80–0x8A and 0xAB for GOOSE, 0x80–0x88 inside each ASDU for SV); UtcTime as seconds, a 24-bit fraction and a quality byte.",
      "Manufacturer names come only from the IEEE file you open; nothing is bundled or guessed.",
    ],
    limits: [
      "It decodes what you paste; it does not capture traffic or check a whole stream (use the GOOSE & SV Capture Analyzer for that).",
      "Data-set values inside allData and seqData are counted, not interpreted, because their types come from the SCD.",
      "Vendor-specific multicast addresses not in the list are reported as unknown multicast.",
    ],
    use: [
      "Type or paste a MAC address in the left panel and read what it is.",
      "Paste a frame in hex (or click Load sample GOOSE) in the right panel; read the header, the GOOSE/SV fields and the checks.",
      "For manufacturer names, download oui.csv from the IEEE once and open it with Open IEEE OUI file.",
    ],
  },

  "/calculators/scada-value-converter": {
    what: "A set of converters for the values SCADA engineers decode by hand: Modbus register pairs and notation, IEC 104 normalised, short-float and time values, and IEC 104 / IEC 61850 quality.",
    can: [
      "Show two Modbus registers as float32, int32 and uint32 in all four byte orders, and one register as uint16, int16, hex and BCD.",
      "Give the two registers to write for a float, in each order.",
      "Translate Modbus notation (40001, 400001, 30010) into the table, the 0-based protocol address and the function codes.",
      "Convert IEC 104 normalised values to and from raw and engineering values, show the short-float bytes on the wire, and decode or check a CP56Time2a time tag.",
      "Decode IEC 104 QDS, SIQ and DIQ bytes and IEC 61850 quality flag by flag.",
    ],
    why: [
      "A value that is 'wrong' between a device and SCADA is usually an encoding mismatch, not a fault: word order, a one-register offset, a full-scale mismatch or an unread quality flag.",
      "Seeing every interpretation side by side shows the right setting in seconds instead of trial and error on a live system.",
    ],
    understand: [
      "Modbus registers are 16 bits; 32-bit values span two registers and the standard does not fix their order, so devices differ.",
      "Manuals often number registers from 1 (40001) while the protocol sends the address from 0.",
      "An IEC 104 normalised value is a fraction of a full scale agreed by both ends; the full scale is not sent.",
      "A quality flag such as IV (invalid) or NT (not topical) means the value must not be used as a measurement, whatever its number.",
    ],
    need: [
      "The raw register values or bytes from the device, the gateway diagnostics or a capture, and ideally the true value shown on the device's display.",
      "The device's register map or IEC 104 interoperability list.",
      BROWSER,
    ],
    output: [
      "All interpretations of the registers, the registers to write, the protocol address and function codes, NVA and resolution, the decoded time with its flags, and the meaning of each quality bit.",
    ],
    interpret: [
      "The correct byte order is the one whose value matches the device display; huge or tiny values (1e38, 1e-41) mean the order is wrong.",
      "Every value shifted by one register means a 0-based / 1-based addressing mismatch.",
      "An NVA stuck at ±1 means the configured full scale is too small; poor resolution means it is too large.",
      "A CP56Time2a with IV set comes from a clock that is not synchronised: the event order may still be right, the absolute time is not.",
    ],
    basis: [
      "IEEE 754 single precision; byte orders ABCD (big-endian, Modbus standard), CDAB (word swap), BADC (byte swap), DCBA (little-endian).",
      "Modbus Application Protocol V1.1b3: function codes 01–06, 15, 16 and the register tables.",
      "IEC 60870-5-101/104: NVA = raw / 32768 (−1 … +1 − 2⁻¹⁵); short float as IEEE 754 sent least significant byte first; CP56Time2a field layout; QDS, SIQ and DIQ bit positions.",
      "IEC 61850-7-3 quality: validity (good 00, invalid 01, reserved 10, questionable 11) and detail flags in bits 2–12.",
    ],
    limits: [
      "It interprets numbers you enter; it does not read from a device.",
      "Vendor-specific encodings (scaled integers with private factors, 64-bit values, strings) are not covered.",
    ],
    use: [
      "Pick the section for your problem: Modbus registers, register notation, IEC 104 values, CP56Time2a or quality.",
      "Enter the raw values exactly as the device, gateway diagnostics or capture shows them (decimal or hex).",
      "Compare each interpretation with the true value on the device display and choose the one that matches.",
      "Apply that setting (byte order, address offset, full scale) in the SCADA or gateway configuration and confirm with a known value.",
    ],
  },

  "/calculators/iec-104-parameter-checker": {
    what: "A checker for the link parameters of an IEC 60870-5-104 connection: the window sizes k and w and the timers t0, t1, t2 and t3.",
    can: [
      "Check the standard's rules: w ≤ k, w ≤ 2/3 k, t2 < t1, timers within 1–255 s, and t3 relative to t1.",
      "With the measured round-trip time and the link bit rate, estimate the worst case before an acknowledgement arrives and compare it with t1.",
      "List every value that differs from the defaults, so both ends can be compared.",
    ],
    why: [
      "IEC 104 links that drop every few minutes or stall during an event burst are often caused by parameters that do not fit each other or the link — not by the network.",
      "Radio, cellular and satellite links add delays that the default t1 may not cover.",
    ],
    understand: [
      "k is how many I-frames the sender may have unacknowledged; w is after how many I-frames the receiver must acknowledge.",
      "t1 is the sender's patience: no acknowledgement within t1 and the connection is closed. t2 is how long the receiver may wait before acknowledging when it has nothing to send. t3 is the idle time before a test frame.",
      "Both ends must use matching values; a mismatch can work in quiet periods and fail under load.",
    ],
    need: [
      "The k, w, t0–t3 settings of the gateway or RTU and of the control centre.",
      "Optionally the round-trip time (ping between the ends) and the slowest bit rate on the path.",
      BROWSER,
    ],
    output: [
      "A consistent / needs correcting verdict, the checks with explanations, and the time needed to send k frames on the link.",
    ],
    interpret: [
      "Errors must be fixed on both ends. Warnings are risks that usually show up as dropped connections on slow links.",
      "When in doubt, return to the defaults (k 12, w 8, t0 30 s, t1 15 s, t2 10 s, t3 20 s) and change only what the link requires.",
    ],
    basis: [
      "IEC 60870-5-104 parameter definitions, defaults and ranges; the recommendation w ≤ 2/3 k.",
      "Worst case before acknowledgement ≈ round-trip time + time to send k frames (APDU + about 40 bytes TCP/IP each) + t2.",
    ],
    limits: [
      "Simple timing arithmetic: it does not model TCP retransmissions, packet loss or Nagle delays.",
      "Vendor limits and the control centre's policies also apply.",
    ],
    use: [
      "Enter k and w, then the four timers as set on the device.",
      "If you know them, enter the round-trip time, the link bit rate and a typical frame size.",
      "Read the result and the checks; compare the 'different from defaults' list with the other end's settings.",
    ],
  },

  "/calculators/serial-polling-calculator": {
    what: "A calculator for the polling time of serial SCADA links: character time, Modbus RTU gaps, transaction time and the full polling cycle for N devices.",
    can: [
      "Compute the character time from baud rate, data bits, parity and stop bits.",
      "Give the Modbus RTU t1.5 and t3.5 gaps and the request and response lengths for function 03/04.",
      "Add device turnaround and radio or WAN delay, and give the polling cycle, updates per second and line utilisation, including time-outs of offline devices.",
    ],
    why: [
      "Slow updates on serial lines are usually a polling-budget problem, and adding 'just one more device' can push the cycle past the required scan time.",
      "The calculation shows which term dominates — baud rate, number of requests, turnaround or link delay — so the fix targets the right one.",
    ],
    understand: [
      "Each character carries a start bit, data bits, an optional parity bit and stop bits: 11 bits per byte for Modbus RTU.",
      "Many small requests cost more than one large one, because every request pays the gaps, the turnaround and the link delay.",
      "An offline device costs a full time-out on every poll until it is taken out of scan.",
    ],
    need: [
      "Line settings (baud, data bits, parity, stop bits), number of devices and requests per device, registers per request or frame sizes.",
      "Device turnaround time (from the manual or a line analyser) and the link delay of radios or modems.",
      BROWSER,
    ],
    output: [
      "Character time, t1.5/t3.5, request, response and transaction times, the polling cycle against the required scan time, updates per second and line utilisation.",
    ],
    interpret: [
      "Cycle longer than the scan time: read more registers per request, poll slow data less often, raise the baud rate, or split devices over more ports.",
      "Low line utilisation with a long cycle means delays (turnaround, radio latency) dominate, not the baud rate.",
    ],
    basis: [
      "Character time = (1 + data + parity + stop bits) / baud.",
      "Modbus over Serial Line V1.02: t1.5 = 1.5 characters and t3.5 = 3.5 characters, fixed at 0.75 ms and 1.75 ms above 19 200 baud.",
      "Function 03/04: request 8 bytes; response 5 + 2 × registers bytes; at most 125 registers per request.",
      "Transaction = request + t3.5 + link delay + turnaround + response + link delay + t3.5; cycle = transactions × polls + time-outs.",
    ],
    limits: [
      "Turnaround times vary by device and request; measure them for an exact budget.",
      "Does not model collisions, retries after CRC errors or report-by-exception protocols (DNP3 unsolicited, IEC 101 balanced mode).",
    ],
    use: [
      "Set the line parameters and choose Modbus RTU (or enter frame sizes for another protocol).",
      "Enter the number of devices, requests per device and registers per request, the device turnaround and any link delay.",
      "Enter the required scan time and the time-outs you expect from offline devices.",
      "Read the cycle against the requirement and the notes on what to change.",
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
      "Draw the architecture automatically, show what is lost when each switch or inter-switch link fails, and list the bill of materials (switches, transceivers by type, cables with an ordering allowance, patch panels, trunk cables).",
      "Audit the installed switches: read their configuration exports and compare every port with the plan, trace each GOOSE/SV stream through the configured ports, check where each priority lands in the switch queues, and compare LLDP neighbours and MAC address tables with the planned port map.",
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
      "For the switch audit, the configuration exported from each switch (or filled into the CSV template), and optionally the LLDP neighbour and MAC address tables (command output, CSV or snmpwalk).",
      BROWSER,
    ],
    output: [
      "IP plan, stream addressing, switch-port VLAN tables and vendor-neutral switch configuration templates.",
      "Bandwidth, latency, redundancy and time-sync results with pass/fail against the stated limits.",
      "Firewall rule table, port and cable schedule with cable quantities, asset register, capture findings, an Excel design workbook and an updated SCD.",
      "An architecture drawing (SVG), a switch and link failure table, a bill of materials, and a switch audit with findings per port, the VLAN path of every stream, a queue assessment and as-built LLDP / MAC results — each exportable to Excel.",
    ],
    interpret: [
      "Treat every check result as a design review item: errors must be resolved, warnings justified.",
      "Bandwidth: keep steady load well below 50 % and bursts below 80 % of a port, as engineering practice; above that, filter multicast or split traffic.",
      "Latency and time-sync results are estimates from your inputs; confirm with manufacturer data and site tests.",
      "The switch configuration template must be translated to the switch vendor's syntax and reviewed before use.",
      "Switch audit: a broken path means a protection or interlocking message does not arrive — fix it before any functional test; a port that does not trust 802.1p puts GOOSE in the ordinary queue. Swapped cables and unknown devices found by LLDP or the MAC table are corrected on site and recorded.",
      "Failure analysis: a switch marked as a single point of failure for protection needs a redundant network (PRP/HSR, a ring) or a backup such as a hard-wired trip.",
    ],
    basis: [
      "VLSM: largest segments placed first on their natural boundary; addresses assigned in a fixed order by role and bay.",
      "Multicast ranges and priorities per IEC 61850-8-1 and -9-2; Edition 2 Type 1A APPID ranges accepted.",
      "Frame load = (frame bytes + 20) × 8 × frames per second (preamble and inter-frame gap included).",
      "Transfer time per IEC 61850-5 with frame transmission, switch latency, worst-case queuing behind a full-size frame and propagation; PTP budget per IEC 61850-9-3; PRP/HSR per IEC 62439-3; zones and conduits in the style of IEC 62443.",
      "Cable limits: 100 m twisted-pair channel (IEEE 802.3, ISO/IEC 11801); multimode reach by speed.",
      "Switch audit: a port carries a VLAN when it is its untagged (PVID / native / access) VLAN or in its tagged (allowed) list (IEEE 802.1Q); a stream path is the shortest switch path from the publisher's port to the subscriber's port, and every port on it must carry the stream's VLAN; a static multicast entry must include each egress port. Priority-to-queue mapping as entered (default: the 4-queue table recommended in IEEE 802.1D-1998, used by many switches).",
      "Failure analysis: a switch or link is removed from the planned topology and every publisher–subscriber pair is checked for a remaining path; PRP keeps every device on the other LAN (IEC 62439-3). Transceiver types follow the medium and speed of each fibre link (IEEE 802.3: 100BASE-FX, 1000BASE-SX on multimode; 100BASE-LX10, 1000BASE-LX on single-mode).",
    ],
    limits: [
      "Engineering estimates from stated assumptions, not a network simulation.",
      "The firewall planner proposes rules for review; it is not a security assessment.",
      "Switch templates are vendor-neutral; PRP/HSR and PTP behaviour depends on the actual products.",
      "The switch audit reads three formats (CSV template, NetStudio template, Cisco IOS-style CLI); other vendors' exports must first be put into the CSV template. It checks configuration, not hardware: a port configured correctly can still have a faulty cable — use the SNMP Helper's two-reading comparison for that.",
      "The port number in a Cisco-style file is the last number of the interface name; for stacked switches or modules use the CSV template. Many IEDs do not send LLDP, so the MAC table is the stronger as-built check for them.",
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
