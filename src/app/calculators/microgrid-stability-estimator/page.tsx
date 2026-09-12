"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_MICROGRID_STABILITY_INPUT, MicrogridStabilityInput, calcMicrogridStability } from "@/lib/microgridStability";

export default function MicrogridStabilityEstimatorPage() {
  const [input, setInput] = useState<MicrogridStabilityInput>(DEFAULT_MICROGRID_STABILITY_INPUT);
  const update = (patch: Partial<MicrogridStabilityInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcMicrogridStability(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Microgrid Stability Estimator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          A simplified 0-100 Stability Index for islanded microgrid
          screening, from generation headroom, system inertia, and
          operating reserve margin.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Microgrid Stability Estimator" standardsLine="Simplified composite screening heuristic — see About panel for the exact scoring model and its limits" />
          <FeedbackButton calculatorName="Microgrid Stability Estimator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Produces a simplified 0-100 Stability Index for a proposed islanded microgrid, combining three factors commonly cited as first-order drivers of islanded stability: how much generation headroom exists above the load, how much rotational/synthetic inertia the system has, and the planned operating reserve margin. This is a first-pass screening indicator to flag obviously under-resourced designs early — it is explicitly not a substitute for a real dynamic (small-signal or transient) stability study."
            standards={["Simplified composite screening heuristic: Index = 40×min(1,(supportRatio−1)/0.5) + 30×min(1,inertiaFactor) + 30×min(1,marginPct/20) — a screening model, not a literal power-system dynamics calculation"]}
            capabilities={[
              "Source support ratio (dispatchable generation capacity ÷ load) and headroom score.",
              "Inertia score from a normalized 0-1 system inertia factor.",
              "Reserve margin score from planned operating reserve percentage.",
              "Composite Stability Index with an UNSTABLE→ROBUST classification.",
            ]}
            example={{
              problem: "1200kW dispatchable generation capacity, 800kW load, inertia factor 0.6, 15% reserve margin.",
              steps: [
                "Support ratio = 1200/800 = 1.5 → headroom score = 40×min(1,0.5/0.5) = 40",
                "Inertia score = 30×0.6 = 18",
                "Margin score = 30×min(1,15/20) = 22.5",
                "Index = 40+18+22.5 = 80.5",
              ],
              result: "Stability Index ≈80.5 — STABLE band.",
            }}
            notes="This is a deliberately simple composite heuristic for early-stage screening, not a substitute for real islanded-microgrid dynamic studies (frequency/voltage transient response, protection coordination, grid-forming vs grid-following inverter control interactions, and black-start sequencing). A design that scores well here can still fail a detailed dynamic study, and vice versa — use this only to flag obviously under-resourced concepts before committing to detailed engineering."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Generation & load">
              <NumberField label="Dispatchable generation capacity" tip="Total capacity of all sources able to actively support the microgrid (gensets, grid-forming inverters/BESS, etc.) — not simply nameplate PV, which can't provide firm support on its own." unit="kW" value={input.sourceSupportCapacityKw} onChange={(v) => update({ sourceSupportCapacityKw: v })} min={0} />
              <NumberField label="Load demand" unit="kW" value={input.loadDemandKw} onChange={(v) => update({ loadDemandKw: v })} min={0} />
            </Section>

            <Section title="Inertia & reserve">
              <NumberField label="System inertia factor" tip="Normalized 0-1: 0 = pure grid-following inverters with no synthetic inertia, 1 = strong synchronous or synthetic/virtual inertia support." value={input.inertiaFactor} onChange={(v) => update({ inertiaFactor: v })} min={0} max={1} step={0.05} />
              <NumberField label="Reserve margin" unit="%" value={input.reserveMarginPct} onChange={(v) => update({ reserveMarginPct: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.stabilityIndex == null ? (
                <EmptyResult message="Enter generation capacity and load to see the Stability Index." />
              ) : (
                <ResultCard title="Stability Index">
                  <ResultRow label="Support ratio" value={result.supportRatio!.toFixed(2)} />
                  <ResultRow label="Headroom score" value={`${result.headroomScore!.toFixed(1)} / 40`} />
                  <ResultRow label="Inertia score" value={`${result.inertiaScore!.toFixed(1)} / 30`} />
                  <ResultRow label="Margin score" value={`${result.marginScore!.toFixed(1)} / 30`} />
                  <ResultRow label="Stability Index" value={result.stabilityIndex.toFixed(1)} />
                  <ResultRow label="Class" value={result.stabilityClass!} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
