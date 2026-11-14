"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, btnCls as btn } from "@/components/FindingList";
import { parseLoadProfile, thermal, COOLING, steadyHotSpot, maxLoad, type XfmrData } from "@/lib/powerassets";

function Chart({ rows }: { rows: { t: number; K: number; amb: number; top: number; hs: number }[] }) {
  const W = 760, H = 220, pad = 36, step = Math.max(1, Math.floor(rows.length / 600));
  const r = rows.filter((_, i) => i % step === 0), T0 = r[0]?.t ?? 0, T1 = r[r.length - 1]?.t ?? 1, mx = Math.max(130, ...r.map((x) => x.hs)) + 5;
  const x = (t: number) => pad + ((t - T0) / Math.max(1, T1 - T0)) * (W - pad - 8), y = (v: number) => H - 18 - (v / mx) * (H - 30);
  const line = (k: "amb" | "top" | "hs", c: string) => <polyline fill="none" stroke={c} strokeWidth="1.6" points={r.map((p) => `${x(p.t).toFixed(1)},${y(p[k]).toFixed(1)}`).join(" ")} />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="temperatures">
      {[40, 80, 120].map((v) => <g key={v}><line x1={pad} x2={W} y1={y(v)} y2={y(v)} stroke="#1e293b" /><text x={4} y={y(v) + 3} fontSize="10" fill="#94a3b8">{v}°</text></g>)}
      <line x1={pad} x2={W} y1={y(120)} y2={y(120)} stroke="#f87171" strokeDasharray="4 3" />
      {line("amb", "#60a5fa")}{line("top", "#22d3ee")}{line("hs", "#f59e0b")}
      <polyline fill="none" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 2" points={r.map((p) => `${x(p.t).toFixed(1)},${y(p.K * 100).toFixed(1)}`).join(" ")} />
      <text x={pad + 4} y={H - 4} fontSize="10" fill="#f59e0b">hot-spot</text><text x={pad + 64} y={H - 4} fontSize="10" fill="#22d3ee">top oil</text><text x={pad + 118} y={H - 4} fontSize="10" fill="#60a5fa">ambient</text><text x={pad + 176} y={H - 4} fontSize="10" fill="#a78bfa">load × 100 (pu)</text>
    </svg>
  );
}

export default function TransformerThermalPage() {
  const [text, setText] = useState(""), [name, setName] = useState("");
  const [cool, setCool] = useState<XfmrData["cooling"]>("ONAF");
  const [dor, setDor] = useState("50"), [dhr, setDhr] = useState("26"), [R, setR] = useState("6"), [amb, setAmb] = useState("40"), [hsLim, setHsLim] = useState("120"), [up, setUp] = useState(true);
  const d: XfmrData = useMemo(() => ({ cooling: cool, dThOr: Number(dor) || 50, dThHr: Number(dhr) || 26, R: Number(R) || 6, upgraded: up, ...COOLING[cool] }), [cool, dor, dhr, R, up]);
  const res = useMemo(() => { if (!text.trim()) return null; const p = parseLoadProfile(text); if (p.err || !p.pts.length) return { err: p.err ?? "No data", t: null }; return { err: "", t: thermal(d, p.pts, Number(amb) || 40, { hs: Number(hsLim) || 120, top: 105 }) }; }, [text, d, amb, hsLim]);
  const ss = steadyHotSpot(d, 1, Number(amb) || 40), km = maxLoad(d, Number(amb) || 40, Number(hsLim) || 120);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Transformer Thermal Loading &amp; Ageing (IEC 60076-7)</h1>
        <p className="mt-2 max-w-3xl text-muted">Top-oil and hot-spot temperatures of an oil-immersed transformer through a load and ambient profile, with the IEC 60076-7 dynamic model, relative ageing and loss of life — and the steady load the transformer can carry at a given ambient.</p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Transformer Thermal Loading and Ageing" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="A transformer's life is the life of its paper insulation, and the paper ages exponentially with the hot-spot temperature: about twice as fast for every 6 K above 98 °C. In hot climates and during contingencies the question is not the nameplate MVA but how hot the winding gets through the day — and how much life that costs."
            standards={["IEC 60076-7:2018 (loading guide for oil-immersed power transformers: difference equations, thermal constants, ageing rates, temperature limits)", "IEC 60076-2 (temperature rise)"]}
            capabilities={["Steady state: top oil and hot-spot at rated load for the chosen ambient, and the maximum continuous load that keeps the hot-spot at the limit.", "Dynamic: IEC 60076-7 difference equations (thermal constants per cooling mode ONAN, ONAF, OF, OD, editable rises and loss ratio) solved minute by minute through a load and ambient profile.", "Relative ageing V = 2^((θh − 98)/6) for normal paper or exp(15000/383 − 15000/(θh + 273)) for thermally upgraded paper; equivalent ageing hours; checks against the 120 °C / 105 °C normal cyclic limits, 1.5 pu current and 140 °C bubbling."]}
            example={{ problem: "T1 (ONAF, top-oil rise 50 K, hot-spot gradient 26 K, R = 6, upgraded paper) on a summer day: load up to 1.10 pu at 15:30 with ambient 46 °C.", steps: ["Hot-spot reaches 129.7 °C — above the 120 °C limit for normal cyclic loading; top oil 99 °C.", "Ageing for the day equals 20.5 h at the 110 °C reference — relative ageing 0.85, because the night is cool."], result: "Acceptable for life, but above the normal cyclic hot-spot limit in the afternoon: shed or transfer about 10 % of the load at the peak, or start the fans earlier." }}
            notes="Use the factory heat-run values for the rises and the loss ratio. The model uses the IEC thermal constants unless the manufacturer gives better ones; it does not include the effect of moisture or oxygen on ageing."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="Transformer">
              <label className="block text-xs text-muted">Cooling<select value={cool} onChange={(e) => setCool(e.target.value as XfmrData["cooling"])} className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground">{Object.keys(COOLING).map((c) => <option key={c}>{c}</option>)}</select></label>
              <div className="mt-2 grid grid-cols-2 gap-2"><TextField label="Top-oil rise at rated load (K)" value={dor} onChange={setDor} /><TextField label="Hot-spot to top-oil gradient (K)" value={dhr} onChange={setDhr} /><TextField label="Load loss / no-load loss R" value={R} onChange={setR} /><TextField label="Ambient if not in file (°C)" value={amb} onChange={setAmb} /><TextField label="Hot-spot limit (°C)" value={hsLim} onChange={setHsLim} /></div>
              <label className="mt-2 flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={up} onChange={(e) => setUp(e.target.checked)} /> Thermally upgraded paper</label>
              <p className="mt-2 text-xs text-muted">At rated load and {amb} °C: top oil {ss.top.toFixed(1)} °C, hot-spot {ss.hs.toFixed(1)} °C. Maximum continuous load for a {hsLim} °C hot-spot: <b className="text-foreground">{km.toFixed(2)} pu</b>.</p>
            </Section>
            <Section title="Load profile">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open CSV (time, load pu, ambient)…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0]?.text().then((t) => { setText(t); setName(e.target.files![0].name); })} /></label>
                <button type="button" onClick={() => fetch("/samples/S13_T1_summer_day_load.csv").then((x) => x.text()).then((t) => { setText(t); setName("sample: T1 summer day"); })} className={btn}>Load sample</button>
              </div>
              <p className="mt-2 text-xs text-muted">{name}</p>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {res?.err && <ResultCard title="Cannot read"><p className="text-fail">{res.err}</p></ResultCard>}
            {res?.t && (
              <>
                <ResultCard title="Assessment"><FindingList list={res.t.findings} /></ResultCard>
                <ResultCard title="Temperatures through the profile"><Chart rows={res.t.rows} /></ResultCard>
              </>
            )}
            {!res && <ResultCard title="Result"><p className="text-muted">Open a load profile (or load the sample) to run the dynamic model; the steady-state figures are shown on the left.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
