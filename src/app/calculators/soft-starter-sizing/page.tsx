"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, CheckRow, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_SOFT_STARTER_INPUT, SoftStarterInput, calcSoftStarter } from "@/lib/softstarter";

export default function SoftStarterSizingPage() {
  const [input, setInput] = useState<SoftStarterInput>(DEFAULT_SOFT_STARTER_INPUT);
  const update = (patch: Partial<SoftStarterInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcSoftStarter(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Soft Starter Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Screens a candidate soft starter&apos;s rated current against a
          motor&apos;s FLA once ambient temperature, altitude and duty-cycle
          derating are applied, plus a voltage-rating check.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Soft Starter Sizing Calculator" standardsLine="Generic manufacturer-typical temperature/altitude/duty derating rates — see About panel" />
          <FeedbackButton calculatorName="Soft Starter Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks whether a candidate soft starter's nameplate rated current is adequate for a given motor, after derating for ambient temperature above 40°C, altitude above 1000m, and duty cycle (starts per hour) — the three most commonly published soft-starter derating factors — plus a voltage-rating adequacy check."
            standards={["Generic manufacturer-typical derating rates (≈1%/°C above 40°C, ≈1%/100m above 1000m, starts-per-hour bands) — broadly consistent with the kind of thermal-capacity screening IEC 60947-4-2 AC-53a duty ratings address, but not a literal reproduction of any specific manufacturer's or IEC's published table"]}
            capabilities={[
              "Temperature, altitude, and starts-per-hour derating factors applied to the candidate soft starter's rated current.",
              "Voltage adequacy check (soft starter rated voltage ≥ motor rated voltage).",
              "Overall pass/fail against the motor's full-load current.",
            ]}
            example={{
              problem: "85A FLA motor, 400V, candidate soft starter rated 105A/400V, 40°C ambient, 1000m altitude, 5 starts/hour.",
              steps: [
                "All three derating factors = 1.0 (within the no-derating thresholds).",
                "Derated capacity = 105 × 1.0 × 1.0 × 1.0 = 105A ≥ 85A FLA — adequate.",
              ],
              result: "ADEQUATE — 105A derated capacity comfortably covers the 85A motor FLA.",
            }}
            notes="These derating rates are generic screening figures, not a substitute for the specific manufacturer's datasheet — always verify the final soft starter selection (including its AC-53a duty rating for your actual starts-per-hour and start time) against the chosen model's published data."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Motor">
              <NumberField label="Motor full-load current" unit="A" value={input.motorFlaA} onChange={(v) => update({ motorFlaA: v })} min={0} />
              <NumberField label="Motor rated voltage" unit="V" value={input.motorRatedVoltageV} onChange={(v) => update({ motorRatedVoltageV: v })} min={0} />
            </Section>

            <Section title="Candidate soft starter">
              <NumberField label="Soft starter rated current" unit="A" value={input.softStarterRatedCurrentA} onChange={(v) => update({ softStarterRatedCurrentA: v })} min={0} />
              <NumberField label="Soft starter rated voltage" unit="V" value={input.softStarterRatedVoltageV} onChange={(v) => update({ softStarterRatedVoltageV: v })} min={0} />
            </Section>

            <Section title="Installation conditions">
              <NumberField label="Ambient temperature" unit="°C" value={input.ambientTempC} onChange={(v) => update({ ambientTempC: v })} step={1} />
              <NumberField label="Altitude" unit="m" value={input.altitudeM} onChange={(v) => update({ altitudeM: v })} min={0} step={100} />
              <NumberField label="Starts per hour" value={input.startsPerHour} onChange={(v) => update({ startsPerHour: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.deratedCapacityA == null ? (
                <EmptyResult message="Enter motor FLA and soft starter rated current to see the sizing check." />
              ) : (
                <ResultCard title="Soft starter sizing check">
                  <ResultRow label="Temperature factor" value={result.tempFactor.toFixed(2)} />
                  <ResultRow label="Altitude factor" value={result.altitudeFactor.toFixed(2)} />
                  <ResultRow label="Duty factor" value={result.dutyFactor.toFixed(2)} />
                  <ResultRow label="Derated capacity" value={`${result.deratedCapacityA.toFixed(1)} A`} />
                  <CheckRow label="Voltage rating adequate" value={result.voltageOk ? "Yes" : "No"} pass={result.voltageOk} />
                  <CheckRow label="Current capacity adequate" value={result.currentOk ? "Yes" : "No"} pass={result.currentOk} />
                  <div className="pt-2 text-base font-semibold text-foreground">
                    {result.overallOk ? "ADEQUATE ✓" : "INADEQUATE ✗"}
                  </div>
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
