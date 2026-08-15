"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { ConverterPhase, DEFAULT_POWERCONVERTER_INPUT, KnownQuantity, LoadNature, PowerConverterInput, calcPowerConverter } from "@/lib/powerconverter";

const KNOWN_LABEL: Record<KnownQuantity, string> = {
  kw: "Real Power (kW)",
  kva: "Apparent Power (kVA)",
  kvar: "Reactive Power (kVAR)",
  amps: "Current (A)",
};

export default function PowerConverterPage() {
  const [input, setInput] = useState<PowerConverterInput>(DEFAULT_POWERCONVERTER_INPUT);
  const update = (patch: Partial<PowerConverterInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcPowerConverter(input), [input]);
  const invalidCombo = (input.known === "kw" && input.powerFactor <= 0) || (input.known === "kvar" && input.powerFactor >= 1);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          kW / kVA / kVAR / Amps Converter
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Essential single-phase and three-phase power and current
          conversions from a load profile — enter voltage, power factor,
          and any one known quantity to get the rest. Fully free — no
          subscriber gate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="kW / kVA / kVAR / Amps Converter" standardsLine="AC power-triangle relations" />
          <FeedbackButton calculatorName="kW / kVA / kVAR / Amps Converter" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Converts between the four ways an AC load is commonly expressed \u2014 real power (kW), apparent power (kVA), reactive power (kVAR) and line current (A) \u2014 for single-phase or three-phase systems. Useful whenever a datasheet, tender document or site measurement gives you one of these figures and you need the others for cable sizing, breaker selection or a load schedule."
          standards={["AC power-triangle relations (S=\u221a(P\u00b2+Q\u00b2), P=S\u00b7PF, Q=S\u00b7sin\u03c6)", "3-phase / 1-phase current formulas"]}
          capabilities={["Converts any one known quantity (kW, kVA, kVAR or Amps) into the other three.", "Handles single-phase and three-phase systems with the correct current formula for each.", "Accounts for lagging, leading or unity load nature when reporting reactive power.", "Flags the two mathematically ill-defined input combinations (kW at PF=0, kVAR at PF=1) instead of returning NaN or dividing by zero."]}
          example={{ problem: "A 415V three-phase load draws 100kW at a lagging power factor of 0.85. Find the apparent power, reactive power and line current.", steps: ["Apparent power: S = P / PF = 100 / 0.85 = 117.647 kVA.", "Reactive power: Q = S \u00d7 sin(acos(PF)) = 117.647 \u00d7 sin(acos(0.85)) = 61.968 kVAR.", "Line current (3-phase): I = S\u00d71000 / (\u221a3 \u00d7 V) = 117,647 / (1.732 \u00d7 415) = 163.68 A."], result: "S \u2248 117.6 kVA, Q \u2248 62.0 kVAR, I \u2248 163.7 A \u2014 matches the calculator's default scenario exactly." }}
          notes="Two combinations are mathematically undefined and return no result: kW known at PF=0 (a purely reactive load can't determine apparent power from real power alone), and kVAR known at PF=1 (a purely resistive load has zero kVAR)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Load profile">
              <SelectField<ConverterPhase>
                label="Phase"
                tip={"Whether the load is single-phase or three-phase \u2014 sets which current formula is used (three-phase divides apparent power by \u221a3\u00d7V; single-phase divides by V alone)."} value={input.phase}
                onChange={(v) => update({ phase: v })}
                options={[
                  { value: "1ph", label: "Single-Phase" },
                  { value: "3ph", label: "Three-Phase" },
                ]}
              />
              <NumberField
                label={input.phase === "3ph" ? "Voltage (line-to-line)" : "Voltage"}
                unit="V"
                tip={"System voltage. For three-phase, enter the line-to-line voltage (e.g. 400V or 415V), not the phase voltage."} value={input.voltage}
                onChange={(v) => update({ voltage: v })}
                min={0}
              />
              <NumberField label="Power Factor" tip={"cos \u03c6 of the load \u2014 the ratio of real power (kW) to apparent power (kVA). Needed to convert between kW, kVA and kVAR regardless of which quantity is already known."} value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0} max={1} step="any" />
              <SelectField<LoadNature>
                label="Load Nature"
                tip={"Whether the load's reactive power is inductive (lagging \u2014 motors, transformers), capacitive (leading \u2014 a PFC bank) or purely resistive (unity, no reactive power)."} value={input.loadNature}
                onChange={(v) => update({ loadNature: v })}
                options={[
                  { value: "lagging", label: "Lagging (inductive — motors, transformers)" },
                  { value: "leading", label: "Leading (capacitive — PFC banks)" },
                  { value: "unity", label: "Unity (resistive)" },
                ]}
              />
            </Section>

            <Section title="Known quantity">
              <SelectField<KnownQuantity>
                label="I know this value"
                tip={"Which one quantity you already have. The other three are derived from the AC power-triangle relations S=\u221a(P\u00b2+Q\u00b2), P=S\u00b7PF, Q=S\u00b7sin\u03c6."} value={input.known}
                onChange={(v) => update({ known: v })}
                options={(Object.keys(KNOWN_LABEL) as KnownQuantity[]).map((k) => ({ value: k, label: KNOWN_LABEL[k] }))}
              />
              <NumberField label={KNOWN_LABEL[input.known]} tip={"The numeric value of the known quantity selected above, in its stated unit."} value={input.value} onChange={(v) => update({ value: v })} min={0} step="any" />
            </Section>

            {invalidCombo && (
              <div className="rounded-lg border border-fail/30 bg-fail/10 px-4 py-3 text-sm text-fail">
                {input.known === "kw"
                  ? "Real power (kW) alone can't determine apparent power at PF = 0 (a purely reactive load) — enter kVA, kVAR, or Amps instead, or raise the power factor above 0."
                  : "Reactive power (kVAR) alone can't determine apparent power at PF = 1 (a purely resistive/unity load) — enter kW, kVA, or Amps instead, or lower the power factor below 1."}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {!result ? (
                <EmptyResult message="Enter voltage, power factor and one known quantity to see the converted values." />
              ) : (
                <ResultCard title="Converted values">
                  <ResultRow label="Real Power (P)" value={`${result.kw.toFixed(3)} kW`} />
                  <ResultRow label="Apparent Power (S)" value={`${result.kva.toFixed(3)} kVA`} />
                  <ResultRow label="Reactive Power (Q)" value={`${result.kvar.toFixed(3)} kVAR`} />
                  <ResultRow label="Current" value={`${result.amps.toFixed(2)} A`} />
                  <ResultRow label="Power Factor" value={result.powerFactor.toFixed(3)} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
