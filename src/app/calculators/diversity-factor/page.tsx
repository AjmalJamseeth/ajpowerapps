"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_DIVERSITY_FACTOR_INPUT, DiversityFactorInput, DiversityMode, calcDiversityFactor } from "@/lib/diversityfactor";

export default function DiversityFactorPage() {
  const [input, setInput] = useState<DiversityFactorInput>(DEFAULT_DIVERSITY_FACTOR_INPUT);
  const update = (patch: Partial<DiversityFactorInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcDiversityFactor(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Diversity Factor — Coincident Demand
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Diversity factor and coincident maximum demand for a group of
          loads on a shared feeder, transformer or panel — solve for
          whichever quantity you don&apos;t already have.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Diversity Factor — Coincident Demand" standardsLine="Standard diversity-factor relation: DF = ΣMD_individual / MD_system" />
          <FeedbackButton calculatorName="Diversity Factor — Coincident Demand" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes the diversity factor of a group of loads sharing a feeder, transformer, or panel — the ratio of the sum of each load's own individual (non-coincident) maximum demand to the group's actual coincident maximum demand. Because individual loads rarely all peak at the same instant, this ratio is normally ≥1, and is the basis for not sizing shared equipment as the simple sum of every downstream peak."
            standards={["Standard diversity-factor relation used in distribution/feeder planning: DF = ΣMD_individual / MD_system (reciprocal of the 'demand factor' concept used by the Maximum Demand calculator)"]}
            capabilities={[
              "Compute mode: enter the sum of individual peaks and the actual coincident (system) peak to get DF and the non-coincidence saving.",
              "Solve-for-system-demand mode: enter the sum of individual peaks and an assumed/typical DF to estimate the coincident demand.",
              "Solve-for-sum mode: enter the coincident demand and an assumed/typical DF to back into the sum of individual peaks.",
              "Grading band from LOW to VERY HIGH diversity for a quick sanity check against typical utility/feeder-planning DF ranges (roughly 1.1–2.5 depending on load mix).",
            ]}
            example={{
              problem: "Five houses on a shared service transformer, individual peaks summing to 850kW, actual coincident transformer peak 620kW.",
              steps: [
                "DF = ΣMD_individual / MD_system = 850 / 620 ≈ 1.37",
                "Non-coincidence saving = (850−620)/850 × 100 ≈ 27.1%",
              ],
              result: "DF ≈ 1.37 (TYPICAL band) — the transformer only needs to be sized for 620kW, not the 850kW sum of every house's own peak.",
            }}
            notes="A typical/assumed diversity factor used to solve for an unknown demand should come from utility planning data, historical metering of a similar load group, or a recognized planning guide for the load category — the grading band here is a general sanity check, not a substitute for that data."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Mode">
              <SelectField<DiversityMode>
                label="Solve for"
                value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "compute", label: "Diversity factor (compute)" },
                  { value: "solveSystemMd", label: "System (coincident) demand" },
                  { value: "solveSumMd", label: "Sum of individual demands" },
                ]}
              />
            </Section>

            <Section title="Load data">
              {input.mode !== "solveSumMd" && (
                <NumberField label="Sum of individual maximum demands" tip="ΣMD_individual — add up each downstream load's own recorded/estimated peak demand." unit="kW" value={input.sumIndividualMaxKw} onChange={(v) => update({ sumIndividualMaxKw: v })} min={0} />
              )}
              {input.mode !== "solveSystemMd" && (
                <NumberField label="System (coincident) maximum demand" tip="MD_system — the actual measured or target peak demand of the group as a whole, at the shared point of supply." unit="kW" value={input.systemMaxKw} onChange={(v) => update({ systemMaxKw: v })} min={0} />
              )}
              {input.mode !== "compute" && (
                <NumberField label="Diversity factor" tip="Assumed/typical DF for this load category, from utility planning data or historical metering." value={input.diversityFactor} onChange={(v) => update({ diversityFactor: v })} min={1} step={0.05} />
              )}
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.diversityFactor == null ? (
                <EmptyResult message="Enter the required inputs for the selected mode to see the result." />
              ) : (
                <ResultCard title="Diversity factor result">
                  <ResultRow label="Diversity factor" value={result.diversityFactor.toFixed(3)} />
                  <ResultRow label="Grade" value={result.grade!} />
                  {result.sumIndividualMaxKw != null && <ResultRow label="Sum of individual demands" value={`${result.sumIndividualMaxKw.toFixed(1)} kW`} />}
                  {result.systemMaxKw != null && <ResultRow label="System (coincident) demand" value={`${result.systemMaxKw.toFixed(1)} kW`} />}
                  {result.noncoincidenceSavingsPct != null && <ResultRow label="Non-coincidence saving" value={`${result.noncoincidenceSavingsPct.toFixed(1)}%`} />}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
