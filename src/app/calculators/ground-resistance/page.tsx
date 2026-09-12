"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_GROUND_RESISTANCE_INPUT, GroundResistanceInput, calcGroundResistance } from "@/lib/groundresistance";

export default function GroundResistancePage() {
  const [input, setInput] = useState<GroundResistanceInput>(DEFAULT_GROUND_RESISTANCE_INPUT);
  const update = (patch: Partial<GroundResistanceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcGroundResistance(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Ground Resistance Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Resistance-to-earth of a single vertical driven ground rod from
          soil resistivity and electrode geometry — the same BS 7430 rod
          formula used by the full Earthing Grid Design calculator, as a
          quick standalone single-rod check.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Ground Resistance Calculator" standardsLine="BS 7430:2011 single-rod electrode resistance formula" />
          <FeedbackButton calculatorName="Ground Resistance Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the resistance-to-earth of a single vertical driven ground rod from soil resistivity and rod geometry, and screens the result against the common practical 25Ω threshold used for single-electrode NEC 250.53(A)(2) Exception decisions. For a full multi-rod/mesh grid design with touch/step voltage checks, use the Earthing Grid Design calculator."
            standards={[
              "BS 7430:2011 §11.2.2 — single-rod electrode resistance formula",
              "NEC 250.53(A)(2) Exception — common 25Ω practical threshold (not a universal code limit for every electrode type)",
            ]}
            capabilities={[
              "Single-rod resistance-to-earth from soil resistivity, rod length and diameter.",
              "Grading band (LOW/NORMAL/HIGH/VERY HIGH) and pass/fail against a user-settable target resistance.",
              "Uses the identical formula already verified in the Earthing Grid Design calculator's BS 7430 rod-sizing path.",
            ]}
            example={{
              problem: "ρ=100 Ω·m, 3m rod, 16mm diameter (8mm radius).",
              steps: [
                "R = (ρ/2πL) × (ln(4L/a) − 1)",
                "R = (100/(2π×3)) × (ln(4×3/0.008) − 1) = 5.305 × (ln(1500) − 1) = 5.305 × 6.313 ≈ 33.5 Ω",
              ],
              result: "≈33.5 Ω — above the 25Ω rule-of-thumb, so a supplemental electrode would typically be needed.",
            }}
            notes="Single-rod resistance is very sensitive to soil resistivity, which varies with moisture and season — a measured fall-of-potential test result should always take precedence over a calculated estimate for final acceptance."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Soil & electrode">
              <NumberField label="Soil resistivity" tip="Apparent soil resistivity ρ, from a Wenner four-pin test or site data. Typical range 10–1000 Ω·m depending on soil type and moisture." unit="Ω·m" value={input.rho} onChange={(v) => update({ rho: v })} min={0} />
              <NumberField label="Rod length" tip="Driven length of the rod below grade." unit="m" value={input.rodLengthM} onChange={(v) => update({ rodLengthM: v })} min={0} step={0.1} />
              <NumberField label="Rod diameter" tip="Common commercial sizes: 12.7mm (1/2in), 16mm (5/8in), 19mm (3/4in)." unit="mm" value={input.rodDiameterMm} onChange={(v) => update({ rodDiameterMm: v })} min={0} step={0.5} />
              <NumberField label="Target max resistance" tip="Comparison threshold — 25Ω is the common NEC 250.53(A)(2) Exception practical figure; project specs or utility requirements may set a different value." unit="Ω" value={input.targetMaxOhms} onChange={(v) => update({ targetMaxOhms: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.resistanceOhms == null ? (
                <EmptyResult message="Enter soil resistivity and rod geometry to see the resistance estimate." />
              ) : (
                <ResultCard title="Ground resistance">
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
