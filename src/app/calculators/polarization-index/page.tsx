"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_POLARIZATION_INDEX_INPUT, PolarizationIndexInput, InsulationClass, calcPolarizationIndex } from "@/lib/polarizationindex";

export default function PolarizationIndexPage() {
  const [input, setInput] = useState<PolarizationIndexInput>(DEFAULT_POLARIZATION_INDEX_INPUT);
  const update = (patch: Partial<PolarizationIndexInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcPolarizationIndex(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Polarization Index (PI) Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          PI = IR at 10 minutes ÷ IR at 1 minute — a normalized insulation
          condition assessment per IEEE 43, independent of absolute IR
          value or temperature at the time of test.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Polarization Index (PI) Calculator" standardsLine="IEEE 43-2013" />
          <FeedbackButton calculatorName="Polarization Index (PI) Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes the Polarization Index (PI = IR at 10 minutes ÷ IR at 1 minute) and assesses it against IEEE 43's published condition bands and recommended minimum PI by insulation class."
            standards={["IEEE 43-2013 (recommended practice for testing insulation resistance of rotating machinery)"]}
            capabilities={[
              "PI value from the two timed IR readings.",
              "Condition band: <1.0 dangerous, 1.0–2.0 questionable, 2.0–4.0 good, >4.0 excellent.",
              "Pass/fail against IEEE 43's recommended minimum PI (1.5 for Class A insulation, 2.0 for Class B/F/H).",
            ]}
            example={{
              problem: "IR(1min) = 15 megohms, IR(10min) = 33 megohms, Class B/F/H insulation.",
              steps: [
                "PI = 33/15 = 2.2.",
                "Band: 2.0–4.0 → Good.",
                "Minimum recommended for Class B/F/H = 2.0 → 2.2 ≥ 2.0, meets minimum.",
              ],
              result: "PI 2.2 — Good, meets IEEE 43's minimum recommendation — hand-checked and matched the live code exactly.",
            }}
            notes="PI is most meaningful when the winding is dry and clean; a low PI can also result from surface contamination rather than genuine insulation degradation."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Timed IR readings">
              <NumberField label="IR at 1 minute" unit="MΩ" value={input.ir1MinMegohm} onChange={(v) => update({ ir1MinMegohm: v })} min={0} />
              <NumberField label="IR at 10 minutes" unit="MΩ" value={input.ir10MinMegohm} onChange={(v) => update({ ir10MinMegohm: v })} min={0} />
              <SelectField<InsulationClass>
                label="Insulation class"
                value={input.insulationClass}
                onChange={(v) => update({ insulationClass: v })}
                options={[
                  { value: "A", label: "Class A (min. PI 1.5)" },
                  { value: "B/F/H", label: "Class B/F/H (min. PI 2.0)" },
                ]}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.pi == null ? (
                <EmptyResult message="Enter both IR readings to see the PI assessment." />
              ) : (
                <ResultCard title="Polarization Index">
                  <ResultRow label="PI" value={result.pi.toFixed(2)} />
                  <ResultRow label="Condition band" value={result.band!} />
                  <ResultRow label="Minimum recommended (this class)" value={result.minimumRecommendedPi.toFixed(1)} />
                  <CheckRow label="Meets minimum" value={result.meetsMinimum ? "YES" : "NO"} pass={result.meetsMinimum} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
