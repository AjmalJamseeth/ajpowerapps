"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_GEN_SYNC_INPUT, GenSyncInput, calcGenSync } from "@/lib/gensync";

export default function GeneratorSyncPage() {
  const [input, setInput] = useState<GenSyncInput>(DEFAULT_GEN_SYNC_INPUT);
  const update = (patch: Partial<GenSyncInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcGenSync(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Generator Paralleling / Synchronization Check
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Voltage, frequency and phase-angle difference between an incoming
          generator and the bus/system, checked against adjustable
          acceptance windows before closing the paralleling breaker.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Generator Paralleling / Synchronization Check" standardsLine="Sync-check (ANSI device 25) style acceptance windows — adjustable" />
          <FeedbackButton calculatorName="Generator Paralleling / Synchronization Check" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks the three quantities a synchroscope or sync-check relay (ANSI device 25) monitors before permitting a generator paralleling breaker to close: voltage difference, frequency difference (slip), and phase-angle difference between the incoming generator and the bus/system it's joining."
            standards={["General synchronizing practice (the quantities monitored by ANSI device 25 sync-check relays) — acceptance windows are application/relay-setting specific, not one fixed standard, so all three thresholds here are user-adjustable"]}
            capabilities={[
              "Voltage difference (%) between generator and bus, checked against an adjustable threshold.",
              "Frequency difference (slip, Hz) between generator and bus, checked against an adjustable threshold, plus the resulting 'beat period' — the time between successive in-phase instants.",
              "Phase-angle difference, checked against an adjustable threshold.",
              "Overall go/no-go verdict across all three checks.",
            ]}
            example={{
              problem: "Generator at 415V/50.05Hz, bus at 412V/50.00Hz, 3° phase angle difference, with 5% voltage, 0.2Hz frequency and 10° phase thresholds.",
              steps: [
                "Voltage difference = |415−412|/412 × 100 = 0.73% — within the 5% threshold.",
                "Frequency difference = |50.05−50.00| = 0.05Hz — within the 0.2Hz threshold; beat period = 1/0.05 = 20s.",
                "Phase angle difference = 3° — within the 10° threshold.",
              ],
              result: "All three checks pass — safe to close, with the phase angle drifting through zero roughly every 20 seconds — hand-checked and matched the live code exactly.",
            }}
            notes="The default thresholds shown are commonly-cited illustrative starting points, not a fixed standard — actual acceptance windows depend on generator size, prime mover type, and your protection engineer's or utility interconnection agreement's specific requirements. Always use your sync-check relay's actual configured settings, or your utility's interconnection requirements, for a real paralleling decision — this tool doesn't replace the relay."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Generator & bus readings">
              <NumberField label="Generator voltage" unit="V" value={input.genVoltageV} onChange={(v) => update({ genVoltageV: v })} min={0} />
              <NumberField label="Bus voltage" unit="V" value={input.busVoltageV} onChange={(v) => update({ busVoltageV: v })} min={0} />
              <NumberField label="Generator frequency" unit="Hz" value={input.genFrequencyHz} onChange={(v) => update({ genFrequencyHz: v })} min={0} step={0.01} />
              <NumberField label="Bus frequency" unit="Hz" value={input.busFrequencyHz} onChange={(v) => update({ busFrequencyHz: v })} min={0} step={0.01} />
              <NumberField label="Phase angle difference" unit="°" value={input.phaseAngleDiffDeg} onChange={(v) => update({ phaseAngleDiffDeg: v })} step={0.5} />
            </Section>

            <Section title="Acceptance windows (adjustable)">
              <NumberField label="Voltage difference threshold" unit="%" value={input.voltageDiffThresholdPct} onChange={(v) => update({ voltageDiffThresholdPct: v })} min={0} step={0.5} />
              <NumberField label="Frequency difference threshold" unit="Hz" value={input.freqDiffThresholdHz} onChange={(v) => update({ freqDiffThresholdHz: v })} min={0} step={0.01} />
              <NumberField label="Phase angle threshold" unit="°" value={input.phaseAngleThresholdDeg} onChange={(v) => update({ phaseAngleThresholdDeg: v })} min={0} step={0.5} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.overallOk == null ? (
                <EmptyResult message="Enter generator and bus readings to see the synchronization check." />
              ) : (
                <ResultCard title="Synchronization check">
                  {result.voltageDiffPct != null && result.voltageOk !== null && (
                    <CheckRow label="Voltage difference" value={`${result.voltageDiffPct.toFixed(2)}%`} pass={result.voltageOk} />
                  )}
                  {result.freqDiffHz != null && result.freqOk !== null && (
                    <CheckRow label="Frequency difference" value={`${result.freqDiffHz.toFixed(3)} Hz`} pass={result.freqOk} />
                  )}
                  {result.beatPeriodS != null && <ResultRow label="Beat period" value={`${result.beatPeriodS.toFixed(1)} s`} />}
                  {result.phaseOk !== null && (
                    <CheckRow label="Phase angle" value={`${input.phaseAngleDiffDeg}°`} pass={result.phaseOk} />
                  )}
                  <CheckRow label="Safe to close" value={result.overallOk ? "YES" : "NO"} pass={result.overallOk} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
