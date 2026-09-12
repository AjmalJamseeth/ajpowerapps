"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, CheckboxField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_NEC_RESIDENTIAL_LOAD_INPUT,
  NecResidentialLoadInput,
  NecLoadMethod,
  calcNecResidentialLoad,
} from "@/lib/necresidentialload";

export default function NecResidentialLoadPage() {
  const [input, setInput] = useState<NecResidentialLoadInput>(DEFAULT_NEC_RESIDENTIAL_LOAD_INPUT);
  const update = (patch: Partial<NecResidentialLoadInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcNecResidentialLoad(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          NEC 220 Residential Electrical Load Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Single-family dwelling service load per NEC Article 220 — Standard
          Method (Part III) or Optional Method (220.82) — with a
          recommended minimum service size.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="NEC 220 Residential Electrical Load Calculator" standardsLine="NEC Article 220 Part III (Standard Method) / NEC 220.82 (Optional Method)" />
          <FeedbackButton calculatorName="NEC 220 Residential Electrical Load Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Calculates a single-family dwelling's electrical service demand load using either the NEC Article 220 Part III Standard Method (general lighting/small-appliance/laundry loads with Table 220.42 demand factors, fixed appliances per 220.53, range per Table 220.55, dryer per 220.54, and HVAC per 220.60) or the 220.82 Optional Method (all other loads summed at nameplate with a single 10kVA/40% demand step, HVAC handled separately), then recommends a minimum standard service size."
            standards={[
              "NEC 220.12 — general lighting load (3 VA/sq ft, dwelling occupancy)",
              "NEC 220.52 — small-appliance and laundry branch-circuit loads",
              "NEC Table 220.42 — general lighting/small-appliance/laundry demand factors",
              "NEC 220.53 — fixed-appliance demand factor (75% for 4 or more)",
              "NEC Table 220.55 — electric range demand load",
              "NEC 220.54 — electric dryer demand load",
              "NEC 220.60 — non-coincident (heating/cooling) loads",
              "NEC 220.82 — Optional Method for a single dwelling unit",
            ]}
            capabilities={[
              "Standard Method: full Table 220.42 tiered demand factor, 220.53 fixed-appliance rule, simplified Table 220.55 range demand, 220.54 dryer minimum.",
              "Optional Method: single 10kVA/40% demand step per 220.82(B), with a user-selectable HVAC demand factor per 220.82(C) (100% A/C or heat pump; 65% electric heat, ≤4 units; 40% electric heat, 5+ units).",
              "EV charger load included as a continuous load with the 125% factor applied automatically.",
              "Recommended minimum standard service size from the computed demand amps.",
            ]}
            example={{
              problem: "Standard Method: 2000 sq ft, 2 small-appliance circuits, 1 laundry circuit, 3 other fixed appliances totaling 4500VA, 10kW range, 5000VA dryer, 4800VA cooling / 10000VA heating, 240V, no EV.",
              steps: [
                "General loads = 6000+3000+1500 = 10,500 VA → demand = 3000 + (10500−3000)×0.35 = 5625 VA",
                "Fixed appliances (only 3, under 4) = 4500 VA at 100%",
                "Range ≤12kW → 8000 VA (Table 220.55). Dryer = max(5000, 5000) = 5000 VA. HVAC = max(4800, 10000) = 10,000 VA",
                "Total = 5625+4500+8000+5000+10000 = 33,125 VA → 33125/240 ≈ 138.0A → 150A recommended service",
              ],
              result: "≈138.0A demand, 150A recommended minimum service.",
            }}
            notes="This targets the common single-family-dwelling case and simplifies several Article 220 edge cases: it assumes a single range and single dryer, doesn't auto-detect the heat-pump/electric-heat 220.82(C) branch (you select the applicable demand factor directly), and doesn't cover multi-family or mixed-occupancy calculations. Always verify against the full Article 220 text and the code edition adopted by the AHJ for a final service size."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Method">
              <SelectField<NecLoadMethod>
                label="Calculation method"
                value={input.method}
                onChange={(v) => update({ method: v })}
                options={[
                  { value: "standard", label: "Standard Method (Art. 220 Part III)" },
                  { value: "optional", label: "Optional Method (220.82)" },
                ]}
              />
              <NumberField label="Voltage" unit="V" value={input.voltageV} onChange={(v) => update({ voltageV: v })} min={1} />
            </Section>

            <Section title="General loads">
              <NumberField label="Dwelling floor area" unit="sq ft" value={input.floorAreaSqft} onChange={(v) => update({ floorAreaSqft: v })} min={0} />
              <NumberField label="Small-appliance circuits" tip="NEC 220.52(A) — typically 2, at 1500VA each." value={input.smallApplianceCircuits} onChange={(v) => update({ smallApplianceCircuits: v })} min={0} step={1} />
              <NumberField label="Laundry circuits" tip="NEC 220.52(B) — typically 1, at 1500VA." value={input.laundryCircuits} onChange={(v) => update({ laundryCircuits: v })} min={0} step={1} />
            </Section>

            <Section title="Fixed appliances">
              <NumberField label="Other fixed appliance total" tip="Sum of nameplate VA for fixed appliances other than range, dryer, HVAC and EV charger (e.g. water heater, dishwasher, disposal)." unit="VA" value={input.otherFixedApplianceVaSum} onChange={(v) => update({ otherFixedApplianceVaSum: v })} min={0} />
              <NumberField label="Fixed appliance count" tip="Standard Method only — NEC 220.53 applies a 75% demand factor when 4 or more fixed appliances (other than range/dryer/HVAC) are on the same service." value={input.otherFixedApplianceCount} onChange={(v) => update({ otherFixedApplianceCount: v })} min={0} step={1} />
            </Section>

            <Section title="Range & dryer">
              <CheckboxField label="Has electric range" checked={input.hasRange} onChange={(v) => update({ hasRange: v })} />
              {input.hasRange && (
                <NumberField label="Range rating" unit="kW" value={input.rangeKw} onChange={(v) => update({ rangeKw: v })} min={0} step={0.5} />
              )}
              <CheckboxField label="Has electric dryer" checked={input.hasDryer} onChange={(v) => update({ hasDryer: v })} />
              {input.hasDryer && (
                <NumberField label="Dryer nameplate rating" unit="VA" value={input.dryerNameplateVa} onChange={(v) => update({ dryerNameplateVa: v })} min={0} />
              )}
            </Section>

            <Section title="HVAC">
              <NumberField label="Cooling load" unit="VA" value={input.coolingVa} onChange={(v) => update({ coolingVa: v })} min={0} />
              <NumberField label="Heating load" unit="VA" value={input.heatingVa} onChange={(v) => update({ heatingVa: v })} min={0} />
              {input.method === "optional" && (
                <SelectField<number>
                  label="HVAC demand factor (220.82(C))"
                  value={input.hvacOptionalDemandFactorPct}
                  onChange={(v) => update({ hvacOptionalDemandFactorPct: v })}
                  options={[
                    { value: 100, label: "100% — A/C or heat pump" },
                    { value: 65, label: "65% — electric heat, ≤4 separately controlled units" },
                    { value: 40, label: "40% — electric heat, 5+ separately controlled units" },
                  ]}
                />
              )}
            </Section>

            <Section title="EV charger">
              <CheckboxField label="Has EV charger" checked={input.hasEvCharger} onChange={(v) => update({ hasEvCharger: v })} />
              {input.hasEvCharger && (
                <NumberField label="EV charger nameplate" unit="VA" value={input.evChargerContinuousVa} onChange={(v) => update({ evChargerContinuousVa: v })} min={0} />
              )}
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.totalDemandVa == null ? (
                <EmptyResult message="Enter the dwelling's load details to see the demand calculation." />
              ) : (
                <ResultCard title="Demand load & service size">
                  <ResultRow label="General loads (before demand)" value={`${result.generalLoadsSubtotalVa.toFixed(0)} VA`} />
                  <ResultRow label="General loads (after demand)" value={`${result.generalLoadsDemandVa.toFixed(0)} VA`} />
                  <ResultRow label="Fixed appliances" value={`${result.fixedApplianceDemandVa.toFixed(0)} VA`} />
                  <ResultRow label="Range" value={`${result.rangeDemandVa.toFixed(0)} VA`} />
                  <ResultRow label="Dryer" value={`${result.dryerDemandVa.toFixed(0)} VA`} />
                  <ResultRow label="HVAC" value={`${result.hvacDemandVa.toFixed(0)} VA`} />
                  {result.evDemandVa > 0 && <ResultRow label="EV charger (×1.25)" value={`${result.evDemandVa.toFixed(0)} VA`} />}
                  <ResultRow label="Total demand load" value={`${result.totalDemandVa.toFixed(0)} VA`} />
                  <ResultRow label="Demand current" value={`${result.serviceAmps!.toFixed(1)} A`} />
                  <ResultRow label="Recommended minimum service" value={`${result.recommendedServiceA} A`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
