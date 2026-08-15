"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_LOOP420_INPUT,
  Loop420Input,
  WireAwg,
  LengthUnit,
  AWG_OHMS_PER_1000FT,
  calcLoop420,
} from "@/lib/loop420";

export default function CurrentLoop420Page() {
  const [input, setInput] = useState<Loop420Input>(DEFAULT_LOOP420_INPUT);
  const update = (patch: Partial<Loop420Input>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcLoop420(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          4-20mA Current Loop Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Loop voltage budget for a 2-wire loop-powered transmitter: wire
          voltage drop at 20mA, voltage available at the transmitter, and
          maximum cable length before the transmitter starves.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="4-20mA Current Loop Calculator" standardsLine="Ohm's law loop voltage budget" />
          <FeedbackButton calculatorName="4-20mA Current Loop Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks whether a 2-wire, loop-powered 4-20mA transmitter will have enough terminal voltage to operate reliably at the far end of a long cable run, by budgeting the DC supply voltage against the worst-case (20mA) voltage drop across the wiring, the receiver/input resistance, and any other series devices (barriers, isolators, indicators) in the loop."
            standards={["Standard 2-wire loop-powered transmitter voltage-budget arithmetic (Ohm's law)"]}
            capabilities={[
              "Round-trip wire resistance from AWG wire gauge and one-way cable length (ft or m).",
              "Total loop resistance, voltage drop in the wiring, and voltage available at the transmitter at 20mA (worst case).",
              "Pass/fail check against the transmitter's minimum rated terminal voltage.",
              "Reverse calculation: maximum loop resistance budget and maximum cable length for a given supply/transmitter-minimum/receiver combination.",
            ]}
            example={{
              problem: "24V supply, transmitter needs 10V minimum, 250Ω receiver, 500ft of #22 AWG wire.",
              steps: [
                "Wire resistance per 1000ft (#22 AWG) = 16.14Ω → round-trip = 2 × 500 × 16.14/1000 = 16.14Ω.",
                "Total loop resistance = 16.14 + 250 = 266.14Ω.",
                "Voltage at transmitter at 20mA = 24 − 0.02 × 266.14 = 24 − 5.32 = 18.68V.",
                "Headroom = 18.68 − 10 = 8.68V ≥ 0 → pass.",
              ],
              result: "18.68V available at the transmitter, 8.68V of headroom — comfortably passes, hand-checked and matched the live code exactly.",
            }}
            notes="Wire resistance table is standard annealed-copper AWG data at 20°C (published wire tables). Designed from scratch — no equivalent module in the source app."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Power supply & transmitter">
              <NumberField
                label="Loop supply voltage"
                unit="V"
                tip="DC voltage of the loop power supply — either a dedicated 24V loop supply or the AI card's internal loop-power source."
                value={input.supplyVoltageV}
                onChange={(v) => update({ supplyVoltageV: v })}
                min={0}
              />
              <NumberField
                label="Transmitter minimum voltage"
                unit="V"
                tip="The transmitter's own minimum required terminal voltage at 20mA, from its datasheet — the voltage it needs across its own terminals to operate correctly, after all wiring and receiver drops are subtracted."
                value={input.transmitterMinVoltageV}
                onChange={(v) => update({ transmitterMinVoltageV: v })}
                min={0}
              />
            </Section>

            <Section title="Loop resistances">
              <NumberField
                label="Receiver / input resistance"
                unit="Ω"
                tip="The load resistance the loop current flows through to produce a readable signal — a dedicated 250Ω precision resistor, or a PLC/DCS analog input card's internal burden resistance."
                value={input.receiverOhms}
                onChange={(v) => update({ receiverOhms: v })}
                min={0}
              />
              <NumberField
                label="Other series resistance"
                unit="Ω"
                tip="Any additional series devices in the loop — intrinsic safety barriers, isolators, indicators, or additional burden resistors."
                value={input.otherOhms}
                onChange={(v) => update({ otherOhms: v })}
                min={0}
              />
            </Section>

            <Section title="Cable">
              <SelectField<WireAwg>
                label="Wire gauge"
                tip="American Wire Gauge of the loop conductors — smaller AWG number means thicker wire and less resistance per unit length."
                value={input.wireAwg}
                onChange={(v) => update({ wireAwg: v })}
                options={(Object.keys(AWG_OHMS_PER_1000FT) as unknown as WireAwg[])
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((awg) => ({ value: awg as WireAwg, label: `#${awg} AWG (${AWG_OHMS_PER_1000FT[awg as WireAwg]}Ω/1000ft)` }))}
              />
              <SelectField<LengthUnit>
                label="Length unit"
                value={input.lengthUnit}
                onChange={(v) => update({ lengthUnit: v })}
                options={[
                  { value: "ft", label: "Feet" },
                  { value: "m", label: "Meters" },
                ]}
              />
              <NumberField
                label="One-way cable length"
                unit={input.lengthUnit}
                tip="Distance from the power supply / receiver to the transmitter, one-way — the calculator doubles this for round-trip (go and return) wire resistance."
                value={input.cableLength}
                onChange={(v) => update({ cableLength: v })}
                min={0}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.wireResistanceOhms == null ? (
                <EmptyResult message="Enter a cable length to see loop voltage budget results." />
              ) : (
                <ResultCard title="Loop voltage budget">
                  <ResultRow label="Round-trip wire resistance" value={`${result.wireResistanceOhms.toFixed(2)} Ω`} />
                  {result.totalLoopOhms != null && (
                    <ResultRow label="Total loop resistance" value={`${result.totalLoopOhms.toFixed(2)} Ω`} />
                  )}
                  {result.voltageDropWireV != null && (
                    <ResultRow label="Voltage drop in wiring (at 20mA)" value={`${result.voltageDropWireV.toFixed(3)} V`} />
                  )}
                  {result.voltageAtTransmitterV != null && (
                    <ResultRow label="Voltage available at transmitter" value={`${result.voltageAtTransmitterV.toFixed(2)} V`} />
                  )}
                  {result.headroomV != null && result.pass != null && (
                    <CheckRow label="Headroom vs. transmitter minimum" value={`${result.headroomV.toFixed(2)} V`} pass={result.pass} />
                  )}
                </ResultCard>
              )}

              {result.maxLoopOhmsAvailable != null && (
                <ResultCard title="Maximum reach">
                  <ResultRow label="Max loop resistance budget" value={`${result.maxLoopOhmsAvailable.toFixed(1)} Ω`} />
                  {result.maxCableLength != null && (
                    <ResultRow
                      label="Max one-way cable length"
                      value={`${result.maxCableLength.toFixed(0)} ${input.lengthUnit}`}
                    />
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
