"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import PfcResults from "@/components/pfc/PfcResults";
import { DEFAULT_PFC_INPUT, PfcInput, SystemType, BankConnection, calcPfc } from "@/lib/pfc";

export default function PfcPage() {
  const [input, setInput] = useState<PfcInput>(DEFAULT_PFC_INPUT);
  const update = (patch: Partial<PfcInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Harmonic resonance, detuning reactor and energy-savings sections are
  // subscriber features — never enabled on the free site.
  const result = useMemo(() => calcPfc({ ...input, premiumEnabled: FREE_LAUNCH }), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Power Factor Correction Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 60831 capacitor bank sizing — reactive compensation, capacitance
          and the resulting current/kVA reduction. Harmonic resonance,
          detuning reactor sizing and energy-savings analysis are subscriber
          features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Power Factor Correction Calculator" standardsLine="IEC 60831, IEC 61000-4-7" />
          <FeedbackButton calculatorName="Power Factor Correction Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a power-factor-correction capacitor bank from a load's real power and existing/target power factor, and (on the subscriber tier) checks for harmonic resonance risk, sizes a detuning reactor, and estimates the resulting energy/demand-charge savings."
          standards={["IEC 60831 (shunt power capacitors)", "IEC 61000-4-7 (harmonic resonance guidance, referenced by the resonance check)"]}
          capabilities={["Required reactive compensation Qc and capacitor bank capacitance from existing and target power factor.", "Before/after comparison table of kVA, current, and kVAr.", "Subscriber: harmonic resonance check against system short-circuit level, detuning reactor sizing, and annual energy/cost savings."]}
          example={{ problem: "A 500kW load at 0.75 power factor needs correcting to 0.95.", steps: ["Reactive power before: Q1 = P \u00d7 tan(acos(PF1)) = 500 \u00d7 tan(acos(0.75)).", "Reactive power after: Q2 = P \u00d7 tan(acos(PF2)) = 500 \u00d7 tan(acos(0.95)).", "Required compensation: Qc = Q1 \u2212 Q2."], result: "Qc = 276.6 kVAr \u2014 hand-checked and matched the live code exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="System & load">
              <SelectField<SystemType>
                label="System"
                tip={"Whether the load and capacitor bank are 3-phase or single-phase \u2014 sets which formulas convert kVAr to capacitance and current."} value={input.system}
                onChange={(v) => update({ system: v })}
                options={[
                  { value: "3ph", label: "3-Phase" },
                  { value: "1ph", label: "1-Phase" },
                ]}
              />
              <SelectField<50 | 60>
                label="Frequency"
                tip={"System frequency \u2014 affects capacitor reactance and is essential for the harmonic resonance check, since both resonance frequency and harmonic order are frequency-dependent."} value={input.frequency}
                onChange={(v) => update({ frequency: v })}
                options={[
                  { value: 50, label: "50 Hz" },
                  { value: 60, label: "60 Hz" },
                ]}
              />
              <NumberField label="Supply voltage" hint="V L-L for 3ph" unit="V" tip={"The system voltage at the point the capacitor bank connects \u2014 enter line-to-line voltage for 3-phase."} value={input.voltage} onChange={(v) => update({ voltage: v })} min={1} />
              <NumberField label="Active load P" unit="kW" tip={"The real (working) power the load draws \u2014 correction doesn't change this, only the reactive power drawn alongside it. Use actual metered or demand kW, not connected/installed capacity."} value={input.activeLoadKw} onChange={(v) => update({ activeLoadKw: v })} min={0.1} />
              <NumberField label="Existing power factor PF₁" tip={"The load's current (uncorrected) power factor \u2014 cos \u03c6 before any capacitors are added. A lower value means more reactive current for the same real power, and more correction (Qc) needed."} value={input.pf1} onChange={(v) => update({ pf1: v })} min={0.1} max={0.999} step={0.01} />
              <NumberField label="Target power factor PF₂" tip={"The power factor you want to correct up to. Often set by the utility's power-factor-penalty threshold (commonly 0.90-0.95) rather than pushing all the way to unity."} value={input.pf2} onChange={(v) => update({ pf2: v })} min={0.1} max={1.0} step={0.01} />
            </Section>

            <Section title="Capacitor bank">
              <SelectField<BankConnection>
                label="Bank connection"
                tip={"How the capacitor bank's three phases are wired \u2014 delta means each capacitor sees the full line-to-line voltage (less capacitance needed); star means each sees only the phase voltage (roughly 3\u00d7 the capacitance per phase for the same total kVAr)."} value={input.connection}
                onChange={(v) => update({ connection: v })}
                options={[
                  { value: "delta", label: "Delta (line voltage)" },
                  { value: "star", label: "Star (phase voltage)" },
                ]}
              />
              <NumberField label="Capacitor voltage rating" unit="V" tip={"The capacitor's own nameplate voltage rating \u2014 choose with headroom above the actual system voltage it will see, since capacitor heating and life are roughly proportional to voltage squared or worse."} value={input.capVoltage} onChange={(v) => update({ capVoltage: v })} min={1} />
            </Section>

            <PremiumSection
              title="Harmonic resonance"
              description="Checks the LC resonance point formed by the capacitor bank against the system short-circuit level, per IEC 61000-4-7 guidance."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2">
                <NumberField label="Short-circuit level Ssc" unit="MVA" tip={"The three-phase fault level at the point the bank connects \u2014 sets the system's source reactance, which together with the bank's reactive rating determines the parallel resonance frequency."} value={input.shortCircuitMva} onChange={(v) => update({ shortCircuitMva: v })} />
              </div>
            </PremiumSection>

            <PremiumSection
              title="Detuning reactor"
              description="Sizes a series reactor to shift the bank's resonance below the lowest significant harmonic, avoiding amplification."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2">
                <SelectField<5.67 | 7 | 14>
                  label="Detuning factor p"
                  tip={"Sets the reactor's size relative to the capacitor bank, and therefore the tuned frequency \u2014 a higher percentage tunes to a lower frequency (more series reactance)."} value={input.detuningPct}
                  onChange={(v) => update({ detuningPct: v })}
                  options={[
                    { value: 5.67, label: "5.67% — tuned to 210 Hz (3rd harmonic barrier)" },
                    { value: 7, label: "7% — tuned to 189 Hz" },
                    { value: 14, label: "14% — tuned to 134 Hz" },
                  ]}
                 
                />
              </div>
            </PremiumSection>

            <PremiumSection
              title="Energy savings"
              description="Converts the reduced I²R losses and kVA demand into annual energy and cost savings against your tariff."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Energy tariff" hint="per kWh" tip={"Your electricity cost per kWh, used to value the energy saved from reduced cable I\u00b2R losses once power factor is corrected."} value={input.tariffEnergy} onChange={(v) => update({ tariffEnergy: v })} />
              <NumberField label="Max demand tariff" hint="per kVA/month" tip={"Your utility's demand-charge rate, if billed per kVA of maximum demand \u2014 correcting power factor directly reduces this charge by shrinking billed kVA for the same kW."} value={input.tariffDemand} onChange={(v) => update({ tariffDemand: v })} />
              <NumberField label="Operating hours per year" unit="h/yr" tip={"How many hours per year the load \u2014 and therefore the loss reduction \u2014 is actually active, used to annualise the kW loss-reduction into a yearly kWh saving."} value={input.opHoursPerYear} onChange={(v) => update({ opHoursPerYear: v })} />
              <NumberField label="Cable resistance from supply" unit="mΩ" tip={"Resistance of the cable/feeder between the utility supply point and the capacitor bank location \u2014 sets how much the reduced current from improved PF actually reduces I\u00b2R heating losses."} value={input.lineResistanceMOhm} onChange={(v) => update({ lineResistanceMOhm: v })} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <PfcResults input={input} result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
