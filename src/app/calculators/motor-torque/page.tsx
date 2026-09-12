"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_MOTOR_TORQUE_INPUT, MotorTorqueInput, TorqueUnitSystem, calcMotorTorque } from "@/lib/motortorque";

export default function MotorTorquePage() {
  const [input, setInput] = useState<MotorTorqueInput>(DEFAULT_MOTOR_TORQUE_INPUT);
  const update = (patch: Partial<MotorTorqueInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcMotorTorque(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Motor Torque Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Steady-state motor shaft torque from output power and operating
          speed, in N·m or lb-ft.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Motor Torque Calculator" standardsLine="Standard power-torque-speed relation: T = 9550×P(kW)/N(rpm) or T = 5252×P(hp)/N(rpm)" />
          <FeedbackButton calculatorName="Motor Torque Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Calculates the steady-state shaft torque a motor delivers at its rated (or any operating) power and speed, using the standard power-torque-speed relation. Useful for coupling, gearbox, and mechanical drive-train selection once electrical sizing (see the Motor Calculator) is done."
            standards={["Standard power-torque-speed relation: T(N·m) = 9550 × P(kW) / N(rpm); T(lb-ft) = 5252 × P(hp) / N(rpm)"]}
            capabilities={[
              "Metric (kW → N·m) or imperial (hp → lb-ft) input, with both units shown in the result.",
              "Works for any operating point, not just nameplate rated speed — useful for VFD speed-range torque checks.",
            ]}
            example={{
              problem: "37kW motor at 1480 rpm (typical 4-pole 50Hz induction motor slip speed).",
              steps: ["T = 9550 × 37 / 1480 ≈ 238.75 N·m"],
              result: "≈238.75 N·m (≈176.1 lb-ft).",
            }}
            notes="This is steady-state running torque only — starting/breakdown/pull-up torque and acceleration torque during run-up are different quantities (see the Motor Acceleration Time calculator for the acceleration case)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Power & speed">
              <SelectField<TorqueUnitSystem>
                label="Unit system"
                value={input.unitSystem}
                onChange={(v) => update({ unitSystem: v })}
                options={[
                  { value: "metric", label: "Metric (kW → N·m)" },
                  { value: "imperial", label: "Imperial (hp → lb-ft)" },
                ]}
              />
              {input.unitSystem === "metric" ? (
                <NumberField label="Motor power" unit="kW" value={input.powerKw} onChange={(v) => update({ powerKw: v })} min={0} />
              ) : (
                <NumberField label="Motor power" unit="hp" value={input.powerHp} onChange={(v) => update({ powerHp: v })} min={0} />
              )}
              <NumberField label="Operating speed" unit="rpm" value={input.speedRpm} onChange={(v) => update({ speedRpm: v })} min={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.torqueNm == null ? (
                <EmptyResult message="Enter power and speed to see the shaft torque." />
              ) : (
                <ResultCard title="Shaft torque">
                  <ResultRow label="Torque" value={`${result.torqueNm.toFixed(2)} N·m`} />
                  <ResultRow label="Torque" value={`${result.torqueLbFt!.toFixed(2)} lb-ft`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
