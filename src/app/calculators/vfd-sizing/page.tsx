"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, CheckRow, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_VFD_SIZING_INPUT, VfdSizingInput, VfdDutyType, calcVfdSizing } from "@/lib/vfdsizing";

const DUTY_OPTIONS: { value: VfdDutyType; label: string }[] = [
  { value: "vt", label: "Variable Torque (pumps, fans, centrifugal loads)" },
  { value: "ct", label: "Constant Torque (conveyors, hoists, extruders, positive-displacement pumps)" },
];

export default function VfdSizingPage() {
  const [input, setInput] = useState<VfdSizingInput>(DEFAULT_VFD_SIZING_INPUT);
  const update = (patch: Partial<VfdSizingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcVfdSizing(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          VFD Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Recommends the minimum VFD rated output current needed for a
          motor, accounting for duty type (Variable vs Constant Torque),
          ambient temperature and altitude derating — before you shop for a
          specific drive.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="VFD Sizing Calculator" standardsLine="Generic manufacturer-typical VT/CT duty and temperature/altitude derating rates — see About panel" />
          <FeedbackButton calculatorName="VFD Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Answers 'what VFD rated output current do I need?' before a specific drive has been selected — starting from motor FLA, this applies a duty-type multiplier (Constant Torque loads need proportionally more rated current headroom than Variable Torque loads on the same physical drive frame) plus ambient temperature and altitude derating, to give a minimum required nameplate rated current to shop against."
            standards={[
              "Generic manufacturer-typical derating rates (≈1%/°C above 40°C ambient, ≈1%/100m above 1000m altitude) — the same figures used across this site's other power-electronics sizing screens (soft starters), broadly consistent with IEC 60947-4-2-style thermal-capacity screening but not a literal reproduction of any specific manufacturer's table.",
              "VT/CT duty multiplier (~1.15x for Constant Torque vs Variable Torque) — a widely cited rule of thumb reflecting that most drive frames publish a lower Constant-Torque current rating (~85-87% of the frame's Variable-Torque rating) for the same hardware.",
            ]}
            capabilities={[
              "Required VFD output current from motor FLA, duty type and a safety margin.",
              "Temperature and altitude derating applied to translate that into a minimum VFD nameplate rated current.",
              "Optional pass/fail check against a specific candidate VFD's rated current and voltage.",
            ]}
            example={{
              problem: "65A FLA motor, 400V, Variable Torque duty (centrifugal pump), 10% safety margin, 40°C ambient, 1000m altitude.",
              steps: [
                "Duty multiplier (VT) = 1.0; temperature and altitude factors = 1.0 (both at the no-derating threshold).",
                "Required output current = 65 × 1.10 × 1.0 = 71.5A.",
                "Minimum required VFD rated current = 71.5 / (1.0 × 1.0) = 71.5A.",
              ],
              result: "Shop for a VFD with a Variable-Torque rated output current of at least 71.5A at 400V.",
            }}
            notes="This screens rated current only — motor cable length/dV-dt filtering, carrier (switching) frequency derating, and the specific drive model's exact VT/CT current tables all need separate confirmation against the manufacturer's application data before final selection. For checking a VFD you've already chosen against a motor's nameplate (voltage match, current loading, V/Hz ratio, slip), see the VFD Parameter Selection Calculator instead."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Motor">
              <NumberField label="Motor full-load current (FLA)" unit="A" value={input.motorFlaA} onChange={(v) => update({ motorFlaA: v })} min={0} />
              <NumberField label="Motor rated voltage" unit="V" value={input.motorRatedVoltageV} onChange={(v) => update({ motorRatedVoltageV: v })} min={0} />
            </Section>

            <Section title="Application">
              <SelectField label="Duty type" tip="Constant Torque loads (conveyors, hoists, extruders, positive-displacement pumps) need a drive rated for higher continuous/overload torque than Variable Torque loads (centrifugal pumps and fans) — most drive frames publish a lower CT current rating than VT for the same hardware." value={input.dutyType} onChange={(v) => update({ dutyType: v })} options={DUTY_OPTIONS} />
              <NumberField label="Safety margin" unit="%" tip="Additional design margin on top of motor FLA, for future load growth or measurement uncertainty." value={input.safetyMarginPct} onChange={(v) => update({ safetyMarginPct: v })} min={0} step={1} />
            </Section>

            <Section title="Installation conditions">
              <NumberField label="Ambient temperature" unit="°C" value={input.ambientTempC} onChange={(v) => update({ ambientTempC: v })} step={1} />
              <NumberField label="Altitude" unit="m" value={input.altitudeM} onChange={(v) => update({ altitudeM: v })} min={0} step={100} />
            </Section>

            <Section title="Candidate VFD (optional check)">
              <NumberField label="Candidate rated current" unit="A" value={input.candidateVfdRatedCurrentA} onChange={(v) => update({ candidateVfdRatedCurrentA: v })} min={0} />
              <NumberField label="Candidate rated voltage" unit="V" value={input.candidateVfdRatedVoltageV} onChange={(v) => update({ candidateVfdRatedVoltageV: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.minRequiredRatedCurrentA == null ? (
                <EmptyResult message="Enter the motor FLA to see the required VFD sizing." />
              ) : (
                <ResultCard title="VFD sizing result">
                  <ResultRow label="Duty multiplier" value={result.dutyMultiplier.toFixed(2)} />
                  <ResultRow label="Temperature factor" value={result.tempFactor.toFixed(2)} />
                  <ResultRow label="Altitude factor" value={result.altitudeFactor.toFixed(2)} />
                  <ResultRow label="Required output current" value={`${result.requiredOutputCurrentA!.toFixed(1)} A`} />
                  <ResultRow
                    label="Minimum VFD rated current"
                    value={<span className="text-lg text-accent-2">{result.minRequiredRatedCurrentA.toFixed(1)} A</span>}
                  />
                  {result.candidateCurrentOk != null && (
                    <>
                      {result.candidateVoltageOk != null && (
                        <CheckRow label="Candidate voltage adequate" value={result.candidateVoltageOk ? "Yes" : "No"} pass={result.candidateVoltageOk} />
                      )}
                      <CheckRow label="Candidate current adequate" value={result.candidateCurrentOk ? "Yes" : "No"} pass={result.candidateCurrentOk} />
                      <div className="pt-2 text-base font-semibold text-foreground">
                        {result.candidateOverallOk ? "ADEQUATE ✓" : "INADEQUATE ✗"}
                      </div>
                    </>
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
