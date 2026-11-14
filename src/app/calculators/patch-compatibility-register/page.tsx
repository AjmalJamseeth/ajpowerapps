"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { machineFromReport, parseApprovals, analysePatches, matrixCsv, type Machine } from "@/lib/patchreg";

const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const ST: Record<string, string> = { Approved: "text-pass", "Not approved": "text-fail", Withdrawn: "text-fail", "Under test": "text-accent" };

export default function PatchRegisterPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [appr, setAppr] = useState("");
  const [pairs, setPairs] = useState("");
  const [err, setErr] = useState("");
  const r = useMemo(() => (machines.length ? analysePatches(machines, parseApprovals(appr), pairs) : null), [machines, appr, pairs]);
  const addReports = (files: FileList | null) => { if (!files) return; Array.from(files).forEach((f) => { const rd = new FileReader(); rd.onload = () => { try { const j = JSON.parse(String(rd.result).replace(/^﻿/, "")); if (j.format !== "AJ Collector report") throw new Error("not an AJ Collector report"); const m = machineFromReport(j); setMachines((p) => [...p.filter((x) => x.name !== m.name), m]); } catch (e) { setErr(`${f.name}: ${(e as Error).message}`); } }; rd.readAsText(f); }); };
  const onAppr = (f?: File) => { if (!f) return; const rd = new FileReader(); rd.onload = () => setAppr(String(rd.result || "")); rd.readAsText(f); };
  const sample = async () => { const [a, b, c] = await Promise.all(["/samples/AJCollector_SAMPLE_SCADA-SRV01.json", "/samples/AJCollector_SAMPLE_SCADA-SRV02.json", "/samples/S13_vendor_patch_approvals.csv"].map((u) => fetch(u).then((x) => x.text()))); setMachines([machineFromReport(JSON.parse(a)), machineFromReport(JSON.parse(b))]); setAppr(c); setPairs("SCADA-SRV01=SCADA-SRV02"); setErr(""); };
  const exportCsv = () => { if (!r) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([matrixCsv(r)], { type: "text/csv" })); a.download = "patch-register.csv"; a.click(); URL.revokeObjectURL(a.href); };
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCADA Patch Compatibility Register</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Load the AJ Collector reports of your SCADA servers and workstations and the SCADA vendor&apos;s list of approved Windows updates: see
          which updates are installed where, which are not approved or still under test, which approved ones are missing, and whether redundant
          servers run the same patch level.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SCADA Patch Compatibility Register" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="SCADA vendors test Microsoft updates against their software before approving them; an untested update can break OPC DA, a driver or the redundancy. At the same time, missing approved security updates leave known vulnerabilities open. A register that compares what is installed with what is approved — computer by computer, and between redundant pairs — keeps both under control."
            standards={["IEC 62443-2-3: patch management in the IACS environment", "IEC 62443-2-1: security program — change and patch management", "SCADA vendor patch approval lists"]}
            capabilities={[
              "Reads the installed updates from any number of AJ Collector reports.",
              "Reads the vendor approval list (CSV with KB, status, date, note); status words such as approved, not approved, under test and withdrawn are recognised.",
              "Flags updates installed but not approved, withdrawn or still under test, approved updates missing, updates the vendor has not assessed, and old patch levels.",
              "Compares redundant pairs (for example main and standby servers) and their operating systems.",
              "Matrix of updates × computers with vendor status, exportable to CSV.",
            ]}
            example={{
              problem: "SCADA-SRV01 and SCADA-SRV02 (a redundant pair) against the vendor's list.",
              steps: ["SRV02 has KB5039217, which the vendor did not approve (breaks OPC DA DCOM authentication).", "SRV02 lacks the approved KB5037765; both lack approved KB5040430.", "The pair differs, so a failover runs on a different patch level from the one tested."],
              result: "Remove or justify KB5039217 on SRV02 with the vendor, then install the missing approved updates on both servers in one maintenance window.",
            }}
            notes="The register relies on the update list Windows reports (Get-HotFix), which lists most but not all update types. The vendor's approval list is the authority; keep it current."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Section title="Computers (AJ Collector reports)">
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Add report(s)…<input type="file" multiple accept=".json" className="hidden" onChange={(e) => addReports(e.target.files)} /></label>
              <button type="button" onClick={sample} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample</button>
              {machines.length > 0 && <button type="button" onClick={() => setMachines([])} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Clear</button>}
            </div>
            <ul className="mt-2 text-sm text-foreground">{machines.map((m) => <li key={m.name}>{m.name} — {m.os} · {m.hotfixes.size} updates · report {m.collected}</li>)}</ul>
            {err && <p className="mt-2 text-sm text-fail">{err}</p>}
            <TextField label="Redundant pairs" placeholder="SCADA-SRV01=SCADA-SRV02; HIST-A=HIST-B" value={pairs} onChange={setPairs} />
          </Section>
          <Section title="Vendor approval list">
            <label className="inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open CSV…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => onAppr(e.target.files?.[0])} /></label>
            <textarea value={appr} onChange={(e) => setAppr(e.target.value)} rows={7} spellCheck={false} aria-label="Approval list" placeholder={"KB,Status,Date,Note\nKB5034127,Approved,2026-02-20,"} className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
          </Section>
        </div>
        {r && (
          <div className="mt-6 space-y-4">
            <ResultCard title="Findings"><ul className="space-y-2">{r.findings.map((f, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul></ResultCard>
            <ResultCard title="Updates × computers">
              <div className="mb-2 flex"><button type="button" onClick={exportCsv} className="ml-auto rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export CSV</button></div>
              <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted"><th className="py-1 pr-2">Update</th><th className="py-1 pr-2">Vendor status</th>{r.machines.map((m) => <th key={m.name} className="py-1 pr-2">{m.name}</th>)}</tr></thead>
                <tbody>{r.kbs.map((k) => { const a = r.approval.get(k); return <tr key={k} className="border-t border-border text-foreground"><td className="py-1 pr-2 font-mono">{k}</td><td className={`py-1 pr-2 ${a ? ST[a.status] : "text-muted"}`}>{a ? a.status : "not listed"}{a?.note ? <div className="text-muted">{a.note}</div> : null}</td>{r.machines.map((m) => { const d = m.hotfixes.get(k); return <td key={m.name} className={`py-1 pr-2 ${d ? "" : a?.status === "Approved" ? "text-accent" : "text-muted"}`}>{d || (a?.status === "Approved" ? "missing" : "—")}</td>; })}</tr>; })}</tbody></table></div>
            </ResultCard>
          </div>
        )}
      </div>
    </div>
  );
}
