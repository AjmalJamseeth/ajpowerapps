"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow } from "@/components/fields";
import { DEFAULT_TARIFF_INPUT, TariffInput, TouPeriod, calcTariff } from "@/lib/tariff";

function TouPeriodsEditor({ periods, onChange }: { periods: TouPeriod[]; onChange: (p: TouPeriod[]) => void }) {
  const update = (i: number, patch: Partial<TouPeriod>) => {
    onChange(periods.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  };
  const remove = (i: number) => onChange(periods.filter((_, idx) => idx !== i));
  const add = () => onChange([...periods, { label: `Period ${periods.length + 1}`, kwh: 0, ratePerKwh: 0 }]);

  return (
    <div className="col-span-2 space-y-2">
      {periods.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={p.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Period"
            className="w-28 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <input
            type="number"
            value={p.kwh}
            onChange={(e) => update(i, { kwh: parseFloat(e.target.value) || 0 })}
            step="any"
            min={0}
            placeholder="kWh"
            className="w-full min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-muted">kWh @</span>
          <input
            type="number"
            value={p.ratePerKwh}
            onChange={(e) => update(i, { ratePerKwh: parseFloat(e.target.value) || 0 })}
            step="any"
            min={0}
            placeholder="Rate"
            className="w-24 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md border border-border px-2 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60"
      >
        + Add TOU period
      </button>
    </div>
  );
}

export default function TariffPage() {
  const [input, setInput] = useState<TariffInput>(DEFAULT_TARIFF_INPUT);
  const update = (patch: Partial<TariffInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcTariff(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Demand Charge / TOU Tariff Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Estimates a monthly electricity bill from itemized time-of-use
          energy consumption, a peak demand charge, a fixed service charge,
          and an optional power-factor penalty.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Demand Charge / TOU Tariff Calculator" standardsLine="Utility tariff structure — rates entered per your utility's published schedule" />
          <FeedbackButton calculatorName="Demand Charge / TOU Tariff Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates a facility's monthly electricity bill by combining itemized time-of-use (TOU) energy charges, a peak-demand charge, a fixed/service charge, and an optional power-factor penalty — the same building blocks used by most commercial/industrial utility tariffs, including typical GCC-region structures (e.g. DEWA, SEWA, ADDC)."
            standards={["Utility tariff structure — every rate is a user-supplied input from your utility's published schedule, since tariff structures, TOU period definitions, and PF penalty formulas are genuinely utility/region-specific with no single universal standard"]}
            capabilities={[
              "Itemized time-of-use energy charge from any number of user-defined periods (e.g. peak/off-peak, or a full seasonal TOU schedule).",
              "Peak demand charge from the billing period's peak kW and the utility's demand rate.",
              "Optional power-factor penalty — a surcharge on the demand charge proportional to how far measured PF falls below the utility's threshold.",
              "Fixed/service charge, total bill, and a blended $/kWh rate across all energy purchased.",
            ]}
            example={{
              problem: "8,000kWh peak @ $0.42/kWh, 15,000kWh off-peak @ $0.22/kWh, 120kW peak demand @ $35/kW, PF measured 0.88 against a 0.90 threshold with a 0.5% penalty per 1-point shortfall, $100 fixed charge.",
              steps: [
                "Energy charge = 8,000×0.42 + 15,000×0.22 = 3,360 + 3,300 = $6,660.",
                "Demand charge = 120 × 35 = $4,200.",
                "PF shortfall = (0.90 − 0.88) × 100 = 2 points → penalty = 2 × 0.5% = 1% of the demand charge = $42.",
                "Total = 6,660 + 4,200 + 42 + 100 = $11,002.",
              ],
              result: "$11,002 total estimated bill, blended rate ≈$0.478/kWh — hand-checked and matched the live code exactly.",
            }}
            notes="Every rate, TOU period, and the PF penalty formula/threshold must be entered from your own utility's published tariff schedule — none of these are built-in constants, since they vary significantly by utility and region. The PF penalty formula shown (a surcharge per percentage-point shortfall on the demand charge) is a common pattern, not a universal one — confirm your utility's actual formula before relying on this for a real bill estimate."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Time-of-use energy">
              <TouPeriodsEditor periods={input.periods} onChange={(periods) => update({ periods })} />
            </Section>

            <Section title="Demand & fixed charges">
              <NumberField label="Peak demand" unit="kW" tip="The billing period's peak recorded demand." value={input.peakDemandKw} onChange={(v) => update({ peakDemandKw: v })} min={0} />
              <NumberField label="Demand rate" unit="/kW" tip="Your utility's demand charge rate." value={input.demandRatePerKw} onChange={(v) => update({ demandRatePerKw: v })} min={0} />
              <NumberField label="Fixed monthly charge" tip="Any flat service/customer charge that applies regardless of consumption." value={input.fixedMonthlyCharge} onChange={(v) => update({ fixedMonthlyCharge: v })} min={0} />
            </Section>

            <Section title="Power factor penalty (optional)">
              <NumberField label="Measured power factor" hint="0-1" tip="Your facility's measured power factor for the billing period." value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0} max={1} step={0.01} />
              <NumberField label="Utility PF threshold" hint="0-1" tip="The minimum power factor your utility requires before a penalty applies." value={input.pfPenaltyThreshold} onChange={(v) => update({ pfPenaltyThreshold: v })} min={0} max={1} step={0.01} />
              <NumberField label="Penalty rate" unit="% per point" tip="Surcharge on the demand charge per percentage-point of PF shortfall below the threshold — confirm the exact formula against your utility's tariff." value={input.pfPenaltyRatePct} onChange={(v) => update({ pfPenaltyRatePct: v })} min={0} step={0.1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <ResultCard title="Estimated bill">
                <ResultRow label="Total energy" value={`${result.totalKwh.toLocaleString()} kWh`} />
                <ResultRow label="Energy charge" value={result.energyCharge.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                <ResultRow label="Demand charge" value={result.demandCharge.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                {result.pfPenaltyCharge > 0 && (
                  <ResultRow label={`PF penalty (${result.pfPenaltyPct.toFixed(2)}%)`} value={result.pfPenaltyCharge.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                )}
                <ResultRow label="Fixed charge" value={result.fixedCharge.toLocaleString(undefined, { style: "currency", currency: "USD" })} />
                <ResultRow label="Total bill" value={<span className="text-lg text-accent-2">{result.totalBill.toLocaleString(undefined, { style: "currency", currency: "USD" })}</span>} />
                {result.blendedRatePerKwh != null && (
                  <ResultRow label="Blended rate" value={`${result.blendedRatePerKwh.toFixed(4)}/kWh`} />
                )}
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
