"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { parseCfg, parseDat, parseCff, analyseFault, type CtRecord } from "@/lib/comtrade";

const COL = ["#f59e0b", "#22d3ee", "#a78bfa", "#94a3b8"];
function Plot({ r, idx, unit, marks }: { r: CtRecord; idx: number[]; unit: string; marks: number[] }) {
  const W = 760, H = 170, pad = 40, step = Math.max(1, Math.floor(r.n / 1500));
  const mx = Math.max(1e-9, ...idx.flatMap((k) => r.a[k].map(Math.abs)));
  const T = r.t[r.n - 1] || 1, x = (t: number) => pad + (t / T) * (W - pad - 6), y = (v: number) => H / 2 - (v / mx) * (H / 2 - 12);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${unit} channels`}>
      <line x1={pad} x2={W} y1={H / 2} y2={H / 2} stroke="#334155" />
      {marks.map((m, i) => <line key={i} x1={x(m)} x2={x(m)} y1={4} y2={H - 4} stroke={i === 0 ? "#f87171" : "#4ade80"} strokeDasharray="4 3" />)}
      <text x={2} y={14} fontSize="10" fill="#94a3b8">{mx >= 1000 ? (mx / 1000).toFixed(1) + " k" : mx.toFixed(0)}{unit}</text>
      <text x={W - 60} y={H - 4} fontSize="10" fill="#94a3b8">{(T * 1000).toFixed(0)} ms</text>
      {idx.map((k, j) => <polyline key={k} fill="none" stroke={COL[j % 4]} strokeWidth="1.2" points={r.t.filter((_, i) => i % step === 0).map((t, i) => `${x(t).toFixed(1)},${y(r.a[k][i * step]).toFixed(1)}`).join(" ")} />)}
      {idx.map((k, j) => <text key={"l" + k} x={pad + 6 + j * 54} y={H - 4} fontSize="11" fill={COL[j % 4]}>{r.cfg.analog[k].id}</text>)}
    </svg>
  );
}
function Digitals({ r, marks }: { r: CtRecord; marks: number[] }) {
  const W = 760, row = 18, pad = 40, T = r.t[r.n - 1] || 1, x = (t: number) => pad + (t / T) * (W - pad - 6), H = r.d.length * row + 8;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="digital channels">
      {marks.map((m, i) => <line key={i} x1={x(m)} x2={x(m)} y1={0} y2={H} stroke={i === 0 ? "#f87171" : "#4ade80"} strokeDasharray="4 3" />)}
      {r.d.map((v, k) => { const segs: [number, number][] = []; let s = -1; v.forEach((b, i) => { if (b && s < 0) s = i; if ((!b || i === v.length - 1) && s >= 0) { segs.push([s, b ? i : i - 1]); s = -1; } }); return <g key={k}><text x={pad + 4} y={k * row + 13} fontSize="10" fill="#94a3b8">{r.cfg.digital[k].id}</text>{segs.map(([a, b], j) => <rect key={j} x={x(r.t[a])} y={k * row + 3} width={Math.max(1, x(r.t[b]) - x(r.t[a]))} height={12} fill="#22d3ee" opacity="0.45" />)}</g>; })}
    </svg>
  );
}

export default function ComtradeFaultAnalyserPage() {
  const [rec, setRec] = useState<CtRecord | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [z1, setZ1] = useState("0.08"), [x1, setX1] = useState("0.40"), [r0, setR0] = useState("0.25"), [x0, setX0] = useState("1.20");
  const line = useMemo(() => {
    const R1 = Number(z1), X1 = Number(x1), R0 = Number(r0), X0 = Number(x0);
    if (![R1, X1, R0, X0].every(Number.isFinite) || Math.hypot(R1, X1) === 0) return undefined;
    const d = R1 * R1 + X1 * X1, nr = (R0 - R1) / 3, ni = (X0 - X1) / 3, kr = (nr * R1 + ni * X1) / d, ki = (ni * R1 - nr * X1) / d;
    return { z1: Math.hypot(R1, X1), ang1: (Math.atan2(X1, R1) * 180) / Math.PI, k0mag: Math.hypot(kr, ki), k0ang: (Math.atan2(ki, kr) * 180) / Math.PI };
  }, [z1, x1, r0, x0]);
  const fault = useMemo(() => (rec ? analyseFault(rec, line) : null), [rec, line]);
  const open = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    try {
      const arr = Array.from(files), cff = arr.find((f) => /\.cff$/i.test(f.name)), cfg = arr.find((f) => /\.cfg$/i.test(f.name)), dat = arr.find((f) => /\.dat$/i.test(f.name));
      if (cff) { setRec(parseCff(await cff.text())); setName(cff.name); return; }
      if (!cfg || !dat) { setErr("Select both the .cfg and the .dat file (hold Ctrl), or a single .cff file."); return; }
      const c = parseCfg(await cfg.text()); setRec(parseDat(c, new Uint8Array(await dat.arrayBuffer()))); setName(`${cfg.name} + ${dat.name}`);
    } catch (e) { setErr((e as Error).message); }
  };
  const sample = async () => { const [c, d] = await Promise.all([fetch("/samples/S13_Q01_fault_P132_Q01.cfg").then((r) => r.text()), fetch("/samples/S13_Q01_fault_P132_Q01.dat").then((r) => r.arrayBuffer())]); setRec(parseDat(parseCfg(c), new Uint8Array(d))); setName("sample: S13 Q01 line fault recorded by P132_Q01"); };
  const I = rec ? rec.cfg.analog.map((c, i) => (c.kind === "I" ? i : -1)).filter((i) => i >= 0) : [], V = rec ? rec.cfg.analog.map((c, i) => (c.kind === "V" ? i : -1)).filter((i) => i >= 0) : [];
  const marks = fault ? [fault.inception, fault.cleared].filter((x): x is number => x !== null) : [];
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">COMTRADE Viewer &amp; Fault Analyser</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Open a disturbance record (IEEE C37.111 / IEC 60255-24 COMTRADE, 1991, 1999 or 2013; ASCII, BINARY, BINARY32 or FLOAT32) and
          read it like a protection engineer: waveforms and digital channels, pre-fault and fault phasors, fault type, trip and breaker
          times, clearance time, apparent impedance of the faulted loop and the distance to the fault.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="COMTRADE Viewer and Fault Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="After every trip the relay's disturbance record answers the key questions: what kind of fault, how much current, how fast the protection tripped and the breaker cleared, and where the fault was. Vendor tools read only their own relays and are not on every engineer's laptop; COMTRADE is the common format, so one viewer works for every relay."
            standards={["IEEE C37.111-1999 / -2013 and IEC 60255-24 (COMTRADE: configuration, data, scaling, sample rates)", "IEC 60255-121 (distance protection: loop impedance, residual compensation k0 = (Z0 − Z1) / 3Z1)", "Fortescue symmetrical components"]}
            capabilities={["Reads .cfg + .dat pairs and 2013 single .cff files; ASCII, BINARY (16-bit), BINARY32 and FLOAT32 data; channel scaling a·x + b, primary/secondary conversion, multiple sample rates or time stamps.", "Plots currents, voltages and digital channels with inception and clearance markers.", "Detects fault inception (step change against one cycle earlier), computes one-cycle DFT phasors before and during the fault, classifies the fault (A-G … ABC) from phase and residual currents.", "Trip and breaker times from the digital channels, clearance time from the currents, apparent impedance of the faulted loop (phase-earth with k0, phase-phase), distance to fault from the line impedance; warnings for clipping, missing samples and neutral mismatch."]}
            example={{ problem: "The sample record of the S13 Q01 line fault (P132_Q01, 1600 samples/s).", steps: ["A-G fault at 06:12:31.200 UTC: IA = 5.00 kA, 3I0 = 4.88 kA.", "Trip 31 ms after inception, breaker 52a changes at 81 ms (operating time 50 ms), current cleared at 81 ms.", "Loop A-G with k0 from Z1 = 0.08 + j0.40 Ω/km and Z0 = 0.25 + j1.20 Ω/km: 4.07 Ω ∠ 78°, about 10 km from the substation."], result: "A zone 1 earth fault 10 km down the line, cleared in 81 ms — the same story as the SOE time line." }}
            notes="The record is generated for the sample; on real records compare one reading with the vendor's tool once. Apparent impedance assumes a solid fault fed from the relay end; fault resistance and remote infeed shift it (mainly in the resistive part). Files are read in your browser."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="Disturbance record">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open .cfg + .dat (or .cff)…<input type="file" multiple accept=".cfg,.dat,.cff,.CFG,.DAT,.CFF" className="hidden" onChange={(e) => open(e.target.files)} /></label>
                <button type="button" onClick={sample} className={btn}>Load sample</button>
              </div>
              <p className="mt-2 text-xs text-muted">{name}</p>
              {err && <p className="mt-1 text-sm text-fail">{err}</p>}
            </Section>
            <Section title="Line data (for distance to fault)">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="R1 (Ω/km)" value={z1} onChange={setZ1} /><TextField label="X1 (Ω/km)" value={x1} onChange={setX1} />
                <TextField label="R0 (Ω/km)" value={r0} onChange={setR0} /><TextField label="X0 (Ω/km)" value={x0} onChange={setX0} />
              </div>
              {line && <p className="mt-2 text-xs text-muted">Z1 = {line.z1.toFixed(3)} Ω/km ∠ {line.ang1.toFixed(1)}°, k0 = {line.k0mag.toFixed(3)} ∠ {line.k0ang.toFixed(1)}°</p>}
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {rec && fault && (
              <>
                <ResultCard title={`${rec.cfg.station} · ${rec.cfg.device} · COMTRADE ${rec.cfg.rev} ${rec.cfg.ft}`}>
                  <p className="mb-2 text-xs text-muted">Start {rec.cfg.start} · trigger {rec.cfg.trigger} · {rec.n} samples · {rec.cfg.analog.length} analog, {rec.cfg.digital.length} digital · {rec.cfg.freq} Hz{rec.cfg.rates[0] ? ` · ${rec.cfg.rates[0].samp} samples/s` : ""}</p>
                  <FindingList list={fault.findings} />
                </ResultCard>
                <ResultCard title="Waveforms">{I.length > 0 && <Plot r={rec} idx={I} unit="A" marks={marks} />}{V.length > 0 && <Plot r={rec} idx={V} unit="V" marks={marks} />}{rec.d.length > 0 && <Digitals r={rec} marks={marks} />}<p className="text-xs text-muted">Red: inception · green: clearance.</p></ResultCard>
                <ResultCard title="Phasors (one-cycle DFT, primary RMS)">
                  <table className="w-full text-sm"><thead><tr><th className={th}>Channel</th><th className={th}>Pre-fault</th><th className={th}>Fault</th><th className={th}>Peak in record</th></tr></thead>
                    <tbody>{Object.keys(fault.fault).map((k) => <tr key={k} className="border-t border-border text-foreground"><td className={td}>{k}</td><td className={`${td} font-mono`}>{k.startsWith("I") ? `${fault.pre[k].mag.toFixed(0)} A` : `${(fault.pre[k].mag / 1000).toFixed(2)} kV`} ∠ {fault.pre[k].ang.toFixed(0)}°</td><td className={`${td} font-mono ${fault.faulted.some((p) => k.endsWith(p)) && k.startsWith("I") ? "text-fail" : ""}`}>{k.startsWith("I") ? `${fault.fault[k].mag.toFixed(0)} A` : `${(fault.fault[k].mag / 1000).toFixed(2)} kV`} ∠ {fault.fault[k].ang.toFixed(0)}°</td><td className={`${td} font-mono`}>{k.startsWith("I") ? `${fault.peak[k].toFixed(0)} A` : `${(fault.peak[k] / 1000).toFixed(1)} kV`}</td></tr>)}</tbody></table>
                  <p className="mt-2 text-xs text-muted">Angles are absolute (record time reference); compare differences between channels.</p>
                </ResultCard>
              </>
            )}
            {!rec && <ResultCard title="Result"><p className="text-muted">Open a COMTRADE record or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
