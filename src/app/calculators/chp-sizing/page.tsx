"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_CHP_SIZING_INPUT, ChpSizingInput, calcChpSizing } from "@/lib/chpSizing";

export default function ChpSizingPage() {
  const [input, setInput] = useState<ChpSizingInput>(DEFAULT_CHP_SIZING_INPUT);
  const update = (patch: Partial<ChpSizingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcChpSizing(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Cogeneration (CHP) Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Preliminary CHP electrical capacity from a site&apos;s electrical
          and thermal baseloads, sized to the more limiting of the two so
          neither output goes to waste.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Cogeneration (CHP) Sizing Calculator" standardsLine="Baseload-matching CHP sizing practice — size to the smaller of the electrical- and thermal-derived capacities" />
          <FeedbackButton calculatorName="Cogeneration (CHP) Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Screens a preliminary CHP (combined heat and power) system electrical capacity from a facility's continuous electrical and thermal baseload demand, and the candidate CHP technology's heat-to-power ratio (HPR — thermal output per unit of electrical output). The system is sized to the more limiting of the electrical-baseload-derived size and the thermal-baseload-derived size, since oversizing against either wastes the corresponding output and undermines the project economics."
            standards={["Baseload-matching CHP sizing practice: size = min(electrical baseload, thermal baseload / HPR)"]}
            capabilities={[
              "Electrical-baseload-derived and thermal-baseload-derived candidate sizes.",
              "Recommended size as the smaller (more limiting) of the two, with the governing baseload identified.",
              "SMALL to VERY LARGE size classification for preliminary screening.",
            ]}
            example={{
              problem: "500kW continuous electrical baseload, 800kW continuous usable thermal baseload, HPR=1.3 (typical reciprocating-engine CHP).",
              steps: [
                "Electrical-baseload size = 500kW",
                "Thermal-baseload size = 800/1.3 ≈ 615.4kW",
                "Recommended = min(500, 615.4) = 500kW, governed by the electrical baseload",
              ],
              result: "500kW recommended CHP electrical capacity (STANDARD class) — electrical baseload governs.",
            }}
            notes="This is a preliminary screening estimate based on steady baseload demand — real CHP sizing also needs a full 8760-hour load-duration analysis (electrical and thermal load profiles rarely track each other hour-by-hour), local utility interconnection/export rules, and the specific prime mover's actual HPR at partial load, which differs from its rated HPR."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Baseloads">
              <NumberField label="Electrical baseload demand" unit="kW" value={input.electricalDemandKw} onChange={(v) => update({ electricalDemandKw: v })} min={0} />
              <NumberField label="Usable thermal baseload demand" unit="kW" value={input.thermalDemandKw} onChange={(v) => update({ thermalDemandKw: v })} min={0} />
              <NumberField label="Heat-to-power ratio (HPR)" tip="Thermal output ÷ electrical output for the candidate CHP technology — typically ~1.0-1.5 for reciprocating engines, ~1.5-2.5 for gas turbines." value={input.heatToPowerRatio} onChange={(v) => update({ heatToPowerRatio: v })} min={0.1} step={0.1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.recommendedSizeKw == null ? (
                <EmptyResult message="Enter both baseload demands and the HPR to see the recommended CHP size." />
              ) : (
                <ResultCard title="CHP sizing result">
                  <ResultRow label="Electrical-baseload size" value={`${result.sizeBasedOnElectricalKw!.toFixed(1)} kW`} />
                  <ResultRow label="Thermal-baseload size" value={`${result.sizeBasedOnThermalKw!.toFixed(1)} kW`} />
                  <ResultRow label="Recommended size" value={`${result.recommendedSizeKw.toFixed(1)} kW`} />
                  <ResultRow label="Governing baseload" value={result.governingBaseload === "electrical" ? "Electrical" : "Thermal"} />
                  <ResultRow label="Size class" value={result.sizeClass!} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
