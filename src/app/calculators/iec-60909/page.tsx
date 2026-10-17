"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Tip } from "@/components/fields";
import ProjectManager from "@/components/ProjectManager";
import NetworkEditor from "@/components/shortcircuit/NetworkEditor";
import ShortCircuitSld from "@/components/shortcircuit/ShortCircuitSld";
import {
  DEFAULT_SC_NETWORK,
  TYPICAL_CONSTANTS,
  S_BASE_MVA,
  analyseShortCircuit,
  type ScNetwork,
} from "@/lib/iec60909";


function isScNetwork(d: unknown): d is ScNetwork {
  const n = d as Partial<ScNetwork> | null;
  return (
    !!n && typeof n === "object" && !!n.settings && Array.isArray(n.buses) && Array.isArray(n.grids) &&
    Array.isArray(n.gens) && Array.isArray(n.motors) && Array.isArray(n.branches)
  );
}
const f = (x: number | null | undefined, d = 2) => (x === null || x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Iec60909Page() {
  const [net, setNet] = useState<ScNetwork>(DEFAULT_SC_NETWORK);
  const result = useMemo(() => analyseShortCircuit(net), [net]);

  // worst-case summary
  const energised = result.buses.filter((b) => b.energised);
  const maxBus = energised.length ? energised.reduce((a, b) => (b.ik3 > a.ik3 ? b : a)) : null;
  const anyBad = result.buses.some((b) => b.ratingOk === false);

  const th = "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted";
  const td = "px-3 py-2 text-right tabular-nums text-foreground";

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          IEC 60909 Short-Circuit Calculator (Buses, Transformers, Generators &amp; Motors)
        </h1>
        <p className="mt-2 max-w-3xl text-muted">
          Build a radial network — buses, utility sources, generators, motors, transformers, cables and bus ties — and the
          single-line diagram and the short-circuit current at <em>every</em> bus appear instantly: Ik″, peak, breaking, thermal,
          line-to-line and line-to-earth, plus minimum values. Several sources can feed the same bus. Calculated to IEC 60909-0
          on a {S_BASE_MVA} MVA per-unit base; full step-by-step working is below and in the PDF report.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="IEC 60909 Short-Circuit Calculation" standardsLine="IEC 60909-0 (initial, peak, breaking and thermal short-circuit currents)" />
          <FeedbackButton calculatorName="IEC 60909 Short-Circuit Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Calculates three-phase and unbalanced short-circuit currents at every bus of a radial (or tied) power system using the IEC 60909-0 equivalent-voltage-source method. Network feeders, generators, induction motors, transformers, cables and bus ties are modelled with their IEC correction factors, and the result is shown on an auto-generated single-line diagram, in a results table for all buses, and as a numbered manual calculation."
            standards={[
              "IEC 60909-0 (short-circuit currents in three-phase a.c. systems — calculation of currents)",
              "IEC 60909-1 / IEC TR 60909-1 (factors for the calculation — background)",
              "IEC 60076-5 (transformer ability to withstand short circuit; typical uk values)",
            ]}
            capabilities={[
              "Unlimited buses at different voltage levels, with network feeders, generators and motors on any bus (several sources per bus are fine).",
              "Transformers with KT impedance correction and vector-group zero-sequence handling (Dyn, YNd, YNyn, Yy), cables/lines with parallel runs, and closeable bus ties.",
              "Results at every bus without asking: Ik″ (3-phase), peak ip, breaking Ib, thermal Ith, Ik″ line-to-line, line-to-earth and line-line-earth, plus minimum-fault values.",
              "Switchgear rating check at each bus and a typical-values reference for every constant (c, R/X, uk, xd″, ILR…).",
            ]}
            example={{
              problem: "A 500 MVA, 11 kV utility feeds a 1 MVA, 6 % transformer (Dyn). What is Ik″ on the 400 V side?",
              steps: [
                "Voltage factors: cmax = 1.10 at 11 kV (source), 1.05 at 400 V (LV, +6 %).",
                "Source impedance at 11 kV: ZQ = c·Un²/Sk″ = 1.10×11²/500 = 0.2662 Ω → referred to 0.4 kV: 0.2662×(0.4/11)² = 0.000352 Ω.",
                "Transformer ZT = uk·Ur²/Sr = 0.06×0.4²/1 = 0.0096 Ω; KT = 0.95×1.05/(1+0.6×0.06) = 0.9628 → KT·ZT = 0.009243 Ω.",
                "Total Z = 0.000352 + 0.009243 = 0.009595 Ω.",
                "Ik″ = c·Un/(√3·Z) = 1.05×0.4/(1.732×0.009595) = 25.3 kA.",
              ],
              result: "≈ 25.3 kA at the LV bus — the calculator reproduces this exactly and also shows ip, Ib, Ith and earth-fault values.",
            }}
            notes="Scope and simplifications: balanced and unbalanced faults at bus level (no mid-cable faults). The peak current uses method A (uniform R/X); steady-state Ik (λ factors) is not computed; the motor breaking-current decay (μ·q) is not credited, which is conservative; Ith uses n = 1 (conservative). Taps, loads and shunt capacitance are ignored, as permitted by IEC 60909-0. Enter manufacturer data wherever available — the typical values are only starting points."
          />
        </div>

        <div className="mt-8">
          <ProjectManager<ScNetwork>
            storageKey="ajapps-iec60909-scenarios"
            fileTag="iec-60909"
            current={net}
            onLoad={setNet}
            makeNew={() => JSON.parse(JSON.stringify(DEFAULT_SC_NETWORK))}
            validate={isScNetwork}
          />
        </div>

        {/* ---------------- Auto-generated results ---------------- */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Single-line diagram &amp; short-circuit levels</h2>
            <span className="text-xs text-muted">Auto-generated from the network you enter below</span>
          </div>
          {maxBus && (
            <p className="mt-2 text-sm text-muted">
              Highest fault level: <span className="font-semibold text-foreground">{maxBus.name}</span> at{" "}
              <span className="font-semibold text-accent-2">{f(maxBus.ik3)} kA</span> (Ik″), peak {f(maxBus.ip, 1)} kA.
              {anyBad && <span className="ml-2 font-semibold text-fail">One or more buses exceed their switchgear rating.</span>}
            </p>
          )}
          <div className="mt-4">
            <ShortCircuitSld net={net} result={result} />
          </div>
          {result.warnings.length > 0 && (
            <ul className="mt-3 list-disc pl-5 text-xs text-fail">
              {result.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Short-circuit current at every bus</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">Bus</th>
                  <th className={th}>Un (kV)</th>
                  <th className={th}>Ik″ 3-ph (kA)</th>
                  <th className={th}>ip (kA)</th>
                  <th className={th}>Ib (kA)</th>
                  <th className={th}>Ith (kA)</th>
                  <th className={th}>Ik″ L-L (kA)</th>
                  <th className={th}>Ik″ L-E (kA)</th>
                  <th className={th}>Ik″ min (kA)</th>
                  <th className={th}>Rating</th>
                </tr>
              </thead>
              <tbody>
                {result.buses.map((b) => (
                  <tr key={b.busId} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 text-left font-medium text-foreground">{b.name}</td>
                    <td className={td}>{f(b.unKv, b.unKv < 1 ? 3 : 1)}</td>
                    {b.energised ? (
                      <>
                        <td className={`${td} font-semibold text-accent-2`}>{f(b.ik3)}</td>
                        <td className={td}>{f(b.ip)}</td>
                        <td className={td}>{f(b.ib)}</td>
                        <td className={td}>{f(b.ith)}</td>
                        <td className={td}>{f(b.ik2)}</td>
                        <td className={td}>{b.ikLG === null ? "n/a" : f(b.ikLG)}</td>
                        <td className={td}>{f(b.ik3Min)}</td>
                        <td className={`${td} ${b.ratingOk === null ? "" : b.ratingOk ? "text-pass" : "text-fail"}`}>
                          {b.ratingOk === null ? "–" : `${f(b.ratingKa, 0)} kA ${b.ratingOk ? "✓" : "✗"}`}
                        </td>
                      </>
                    ) : (
                      <td className="px-3 py-2 text-right text-muted" colSpan={8}>
                        not energised — no source connected
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Maximum values use cmax with all sources and motors; “min” uses cmin, motors off and cables at 80 °C. “L-E” = line-to-earth;
            n/a means no zero-sequence path to earth.
          </p>
        </div>

        <NetworkEditor net={net} setNet={setNet} />

        {/* ---------------- Manual calculation ---------------- */}
        <div className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Step-by-step manual calculation (IEC 60909-0)</h2>
          <p className="mt-1 text-xs text-muted">
            Every number above can be reproduced by hand from these steps. Impedances are shown in per unit on {S_BASE_MVA} MVA;
            the bus Thevenin impedance combines all sources, transformers and cables (series/parallel reduction).
          </p>

          <h3 className="mt-5 text-sm font-semibold text-foreground">A. Element impedances</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-muted">
            {result.elementLines.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>

          <h3 className="mt-5 text-sm font-semibold text-foreground">B. Fault calculation at each bus</h3>
          <div className="mt-2 space-y-4">
            {result.buses.map((b) => (
              <div key={b.busId} className="rounded-lg border border-border bg-surface-2/60 p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {b.name} <span className="font-normal text-muted">({f(b.unKv, b.unKv < 1 ? 3 : 1)} kV)</span>
                  </h4>
                  {b.energised && <span className="text-sm font-semibold text-accent-2">Ik″ = {f(b.ik3)} kA</span>}
                </div>
                <ol className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
                  {b.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
                {b.energised && b.contributions.length > 0 && (
                  <p className="mt-2 text-xs text-muted">
                    Contributions to Ik″:{" "}
                    {b.contributions.map((c) => `${c.name} ${f(c.ikKa)} kA`).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- Typical constants ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="flex items-center text-lg font-semibold text-foreground">
            Typical values of the constants
            <Tip text="Starting points when manufacturer or utility data is not available. Always replace them with nameplate, test-report or utility values for design work." />
          </h2>
          <div className="mt-4 space-y-5">
            {TYPICAL_CONSTANTS.map((g) => (
              <div key={g.group}>
                <h3 className="text-sm font-semibold text-foreground">{g.group}</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[520px] text-xs">
                    <tbody>
                      {g.rows.map((r) => (
                        <tr key={r.name} className="border-b border-border/60 last:border-0">
                          <td className="py-1.5 pr-3 text-foreground">{r.name}</td>
                          <td className="py-1.5 pr-3 font-medium text-accent-2">{r.value}</td>
                          <td className="py-1.5 text-muted">{r.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
