// IP register consistency checker: reads an address register (CSV / TSV /
// semicolon, pasted or from Excel) and flags duplicates, overlapping subnets,
// wrong gateways and masks, and unusable addresses.

import { parseIp, parseMask, subnetOf, inSubnet, ipStr, specialRange, cidr, type SubnetInfo } from "./ipv4";

export type Sev = "error" | "warning" | "info";

export interface RegRow {
  line: number; // line number in the input (1 = header)
  name: string;
  ipText: string;
  maskText: string;
  gwText: string;
  mac: string;
  vlan: string;
  network: string;
  ip: number | null;
  prefix: number | null;
  gw: number | null;
  subnet: SubnetInfo | null;
}

export interface RegFinding {
  sev: Sev;
  code: string;
  lines: number[];
  text: string;
}

export interface RegSubnet {
  cidr: string;
  subnet: SubnetInfo;
  devices: number;
  vlans: string[];
  gateways: string[];
  networks: string[];
}

export interface RegResult {
  rows: RegRow[];
  columns: Record<string, number>;
  header: string[];
  findings: RegFinding[];
  subnets: RegSubnet[];
  counts: Record<Sev, number>;
}

export const SAMPLE_REGISTER = `Device,IP address,Subnet mask,Gateway,MAC address,VLAN,Network
GW1,10.13.0.11,255.255.255.128,10.13.0.1,00-21-C1-11-00-01,1,Station bus
HMI1,10.13.0.12,255.255.255.128,10.13.0.1,00-21-C1-11-00-02,1,Station bus
GPS1,10.13.0.13,255.255.255.128,10.13.0.1,00-21-C1-11-00-03,1,Station bus
P132_Q01,10.13.0.14,255.255.255.128,10.13.0.1,00-21-C1-11-00-04,1,Station bus
P132_Q02,10.13.0.15,255.255.255.128,10.13.0.1,00-21-C1-11-00-05,1,Station bus
P87T_T1,10.13.0.14,255.255.255.128,10.13.0.1,00-21-C1-11-00-06,1,Station bus
BCU_J01,10.13.0.17,255.255.255.0,10.13.0.1,00-21-C1-11-00-07,1,Station bus
BCU_J02,10.13.0.18,255.255.255.128,10.13.1.1,00-21-C1-11-00-08,1,Station bus
BCU_J03,10.13.0.127,255.255.255.128,10.13.0.1,00-21-C1-11-00-09,1,Station bus
MU_Q01,10.13.0.140,255.255.255.192,,00-21-C1-11-00-0A,20,Process bus
MU_T1,10.13.0.141,255.255.255.192,,00-21-C1-11-00-0A,20,Process bus
SW1,10.13.0.194,255.255.255.224,10.13.0.193,00-21-C1-22-00-01,99,Management
SW2,10.13.0.195,255.255.255.224,10.13.0.193,00-21-C1-22-00-02,99,Management
ENG-PC,10.13.0.200,255.255.255.192,10.13.0.193,00-21-C1-33-00-01,99,Management
GW1-DMZ,10.13.1.11,255.255.255.240,10.13.1.1,00-21-C1-11-00-0B,30,SCADA DMZ
LAPTOP,169.254.10.5,255.255.0.0,,00-21-C1-44-00-01,1,Station bus`;

const COLS: [string, RegExp][] = [
  ["name", /^(device|name|host ?name|ied|equipment|tag)/i],
  ["ip", /^(ip|ip ?address|ipv4|address)$/i],
  ["mask", /^(mask|subnet ?mask|netmask|prefix)/i],
  ["gw", /^(gw|gateway|default ?gateway)/i],
  ["mac", /^mac/i],
  ["vlan", /^vlan/i],
  ["network", /^(network|segment|lan|subnet name|zone)/i],
];

function splitLine(line: string, d: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
    else if (c === d && !q) { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

export function parseRegister(text: string): { header: string[]; columns: Record<string, number>; rows: RegRow[] } {
  const lines = String(text || "").replace(/^﻿/, "").split(/\r?\n/);
  const first = lines.find((l) => l.trim()) || "";
  const d = ["\t", ";", ","].sort((x, y) => first.split(y).length - first.split(x).length)[0];
  const hi = lines.indexOf(first);
  const header = splitLine(first, d);
  const columns: Record<string, number> = {};
  for (const [k, re] of COLS) {
    const i = header.findIndex((h, j) => re.test(h) && !Object.values(columns).includes(j));
    if (i >= 0) columns[k] = i;
  }
  const rows: RegRow[] = [];
  for (let n = hi + 1; n < lines.length; n++) {
    if (!lines[n].trim()) continue;
    const c = splitLine(lines[n], d), g = (k: string) => (columns[k] != null ? c[columns[k]] ?? "" : "");
    let ipText = g("ip"), maskText = g("mask");
    const slash = ipText.match(/^(.+)\/(\d{1,2})$/);
    if (slash) { ipText = slash[1]; if (!maskText) maskText = slash[2]; }
    const ip = parseIp(ipText), prefix = maskText ? parseMask(maskText) : null, gw = g("gw") ? parseIp(g("gw")) : null;
    rows.push({ line: n + 1, name: g("name") || `(line ${n + 1})`, ipText, maskText, gwText: g("gw"), mac: g("mac"), vlan: g("vlan"), network: g("network"), ip, prefix, gw, subnet: ip != null && prefix != null ? subnetOf(ip, prefix) : null });
  }
  return { header, columns, rows };
}

const normMac = (m: string) => m.replace(/[^0-9a-f]/gi, "").toUpperCase();

export function checkRegister(text: string): RegResult {
  const { header, columns, rows } = parseRegister(text);
  const F: RegFinding[] = [];
  const add = (sev: Sev, code: string, lines: number[], t: string) => F.push({ sev, code, lines, text: t });
  if (columns.ip == null) add("error", "COL", [1], `No IP address column found. Name a column "IP address" (columns found: ${header.join(", ") || "none"}).`);
  if (columns.mask == null) add("warning", "COL", [1], `No subnet mask column found — mask, gateway and subnet checks are skipped. Name a column "Subnet mask" or write addresses as 10.13.0.14/25.`);

  for (const r of rows) {
    if (!r.ipText) { add("warning", "IP-EMPTY", [r.line], `${r.name}: no IP address.`); continue; }
    if (r.ip == null) { add("error", "IP-FORMAT", [r.line], `${r.name}: "${r.ipText}" is not a valid IPv4 address.`); continue; }
    if (r.maskText && r.prefix == null) add("error", "MASK-FORMAT", [r.line], `${r.name}: "${r.maskText}" is not a valid subnet mask (the 1-bits must be continuous).`);
    const sp = specialRange(r.ip);
    if (sp) add("error", "IP-SPECIAL", [r.line], `${r.name} ${r.ipText}: ${sp}.`);
    if (r.subnet && r.prefix! <= 30 && (r.ip === r.subnet.network || r.ip === r.subnet.broadcast)) add("error", "IP-NETBC", [r.line], `${r.name} ${r.ipText} is the ${r.ip === r.subnet.network ? "network" : "broadcast"} address of ${cidr(r.subnet)} and cannot be assigned to a device.`);
    if (r.gwText) {
      if (r.gw == null) add("error", "GW-FORMAT", [r.line], `${r.name}: gateway "${r.gwText}" is not a valid IPv4 address.`);
      else if (r.subnet) {
        if (r.gw === r.ip) add("error", "GW-SELF", [r.line], `${r.name}: the gateway is the device's own address.`);
        else if (!inSubnet(r.gw, r.subnet)) add("error", "GW-OUTSIDE", [r.line], `${r.name}: gateway ${r.gwText} is outside the device's subnet ${cidr(r.subnet)} and can never be reached.`);
      }
    }
    if (r.mac && normMac(r.mac).length !== 12) add("error", "MAC-FORMAT", [r.line], `${r.name}: "${r.mac}" is not a valid MAC address.`);
    else if (r.mac && parseInt(normMac(r.mac).slice(0, 2), 16) & 1) add("error", "MAC-MULTI", [r.line], `${r.name}: ${r.mac} is a multicast MAC address and cannot belong to a device interface.`);
  }

  const dup = (key: (r: RegRow) => string | null, sev: Sev, code: string, what: string) => {
    const m = new Map<string, RegRow[]>();
    for (const r of rows) { const k = key(r); if (k) m.set(k, [...(m.get(k) || []), r]); }
    for (const [k, rs] of m) if (rs.length > 1) add(sev, code, rs.map((r) => r.line), `${what} ${k} is used ${rs.length} times: ${rs.map((r) => r.name).join(", ")}.`);
  };
  dup((r) => (r.ip != null ? ipStr(r.ip) : null), "error", "DUP-IP", "IP address");
  dup((r) => (r.mac ? normMac(r.mac).replace(/(..)(?!$)/g, "$1-") : null), "error", "DUP-MAC", "MAC address");
  dup((r) => (r.name && !/^\(line/.test(r.name) ? r.name.toUpperCase() : null), "warning", "DUP-NAME", "Device name");

  // group devices by VLAN (or network name) and compare masks and gateways
  const groups = new Map<string, RegRow[]>();
  for (const r of rows) { const k = r.vlan ? `VLAN ${r.vlan}` : r.network ? r.network : ""; if (k && r.ip != null) groups.set(k, [...(groups.get(k) || []), r]); }
  for (const [g, rs] of groups) {
    const masks = new Map<number, RegRow[]>();
    for (const r of rs) if (r.prefix != null) masks.set(r.prefix, [...(masks.get(r.prefix) || []), r]);
    if (masks.size > 1) {
      const common = [...masks.entries()].sort((a, b) => b[1].length - a[1].length)[0][0];
      const odd = rs.filter((r) => r.prefix != null && r.prefix !== common);
      add("warning", "MASK-MIX", odd.map((r) => r.line), `${g}: most devices use /${common}, but ${odd.map((r) => `${r.name} uses /${r.prefix}`).join(", ")}. Devices on one LAN must use the same mask, or some will not reach others.`);
    }
    const gws = new Map<string, RegRow[]>();
    for (const r of rs) if (r.gw != null) gws.set(ipStr(r.gw), [...(gws.get(ipStr(r.gw)) || []), r]);
    if (gws.size > 1) {
      const common = [...gws.entries()].sort((a, b) => b[1].length - a[1].length)[0][0];
      const odd = rs.filter((r) => r.gw != null && ipStr(r.gw) !== common);
      add("warning", "GW-MIX", odd.map((r) => r.line), `${g}: most devices use gateway ${common}, but ${odd.map((r) => `${r.name} uses ${ipStr(r.gw!)}`).join(", ")}.`);
    }
  }

  // subnets: overlaps and VLAN sharing
  const sn = new Map<string, RegSubnet>();
  for (const r of rows) if (r.subnet) {
    const k = cidr(r.subnet);
    const s = sn.get(k) || { cidr: k, subnet: r.subnet, devices: 0, vlans: [], gateways: [], networks: [] };
    s.devices++;
    if (r.vlan && !s.vlans.includes(r.vlan)) s.vlans.push(r.vlan);
    if (r.gw != null && !s.gateways.includes(ipStr(r.gw))) s.gateways.push(ipStr(r.gw));
    if (r.network && !s.networks.includes(r.network)) s.networks.push(r.network);
    sn.set(k, s);
  }
  const subs = [...sn.values()].sort((a, b) => a.subnet.network - b.subnet.network || a.subnet.prefix - b.subnet.prefix);
  // overlapping subnets, reported once per wider subnet with everything it overlaps
  const over = new Map<string, Set<string>>();
  for (let i = 0; i < subs.length; i++) for (let j = i + 1; j < subs.length; j++) {
    const a = subs[i], b = subs[j];
    if (a.subnet.network <= b.subnet.broadcast && b.subnet.network <= a.subnet.broadcast) {
      const [wide, narrow] = a.subnet.prefix <= b.subnet.prefix ? [a, b] : [b, a];
      over.set(wide.cidr, new Set([...(over.get(wide.cidr) || []), narrow.cidr]));
    }
  }
  for (const [w, set] of over) {
    const who = rows.filter((r) => r.subnet && cidr(r.subnet) === w);
    const lines = rows.filter((r) => r.subnet && (cidr(r.subnet) === w || set.has(cidr(r.subnet)))).map((r) => r.line);
    add("error", "SUBNET-OVERLAP", lines, `Subnet ${w} (${who.map((r) => r.name).join(", ")}) overlaps ${[...set].join(", ")}. Devices in the overlapping range disagree about which addresses are local — usually the device${who.length > 1 ? "s" : ""} on ${w} ${who.length > 1 ? "have" : "has"} the wrong mask.`);
  }
  for (const s of subs) if (s.vlans.length > 1) add("warning", "SUBNET-VLANS", rows.filter((r) => r.subnet && cidr(r.subnet) === s.cidr).map((r) => r.line), `Subnet ${s.cidr} appears in VLANs ${s.vlans.join(", ")}. One subnet should normally belong to one VLAN.`);
  const vlanSubnets = new Map<string, Set<string>>();
  for (const s of subs) for (const v of s.vlans) vlanSubnets.set(v, new Set([...(vlanSubnets.get(v) || []), s.cidr]));
  for (const [v, set] of vlanSubnets) if (set.size > 1) add("info", "VLAN-SUBNETS", [], `VLAN ${v} carries ${set.size} subnets (${[...set].join(", ")}). This works, but devices in different subnets need a router to talk.`);

  const rank: Record<Sev, number> = { error: 0, warning: 1, info: 2 };
  F.sort((a, b) => rank[a.sev] - rank[b.sev] || (a.lines[0] ?? 0) - (b.lines[0] ?? 0));
  const counts: Record<Sev, number> = { error: 0, warning: 0, info: 0 };
  F.forEach((f) => counts[f.sev]++);
  return { rows, columns, header, findings: F, subnets: subs, counts };
}
