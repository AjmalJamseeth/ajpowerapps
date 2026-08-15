"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import { ConductorMaterial, InstallMethod, INSTALL_METHODS } from "@/lib/cable";
import { BessChemistry, BessInput, BessPhase, CHEM_DEFAULTS, DEFAULT_BESS_INPUT, calcBess } from "@/lib/storage";

export default function EnergyStoragePage() {
  const [input, setInput] = useState<BessInput>(DEFAULT_BESS_INPUT);
  const update = (patch: Partial<BessInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Multi-bank site aggregation & cycle-life estimate are subscriber
  // features — gated by FREE_LAUNCH (unlocked during the launch promo).
  const result = useMemo(() => calcBess(input, FREE_LAUNCH), [input]);

  const onChemistryChange = (chem: BessChemistry) => {
    const d = CHEM_DEFAULTS[chem];
    update({ chemistry: chem, dodPct: d.dod, rtePct: d.rte });
  };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Energy Storage (BESS) Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEEE 1547 / IEC 62933 / IEC 61427-2 aligned usable-energy, nameplate
          capacity and C-rate sizing, PCS voltage-window &amp; power checks,
          and AC cable sizing. Multi-bank site aggregation and cycle-life
          estimate are subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Energy Storage (BESS) Sizing Calculator" standardsLine="IEEE 1547, IEC 62933, IEC 61427-2" />
          <FeedbackButton calculatorName="Energy Storage (BESS) Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a battery energy storage system (BESS) from a backup power/duration requirement: usable energy, nameplate capacity (after DoD and round-trip-efficiency derating), maximum continuous power at the chosen C-rate, PCS DC voltage-window and AC power checks, and the AC interconnection cable."
          standards={["IEEE 1547 (interconnection)", "IEC 62933 (electrical energy storage systems)", "IEC 61427-2 (RTE measurement/reporting)", "IEC 60364-5-52 (AC cable sizing, reused)"]}
          capabilities={["Converts a power+duration backup requirement into usable and nameplate battery energy, accounting for DoD and round-trip efficiency.", "Checks the bank's C-rate can actually deliver the required power.", "Checks the battery's voltage window against the PCS's DC input range.", "Sizes the PCS-to-load/grid AC cable using the same ampacity/voltage-drop engine as the Cable Sizing calculator.", "Subscriber: multi-bank site aggregation and an approximate DoD-vs-cycle-life estimate."]}
          example={{ problem: "Size a Li-ion BESS for a 100kW critical load with 2 hours of required backup, at 90% DoD and 92% round-trip efficiency, discharging at 0.5C.", steps: ["Usable energy = Load \u00d7 Duration = 100kW \u00d7 2h = 200 kWh.", "Nameplate capacity = Usable Energy / (DoD \u00d7 RTE) = 200 / (0.9 \u00d7 0.92) \u2248 241.546 kWh.", "Max power at 0.5C = 0.5 \u00d7 241.546 \u2248 120.773 kW, which exceeds the 100kW requirement \u2014 C-rate check passes.", "AC cable sized to the PCS's rated output \u2014 the default scenario resolves to 70mm\u00b2 at 0.984% voltage drop."], result: "241.546 kWh nameplate capacity, 120.773 kW max power, 70mm\u00b2 AC cable \u2014 matches the calculator's default scenario exactly. With 2 identical banks, site energy aggregates to 483.092 kWh and the DoD-vs-cycle-life curve estimates \u22483750 cycles at 90% DoD (both subscriber features)." }}
          notes="Multi-bank site aggregation and the cycle-life estimate are subscriber features \u2014 inputs remain editable but results show as locked on the free tier."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Load & duty">
              <SelectField<BessChemistry>
                label="Chemistry"
                value={input.chemistry}
                onChange={onChemistryChange}
                options={[
                  { value: "liion", label: "Li-ion" },
                  { value: "leadacid", label: "Lead-Acid" },
                  { value: "flow", label: "Flow Battery" },
                ]}
              />
              <NumberField label="Load Power" unit="kW" tip={"The AC power (kW) the storage system must supply continuously during a discharge event \u2014 either the critical load to be backed up, or the peak-shaving/export target."} value={input.loadPowerKw} onChange={(v) => update({ loadPowerKw: v })} min={0} />
              <NumberField label="Backup Duration" unit="h" tip={"How long (hours) the load must be sustained on battery power alone \u2014 converts the power requirement into an energy (kWh) requirement."} value={input.backupDurationH} onChange={(v) => update({ backupDurationH: v })} min={0} />
              <NumberField label="Depth of Discharge (DoD)" unit="%" tip={"The fraction of the battery's nameplate (rated) capacity actually used each cycle. The nameplate capacity you need to buy is always larger than the usable energy you require, by a factor of 1/DoD."} value={input.dodPct} onChange={(v) => update({ dodPct: v })} min={1} max={100} />
              <NumberField label="Round-Trip Efficiency (RTE)" unit="%" tip={"Ratio of energy delivered on discharge to energy consumed on charge over one full cycle \u2014 captures cell, BMS and PCS/inverter conversion losses. Typical modern Li-ion runs 90-95% RTE (IEC 61427-2 defines how RTE is measured/reported)."} value={input.rtePct} onChange={(v) => update({ rtePct: v })} min={1} max={100} />
              <NumberField label="C-Rate" tip={"Discharge rate relative to the battery's energy capacity \u2014 a 0.5C rate fully discharges in 2 hours. Sets the maximum continuous power the bank can deliver: Max Power = C-rate \u00d7 Nameplate Energy."} value={input.cRate} onChange={(v) => update({ cRate: v })} min={0.01} step="any" />
            </Section>

            <Section title="PCS & voltage window">
              <NumberField label="Nominal DC Voltage" unit="V" tip={"Nominal DC bus voltage of the battery rack/bank \u2014 must sit within the PCS's DC input voltage window. Battery voltage varies with state of charge, so check against the PCS's full operating range."} value={input.nominalVoltage} onChange={(v) => update({ nominalVoltage: v })} min={0} />
              <div />
              <NumberField label="PCS Min DC Voltage" unit="V" tip={"Lowest DC voltage the Power Conversion System (PCS/inverter) can accept \u2014 the battery's voltage at low state of charge must not fall below this."} value={input.pcsMinDcVoltage} onChange={(v) => update({ pcsMinDcVoltage: v })} min={0} />
              <NumberField label="PCS Max DC Voltage" unit="V" tip={"Highest DC voltage the PCS can accept \u2014 the battery's voltage at full charge must not exceed this."} value={input.pcsMaxDcVoltage} onChange={(v) => update({ pcsMaxDcVoltage: v })} min={0} />
              <NumberField label="PCS Rated AC Power" unit="kW" tip={"Continuous AC power rating of the PCS \u2014 the actual power ceiling delivered to the load/grid, must be at least equal to the Load/Backup Power Requirement even if the battery's C-rate could theoretically supply more."} value={input.pcsRatedAcPowerKw} onChange={(v) => update({ pcsRatedAcPowerKw: v })} min={0} />
              <SelectField<BessPhase>
                label="AC Phase"
                tip={"Single-phase or three-phase AC output from the PCS \u2014 determines which voltage-drop formula and cable-ampacity table apply on the AC side."} value={input.pcsPhase}
                onChange={(v) => update({ pcsPhase: v })}
                options={[
                  { value: "1ph", label: "Single-phase" },
                  { value: "3ph", label: "Three-phase" },
                ]}
              />
              <NumberField label="AC Voltage" unit="V" tip={"Nominal AC voltage the PCS feeds into (e.g. 230V single-phase or 400V three-phase) \u2014 used for the AC cable's voltage-drop calculation."} value={input.pcsAcVoltage} onChange={(v) => update({ pcsAcVoltage: v })} min={0} />
            </Section>

            <Section title="AC cable">
              <SelectField<ConductorMaterial>
                label="Conductor material"
                tip={"Copper or aluminium for the PCS-to-load/grid AC cable \u2014 same convention as the Cable Sizing calculator."} value={input.acCableMaterial}
                onChange={(v) => update({ acCableMaterial: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
              />
              <SelectField<InstallMethod>
                label="Installation method"
                tip={"The IEC 60364-5-52 reference installation method for the AC cable run \u2014 sets which ampacity table column applies."} value={input.acMethod}
                onChange={(v) => update({ acMethod: v })}
                options={INSTALL_METHODS}
              />
              <NumberField label="Route length" unit="m" tip={"One-way length of the AC cable from the PCS to its connection point, used for ampacity and voltage-drop calculations."} value={input.acCableLengthM} onChange={(v) => update({ acCableLengthM: v })} min={0} />
              <NumberField label="Ambient temperature" unit="°C" tip={"Ambient temperature for the AC cable run \u2014 derates the cable's current-carrying capacity."} value={input.acAmbientC} onChange={(v) => update({ acAmbientC: v })} min={-10} max={90} />
              <div className="col-span-2">
                <NumberField label="Grouping" hint="circuits run together" tip={"Number of AC circuits run together along the same route \u2014 reduces each cable's effective current-carrying capacity via the grouping derating factor."} value={input.acGrouping} onChange={(v) => update({ acGrouping: v })} min={1} max={20} step={1} />
              </div>
            </Section>

            <PremiumSection
              title="Multi-bank site aggregation"
              description="Aggregates nameplate energy/power across multiple identical banks and estimates cycle life from the DoD-vs-cycle-life curve."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Number of Banks" tip={"Total number of identical battery banks operating in parallel at the site \u2014 aggregates total site energy and power and estimates site-level cycle life."} value={input.numBanks} onChange={(v) => update({ numBanks: v })} min={1} step={1} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result ? (
                <EmptyResult message="Enter load power, backup duration, DoD, RTE and C-rate to see results." />
              ) : (
                <>
                  <ResultCard title="Energy & power sizing">
                    <ResultRow label="Usable Energy" value={`${result.usableEnergyKwh.toFixed(2)} kWh`} />
                    <ResultRow label="Nameplate Capacity" value={`${result.nameplateKwh.toFixed(2)} kWh`} />
                    <ResultRow label="Max Power (at C-rate)" value={`${result.maxPowerKw.toFixed(2)} kW`} />
                    <CheckRow label="C-Rate Check" value={`≥ ${input.loadPowerKw} kW required`} pass={result.cRateOk} />
                  </ResultCard>
                  <ResultCard title="PCS checks">
                    <CheckRow label="Voltage Window" value={`${input.pcsMinDcVoltage}–${input.pcsMaxDcVoltage} V`} pass={result.voltageOk} />
                    <CheckRow label="PCS Power vs Load" value={`${input.pcsRatedAcPowerKw} kW vs ${input.loadPowerKw} kW`} pass={result.pcsPowerOk} />
                  </ResultCard>
                  <ResultCard title="AC cable">
                    <ResultRow label="Cable size" value={result.ac.size ? `${result.ac.size} mm²` : "No standard size satisfies ampacity & 3% VD"} />
                    <ResultRow label="Voltage drop" value={result.ac.vd !== null ? `${result.ac.vd.toFixed(2)}%` : "—"} />
                  </ResultCard>
                  <ResultCard title="Multi-bank site aggregation">
                    <ResultRow label="Site Energy" value={result.site ? `${result.site.siteEnergyKwh.toFixed(2)} kWh` : "—"} />
                    <ResultRow label="Site Power" value={result.site ? `${result.site.sitePowerKw.toFixed(2)} kW` : "—"} />
                    <ResultRow label="Estimated Cycle Life" value={result.site?.cycleLife != null ? `≈${result.site.cycleLife} cycles` : "—"} />
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
