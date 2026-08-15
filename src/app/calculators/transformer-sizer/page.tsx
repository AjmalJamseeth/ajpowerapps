"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { COOLING_CLASS_LABEL, CoolingClass, DEFAULT_XFMRSIZER_INPUT, LoadMethod, StandardBasis, XfmrSizerInput, calcXfmrSizer } from "@/lib/xfmrsizer";

export default function TransformerSizerPage() {
  const [input, setInput] = useState<XfmrSizerInput>(DEFAULT_XFMRSIZER_INPUT);
  const update = (patch: Partial<XfmrSizerInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcXfmrSizer(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Transformer Sizer</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Sizes a new transformer — or an N-1 redundant group — from
          connected load, growth/safety margins, ambient + altitude
          derating (IEC 60076-1/2/11-aligned reference conditions), and
          standard ANSI/IEEE or IEC preferred kVA ratings. For analyzing
          losses/efficiency of an <em>existing</em> transformer, see the
          Generator &amp; Transformer Analysis calculator instead. Fully
          free — no subscriber gate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Transformer Sizer" standardsLine="IEC 60076-1/2/11" />
          <FeedbackButton calculatorName="Transformer Sizer" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a new transformer \u2014 or an N-1 redundant group \u2014 from connected load, growth and safety margins, ambient and altitude derating, and standard kVA ratings. Distinct from the Generator & Transformer Analysis calculator's Transformer tab, which analyzes an existing unit's losses/efficiency from test data rather than sizing a new one from load."
          standards={["IEC 60076-1 \u00a74.2 (reference conditions)", "IEC 60076-2 \u00a75.1/\u00a76.3.2 (temperature rise & altitude)", "IEC 60076-11 (dry-type altitude)", "IEC 60076-1 R10 preferred sizes", "ANSI/IEEE C57.12.00-style ratings"]}
          capabilities={["Sizes from kW+PF or direct kVA, with growth and safety margins.", "Ambient derating above the IEC 40\u00b0C reference and altitude derating above the IEC 1000m reference, with separate rates for naturally- vs. forced-cooled types.", "N-1 redundant group sizing \u2014 any (N\u22121) of N identical units carries the full load.", "Rounds to either ANSI/IEEE or IEC 60076-1 preferred standard kVA sizes."]}
          example={{ problem: "Size an N-1 redundant pair (N=2) of transformers for an 800kW, 0.9 PF load, with 15% growth margin, 10% safety margin, 45\u00b0C ambient, and 1000m altitude.", steps: ["Design load = 800 / 0.9 = 888.9 kVA.", "Margined load = 888.9 \u00d7 1.15 \u00d7 1.10 = 1124.4 kVA.", "Ambient derate factor = 1 \u2212 (45\u221240)\u00d71.25% = 0.9375 (5\u00b0C above the 40\u00b0C IEC reference).", "Altitude derate factor = 1.0 (at the 1000m reference, no altitude derating applies).", "Effective required capacity = 1124.4 / 0.9375 = 1199.4 kVA.", "With N=2, any 1 of 2 units must carry the full 1199.4 kVA alone \u2192 per-unit requirement = 1199.4 kVA.", "Round up to the nearest standard ANSI size \u2192 1500 kVA per unit (3000 kVA total installed)."], result: "1500 kVA per unit, 3000 kVA total installed \u2014 matches the calculator's default scenario exactly." }}
          notes="The 40\u00b0C ambient and 1000m altitude reference points are directly from IEC 60076-1/2, but the specific derating rates (%/\u00b0C, %/100m) are commonly published engineering rules of thumb, not literal standard values \u2014 always confirm against the manufacturer's own thermal/altitude rating curve."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Connected load">
              <SelectField<LoadMethod> label="Load Basis" tip={"Whether you're entering the connected load as kW + power factor, or directly as kVA."} value={input.loadMethod} onChange={(v) => update({ loadMethod: v })} options={[
                { value: "kw", label: "kW + Power Factor" },
                { value: "kva", label: "kVA (direct)" },
              ]} />
              <div />
              {input.loadMethod === "kw" ? (
                <>
                  <NumberField label="Connected Load" unit="kW" tip={"The facility's connected (or demand) real load, before any growth/safety margin."} value={input.connectedKw} onChange={(v) => update({ connectedKw: v })} min={0} />
                  <NumberField label="Power Factor" tip={"Load power factor, used to convert kW to kVA (kVA = kW / PF) when sizing by real power."} value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0.1} max={1} step="any" />
                </>
              ) : (
                <NumberField label="Connected Load" unit="kVA" tip={"The facility's connected (or demand) apparent load, if already known directly in kVA."} value={input.connectedKva} onChange={(v) => update({ connectedKva: v })} min={0} />
              )}
            </Section>

            <Section title="Margins & derating">
              <NumberField label="Growth Margin" unit="%" tip={"Extra capacity reserved for future load growth over the transformer's service life \u2014 a planning allowance, not a code-mandated figure."} value={input.growthMarginPct} onChange={(v) => update({ growthMarginPct: v })} min={0} step="any" />
              <NumberField label="Safety Margin" unit="%" tip={"General engineering safety margin applied on top of growth, before standard-size rounding."} value={input.safetyMarginPct} onChange={(v) => update({ safetyMarginPct: v })} min={0} step="any" />
              <NumberField label="Ambient Temperature" hint="IEC ref. 40°C max" unit="°C" tip={"Site ambient temperature. IEC 60076-1 \u00a74.2 references nameplate ratings to a 40\u00b0C maximum ambient \u2014 running hotter reduces the transformer's safe continuous capacity below its nameplate kVA."} value={input.ambientC} onChange={(v) => update({ ambientC: v })} min={-10} max={80} />
              <NumberField label="Site Altitude" hint="IEC ref. ≤1000m" unit="m" tip={"Site altitude above sea level. IEC 60076-2 \u00a76.3.2 references ratings to \u22641000m \u2014 thinner air at higher altitude cools less effectively, so the temperature-rise limit (and safe capacity) is derated above that reference."} value={input.altitudeM} onChange={(v) => update({ altitudeM: v })} min={0} max={5000} />
              <div className="col-span-2">
                <SelectField<CoolingClass> label="Cooling Class" tip={"Transformer cooling method. Naturally-cooled types (ONAN/AN) get a gentler altitude derating rate than forced-air-cooled types (ONAF/AF), per IEC 60076-2's steeper temperature-rise reduction requirement for forced cooling."} value={input.coolingClass} onChange={(v) => update({ coolingClass: v })} options={(Object.keys(COOLING_CLASS_LABEL) as CoolingClass[]).map((k) => ({ value: k, label: COOLING_CLASS_LABEL[k] }))} />
              </div>
            </Section>

            <Section title="Standard sizes & redundancy">
              <SelectField<StandardBasis> label="Standard Basis" tip={"Which family of standard kVA ratings to round up to \u2014 ANSI/IEEE (C57.12.00-style, e.g. 750/1000/1500) or IEC 60076-1's R10 preferred-number series (e.g. 800/1000/1250). The two lists step differently and can change the recommended size for the same load."} value={input.standardBasis} onChange={(v) => update({ standardBasis: v })} options={[
                { value: "ansi", label: "ANSI / IEEE (C57.12.00-style)" },
                { value: "iec", label: "IEC 60076-1 preferred sizes (R10 series)" },
              ]} />
              <NumberField label="Total Units Installed (N)" tip={"Total number of identical transformers installed at this location. With N units, any (N\u22121) must carry the full design load alone \u2014 N=1 means no redundancy, N=2 is the common 1-for-1 redundant pair."} value={input.totalUnits} onChange={(v) => update({ totalUnits: v })} min={1} step={1} />
            </Section>
            <p className="text-xs text-muted">
              With N total units, any (N−1) must be able to carry the full
              design load alone — N=2 (the common 1-for-1 redundant pair)
              sizes each unit for 100% of the load; N=1 means no redundancy.
              Ambient/altitude derating rates above the IEC reference
              points are commonly published engineering rules of thumb —
              always confirm against the manufacturer's thermal/altitude
              rating curve for a final selection.
            </p>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {!result ? (
                <EmptyResult message="Enter the connected load to see results." />
              ) : (
                <ResultCard title="Sizing result">
                  <ResultRow label="Design Load" value={`${result.designLoadKva.toFixed(1)} kVA`} />
                  <ResultRow label="Margined Load" value={`${result.marginedLoadKva.toFixed(1)} kVA`} />
                  <ResultRow label="Ambient Derate Factor" value={result.ambientDerateFactor.toFixed(4)} />
                  <ResultRow label="Altitude Derate Factor" value={result.altitudeDerateFactor.toFixed(4)} />
                  <ResultRow label="Combined Derate Factor" value={result.totalDerateFactor.toFixed(4)} />
                  <ResultRow label="Effective Required Capacity" value={`${result.effectiveRequiredKva.toFixed(1)} kVA`} />
                  <ResultRow label={`Per-Unit Required (÷${result.redundantUnitsRequired})`} value={`${result.perUnitRequiredKva.toFixed(1)} kVA`} />
                  <ResultRow label="Recommended Standard Size" value={`${result.recommendedKva} kVA per unit`} />
                  <ResultRow label="Total Installed Capacity" value={`${result.totalInstalledKva.toLocaleString()} kVA`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
