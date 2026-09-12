"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, CheckRow, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_SPD_RATING_INPUT,
  SpdRatingInput,
  SpdGroundingType,
  SpdInstallLocation,
  calcSpdRating,
} from "@/lib/spdRating";

export default function SpdRatingPage() {
  const [input, setInput] = useState<SpdRatingInput>(DEFAULT_SPD_RATING_INPUT);
  const update = (patch: Partial<SpdRatingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcSpdRating(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Surge Protection Device (SPD) Rating Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Recommends an SPD Type by installation location, computes a
          minimum recommended MCOV from system voltage and grounding
          configuration, and checks a candidate SPD&apos;s SCCR against
          the available fault current.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Surge Protection Device (SPD) Rating Calculator" standardsLine="NEC 230.67, 242, 285.6/285.7 — SPD type, MCOV and SCCR selection" />
          <FeedbackButton calculatorName="Surge Protection Device (SPD) Rating Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Guides SPD (surge protective device) selection: recommends the appropriate SPD Type for the installation location, computes a minimum recommended MCOV (Maximum Continuous Operating Voltage) rating from the system voltage and grounding configuration (using the worst-case line-to-ground voltage the system can present), and checks whether a candidate SPD's SCCR rating meets the available fault current at the installation point."
            standards={[
              "NEC 230.67 — surge protection at service equipment",
              "NEC Art. 242 — overvoltage protection (SPD requirements)",
              "NEC 285.6 / 285.7 — SPD ratings and use with other equipment",
            ]}
            capabilities={[
              "SPD Type recommendation by installation location (service entrance, downstream panelboard, or point of use).",
              "Minimum recommended MCOV from system voltage and grounding type, using a standard safety margin over the worst-case line-to-ground voltage.",
              "SCCR adequacy check against the available fault current at the point of installation.",
            ]}
            example={{
              problem: "480Y/277V solidly grounded wye service, candidate SPD rated 320V MCOV / 65kA SCCR, 25kA available fault current.",
              steps: [
                "Reference (line-to-neutral) voltage = 480/√3 ≈ 277.1V",
                "Minimum recommended MCOV = 277.1 × 1.15 ≈ 318.7V — the 320V candidate SPD clears this.",
                "65kA SCCR ≥ 25kA available fault current — adequate.",
              ],
              result: "ADEQUATE — 320V MCOV and 65kA SCCR both clear the requirement.",
            }}
            notes="The 1.15× MCOV margin is a commonly used manufacturer/IEEE-guidance safety margin over the worst-case line-to-ground voltage, not a single literal NEC-mandated multiplier — always cross-check against the specific SPD's UL 1449 listed voltage options, since MCOV ratings are only available in the manufacturer's standard steps. For ungrounded or high-resistance grounded systems, the full line-to-line voltage is used as the reference since a ground fault can drive the line-to-ground voltage up toward that value."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="System">
              <NumberField label="System voltage (line-to-line)" unit="V" value={input.systemVoltageLlV} onChange={(v) => update({ systemVoltageLlV: v })} min={0} />
              <SelectField<SpdGroundingType>
                label="Grounding configuration"
                value={input.groundingType}
                onChange={(v) => update({ groundingType: v })}
                options={[
                  { value: "solidlyGroundedWye", label: "Solidly grounded wye" },
                  { value: "highResistanceOrUngrounded", label: "High-resistance grounded / ungrounded" },
                  { value: "cornerGroundedDelta", label: "Corner-grounded delta" },
                ]}
              />
              <SelectField<SpdInstallLocation>
                label="Installation location"
                value={input.installLocation}
                onChange={(v) => update({ installLocation: v })}
                options={[
                  { value: "serviceEntrance", label: "Service entrance" },
                  { value: "downstreamPanelboard", label: "Downstream panelboard" },
                  { value: "pointOfUse", label: "Point of use" },
                ]}
              />
              <NumberField label="Available fault current" unit="A" value={input.availableFaultCurrentA} onChange={(v) => update({ availableFaultCurrentA: v })} min={0} />
            </Section>

            <Section title="Candidate SPD">
              <NumberField label="SPD MCOV rating" unit="V" value={input.candidateSpdMcovV} onChange={(v) => update({ candidateSpdMcovV: v })} min={0} />
              <NumberField label="SPD SCCR rating" unit="A" value={input.candidateSpdSccrA} onChange={(v) => update({ candidateSpdSccrA: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.minRecommendedMcovV == null ? (
                <EmptyResult message="Enter the system voltage to see the SPD Type and MCOV recommendation." />
              ) : (
                <ResultCard title="SPD rating result">
                  <ResultRow label="Recommended SPD Type" value={result.recommendedType} />
                  <ResultRow label="Reference voltage" value={`${result.referenceVoltageV!.toFixed(1)} V`} />
                  <ResultRow label="Minimum recommended MCOV" value={`${result.minRecommendedMcovV.toFixed(1)} V`} />
                  <CheckRow label="Candidate MCOV adequate" value={result.mcovOk == null ? "—" : result.mcovOk ? "Yes" : "No"} pass={result.mcovOk} />
                  <CheckRow label="Candidate SCCR adequate" value={result.sccrOk == null ? "—" : result.sccrOk ? "Yes" : "No"} pass={result.sccrOk} />
                  {result.overallOk != null && (
                    <div className="pt-2 text-base font-semibold text-foreground">
                      {result.overallOk ? "ADEQUATE ✓" : "INADEQUATE ✗"}
                    </div>
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
