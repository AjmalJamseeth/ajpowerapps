"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_GENSET_FUEL_INPUT, GensetFuelInput, FuelRateBasis, calcGensetFuel } from "@/lib/gensetfuel";

export default function GensetFuelPage() {
  const [input, setInput] = useState<GensetFuelInput>(DEFAULT_GENSET_FUEL_INPUT);
  const update = (patch: Partial<GensetFuelInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcGensetFuel(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Genset Fuel Consumption &amp; Running Cost
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Estimates runtime and cost from a tank size and your genset&apos;s
          own datasheet fuel consumption rate.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Genset Fuel Consumption & Running Cost" standardsLine="Manufacturer-datasheet fuel consumption rate — user-supplied" />
          <FeedbackButton calculatorName="Genset Fuel Consumption & Running Cost" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates genset runtime and running cost from a tank size and your genset's own fuel consumption rate at the operating load — entered either as L/kWh or as a direct L/hr figure, since actual consumption varies significantly by model, load level, and manufacturer."
            standards={["Manufacturer datasheet fuel consumption figures — deliberately not built-in, since consumption rate is genuinely model/load-specific"]}
            capabilities={[
              "Consumption rate in L/hr, from either a direct L/hr entry or a L/kWh rate applied to the load.",
              "Estimated runtime on a full tank.",
              "Fuel cost per hour of operation.",
            ]}
            example={{
              problem: "500L tank, genset consuming 45 L/hr at the operating load, $1.20/L.",
              steps: [
                "Runtime = 500/45 ≈ 11.11 hours.",
                "Cost per hour = 45 × 1.20 = $54/hr.",
              ],
              result: "≈11.1 hours runtime, $54/hr fuel cost — hand-checked and matched the live code exactly.",
            }}
            notes="The consumption rate must come from your genset's actual manufacturer datasheet at the load level you'll operate at (consumption isn't linear with load for most gensets — a genset at 50% load doesn't consume exactly half of its 100%-load rate) — no consumption figure is hard-coded here."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Tank & fuel rate">
              <NumberField label="Tank size" unit="L" value={input.tankLiters} onChange={(v) => update({ tankLiters: v })} min={0} />
              <SelectField<FuelRateBasis>
                label="Fuel rate basis"
                value={input.fuelRateBasis}
                onChange={(v) => update({ fuelRateBasis: v })}
                options={[
                  { value: "perHour", label: "L per hour (direct)" },
                  { value: "perKwh", label: "L per kWh (× load)" },
                ]}
              />
              {input.fuelRateBasis === "perKwh" && (
                <NumberField label="Load" unit="kW" value={input.loadKw} onChange={(v) => update({ loadKw: v })} min={0} />
              )}
              <NumberField label={input.fuelRateBasis === "perHour" ? "Consumption rate" : "Consumption rate"} unit={input.fuelRateBasis === "perHour" ? "L/hr" : "L/kWh"} value={input.fuelRateValue} onChange={(v) => update({ fuelRateValue: v })} min={0} step={0.01} />
              <NumberField label="Fuel price" unit="/L" value={input.fuelPricePerLiter} onChange={(v) => update({ fuelPricePerLiter: v })} min={0} step={0.01} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.runtimeHours == null ? (
                <EmptyResult message="Enter tank size and fuel rate to see runtime and cost." />
              ) : (
                <ResultCard title="Runtime & cost">
                  <ResultRow label="Consumption rate" value={`${result.consumptionRateLPerHour!.toFixed(2)} L/hr`} />
                  <ResultRow label="Runtime on full tank" value={`${result.runtimeHours.toFixed(2)} hr`} />
                  <ResultRow label="Cost per hour" value={result.costPerHour!.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
