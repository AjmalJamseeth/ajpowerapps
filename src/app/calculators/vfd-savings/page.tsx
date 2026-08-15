"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_VFD_SAVINGS_INPUT, VfdSavingsInput, calcVfdSavings } from "@/lib/vfdsavings";

export default function VfdSavingsPage() {
  const [input, setInput] = useState<VfdSavingsInput>(DEFAULT_VFD_SAVINGS_INPUT);
  const update = (patch: Partial<VfdSavingsInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcVfdSavings(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Pump / Fan VFD Energy Savings (Affinity Laws)
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Estimates the energy and cost savings of switching a centrifugal
          pump or fan from throttled flow control to VFD speed control,
          using the standard cubic affinity law.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Pump / Fan VFD Energy Savings" standardsLine="Centrifugal-load affinity laws (flow ∝ speed, power ∝ speed³)" />
          <FeedbackButton calculatorName="Pump / Fan VFD Energy Savings" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the energy and cost savings of controlling a centrifugal pump or fan's flow with a VFD (reducing motor speed) instead of a throttling valve/damper (running the motor at full speed against added flow resistance), using the standard affinity laws for centrifugal loads: power scales with the cube of speed, and speed reduction tracks flow reduction for a quadratic system curve."
            standards={["Standard centrifugal-load affinity laws (textbook fluid-machinery physics), the same relationship underlying DOE/utility VFD retrofit guidance"]}
            capabilities={[
              "VFD power at a reduced flow: rated power × (flow fraction)³.",
              "Comparison against a throttled/undamped baseline power (adjustable — defaults to 100% of rated power, a conservative assumption since throttling barely reduces a centrifugal load's motor power).",
              "Annual energy and cost savings from the operating hours and electricity rate.",
            ]}
            example={{
              problem: "75kW pump motor, reducing flow by 30% (to 70% of full flow), 100% baseline power assumption, 6,000 operating hours/year at $0.12/kWh.",
              steps: [
                "Flow fraction = 1 − 0.30 = 0.70.",
                "VFD power = 75 × 0.70³ = 75 × 0.343 = 25.73kW.",
                "Baseline (throttled) power = 75 × 100% = 75kW.",
                "Power savings = 75 − 25.73 = 49.28kW → annual energy = 49.28 × 6,000 = 295,650kWh → cost savings = 295,650 × $0.12 = $35,478.",
              ],
              result: "≈$35,478/year in estimated savings — hand-checked and matched the live code exactly. Feed this into the Life-Cycle Cost calculator as the 'annual operating cost' difference for a full VFD payback analysis.",
            }}
            notes="The 100% throttled-baseline assumption is deliberately conservative/illustrative — a real valve/damper-throttled system's power at reduced flow depends on the specific pump/fan curve and system curve shape, and is often somewhat lower than 100% of rated power. If you have actual trended power data or a pump/fan curve for the throttled condition, override the baseline percentage for a more accurate estimate. This tool assumes a quadratic (friction-dominated) system curve, typical of most pump/fan applications but not universal (e.g. systems with a large static head component behave differently)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Motor & operating point">
              <NumberField label="Motor rated power" unit="kW" value={input.motorRatedPowerKw} onChange={(v) => update({ motorRatedPowerKw: v })} min={0} />
              <NumberField label="Flow reduction" unit="%" hint="vs. full flow" tip="How much the flow is reduced from full/rated flow during typical operation — the calculator computes VFD power at this reduced flow using the cubic affinity law." value={input.flowReductionPct} onChange={(v) => update({ flowReductionPct: v })} min={0} max={100} step={1} />
              <NumberField label="Throttled baseline power" unit="% of rated" tip="The motor's power draw at the same reduced flow WITHOUT a VFD (i.e. throttled by a valve/damper at full speed). Defaults to 100% (conservative) — override if you have actual pump/fan curve or trend data." value={input.baselinePowerPct} onChange={(v) => update({ baselinePowerPct: v })} min={0} max={100} step={1} />
            </Section>

            <Section title="Economics">
              <NumberField label="Operating hours" unit="hr/yr" value={input.operatingHoursPerYear} onChange={(v) => update({ operatingHoursPerYear: v })} min={0} />
              <NumberField label="Electricity rate" unit="/kWh" value={input.electricityRate} onChange={(v) => update({ electricityRate: v })} min={0} step={0.01} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.vfdPowerKw == null ? (
                <EmptyResult message="Enter motor rated power to see VFD savings results." />
              ) : (
                <ResultCard title="Savings estimate">
                  <ResultRow label="Flow fraction" value={`${(result.flowFraction * 100).toFixed(0)}%`} />
                  <ResultRow label="VFD power at this flow" value={`${result.vfdPowerKw.toFixed(2)} kW`} />
                  {result.baselinePowerKw != null && <ResultRow label="Throttled baseline power" value={`${result.baselinePowerKw.toFixed(2)} kW`} />}
                  {result.powerSavingsKw != null && <ResultRow label="Power savings" value={`${result.powerSavingsKw.toFixed(2)} kW`} />}
                  {result.annualEnergySavingsKwh != null && <ResultRow label="Annual energy savings" value={`${result.annualEnergySavingsKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`} />}
                  {result.annualCostSavings != null && (
                    <ResultRow label="Annual cost savings" value={<span className="text-lg text-accent-2">{result.annualCostSavings.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>} />
                  )}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
