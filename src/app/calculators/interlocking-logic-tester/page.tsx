"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard } from "@/components/fields";
import { testAll, testSheetCsv, SAMPLE_SIGNALS, SAMPLE_IMPL, SAMPLE_SPEC, type RuleResult } from "@/lib/interlock";

type Sev = "error" | "warning" | "info" | "ok";
const SEV: Record<Sev, [string, string]> = { error: ["Error", "text-fail"], warning: ["Warning", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const th = "py-1 pr-3 text-left font-normal text-muted", td = "py-1 pr-3 align-top";
const ta = "w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground";

function Rule({ r }: { r: RuleResult }) {
  const [show, setShow] = useState<"none" | "mism" | "rel" | "tests">(r.mismatches.length ? "mism" : "tests");
  const worst: Sev = r.findings.some((f) => f.sev === "error") ? "error" : r.findings.some((f) => f.sev === "warning") ? "warning" : "ok";
  return (
    <ResultCard title={`${r.rule.name}`}>
      <p className="mb-2 font-mono text-xs text-muted">{r.rule.text}</p>
      <p className="mb-3 text-sm text-muted"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[worst][1]}`}>{SEV[worst][0]}</span>{r.inputs.length} inputs · {r.total.toLocaleString()} combinations · released in {r.releases.toLocaleString()}{r.specMissing ? " · no specification to compare" : ` · ${r.mismatches.length} difference(s) from the specification`}</p>
      <ul className="space-y-2">{r.findings.map((f, i) => <li key={i} className="text-sm"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
      {r.total > 0 && (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {([["mism", `Differences (${r.mismatches.length})`], ["rel", `Released states (${r.releases})`], ["tests", `Test steps (${r.tests.length})`]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setShow(show === k ? "none" : k)} className={`rounded-full border px-3 py-1 text-xs ${show === k ? "border-accent text-accent" : "border-border text-muted"}`}>{l}</button>)}
          </div>
          {show === "mism" && r.mismatches.length > 0 && (
            <div className="mt-2 max-h-72 overflow-auto"><table className="w-full text-xs"><thead><tr>{r.inputs.map((n) => <th key={n} className={th}>{n}</th>)}<th className={th}>Implemented</th><th className={th}>Specification</th></tr></thead>
              <tbody>{r.mismatches.slice(0, 200).map((m, i) => <tr key={i} className="border-t border-border text-foreground">{r.inputs.map((n) => <td key={n} className={`${td} font-mono`}>{m.vals[n]}</td>)}<td className={`${td} ${m.impl ? "text-fail" : ""}`}>{m.impl ? "released" : "blocked"}</td><td className={td}>{m.spec ? "released" : "blocked"}</td></tr>)}</tbody></table>{r.mismatches.length > 200 && <p className="text-xs text-muted">First 200 of {r.mismatches.length}.</p>}</div>
          )}
          {show === "rel" && (
            <div className="mt-2 max-h-72 overflow-auto"><table className="w-full text-xs"><thead><tr>{r.inputs.map((n) => <th key={n} className={th}>{n}</th>)}</tr></thead>
              <tbody>{r.combos.filter((c) => c.release).slice(0, 300).map((c, i) => <tr key={i} className="border-t border-border text-foreground">{r.inputs.map((n) => <td key={n} className={`${td} font-mono`}>{c.vals[n]}</td>)}</tr>)}</tbody></table></div>
          )}
          {show === "tests" && (
            <div className="mt-2 max-h-72 overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Step</th><th className={th}>Initial state</th><th className={th}>Action</th><th className={th}>Expected</th></tr></thead>
              <tbody>{r.tests.map((t) => <tr key={t.step} className="border-t border-border text-foreground"><td className={td}>{t.step}</td><td className={`${td} font-mono`}>{Object.entries(t.setup).map(([k, v]) => `${k}=${v}`).join(" ")}</td><td className={td}>{t.action}</td><td className={`${td} ${t.expect === "BLOCKED" ? "text-accent" : "text-pass"}`}>{t.expect}</td></tr>)}</tbody></table></div>
          )}
        </>
      )}
    </ResultCard>
  );
}

export default function InterlockingLogicTesterPage() {
  const [sig, setSig] = useState("");
  const [impl, setImpl] = useState("");
  const [spec, setSpec] = useState("");
  const res = useMemo(() => (sig.trim() && impl.trim() ? testAll(sig, impl, spec) : null), [sig, impl, spec]);
  const sample = () => { setSig(SAMPLE_SIGNALS); setImpl(SAMPLE_IMPL); setSpec(SAMPLE_SPEC); };
  const exportCsv = () => { if (!res) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([testSheetCsv(res.res)], { type: "text/csv" })); a.download = "interlocking-test-sheet.csv"; a.click(); URL.revokeObjectURL(a.href); };
  const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent";
  const tot = res ? { e: res.res.reduce((n, r) => n + r.findings.filter((f) => f.sev === "error").length, 0), w: res.res.reduce((n, r) => n + r.findings.filter((f) => f.sev === "warning").length, 0) } : null;
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Interlocking Logic Tester (IEC 61850 / GOOSE, offline)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Write the interlocking release conditions of a bay as they are configured in the bay controller, and optionally as the
          specification states them. The tester evaluates every combination of switchgear positions — including intermediate and bad
          positions — compares the implementation with the specification, checks that a lost, invalid or test-mode GOOSE input blocks,
          and writes the FAT / SAT test steps.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Interlocking Logic Tester" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Interlocking prevents switching that would endanger people or plant — closing an earth switch onto a live line, opening a disconnector under load. With IEC 61850 the positions of other bays arrive by GOOSE, so the logic also has to block when a message is lost, invalid or from a device in test. A misplaced bracket or a '!=' test in one condition can release an operation in hundreds of position combinations that nobody tests by hand. Testing the logic exhaustively before the FAT finds these errors on paper."
            standards={["IEC 61850-7-4 (CILO interlocking: EnaOpn / EnaCls release; CSWI)", "IEC 61850-7-3 (Dbpos: intermediate 00, off 01, on 10, bad 11; quality)", "IEC 61850-8-1 (GOOSE time allowed to live; simulation / test)", "IEC 61850-10 and IEC 62271 (testing; switchgear interlocking principles)"]}
            capabilities={[
              "Conditions in plain notation: QA1 = OFF & QC1 = OFF & (QB2 = OFF | BC_QA1 = ON), with ON / OFF / INT / BAD (also CLOSED / OPEN), &, |, !, AND, OR, NOT, brackets; single points as bare names.",
              "Evaluates each condition over every combination of its inputs (four states per double point, two per single point, up to 65 536 combinations) with fail-safe logic: a BAD position, an invalid, lost or test input makes its comparison unknown, and unknown never releases.",
              "Compares the implemented logic with the specification combination by combination: unsafe differences (released where the specification blocks) and restrictive ones.",
              "Shows where an implementation that ignores quality and GOOSE supervision would still release, where a BAD position satisfies a '!=' test, contradictions and conditions that block nothing; writes test steps (each input changed from a released state, each GOOSE interrupted) as CSV.",
            ]}
            example={{
              problem: "A double-busbar feeder: bus disconnectors QB1/QB2, line disconnector QB9, earth switches QC1, QC2, QC9 and the bus coupler positions by GOOSE.",
              steps: ["QB1 is written without brackets: '… & QB2 = OFF | BC_QA1 = ON & …'. Because & binds before |, the bus-coupler branch alone releases QB1 — even with QA1 closed or an earth switch closed: 252 unsafe combinations.", "QA1 close uses '!= INT': a BAD (11) position of a disconnector then satisfies it.", "QC9 depends on LINE_V by GOOSE: if the IED does not supervise the GOOSE, a lost message keeps 'no voltage' and releases the earth switch."],
              result: "One unsafe condition, three '!=' weaknesses and the GOOSE inputs that need supervision — plus a test sheet for the FAT.",
            }}
            notes="The tester checks the logic you write, not the bay controller: transcribe the configured logic exactly (including operator precedence as the tool applies it) and confirm the results in the FAT. Operator precedence here: NOT before AND before OR, as in IEC 61131-3 and most configuration tools — check your tool's rule."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Signals">
              <button type="button" onClick={sample} className={btn}>Load the double-busbar example</button>
              <textarea value={sig} onChange={(e) => setSig(e.target.value)} rows={9} spellCheck={false} aria-label="Signals" placeholder={"QA1  DPS  local  Circuit breaker\nBC_QA1  DPS  GOOSE BCU_BC  Bus coupler CB"} className={`mt-3 ${ta}`} />
            </Section>
            <Section title="Implemented logic">
              <textarea value={impl} onChange={(e) => setImpl(e.target.value)} rows={7} spellCheck={false} aria-label="Implemented logic" placeholder="QB1 operate: QA1 = OFF & QC1 = OFF & QC2 = OFF" className={ta} />
            </Section>
            <Section title="Specification (optional)">
              <textarea value={spec} onChange={(e) => setSpec(e.target.value)} rows={6} spellCheck={false} aria-label="Specification" placeholder="Same names as the implemented logic" className={ta} />
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {res && tot && (
              <>
                <div className={`rounded-xl border p-5 ${tot.e ? "border-fail/50 bg-fail/10" : tot.w ? "border-accent/50 bg-accent/10" : "border-pass/50 bg-pass/10"}`}>
                  <div className="text-lg font-semibold text-foreground">{tot.e ? `${tot.e} error(s) in the interlocking logic` : tot.w ? "No errors — weaknesses to review" : "Logic consistent and fail-safe"}</div>
                  <div className="mt-1 text-sm text-muted">{res.res.length} condition(s), {res.sigs.length} signals{res.unused.length ? ` · not used: ${res.unused.map((s) => s.name).join(", ")}` : ""}{res.extraSpec.length ? ` · in the specification only: ${res.extraSpec.map((s) => s.name).join(", ")}` : ""}</div>
                  <button type="button" onClick={exportCsv} className="mt-3 rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export test sheet (CSV)</button>
                </div>
                {res.errs.length > 0 && <ResultCard title="Signal list"><ul className="space-y-1">{res.errs.map((e, i) => <li key={i} className="text-sm text-fail">{e}</li>)}</ul></ResultCard>}
                {res.res.map((r, i) => <Rule key={r.rule.name + i} r={r} />)}
              </>
            )}
            {!res && <ResultCard title="Result"><p className="text-muted">Enter the signals and the logic, or load the example.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
