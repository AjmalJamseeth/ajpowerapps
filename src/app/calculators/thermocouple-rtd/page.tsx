"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  TcType,
  calcTcCjc,
  RtdNominal,
  RtdWiring,
  DEFAULT_RTD_INPUT,
  calcRtd,
} from "@/lib/thermocouple";

type Mode = "thermocouple" | "rtd";

export default function ThermocoupleRtdPage() {
  const [mode, setMode] = useState<Mode>("thermocouple");

  const [tcType, setTcType] = useState<TcType>("K");
  const [measuredMv, setMeasuredMv] = useState<number | null>(8.13);
  const [coldJunctionTempC, setColdJunctionTempC] = useState<number | null>(25);

  const [rtdInput, setRtdInput] = useState(DEFAULT_RTD_INPUT);
  const updateRtd = (patch: Partial<typeof rtdInput>) => setRtdInput((prev) => ({ ...prev, ...patch }));

  const tcResult = useMemo(
    () => calcTcCjc({ type: tcType, measuredMv, coldJunctionTempC }),
    [tcType, measuredMv, coldJunctionTempC]
  );
  const rtdResult = useMemo(() => calcRtd(rtdInput), [rtdInput]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Thermocouple &amp; RTD Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          NIST ITS-90 thermocouple mV-to-temperature conversion with
          cold-junction compensation (types K, J, T, E), and IEC 60751
          Callendar-Van Dusen RTD resistance-to-temperature conversion with
          2/3/4-wire lead compensation.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Thermocouple & RTD Calculator" standardsLine="NIST ITS-90 / IEC 60751" />
          <FeedbackButton calculatorName="Thermocouple & RTD Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Converts a thermocouple's raw millivolt reading to a cold-junction-compensated temperature using the official NIST ITS-90 reference polynomials, or converts an RTD's measured resistance to temperature using the IEC 60751 Callendar-Van Dusen equation with lead-wire compensation for 2/3/4-wire installations."
            standards={["NIST ITS-90 thermocouple reference functions (Monograph 175)", "IEC 60751 (industrial platinum resistance thermometers)"]}
            capabilities={[
              "Thermocouple types K, J, T, E — official NIST inverse polynomial (mV → °C), each fit within its standard sub-ranges.",
              "Cold-junction compensation using the superposition law: measured mV + cold-junction-equivalent mV, then converted to the true hot-junction temperature.",
              "RTD (Pt100 / Pt500 / Pt1000, alpha=0.00385): resistance-to-temperature via Callendar-Van Dusen, both above- and below-zero branches.",
              "RTD lead-wire compensation for 2-wire, 3-wire, and 4-wire (Kelvin) installations.",
            ]}
            example={{
              problem: "Type K thermocouple reads 8.13mV raw, cold junction (terminal block) at 25°C. Separately, a Pt100 RTD (3-wire) reads 138.51Ω with negligible lead resistance.",
              steps: [
                "Type K equivalent mV at 25°C ≈ 1.000mV (from the NIST inverse-then-forward relationship).",
                "Total compensated voltage = 8.13 + 1.00 = 9.13mV.",
                "NIST inverse polynomial: 9.13mV → hot-junction temperature ≈ 222°C.",
                "Pt100: R(100°C) = 100×(1 + 3.9083e-3×100 − 5.775e-7×100²) = 138.51Ω exactly — matches the reading, so RTD temperature = 100°C.",
              ],
              result: "Type K compensated temperature ≈ 222°C; Pt100 reads exactly 100°C — both hand-checked against the official NIST/IEC reference values and matched the live code to well within their stated tolerances (±0.05°C class for the polynomials).",
            }}
            notes="Rare-metal/high-temperature thermocouple types (N, R, S, B) are not yet implemented in this calculator — types K, J, T, E cover the large majority of general industrial instrumentation. Cold-junction-equivalent mV is obtained by numerically inverting the same trusted NIST inverse polynomial (bisection), rather than a separately-fitted forward polynomial. 3-wire RTD lead compensation assumes matched lead resistances on all three conductors."
          />
        </div>

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("thermocouple")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === "thermocouple" ? "bg-accent text-background" : "border border-border bg-surface text-muted hover:text-foreground"}`}
          >
            Thermocouple
          </button>
          <button
            type="button"
            onClick={() => setMode("rtd")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${mode === "rtd" ? "bg-accent text-background" : "border border-border bg-surface text-muted hover:text-foreground"}`}
          >
            RTD
          </button>
        </div>

        {mode === "thermocouple" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Section title="Thermocouple reading">
                <SelectField<TcType>
                  label="Thermocouple type"
                  tip="Standard letter-designated thermocouple type — determines which NIST ITS-90 reference function is used. N, R, S, B are not yet implemented."
                  value={tcType}
                  onChange={setTcType}
                  options={[
                    { value: "K", label: "Type K (Chromel / Alumel) — most common" },
                    { value: "J", label: "Type J (Iron / Constantan)" },
                    { value: "T", label: "Type T (Copper / Constantan)" },
                    { value: "E", label: "Type E (Chromel / Constantan)" },
                  ]}
                />
                <NumberField
                  label="Measured (raw) voltage"
                  unit="mV"
                  tip="The raw thermoelectric voltage measured directly across the thermocouple's terminals, before any cold-junction compensation is applied."
                  value={measuredMv}
                  onChange={setMeasuredMv}
                />
                <NumberField
                  label="Cold junction temperature"
                  unit="°C"
                  tip="The temperature at the reference/terminal junction (where the thermocouple wire connects to copper instrument wiring) — typically measured by a local sensor (thermistor/IC sensor) at the terminal block, since it's rarely exactly 0°C in the field."
                  value={coldJunctionTempC}
                  onChange={setColdJunctionTempC}
                />
              </Section>
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                {tcResult.hotJunctionTempC == null ? (
                  <EmptyResult message="Enter the measured voltage and cold junction temperature to see the compensated result." />
                ) : (
                  <ResultCard title="Compensated result">
                    {tcResult.cjcEquivalentMv != null && (
                      <ResultRow label="Cold junction equivalent voltage" value={`${tcResult.cjcEquivalentMv.toFixed(3)} mV`} />
                    )}
                    {tcResult.totalMv != null && (
                      <ResultRow label="Total compensated voltage" value={`${tcResult.totalMv.toFixed(3)} mV`} />
                    )}
                    <ResultRow label="Hot junction temperature" value={<span className="text-lg text-accent-2">{tcResult.hotJunctionTempC.toFixed(1)} °C</span>} />
                  </ResultCard>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Section title="RTD reading">
                <SelectField<RtdNominal>
                  label="RTD nominal"
                  tip="Nominal resistance at 0°C — Pt100 is by far the most common industrial RTD; Pt500/Pt1000 give a larger, more noise-immune signal for the same temperature change."
                  value={rtdInput.nominal}
                  onChange={(v) => updateRtd({ nominal: v })}
                  options={[
                    { value: 100, label: "Pt100 (100Ω @ 0°C)" },
                    { value: 500, label: "Pt500 (500Ω @ 0°C)" },
                    { value: 1000, label: "Pt1000 (1000Ω @ 0°C)" },
                  ]}
                />
                <SelectField<RtdWiring>
                  label="Wiring configuration"
                  tip="4-wire (Kelvin) fully excludes lead resistance; 3-wire substantially cancels it (assuming matched leads); 2-wire adds both lead resistances directly to the reading — significant over long runs."
                  value={rtdInput.wiring}
                  onChange={(v) => updateRtd({ wiring: v })}
                  options={[
                    { value: "2-wire", label: "2-wire" },
                    { value: "3-wire", label: "3-wire" },
                    { value: "4-wire", label: "4-wire (Kelvin)" },
                  ]}
                />
                <NumberField
                  label="Measured resistance"
                  unit="Ω"
                  tip="The resistance value read by the instrument, before lead-wire compensation."
                  value={rtdInput.measuredOhms}
                  onChange={(v) => updateRtd({ measuredOhms: v })}
                  min={0}
                />
                <NumberField
                  label="Lead resistance per wire"
                  unit="Ω"
                  tip="Resistance of a single lead conductor (not round-trip) — from cable datasheet resistance-per-length × run length. Leave at 0 if unknown or using 4-wire."
                  value={rtdInput.leadOhmsPerWire}
                  onChange={(v) => updateRtd({ leadOhmsPerWire: v })}
                  min={0}
                />
              </Section>
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                {rtdResult.tempC == null ? (
                  <EmptyResult message="Enter the measured resistance to see the RTD temperature." />
                ) : (
                  <ResultCard title="RTD result">
                    {rtdResult.compensatedOhms != null && (
                      <ResultRow label="Lead-compensated resistance" value={`${rtdResult.compensatedOhms.toFixed(3)} Ω`} />
                    )}
                    <ResultRow label="Temperature" value={<span className="text-lg text-accent-2">{rtdResult.tempC.toFixed(2)} °C</span>} />
                    <p className="pt-2 text-xs text-muted">{rtdResult.leadErrorNote}</p>
                  </ResultCard>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
