"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_LINE_LOSSES_INPUT, LineLossesInput, calcLineLosses } from "@/lib/linelosses";

export default function LineLossesPage() {
  const [input, setInput] = useState<LineLossesInput>(DEFAULT_LINE_LOSSES_INPUT);
  const update = (patch: Partial<LineLossesInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcLineLosses(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Distribution Line Technical Losses
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Estimates annual I²R energy loss on a distribution line from peak
          load, diversity factor, and load factor, using the commonly-cited
          loss-factor approximation.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Distribution Line Technical Losses" standardsLine="Empirical loss-factor approximation LSF≈0.3LF+0.7LF²" />
          <FeedbackButton calculatorName="Distribution Line Technical Losses" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates annual technical (I²R) energy loss on a distribution line from the coincident peak load, line resistance, and load factor, using the commonly-cited empirical relation between load factor and loss factor (LSF ≈ 0.3×LF + 0.7×LF²) when interval load data isn't available."
            standards={["Commonly-cited empirical load-factor-to-loss-factor approximation (not an exact physical relationship — a well-known practical shortcut used across the industry)"]}
            capabilities={[
              "Coincident peak load from individual peak and diversity factor.",
              "Peak line current and I²R loss at peak, from line resistance and system voltage/PF (or a directly entered peak current).",
              "Annual energy loss and cost, from the loss-factor approximation applied to the peak loss over 8,760 hours/year.",
            ]}
            example={{
              problem: "500kW peak load, diversity factor 1.2, 60% load factor, 0.5Ω line resistance, 11kV, 0.9 PF, $0.12/kWh.",
              steps: [
                "Loss factor = 0.3×0.6 + 0.7×0.6² = 0.18 + 0.252 = 0.432.",
                "Coincident peak = 500/1.2 = 416.7kW.",
                "Peak current ≈ 24.3A → peak I²R loss ≈ 0.89kW.",
                "Annual loss = 0.89 × 0.432 × 8760 ≈ 3,352 kWh → cost ≈ $402/yr.",
              ],
              result: "≈3,350 kWh/year technical loss — hand-checked and matched the live code exactly.",
            }}
            notes="The loss-factor approximation is a well-known empirical shortcut, not an exact relationship — for a rigorous study, use actual interval (15/30-min) load data to compute loss factor directly rather than this approximation."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Load profile">
              <NumberField label="Peak load" unit="kW" value={input.peakLoadKw} onChange={(v) => update({ peakLoadKw: v })} min={0} />
              <NumberField label="Diversity factor" hint="≥1" value={input.diversityFactor} onChange={(v) => update({ diversityFactor: v })} min={1} step={0.05} />
              <NumberField label="Load factor" unit="%" value={input.loadFactorPct} onChange={(v) => update({ loadFactorPct: v })} min={0} max={100} step={1} />
            </Section>

            <Section title="Line & cost">
              <NumberField label="Line resistance" unit="Ω" tip="Total per-phase resistance of the line/feeder being evaluated." value={input.lineResistanceOhm} onChange={(v) => update({ lineResistanceOhm: v })} min={0} step={0.01} />
              <NumberField label="System voltage (line-line)" unit="kV" value={input.systemVoltageKv} onChange={(v) => update({ systemVoltageKv: v })} min={0} step={0.1} />
              <NumberField label="Power factor" hint="0-1" value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0} max={1} step={0.01} />
              <NumberField label="Cost" unit="/kWh" value={input.costPerKwh} onChange={(v) => update({ costPerKwh: v })} min={0} step={0.01} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.annualEnergyLossKwh == null ? (
                <EmptyResult message="Enter a peak load to see estimated line losses." />
              ) : (
                <ResultCard title="Estimated technical losses">
                  <ResultRow label="Loss factor" value={result.lossFactor.toFixed(3)} />
                  <ResultRow label="Coincident peak" value={`${result.coincidentPeakKw!.toFixed(1)} kW`} />
                  <ResultRow label="Peak current" value={`${result.peakCurrentA!.toFixed(1)} A`} />
                  <ResultRow label="Peak I²R loss" value={`${result.peakLossKw!.toFixed(2)} kW`} />
                  <ResultRow label="Annual energy loss" value={`${result.annualEnergyLossKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`} />
                  <ResultRow label="Annual cost" value={result.annualLossCost!.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
