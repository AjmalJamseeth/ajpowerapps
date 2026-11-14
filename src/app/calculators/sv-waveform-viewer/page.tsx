"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { readCapture } from "@/lib/pcapnet";
import { eth } from "@/lib/l2cap";
import { svStreams, analyseSv, CH } from "@/lib/svview";

const COL = ["#f59e0b", "#22d3ee", "#a78bfa", "#94a3b8"];

function Wave({ data, chans, unit }: { data: number[][]; chans: number[]; unit: string }) {
  const W = 760, H = 180, pad = 34;
  const vals = data.flatMap((v) => chans.map((c) => v[c]));
  const mx = Math.max(1e-9, ...vals.map(Math.abs));
  const x = (i: number) => pad + (i / Math.max(1, data.length - 1)) * (W - pad - 6), y = (v: number) => H / 2 - (v / mx) * (H / 2 - 10);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`waveform ${unit}`}>
      <line x1={pad} x2={W} y1={H / 2} y2={H / 2} stroke="#334155" />
      <text x={2} y={14} fontSize="10" fill="#94a3b8">{mx >= 1000 ? (mx / 1000).toFixed(1) + " k" : mx.toFixed(1)}{unit}</text>
      {chans.map((c, k) => <polyline key={c} fill="none" stroke={COL[k % 4]} strokeWidth="1.4" points={data.map((v, i) => `${x(i).toFixed(1)},${y(v[c]).toFixed(1)}`).join(" ")} />)}
      {chans.map((c, k) => <text key={"l" + c} x={pad + 6 + k * 46} y={H - 4} fontSize="11" fill={COL[k % 4]}>{CH[c]}</text>)}
    </svg>
  );
}
function PhasorDiagram({ ph, chans }: { ph: { mag: number; ang: number }[]; chans: number[] }) {
  const R = 80, mx = Math.max(1e-9, ...chans.map((c) => ph[c].mag));
  return (
    <svg viewBox="-100 -100 200 200" className="h-52 w-52" role="img" aria-label="phasor diagram">
      <circle r={R} fill="none" stroke="#334155" /><line x1={-R} x2={R} y1={0} y2={0} stroke="#1e293b" /><line y1={-R} y2={R} x1={0} x2={0} stroke="#1e293b" />
      {chans.map((c, k) => { const a = (ph[c].ang * Math.PI) / 180, l = (ph[c].mag / mx) * R; return <g key={c}><line x1={0} y1={0} x2={l * Math.cos(a)} y2={-l * Math.sin(a)} stroke={COL[k % 4]} strokeWidth="2.2" /><text x={(l + 10) * Math.cos(a) - 6} y={-(l + 10) * Math.sin(a) + 4} fontSize="10" fill={COL[k % 4]}>{CH[c]}</text></g>; })}
    </svg>
  );
}

export default function SvWaveformViewerPage() {
  const [buf, setBuf] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("");
  const [f0, setF0] = useState("50");
  const [spc, setSpc] = useState("80");
  const [sel, setSel] = useState(0);
  const [at, setAt] = useState(0);
  const st = useMemo(() => { if (!buf) return { list: [], err: "" }; try { return { list: svStreams(eth(readCapture(buf))), err: "" }; } catch (e) { return { list: [], err: (e as Error).message }; } }, [buf]);
  const s = st.list[sel];
  const per = Number(spc) || 80;
  const r = useMemo(() => (s ? analyseSv(s, Number(f0) || 50, per, at) : null), [s, f0, per, at]);
  const open = (f?: File) => { if (f) f.arrayBuffer().then((b) => { setBuf(new Uint8Array(b)); setName(f.name); setSel(0); setAt(0); }); };
  const sample = () => fetch("/samples/GOOSE_SV_demo_bay1.pcap").then((x) => x.arrayBuffer()).then((b) => { setBuf(new Uint8Array(b)); setName("sample: demonstration bay (9-2LE merging unit)"); setSel(0); setAt(0); });
  const win = s ? s.vals.slice(at, at + per * 2) : [];
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Sampled Values Waveform &amp; Phasor Viewer (IEC 61850-9-2LE)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Open a process-bus capture and see what the merging unit really sends: current and voltage waveforms, phasors from a one-cycle
          DFT, frequency and symmetrical components — with checks for lost samples, synchronisation, quality, a neutral that does not match
          the phases, and swapped phases.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SV Waveform and Phasor Viewer" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="With a process bus, the protection relay no longer sees the CT and VT wiring — only the sampled values. Wrong channel mapping, a swapped phase, a neutral CT with the wrong polarity, lost samples or an unsynchronised merging unit look correct in the configuration and wrong only in the samples. Plotting the samples and computing the phasors shows it immediately, before secondary injection testing."
            standards={["IEC 61850-9-2 and the UCA 9-2LE implementation guideline (80 samples per cycle, 4 currents + 4 voltages, 1 mA / 10 mV per bit)", "IEC 61869-9 (digital interface of instrument transformers)", "IEC 61850-7-3 quality; smpSynch (0 none, 1 local, 2 global)"]}
            capabilities={[
              "Decodes sampled-value frames (APPID, svID, smpCnt, confRev, smpSynch, eight values with quality) and groups them per stream.",
              "Plots two cycles of currents and voltages from any sample, and shows phasors (RMS magnitude and angle relative to Va), frequency from the phase advance between two cycles, and positive, negative and zero sequence.",
              "Checks: lost samples (smpCnt gaps, counter wrapping at the samples per second), smpSynch, simulation, quality per channel, neutral current against Ia + Ib + Ic sample by sample, phase sequence, current and voltage unbalance, zero-sequence voltage, frequency.",
            ]}
            example={{ problem: "The demonstration capture: a 9-2LE merging unit at 80 samples per cycle, 50 Hz.", steps: ["Phasors: 70.7 A per phase 120° apart, 44.9 kV per phase; frequency 50.00 Hz.", "8 samples are missing at one place.", "At sample 1506 the neutral channel reads 40 A while the three phases sum to zero."], result: "Lost samples and a faulty neutral channel — both found before the relay is tested." }}
            notes="Scaling follows 9-2LE (1 mA, 10 mV per bit); IEC 61869-9 streams with other scaling show proportional values. Capture at the relay's process-bus port. Files are read in your browser."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="Capture">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open capture…<input type="file" accept=".pcap,.pcapng,.cap" className="hidden" onChange={(e) => open(e.target.files?.[0])} /></label>
                <button type="button" onClick={sample} className={btn}>Load sample</button>
              </div>
              <p className="mt-2 text-xs text-muted">{name}{st.list.length ? ` · ${st.list.length} SV stream(s)` : ""}</p>
              {st.err && <p className="text-sm text-fail">{st.err}</p>}
              {st.list.length > 1 && <select value={sel} onChange={(e) => { setSel(+e.target.value); setAt(0); }} className="mt-2 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm">{st.list.map((x, i) => <option key={x.key} value={i}>{x.svID} ({x.appid.toString(16).toUpperCase()})</option>)}</select>}
              <div className="mt-2 grid grid-cols-2 gap-2"><TextField label="Nominal frequency (Hz)" value={f0} onChange={setF0} /><TextField label="Samples per cycle" value={spc} onChange={setSpc} /></div>
            </Section>
            {s && (
              <Section title="Window">
                <input type="range" min={0} max={Math.max(0, s.vals.length - per * 2)} step={per / 4} value={at} onChange={(e) => setAt(+e.target.value)} className="w-full" aria-label="start sample" />
                <p className="text-xs text-muted">Sample {at} (smpCnt {s.cnt[at]}) of {s.vals.length}</p>
                {r && r.lostAt.length > 0 && <button type="button" onClick={() => setAt(Math.max(0, r.lostAt[0] - per))} className="mt-2 text-sm text-accent">Go to the lost samples</button>}
              </Section>
            )}
          </div>
          <div className="space-y-6 lg:col-span-2">
            {s && r && (
              <>
                <ResultCard title={`${s.svID} — ${s.frames} frames from ${s.src}`}>
                  <p className="mb-2 text-xs text-muted">APPID {s.appid.toString(16).toUpperCase().padStart(4, "0")} · MAC {s.dst} · VLAN {s.vlan ?? "untagged"} · priority {s.prio ?? "—"} · confRev {s.confRev} · smpSynch {s.synch.join(", ")}</p>
                  <FindingList list={r.findings} />
                </ResultCard>
                <ResultCard title="Waveforms (two cycles)"><Wave data={win} chans={[0, 1, 2, 3]} unit="A" /><Wave data={win} chans={[4, 5, 6, 7]} unit="V" /></ResultCard>
                <ResultCard title={`Phasors (one-cycle DFT${r.freq !== null ? `, f = ${r.freq.toFixed(3)} Hz` : ""})`}>
                  <div className="flex flex-wrap items-start gap-4">
                    <PhasorDiagram ph={r.phasors} chans={[0, 1, 2]} /><PhasorDiagram ph={r.phasors} chans={[4, 5, 6]} />
                    <table className="text-sm"><thead><tr><th className={th}>Channel</th><th className={th}>RMS</th><th className={th}>Angle</th></tr></thead>
                      <tbody>{r.phasors.map((p, i) => <tr key={i} className="border-t border-border text-foreground"><td className={td}>{CH[i]}</td><td className={`${td} font-mono`}>{i < 4 ? `${p.mag.toFixed(2)} A` : `${(p.mag / 1000).toFixed(3)} kV`}</td><td className={`${td} font-mono`}>{p.mag > 1e-6 ? `${p.ang.toFixed(1)}°` : "—"}</td></tr>)}</tbody></table>
                  </div>
                  <p className="mt-2 text-xs text-muted">Sequence components — current: positive {r.seq.i.pos.toFixed(2)} A, negative {r.seq.i.neg.toFixed(2)} A, zero {r.seq.i.zero.toFixed(2)} A; voltage: positive {(r.seq.v.pos / 1000).toFixed(3)} kV, negative {(r.seq.v.neg / 1000).toFixed(3)} kV, zero {(r.seq.v.zero / 1000).toFixed(3)} kV. Angles relative to Va.</p>
                </ResultCard>
              </>
            )}
            {buf && !st.list.length && !st.err && <ResultCard title="Result"><p className="text-muted">No sampled-value frames (EtherType 0x88BA) in this capture.</p></ResultCard>}
            {!buf && <ResultCard title="Result"><p className="text-muted">Open a process-bus capture or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
