"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_PEAK_SHAVING_INPUT, PeakShavingInput, calcPeakShaving } from "@/lib/peakShaving";

export default function SmartGridPeakShavingPage() {
  const [input, setInput] = useState<PeakShavingInput>(DEFAULT_PEAK_SHAVING_INPUT);
  const update = (patch: Partial<PeakShavingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcPeakShaving(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Smart Grid Peak Shaving Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Sizes a Battery Energy Storage System (BESS) to shave peak
          demand to a target level, and estimates demand-charge savings
          and simple payback.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Smart Grid Peak Shaving Calculator" standardsLine="Peak-shaving BESS sizing from required shave, round-trip efficiency, and demand-charge economics" />
          <FeedbackButton calculatorName="Smart Grid Peak Shaving Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Sizes a BESS power rating and energy capacity to shave a facility's peak demand from its current level down to a target level for a given peak duration, then estimates the resulting monthly/annual demand-charge savings, total capital cost, and simple payback period."
            standards={["Peak-shaving BESS sizing: power = required shave × margin; energy = (required shave × duration) ÷ round-trip efficiency"]}
            capabilities={[
              "Required shave, BESS power rating (with an inverter margin), and energy capacity (with round-trip efficiency).",
              "Monthly and annual demand-charge savings from the shaved kW and the utility's demand charge rate.",
              "Optional capital cost input for total cost and simple payback in years.",
              "Classification from NO REDUCTION NEEDED to LOW-BENEFIT/INFEASIBLE based on shave ratio, duration, and payback.",
            ]}
            example={{
              problem: "1000kW peak, target 750kW, 2-hour peak duration, 90% round-trip efficiency, 10% inverter margin, $15/kW-month demand charge, $400/kWh BESS cost.",
              steps: [
                "Required shave = 1000−750 = 250kW",
                "BESS power = 250×1.10 = 275kW; BESS energy = (250×2)/0.9 ≈ 555.6kWh",
                "Monthly savings = 250×$15 = $3750; annual = $45,000",
                "Capital cost = 555.6×$400 ≈ $222,222; payback ≈ 222,222/45,000 ≈ 4.9 years",
              ],
              result: "275kW / 555.6kWh BESS, ≈$45,000/yr savings, ≈4.9-year simple payback — STANDARD class.",
            }}
            notes="This is a single-event peak-shaving sizing estimate assuming one peak period per billing cycle — actual demand-charge tariffs often have multiple peak windows (on-peak/off-peak/coincident-peak), and a full analysis needs the facility's actual interval load data, not a single peak/duration figure. Simple payback also ignores financing costs, battery degradation/replacement, and other value streams (e.g. demand response, backup power) the BESS might provide."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Peak demand">
              <NumberField label="Current peak demand" unit="kW" value={input.peakDemandKw} onChange={(v) => update({ peakDemandKw: v })} min={0} />
              <NumberField label="Target peak demand" unit="kW" value={input.targetPeakKw} onChange={(v) => update({ targetPeakKw: v })} min={0} />
              <NumberField label="Peak duration" unit="hr" value={input.peakDurationHours} onChange={(v) => update({ peakDurationHours: v })} min={0.1} step={0.25} />
            </Section>

            <Section title="BESS parameters">
              <NumberField label="Round-trip efficiency" unit="%" value={input.roundTripEfficiencyPct} onChange={(v) => update({ roundTripEfficiencyPct: v })} min={1} max={100} step={1} />
              <NumberField label="Inverter margin" unit="%" value={input.inverterMarginPct} onChange={(v) => update({ inverterMarginPct: v })} min={0} step={5} />
            </Section>

            <Section title="Economics">
              <NumberField label="Demand charge rate" unit="/kW-mo" value={input.demandChargeRatePerKwMonth} onChange={(v) => update({ demandChargeRatePerKwMonth: v })} min={0} step={0.5} />
              <NumberField label="BESS capital cost (optional)" unit="/kWh" value={input.bessCapitalCostPerKwh} onChange={(v) => update({ bessCapitalCostPerKwh: v })} min={0} step={10} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.requiredShaveKw == null ? (
                <EmptyResult message="Enter current and target peak demand to see the BESS sizing result." />
              ) : (
                <ResultCard title="Peak shaving BESS sizing">
                  <ResultRow label="Required shave" value={`${result.requiredShaveKw.toFixed(1)} kW`} />
                  {result.bessPowerRatingKw != null && (
                    <>
                      <ResultRow label="BESS power rating" value={`${result.bessPowerRatingKw.toFixed(1)} kW`} />
                      <ResultRow label="BESS energy capacity" value={`${result.bessEnergyCapacityKwh!.toFixed(1)} kWh`} />
                      <ResultRow label="Monthly savings" value={result.monthlyDemandChargeSavings!.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                      <ResultRow label="Annual savings" value={result.annualSavings!.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                      {result.simplePaybackYears != null && <ResultRow label="Simple payback" value={`${result.simplePaybackYears.toFixed(1)} yr`} />}
                    </>
                  )}
                  <ResultRow label="Class" value={result.shaveClass!} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
