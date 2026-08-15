"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, TextField, CheckboxField, Section } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import CableResults from "@/components/cable/CableResults";
import {
  CableSizingInput,
  DEFAULT_CABLE_INPUT,
  INSTALL_METHODS,
  sizeCable,
  ConductorMaterial,
  InsulationType,
  InstallMethod,
  SystemType,
  LoadMethod,
  CoreCount,
  SpacingType,
  CpcType,
  CpcMaterialChoice,
} from "@/lib/cable";

export default function CableSizingPage() {
  const [input, setInput] = useState<CableSizingInput>(DEFAULT_CABLE_INPUT);
  const update = (patch: Partial<CableSizingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Premium calculation is never enabled on the free site — subscriber
  // sections below are shown for preview only, per the site's freemium model.
  const result = useMemo(() => sizeCable({ ...input, premiumEnabled: FREE_LAUNCH }), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Cable Sizing &amp; Voltage Drop Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          LV cable sizing per IEC 60364-5-52 — current-carrying capacity and
          voltage-drop verification, plus derating, short-circuit withstand,
          CPC sizing and lifecycle cost as subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Cable Sizing & Voltage Drop Calculator" standardsLine="IEC 60364-5-52 / IEC 60364-5-54" />
          <FeedbackButton calculatorName="Cable Sizing & Voltage Drop Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes an LV cable's cross-sectional area and checks its voltage drop against IEC 60364-5-52 \u2014 the core, most-used calculator in the suite, feeding conductor sizes into several other calculators (Solar PV, EV Charging, Energy Storage) via the same engine."
          standards={["IEC 60364-5-52 (electrical installations \u2014 selection and erection of wiring systems)", "IEC 60364-5-54 (earthing arrangements and protective conductors, for CPC sizing)"]}
          capabilities={["Recommends the smallest standard cable size (1.5-630mm\u00b2) that satisfies both ampacity and voltage-drop limits, from a load specified by kW+PF or a direct design current.", "Full sizing comparison table across every standard size, showing ampacity and voltage drop for each.", "Subscriber: motor-starting voltage drop, full derating (ambient, grouping, layering, spacing, soil resistivity, harmonics), adiabatic short-circuit withstand, CPC/earth sizing, and a lifecycle-cost optimizer."]}
          example={{ problem: "A 50kW, 415V, 3-phase load at 0.9 PF, copper conductors, PVC70 insulation, installation method C, 50m route length, 5% max voltage drop.", steps: ["Design current Ib = 50,000 / (\u221a3 \u00d7 415 \u00d7 0.9) \u2248 77.3A.", "Check each standard cable size's method-C ampacity against 77.3A, moving up until one satisfies it.", "For the smallest ampacity-satisfying size, compute voltage drop = (mV/A/m table value \u00d7 Ib \u00d7 length) / 1000, as a % of 415V.", "If that size's voltage drop exceeds 5%, move to the next larger standard size and recheck."], result: "25mm\u00b2 at 2.64% voltage drop \u2014 hand-checked against the live code and matched exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Circuit identification">
              <div className="col-span-2">
                <TextField label="Circuit label" value={input.label} onChange={(v) => update({ label: v })} placeholder="e.g. DB-3 Feeder" />
              </div>
            </Section>

            <Section title="Load & supply">
              <SelectField<SystemType>
                label="System"
                tip={"Whether this circuit is 3-phase, single-phase, or DC. Changes which design-current and voltage-drop formula is used \u2014 3-phase divides by \u221a3, single-phase and DC don't."} value={input.system}
                onChange={(v) => update({ system: v })}
                options={[
                  { value: "3ph", label: "3-Phase (+N+E)" },
                  { value: "1ph", label: "1-Phase (+N+E)" },
                  { value: "dc", label: "DC (2-wire)" },
                ]}
              />
              <NumberField label="Nominal voltage" hint="V, line-line for 3ph" unit="V" tip={"The system's nominal supply voltage. For 3-phase, enter the LINE-TO-LINE voltage (e.g. 400V or 415V), not phase voltage."} value={input.volt} onChange={(v) => update({ volt: v })} min={1} />
              <SelectField<LoadMethod>
                label="Load method"
                tip={"How you're specifying the load \u2014 by power (kW + PF), letting the app compute design current Ib, or directly by design current if you already have it."} value={input.loadMethod}
                onChange={(v) => update({ loadMethod: v })}
                options={[
                  { value: "kw", label: "By power (kW + PF)" },
                  { value: "amp", label: "By design current (A)" },
                ]}
              />
              <div />
              {input.loadMethod === "kw" ? (
                <>
                  <NumberField label="Load" unit="kW" tip={"The real power the circuit needs to deliver, used with Power Factor to compute design current Ib. Use the connected/demand load, not the installed nameplate total, unless deliberately sizing for worst case."} value={input.kw} onChange={(v) => update({ kw: v })} min={0.01} />
                  <NumberField label="Power factor" tip={"cos \u03c6 of the load \u2014 how much of the apparent power (kVA) is actually real power (kW). A lower PF means more current for the same kW, directly increasing design current and the required cable size."} value={input.pf} onChange={(v) => update({ pf: v })} min={0.1} max={1} step={0.01} />
                </>
              ) : (
                <div className="col-span-2">
                  <NumberField label="Design current Ib" unit="A" tip={"The current the cable actually has to carry continuously in normal service \u2014 the starting point for every check the calculator runs (ampacity, voltage drop, short-circuit)."} value={input.ib} onChange={(v) => update({ ib: v })} min={0.1} />
                </div>
              )}
              <div className="col-span-2 flex items-center justify-between rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
                <span className="text-muted">Design current Ib</span>
                <span className="font-semibold text-foreground">
                  {result.Ib ? `${result.Ib.toFixed(2)} A` : "—"}
                </span>
              </div>
            </Section>

            <Section title="Cable construction">
              <SelectField<ConductorMaterial>
                label="Conductor material"
                tip={"The conductor metal. Copper has roughly 60% the resistance of aluminium for the same cross-section, so a copper cable can be smaller for the same current \u2014 aluminium is lighter and often cheaper on larger sizes."} value={input.material}
                onChange={(v) => update({ material: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
              />
              <SelectField<InsulationType>
                label="Insulation"
                tip={"Sets the cable's maximum continuous conductor temperature, which both the ampacity tables and the short-circuit adiabatic k-factor are built around. Higher-temperature insulation carries more current in the same cross-section."} value={input.insulation}
                onChange={(v) => update({ insulation: v })}
                options={[
                  { value: "PVC70", label: "PVC (70°C)" },
                  { value: "XLPE90", label: "XLPE / EPR (90°C)" },
                ]}
              />
              <div className="col-span-2">
                <SelectField<InstallMethod>
                  label="Installation method"
                  hint="IEC 60364-5-52 ref. method"
                  tip={"How the cable is physically installed (IEC 60364-5-52 reference method) \u2014 how well it can shed heat depends entirely on what's around it, which changes how much current it can carry for the exact same cable size."} value={input.method}
                  onChange={(v) => update({ method: v })}
                  options={INSTALL_METHODS}
                />
              </div>
              <SelectField<CoreCount>
                label="Cores"
                tip={"How many current-carrying cores the cable has. A 4-core cable's ampacity assumes a loaded neutral (relevant with harmonic/unbalanced load); a 3-core assumes the neutral isn't separately loaded."} value={input.cores}
                onChange={(v) => update({ cores: v })}
                options={[
                  { value: "3", label: "3-core (3ph, no N loaded)" },
                  { value: "4", label: "4-core (3ph+N)" },
                  { value: "2", label: "2-core (1ph / DC)" },
                ]}
              />
              <NumberField label="Parallel runs per phase" tip={"How many identical cables run in parallel to share one phase's current, for currents too high for a single practical cable. The app divides the total design current equally across the runs and sizes ONE run \u2014 install that many per phase."} value={input.parallelRuns} onChange={(v) => update({ parallelRuns: v })} min={1} max={12} step={1} />
            </Section>

            <Section title="Route & length">
              <NumberField label="Route length" hint="one-way, metres" unit="m" tip={"The one-way cable run length from source to load \u2014 used for the voltage-drop calculation (which scales directly with length). Don't double it for the return path."} value={input.length} onChange={(v) => update({ length: v })} min={0.1} />
              <NumberField label="Max permitted volt-drop" unit="%" tip={"The maximum acceptable voltage drop over the full route, as a percentage of nominal voltage \u2014 a design limit YOU set from the applicable wiring regulation and the load's own tolerance."} value={input.maxVD} onChange={(v) => update({ maxVD: v })} min={0.5} max={10} step={0.1} />
            </Section>

            <PremiumSection
              title="Motor starting volt-drop"
              description="Checks transient starting-current voltage drop against the sized cable, in addition to steady-state."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2">
                <CheckboxField label="This feeds a motor" tip={"Turn on if this circuit feeds a motor and you want the calculator to ALSO check voltage drop during motor starting (current can be 6-8\u00d7 normal), not just steady-state running."} checked={input.motorFeed} onChange={(v) => update({ motorFeed: v })} />
              </div>
              <NumberField label="Starting current" unit="A" tip={"The motor's inrush/locked-rotor starting current, used only for the motor-starting volt-drop check \u2014 typically 6-8\u00d7 rated current for a direct-on-line start, less for soft-start/VFD."} value={input.startingCurrent} onChange={(v) => update({ startingCurrent: v })} />
              <NumberField label="Max permitted starting volt-drop" unit="%" tip={"The voltage-drop limit that applies specifically during motor starting \u2014 deliberately looser than the steady-state limit, since a brief larger dip while starting is normally acceptable."} value={input.maxStartVD} onChange={(v) => update({ maxStartVD: v })} />
            </PremiumSection>

            <PremiumSection
              title="Derating factors"
              description="Ambient/ground temperature, grouping, layering, spacing, soil thermal resistivity and harmonic derating."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Ambient / ground temperature" unit="°C" tip={"The reference temperature the cable actually operates in \u2014 air temperature for above-ground methods, or surrounding soil temperature if buried. Running hotter reduces safe current."} value={input.ambientC} onChange={(v) => update({ ambientC: v })} />
              <NumberField label="Grouping" hint="circuits touching/grouped" unit="ckts" tip={"How many current-carrying circuits are grouped together (touching, in the same conduit/tray/duct, close enough to affect each other's cooling). Each cable partly heats its neighbours, so a grouped cable carries less than the same cable running alone."} value={input.grouping} onChange={(v) => update({ grouping: v })} />
              <NumberField label="Number of layers" tip={"If cables are grouped AND stacked in more than one row/tier, the extra layers trap more heat than horizontal grouping alone accounts for. Leave at 1 if everything sits in a single row."} value={input.layers} onChange={(v) => update({ layers: v })} />
              <SelectField<SpacingType>
                label="Cable spacing"
                hint="methods E/F only"
                tip={"Only applies to installation methods E and F (free-air/trefoil). Cables with a gap between them shed heat far better than cables touching."} value={input.spacing}
                onChange={(v) => update({ spacing: v })}
                options={[
                  { value: "touching", label: "Touching / Trefoil" },
                  { value: "spaced", label: "Spaced (≥1 diameter apart)" },
                ]}
               
              />
              <NumberField label="Thermal resistivity of soil" hint="if buried" unit="K·m/W" tip={"Only relevant for buried installations \u2014 how well the surrounding soil conducts heat away from the cable. Higher resistivity means a worse heat conductor, so the cable carries less current for the same temperature rise."} value={input.soilRho} onChange={(v) => update({ soilRho: v })} />
              <NumberField label="Third harmonic content" unit="%" tip={"Non-linear loads (VFDs, UPS, LED drivers) inject triplen harmonics that add up (rather than cancel) in the neutral. Above roughly 33% this becomes severe enough that the cable is sized on the neutral current instead of the phase current."} value={input.harmonicPct} onChange={(v) => update({ harmonicPct: v })} />
            </PremiumSection>

            <PremiumSection
              title="Short-circuit withstand"
              description="Adiabatic short-circuit withstand check against prospective fault current and clearance time."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Prospective fault current" unit="kA" tip={"The maximum fault current this cable could see at its supply end \u2014 normally the three-phase bolted fault level from a short-circuit study. Used with fault clearance time to check the cable survives that fault thermally."} value={input.faultKA} onChange={(v) => update({ faultKA: v })} />
              <NumberField label="Fault clearance time" unit="s" tip={"How long the fault current actually flows before upstream protection clears it. A shorter clearing time lets a smaller cable survive the same fault current."} value={input.faultT} onChange={(v) => update({ faultT: v })} />
            </PremiumSection>

            <PremiumSection
              title="Protective conductor (CPC/earth)"
              description="Adiabatic and simplified-method (IEC 60364-5-54 Table 54.7) earth conductor sizing."
              unlocked={FREE_LAUNCH}
            >
              <SelectField<CpcType>
                label="CPC arrangement"
                tip={"How the protective earth conductor (CPC) is physically arranged relative to the phase conductors \u2014 affects its thermal behaviour under fault and which adiabatic k-factor applies."} value={input.cpcType}
                onChange={(v) => update({ cpcType: v })}
                options={[
                  { value: "incorporated", label: "Incorporated in same cable" },
                  { value: "separate", label: "Separate insulated conductor" },
                  { value: "bare", label: "Bare conductor" },
                ]}
               
              />
              <SelectField<CpcMaterialChoice>
                label="CPC material"
                tip={"The CPC's own conductor material for its adiabatic sizing \u2014 doesn't have to match the phase conductor material, though it commonly does."} value={input.cpcMaterialChoice}
                onChange={(v) => update({ cpcMaterialChoice: v })}
                options={[
                  { value: "same", label: "Same as phase conductor" },
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
               
              />
            </PremiumSection>

            <PremiumSection
              title="Cost & lifecycle optimizer"
              description="Compares capital cost against lifetime I²R energy losses to recommend the most economic compliant size, not just the smallest."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Cable cost" hint="per m per mm²" value={input.costPerMm2PerM} onChange={(v) => update({ costPerMm2PerM: v })} />
              <NumberField label="Energy cost" hint="per kWh" value={input.energyCostPerKwh} onChange={(v) => update({ energyCostPerKwh: v })} />
              <NumberField label="Operating hours" unit="h/yr" value={input.opHoursPerYear} onChange={(v) => update({ opHoursPerYear: v })} />
              <NumberField label="Lifecycle" unit="yrs" value={input.lifeYears} onChange={(v) => update({ lifeYears: v })} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <CableResults input={input} result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
