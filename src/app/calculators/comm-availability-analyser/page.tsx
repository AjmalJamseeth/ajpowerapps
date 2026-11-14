"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { parseStatus, availability } from "@/lib/opsanalysis";

const hrs = (s: number | null) => (s === null ? "—" : s >= 86400 ? `${(s / 86400).toFixed(1)} d` : s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${(s / 60).toFixed(1)} min` : `${s.toFixed(0)} s`);
const iso = (t: number) => new Date(t * 1000).toISOString().slice(0, 19).replace("T", " ");

export default function CommAvailabilityPage() {
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("99.95");
  const r = useMemo(() => { if (!text.trim()) return null; const p = parseStatus(text); return p.err ? { err: p.err, a: null } : { err: "", a: availability(p.ev, undefined, undefined, Number(target) || 99.95) }; }, [text, target]);
  const open = (f?: File) => { if (f) f.text().then((t) => { setText(t); setName(f.name); }); };
  const sample = () => fetch("/samples/S13_comm_status_log.csv").then((x) => x.text()).then((t) => { setText(t); setName("sample: S13 communication status, 30 days"); });
  const a = r?.a;
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Communication Availability Analyser</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Turn a communication status log (IED, RTU and control-centre links going down and up) into availability per link, MTBF, MTTR,
          the outage list, flapping links and common-cause outages — against your availability target.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Communication Availability Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Contracts and grid codes set availability targets for telecontrol links, and the operations team needs to know which links fail, how often and for how long. The SCADA already logs every communication failure and return; computing availability, MTBF and MTTR from it — and spotting outages that hit several devices at once — points to the weak component (a switch, a power supply, a telecom circuit)."
            standards={["IEC 60870-5-104 / IEC 61850 link supervision events as the source", "IEC 61907 and IEC 60050-192 (dependability: availability, MTBF, MTTR definitions)", "IEC 62439-1 (availability of industrial communication networks)"]}
            capabilities={["Reads a status log CSV (time, device or link, state such as OK/FAIL, up/down, 1/0, comm fail / normal).", "Per link: outages, downtime, availability = 1 − downtime / period, MTBF = uptime / failures, MTTR = downtime / failures, longest outage, flaps shorter than 10 s.", "Links still down at the end; common-cause outages (3 or more links down within 5 s); comparison with the target."]}
            example={{ problem: "30 days of the S13 communication status log, target 99.95 %.", steps: ["BCU_J01 99.42 %: down 4 h at the end of the month and still down.", "The control-centre link GW1-CC 99.69 % after a 2 h telecom outage.", "GW1-CC, HMI1 and BCU_J01 went down together for 12 minutes on 19 November — they share switch SW2; P132_Q02 flapped 9 times in one afternoon."], result: "Three actions: repair BCU_J01, investigate SW2's power supply, fix P132_Q02's connection." }}
            notes="Availability depends on the period: the log should start with every link's state (or the first event is taken as the start). Planned outages are counted unless removed from the log."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Section title="Status log">
            <div className="flex flex-col gap-2">
              <label className={`cursor-pointer ${btn}`}>Open log (CSV)…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => open(e.target.files?.[0])} /></label>
              <button type="button" onClick={sample} className={btn}>Load sample</button>
            </div>
            <p className="mt-2 text-xs text-muted">{name}</p>
            <div className="mt-2"><TextField label="Availability target (%)" value={target} onChange={setTarget} /></div>
          </Section>
          <div className="space-y-6 lg:col-span-2">
            {r?.err && <ResultCard title="Cannot read"><p className="text-fail">{r.err}</p></ResultCard>}
            {a && (
              <>
                <p className="text-sm text-muted">Period {iso(a.t0)} – {iso(a.t1)} UTC ({hrs(a.span)}) · mean availability {a.overall.toFixed(3)} %</p>
                <ResultCard title="Assessment"><FindingList list={a.findings} /></ResultCard>
                <ResultCard title="Availability per link">
                  <table className="w-full text-sm"><thead><tr><th className={th}>Link</th><th className={th}>Availability</th><th className={th}>Outages</th><th className={th}>Downtime</th><th className={th}>MTBF</th><th className={th}>MTTR</th><th className={th}>Longest</th></tr></thead>
                    <tbody>{a.rows.map((x) => <tr key={x.dev} className="border-t border-border text-foreground"><td className={td}>{x.dev}</td><td className={`${td} font-mono ${x.avail < (Number(target) || 99.95) ? "text-fail" : "text-pass"}`}>{x.avail.toFixed(3)} %</td><td className={td}>{x.outages}{x.flaps ? <span className="text-accent"> ({x.flaps} flaps)</span> : null}</td><td className={td}>{hrs(x.down)}</td><td className={td}>{hrs(x.mtbf)}</td><td className={td}>{hrs(x.mttr)}</td><td className={td}>{hrs(x.longest)}</td></tr>)}</tbody></table>
                </ResultCard>
                <ResultCard title={`Outages (${a.outages.length})`}>
                  <div className="max-h-80 overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Link</th><th className={th}>From</th><th className={th}>To</th><th className={th}>Duration</th></tr></thead>
                    <tbody>{[...a.outages].sort((x, y) => x.start - y.start).map((o, i) => <tr key={i} className="border-t border-border text-foreground"><td className={td}>{o.dev}</td><td className={`${td} font-mono`}>{iso(o.start)}</td><td className={`${td} font-mono`}>{o.open ? "still down" : iso(o.end)}</td><td className={td}>{hrs(o.end - o.start)}</td></tr>)}</tbody></table></div>
                </ResultCard>
              </>
            )}
            {!r && <ResultCard title="Result"><p className="text-muted">Open a status log or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
