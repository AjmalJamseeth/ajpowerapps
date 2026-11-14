"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { parseCbOps, breakerWear } from "@/lib/powerassets";

export default function BreakerWearPage() {
  const [text, setText] = useState(""), [name, setName] = useState("");
  const [isc, setIsc] = useState("40"), [nsc, setNsc] = useState("30"), [ir, setIr] = useState("2000"), [nr, setNr] = useState("10000"), [mech, setMech] = useState("10000"), [om, setOm] = useState("30"), [tol, setTol] = useState("3");
  const r = useMemo(() => {
    if (!text.trim()) return null;
    const p = parseCbOps(text); if (p.err) return { err: p.err, w: null };
    const n = (s: string, d: number) => (Number.isFinite(Number(s)) && Number(s) > 0 ? Number(s) : d);
    return { err: "", w: breakerWear({ isc: n(isc, 40) * 1000, nsc: n(nsc, 30), ir: n(ir, 2000), nr: n(nr, 10000), mech: n(mech, 10000), openMs: n(om, 30), tolMs: n(tol, 3) }, p.ops) };
  }, [text, isc, nsc, ir, nr, mech, om, tol]);
  const w = r?.w;
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Circuit Breaker Wear &amp; Maintenance Analyser</h1>
        <p className="mt-2 max-w-3xl text-muted">Estimate how much of a breaker&apos;s electrical endurance each pole has used from the currents it has interrupted, check operations against the mechanical endurance and follow the opening time — to plan maintenance by condition instead of by calendar.</p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Circuit Breaker Wear Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="A breaker wears mainly when it interrupts current: a few high fault currents use more of the contacts than thousands of load operations. Relays and breaker monitors record the interrupted current of every trip; summing the wear per pole against the manufacturer's endurance curve tells which breakers need attention first."
            standards={["IEC 62271-100 (electrical endurance classes E1/E2, mechanical endurance M1/M2)", "IEC 62271-1 (common specifications)", "Manufacturer's electrical endurance curve (number of operations versus interrupted current)"]}
            capabilities={["Reads an operations history CSV: date, type, interrupted current per phase (kA) or one value, optional opening time (ms).", "Builds the endurance curve N(I) = Nr·(Ir / I)^n through two points (rated current and rated short-circuit current) and sums wear per pole: Σ 1 / N(Ii).", "Remaining fault interruptions at 25, 50 and 100 % of the rated short-circuit current; operations against mechanical endurance; opening time outside tolerance and its trend."]}
            example={{ problem: "QA1 of bay Q01 (40 kA, 30 operations at 40 kA, 10 000 at 2000 A) since 2021, including today's 5 kA earth fault.", steps: ["Pole A has used 5.1 % of its electrical endurance after five faults (the 31 kA three-phase fault of 2025 is the largest share).", "187 operations — far below the mechanical endurance.", "Opening time has risen by 3.7 ms to 33.8 ms, outside 30 ± 3 ms."], result: "Contacts are fine; the mechanism needs inspection (trip coil, lubrication)." }}
            notes="Use the manufacturer's curve values for the two points; the straight line on log–log axes is the usual approximation between them. Interrupted current from the relay is the RMS value at contact separation."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="Operations history">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open CSV…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0]?.text().then((t) => { setText(t); setName(e.target.files![0].name); })} /></label>
                <button type="button" onClick={() => fetch("/samples/S13_Q01_QA1_operations.csv").then((x) => x.text()).then((t) => { setText(t); setName("sample: Q01 QA1 since 2021"); })} className={btn}>Load sample</button>
              </div>
              <p className="mt-2 text-xs text-muted">{name}</p>
            </Section>
            <Section title="Breaker data">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Rated short-circuit breaking current (kA)" value={isc} onChange={setIsc} /><TextField label="Operations at that current" value={nsc} onChange={setNsc} />
                <TextField label="Rated normal current (A)" value={ir} onChange={setIr} /><TextField label="Operations at rated current" value={nr} onChange={setNr} />
                <TextField label="Mechanical endurance (operations)" value={mech} onChange={setMech} /><TextField label="Opening time (ms)" value={om} onChange={setOm} /><TextField label="Tolerance ± (ms)" value={tol} onChange={setTol} />
              </div>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {r?.err && <ResultCard title="Cannot read"><p className="text-fail">{r.err}</p></ResultCard>}
            {w && (
              <>
                <div className="grid grid-cols-3 gap-3">{(["A", "B", "C"] as const).map((p) => <div key={p} className="rounded-lg border border-border bg-surface p-3"><div className="text-xs text-muted">Pole {p} wear</div><div className={`mt-1 text-lg font-semibold ${w.wear[p] > 0.7 ? "text-fail" : "text-foreground"}`}>{(100 * w.wear[p]).toFixed(1)} %</div><div className="mt-1 h-2 rounded bg-surface-2"><div className="h-2 rounded bg-accent" style={{ width: `${Math.min(100, 100 * w.wear[p])}%` }} /></div></div>)}</div>
                <ResultCard title="Assessment"><FindingList list={w.findings} /><p className="mt-2 text-sm text-muted">Endurance curve exponent n = {w.n.toFixed(2)}. Remaining interruptions on the most worn pole: {w.remainingAt.map((x) => `${x.ops.toFixed(0)} at ${x.ka.toFixed(0)} kA`).join(", ")}.</p></ResultCard>
                <ResultCard title="Fault interruptions">
                  <table className="w-full text-sm"><thead><tr><th className={th}>Date</th><th className={th}>Type</th><th className={th}>I A / B / C (kA)</th><th className={th}>Wear A / B / C</th><th className={th}>Opening</th></tr></thead>
                    <tbody>{w.rows.filter((o) => Math.max(o.ia, o.ib, o.ic) >= 1).map((o, i) => <tr key={i} className="border-t border-border text-foreground"><td className={td}>{new Date(o.t * 1000).toISOString().slice(0, 10)}</td><td className={td}>{o.type}</td><td className={`${td} font-mono`}>{o.ia} / {o.ib} / {o.ic}</td><td className={`${td} font-mono`}>{(100 * o.w.A).toFixed(2)} / {(100 * o.w.B).toFixed(2)} / {(100 * o.w.C).toFixed(2)} %</td><td className={td}>{o.openMs ?? "—"} ms</td></tr>)}</tbody></table>
                </ResultCard>
              </>
            )}
            {!r && <ResultCard title="Result"><p className="text-muted">Open an operations history or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
