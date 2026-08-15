"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_DIFF_TRANSFORMER_INPUT, DiffTransformerInput, calcDiffTransformer } from "@/lib/difftransformer";

export default function TransformerDifferentialPage() {
  const [input, setInput] = useState<DiffTransformerInput>(DEFAULT_DIFF_TRANSFORMER_INPUT);
  const update = (patch: Partial<DiffTransformerInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcDiffTransformer(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Transformer Differential Protection (87T)
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Percentage-bias (percentage differential) restraint characteristic
          check — dual-slope operate curve consistent with IEEE C37.91
          transformer protection guidance.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Transformer Differential Protection (87T)" standardsLine="Percentage-bias principle, IEEE C37.91-consistent" />
          <FeedbackButton calculatorName="Transformer Differential Protection (87T)" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks whether a transformer differential (87T) relay would operate for a given pair of CT-secondary currents, using the standard percentage-bias (percentage differential) principle: differential current Id = |I1−I2| is compared against a dual-slope restraint characteristic based on the bias/restraint current Ir = (I1+I2)/2."
            standards={["Percentage-bias / percentage-differential protection principle, consistent with IEEE C37.91 transformer protection guidance"]}
            capabilities={[
              "Differential (operate) current and restraint (bias) current from the two CT-secondary currents.",
              "Dual-slope restraint characteristic: minimum pickup, a low first slope (covers tap-changer range and CT mismatch), and a steeper second slope above a configurable knee restraint current (stays secure during CT saturation on close-in through-faults).",
              "Trip / no-trip verdict.",
            ]}
            example={{
              problem: "I1=1.05pu, I2=0.98pu, minimum pickup 0.3pu, slope1 25%, knee at 2.0pu restraint, slope2 60%.",
              steps: [
                "Id = |1.05−0.98| = 0.07pu.",
                "Ir = (1.05+0.98)/2 = 1.015pu — below the 2.0pu knee, so slope1 applies.",
                "Threshold = 0.3 + 0.25×1.015 = 0.554pu.",
                "0.07pu < 0.554pu → no trip (normal load/inrush condition, correctly restrained).",
              ],
              result: "No trip — hand-checked and matched the live code exactly.",
            }}
            notes="Currents must already be referred to a common base (CT ratio and vector-group/phase-shift compensated) before entering them here — this tool checks the restraint characteristic itself, not the CT/vector-group compensation."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="CT-secondary currents (common base, p.u.)">
              <NumberField label="I1 (into transformer)" unit="p.u." value={input.i1Primary} onChange={(v) => update({ i1Primary: v })} step={0.01} />
              <NumberField label="I2 (out of transformer)" unit="p.u." value={input.i2Primary} onChange={(v) => update({ i2Primary: v })} step={0.01} />
            </Section>

            <Section title="Restraint characteristic">
              <NumberField label="Minimum pickup, Id0" unit="p.u." value={input.minPickupPu} onChange={(v) => update({ minPickupPu: v })} min={0} step={0.01} />
              <NumberField label="Slope 1" unit="%" value={input.slope1Pct} onChange={(v) => update({ slope1Pct: v })} min={0} step={1} />
              <NumberField label="Knee restraint current" unit="p.u." value={input.knee2Pu} onChange={(v) => update({ knee2Pu: v })} min={0} step={0.1} />
              <NumberField label="Slope 2" unit="%" value={input.slope2Pct} onChange={(v) => update({ slope2Pct: v })} min={0} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.differentialCurrentPu == null ? (
                <EmptyResult message="Enter I1 and I2 to see the differential protection check." />
              ) : (
                <ResultCard title="87T restraint check">
                  <ResultRow label="Differential current, Id" value={`${result.differentialCurrentPu.toFixed(4)} p.u.`} />
                  <ResultRow label="Restraint current, Ir" value={`${result.restraintCurrentPu!.toFixed(4)} p.u.`} />
                  <ResultRow label="Operate threshold at this Ir" value={`${result.operatePickupPu!.toFixed(4)} p.u.`} />
                  <CheckRow label="Trips" value={result.trips ? "YES" : "NO"} pass={result.trips === false ? true : result.trips === true ? null : null} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
