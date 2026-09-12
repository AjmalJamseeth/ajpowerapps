"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, CheckRow, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_SWITCHGEAR_SCCR_INPUT, SwitchgearSccrInput, calcSwitchgearSccr } from "@/lib/switchgearSccr";

export default function SwitchgearSccrPage() {
  const [input, setInput] = useState<SwitchgearSccrInput>(DEFAULT_SWITCHGEAR_SCCR_INPUT);
  const update = (patch: Partial<SwitchgearSccrInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcSwitchgearSccr(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Switchgear Short-Circuit Rating Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Prospective (bolted, symmetrical) fault current and approximate
          peak asymmetrical fault current at a transformer secondary, and a
          quick check against downstream OCPD AIC and equipment SCCR
          ratings.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Switchgear Short-Circuit Rating Calculator" standardsLine="Transformer %Z fault current method; NEC 110.9/110.10 interrupting/withstand rating verification" />
          <FeedbackButton calculatorName="Switchgear Short-Circuit Rating Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the prospective bolted symmetrical fault current at a transformer's secondary terminals from its kVA and nameplate %impedance, an approximate peak asymmetrical fault current, and checks that the downstream OCPD's AIC rating and the switchgear/panelboard's SCCR nameplate rating both meet or exceed that available fault current, per NEC 110.9 (interrupting rating) and 110.10 (component protection/withstand rating)."
            standards={[
              "Transformer %Z fault current method: I_fault = I_FLA / (%Z/100)",
              "NEC 110.9 — equipment interrupting rating",
              "NEC 110.10 — circuit impedance, short-circuit current ratings, and other characteristics",
            ]}
            capabilities={[
              "Symmetrical RMS fault current from transformer kVA, secondary voltage and %Z.",
              "Approximate peak asymmetrical fault current using a conservative worst-case multiplier.",
              "Pass/fail check of both the OCPD AIC rating and the equipment SCCR nameplate rating.",
            ]}
            example={{
              problem: "1500kVA transformer, 480V secondary, 5.75% impedance, 42kA-rated OCPD and switchgear.",
              steps: [
                "I_FLA = 1500×1000/(√3×480) ≈ 1804.3A",
                "I_fault = 1804.3/(5.75/100) ≈ 31,380A",
                "Both the 42kA OCPD and 42kA switchgear SCCR exceed 31,380A — adequate.",
              ],
              result: "≈31.4kA available fault current — both the OCPD and switchgear ratings are adequate.",
            }}
            notes="This is a single-transformer screening calculation only — it ignores upstream utility/source impedance (which would reduce the fault current somewhat) and downstream cable impedance (which would reduce it further at points away from the transformer), so it reads conservatively high versus a full let-through study. The peak figure uses a conservative fixed 1.8× worst-case asymmetry multiplier rather than a system-specific IEC 60909 κ factor. For coordinated multi-point fault studies, see the Fault Current Propagation (Base kVA Method) calculator."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Transformer">
              <NumberField label="Transformer rating" unit="kVA" value={input.transformerKva} onChange={(v) => update({ transformerKva: v })} min={0} />
              <NumberField label="Secondary voltage" unit="V" value={input.secondaryVoltageV} onChange={(v) => update({ secondaryVoltageV: v })} min={0} />
              <NumberField label="Transformer impedance" unit="%" value={input.transformerPctZ} onChange={(v) => update({ transformerPctZ: v })} min={0.1} step={0.05} />
            </Section>

            <Section title="Equipment ratings">
              <NumberField label="OCPD interrupting (AIC) rating" unit="A" value={input.deviceAicRatingA} onChange={(v) => update({ deviceAicRatingA: v })} min={0} />
              <NumberField label="Switchgear/panelboard SCCR rating" unit="A" value={input.equipmentSccrRatingA} onChange={(v) => update({ equipmentSccrRatingA: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.faultCurrentRmsA == null ? (
                <EmptyResult message="Enter transformer rating, voltage and impedance to see the fault current." />
              ) : (
                <ResultCard title="Fault current & rating check">
                  <ResultRow label="Symmetrical fault current" value={`${(result.faultCurrentRmsA / 1000).toFixed(2)} kA`} />
                  <ResultRow label="Approx. peak fault current" value={`${(result.peakFaultCurrentA! / 1000).toFixed(2)} kA`} />
                  <CheckRow label="OCPD AIC rating adequate" value={result.deviceAicOk == null ? "—" : result.deviceAicOk ? "Yes" : "No"} pass={result.deviceAicOk} />
                  <CheckRow label="Equipment SCCR adequate" value={result.equipmentSccrOk == null ? "—" : result.equipmentSccrOk ? "Yes" : "No"} pass={result.equipmentSccrOk} />
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
