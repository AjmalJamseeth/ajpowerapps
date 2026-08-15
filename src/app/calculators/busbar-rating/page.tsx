"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import BusbarResults from "@/components/busbar/BusbarResults";
import {
  DEFAULT_BUSBAR_INPUT,
  BusbarInput,
  BusMaterial,
  BusOrientation,
  BusMounting,
  BusFinish,
  BusEndCondition,
  BUS_FINISH_EPS,
  calcBusbar,
} from "@/lib/busbar";

export default function BusbarRatingPage() {
  const [input, setInput] = useState<BusbarInput>(DEFAULT_BUSBAR_INPUT);
  const update = (patch: Partial<BusbarInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const onFinishChange = (finish: BusFinish) => {
    update({ finish, emissivity: BUS_FINISH_EPS[finish] });
  };
  const onOrientationChange = (orientation: BusOrientation) => {
    update({ orientation, mcadamsC: orientation === "horizontal" ? 1.32 : 1.42 });
  };

  // Short-time thermal withstand and electrodynamic force check are
  // subscriber features — never computed on the free site.
  const result = useMemo(() => calcBusbar(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Busbar &amp; Switchgear Rating Check
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Continuous ampacity from first-principles heat balance, for
          rectangular busbars. The temperature-rise calculation is a
          transparent engineering approximation, not a substitute for IEC
          60890 formal type-test verification where that&apos;s required —
          every coefficient is exposed so you can calibrate it to your
          enclosure. Short-time thermal withstand and electrodynamic force
          check are subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Busbar & Switchgear Rating Check" standardsLine="First-principles heat balance, IEC 60865-1-style" />
          <FeedbackButton calculatorName="Busbar & Switchgear Rating Check" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Checks a rectangular busbar's continuous current rating from first-principles heat balance (not a lookup table), plus subscriber-tier short-time thermal withstand and electrodynamic force checks for fault conditions \u2014 every thermal coefficient is exposed and editable so you can calibrate the model to your actual enclosure rather than trusting a black-box result."
          standards={["First-principles heat-balance calculation (transparent engineering approximation, not a substitute for IEC 60890 formal type-test verification where required)", "IEC 60364-5-54-style bare-conductor k-factor table (short-time thermal withstand, reused from Cable Sizing's CPC sizing)", "IEC 60865-1-style method (electrodynamic force check)"]}
          capabilities={["Continuous ampacity, AC resistance (with skin/proximity correction), I\u00b2R loss, equilibrium temperature rise, and hot-spot temperature from first-principles heat balance.", "Pass/fail against your permissible temperature rise, plus the estimated maximum continuous current at that limit.", "Subscriber: short-time thermal withstand (adiabatic) and electrodynamic force / support bending-stress check."]}
          example={{ problem: "This calculator's default scenario intentionally uses a severe demonstration configuration (matching the source app's own placeholder values) that fails both subscriber-tier checks \u2014 confirming those checks correctly flag an unsafe design rather than silently passing everything.", steps: ["Electrodynamic force: 100kA peak fault current at 150mm phase spacing \u2192 13,333 N/m force per unit length.", "Convert to bending moment across the support span \u2192 600 N\u00b7m moment.", "Convert to bending stress \u2192 360 MPa, compared against a 32.9 MPa allowable stress (yield/safety factor) \u2014 fails badly, as intended by the demo scenario.", "Short-time thermal withstand: 40kA fault for 1s on copper requires 251.6mm\u00b2 minimum cross-section."], result: "Both the electrodynamic force chain (100kA/150mm \u2192 13,333 N/m \u2192 600 N\u00b7m \u2192 360 MPa vs. 32.9 MPa) and the short-time thermal withstand (40kA/1s/Cu \u2192 251.6mm\u00b2) were hand-checked and matched the code exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Busbar configuration">
              <SelectField<BusMaterial>
                label="Material"
                value={input.material}
                onChange={(v) => update({ material: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
              />
              <NumberField label="Bars per phase" tip={"How many individual rectangular bars are bundled together (with a gap) to form one phase \u2014 used when a single bar can't practically carry the full design current. Splitting into multiple bars increases surface area and cross-section, with diminishing returns as bars shield each other from airflow."} value={input.nBars} onChange={(v) => update({ nBars: v })} min={1} max={6} step={1} />
              <NumberField label="Bar width" unit="mm" tip={"The busbar's wider cross-sectional dimension. For edge-mounted (vertical) orientation this faces the airflow and is normally also the default Characteristic Length in the natural-convection calculation."} value={input.widthMm} onChange={(v) => update({ widthMm: v })} min={1} />
              <NumberField label="Bar thickness" unit="mm" tip={"The busbar's narrower cross-sectional dimension \u2014 together with width and bars-per-phase, sets the total conductor cross-section (and therefore resistance and current density)."} value={input.thickMm} onChange={(v) => update({ thickMm: v })} min={1} />
              <NumberField label="Gap between bars" hint="if >1 bar/phase" unit="mm" tip={"Physical gap between bundled bars of the same phase (when bars per phase > 1) \u2014 affects how much each bar shields its neighbours from airflow."} value={input.gapMm} onChange={(v) => update({ gapMm: v })} min={0} />
              <NumberField label="Phase spacing (center-center)" unit="mm" tip={"Distance between adjacent phases' busbar centrelines \u2014 affects proximity/skin-effect factors in the AC resistance calculation and, more critically, the magnetic force between phases during a fault (closer spacing means higher electrodynamic force for the same fault current)."} value={input.phaseSpacingMm} onChange={(v) => update({ phaseSpacingMm: v })} min={1} />
              <SelectField<BusOrientation>
                label="Orientation"
                tip={"Vertical (edge-mounted) surfaces convect heat somewhat more effectively than horizontal ones of the same size, per the McAdams natural-convection correlation."} value={input.orientation}
                onChange={onOrientationChange}
                options={[
                  { value: "vertical", label: "Edge-mounted (vertical)" },
                  { value: "horizontal", label: "Flat-mounted (horizontal)" },
                ]}
              />
              <SelectField<BusMounting>
                label="Mounting"
                tip={"Whether the busbar sits in open air or an enclosed panel \u2014 enclosed mounting traps heat and reduces the effective cooling compared to open air."} value={input.mounting}
                onChange={(v) => update({ mounting: v })}
                options={[
                  { value: "open", label: "Open air" },
                  { value: "enclosed", label: "Enclosed panel" },
                ]}
              />
              <NumberField label="Ambient temperature" unit="°C" tip={"The air temperature surrounding the busbar before any of its own I\u00b2R heating is added \u2014 the calculated hot-spot temperature is this value plus the calculated temperature rise \u0394T."} value={input.ambientC} onChange={(v) => update({ ambientC: v })} />
              <NumberField label="Design (load) current" unit="A" tip={"The continuous design current the busbar must carry \u2014 the calculator solves for the resulting temperature rise at this current, and separately estimates the maximum current at your permissible rise."} value={input.loadIA} onChange={(v) => update({ loadIA: v })} min={0} />
            </Section>

            <Section title="Thermal & surface factors">
              <div className="col-span-2 text-xs text-muted">
                Every coefficient here is an editable engineering
                approximation — replace with your own tested/enclosure-
                specific values where you have them.
              </div>
              <SelectField<BusFinish>
                label="Surface finish"
                tip={"Surface finish sets the emissivity \u03b5 (how effectively the surface radiates heat) \u2014 bare/oxidised copper radiates less effectively than a matte-painted or specially-treated surface."} value={input.finish}
                onChange={onFinishChange}
                options={[
                  { value: "bare", label: "Bare / oxidised" },
                  { value: "painted", label: "Painted (matte)" },
                  { value: "tin", label: "Tin-plated" },
                  { value: "silver", label: "Silver-plated" },
                ]}
              />
              <NumberField label="Emissivity ε" tip={"A 0-1 factor describing how effectively the busbar surface radiates heat compared to a perfect black body \u2014 auto-suggested by Surface Finish, but editable if you have a measured/manufacturer value."} value={input.emissivity} onChange={(v) => update({ emissivity: v })} min={0.05} max={0.98} step={0.01} />
              <NumberField label="McAdams coefficient" hint="vertical≈1.42, horizontal≈1.32" tip={"An empirical constant in the classic McAdams natural-convection correlation, relating heat transfer coefficient to temperature difference and characteristic length \u2014 depends on orientation."} value={input.mcadamsC} onChange={(v) => update({ mcadamsC: v })} min={0.5} step={0.01} />
              <NumberField label="Characteristic length" hint="defaults to bar width" unit="mm" tip={"The dimension the natural-convection correlation uses to characterise cooling behaviour \u2014 for a vertical flat plate this is normally its height (auto-set to bar width for that orientation)."} value={input.lcMm} onChange={(v) => update({ lcMm: v })} min={1} />
              <NumberField label="Skin-effect factor Ks" tip={"Accounts for AC current crowding toward the conductor's outer surface (skin effect), increasing effective AC resistance above simple DC resistance. Ks=1.00 means no correction applied."} value={input.ks} onChange={(v) => update({ ks: v })} min={1} step={0.01} />
              <NumberField label="Proximity factor Kp" tip={"Accounts for the additional resistance increase caused by the magnetic field of adjacent current-carrying bars/phases distorting current distribution within this bar. Kp=1.00 means no correction applied."} value={input.kp} onChange={(v) => update({ kp: v })} min={1} step={0.01} />
              <div className="col-span-2">
                <NumberField label="Permissible temperature rise ΔTmax" hint="bare bar in air, typ. 60–70K" unit="K" tip={"The maximum temperature rise above ambient the busbar/joint/insulation system is rated for \u2014 typically 60-70K for a bare bar in air. The continuous rating check passes when the calculated rise at your design current stays below this."} value={input.maxRiseK} onChange={(v) => update({ maxRiseK: v })} min={1} />
              </div>
            </Section>

            <PremiumSection
              title="Short-time thermal withstand"
              description="Reuses the same validated bare-conductor k-factor table already used for CPC sizing in Cable Sizing (IEC 60364-5-54) — a busbar is thermally just another bare conductor."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Fault current (rms)" unit="kA" tip={"RMS symmetrical fault current for the short-time thermal withstand check \u2014 confirms the busbar's cross-section absorbs the fault's heat energy (I\u00b2t) for its full clearing duration without exceeding its short-time withstand temperature."} value={input.ifKa} onChange={(v) => update({ ifKa: v })} />
              <NumberField label="Fault duration" unit="s" tip={"Fault clearing duration for the short-time thermal withstand check \u2014 fault current is many times the continuous rating but only flows briefly, so this is a separate, much more demanding check than the continuous rating."} value={input.tfS} onChange={(v) => update({ tfS: v })} />
            </PremiumSection>

            <PremiumSection
              title="Electrodynamic force check"
              description="Simplified single-span method in the spirit of IEC 60865-1 — parallel-conductor force from the peak (asymmetrical) fault current, then a beam-bending stress check between supports."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Peak fault current Ip" unit="kA" tip={"Peak (asymmetrical) fault current for the electrodynamic force check \u2014 the huge instantaneous current between adjacent busbar phases during a fault creates a strong magnetic repulsion/attraction force."} value={input.ipKa} onChange={(v) => update({ ipKa: v })} />
              <NumberField label="Support span L" unit="mm" tip={"Distance between mechanical supports \u2014 the busbar between two adjacent supports is treated as a simple beam under a distributed magnetic load for the bending-stress calculation."} value={input.spanMm} onChange={(v) => update({ spanMm: v })} />
              <SelectField<BusEndCondition>
                label="End condition"
                tip={"Whether the busbar span is simply supported (M=FL\u00b2/8) or fixed at both ends (M=FL\u00b2/12) \u2014 changes the bending-moment formula and therefore the calculated stress for the same force and span."} value={input.endCond}
                onChange={(v) => update({ endCond: v })}
                options={[
                  { value: "simple", label: "Simply supported (M=FL²/8)" },
                  { value: "fixed", label: "Fixed both ends (M=FL²/12)" },
                ]}
               
              />
              <NumberField label="Yield strength" unit="MPa" tip={"The busbar material's yield strength \u2014 the stress level at which it begins to permanently deform. The calculated bending stress from the fault force must stay below this, with margin, to guarantee the busbar returns to its original shape after the fault."} value={input.yieldMPa} onChange={(v) => update({ yieldMPa: v })} />
              <NumberField label="Safety factor" tip={"An additional margin applied to the material's yield strength before comparing it against the calculated bending stress \u2014 covers modelling simplifications, material variability, and the consequences of a support failure. 1.67 is a common general mechanical safety factor."} value={input.sf} onChange={(v) => update({ sf: v })} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <BusbarResults result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
