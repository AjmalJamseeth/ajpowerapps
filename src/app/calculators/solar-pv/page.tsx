"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import PvResults from "@/components/pv/PvResults";
import { DEFAULT_PV_INPUT, PvInput, PvPhase, calcPv } from "@/lib/pv";
import { ConductorMaterial, InstallMethod, INSTALL_METHODS } from "@/lib/cable";

export default function SolarPvPage() {
  const [input, setInput] = useState<PvInput>(DEFAULT_PV_INPUT);
  const update = (patch: Partial<PvInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Multi-string array design (combined MPPT current, OCPD, fuse rating) is
  // a subscriber feature — never computed on the free site.
  const result = useMemo(() => calcPv(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Solar PV Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 62548 &amp; IEC 60364-7-712 — string voltage window, inverter
          matching, and DC/AC cable sizing for a single string and inverter.
          Multi-string parallel arrays with combiner/feeder sizing are a
          subscriber feature.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Solar PV Sizing Calculator" standardsLine="IEC 62548, IEC 60364-7-712" />
          <FeedbackButton calculatorName="Solar PV Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a single-string PV array against its inverter: checks the string voltage window against the inverter's MPPT range and absolute maximum DC voltage across the site's full temperature range, checks array current against the inverter's MPPT current limit, and sizes both the DC array cable and AC grid-connection cable."
          standards={["IEC 62548 (photovoltaic array design requirements)", "IEC 60364-7-712 (electrical installations \u2014 solar photovoltaic power supply systems)"]}
          capabilities={["Temperature-corrected string voltage window (cold-weather maximum Voc, hot-weather minimum Vmpp) checked against the inverter's MPPT range and absolute maximum DC voltage.", "String design current (Isc \u00d7 1.25 margin, per IEC 62548 \u00a77) checked against the inverter's maximum DC input current.", "DC and AC cable sizing, reusing the same ampacity/derating/voltage-drop engine as the Cable Sizing calculator.", "DC:AC oversizing ratio with an over/undersizing note against the typical 1.0-1.3 accepted range.", "Subscriber: multi-string array design \u2014 combined MPPT current across parallel strings and string-level overcurrent protection sizing."]}
          example={{ problem: "A 20-module string with 49.5V Voc, \u22120.29%/\u00b0C temperature coefficient, at a site ranging from 5\u00b0C to 65\u00b0C.", steps: ["Cold factor at 5\u00b0C (20\u00b0C below the 25\u00b0C STC reference) = 1 + 0.0029\u00d720 \u2248 1.058.", "Maximum string voltage = 20 \u00d7 49.5 \u00d7 1.058 \u2248 1047.42V \u2014 checked against the inverter's max DC voltage.", "Hot factor at 65\u00b0C (40\u00b0C above reference) = 1 \u2212 0.0029\u00d740 \u2248 0.884.", "Minimum string Vmpp range = 20 \u00d7 Vmpp \u00d7 0.884, checked against the inverter's MPPT minimum voltage.", "DC cable sizing iterates through standard sizes until both ampacity and the ~2% voltage-drop guideline are satisfied."], result: "Cold factor 1.058 \u2192 Vmax 1047.42V, hot factor 0.884 \u2192 Vmpp range 733.72-878.14V, DC cable sizing correctly iterates past two undersized options to 4mm\u00b2 at 1.382% VD \u2014 every intermediate value hand-checked and matched the live code exactly (this particular default scenario intentionally fails the Vmax and MPPT window checks, since the module/inverter placeholder values weren't chosen as a mutually-consistent example)." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="PV module">
              <NumberField label="Voc STC" unit="V" tip={"The module's open-circuit voltage at Standard Test Conditions (1000W/m\u00b2, 25\u00b0C), from the datasheet. This is the voltage the string rises to at low temperature with no load \u2014 the basis of the maximum string voltage check."} value={input.voc} onChange={(v) => update({ voc: v })} min={1} />
              <NumberField label="Vmpp STC" unit="V" tip={"The module's voltage at its maximum-power point under STC. Used (with the same temperature correction as Voc) to check the string's operating voltage stays inside the inverter's MPPT window at the hottest expected condition."} value={input.vmpp} onChange={(v) => update({ vmpp: v })} min={1} />
              <NumberField label="Isc STC" unit="A" tip={"The module's short-circuit current at STC. Cable ampacity and overcurrent protection are sized off this value with a 1.25\u00d7 safety margin (IEC 62548 \u00a77), since irradiance can briefly exceed the 1000W/m\u00b2 reference."} value={input.isc} onChange={(v) => update({ isc: v })} min={0.1} />
              <NumberField label="Impp STC" unit="A" tip={"The module's operating current at its maximum-power point under STC \u2014 shown for reference against the inverter's per-MPPT current rating; cable/protection sizing uses Isc (with margin), not Impp."} value={input.impp} onChange={(v) => update({ impp: v })} min={0.1} />
              <NumberField label="Pmax STC" unit="Wp" tip={"The module's nameplate power rating at STC \u2014 multiplied by the number of modules to get total array kWp, compared against the inverter's rated AC power for the DC:AC oversizing ratio check."} value={input.pmaxWp} onChange={(v) => update({ pmaxWp: v })} min={1} />
              <NumberField label="Temp. coeff. of voltage" unit="%/°C" tip={"How much the module's voltage changes per \u00b0C away from the 25\u00b0C STC reference \u2014 always negative for crystalline silicon (voltage rises as the module gets colder). Typically \u22120.27 to \u22120.35 %/\u00b0C from the datasheet."} value={input.tempCoeffVocPct} onChange={(v) => update({ tempCoeffVocPct: v })} step="any" />
            </Section>

            <Section title="Array & site conditions">
              <NumberField label="Modules per string (Ns)" tip={"Number of modules wired in series to form one string \u2014 directly multiplies string voltage, the main lever for landing the string inside the inverter's MPPT window while staying under its maximum DC input voltage."} value={input.ns} onChange={(v) => update({ ns: v })} min={1} step={1} />
              <NumberField label="Strings in parallel (Np)" tip={"Number of strings wired in parallel \u2014 multiplies total array current. The free tier sizes one representative string; multi-string combiner/OCPD sizing is a subscriber feature."} value={input.np} onChange={(v) => update({ np: v })} min={1} step={1} />
              <NumberField label="Site min temperature" unit="°C" tip={"Lowest ambient temperature reasonably expected at the site \u2014 drives the WORST-CASE (highest) string voltage, since module Voc rises as temperature falls. An over-cautious guess oversizes the array; an optimistic one risks a voltage that damages the inverter."} value={input.siteTempMinC} onChange={(v) => update({ siteTempMinC: v })} />
              <NumberField label="Site max temperature" unit="°C" tip={"Highest module operating temperature reasonably expected \u2014 for rooftop modules this can run 20-30\u00b0C above ambient air temperature. Drives the WORST-CASE (lowest) string operating voltage, checked against the inverter's minimum MPPT voltage."} value={input.siteTempMaxC} onChange={(v) => update({ siteTempMaxC: v })} />
            </Section>

            <Section title="Inverter">
              <NumberField label="MPPT min voltage" unit="V" tip={"Lowest voltage at which the inverter's MPPT tracker still operates correctly. The string's hot-weather Vmpp must stay above this, or the inverter falls out of MPPT tracking and clips output on hot days."} value={input.mpptMinV} onChange={(v) => update({ mpptMinV: v })} min={1} />
              <NumberField label="MPPT max voltage" unit="V" tip={"Highest voltage within the inverter's MPPT tracking range \u2014 normally a little below the inverter's absolute maximum DC input voltage. The string's cold-weather Vmpp should stay under this."} value={input.mpptMaxV} onChange={(v) => update({ mpptMaxV: v })} min={1} />
              <NumberField label="Max DC input voltage" unit="V" tip={"The absolute voltage limit the inverter's DC input can withstand \u2014 exceeding this, even briefly at dawn on a cold day, can cause immediate and sometimes irreversible damage. A hard limit, separate from and above the MPPT tracking range."} value={input.maxDcV} onChange={(v) => update({ maxDcV: v })} min={1} />
              <NumberField label="Max DC input current per MPPT" unit="A" tip={"The maximum current the inverter's MPPT input can accept. The array's short-circuit current on that input (Np \u00d7 Isc \u00d7 1.25 margin) must not exceed this."} value={input.maxDcA} onChange={(v) => update({ maxDcA: v })} min={0.1} />
              <NumberField label="Rated AC power" unit="kW" tip={"The inverter's continuous AC output power rating \u2014 used to check the DC:AC oversizing ratio (array kWp \u00f7 inverter kW) against the typical accepted range of roughly 1.0-1.3, and to size the AC cable."} value={input.acPowerKw} onChange={(v) => update({ acPowerKw: v })} min={0.1} />
              <SelectField<PvPhase>
                label="AC phase"
                tip={"Single-phase or three-phase inverter AC output \u2014 determines which voltage-drop formula and cable-ampacity table apply on the AC side."} value={input.phase}
                onChange={(v) => update({ phase: v })}
                options={[
                  { value: "1ph", label: "Single-phase" },
                  { value: "3ph", label: "Three-phase" },
                ]}
              />
              <div className="col-span-2">
                <NumberField label="AC output voltage" unit="V" tip={"The nominal AC voltage the inverter feeds into (e.g. 230V single-phase or 400V three-phase) \u2014 used for the AC cable's voltage-drop calculation."} value={input.acVoltage} onChange={(v) => update({ acVoltage: v })} min={100} />
              </div>
            </Section>

            <Section title="DC cable">
              <SelectField<ConductorMaterial>
                label="Conductor material"
                tip={"Copper or aluminium for the DC string/array cable. PV DC cables are usually copper for better long-term reliability in outdoor DC service."} value={input.dcMaterial}
                onChange={(v) => update({ dcMaterial: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
              />
              <SelectField<InstallMethod>
                label="Installation method"
                tip={"The IEC 60364-5-52 reference installation method for the DC string/array cable \u2014 sets which ampacity table column applies, same convention as other cable-sizing modules."} value={input.dcMethod}
                onChange={(v) => update({ dcMethod: v })}
                options={INSTALL_METHODS}
              />
              <NumberField label="Route length" unit="m" tip={"One-way length of the DC run from the array (or combiner) to the inverter \u2014 used for both the ampacity check and DC voltage drop. IEC 62548 recommends keeping DC voltage drop under roughly 1-2% to avoid throwing away harvested energy as heat."} value={input.dcLengthM} onChange={(v) => update({ dcLengthM: v })} min={0} />
              <NumberField label="Ambient temperature" unit="°C" tip={"Ambient temperature the DC cable run is exposed to \u2014 for cables on a hot roof this can be significantly higher than shaded ambient air, and directly derates the cable's current-carrying capacity."} value={input.dcAmbientC} onChange={(v) => update({ dcAmbientC: v })} min={-10} max={90} />
            </Section>

            <Section title="AC cable">
              <SelectField<ConductorMaterial>
                label="Conductor material"
                tip={"Copper or aluminium for the inverter-to-grid-connection AC cable \u2014 same convention as the Cable Sizing calculator."} value={input.acMaterial}
                onChange={(v) => update({ acMaterial: v })}
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
              <NumberField label="Route length" unit="m" tip={"One-way length of the AC cable from the inverter to its point of connection, used for ampacity and voltage-drop calculations."} value={input.acLengthM} onChange={(v) => update({ acLengthM: v })} min={0} />
              <NumberField label="Ambient temperature" unit="°C" tip={"Ambient temperature for the AC cable run \u2014 derates the cable's current-carrying capacity."} value={input.acAmbientC} onChange={(v) => update({ acAmbientC: v })} min={-10} max={80} />
              <div className="col-span-2">
                <NumberField label="Grouping" hint="circuits run together" tip={"Number of AC circuits run together along the same route \u2014 reduces each cable's effective current-carrying capacity via the grouping derating factor."} value={input.acGrouping} onChange={(v) => update({ acGrouping: v })} min={1} max={20} step={1} />
              </div>
            </Section>

            <PremiumSection
              title="Multi-string array"
              description="Uses the Strings in Parallel (Np) value above to check combined MPPT current, string-level overcurrent protection requirement, and DC:AC oversizing ratio."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                Preview only — full multi-string combiner/feeder sizing unlocks with subscriber accounts.
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <PvResults result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
