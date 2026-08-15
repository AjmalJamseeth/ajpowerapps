"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, TextField, Section } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import ItemListEditor from "@/components/ItemListEditor";
import CtResults from "@/components/ct/CtResults";
import { DEFAULT_CT_INPUT, CtInput, calcCt } from "@/lib/ct";

export default function CtSizingPage() {
  const [input, setInput] = useState<CtInput>(DEFAULT_CT_INPUT);
  const update = (patch: Partial<CtInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const [tapsText, setTapsText] = useState(DEFAULT_CT_INPUT.taps.join(", "));

  // Saturation, thermal/mechanical, metering class, multi-ratio taps and
  // REF/differential matching are subscriber features — never computed on
  // the free site.
  const result = useMemo(() => calcCt(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          CT Sizing &amp; Saturation Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 61869-2 current transformer ratio, itemized burden and
          accuracy-limit-factor (ALF) / knee-point voltage (Vk) check.
          Saturation and transient analysis, metering accuracy class,
          thermal &amp; mechanical withstand, multi-ratio taps and
          REF/differential ratio matching are subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="CT Sizing & Saturation Calculator" standardsLine="IEC 61869-2" />
          <FeedbackButton calculatorName="CT Sizing & Saturation Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a protection current transformer (CT): ratio, itemized secondary burden, and the accuracy-limit-factor/knee-point-voltage check that confirms the CT won't saturate before delivering the accuracy a protection relay needs \u2014 plus subscriber-tier saturation/transient, metering-class, thermal/mechanical withstand, multi-ratio-tap and REF/differential ratio-matching checks."
          standards={["IEC 61869-2 (current transformers)"]}
          capabilities={["CT ratio (Ip/Is), itemized secondary burden (relay/meter/instrument devices summed with lead resistance), and total burden Rb.", "Required Vk (from ALF, rated secondary current and total burden) vs. actual Vk, with a pass/fail verdict.", "Fault-current table (primary/secondary current at 0.2\u00d7-50\u00d7 rated primary current).", "Subscriber: saturation & transient analysis, metering accuracy class limits, thermal & mechanical withstand, multi-ratio tap analysis, and REF/differential CT ratio matching."]}
          example={{ problem: "A 400/1A CT feeds a 2.5VA relay over a 20m run of 2.5mm\u00b2 lead wire, with a go-and-return loop, and needs ALF 20.", steps: ["Lead resistance from cable length, cross-section and return factor.", "Total burden resistance Rb = relay burden resistance + CT winding resistance (Rct) + lead resistance.", "Required Vk = ALF \u00d7 rated secondary current \u00d7 Rb."], result: "Rb = 2.78\u03a9, Vk required = 105.6V at ALF=20 \u2014 hand-checked and matched the live code exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="CT ratio & rating">
              <NumberField label="Rated primary current Ip" unit="A" tip={"The current flowing in the primary conductor the CT is wound onto or clamped around \u2014 normally the rated full-load current of the circuit being monitored. This is the numerator of the CT ratio."} value={input.ip} onChange={(v) => update({ ip: v })} min={1} />
              <SelectField<1 | 5>
                label="Rated secondary current Is"
                tip={"The CT's standard rated secondary current \u2014 almost always 1A or 5A. 1A needs far less lead resistance/VA to drive the same signal over a long secondary cable run; 5A is fine for short leads to a nearby panel."} value={input.is}
                onChange={(v) => update({ is: v })}
                options={[
                  { value: 1, label: "1 A" },
                  { value: 5, label: "5 A" },
                ]}
              />
              <NumberField label="Required accuracy limit factor" hint="ALF" tip={"How many times rated current the CT must stay within its accuracy class \u2014 a 5P20 CT is guaranteed \u22645% error up to 20\u00d7 rated current. Set it to comfortably exceed the maximum fault current referred to the secondary."} value={input.alfRated} onChange={(v) => update({ alfRated: v })} min={1} />
              <NumberField label="Knee-point voltage Vk" hint="0 if unknown" unit="V" tip={"The secondary EMF at which the CT core starts to saturate. IEC defines it as the point where a 10% increase in applied voltage produces a 50% increase in exciting current. Leave 0 if unknown \u2014 the app compares against required Vk from your other inputs."} value={input.vk} onChange={(v) => update({ vk: v })} min={0} />
              <NumberField label="Secondary winding resistance Rct" unit="Ω" tip={"The DC resistance of the CT's own secondary winding, normally quoted at 75\u00b0C on the test certificate \u2014 adds directly to the external burden in the Vk-required calculation, typically 0.1-5\u03a9 depending on CT size."} value={input.rct} onChange={(v) => update({ rct: v })} min={0} />
            </Section>

            <Section title="Secondary burden">
              <div className="col-span-2 text-xs text-muted">
                Every relay, meter or indicating instrument sharing the CT
                secondary circuit contributes its own VA at rated Is — they
                sum since they sit in series on the same loop.
              </div>
              <ItemListEditor
                items={input.burdenItems}
                onChange={(items) => update({ burdenItems: items })}
                addLabel="Device"
              />
              <NumberField label="Lead (cable) length" unit="m" tip={"Distance from the CT terminals to the connected devices. Combined with cross-section and return-path wiring, this sets how much resistance the CT's own wiring adds to total burden."} value={input.cableL} onChange={(v) => update({ cableL: v })} min={0} />
              <NumberField label="Lead conductor CSA" unit="mm²" tip={"Conductor size of the CT secondary wiring. A larger cross-section gives lower resistance per metre, reducing the cable's contribution to burden \u2014 worth increasing on long lead runs."} value={input.cableA} onChange={(v) => update({ cableA: v })} min={0.5} />
              <SelectField<1 | 2>
                label="Lead return factor"
                hint="2 = go-and-return loop"
                tip={"How the CT secondary's return conductor is wired back \u2014 2 means a dedicated return wire runs the full length (full round-trip resistance counts); 1 means several CTs share one common return conductor (only the 'go' length is attributed per CT)."} value={input.returnFactor}
                onChange={(v) => update({ returnFactor: v })}
                options={[
                  { value: 1, label: "1 — shared/common return" },
                  { value: 2, label: "2 — go-and-return loop" },
                ]}
              />
            </Section>

            <PremiumSection
              title="Saturation & transient analysis"
              description="Checks whether the CT saturates before the relay's fault-clearing time, using the X/R-derived time constant and transient dimensioning factor Ktd."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Fault current If" unit="kA" tip={"The maximum fault current (primary side) this CT could see for a fault the scheme must clear correctly. Used for the transient saturation check, which includes the fault's DC-offset content."} value={input.ifKa} onChange={(v) => update({ ifKa: v })} />
              <NumberField label="System X/R ratio" tip={"Ratio of reactance to resistance of the fault path at this point. A higher X/R means the fault current's DC offset decays more slowly, demanding more from the CT core during the first cycles."} value={input.xr} onChange={(v) => update({ xr: v })} />
              <NumberField label="Fault clearance time tf" unit="s" tip={"How long the fault current actually flows before protection clears it \u2014 used to check whether the CT saturates before the relay would have already tripped anyway."} value={input.tf} onChange={(v) => update({ tf: v })} />
            </PremiumSection>

            <PremiumSection
              title="Metering accuracy class"
              description="Shows the IEC 61869-2 ratio-error and phase-displacement limits for the selected metering class across the 5–120% current range."
              unlocked={FREE_LAUNCH}
            >
              <SelectField<"" | "0.1" | "0.2" | "0.5" | "1" | "3" | "5">
                label="Metering class"
                tip={"IEC 61869-2 metering accuracy class \u2014 0.1/0.2 for precision/laboratory metering, 0.5-1.0 for usual industrial/statistical metering, evaluated at 25-100% of rated burden rather than at high current multiples."} value={input.meterClass}
                onChange={(v) => update({ meterClass: v })}
                options={[
                  { value: "0.1", label: "0.1" },
                  { value: "0.2", label: "0.2" },
                  { value: "0.5", label: "0.5" },
                  { value: "1", label: "1.0" },
                  { value: "3", label: "3.0" },
                  { value: "5", label: "5.0" },
                ]}
               
              />
            </PremiumSection>

            <PremiumSection
              title="Thermal & mechanical withstand"
              description="Adiabatic-scales the rated short-time thermal current to the actual fault duration, and checks the peak asymmetrical current against the rated dynamic withstand."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Rated short-time thermal current Ith" unit="kA" tip={"Rated short-time thermal current \u2014 the RMS symmetrical current the CT can withstand for its rated time (typically 1s) without thermal damage."} value={input.ith} onChange={(v) => update({ ith: v })} />
              <NumberField label="Rated time for Ith" unit="s" tip={"The rated duration for the short-time thermal current above \u2014 usually 1 second on the nameplate; the actual fault duration is adiabatically scaled against this."} value={input.ithT} onChange={(v) => update({ ithT: v })} />
              <NumberField label="Rated dynamic withstand Idyn" hint="0 = 2.5×Ith" unit="kA" tip={"Rated dynamic (peak) withstand current \u2014 the mechanical force limit under asymmetrical fault current. Leave 0 to use the common approximation Idyn = 2.5\u00d7Ith."} value={input.idyn} onChange={(v) => update({ idyn: v })} />
            </PremiumSection>

            <PremiumSection
              title="Multi-ratio tap selection"
              description="Evaluates every available tap against the required ALF, using Vk scaled proportionally to the tap ratio, and recommends the highest tap that still meets the requirement."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2">
                <TextField label="Available tap primary currents" value={tapsText} onChange={setTapsText} placeholder="e.g. 400, 300, 200" />
              </div>
            </PremiumSection>

            <PremiumSection
              title="REF / differential ratio matching"
              description="Every CT in a REF or differential scheme must share the same ratio — a mismatch produces spill current under normal load or an external through-fault, which can cause a false trip."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Check current" hint="A primary" unit="A" tip={"The primary current level at which to evaluate ratio-matching spill current between CTs in a REF or differential scheme \u2014 commonly checked at both normal load current and a through-fault level."} value={input.matchCheckI} onChange={(v) => update({ matchCheckI: v })} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <CtResults input={input} result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
