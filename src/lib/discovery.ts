// Discovery result checker: compares what a network scan found (nmap XML,
// grepable or normal output, an ARP table or a plain IP list) with the
// approved IP / asset register: unknown devices, missing devices, MAC address
// mismatches and open ports that are not approved.

import { parseTable } from "./changecompare";

export interface ScanPort {
  port: number;
  proto: string;
  service: string;
  state: string;
}
export interface ScanHost {
  ip: string;
  mac: string;
  vendor: string;
  name: string;
  ports: ScanPort[];
}
export interface ScanResult {
  format: string;
  hosts: ScanHost[];
  scope: string[]; // scanned targets, when the file says so
}
export interface RegEntry {
  name: string;
  ips: string[];
  mac: string;
  type: string;
}
export interface PortRule {
  pattern: string;
  ports: { port: number; proto: string }[];
}
export type Sev = "error" | "warning" | "info" | "ok";
export interface DiscFinding {
  sev: Sev;
  code: string;
  ip: string;
  text: string;
}
export interface DiscRow {
  ip: string;
  status: "matched" | "unknown" | "missing" | "mac-mismatch";
  regName: string;
  scanName: string;
  regMac: string;
  scanMac: string;
  vendor: string;
  open: string;
  unapproved: string;
}
export interface DiscResult {
  rows: DiscRow[];
  findings: DiscFinding[];
  counts: { scanned: number; registered: number; matched: number; unknown: number; missing: number; macMismatch: number; unapproved: number };
  scope: string[];
}

export const normMac = (s: string): string => {
  const h = String(s || "").replace(/[^0-9a-f]/gi, "");
  return h.length === 12 ? h.toUpperCase().match(/../g)!.join("-") : "";
};
const isIp = (s: string) => /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split(".").every((x) => +x <= 255);
const ipNum = (s: string) => s.split(".").reduce((n, x) => n * 256 + +x, 0);
const attr = (tag: string, n: string) => (tag.match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1] ?? "";

/* ---------------------------------------------------------------- scan input */
export function parseScan(text: string): ScanResult {
  const t = String(text || "").replace(/^﻿/, "");
  const hosts: ScanHost[] = [];
  const get = (ip: string) => {
    let h = hosts.find((x) => x.ip === ip);
    if (!h) hosts.push((h = { ip, mac: "", vendor: "", name: "", ports: [] }));
    return h;
  };
  if (/<nmaprun\b/.test(t)) {
    const args = attr((t.match(/<nmaprun\b[^>]*>/) || [""])[0], "args");
    const scope = args.split(/\s+/).filter((x) => /^\d+\.\d+\.\d+\.\d+(\/\d+|-\d+)?$/.test(x));
    for (const blk of t.match(/<host\b[\s\S]*?<\/host>/g) || []) {
      if (/<status\b[^>]*state="down"/.test(blk)) continue;
      let ip = "", mac = "", vendor = "";
      for (const a of blk.match(/<address\b[^>]*>/g) || []) {
        const ty = attr(a, "addrtype");
        if (ty === "ipv4") ip = attr(a, "addr");
        if (ty === "mac") { mac = normMac(attr(a, "addr")); vendor = attr(a, "vendor"); }
      }
      if (!ip) continue;
      const h = get(ip);
      h.mac = mac; h.vendor = vendor;
      h.name = attr((blk.match(/<hostname\b[^>]*>/) || [""])[0], "name");
      for (const p of blk.match(/<port\b[\s\S]*?<\/port>/g) || []) {
        const st = attr((p.match(/<state\b[^>]*>/) || [""])[0], "state");
        h.ports.push({ port: +attr(p, "portid"), proto: attr(p, "protocol") || "tcp", service: attr((p.match(/<service\b[^>]*>/) || [""])[0], "name"), state: st });
      }
    }
    return { format: "nmap XML (-oX)", hosts, scope };
  }
  if (/^Host:\s+\d/m.test(t)) {
    for (const l of t.split(/\r?\n/)) {
      const m = l.match(/^Host:\s+(\S+)\s+\(([^)]*)\)\s*(.*)$/);
      if (!m || !isIp(m[1])) continue;
      const h = get(m[1]);
      if (m[2]) h.name = m[2];
      const pm = m[3].match(/Ports:\s*(.*?)(?:\t|$)/);
      if (pm) for (const x of pm[1].split(/,\s*/)) {
        const f = x.split("/");
        if (f.length >= 5 && /^\d+$/.test(f[0])) h.ports.push({ port: +f[0], state: f[1], proto: f[2], service: f[4] });
      }
    }
    return { format: "nmap grepable (-oG)", hosts, scope: [] };
  }
  if (/Nmap scan report for/i.test(t)) {
    let cur: ScanHost | null = null;
    for (const l of t.split(/\r?\n/)) {
      let m = l.match(/Nmap scan report for (?:(\S+) \((\d+\.\d+\.\d+\.\d+)\)|(\d+\.\d+\.\d+\.\d+))/i);
      if (m) { cur = get(m[2] || m[3]); if (m[1]) cur.name = m[1]; continue; }
      if (!cur) continue;
      if ((m = l.match(/^(\d+)\/(tcp|udp)\s+(\S+)\s+(\S+)?/i))) cur.ports.push({ port: +m[1], proto: m[2].toLowerCase(), state: m[3], service: m[4] || "" });
      else if ((m = l.match(/MAC Address:\s*(\S+)\s*(?:\((.*)\))?/i))) { cur.mac = normMac(m[1]); cur.vendor = m[2] || ""; }
    }
    return { format: "nmap normal output", hosts, scope: [] };
  }
  const first = t.split(/\r?\n/)[0] || "";
  if (/[,;\t]/.test(first) && /ip/i.test(first) && !isIp(first.split(/[,;\t]/)[0].trim())) {
    const { headers, rows } = parseTable(t);
    const ci = headers.findIndex((h) => /\bip\b|^ip|ip ?addr/i.test(h)), cm = headers.findIndex((h) => /mac/i.test(h)), cn = headers.findIndex((h) => /^(name|host|hostname|device|dns)/i.test(h)), cp = headers.findIndex((h) => /ports?|open/i.test(h));
    for (const r of rows) {
      const ip = String(r[ci] ?? "").trim();
      if (!isIp(ip)) continue;
      const h = get(ip);
      if (cm >= 0) h.mac = normMac(r[cm]);
      if (cn >= 0) h.name = String(r[cn] ?? "").trim();
      if (cp >= 0) for (const x of String(r[cp] ?? "").split(/[\s,;]+/)) { const m = x.match(/^(\d+)(?:\/(tcp|udp))?$/i); if (m) h.ports.push({ port: +m[1], proto: (m[2] || "tcp").toLowerCase(), state: "open", service: "" }); }
    }
    return { format: "CSV list", hosts, scope: [] };
  }
  // ARP table (Windows arp -a, Linux ip neigh / arp -n) or a plain list of addresses
  for (const l of t.split(/\r?\n/)) {
    const ip = (l.match(/\b(\d{1,3}(?:\.\d{1,3}){3})\b/) || [])[1];
    if (!ip || !isIp(ip) || /^Interface:/i.test(l.trim()) || /\b(incomplete|FAILED)\b/i.test(l)) continue;
    const mac = (l.match(/\b((?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2})\b/i) || [])[1];
    if (mac && /^ff[-:]ff[-:]ff/i.test(mac)) continue;
    if (/^(224|239|255)\./.test(ip) || /\.255$/.test(ip)) continue;
    const h = get(ip);
    if (mac) h.mac = normMac(mac);
  }
  return { format: /dynamic|static|lladdr/i.test(t) ? "ARP table" : "IP list", hosts, scope: [] };
}

/* ---------------------------------------------------------------- register input */
export function parseRegister(text: string): RegEntry[] {
  const t = String(text || "").replace(/^﻿/, "").trim();
  if (t.startsWith("{")) {
    const j = JSON.parse(t);
    if (!Array.isArray(j.ieds)) throw new Error("Not an SCL NetStudio project.");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return [
      ...j.ieds.map((i: any) => ({ name: i.name, ips: [...new Set(Object.values(i.ips || {}).filter(Boolean) as string[])], mac: normMac(i.asset?.mac), type: i.role || "device" })),
      ...(j.switches || []).map((w: any) => ({ name: w.name, ips: w.ip ? [w.ip] : [], mac: normMac(w.asset?.mac), type: "switch" })),
    ];
  }
  const { headers, rows } = parseTable(t);
  const cn = headers.findIndex((h) => /^(tag|device|name|host|asset|equipment)/i.test(h.trim()));
  const ci = headers.findIndex((h) => /\bip\b|^ip|ip ?addr/i.test(h) && !/mask|gateway/i.test(h));
  const cm = headers.findIndex((h) => /mac/i.test(h));
  const ct = headers.findIndex((h) => /type|role|kind/i.test(h));
  if (ci < 0) throw new Error(`No IP address column found (columns: ${headers.join(", ")}).`);
  const out: RegEntry[] = [];
  for (const r of rows) {
    const ips = String(r[ci] ?? "").split(/[\s,;]+/).filter(isIp);
    const name = String(r[cn >= 0 ? cn : 0] ?? "").trim();
    if (!ips.length && !name) continue;
    const ex = out.find((e) => e.name && e.name === name);
    if (ex) { ex.ips = [...new Set([...ex.ips, ...ips])]; continue; } // an IP register lists one row per address
    out.push({ name, ips, mac: cm >= 0 ? normMac(r[cm]) : "", type: ct >= 0 ? String(r[ct] ?? "") : "" });
  }
  return out;
}

/* ---------------------------------------------------------------- approved services */
export const DEFAULT_RULES = `# Approved services: device name or IP (* and ? as wildcards), then the ports.
# Write the protocol when it matters: 161/udp. Lines are additive.
*: 102/tcp
GW*: 2404/tcp, 22/tcp, 443/tcp
HMI*: 3389/tcp
GPS*: 443/tcp, 123/udp, 161/udp
SW*: 22/tcp, 443/tcp, 161/udp`;

export function parseRules(text: string): PortRule[] {
  const out: PortRule[] = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const l = raw.replace(/#.*/, "").trim();
    const m = l.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const ports = m[2].split(/[\s,;]+/).map((x) => x.match(/^(\d+)(?:\/(tcp|udp))?$/i)).filter(Boolean).map((x) => ({ port: +x![1], proto: (x![2] || "any").toLowerCase() }));
    out.push({ pattern: m[1].trim(), ports });
  }
  return out;
}
const glob = (p: string, s: string) => new RegExp("^" + p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", "i").test(s);

/** Clear-text or high-risk services worth calling out even when approved. */
export const RISKY: Record<number, string> = {
  21: "FTP (clear-text logins and files)", 23: "Telnet (clear-text logins)", 69: "TFTP (no authentication)", 80: "HTTP (clear-text web interface)",
  139: "NetBIOS session", 445: "SMB file sharing", 512: "rexec", 513: "rlogin", 514: "rsh / syslog", 1900: "UPnP / SSDP", 5900: "VNC remote desktop",
  8080: "HTTP alternative (clear text)", 161: "SNMP (v1/v2c communities are clear text)",
};

const inScope = (ip: string, scope: string[]) => {
  if (!scope.length) return true;
  const n = ipNum(ip);
  return scope.some((s) => {
    const c = s.match(/^(\d+\.\d+\.\d+\.\d+)\/(\d+)$/);
    if (c) { const size = 2 ** (32 - +c[2]); const base = Math.floor(ipNum(c[1]) / size) * size; return n >= base && n < base + size; }
    const r = s.match(/^(\d+\.\d+\.\d+)\.(\d+)-(\d+)$/);
    if (r) { const p = ip.split("."); return p.slice(0, 3).join(".") === r[1] && +p[3] >= +r[2] && +p[3] <= +r[3]; }
    return isIp(s) && s === ip;
  });
};

/* ---------------------------------------------------------------- comparison */
export function checkDiscovery(scan: ScanResult, reg: RegEntry[], rules: PortRule[], scopeText = ""): DiscResult {
  const scope = scopeText.trim() ? scopeText.split(/[\s,;]+/).filter(Boolean) : scan.scope.length ? scan.scope : [...new Set(scan.hosts.map((h) => h.ip.split(".").slice(0, 3).join(".") + ".0/24"))];
  const byIp = new Map<string, RegEntry>();
  for (const e of reg) for (const ip of e.ips) byIp.set(ip, e);
  const byMac = new Map<string, RegEntry>();
  for (const e of reg) if (e.mac) byMac.set(e.mac, e);
  const F: DiscFinding[] = [], rows: DiscRow[] = [];
  const add = (sev: Sev, code: string, ip: string, text: string) => F.push({ sev, code, ip, text });
  let unapprovedN = 0;
  const macSeen = new Map<string, string[]>();
  for (const h of [...scan.hosts].sort((a, b) => ipNum(a.ip) - ipNum(b.ip))) {
    const e = byIp.get(h.ip);
    if (h.mac) macSeen.set(h.mac, [...(macSeen.get(h.mac) ?? []), h.ip]);
    const open = h.ports.filter((p) => /open/.test(p.state) && !/filtered/.test(p.state));
    const label = e?.name || h.name || h.ip;
    const okPorts = rules.filter((r) => glob(r.pattern, h.ip) || (e && glob(r.pattern, e.name))).flatMap((r) => r.ports);
    const notOk = open.filter((p) => !okPorts.some((q) => q.port === p.port && (q.proto === "any" || q.proto === p.proto)));
    let status: DiscRow["status"] = "matched";
    if (!e) {
      status = "unknown";
      const owner = h.mac ? byMac.get(h.mac) : undefined;
      add(owner ? "error" : "warning", owner ? "MOVED" : "UNKNOWN", h.ip, owner
        ? `${h.ip}: not in the register, but its MAC ${h.mac} belongs to ${owner.name} (registered at ${owner.ips.join(", ") || "no address"}). The device has a different IP address from the design.`
        : `${h.ip}${h.name ? ` (${h.name})` : ""}${h.vendor ? `, ${h.vendor}` : ""}: unknown device — not in the register. Identify it (laptop, test set, a device added without record) and register or remove it.${open.length ? ` Open: ${open.map((p) => p.port + "/" + p.proto).join(", ")}.` : ""}`);
    } else if (e.mac && h.mac && e.mac !== h.mac) {
      status = "mac-mismatch";
      add("error", "MAC", h.ip, `${h.ip} (${e.name}): answered by MAC ${h.mac}${h.vendor ? ` (${h.vendor})` : ""}, register says ${e.mac}. Either the device was replaced and the register not updated, or another device uses the same IP address (duplicate address — intermittent communication).`);
    } else if (e && h.name && e.name && h.name.split(".")[0].toLowerCase() !== e.name.toLowerCase()) {
      add("info", "NAME", h.ip, `${h.ip}: DNS / NetBIOS name ${h.name} differs from the register tag ${e.name}.`);
    }
    for (const p of notOk) {
      unapprovedN++;
      const risk = RISKY[p.port];
      add(risk ? "error" : "warning", "PORT", h.ip, `${label} (${h.ip}): port ${p.port}/${p.proto}${p.service ? ` (${p.service})` : ""} is open but not approved${risk ? ` — ${risk}` : ""}. Disable the service on the device or add it to the approved list with a reason (IEC 62443-3-3 SR 7.7).`);
    }
    for (const p of open.filter((p) => !notOk.includes(p) && RISKY[p.port])) add("info", "RISKY", h.ip, `${label} (${h.ip}): ${p.port}/${p.proto} is approved but is ${RISKY[p.port]}; prefer the secure alternative where the device supports it.`);
    rows.push({ ip: h.ip, status, regName: e?.name ?? "", scanName: h.name, regMac: e?.mac ?? "", scanMac: h.mac, vendor: h.vendor, open: open.map((p) => `${p.port}/${p.proto}`).join(", "), unapproved: notOk.map((p) => `${p.port}/${p.proto}`).join(", ") });
  }
  const seen = new Set(scan.hosts.map((h) => h.ip));
  const missing: string[] = [];
  for (const e of reg) for (const ip of e.ips) {
    if (seen.has(ip) || !inScope(ip, scope)) continue;
    missing.push(ip);
    rows.push({ ip, status: "missing", regName: e.name, scanName: "", regMac: e.mac, scanMac: "", vendor: "", open: "", unapproved: "" });
  }
  if (missing.length) add("warning", "MISSING", "", `${missing.length} registered address${missing.length === 1 ? " was" : "es were"} not found: ${missing.map((ip) => `${ip} (${byIp.get(ip)?.name})`).join(", ")}. The device may be off or disconnected, or it does not answer the scan's probes (on another subnet many devices ignore ping; on the local subnet nmap uses ARP, which every device answers).`);
  for (const [mac, ips] of macSeen) if (ips.length > 1) {
    const e = byMac.get(mac);
    add("info", "MULTI", ips[0], `MAC ${mac} answers for ${ips.join(", ")}${e ? ` (${e.name})` : ""}. Normal for a device with several addresses on one port; otherwise a router answering by proxy ARP or an address conflict.`);
  }
  if (!scan.hosts.some((h) => h.mac)) add("info", "NOMAC", "", "The scan has no MAC addresses (scan from another subnet, or a list without MACs); the MAC check is skipped. Scan from a computer on the same subnet to see them.");
  if (!scan.hosts.some((h) => h.ports.length)) add("info", "NOPORTS", "", "The scan has no port results (host discovery only); the approved-service check is skipped. Run a port scan (for example nmap -sS -p 1-1024,2404,3389,5900,8080) during an agreed window.");
  rows.sort((a, b) => ipNum(a.ip) - ipNum(b.ip));
  return {
    rows, findings: F, scope,
    counts: { scanned: scan.hosts.length, registered: reg.reduce((n, e) => n + e.ips.filter((ip) => inScope(ip, scope)).length, 0), matched: rows.filter((r) => r.status === "matched").length, unknown: rows.filter((r) => r.status === "unknown").length, missing: missing.length, macMismatch: rows.filter((r) => r.status === "mac-mismatch").length, unapproved: unapprovedN },
  };
}

export function discCsv(r: DiscResult): string {
  const e = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return ["IP address,Status,Register tag,Scan name,Register MAC,Scan MAC,Vendor,Open ports,Not approved", ...r.rows.map((x) => [x.ip, x.status, x.regName, x.scanName, x.regMac, x.scanMac, x.vendor, x.open, x.unapproved].map(e).join(","))].join("\r\n");
}
