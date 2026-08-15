"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_INSULATION_RESISTANCE_INPUT, InsulationResistanceInput, calcInsulationResistance } from "@/lib/insulationresistance";

export default function InsulationResistancePage() {
  const [input, setInput] = useState<InsulationResistanceInput>(DEFAULT_INSULATION_RESISTANCE_INPUT);
  const update = (patch: Partial<InsulationResistanceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcInsulationResistance(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Insulation Resistance (IR) Test Value Checker
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Checks a 1-minute insulation resistance reading against the IEEE
          43 minimum-IR rule of thumb (kV rated + 1 megohm), with an
          optional temperature correction to the 40°C reference.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Insulation Resistance (IR) Test Value Checker" standardsLine="IEEE 43-2013 (traditional kV+1 minimum-IR formula)" />
          <FeedbackButton calculatorName="Insulation Resistance (IR) Test Value Checker" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks a measured 1-minute insulation resistance reading against IEEE 43's traditional minimum-IR rule of thumb for rotating machinery: IR(1min, 40°C) ≥ kV_rated + 1 megohms — still a widely used quick field-acceptance check."
            standards={["IEEE 43-2013 (recommended practice for testing insulation resistance of rotating machinery) — traditional kV+1 formula"]}
            capabilities={[
              "Minimum required IR from rated voltage.",
              "Temperature correction of the measured reading back to the 40°C reference, using the common field rule of thumb that IR approximately halves for every 10°C rise (doubles for every 10°C fall).",
              "Pass/fail verdict.",
            ]}
            example={{
              problem: "6.6kV motor, measured 12 megohms at 40°C.",
              steps: [
                "Minimum required = 6.6 + 1 = 7.6 megohms.",
                "Measured at the 40°C reference already, so no correction needed: 12 megohms.",
                "12 ≥ 7.6 → pass.",
              ],
              result: "Pass — hand-checked and matched the live code exactly.",
            }}
            notes="IEEE 43 also offers a newer, winding-specific minimum-IR formula for more rigorous assessment — this tool implements only the traditional kV+1 quick-check formula. The temperature-correction rule of thumb (halving/doubling per 10°C) is a common field approximation, not a precise physical law — for critical decisions, take readings at or near 40°C directly rather than relying on the correction."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Machine & test reading">
              <NumberField label="Rated voltage" unit="kV" value={input.ratedVoltageKv} onChange={(v) => update({ ratedVoltageKv: v })} min={0} step={0.1} />
              <NumberField label="Measured IR (1 minute)" unit="MΩ" value={input.measuredIrMegohm} onChange={(v) => update({ measuredIrMegohm: v })} min={0} />
              <NumberField label="Temperature at test" unit="°C" value={input.measuredTempC} onChange={(v) => update({ measuredTempC: v })} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.correctedIrMegohm == null ? (
                <EmptyResult message="Enter a measured IR reading to see the pass/fail check." />
              ) : (
                <ResultCard title="IR check">
                  <ResultRow label="Minimum required IR" value={`${result.minimumRequiredMegohm.toFixed(2)} MΩ`} />
                  <ResultRow label="Corrected IR (40°C ref.)" value={`${result.correctedIrMegohm.toFixed(2)} MΩ`} />
                  <CheckRow label="Pass" value={result.pass ? "YES" : "NO"} pass={result.pass} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
