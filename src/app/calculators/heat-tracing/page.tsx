"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_HEAT_TRACING_INPUT, HeatTracingInput, calcHeatTracing } from "@/lib/heattracing";

export default function HeatTracingPage() {
  const [input, setInput] = useState<HeatTracingInput>(DEFAULT_HEAT_TRACING_INPUT);
  const update = (patch: Partial<HeatTracingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcHeatTracing(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Heat Tracing Circuit Sizing
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Electrical trace-heating power from pipe insulation heat loss,
          heater cable selection, and circuit voltage-drop/breaker sizing.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Heat Tracing Circuit Sizing" standardsLine="IEEE 515 practice; IEC 60079-30 for hazardous areas" />
          <FeedbackButton calculatorName="Heat Tracing Circuit Sizing" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Sizes an electric trace-heating circuit for a pipe: computes the steady-state heat loss through the pipe's insulation at the design minimum ambient temperature, checks whether a selected heating cable's rated output (W/m) covers that loss with a safety margin, and checks the resulting circuit's current and voltage drop against the supply and breaker."
            standards={["Standard cylindrical-conduction heat-loss formula (textbook heat transfer), applied per IEEE 515 electric resistance trace-heating practice", "IEC 60079-30 for hazardous-area trace heating (GFEP requirement)"]}
            capabilities={[
              "Steady-state heat loss (W/m) through the pipe insulation from pipe diameter, insulation thickness/conductivity, maintain temperature and design minimum ambient.",
              "Required heater output with a user-set design safety factor, checked against the selected heating cable's rated W/m.",
              "Circuit power and current from heater output and circuit length, checked against the breaker rating.",
              "Optional voltage-drop check for constant-wattage cable types with a known resistance per unit length.",
            ]}
            example={{
              problem: "114mm OD pipe, 50mm mineral wool insulation (k=0.04 W/m·K), maintain 10°C at a -10°C design minimum ambient, 1.3 design factor, 20W/m heating cable, 80m circuit at 230V on a 16A breaker.",
              steps: [
                "ΔT = 10 − (−10) = 20°C.",
                "Heat loss = 2π × 0.04 × 20 / ln(0.214/0.114) = 7.98 W/m.",
                "Required with design factor = 7.98 × 1.3 = 10.38 W/m — the 20W/m cable comfortably covers this.",
                "Circuit power = 20 × 80 = 1,600W; current = 1,600/230 = 6.96A — well within the 16A breaker.",
              ],
              result: "7.98W/m heat loss, 10.38W/m required, the selected 20W/m cable is adequate, and the 80m circuit draws 6.96A — hand-checked and matched the live code exactly.",
            }}
            notes="This sizes the heater and circuit from first-principles heat loss — it doesn't replace a manufacturer's heat-tracing design software, which accounts for pipe supports, valves/flanges, startup heat-up time, and cable de-rating for the specific installation. For constant-wattage cable types, enter the cable's resistance per meter to see the voltage-drop check; self-regulating cables have a non-linear resistance and aren't modeled here — check the manufacturer's maximum circuit length tables instead. Hazardous-area installations require GFEP (typically 30mA) per IEC 60079-30 — not modeled here as a pass/fail, just a reminder."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Pipe & insulation">
              <NumberField label="Pipe outer diameter" unit="mm" tip="Outer diameter of the bare pipe, before insulation." value={input.pipeOuterDiameterMm} onChange={(v) => update({ pipeOuterDiameterMm: v })} min={0} />
              <NumberField label="Insulation thickness" unit="mm" value={input.insulationThicknessMm} onChange={(v) => update({ insulationThicknessMm: v })} min={0} />
              <NumberField label="Insulation thermal conductivity" unit="W/(m·K)" hint="k" tip="Mineral wool ≈0.04, polyisocyanurate (PIR) ≈0.025, calcium silicate ≈0.06 — use the manufacturer's value at the mean insulation temperature." value={input.insulationK} onChange={(v) => update({ insulationK: v })} min={0.001} step={0.001} />
              <NumberField label="Maintain temperature" unit="°C" tip="The pipe/fluid temperature to be maintained." value={input.maintainTempC} onChange={(v) => update({ maintainTempC: v })} />
              <NumberField label="Design minimum ambient" unit="°C" tip="The coldest ambient temperature the circuit must be designed for — worst case, not average." value={input.minAmbientTempC} onChange={(v) => update({ minAmbientTempC: v })} />
              <NumberField label="Design safety factor" tip="Multiplier applied to the computed heat loss for installation losses, thermal contact resistance and margin — commonly 1.2-1.5." value={input.designFactor} onChange={(v) => update({ designFactor: v })} min={1} step={0.05} />
            </Section>

            <Section title="Heater & circuit">
              <NumberField label="Heater rated output" unit="W/m" tip="The selected heating cable's rated power output per unit length." value={input.heaterOutputWPerM} onChange={(v) => update({ heaterOutputWPerM: v })} min={0} />
              <NumberField label="Circuit length" unit="m" value={input.circuitLengthM} onChange={(v) => update({ circuitLengthM: v })} min={0} />
              <NumberField label="Circuit voltage" unit="V" value={input.circuitVoltageV} onChange={(v) => update({ circuitVoltageV: v })} min={1} />
              <NumberField label="Breaker rating" unit="A" value={input.breakerRatingA} onChange={(v) => update({ breakerRatingA: v })} min={0} />
              <NumberField label="Cable resistance" unit="Ω/m" hint="constant-wattage only" tip="Only for constant-wattage heating cable — leave at 0 to skip the voltage-drop check (e.g. for self-regulating cable, whose resistance is non-linear)." value={input.cableResistanceOhmPerM} onChange={(v) => update({ cableResistanceOhmPerM: v })} min={0} step={0.001} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.heatLossWPerM == null ? (
                <EmptyResult message="Enter pipe, insulation and temperature inputs to see heat loss results." />
              ) : (
                <ResultCard title="Heat loss & heater selection">
                  <ResultRow label="Steady-state heat loss" value={`${result.heatLossWPerM.toFixed(2)} W/m`} />
                  {result.requiredWPerM != null && <ResultRow label="Required (with design factor)" value={`${result.requiredWPerM.toFixed(2)} W/m`} />}
                  {result.heaterAdequate !== null && (
                    <CheckRow label="Selected heater adequate" value={`${input.heaterOutputWPerM} W/m`} pass={result.heaterAdequate} />
                  )}
                </ResultCard>
              )}

              {result.circuitPowerW != null && (
                <ResultCard title="Circuit">
                  <ResultRow label="Circuit power" value={`${result.circuitPowerW.toFixed(0)} W`} />
                  {result.circuitCurrentA != null && <ResultRow label="Circuit current" value={`${result.circuitCurrentA.toFixed(2)} A`} />}
                  {result.breakerOk !== null && <CheckRow label="Within breaker rating" value={`${input.breakerRatingA} A`} pass={result.breakerOk} />}
                  {result.voltageDropPct != null && <ResultRow label="Voltage drop" value={`${result.voltageDropV?.toFixed(1)} V (${result.voltageDropPct.toFixed(2)}%)`} />}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
