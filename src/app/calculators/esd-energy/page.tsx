"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_ESD_ENERGY_INPUT, EsdEnergyInput, GasGroupEsd, calcEsdEnergy } from "@/lib/esdenergy";

export default function EsdEnergyPage() {
  const [input, setInput] = useState<EsdEnergyInput>(DEFAULT_ESD_ENERGY_INPUT);
  const update = (patch: Partial<EsdEnergyInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcEsdEnergy(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Electrostatic Discharge Spark Energy Check
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Computes the capacitive discharge energy of an isolated conductive
          part and compares it against the atmosphere&apos;s Minimum Ignition
          Energy (MIE).
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Electrostatic Discharge Spark Energy Check" standardsLine="IEC 60079-32-1 electrostatic hazard screening" />
          <FeedbackButton calculatorName="Electrostatic Discharge Spark Energy Check" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Screens the ignition risk of a spark discharge from an isolated conductive part (e.g. an ungrounded metal fitting, a person, a plastic container with an induced charge) by computing its stored capacitive discharge energy and comparing it against the surrounding atmosphere's Minimum Ignition Energy (MIE) — the standard first-pass electrostatic hazard check referenced by IEC 60079-32-1."
            standards={["IEC 60079-32-1 (electrostatic hazards, protection and equipment in hazardous areas) — screening method basis", "IEC 60079-20-1 (material characteristics, incl. MIE, for gases/vapors) — the source for substance-specific MIE data, entered by the user"]}
            capabilities={[
              "Capacitive discharge energy: E = ½CV², from the part's capacitance to ground and its charged voltage.",
              "Pass/fail comparison against a user-supplied Minimum Ignition Energy (MIE) for the specific substance.",
              "Margin factor showing how many times below (or above) the MIE the computed spark energy is.",
              "General gas-group guidance (IIA/IIB/IIC) on typical MIE ranges, since a gas's group classification is itself driven by how easily it ignites.",
            ]}
            example={{
              problem: "An isolated metal part with 100pF capacitance charged to 10,000V, in an atmosphere with MIE = 0.25mJ (typical propane-range value).",
              steps: [
                "E = 0.5 × 100×10⁻¹² F × (10,000V)² = 0.5 × 100×10⁻¹² × 10⁸ = 0.005 J = 5mJ.",
                "5mJ is 20× higher than the 0.25mJ MIE — this discharge energy exceeds the ignition threshold.",
              ],
              result: "5mJ spark energy vs. 0.25mJ MIE — FAILS (ignition risk) — hand-checked and matched the live code exactly. (100pF/10kV is a deliberately high example to illustrate a failing case; well-bonded plant equipment normally has much lower stray capacitance and is kept below charging voltages that could produce this.)",
            }}
            notes="MIE is a substance-specific property with no single universal value — always use the specific gas/vapor/dust's own tested MIE data (e.g. from IEC 60079-20-1 or the material safety data), not a generic assumption. This is a screening calculation for isolated-conductor discharges — it doesn't cover brush discharges, propagating brush discharges, or bulking-powder discharges, which have their own (often lower) effective ignition energy thresholds and require specialist assessment."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Discharge parameters">
              <NumberField label="Capacitance" unit="pF" tip="The isolated conductive part's capacitance to ground/earth." value={input.capacitancePf} onChange={(v) => update({ capacitancePf: v })} min={0} />
              <NumberField label="Charged voltage" unit="V" tip="The voltage the part is charged to, e.g. from a charge-generating process (fluid flow, powder handling, friction)." value={input.voltageV} onChange={(v) => update({ voltageV: v })} min={0} />
              <NumberField label="Minimum Ignition Energy (MIE)" unit="mJ" tip="The specific substance's own tested MIE — from IEC 60079-20-1 data or the material's safety data sheet. There is no universal value; this must be substance-specific." value={input.mieMj} onChange={(v) => update({ mieMj: v })} min={0} step={0.001} />
              <SelectField<GasGroupEsd>
                label="Gas group (for guidance only)"
                tip="Doesn't affect the pass/fail math — shown only for general context on typical MIE ranges for that group."
                value={input.gasGroup}
                onChange={(v) => update({ gasGroup: v })}
                options={[
                  { value: "IIA", label: "IIA (e.g. propane)" },
                  { value: "IIB", label: "IIB (e.g. ethylene)" },
                  { value: "IIC", label: "IIC (e.g. hydrogen)" },
                  { value: "dust", label: "Combustible dust" },
                ]}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.sparkEnergyMj == null ? (
                <EmptyResult message="Enter capacitance and voltage to see the spark energy." />
              ) : (
                <ResultCard title="Spark energy check">
                  <ResultRow label="Spark energy" value={<span className="text-lg text-accent-2">{result.sparkEnergyMj.toFixed(4)} mJ</span>} />
                  {result.pass !== null && <CheckRow label="Below MIE (lower ignition risk)" value={`MIE = ${input.mieMj} mJ`} pass={result.pass} />}
                  {result.marginFactor != null && (
                    <ResultRow label="Margin (MIE / spark energy)" value={`${result.marginFactor.toFixed(2)}×`} />
                  )}
                  <p className="pt-2 text-xs text-muted">{result.gasGroupNote}</p>
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
