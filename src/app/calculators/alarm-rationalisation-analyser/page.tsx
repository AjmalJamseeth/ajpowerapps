"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { parseAlarms, alarmKpi } from "@/lib/opsanalysis";

const iso = (t: number) => new Date(t * 1000).toISOString().slice(0, 16).replace("T", " ");

export default function AlarmRationalisationPage() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [ops, setOps] = useState("1");
  const r = useMemo(() => { if (!text.trim()) return null; const p = parseAlarms(text); return p.err ? { err: p.err, k: null } : { err: "", k: alarmKpi(p.alarms, Number(ops) || 1) }; }, [text, ops]);
  const open = (f?: File) => { if (f) f.text().then((t) => { setText(t); setName(f.name); }); };
  const sample = () => fetch("/samples/S13_SCADA_alarm_journal.csv").then((x) => x.text()).then((t) => { setText(t); setName("sample: S13 alarm journal, 7 days"); });
  const k = r?.k;
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Alarm Rationalisation Analyser (EEMUA 191 / ISA-18.2)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Measure the alarm system from the SCADA alarm journal: alarm rate per operator, floods, the most frequent alarms, chattering and
          standing alarms, priority distribution and consequential alarms — against the EEMUA 191 and ISA-18.2 / IEC 62682 guidance — so
          the rationalisation starts where it pays most.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Alarm Rationalisation Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="When every event becomes an alarm, operators stop reading them: a real trip is lost in a flood of door-open and spring-charging alarms, and a standing alarm trains everyone to ignore its colour. Alarm management standards define measurable targets; the journal the SCADA already keeps is enough to measure them and find the few alarms that cause most of the load."
            standards={["EEMUA Publication 191 (alarm systems: rates, floods, priority distribution)", "ANSI/ISA-18.2 and IEC 62682 (alarm management life cycle and key performance indicators)"]}
            capabilities={["Reads an alarm journal CSV (time, tag, description, state alarm/return/ack, priority 1–3 or high/medium/low).", "Average alarms per 10 minutes and per day per operator, peak 10-minute rate, percentage of flood periods and each flood with its main contributors.", "Top 10 alarms and their share, chattering alarms (3 within a minute), standing alarms (active over 24 h), priority distribution, consequential pairs (B follows A within 2 s at least 80 % of the time)."]}
            example={{ problem: "Seven days of the S13 SCADA alarm journal.", steps: ["Average 0.96 alarms per 10 minutes — acceptable on average, but two floods: the T1 fan supply chattering (31 alarms) and the line trip (72 alarms in one period).", "Three nuisance alarms (J01 spring, GPS sync, panel door) are 29 % of all alarms; the battery charger fault has been standing for 88 h.", "30 % of alarms are high priority (guidance about 5 %); Q01 line dead always follows Q01 CB open."], result: "Fix the fan supply and the three nuisance alarms, deal with the standing alarm, re-prioritise and suppress the consequential one." }}
            notes="The figures depend on the journal: export alarms (not all events) over at least a week of normal operation. Rates are divided by the number of operator positions entered."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Section title="Alarm journal">
            <div className="flex flex-col gap-2">
              <label className={`cursor-pointer ${btn}`}>Open journal (CSV)…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => open(e.target.files?.[0])} /></label>
              <button type="button" onClick={sample} className={btn}>Load sample</button>
            </div>
            <p className="mt-2 text-xs text-muted">{name}</p>
            <div className="mt-2"><TextField label="Operator positions" value={ops} onChange={setOps} /></div>
          </Section>
          <div className="space-y-6 lg:col-span-2">
            {r?.err && <ResultCard title="Cannot read"><p className="text-fail">{r.err}</p></ResultCard>}
            {k && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[["Alarms", k.total], ["Per day", k.perDay.toFixed(0)], ["Per 10 min", k.per10.toFixed(2)], ["Peak 10 min", k.peak10.toFixed(0)]].map(([l, v]) => <div key={String(l)} className="rounded-lg border border-border bg-surface p-3"><div className="text-xs text-muted">{l}</div><div className="mt-1 text-lg font-semibold text-foreground">{v}</div></div>)}
                </div>
                <ResultCard title="Assessment"><FindingList list={k.findings} /></ResultCard>
                <ResultCard title="Most frequent alarms">
                  <table className="w-full text-sm"><thead><tr><th className={th}>Tag</th><th className={th}>Description</th><th className={th}>Count</th><th className={th}>Share</th></tr></thead>
                    <tbody>{k.top.map((x) => <tr key={x.tag} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{x.tag}</td><td className={td}>{x.desc}</td><td className={td}>{x.n}</td><td className={td}>{x.pct.toFixed(1)} %</td></tr>)}</tbody></table>
                </ResultCard>
                {k.floods.length > 0 && <ResultCard title="Floods"><table className="w-full text-sm"><thead><tr><th className={th}>From</th><th className={th}>To</th><th className={th}>Alarms</th><th className={th}>Main contributors</th></tr></thead><tbody>{k.floods.map((f) => <tr key={f.start} className="border-t border-border text-foreground"><td className={td}>{iso(f.start)}</td><td className={td}>{iso(f.end).slice(11)}</td><td className={td}>{f.count}</td><td className={td}>{f.top.join(", ")}</td></tr>)}</tbody></table></ResultCard>}
                <ResultCard title="Priority distribution">
                  {(["high", "medium", "low"] as const).map((p) => { const tot = k.prio.high + k.prio.medium + k.prio.low || 1, pct = (100 * k.prio[p]) / tot, tgt = { high: 5, medium: 15, low: 80 }[p]; return <div key={p} className="mb-2"><div className="flex justify-between text-sm text-foreground"><span>{p}</span><span>{pct.toFixed(0)} % (guidance ~{tgt} %)</span></div><div className="mt-1 h-2 rounded bg-surface-2"><div className={`h-2 rounded ${p === "high" ? "bg-fail" : p === "medium" ? "bg-accent" : "bg-accent-2"}`} style={{ width: `${Math.min(100, pct)}%` }} /></div></div>; })}
                </ResultCard>
              </>
            )}
            {!r && <ResultCard title="Result"><p className="text-muted">Open an alarm journal or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
