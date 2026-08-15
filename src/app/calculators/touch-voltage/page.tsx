"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_TOUCH_VOLTAGE_INPUT, TouchVoltageInput, TouchVoltageEnvironment, calcTouchVoltage } from "@/lib/touchvoltage";

export default function TouchVoltagePage() {
  const [input, setInput] = useState<TouchVoltageInput>(DEFAULT_TOUCH_VOLTAGE_INPUT);
  const update = (patch: Partial<TouchVoltageInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcTouchVoltage(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Touch Voltage from Neutral/Earth Imbalance
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Estimates the touch voltage on exposed conductive parts from an
          unbalanced neutral/earth current flowing through a ground-path
          impedance, checked against IEC 60364-4-41 conventional touch
          voltage limits.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Touch Voltage from Neutral/Earth Imbalance" standardsLine="IEC 60364-4-41 conventional touch voltage limits" />
          <FeedbackButton calculatorName="Touch Voltage from Neutral/Earth Imbalance" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the touch voltage that could appear on exposed conductive parts from an unbalanced neutral or earth-fault current flowing through a ground-path impedance, and compares it against IEC 60364-4-41's conventional touch-voltage limits (50V dry/normal, 25V wet/conductive locations)."
            standards={["IEC 60364-4-41 (protection against electric shock)", "IEC 60479-1 (commonly-cited 1000Ω reference body resistance, used only for the contextual body-current estimate)"]}
            capabilities={[
              "Ground potential rise from the imbalance current and ground-path impedance.",
              "Touch voltage from an adjustable touch-voltage factor (fraction of GPR appearing across the body — geometry/site dependent).",
              "Pass/fail against the IEC 60364-4-41 limit for the selected environment.",
              "Contextual estimated body current using the commonly-cited 1000Ω reference body resistance.",
            ]}
            example={{
              problem: "15A imbalance current, 2Ω ground path, touch factor 1.0 (worst case), dry environment.",
              steps: [
                "Ground potential rise = 15 × 2 = 30V.",
                "Touch voltage = 30 × 1.0 = 30V.",
                "Dry limit = 50V → 30V ≤ 50V, pass.",
              ],
              result: "Pass, with an estimated body current of ≈30mA for context — hand-checked and matched the live code exactly.",
            }}
            notes="The touch-voltage factor is genuinely site/geometry dependent (soil resistivity, bonding, distance from the grounding point) — 1.0 is the conservative worst case; a real assessment should use a proper ground-potential-rise study or measurement for the specific location."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Imbalance & ground path">
              <NumberField label="Imbalance current" unit="A" value={input.imbalanceCurrentA} onChange={(v) => update({ imbalanceCurrentA: v })} min={0} />
              <NumberField label="Ground path impedance" unit="Ω" value={input.groundPathOhms} onChange={(v) => update({ groundPathOhms: v })} min={0} step={0.01} />
              <NumberField label="Touch voltage factor" hint="0-1, site dependent" value={input.touchFactor} onChange={(v) => update({ touchFactor: v })} min={0} max={1} step={0.05} />
              <SelectField<TouchVoltageEnvironment>
                label="Environment"
                value={input.environment}
                onChange={(v) => update({ environment: v })}
                options={[
                  { value: "dry", label: "Dry / normal (50V limit)" },
                  { value: "wet", label: "Wet / conductive (25V limit)" },
                ]}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.touchVoltageV == null ? (
                <EmptyResult message="Enter an imbalance current to see the touch voltage check." />
              ) : (
                <ResultCard title="Touch voltage check">
                  <ResultRow label="Ground potential rise" value={`${result.groundPotentialRiseV!.toFixed(1)} V`} />
                  <ResultRow label="Touch voltage" value={`${result.touchVoltageV.toFixed(1)} V`} />
                  <ResultRow label="Limit" value={`${result.limitV} V`} />
                  <CheckRow label="Pass" value={result.pass ? "YES" : "NO"} pass={result.pass} />
                  <ResultRow label="Est. body current (context)" value={`${result.estimatedBodyCurrentMa!.toFixed(1)} mA`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
