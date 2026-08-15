"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { ContactorDuty, DEFAULT_MOTORPROTECTION_INPUT, DUTY_CLASS_LABEL, DutyClass, GroundingSystem, MotorProtectionInput, calcMotorProtection } from "@/lib/motorprotection";

export default function MotorProtectionSizerPage() {
  const [input, setInput] = useState<MotorProtectionInput>(DEFAULT_MOTORPROTECTION_INPUT);
  const update = (patch: Partial<MotorProtectionInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcMotorProtection(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Motor Protection Sizer</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Overload relay setting &amp; trip class (NEC 430.32 / IEC
          60947-4-1), contactor sizing by AC-3/AC-4 utilization category,
          and ground-fault pickup guidance by system grounding type. Fully
          free — no subscriber gate. The ground-fault section is typical-
          practice guidance, not a substitute for a coordination study.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Motor Protection Sizer" standardsLine="NEC 430.32, IEC 60947-4-1, IEC 60034-1" />
          <FeedbackButton calculatorName="Motor Protection Sizer" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes the three protection elements around a motor starter \u2014 overload relay setting and IEC trip class, contactor utilization-category rating, and ground-fault pickup \u2014 from a single set of motor and system parameters. Companion to the standalone Motor Calculator (which sizes the branch circuit/OCPD) and the Circuit Breaker & Fuse Sizer's motor path."
          standards={["NEC 430.32(A)(1)", "IEC 60947-4-1 (trip classes, AC-3/AC-4)", "IEC 60034-1 (duty classes S1-S8)"]}
          capabilities={["Overload relay setting at 115% or 125% of FLA per NEC 430.32(A)(1), based on service factor/temperature rise.", "IEC 60947-4-1 trip class (10A/10/20/30) selected from the motor's accelerating time.", "AC-3 vs. AC-4 contactor sizing against a standard frame-size table.", "Ground-fault pickup guidance for solidly grounded, HRG and ungrounded systems.", "Flags cyclic/frequent-starting duty that calls for a thermal-memory relay."]}
          example={{ problem: "A motor with FLA=34A, service factor 1.0 (use 115%), starts in 8 seconds, is solidly grounded, and switched by a standard AC-3 contactor. Size its overload relay, trip class and ground-fault pickup.", steps: ["Overload setting = 115% \u00d7 34A = 39.1A (NEC 430.32(A)(1), since SF < 1.15).", "8s starting time falls in the IEC 60947-4-1 Class 10 band (\u226410s) \u2192 Trip Class 10.", "AC-3 contactor sized to FLA \u2192 recommended 40A standard frame.", "Ground-fault pickup (solidly grounded) = 20% \u00d7 FLA = 6.8A, above the 5A minimum floor."], result: "39.1A overload, Class 10, 40A AC-3 contactor, 6.8A ground-fault pickup \u2014 matches the calculator's default scenario exactly." }}
          notes="AC-4 duty roughly doubles the required contactor rating versus AC-3 for the same motor \u2014 a conservative rule-of-thumb, since there's no single universal AC-4:AC-3 ratio in the standard. The ground-fault guidance is typical practice, not a substitute for a protective-device coordination study."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Motor & overload relay">
              <NumberField label="Motor Full-Load Current (FLA)" unit="A" tip={"Motor's rated full-load current \u2014 the base value the overload relay setting, contactor sizing and ground-fault pickup are all calculated from."} value={input.motorFlaA} onChange={(v) => update({ motorFlaA: v })} min={0} />
              <SelectField<"no" | "yes"> label="SF≥1.15 or Temp Rise≤40°C?" tip={"NEC 430.32(A)(1) allows a 125% overload setting instead of the stricter 115% only for motors with a marked service factor \u22651.15 or a marked temperature rise \u226440\u00b0C."} value={input.sfHighTemp ? "yes" : "no"} onChange={(v) => update({ sfHighTemp: v === "yes" })} options={[
                { value: "no", label: "No (use 115%)" },
                { value: "yes", label: "Yes (use 125%)" },
              ]} />
              <NumberField label="Motor Accelerating (Starting) Time" unit="s" tip={"Time for the motor to accelerate to running speed. Longer starting times need a higher IEC 60947-4-1 trip class so the overload relay doesn't nuisance-trip during a normal start."} value={input.startingTimeS} onChange={(v) => update({ startingTimeS: v })} min={0} step="any" />
              <SelectField<DutyClass> label="Duty Class (IEC 60034-1)" tip={"IEC 60034-1 duty type (S1 continuous through S8 intermittent-with-variable-load) \u2014 informs whether the load profile is steady or cyclic, feeding into the thermal-memory recommendation."} value={input.dutyClass} onChange={(v) => update({ dutyClass: v })} options={(Object.keys(DUTY_CLASS_LABEL) as DutyClass[]).map((k) => ({ value: k, label: DUTY_CLASS_LABEL[k] }))} />
              <div className="col-span-2">
                <NumberField label="Starts per Hour" tip={"Frequent starts build up motor heat between starts faster than it can shed, which is why cyclic/frequent-starting duty needs a relay with thermal memory rather than a standard bimetallic overload."} value={input.startsPerHour} onChange={(v) => update({ startsPerHour: v })} min={0} step={1} />
              </div>
            </Section>

            <Section title="Contactor">
              <SelectField<ContactorDuty> label="Duty (IEC 60947-4-1)" tip={"IEC 60947-4-1 utilization category \u2014 AC-3 covers normal starting/stopping of running motors; AC-4 (jogging, plugging, reversing) repeatedly interrupts locked-rotor current, which is far harder on contacts and needs a larger frame for the same motor."} value={input.contactorDuty} onChange={(v) => update({ contactorDuty: v })} options={[
                { value: "ac3", label: "AC-3 — normal start/stop of squirrel-cage motors" },
                { value: "ac4", label: "AC-4 — jogging / plugging / reversing (severe)" },
              ]} />
            </Section>

            <Section title="Ground-fault protection">
              <SelectField<GroundingSystem> label="System Grounding" tip={"The system's earthing arrangement sets which ground-fault approach applies \u2014 solidly grounded systems use a percentage-of-FLA pickup, HRG systems use the resistor's charging current, ungrounded systems use a fixed sensitive pickup."} value={input.groundingSystem} onChange={(v) => update({ groundingSystem: v })} options={[
                { value: "solid", label: "Solidly / Low-Resistance Grounded" },
                { value: "hrg", label: "High-Resistance Grounded (HRG)" },
                { value: "ungrounded", label: "Ungrounded" },
              ]} />
              {input.groundingSystem === "hrg" && (
                <NumberField label="System Charging Current" unit="A" tip={"The HRG neutral resistor's rated charging current (from the NGR/NET datasheet, or the Generator & Transformer Analysis calculator's NGR tab) \u2014 the HRG ground-fault pickup is set as a multiple of this, not of motor FLA."} value={input.systemChargingCurrentA} onChange={(v) => update({ systemChargingCurrentA: v })} min={0} step="any" />
              )}
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result ? (
                <EmptyResult message="Enter the motor's full-load current (FLA) to see results." />
              ) : (
                <>
                  <ResultCard title="Overload relay">
                    <ResultRow label="Setting" value={`${result.overload.settingPct}% × FLA = ${result.overload.settingA.toFixed(1)} A`} />
                    <ResultRow label="Trip Class (IEC 60947-4-1)" value={`Class ${result.overload.tripClass}`} />
                    <ResultRow label="Thermal Memory Recommended" value={result.overload.needsThermalMemory ? "Yes — cyclic/frequent-starting duty" : "No — standard relay is adequate"} />
                  </ResultCard>
                  <ResultCard title="Contactor">
                    <ResultRow label="Required Equivalent Rating" value={`${result.contactor.requiredEquivalentA.toFixed(1)} A`} />
                    <ResultRow label="Recommended AC-3 Frame Size" value={`${result.contactor.recommendedSizeA} A`} />
                  </ResultCard>
                  <ResultCard title="Ground-fault protection (guidance)">
                    <ResultRow label="Pickup Setting" value={result.groundFault.pickupA !== null ? `${result.groundFault.pickupA.toFixed(1)} A` : "— enter charging current"} />
                    <ResultRow label="Time Delay" value={`${result.groundFault.timeDelayS}s`} />
                    <ResultRow label="Basis" value={<span className="text-xs">{result.groundFault.basis}</span>} />
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
