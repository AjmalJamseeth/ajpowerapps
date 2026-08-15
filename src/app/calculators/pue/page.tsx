"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_PUE_INPUT, PueInput, calcPue } from "@/lib/pue";

export default function PuePage() {
  const [input, setInput] = useState<PueInput>(DEFAULT_PUE_INPUT);
  const update = (patch: Partial<PueInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcPue(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Data Center PUE Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Power Usage Effectiveness (PUE) and DCiE from total facility and IT
          equipment energy, with non-IT overhead energy/cost and an
          efficiency-band classification against the commonly-cited Green
          Grid PUE scale.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Data Center PUE Calculator" standardsLine="ISO/IEC 30134-2 / Green Grid" />
          <FeedbackButton calculatorName="Data Center PUE Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes Power Usage Effectiveness (PUE) — the ratio of total facility energy to IT equipment energy — and its reciprocal, DCiE, from a measured energy period (e.g. a month or a year). Breaks out the non-IT 'overhead' energy (cooling, power distribution losses, lighting, etc.) and its estimated cost, and classifies the result against the commonly-cited Green Grid PUE efficiency scale."
            standards={["ISO/IEC 30134-2 (PUE metric definition & measurement methodology)", "The Green Grid PUE/DCiE white paper (originating definition)"]}
            capabilities={[
              "PUE = Total Facility Energy / IT Equipment Energy.",
              "DCiE (%) = 1/PUE — the reciprocal, expressed as IT equipment's share of total energy.",
              "Non-IT overhead energy and its estimated cost at a given electricity rate, over the same measurement period as the inputs.",
              "Efficiency-band classification (world-class to very inefficient) against the commonly-cited Green Grid PUE scale.",
            ]}
            example={{
              problem: "A data center measures 1,500,000 kWh total facility energy and 1,000,000 kWh IT equipment energy over a year, at $0.12/kWh.",
              steps: [
                "PUE = 1,500,000 / 1,000,000 = 1.50.",
                "DCiE = 1/1.50 = 66.67% — the IT equipment consumes about two-thirds of total facility energy.",
                "Overhead energy = 1,500,000 − 1,000,000 = 500,000 kWh, or 33.3% of the total.",
                "Overhead cost = 500,000 kWh × $0.12/kWh = $60,000 for the period.",
              ],
              result: "PUE = 1.50, DCiE = 66.67%, $60,000 of overhead energy cost for the period — classified as 'Moderate' on the Green Grid scale — hand-checked and matched the live code exactly.",
            }}
            notes="The efficiency bands (world-class <1.2 through very inefficient ≥3.0) are the commonly-cited informal Green Grid scale from its original 2007 guidance, not a formal ISO/IEC-mandated classification — ISO/IEC 30134-2 standardizes the PUE metric and measurement methodology itself, not efficiency bands. Enter total facility and IT equipment energy over the same measurement period and metering boundary for a meaningful result."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Energy inputs">
              <NumberField
                label="Total facility energy"
                unit="kWh"
                tip="Total energy consumed by the entire data center facility over the measurement period — IT equipment plus all supporting infrastructure (cooling, UPS/PDU losses, lighting, etc.)."
                value={input.totalFacilityEnergyKwh}
                onChange={(v) => update({ totalFacilityEnergyKwh: v })}
                min={0}
              />
              <NumberField
                label="IT equipment energy"
                unit="kWh"
                tip="Energy consumed by IT equipment only (servers, storage, network gear) over the same measurement period, typically measured at the PDU or rack level."
                value={input.itEquipmentEnergyKwh}
                onChange={(v) => update({ itEquipmentEnergyKwh: v })}
                min={0}
              />
              <NumberField
                label="Electricity rate"
                unit="/kWh"
                tip="Used only to estimate the overhead energy's cost for the measurement period."
                value={input.electricityRate}
                onChange={(v) => update({ electricityRate: v })}
                min={0}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.pue == null ? (
                <EmptyResult message="Enter total facility and IT equipment energy (total must be ≥ IT energy) to see PUE results." />
              ) : (
                <ResultCard title="PUE result">
                  <ResultRow label="PUE" value={<span className="text-lg text-accent-2">{result.pue.toFixed(3)}</span>} />
                  {result.dciePct != null && <ResultRow label="DCiE" value={`${result.dciePct.toFixed(1)}%`} />}
                  {result.overheadEnergyKwh != null && <ResultRow label="Overhead energy" value={`${result.overheadEnergyKwh.toLocaleString()} kWh (${result.overheadPct?.toFixed(1)}%)`} />}
                  {result.overheadAnnualCost != null && <ResultRow label="Overhead energy cost" value={result.overheadAnnualCost.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
                  <ResultRow label="Efficiency band" value={result.bandLabel} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
