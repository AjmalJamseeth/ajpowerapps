"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, CheckRow, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_VFD_PARAMETER_INPUT, VfdParameterInput, calcVfdParameter } from "@/lib/vfdparameter";

export default function VfdParameterSelectionPage() {
  const [input, setInput] = useState<VfdParameterInput>(DEFAULT_VFD_PARAMETER_INPUT);
  const update = (patch: Partial<VfdParameterInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcVfdParameter(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          VFD Parameter Selection Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Screens motor nameplate data against a candidate VFD&apos;s
          ratings — voltage match, current loading, base V/Hz ratio,
          synchronous speed, and slip.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="VFD Parameter Selection Calculator" standardsLine="Standard induction motor nameplate relations: synchronous speed Ns=120f/P, slip=(Ns-N)/Ns, base V/Hz ratio" />
          <FeedbackButton calculatorName="VFD Parameter Selection Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks whether a candidate VFD is a reasonable match for a given motor: voltage compatibility, how heavily the motor's FLA loads the drive's rated output current, the motor's base V/Hz ratio (the flux-defining constant a V/Hz drive maintains from 0Hz up to base frequency), synchronous speed, and slip."
            standards={["Ns = 120×f/P (synchronous speed); slip% = (Ns−N)/Ns × 100; base V/Hz ratio = rated voltage / rated frequency"]}
            capabilities={[
              "Voltage match check (VFD rated voltage ≥ motor rated voltage, within a practical +10% window).",
              "Current loading of the drive by the motor's FLA, with a WELL MATCHED → PARAMETER MISMATCH grading.",
              "Base V/Hz ratio, synchronous speed, and slip from motor nameplate frequency/poles/speed.",
            ]}
            example={{
              problem: "Motor: 400V, 65A FLA, 50Hz, 1480rpm, 4-pole. VFD: 400V, 75A rated output.",
              steps: [
                "Voltage match: 400V ≥ 400V and ≤440V — OK",
                "Current loading = 65/75 × 100 ≈ 86.7% — ADEQUATE band",
                "Ns = 120×50/4 = 1500rpm; slip = (1500−1480)/1500 × 100 ≈ 1.33%",
                "Base V/Hz = 400/50 = 8.0 V/Hz",
              ],
              result: "ADEQUATE match — 86.7% current loading, 1500rpm sync speed, 1.33% slip.",
            }}
            notes="This is a nameplate-compatibility screen, not a full drive commissioning study — motor cable length/dV-dt filtering, carrier frequency derating, and the specific VFD's overload/duty rating (e.g. variable-torque vs constant-torque) all need separate confirmation against the drive manufacturer's application data."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Motor nameplate">
              <NumberField label="Rated voltage" unit="V" value={input.motorRatedVoltageV} onChange={(v) => update({ motorRatedVoltageV: v })} min={0} />
              <NumberField label="Rated current (FLA)" unit="A" value={input.motorRatedCurrentA} onChange={(v) => update({ motorRatedCurrentA: v })} min={0} />
              <NumberField label="Rated frequency" unit="Hz" value={input.motorRatedFrequencyHz} onChange={(v) => update({ motorRatedFrequencyHz: v })} min={1} />
              <NumberField label="Rated speed" unit="rpm" value={input.motorRatedSpeedRpm} onChange={(v) => update({ motorRatedSpeedRpm: v })} min={1} />
              <NumberField label="Number of poles" value={input.motorPoles} onChange={(v) => update({ motorPoles: v })} min={2} step={2} />
            </Section>

            <Section title="Candidate VFD">
              <NumberField label="Rated output voltage" unit="V" value={input.vfdRatedVoltageV} onChange={(v) => update({ vfdRatedVoltageV: v })} min={0} />
              <NumberField label="Rated output current" unit="A" value={input.vfdRatedCurrentA} onChange={(v) => update({ vfdRatedCurrentA: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.status == null ? (
                <EmptyResult message="Enter motor and VFD nameplate data to see the compatibility check." />
              ) : (
                <ResultCard title="VFD compatibility check">
                  <CheckRow label="Voltage match" value={result.voltageMatch ? "OK" : "Mismatch"} pass={result.voltageMatch} />
                  <ResultRow label="Current loading" value={`${result.currentLoadingPct!.toFixed(1)}%`} />
                  <ResultRow label="Base V/Hz ratio" value={`${result.baseVHzRatio!.toFixed(2)} V/Hz`} />
                  <ResultRow label="Synchronous speed" value={`${result.synchronousSpeedRpm!.toFixed(0)} rpm`} />
                  {result.slipPct != null && <ResultRow label="Slip" value={`${result.slipPct.toFixed(2)}%`} />}
                  <div className="pt-2 text-base font-semibold text-foreground">{result.status}</div>
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
