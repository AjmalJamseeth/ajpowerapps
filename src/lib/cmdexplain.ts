// Command output explainer: reads the output of the Windows network and time
// commands SCADA engineers are asked to run (ipconfig /all, route print,
// arp -a, ping, tracert, netstat -ano, w32tm /query /status, w32tm /stripchart,
// nslookup), explains it in plain language and flags the problems it shows.

import { ip2n, n2ip, maskToPrefix, sameSubnet, isApipa } from "./cmdnet";

export type Sev = "error" | "warning" | "info" | "ok";
export interface Finding {
  sev: Sev;
  text: string;
}
export interface Fact {
  label: string;
  value: string;
}
export interface Explained {
  command: string;
  title: string;
  summary: string;
  facts: Fact[];
  table?: { headers: string[]; rows: string[][] };
  findings: Finding[];
  next: string[];
}

export type CommandKey = "ipconfig" | "route" | "arp" | "ping" | "tracert" | "netstat" | "w32tm" | "stripchart" | "nslookup";

export const COMMANDS: { key: CommandKey; cmd: string; what: string }[] = [
  { key: "ipconfig", cmd: "ipconfig /all", what: "Every network adapter with its IP address, mask, gateway, DNS, DHCP and link state." },
  { key: "route", cmd: "route print -4", what: "The IPv4 routing table: which adapter and gateway Windows uses for each destination." },
  { key: "arp", cmd: "arp -a", what: "The IP-to-MAC table: which devices on the local subnets have answered recently." },
  { key: "ping", cmd: "ping -n 10 <address>", what: "Whether a device answers ICMP echo, with loss and round-trip time." },
  { key: "tracert", cmd: "tracert -d <address>", what: "The routers (hops) on the path to a device and where the path stops." },
  { key: "netstat", cmd: "netstat -ano", what: "TCP and UDP connections and listening ports, with the owning process ID." },
  { key: "w32tm", cmd: "w32tm /query /status", what: "The Windows time service: synchronisation source, stratum, last sync and accuracy estimate." },
  { key: "stripchart", cmd: "w32tm /stripchart /computer:<time server> /samples:10 /dataonly", what: "Measured offset between this computer and a time server." },
  { key: "nslookup", cmd: "nslookup <name>", what: "Whether a name resolves through DNS, and which DNS server answered." },
];

export function detect(text: string): CommandKey | null {
  const t = text || "";
  if (/Windows IP Configuration|Physical Address[ .]*:|IPv4 Address[ .]*:/i.test(t)) return "ipconfig";
  if (/IPv4 Route Table|Network Destination\s+Netmask\s+Gateway/i.test(t)) return "route";
  if (/Internet Address\s+Physical Address\s+Type/i.test(t) || /Interface:\s*\d+\.\d+\.\d+\.\d+\s+---/i.test(t)) return "arp";
  if (/Tracing route to|over a maximum of \d+ hops/i.test(t)) return "tracert";
  if (/Pinging .* with \d+ bytes|Ping statistics for/i.test(t)) return "ping";
  if (/Proto\s+Local Address\s+Foreign Address/i.test(t)) return "netstat";
  if (/Leap Indicator:|Stratum:|ReferenceId:/i.test(t)) return "w32tm";
  if (/Tracking .* \[|d:[+-]\d+\.\d+s\s+o:[+-]\d+\.\d+s/i.test(t)) return "stripchart";
  if (/^(Server|Address):\s+/im.test(t) && /(Name:|can't find|Non-authoritative|request timed out)/i.test(t)) return "nslookup";
  return null;
}

const PORTS: Record<number, string> = {
  20: "FTP data", 21: "FTP", 22: "SSH / SFTP", 23: "Telnet (unencrypted)", 25: "SMTP", 53: "DNS", 67: "DHCP server", 68: "DHCP client", 69: "TFTP",
  80: "HTTP", 102: "IEC 61850 MMS (ISO-TSAP)", 123: "NTP / SNTP", 135: "RPC endpoint mapper (DCOM, OPC DA)", 137: "NetBIOS name", 138: "NetBIOS datagram",
  139: "NetBIOS session", 161: "SNMP", 162: "SNMP traps", 389: "LDAP", 443: "HTTPS", 445: "SMB file sharing", 464: "Kerberos password", 88: "Kerberos",
  502: "Modbus TCP", 514: "Syslog", 636: "LDAPS", 802: "Modbus TCP Security", 1433: "Microsoft SQL Server", 2404: "IEC 60870-5-104", 3268: "Global catalog",
  3389: "Remote Desktop (RDP)", 3782: "IEC 61850 MMS over TLS", 4840: "OPC UA", 4843: "OPC UA over TLS", 5985: "WinRM (HTTP)", 5986: "WinRM (HTTPS)",
  19998: "IEC 60870-5-104 over TLS", 20000: "DNP3",
};
export const portName = (p: number) => PORTS[p] ?? null;

const clean = (s: string) => s.replace(/\r/g, "");

// ------------------------------------------------------------------ ipconfig
interface Adapter {
  name: string;
  desc: string;
  mac: string;
  dhcp: string;
  disconnected: boolean;
  ipv4: { ip: string; state: string }[];
  apipa: string[];
  mask: string[];
  gw: string[];
  dns: string[];
}

function parseIpconfig(text: string): { host: string; adapters: Adapter[] } {
  const lines = clean(text).split("\n");
  const adapters: Adapter[] = [];
  let host = "", cur: Adapter | null = null, lastKey = "";
  for (const raw of lines) {
    const hdr = raw.match(/^(\S.*adapter .+):\s*$/i);
    if (hdr) {
      cur = { name: hdr[1].trim(), desc: "", mac: "", dhcp: "", disconnected: false, ipv4: [], apipa: [], mask: [], gw: [], dns: [] };
      adapters.push(cur);
      lastKey = "";
      continue;
    }
    const kv = raw.match(/^\s+([A-Za-z][A-Za-z0-9 \-()]*?)[ .]*:\s*(.*)$/);
    const cont = raw.match(/^\s{20,}(\S.*)$/);
    if (kv) {
      const k = kv[1].trim().toLowerCase(), v = kv[2].trim();
      lastKey = k;
      if (!cur) {
        if (k === "host name") host = v;
        continue;
      }
      if (k === "description") cur.desc = v;
      else if (k === "physical address") cur.mac = v;
      else if (k === "dhcp enabled") cur.dhcp = v;
      else if (k === "media state") cur.disconnected = /disconnected/i.test(v);
      else if (k.startsWith("ipv4 address") || k === "ip address") {
        const m = v.match(/(\d+\.\d+\.\d+\.\d+)\s*(?:\((\w+)\))?/);
        if (m) cur.ipv4.push({ ip: m[1], state: m[2] || "" });
      } else if (k.startsWith("autoconfiguration ipv4")) {
        const m = v.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) cur.apipa.push(m[1]);
      } else if (k === "subnet mask") cur.mask.push(v);
      else if (k === "default gateway") {
        const m = v.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) cur.gw.push(m[1]);
      } else if (k === "dns servers") {
        const m = v.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (m) cur.dns.push(m[1]);
      }
    } else if (cont && cur) {
      const m = cont[1].match(/^(\d+\.\d+\.\d+\.\d+)/);
      if (m && lastKey === "default gateway") cur.gw.push(m[1]);
      else if (m && lastKey === "dns servers") cur.dns.push(m[1]);
    }
  }
  return { host, adapters };
}

function explainIpconfig(text: string): Explained {
  const { host, adapters } = parseIpconfig(text);
  const F: Finding[] = [];
  const active = adapters.filter((a) => !a.disconnected && (a.ipv4.length || a.apipa.length));
  const rows = adapters.map((a) => [
    a.name.replace(/^(.*?) adapter (.*)$/i, "$2 ($1)"),
    a.disconnected ? "disconnected" : "connected",
    [...a.ipv4.map((x) => x.ip + (x.state && x.state !== "Preferred" ? ` (${x.state})` : "")), ...a.apipa.map((x) => x + " (link-local)")].join(", ") || "—",
    a.mask.join(", ") || "—",
    a.gw.join(", ") || "—",
    /yes/i.test(a.dhcp) ? "DHCP" : a.dhcp ? "static" : "—",
  ]);
  for (const a of adapters) {
    const nm = a.name.replace(/^.*adapter /i, "");
    for (const x of a.ipv4) {
      if (/duplicate/i.test(x.state)) F.push({ sev: "error", text: `${nm}: ${x.ip} is marked (Duplicate). Another device on the network already uses this address, so Windows has stopped using it. Find the other device (arp -a from another PC, or the switch MAC table) or choose a free address.` });
      if (/tentative/i.test(x.state)) F.push({ sev: "warning", text: `${nm}: ${x.ip} is (Tentative): Windows is still checking that the address is unique, or the check failed repeatedly.` });
    }
    for (const x of a.apipa) F.push({ sev: "error", text: `${nm}: ${x} is a link-local (169.254.x.x) address. The adapter is set to obtain an address automatically and no DHCP server answered. On a substation network set a static IP address in the IED's subnet.` });
    for (const x of a.ipv4) if (isApipa(x.ip)) F.push({ sev: "error", text: `${nm}: ${x.ip} is a link-local address — no DHCP server answered.` });
    if (a.ipv4.length && a.mask.length && a.gw.length) {
      const ip = ip2n(a.ipv4[0].ip), p = maskToPrefix(a.mask[0]);
      for (const g of a.gw) {
        const gn = ip2n(g);
        if (ip != null && gn != null && p != null && !sameSubnet(ip, gn, p)) F.push({ sev: "error", text: `${nm}: gateway ${g} is outside the adapter's subnet (${a.ipv4[0].ip}/${p}). Windows cannot reach it, so traffic to other subnets fails.` });
      }
    }
  }
  const withGw = active.filter((a) => a.gw.length);
  if (withGw.length > 1) F.push({ sev: "warning", text: `${withGw.length} connected adapters have a default gateway (${withGw.map((a) => a.name.replace(/^.*adapter /i, "") + " → " + a.gw[0]).join("; ")}). Windows sends traffic for unknown destinations through only one of them (lowest metric), so devices behind the other gateway may be unreachable. On an engineering laptop, normally only the corporate or internet adapter has a gateway; the substation adapter has none, or a specific route is added.` });
  const vpn = active.filter((a) => /vpn|tap-|tunnel|wireguard|fortinet|cisco anyconnect|globalprotect|pangp/i.test(a.desc + a.name));
  if (vpn.length) F.push({ sev: "warning", text: `A VPN adapter is connected (${vpn.map((a) => a.desc || a.name).join(", ")}). Many VPN clients take over the routing table or block local subnets; disconnect it while working on the substation network if devices are unreachable.` });
  const wifi = active.filter((a) => /wireless|wi-fi|wlan|802\.11/i.test(a.desc + a.name));
  if (wifi.length && active.length > 1) F.push({ sev: "info", text: "Wi-Fi is connected at the same time as a wired adapter. If both reach networks with overlapping addresses, traffic can leave through the wrong one; disable Wi-Fi while testing." });
  for (let i = 0; i < active.length; i++)
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      const ia = ip2n(a.ipv4[0]?.ip ?? ""), ib = ip2n(b.ipv4[0]?.ip ?? ""), pa = maskToPrefix(a.mask[0] ?? ""), pb = maskToPrefix(b.mask[0] ?? "");
      if (ia != null && ib != null && pa != null && pb != null && (sameSubnet(ia, ib, Math.min(pa, pb)))) F.push({ sev: "warning", text: `${a.name.replace(/^.*adapter /i, "")} and ${b.name.replace(/^.*adapter /i, "")} are in overlapping subnets. Windows may send traffic for that subnet out of either adapter.` });
    }
  const disc = adapters.filter((a) => a.disconnected && /ethernet/i.test(a.name));
  if (disc.length) F.push({ sev: "info", text: `Disconnected wired adapter(s): ${disc.map((a) => a.name.replace(/^.*adapter /i, "")).join(", ")}. If this is the one plugged into the substation switch, check the cable, the switch port (link LED) and, for fibre, the media converter.` });
  if (!F.some((f) => f.sev === "error" || f.sev === "warning")) F.push({ sev: "ok", text: "No addressing problems visible in the adapter settings." });
  return {
    command: "ipconfig /all",
    title: "Network adapters",
    summary: `${adapters.length} adapter(s), ${active.length} connected with an IPv4 address${host ? ` on ${host}` : ""}.`,
    facts: host ? [{ label: "Host name", value: host }] : [],
    table: { headers: ["Adapter", "Link", "IPv4 address", "Mask", "Gateway", "Addressing"], rows },
    findings: F,
    next: ["Check the IED is in the same subnet as the adapter you use (SCADA Connectivity Assistant).", "Run route print to see which adapter Windows uses for the IED's address.", "Run arp -a after a ping to see whether the IED answered at the Ethernet level."],
  };
}

// ------------------------------------------------------------------ route print
interface Route {
  dest: string;
  mask: string;
  gw: string;
  iface: string;
  metric: number;
  persistent: boolean;
}
function parseRoutes(text: string): Route[] {
  const out: Route[] = [];
  let persistent = false;
  for (const l of clean(text).split("\n")) {
    if (/Persistent Routes/i.test(l)) persistent = true;
    if (/Active Routes/i.test(l)) persistent = false;
    const m = l.match(/^\s*(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(On-link|\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+)\s*$/i);
    if (m) out.push({ dest: m[1], mask: m[2], gw: m[3], iface: m[4], metric: +m[5], persistent: false });
    const p = persistent && l.match(/^\s*(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+|Default)\s*$/i);
    if (p) out.push({ dest: p[1], mask: p[2], gw: p[3], iface: "(persistent)", metric: p[4] === "Default" ? 0 : +p[4], persistent: true });
  }
  return out;
}

/** The route Windows uses for an address: longest prefix match, then lowest metric. */
export function pickRoute(routes: Route[], target: string): Route | null {
  const t = ip2n(target);
  if (t == null) return null;
  let best: Route | null = null, bestP = -1;
  for (const r of routes) {
    if (r.persistent) continue;
    const d = ip2n(r.dest), p = maskToPrefix(r.mask);
    if (d == null || p == null || !sameSubnet(t, d, p)) continue;
    if (p > bestP || (p === bestP && best && r.metric < best.metric)) (best = r), (bestP = p);
  }
  return best;
}

function explainRoute(text: string, target: string): Explained {
  const routes = parseRoutes(text);
  const active = routes.filter((r) => !r.persistent);
  const F: Finding[] = [];
  const defaults = active.filter((r) => r.dest === "0.0.0.0" && r.mask === "0.0.0.0").sort((a, b) => a.metric - b.metric);
  if (defaults.length > 1) F.push({ sev: "warning", text: `${defaults.length} default routes. Windows uses the lowest metric: gateway ${defaults[0].gw} via interface ${defaults[0].iface} (metric ${defaults[0].metric}). Destinations that are only reachable through ${defaults.slice(1).map((d) => d.gw).join(", ")} need a specific route (route -p add <network> mask <mask> <gateway>).` });
  else if (defaults.length === 1) F.push({ sev: "info", text: `Default route: gateway ${defaults[0].gw} via interface ${defaults[0].iface} (metric ${defaults[0].metric}). Every destination not covered by a more specific route goes there.` });
  else F.push({ sev: "info", text: "No default route: this computer can only reach its directly connected subnets and the specific routes listed." });
  const pers = routes.filter((r) => r.persistent);
  if (pers.length) F.push({ sev: "info", text: `${pers.length} persistent route(s) added with route -p: ${pers.map((r) => `${r.dest}/${maskToPrefix(r.mask)} → ${r.gw}`).join(", ")}. They survive restarts; check they still match the current network.` });
  const facts: Fact[] = [];
  if (target) {
    const r = pickRoute(active, target);
    if (!r) F.push({ sev: "error", text: `No route matches ${target}: Windows will report "Destination net unreachable" or "General failure".` });
    else {
      const via = /on-link/i.test(r.gw) ? `directly on the local subnet (On-link) through the adapter with address ${r.iface}` : `through gateway ${r.gw}, leaving by the adapter with address ${r.iface}`;
      facts.push({ label: `Route used for ${target}`, value: `${r.dest}/${maskToPrefix(r.mask)} — ${via}, metric ${r.metric}` });
      F.push({ sev: "info", text: `Windows sends traffic for ${target} ${via}. If that is not the adapter plugged into the substation network, the IED will not answer: fix the adapter address or add a specific route.` });
    }
  }
  const rows = active.filter((r) => !/^(224\.0\.0\.0|255\.255\.255\.255|127\.)/.test(r.dest) || r.dest === "0.0.0.0").map((r) => [`${r.dest}/${maskToPrefix(r.mask) ?? "?"}`, r.gw, r.iface, String(r.metric)]);
  return {
    command: "route print",
    title: "IPv4 routing table",
    summary: `${active.length} active route(s), ${defaults.length} default route(s).`,
    facts,
    table: { headers: ["Destination", "Gateway", "Interface", "Metric"], rows },
    findings: F,
    next: ["Enter the IED address above to see which route Windows chooses.", "To reach a remote subnet through the substation router only: route -p add <network> mask <mask> <router address> (run as administrator)."],
  };
}

// ------------------------------------------------------------------ arp -a
function explainArp(text: string): Explained {
  const F: Finding[] = [];
  const rows: string[][] = [];
  let iface = "";
  const macMap = new Map<string, string[]>();
  for (const l of clean(text).split("\n")) {
    const h = l.match(/Interface:\s*(\d+\.\d+\.\d+\.\d+)/i);
    if (h) {
      iface = h[1];
      continue;
    }
    const m = l.match(/^\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-f]{2}(?:-[0-9a-f]{2}){5})\s+(\w+)/i);
    if (!m) continue;
    const ip = m[1], mac = m[2].toUpperCase(), type = m[3].toLowerCase();
    const n = ip2n(ip)!;
    const special = (n >>> 0) >= ip2n("224.0.0.0")! || ip.endsWith(".255");
    if (special) continue;
    rows.push([iface, ip, mac, type]);
    if (mac !== "FF-FF-FF-FF-FF-FF") macMap.set(mac, [...(macMap.get(mac) ?? []), ip]);
    if (type === "static") F.push({ sev: "info", text: `${ip} has a static ARP entry (${mac}). Static entries override the real device; remove it (arp -d ${ip}) if the device was replaced.` });
  }
  for (const [mac, ips] of macMap) if (ips.length > 1) F.push({ sev: "warning", text: `${mac} answers for ${ips.join(", ")}. This is normal for a router or a firewall doing proxy ARP; for an IED it means two addresses on one device, or an address conflict.` });
  F.push({ sev: "info", text: "Only devices this PC has talked to recently appear (entries expire after a few minutes). If the IED is missing right after a ping, it did not answer ARP: it is off, on another VLAN, in another subnet, or the cable is faulty." });
  return {
    command: "arp -a",
    title: "IP-to-MAC table",
    summary: `${rows.length} device entr${rows.length === 1 ? "y" : "ies"} (multicast and broadcast entries hidden).`,
    facts: [],
    table: { headers: ["Interface", "IP address", "MAC address", "Type"], rows },
    findings: F,
    next: ["Decode a MAC address (manufacturer, locally administered) with the MAC Address & Ethernet Frame Decoder.", "To refresh: arp -d * (as administrator), then ping the device and run arp -a again."],
  };
}

// ------------------------------------------------------------------ ping
function explainPing(text: string): Explained {
  const t = clean(text);
  const F: Finding[] = [];
  const target = t.match(/Pinging\s+(\S+)(?:\s+\[(\d+\.\d+\.\d+\.\d+)\])?/i);
  const replies = [...t.matchAll(/Reply from (\d+\.\d+\.\d+\.\d+): bytes=\d+ time[=<](\d+)ms TTL=(\d+)/gi)];
  const unreach = [...t.matchAll(/Reply from (\d+\.\d+\.\d+\.\d+): Destination (host|net) unreachable/gi)];
  const timeouts = (t.match(/Request timed out/gi) || []).length;
  const general = (t.match(/General failure/gi) || []).length;
  const ttlExp = (t.match(/TTL expired in transit/gi) || []).length;
  const stats = t.match(/Sent = (\d+), Received = (\d+), Lost = (\d+)/i);
  const facts: Fact[] = [];
  const dest = target ? target[2] ?? target[1] : "";
  if (dest) facts.push({ label: "Target", value: target![2] ? `${target![1]} (${target![2]})` : dest });
  if (stats) facts.push({ label: "Sent / received / lost (as Windows counts)", value: `${stats[1]} / ${stats[2]} / ${stats[3]}` });
  if (replies.length) {
    const times = replies.map((r) => +r[2]);
    const ttl = +replies[0][3];
    facts.push({ label: "Real echo replies", value: String(replies.length) });
    facts.push({ label: "Round trip min / avg / max", value: `${Math.min(...times)} / ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(0)} / ${Math.max(...times)} ms` });
    facts.push({ label: "TTL", value: `${ttl} — ${ttl > 128 ? "starts at 255: typically a network device or embedded system" : ttl > 64 ? "starts at 128: typically Windows" : "starts at 64: typically Linux or an embedded device (many IEDs)"} (a rule of thumb, not proof)` });
    const lossPct = stats ? (100 * (+stats[1] - replies.length)) / +stats[1] : 0;
    if (lossPct > 0) F.push({ sev: "warning", text: `${lossPct.toFixed(0)} % of echoes got no real reply. Intermittent loss on a substation LAN points to a duplex mismatch, a faulty cable or SFP, a congested port, or a busy device that drops ICMP first.` });
    else F.push({ sev: "ok", text: "Every echo was answered: the device is reachable at the IP level." });
    if (Math.max(...times) > 50 && Math.min(...times) < 5) F.push({ sev: "info", text: "Round-trip times vary widely. On a local LAN this suggests a busy device or a congested link; on a radio or cellular link it is normal." });
  }
  if (unreach.length) {
    const from = unreach[0][1], kind = unreach[0][2].toLowerCase();
    F.push({ sev: "error", text: `"Reply from ${from}: Destination ${kind} unreachable". The message comes from ${from}${from === dest ? "" : " (this PC or a router), not from the target"}. ${kind === "host" ? "No device answered the ARP request for the target on the local subnet: it is off, disconnected, in another VLAN, or its address is different." : "There is no route to the target network."} Windows counts these messages as "Received", so the summary can show 0 % loss although the target never answered.` });
  }
  if (timeouts) F.push({ sev: replies.length ? "warning" : "error", text: `${timeouts} × "Request timed out": the request left but no reply came back. Typical causes: the device is off or unplugged; a firewall (on the device, Windows or in between) blocks ICMP; the device's return path is wrong (mask mismatch, wrong gateway); or the device does not answer ping at all (some IEDs do not).` });
  if (general) F.push({ sev: "error", text: `"General failure": Windows could not send the packet at all — the adapter is disconnected or disabled, there is no route, or a firewall/VPN client blocks it locally.` });
  if (ttlExp) F.push({ sev: "error", text: `"TTL expired in transit": the packet went round in a routing loop between routers. A network problem for the network team — send them the tracert output.` });
  if (!F.length) F.push({ sev: "info", text: "No reply lines recognised; paste the whole ping output." });
  return { command: "ping", title: "Ping result", summary: replies.length ? `${replies.length} real repl${replies.length === 1 ? "y" : "ies"} from ${dest || "the target"}.` : `No real replies from ${dest || "the target"}.`, facts, findings: F, next: ["If ping fails, run arp -a: an entry for the IED means it answered at the Ethernet level and ICMP is being blocked.", "If ping works but the SCADA connection fails, test the service port (netstat shows SYN_SENT for a blocked or closed port)."] };
}

// ------------------------------------------------------------------ tracert
function explainTracert(text: string): Explained {
  const F: Finding[] = [];
  const rows: string[][] = [];
  let lastIp = "", lastHop = 0, stars = 0;
  const target = clean(text).match(/Tracing route to\s+(\S+)(?:\s+\[(\d+\.\d+\.\d+\.\d+)\])?/i);
  const dest = target ? target[2] ?? target[1] : "";
  for (const l of clean(text).split("\n")) {
    const m = l.match(/^\s*(\d+)\s+(.+?)\s*$/);
    if (!m || !/ms|\*/.test(m[2])) continue;
    const hop = +m[1];
    const ip = (m[2].match(/(\d+\.\d+\.\d+\.\d+)\]?\s*$/) || [])[1] || "";
    const times = [...m[2].matchAll(/(<?\d+) ms|\*/g)].map((x) => x[0]);
    rows.push([String(hop), times.join("  "), ip || (/timed out/i.test(m[2]) ? "Request timed out" : "")]);
    if (ip) (lastIp = ip), (lastHop = hop), (stars = 0);
    else stars++;
  }
  const reached = dest && lastIp === dest;
  if (reached) F.push({ sev: "ok", text: `The target ${dest} answered at hop ${lastHop}.` });
  else if (lastIp) F.push({ sev: "warning", text: `The last router that answered is ${lastIp} (hop ${lastHop}); after that ${stars} hop(s) did not answer. Either the next router or firewall drops the probes, or the path really stops there. Send this output to the network team with the time of the test.` });
  else F.push({ sev: "error", text: "No hop answered. The first router (default gateway) is unreachable, or ICMP is blocked on this PC." });
  if (rows.length === 1 && reached) F.push({ sev: "info", text: "One hop: the target is on the local subnet or directly behind the gateway." });
  F.push({ sev: "info", text: "Routers and firewalls may answer tracert slowly or not at all while forwarding real traffic normally, so a * line alone is not proof of a fault." });
  return { command: "tracert", title: "Route to the target", summary: reached ? `Reached ${dest} in ${lastHop} hop(s).` : `Path to ${dest || "the target"} ends after ${lastIp || "the first hop"}.`, facts: dest ? [{ label: "Target", value: dest }] : [], table: { headers: ["Hop", "Times", "Router"], rows }, findings: F, next: ["Use tracert -d to skip name lookups, which makes it faster on networks without DNS."] };
}

// ------------------------------------------------------------------ netstat -ano
function explainNetstat(text: string): Explained {
  const F: Finding[] = [];
  const rows: string[][] = [];
  const counts: Record<string, number> = {};
  const listening: { proto: string; addr: string; port: number; pid: string }[] = [];
  const synSent: string[] = [];
  for (const l of clean(text).split("\n")) {
    const m = l.match(/^\s*(TCP|UDP)\s+(\S+)\s+(\S+)\s+(?:(\S+)\s+)?(\d+)\s*$/i);
    if (!m) continue;
    const proto = m[1].toUpperCase(), local = m[2], foreign = m[3], state = (m[4] || "").toUpperCase(), pid = m[5];
    const lp = +(local.match(/:(\d+)$/) || [])[1], fp = +(foreign.match(/:(\d+)$/) || [])[1];
    if (proto === "TCP") counts[state] = (counts[state] || 0) + 1;
    if (state === "LISTENING" || (proto === "UDP" && /^(0\.0\.0\.0|\[::\]|\d+\.\d+\.\d+\.\d+):/.test(local) && foreign === "*:*")) listening.push({ proto, addr: local.replace(/:\d+$/, ""), port: lp, pid });
    if (state === "SYN_SENT") synSent.push(`${foreign}${portName(fp) ? ` (${portName(fp)})` : ""}`);
    const svc = portName(state === "LISTENING" || proto === "UDP" ? lp : fp) || portName(lp) || "";
    if (svc || state === "SYN_SENT" || state === "ESTABLISHED") rows.push([proto, local, foreign, state || "—", pid, svc]);
  }
  if (synSent.length) F.push({ sev: "error", text: `SYN_SENT to ${[...new Set(synSent)].join(", ")}: this PC is trying to open a connection and gets no answer at all. The port is blocked by a firewall that drops packets, the device is unreachable, or nothing listens there and the device does not reply with a reset.` });
  if ((counts.CLOSE_WAIT || 0) > 10) F.push({ sev: "warning", text: `${counts.CLOSE_WAIT} connections in CLOSE_WAIT: the remote side closed them but the local application has not. A growing number points to an application fault (connection leak); restarting the application frees them.` });
  if ((counts.TIME_WAIT || 0) > 500) F.push({ sev: "info", text: `${counts.TIME_WAIT} connections in TIME_WAIT: many short connections are being opened and closed (polling clients that reconnect every time).` });
  const exposed = listening.filter((x) => [23, 21, 445, 3389, 135, 5985].includes(x.port) && /^(0\.0\.0\.0|\[::\])$/.test(x.addr));
  for (const x of exposed) F.push({ sev: x.port === 23 || x.port === 21 ? "warning" : "info", text: `${portName(x.port)} is listening on all interfaces (port ${x.port}, PID ${x.pid}). Check the Windows Firewall only allows it from the networks that need it${x.port === 23 || x.port === 21 ? "; this protocol sends passwords in clear text" : ""}.` });
  const scada = listening.filter((x) => [102, 2404, 20000, 502, 4840, 3782, 19998, 4843, 1433].includes(x.port));
  if (scada.length) F.push({ sev: "info", text: `SCADA services listening: ${scada.map((x) => `${portName(x.port)} on ${x.addr}:${x.port} (PID ${x.pid})`).join("; ")}.` });
  const est = rows.filter((r) => r[3] === "ESTABLISHED" && r[5]);
  if (est.length) F.push({ sev: "ok", text: `Established SCADA/engineering connections: ${est.slice(0, 8).map((r) => `${r[2]} ${r[5]}`).join("; ")}${est.length > 8 ? " …" : ""}.` });
  F.push({ sev: "info", text: "Find the program behind a PID with: tasklist /FI \"PID eq <PID>\" (or the Details tab of Task Manager)." });
  return { command: "netstat -ano", title: "Connections and listening ports", summary: `TCP states: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(", ") || "none"}; ${listening.length} listening port(s).`, facts: [], table: { headers: ["Proto", "Local", "Foreign", "State", "PID", "Service"], rows: rows.slice(0, 200) }, findings: F, next: ["A blocked service port shows as SYN_SENT; an actively refused one disappears at once and the client reports error 10061 (look it up in the Error & Event Code Explainer)."] };
}

// ------------------------------------------------------------------ w32tm /query /status
function explainW32tm(text: string): Explained {
  const t = clean(text);
  const g = (re: RegExp) => (t.match(re) || [])[1]?.trim() ?? "";
  const leap = g(/Leap Indicator:\s*(.+)/i), stratum = g(/Stratum:\s*(.+)/i), src = g(/Source:\s*(.+)/i), last = g(/Last Successful Sync Time:\s*(.+)/i);
  const disp = g(/Root Dispersion:\s*([\d.]+)s/i), delay = g(/Root Delay:\s*([\d.]+)s/i), poll = g(/Poll Interval:\s*(.+)/i), refid = g(/ReferenceId:\s*(.+)/i);
  const F: Finding[] = [];
  const facts: Fact[] = [
    { label: "Source", value: src || "—" },
    { label: "Stratum", value: stratum || "—" },
    { label: "Leap indicator", value: leap || "—" },
    { label: "Last successful sync", value: last || "—" },
    { label: "Root delay / dispersion", value: `${delay || "—"} s / ${disp || "—"} s` },
    { label: "Poll interval", value: poll || "—" },
  ];
  if (refid) facts.push({ label: "Reference ID", value: refid });
  if (/0x80070426|service has not been started/i.test(t)) F.push({ sev: "error", text: "The Windows Time service is not running. Start it (net start w32time) and set it to start automatically; without it the clock drifts freely." });
  if (/Local CMOS Clock|Free-running System Clock/i.test(src)) F.push({ sev: "error", text: `Source is "${src}": Windows is not synchronised to any time server. Event time stamps on this computer will drift (typically seconds per day).` });
  if (/^3/.test(leap) || /not synchronized/i.test(leap)) F.push({ sev: "error", text: "Leap indicator 3 (not synchronised): the time service has no valid time source." });
  if (/VM IC Time Synchronization Provider/i.test(src)) F.push({ sev: "warning", text: "The time comes from the virtualisation host (Hyper-V integration services). The host's own clock then decides SCADA and historian time; synchronise the host to the station clock, or disable the host time provider and use NTP." });
  const strat = parseInt(stratum, 10);
  if (strat >= 1 && strat <= 15) F.push({ sev: "info", text: `Stratum ${strat}: ${strat - 1} level(s) between this computer and a reference clock (stratum 1 = the GPS clock itself). Each level adds error.` });
  const d = parseFloat(disp);
  if (Number.isFinite(d) && d > 1) F.push({ sev: "warning", text: `Root dispersion ${d.toFixed(2)} s: Windows' own estimate of its maximum error is above 1 s. Time-stamped events from this computer cannot be compared to the millisecond with IED events.` });
  else if (Number.isFinite(d) && d > 0.1) F.push({ sev: "info", text: `Root dispersion ${(d * 1000).toFixed(0)} ms: adequate for operator displays, not for SOE comparison at millisecond level.` });
  const pm = poll.match(/\((\d+)s\)/);
  if (pm && +pm[1] >= 1024) F.push({ sev: "info", text: `Poll interval ${pm[1]} s: Windows checks the time source about every ${Math.round(+pm[1] / 60)} minutes. For tighter accuracy, reduce MaxPollInterval (for example to 6 = 64 s) on SCADA servers.` });
  if (/\.|^[A-Za-z]/.test(src) && !/CMOS|Free-running|VM IC/i.test(src) && !/^\d+\.\d+\.\d+\.\d+/.test(src)) F.push({ sev: "info", text: `Source ${src} is a name: in a domain this is usually a domain controller (domain hierarchy), so SCADA time depends on the domain controllers being synchronised to the station clock.` });
  if (!F.some((f) => f.sev === "error" || f.sev === "warning")) F.push({ sev: "ok", text: "The time service is synchronised to a source." });
  return { command: "w32tm /query /status", title: "Windows time service", summary: /CMOS|Free-running/i.test(src) ? "Not synchronised to a time server." : `Synchronised to ${src || "an unknown source"}.`, facts, findings: F, next: ["Measure the real offset with w32tm /stripchart against the station clock.", "See the configuration with w32tm /query /configuration and the peers with w32tm /query /peers."] };
}

// ------------------------------------------------------------------ w32tm /stripchart
function explainStripchart(text: string): Explained {
  const F: Finding[] = [];
  const t = clean(text);
  const target = (t.match(/Tracking\s+(\S+)/i) || [])[1] ?? "";
  const offs = [...t.matchAll(/o:([+-]\d+\.\d+)s/gi)].map((m) => +m[1]);
  const dels = [...t.matchAll(/d:([+-]?\d+\.\d+)s/gi)].map((m) => +m[1]);
  const errs = (t.match(/error: 0x[0-9a-f]+/gi) || []).length;
  const facts: Fact[] = target ? [{ label: "Time server", value: target }] : [];
  if (offs.length) {
    const ms = offs.map((o) => o * 1000), avg = ms.reduce((a, b) => a + b, 0) / ms.length, spread = Math.max(...ms) - Math.min(...ms);
    facts.push({ label: "Samples", value: String(offs.length) });
    facts.push({ label: "Offset average / min / max", value: `${avg.toFixed(1)} / ${Math.min(...ms).toFixed(1)} / ${Math.max(...ms).toFixed(1)} ms` });
    if (dels.length) facts.push({ label: "Round-trip delay average", value: `${((dels.reduce((a, b) => a + b, 0) / dels.length) * 1000).toFixed(1)} ms` });
    const a = Math.abs(avg);
    F.push({ sev: a > 1000 ? "error" : a > 100 ? "warning" : a > 10 ? "info" : "ok", text: `This computer is ${a.toFixed(1)} ms ${avg > 0 ? "behind" : "ahead of"} ${target || "the server"} on average. ${a > 1000 ? "More than a second: event order between this computer and the IEDs cannot be trusted." : a > 100 ? "Above 100 ms: too much for an HMI clock in most project specifications." : a > 10 ? "Above 10 ms: acceptable for operator displays, not for comparing SOE records at millisecond level." : "Within 10 ms."} (A negative offset means this computer's clock is ahead. Limits depend on the project specification.)` });
    if (spread > 50) F.push({ sev: "info", text: `Offsets vary by ${spread.toFixed(0)} ms between samples: network delay is variable, so a single reading is not reliable.` });
  }
  if (errs) F.push({ sev: "error", text: `${errs} sample(s) failed (error 0x800705B4 is a time-out): the server did not answer on UDP 123 — it is not an NTP server, the address is wrong, or a firewall blocks NTP.` });
  if (!offs.length && !errs) F.push({ sev: "info", text: "No samples recognised; paste the full stripchart output." });
  return { command: "w32tm /stripchart", title: "Measured time offset", summary: offs.length ? `${offs.length} sample(s) against ${target || "the server"}.` : "No offset samples.", facts, findings: F, next: ["If the offset is large but w32tm /query /status says synchronised, check which source it is synchronised to — it may not be the station clock."] };
}

// ------------------------------------------------------------------ nslookup
function explainNslookup(text: string): Explained {
  const t = clean(text);
  const F: Finding[] = [];
  const server = (t.match(/^Server:\s*(.+)$/im) || [])[1]?.trim() ?? "";
  const saddr = (t.match(/^Address:\s*(\S+)/im) || [])[1] ?? "";
  const name = (t.match(/^Name:\s*(.+)$/im) || [])[1]?.trim() ?? "";
  const addrs = [...t.matchAll(/^(?:Addresses?):\s*(.+)$/gim)].slice(1).map((m) => m[1].trim());
  const facts: Fact[] = [{ label: "DNS server used", value: `${server || "—"} ${saddr ? `(${saddr})` : ""}` }];
  if (name) facts.push({ label: "Name", value: name });
  if (addrs.length) facts.push({ label: "Resolved to", value: addrs.join(", ") });
  if (/Non-existent domain|NXDOMAIN/i.test(t)) F.push({ sev: "error", text: "The DNS server says the name does not exist. Check the spelling and the DNS suffix (short names need the right suffix); the record may simply not exist in this DNS." });
  if (/request timed out|No response from server/i.test(t)) F.push({ sev: "error", text: "The DNS server did not answer: wrong DNS server address on the adapter, DNS server down, or UDP/TCP 53 blocked." });
  if (/Server:\s*UnKnown/i.test(t)) F.push({ sev: "info", text: "\"Server: UnKnown\" only means the DNS server has no reverse (PTR) record for its own address; it does not mean DNS is failing." });
  if (/Non-authoritative answer/i.test(t)) F.push({ sev: "info", text: "Non-authoritative answer: a caching DNS server answered on behalf of the zone's own server. This is normal." });
  if (addrs.length || name) F.push({ sev: "ok", text: "The name resolves." });
  return { command: "nslookup", title: "DNS lookup", summary: addrs.length ? `Resolved through ${server || saddr}.` : "Name not resolved.", facts, findings: F, next: ["Substation devices are usually addressed by IP; a DNS failure matters for domain logon, historians and services configured by name."] };
}

export function explain(text: string, key?: CommandKey | null, target = ""): Explained | null {
  const k = key ?? detect(text);
  switch (k) {
    case "ipconfig": return explainIpconfig(text);
    case "route": return explainRoute(text, target);
    case "arp": return explainArp(text);
    case "ping": return explainPing(text);
    case "tracert": return explainTracert(text);
    case "netstat": return explainNetstat(text);
    case "w32tm": return explainW32tm(text);
    case "stripchart": return explainStripchart(text);
    case "nslookup": return explainNslookup(text);
    default: return null;
  }
}

export { n2ip };
