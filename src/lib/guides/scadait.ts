// Category guide: SCADA Communications, Network & IT — the network and Windows
// basics a SCADA engineer needs to diagnose problems without waiting for support.

import type { GuideDoc } from "./types";

export const SCADAIT_GUIDE: GuideDoc = {
  slug: "network-it-basics-for-scada-engineers",
  groupId: "scada-it",
  title: "Network and IT Basics for SCADA Engineers",
  dek: "The networking, Windows, time and security knowledge that SCADA and commissioning engineers need to find communication faults themselves — IP addressing, routing, VLANs, multicast, ports, time synchronisation, SNMP, domains and certificates — explained without jargon.",
  readTime: "18 min read",
  intro: [
    "SCADA engineers are experts in the process, the protection and the control system, but most problems on site appear as network or computer problems: a laptop that cannot reach an IED, an IEC 104 link that drops, a clock that is wrong, a workstation that is slow. These are usually escalated to an IT or network team, and the solution waits.",
    "Most of these problems follow a small number of rules. This guide explains those rules in plain language, shows how each one appears on site, and links to the tool that checks it. The aim is not to make you a network engineer, but to let you solve the common cases yourself and to escalate the rest with the right evidence.",
  ],
  coreConcepts: [
    {
      heading: "IP address, subnet mask and subnet",
      body: [
        "An IPv4 address (for example 10.13.0.14) identifies a device on a network. The subnet mask (255.255.255.128, also written /25) divides the address into a network part and a device part. Together they define the subnet: the range of addresses the device treats as directly reachable — for 10.13.0.14/25 that is 10.13.0.0 to 10.13.0.127.",
        "The first address of a subnet (the network address) and the last (the broadcast address) cannot be given to a device. A 169.254.x.x address means the adapter asked for an address from a DHCP server and got no answer — on a substation network, devices normally have static addresses.",
      ],
    },
    {
      heading: "Default gateway and routing — and why each device decides for itself",
      body: [
        "To send a packet, a device checks whether the destination is inside its own subnet, using its own mask. If it is, the device sends directly. If not, it sends the packet to its default gateway (a router), which forwards it. A device without a gateway can only reach its own subnet.",
        "Because each device uses its own mask, two devices can disagree. A laptop on /24 may think an IED is local while the IED on /25 thinks the laptop is remote and sends its reply to the router: the requests arrive, the replies are lost, and ping simply times out. The SCADA Connectivity Assistant checks this from both sides. On a laptop with several adapters, route print shows which adapter and gateway Windows really uses.",
      ],
    },
    {
      heading: "MAC addresses and ARP",
      body: [
        "On the local network, frames are delivered by MAC address, the hardware address of the network interface. Before sending to a local IP address, a device asks 'who has this IP?' with an ARP broadcast; the owner answers with its MAC address. arp -a shows the answers this PC has received.",
        "If ping fails but arp -a shows the IED's MAC address, the IED is on the network and simply does not answer ping. If there is no ARP entry, the IED never answered at the Ethernet level: it is off, unplugged, on another VLAN or has another address. Two devices with the same IP address cause intermittent faults; Windows marks its own address '(Duplicate)' and logs event 4199.",
      ],
    },
    {
      heading: "VLANs and priority",
      body: [
        "A VLAN divides one physical switch network into separate logical networks. Each switch port has an untagged (native) VLAN for devices that do not tag their frames, and may carry other VLANs tagged with a 4-byte IEEE 802.1Q header that holds the VLAN ID and a priority from 0 to 7.",
        "Two devices on different VLANs cannot talk directly even if their IP addresses match — a common cause of 'everything looks right but nothing answers'. GOOSE and sampled values are normally tagged with their own VLAN and priority 4 or higher, so switches queue them ahead of other traffic; every port and uplink on their path must carry that VLAN.",
      ],
    },
    {
      heading: "Multicast: GOOSE and sampled values are not IP traffic",
      body: [
        "GOOSE and sampled values are Layer 2 multicast frames (EtherType 0x88B8 and 0x88BA) sent to 01-0C-CD-… addresses. They have no IP address, are never routed, and a ping test says nothing about them. Switches flood multicast to every port in the VLAN unless static multicast filters limit it.",
        "IGMP snooping, which many engineers expect to control multicast, only applies to IP multicast (01-00-5E-… addresses); it does not filter GOOSE or SV. Diagnose GOOSE with captures, the subscriber's supervision (LGOS) and the switch VLAN and filter configuration.",
      ],
    },
    {
      heading: "TCP, UDP and ports",
      body: [
        "Services listen on numbered ports: IEC 61850 MMS on TCP 102, IEC 60870-5-104 on TCP 2404, DNP3 on TCP 20000, Modbus TCP on TCP 502, OPC UA on TCP 4840, NTP on UDP 123, SNMP on UDP 161 and 162, Remote Desktop on TCP 3389, and the DCOM endpoint mapper used by OPC DA on TCP 135 plus dynamic ports.",
        "When a connection fails, the error tells you a lot. 'Connection refused' (Windows error 10061) means the device answered but nothing listens on that port: the service is off, the port is wrong, or the client limit is reached. 'Timed out' (10060), or SYN_SENT in netstat, means no answer at all: the device is unreachable or a firewall drops the packets.",
      ],
    },
    {
      heading: "DNS and DHCP",
      body: [
        "DNS translates names into IP addresses. Substation devices are usually addressed by IP, but domain logon, historians and services configured by name depend on DNS. nslookup shows whether a name resolves and which DNS server answered; 'Server: UnKnown' only means the DNS server has no name for itself.",
        "DHCP hands out addresses automatically. It is convenient on office networks but unusual on substation networks, where addresses are fixed in the IP register so that every device can be found and configured.",
      ],
    },
    {
      heading: "Time synchronisation: NTP, SNTP and PTP",
      body: [
        "Every event, alarm and disturbance record carries a time stamp, so all devices must agree on the time. Windows computers synchronise with the Windows Time service using NTP, either to a configured server (the station clock) or, in a domain, to the domain controllers. w32tm /query /status shows the source; 'Local CMOS Clock' means it is not synchronised at all.",
        "IEDs typically use SNTP (millisecond-level accuracy) or PTP to IEC/IEEE 61850-9-3 (sub-microsecond, needed for sampled values). Know which device time-stamps an event — the IED at source, or SCADA on receipt — before blaming a clock. Kerberos refuses domain logon when clocks differ by more than 5 minutes by default.",
      ],
    },
    {
      heading: "SNMP: reading the health of switches and devices",
      body: [
        "SNMP lets a management system read counters from switches, clocks, firewalls and servers: link state, speed, errors, discards, temperature. Each value has an OID; the common ones are standard (IF-MIB for interfaces, BRIDGE-MIB for spanning tree, LLDP-MIB for neighbours).",
        "A few counters find most cabling faults: receive (CRC) errors point to a cable, connector or SFP; half duplex with late collisions is a duplex mismatch; output discards mean congestion; frequent spanning-tree topology changes mean a flapping link. SNMPv1 and v2c send their community string in clear text; SNMPv3 with authentication and encryption (authPriv) is the secure choice.",
      ],
    },
    {
      heading: "Windows services, event logs and performance",
      body: [
        "SCADA servers run their software as Windows services that depend on each other, on databases and on licence servers. When something stops, the System event log usually says why: 7000 (failed to start), 7031 (terminated unexpectedly), 7009 (start timed out), 1053 (did not respond in time).",
        "When a computer is slow, measure before guessing: Task Manager for a first look, then a Performance Monitor log of CPU, memory, disk latency and available disk space. Disk latency above about 20 ms, available memory below about 10 % of RAM, or a process whose memory keeps growing are the usual causes; scheduled antivirus scans during operation are a frequent one.",
      ],
    },
    {
      heading: "Domains, logon and the secure channel",
      body: [
        "In a Windows domain, workstations trust the domain controllers through a secure channel based on a computer account password. Restoring a workstation from an old image or snapshot breaks it, and logon fails with 'the trust relationship between this workstation and the primary domain failed' (error 1789) until it is repaired.",
        "Slow logon on SCADA workstations is very often Group Policy waiting for a domain controller that the network has not yet made reachable at start-up (events 1129 and 5719). Switch ports to workstations configured as edge (portfast) ports and correct DNS settings usually fix it.",
      ],
    },
    {
      heading: "Certificates",
      body: [
        "OPC UA, HTTPS device interfaces, VPNs and IEC 62351 secured protocols use X.509 certificates to prove identity and encrypt traffic. A certificate has a validity period, a key, a signature from its issuer and names it is valid for. Expired certificates, untrusted self-signed certificates and name mismatches are the common failures, and the error rarely says which.",
        "For OPC UA, the application instance certificate carries the ApplicationUri in its subject alternative name, and each side must trust the other's certificate (or its issuing CA). Track expiry dates in the asset register and renew well before they run out.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "RFC 791, RFC 950, RFC 1918, RFC 3927", scope: "IPv4 addressing, subnetting, private address ranges and link-local addresses." },
    { standard: "RFC 826, RFC 792", scope: "ARP and ICMP (ping, tracert, unreachable messages)." },
    { standard: "IEEE 802.1Q, IEEE 802.1D/AB", scope: "VLANs and priority; spanning tree and LLDP." },
    { standard: "IEC 61850-8-1, -9-2", scope: "GOOSE and sampled-value multicast addressing and EtherTypes." },
    { standard: "RFC 5905 (NTP), IEC/IEEE 61850-9-3 (PTP power profile)", scope: "Time synchronisation of computers and IEDs." },
    { standard: "IEC 60870-5-104, Modbus Application Protocol, IEEE 1815 (DNP3)", scope: "The main SCADA telecontrol protocols and their ports and parameters." },
    { standard: "RFC 3411–3418 (SNMPv3), RFC 2863 (IF-MIB)", scope: "Device monitoring and interface counters." },
    { standard: "RFC 5280, OPC 10000-6, IEC 62351", scope: "Certificates, OPC UA security and power-system communication security." },
    { standard: "IEC 62443", scope: "Industrial cybersecurity: zones, conduits and system hardening." },
  ],
  workflow: [
    { title: "Start from the symptom", body: "Pick the symptom in the Troubleshooting & Escalation Assistant and follow the questions; it tells you which check to make next and why.", calculatorHref: "/calculators/scada-troubleshooting-assistant", calculatorName: "SCADA Troubleshooting & Escalation Assistant" },
    { title: "Check the addressing", body: "Compare the laptop's and the device's IP, mask and gateway from both sides.", calculatorHref: "/calculators/scada-connectivity", calculatorName: "SCADA Connectivity Assistant" },
    { title: "Read the command outputs", body: "Paste ipconfig, route print, ping, arp, netstat or w32tm output to see what it shows and what is wrong.", calculatorHref: "/calculators/command-output-explainer", calculatorName: "Command Output Explainer" },
    { title: "Look up the error or event", body: "Find what an error number or event ID means and what to check.", calculatorHref: "/calculators/windows-error-event-codes", calculatorName: "Windows Error & Event Code Explainer" },
    { title: "Check the switches", body: "Read the port counters and neighbours of the switches on the path; take a second reading some minutes later to see whether errors are still rising.", calculatorHref: "/calculators/snmp-helper", calculatorName: "SNMP Helper" },
    { title: "Check redundancy and time", body: "Analyse PRP/HSR/RSTP and PTP/NTP captures and w32tm output for hidden faults and clock errors.", calculatorHref: "/calculators/time-sync-analyser", calculatorName: "Time Sync Analyser" },
    { title: "Reconstruct the incident", body: "Merge the event lists of all devices on one UTC time line and correct the clocks that are wrong.", calculatorHref: "/calculators/soe-incident-timeline", calculatorName: "SOE Checker & Incident Timeline" },
    { title: "Read the protocol", body: "Open a capture of the IEC 104, Modbus TCP or DNP3 link to see sequence errors, exceptions, causes of transmission, IIN flags and time-tag offsets.", calculatorHref: "/calculators/scada-protocol-analyser", calculatorName: "SCADA Protocol Capture Analyser" },
    { title: "Check what is really on the network", body: "Compare a scan or ARP table with the IP register: unknown devices, wrong MAC addresses, devices at the wrong address and services that should be disabled.", calculatorHref: "/calculators/discovery-result-checker", calculatorName: "Network Discovery Result Checker" },
    { title: "Check values and protocol settings", body: "Convert Modbus and IEC 104 values, check IEC 104 parameters and serial polling cycles.", calculatorHref: "/calculators/scada-value-converter", calculatorName: "SCADA Value Converter" },
    { title: "Escalate with evidence", body: "When the fix belongs to another team, send the ticket the assistant prepared, with the outputs it lists.", calculatorHref: "/calculators/scada-troubleshooting-assistant", calculatorName: "SCADA Troubleshooting & Escalation Assistant" },
  ],
  commonMistakes: [
    { mistake: "Treating a successful ping as proof that SCADA communication works.", whyItMatters: "Ping tests only IP reachability. The service port can still be closed or blocked, and GOOSE and sampled values are not IP traffic at all." },
    { mistake: "Reading '0% loss' in ping as success when the lines say 'Destination host unreachable'.", whyItMatters: "Windows counts those messages as received; the target never answered." },
    { mistake: "Changing the IED's IP settings to suit the laptop.", whyItMatters: "Protection and control IEDs are configured to the project's addressing plan; change the laptop instead." },
    { mistake: "Giving every adapter of a laptop a default gateway.", whyItMatters: "Windows uses only one default route; devices behind the other gateway become unreachable." },
    { mistake: "Assuming IGMP snooping filters GOOSE.", whyItMatters: "IGMP applies to IP multicast only; GOOSE needs VLANs and static multicast filters." },
    { mistake: "Comparing event times from devices without checking their time synchronisation.", whyItMatters: "A computer on its local clock can be seconds out, which reverses the apparent order of events." },
    { mistake: "Escalating with 'it does not work' and no evidence.", whyItMatters: "The support team must repeat the basic checks; the ticket goes back and forth and the fix waits." },
  ],
  faqs: [
    { q: "Why can I ping the IED but my configuration tool cannot connect?", a: "Ping proves IP reachability only. Check the service port (MMS 102, IEC 104 2404, web 443), the Windows Firewall on the laptop, and the IED's client limit; netstat -ano shows whether the connection attempt is answered." },
    { q: "Why does my laptop show a 169.254.x.x address?", a: "The adapter is set to obtain an address automatically and found no DHCP server. Set a static address in the IED's subnet." },
    { q: "What is the difference between error 10060 and 10061?", a: "10060 (timed out): no answer at all — the device is unreachable or a firewall drops the packets. 10061 (refused): the device answered but nothing listens on the port." },
    { q: "How accurate must SCADA server time be?", a: "It depends on the project specification; typical figures are about 100 ms for operator displays and about 10 ms where SCADA time-stamps events. Sequence-of-events recording in IEDs needs 1 ms or better, which is why IEDs synchronise directly to the station clock." },
    { q: "Is SNMPv2c acceptable on a substation network?", a: "It sends its community in clear text. Prefer SNMPv3 with authPriv; if v2c is unavoidable, use a non-default read-only community restricted to the management system's address." },
  ],
};
