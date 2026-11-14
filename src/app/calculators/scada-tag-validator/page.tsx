"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { validateTags, type Sev } from "@/lib/tagvalidate";

const SEV: Record<Sev, [string, string]> = { error: ["Error", "text-fail"], warning: ["Warning", "text-accent"], info: ["Note", "text-accent-2"] };
const SAMPLE = "/samples/S13_SCADA_tag_list_with_errors.csv";

export default function ScadaTagValidatorPage() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [naming, setNaming] = useState("^[A-Z0-9]+_[A-Z0-9_]+$");
  const [filter, setFilter] = useState<Sev | "all">("all");
  const r = useMemo(() => (text.trim() ? validateTags(text, { naming }) : null), [text, naming]);
  const onFile = (f?: File) => { if (!f) return; const rd = new FileReader(); rd.onload = () => { setText(String(rd.result || "")); setName(f.name); }; rd.readAsText(f); };
  const sample = () => fetch(SAMPLE).then((x) => x.text()).then((t) => { setText(t); setName("sample tag list with seeded errors"); });
  const exportCsv = () => { if (!r) return; const e = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v); const L = ["Severity,Code,Lines,Finding", ...r.findings.map((f) => [f.sev, f.code, f.rows.join(" "), f.text].map(e).join(","))]; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([L.join("\r\n")], { type: "text/csv" })); a.download = "tag-findings.csv"; a.click(); URL.revokeObjectURL(a.href); };
  const shown = r ? r.findings.filter((f) => filter === "all" || f.sev === filter) : [];
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCADA Tag Database Validator</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Check a tag or point list exported from a SCADA, gateway or RTU configuration before it is loaded: duplicate tag names and addresses,
          missing descriptions and units, engineering ranges, alarm limits out of order, Modbus and IEC 104 addressing errors, naming rules and
          copied rows — each with its line number.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SCADA Tag Database Validator" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="A SCADA database of thousands of points is built by copying rows. Copy errors — two points on one address, a description not edited, Hi above HiHi, an analog value in the coil table — load without complaint and appear during point-to-point testing or, worse, in operation. Checking the list first finds them in seconds."
            standards={["Modbus Application Protocol V1.1b3 (data tables and addressing)", "IEC 60870-5-101/104 (information object addresses, common address)", "ISA-18.2 / EEMUA 191 alarm management principles (alarm limits and normal states)"]}
            capabilities={[
              "Reads CSV or a copy from Excel and finds the columns from their headings: tag, description, device, protocol, address/IOA, common address, type, unit, EU low/high, LoLo/Lo/Hi/HiHi, normal state, deadband.",
              "Duplicate tag names; duplicate addresses per device, common address, protocol and data table; empty addresses.",
              "Missing descriptions, duplicated descriptions (copied rows), units missing or spelt differently, tag names with spaces or breaking your naming rule.",
              "Engineering range and alarm limits: low ≥ high, limits out of order, limits outside the range, large deadbands; trip and alarm signals without a normal state.",
              "Modbus: analog values in the coil or discrete-input table; IEC 104: IOA outside 1–16 777 215.",
            ]}
            example={{
              problem: "The sample tag list: 20 points for a gateway (IEC 104) and a meter (Modbus).",
              steps: ["Q01_CB_POS appears twice; Q01_PROT_TRIP and Q02_PROT_TRIP share IOA 2002.", "Q02_I_A has Hi 1800 above HiHi 1600; T1 oil temperature HiHi 160 is above its 0–150 range.", "AUX_FREQ (analog) is at 00021, a coil address; kV is also written KV."],
              result: "5 errors, 7 warnings and 3 notes, each with its line — fixed before the database is loaded and tested.",
            }}
            notes="The validator checks the list for consistency. It cannot know whether an address matches the device's real register map — confirm that during point-to-point testing."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Tag list">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open CSV…<input type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
                <button type="button" onClick={sample} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample</button>
              </div>
              <p className="mt-1 text-xs text-muted">{name}</p>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} spellCheck={false} aria-label="Tag list" placeholder="Paste the tag list (first line = column headings)" className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
              <TextField label="Naming rule (regular expression, optional)" tip="Example: ^[A-Z0-9]+_[A-Z0-9_]+$ — bay code, underscore, signal code." value={naming} onChange={setNaming} />
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {r && (
              <>
                <div className={`rounded-xl border p-5 ${r.counts.error ? "border-fail/50 bg-fail/10" : r.counts.warning ? "border-accent/50 bg-accent/10" : "border-pass/50 bg-pass/10"}`}>
                  <div className="text-lg font-semibold text-foreground">{r.counts.error ? `${r.counts.error} error(s) to correct` : r.counts.warning ? "No errors — warnings to review" : "Tag list is consistent"}</div>
                  <div className="mt-1 text-sm text-muted">{r.rowCount} rows · {r.analog} analog · {r.digital} digital · columns recognised: {Object.keys(r.columns).join(", ")}</div>
                </div>
                <ResultCard title="Findings">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(["all", "error", "warning", "info"] as const).map((k) => <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-accent text-accent" : "border-border text-muted"}`}>{k === "all" ? `All (${r.findings.length})` : `${SEV[k][0]} (${r.counts[k]})`}</button>)}
                    <button type="button" onClick={exportCsv} className="ml-auto rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export CSV</button>
                  </div>
                  <ul className="space-y-2">{shown.map((f, i) => <li key={i} className="text-sm"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span>{f.rows.length > 0 && <span className="mr-2 font-mono text-xs text-muted">line {f.rows.join(", ")}</span>}<span className="text-foreground">{f.text}</span></li>)}</ul>
                </ResultCard>
              </>
            )}
            {!r && <ResultCard title="Result"><p className="text-muted">Open or paste a tag list, or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
