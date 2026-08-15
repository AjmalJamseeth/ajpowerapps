"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_VOLTAGE_UNBALANCE_INPUT, VoltageUnbalanceInput, calcVoltageUnbalance } from "@/lib/voltageunbalance";

export default function VoltageUnbalancePage() {
  const [input, setInput] = useState<VoltageUnbalanceInput>(DEFAULT_VOLTAGE_UNBALANCE_INPUT);
  const update = (patch: Partial<VoltageUnbalanceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcVoltageUnbalance(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Phase Voltage Unbalance &amp; Motor Derating
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          NEMA-style percentage voltage unbalance from three line-line
          readings, with the associated motor derating factor from the
          published NEMA MG1 / ANSI C84.1 curve.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Phase Voltage Unbalance & Motor Derating" standardsLine="NEMA MG1 / ANSI C84.1 Figure D1 derating curve" />
          <FeedbackButton calculatorName="Phase Voltage Unbalance & Motor Derating" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes NEMA-style percentage voltage unbalance from three line-line voltage readings, and the associated motor derating factor by linear interpolation of the published NEMA MG1 / ANSI C84.1 Figure D1 curve."
            standards={["NEMA MG1 / ANSI C84.1 Figure D1 (voltage unbalance derating curve for motors)"]}
            capabilities={[
              "Percentage voltage unbalance = max deviation from average ÷ average × 100.",
              "Derating factor by linear interpolation between the published curve points (1%→0.98pu, 2%→0.95pu, 3%→0.88pu, 4%→0.82pu, 5%→0.75pu).",
              "Flags unbalance above 5%, where motors should not be operated without manufacturer consultation.",
            ]}
            example={{
              problem: "Vab=415V, Vbc=408V, Vca=420V.",
              steps: [
                "Average = (415+408+420)/3 = 414.33V.",
                "Max deviation = |408−414.33| = 6.33V.",
                "Unbalance% = 6.33/414.33 × 100 ≈ 1.53%.",
                "Interpolating between 1%→0.98pu and 2%→0.95pu at 1.53%: derating ≈ 0.964pu.",
              ],
              result: "≈1.53% unbalance, ≈0.964pu derating — hand-checked and matched the live code exactly.",
            }}
            notes="The curve is published only up to 5% unbalance — NEMA MG1 states motors should not be operated above 5% unbalance without consulting the manufacturer, so this tool does not extrapolate a derating factor beyond that point."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Line-line voltage readings">
              <NumberField label="Vab" unit="V" value={input.vab} onChange={(v) => update({ vab: v })} min={0} />
              <NumberField label="Vbc" unit="V" value={input.vbc} onChange={(v) => update({ vbc: v })} min={0} />
              <NumberField label="Vca" unit="V" value={input.vca} onChange={(v) => update({ vca: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.unbalancePct == null ? (
                <EmptyResult message="Enter all three line-line voltages to see the unbalance check." />
              ) : (
                <ResultCard title="Voltage unbalance">
                  <ResultRow label="Average voltage" value={`${result.average!.toFixed(1)} V`} />
                  <ResultRow label="Unbalance" value={`${result.unbalancePct.toFixed(2)}%`} />
                  {result.exceedsRecommendedLimit ? (
                    <CheckRow label="Above 5% — consult manufacturer" value="YES" pass={false} />
                  ) : (
                    <ResultRow label="Motor derating factor" value={`${result.deratingFactor!.toFixed(3)} p.u.`} />
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
