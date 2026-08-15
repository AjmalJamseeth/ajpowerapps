"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { NumberField, SelectField, Section } from "@/components/fields";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import MvCableResults from "@/components/mvcable/MvCableResults";
import {
  DEFAULT_MVCABLE_INPUT,
  MvCableInput,
  MvConductorMaterial,
  MvBonding,
  MvInstallMethod,
  calcMvCable,
} from "@/lib/mvcable";

export default function MvCablePage() {
  const [input, setInput] = useState<MvCableInput>(DEFAULT_MVCABLE_INPUT);
  const update = (patch: Partial<MvCableInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcMvCable(input), [input]);

  const loadExample = () => setInput(DEFAULT_MVCABLE_INPUT);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          MV Cable Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 60287-1-1 · IEC 60287-2-1 · IEC 60287-3-1 — first-principles
          thermal-circuit current rating for single-core MV/HV cables,
          cross-checked against CIGRE Technical Brochure 880. v1 scope:
          single-core, unarmoured, XLPE-insulated, buried (duct or direct)
          cables. Free-air installation and armoured cables are not yet
          supported. This calculator is fully free — no subscriber gate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="MV Cable Sizing Calculator" standardsLine="IEC 60287-1-1/2-1/3-1, CIGRE TB880" />
          <FeedbackButton calculatorName="MV Cable Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="A first-principles IEC 60287 thermal-circuit solver for single-core MV/HV cable current rating \u2014 rather than looking up a rating from a manufacturer's table, it builds the actual thermal circuit (conductor\u2192sheath, sheath\u2192serving, serving\u2192ambient soil) from cable geometry and iterates to find the current that brings the conductor to its rated maximum temperature."
          standards={["IEC 60287-1-1 (current rating equations, loss factors)", "IEC 60287-2-1 (thermal resistance calculation)", "IEC 60287-3-1 (operating conditions \u2014 reference soil temperatures/resistivities)", "cross-checked against CIGRE Technical Brochure 880"]}
          capabilities={["Full thermal-circuit build-up: conductor AC resistance (temperature, skin and proximity effect corrected), dielectric loss, sheath circulating-current loss factor, and the T1/T3/T4 thermal resistances.", "Iterative solve for continuous current rating, converging the conductor temperature exactly to your specified maximum.", "Solid vs. single-point sheath bonding, with a warning on the standing-voltage implication of single-point bonding.", "Buried-in-duct or direct-buried installation methods."]}
          example={{ problem: "This calculator's default scenario reproduces CIGRE Technical Brochure 880's Case #0-1: a 132kV copper-conductor, XLPE-insulated, aluminium-sheathed cable, buried in duct.", steps: ["Build cable geometry from conductor diameter and each layer's thickness (insulation, screens, sheath, oversheath).", "Compute capacitance and reactance from the geometry, then dielectric loss from system voltage and frequency.", "Compute the T1 (conductor-to-sheath), T3 (sheath-to-serving) and T4 (serving-to-ambient soil) thermal resistances.", "Iterate the current-rating equation, adjusting current until the resulting conductor temperature converges to the 90\u00b0C limit."], result: "Converges in 5 iterations to an 821.8A rating, with conductor temperature landing exactly at the 90\u00b0C limit (guaranteed by the solving method) and a physically sane 78.7\u00b0C sheath temperature \u2014 confirming the thermal-circuit solver is arithmetically faithful to its IEC 60287-1-1 definitions." }}
          notes="v1 scope: single-core, unarmoured, XLPE-insulated cable, buried in duct or direct only \u2014 free-air installation and armoured cables (with their eddy-current losses) are not yet supported."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="System">
              <NumberField label="System voltage U" unit="kV" tip={"Line-to-line system voltage \u2014 used to get the phase voltage (U\u2080=U/\u221a3) for the dielectric loss calculation, since dielectric loss depends on the voltage actually stressing the insulation."} value={input.voltageKv} onChange={(v) => update({ voltageKv: v })} min={1} />
              <NumberField label="Frequency" unit="Hz" tip={"System frequency \u2014 sets the angular frequency \u03c9=2\u03c0f used in the sheath reactance and dielectric loss formulas."} value={input.freqHz} onChange={(v) => update({ freqHz: v })} min={16} max={400} />
              <div className="col-span-2">
                <NumberField label="Max conductor temperature" unit="°C" tip={"The conductor temperature limit the cable is rated to \u2014 90\u00b0C is standard for XLPE insulation. This is the target the iterative solver converges the permissible current to."} value={input.maxCondTempC} onChange={(v) => update({ maxCondTempC: v })} min={60} max={105} step={1} />
              </div>
            </Section>

            <Section title="Conductor">
              <SelectField<MvConductorMaterial>
                label="Conductor material"
                tip={"Copper or aluminium \u2014 sets the temperature coefficient of resistance (\u03b120) used to correct your entered DC resistance from 20\u00b0C up to the conductor's operating temperature."} value={input.condMaterial}
                onChange={(v) => update({ condMaterial: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
              />
              <NumberField label="Conductor diameter" unit="mm" tip={"The actual overall conductor diameter from the cable manufacturer's datasheet \u2014 used directly rather than derived from cross-sectional area, since stranding/compaction affects the real diameter for a given mm\u00b2."} value={input.condDiaMm} onChange={(v) => update({ condDiaMm: v })} min={1} />
              <div className="col-span-2">
                <NumberField label="DC resistance R₀ at 20°C" unit="Ω/km" tip={"DC resistance per km at 20\u00b0C, from the cable manufacturer's datasheet (or IEC 60228 Table 2 for standard constructions) \u2014 the starting point the engine temperature-corrects and adds skin/proximity effect to, to get the actual AC operating resistance."} value={input.condR0OhmKm} onChange={(v) => update({ condR0OhmKm: v })} min={0.0001} step="any" />
              </div>
            </Section>

            <Section title="Insulation & sheath build">
              <div className="col-span-2 text-xs text-muted">v1 supports XLPE insulation only (ε=2.5, tanδ=0.001, ρ=3.5 K·m/W — CIGRE-verified).</div>
              <NumberField label="Conductor screen thickness" unit="mm" tip={"Thickness of the semi-conducting layer extruded directly over the conductor \u2014 thin, but still a real layer in the T1 conductor-to-sheath thermal path."} value={input.condScreenTMm} onChange={(v) => update({ condScreenTMm: v })} min={0} />
              <NumberField label="Insulation thickness" unit="mm" tip={"Radial thickness of the XLPE insulation \u2014 the dominant contributor to T1, the thermal resistance between conductor and sheath."} value={input.insulTMm} onChange={(v) => update({ insulTMm: v })} min={1} />
              <NumberField label="Insulation screen thickness" unit="mm" tip={"Thickness of the semi-conducting layer extruded over the insulation, beneath the metallic sheath \u2014 the third and final layer counted in T1."} value={input.insulScreenTMm} onChange={(v) => update({ insulScreenTMm: v })} min={0} />
              <SelectField<MvConductorMaterial>
                label="Sheath material"
                tip={"Aluminium or copper metallic sheath/screen \u2014 sets the sheath's electrical resistivity and temperature coefficient, which directly control the circulating-current loss factor \u03bb1\u2032."} value={input.sheathMaterial}
                onChange={(v) => update({ sheathMaterial: v })}
                options={[
                  { value: "Al", label: "Aluminium" },
                  { value: "Cu", label: "Copper" },
                ]}
              />
              <NumberField label="Sheath thickness" unit="mm" tip={"Radial thickness of the metallic sheath \u2014 used for the sheath's cross-sectional area (and resistance), and as part of the mean sheath diameter used in the reactance formula."} value={input.sheathTMm} onChange={(v) => update({ sheathTMm: v })} min={0.1} />
              <NumberField label="Oversheath thickness" unit="mm" tip={"Radial thickness of the outer (PVC/PE) serving over the sheath \u2014 the thermal resistance T3 of this layer is part of the total path from conductor to ambient."} value={input.oversheathTMm} onChange={(v) => update({ oversheathTMm: v })} min={0} />
            </Section>

            <Section title="Sheath bonding">
              <div className="col-span-2">
                <SelectField<MvBonding>
                  label="Bonding method"
                  tip={"Solid bonding (both ends earthed) allows circulating sheath current, which adds a real loss factor \u03bb1\u2032 that reduces current rating; single-point bonding eliminates that circulating loss (\u03bb1\u2032=0) but leaves a standing voltage on the sheath at the unearthed end that must be checked separately."} value={input.bonding}
                  onChange={(v) => update({ bonding: v })}
                  options={[
                    { value: "solid", label: "Solidly bonded (both ends)" },
                    { value: "single", label: "Single-point bonded" },
                  ]}
                />
              </div>
              {input.bonding === "single" && (
                <div className="col-span-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-muted">
                  ⚠ Single-point bonding removes circulating-current loss (λ1′=0) but leaves a standing voltage on the sheath at the unearthed end — this must be checked separately against touch-voltage/sheath-voltage-limiter requirements (outside this tool&apos;s scope).
                </div>
              )}
              <div className="col-span-2 text-xs text-muted">v1 assumes unarmoured cable (λ2 = 0). Armoured-cable circulating/eddy loss is not yet supported.</div>
            </Section>

            <Section title="Installation">
              <div className="col-span-2">
                <SelectField<MvInstallMethod>
                  label="Installation method"
                  tip={"Whether the cable is buried in a duct (with an air gap around it, adding thermal resistance) or direct-buried in contact with soil \u2014 changes the external thermal resistance T4 calculation."} value={input.installMethod}
                  onChange={(v) => update({ installMethod: v })}
                  options={[
                    { value: "duct", label: "Buried in duct" },
                    { value: "direct", label: "Direct buried, single isolated cable" },
                  ]}
                />
              </div>
              <NumberField label="Burial depth L" unit="mm" tip={"Distance from the ground surface to the cable axis \u2014 deeper burial increases the external thermal resistance T4 (heat has further to travel to reach the surface), reducing the current rating."} value={input.burialDepthMm} onChange={(v) => update({ burialDepthMm: v })} min={100} />
              <NumberField label="Soil thermal resistivity" unit="K·m/W" tip={"Thermal resistivity of the soil (or duct backfill) surrounding the cable \u2014 a higher value means the surroundings conduct heat away less effectively, directly reducing T4 and the current rating. See IEC 60287-3-1 for country/soil-type reference values."} value={input.soilRhoKmW} onChange={(v) => update({ soilRhoKmW: v })} min={0.1} />
              <div className="col-span-2">
                <NumberField label="Ambient ground temperature" unit="°C" tip={"Undisturbed soil temperature at the cable's depth, before the cable's own heat is added \u2014 see IEC 60287-3-1 Table 1 for typical values by climate and depth."} value={input.ambientTempC} onChange={(v) => update({ ambientTempC: v })} min={-10} max={50} step={1} />
              </div>
            </Section>

            <div>
              <button
                type="button"
                onClick={loadExample}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium text-accent-2 hover:border-accent-2/60"
              >
                📋 Load CIGRE TB880 Example
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <MvCableResults result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
