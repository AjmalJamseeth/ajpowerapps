"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td } from "@/components/FindingList";
import { distanceSettings, type DistInput } from "@/lib/powerassets";

const DEF: Record<keyof DistInput, string> = { r1: "0.08", x1: "0.40", r0: "0.25", x0: "1.20", len: "40", shortAdjLen: "25", shortAdjZ: "0.408", longAdjLen: "60", longAdjZ: "0.408", ctPri: "800", ctSec: "1", vtPri: "132000", vtSec: "110", vKv: "132", maxLoadMva: "150", loadAngle: "30", zsOhm: "20", rf: "10", rfPP: "3" };
const LABEL: Record<keyof DistInput, string> = { r1: "R1 (Ω/km)", x1: "X1 (Ω/km)", r0: "R0 (Ω/km)", x0: "X0 (Ω/km)", len: "Protected line length (km)", shortAdjLen: "Shortest adjacent line (km)", shortAdjZ: "Its |Z1| (Ω/km)", longAdjLen: "Longest adjacent line (km)", longAdjZ: "Its |Z1| (Ω/km)", ctPri: "CT primary (A)", ctSec: "CT secondary (A)", vtPri: "VT primary (V)", vtSec: "VT secondary (V)", vKv: "System voltage (kV)", maxLoadMva: "Maximum load (MVA)", loadAngle: "Load angle (°)", zsOhm: "Source impedance (Ω, for SIR)", rf: "Earth-fault resistance to cover (Ω)", rfPP: "Phase-fault arc resistance (Ω)" };

function Quad({ zones, ang }: { zones: { zone: string; reach: number; rPG: number }[]; ang: number }) {
  const W = 320, H = 300, mx = Math.max(...zones.map((z) => Math.max(z.reach, z.rPG))) * 1.15, s = (H - 40) / mx, ox = 70, oy = H - 30;
  const a = (ang * Math.PI) / 180, col = ["#f59e0b", "#22d3ee", "#a78bfa", "#94a3b8"];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full max-w-sm" role="img" aria-label="quadrilateral characteristics">
      <line x1={10} x2={W} y1={oy} y2={oy} stroke="#334155" /><line x1={ox} x2={ox} y1={10} y2={H - 10} stroke="#334155" />
      <text x={W - 16} y={oy - 4} fontSize="10" fill="#94a3b8">R</text><text x={ox + 4} y={18} fontSize="10" fill="#94a3b8">X</text>
      {zones.map((z, i) => { const rev = /reverse/i.test(z.zone), X = z.reach * Math.sin(a) * (rev ? -1 : 1), Rr = z.rPG, Rl = -0.25 * Rr, xo = z.reach * Math.cos(a) * (rev ? -1 : 1);
        const pts = [[Rl, 0], [Rr, 0], [Rr + xo, X], [Rl + xo, X]].map(([r, x]) => `${ox + r * s},${oy - x * s}`).join(" ");
        return <g key={z.zone}><polygon points={pts} fill="none" stroke={col[i]} strokeWidth="1.5" /><text x={ox + (Rr + xo) * s + 3} y={oy - X * s} fontSize="10" fill={col[i]}>{z.zone.replace(" (reverse)", "R")}</text></g>; })}
      <line x1={ox} y1={oy} x2={ox + mx * 0.9 * Math.cos(a) * s} y2={oy - mx * 0.9 * Math.sin(a) * s} stroke="#64748b" strokeDasharray="4 3" />
    </svg>
  );
}

export default function DistanceSettingsPage() {
  const [v, setV] = useState(DEF);
  const r = useMemo(() => { const p = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Number(x)])) as unknown as DistInput; return Object.values(p).every(Number.isFinite) && p.len > 0 ? distanceSettings(p) : null; }, [v]);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Distance Protection Setting Assistant</h1>
        <p className="mt-2 max-w-3xl text-muted">Proposed zone reaches and times for a line distance relay from the line and network data: residual compensation k0, zones 1–3 and a reverse zone in primary and secondary ohms, resistive reaches limited by load, and checks for load encroachment, source impedance ratio and short lines.</p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Distance Protection Setting Assistant" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Distance protection settings follow well-established rules — zone 1 under-reaches the remote end, zone 2 covers the rest of the line with a delay, zone 3 backs up the adjacent lines — but each rule has a limit set by the adjacent lines, the load and the source. Laying them out together, with the numbers in primary and secondary ohms, makes the setting sheet consistent and the compromises visible."
            standards={["IEC 60255-121 (functional requirements for distance protection: reach accuracy, residual compensation)", "IEEE C37.113 (guide for protective relay applications to transmission lines)", "Common utility practice for zone reaches and times (80 % / 120 % / 0.3–0.4 s / 0.8–1.0 s)"]}
            capabilities={["k0 = (Z0 − Z1) / 3Z1 and the line angle from the line constants.", "Zone 1 = 80 % of the line; zone 2 = max(120 % of the line, line + 50 % of the shortest adjacent line), limited so it stays inside zone 1 of that line; zone 3 = 120 % of (line + longest adjacent line); reverse zone 15 %.", "Resistive reach: earth faults 1.2 × 2 × fault resistance (allowance for remote infeed), phase faults 1.2 × arc resistance, both limited to 80 % of the minimum load resistance at 0.9 pu voltage and the load angle.", "Secondary ohms = primary × (CT ratio / VT ratio); quadrilateral sketch; warnings for load encroachment of zone 3, SIR > 4 and short lines."]}
            example={{ problem: "A 40 km 132 kV line (Z1 = 0.08 + j0.40 Ω/km, Z0 = 0.25 + j1.20 Ω/km), CT 800/1, VT 132 kV/110 V, adjacent lines 25 and 60 km, maximum load 150 MVA.", steps: ["Line 16.3 Ω ∠ 78.7°, k0 = 0.668 ∠ −0.7°.", "Zone 1 13.05 Ω (8.70 Ω secondary), zone 2 21.42 Ω at 0.35 s, zone 3 49.0 Ω at 0.9 s.", "Earth-fault resistive reach 24 Ω, well inside the 65 Ω load limit."], result: "A consistent first setting proposal to check against the relay manual and the grading with the neighbouring relays." }}
            notes="This is a starting point for the setting study, not a replacement for it: infeed, mutual coupling of parallel lines, series compensation, power swings and teleprotection schemes need the full study and the relay manufacturer's guidance."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Section title="Line and network data">
            <div className="grid grid-cols-2 gap-2">{(Object.keys(DEF) as (keyof DistInput)[]).map((k) => <TextField key={k} label={LABEL[k]} value={v[k]} onChange={(x) => setV({ ...v, [k]: x })} />)}</div>
          </Section>
          <div className="space-y-6 lg:col-span-2">
            {r ? (
              <>
                <ResultCard title={`Proposed zones — line ${r.ZL.toFixed(2)} Ω ∠ ${r.ang.toFixed(1)}°`}>
                  <table className="w-full text-sm"><thead><tr><th className={th}>Zone</th><th className={th}>Reach primary</th><th className={th}>Reach secondary</th><th className={th}>R earth / phase (prim.)</th><th className={th}>R earth / phase (sec.)</th><th className={th}>Time</th></tr></thead>
                    <tbody>{r.zones.map((z) => <tr key={z.zone} className="border-t border-border text-foreground"><td className={td}>{z.zone}<div className="text-xs text-muted">{z.basis}</div></td><td className={`${td} font-mono`}>{z.reach.toFixed(2)} Ω</td><td className={`${td} font-mono`}>{z.sec.toFixed(2)} Ω</td><td className={`${td} font-mono`}>{z.rPG.toFixed(1)} / {z.rPP.toFixed(1)} Ω</td><td className={`${td} font-mono`}>{z.rPGsec.toFixed(1)} / {z.rPPsec.toFixed(1)} Ω</td><td className={td}>{z.t} s</td></tr>)}</tbody></table>
                  <p className="mt-2 text-xs text-muted">Minimum load impedance at 0.9 pu: {r.zLoad.toFixed(1)} Ω; resistive reach limit {r.rLoadLim.toFixed(1)} Ω{r.sir !== null ? ` · SIR ${r.sir.toFixed(2)}` : ""}.</p>
                </ResultCard>
                <ResultCard title="Checks"><FindingList list={r.findings} /></ResultCard>
                <ResultCard title="Characteristics (earth-fault resistive reach, primary Ω)"><Quad zones={r.zones} ang={r.ang} /></ResultCard>
              </>
            ) : <ResultCard title="Result"><p className="text-muted">Enter numeric values in every field.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
