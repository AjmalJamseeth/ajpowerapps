"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_WIND_TURBINE_POWER_INPUT, WindTurbinePowerInput, calcWindTurbinePower, BETZ_LIMIT_CP } from "@/lib/windTurbinePower";

export default function WindTurbinePowerOutputPage() {
  const [input, setInput] = useState<WindTurbinePowerInput>(DEFAULT_WIND_TURBINE_POWER_INPUT);
  const update = (patch: Partial<WindTurbinePowerInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcWindTurbinePower(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Wind Turbine Power Output Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Electrical power output from rotor diameter, wind speed, air
          density, power coefficient (Cp), and generator efficiency.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Wind Turbine Power Output Calculator" standardsLine="Standard wind power equation: P = 0.5×ρ×A×v³×Cp×η_gen" />
          <FeedbackButton calculatorName="Wind Turbine Power Output Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the electrical power a wind turbine delivers at a given wind speed, from the standard wind power equation applied to the rotor's swept area, air density, the turbine's power coefficient (Cp — the fraction of available wind power the rotor extracts), and generator conversion efficiency."
            standards={[`Standard wind power equation: P = 0.5×ρ×A×v³×Cp×η_gen, A=π(D/2)²; Cp physically capped by the Betz limit of ${BETZ_LIMIT_CP} (59.3%)`]}
            capabilities={[
              "Swept rotor area from rotor diameter.",
              "Power output in W and kW from wind speed cubed, air density, Cp, and generator efficiency.",
              "Flags a Cp entry above the Betz limit as physically unrealistic.",
              "Grading band from LOW to VERY HIGH for a quick sense of scale.",
            ]}
            example={{
              problem: "20m rotor diameter, 10 m/s wind speed, 1.225 kg/m³ air density, Cp=0.4, 95% generator efficiency.",
              steps: [
                "A = π×(10)² ≈ 314.16 m²",
                "P = 0.5×1.225×314.16×1000×0.4×0.95 ≈ 73,120 W",
              ],
              result: "≈73.1 kW — NORMAL band.",
            }}
            notes="Power output scales with the cube of wind speed, so accuracy is very sensitive to the wind speed input — use a representative average or a specific design wind speed, not a rough guess. Real turbines also apply a power curve (with cut-in, rated, and cut-out wind speeds) rather than the unbounded cubic relation used here, so this is most accurate near the turbine's rated wind speed, not at very low or very high speeds."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Rotor & wind">
              <NumberField label="Rotor diameter" unit="m" value={input.rotorDiameterM} onChange={(v) => update({ rotorDiameterM: v })} min={0} step={0.5} />
              <NumberField label="Wind speed" unit="m/s" value={input.windSpeedMs} onChange={(v) => update({ windSpeedMs: v })} min={0} step={0.5} />
              <NumberField label="Air density" unit="kg/m³" value={input.airDensityKgM3} onChange={(v) => update({ airDensityKgM3: v })} min={0} step={0.01} />
            </Section>

            <Section title="Efficiency">
              <NumberField label="Power coefficient (Cp)" tip={`Fraction of available wind power extracted by the rotor. Physically capped by the Betz limit of ${BETZ_LIMIT_CP} (59.3%); typical real turbines run 0.35-0.45 at rated conditions.`} value={input.powerCoefficientCp} onChange={(v) => update({ powerCoefficientCp: v })} min={0} max={0.593} step={0.01} />
              <NumberField label="Generator efficiency" unit="%" value={input.generatorEfficiencyPct} onChange={(v) => update({ generatorEfficiencyPct: v })} min={0} max={100} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.powerOutputKw == null ? (
                <EmptyResult message="Enter rotor diameter and wind speed to see the power output." />
              ) : (
                <ResultCard title="Power output">
                  <ResultRow label="Swept area" value={`${result.sweptAreaM2!.toFixed(1)} m²`} />
                  <ResultRow label="Power output" value={`${result.powerOutputKw.toFixed(2)} kW`} />
                  <ResultRow label="Grade" value={result.grade!} />
                  {result.cpExceedsBetzLimit && <ResultRow label="Warning" value="Cp exceeds the Betz limit — physically unrealistic" />}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
