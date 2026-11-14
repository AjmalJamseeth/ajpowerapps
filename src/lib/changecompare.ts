// Change comparison: compares two versions of an engineering record — a table
// (CSV or a copy from Excel: IP register, asset register, SCADA tag list,
// point list, switch port list), an SCL NetStudio project, or an AJ Collector
// report — and lists what was added, removed and changed, with the impact of
// each kind of change on testing and documentation.

import { compareReports } from "./winhealth";

export interface Table {
  headers: string[];
  rows: string[][];
}

export function parseTable(text: string): Table {
  const lines = String(text || "").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { headers: [], rows: [] };
  const first = lines[0];
  const d = ["\t", ";", ","].sort((x, y) => first.split(y).length - first.split(x).length)[0];
  const split = (l: string) => {
    const out: string[] = [];
    let c = "", q = false;
    for (let i = 0; i < l.length; i++) {
      const ch = l[i];
      if (q) {
        if (ch === '"') {
          if (l[i + 1] === '"') (c += '"'), i++;
          else q = false;
        } else c += ch;
      } else if (ch === '"') q = true;
      else if (ch === d) (out.push(c.trim()), (c = ""));
      else c += ch;
    }
    out.push(c.trim());
    return out;
  };
  const headers = split(first);
  return { headers, rows: lines.slice(1).map(split) };
}

export function guessKey(headers: string[]): number {
  const pref = [/^(tag|tag ?name|point|point ?name)$/i, /^(device|name|ied|equipment|asset ?tag)$/i, /^(cable ?id|id)$/i, /tag|name|device|id/i];
  for (const re of pref) {
    const i = headers.findIndex((h) => re.test(h.trim()));
    if (i >= 0) return i;
  }
  return 0;
}

export interface Change {
  section: string;
  kind: "added" | "removed" | "changed";
  key: string;
  fields: { field: string; from: string; to: string }[];
  impact?: string;
}

export interface TableDiffOpts {
  keyCols: number[]; // composite key
  ignore?: string[];
  caseSensitive?: boolean;
}

export function diffTables(section: string, a: Table, b: Table, o: TableDiffOpts): { changes: Change[]; dupA: string[]; dupB: string[]; onlyColsA: string[]; onlyColsB: string[] } {
  const norm = (v: string) => (o.caseSensitive ? String(v ?? "").trim() : String(v ?? "").trim().toLowerCase());
  const keyOf = (h: string[], r: string[]) => o.keyCols.map((i) => String(r[i] ?? "").trim()).join(" | ");
  const ign = new Set((o.ignore ?? []).map((x) => x.toLowerCase()));
  const index = (t: Table) => {
    const m = new Map<string, string[]>(), dup: string[] = [];
    for (const r of t.rows) {
      const k = keyOf(t.headers, r);
      if (!k.replace(/[| ]/g, "")) continue;
      const kk = norm(k);
      if (m.has(kk)) dup.push(k);
      else m.set(kk, r);
    }
    return { m, dup };
  };
  const ia = index(a), ib = index(b);
  // match columns by header name so a reordered sheet still compares correctly
  const cols = [...new Set([...a.headers, ...b.headers])].filter((h) => !ign.has(h.toLowerCase()));
  const colA = new Map(a.headers.map((h, i) => [h, i])), colB = new Map(b.headers.map((h, i) => [h, i]));
  const changes: Change[] = [];
  for (const [kk, rb] of ib.m) {
    const ra = ia.m.get(kk);
    const key = keyOf(b.headers, rb);
    if (!ra) {
      changes.push({ section, kind: "added", key, fields: [] });
      continue;
    }
    const fields: Change["fields"] = [];
    for (const h of cols) {
      const va = colA.has(h) ? ra[colA.get(h)!] ?? "" : "", vb = colB.has(h) ? rb[colB.get(h)!] ?? "" : "";
      if (!colA.has(h) || !colB.has(h)) continue;
      if (norm(va) !== norm(vb)) fields.push({ field: h, from: va, to: vb });
    }
    if (fields.length) changes.push({ section, kind: "changed", key, fields });
  }
  for (const [kk, ra] of ia.m) if (!ib.m.has(kk)) changes.push({ section, kind: "removed", key: keyOf(a.headers, ra), fields: [] });
  return { changes, dupA: ia.dup, dupB: ib.dup, onlyColsA: a.headers.filter((h) => !colB.has(h)), onlyColsB: b.headers.filter((h) => !colA.has(h)) };
}

// ------------------------------------------------------------------ SCL NetStudio projects
/* eslint-disable @typescript-eslint/no-explicit-any */
const s = (x: any) => (x == null ? "" : Array.isArray(x) ? x.join(", ") : typeof x === "object" ? Object.entries(x).filter(([, v]) => v).map(([k, v]) => (v === 1 || v === true ? k : `${k}=${v}`)).join(", ") : String(x));

function tablesOfProject(p: any): Record<string, Table> {
  const T = (headers: string[], rows: any[][]): Table => ({ headers, rows: rows.map((r) => r.map(s)) });
  return {
    Devices: T(["Name", "Description", "Bay", "Role", "Networks", "Station switch", "Process switch", "IP addresses"], (p.ieds ?? []).map((d: any) => [d.name, d.desc, d.bay, d.role, d.nets, d.sw, d.swp, d.ips])),
    Switches: T(["Name", "Network", "Port speed", "Uplink", "Ports", "Description", "Mgmt IP"], (p.switches ?? []).map((w: any) => [w.name, w.bus, w.speed, w.uplink, w.ports, w.desc, w.ip])),
    "IP segments": T(["Segment", "Network", "Hosts", "Growth %"], (p.ip?.segs ?? []).map((g: any) => [g.name, g.role, g.hosts, g.growth])),
    "GOOSE / SV streams": T(["Stream", "Type", "Data set", "Members", "Subscribers", "MAC", "APPID", "VLAN", "Priority", "MinTime", "MaxTime", "confRev"], (p.streams ?? []).map((x: any) => [`${x.pub}/${x.ld}/${x.cb}`, x.type, x.datSet, x.members, x.subs, x.mac, x.appid, x.vlan, x.prio, x.minT, x.maxT, x.confRev])),
    "Firewall rules": T(["Rule", "Purpose"], (p.fw?.rules ?? []).map((r: any) => [`${r.from} → ${r.to} : ${r.svc}`, r.note])),
    Assets: T(["Tag", "Panel", "Manufacturer", "Model", "Firmware", "Serial", "MAC", "Status"], [...(p.ieds ?? []), ...(p.switches ?? [])].map((x: any) => [x.name, x.asset?.panel, x.asset?.mfr, x.asset?.model, x.asset?.fw, x.asset?.serial, x.asset?.mac, x.asset?.status])),
    "Cable overrides": T(["Link", "Port A", "Port B", "Medium", "Length m", "Trunk", "Cores", "Panel A", "Panel B", "Cable ID"], Object.entries(p.lk ?? {}).map(([k, v]: [string, any]) => [k, v.pa, v.pb, v.media, v.len, v.trunk, v.cores, v.ppA, v.ppB, v.id])),
  };
}

const IMPACT: Record<string, (c: Change) => string | undefined> = {
  Devices: (c) => (c.kind === "changed" && c.fields.some((f) => f.field === "IP addresses") ? "IP address changed: update the IP register, the SCD Communication section, firewall rules and the SCADA/gateway connection, then retest the connection." : c.kind !== "changed" ? "Device added or removed: update the SCD, switch port plan, cable schedule, asset register and test sheets." : undefined),
  Switches: () => "Switch change: review port plan, VLAN membership, bandwidth and the switch configuration.",
  "GOOSE / SV streams": (c) =>
    c.kind === "changed" && c.fields.some((f) => /Data set|Members|confRev/.test(f.field))
      ? "Data set or confRev changed: raise confRev, reload the publisher AND every subscriber, and retest the signals end to end."
      : c.kind === "changed" && c.fields.some((f) => /MAC|APPID|VLAN|Priority/.test(f.field))
        ? "Addressing changed: update switch VLAN membership and static multicast filters, the subscribers' configuration, and retest with a capture."
        : c.kind === "changed" && c.fields.some((f) => f.field === "Subscribers")
          ? "Subscribers changed: configure the new subscribers, update VLAN membership of their ports, and test the new paths."
          : c.kind !== "changed" ? "Stream added or removed: update the SCD, subscribers, switch filters and the FAT/SAT test sheets." : undefined,
  "Firewall rules": () => "Firewall conduit changed: security review and approval before implementation; retest the affected service.",
  Assets: (c) => (c.fields.some((f) => f.field === "Firmware") ? "Firmware changed: check it is on the approved list, record it in the configuration log, and repeat the functional tests the release notes require." : undefined),
  "IP segments": () => "Address plan changed: re-run the IP plan and check every device address and gateway.",
};

export function diffProjects(a: any, b: any): Change[] {
  const ta = tablesOfProject(a), tb = tablesOfProject(b);
  const out: Change[] = [];
  for (const sec of Object.keys(ta)) {
    const { changes } = diffTables(sec, ta[sec], tb[sec], { keyCols: [0], caseSensitive: true });
    for (const c of changes) out.push({ ...c, impact: IMPACT[sec]?.(c) });
  }
  const scal = (label: string, va: any, vb: any) => {
    if (JSON.stringify(va) !== JSON.stringify(vb)) out.push({ section: "Project settings", kind: "changed", key: label, fields: [{ field: label, from: s(va), to: s(vb) }] });
  };
  scal("Project name", a.name, b.name);
  scal("Architecture", a.arch, b.arch);
  scal("Address block", a.ip?.block, b.ip?.block);
  scal("VLAN rules", a.vr, b.vr);
  return out;
}

export type DocKind = "netstudio" | "collector" | "table";
export function detectKind(text: string): DocKind {
  const t = String(text || "").replace(/^﻿/, "").trim();
  if (t.startsWith("{")) {
    try {
      const j = JSON.parse(t);
      if (j.format === "AJ Collector report") return "collector";
      if (j.ieds && j.streams) return "netstudio";
    } catch {
      /* not JSON */
    }
  }
  return "table";
}

export function diffCollector(a: any, b: any): Change[] {
  return compareReports(a, b).map((c) => ({ section: c.area, kind: c.kind, key: c.text, fields: [], impact: c.area === "Administrators" || c.area === "Firewall rules" || c.area === "Listening ports" ? "Security-relevant change: confirm it matches an approved change request." : undefined }));
}

export function changesCsv(ch: Change[]): string {
  const e = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const L = ["Section,Change,Item,Field,From,To,Impact"];
  for (const c of ch) {
    if (!c.fields.length) L.push([c.section, c.kind, c.key, "", "", "", c.impact ?? ""].map(e).join(","));
    else c.fields.forEach((f, i) => L.push([c.section, c.kind, c.key, f.field, f.from, f.to, i === 0 ? c.impact ?? "" : ""].map(e).join(",")));
  }
  return L.join("\r\n");
}
