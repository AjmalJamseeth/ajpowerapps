// Patch compatibility register: the Windows updates installed on each SCADA
// computer (from AJ Collector reports) against the SCADA vendor's approval list,
// with consistency checks between redundant servers.

import { parseTable } from "./changecompare";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Machine {
  name: string;
  os: string;
  collected: string;
  hotfixes: Map<string, string>; // KB -> installed date
}
export type Approval = "Approved" | "Not approved" | "Under test" | "Withdrawn";
export interface ApprovalRow {
  kb: string;
  status: Approval;
  date: string;
  note: string;
}

export const normKb = (s: string) => {
  const m = String(s || "").toUpperCase().match(/KB\s?(\d{6,8})/) || String(s || "").match(/^(\d{6,8})$/);
  return m ? `KB${m[1]}` : "";
};

export function machineFromReport(r: any): Machine {
  const hf = new Map<string, string>();
  for (const h of r.system?.hotfixes ?? []) {
    const kb = normKb(h.id);
    if (kb) hf.set(kb, String(h.installedOn ?? "").slice(0, 10));
  }
  return { name: r.meta?.computer ?? "?", os: r.system?.os ?? "", collected: String(r.meta?.collectedUtc ?? "").slice(0, 10), hotfixes: hf };
}

export function parseApprovals(text: string): ApprovalRow[] {
  const { headers, rows } = parseTable(text);
  const col = (re: RegExp) => headers.findIndex((h) => re.test(h));
  const ck = col(/kb|update|hotfix|patch/i), cs = col(/status|approv|decision/i), cd = col(/date/i), cn = col(/note|comment|remark/i);
  const out: ApprovalRow[] = [];
  for (const r of rows) {
    const kb = normKb(r[ck >= 0 ? ck : 0]);
    if (!kb) continue;
    const st = String(r[cs] ?? "").toLowerCase();
    const status: Approval = /withdraw|revok/.test(st) ? "Withdrawn" : /not|reject|block|no$/.test(st) ? "Not approved" : /test|pending|evaluat/.test(st) ? "Under test" : /approv|ok|yes|compatible/.test(st) ? "Approved" : "Under test";
    out.push({ kb, status, date: cd >= 0 ? r[cd] ?? "" : "", note: cn >= 0 ? r[cn] ?? "" : "" });
  }
  return out;
}

export interface PatchFinding {
  sev: "error" | "warning" | "info" | "ok";
  text: string;
}
export interface PatchResult {
  kbs: string[];
  machines: Machine[];
  approval: Map<string, ApprovalRow>;
  findings: PatchFinding[];
}

/** pairs: "SCADA-SRV01=SCADA-SRV02; HIST-A=HIST-B" */
export function analysePatches(machines: Machine[], approvals: ApprovalRow[], pairs = "", collectedRef = ""): PatchResult {
  const approval = new Map(approvals.map((a) => [a.kb, a]));
  const kbs = [...new Set([...machines.flatMap((m) => [...m.hotfixes.keys()]), ...approvals.filter((a) => a.status === "Approved").map((a) => a.kb)])].sort();
  const F: PatchFinding[] = [];
  for (const m of machines) {
    const bad = [...m.hotfixes.keys()].filter((k) => ["Not approved", "Withdrawn"].includes(approval.get(k)?.status ?? ""));
    if (bad.length) F.push({ sev: "error", text: `${m.name}: installed update(s) the vendor has not approved or has withdrawn: ${bad.map((k) => `${k} (${approval.get(k)!.status})`).join(", ")}. Check with the vendor; plan removal if required.` });
    if (approvals.length) {
      const unknown = [...m.hotfixes.keys()].filter((k) => !approval.has(k));
      if (unknown.length) F.push({ sev: "warning", text: `${m.name}: ${unknown.length} installed update(s) not in the vendor's list: ${unknown.join(", ")}. Ask the vendor for their status.` });
      const test = [...m.hotfixes.keys()].filter((k) => approval.get(k)?.status === "Under test");
      if (test.length) F.push({ sev: "warning", text: `${m.name}: update(s) installed while still under vendor test: ${test.join(", ")}.` });
      const missing = approvals.filter((a) => a.status === "Approved" && !m.hotfixes.has(a.kb)).map((a) => a.kb);
      if (missing.length) F.push({ sev: "warning", text: `${m.name}: ${missing.length} approved update(s) not installed: ${missing.join(", ")}.` });
    }
    const last = [...m.hotfixes.values()].filter(Boolean).sort().pop();
    const ref = collectedRef || m.collected;
    if (last && ref) {
      const age = (Date.parse(ref) - Date.parse(last)) / 864e5;
      if (age > 90) F.push({ sev: "info", text: `${m.name}: last update installed ${last} (${Math.round(age)} days before the report).` });
    }
  }
  for (const p of pairs.split(/[;\n]+/).map((x) => x.trim()).filter(Boolean)) {
    const [a, b] = p.split(/=|,|\s+and\s+/i).map((x) => x.trim());
    const ma = machines.find((m) => m.name.toLowerCase() === a?.toLowerCase()), mb = machines.find((m) => m.name.toLowerCase() === b?.toLowerCase());
    if (!ma || !mb) {
      F.push({ sev: "info", text: `Pair "${p}": report for ${!ma ? a : b} not loaded.` });
      continue;
    }
    const onlyA = [...ma.hotfixes.keys()].filter((k) => !mb.hotfixes.has(k)), onlyB = [...mb.hotfixes.keys()].filter((k) => !ma.hotfixes.has(k));
    if (onlyA.length || onlyB.length) F.push({ sev: "warning", text: `Redundant pair ${ma.name} / ${mb.name} differ: ${onlyA.length ? `only on ${ma.name}: ${onlyA.join(", ")}` : ""}${onlyA.length && onlyB.length ? "; " : ""}${onlyB.length ? `only on ${mb.name}: ${onlyB.join(", ")}` : ""}. Redundant servers should run the same patch level so a failover behaves as tested.` });
    else F.push({ sev: "ok", text: `Redundant pair ${ma.name} / ${mb.name}: same updates installed.` });
    if (ma.os !== mb.os) F.push({ sev: "warning", text: `Redundant pair ${ma.name} / ${mb.name} run different operating systems (${ma.os} / ${mb.os}).` });
  }
  if (!approvals.length) F.push({ sev: "info", text: "No vendor approval list loaded: only the installed updates and pair consistency are shown." });
  return { kbs, machines, approval, findings: F };
}

export function matrixCsv(r: PatchResult): string {
  const L = [["Update", "Vendor status", "Approval date", ...r.machines.map((m) => m.name)].join(",")];
  for (const k of r.kbs) {
    const a = r.approval.get(k);
    L.push([k, a?.status ?? "not listed", a?.date ?? "", ...r.machines.map((m) => m.hotfixes.get(k) ?? "")].join(","));
  }
  return L.join("\r\n");
}
