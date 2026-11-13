// Windows Health Analyser: reads an AJ Collector report (JSON) from a SCADA
// server, HMI, historian or engineering workstation and explains it: system and
// patches, disks, services and dependencies, events, boot and logon, time,
// domain, network, listening ports against an approved list, firewall,
// accounts, a security baseline, certificates and installed software.
// Also compares two reports (baseline) and produces an anonymised copy.

import { explain } from "./cmdexplain";
import { CODES, type CodeEntry } from "./errorcodes";

export type Sev = "error" | "warning" | "info" | "ok";
export interface Finding {
  sev: Sev;
  area: Area;
  text: string;
}
export type Area = "System" | "Disks" | "Services" | "Events" | "Boot & logon" | "Time" | "Domain" | "Network" | "Ports & firewall" | "Accounts" | "Security baseline" | "Certificates" | "Software";
export const AREAS: Area[] = ["System", "Disks", "Services", "Events", "Boot & logon", "Time", "Domain", "Network", "Ports & firewall", "Accounts", "Security baseline", "Certificates", "Software"];

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Report = any;

export function parseReport(text: string): Report {
  const j = JSON.parse(String(text || "").replace(/^﻿/, ""));
  if (!j || j.format !== "AJ Collector report") throw new Error("This is not an AJ Collector report (the 'format' field is missing).");
  return j;
}

const arr = <T = any>(x: any): T[] => (Array.isArray(x) ? x : x == null ? [] : [x]);
const days = (fromIso: string | null | undefined, toIso: string) => {
  const a = Date.parse(String(fromIso || "")), b = Date.parse(toIso);
  return Number.isFinite(a) && Number.isFinite(b) ? (b - a) / 864e5 : null;
};
const ymd = (iso: string | null | undefined) => (iso ? String(iso).slice(0, 10) : "—");

// ------------------------------------------------------------------ OS support
const EOS: [RegExp, string, string][] = [
  [/Windows 7|Server 2008/i, "2020-01-14", "Windows 7 / Server 2008 R2"],
  [/Server 2012/i, "2023-10-10", "Windows Server 2012 / 2012 R2"],
  [/Windows 10/i, "2025-10-14", "Windows 10"],
  [/Server 2016/i, "2027-01-12", "Windows Server 2016"],
  [/Server 2019/i, "2029-01-09", "Windows Server 2019"],
];

export interface EventGroup {
  log: string;
  source: string;
  id: number;
  level: string;
  count: number;
  first: string;
  last: string;
  sample: string;
  code: CodeEntry | null;
}

export function codeFor(source: string, id: number): CodeEntry | null {
  const short = String(source || "").replace(/^Microsoft-Windows-/, "").replace(/-Auditing$/, "").toLowerCase();
  return (
    CODES.find((c) => c.kind === "Event" && c.codes.includes(String(id)) && c.source.toLowerCase().includes(short)) ??
    CODES.find((c) => c.kind === "Event" && c.codes.includes(String(id)) && short.includes("security") && c.source.startsWith("Security")) ??
    null
  );
}

export function groupEvents(r: Report): EventGroup[] {
  const m = new Map<string, EventGroup>();
  for (const e of arr(r.events)) {
    const k = `${e.log}|${e.source}|${e.id}`;
    const g = m.get(k);
    if (g) {
      g.count++;
      if (e.time < g.first) g.first = e.time;
      if (e.time > g.last) (g.last = e.time), (g.sample = e.message || g.sample);
    } else m.set(k, { log: e.log, source: e.source, id: e.id, level: e.level, count: 1, first: e.time, last: e.time, sample: e.message || "", code: codeFor(e.source, e.id) });
  }
  const rank: Record<string, number> = { Critical: 0, Error: 1, Warning: 2, Information: 3 };
  return [...m.values()].sort((a, b) => (rank[a.level] ?? 4) - (rank[b.level] ?? 4) || b.count - a.count);
}

const BENIGN_STOPPED = new Set(["sppsvc", "gupdate", "gupdatem", "edgeupdate", "edgeupdatem", "MapsBroker", "RemoteRegistry", "WbioSrvc", "tiledatamodelsvc", "dmwappushservice", "CDPSvc", "ShellHWDetection", "clr_optimization_v4.0.30319_32", "clr_optimization_v4.0.30319_64", "MSDTC", "TrustedInstaller", "wuauserv", "UsoSvc", "WaaSMedicSvc", "BITS"]);
const BUILTIN_ACCOUNTS = /^(LocalSystem|NT AUTHORITY\\(LocalService|NetworkService|SYSTEM)|NT Service\\.+|LocalService|NetworkService)$/i;
const REMOTE_TOOLS = /teamviewer|anydesk|vnc|screenconnect|connectwise|logmein|remote ?support|rsagent|splashtop|dameware|bomgar|beyondtrust|rustdesk/i;

export const DEFAULT_APPROVED = "102, 2404, 19998, 20000, 502, 802, 4840, 4843, 123, 161, 3389";
const SYS_DYNAMIC = /^(svchost|lsass|wininit|services|spoolsv|System)$/i;
const PORTNAMES: Record<number, string> = { 21: "FTP", 22: "SSH", 23: "Telnet", 80: "HTTP", 102: "IEC 61850 MMS", 123: "NTP", 135: "RPC / DCOM", 137: "NetBIOS", 138: "NetBIOS", 139: "NetBIOS", 161: "SNMP", 162: "SNMP trap", 443: "HTTPS", 445: "SMB", 500: "IKE", 502: "Modbus TCP", 802: "Modbus TCP Security", 1433: "SQL Server", 2404: "IEC 60870-5-104", 3389: "Remote Desktop", 4840: "OPC UA", 4843: "OPC UA TLS", 5985: "WinRM HTTP", 5986: "WinRM HTTPS", 19998: "IEC 104 TLS", 20000: "DNP3", 5938: "TeamViewer / remote support", 5900: "VNC" };
export const portLabel = (p: number) => PORTNAMES[p] ?? "";
const SENSITIVE = new Set([21, 23, 135, 139, 445, 1433, 3389, 5985, 5986, 5900, 5938]);

export interface Analysis {
  findings: Finding[];
  counts: Record<Sev, number>;
  events: EventGroup[];
  baseline: { check: string; value: string; verdict: Sev; why: string }[];
  ports: { proto: string; address: string; port: number; process: string; label: string; approved: boolean; exposed: boolean }[];
  serviceIssues: { name: string; display: string; state: string; startMode: string; reason: string }[];
  bootTimesS: { time: string; seconds: number }[];
  explained: { title: string; findings: { sev: Sev; text: string }[] }[];
}

export function analyse(r: Report, approvedText = DEFAULT_APPROVED): Analysis {
  const F: Finding[] = [];
  const add = (sev: Sev, area: Area, text: string) => F.push({ sev, area, text });
  const now = r.meta?.collectedUtc ?? new Date().toISOString();
  const sys = r.system ?? {};
  const events = groupEvents(r);
  const evs = arr(r.events);

  // -------- System
  if (sys.os) {
    const eos = EOS.find(([re]) => re.test(sys.os));
    if (eos) {
      const left = days(now, eos[1] + "T00:00:00Z");
      if (left != null && left < 0) add("error", "System", `${eos[2]} reached end of support on ${eos[1]}: no more security updates unless the site has Extended Security Updates. Plan the upgrade with the SCADA vendor.`);
      else if (left != null && left < 730) add("warning", "System", `${eos[2]} reaches end of support on ${eos[1]} (${Math.round(left / 30)} months). Plan the upgrade with the SCADA vendor.`);
    }
  }
  if (arr(sys.pendingReboot).length) add("warning", "System", `A restart is pending (${arr(sys.pendingReboot).join(", ")}): installed updates or changes are not active until the next planned restart.`);
  const hf = arr(sys.hotfixes).map((h) => h.installedOn).filter(Boolean).sort();
  if (hf.length) {
    const age = days(hf[hf.length - 1], now);
    if (age != null && age > 90) add("warning", "System", `The last update was installed on ${ymd(hf[hf.length - 1])} (${Math.round(age)} days before the report). SCADA patching follows the vendor's approved list — check which approved patches are missing.`);
    else if (age != null) add("ok", "System", `Last update installed ${Math.round(age)} days before the report.`);
  } else if (r.system) add("info", "System", "No installed updates were listed (the update list may need administrator rights).");
  if (sys.ramGB && sys.ramFreeGB != null && sys.ramFreeGB / sys.ramGB < 0.1) add("warning", "System", `Only ${sys.ramFreeGB} GB of ${sys.ramGB} GB memory available when the report was taken. Check for a process using or leaking memory (Performance & Disk Log Analyser).`);

  // -------- Disks
  for (const d of arr(r.disks)) {
    const pct = d.sizeGB ? (100 * d.freeGB) / d.sizeGB : 100;
    if (pct < 5) add("error", "Disks", `${d.name} has ${d.freeGB} GB available of ${d.sizeGB} GB (${pct.toFixed(1)} %). A full volume stops logging, historians and updates.`);
    else if (pct < 15) add("warning", "Disks", `${d.name} has ${d.freeGB} GB available of ${d.sizeGB} GB (${pct.toFixed(1)} %).`);
  }
  for (const p of arr(r.physicalDisks)) if (p.health && p.health !== "Healthy") add("error", "Disks", `Physical disk ${p.name}: health ${p.health} (${p.status}). Back up and check the disk or RAID controller now.`);
  const diskErr = events.filter((g) => /^disk$|Ntfs/i.test(g.source) && [7, 11, 51, 55, 153].includes(g.id));
  for (const g of diskErr) add(g.id === 153 ? "warning" : "error", "Disks", `${g.count} × ${g.source} event ${g.id} (${g.code?.title ?? "disk error"}) between ${ymd(g.first)} and ${ymd(g.last)}.`);

  // -------- Services
  const svcs = arr(r.services);
  const byName = new Map(svcs.map((s: any) => [s.name, s]));
  const serviceIssues: Analysis["serviceIssues"] = [];
  const uptimeH = Number(sys.uptimeHours ?? 99);
  for (const s of svcs) {
    if (s.startMode === "Auto" && s.state !== "Running") {
      const deadDep = arr<string>(s.dependsOn).find((d) => byName.get(d) && byName.get(d).state !== "Running");
      if (BENIGN_STOPPED.has(s.name)) continue;
      if (s.delayed && uptimeH < 0.5) continue;
      const crash = events.find((g) => g.source === "Service Control Manager" && [7031, 7034, 7023, 7024].includes(g.id) && g.sample.toLowerCase().includes(String(s.display).toLowerCase()));
      const reason = deadDep ? `depends on ${deadDep}, which is not running` : crash ? `terminated unexpectedly ${crash.count} time(s) (event ${crash.id})` : "set to start automatically but not running";
      serviceIssues.push({ name: s.name, display: s.display, state: s.state, startMode: s.startMode + (s.delayed ? " (delayed)" : ""), reason });
      add(crash ? "error" : "warning", "Services", `${s.display} (${s.name}) is ${s.state.toLowerCase()} although set to Automatic: ${reason}.`);
    }
    if (s.state === "Running") {
      const deadDep = arr<string>(s.dependsOn).find((d) => byName.get(d) && byName.get(d).state !== "Running");
      if (deadDep) add("warning", "Services", `${s.display} is running but its dependency ${deadDep} is not.`);
    }
  }
  const named = svcs.filter((s: any) => s.account && !BUILTIN_ACCOUNTS.test(s.account));
  if (named.length) add("info", "Services", `${named.length} service(s) run under named accounts (${named.map((s: any) => `${s.name}: ${s.account}`).join("; ")}). If such an account's password expires, is changed or locks out, the service fails to start (error 1069).`);
  const spooler = byName.get("Spooler");
  if (spooler?.state === "Running" && /Server/i.test(sys.os ?? "")) add("info", "Services", "Print Spooler is running on a server. Hardening guides recommend disabling it on servers that do not print.");
  const remoteSvcs = svcs.filter((s: any) => REMOTE_TOOLS.test(`${s.name} ${s.display} ${s.path}`));
  for (const s of remoteSvcs) add("warning", "Services", `Remote access service ${s.display} (${s.state}). Confirm it is approved, how it is controlled and who can use it; unmanaged remote access to SCADA hosts is a major security risk.`);

  // -------- Events
  for (const g of events) {
    if (g.source === "Service Control Manager" && [7031, 7034].includes(g.id)) continue; // reported under services
    if (g.id === 41 && /Kernel-Power/.test(g.source)) add("warning", "Events", `Unexpected restart (Kernel-Power 41) ${g.count === 1 ? "on " + ymd(g.last) : `${g.count} times, last on ${ymd(g.last)}`}: power loss, a hang or a crash. Check UPS and hardware logs at that time.`);
    else if (g.id === 4199 && /Tcpip/.test(g.source)) add("error", "Events", `IP address conflict: ${g.sample}`);
    else if (g.id === 1000 && /Application Error/.test(g.source)) {
      const app = (g.sample.match(/Faulting application name:\s*([^,]+)/i) || [])[1] ?? "an application";
      add("error", "Events", `${app} crashed ${g.count} time(s) (Application Error 1000), last on ${ymd(g.last)}. Send the faulting module and exception code to the vendor.`);
    } else if ([10009, 10028].includes(g.id) && /DistributedCOM/.test(g.source)) {
      const pc = (g.sample.match(/computer\s+(\S+)/i) || [])[1] ?? "a remote computer";
      add("warning", "Events", `DCOM could not reach ${pc} ${g.count} time(s) (event ${g.id}) — OPC DA or DCOM communication is failing (firewall for TCP 135 and dynamic ports, or the computer is off).`);
    } else if (g.id === 10016 && /DistributedCOM/.test(g.source)) add("info", "Events", `${g.count} × DCOM 10016 (local activation permission). Usually harmless for Windows components; act only if the CLSID belongs to your OPC server.`);
    else if (g.id === 1102) add("error", "Events", "The Security audit log was cleared. Treat this as a security incident unless the clearance was approved.");
    else if ((g.id === 4732 || g.id === 4728 || g.id === 4756) && g.log === "Security") add("warning", "Events", `Group membership change: ${g.sample}`);
    else if (g.id === 7045 || g.id === 4697) add("warning", "Events", `New service installed: ${g.sample.slice(0, 200)}`);
    else if (g.id === 4740) add("warning", "Events", `${g.count} account lockout(s): ${g.sample}`);
    else if (g.id === 4625) add(g.count > 20 ? "warning" : "info", "Events", `${g.count} failed logon(s) (4625), last on ${ymd(g.last)}. ${/0xC000006A/i.test(g.sample) ? "Sub status 0xC000006A = wrong password — " : ""}look for an old password stored in a service, task or session, or repeated guessing.`);
  }
  const unexplained = events.filter((g) => (g.level === "Error" || g.level === "Critical") && !F.some((f) => f.text.includes(`${g.id}`)));
  if (unexplained.length) add("info", "Events", `${unexplained.length} other error event type(s) — see the event table below; entries with an explanation link to the code explainer.`);

  // -------- Boot & logon
  const bootTimesS: Analysis["bootTimesS"] = [];
  for (const e of evs.filter((e: any) => e.id === 100 && /Diagnostics-Performance/.test(e.source))) {
    const m = String(e.message).match(/Boot Duration\s*:\s*(\d+)\s*ms/i);
    if (m) bootTimesS.push({ time: e.time, seconds: +m[1] / 1000 });
  }
  if (bootTimesS.length) {
    const worst = Math.max(...bootTimesS.map((b) => b.seconds));
    add(worst > 120 ? "warning" : "ok", "Boot & logon", `Boot duration ${bootTimesS.map((b) => `${b.seconds.toFixed(0)} s (${ymd(b.time)})`).join(", ")}${worst > 120 ? ". More than 2 minutes: look at the Group Policy and Netlogon events below, and services that wait for the network." : "."}`);
  }
  const gp = events.filter((g) => (/GroupPolicy/.test(g.source) && [1129, 1053, 1054, 1055, 1058].includes(g.id)) || (/NETLOGON/i.test(g.source) && [5719, 3210].includes(g.id)));
  if (gp.length) add("warning", "Boot & logon", `${gp.map((g) => `${g.source.replace("Microsoft-Windows-", "")} ${g.id} × ${g.count}`).join(", ")}: the computer could not reach a domain controller at start-up, which delays boot and logon. Typical fixes: switch port as an edge (portfast) port, correct DNS servers, NIC teaming/driver delays.`);

  // -------- Time
  const explained: Analysis["explained"] = [];
  if (r.time?.status) {
    const t = explain(r.time.status, "w32tm");
    if (t) {
      explained.push({ title: "w32tm /query /status", findings: t.findings });
      for (const f of t.findings) if (f.sev !== "info" || /Stratum|domain controller/.test(f.text)) add(f.sev, "Time", f.text);
    }
    if (/Type:\s*NT5DS/i.test(r.time.configuration ?? "")) add("info", "Time", "Time type NT5DS: the computer follows the domain hierarchy. SCADA time is then only as good as the domain controllers' source.");
  }
  const tch = evs.filter((e: any) => e.id === 1 && /Kernel-General/.test(e.source));
  let maxStep = 0;
  for (const e of tch) {
    const m = String(e.message).match(/changed to\s+(\S+)\s+from\s+(\S+)/i);
    if (m) {
      const a = Date.parse(m[1]), b = Date.parse(m[2]);
      if (Number.isFinite(a) && Number.isFinite(b)) maxStep = Math.max(maxStep, Math.abs(a - b) / 1000);
    }
  }
  if (tch.length) add(maxStep > 1 ? "warning" : "info", "Time", `${tch.length} system time change(s) recorded${maxStep ? `, the largest a step of ${maxStep.toFixed(2)} s` : ""}. Large steps create gaps or overlaps in historian and event data.`);
  const ts36 = events.find((g) => /Time-Service/.test(g.source) && g.id === 36);
  if (ts36) add("warning", "Time", `Time-Service 36: the clock was not synchronised for a long period (${ymd(ts36.last)}).`);

  // -------- Domain
  const dom = r.domain;
  if (dom?.partOfDomain) {
    if (dom.secureChannel === false || /ERROR_|failed|0x[1-9a-f]/i.test(String(dom.scVerify ?? "").replace(/0x0 NERR_Success/g, ""))) add("error", "Domain", `The secure channel with domain ${dom.name} is broken or failing. Logon will fail with 'trust relationship failed' (1789). Repair it (Test-ComputerSecureChannel -Repair) or rejoin the domain.`);
    else if (dom.secureChannel === true || /NERR_Success/.test(dom.scVerify ?? "")) add("ok", "Domain", `Secure channel with ${dom.name} verified.`);
    if (/ERROR_NO_SUCH_DOMAIN|ERROR_NO_LOGON_SERVERS|could not be/i.test(dom.dsgetdc ?? "")) add("error", "Domain", "No domain controller could be found (nltest /dsgetdc). Check the DNS servers and the network path to the domain controllers.");
  } else if (dom) add("info", "Domain", `Workgroup computer (${dom.workgroup ?? "workgroup"}): accounts and policies are managed locally on this computer.`);

  // -------- Network (reuse the command explainer)
  for (const [k, title] of [["ipconfig", "ipconfig /all"], ["route", "route print"], ["netstat", "netstat -ano"]] as const) {
    const text = r.network?.[k];
    if (!text) continue;
    const ex = explain(text, k);
    if (ex) {
      explained.push({ title, findings: ex.findings });
      for (const f of ex.findings) if (f.sev === "error" || f.sev === "warning") add(f.sev, "Network", `${title}: ${f.text}`);
    }
  }

  // -------- Listening ports and firewall
  const approved = new Set(String(approvedText).split(/[\s,;]+/).map((x) => parseInt(x, 10)).filter((n) => n > 0));
  const fwRules = arr(r.firewall?.rules).filter((x: any) => x.direction === "Inbound" && x.action === "Allow");
  const ruleFor = (p: number, proto: string) => fwRules.find((x: any) => (x.protocol === "Any" || !x.protocol || x.protocol === proto || x.protocol === (proto === "TCP" ? "6" : "17")) && (x.localPort === "Any" || String(x.localPort ?? "").split(",").includes(String(p))));
  const ports: Analysis["ports"] = [];
  let dyn = 0;
  for (const l of arr(r.listening)) {
    if (/^(127\.|::1$)/.test(l.address)) continue;
    if (l.port >= 49152 && SYS_DYNAMIC.test(l.process ?? "")) {
      dyn++;
      continue;
    }
    if (l.proto === "UDP" && l.port > 1024 && !approved.has(l.port)) continue; // ephemeral client sockets
    const rule = ruleFor(l.port, l.proto);
    const exposed = !!rule && /^(Any|\*|)$/i.test(String(rule.remoteAddress ?? "Any"));
    const ok = approved.has(l.port);
    ports.push({ proto: l.proto, address: l.address, port: l.port, process: l.process ?? String(l.pid), label: portLabel(l.port), approved: ok, exposed });
  }
  ports.sort((a, b) => a.port - b.port);
  const notApproved = ports.filter((p) => !p.approved);
  if (notApproved.length) add("warning", "Ports & firewall", `${notApproved.length} listening port(s) not in the approved list: ${notApproved.map((p) => `${p.proto} ${p.port}${p.label ? ` (${p.label})` : ""} by ${p.process}`).join("; ")}. Confirm each is needed and documented in the approved protocol matrix, or disable the service.`);
  else if (ports.length) add("ok", "Ports & firewall", "Every listening port is in the approved list.");
  if (dyn) add("info", "Ports & firewall", `${dyn} dynamic RPC port(s) (49152 and above) opened by Windows system processes — normal; they are reachable only if the firewall allows them.`);
  for (const p of arr(r.firewall?.profiles)) {
    if (String(p.enabled) !== "True") add(p.name === "Public" ? "warning" : "error", "Ports & firewall", `Windows Firewall ${p.name} profile is disabled. Any adapter in that network category is unprotected${p.name === "Public" ? " (adapters fall back to Public when the network cannot be identified)" : ""}.`);
    else if (String(p.inbound) === "Allow") add("error", "Ports & firewall", `Windows Firewall ${p.name} profile allows all inbound connections by default.`);
  }
  for (const x of fwRules) {
    const anyRemote = /^(Any|\*|)$/i.test(String(x.remoteAddress ?? "Any"));
    const anyPort = String(x.localPort ?? "Any") === "Any" && /^(Any|)$/i.test(String(x.protocol ?? "Any"));
    const portsInRule = String(x.localPort ?? "").split(",").map((v) => parseInt(v, 10)).filter((n) => n > 0);
    if (anyPort && anyRemote) add(x.program ? "warning" : "error", "Ports & firewall", `Rule "${x.display}" allows ${x.program ? `every port for ${x.program}` : "all inbound traffic"} from any address.`);
    else if (anyPort) add("info", "Ports & firewall", `Rule "${x.display}" allows all ports from ${x.remoteAddress}. Narrow it to the protocols that address really needs.`);
    else if (anyRemote && portsInRule.some((n) => SENSITIVE.has(n))) add("warning", "Ports & firewall", `Rule "${x.display}" allows ${portsInRule.filter((n) => SENSITIVE.has(n)).map((n) => `${n} (${portLabel(n)})`).join(", ")} from any address. Restrict the remote addresses to the engineering or management subnets that need it.`);
  }

  // -------- Accounts
  const acc = r.accounts ?? {};
  for (const u of arr(acc.users)) {
    if (!u.enabled) continue;
    const sid = String(u.sid ?? "");
    if (/-500$/.test(sid)) add("warning", "Accounts", `The built-in Administrator account ('${u.name}') is enabled. Hardening baselines disable or rename it and use named administrator accounts.`);
    if (/-501$/.test(sid)) add("error", "Accounts", "The Guest account is enabled.");
    if (u.passwordRequired === false) add("error", "Accounts", `Local account '${u.name}' does not require a password.`);
    const idle = days(u.lastLogon, now);
    if (idle == null || idle > 90) add("warning", "Accounts", `Local account '${u.name}' is enabled but ${idle == null ? "has never logged on" : `has not logged on for ${Math.round(idle)} days`}. Disable accounts that are no longer needed (commissioning and vendor accounts especially).`);
    if (/shared|operator/i.test(`${u.name} ${u.description}`) && !/-50[01]$/.test(sid)) add("info", "Accounts", `'${u.name}' looks like a shared account. Shared logons make actions untraceable; prefer named accounts where the SCADA allows it.`);
  }
  const admins = arr(acc.admins);
  const localAdminUsers = admins.filter((a: any) => /Local/i.test(a.source ?? "") && /User/i.test(a.class ?? "") && !/\\Administrator$/i.test(a.name));
  for (const a of localAdminUsers) add("warning", "Accounts", `Local account ${a.name} is a member of Administrators. Operator and service accounts should not have administrator rights.`);
  const vend = admins.filter((a: any) => /vendor|support|contractor|external/i.test(a.name));
  for (const a of vend) add("info", "Accounts", `${a.name} is a member of Administrators — confirm the access is still required and time-limited.`);
  if (admins.length) add("info", "Accounts", `Administrators group: ${admins.map((a: any) => a.name).join(", ")}.`);
  const na = String(acc.netAccounts ?? "");
  const minLen = parseInt((na.match(/Minimum password length:\s*(\d+)/i) || [])[1] ?? "", 10);
  if (Number.isFinite(minLen) && minLen < 8) add("warning", "Accounts", `Minimum password length is ${minLen}. Follow the site's password policy (IEC 62443 and most baselines require considerably more).`);
  if (/Lockout threshold:\s*Never/i.test(na)) add("warning", "Accounts", "No account lockout threshold: unlimited password guessing is possible. Set a threshold that will not lock out operator consoles during operation.");

  // -------- Security baseline
  const sec = r.security ?? {};
  const baseline: Analysis["baseline"] = [];
  const B = (check: string, value: string, verdict: Sev, why: string, reported = false) => {
    baseline.push({ check, value, verdict, why });
    if (!reported && (verdict === "error" || verdict === "warning")) add(verdict, "Security baseline", `${check}: ${value}. ${why}`);
  };
  const profs = arr(r.firewall?.profiles);
  if (profs.length) B("Windows Firewall enabled on all profiles", profs.map((p: any) => `${p.name} ${String(p.enabled) === "True" ? "on" : "off"}`).join(", "), profs.every((p: any) => String(p.enabled) === "True") ? "ok" : "warning", "Every network profile should be protected.", true);
  if (sec.rdpDenied != null) {
    const rdpOn = Number(sec.rdpDenied) === 0;
    B("Remote Desktop", rdpOn ? "enabled" : "disabled", "info", rdpOn ? "Allowed only if required; restrict who can use it and from where." : "Disabled.");
    if (rdpOn) B("Network Level Authentication for Remote Desktop", Number(sec.nla) === 1 ? "required" : "not required", Number(sec.nla) === 1 ? "ok" : "error", "Without NLA, the logon screen is exposed to anyone who can reach port 3389.");
  }
  if (sec.smb1 != null) B("SMBv1 protocol", sec.smb1 ? "enabled" : "disabled", sec.smb1 ? "error" : "ok", "SMBv1 is obsolete and was exploited by wide-spread ransomware; disable it unless a legacy device needs it.");
  if (sec.enableLUA != null) B("User Account Control", Number(sec.enableLUA) === 1 ? "enabled" : "disabled", Number(sec.enableLUA) === 1 ? "ok" : "warning", "UAC limits what programs can do without explicit elevation.");
  if (sec.usbStorStart != null) B("USB mass storage", Number(sec.usbStorStart) === 4 ? "disabled" : "enabled", Number(sec.usbStorStart) === 4 ? "ok" : "info", "Removable media is a common way malware reaches isolated networks; follow the site's removable-media policy.");
  B("AutoRun for all drives", Number(sec.noDriveTypeAutoRun) === 255 ? "disabled" : sec.noDriveTypeAutoRun == null ? "not set by policy" : `value ${sec.noDriveTypeAutoRun}`, Number(sec.noDriveTypeAutoRun) === 255 ? "ok" : "warning", "AutoRun lets inserted media start programs automatically.");
  B("LLMNR (multicast name resolution)", Number(sec.llmnrEnableMulticast) === 0 ? "disabled by policy" : "enabled (not set by policy)", Number(sec.llmnrEnableMulticast) === 0 ? "ok" : "info", "LLMNR can be abused to capture credentials on the local network; many baselines disable it.");
  if (sec.defender) {
    const d = sec.defender;
    B("Microsoft Defender real-time protection", d.realTime ? "on" : "off", d.realTime ? "ok" : "warning", "If another antivirus approved by the SCADA vendor is used, Defender may be off by design.");
    const age = days(d.signaturesUpdated, now);
    if (age != null) B("Antivirus signatures", `updated ${ymd(d.signaturesUpdated)} (${Math.round(age)} days before the report)`, age > 7 ? "warning" : "ok", "On isolated SCADA networks, signatures are updated through an approved offline process; keep them within the site's limit.");
  }
  if (sec.auditpol) {
    const ap = String(sec.auditpol);
    const logon = (ap.match(/^\s*Logon\s{2,}(.+)$/im) || [])[1]?.trim() ?? "";
    B("Audit: logon events", logon || "not listed", /Success and Failure/i.test(logon) ? "ok" : "warning", "Failed and successful logons are the basis of incident investigation.");
    const pol = (ap.match(/^\s*Audit Policy Change\s{2,}(.+)$/im) || [])[1]?.trim() ?? "";
    if (pol) B("Audit: policy changes", pol, /No Auditing/i.test(pol) ? "warning" : "ok", "Changes to audit policy itself should be recorded.");
  }
  if (arr(sys.pendingReboot).length) B("Pending restart", arr(sys.pendingReboot).join(", "), "warning", "Updates are not active until the restart.", true);
  const rt = arr(r.software).filter((s: any) => REMOTE_TOOLS.test(s.name));
  if (rt.length) B("Remote access software", rt.map((s: any) => s.name).join(", "), "warning", "Remote access to SCADA hosts must be approved, controlled (jump host, MFA) and logged.", remoteSvcs.length > 0);

  // -------- Certificates
  for (const c of arr(r.certificates)) {
    const left = days(now, c.notAfter);
    const nm = `${c.subject} (${c.store})`;
    if (left != null && left < 0) add("error", "Certificates", `${nm} expired on ${ymd(c.notAfter)}. Remove it if unused, or renew it.`);
    else if (left != null && left < 30) add("warning", "Certificates", `${nm} expires on ${ymd(c.notAfter)} (${Math.round(left)} days). Renew it and update every system that trusts it.`);
    else if (left != null && left < 90) add("info", "Certificates", `${nm} expires on ${ymd(c.notAfter)}.`);
    if (/sha1|md5/i.test(c.sigAlg ?? "")) add("warning", "Certificates", `${nm} uses ${c.sigAlg}, which current clients reject.`);
    if (c.keySize && c.keySize < 2048) add("warning", "Certificates", `${nm} has a ${c.keySize}-bit key; use 2048 bits or more.`);
  }

  // -------- Software
  if (arr(r.software).length) add("info", "Software", `${arr(r.software).length} installed program(s) listed — keep the list as the software baseline and compare it with the approved list.`);

  // -------- Skipped sections
  for (const s of arr(r.skipped)) add("info", "System", `Not collected: ${s.section} — ${s.reason}.`);
  if (r.meta && !r.meta.isAdmin) add("info", "System", "The collector ran without administrator rights, so Security events, audit policy, the secure channel test and some details are missing. Run it as administrator for a complete report.");

  const counts: Record<Sev, number> = { error: 0, warning: 0, info: 0, ok: 0 };
  for (const f of F) counts[f.sev]++;
  return { findings: F, counts, events, baseline, ports, serviceIssues, bootTimesS, explained };
}

// ------------------------------------------------------------------ compare with a baseline
export interface Change {
  area: string;
  kind: "added" | "removed" | "changed";
  text: string;
}

export function compareReports(base: Report, cur: Report): Change[] {
  const out: Change[] = [];
  const diff = (area: string, a: any[], b: any[], key: (x: any) => string, show: (x: any) => string, same?: (x: any, y: any) => string | null) => {
    const ma = new Map(a.map((x) => [key(x), x])), mb = new Map(b.map((x) => [key(x), x]));
    for (const [k, x] of mb) if (!ma.has(k)) out.push({ area, kind: "added", text: show(x) });
    for (const [k, x] of ma) if (!mb.has(k)) out.push({ area, kind: "removed", text: show(x) });
    if (same) for (const [k, y] of mb) { const x = ma.get(k); if (x) { const d = same(x, y); if (d) out.push({ area, kind: "changed", text: d }); } }
  };
  diff("Services", arr(base.services), arr(cur.services), (s) => s.name, (s) => `${s.display} (${s.name}), ${s.startMode}, ${s.state}`, (x, y) => (x.state !== y.state || x.startMode !== y.startMode || x.account !== y.account ? `${y.display}: ${x.startMode}/${x.state}${x.account !== y.account ? `/${x.account}` : ""} → ${y.startMode}/${y.state}${x.account !== y.account ? `/${y.account}` : ""}` : null));
  diff("Listening ports", arr(base.listening).filter((l) => l.port < 49152), arr(cur.listening).filter((l) => l.port < 49152), (l) => `${l.proto}:${l.port}`, (l) => `${l.proto} ${l.port}${portLabel(l.port) ? ` (${portLabel(l.port)})` : ""} by ${l.process}`, (x, y) => (x.process !== y.process ? `${y.proto} ${y.port}: ${x.process} → ${y.process}` : null));
  diff("Administrators", arr(base.accounts?.admins), arr(cur.accounts?.admins), (a) => String(a.name).toLowerCase(), (a) => a.name);
  diff("Local users", arr(base.accounts?.users), arr(cur.accounts?.users), (u) => u.name, (u) => `${u.name} (${u.enabled ? "enabled" : "disabled"})`, (x, y) => (x.enabled !== y.enabled ? `${y.name}: ${x.enabled ? "enabled" : "disabled"} → ${y.enabled ? "enabled" : "disabled"}` : null));
  diff("Software", arr(base.software), arr(cur.software), (s) => s.name, (s) => `${s.name} ${s.version ?? ""}`.trim(), (x, y) => (x.version !== y.version ? `${y.name}: ${x.version} → ${y.version}` : null));
  diff("Updates", arr(base.system?.hotfixes), arr(cur.system?.hotfixes), (h) => h.id, (h) => `${h.id} (${ymd(h.installedOn)})`);
  diff("Firewall rules", arr(base.firewall?.rules), arr(cur.firewall?.rules), (x) => x.name, (x) => `${x.display} (${x.direction} ${x.action} ${x.localPort ?? ""} from ${x.remoteAddress ?? "Any"})`, (x, y) => (x.localPort !== y.localPort || x.remoteAddress !== y.remoteAddress || x.action !== y.action ? `${y.display}: ${x.action} ${x.localPort} from ${x.remoteAddress} → ${y.action} ${y.localPort} from ${y.remoteAddress}` : null));
  diff("Certificates", arr(base.certificates), arr(cur.certificates), (c) => c.thumbprint, (c) => `${c.subject} (${c.store}, until ${ymd(c.notAfter)})`);
  const fp = (r: Report) => arr(r.firewall?.profiles).map((p: any) => `${p.name}:${p.enabled}`).join(",");
  if (fp(base) !== fp(cur)) out.push({ area: "Firewall profiles", kind: "changed", text: `${fp(base)} → ${fp(cur)}` });
  for (const k of ["rdpDenied", "nla", "smb1", "enableLUA", "usbStorStart", "noDriveTypeAutoRun", "llmnrEnableMulticast"]) {
    const a = base.security?.[k], b = cur.security?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ area: "Security settings", kind: "changed", text: `${k}: ${a ?? "not set"} → ${b ?? "not set"}` });
  }
  return out;
}

// ------------------------------------------------------------------ anonymise
export function anonymise(r: Report): { json: string; replaced: number } {
  let s = JSON.stringify(r, null, 1);
  const map = new Map<string, string>();
  const host = String(r.meta?.computer ?? "");
  const domain = String(r.domain?.name ?? r.system?.domain ?? "");
  const netbios = domain.includes(".") ? domain.split(".")[0] : "";
  if (host) map.set(host, "HOST-01");
  if (domain && domain.includes(".")) map.set(domain, "example.local");
  if (netbios && netbios.length > 2) map.set(netbios, "EXAMPLE");
  const names = new Set<string>();
  const addName = (full: string) => {
    const n = String(full || "").split("\\").pop() ?? "";
    if (n && !/^(Administrator|Guest|Domain Admins|Domain Users|SYSTEM|LocalSystem|LocalService|NetworkService|Administrators|Remote Desktop Users)$/i.test(n) && n.length > 2) names.add(n);
  };
  addName(r.meta?.user);
  for (const u of arr(r.accounts?.users)) addName(u.name);
  for (const a of [...arr(r.accounts?.admins), ...arr(r.accounts?.rdpUsers)]) addName(a.name);
  for (const sv of arr(r.services)) if (sv.account && !BUILTIN_ACCOUNTS.test(sv.account)) addName(sv.account);
  let ui = 0;
  for (const n of names) map.set(n, `user${String(++ui).padStart(2, "0")}`);
  // other host names: \\NAME and NAME.domain
  let hi = 1;
  for (const m of s.matchAll(/\\\\\\\\([A-Za-z][A-Za-z0-9-]{1,})/g)) if (!map.has(m[1])) map.set(m[1], `HOST-${String(++hi).padStart(2, "0")}`);
  if (domain.includes(".")) for (const m of s.matchAll(new RegExp(`([A-Za-z][A-Za-z0-9-]{1,})\\.${domain.replace(/\./g, "\\.")}`, "gi"))) if (!map.has(m[1])) map.set(m[1], `HOST-${String(++hi).padStart(2, "0")}`);
  let count = 0;
  const keys = [...map.keys()].sort((a, b) => b.length - a.length);
  for (const k of keys) {
    const re = new RegExp(`(?<![A-Za-z0-9_])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![A-Za-z0-9_])`, "gi");
    s = s.replace(re, () => (count++, map.get(k)!));
  }
  // IPv4: keep the last octet and the /24 relationships; leave masks, loopback, multicast and broadcast
  const pre = new Map<string, string>();
  s = s.replace(/\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g, (all, a, b, c, d, off: number, str: string) => {
    if (/version[":\s]*$/i.test(str.slice(Math.max(0, off - 14), off))) return all;
    if (+a > 223 || +a === 0 || +a === 127 || +a === 255 || [a, b, c, d].some((x) => +x > 255)) return all;
    const p = `${a}.${b}.${c}`;
    if (!pre.has(p)) pre.set(p, `10.250.${pre.size + 1}`);
    count++;
    return `${pre.get(p)}.${d}`;
  });
  // MAC addresses: keep the manufacturer prefix, replace the device part
  const mm = new Map<string, string>();
  s = s.replace(/\b([0-9A-Fa-f]{2})([-:])([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\2([0-9A-Fa-f]{2})\b/g, (all, a, sep, b, c) => {
    const k = all.toUpperCase();
    if (k === "FF-FF-FF-FF-FF-FF" || k === "FF:FF:FF:FF:FF:FF" || (parseInt(a, 16) & 1)) return all;
    if (!mm.has(k)) { const n = mm.size + 1; mm.set(k, [a, b, c, "00", (n >> 8).toString(16).padStart(2, "0"), (n & 255).toString(16).padStart(2, "0")].join(sep).toUpperCase()); }
    count++;
    return mm.get(k)!;
  });
  return { json: s, replaced: count };
}
