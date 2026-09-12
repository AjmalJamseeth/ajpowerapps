"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_EMERGENCY_LIGHTING_INPUT,
  EmergencyLightingInput,
  EmergencyLightingMode,
  calcEmergencyLighting,
  NFPA_101_MIN_DURATION_MIN,
} from "@/lib/emergencylighting";

export default function EmergencyLightingDurationPage() {
  const [input, setInput] = useState<EmergencyLightingInput>(DEFAULT_EMERGENCY_LIGHTING_INPUT);
  const update = (patch: Partial<EmergencyLightingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcEmergencyLighting(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Emergency Lighting Duration Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Check an existing battery/unit-equipment runtime against the
          common {NFPA_101_MIN_DURATION_MIN}-minute code minimum, or size
          the required battery capacity for a target duration with aging,
          DoD and inverter-efficiency derating.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Emergency Lighting Duration Calculator" standardsLine="NFPA 101 §7.9.2.1 / NEC 700.12(F) — 90-minute common minimum duration" />
          <FeedbackButton calculatorName="Emergency Lighting Duration Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks the runtime a battery-backed emergency/egress lighting system (unit equipment or a central battery inverter) can deliver at a given load, against the common code-minimum duration — or, in sizing mode, works backwards from a target load and duration to the required battery capacity, applying usable depth-of-discharge, inverter/regulation efficiency, and an end-of-life aging margin."
            standards={[
              "NFPA 101 (Life Safety Code) §7.9.2.1 — minimum 1.5 hour (90 minute) emergency illumination duration",
              "NEC 700.12(F) / UL 924 — unit equipment minimum 90-minute supply requirement",
            ]}
            capabilities={[
              "Check mode: battery Wh + load W → runtime in minutes, compared against the 90-minute common minimum.",
              "Size mode: load W + target duration → required nameplate Wh and Ah, with DoD, efficiency and aging-margin derating.",
              "Grading band from BELOW MINIMUM to GENEROUS MARGIN relative to the 90-minute reference.",
            ]}
            example={{
              problem: "Check mode: 60W emergency luminaire load, 108Wh battery, 80% usable DoD, 90% inverter efficiency.",
              steps: [
                "Usable Wh = 108 × 0.80 × 0.90 = 77.76 Wh",
                "Runtime = (77.76 / 60) × 60 = 77.76 minutes",
              ],
              result: "≈77.8 minutes — BELOW MINIMUM against the 90-minute reference; battery/load combination needs revisiting.",
            }}
            notes="The 90-minute figure is the widely-used NFPA 101/UL 924 reference duration — some occupancies, jurisdictions, or specific system designs (e.g. certain high-rise or assembly occupancy requirements) may call for a longer duration, so always confirm the actual required duration with the applicable code edition and AHJ before finalizing a design."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Mode">
              <SelectField<EmergencyLightingMode>
                label="Mode"
                value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "check", label: "Check existing battery runtime" },
                  { value: "size", label: "Size required battery capacity" },
                ]}
              />
            </Section>

            <Section title="Load & battery">
              <NumberField label="Emergency lighting load" unit="W" value={input.loadW} onChange={(v) => update({ loadW: v })} min={0} />
              {input.mode === "check" && (
                <NumberField label="Battery nameplate capacity" unit="Wh" value={input.batteryWh} onChange={(v) => update({ batteryWh: v })} min={0} />
              )}
              {input.mode === "size" && (
                <NumberField label="Required duration" unit="min" value={input.requiredDurationMin} onChange={(v) => update({ requiredDurationMin: v })} min={1} />
              )}
              <NumberField label="Usable depth of discharge" unit="%" value={input.usableDodPct} onChange={(v) => update({ usableDodPct: v })} min={1} max={100} step={1} />
              <NumberField label="Inverter/regulation efficiency" unit="%" value={input.inverterEfficiencyPct} onChange={(v) => update({ inverterEfficiencyPct: v })} min={1} max={100} step={1} />
              {input.mode === "size" && (
                <>
                  <NumberField label="Aging margin" tip="Extra capacity margin to account for battery capacity fade near end of service life — a common design practice figure, not a fixed code value." unit="%" value={input.agingFactorPct} onChange={(v) => update({ agingFactorPct: v })} min={0} step={5} />
                  <NumberField label="System voltage" unit="V" value={input.systemVoltageV} onChange={(v) => update({ systemVoltageV: v })} min={1} />
                </>
              )}
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.grade == null ? (
                <EmptyResult message="Enter the required inputs for the selected mode to see the result." />
              ) : input.mode === "check" ? (
                <ResultCard title="Runtime check">
                  <ResultRow label="Runtime" value={`${result.runtimeMin!.toFixed(1)} min`} />
                  <ResultRow label="Grade" value={result.grade} />
                  <ResultRow label={`vs. ${NFPA_101_MIN_DURATION_MIN}-min reference`} value={result.meetsMinimum ? "Meets minimum ✓" : "Below minimum ✗"} />
                </ResultCard>
              ) : (
                <ResultCard title="Battery sizing">
                  <ResultRow label="Required nameplate capacity" value={`${result.requiredNameplateWh!.toFixed(1)} Wh`} />
                  <ResultRow label="Required capacity" value={`${result.requiredAh!.toFixed(2)} Ah`} />
                  <ResultRow label="Grade" value={result.grade} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
