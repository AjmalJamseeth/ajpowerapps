"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_OHL_VOLTAGE_REG_INPUT, OhlVoltageRegInput, calcOhlVoltageReg } from "@/lib/ohlvoltagereg";

export default function OhlVoltageRegulationPage() {
  const [input, setInput] = useState<OhlVoltageRegInput>(DEFAULT_OHL_VOLTAGE_REG_INPUT);
  const update = (patch: Partial<OhlVoltageRegInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcOhlVoltageReg(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Overhead Line Voltage Regulation
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Approximate voltage drop and regulation for a single overhead (or
          underground) circuit, from your own conductor&apos;s R and X per km.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Overhead Line Voltage Regulation" standardsLine="Standard short-line approximate voltage-drop formula" />
          <FeedbackButton calculatorName="Overhead Line Voltage Regulation" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates voltage drop and percent regulation along a single overhead (or underground) circuit using the standard short-line approximate formula: Vdrop ≈ √3 × I × (R cos φ + X sin φ) × length, from your own conductor's resistance and reactance per km."
            standards={["Standard short-line approximate voltage-drop formula (widely used for lines where the shunt capacitance/charging current is negligible)"]}
            capabilities={[
              "Voltage drop, percent regulation, and receiving-end voltage from current, power factor, conductor R/X per km, and line length.",
            ]}
            example={{
              problem: "11kV feeder, 100A at 0.85 lagging PF, R=0.4Ω/km, X=0.35Ω/km, 5km.",
              steps: [
                "R_total = 0.4×5 = 2Ω, X_total = 0.35×5 = 1.75Ω.",
                "sin φ = √(1−0.85²) = 0.527.",
                "Vdrop = √3 × 100 × (2×0.85 + 1.75×0.527) = 173.2 × 2.622 ≈ 454.1V.",
                "%Reg = 454.1/11000 × 100 ≈ 4.13%.",
              ],
              result: "≈454V drop, ≈4.13% regulation — hand-checked and matched the live code exactly.",
            }}
            notes="Deliberately does NOT embed an ACSR/AAAC/AAC conductor lookup table (to avoid transcription risk) — enter R and X per km for your specific conductor and spacing from its datasheet or a verified conductor-data reference. This short-line approximation omits shunt capacitance; for very long or high-voltage lines, a full line model may be needed."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Circuit">
              <NumberField label="Sending voltage (line-line)" unit="kV" value={input.sendingVoltageKv} onChange={(v) => update({ sendingVoltageKv: v })} min={0} step={0.1} />
              <NumberField label="Current" unit="A" value={input.currentA} onChange={(v) => update({ currentA: v })} min={0} />
              <NumberField label="Power factor (lagging)" hint="0-1" value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0} max={1} step={0.01} />
              <NumberField label="Conductor R" unit="Ω/km" value={input.rOhmPerKm} onChange={(v) => update({ rOhmPerKm: v })} min={0} step={0.01} />
              <NumberField label="Conductor X" unit="Ω/km" value={input.xOhmPerKm} onChange={(v) => update({ xOhmPerKm: v })} min={0} step={0.01} />
              <NumberField label="Line length" unit="km" value={input.lengthKm} onChange={(v) => update({ lengthKm: v })} min={0} step={0.1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.voltageDropV == null ? (
                <EmptyResult message="Enter circuit details to see voltage regulation." />
              ) : (
                <ResultCard title="Voltage regulation">
                  <ResultRow label="Voltage drop" value={`${result.voltageDropV.toFixed(1)} V`} />
                  <ResultRow label="Regulation" value={`${result.regulationPct!.toFixed(2)}%`} />
                  <ResultRow label="Receiving-end voltage" value={`${result.receivingVoltageKv!.toFixed(3)} kV`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
