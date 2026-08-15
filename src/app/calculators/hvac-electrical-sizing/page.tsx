"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import { ComboRow, DEFAULT_HVAC_INPUT, HvacInput, HvacStandard, calcHvac } from "@/lib/hvac";

export default function HvacElectricalSizingPage() {
  const [input, setInput] = useState<HvacInput>(DEFAULT_HVAC_INPUT);
  const update = (patch: Partial<HvacInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const updateRow = (i: number, patch: Partial<ComboRow>) => update({ comboRows: input.comboRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });
  const addRow = () => update({ comboRows: [...input.comboRows, { desc: `Row ${input.comboRows.length + 1}`, rla: null }] });
  const removeRow = (i: number) => update({ comboRows: input.comboRows.filter((_, idx) => idx !== i) });

  const nec = input.standard === "nec";
  // Multi-motor combination-load and VFD-fed motor sizing are subscriber
  // features — never computed on the free site.
  const result = useMemo(() => calcHvac(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">HVAC Electrical Sizing Calculator</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Motor-compressor branch-circuit sizing (NEC Article 440) or general
          method (IEC 60364-5-52). Single motor free — multi-motor
          combination-load equipment and VFD-fed motors are subscriber
          features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="HVAC Electrical Sizing Calculator" standardsLine="NEC Article 440, IEC 60364-5-52" />
          <FeedbackButton calculatorName="HVAC Electrical Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes the branch-circuit conductors, overcurrent protection and disconnect for HVAC motor-compressor equipment \u2014 the NEC Article 440 hermetic-compressor-specific method (which differs from a standard motor's NEC Article 430 sizing) or the IEC general method \u2014 with subscriber-tier support for multi-motor combination equipment and VFD-fed motors."
          standards={["NEC Article 440 (air-conditioning and refrigerating equipment)", "IEC 60364-5-52 / IEC 60947-4-1 general method"]}
          capabilities={["Single motor-compressor Minimum Circuit Ampacity (MCA), Maximum Overcurrent Protection (MOCP) and disconnect sizing from RLA (and optional LRA).", "IEC general-method design current from a configurable margin factor.", "Subscriber: multi-motor combination-load equipment sizing (largest-motor-at-125% + sum-of-others method).", "Subscriber: VFD-fed motor input-side and output-side minimum circuit ampacity, sized separately."]}
          example={{ problem: "A hermetic compressor has a nameplate RLA of 18A (no LRA given). Size its NEC Article 440 branch circuit.", steps: ["Minimum Circuit Ampacity (MCA) = 125% \u00d7 RLA = 1.25 \u00d7 18 = 22.5A.", "Maximum Overcurrent Protection (MOCP), per NEC 440.22, rounds 175% \u00d7 RLA = 31.5A up to the next standard size.", "Disconnect minimum ampacity = 115% \u00d7 RLA = 20.7A."], result: "MCA 22.5A, MOCP 35A (next standard size above 31.5A), disconnect 20.7A minimum \u2014 matches the calculator's default scenario exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Standard basis">
              <SelectField<HvacStandard> label="Standard Basis" tip={"NEC Article 440 uses RLA/LRA-based percentage rules specific to hermetic refrigerant motor-compressors; the IEC general method instead applies a configurable design margin to the summed FLC, matching the Cable Sizing calculator's own approach."} value={input.standard} onChange={(v) => update({ standard: v })} options={[
                { value: "nec", label: "NEC Article 440 (US)" },
                { value: "iec", label: "IEC 60364-5-52 / 60947-4-1 general method" },
              ]} />
            </Section>

            <Section title="Single motor-compressor">
              <NumberField label="Rated-Load Current, RLA" unit="A" tip={"The nameplate current a hermetic refrigerant motor-compressor draws under normal loaded operating conditions (NEC 440.6). Hermetic compressors have no external shaft or horsepower rating \u2014 RLA (not horsepower) is the basis for all NEC Article 440 circuit sizing. On IEC-labelled equipment the equivalent value is usually called Full-Load Current (FLC)."} value={input.rlaA} onChange={(v) => update({ rlaA: v })} min={0} />
              {nec ? (
                <NumberField label="Locked-Rotor Current, LRA (optional)" unit="A" tip={"The current the motor-compressor draws at the instant of starting, before it comes up to speed \u2014 always far higher than RLA. Used to size the starting/inrush withstand of the branch-circuit protective device (NEC 440.22 permits sizing the OCPD well above 100% of RLA) and, with RLA, the equivalent horsepower rating for the disconnecting means (NEC 440.12)."} value={input.lraA} onChange={(v) => update({ lraA: v })} min={0} />
              ) : (
                <NumberField label="Design Margin Factor" tip={"IEC doesn't mandate a fixed 125%-style multiplier for HVAC/motor combination loads the way NEC 440 does. Enter your own project design margin (1.0 = no margin, size exactly to summed FLC; 1.1-1.25 builds in headroom for diversity/starting/future load) \u2014 then use the resulting design current in the Cable Sizing calculator to select the actual conductor size."} value={input.iecMargin} onChange={(v) => update({ iecMargin: v })} min={1} step="any" />
              )}
            </Section>

            <PremiumSection title="Multi-motor combination-load equipment" description="Sizes MCA/MOCP for combination equipment nameplates (largest motor at 125%/branch OCPD + sum of others)." unlocked={FREE_LAUNCH}>
              <div className="col-span-2 space-y-2">
                {input.comboRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1.4fr_1fr_auto] items-end gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted">{i === 0 ? "Description" : ""}</label>
                      <input value={row.desc} onChange={(e) => updateRow(i, { desc: e.target.value })} className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground" />
                    </div>
                    <NumberField label={i === 0 ? "RLA/FLA (A)" : ""} tip={i === 0 ? "RLA (for a hermetic motor-compressor) or FLA/FLC (for a standard motor like a fan) in amps, from the equipment nameplate. Combination-load sizing uses the largest-motor-at-125%-plus-sum-of-others method." : undefined} value={row.rla} onChange={(v) => updateRow(i, { rla: v })} min={0} />
                    <button type="button" onClick={() => removeRow(i)} className="mb-0.5 rounded-md border border-border px-2 py-2 text-xs text-muted hover:border-fail/40 hover:text-fail">✕</button>
                  </div>
                ))}
                <button type="button" onClick={addRow} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60">+ Add Row</button>
              </div>
            </PremiumSection>

            <PremiumSection title="VFD-fed motor" description="Sizes input-side (supply→VFD) and output-side (VFD→motor) minimum circuit ampacity separately." unlocked={FREE_LAUNCH}>
              <NumberField label="VFD Rated Input Current" unit="A" tip={"The VFD's own rated input current (from its nameplate) \u2014 used to size the supply-to-VFD conductors, independently of the motor's own current on the output side."} value={input.vfdInputA} onChange={(v) => update({ vfdInputA: v })} min={0} />
              <NumberField label="Motor Rated-Load Current, RLA/FLA" unit="A" tip={"The driven motor's own nameplate RLA/FLA \u2014 used to size the output (VFD-to-motor) conductors, independently of the VFD input current above."} value={input.vfdMotorRlaA} onChange={(v) => update({ vfdMotorRlaA: v })} min={0} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {input.rlaA == null || input.rlaA <= 0 ? (
                <EmptyResult message="Enter the rated-load current (RLA) to see results." />
              ) : (
                <ResultCard title="Single motor-compressor result">
                  <ResultRow label="Minimum Circuit Ampacity (MCA)" value={result.single.mcaA !== null ? `${result.single.mcaA.toFixed(1)} A` : "—"} />
                  <ResultRow label="Max Overcurrent Protection (MOCP)" value={result.single.mocpA !== null ? `${result.single.mocpA} A (standard size)` : "—"} />
                  <ResultRow label="Disconnect Min. Ampacity" value={result.single.discA !== null ? `${result.single.discA.toFixed(1)} A minimum` : "—"} />
                  <ResultRow label="IEC Design Current" value={result.single.iecDesignA !== null ? `${result.single.iecDesignA.toFixed(1)} A` : "—"} />
                </ResultCard>
              )}
              <ResultCard title="Combination-load result">
                {!result.combo ? (
                  <ResultRow label="Combination result" value="Add at least one row with an RLA/FLA value." />
                ) : (
                  <>
                    <ResultRow label="Largest Motor" value={`${result.combo.largestDesc} (${result.combo.largestRla} A)`} />
                    <ResultRow label="Combination MCA" value={result.combo.mcaA != null ? `${result.combo.mcaA.toFixed(1)} A` : "—"} />
                    <ResultRow label="Combination MOCP" value={result.combo.mocpA != null ? `${result.combo.mocpA} A` : result.combo.iecDesignA != null ? `${result.combo.iecDesignA.toFixed(1)} A (IEC design)` : "—"} />
                  </>
                )}
              </ResultCard>
              <ResultCard title="VFD-fed motor result">
                {!result.vfd ? (
                  <ResultRow label="VFD result" value="Enter VFD input current and/or motor RLA/FLA." />
                ) : (
                  <>
                    <ResultRow label="Input-Side MCA" value={result.vfd.inMcaA != null ? `${result.vfd.inMcaA.toFixed(1)} A` : result.vfd.inIecA != null ? `${result.vfd.inIecA.toFixed(1)} A (IEC design)` : "—"} />
                    <ResultRow label="Output-Side MCA" value={result.vfd.outMcaA != null ? `${result.vfd.outMcaA.toFixed(1)} A` : result.vfd.outIecA != null ? `${result.vfd.outIecA.toFixed(1)} A (IEC design)` : "—"} />
                  </>
                )}
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
