"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, CheckboxField, Section, ResultCard, CheckRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_FEEDER_TAP_INPUT,
  FeederTapInput,
  TapRuleType,
  calcFeederTap,
} from "@/lib/feedertaprule";

export default function FeederTapRulePage() {
  const [input, setInput] = useState<FeederTapInput>(DEFAULT_FEEDER_TAP_INPUT);
  const update = (patch: Partial<FeederTapInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcFeederTap(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Feeder Tap Rule Calculator (NEC 240.21(B))
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Checks a feeder tap conductor against the 10-ft, 25-ft, or outside
          unlimited-length tap rules of NEC 240.21(B) — the conditions that
          let a tap conductor be smaller than would otherwise be required
          for the feeder&apos;s overcurrent device.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Feeder Tap Rule Calculator (NEC 240.21(B))" standardsLine="NEC 240.21(B)(1) 10-ft tap, 240.21(B)(2) 25-ft tap, 240.21(B)(5) outside unlimited-length tap" />
          <FeedbackButton calculatorName="Feeder Tap Rule Calculator (NEC 240.21(B))" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks a feeder tap conductor's length, ampacity, physical protection, and downstream overcurrent device rating against one of the three most commonly applied NEC 240.21(B) tap rules — the exceptions that let a tap be sized smaller than the feeder's own overcurrent device would otherwise require, provided every condition of the specific rule is met."
            standards={[
              "NEC 240.21(B)(1) — 10-ft tap rule",
              "NEC 240.21(B)(2) — 25-ft tap rule",
              "NEC 240.21(B)(5) — outside taps of unlimited length",
            ]}
            capabilities={[
              "10-ft tap: checks length ≤10ft, tap ampacity ≥1/10 of the feeder OCPD, physical protection, and terminal OCPD rating.",
              "25-ft tap: checks length ≤25ft, tap ampacity ≥1/3 of the feeder OCPD, physical protection, and terminal OCPD rating.",
              "Outside unlimited-length tap: checks the location/disconnect conditions of 240.21(B)(5) with no minimum ampacity ratio requirement.",
              "Itemized pass/fail for every condition of the selected rule, plus an overall compliant/non-compliant verdict.",
            ]}
            example={{
              problem: "400A feeder OCPD, 8ft tap run, tap conductor rated 60A, terminates in a single 60A breaker, enclosed in raceway.",
              steps: [
                "Minimum tap ampacity = 400/10 = 40A — the 60A tap conductor satisfies this.",
                "8ft ≤ 10ft, enclosed in raceway, and the 60A terminal OCPD ≤ 60A tap ampacity — every 240.21(B)(1) condition is met.",
              ],
              result: "COMPLIANT with the 10-ft tap rule.",
            }}
            notes="This tool covers the three most frequently used tap rules only — the transformer primary/secondary tap rules of 240.21(B)(3)/(C) and the over-25-ft high-bay manufacturing building rule of 240.21(B)(4) have their own distinct conditions and are not covered here. Always verify the complete rule text and any local amendments before relying on a tap installation."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Tap rule & feeder">
              <SelectField<TapRuleType>
                label="Tap rule"
                value={input.tapRuleType}
                onChange={(v) => update({ tapRuleType: v })}
                options={[
                  { value: "tenFoot", label: "10-ft tap [240.21(B)(1)]" },
                  { value: "twentyFiveFoot", label: "25-ft tap [240.21(B)(2)]" },
                  { value: "outsideUnlimited", label: "Outside unlimited-length tap [240.21(B)(5)]" },
                ]}
              />
              <NumberField label="Feeder OCPD rating" unit="A" value={input.feederOcpdRatingA} onChange={(v) => update({ feederOcpdRatingA: v })} min={0} />
              <NumberField label="Tap conductor ampacity" unit="A" value={input.tapConductorAmpacityA} onChange={(v) => update({ tapConductorAmpacityA: v })} min={0} />
              {input.tapRuleType !== "outsideUnlimited" && (
                <NumberField label="Tap length" unit="ft" value={input.tapLengthFt} onChange={(v) => update({ tapLengthFt: v })} min={0} step={0.5} />
              )}
              <NumberField label="Terminal OCPD rating" tip="Rating of the single OCPD (or sum of ratings, for the 10-ft rule with multiple devices) the tap terminates in." unit="A" value={input.terminalOcpdRatingA} onChange={(v) => update({ terminalOcpdRatingA: v })} min={0} />
            </Section>

            <Section title="Installation conditions">
              <CheckboxField label={input.tapRuleType === "tenFoot" ? "Enclosed in a raceway or protected from physical damage" : "Protected from physical damage"} checked={input.protectedFromPhysicalDamage} onChange={(v) => update({ protectedFromPhysicalDamage: v })} />
              {input.tapRuleType === "outsideUnlimited" && (
                <>
                  <CheckboxField label="Outside the building except at the point of termination" checked={input.outsideExceptAtTermination} onChange={(v) => update({ outsideExceptAtTermination: v })} />
                  <CheckboxField label="OCPD is part of, or immediately adjacent to, the disconnecting means" checked={input.ocpdAtOrNearDisconnect} onChange={(v) => update({ ocpdAtOrNearDisconnect: v })} />
                </>
              )}
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.compliant == null ? (
                <EmptyResult message="Enter the feeder OCPD rating and tap ampacity to see the compliance check." />
              ) : (
                <ResultCard title="Tap rule compliance">
                  {result.checks.map((c) => (
                    <CheckRow key={c.label} label={c.label} value={c.detail} pass={c.pass} />
                  ))}
                  <div className="pt-2 text-base font-semibold text-foreground">
                    {result.compliant ? "COMPLIANT ✓" : "NON-COMPLIANT ✗"}
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
