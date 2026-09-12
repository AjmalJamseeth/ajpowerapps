"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_SOLAR_CHARGE_CONTROLLER_INPUT,
  SolarChargeControllerInput,
  ChargeControllerType,
  calcSolarChargeController,
} from "@/lib/solarChargeController";

export default function SolarChargeControllerSizingPage() {
  const [input, setInput] = useState<SolarChargeControllerInput>(DEFAULT_SOLAR_CHARGE_CONTROLLER_INPUT);
  const update = (patch: Partial<SolarChargeControllerInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcSolarChargeController(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Solar Charge Controller Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Required continuous current rating for an off-grid PV charge
          controller — PWM (array short-circuit current) or MPPT (array
          power ÷ battery voltage) — with the NEC 690.8(A) 125% continuous
          factor.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Solar Charge Controller Sizing Calculator" standardsLine="NEC 690.8(A) 125% continuous-current factor applied to PWM array Isc or MPPT power/voltage current" />
          <FeedbackButton calculatorName="Solar Charge Controller Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Sizes an off-grid PV charge controller's required continuous current rating. PWM controllers track close to the array's short-circuit current, so sizing is based directly on Isc × parallel strings. MPPT controllers regulate power on the DC bus and draw current based on power balance, so sizing is based on array maximum power ÷ nominal battery voltage. Both paths apply the standard NEC 690.8(A) 125% continuous-current factor plus a user-settable design margin."
            standards={["NEC 690.8(A) — 125% continuous-current factor for PV source/output circuits"]}
            capabilities={[
              "PWM path: controller current from array Isc × parallel strings.",
              "MPPT path: controller current from array max power ÷ nominal battery voltage.",
              "125% continuous factor plus an additional user-settable design margin.",
              "Rounds up to a commonly available charge controller current rating (practical reference, not an official standard series).",
            ]}
            example={{
              problem: "MPPT controller, 4000W array, 48V nominal battery, 10% additional design margin.",
              steps: [
                "Base current = 4000/48 ≈ 83.33A",
                "Required rating = 83.33 × 1.25 × 1.10 ≈ 114.6A",
              ],
              result: "≈114.6A required — 150A commonly available controller recommended.",
            }}
            notes="MPPT controller current draw varies with array operating point and battery state of charge — this is a first-pass sizing estimate based on rated array power, not a full I-V curve tracking simulation. Always confirm against the specific controller manufacturer's maximum PV input voltage/power and battery-side current limits."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Controller type">
              <SelectField<ChargeControllerType>
                label="Controller type"
                value={input.controllerType}
                onChange={(v) => update({ controllerType: v })}
                options={[
                  { value: "pwm", label: "PWM" },
                  { value: "mppt", label: "MPPT" },
                ]}
              />
              <NumberField label="Design margin" unit="%" value={input.designMarginPct} onChange={(v) => update({ designMarginPct: v })} min={0} step={5} />
            </Section>

            {input.controllerType === "pwm" ? (
              <Section title="Array (PWM)">
                <NumberField label="Per-string Isc" unit="A" value={input.pvStringIscA} onChange={(v) => update({ pvStringIscA: v })} min={0} step={0.1} />
                <NumberField label="Parallel strings" value={input.numParallelStrings} onChange={(v) => update({ numParallelStrings: v })} min={1} step={1} />
              </Section>
            ) : (
              <Section title="Array & battery (MPPT)">
                <NumberField label="Array maximum power" unit="W" value={input.arrayMaxPowerW} onChange={(v) => update({ arrayMaxPowerW: v })} min={0} />
                <NumberField label="Nominal battery voltage" unit="V" value={input.nominalBatteryVoltageV} onChange={(v) => update({ nominalBatteryVoltageV: v })} min={1} />
              </Section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.requiredControllerA == null ? (
                <EmptyResult message="Enter the array details to see the required controller rating." />
              ) : (
                <ResultCard title="Charge controller sizing">
                  <ResultRow label="Base current" value={`${result.baseCurrentA!.toFixed(1)} A`} />
                  <ResultRow label="Required controller rating" value={`${result.requiredControllerA.toFixed(1)} A`} />
                  <ResultRow label="Recommended common rating" value={`${result.recommendedCommonRatingA} A`} />
                  <ResultRow label="Grade" value={result.grade!} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
