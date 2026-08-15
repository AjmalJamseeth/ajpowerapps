"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, TextField, Section, ResultCard, ResultRow, CheckRow } from "@/components/fields";
import {
  DEFAULT_LCC_GLOBAL,
  DEFAULT_LCC_OPTION_A,
  DEFAULT_LCC_OPTION_B,
  LccGlobalInput,
  LccOptionInput,
  calcLccCompare,
} from "@/lib/lcc";

export default function LifeCycleCostPage() {
  const [global, setGlobal] = useState<LccGlobalInput>(DEFAULT_LCC_GLOBAL);
  const [a, setA] = useState<LccOptionInput>(DEFAULT_LCC_OPTION_A);
  const [b, setB] = useState<LccOptionInput>(DEFAULT_LCC_OPTION_B);
  const updateGlobal = (patch: Partial<LccGlobalInput>) => setGlobal((prev) => ({ ...prev, ...patch }));
  const updateA = (patch: Partial<LccOptionInput>) => setA((prev) => ({ ...prev, ...patch }));
  const updateB = (patch: Partial<LccOptionInput>) => setB((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcLccCompare(a, b, global), [a, b, global]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Life-Cycle Cost (LCC) Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Discounted-cash-flow life-cycle cost comparison of two options —
          e.g. standard vs. premium-efficiency equipment — with present-worth
          operating cost, equivalent annual cost, and simple payback.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Life-Cycle Cost (LCC) Calculator" standardsLine="Discounted cash flow / engineering economics" />
          <FeedbackButton calculatorName="Life-Cycle Cost (LCC) Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Compares the full life-cycle cost of two equipment/design options — typically a lower-first-cost/higher-operating-cost option against a higher-first-cost/higher-efficiency option — using standard discounted-cash-flow engineering economics: initial cost plus the present worth of annual operating costs (optionally escalating) minus the present worth of salvage value."
            standards={["Standard discounted-cash-flow / engineering-economics method (consistent with the approach in references such as IEEE 1013 and general engineering economics texts) — not a single numbered standard"]}
            capabilities={[
              "Life-cycle cost (LCC) for each option: initial cost + present worth of annual operating cost (with optional annual escalation) − present worth of salvage value.",
              "Equivalent Annual Cost (EAC) via the capital recovery factor — useful for comparing options with different analysis periods.",
              "Simple payback: years for Option B's extra initial cost to be recovered by its lower annual operating cost.",
              "Head-to-head comparison flagging which option has the lower life-cycle cost.",
            ]}
            example={{
              problem: "Standard-efficiency option: $50,000 initial, $12,000/yr operating, 3% escalation. Premium-efficiency option: $68,000 initial, $8,500/yr operating, 3% escalation. 6% discount rate, 20-year analysis period.",
              steps: [
                "Present worth of Option A's operating cost = Σ 12,000×(1.03)^(t-1)/(1.06)^t for t=1..20 ≈ $174,738.",
                "Option A LCC = 50,000 + 174,738 = $224,738.",
                "Present worth of Option B's operating cost ≈ $123,773 → Option B LCC = 68,000 + 123,773 = $191,773.",
                "Simple payback = (68,000 − 50,000) / (12,000 − 8,500) = 18,000 / 3,500 ≈ 5.14 years.",
              ],
              result: "Option B (premium) has the lower life-cycle cost by about $32,965 over 20 years, paying back its extra first cost in about 5.14 years — hand-checked and matched the live code exactly.",
            }}
            notes="Discount rate should be consistent with how the operating costs are expressed (nominal discount rate with nominal/escalating costs, or real discount rate with today's-dollar/non-escalating costs) — don't mix the two conventions. Salvage value and periodic (non-annual) maintenance overhauls aren't modeled as separate line items here; roll major overhauls into the annual operating cost as an equivalent annualized figure if needed."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Analysis parameters">
              <NumberField label="Discount rate" unit="%/yr" tip="The rate used to convert future costs to present value — should reflect the cost of capital or a minimum acceptable rate of return." value={global.discountRatePct} onChange={(v) => updateGlobal({ discountRatePct: v })} min={0} step={0.1} />
              <NumberField label="Analysis period" unit="years" tip="The number of years over which life-cycle cost is evaluated — typically the expected service life of the shorter-lived option." value={global.analysisPeriodYears} onChange={(v) => updateGlobal({ analysisPeriodYears: v })} min={1} step={1} />
            </Section>

            <Section title="Option A">
              <div className="col-span-2">
                <TextField label="Label" value={a.label} onChange={(v) => updateA({ label: v })} />
              </div>
              <NumberField label="Initial cost" value={a.initialCost} onChange={(v) => updateA({ initialCost: v })} min={0} />
              <NumberField label="Annual operating cost" hint="year 1" value={a.annualOperatingCost} onChange={(v) => updateA({ annualOperatingCost: v })} min={0} />
              <NumberField label="Annual escalation" unit="%/yr" value={a.escalationRatePct} onChange={(v) => updateA({ escalationRatePct: v })} step={0.1} />
              <NumberField label="Salvage value" hint="at end of period" value={a.salvageValue} onChange={(v) => updateA({ salvageValue: v })} min={0} />
            </Section>

            <Section title="Option B">
              <div className="col-span-2">
                <TextField label="Label" value={b.label} onChange={(v) => updateB({ label: v })} />
              </div>
              <NumberField label="Initial cost" value={b.initialCost} onChange={(v) => updateB({ initialCost: v })} min={0} />
              <NumberField label="Annual operating cost" hint="year 1" value={b.annualOperatingCost} onChange={(v) => updateB({ annualOperatingCost: v })} min={0} />
              <NumberField label="Annual escalation" unit="%/yr" value={b.escalationRatePct} onChange={(v) => updateB({ escalationRatePct: v })} step={0.1} />
              <NumberField label="Salvage value" hint="at end of period" value={b.salvageValue} onChange={(v) => updateB({ salvageValue: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <ResultCard title={a.label || "Option A"}>
                {result.a.lcc != null && <ResultRow label="Present worth, operating" value={result.a.presentWorthOperating?.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
                {result.a.lcc != null && <ResultRow label="Life-cycle cost" value={result.a.lcc.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
                {result.a.equivalentAnnualCost != null && <ResultRow label="Equivalent annual cost" value={result.a.equivalentAnnualCost.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
              </ResultCard>

              <ResultCard title={b.label || "Option B"}>
                {result.b.lcc != null && <ResultRow label="Present worth, operating" value={result.b.presentWorthOperating?.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
                {result.b.lcc != null && <ResultRow label="Life-cycle cost" value={result.b.lcc.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
                {result.b.equivalentAnnualCost != null && <ResultRow label="Equivalent annual cost" value={result.b.equivalentAnnualCost.toLocaleString(undefined, { style: "currency", currency: "USD" })} />}
              </ResultCard>

              {result.lowerLifeCycleCostOption != null && (
                <ResultCard title="Comparison">
                  <CheckRow
                    label="Lower life-cycle cost"
                    value={result.lowerLifeCycleCostOption === "B" ? b.label || "Option B" : a.label || "Option A"}
                    pass={true}
                  />
                  {result.lccSavingsBvsA != null && (
                    <ResultRow label="LCC savings (B vs A)" value={result.lccSavingsBvsA.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                  )}
                  {result.simplePaybackYears != null && (
                    <ResultRow label="Simple payback (extra cost of B)" value={`${result.simplePaybackYears.toFixed(2)} years`} />
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
