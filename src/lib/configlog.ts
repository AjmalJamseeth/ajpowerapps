// Configuration version log: which version of each configuration file (SCD,
// CID, switch, RTU/gateway, PLC, HMI project, firmware) is approved and which is
// in each device, identified by its SHA-256 fingerprint, with who changed what,
// when and why. Files are fingerprinted in the browser; nothing is uploaded.

export type CfgKind = "SCD" | "CID" | "ICD" | "IID" | "SSD" | "Switch configuration" | "RTU / gateway configuration" | "PLC program" | "HMI / SCADA project" | "Firmware" | "Other";
export const CFG_KINDS: CfgKind[] = ["SCD", "CID", "ICD", "IID", "SSD", "Switch configuration", "RTU / gateway configuration", "PLC program", "HMI / SCADA project", "Firmware", "Other"];
export type CfgStatus = "Draft" | "Approved" | "Installed" | "Superseded";
export const CFG_STATUS: CfgStatus[] = ["Draft", "Approved", "Installed", "Superseded"];

export interface SclInfo {
  headerId: string;
  version: string;
  revision: string;
  toolID: string;
  ieds: { name: string; manufacturer: string; type: string; configVersion: string }[];
  history: { version: string; revision: string; when: string; who: string; what: string; why: string }[];
  guessedKind: CfgKind;
}

export interface CfgEntry {
  id: string;
  device: string;
  kind: CfgKind;
  file: string;
  sizeBytes: number;
  sha256: string;
  version: string;
  revision: string;
  date: string; // YYYY-MM-DD
  by: string;
  reason: string;
  status: CfgStatus;
  notes: string;
}

export interface CfgLog {
  format: "AJapps configuration log";
  site: string;
  entries: CfgEntry[];
}

export const emptyLog = (site = ""): CfgLog => ({ format: "AJapps configuration log", site, entries: [] });

export async function sha256Hex(data: ArrayBuffer | Uint8Array): Promise<string> {
  const buf = data instanceof Uint8Array ? data.slice().buffer : data;
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  return [...h].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const attr = (tag: string, n: string) => (tag.match(new RegExp(`\\b${n}="([^"]*)"`)) || [])[1] ?? "";

export function sclInfo(text: string): SclInfo | null {
  if (!/<SCL[\s>]/.test(text)) return null;
  const header = (text.match(/<Header\b[^>]*>/) || [""])[0];
  const ieds = [...text.matchAll(/<IED\b[^>]*>/g)].map((m) => ({ name: attr(m[0], "name"), manufacturer: attr(m[0], "manufacturer"), type: attr(m[0], "type"), configVersion: attr(m[0], "configVersion") }));
  const history = [...text.matchAll(/<Hitem\b[^>]*>/g)].map((m) => ({ version: attr(m[0], "version"), revision: attr(m[0], "revision"), when: attr(m[0], "when"), who: attr(m[0], "who"), what: attr(m[0], "what"), why: attr(m[0], "why") }));
  const hasSub = /<Substation\b/.test(text), hasComm = /<Communication\b/.test(text);
  const guessedKind: CfgKind = ieds.length > 1 || (hasSub && ieds.length >= 1 && hasComm) ? "SCD" : ieds.length === 1 ? (hasComm ? "CID" : "ICD") : hasSub ? "SSD" : "Other";
  return { headerId: attr(header, "id"), version: attr(header, "version"), revision: attr(header, "revision"), toolID: attr(header, "toolID"), ieds, history, guessedKind };
}

export function guessKind(fileName: string, text: string | null): CfgKind {
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  const map: Record<string, CfgKind> = { scd: "SCD", cid: "CID", icd: "ICD", iid: "IID", ssd: "SSD" };
  if (map[ext]) return map[ext];
  if (text && sclInfo(text)) return sclInfo(text)!.guessedKind;
  if (/^(cfg|conf|config|txt|ini)$/.test(ext) && text && /\b(interface|vlan|hostname|spanning-tree)\b/i.test(text)) return "Switch configuration";
  if (/^(bin|img|fw|pkg|zip)$/.test(ext)) return "Firmware";
  return "Other";
}

export interface FileCheck {
  file: string;
  sha256: string;
  sev: "ok" | "warning" | "error" | "info";
  text: string;
  match: CfgEntry | null;
}

/** Is this file a version recorded in the log — and is it the approved / installed one for the device? */
export function checkAgainstLog(log: CfgLog, file: string, sha: string, device = ""): FileCheck {
  const hits = log.entries.filter((e) => e.sha256.toLowerCase() === sha.toLowerCase());
  const dev = device.trim().toLowerCase();
  if (!hits.length) {
    const latest = dev ? log.entries.filter((e) => e.device.toLowerCase() === dev && (e.status === "Approved" || e.status === "Installed")).sort((a, b) => b.date.localeCompare(a.date))[0] : undefined;
    return { file, sha256: sha, sev: dev && latest ? "error" : "warning", text: dev && latest ? `Not a recorded version. ${device}'s approved/installed version is ${latest.version}${latest.revision ? " rev " + latest.revision : ""} (${latest.file}, ${latest.date}). This file is different: find out what changed before using it.` : "This file is not in the log: an unrecorded version. Record it, or find out where it came from.", match: null };
  }
  const h = hits.find((e) => !dev || e.device.toLowerCase() === dev) ?? hits[0];
  if (dev && h.device.toLowerCase() !== dev) return { file, sha256: sha, sev: "warning", text: `This file is recorded for ${h.device}, not ${device}.`, match: h };
  const newer = log.entries.filter((e) => e.device === h.device && e.kind === h.kind && e.date > h.date && (e.status === "Approved" || e.status === "Installed"));
  if (h.status === "Superseded" || newer.length) return { file, sha256: sha, sev: "warning", text: `Matches ${h.device} ${h.version}${h.revision ? " rev " + h.revision : ""} (${h.date}), which is superseded${newer.length ? ` by ${newer[0].version} (${newer[0].date})` : ""}. An old version is in use.`, match: h };
  if (h.status === "Draft") return { file, sha256: sha, sev: "warning", text: `Matches a DRAFT entry for ${h.device} (${h.version}); it has not been approved.`, match: h };
  return { file, sha256: sha, sev: "ok", text: `Matches ${h.device} ${h.kind} ${h.version}${h.revision ? " rev " + h.revision : ""}, ${h.status.toLowerCase()} on ${h.date} by ${h.by || "—"}.`, match: h };
}

export function logIssues(log: CfgLog): { sev: "warning" | "info"; text: string }[] {
  const out: { sev: "warning" | "info"; text: string }[] = [];
  const byDevKind = new Map<string, CfgEntry[]>();
  for (const e of log.entries) {
    const k = `${e.device}|${e.kind}`;
    byDevKind.set(k, [...(byDevKind.get(k) ?? []), e]);
  }
  for (const [k, es] of byDevKind) {
    const inst = es.filter((e) => e.status === "Installed");
    if (inst.length > 1) out.push({ sev: "warning", text: `${k.replace("|", " ")}: ${inst.length} entries marked Installed (${inst.map((e) => e.version).join(", ")}). Only one version can be in the device; mark the older ones Superseded.` });
    const appr = es.filter((e) => e.status === "Approved").sort((a, b) => b.date.localeCompare(a.date));
    if (appr.length && inst.length && appr[0].date > inst[inst.length - 1].date) out.push({ sev: "info", text: `${k.replace("|", " ")}: version ${appr[0].version} is approved (${appr[0].date}) but not yet marked Installed.` });
  }
  const noReason = log.entries.filter((e) => !e.reason.trim() || !e.by.trim());
  if (noReason.length) out.push({ sev: "info", text: `${noReason.length} entr${noReason.length === 1 ? "y has" : "ies have"} no reason or no author. A change record should always say who changed what and why.` });
  const shaMap = new Map<string, CfgEntry[]>();
  for (const e of log.entries) shaMap.set(e.sha256, [...(shaMap.get(e.sha256) ?? []), e]);
  for (const [, es] of shaMap) if (es.length > 1 && new Set(es.map((e) => e.version)).size > 1) out.push({ sev: "warning", text: `The same file is recorded under different versions (${es.map((e) => `${e.device} ${e.version}`).join(", ")}).` });
  return out;
}

export function logCsv(log: CfgLog): string {
  const e = (v: string | number) => {
    const t = String(v ?? "");
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const L = ["Device,Kind,File,Version,Revision,Date,By,Reason,Status,SHA-256,Size bytes,Notes"];
  for (const x of log.entries) L.push([x.device, x.kind, x.file, x.version, x.revision, x.date, x.by, x.reason, x.status, x.sha256, x.sizeBytes, x.notes].map(e).join(","));
  return L.join("\r\n");
}

export function parseLog(text: string): CfgLog {
  const j = JSON.parse(String(text).replace(/^﻿/, ""));
  if (j.format !== "AJapps configuration log" || !Array.isArray(j.entries)) throw new Error("Not an AJapps configuration log.");
  return j;
}

export const newId = () => Math.random().toString(36).slice(2, 10);
