// Guided troubleshooting for SCADA engineers: symptom-led decision trees that
// end in a likely cause, what to do, which tool to use and — when the fix is
// outside the engineer's hands — an escalation ticket with the evidence.

export interface TOption {
  label: string;
  next?: string;
  result?: string;
}
export interface TNode {
  q: string;
  help: string;
  options: TOption[];
}
export interface TResult {
  title: string;
  sev: "error" | "warning" | "ok";
  cause: string;
  actions: string[];
  tools: { name: string; href: string }[];
  escalate?: { to: string; ask: string };
}
export interface Tree {
  id: string;
  title: string;
  symptom: string;
  start: string;
  nodes: Record<string, TNode>;
  results: Record<string, TResult>;
  evidence: string[];
}

const T = {
  conn: { name: "SCADA Connectivity Assistant", href: "/calculators/scada-connectivity" },
  cmd: { name: "Command Output Explainer", href: "/calculators/command-output-explainer" },
  codes: { name: "Error & Event Code Explainer", href: "/calculators/windows-error-event-codes" },
  i104: { name: "IEC 104 Parameter Checker", href: "/calculators/iec-104-parameter-checker" },
  snmp: { name: "SNMP Helper", href: "/calculators/snmp-helper" },
  perf: { name: "Performance & Disk Log Analyser", href: "/calculators/performance-log-analyser" },
  goose: { name: "GOOSE & SV Capture Analyzer", href: "/calculators/goose-sv-analyzer" },
  scl: { name: "SCL Studio", href: "/calculators/iec-61850-scl-editor" },
  net: { name: "SCL NetStudio", href: "/calculators/scl-netstudio" },
  mac: { name: "MAC & Frame Decoder", href: "/calculators/mac-frame-decoder" },
  reg: { name: "IP Register Checker", href: "/calculators/ip-register-checker" },
  cert: { name: "Certificate Inspector", href: "/calculators/certificate-inspector" },
};

export const TREES: Tree[] = [
  {
    id: "no-comms",
    title: "Cannot communicate with an IED, RTU or gateway",
    symptom: "SCADA, the gateway or an engineering laptop cannot connect to a device.",
    start: "link",
    evidence: ["ipconfig /all of the laptop or server", "ping -n 10 <device address>", "arp -a after the ping", "netstat -ano while the connection is attempted", "Switch port number and the device's IP, mask and gateway"],
    nodes: {
      link: { q: "Is the link LED lit on both the device port and the switch port?", help: "No light means no physical connection: nothing at the IP level can work until it is fixed. For fibre, both ends of the pair must be lit.", options: [{ label: "Yes, both are lit", next: "addr" }, { label: "No, or only one side", result: "physical" }] },
      addr: { q: "Are the laptop/server and the device in the same subnet, with the same mask?", help: "Enter both IP addresses, masks and gateways in the SCADA Connectivity Assistant. A mask mismatch makes traffic one-way.", options: [{ label: "Yes, checked", next: "ping" }, { label: "No / the assistant reports a problem", result: "addressing" }, { label: "Not sure", result: "addrcheck" }] },
      ping: { q: "What does ping to the device show?", help: "Look at who the replies come from: 'Reply from <device address>' is a real answer; 'Reply from <your own address>: Destination host unreachable' is not.", options: [{ label: "Real replies from the device", next: "svc" }, { label: "Destination host unreachable", next: "arp" }, { label: "Request timed out", next: "arp" }, { label: "General failure", result: "localpc" }] },
      arp: { q: "Right after the ping, does arp -a list the device's address with a MAC address?", help: "An ARP entry proves the device answered at the Ethernet level, even if it ignores ping.", options: [{ label: "Yes, it has a MAC address", result: "icmp" }, { label: "No entry for the device", result: "layer2" }] },
      svc: { q: "Does the actual connection (MMS, IEC 104, DNP3, Modbus, web) work?", help: "Try the connection and look at the error, or run netstat -ano while it tries.", options: [{ label: "Yes", result: "appok" }, { label: "No — 'connection refused' / 10061", result: "refused" }, { label: "No — times out / 10060 / SYN_SENT in netstat", result: "blocked" }] },
    },
    results: {
      physical: { title: "No physical link", sev: "error", cause: "The cable, fibre, SFP, port or media converter is faulty, or the cable is in the wrong port.", actions: ["Swap the patch cord with a known-good one", "For fibre: check Tx/Rx are crossed, the connectors are clean and the SFP types match (wavelength, single/multimode)", "Check the switch port is enabled and its speed/duplex setting matches the device", "Try another switch port"], tools: [{ name: "Fibre-Optic Link Budget", href: "/calculators/fibre-link-budget" }] },
      addressing: { title: "Addressing mismatch", sev: "error", cause: "The two devices are not in the same subnet, or use different masks, so at least one side sends its traffic to a gateway.", actions: ["Set the laptop to an unused address in the device's subnet with the device's mask (the assistant suggests one)", "Check the address is unused in the IP register", "Never change a protection IED's address to suit a laptop"], tools: [T.conn, T.reg] },
      addrcheck: { title: "Check the addressing first", sev: "warning", cause: "Most communication faults on site are addressing errors.", actions: ["Run ipconfig /all on the laptop and read the device's address from its front panel, configuration tool or the SCD", "Enter both in the SCADA Connectivity Assistant, then come back to this guide"], tools: [T.conn, T.cmd] },
      localpc: { title: "The PC cannot send at all", sev: "error", cause: "'General failure' means Windows could not send the packet: the adapter is disconnected or disabled, there is no route, or a local firewall or VPN client blocks it.", actions: ["Disconnect VPN clients and disable Wi-Fi while testing", "Check the adapter is enabled and connected (ipconfig /all)", "route print: is there a route for the device's subnet through the right adapter?"], tools: [T.cmd] },
      icmp: { title: "The device is there but ignores ping", sev: "warning", cause: "The device answered ARP, so it is on the network, but ping is blocked by its own settings or a firewall. Many IEDs do not answer ping by design.", actions: ["Test the service you need directly (MMS 102, IEC 104 2404, web 443)", "If the service also fails, continue as for a blocked or refused port"], tools: [T.cmd] },
      layer2: { title: "The device does not answer at the Ethernet level", sev: "error", cause: "No ARP answer: the device is off, on a different VLAN, has a different address than expected, or the port is in the wrong place.", actions: ["Check the device's actual IP address on its front panel", "Check the switch port's untagged VLAN (PVID) matches the laptop's port", "Look for an address conflict (Tcpip event 4199, '(Duplicate)' in ipconfig)", "Check the switch MAC table for the device's MAC on the expected port"], tools: [T.cmd, T.net, T.mac], escalate: { to: "Network team (managed switches)", ask: "Please confirm the untagged VLAN of switch ports <laptop port> and <device port>, and whether MAC <device MAC> is learned on <device port>." } },
      appok: { title: "The network is fine", sev: "ok", cause: "IP connectivity and the service port work; the remaining problem is in the application configuration.", actions: ["Check the IED name, access point and association settings (IEC 61850), or the common/IOA addresses (IEC 104)", "Check user name, password and the device's client limit", "Check the client and server use the same protocol options (e.g. TLS on or off)"], tools: [T.scl] },
      refused: { title: "The service is not listening", sev: "error", cause: "The device answered but refused the connection on that port: the service is disabled, the port is wrong, or the device's client limit is reached.", actions: ["Confirm the port: IEC 61850 MMS 102, IEC 104 2404, DNP3 20000, Modbus 502", "Enable the service in the device configuration tool", "Check how many clients the device accepts and which IP addresses are allowed"], tools: [T.codes] },
      blocked: { title: "The port is blocked on the way", sev: "error", cause: "The connection attempt gets no answer at all although the device answers ping or ARP: a firewall drops the packets (on the PC, the device or in between).", actions: ["Check the Windows Firewall on the laptop/server for outbound rules", "Check the device's own access list", "If a firewall sits between the subnets, ask for the rule"], tools: [T.cmd, T.codes], escalate: { to: "Network / security team (firewalls)", ask: "Please allow TCP <port> from <source IP> to <device IP> (protocol <MMS / IEC 104 / …>) or confirm which rule drops it. netstat shows SYN_SENT; ping and ARP to the device work." } },
    },
  },
  {
    id: "iec104-drops",
    title: "IEC 104 link to the control centre keeps dropping",
    symptom: "The IEC 60870-5-104 connection between the gateway/RTU and the control centre disconnects and reconnects.",
    start: "regular",
    evidence: ["Gateway/RTU event log with the disconnect times and reasons", "k, w, t0–t3 on both ends", "ping -n 200 to the far end (loss and round-trip time)", "Firewall idle time-out for the session"],
    nodes: {
      regular: { q: "Do the drops happen at regular intervals?", help: "Compare the times in the gateway log. A fixed interval points to a timer.", options: [{ label: "Yes, regular", next: "interval" }, { label: "No, irregular", next: "burst" }] },
      interval: { q: "How long is the interval?", help: "IEC 104 timers are seconds; firewall idle time-outs are typically minutes to an hour.", options: [{ label: "Seconds (close to t1 or t3)", result: "params" }, { label: "Minutes to an hour", result: "fwidle" }] },
      burst: { q: "Do the drops happen during bursts of events (faults, general interrogation)?", help: "A burst fills the send window k; if acknowledgements are late, t1 expires.", options: [{ label: "Yes", result: "window" }, { label: "No", next: "wan" }] },
      wan: { q: "Is the link over radio, cellular, satellite or a long WAN?", help: "These links add hundreds of milliseconds of delay and occasional loss.", options: [{ label: "Yes", result: "wanlink" }, { label: "No, a wired network", result: "loss" }] },
    },
    results: {
      params: { title: "Link parameters do not fit", sev: "error", cause: "A timer expires: w larger than about two thirds of k, t2 not shorter than t1, or the two ends use different values.", actions: ["Compare k, w, t0–t3 on both ends", "Check them with the IEC 104 Parameter Checker; return to the defaults (k 12, w 8, t1 15 s, t2 10 s, t3 20 s) unless the link needs otherwise"], tools: [T.i104] },
      fwidle: { title: "A firewall closes the idle session", sev: "warning", cause: "A firewall or NAT device drops sessions it considers idle; IEC 104 sends only test frames (every t3) when nothing changes.", actions: ["Ask for a longer idle time-out on the IEC 104 rule, longer than t3", "Or shorten t3 so test frames keep the session alive"], tools: [T.i104], escalate: { to: "Network / security team (firewalls)", ask: "Please check the idle/session time-out applied to TCP 2404 between <gateway IP> and <control centre IP>; the session drops every <interval>. IEC 104 t3 is <t3> s." } },
      window: { title: "Window or bandwidth limit during bursts", sev: "warning", cause: "During a burst the sender reaches k unacknowledged frames and waits; on a slow link the acknowledgements arrive after t1 and the connection is closed.", actions: ["Check w ≤ 2/3 k and that t1 covers the round trip plus sending k frames", "Check the link bandwidth at the time of the burst"], tools: [T.i104] },
      wanlink: { title: "Delay on a radio, cellular or satellite link", sev: "warning", cause: "The round-trip time is too long for t1, or loss forces TCP retransmissions beyond t1.", actions: ["Measure the round trip (ping -n 200) and enter it in the IEC 104 Parameter Checker", "Increase t1 on both ends if the checker shows it is too short"], tools: [T.i104, T.cmd] },
      loss: { title: "Packet loss on the network", sev: "warning", cause: "Intermittent loss on a wired path: faulty cable or SFP, duplex mismatch, congested or erroring port.", actions: ["ping -n 500 for loss", "Read the interface error and discard counters on the switches along the path (SNMP helper)"], tools: [T.cmd, T.snmp], escalate: { to: "Network team", ask: "Please check interface errors and discards on the path between <gateway IP> and <control centre IP>; IEC 104 drops irregularly and ping shows <x> % loss." } },
    },
  },
  {
    id: "time-wrong",
    title: "Time on the SCADA server or in the event list is wrong",
    symptom: "Clock on a SCADA server, HMI or historian differs from the station clock, or events appear in the wrong order.",
    start: "hours",
    evidence: ["w32tm /query /status", "w32tm /stripchart /computer:<station clock> /samples:10 /dataonly", "w32tm /query /configuration", "Time-Service events (35, 36, 47, 129, 134) and Kernel-General 1"],
    nodes: {
      hours: { q: "Is the time wrong by a whole number of hours?", help: "Whole hours are almost always a time zone or daylight-saving setting, not synchronisation.", options: [{ label: "Yes", result: "tz" }, { label: "No", next: "source" }] },
      source: { q: "What does w32tm /query /status show as Source?", help: "Paste the output into the Command Output Explainer if unsure.", options: [{ label: "Local CMOS Clock / Free-running System Clock", result: "nosync" }, { label: "VM IC Time Synchronization Provider", result: "vmhost" }, { label: "A domain controller name", next: "dc" }, { label: "The station clock (or another NTP server)", next: "offset" }] },
      dc: { q: "Are the domain controllers synchronised to the station clock or another reliable source?", help: "In a domain, workstations follow the domain controllers; the PDC emulator follows its configured source.", options: [{ label: "No / not known", result: "dcsource" }, { label: "Yes", next: "offset" }] },
      offset: { q: "What offset does w32tm /stripchart show against the station clock?", help: "Run it against the station clock's address, not the domain controller.", options: [{ label: "Below 10 ms", result: "timeok" }, { label: "10 ms to 1 s", result: "poll" }, { label: "More than 1 s", result: "bigoffset" }, { label: "Errors / time-outs", result: "udp123" }] },
    },
    results: {
      tz: { title: "Time zone or daylight-saving setting", sev: "warning", cause: "The clock is synchronised, but the time zone, the daylight-saving rule or the SCADA's UTC/local setting differs.", actions: ["Compare the Windows time zone and DST setting with the station standard", "Check whether the SCADA and the IEDs time-stamp in UTC or local time"], tools: [] },
      nosync: { title: "Not synchronised to any time server", sev: "error", cause: "Windows uses its own hardware clock, which drifts.", actions: ["Configure the station clock as NTP source: w32tm /config /manualpeerlist:\"<station clock IP>,0x8\" /syncfromflags:manual /update, then w32tm /resync (as administrator, if this computer is not in a domain)", "Check UDP 123 is allowed to the station clock"], tools: [T.cmd, T.codes] },
      vmhost: { title: "Time comes from the virtualisation host", sev: "warning", cause: "The virtual machine follows the host's clock, which may not be synchronised to the station clock.", actions: ["Synchronise the host to the station clock, or disable the host time-synchronisation integration for this VM and use NTP"], tools: [], escalate: { to: "Virtualisation / server team", ask: "Please confirm the time source of host <host name>; VM <name> takes its time from the host (VM IC Time Synchronization Provider)." } },
      dcsource: { title: "Domain controllers not synchronised to the station clock", sev: "warning", cause: "Workstations follow the domain hierarchy, so SCADA time is only as good as the domain controllers' source.", actions: ["Configure the PDC emulator to use the station clock or a reliable NTP source"], tools: [], escalate: { to: "Windows / Active Directory team", ask: "Please confirm the time source of the PDC emulator for domain <domain>. SCADA hosts follow the domain hierarchy and show <offset> against the station clock." } },
      timeok: { title: "This computer's clock is fine", sev: "ok", cause: "The offset to the station clock is within 10 ms. If events still look wrong, the time stamps may come from somewhere else.", actions: ["Check whether events are time-stamped by the IED (at source) or by SCADA on receipt", "Check the IEDs' own time synchronisation (SNTP/PTP status) and the time quality bits in their events"], tools: [{ name: "SCADA Value Converter (time and quality)", href: "/calculators/scada-value-converter" }] },
      poll: { title: "Synchronised, but loosely", sev: "warning", cause: "The time service polls rarely, the network delay varies, or the computer is a virtual machine.", actions: ["Reduce MaxPollInterval (for example to 6 = 64 s) on SCADA servers", "Synchronise directly to the station clock rather than through several levels"], tools: [T.cmd] },
      bigoffset: { title: "Large offset", sev: "error", cause: "Either this computer is not following the station clock, or the station clock itself is wrong (no GPS lock).", actions: ["Check the station clock's GPS/antenna status", "Check which source this computer really synchronises to (w32tm /query /source)"], tools: [T.cmd] },
      udp123: { title: "The time server does not answer", sev: "error", cause: "No NTP answer: wrong address, the device is not an NTP server, or UDP 123 is blocked.", actions: ["Check the station clock's NTP server is enabled", "Check firewalls for UDP 123"], tools: [T.cmd], escalate: { to: "Network / security team", ask: "Please allow UDP 123 from <SCADA host IP> to <station clock IP>; w32tm /stripchart times out." } },
    },
  },
  {
    id: "slow",
    title: "SCADA workstation or HMI is slow",
    symptom: "Screens open slowly, the PC hangs, or the SCADA application responds late.",
    start: "scope",
    evidence: ["Task Manager screenshot (Performance and Details tabs)", "A Performance Monitor CSV over the slow period", "System and Application event logs for the same period"],
    nodes: {
      scope: { q: "Is everything slow (Windows, opening programs), or only the SCADA application?", help: "This separates a computer problem from an application or server problem.", options: [{ label: "Everything", next: "resource" }, { label: "Only the SCADA application", next: "server" }] },
      resource: { q: "In Task Manager → Performance, which resource is high while it is slow?", help: "Watch for a minute; short peaks are normal.", options: [{ label: "CPU", result: "cpu" }, { label: "Memory", result: "mem" }, { label: "Disk (active time near 100 %)", result: "disk" }, { label: "Nothing is high", next: "logon" }] },
      logon: { q: "Is it slow mainly during logon or right after start-up?", help: "Slow logon is usually a network or domain problem, not a performance one.", options: [{ label: "Yes, at logon", result: "slowlogon" }, { label: "No, all the time", result: "collect" }] },
      server: { q: "Does the application depend on a server or database over the network?", help: "Thin clients and HMIs often wait for a SCADA or historian server.", options: [{ label: "Yes", result: "serverside" }, { label: "No / not known", result: "app" }] },
    },
    results: {
      cpu: { title: "CPU saturated", sev: "warning", cause: "One or more processes use most of the CPU.", actions: ["Details tab: sort by CPU and note the process", "Antivirus scans and Windows Update during operation are common causes; schedule them outside operating hours", "Record a Performance Monitor log and analyse it"], tools: [T.perf] },
      mem: { title: "Memory exhausted", sev: "warning", cause: "Available memory is low, so Windows pages to disk; a process may be leaking memory.", actions: ["Details tab: sort by memory; watch whether one process keeps growing", "Look for Resource-Exhaustion-Detector 2004", "Log Process\\Private Bytes over hours to confirm a leak"], tools: [T.perf, T.codes] },
      disk: { title: "Disk bottleneck", sev: "warning", cause: "The disk is too slow for the load: historian writes, logging, antivirus, a failing disk.", actions: ["Check disk latency (Avg. Disk sec/Read and /Write) in a Performance Monitor log", "Check available disk space and disk errors (events 7, 51, 153)"], tools: [T.perf, T.codes] },
      slowlogon: { title: "Slow logon: network or domain at start-up", sev: "warning", cause: "Group Policy cannot reach a domain controller in time (events 1129, 5719): network not ready at boot, DNS, or switch port spanning tree.", actions: ["Look for GroupPolicy 1129 and NETLOGON 5719 in the System log", "On managed switches, workstation ports should be edge/portfast ports", "Check DNS servers point to the domain DNS"], tools: [T.codes, T.cmd], escalate: { to: "Windows / network team", ask: "Logon on <host> is slow; System log shows <1129 / 5719> at start-up. Please check domain controller reachability and edge-port configuration of switch port <port>." } },
      collect: { title: "Collect a performance log", sev: "warning", cause: "No obvious resource is saturated; a log over the slow period is needed.", actions: ["Record CPU, memory, disk latency and network counters every 15 s for a few hours (typeperf command in the analyser)", "Analyse it and compare with the event log times"], tools: [T.perf] },
      serverside: { title: "The server or network is the bottleneck", sev: "warning", cause: "The client waits for the SCADA, historian or database server.", actions: ["Check the server's CPU, memory and disk with a performance log", "Ping the server for latency and loss from the client"], tools: [T.perf, T.cmd] },
      app: { title: "Application problem", sev: "warning", cause: "The computer is healthy; the delay is inside the application.", actions: ["Application and vendor logs", "Recent configuration changes (screens, scripts, tag count)", "Report to the vendor with the log times"], tools: [T.codes] },
    },
  },
  {
    id: "logon",
    title: "Cannot log on / domain problem on a SCADA workstation",
    symptom: "Logon fails or the workstation reports a domain error.",
    start: "msg",
    evidence: ["The exact error message", "System log: NETLOGON and GroupPolicy events", "Security log 4625 on the workstation or domain controller", "w32tm /query /status"],
    nodes: {
      msg: { q: "Which message does Windows show?", help: "Use the exact wording.", options: [{ label: "The trust relationship between this workstation and the primary domain failed", result: "trust" }, { label: "There are currently no logon servers available / domain not available", result: "nodc" }, { label: "Account locked out / password expired", result: "account" }, { label: "Time or clock difference", result: "skew" }, { label: "No error, but logon is very slow", result: "slow" }] },
    },
    results: {
      trust: { title: "Broken secure channel", sev: "error", cause: "The computer account password no longer matches the domain (restored image or snapshot, long offline, duplicated name).", actions: ["Log on with a local administrator account", "Test-ComputerSecureChannel (PowerShell); repair with -Repair using domain admin credentials, or rejoin the domain"], tools: [T.codes], escalate: { to: "Windows / Active Directory team", ask: "Workstation <name> reports 'trust relationship failed' (error 1789). Please repair the secure channel or reset the computer account." } },
      nodc: { title: "No domain controller reachable", sev: "error", cause: "Network, DNS or firewall prevents the workstation from finding a domain controller.", actions: ["ipconfig /all: DNS servers must be the domain DNS", "nltest /dsgetdc:<domain>", "Cached credentials allow logon only if the user logged on before"], tools: [T.cmd, T.codes], escalate: { to: "Windows / network team", ask: "Workstation <name> (<IP>) cannot find a domain controller for <domain>. ipconfig and nltest outputs attached." } },
      account: { title: "Account locked or expired", sev: "warning", cause: "Too many bad passwords (often an old password saved in a service or session) or password policy.", actions: ["Ask for unlock/reset", "Find where the old password is stored: services, scheduled tasks, mapped drives, other sessions"], tools: [T.codes], escalate: { to: "Account administrators", ask: "Please unlock/reset account <name>. Security event 4740 on the domain controller names the source computer." } },
      skew: { title: "Clock difference too large for Kerberos", sev: "error", cause: "Kerberos rejects logon when clocks differ by more than the tolerance (5 minutes by default).", actions: ["Correct the time (see 'Time is wrong' guide)", "w32tm /resync once the source is reachable"], tools: [T.cmd] },
      slow: { title: "Slow logon", sev: "warning", cause: "Usually Group Policy waiting for the network or a domain controller at start-up.", actions: ["Look for GroupPolicy 1129 and NETLOGON 5719", "Check the switch port is an edge port and the DNS settings"], tools: [T.codes] },
    },
  },
  {
    id: "disk",
    title: "Disk full or historian stopped writing",
    symptom: "A volume is full, or the historian / archive stopped storing data.",
    start: "which",
    evidence: ["Free space of each volume", "System log: srv 2013 and disk events 7, 51, 153", "Historian archive and retention settings"],
    nodes: {
      which: { q: "What is the situation?", help: "Check available disk space in File Explorer and the System log for disk events.", options: [{ label: "System volume C: is full", result: "sys" }, { label: "Data / historian volume is full", next: "change" }, { label: "Disk errors in the event log", result: "diskerr" }] },
      change: { q: "Did the data rate, the number of tags or the retention setting change recently?", help: "Compare with the last change record.", options: [{ label: "Yes", result: "retention" }, { label: "No", result: "growth" }] },
    },
    results: {
      sys: { title: "System volume full", sev: "error", cause: "Logs, crash dumps, Windows Update files or temporary files filled C:.", actions: ["Move application logs and archives to a data volume", "Clean temporary files and old update files", "Check log rotation of the SCADA and database"], tools: [T.perf] },
      diskerr: { title: "Disk hardware errors", sev: "error", cause: "The disk or controller reports errors; data is at risk.", actions: ["Back up now", "Check RAID/controller status and disk health", "Replace the disk"], tools: [T.codes], escalate: { to: "Server / hardware support", ask: "Server <name> logs disk errors (events <7/51/153>) on <disk>. Please check the RAID controller and replace the disk." } },
      retention: { title: "Retention no longer matches the data volume", sev: "warning", cause: "More tags, faster logging or longer retention increased the storage needed.", actions: ["Recalculate the archive size for the new data rate", "Adjust retention or add storage"], tools: [] },
      growth: { title: "Unexpected growth", sev: "warning", cause: "Something writes more than planned: a database transaction log without backups, debug logging left on, a chattering signal.", actions: ["Find the largest and fastest-growing folders", "Check SQL Server transaction logs and backups", "Look for chattering signals filling the event archive"], tools: [] },
    },
  },
  {
    id: "goose",
    title: "GOOSE message not received by a subscriber",
    symptom: "An IED does not receive, or rejects, a GOOSE message it should subscribe to.",
    start: "lost",
    evidence: ["Subscriber's GOOSE supervision status (LGOS) and alarms", "Wireshark captures at the subscriber's and publisher's switch ports", "SCD of the substation"],
    nodes: {
      lost: { q: "Does the subscriber report the GOOSE as lost, or as received but rejected / wrong?", help: "Look at the subscriber's GOOSE supervision (LGOS St, ConfRevNum) in its tool or HMI.", options: [{ label: "Lost / never received", next: "subport" }, { label: "Received but rejected or wrong data", result: "config" }] },
      subport: { q: "Is the GOOSE visible in a capture taken on the subscriber's switch port?", help: "Capture with a mirror port or TAP on the subscriber's port; filter eth.type == 0x88b8.", options: [{ label: "Yes, it arrives at the port", result: "subcfg" }, { label: "No", next: "pubport" }] },
      pubport: { q: "Is it visible on the publisher's switch port?", help: "Same capture on the publisher's port.", options: [{ label: "Yes", result: "switchpath" }, { label: "No", result: "publisher" }] },
    },
    results: {
      config: { title: "Configuration mismatch between publisher and subscriber", sev: "error", cause: "confRev, data set, gocbRef/goID or test/simulation mode differ between what is sent and what the subscriber expects.", actions: ["Compare the publisher's control block and data set with the subscriber's configuration (SCL Studio Compare)", "Check confRev on both sides; reload both after any data-set change", "Check neither is in test or simulation mode unless intended"], tools: [T.scl, T.goose, { name: "61850 Academy (labs 7 and 8)", href: "/calculators/iec-61850-academy" }] },
      subcfg: { title: "The subscriber filters it out", sev: "error", cause: "The frame reaches the port but the subscriber rejects it: different MAC, APPID, VLAN, goID or confRev, or the port strips the VLAN tag.", actions: ["Decode a captured frame and compare MAC, APPID, VLAN, goID and confRev with the subscriber's configuration", "Check the subscriber port's VLAN membership (tagged vs untagged)"], tools: [T.mac, T.goose, T.scl] },
      switchpath: { title: "The switches do not forward it", sev: "error", cause: "VLAN membership or static multicast filters on the switch ports or uplinks do not include the stream.", actions: ["Check the stream's VLAN on every port and uplink on the path", "Check static multicast filters (the NetStudio multicast matrix shows which ports need it)"], tools: [T.net], escalate: { to: "Network team (managed switches)", ask: "Please add VLAN <vlan> (tagged) and multicast <MAC> to ports <list> on switches <names>; the GOOSE reaches the publisher port but not the subscriber port." } },
      publisher: { title: "The publisher does not send it", sev: "error", cause: "The GOOSE is disabled, the data set or control block is not loaded, or the publisher sends it on a different VLAN or port.", actions: ["Check GoEna (GOOSE enabled) and the loaded configuration in the IED tool", "Capture all traffic on the publisher port to see whether it sends with other addresses"], tools: [T.goose, T.scl] },
    },
  },
];

export interface Step {
  node: string;
  q: string;
  answer: string;
}

export function ticketText(tree: Tree, steps: Step[], resultId: string, fields: Record<string, string>): string {
  const r = tree.results[resultId];
  const L: string[] = [];
  L.push(`SUBJECT: ${tree.title} — ${r.title}`);
  L.push("");
  for (const [k, v] of Object.entries(fields)) if (v.trim()) L.push(`${k}: ${v.trim()}`);
  L.push(`Symptom: ${tree.symptom}`);
  L.push("");
  L.push("Checks done:");
  steps.forEach((s, i) => L.push(`  ${i + 1}. ${s.q} → ${s.answer}`));
  L.push("");
  L.push(`Likely cause: ${r.cause}`);
  if (r.escalate) {
    L.push("");
    L.push(`Request to ${r.escalate.to}:`);
    L.push(`  ${r.escalate.ask}`);
  }
  L.push("");
  L.push("Evidence attached:");
  tree.evidence.forEach((e) => L.push(`  - [ ] ${e}`));
  L.push("");
  L.push("Prepared with the AJapps troubleshooting assistant (www.ajpowerapps.com).");
  return L.join("\n");
}
