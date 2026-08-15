"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, CheckboxField } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import ItemListEditor from "@/components/ItemListEditor";
import VtResults from "@/components/vt/VtResults";
import {
  DEFAULT_VT_INPUT,
  VtInput,
  VtConnection,
  VtEarthing,
  calcVt,
} from "@/lib/vt";

export default function VtSizingPage() {
  const [input, setInput] = useState<VtInput>(DEFAULT_VT_INPUT);
  const update = (patch: Partial<VtInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Protection class limits, rated thermal limiting output and open-delta
  // residual voltage are subscriber features — never computed on the free site.
  const result = useMemo(() => calcVt(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          VT Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 61869-3 voltage transformer ratio, rated voltage factor by
          system earthing, itemized burden against standard rated outputs,
          and secondary lead voltage drop. Protection accuracy classes,
          rated thermal limiting output and open-delta residual voltage
          are subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="VT Sizing Calculator" standardsLine="IEC 61869-3" />
          <FeedbackButton calculatorName="VT Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a voltage transformer (VT): rated voltage factor by system earthing, turns ratio, and itemized secondary burden checked against standard rated outputs and the accuracy-guarantee range \u2014 plus subscriber-tier protection accuracy class limits, thermal limiting output, and open-delta residual voltage estimation."
          standards={["IEC 61869-3 (inductive voltage transformers)"]}
          capabilities={["Rated voltage factor (Vf) selection by connection type and network earthing system.", "Turns ratio and rated primary/secondary voltage.", "Itemized secondary burden checked against standard rated VA sizes (10-500VA) and the 25-100%-of-rated-output accuracy-guarantee range.", "Secondary lead voltage drop to a remote instrument or relay panel.", "Subscriber: protection accuracy class (3P/6P) limits, rated thermal limiting output check, and open-delta residual voltage estimate."]}
          example={{ problem: "An 11kV system, phase-to-earth VT, 110V rated secondary, connected to an 8VA burden.", steps: ["Rated primary voltage Up = 11kV / \u221a3 = 6.351kV.", "Rated secondary voltage Us = 110V / \u221a3 = 63.51V (phase-to-earth convention).", "Turns ratio = Up / Us = 100.0 (independent of the \u221a3 division, since it cancels between line-to-line and phase-to-earth VTs on the same system).", "8VA connected burden rounds up to the nearest standard 10VA rated output \u2192 80% loaded, within the 25-100% accuracy-guaranteed range."], result: "Up = 6.351kV, Us = 63.51V, ratio = 100.0, 10VA recommended standard size at 80% loading \u2014 hand-checked and matched the live code exactly." }}
          notes="Built from scratch \u2014 no equivalent module exists in the source app. Two simplifications: the secondary lead voltage-drop calculation ignores burden power factor, and the open-delta residual voltage figure (3\u00d7 phase-earth secondary voltage) is a theoretical estimate \u2014 actual broken-delta winding ratios are manufacturer-specific."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Connection & system earthing">
              <SelectField<VtConnection>
                label="VT connection"
                tip={"Phase-to-earth VTs measure line-to-neutral voltage and are affected by the network earthing system's rated voltage factor; phase-to-phase VTs measure line-to-line voltage directly and aren't subject to that earthing-dependent factor."} value={input.connection}
                onChange={(v) => update({ connection: v })}
                options={[
                  { value: "phase-earth", label: "Phase-to-earth (line-to-neutral)" },
                  { value: "phase-phase", label: "Phase-to-phase (line-to-line)" },
                ]}
              />
              {input.connection === "phase-earth" && (
                <SelectField<VtEarthing>
                  label="Network earthing system"
                  tip={"Sets the IEC 61869-3 rated voltage factor (Vf) and its rated duration for a phase-to-earth VT \u2014 an unearthed or resonant-earthed system can see much higher sustained voltage on healthy phases during an earth fault than a solidly earthed one, so the VT must be rated to survive it."} value={input.earthing}
                  onChange={(v) => update({ earthing: v })}
                  options={[
                    { value: "directEarthed", label: "Directly / effectively earthed neutral" },
                    { value: "resistanceAutoClear", label: "Resistance-earthed, with automatic clearance" },
                    { value: "noAutoClear", label: "Earthed neutral, no automatic clearance" },
                    { value: "petersenNoAutoClear", label: "Petersen coil (resonant), no automatic clearance" },
                  ]}
                />
              )}
              <NumberField label="Nominal system voltage" hint="line-to-line" unit="kV" tip={"Nominal line-to-line system voltage \u2014 the basis for the VT's primary rating and turns ratio."} value={input.primaryLineKv} onChange={(v) => update({ primaryLineKv: v })} min={0.1} />
              <SelectField<100 | 110>
                label="Rated secondary voltage"
                hint="line value convention"
                tip={"Standard rated secondary voltage convention \u2014 110V is the more common IEC convention (100V for some regional practices); both refer to the LINE value regardless of connection type."} value={input.secondaryV}
                onChange={(v) => update({ secondaryV: v })}
                options={[
                  { value: 100, label: "100 V" },
                  { value: 110, label: "110 V" },
                ]}
              />
              <SelectField<"0.1" | "0.2" | "0.5" | "1" | "3">
                label="Accuracy class"
                tip={"IEC 61869-3 metering accuracy class, guaranteed within the 80-120% voltage / 25-100% burden range \u2014 0.1-0.2 for precision/laboratory metering, 0.5-1.0 for usual industrial metering, 3.0 for indication only."} value={input.accuracyClass}
                onChange={(v) => update({ accuracyClass: v })}
                options={[
                  { value: "0.1", label: "0.1 — laboratory reference" },
                  { value: "0.2", label: "0.2 — precision metering" },
                  { value: "0.5", label: "0.5 — usual metering" },
                  { value: "1", label: "1.0 — statistical/industrial metering" },
                  { value: "3", label: "3.0 — indication only" },
                ]}
              />
            </Section>

            <Section title="Secondary burden">
              <div className="col-span-2 text-xs text-muted">
                Every meter, relay or indicating instrument on the VT
                secondary contributes its own VA at rated secondary voltage.
              </div>
              <ItemListEditor
                items={input.burdenItems}
                onChange={(items) => update({ burdenItems: items })}
                addLabel="Device"
              />
              <NumberField label="Rated output override" hint="0 = auto-pick" unit="VA" tip={"Override the auto-selected standard rated burden size (from IEC 61869-3's standard VA values) if you need to force a specific one. Leave at 0 to let the calculator pick the smallest standard size that comfortably covers the connected burden."} value={input.ratedOutputVa} onChange={(v) => update({ ratedOutputVa: v })} min={0} />
            </Section>

            <Section title="Secondary leads (to instrument/relay panel)">
              <NumberField label="Lead length" unit="m" tip={"One-way length of the secondary cable from the VT to the instrument/relay panel \u2014 used for the secondary lead voltage-drop calculation."} value={input.leadL} onChange={(v) => update({ leadL: v })} min={0} />
              <NumberField label="Lead conductor CSA" unit="mm²" tip={"Conductor size of the secondary lead wiring \u2014 a larger cross-section reduces lead voltage drop for long runs."} value={input.leadA} onChange={(v) => update({ leadA: v })} min={0.5} />
              <SelectField<1 | 2>
                label="Lead return factor"
                hint="2 = go-and-return loop"
                tip={"2 means a dedicated return wire runs the full length (full round-trip resistance counts); 1 means a shared/common return conductor (only the 'go' length is attributed)."} value={input.leadReturnFactor}
                onChange={(v) => update({ leadReturnFactor: v })}
                options={[
                  { value: 1, label: "1 — shared/common return" },
                  { value: 2, label: "2 — go-and-return loop" },
                ]}
              />
            </Section>

            <PremiumSection
              title="Protection accuracy class (3P / 6P)"
              description="Shows the IEC 61869-3 voltage-error and phase-displacement limits for protection VTs, evaluated at 5% of rated voltage and at rated voltage × Vf."
              unlocked={FREE_LAUNCH}
            >
              <SelectField<"" | "3P" | "6P">
                label="Protection class"
                tip={"IEC 61869-3 protection accuracy class \u2014 3P or 6P \u2014 evaluated at 5% of rated voltage (to confirm accuracy at low fault-residual voltage) and at rated voltage \u00d7 Vf (to confirm accuracy doesn't collapse at the VT's maximum sustained voltage)."} value={input.protectionClass}
                onChange={(v) => update({ protectionClass: v })}
                options={[
                  { value: "", label: "None" },
                  { value: "3P", label: "3P" },
                  { value: "6P", label: "6P" },
                ]}
               
              />
            </PremiumSection>

            <PremiumSection
              title="Rated thermal limiting output"
              description="Checks the connected burden against the VT's rated thermal limiting output — the maximum it can carry continuously without overheating, which is typically higher than the rated accuracy VA."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Rated thermal limiting output" unit="VA" tip={"The maximum burden the VT can carry continuously without overheating \u2014 typically higher than its rated accuracy VA, since accuracy degrades before thermal damage occurs."} value={input.thermalLimitVa} onChange={(v) => update({ thermalLimitVa: v })} />
            </PremiumSection>

            <PremiumSection
              title="Open-delta (broken-delta) residual voltage"
              description="Estimates the theoretical residual voltage available for earth-fault detection from a broken-delta secondary winding under a full single-phase-to-earth fault."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2">
                <CheckboxField label="Enable open-delta residual voltage winding" tip={"A broken-delta (open-delta) tertiary winding sums the three phase-to-earth secondary voltages, which cancel to near-zero in normal balanced operation but produce a large residual voltage during an earth fault \u2014 used for sensitive earth-fault detection."} checked={input.openDeltaEnabled} onChange={(v) => update({ openDeltaEnabled: v })} />
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <VtResults input={input} result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
