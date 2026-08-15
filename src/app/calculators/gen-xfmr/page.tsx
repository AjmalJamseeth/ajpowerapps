"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { NumberField, SelectField, Section } from "@/components/fields";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import PremiumSection from "@/components/PremiumSection";
import { GenResultPanel, XfmrResultPanel, NgrResultPanel } from "@/components/genxfmr/GenXfmrResults";
import {
  DEFAULT_GEN_INPUT,
  GenInput,
  calcGen,
  DEFAULT_XFMR_INPUT,
  XfmrInput,
  PfType,
  calcXfmr,
  DEFAULT_NGR_INPUT,
  NgrInput,
  calcNgr,
} from "@/lib/genxfmr";

type Tab = "gen" | "xfmr" | "ngr";

export default function GenXfmrPage() {
  const [tab, setTab] = useState<Tab>("gen");

  const [genInput, setGenInput] = useState<GenInput>(DEFAULT_GEN_INPUT);
  const updateGen = (patch: Partial<GenInput>) => setGenInput((prev) => ({ ...prev, ...patch }));
  const genResult = useMemo(() => calcGen(genInput), [genInput]);

  const [xfmrInput, setXfmrInput] = useState<XfmrInput>(DEFAULT_XFMR_INPUT);
  const updateXfmr = (patch: Partial<XfmrInput>) => setXfmrInput((prev) => ({ ...prev, ...patch }));
  const xfmrResult = useMemo(() => calcXfmr(xfmrInput), [xfmrInput]);

  const [ngrInput, setNgrInput] = useState<NgrInput>(DEFAULT_NGR_INPUT);
  const updateNgr = (patch: Partial<NgrInput>) => setNgrInput((prev) => ({ ...prev, ...patch }));
  // NGR/NET sizing is a subscriber feature — never computed on the free site.
  const ngrResult = useMemo(() => calcNgr(ngrInput, FREE_LAUNCH), [ngrInput]);

  const tabs: { id: Tab; label: string; pro?: boolean }[] = [
    { id: "gen", label: "⚙ Generator Sizing" },
    { id: "xfmr", label: "🔺 Transformer Losses" },
    { id: "ngr", label: "🌍 NGR / NET Sizing", pro: true },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Generator &amp; Transformer Analysis
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Genset sizing for running + motor-starting load, transformer
          loss/efficiency/regulation from test data, and neutral earthing
          resistor/transformer sizing. Generator sizing and transformer
          losses are free; NGR/NET sizing is a subscriber feature.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? "border-accent text-foreground" : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {t.pro && (
                <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
                  Subscriber
                </span>
              )}
            </button>
          ))}
        </div>

<div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Generator & Transformer Analysis" standardsLine="ISO 8528, IEEE 142, Kapp's formula" />
          <FeedbackButton calculatorName="Generator & Transformer Analysis" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose={"Three related sizing/analysis tools for generator and transformer plant: standby/prime generator kVA sizing from running load plus a motor-starting voltage-dip check, transformer loss/efficiency/regulation analysis from routine test data, and (subscriber tier) neutral earthing resistor/transformer sizing for high- or low-resistance grounded systems."}
          standards={["ISO 8528 (reciprocating internal combustion engine driven AC generating sets, referenced for generator sizing conventions)", "IEEE 142 (grounding of industrial and commercial power systems — the Green Book, referenced for NGR sizing R = V_LN/I_fault)", "Kapp's approximate voltage regulation formula (classical transformer theory, from open/short-circuit test data)"]}
          capabilities={["Generator Sizing: running load (linear + non-linear with derating) and motor-starting voltage-dip requirement, with the recommended genset rating from whichever constraint governs, plus a fuel-consumption estimate.", "Transformer Losses: total loss and efficiency at any loading fraction from OC/SC test data, the loading point of maximum efficiency, %R/%X and Kapp's voltage regulation formula, and an optional annual loss-cost estimate.", "Subscriber (NGR/NET Sizing): neutral earthing resistor sizing with HRG/LRG classification, power/energy dissipated, charging-current design check, and neutral earthing transformer secondary resistor sizing."]}
          example={{ problem: "Size a generator for a facility with mixed linear/non-linear running load plus a large motor starting event, and separately analyze an existing transformer's efficiency from test data.", steps: ["Generator: combine linear kW/PF and derated non-linear kVA into a total running kVA requirement.", "Generator: compute motor-starting voltage dip = (motor starting kVA × Xd) / genset kVA × 100, and find the genset size that keeps this under the allowable dip.", "Generator: the recommended size is whichever of running-load kVA or starting-dip-driven kVA is larger (the governing constraint).", "Transformer: from no-load loss Pfe, load loss Pcu and loading fraction x, compute total loss = Pfe + x²×Pcu and efficiency = output/(output+loss).", "Transformer: find the loading fraction where efficiency peaks (where core loss equals copper loss) and compute voltage regulation via Kapp's formula from %R and %X."], result: "Default scenario: generator sizing governed by the 502.94kVA running-load requirement (versus a 240kVA voltage-dip requirement); transformer losses show 98.516% efficiency at full load, 98.964% maximum efficiency at x=0.405, and 4.140% voltage regulation — all hand-checked and matched the live code exactly." }}
          notes="Standby/prime generator sizing for a facility is fully implemented here as the Generator Sizing tab — this is the same functionality sometimes requested as a standalone 'Generator Sizer'."
          />
        </div>

        {tab === "gen" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Section title="Running load">
                <NumberField label="Linear (steady) load" unit="kW" tip={"Steady-state real power of linear (non-harmonic-producing) loads \u2014 motors, resistive heating, lighting \u2014 that the generator must supply continuously."} value={genInput.linearKw} onChange={(v) => updateGen({ linearKw: v })} min={0} />
                <NumberField label="Linear load PF" tip={"Power factor of the linear load \u2014 used to convert kW to kVA when checking the generator's kVA rating."} value={genInput.linearPf} onChange={(v) => updateGen({ linearPf: v })} min={0.1} max={1} step={0.01} />
                <NumberField label="Non-linear load" hint="VFDs, UPS, rectifiers" unit="kVA" tip={"Apparent power of non-linear loads (VFDs, UPS, rectifiers) \u2014 these draw harmonic-rich current that generators must be oversized for beyond their simple kVA rating."} value={genInput.nonlinKva} onChange={(v) => updateGen({ nonlinKva: v })} min={0} />
                <NumberField label="Non-linear derating" hint="typ. 1.5–2×" tip={"Generators need extra kVA headroom to supply non-linear/harmonic-rich loads without excessive heating or waveform distortion \u2014 typically 1.5-2\u00d7 the non-linear load's own kVA rating."} value={genInput.nonlinDerate} onChange={(v) => updateGen({ nonlinDerate: v })} min={1} step={0.05} />
              </Section>
              <Section title="Motor starting / voltage dip">
                <div className="col-span-2 text-xs text-muted">
                  %VD = (Motor Starting kVA × Xd) / Genset kVA × 100. Use
                  X&quot;d for the instantaneous dip, or X&apos;d for the
                  longer sustained dip.
                </div>
                <NumberField label="Largest motor starting kVA" hint="locked-rotor kVA" unit="kVA" tip={"The locked-rotor (starting) kVA of the largest motor that starts across-the-line \u2014 the single biggest instantaneous demand the generator must ride through without excessive voltage dip."} value={genInput.motorStartKva} onChange={(v) => updateGen({ motorStartKva: v })} min={0} />
                <NumberField label="Generator reactance Xd" hint="X″d 0.12–0.18, X′d 0.20–0.35 pu" tip={"Generator reactance used in the voltage-dip formula. Subtransient reactance X\u2033d (typically 0.12-0.18 pu) predicts the instantaneous dip at the moment of starting; transient reactance X\u2032d (0.20-0.35 pu) predicts the longer sustained dip."} value={genInput.xd} onChange={(v) => updateGen({ xd: v })} min={0.01} step={0.01} />
                <NumberField label="Max allowable voltage dip" unit="%" tip={"The largest momentary voltage dip the generator's own protection and other connected loads can tolerate during motor starting \u2014 exceeding this can cause contactors to drop out or the generator's own AVR to trip."} value={genInput.maxDipPct} onChange={(v) => updateGen({ maxDipPct: v })} min={1} />
              </Section>
              <Section title="Fuel estimate">
                <div className="col-span-2 text-xs text-muted">Generic estimate only — replace with your genset&apos;s actual fuel-consumption curve for a real fuel budget.</div>
                <NumberField label="Specific fuel consumption" unit="L/kWh" tip={"Specific fuel consumption \u2014 litres of fuel burned per kWh of electrical output \u2014 from the genset manufacturer's fuel curve at the relevant loading point. A generic estimate here, not a substitute for the actual curve."} value={genInput.sfc} onChange={(v) => updateGen({ sfc: v })} min={0.05} step={0.01} />
                <NumberField label="Fuel cost" unit="$/L" tip={"Local fuel price per litre, used to estimate the running cost of the generator at the sized output."} value={genInput.fuelCost} onChange={(v) => updateGen({ fuelCost: v })} min={0} />
              </Section>
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <GenResultPanel result={genResult} />
              </div>
            </div>
          </div>
        )}

        {tab === "xfmr" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <Section title="Transformer & test data">
                <NumberField label="Transformer rating S" unit="kVA" tip={"The transformer's nameplate kVA rating \u2014 the reference the loading fraction x and all loss/efficiency figures are calculated against."} value={xfmrInput.sKva} onChange={(v) => updateXfmr({ sKva: v })} min={1} />
                <NumberField label="No-load loss Pfe" hint="open-circuit test" unit="W" tip={"No-load (core/iron) loss, from the transformer's open-circuit test \u2014 roughly constant regardless of load, since it's driven by the excitation voltage, not load current."} value={xfmrInput.pfeW} onChange={(v) => updateXfmr({ pfeW: v })} min={0} />
                <NumberField label="Load loss Pcu" hint="short-circuit test, at rated I" unit="W" tip={"Load (copper/winding) loss at rated current, from the transformer's short-circuit test \u2014 scales with the square of the loading fraction, unlike no-load loss."} value={xfmrInput.pcuW} onChange={(v) => updateXfmr({ pcuW: v })} min={0} />
                <NumberField label="%Impedance Z" hint="from SC test nameplate" unit="%" tip={"Percent impedance from the short-circuit test nameplate \u2014 used in Kapp's approximate voltage regulation formula together with %R (derived from load loss) and the load power factor."} value={xfmrInput.zPct} onChange={(v) => updateXfmr({ zPct: v })} min={0.1} step={0.01} />
              </Section>
              <Section title="Operating condition">
                <NumberField label="Loading fraction x" hint="1.0 = full rated load" tip={"The loading fraction to evaluate \u2014 1.0 means full rated load. Since core loss is constant but copper loss scales with x\u00b2, total efficiency peaks at a specific loading fraction below 1.0, which this calculator finds explicitly."} value={xfmrInput.loadX} onChange={(v) => updateXfmr({ loadX: v })} min={0.01} step={0.01} />
                <NumberField label="Load power factor" tip={"Load power factor at this operating point \u2014 affects both output power (for efficiency) and voltage regulation via Kapp's formula."} value={xfmrInput.loadPf} onChange={(v) => updateXfmr({ loadPf: v })} min={0.1} max={1} step={0.01} />
                <SelectField<PfType>
                  label="PF type"
                  tip={"Lagging (inductive) loads cause a larger voltage drop through the transformer's reactance than leading (capacitive) loads at the same magnitude \u2014 Kapp's formula accounts for this sign difference."} value={xfmrInput.pfType}
                  onChange={(v) => updateXfmr({ pfType: v })}
                  options={[
                    { value: "lag", label: "Lagging (inductive)" },
                    { value: "lead", label: "Leading (capacitive)" },
                  ]}
                />
              </Section>
              <Section title="Owning cost (optional)">
                <NumberField label="Energy rate" unit="$/kWh" tip={"Local electricity cost per kWh, used to estimate the annual cost of the transformer's own no-load and load losses."} value={xfmrInput.energyRate} onChange={(v) => updateXfmr({ energyRate: v })} min={0} />
                <NumberField label="Average loading factor" tip={"The transformer's typical average loading fraction over a year (as opposed to the loadX above, which is the specific point being analyzed) \u2014 used to annualise the loss-cost estimate realistically rather than assuming constant full-load operation."} value={xfmrInput.avgLoadX} onChange={(v) => updateXfmr({ avgLoadX: v })} min={0.01} step={0.01} />
              </Section>
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <XfmrResultPanel result={xfmrResult} />
              </div>
            </div>
          </div>
        )}

        {tab === "ngr" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <PremiumSection
                title="System & desired fault current"
                description="R = VLN / Ifault per IEEE 142. Good practice: ≤10A is typically High-Resistance Grounding (HRG); above that, Low-Resistance Grounding (LRG)."
                unlocked={FREE_LAUNCH}
              >
                <NumberField label="System line-line voltage" unit="kV" tip={"Nominal system line-to-line voltage \u2014 the resistor is sized from the resulting phase (line-to-neutral) voltage, R = V_LN / I_fault per IEEE 142."} value={ngrInput.sysVllKv} onChange={(v) => updateNgr({ sysVllKv: v })} />
                <NumberField label="Desired ground fault current If" unit="A" tip={"The single-line-to-ground fault current you want the neutral earthing resistor to limit the system to. \u226410A is typically High-Resistance Grounding (HRG, allows continued operation on a first fault); above that is Low-Resistance Grounding (LRG, sized to trip quickly)."} value={ngrInput.desiredIfA} onChange={(v) => updateNgr({ desiredIfA: v })} />
                <NumberField label="System charging current Ic" hint="optional" unit="A" tip={"The system's own capacitive charging current (from cable/line capacitance) \u2014 for HRG design, the resistor current should exceed this to avoid transient overvoltages from unsuppressed arcing ground faults."} value={ngrInput.chargingIcA} onChange={(v) => updateNgr({ chargingIcA: v })} />
                <NumberField label="Resistor time rating" unit="s" tip={"How long the resistor must be able to carry its rated fault current without thermal damage, from the resistor manufacturer's datasheet \u2014 commonly 10s, 60s, or continuous ratings for HRG applications."} value={ngrInput.timeRatingS} onChange={(v) => updateNgr({ timeRatingS: v })} />
              </PremiumSection>
              <PremiumSection
                title="Neutral earthing transformer (optional)"
                description="Only needed if the source has no natural neutral point, so a zigzag/star NET is used to create one, with the resistor typically on the NET's lower-voltage secondary."
                unlocked={FREE_LAUNCH}
              >
                <NumberField label="NET turns ratio (primary:secondary)" hint="blank for direct-connected resistor" tip={"If the source has no natural neutral point, a zigzag/star Neutral Earthing Transformer (NET) creates one \u2014 the resistor typically sits on the NET's lower-voltage secondary, so this turns ratio converts between the resistor's actual value and the equivalent system-referred value."} value={ngrInput.netRatio} onChange={(v) => updateNgr({ netRatio: v })} />
              </PremiumSection>
            </div>
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <NgrResultPanel result={ngrResult} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
