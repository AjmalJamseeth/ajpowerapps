"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, CheckboxField } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import EvResults from "@/components/ev/EvResults";
import {
  DEFAULT_EV_INPUT,
  EvInput,
  EvMode,
  EvPhase,
  EvEarthing,
  EvRcdChoice,
  getModeNote,
  calcEv,
} from "@/lib/ev";
import { ConductorMaterial, InsulationType, InstallMethod, INSTALL_METHODS } from "@/lib/cable";

export default function EvChargingPage() {
  const [input, setInput] = useState<EvInput>(DEFAULT_EV_INPUT);
  const update = (patch: Partial<EvInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const onPhaseChange = (phase: EvPhase) => {
    update({ phase, voltage: phase === "3ph" ? 400 : 230 });
  };

  // Multi charge point site design (with diversity/LMS) is a subscriber
  // feature — never computed on the free site.
  const result = useMemo(() => calcEv(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          EV Charging Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 61851-1 · IEC 60364-7-722 · IEC 62955 — charge point
          cable/breaker/RCD sizing for a single point is free. Multi-point
          site demand with load management diversity is a subscriber
          feature.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="EV Charging Calculator" standardsLine="IEC 61851-1, IEC 60364-7-722, IEC 62955" />
          <FeedbackButton calculatorName="EV Charging Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes the cable, breaker and RCD protection for a single EV charge point per IEC 61851-1/60364-7-722/62955, with guidance on earthing-arrangement compatibility and the correct RCD type \u2014 plus subscriber-tier multi-point site demand aggregation with Load Management System diversity."
          standards={["IEC 61851-1 (electric vehicle conductive charging system \u2014 charging modes)", "IEC 60364-7-722 (electrical installations \u2014 supplies for electric vehicles)", "IEC 62955 (residual direct current detecting devices, RDC-DD)"]}
          capabilities={["Charging-mode guidance (Mode 1-4) with mode-specific notes and scope warnings.", "Cable sizing to a single charge point (ampacity + voltage drop) and recommended breaker from standard sizes.", "Earthing-arrangement guidance including the TN-C-S/PME PEN-conductor warning for the final circuit.", "RCD protection guidance (Type B vs. Type A/F + RDC-DD per IEC 62955).", "Subscriber: multi charge point site design \u2014 raw vs. diversified design current (IEC 60364-7-722.311 diversity rules, with or without an LMS) and recommended feeder cable size."]}
          example={{ problem: "A Mode 3, 32A, single-phase charge point, copper conductors, XLPE90 insulation, installation method C, 25m route length.", steps: ["Design current = EVSE rated current directly = 32A (unlike most loads, no power/PF derivation needed).", "Size the cable to satisfy both method-C ampacity at 32A and the 5% voltage-drop limit over 25m.", "Select the standard breaker size that protects the chosen cable."], result: "4mm\u00b2 cable at 3.811% voltage drop (within the 5% limit) with a 32A breaker \u2014 matches the calculator's default scenario exactly. The default 10-point multi-site scenario (no LMS, diversity=1) correctly sizes the feeder to 120mm\u00b2 at 1.995% VD for 320A raw/diversified current." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Charge point">
              <SelectField<EvMode>
                label="Charging mode"
                tip={"Which of the four IEC 61851-1 charging modes the installation uses \u2014 sets the maximum current/voltage envelope and what protective functions are already built into the charging equipment itself. Mode 3 (dedicated EVSE) is the standard method for home, workplace and public AC charging; Mode 4 (DC fast charging) is out of scope."} value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "mode1", label: "Mode 1 — Basic AC (≤16A, no comms)" },
                  { value: "mode2", label: "Mode 2 — AC + in-cable control box (≤32A)" },
                  { value: "mode3", label: "Mode 3 — Dedicated EVSE (16–63A)" },
                  { value: "mode4", label: "Mode 4 — DC Fast Charging (out of scope)" },
                ]}
              />
              <div />
              {getModeNote(input.mode) && (
                <div className="col-span-2 text-xs text-muted">{getModeNote(input.mode)}</div>
              )}
              <SelectField<EvPhase>
                label="Phase"
                tip={"Whether the charge point is fed single-phase or three-phase \u2014 sets the reference voltage and design-current formula, and limits maximum power at a given current (a 32A single-phase point delivers roughly a third of the power of a 32A three-phase one)."} value={input.phase}
                onChange={onPhaseChange}
                options={[
                  { value: "1ph", label: "Single-phase" },
                  { value: "3ph", label: "Three-phase" },
                ]}
              />
              <NumberField label="Voltage" unit="V" tip={"Line voltage at the charge point \u2014 230V for single-phase, 400V for three-phase in most IEC-standard countries. Auto-fills when you change phase, but can be overridden for non-standard system voltages."} value={input.voltage} onChange={(v) => update({ voltage: v })} min={100} />
              <NumberField label="EVSE rated current" unit="A" tip={"The charge point's own current rating, set by its internal control pilot circuit (IEC 61851) \u2014 the vehicle is instructed not to draw more than this, so unlike most loads in this suite, this IS the design current directly."} value={input.ratedCurrentA} onChange={(v) => update({ ratedCurrentA: v })} min={1} />
              <NumberField label="Power factor" tip={"EV onboard chargers present a near-unity displacement power factor under normal operation, but draw harmonic-rich current \u2014 this value is used only for the voltage-drop calculation, not a substitute for a full harmonics assessment on sites with many simultaneous chargers."} value={input.pf} onChange={(v) => update({ pf: v })} min={0.5} max={1} step={0.01} />
            </Section>

            <Section title="Cable & installation">
              <SelectField<ConductorMaterial>
                label="Conductor material"
                tip={"Copper or aluminium \u2014 changes both the base ampacity table looked up and the resistance used in the voltage-drop check."} value={input.material}
                onChange={(v) => update({ material: v })}
                options={[
                  { value: "Cu", label: "Copper" },
                  { value: "Al", label: "Aluminium" },
                ]}
              />
              <SelectField<InsulationType>
                label="Insulation"
                tip={"PVC (70\u00b0C) or XLPE/EPR (90\u00b0C) conductor rated operating temperature \u2014 XLPE/EPR permits higher continuous current for the same conductor size."} value={input.insulation}
                onChange={(v) => update({ insulation: v })}
                options={[
                  { value: "PVC70", label: "PVC (70°C)" },
                  { value: "XLPE90", label: "XLPE / EPR (90°C)" },
                ]}
              />
              <div className="col-span-2">
                <SelectField<InstallMethod>
                  label="Installation method"
                  tip={"The IEC 60364-5-52 reference installation method for the cable run from the distribution board to the charge point \u2014 same reference methods as the Cable Sizing calculator, driving which base ampacity table is looked up."} value={input.method}
                  onChange={(v) => update({ method: v })}
                  options={INSTALL_METHODS}
                />
              </div>
              <NumberField label="Route length" unit="m" tip={"One-way cable route length from the distribution board to the charge point \u2014 used for the voltage-drop check alongside the derated ampacity check; a long run can force a larger cable than ampacity alone would require."} value={input.routeLengthM} onChange={(v) => update({ routeLengthM: v })} min={0} />
              <NumberField label="Ambient temperature" unit="°C" tip={"Air temperature (or ground temperature if buried) around the cable route \u2014 higher ambient reduces the cable's derated current-carrying capacity."} value={input.ambientC} onChange={(v) => update({ ambientC: v })} min={-10} max={80} />
              <div className="col-span-2">
                <NumberField label="Grouping" hint="circuits run together" tip={"How many loaded circuits run together along this route (e.g. several charge point cables sharing one tray) \u2014 mutual heating between grouped circuits reduces each one's safe current versus running alone."} value={input.grouping} onChange={(v) => update({ grouping: v })} min={1} max={20} step={1} />
              </div>
              <div className="col-span-2 text-xs text-muted">Simplified sizing (ambient + grouping only). For buried runs, soil resistivity, or harmonic-heavy sites, cross-check in the full Cable Sizing calculator.</div>
            </Section>

            <Section title="Protection & earthing">
              <SelectField<EvEarthing>
                label="Earthing arrangement"
                tip={"The system earthing arrangement at the charge point. IEC 60364-7-722 requires the FINAL circuit to a charge point to be TN-S (no PEN conductor) even where the upstream network is TN-C-S (PME) \u2014 if your supply is TN-C-S, this circuit needs converting to TN-S plus open-PEN protection or a local earth electrode."} value={input.earthing}
                onChange={(v) => update({ earthing: v })}
                options={[
                  { value: "tns", label: "TN-S" },
                  { value: "tncs", label: "TN-C-S (PME)" },
                  { value: "tt", label: "TT" },
                  { value: "it", label: "IT" },
                ]}
              />
              <SelectField<EvRcdChoice>
                label="RCD protection"
                tip={"EV chargers can pass smooth DC leakage current that a standard Type AC or Type A RCD can't see \u2014 Type AC is prohibited outright. Two compliant options per IEC 62955: a Type B RCD alone, or a Type A/F RCD combined with a Residual DC Detecting Device (RDC-DD) that trips on \u22656mA smooth DC."} value={input.rcdChoice}
                onChange={(v) => update({ rcdChoice: v })}
                options={[
                  { value: "typeb", label: "Type B RCD" },
                  { value: "typea_rdcdd", label: "Type A/F RCD + RDC-DD (IEC 62955)" },
                ]}
              />
              <div className="col-span-2 text-xs text-muted">A dedicated circuit is required for each EV supply point — do not share the circuit with other loads.</div>
            </Section>

            <PremiumSection
              title="Multi charge point site"
              description="Aggregates multiple charge points into a diversified site design current and recommends a feeder size, per IEC 60364-7-722.311's diversity rules."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Number of charge points" tip={"How many charge points share this supply/feeder \u2014 the starting point for the site-level demand calculation before any diversity is applied."} value={input.numPoints} onChange={(v) => update({ numPoints: v })} />
              <NumberField label="Current per point" hint="defaults to EVSE rating" unit="A" tip={"The rated current of each individual charge point on the site (defaults to the single charge point rating entered above, but can be overridden if the site has a different standard unit)."} value={input.perPointCurrentA} onChange={(v) => update({ perPointCurrentA: v })} />
              <div className="col-span-2">
                <CheckboxField label="Load Management System (LMS) installed" tip={"Whether a Load Management System actively manages simultaneous charging demand across the site \u2014 required before any diversity factor below 100% can be applied per IEC 60364-7-722.311."} checked={input.hasLms} onChange={(v) => update({ hasLms: v })} />
              </div>
              <NumberField label="Declared diversity factor" tip={"The demand factor applied to the raw (points \u00d7 per-point current) total when an LMS is in place. IEC 60364-7-722 doesn't specify a numeric value \u2014 it must come from the LMS manufacturer's data or your local utility's accepted figure. Without an LMS, this is fixed at 1.0."} value={input.diversityFactor} onChange={(v) => update({ diversityFactor: v })} />
              <NumberField label="Feeder route length" unit="m" tip={"One-way route length of the site feeder serving all charge points \u2014 used for the site-level ampacity and voltage-drop check on the aggregated diversified current."} value={input.siteFeederLengthM} onChange={(v) => update({ siteFeederLengthM: v })} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <EvResults result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
