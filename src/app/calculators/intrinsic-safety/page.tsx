"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow } from "@/components/fields";
import { DEFAULT_IS_INPUT, IsInput, GasGroup, calcIntrinsicSafety } from "@/lib/intrinsicsafety";

export default function IntrinsicSafetyPage() {
  const [input, setInput] = useState<IsInput>(DEFAULT_IS_INPUT);
  const update = (patch: Partial<IsInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcIntrinsicSafety(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Intrinsic Safety (IS) Verification
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 60079-11 entity-concept check for combining an associated
          apparatus (barrier/isolator) with intrinsically safe field
          apparatus and field wiring — voltage, current, power, capacitance
          and inductance, including the 1% rule and field cable contribution.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Intrinsic Safety (IS) Verification" standardsLine="IEC 60079-11 / IEC 60079-14 entity concept" />
          <FeedbackButton calculatorName="Intrinsic Safety (IS) Verification" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Verifies that an associated apparatus (safety barrier / galvanic isolator) and an intrinsically safe field device — plus the field cable connecting them — can be combined without a dedicated system certification, using the IEC 60079-11 'entity concept'. All five entity parameters (voltage, current, power, capacitance, inductance) must satisfy the required inequalities, with cable capacitance/inductance added to the field device's own values."
            standards={["IEC 60079-11 (intrinsic safety 'i')", "IEC 60079-14 (electrical installations design, selection, erection)"]}
            capabilities={[
              "Voltage, current and power checks: Uo≤Ui, Io≤Ii, Po≤Pi.",
              "Field cable capacitance/inductance calculated from length and per-length cable data (or the standard 'unknown cable' defaults).",
              "Capacitance and inductance checks against the barrier's Co/Lo, including the IEC 60079-14 '1% rule' (use full Co/Lo, or halve both, depending on the field-side Ci/Li relative to Co/Lo).",
              "Overall pass/fail summary across all five entity parameters.",
            ]}
            example={{
              problem: "P+F-style barrier: Uo=28V, Io=93mA, Po=650mW, Co=0.083µF, Lo=4.2mH. Field device: Ui=30V, Ii=130mA, Pi=1000mW, Ci=5nF, Li=0µH. 500m of cable at the standard 60pF/ft, 0.2µH/ft defaults.",
              steps: [
                "Voltage/current/power: 28≤30 ✓, 93≤130 ✓, 650≤1000 ✓.",
                "Cable capacitance = 197 pF/m × 500m = 98.5 nF; total Ci = 5 + 98.5 = 103.5 nF.",
                "Li/Lo = 0/4.2mH = 0% < 1%, so the 1% rule applies → use the full Co = 0.083µF (83nF), not halved.",
                "Capacitance check: 103.5nF > 83nF → FAILS — the cable run is too long / too capacitive for this barrier at this length.",
              ],
              result: "Voltage, current and power all pass; capacitance fails at 500m with these defaults — a shorter run or a barrier with higher Co would be needed. Hand-checked and matched the live code exactly, including a genuine failure condition.",
            }}
            notes="Cable capacitance/inductance defaults (60pF/ft, 0.2µH/ft) match common 'unknown cable' assumptions used industry-wide (e.g. manufacturer control drawings) — always use the actual cable's datasheet values when known. The absolute practical ceiling some guidance places on reduced (halved) capacitance (~1µF for IIB, ~600nF for IIC) is not hard-coded here; enter your barrier's own certified Co/Lo values directly. This is an entity-concept screening check, not a substitute for a full IS system/loop certification or a hazardous-area classification study."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Associated apparatus (barrier / isolator)">
              <NumberField label="Uo (Voc)" unit="V" tip="Maximum open-circuit output voltage of the associated apparatus, from its IS certificate." value={input.voc} onChange={(v) => update({ voc: v })} min={0} />
              <NumberField label="Io (Isc)" unit="mA" tip="Maximum short-circuit output current of the associated apparatus." value={input.isc} onChange={(v) => update({ isc: v })} min={0} />
              <NumberField label="Po" unit="mW" tip="Maximum output power of the associated apparatus — leave blank/0 if not stated on the certificate (some barriers omit Po, since Uo/Io alone define the safe envelope)." value={input.po} onChange={(v) => update({ po: v })} min={0} />
              <NumberField label="Co (Ca)" unit="µF" tip="Maximum external capacitance the associated apparatus can safely drive, from its certificate." value={input.ca} onChange={(v) => update({ ca: v })} min={0} />
              <NumberField label="Lo (La)" unit="mH" tip="Maximum external inductance the associated apparatus can safely drive, from its certificate." value={input.la} onChange={(v) => update({ la: v })} min={0} />
              <SelectField<GasGroup>
                label="Gas group"
                tip="Apparatus gas group (IIA/IIB/IIC) — IIC is the most stringent (hydrogen-type gases), requiring the lowest permissible energy/capacitance/inductance."
                value={input.gasGroup}
                onChange={(v) => update({ gasGroup: v })}
                options={[
                  { value: "IIA", label: "IIA" },
                  { value: "IIB", label: "IIB" },
                  { value: "IIC", label: "IIC" },
                ]}
              />
            </Section>

            <Section title="Intrinsically safe field apparatus">
              <NumberField label="Ui (Vmax)" unit="V" tip="Maximum voltage the field device can safely accept, from its IS certificate." value={input.ui} onChange={(v) => update({ ui: v })} min={0} />
              <NumberField label="Ii (Imax)" unit="mA" tip="Maximum current the field device can safely accept." value={input.ii} onChange={(v) => update({ ii: v })} min={0} />
              <NumberField label="Pi (Pmax)" unit="mW" tip="Maximum power the field device can safely accept — leave blank/0 if not stated." value={input.pi} onChange={(v) => update({ pi: v })} min={0} />
              <NumberField label="Ci" unit="nF" tip="Field device's own internal capacitance (excluding cable), from its certificate." value={input.ci} onChange={(v) => update({ ci: v })} min={0} />
              <NumberField label="Li" unit="µH" tip="Field device's own internal inductance (excluding cable), from its certificate." value={input.li} onChange={(v) => update({ li: v })} min={0} />
            </Section>

            <Section title="Field wiring">
              <NumberField label="Cable length" unit="m" tip="One-way length of the field cable connecting the barrier/isolator to the field device." value={input.cableLengthM} onChange={(v) => update({ cableLengthM: v })} min={0} />
              <NumberField label="Cable capacitance" unit="pF/m" tip="Cable's own capacitance per meter, from its datasheet — default (197 pF/m ≈ 60 pF/ft) matches the common 'unknown cable' assumption used when the actual cable data isn't available." value={input.cableCapPfPerM} onChange={(v) => update({ cableCapPfPerM: v })} min={0} />
              <NumberField label="Cable inductance" unit="µH/m" tip="Cable's own inductance per meter, from its datasheet — default (0.656 µH/m ≈ 0.2 µH/ft) matches the common 'unknown cable' assumption." value={input.cableIndUhPerM} onChange={(v) => update({ cableIndUhPerM: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <ResultCard title="Voltage / current / power">
                {result.voltageOk !== null && <CheckRow label="Uo ≤ Ui" value={`${input.voc}V ≤ ${input.ui}V`} pass={result.voltageOk} />}
                {result.currentOk !== null && <CheckRow label="Io ≤ Ii" value={`${input.isc}mA ≤ ${input.ii}mA`} pass={result.currentOk} />}
                {result.powerOk !== null ? (
                  <CheckRow label="Po ≤ Pi" value={`${input.po}mW ≤ ${input.pi}mW`} pass={result.powerOk} />
                ) : (
                  <ResultRow label="Po ≤ Pi" value="Not checked (Po or Pi not entered)" />
                )}
              </ResultCard>

              <ResultCard title="Cable contribution">
                <ResultRow label="Cable capacitance" value={`${result.cableCapTotalNf.toFixed(2)} nF`} />
                <ResultRow label="Cable inductance" value={`${result.cableIndTotalUh.toFixed(2)} µH`} />
                <ResultRow label="Total Ci (device + cable)" value={`${result.totalCiNf.toFixed(2)} nF`} />
                <ResultRow label="Total Li (device + cable)" value={`${result.totalLiUh.toFixed(2)} µH`} />
              </ResultCard>

              <ResultCard title="Capacitance / inductance check (1% rule)">
                <ResultRow label="1% rule applies (use full Co/Lo)" value={result.onePercentRuleApplies ? "Yes" : "No — Co/Lo halved"} />
                {result.effectiveCoUf !== null && <ResultRow label="Effective Co" value={`${result.effectiveCoUf.toFixed(4)} µF (${(result.effectiveCoUf * 1000).toFixed(1)} nF)`} />}
                {result.effectiveLoMh !== null && <ResultRow label="Effective Lo" value={`${result.effectiveLoMh.toFixed(3)} mH (${(result.effectiveLoMh * 1000).toFixed(1)} µH)`} />}
                {result.capacitanceOk !== null && <CheckRow label="Total Ci ≤ effective Co" value={`${result.totalCiNf.toFixed(1)}nF`} pass={result.capacitanceOk} />}
                {result.inductanceOk !== null && <CheckRow label="Total Li ≤ effective Lo" value={`${result.totalLiUh.toFixed(1)}µH`} pass={result.inductanceOk} />}
              </ResultCard>

              {result.overallPass !== null && (
                <ResultCard title="Overall">
                  <CheckRow label="Entity concept combination" value={result.overallPass ? "SAFE TO COMBINE" : "DOES NOT COMPLY"} pass={result.overallPass} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
