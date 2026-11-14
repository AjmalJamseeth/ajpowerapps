"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { analyseLoad, analysePq, type LoadResult, type PqResult } from "@/lib/pqenergy";

function Bars({ v, unit }: { v: number[]; unit: string }) {
  const W = 720, H = 140, mx = Math.max(1e-9, ...v), bw = (W - 30) / v.length;
  return <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="profile">{v.map((x, i) => <g key={i}><rect x={30 + i * bw + 1} y={H - (x / mx) * (H - 10)} width={bw - 2} height={(x / mx) * (H - 10)} fill="#f59e0b" opacity="0.75" />{i % 3 === 0 && <text x={30 + i * bw} y={H + 14} fontSize="10" fill="#94a3b8">{i}h</text>}</g>)}<text x={0} y={12} fontSize="10" fill="#94a3b8">{mx.toFixed(0)} {unit}</text></svg>;
}

export default function PqEnergyPage() {
  const [tab, setTab] = useState<"load" | "pq">("load");
  const [load, setLoad] = useState(""), [pq, setPq] = useState(""), [nameL, setNameL] = useState(""), [nameP, setNameP] = useState("");
  const [win, setWin] = useState("30"), [pf, setPf] = useState("8"), [pt, setPt] = useState("22"), [vn, setVn] = useState("33"), [lvl, setLvl] = useState<"LV" | "MV">("MV");
  const L = useMemo(() => (load.trim() ? analyseLoad(load, Number(win) || 30, Number(pf) || 8, Number(pt) || 22) : null), [load, win, pf, pt]);
  const Q = useMemo(() => (pq.trim() ? analysePq(pq, Number(vn) || 33, lvl) : null), [pq, vn, lvl]);
  const lr = L && !("err" in L) ? (L as LoadResult) : null, qr = Q && !("err" in Q) ? (Q as PqResult) : null;
  const read = (f: File | undefined, set: (t: string) => void, n: (t: string) => void) => { if (f) f.text().then((t) => { set(t); n(f.name); }); };
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Power Quality &amp; Energy File Analyser</h1>
        <p className="mt-2 max-w-3xl text-muted">Two analyses from the files meters and power-quality analysers export: maximum demand, load factor and profiles from an interval load profile; and EN 50160 compliance (voltage, harmonics, flicker, unbalance, frequency) from a week of 10-minute values.</p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Power Quality and Energy File Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Demand charges are set by a handful of peaks, and power-quality complaints are settled against EN 50160 over a full week. Both questions are answered by the files the meter or analyser already records — if they are read with the right integration period and the right percentiles."
            standards={["EN 50160 (voltage characteristics of public supply networks: 95 % / 99 % of 10-minute values per week)", "IEC 61000-4-30 (measurement methods, 10-minute aggregation), IEC 61000-4-15 (flicker Pst/Plt)", "IEC 62053 / utility tariff practice (block demand over 15 or 30 minutes)"]}
            capabilities={["Load profile: kW per interval, kWh per interval or cumulative kWh; maximum block demand (15/30/60 min), average, load factor, energy, daily maxima, 24-hour average profile, top 10 peaks, peak / off-peak energy split.", "Power quality: phase voltages (or one voltage), THDu, Pst/Plt, unbalance and frequency; EN 50160 percentage compliance per parameter with 95th percentiles and extremes; values below 90 % of Un."]}
            example={{ problem: "The J01 industrial customer's month of 15-minute demand, and a week of 10-minute values at the S13 33 kV busbar.", steps: ["Maximum 30-minute demand 5717 kW on 14 October at 10:30 — 24 % above any other day's peak (chiller and compressor starting together); load factor 49 %.", "Voltage complies; THDu exceeds 8 % in 6 % of the week (evening rectifier load) and Plt exceeds 1 in 21 % (arc furnace on working days)."], result: "Stagger two motor starts to cut the demand charge; harmonic filtering and flicker mitigation for the 33 kV customers." }}
            notes="Use the integration period of your tariff. EN 50160 frequency limits refer to 10-second values over a year; 10-minute values give an indication only."
          />
        </div>
        <div className="mt-6 flex gap-2">{([["load", "Load profile & demand"], ["pq", "Power quality (EN 50160)"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setTab(k)} className={`rounded-full border px-4 py-1.5 text-sm ${tab === k ? "border-accent text-accent" : "border-border text-muted"}`}>{l}</button>)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {tab === "load" ? (
            <>
              <Section title="Load profile">
                <div className="flex flex-col gap-2">
                  <label className={`cursor-pointer ${btn}`}>Open CSV…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => read(e.target.files?.[0], setLoad, setNameL)} /></label>
                  <button type="button" onClick={() => fetch("/samples/S13_J01_load_profile.csv").then((r) => r.text()).then((t) => { setLoad(t); setNameL("sample: J01 customer, 30 days"); })} className={btn}>Load sample</button>
                </div>
                <p className="mt-2 text-xs text-muted">{nameL}</p>
                <div className="mt-2 grid grid-cols-3 gap-2"><TextField label="Demand period (min)" value={win} onChange={setWin} /><TextField label="Peak from (h)" value={pf} onChange={setPf} /><TextField label="Peak to (h)" value={pt} onChange={setPt} /></div>
              </Section>
              <div className="space-y-6 lg:col-span-2">
                {L && "err" in L && <ResultCard title="Cannot read"><p className="text-fail">{L.err}</p></ResultCard>}
                {lr && (
                  <>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Max demand", `${lr.maxDemand.toFixed(0)} kW`], ["Average", `${lr.avg.toFixed(0)} kW`], ["Load factor", `${(100 * lr.loadFactor).toFixed(0)} %`], ["Energy", `${(lr.energy / 1000).toFixed(1)} MWh`]].map(([l, v]) => <div key={l} className="rounded-lg border border-border bg-surface p-3"><div className="text-xs text-muted">{l}</div><div className="mt-1 text-lg font-semibold text-foreground">{v}</div></div>)}</div>
                    <ResultCard title="Assessment"><FindingList list={lr.findings} /><p className="mt-2 text-sm text-muted">Peak-period energy {(lr.peakEnergy / 1000).toFixed(1)} MWh ({((100 * lr.peakEnergy) / (lr.energy || 1)).toFixed(0)} %), off-peak {(lr.offEnergy / 1000).toFixed(1)} MWh · interval {Math.round(lr.interval / 60)} min · {lr.days.toFixed(1)} days</p></ResultCard>
                    <ResultCard title="Average demand by hour of day"><Bars v={lr.profile} unit="kW" /></ResultCard>
                    <ResultCard title={`Highest ${lr.window}-minute demands`}><table className="w-full text-sm"><tbody>{lr.peaks.map((p, i) => <tr key={i} className="border-t border-border text-foreground"><td className={td}>{i + 1}</td><td className={`${td} font-mono`}>{new Date(p.t * 1000).toISOString().slice(0, 16).replace("T", " ")}</td><td className={td}>{p.kw.toFixed(0)} kW</td></tr>)}</tbody></table></ResultCard>
                  </>
                )}
                {!L && <ResultCard title="Result"><p className="text-muted">Open a load profile or load the sample.</p></ResultCard>}
              </div>
            </>
          ) : (
            <>
              <Section title="10-minute PQ values">
                <div className="flex flex-col gap-2">
                  <label className={`cursor-pointer ${btn}`}>Open CSV…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => read(e.target.files?.[0], setPq, setNameP)} /></label>
                  <button type="button" onClick={() => fetch("/samples/S13_33kV_PQ_week.csv").then((r) => r.text()).then((t) => { setPq(t); setNameP("sample: S13 33 kV busbar, one week"); setVn("33"); setLvl("MV"); })} className={btn}>Load sample</button>
                </div>
                <p className="mt-2 text-xs text-muted">{nameP}</p>
                <div className="mt-2 grid grid-cols-2 gap-2"><TextField label="Un (same unit as the file)" value={vn} onChange={setVn} /><label className="block text-xs text-muted">Network<select value={lvl} onChange={(e) => setLvl(e.target.value as "LV" | "MV")} className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground"><option value="LV">LV</option><option value="MV">MV</option></select></label></div>
              </Section>
              <div className="space-y-6 lg:col-span-2">
                {Q && "err" in Q && <ResultCard title="Cannot read"><p className="text-fail">{Q.err}</p></ResultCard>}
                {qr && (
                  <>
                    <ResultCard title={`EN 50160 assessment (${qr.n} values, ${qr.days.toFixed(1)} days)`}><FindingList list={qr.findings} /></ResultCard>
                    <ResultCard title="Parameters"><table className="w-full text-sm"><thead><tr><th className={th}>Parameter</th><th className={th}>Limit</th><th className={th}>Within limit</th><th className={th}>Extremes</th></tr></thead><tbody>{qr.params.map((p) => <tr key={p.name} className="border-t border-border text-foreground"><td className={td}>{p.name}</td><td className={td}>{p.limit}</td><td className={`${td} font-mono ${p.pass === false ? "text-fail" : p.pass ? "text-pass" : ""}`}>{p.compliance === null ? "—" : `${p.compliance.toFixed(1)} %`}</td><td className={`${td} text-xs`}>{p.worst}</td></tr>)}</tbody></table></ResultCard>
                  </>
                )}
                {!Q && <ResultCard title="Result"><p className="text-muted">Open a week of 10-minute values or load the sample.</p></ResultCard>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
