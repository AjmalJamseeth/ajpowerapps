"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { parseTable, diffTables, guessKey, diffProjects, diffCollector, detectKind, changesCsv, type Change } from "@/lib/changecompare";

const KIND: Record<string, string> = { added: "text-accent", removed: "text-fail", changed: "text-accent-2" };
const SAMPLES = [
  { label: "IP register: rev A → rev B", a: "/samples/S13_IP_register_with_errors.csv", b: "/samples/S13_IP_register_rev_B.csv" },
  { label: "SCL NetStudio project: rev A → rev B", a: "/samples/S13_NetStudio_project.nsproj.json", b: "/samples/S13_NetStudio_project_rev_B.nsproj.json" },
];

export default function ChangeComparisonPage() {
  const [ta, setTa] = useState("");
  const [tb, setTb] = useState("");
  const [na, setNa] = useState("");
  const [nb, setNb] = useState("");
  const [key, setKey] = useState(-1);
  const [key2, setKey2] = useState(-1);
  const [ignore, setIgnore] = useState("");
  const [err, setErr] = useState("");
  const kind = ta && tb ? (detectKind(ta) === detectKind(tb) ? detectKind(ta) : "mixed") : null;
  const tabA = useMemo(() => (kind === "table" ? parseTable(ta) : null), [ta, kind]);
  const tabB = useMemo(() => (kind === "table" ? parseTable(tb) : null), [tb, kind]);
  const k1 = tabA ? (key >= 0 ? key : guessKey(tabA.headers)) : 0;
  const res = useMemo(() => {
    try {
      if (!kind || kind === "mixed") return null;
      if (kind === "netstudio") return { changes: diffProjects(JSON.parse(ta.replace(/^﻿/, "")), JSON.parse(tb.replace(/^﻿/, ""))), notes: [] as string[] };
      if (kind === "collector") return { changes: diffCollector(JSON.parse(ta.replace(/^﻿/, "")), JSON.parse(tb.replace(/^﻿/, ""))), notes: [] };
      const d = diffTables("Table", tabA!, tabB!, { keyCols: key2 >= 0 ? [k1, key2] : [k1], ignore: ignore.split(",").map((x) => x.trim()).filter(Boolean) });
      const notes: string[] = [];
      if (d.dupA.length) notes.push(`Duplicate keys in version A (only the first is compared): ${d.dupA.slice(0, 8).join(", ")}`);
      if (d.dupB.length) notes.push(`Duplicate keys in version B: ${d.dupB.slice(0, 8).join(", ")}`);
      if (d.onlyColsA.length) notes.push(`Columns only in A: ${d.onlyColsA.join(", ")}`);
      if (d.onlyColsB.length) notes.push(`Columns only in B: ${d.onlyColsB.join(", ")}`);
      return { changes: d.changes, notes };
    } catch (e) {
      return { changes: [] as Change[], notes: [] as string[], error: (e as Error).message };
    }
  }, [kind, ta, tb, tabA, tabB, k1, key2, ignore]);
  const read = (f: File | undefined, side: "a" | "b") => { if (!f) return; const r = new FileReader(); r.onload = () => { const t = String(r.result || ""); if (side === "a") { setTa(t); setNa(f.name); } else { setTb(t); setNb(f.name); } setKey(-1); setKey2(-1); setErr(""); }; r.readAsText(f); };
  const sample = async (i: number) => { const s = SAMPLES[i]; const [x, y] = await Promise.all([fetch(s.a).then((r) => r.text()), fetch(s.b).then((r) => r.text())]); setTa(x); setTb(y); setNa(s.a.split("/").pop()!); setNb(s.b.split("/").pop()!); setKey(-1); setKey2(-1); setErr(""); };
  const sections = res ? [...new Set(res.changes.map((c) => c.section))] : [];
  const exportCsv = () => { if (!res) return; const el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([changesCsv(res.changes)], { type: "text/csv" })); el.download = "changes.csv"; el.click(); URL.revokeObjectURL(el.href); };
  const count = (k: Change["kind"]) => res?.changes.filter((c) => c.kind === k).length ?? 0;

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Network &amp; Configuration Change Comparison</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Compare the approved version of an engineering record with the current one and see exactly what was added, removed or changed — IP and
          asset registers, SCADA tag and point lists, port and cable lists (CSV or a copy from Excel), SCL NetStudio network projects, or AJ
          Collector reports — with what each kind of change means for testing and documentation.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Network & Configuration Change Comparison" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Most faults introduced during modifications come from a change nobody noticed: an IP address edited in one register, a data set changed without a new confRev, a firewall rule removed, a firmware updated on one relay. Comparing the approved baseline with the current version before and after every change makes each difference visible, so it can be checked, approved and tested."
            standards={["IEC 62443-2-1 / -3-3: change management and configuration control", "IEC 61850-6 engineering process (confRev, data sets, subscribers)", "Good engineering practice: compare, approve, implement, test, record"]}
            capabilities={[
              "Tables (CSV, tab-separated from Excel): rows matched by a key column (or two), columns matched by name, so reordered sheets compare correctly; ignored columns; duplicate keys reported.",
              "SCL NetStudio projects: devices, switches, IP segments, GOOSE/SV streams, firewall rules, assets and cable overrides compared section by section, with the impact of each change.",
              "AJ Collector reports: services, listening ports, administrators, users, software, updates, firewall and certificates.",
              "Export of all changes to CSV for the change record.",
            ]}
            example={{
              problem: "SCL NetStudio project rev A (approved) against rev B (after a design change).",
              steps: [
                "P132_Q02: IP 10.13.0.15 → 10.13.0.25 — update register, SCD, firewall and SCADA connection.",
                "P87T_T1 GCB_DIFF: members 6 → 7, confRev 1 → 2 — reload publisher and every subscriber, retest.",
                "New device P132_Q04 and a new subscriber of the interlocking GOOSE; one firewall conduit removed; P132_Q02 firmware 3.1.4 → 3.2.1.",
              ],
              result: "Eight changes, each with the documents to update and the tests to repeat before the revision is approved.",
            }}
            notes="Both files are read in your browser. For SCD/ICD/CID files use SCL Studio's Compare, which understands the SCL structure."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Section title="Version A (approved / previous)">
            <label className="inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open file…<input type="file" accept=".csv,.txt,.tsv,.json" className="hidden" onChange={(e) => read(e.target.files?.[0], "a")} /></label>
            <span className="ml-2 text-xs text-muted">{na}</span>
            <textarea value={ta} onChange={(e) => setTa(e.target.value)} rows={6} spellCheck={false} aria-label="Version A" placeholder="…or paste a table copied from Excel" className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
          </Section>
          <Section title="Version B (current / proposed)">
            <label className="inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open file…<input type="file" accept=".csv,.txt,.tsv,.json" className="hidden" onChange={(e) => read(e.target.files?.[0], "b")} /></label>
            <span className="ml-2 text-xs text-muted">{nb}</span>
            <textarea value={tb} onChange={(e) => setTb(e.target.value)} rows={6} spellCheck={false} aria-label="Version B" placeholder="…or paste a table copied from Excel" className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
          </Section>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">Examples:</span>
          {SAMPLES.map((s, i) => <button key={s.label} type="button" onClick={() => sample(i)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">{s.label}</button>)}
        </div>
        {kind === "table" && tabA && (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="text-sm text-muted">Key column<select value={k1} onChange={(e) => setKey(+e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground">{tabA.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}</select></label>
            <label className="text-sm text-muted">Second key column (optional)<select value={key2} onChange={(e) => setKey2(+e.target.value)} className="mt-1 block w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground"><option value={-1}>—</option>{tabA.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}</select></label>
            <TextField label="Ignore columns (comma separated)" placeholder="Last modified, Comment" value={ignore} onChange={setIgnore} />
          </div>
        )}
        {kind === "mixed" && <p className="mt-4 text-fail">The two files are of different kinds; compare two tables, two NetStudio projects or two collector reports.</p>}
        {err && <p className="mt-4 text-fail">{err}</p>}
        {res && "error" in res && <p className="mt-4 text-fail">Could not compare: {res.error}</p>}
        {res && !("error" in res) && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-lg font-semibold text-foreground">{res.changes.length ? `${res.changes.length} change(s)` : "No differences"}</span>
              <span className="text-sm text-accent">{count("added")} added</span><span className="text-sm text-fail">{count("removed")} removed</span><span className="text-sm text-accent-2">{count("changed")} changed</span>
              {res.changes.length > 0 && <button type="button" onClick={exportCsv} className="ml-auto rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Export changes (CSV)</button>}
            </div>
            {res.notes.map((n) => <p key={n} className="text-xs text-muted">{n}</p>)}
            {sections.map((sec) => (
              <ResultCard key={sec} title={sec}>
                <ul className="space-y-3">
                  {res.changes.filter((c) => c.section === sec).map((c, i) => (
                    <li key={i}>
                      <span className={`mr-2 text-xs font-semibold uppercase ${KIND[c.kind]}`}>{c.kind}</span><span className="font-mono text-sm text-foreground">{c.key}</span>
                      {c.fields.length > 0 && <ul className="mt-1 space-y-0.5 pl-6 text-sm">{c.fields.map((f) => <li key={f.field}><span className="text-muted">{f.field}:</span> <span className="text-fail line-through">{f.from || "—"}</span> → <span className="text-pass">{f.to || "—"}</span></li>)}</ul>}
                      {c.impact && <p className="mt-1 pl-6 text-xs text-accent">{c.impact}</p>}
                    </li>
                  ))}
                </ul>
              </ResultCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
