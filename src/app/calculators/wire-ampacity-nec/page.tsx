"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_WIRE_AMPACITY_INPUT,
  WireAmpacityInput,
  WireCalcMode,
  WireMaterial,
  InsulationTemp,
  TerminationTemp,
  AwgSize,
  AWG_SIZES,
  calcWireAmpacity,
} from "@/lib/wireampacitynec";

export default function WireAmpacityNecPage() {
  const [input, setInput] = useState<WireAmpacityInput>(DEFAULT_WIRE_AMPACITY_INPUT);
  const update = (patch: Partial<WireAmpacityInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcWireAmpacity(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Wire Size / Ampacity Calculator (NEC)
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Applies the full NEC Article 310 four-step derating chain — base
          Table 310.16 ampacity, ambient temperature correction, conductor
          bundling adjustment, and 110.14(C) termination-temperature cap —
          to auto-size a conductor or check a selected size.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Wire Size / Ampacity Calculator (NEC)" standardsLine="NEC Table 310.16, Table 310.15(B)(1), Table 310.15(C)(1), 110.14(C)" />
          <FeedbackButton calculatorName="Wire Size / Ampacity Calculator (NEC)" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Sizes (or checks) a copper or aluminum conductor against NEC Article 310, applying all four steps of the standard derating chain: the base allowable ampacity from Table 310.16 at the conductor's insulation temperature rating, the ambient-temperature correction factor from Table 310.15(B)(1), the bundling/adjustment factor from Table 310.15(C)(1) for more than 3 current-carrying conductors, and finally the 110.14(C) termination-temperature cap — the usable ampacity can never exceed the Table 310.16 value for the termination's own (often lower) temperature rating."
            standards={[
              "NEC Table 310.16 — allowable ampacities of insulated conductors, 30°C ambient, ≤3 current-carrying conductors",
              "NEC Table 310.15(B)(1) — ambient temperature correction factors",
              "NEC Table 310.15(C)(1) — adjustment factors for more than 3 current-carrying conductors",
              "NEC 110.14(C) — conductor temperature limitation at terminations",
            ]}
            capabilities={[
              "Auto-size mode: finds the smallest AWG/kcmil conductor whose derated, termination-capped ampacity meets the load.",
              "Check mode: evaluates a specific conductor size you already have in mind and reports pass/fail with full derating breakdown.",
              "Copper or aluminum, 60/75/90°C insulation ratings, 60/75°C termination ratings.",
            ]}
            example={{
              problem: "65A load, 75°C insulation and termination, copper, 30°C ambient, 3 current-carrying conductors.",
              steps: [
                "At 30°C/≤3 conductors, ambient factor = 1.00 and bundling factor = 1.00 (no derating needed).",
                "#6 AWG Cu at 75°C = 65A base ampacity — exactly meets the 65A load once the termination cap (also 65A at 75°C) is checked.",
              ],
              result: "#6 AWG copper, 75°C — 65A effective ampacity, meeting the 65A load exactly.",
            }}
            notes="Table 310.16 figures are the standard published NEC values, unchanged across the 2014–2023 NEC editions for this table — but always confirm against the specific code edition adopted by the AHJ, and remember this is ampacity only: voltage drop, short-circuit withstand, and conduit fill must be checked separately (see the Cable Sizing, Conduit Fill, and Feeder Tap Rule calculators)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Mode & conductor">
              <SelectField<WireCalcMode>
                label="Mode"
                value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "autoSize", label: "Auto-size (find smallest conductor)" },
                  { value: "check", label: "Check a selected size" },
                ]}
              />
              <SelectField<WireMaterial>
                label="Conductor material"
                value={input.material}
                onChange={(v) => update({ material: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminum" },
                ]}
              />
              <SelectField<InsulationTemp>
                label="Insulation temperature rating"
                value={input.insulationTemp}
                onChange={(v) => update({ insulationTemp: v })}
                options={[
                  { value: 60, label: "60°C (e.g. TW)" },
                  { value: 75, label: "75°C (e.g. THWN, XHHW)" },
                  { value: 90, label: "90°C (e.g. THHN, XHHW-2)" },
                ]}
              />
              <SelectField<TerminationTemp>
                label="Termination temperature rating"
                tip="Per NEC 110.14(C): 60°C for equipment ≤100A / #1 AWG and smaller, unless the equipment is listed for a higher rating; 75°C is common for equipment >100A or when both ends are listed for it."
                value={input.terminationTemp}
                onChange={(v) => update({ terminationTemp: v })}
                options={[
                  { value: 60, label: "60°C" },
                  { value: 75, label: "75°C" },
                ]}
              />
              {input.mode === "check" && (
                <SelectField<AwgSize>
                  label="Conductor size"
                  value={input.selectedSize}
                  onChange={(v) => update({ selectedSize: v })}
                  options={AWG_SIZES.map((s) => ({ value: s, label: `${s} AWG/kcmil` }))}
                />
              )}
            </Section>

            <Section title="Load & installation conditions">
              <NumberField label="Load current" unit="A" value={input.loadAmps} onChange={(v) => update({ loadAmps: v })} min={0} />
              <NumberField label="Ambient temperature" unit="°C" value={input.ambientC} onChange={(v) => update({ ambientC: v })} min={0} max={85} step={1} />
              <NumberField label="Current-carrying conductors" tip="Count of current-carrying conductors in the same raceway, cable, or earth (per NEC 310.15(C)(1))." value={input.currentCarryingCount} onChange={(v) => update({ currentCarryingCount: v })} min={1} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.candidate == null ? (
                <EmptyResult message="Enter the load current to see the sizing result." />
              ) : (
                <ResultCard title="Ampacity result">
                  <ResultRow label="Ambient correction factor" value={result.ambientFactor.toFixed(2)} />
                  <ResultRow label="Bundling adjustment factor" value={result.bundlingFactor.toFixed(2)} />
                  <ResultRow label={input.mode === "autoSize" ? "Recommended size" : "Checked size"} value={`${result.candidate.size} AWG/kcmil`} />
                  <ResultRow label="Base ampacity (Table 310.16)" value={`${result.candidate.baseAmpacity} A`} />
                  <ResultRow label="Adjusted ampacity" value={`${result.candidate.adjustedAmpacity.toFixed(1)} A`} />
                  <ResultRow label="Termination cap" value={`${result.candidate.terminationCapAmpacity} A`} />
                  <ResultRow label="Effective ampacity" value={`${result.candidate.effectiveAmpacity.toFixed(1)} A`} />
                  <ResultRow label="Result" value={result.passes ? "Meets load ✓" : "Does not meet load ✗"} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
