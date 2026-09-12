"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_DUCT_BANK_HEAT_RISE_INPUT,
  DuctBankHeatRiseInput,
  DuctBankMode,
  calcDuctBankHeatRise,
} from "@/lib/ductbankheatrise";

export default function DuctBankHeatRisePage() {
  const [input, setInput] = useState<DuctBankHeatRiseInput>(DEFAULT_DUCT_BANK_HEAT_RISE_INPUT);
  const update = (patch: Partial<DuctBankHeatRiseInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcDuctBankHeatRise(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Duct Bank Heat Rise Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Bank-to-ambient temperature rise (or maximum permissible losses)
          for a buried concrete-encased duct bank, using an equal-area
          equivalent-cylinder simplification of the Neher-McGrath / IEC
          60287 external thermal resistance method.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Duct Bank Heat Rise Calculator" standardsLine="Neher-McGrath / IEC 60287 buried-cylinder external thermal resistance method (equal-area equivalent-cylinder simplification)" />
          <FeedbackButton calculatorName="Duct Bank Heat Rise Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates the temperature rise of a buried duct bank above ambient soil temperature from the total heat loss generated inside it, by approximating the duct bank's rectangular cross-section as a circular cylinder of equal area and applying the standard buried-cylinder external thermal resistance formula used in cable thermal rating work. Heat Rise mode finds the temperature rise for a given loss; Maximum Losses mode works backwards from a target maximum temperature."
            standards={["Neher-McGrath / IEC 60287-2-1 — buried-cylinder external thermal resistance method (equal-area equivalent-diameter simplification for a rectangular duct bank)"]}
            capabilities={[
              "Equivalent cylinder diameter from duct bank width and height (equal cross-sectional area).",
              "External thermal resistance from soil resistivity, burial depth to bank center, and equivalent diameter.",
              "Heat Rise mode: bank-to-ambient temperature rise and resulting duct/bank surface temperature from total losses per meter.",
              "Maximum Losses mode: maximum permissible total losses per meter for a target maximum allowable temperature.",
            ]}
            example={{
              problem: "ρ=1.0 K·m/W, 1.0m burial depth to center, 1.2m×0.6m duct bank, 20°C ambient soil, 60 W/m total losses.",
              steps: [
                "D_eq = 2×√((1.2×0.6)/π) = 2×√0.2292 ≈ 0.957m",
                "R_ext = (1.0/2π) × ln(4×1.0/0.957) = 0.1592 × ln(4.178) = 0.1592 × 1.430 ≈ 0.228 K·m/W",
                "ΔT = 60 × 0.228 ≈ 13.7K → bank surface ≈ 20 + 13.7 = 33.7°C",
              ],
              result: "≈13.7K rise, ≈33.7°C bank surface temperature.",
            }}
            notes="This is a simplified equal-area equivalent-cylinder screening estimate, not the full Neher-McGrath method — it omits the internal geometric factors for individual ducts/cables inside the bank, mutual heating between circuits, and the concrete/duct internal thermal resistance. Use it for preliminary sizing only; a heavily loaded duct bank or a design near its thermal limit needs a full thermal study (e.g. a finite-element or full Neher-McGrath calculation) with the specific duct/cable arrangement."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Mode">
              <SelectField<DuctBankMode>
                label="Mode"
                value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "heatRise", label: "Heat rise (from losses)" },
                  { value: "maxLosses", label: "Maximum losses (from target temperature)" },
                ]}
              />
            </Section>

            <Section title="Soil & geometry">
              <NumberField label="Soil thermal resistivity" tip="Typical 0.9–1.2 K·m/W for good/moist soil, up to 2.5–3.0 K·m/W for poor/dry soil." unit="K·m/W" value={input.soilResistivityKmPerW} onChange={(v) => update({ soilResistivityKmPerW: v })} min={0} step={0.05} />
              <NumberField label="Burial depth to bank center" unit="m" value={input.burialDepthM} onChange={(v) => update({ burialDepthM: v })} min={0} step={0.05} />
              <NumberField label="Duct bank width" unit="m" value={input.bankWidthM} onChange={(v) => update({ bankWidthM: v })} min={0} step={0.05} />
              <NumberField label="Duct bank height" unit="m" value={input.bankHeightM} onChange={(v) => update({ bankHeightM: v })} min={0} step={0.05} />
              <NumberField label="Ambient soil temperature" unit="°C" value={input.ambientSoilTempC} onChange={(v) => update({ ambientSoilTempC: v })} step={1} />
            </Section>

            <Section title={input.mode === "heatRise" ? "Losses" : "Target temperature"}>
              {input.mode === "heatRise" ? (
                <NumberField label="Total losses" tip="Sum of all conductor I²R heat generated per meter of duct bank length." unit="W/m" value={input.totalLossesWPerM} onChange={(v) => update({ totalLossesWPerM: v })} min={0} />
              ) : (
                <NumberField label="Maximum allowable temperature" unit="°C" value={input.maxAllowableTempC} onChange={(v) => update({ maxAllowableTempC: v })} />
              )}
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.externalThermalResistanceKmPerW == null ? (
                <EmptyResult message="Enter soil resistivity, burial depth, and duct bank geometry to see the thermal result." />
              ) : (
                <ResultCard title="Duct bank thermal result">
                  <ResultRow label="Equivalent diameter" value={`${result.equivalentDiameterM!.toFixed(3)} m`} />
                  <ResultRow label="External thermal resistance" value={`${result.externalThermalResistanceKmPerW.toFixed(3)} K·m/W`} />
                  {input.mode === "heatRise" && result.deltaTK != null && (
                    <>
                      <ResultRow label="Temperature rise" value={`${result.deltaTK.toFixed(1)} K`} />
                      <ResultRow label="Bank surface temperature" value={`${result.bankSurfaceTempC!.toFixed(1)} °C`} />
                    </>
                  )}
                  {input.mode === "maxLosses" && result.maxLossesWPerM != null && (
                    <ResultRow label="Maximum permissible losses" value={`${result.maxLossesWPerM.toFixed(1)} W/m`} />
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
