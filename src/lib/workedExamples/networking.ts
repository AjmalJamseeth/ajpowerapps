// Worked examples: substation and SCADA networking (SCADA Connectivity
// Assistant, Fibre-Optic Link Budget, IP Address Register Checker). The values
// are those returned by the libraries (scadaconnect.ts, fibrebudget.ts,
// ipregister.ts) for the stated inputs; tests/networking.test.ts checks them.

import type { WorkedExample } from "./types";

export const NETWORKING_EXAMPLES: WorkedExample[] = [
  {
    slug: "laptop-cannot-ping-ied-subnet-mask-mismatch",
    groupId: "iec-61850",
    calculatorHref: "/calculators/scada-connectivity",
    calculatorName: "SCADA Connectivity Assistant",
    title: "Worked Example: Laptop Cannot Ping the IED — a One-Way Subnet Mask Mismatch",
    dek: "The engineer's laptop and a protection IED have addresses in the same range, yet ping fails. Checking the addressing from both sides shows why, and which laptop address works.",
    standard: "IPv4 (RFC 791 / 950)",
    readTime: "6 min read",
    scenario: [
      { label: "Laptop", value: "10.13.0.200, mask 255.255.255.0, no gateway" },
      { label: "IED", value: "10.13.0.14, mask 255.255.255.128, gateway 10.13.0.1" },
      { label: "Connection", value: "Laptop on a spare port of the station-bus switch, same VLAN" },
      { label: "Symptom", value: "Ping times out; the IED's web page does not open" },
    ],
    scenarioNote: "The laptop was set up from an old drawing that showed the station bus as a /24. The IED configuration uses /25.",
    steps: [
      {
        title: "The laptop's decision",
        body: "The laptop applies its own mask (/24) to its own address and to the IED's address.",
        equation: "network = IP AND mask",
        substitution: "10.13.0.200 AND 255.255.255.0 = 10.13.0.0;  10.13.0.14 AND 255.255.255.0 = 10.13.0.0",
        result: "Same network → the laptop sends directly to the IED",
      },
      {
        title: "The IED's decision",
        body: "The IED applies its own mask (/25). Its subnet 10.13.0.0/25 covers 10.13.0.0–10.13.0.127.",
        substitution: "10.13.0.200 AND 255.255.255.128 = 10.13.0.128 ≠ 10.13.0.0",
        result: "Different network → the IED sends its reply to gateway 10.13.0.1",
      },
      {
        title: "What happens on the wire",
        body: "The ping request reaches the IED. The reply is addressed to the router, not to the laptop. Unless the router sends it back onto the same LAN, it is lost — so ping fails although the cable, switch and VLAN are fine.",
        result: "Verdict: mask mismatch — the two sides disagree about the subnet",
        note: "This is why the check must be done from both sides. Looking only at the laptop, everything seems correct.",
      },
      {
        title: "Choose a working laptop address",
        body: "Put the laptop in the IED's subnet with the IED's mask. The assistant proposes an address near the top of the usable range (lastHost − 9), away from the IEDs at the bottom and the gateway.",
        equation: "usable range = network + 1 … broadcast − 1",
        substitution: "10.13.0.0/25: 10.13.0.1 … 10.13.0.126; 10.13.0.126 − 9 = 10.13.0.117",
        result: "Laptop: 10.13.0.117 / 255.255.255.128, no gateway needed",
        note: "Check the IP address register first that 10.13.0.117 is not already used.",
      },
      {
        title: "Test the service",
        body: "With the new address the assistant reports 'Can talk directly'. Next, test the protocol: IEC 61850 MMS on TCP 102. If ping works but the engineering tool cannot connect, check the Windows firewall and the IED's client-connection limit.",
      },
    ],
    resultSummary: [
      { check: "Laptop sees IED as local (/24)", requirement: "Both sides agree", actual: "Local", pass: true },
      { check: "IED sees laptop as local (/25)", requirement: "Both sides agree", actual: "Via gateway", pass: false },
      { check: "After change: 10.13.0.117/25", requirement: "Same subnet both ways", actual: "Direct", pass: true },
    ],
    finalAnswer: "The laptop's /24 mask makes the fault one-way. Setting the laptop to 10.13.0.117 / 255.255.255.128 (the IED's subnet and mask) restores direct communication.",
    keyInsight: "Each device judges 'local' with its own mask. Two devices only talk directly when both agree.",
    faqs: [
      { q: "Would adding a gateway to the laptop fix it?", a: "No. The laptop already sends directly; the problem is the IED's reply going to its gateway. Only matching the mask (or a router that sends the reply back) fixes it." },
      { q: "Why not just change the IED's mask to /24?", a: "The /25 is part of the station-bus design; other devices and the gateway rely on it. Change the laptop, not the protection IED." },
    ],
  },
  {
    slug: "fibre-link-budget-1000base-lx-3-km-single-mode",
    groupId: "iec-61850",
    calculatorHref: "/calculators/fibre-link-budget",
    calculatorName: "Fibre-Optic Link Budget Calculator",
    title: "Worked Example: Fibre Link Budget for a 3.2 km 1000BASE-LX Link Between Substations",
    dek: "A gigabit single-mode link between two substation buildings: does it pass on worst-case component losses, on typical losses, and what changes if 1000BASE-LX10 optics are used?",
    standard: "IEEE 802.3 / TIA-568.3-D",
    readTime: "7 min read",
    scenario: [
      { label: "Transceiver", value: "1000BASE-LX SFP, 1310 nm: Tx min −11.5 dBm, Rx sensitivity −19 dBm" },
      { label: "Fibre", value: "OS2 single-mode, 0.4 dB/km at 1310 nm, 3.2 km" },
      { label: "Connector pairs", value: "4 (patch cord into panel and panel to switch, at each end)" },
      { label: "Splices", value: "2 (pigtail fusion splices at the two panels)" },
      { label: "Safety margin", value: "3 dB" },
    ],
    scenarioNote: "Transceiver figures are representative datasheet values; use the actual module's datasheet for a real design.",
    steps: [
      {
        title: "Power budget",
        equation: "PB = Ptx,min − Prx,sens",
        substitution: "PB = −11.5 − (−19)",
        result: "PB = 7.50 dB",
      },
      {
        title: "Link loss on the TIA-568.3-D maximum basis",
        equation: "L = α·ℓ + Nc·Lc + Ns·Ls",
        substitution: "L = 0.4 × 3.2 + 4 × 0.75 + 2 × 0.3 = 1.28 + 3.00 + 0.60",
        result: "L = 4.88 dB",
      },
      {
        title: "Margin left",
        equation: "M = PB − L − Msafety",
        substitution: "M = 7.50 − 4.88 − 3.00",
        result: "M = −0.38 dB → fails on worst-case values",
        note: "The connectors take 3.0 dB of the 7.5 dB budget — more than the 3.2 km of fibre.",
      },
      {
        title: "Maximum length on this basis",
        equation: "ℓmax = (PB − Msafety − Nc·Lc − Ns·Ls) / α",
        substitution: "ℓmax = (7.50 − 3.00 − 3.00 − 0.60) / 0.4",
        result: "ℓmax = 2.25 km (below the 5 km IEEE 802.3 reach of 1000BASE-LX)",
      },
      {
        title: "Typical installed losses",
        body: "With factory-polished connectors (0.5 dB) and fusion splices (0.1 dB):",
        substitution: "L = 1.28 + 4 × 0.5 + 2 × 0.1 = 3.48 dB;  M = 7.50 − 3.48 − 3.00",
        result: "M = +1.02 dB → passes, but only if the installed loss is measured and confirmed",
      },
      {
        title: "Alternative: 1000BASE-LX10 optics",
        body: "A 1000BASE-LX10 module with Tx min −9.5 dBm and Rx sensitivity −19.5 dBm gives a 10 dB budget.",
        substitution: "M = 10.0 − 4.88 − 3.00",
        result: "M = +2.12 dB → passes on worst-case values, reach 10 km",
      },
    ],
    resultSummary: [
      { check: "1000BASE-LX, maximum losses", requirement: "Margin ≥ 0 dB", actual: "−0.38 dB", pass: false },
      { check: "1000BASE-LX, typical losses", requirement: "Margin ≥ 0 dB", actual: "+1.02 dB", pass: true },
      { check: "1000BASE-LX10, maximum losses", requirement: "Margin ≥ 0 dB", actual: "+2.12 dB", pass: true },
      { check: "Reach (IEEE 802.3)", requirement: "3.2 km ≤ 5 km (LX) / 10 km (LX10)", actual: "3.2 km", pass: true },
    ],
    finalAnswer: "1000BASE-LX is marginal at 3.2 km (−0.38 dB on worst-case losses, +1.02 dB on typical). Specify 1000BASE-LX10 optics for a +2.12 dB margin on the design basis, and record the measured link loss at commissioning.",
    keyInsight: "On short single-mode links the connectors, not the fibre, use most of the budget.",
    faqs: [
      { q: "Can I reduce the number of connectors instead?", a: "Yes. Splicing the trunk straight to the equipment pigtails or removing an intermediate panel removes 0.75 dB per pair on the design basis." },
      { q: "Does the receiver overload on this link?", a: "No. The calculator takes the strongest transmitter (−3 dBm) and a low estimate of the link loss (about 2.2 dB), giving about −5.2 dBm at the receiver — below the −3 dBm overload level." },
    ],
  },
  {
    slug: "substation-ip-address-register-check-duplicates-overlaps",
    groupId: "iec-61850",
    calculatorHref: "/calculators/ip-register-checker",
    calculatorName: "IP Address Register Consistency Checker",
    title: "Worked Example: Checking a Substation IP Address Register Before Configuration",
    dek: "A 16-device register for station bus, process bus, switch management and SCADA DMZ is checked before it is issued. Seven errors and three warnings are found in seconds — each with its line number.",
    standard: "IPv4 (RFC 791 / 950 / 3927)",
    readTime: "7 min read",
    scenario: [
      { label: "Station bus, VLAN 1", value: "10.13.0.0/25, gateway 10.13.0.1 — gateway, HMI, GPS clock, protection IEDs, bay controllers" },
      { label: "Process bus, VLAN 20", value: "10.13.0.128/26 — two merging units" },
      { label: "Switch management, VLAN 99", value: "10.13.0.192/27, gateway 10.13.0.193 — two switches, engineering PC" },
      { label: "SCADA DMZ, VLAN 30", value: "10.13.1.0/28, gateway 10.13.1.1 — gateway's second port" },
      { label: "Input", value: "Table copied from Excel (the built-in sample register)" },
    ],
    steps: [
      {
        title: "Duplicate IP address (line 5 and 7)",
        body: "P132_Q01 and P87T_T1 are both 10.13.0.14 — the transformer protection line was copied from the feeder line and the address not changed.",
        result: "DUP-IP — error. Give P87T_T1 an unused address, e.g. 10.13.0.16.",
      },
      {
        title: "Wrong mask (line 8)",
        body: "BCU_J01 uses 255.255.255.0 while the rest of VLAN 1 uses /25. Its subnet 10.13.0.0/24 overlaps every other 10.13.0.x subnet in the register.",
        result: "SUBNET-OVERLAP — error, and MASK-MIX — warning. Correct the mask to 255.255.255.128.",
      },
      {
        title: "Gateway outside the subnet (line 9)",
        body: "BCU_J02 has gateway 10.13.1.1, which is in the DMZ subnet, not in 10.13.0.0/25. The device can never reach it.",
        result: "GW-OUTSIDE — error, and GW-MIX — warning. Correct the gateway to 10.13.0.1.",
      },
      {
        title: "Broadcast address used (line 10)",
        equation: "broadcast = network OR NOT mask",
        substitution: "10.13.0.0 OR 0.0.0.127 = 10.13.0.127",
        result: "IP-NETBC — error. BCU_J03 cannot use 10.13.0.127; the last usable address is 10.13.0.126.",
      },
      {
        title: "Duplicate MAC address (lines 11 and 12)",
        body: "MU_Q01 and MU_T1 share 00-21-C1-11-00-0A. A real MAC is unique per device, so this is a copying error in the register — but if it were real, the switch would flip the address between two ports.",
        result: "DUP-MAC — error. Read the MAC from the device label or the configuration tool.",
      },
      {
        title: "Mask mix on the management VLAN (line 15)",
        body: "ENG-PC uses /26 while the switches use /27. Its subnet 10.13.0.192/26 overlaps 10.13.0.192/27.",
        result: "SUBNET-OVERLAP — error, and MASK-MIX — warning. Set the PC to 255.255.255.224.",
      },
      {
        title: "Link-local address (line 17)",
        body: "LAPTOP is entered with 169.254.10.5 — copied from a laptop that was set to DHCP and had no DHCP server.",
        result: "IP-SPECIAL — error. Assign a static maintenance address in 10.13.0.0/25.",
      },
    ],
    resultSummary: [
      { check: "Duplicate IP / MAC", requirement: "None", actual: "1 IP, 1 MAC", pass: false },
      { check: "Unusable addresses", requirement: "None", actual: "Broadcast 10.13.0.127, link-local 169.254.10.5", pass: false },
      { check: "Gateways inside own subnet", requirement: "All", actual: "BCU_J02 outside", pass: false },
      { check: "One mask per VLAN, no overlaps", requirement: "Yes", actual: "2 overlaps, 2 mask mixes", pass: false },
      { check: "Totals", requirement: "0 errors", actual: "7 errors, 3 warnings, 2 notes", pass: false },
    ],
    finalAnswer: "The register has 7 errors and 3 warnings. After the seven corrections above (new address for P87T_T1 and BCU_J03, /25 mask for BCU_J01, gateway 10.13.0.1 for BCU_J02, correct MAC for MU_T1, /27 for ENG-PC, static address for LAPTOP) it can be issued for configuration.",
    keyInsight: "Most register errors are copied lines. Duplicate checks on IP, MAC and name catch them before they reach site.",
    faqs: [
      { q: "Why are there two 'info' notes?", a: "VLAN 1 and VLAN 99 each carry more than one subnet because of the wrong masks. They disappear once the masks are corrected." },
      { q: "Can I check a register with the mask in the IP column?", a: "Yes — write addresses as 10.13.0.14/25 and leave out the mask column." },
    ],
  },
];
