"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Tip } from "@/components/fields";
import ProjectManager from "@/components/ProjectManager";
import ShortCircuitSld, { type SldOverlay } from "@/components/shortcircuit/ShortCircuitSld";
import NetworkEditor from "@/components/shortcircuit/NetworkEditor";
import ArcFlashInputs from "@/components/arcflash/ArcFlashInputs";
import ArcFlashLabel from "@/components/arcflash/ArcFlashLabel";
import { BoundaryDiagram, EnergyVsDistanceChart, EnergyVsTimeChart, RankingChart } from "@/components/arcflash/AfCharts";
import { analyseShortCircuit, type ScNetwork } from "@/lib/iec60909";
import { afOf, analyseArcFlash, makeDefaultAfNetwork } from "@/lib/arcflashstudy";
import { ELECTRODE_CONFIG_INFO, EQUIPMENT_CLASSES } from "@/lib/arcflash2018";

const f = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));

function isScNetwork(d: unknown): d is ScNetwork {
  const n = d as Partial<ScNetwork> | null;
  return !!n && typeof n === "object" && !!n.settings && Array.isArray(n.buses) && Array.isArray(n.grids) && Array.isArray(n.gens) && Array.isArray(n.motors) && Array.isArray(n.branches);
}

export default function ArcFlashStudyPage() {
  const [net, setNet] = useState<ScNetwork>(() => makeDefaultAfNetwork());
  const [selId, setSelId] = useState<string>("");
  const [studyDate, setStudyDate] = useState("");

  const sc = useMemo(() => analyseShortCircuit(net), [net]);
  const study = useMemo(() => analyseArcFlash(net, sc), [net, sc]);

  // keep a valid bus selected
  const selectedId = net.buses.some((b) => b.id === selId) ? selId : net.buses[0]?.id ?? "";
  const sel = study.find((s) => s.busId === selectedId) ?? null;
  const selBus = net.buses.find((b) => b.id === selectedId);

  useEffect(() => {
    const clear = () => document.documentElement.classList.remove("printing-labels");
    window.addEventListener("afterprint", clear);
    return () => window.removeEventListener("afterprint", clear);
  }, []);

  const printLabels = () => {
    document.documentElement.classList.add("printing-labels");
    setTimeout(() => window.print(), 50);
  };

  const overlay = useMemo(() => {
    const o: Record<string, SldOverlay> = {};
    for (const s of study) {
      if (s.model === "none") {
        o[s.busId] = { color: "#64748b", lines: ["no result", s.warnings[0] ?? ""], frac: 0, selected: s.busId === selectedId };
        continue;
      }
      o[s.busId] = {
        color: s.ppe.color,
        lines: [
          `E = ${f(s.eCal, 1)} cal/cm²`,
          `AFB ${f(s.afbMm, 0)} mm @ ${f(s.workingMm, 0)} mm`,
          `${s.ppe.cat === 5 ? "DANGER > 40" : s.ppe.cat === 0 ? "Cat 0" : `PPE Cat ${s.ppe.cat}`} · Ibf ${f(s.ibfMaxKa, 1)} kA`,
        ],
        frac: Math.min(1, s.eCal / 40),
        selected: s.busId === selectedId,
      };
    }
    return o;
  }, [study, selectedId]);

  const worst = study.filter((s) => s.model !== "none").sort((a, b) => b.eCal - a.eCal)[0];
  const th = "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted";
  const td = "px-3 py-2 text-right tabular-nums text-foreground";

  const upstreamText = (busId: string) => {
    const b = net.buses.find((x) => x.id === busId);
    if (!b) return "";
    const p = afOf(b).protection;
    return p.mode === "fixed" ? `clears in ${f(p.fixedMs, 0)} ms` : `${p.curveFamily} ${p.curveType} relay, pickup ${f(p.pickupA, 0)} A, TMS ${f(p.tms, 2)}`;
  };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Arc Flash Study (IEEE 1584-2018) — Network, Labels &amp; PPE</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Build the network once and get the arc-flash incident energy, boundary, PPE category and warning label for <em>every</em> bus.
          Fault currents come from the IEC 60909 short-circuit model, the arc duration from the protective device you describe, and
          the arc-flash result from the full IEEE 1584-2018 model (208 V – 15 kV) at both maximum and minimum fault current, including the
          reduced-arcing-current check. Includes a colour-coded single-line diagram, boundary and energy graphs, a what-if for faster
          clearing, printable NFPA 70E style labels and the step-by-step calculation.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Arc Flash Study (IEEE 1584-2018)" standardsLine="IEEE 1584-2018 · IEC 60909-0 · NFPA 70E reference tables" />
          <FeedbackButton calculatorName="Arc Flash Study (IEEE 1584-2018)" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Performs an arc-flash hazard study on a power-system model. For each bus it finds the bolted fault current (IEC 60909), the arcing current and arc duration (from the protective device), then the incident energy and arc-flash boundary from IEEE 1584-2018, and assigns an NFPA 70E-style PPE category with a printable label. A what-if shows how much a faster clearing time (maintenance mode, arc-flash relay) would reduce the energy."
            standards={[
              "IEEE Std 1584-2018 (IEEE Guide for Performing Arc-Flash Hazard Calculations)",
              "IEC 60909-0 (short-circuit currents — used for the bolted fault current)",
              "NFPA 70E-2018 (PPE categories and shock approach boundaries — reference values)",
            ]}
            capabilities={[
              "Full IEEE 1584-2018 model: five electrode configurations, enclosure-size correction, voltage interpolation between 600 V / 2.7 kV / 14.3 kV, the ≤ 600 V equations, and the arcing-current variation (reduced current) check.",
              "Both maximum and minimum fault currents are evaluated and the worse incident energy is reported.",
              "Auto-populated single-line diagram coloured by PPE category, boundary plan view, energy-against-distance and energy-against-time graphs.",
              "Protective device by fixed clearing time or IDMT relay curve (IEC/IEEE), with maintenance-mode what-if and the clearing time needed to reach Category 2 or the arc-flash boundary threshold.",
              "Printable warning labels and a numbered manual calculation per bus.",
            ]}
            example={{
              problem: "IEEE 1584-2018 Annex D.1: 4.16 kV switchgear, VCB, Ibf = 15 kA, gap 104 mm, working distance 914.4 mm, enclosure 1143 × 762 mm, arc duration 197 ms (223 ms at the reduced arcing current).",
              steps: [
                "Intermediate arcing currents (Eq 1): 11.117, 12.816 and 14.116 kA at 0.6, 2.7 and 14.3 kV → interpolated to 4.16 kV: Iarc = 12.979 kA.",
                "Enclosure correction: Width1 = 27.632 in, Height1 = 45 in, EES = 36.316 → CF = 1.284.",
                "Intermediate energies (Eq 3–5) interpolated (Eq 20): E = 12.152 J/cm² (2.90 cal/cm²); boundary 1606 mm.",
                "Variation factor VarCf = 0.047 → Iarc_min = 12.675 kA, T = 223 ms → E = 13.343 J/cm² (3.19 cal/cm²), boundary 1704 mm.",
                "The higher result governs: 3.19 cal/cm² → PPE Category 1, boundary 1.70 m.",
              ],
              result: "The calculator reproduces every published value of both Annex D examples (4.16 kV and 480 V) and is regression-tested against them.",
            }}
            notes="PPE category note: NFPA 70E uses PPE categories with its table method; when incident energy is calculated, select arc-rated clothing with an arc rating at least equal to the incident energy, and label equipment with either the incident energy or the PPE category, not both (NFPA 70E 130.5(H)). The category shown here is an indicative mapping of the energy to the 4/8/25/40 cal/cm\u00b2 clothing levels. Arc-flash results are estimates for planning safe work, not a guarantee. Verify equipment data in the field; use manufacturer time-current curves for the arc duration (worst case of the band); consider every operating mode and source. Fault-current and protective-device data are only as good as the inputs. Not covered: DC and single-phase systems, multi-stage clearing with several sources (the total arcing current is cleared at one time), current-limiting fuse and breaker let-through models, and systems above 15 kV (Ralph Lee shown as an indication only). NFPA 70E tables are reference values — confirm against the edition in force."
          />
        </div>

        <div className="mt-8">
          <ProjectManager<ScNetwork>
            storageKey="ajapps-arcflash-scenarios"
            fileTag="arc-flash-study"
            current={net}
            onLoad={setNet}
            makeNew={makeDefaultAfNetwork}
            validate={isScNetwork}
          />
        </div>

        {/* ---------------- Results ---------------- */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Single-line diagram — incident energy by bus</h2>
            <span className="text-xs text-muted">Click a bus to inspect it below</span>
          </div>
          {worst && (
            <p className="mt-2 text-sm text-muted">
              Highest incident energy: <span className="font-semibold text-foreground">{worst.name}</span> at{" "}
              <span className="font-semibold" style={{ color: worst.ppe.color }}>{f(worst.eCal, 1)} cal/cm²</span> ({worst.ppe.name}), boundary {f(worst.afbMm / 1000, 2)} m.
            </p>
          )}
          <div className="mt-4">
            <ShortCircuitSld net={net} result={sc} overlay={overlay} onSelectBus={setSelId} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">
            {[
              ["#34d399", "< 1.2 cal/cm² (Cat 0)"],
              ["#a3e635", "≤ 4 (Cat 1)"],
              ["#fbbf24", "≤ 8 (Cat 2)"],
              ["#fb923c", "≤ 25 (Cat 3)"],
              ["#f87171", "≤ 40 (Cat 4)"],
              ["#e11d48", "> 40 — DANGER"],
            ].map(([c, l]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Arc-flash results at every bus</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">Bus</th>
                  <th className={th}>Voc (kV)</th>
                  <th className={th}>Ibf max / min (kA)</th>
                  <th className={th}>Iarc (kA)</th>
                  <th className={th}>Arc time (ms)</th>
                  <th className={th}>E (cal/cm²)</th>
                  <th className={th}>AFB (mm)</th>
                  <th className={th}>Work dist (mm)</th>
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">PPE</th>
                  <th className={th}>With maintenance mode</th>
                  <th className={th}>Clear in ≤ (ms) for 8 cal/cm²</th>
                </tr>
              </thead>
              <tbody>
                {study.map((s) => (
                  <tr key={s.busId} onClick={() => setSelId(s.busId)} className={`cursor-pointer border-b border-border/60 last:border-0 ${s.busId === selectedId ? "bg-accent-2/10" : ""}`}>
                    <td className="px-3 py-2 text-left font-medium text-foreground">{s.name}</td>
                    <td className={td}>{f(s.unKv, s.unKv < 1 ? 3 : 1)}</td>
                    {s.model === "none" ? (
                      <td colSpan={9} className="px-3 py-2 text-right text-muted">{s.warnings[0]}</td>
                    ) : (
                      <>
                        <td className={td}>{f(s.ibfMaxKa, 1)} / {f(s.ibfMinKa, 1)}</td>
                        <td className={td}>{s.governing ? f(s.governing.iarcKa, 1) : "–"}</td>
                        <td className={td}>{s.governing ? f(s.governing.tMs, 0) : "–"}</td>
                        <td className={`${td} font-semibold`} style={{ color: s.ppe.color }}>{f(s.eCal, 1)}</td>
                        <td className={td}>{f(s.afbMm, 0)}</td>
                        <td className={td}>{f(s.workingMm, 0)}</td>
                        <td className="px-3 py-2 text-left text-foreground">
                          <span className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: s.ppe.color, color: s.ppe.cat >= 3 ? "#fff" : "#111827" }}>
                            {s.ppe.cat === 5 ? "DANGER" : s.ppe.cat === 0 ? "Cat 0" : `Cat ${s.ppe.cat}`}
                          </span>
                          {s.model === "lee" && <span className="ml-1 text-[10px] text-muted">(Lee, indicative)</span>}
                        </td>
                        <td className={td}>
                          {s.mitigated ? (
                            <span style={{ color: s.mitigated.ppe.color }}>{f(s.mitigated.eCal, 1)} ({f(s.mitigated.tMs, 0)} ms)</span>
                          ) : (
                            "–"
                          )}
                        </td>
                        <td className={td}>{s.reqMsForCat2 !== null ? f(s.reqMsForCat2, 0) : s.eCal <= 8 ? "met" : "–"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {study.some((s) => s.warnings.length > 0 && s.model !== "none") && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-fail">
              {study.flatMap((s) => (s.model === "none" ? [] : s.warnings.map((w) => <li key={`${s.busId}-${w}`}>{s.name}: {w}</li>)))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">
            E is the higher of the average-arcing-current and reduced-arcing-current cases, at the worse of the maximum and minimum fault
            current. Arc time is the protective-device clearing time at the governing arcing current. Select a row for graphs and the label.
          </p>
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-foreground">Ranking</h3>
            <div className="mt-2">
              <RankingChart rows={study} />
            </div>
          </div>
        </div>

        {/* ---------------- Selected bus ---------------- */}
        {sel && selBus && sel.model !== "none" && (
          <div className="mt-6 rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">Detail — {sel.name}</h2>
              <select value={selectedId} onChange={(e) => setSelId(e.target.value)} className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none">
                {net.buses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div className="mt-4 grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="flex items-center text-sm font-semibold text-foreground">
                  Approach and arc-flash boundaries
                  <Tip text="Plan view around the equipment: the red ring is the arc-flash boundary (where the energy falls to 1.2 cal/cm²), the cyan ring is the NFPA 70E limited approach boundary and the purple ring the restricted approach boundary. The amber W is the working distance." />
                </h3>
                <div className="mt-2">
                  <BoundaryDiagram r={sel} />
                </div>
              </div>
              <div>
                <h3 className="flex items-center text-sm font-semibold text-foreground">
                  Incident energy against working distance
                  <Tip text="How the incident energy falls as the worker stands farther from the arc. Dashed lines mark the PPE category limits." />
                </h3>
                <div className="mt-2">
                  <EnergyVsDistanceChart r={sel} />
                </div>
              </div>
              <div className="lg:col-span-2">
                <h3 className="flex items-center text-sm font-semibold text-foreground">
                  Incident energy against total clearing time
                  <Tip text="For a fixed arcing current the energy is directly proportional to the clearing time. Read across to see how fast the device must clear to reach a lower PPE category." />
                </h3>
                <div className="mx-auto mt-2 max-w-2xl">
                  <EnergyVsTimeChart r={sel} />
                </div>
                <p className="mt-2 text-xs text-muted">
                  {sel.reqMsForCat2 !== null
                    ? `To bring this bus to 8 cal/cm² (PPE Category 2) the arc must clear within about ${f(sel.reqMsForCat2, 0)} ms at the arcing current${sel.reqMsForLow !== null ? `; to reach the 1.2 cal/cm² threshold at the working distance, about ${f(sel.reqMsForLow, 0)} ms` : ""}.`
                    : sel.eCal <= 8
                      ? "The incident energy is already at or below 8 cal/cm² (Category 2)."
                      : ""}
                  {sel.mitigated && ` With maintenance mode (${f(sel.mitigated.tMs, 0)} ms) the energy drops from ${f(sel.eCal, 1)} to ${f(sel.mitigated.eCal, 1)} cal/cm² (${sel.mitigated.ppe.name}).`}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-border bg-surface-2/60 p-4 text-xs text-muted">
              <div className="font-semibold text-foreground">{sel.ppe.name}</div>
              <p className="mt-1">{sel.ppe.summary}</p>
            </div>
          </div>
        )}

        {/* ---------------- Labels ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Arc-flash warning labels</h2>
            <div className="no-print flex flex-wrap items-center gap-2">
              <input
                value={studyDate}
                onChange={(e) => setStudyDate(e.target.value)}
                placeholder="Study date, e.g. 2026-10-17"
                className="w-48 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
              />
              <button type="button" onClick={printLabels} className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-background transition-opacity hover:opacity-90">
                Print labels
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted">One label per bus, in the NFPA 70E / ANSI Z535 style. Print on adhesive label stock and attach to the equipment. Re-print after any change to the system.</p>
          <div className="af-print-area mt-4 grid gap-4 sm:grid-cols-2">
            {study
              .filter((s) => s.model !== "none")
              .map((s) => (
                <ArcFlashLabel key={s.busId} r={s} upstream={upstreamText(s.busId)} date={studyDate || "________"} />
              ))}
          </div>
        </div>

        {/* ---------------- Inputs ---------------- */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">1 · Network (short-circuit model)</h2>
          <p className="mt-1 text-sm text-muted">The same editor as the IEC 60909 calculator. Add buses, sources, transformers, cables and ties; the diagram and fault levels follow.</p>
        </div>
        <NetworkEditor net={net} setNet={setNet} />

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">2 · Arc-flash data and protection for each bus</h2>
          <p className="mt-1 text-sm text-muted">Equipment class, electrode configuration, enclosure, working distance, and the device that clears an arcing fault.</p>
        </div>
        <div className="mt-4">
          <ArcFlashInputs net={net} setNet={setNet} />
        </div>

        {/* ---------------- Manual calculation ---------------- */}
        <div className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Step-by-step manual calculation (IEEE 1584-2018)</h2>
          <p className="mt-1 text-xs text-muted">
            Each bus lists the inputs, intermediate values and final results so the study can be checked by hand against the equations of
            clause 4. The fault current itself comes from the IEC 60909 working on the Short Circuit page.
          </p>
          <div className="mt-4 space-y-4">
            {study.map((s) => (
              <div key={s.busId} className="rounded-lg border border-border bg-surface-2/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {s.name} <span className="font-normal text-muted">({f(s.unKv, s.unKv < 1 ? 3 : 1)} kV · {s.equipLabel} · {s.config} · gap {f(s.gapMm, 0)} mm)</span>
                  </h3>
                  {s.model !== "none" && <span className="text-sm font-semibold" style={{ color: s.ppe.color }}>{f(s.eCal, 2)} cal/cm²</span>}
                </div>
                {s.steps.length === 0 ? (
                  <p className="mt-2 text-xs text-muted">{s.warnings[0]}</p>
                ) : (
                  <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted">
                    {s.steps.map((st, i) => (
                      <li key={i} className={st.startsWith("—") ? "list-none font-semibold text-foreground" : ""}>
                        {st}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- Typical values ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="flex items-center text-lg font-semibold text-foreground">
            Typical values and reference tables
            <Tip text="Starting points from IEEE 1584-2018 Tables 8 and 10. Measured equipment data is always preferred." />
          </h2>
          <h3 className="mt-4 text-sm font-semibold text-foreground">Equipment classes (IEEE 1584-2018 Tables 8 and 10)</h3>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-1.5 pr-3">Equipment</th><th className="py-1.5 pr-3">Gap (mm)</th><th className="py-1.5 pr-3">Enclosure H × W × D (mm)</th><th className="py-1.5">Working distance (mm)</th>
                </tr>
              </thead>
              <tbody>
                {EQUIPMENT_CLASSES.filter((e) => e.id !== "custom").map((e) => (
                  <tr key={e.id} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-3 text-foreground">{e.label}</td>
                    <td className="py-1.5 pr-3 text-accent-2">{e.gapMm}</td>
                    <td className="py-1.5 pr-3 text-muted">{e.heightMm} × {e.widthMm} × {e.depthMm}</td>
                    <td className="py-1.5 text-muted">{e.workingDistMm}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mt-5 text-sm font-semibold text-foreground">Electrode configurations</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            {ELECTRODE_CONFIG_INFO.map((c) => (
              <li key={c.value}><span className="font-medium text-foreground">{c.label}.</span> {c.hint}</li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-semibold text-foreground">PPE categories (NFPA 70E reference)</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted">
            <li><span className="font-medium text-foreground">Category 1 — up to 4 cal/cm²:</span> arc-rated shirt and pants, arc-rated face shield or hood, hard hat, leather gloves, leather footwear as needed.</li>
            <li><span className="font-medium text-foreground">Category 2 — up to 8 cal/cm²:</span> as Category 1 at the higher rating, arc-rated balaclava and face shield or hood.</li>
            <li><span className="font-medium text-foreground">Category 3 — up to 25 cal/cm²:</span> arc flash suit with hood, arc-rated gloves.</li>
            <li><span className="font-medium text-foreground">Category 4 — up to 40 cal/cm²:</span> multi-layer arc flash suit with hood and gloves.</li>
            <li><span className="font-medium text-foreground">Above 40 cal/cm²:</span> no standard PPE is adequate — reduce the energy or de-energize.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
