"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, CheckboxField } from "@/components/fields";
import { DEFAULT_MOTOR_INPUT, DeviceType, FeedRow, MotorInput, MotorPhase, MotorStandard, MotorType, StartMethod, calcMotor, hpOptions, voltageOptions } from "@/lib/motor";

export default function MotorCalculatorPage() {
  const [input, setInput] = useState<MotorInput>(DEFAULT_MOTOR_INPUT);
  const update = (patch: Partial<MotorInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const updateFeed = (i: number, patch: Partial<FeedRow>) => update({ feedRows: input.feedRows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) });

  const result = useMemo(() => calcMotor(input), [input]);

  const nec = input.standard === "nec";
  const hps = hpOptions(input.phase, input.type);
  const volts = voltageOptions(input.phase, input.type, input.hp);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Motor Calculator</h1>
        <p className="mt-2 max-w-2xl text-muted">
          NEC Article 430 (FLC tables, branch-circuit/OCPD/overload/disconnect
          sizing) or IEC general method — standalone, independent of any
          protection-relay motor tab.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Motor Calculator" standardsLine="NEC Article 430, IEC general method" />
          <FeedbackButton calculatorName="Motor Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="A standalone motor sizing calculator (independent of any protection-relay motor tab): NEC Article 430 or IEC general-method Full-Load Current, branch-circuit ampacity/OCPD/overload/disconnect sizing, a starting-method voltage-dip check against the source's short-circuit capacity, and NEC Part V multi-motor feeder sizing."
          standards={["NEC Article 430 (motors, motor circuits and controllers)", "NEC Table 430.248 (single-phase FLC)", "NEC Table 430.250 (three-phase FLC)", "NEC 430.52(C)(1) (branch-circuit OCPD percentages)", "NEC 430 Part V (feeder sizing)"]}
          capabilities={["NEC or IEC Full-Load Current, branch-circuit minimum ampacity, maximum OCPD, and overload protection setting.", "Starting-method-aware voltage-dip check (DOL/star-delta use LRA directly; soft-starter/VFD use a current-limit multiplier) against source short-circuit capacity.", "Multi-motor feeder sizing per NEC 430 Part V \u2014 largest motor's percentage plus the sum of all other motors' FLC."]}
          example={{ problem: "A 25HP, 460V, 3-phase squirrel-cage motor. Find its FLC, branch-circuit sizing, and DOL starting voltage dip at a 5,000kVA source.", steps: ["NEC Table 430.250 FLC for 25HP/460V squirrel-cage = 34A.", "Branch-circuit minimum ampacity = 125% \u00d7 34 = 42.5A.", "Overload/disconnect sizing = 115% \u00d7 34 = 39.1A.", "Max OCPD (dual-element time-delay fuse, 175%) = 175% \u00d7 34 = 59.5A, rounded up to the standard 60A size.", "DOL start at 180A LRA \u2192 starting kVA = \u221a3 \u00d7 460 \u00d7 180 / 1000 \u2248 143.414 kVA.", "Voltage dip = starting kVA / (starting kVA + source kVA) = 143.414 / (143.414 + 5000) \u2248 2.788%."], result: "FLC 34A, branch ampacity 42.5A, 60A max OCPD, 2.788% voltage dip (passes a 15% limit) \u2014 matches the calculator's default scenario exactly." }}
          notes="This calculator is entirely a subscriber feature in the source app; it's unlocked here for free during launch (see the banner at the top of the site for the current promo window)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="FLC & branch-circuit sizing">
              <SelectField<MotorStandard> label="Standard Basis" tip={"NEC Article 430 looks up Full-Load Current from standard tables (430.248/430.250) by HP/voltage; the IEC general method instead uses the motor's own nameplate current directly with a configurable design margin."} value={input.standard} onChange={(v) => update({ standard: v })} options={[
                { value: "nec", label: "NEC Article 430 (US)" },
                { value: "iec", label: "IEC general method" },
              ]} />
              <div />
              {nec ? (
                <>
                  <SelectField<MotorPhase> label="Phase" tip={"Single-phase motors use NEC Table 430.248 for Full-Load Current; three-phase motors use NEC Table 430.250 \u2014 separate tables because single- and three-phase motors of the same horsepower draw different current."} value={input.phase} onChange={(v) => update({ phase: v, hp: hpOptions(v, input.type)[0] })} options={[
                    { value: "1", label: "Single-Phase" },
                    { value: "3", label: "Three-Phase" },
                  ]} />
                  {input.phase === "3" && (
                    <SelectField<MotorType> label="Motor Type" tip={"Induction squirrel-cage, induction wound-rotor, and synchronous motors each have their own NEC 430.250 FLC column and their own NEC 430.52(C)(1) OCPD percentage row."} value={input.type} onChange={(v) => update({ type: v, hp: hpOptions(input.phase, v)[0] })} options={[
                      { value: "squirrel", label: "Induction — Squirrel-Cage" },
                      { value: "wound", label: "Induction — Wound-Rotor" },
                      { value: "sync", label: "Synchronous" },
                    ]} />
                  )}
                  <SelectField<string> label="Horsepower (HP)" tip={"Nameplate horsepower rating. NEC Tables 430.248/250 only tabulate specific standard HP values \u2014 this dropdown lists exactly those values; there's no NEC-sanctioned interpolation between them."} value={input.hp} onChange={(v) => update({ hp: v })} options={hps.map((h) => ({ value: h, label: `${h} HP` }))} />
                  <SelectField<number> label="Voltage" tip={"Nameplate rated voltage. Only voltages actually tabulated in NEC Table 430.248/250 for the selected horsepower are offered \u2014 large motors aren't built at low voltage, so some HP/voltage combinations don't exist in the table."} value={input.voltage} onChange={(v) => update({ voltage: v })} options={volts.map((v) => ({ value: v, label: `${v} V` }))} />
                  {input.phase === "3" && input.type === "sync" && (
                    <div className="col-span-2">
                      <SelectField<MotorInput["syncPf"]> label="Synchronous Motor Power Factor" tip={"NEC Table 430.250's synchronous-motor column is based on unity (100%) power factor. Per the table's own footnote, for a motor operated at 90% or 80% power factor, the tabulated FLC must be multiplied by 1.1 or 1.25 respectively."} value={input.syncPf} onChange={(v) => update({ syncPf: v })} options={[
                        { value: "100", label: "100% (unity) PF" },
                        { value: "90", label: "90% PF (×1.1)" },
                        { value: "80", label: "80% PF (×1.25)" },
                      ]} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <NumberField label="Nameplate FLC" unit="A" tip={"For the IEC/general method, the motor's nameplate rated current directly \u2014 IEC practice characterizes motors by nameplate current rather than a fixed HP-to-current lookup table."} value={input.nameplateFlc} onChange={(v) => update({ nameplateFlc: v })} min={0} />
                  <NumberField label="Design Margin Factor" tip={"IEC doesn't mandate a fixed 125%-style multiplier for motor circuits the way NEC 430.22 does. Enter your own project design margin (1.0 = no margin, size exactly to nameplate FLC; commonly 1.1-1.25) \u2014 then use the resulting design current in the Cable Sizing calculator."} value={input.iecMargin} onChange={(v) => update({ iecMargin: v })} min={1} step="any" />
                </>
              )}
              <SelectField<"no" | "yes"> label="SF≥1.15 or Temp Rise≤40°C?" tip={"Check the motor nameplate: a service factor of 1.15+ OR a marked temperature rise of 40\u00b0C or less allows the 125% overload multiplier (NEC 430.32(A)(1)); otherwise use the more conservative 115%."} value={input.sfHighTemp ? "yes" : "no"} onChange={(v) => update({ sfHighTemp: v === "yes" })} options={[
                { value: "no", label: "No (use 115%)" },
                { value: "yes", label: "Yes (use 125%)" },
              ]} />
              <SelectField<DeviceType> label="Protective Device Type" tip={"NEC Table 430.52(C)(1) gives a different maximum branch-circuit OCPD percentage of FLC for each device type \u2014 non-time-delay fuses need the least headroom, inverse-time breakers the most."} value={input.deviceType} onChange={(v) => update({ deviceType: v })} options={[
                { value: "ntd", label: "Non-Time-Delay Fuse" },
                { value: "td", label: "Time-Delay (Dual-Element) Fuse" },
                { value: "itb", label: "Inverse-Time Breaker" },
              ]} />
            </Section>

            <Section title="Starting method & voltage-dip check">
              <div className="col-span-2">
                <SelectField<StartMethod> label="Starting Method" tip={"Direct-On-Line draws full locked-rotor current at start; star-delta, soft-starters and VFDs all limit starting current below LRA by some factor, which is why they use a current-limit multiplier instead of a raw LRA value for the voltage-dip check."} value={input.startMethod} onChange={(v) => update({ startMethod: v })} options={[
                  { value: "dol", label: "Direct-On-Line (DOL)" },
                  { value: "stardelta", label: "Star-Delta" },
                  { value: "softstarter", label: "Soft-Starter" },
                  { value: "vfd", label: "VFD" },
                ]} />
              </div>
              {(input.startMethod === "dol" || input.startMethod === "stardelta") ? (
                <NumberField label="Locked-Rotor Current, LRA" unit="A" tip={"The current the motor draws at the instant of starting Direct-On-Line, before it comes up to speed \u2014 always several times FLC. Typical NEMA Design B / IEC standard-design squirrel-cage motors run roughly 5-8\u00d7 FLC, but always use the manufacturer's nameplate/datasheet value where available."} value={input.lra} onChange={(v) => update({ lra: v })} min={0} />
              ) : (
                <NumberField label="Current Limit Multiplier (×FLC)" tip={"For star-delta, soft-starter or VFD starts, the effective starting current as a multiple of FLC (rather than raw LRA) \u2014 from the specific starter/drive's current-limiting configuration."} value={input.currentLimitMult} onChange={(v) => update({ currentLimitMult: v })} min={0} step="any" />
              )}
              <NumberField label="System Voltage" unit="V" tip={"The line voltage at the point the motor connects \u2014 used to convert starting current into starting kVA for the voltage-dip calculation."} value={input.sysVoltage} onChange={(v) => update({ sysVoltage: v })} min={0} />
              <NumberField label="Source SC Capacity" unit="kVA" tip={"The available fault/short-circuit kVA of the supply at the point the motor connects (from a short-circuit study, or utility/transformer/generator source impedance) \u2014 a \"stiffer\" (higher-kVA) source dips less for the same motor starting kVA."} value={input.scCapacityKva} onChange={(v) => update({ scCapacityKva: v })} min={0} />
              <NumberField label="Max Allowable Voltage Dip" unit="%" tip={"The largest momentary voltage dip the source and other connected equipment can tolerate during this motor's start without contactors dropping out or sensitive loads misbehaving. A commonly used guideline is around 10-15%, but always check the ride-through spec of the most sensitive connected load."} value={input.maxDipPct} onChange={(v) => update({ maxDipPct: v })} min={0} />
            </Section>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-foreground">Multi-motor feeder sizing (NEC 430 Part V)</h3>
              <div className="mt-4 space-y-2">
                {input.feedRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1.5fr_1fr_0.8fr] items-end gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted">{i === 0 ? "Description" : ""}</label>
                      <input value={row.desc} onChange={(e) => updateFeed(i, { desc: e.target.value })} className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground" />
                    </div>
                    <NumberField label={i === 0 ? "FLC (A)" : ""} tip={i === 0 ? "The NEC table FLC (not nameplate current) for this motor — look it up in the section above for each motor, or from Table 430.248/250 directly." : undefined} value={row.flc} onChange={(v) => updateFeed(i, { flc: v })} min={0} />
                    <CheckboxField label="Wound-Rotor" tip="Affects which NEC 430.52(C)(1) percentage row applies to this motor if it's the largest in the group (150% flat, vs 300%/175%/250% for squirrel-cage/synchronous)." checked={row.wound} onChange={(v) => updateFeed(i, { wound: v })} />
                  </div>
                ))}
                <button type="button" onClick={() => update({ feedRows: [...input.feedRows, { desc: `Motor ${input.feedRows.length + 1}`, flc: null, wound: false }] })} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60">+ Add Motor</button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <SelectField<DeviceType> label="Feeder-Level Device Type" tip={"Which device type protects the largest motor's individual branch circuit \u2014 determines the percentage used for that one motor's contribution to the feeder OCPD calculation (NEC 430.62(A))."} value={input.feedDeviceType} onChange={(v) => update({ feedDeviceType: v })} options={[
                  { value: "ntd", label: "Non-Time-Delay Fuse" },
                  { value: "td", label: "Time-Delay (Dual-Element) Fuse" },
                  { value: "itb", label: "Inverse-Time Breaker" },
                ]} />
                <NumberField label="IEC Design Margin Factor" tip={"Same concept as the single-motor IEC margin factor, applied to the sum of all motor FLCs on this feeder."} value={input.feedIecMargin} onChange={(v) => update({ feedIecMargin: v })} min={1} step="any" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <ResultCard title="FLC & branch-circuit result">
                <ResultRow label="Full-Load Current (FLC)" value={result.flc != null ? `${result.flc.toFixed(1)} A` : "—"} />
                <ResultRow label="Branch-Circuit Min. Ampacity" value={result.branchAmpacityA != null ? `${result.branchAmpacityA.toFixed(1)} A` : "—"} />
                {result.maxOcpdA != null ? (
                  <ResultRow label="Max Branch-Circuit OCPD" value={`${result.maxOcpdA} A${result.maxOcpdExceptionA != null ? ` (or ${result.maxOcpdExceptionA} A under the 430.52(C)(1)(b) exception)` : ""}`} />
                ) : (
                  <ResultRow label="IEC Design Current" value={result.iecDesignA != null ? `${result.iecDesignA.toFixed(1)} A` : "—"} />
                )}
                <ResultRow label="Overload / Disconnect Setting" value={result.overloadA != null ? `${result.overloadA.toFixed(1)} A (disc. ${result.discA?.toFixed(1)} A)` : "—"} />
              </ResultCard>
              <ResultCard title="Starting & voltage-dip result">
                <ResultRow label="Effective Starting Current" value={result.startCurrentA != null ? `${result.startCurrentA.toFixed(1)} A` : "—"} />
                <ResultRow label="Starting kVA" value={result.startKva != null ? `${result.startKva.toFixed(2)} kVA` : "—"} />
                <CheckRow label="Calculated Voltage Dip" value={result.dipPct != null ? `${result.dipPct.toFixed(3)}% (limit ${input.maxDipPct}%)` : "—"} pass={result.dipPass} />
              </ResultCard>
              <ResultCard title="Multi-motor feeder result">
                {!result.feed ? (
                  <ResultRow label="Feeder sizing" value="Enter at least one motor's FLC in the table above." />
                ) : (
                  <>
                    <ResultRow label="Largest Motor" value={result.feed.largestDesc} />
                    <ResultRow label="Feeder Min. Ampacity" value={`${result.feed.ampacityA.toFixed(1)} A`} />
                    <ResultRow label="Feeder OCPD" value={result.feed.ocpdA != null ? `${result.feed.ocpdA} A` : result.feed.iecDesignA != null ? `${result.feed.iecDesignA.toFixed(1)} A (IEC design)` : "—"} />
                  </>
                )}
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
