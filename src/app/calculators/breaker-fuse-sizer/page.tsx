"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { BfStandard, BreakerFuseInput, DEFAULT_BREAKERFUSE_INPUT, LoadKind, MotorCategory, NecMotorDevice, OcpdKind, calcBreakerFuseGeneral, calcBreakerFuseMotor } from "@/lib/breakerfuse";

export default function BreakerFuseSizerPage() {
  const [input, setInput] = useState<BreakerFuseInput>(DEFAULT_BREAKERFUSE_INPUT);
  const update = (patch: Partial<BreakerFuseInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const general = useMemo(() => calcBreakerFuseGeneral(input), [input]);
  const motor = useMemo(() => calcBreakerFuseMotor(input), [input]);
  const nec = input.standard === "nec";

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Circuit Breaker &amp; Fuse Sizer</h1>
        <p className="mt-2 max-w-2xl text-muted">
          General continuous/non-continuous load OCPD sizing (NEC
          210.19/215.2 + 240.4, or IEC 60364-4-43 Ib≤In≤Iz), or motor
          starting-current withstand sizing (NEC 430.52(C)(1) percentage
          method, cross-checked against the standalone Motor Calculator).
          Fully free — no subscriber gate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Circuit Breaker & Fuse Sizer" standardsLine="NEC 210.19/215.2/240.4/430.52, IEC 60364-4-43" />
          <FeedbackButton calculatorName="Circuit Breaker & Fuse Sizer" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes overcurrent protective devices (breakers/fuses) two ways: from a general continuous/non-continuous load current, or from a motor's starting-current withstand requirement. The general path checks the device protects the downstream cable; the motor path reuses the same NEC 430.52(C)(1) logic as the standalone Motor Calculator so the two tools always agree."
          standards={["NEC 210.19(A)(1) / 215.2(A)(1)", "NEC 240.4 / 240.4(B) / 240.6(A)", "NEC 430.52(C)(1) & 430.52(C)(1)(b)", "IEC 60364-4-43"]}
          capabilities={["General load OCPD sizing at 125% continuous + 100% non-continuous, rounded to the nearest NEC standard size.", "Checks the selected OCPD actually protects the cable, including the 240.4(B) next-size-up exception.", "IEC 60364-4-43 path with fuse-vs-breaker-specific conventional operating current (I\u2082).", "Motor starting-current withstand sizing by NEC device type or a configurable IEC margin factor, with the 430.52(C)(1)(b) exception ceiling shown separately."]}
          example={{ problem: "A feeder carries an 80A continuous load plus a 20A non-continuous load, protected by a cable rated 130A. What's the minimum standard OCPD, and does it protect the cable?", steps: ["Minimum OCPD = 125%\u00d7continuous + 100%\u00d7non-continuous = 1.25\u00d780 + 20 = 120A.", "Round up to the nearest NEC 240.6(A) standard size: 125A.", "Check against cable ampacity (240.4): 125A \u2264 130A cable ampacity, so the breaker protects the cable directly."], result: "125A breaker/fuse, cable protected \u2014 matches the calculator's default NEC scenario exactly." }}
          notes="On the IEC path, a fuse's higher conventional operating current (I\u2082=1.6\u00d7In) can fail the 1.45\u00d7Iz check on a tight cable even when an equivalent-rated breaker (I\u2082=1.45\u00d7In) passes \u2014 the calculator surfaces this device-type difference rather than treating breakers and fuses as interchangeable."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Basis">
              <SelectField<BfStandard> label="Standard Basis" tip={"NEC (US) uses the 125%/100% continuous/non-continuous method; IEC 60364-4-43 uses the Ib\u2264In\u2264Iz conventional-operating-current method \u2014 pick the framework your project follows."} value={input.standard} onChange={(v) => update({ standard: v })} options={[
                { value: "nec", label: "NEC (US)" },
                { value: "iec", label: "IEC 60364-4-43 (International)" },
              ]} />
              <SelectField<LoadKind> label="Load Kind" tip={"General/continuous load sizes the OCPD from the circuit's steady-state current; Motor sizes it from the motor's starting-current withstand requirement instead \u2014 a very different, usually much higher, rating."} value={input.loadKind} onChange={(v) => update({ loadKind: v })} options={[
                { value: "general", label: "General / Continuous Load" },
                { value: "motor", label: "Motor (starting-current withstand)" },
              ]} />
            </Section>

            {input.loadKind === "general" ? (
              <Section title="Continuous / non-continuous load">
                <NumberField label="Continuous Load Current (runs ≥3h)" unit="A" tip={"Current that flows continuously for 3 hours or more. NEC 210.19(A)(1)/215.2(A)(1) requires the OCPD to be sized at 125% of this current, not 100%."} value={input.continuousA} onChange={(v) => update({ continuousA: v })} min={0} />
                <NumberField label="Non-Continuous Load Current" unit="A" tip={"Current that doesn't run for 3+ hours at a stretch. Sized at 100% \u2014 no continuous-duty margin applies."} value={input.nonContinuousA} onChange={(v) => update({ nonContinuousA: v })} min={0} />
                <NumberField label="Cable Ampacity (Iz)" unit="A" tip={"The ampacity (Iz) of the cable this device protects \u2014 checked against the OCPD rating per NEC 240.4 or IEC's Ib\u2264In\u2264Iz."} value={input.cableAmpacityA} onChange={(v) => update({ cableAmpacityA: v })} min={0} />
                {!nec && (
                  <SelectField<OcpdKind> label="Device Type" tip={"Fuses and breakers have different conventional operating currents (I\u2082) in IEC 60364-4-43 \u2014 1.6\u00d7In for fuses vs. 1.45\u00d7In for breakers \u2014 so the same rated size can pass for one device type and fail for the other on a tight cable."} value={input.ocpdKind} onChange={(v) => update({ ocpdKind: v })} options={[
                    { value: "breaker", label: "Circuit Breaker (I₂=1.45×In)" },
                    { value: "fuse", label: "Fuse (I₂=1.6×In)" },
                  ]} />
                )}
              </Section>
            ) : (
              <Section title="Motor starting current">
                <NumberField label="Motor Full-Load Current (FLA)" unit="A" tip={"The motor's rated full-load current (nameplate or NEC Table 430.250/430.248) \u2014 the base value both the NEC percentage method and IEC design current are built from."} value={input.motorFlaA} onChange={(v) => update({ motorFlaA: v })} min={0} />
                {nec ? (
                  <>
                    <SelectField<MotorCategory> label="Motor Category" tip={"Wound-rotor motors get a lower NEC 430.52(C)(1) starting-current percentage than squirrel-cage/synchronous motors, since their rotor resistance already limits inrush at start."} value={input.motorCategory} onChange={(v) => update({ motorCategory: v })} options={[
                      { value: "other", label: "Squirrel-Cage / Synchronous / 1-Phase" },
                      { value: "wound", label: "Wound-Rotor Induction" },
                    ]} />
                    <SelectField<NecMotorDevice> label="Protective Device Type" tip={"NEC Table 430.52(C)(1) gives a different maximum OCPD percentage of FLA for each device type \u2014 non-time-delay fuses need the least headroom, inverse-time breakers the most."} value={input.necMotorDevice} onChange={(v) => update({ necMotorDevice: v })} options={[
                      { value: "ntd", label: "Non-Time-Delay Fuse" },
                      { value: "td", label: "Time-Delay (Dual-Element) Fuse" },
                      { value: "itb", label: "Inverse-Time Breaker" },
                    ]} />
                  </>
                ) : (
                  <NumberField label="Design Margin Factor" tip={"Multiplier applied to FLA to size the device for motor starting current under the IEC general method \u2014 set from the motor's known starting-current ratio (e.g. a DOL start is commonly 6-8\u00d7FLC)."} value={input.iecMarginFactor} onChange={(v) => update({ iecMarginFactor: v })} min={1} step="any" />
                )}
              </Section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {input.loadKind === "general" ? (
                !general ? (
                  <EmptyResult message="Enter continuous and/or non-continuous load current to see results." />
                ) : (
                  <ResultCard title="General load OCPD">
                    <ResultRow label="Minimum OCPD (125%×cont. + 100%×non-cont.)" value={`${general.minOcpdA.toFixed(1)} A`} />
                    <ResultRow label="Recommended Standard Size" value={`${general.recommendedOcpdA} A`} />
                    {nec ? (
                      <CheckRow label="Conductor Protection (240.4)" value={general.via240_4B ? "passes via 240.4(B) next-size-up exception" : "—"} pass={general.cableProtected} />
                    ) : (
                      <>
                        <ResultRow label="Conventional Operating Current (I₂)" value={general.i2A !== null ? `${general.i2A.toFixed(1)} A` : "—"} />
                        <CheckRow label="Ib ≤ In ≤ Iz and I₂ ≤ 1.45×Iz" value="" pass={general.cableProtected} />
                      </>
                    )}
                  </ResultCard>
                )
              ) : !motor ? (
                <EmptyResult message="Enter the motor's full-load current (FLA) to see results." />
              ) : (
                <ResultCard title="Motor starting-current OCPD">
                  <ResultRow label={nec ? "Minimum OCPD (% × FLA)" : "IEC Design Current"} value={`${motor.minOcpdA.toFixed(1)} A`} />
                  {nec ? (
                    <>
                      <ResultRow label="Recommended Standard Size" value={`${motor.recommendedOcpdA} A`} />
                      <ResultRow label="430.52(C)(1)(b) Exception Ceiling" value={`${motor.exceptionCeilingA} A (only if standard sizing can't start the motor)`} />
                    </>
                  ) : (
                    <ResultRow label="Use in device/contactor selection" value={`${motor.iecDesignA?.toFixed(1)} A`} />
                  )}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
