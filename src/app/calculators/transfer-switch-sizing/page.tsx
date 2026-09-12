"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_TRANSFER_SWITCH_INPUT,
  TransferSwitchInput,
  TsLoadMethod,
  TsSystemType,
  calcTransferSwitch,
} from "@/lib/transferswitch";

export default function TransferSwitchSizingPage() {
  const [input, setInput] = useState<TransferSwitchInput>(DEFAULT_TRANSFER_SWITCH_INPUT);
  const update = (patch: Partial<TransferSwitchInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcTransferSwitch(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Transfer Switch Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Sizes an automatic or manual transfer switch in amperes from the
          connected standby load, using the standard continuous-load
          125% factor, then rounds up to the next standard commercially
          available switch rating.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Transfer Switch Sizing Calculator" standardsLine="NEC 700/701/702 continuous-load practice (125% continuous, 100% non-continuous), UL 1008 standard ampere ratings" />
          <FeedbackButton calculatorName="Transfer Switch Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Sizes an automatic or manual transfer switch (ATS/MTS) in amperes from the connected standby load, applying the same continuous-load sizing practice used for other emergency/legally-required/optional-standby system equipment under NEC Articles 700–702 (continuous loads at 125%, non-continuous at 100% — the same relation as general service/feeder equipment under 215.2(A)(1)/230.42(A)(1)), then rounding up to the next standard UL 1008-listed switch ampere rating."
            standards={[
              "NEC Art. 700/701/702 — emergency, legally required standby, and optional standby systems",
              "NEC 215.2(A)(1) / 230.42(A)(1) — 125% continuous-load sizing convention (applied here to ATS/MTS equipment)",
              "UL 1008 — standard transfer switch ampere ratings",
            ]}
            capabilities={[
              "Load entry directly in amps, or from kW/kVA with voltage, phase count and power factor.",
              "Splits the load into continuous and non-continuous fractions and applies the 125%/100% sizing factors separately.",
              "Rounds up to the next standard UL 1008 transfer switch ampere rating.",
            ]}
            example={{
              problem: "250kW, 480V three-phase, PF=0.9, fully continuous load.",
              steps: [
                "I = (250/0.9 × 1000) / (√3 × 480) ≈ 334.1 A",
                "Min switch = 1.25 × 334.1 ≈ 417.6 A",
                "Next standard UL 1008 rating ≥ 417.6A → 600A",
              ],
              result: "≈334.1A load current, ≈417.6A minimum, 600A recommended standard switch rating.",
            }}
            notes="This sizes the switch's continuous current rating only — actual ATS/MTS selection must also confirm withstand and closing rating (WCR) against available fault current, number of poles/transition type (open/closed/delayed), and any load-shed or in-phase monitor requirements for the specific application."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="System & load">
              <SelectField<TsSystemType>
                label="System type"
                tip="Informational classification only — sizing method is the same across all three per NEC Art. 700/701/702."
                value={input.systemType}
                onChange={(v) => update({ systemType: v })}
                options={[
                  { value: "emergency", label: "Emergency (Art. 700)" },
                  { value: "legally-required", label: "Legally required standby (Art. 701)" },
                  { value: "optional-standby", label: "Optional standby (Art. 702)" },
                ]}
              />
              <SelectField<TsLoadMethod>
                label="Load entry method"
                value={input.loadMethod}
                onChange={(v) => update({ loadMethod: v })}
                options={[
                  { value: "kw", label: "kW + PF" },
                  { value: "kva", label: "kVA" },
                  { value: "amps", label: "Amps (direct)" },
                ]}
              />
              {input.loadMethod === "amps" && (
                <NumberField label="Connected load" unit="A" value={input.connectedAmps} onChange={(v) => update({ connectedAmps: v })} min={0} />
              )}
              {input.loadMethod === "kw" && (
                <NumberField label="Connected load" unit="kW" value={input.connectedKw} onChange={(v) => update({ connectedKw: v })} min={0} />
              )}
              {input.loadMethod === "kva" && (
                <NumberField label="Connected load" unit="kVA" value={input.connectedKva} onChange={(v) => update({ connectedKva: v })} min={0} />
              )}
              {input.loadMethod !== "amps" && (
                <NumberField label="System voltage" unit="V" value={input.voltageV} onChange={(v) => update({ voltageV: v })} min={1} />
              )}
              {input.loadMethod !== "amps" && (
                <SelectField<1 | 3>
                  label="Phase"
                  value={input.phase}
                  onChange={(v) => update({ phase: v })}
                  options={[
                    { value: 1, label: "Single-phase" },
                    { value: 3, label: "Three-phase" },
                  ]}
                />
              )}
              {input.loadMethod === "kw" && (
                <NumberField label="Power factor" value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0.1} max={1} step={0.01} />
              )}
              <NumberField label="Continuous fraction" tip="Percentage of the load that operates continuously (3 hours or more). The rest is treated as non-continuous (100% factor)." unit="%" value={input.continuousFractionPct} onChange={(v) => update({ continuousFractionPct: v })} min={0} max={100} step={5} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.recommendedSwitchAmps == null ? (
                <EmptyResult message="Enter the connected load to see the recommended switch rating." />
              ) : (
                <ResultCard title="Transfer switch sizing">
                  <ResultRow label="Total load current" value={`${result.totalLoadAmps!.toFixed(1)} A`} />
                  <ResultRow label="Continuous portion" value={`${result.continuousAmps!.toFixed(1)} A`} />
                  <ResultRow label="Non-continuous portion" value={`${result.nonContinuousAmps!.toFixed(1)} A`} />
                  <ResultRow label="Minimum switch rating" value={`${result.minSwitchAmps!.toFixed(1)} A`} />
                  <ResultRow label="Recommended standard rating" value={`${result.recommendedSwitchAmps} A`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
