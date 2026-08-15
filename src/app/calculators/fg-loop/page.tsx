"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_FG_LOOP_INPUT, FgLoopInput, calcFgLoop } from "@/lib/fgloop";

export default function FgLoopPage() {
  const [input, setInput] = useState<FgLoopInput>(DEFAULT_FG_LOOP_INPUT);
  const update = (patch: Partial<FgLoopInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcFgLoop(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Fire &amp; Gas Detection Loop Power Budget
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Standby and alarm-condition voltage budget for a two-wire
          initiating device circuit carrying multiple detectors and an
          end-of-line resistor.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Fire & Gas Detection Loop Power Budget" standardsLine="Generic IDC loop-budget model, consistent with NFPA 72 design practice" />
          <FeedbackButton calculatorName="Fire & Gas Detection Loop Power Budget" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks that a two-wire fire/gas detector loop (initiating device circuit) delivers enough voltage to the farthest device in both its normal standby state and its worst-case alarm state, accounting for the loop's wire resistance, an end-of-line resistor's supervisory current, and each device's own current draw."
            standards={["Generic Ohm's-law loop-budget model, built the same way as this suite's 4-20mA loop calculator, consistent with the reasoning fire alarm/gas panels use internally (see NFPA 72 IDC design practice) — not tied to one specific panel manufacturer's exact topology"]}
            capabilities={[
              "Standby loop current from each device's quiescent draw plus the end-of-line resistor's supervisory current.",
              "Alarm loop current for a worst-case number of simultaneously-alarming devices, with the rest still at standby draw.",
              "Voltage available at the farthest device in both states, checked against its minimum operating voltage.",
            ]}
            example={{
              problem: "24V panel, 10 detectors at 0.5mA standby / 30mA alarm, 1 alarming worst case, 10kΩ EOL, 20Ω round-trip loop resistance, 16V minimum device voltage.",
              steps: [
                "Standby current = 10×0.5mA + 24V/10kΩ = 5mA + 2.4mA = 7.4mA.",
                "Standby voltage at device = 24 − 0.0074×20 = 23.85V — passes.",
                "Alarm current = (1×30mA + 9×0.5mA) + 2.4mA = 34.5mA + 2.4mA = 36.9mA.",
                "Alarm voltage at device = 24 − 0.0369×20 = 23.26V — passes.",
              ],
              result: "Both standby (23.85V) and alarm (23.26V) states comfortably clear the 16V minimum — hand-checked and matched the live code exactly.",
            }}
            notes="This is a generic loop-budget model, not a substitute for your specific fire/gas panel's own loop-loading tables — some panels bypass the EOL resistor during alarm, or apply different supervision logic; confirm against your panel's installation manual for a real design. Addressable loops (which communicate digitally rather than relying on an analog voltage/current budget) aren't modeled here."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Panel & loop">
              <NumberField label="Supply voltage" unit="V" value={input.supplyVoltageV} onChange={(v) => update({ supplyVoltageV: v })} min={0} />
              <NumberField label="Loop resistance" unit="Ω" hint="round-trip" tip="Total round-trip wiring resistance of the loop, out to the farthest device and back." value={input.loopResistanceOhms} onChange={(v) => update({ loopResistanceOhms: v })} min={0} />
              <NumberField label="EOL resistor" unit="Ω" tip="End-of-line resistor value — set to 0 if the loop doesn't use a discrete EOL resistor (e.g. some addressable systems)." value={input.eolResistorOhms} onChange={(v) => update({ eolResistorOhms: v })} min={0} />
              <NumberField label="Minimum device operating voltage" unit="V" tip="The minimum voltage the farthest device needs at its terminals to operate correctly, from its datasheet." value={input.minOperatingVoltageV} onChange={(v) => update({ minOperatingVoltageV: v })} min={0} />
            </Section>

            <Section title="Devices">
              <NumberField label="Number of devices" value={input.numDevices} onChange={(v) => update({ numDevices: v })} min={1} step={1} />
              <NumberField label="Standby current per device" unit="mA" value={input.standbyMaPerDevice} onChange={(v) => update({ standbyMaPerDevice: v })} min={0} step={0.01} />
              <NumberField label="Alarm current per device" unit="mA" value={input.alarmMaPerDevice} onChange={(v) => update({ alarmMaPerDevice: v })} min={0} />
              <NumberField label="Devices alarming (worst case)" tip="Worst-case number of devices expected to be in alarm simultaneously — commonly 1, but consider your specific fire scenario." value={input.numDevicesAlarming} onChange={(v) => update({ numDevicesAlarming: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.standbyCurrentA == null ? (
                <EmptyResult message="Enter supply voltage and loop resistance to see loop budget results." />
              ) : (
                <>
                  <ResultCard title="Standby state">
                    <ResultRow label="Standby loop current" value={`${(result.standbyCurrentA * 1000).toFixed(2)} mA`} />
                    {result.standbyVoltageAtDevice != null && result.standbyPass !== null && (
                      <CheckRow label="Voltage at farthest device" value={`${result.standbyVoltageAtDevice.toFixed(2)} V`} pass={result.standbyPass} />
                    )}
                  </ResultCard>

                  <ResultCard title="Alarm state">
                    <ResultRow label="Alarm loop current" value={`${(result.alarmCurrentA! * 1000).toFixed(2)} mA`} />
                    {result.alarmVoltageAtDevice != null && result.alarmPass !== null && (
                      <CheckRow label="Voltage at farthest device" value={`${result.alarmVoltageAtDevice.toFixed(2)} V`} pass={result.alarmPass} />
                    )}
                  </ResultCard>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
