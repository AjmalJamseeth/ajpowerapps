"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_ENCLOSURE_COOLING_INPUT, EnclosureCoolingInput, MountingType, calcEnclosureCooling } from "@/lib/enclosurecooling";

export default function EnclosureCoolingPage() {
  const [input, setInput] = useState<EnclosureCoolingInput>(DEFAULT_ENCLOSURE_COOLING_INPUT);
  const update = (patch: Partial<EnclosureCoolingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcEnclosureCooling(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Panel / MCC Enclosure Heat Dissipation &amp; Ventilation
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Checks whether an enclosure&apos;s natural-convection surface is enough
          to hold internal temperature rise within limits, and sizes a
          forced-air fan if not.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Panel / MCC Enclosure Heat Dissipation & Ventilation" standardsLine="IEC 60890-derived enclosure heat-rise method" />
          <FeedbackButton calculatorName="Panel / MCC Enclosure Heat Dissipation & Ventilation" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks whether an electrical enclosure (panel, MCC, switchgear cubicle) can shed its installed components' heat losses by natural convection alone while staying within the maximum internal temperature rating, and — if not — sizes the forced-air fan flow needed to do so."
            standards={["IEC 60890-derived enclosure heat-rise method, as widely published by enclosure/cooling manufacturers (e.g. nVent Hoffman, Rittal, Pfannenberg application notes)"]}
            capabilities={[
              "Effective dissipating surface area from enclosure dimensions and mounting type (free-standing counts the rear face; wall-mount doesn't).",
              "Natural-convection heat dissipation capacity at the allowable temperature rise, using a user-adjustable convection coefficient (≈5.5 W/(m²·K) bare steel, ≈6-7 painted).",
              "Pass/fail check of natural convection against the installed heat losses.",
              "Forced-air fan flow sizing (m³/h) if natural convection alone isn't enough.",
            ]}
            example={{
              problem: "2000×800×600mm free-standing enclosure, 600W internal losses, 35°C ambient, 45°C max internal temperature, k=5.5 W/(m²·K).",
              steps: [
                "Effective area = top (0.8×0.6) + 2 sides (2×(2×0.6)) + front (2×0.8) + back (2×0.8) = 0.48+2.4+1.6+1.6 = 6.08 m².",
                "Allowable ΔT = 45−35 = 10°C.",
                "Natural convection capacity = 5.5 × 6.08 × 10 = 334.4W — less than the 600W of losses, so natural convection alone is inadequate.",
                "Required fan airflow = 3.1 × 600 / 10 = 186 m³/h.",
              ],
              result: "Natural convection can only shed 334.4W against 600W of losses — inadequate — requiring 186 m³/h of forced airflow — hand-checked and matched the live code exactly.",
            }}
            notes="This is a simplified, first-pass heat-rise method — it doesn't account for solar loading, altitude derating of the fan, filter/vent pressure drop, or non-uniform internal air circulation. For safety-critical or high-density enclosures, verify against the enclosure/cooling manufacturer's own sizing tool."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Enclosure">
              <NumberField label="Height" unit="mm" value={input.heightMm} onChange={(v) => update({ heightMm: v })} min={0} />
              <NumberField label="Width" unit="mm" value={input.widthMm} onChange={(v) => update({ widthMm: v })} min={0} />
              <NumberField label="Depth" unit="mm" value={input.depthMm} onChange={(v) => update({ depthMm: v })} min={0} />
              <SelectField<MountingType>
                label="Mounting"
                tip="Free-standing enclosures dissipate through the rear face too; wall-mounted enclosures don't, since the rear is against the wall."
                value={input.mounting}
                onChange={(v) => update({ mounting: v })}
                options={[
                  { value: "free-standing", label: "Free-standing" },
                  { value: "wall-mount", label: "Wall-mounted" },
                ]}
              />
              <NumberField label="Convection coefficient" unit="W/(m²·K)" tip="≈5.5 for bare/unpainted steel, ≈6-7 for painted — a higher coefficient means more heat sheds per m² per degree of temperature rise." value={input.convectionCoefficient} onChange={(v) => update({ convectionCoefficient: v })} min={0.1} step={0.1} />
            </Section>

            <Section title="Thermal load & limits">
              <NumberField label="Internal heat losses" unit="W" tip="Sum of all installed component power losses (breakers, contactors, VFD/drive losses, transformer losses, etc.)." value={input.internalLossesW} onChange={(v) => update({ internalLossesW: v })} min={0} />
              <NumberField label="Ambient temperature" unit="°C" tip="Design maximum ambient temperature outside the enclosure." value={input.ambientTempC} onChange={(v) => update({ ambientTempC: v })} />
              <NumberField label="Max internal temperature" unit="°C" tip="The highest internal temperature the installed components are rated for." value={input.maxInternalTempC} onChange={(v) => update({ maxInternalTempC: v })} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.effectiveAreaM2 == null ? (
                <EmptyResult message="Enter enclosure dimensions and thermal load to see cooling results." />
              ) : (
                <ResultCard title="Natural convection">
                  <ResultRow label="Effective dissipating area" value={`${result.effectiveAreaM2.toFixed(2)} m²`} />
                  {result.allowableDeltaT != null && <ResultRow label="Allowable temperature rise" value={`${result.allowableDeltaT.toFixed(1)} °C`} />}
                  {result.naturalConvectionCapacityW != null && <ResultRow label="Natural convection capacity" value={`${result.naturalConvectionCapacityW.toFixed(0)} W`} />}
                  {result.naturalConvectionAdequate !== null && (
                    <CheckRow label="Natural convection adequate" value={`${input.internalLossesW} W losses`} pass={result.naturalConvectionAdequate} />
                  )}
                </ResultCard>
              )}

              {result.requiredFanAirflowM3h != null && (
                <ResultCard title="Forced-air fan sizing">
                  <ResultRow label="Required fan airflow" value={<span className="text-lg text-accent-2">{result.requiredFanAirflowM3h.toFixed(0)} m³/h</span>} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
