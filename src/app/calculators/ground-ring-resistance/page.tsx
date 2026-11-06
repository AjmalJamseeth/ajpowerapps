"use client";

import { useMemo } from "react";
import { useShareableInput } from "@/lib/shareState";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_GROUND_RING_RESISTANCE_INPUT, GroundRingResistanceInput, calcGroundRingResistance } from "@/lib/groundringresistance";

export default function GroundRingResistancePage() {
  const [input, setInput] = useShareableInput<GroundRingResistanceInput>(DEFAULT_GROUND_RING_RESISTANCE_INPUT);
  const update = (patch: Partial<GroundRingResistanceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcGroundRingResistance(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Ground Ring Resistance Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Resistance-to-earth of a single circular buried bare-conductor
          ground ring from soil resistivity, ring diameter and burial depth
          — the IEEE Std 142 ring-of-wire formula, also used by the Earthing Grid
          Design calculator, as a quick standalone single-ring check.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Ground Ring Resistance Calculator" standardsLine="IEEE Std 142 (Dwight) ring-of-wire resistance formula" />
          <FeedbackButton calculatorName="Ground Ring Resistance Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the resistance-to-earth of a single circular buried bare-conductor ground ring (a common perimeter electrode for equipment pads, substations, and tower bases) from soil resistivity, ring geometry and burial depth, and screens the result against a user-settable target resistance."
            standards={["IEEE Std 142 (Green Book) — ring-of-wire resistance formula (Dwight)"]}
            capabilities={[
              "Single-ring resistance-to-earth from soil resistivity, overall ring diameter, conductor diameter and burial depth.",
              "Grading band (LOW/NORMAL/HIGH/VERY HIGH) and pass/fail against a user-settable target resistance.",
              "Uses the same formula as the ring electrode option in the Earthing Grid Design calculator.",
            ]}
            example={{
              problem: "ρ=100 Ω·m, 10m ring diameter, 10mm conductor diameter, 0.6m burial depth.",
              steps: [
                "R = (ρ/2π²D) × (ln(8D/d) + ln(4D/s)), with s = 2 × burial depth",
                "R = (100/(2π²×10)) × (ln(8×10/0.01) + ln(4×10/1.2)) = 0.5066 × (8.987 + 3.507) = 0.5066 × 12.494 ≈ 6.33 Ω",
              ],
              result: "≈6.33 Ω — LOW band, well within the 25Ω rule-of-thumb target.",
            }}
            notes="Ring resistance is very sensitive to soil resistivity, which varies with moisture and season — a measured fall-of-potential test result should always take precedence over a calculated estimate for final acceptance."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Soil & electrode">
              <NumberField label="Soil resistivity" tip="Apparent soil resistivity ρ, from a Wenner four-pin test or site data." unit="Ω·m" value={input.rho} onChange={(v) => update({ rho: v })} min={0} />
              <NumberField label="Ring diameter" tip="Overall diameter of the circular ring (not radius)." unit="m" value={input.ringDiameterM} onChange={(v) => update({ ringDiameterM: v })} min={0} step={0.5} />
              <NumberField label="Conductor diameter" tip="Bare conductor diameter — e.g. 10mm for a 70mm² round copper conductor." unit="mm" value={input.conductorDiameterMm} onChange={(v) => update({ conductorDiameterMm: v })} min={0} step={0.5} />
              <NumberField label="Burial depth" unit="m" value={input.burialDepthM} onChange={(v) => update({ burialDepthM: v })} min={0} step={0.1} />
              <NumberField label="Target max resistance" tip="Comparison threshold — 25Ω is a common practical figure; project specs may set a different value." unit="Ω" value={input.targetMaxOhms} onChange={(v) => update({ targetMaxOhms: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.resistanceOhms == null ? (
                <EmptyResult message="Enter soil resistivity and ring geometry to see the resistance estimate." />
              ) : (
                <ResultCard title="Ground ring resistance">
                  <ResultRow label="Resistance-to-earth" value={`${result.resistanceOhms.toFixed(2)} Ω`} />
                  <ResultRow label="Grade" value={result.grade!} />
                  <ResultRow label="vs. target" value={result.passesTarget ? "Meets target ✓" : "Exceeds target ✗"} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
