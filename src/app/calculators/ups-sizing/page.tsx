"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_UPSSIZING_INPUT, LoadMethod, UpsSizingInput, calcUpsSizing } from "@/lib/upssizing";

export default function UpsSizingPage() {
  const [input, setInput] = useState<UpsSizingInput>(DEFAULT_UPSSIZING_INPUT);
  const update = (patch: Partial<UpsSizingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcUpsSizing(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">UPS Sizing Calculator</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Required UPS kVA rating from critical load, margin, and
          redundancy configuration, plus an approximate battery energy/Ah
          figure for the stated backup time. For a full IEEE 485
          duty-cycle battery design, see the Battery &amp; DC System
          Sizing calculator. Fully free — no subscriber gate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="UPS Sizing Calculator" standardsLine="IEEE 485-referenced, N-unit redundancy" />
          <FeedbackButton calculatorName="UPS Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes the required UPS kVA rating (and an approximate battery requirement) from a critical load, design margin, and redundancy configuration. Shares its N-unit redundancy model with the Transformer Sizer; for detailed battery design, see the dedicated Battery & DC System Sizing calculator's full IEEE 485 method."
          standards={["IEEE 485 (referenced battery methodology)", "General N-unit redundancy convention (\"N+1\")"]}
          capabilities={["Sizes from kW+PF or direct kVA, with a design margin.", "N-1/\"N+1\" redundant frame sizing \u2014 any (N\u22121) of N identical UPS frames carries the full load.", "Reports real-power (kW) capability at the UPS's rated output power factor.", "Approximate battery energy and Ah estimate for the stated backup time, DoD and bus voltage."]}
          example={{ problem: "Size an N=2 redundant UPS system for a 200kW, 0.9 PF critical load with 20% margin, 15-minute backup at 0.8 DoD, 92% inverter efficiency and a 480V DC bus.", steps: ["Design load = 200 / 0.9 = 222.2 kVA.", "Margined load = 222.2 \u00d7 1.20 = 266.7 kVA.", "With N=2, any 1 of 2 frames must carry the full load alone \u2192 per-frame requirement = 266.7 kVA.", "Round up to the nearest standard UPS size \u2192 300 kVA per frame (270kW capability at 0.9 rated PF).", "Usable battery energy = 200kW \u00d7 0.25h = 50 kWh.", "Nameplate battery energy = 50 / (0.8 \u00d7 0.92) \u2248 67.935 kWh.", "Approximate capacity at 480V DC \u2248 67,935Wh / 480V \u2248 141.5 Ah."], result: "300 kVA UPS, \u224868 kWh nameplate battery, \u2248141.5 Ah \u2014 matches the calculator's default scenario exactly." }}
          notes="This battery figure is a quick sizing estimate only \u2014 for a full IEEE 485 duty-cycle section-by-section battery design, use the dedicated Battery & DC System Sizing calculator."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Critical load">
              <SelectField<LoadMethod> label="Load Basis" tip={"Whether you're entering the critical load as kW + power factor, or directly as kVA."} value={input.loadMethod} onChange={(v) => update({ loadMethod: v })} options={[
                { value: "kw", label: "kW + Power Factor" },
                { value: "kva", label: "kVA (direct)" },
              ]} />
              <div />
              {input.loadMethod === "kw" ? (
                <>
                  <NumberField label="Critical Load" unit="kW" tip={"The IT/critical load's real power demand, before margin \u2014 the load the UPS must ride through on battery."} value={input.criticalLoadKw} onChange={(v) => update({ criticalLoadKw: v })} min={0} />
                  <NumberField label="Power Factor" tip={"Critical load's power factor, used to convert kW to kVA."} value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0.1} max={1} step="any" />
                </>
              ) : (
                <NumberField label="Critical Load" unit="kVA" tip={"The critical load's apparent power, if already known directly in kVA."} value={input.criticalLoadKva} onChange={(v) => update({ criticalLoadKva: v })} min={0} />
              )}
              <NumberField label="Growth/Design Margin" unit="%" tip={"Growth/design allowance added on top of the critical load before sizing the UPS frame."} value={input.marginPct} onChange={(v) => update({ marginPct: v })} min={0} step="any" />
              <NumberField label="UPS Rated Output PF" tip={"The UPS's own rated output power factor (from its datasheet) \u2014 sets its real-power (kW) capability at its rated kVA; a 0.9-rated UPS delivers less kW than a unity-rated UPS of the same kVA."} value={input.upsOutputPf} onChange={(v) => update({ upsOutputPf: v })} min={0.1} max={1} step="any" />
              <NumberField label="Total Units Installed (N)" tip={"Total number of identical UPS frames installed. With N frames, any (N\u22121) must carry the full critical load alone \u2014 the same convention as the Transformer Sizer, commonly called \"N+1\" in UPS terminology."} value={input.totalUnits} onChange={(v) => update({ totalUnits: v })} min={1} step={1} />
            </Section>
            <p className="text-xs text-muted">
              With N total UPS frames installed, any (N−1) must be able to
              carry the full critical load alone (the same convention as
              the Transformer Sizer, commonly called &ldquo;N+1&rdquo; in
              UPS terminology) — N=2 sizes each frame for 100% of the load.
            </p>

            <Section title="Battery / backup time">
              <NumberField label="Required Backup (Ride-Through) Time" unit="min" tip={"Required ride-through (autonomy) time on battery before a generator or utility restores power \u2014 sets how much battery energy is needed."} value={input.backupTimeMin} onChange={(v) => update({ backupTimeMin: v })} min={0} step="any" />
              <NumberField label="Battery Depth of Discharge" tip={"Maximum fraction of the battery's nameplate capacity allowed to be discharged. A shallower DoD extends cycle life but needs a larger nameplate battery for the same usable energy."} value={input.dodFraction} onChange={(v) => update({ dodFraction: v })} min={0.1} max={1} step="any" />
              <NumberField label="Inverter Efficiency" tip={"The UPS inverter/converter's round-trip efficiency converting DC battery energy to AC output \u2014 nameplate battery energy must exceed usable energy by this loss."} value={input.inverterEfficiency} onChange={(v) => update({ inverterEfficiency: v })} min={0.5} max={1} step="any" />
              <NumberField label="DC Bus Voltage" unit="V" tip={"The UPS's internal DC battery bus voltage (from its datasheet) \u2014 used to convert the required battery energy into an approximate Ah capacity figure."} value={input.dcBusVoltage} onChange={(v) => update({ dcBusVoltage: v })} min={12} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result ? (
                <EmptyResult message="Enter the critical load to see results." />
              ) : (
                <>
                  <ResultCard title="UPS sizing result">
                    <ResultRow label="Design Load" value={`${result.designLoadKva.toFixed(1)} kVA`} />
                    <ResultRow label="Margined Load" value={`${result.marginedLoadKva.toFixed(1)} kVA`} />
                    <ResultRow label={`Per-Unit Required (÷${result.redundantUnitsRequired})`} value={`${result.perUnitRequiredKva.toFixed(1)} kVA`} />
                    <ResultRow label="Recommended Standard Size" value={`${result.recommendedKva} kVA per unit`} />
                    <ResultRow label="Capability at Rated PF" value={`${result.recommendedKw.toFixed(1)} kW`} />
                  </ResultCard>
                  <ResultCard title="Approximate battery requirement">
                    {!result.battery ? (
                      <ResultRow label="Battery" value="— enter backup time, DoD, efficiency and DC bus voltage" />
                    ) : (
                      <>
                        <ResultRow label="Usable Energy" value={`${result.battery.usableEnergyKwh.toFixed(2)} kWh`} />
                        <ResultRow label="Nameplate Battery Energy" value={`${result.battery.nameplateEnergyKwh.toFixed(2)} kWh`} />
                        <ResultRow label="Approx. Capacity at DC Bus Voltage" value={`${result.battery.approxAh.toFixed(1)} Ah`} />
                      </>
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
