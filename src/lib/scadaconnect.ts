// SCADA connectivity assistant: can a laptop (or SCADA server) and an IED talk
// over IPv4? Each side decides on its own whether the other is "local" (same
// subnet by ITS OWN mask) or must be reached through ITS OWN default gateway,
// so the check is done from both sides.

import { parseIp, parseMask, subnetOf, inSubnet, ipStr, specialRange, cidr, type SubnetInfo } from "./ipv4";

export type ServiceKey = "none" | "mms" | "iec104" | "dnp3" | "modbus" | "http" | "https" | "ssh";

export const SERVICES: Record<ServiceKey, { label: string; port: string; note: string }> = {
  none: { label: "Only test the network (ping)", port: "—", note: "" },
  mms: { label: "IEC 61850 MMS (client/server)", port: "TCP 102", note: "MMS over TLS (IEC 62351-4) uses TCP 3782." },
  iec104: { label: "IEC 60870-5-104", port: "TCP 2404", note: "IEC 104 over TLS (IEC 62351-3) uses TCP 19998." },
  dnp3: { label: "DNP3 over TCP", port: "TCP 20000", note: "Some outstations listen on UDP 20000 as well." },
  modbus: { label: "Modbus TCP", port: "TCP 502", note: "Modbus/TCP Security uses TCP 802." },
  http: { label: "IED web interface (HTTP)", port: "TCP 80", note: "Many IEDs redirect to HTTPS." },
  https: { label: "IED web interface (HTTPS)", port: "TCP 443", note: "" },
  ssh: { label: "SSH / SFTP (switches, RTUs)", port: "TCP 22", note: "" },
};

export interface EndpointIn {
  ip: string;
  mask: string;
  gateway: string;
}

export interface ScadaConnectInput {
  a: EndpointIn; // laptop / SCADA server
  b: EndpointIn; // IED
  aName: string;
  bName: string;
  service: ServiceKey;
}

export const DEFAULT_SCADA_CONNECT_INPUT: ScadaConnectInput = {
  aName: "Laptop",
  bName: "IED",
  a: { ip: "192.168.1.10", mask: "255.255.255.0", gateway: "" },
  b: { ip: "10.13.0.14", mask: "255.255.255.128", gateway: "10.13.0.1" },
  service: "mms",
};

export type Verdict = "direct" | "routed" | "one-way" | "no";
export type Severity = "error" | "warning" | "info" | "ok";

export interface Finding {
  sev: Severity;
  text: string;
}

export interface EndpointView {
  ip: number;
  prefix: number;
  subnet: SubnetInfo;
  gateway: number | null;
}

export interface ScadaConnectResult {
  valid: boolean;
  verdict: Verdict | null;
  headline: string;
  a: EndpointView | null;
  b: EndpointView | null;
  aSeesB: "local" | "gateway" | "no-route" | null; // how A sends to B
  bSeesA: "local" | "gateway" | "no-route" | null;
  findings: Finding[];
  fixes: string[];
  suggestion: { ip: string; mask: string } | null;
}

function endpoint(e: EndpointIn, name: string, f: Finding[]): EndpointView | null {
  const ip = parseIp(e.ip), prefix = parseMask(e.mask);
  let ok = true;
  if (ip == null) { f.push({ sev: "error", text: `${name}: "${e.ip}" is not a valid IPv4 address.` }); ok = false; }
  if (prefix == null) { f.push({ sev: "error", text: `${name}: "${e.mask}" is not a valid subnet mask (use 255.255.255.0 or /24; the 1-bits must be continuous).` }); ok = false; }
  let gateway: number | null = null;
  if (e.gateway.trim()) {
    gateway = parseIp(e.gateway);
    if (gateway == null) { f.push({ sev: "error", text: `${name}: gateway "${e.gateway}" is not a valid IPv4 address.` }); ok = false; }
  }
  if (!ok || ip == null || prefix == null) return null;
  return { ip, prefix, subnet: subnetOf(ip, prefix), gateway };
}

function checkEndpoint(v: EndpointView, name: string, f: Finding[]): boolean {
  let ok = true;
  const sp = specialRange(v.ip);
  if (sp) { f.push({ sev: "error", text: `${name} ${ipStr(v.ip)}: ${sp}.` }); ok = false; }
  if (v.prefix <= 30 && v.ip === v.subnet.network) { f.push({ sev: "error", text: `${name} ${ipStr(v.ip)} is the network address of ${cidr(v.subnet)} — it cannot be given to a device.` }); ok = false; }
  if (v.prefix <= 30 && v.ip === v.subnet.broadcast) { f.push({ sev: "error", text: `${name} ${ipStr(v.ip)} is the broadcast address of ${cidr(v.subnet)} — it cannot be given to a device.` }); ok = false; }
  if (v.prefix < 8) f.push({ sev: "warning", text: `${name}: mask /${v.prefix} is unusually wide — check it is not a typing error.` });
  if (v.gateway != null) {
    if (v.gateway === v.ip) { f.push({ sev: "error", text: `${name}: the gateway is the device's own address.` }); v.gateway = null; }
    else if (!inSubnet(v.gateway, v.subnet)) { f.push({ sev: "error", text: `${name}: gateway ${ipStr(v.gateway)} is outside its own subnet ${cidr(v.subnet)}, so it can never be reached. Windows ignores such a gateway; most IEDs reject it or cannot route.` }); v.gateway = null; }
    else if (v.prefix <= 30 && (v.gateway === v.subnet.network || v.gateway === v.subnet.broadcast)) { f.push({ sev: "error", text: `${name}: gateway ${ipStr(v.gateway)} is the network or broadcast address of the subnet.` }); v.gateway = null; }
  }
  return ok;
}

export function calcScadaConnect(input: ScadaConnectInput): ScadaConnectResult {
  const f: Finding[] = [], fixes: string[] = [];
  const A = input.aName || "Laptop", B = input.bName || "IED";
  const a = endpoint(input.a, A, f), b = endpoint(input.b, B, f);
  const empty: ScadaConnectResult = { valid: false, verdict: null, headline: "Enter both addresses and masks.", a, b, aSeesB: null, bSeesA: null, findings: f, fixes, suggestion: null };
  if (!a || !b) return empty;
  const okA = checkEndpoint(a, A, f), okB = checkEndpoint(b, B, f);
  if (a.ip === b.ip) {
    f.push({ sev: "error", text: `${A} and ${B} have the same address ${ipStr(a.ip)}. Two devices with one address conflict; Windows usually disables its address when it detects the clash.` });
    fixes.push(`Give ${A} a different, unused address in ${B}'s subnet.`);
    return { ...empty, valid: true, verdict: "no", headline: "Cannot talk — duplicate IP address", findings: f, fixes };
  }
  const how = (src: EndpointView, dst: number): "local" | "gateway" | "no-route" => (inSubnet(dst, src.subnet) ? "local" : src.gateway != null ? "gateway" : "no-route");
  const ab = how(a, b.ip), ba = how(b, a.ip);
  if (a.prefix !== b.prefix && ab === "local" && ba === "local") f.push({ sev: "warning", text: `The masks differ (/${a.prefix} and /${b.prefix}). They can still talk, because each sees the other inside its own subnet, but keep the masks equal on one LAN so that other devices behave the same way.` });
  let verdict: Verdict, headline: string;
  if (!okA || !okB) {
    verdict = "no"; headline = "Cannot talk — an address is not usable";
  } else if (ab === "local" && ba === "local") {
    verdict = "direct"; headline = `Can talk directly — both are in the same subnet`;
    f.push({ sev: "ok", text: `${A} sees ${ipStr(b.ip)} inside its own subnet ${cidr(a.subnet)}, and ${B} sees ${ipStr(a.ip)} inside ${cidr(b.subnet)}. Frames go directly over the LAN (ARP, no router).` });
  } else if (ab === "local" || ba === "local") {
    const [loc, rem, remName, locName] = ab === "local" ? [a, b, B, A] : [b, a, A, B];
    const back = ab === "local" ? ba : ab;
    verdict = "one-way";
    headline = "Mask mismatch — the two sides disagree about the subnet";
    f.push({ sev: "error", text: `${locName} (${cidr(loc.subnet)}) thinks ${remName} is on the same LAN and sends to it directly, but ${remName} (${cidr(rem.subnet)}) thinks ${locName} is on another network and ${back === "gateway" ? `sends its replies to its gateway ${ipStr(rem.gateway!)}` : "has no gateway to send its replies to"}. ${back === "gateway" ? "Replies only arrive if that router sends them back onto the same LAN — usually they are lost." : "Replies are never sent."}` });
    fixes.push(`Use the same mask on both: ${remName} on /${rem.prefix} needs ${locName}'s address inside ${cidr(rem.subnet)}, or both on /${loc.prefix}.`);
  } else {
    if (ab === "gateway" && ba === "gateway") {
      verdict = "routed"; headline = "Different subnets — can talk only through a router";
      f.push({ sev: "warning", text: `${A} (${cidr(a.subnet)}) and ${B} (${cidr(b.subnet)}) are on different subnets. ${A} sends via its gateway ${ipStr(a.gateway!)}, ${B} replies via ${ipStr(b.gateway!)}. This works only if a router or layer-3 switch connects the two subnets and every firewall on the way allows the traffic.` });
      fixes.push(`For a direct maintenance connection, put ${A} in ${B}'s subnet instead (see the suggested address).`);
    } else {
      verdict = "no"; headline = "Cannot talk — different subnets and no route";
      if (ab === "no-route") f.push({ sev: "error", text: `${A} (${cidr(a.subnet)}) has no gateway, so it cannot send to ${ipStr(b.ip)}, which is outside its subnet.` });
      if (ba === "no-route") f.push({ sev: "error", text: `${B} (${cidr(b.subnet)}) has no gateway, so it cannot reply to ${ipStr(a.ip)}, which is outside its subnet.` });
      fixes.push(`Put ${A} in ${B}'s subnet ${cidr(b.subnet)} with mask ${ipStr(b.subnet.mask)} (see the suggested address), or configure gateways and a router between the subnets.`);
    }
  }
  // suggested laptop address in the IED's subnet (an unused address near the top of the range)
  let suggestion: ScadaConnectResult["suggestion"] = null;
  if (verdict !== "direct" && okB && b.prefix <= 30) {
    for (let cand = b.subnet.lastHost - 9; cand >= b.subnet.firstHost; cand--) {
      if (cand !== b.ip && cand !== b.gateway) { suggestion = { ip: ipStr(cand), mask: ipStr(b.subnet.mask) }; break; }
    }
    if (suggestion) fixes.push(`Suggested ${A} setting: IP ${suggestion.ip}, mask ${suggestion.mask}, no gateway needed for a direct link — check first that ${suggestion.ip} is not used by another device.`);
  }
  if (verdict === "direct" || verdict === "routed") {
    const s = SERVICES[input.service];
    if (input.service !== "none") f.push({ sev: "info", text: `Next: the network allows it, so test the service — ${s.label} on ${s.port}. If ping works but the service does not, check the IED's service is enabled, the number of client connections it allows, and any firewall (Windows firewall included) blocking ${s.port}.${s.note ? " " + s.note : ""}` });
    else f.push({ sev: "info", text: "Next: ping the device. If ping fails although the addressing is right, check the cable or port, the VLAN of the switch port, and whether the device answers ping at all (some IEDs do not)." });
  }
  return { valid: true, verdict, headline, a, b, aSeesB: ab, bSeesA: ba, findings: f, fixes, suggestion };
}
