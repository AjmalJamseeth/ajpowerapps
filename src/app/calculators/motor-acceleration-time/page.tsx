"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_MOTOR_ACCEL_INPUT, MotorAccelInput, calcMotorAccel } from "@/lib/motoraccel";

export default function MotorAccelerationTimePage() {
  const [input, setInput] = useState<MotorAccelInput>(DEFAULT_MOTOR_ACCEL_INPUT);
  const update = (patch: Partial<MotorAccelInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcMotorAccel(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Motor Acceleration Time Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Time to accelerate a motor-load system from standstill to rated
          speed, from total moment of inertia and average net accelerating
          torque.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Motor Acceleration Time Calculator" standardsLine="Rotational form of Newton's second law: t = J×ω / T_avg" />
          <FeedbackButton calculatorName="Motor Acceleration Time Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the time for a motor and its connected load to accelerate from standstill up to rated speed, from the total (motor + load, reflected to the motor shaft) moment of inertia and the average net accelerating torque available during run-up — the rotational analogue of F=ma."
            standards={["Rotational form of Newton's second law: t = J×ω / T_avg, ω = 2πN/60"]}
            capabilities={[
              "Acceleration time from moment of inertia, rated speed, and average net accelerating torque.",
              "Grading band from VERY FAST to VERY SLOW as a quick sanity check.",
            ]}
            example={{
              problem: "J=2.5 kg·m², rated speed 1480rpm, average net accelerating torque 180 N·m.",
              steps: [
                "ω = 2π×1480/60 ≈ 155.03 rad/s",
                "t = 2.5 × 155.03 / 180 ≈ 2.15 s",
              ],
              result: "≈2.15 s — NORMAL band.",
            }}
            notes="The average accelerating torque is the net torque (motor torque minus load torque) averaged over the entire run-up — it is not the motor's starting or breakdown torque alone, and estimating it accurately usually requires either a torque-speed curve integration or manufacturer/drive software data for anything beyond a rough screening estimate."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Inertia, speed & torque">
              <NumberField label="Total moment of inertia" tip="Motor + load inertia, reflected to the motor shaft (divide load-side inertia by gear ratio squared if geared)." unit="kg·m²" value={input.momentOfInertiaKgm2} onChange={(v) => update({ momentOfInertiaKgm2: v })} min={0} step={0.1} />
              <NumberField label="Rated (target) speed" unit="rpm" value={input.ratedSpeedRpm} onChange={(v) => update({ ratedSpeedRpm: v })} min={1} />
              <NumberField label="Average net accelerating torque" tip="Motor torque minus load torque, averaged over the run-up period." unit="N·m" value={input.avgAcceleratingTorqueNm} onChange={(v) => update({ avgAcceleratingTorqueNm: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.accelTimeS == null ? (
                <EmptyResult message="Enter inertia, speed and torque to see the acceleration time." />
              ) : (
                <ResultCard title="Acceleration time">
                  <ResultRow label="Target angular velocity" value={`${result.angularVelocityRadPerS!.toFixed(2)} rad/s`} />
                  <ResultRow label="Acceleration time" value={`${result.accelTimeS.toFixed(2)} s`} />
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
