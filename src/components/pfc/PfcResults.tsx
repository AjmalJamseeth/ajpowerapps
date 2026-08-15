"use client";

import { PfcInput, PfcResult } from "@/lib/pfc";

function fmt(n: number, d = 1) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function PfcResults({ input, result }: { input: PfcInput; result: PfcResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter active load and power factors to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Correction result</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
            <div className="text-xs text-muted">Compensation required Qc</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.Qc)} kVAr</div>
            <div className="mt-0.5 text-xs text-muted">Qc = P·(tan φ₁ − tan φ₂)</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Capacitance C</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.C_uF, 2)} µF</div>
            <div className="mt-0.5 text-xs text-muted">Per phase · IEC 60831</div>
          </div>
          <div className="rounded-lg border border-pass/30 bg-pass/10 p-4">
            <div className="text-xs text-muted">Current reduction</div>
            <div className="mt-1 text-xl font-semibold text-pass">{fmt(result.currentReductionPct)}%</div>
            <div className="mt-0.5 text-xs text-muted">
              {fmt(result.I1)} A → {fmt(result.I2)} A
            </div>
          </div>
          <div className="rounded-lg border border-pass/30 bg-pass/10 p-4">
            <div className="text-xs text-muted">kVA demand saving</div>
            <div className="mt-1 text-xl font-semibold text-pass">{fmt(result.kvaSaving)} kVA</div>
            <div className="mt-0.5 text-xs text-muted">
              {fmt(result.S1)} → {fmt(result.S2)} kVA
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Before / after comparison</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 pr-4 font-medium">Parameter</th>
                <th className="py-2 pr-4 font-medium">Before (PF {input.pf1})</th>
                <th className="py-2 pr-4 font-medium">After (PF {input.pf2})</th>
                <th className="py-2 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-foreground">Apparent power (kVA)</td>
                <td className="py-2 pr-4 text-muted">{fmt(result.S1)}</td>
                <td className="py-2 pr-4 text-muted">{fmt(result.S2)}</td>
                <td className="py-2 text-pass">−{fmt(result.kvaSaving)}</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-foreground">Current (A)</td>
                <td className="py-2 pr-4 text-muted">{fmt(result.I1)}</td>
                <td className="py-2 pr-4 text-muted">{fmt(result.I2)}</td>
                <td className="py-2 text-pass">
                  −{fmt(result.I1 - result.I2)} ({fmt(result.currentReductionPct)}%)
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 text-foreground">Reactive power (kVAr)</td>
                <td className="py-2 pr-4 text-muted">{fmt(result.Q1)}</td>
                <td className="py-2 pr-4 text-muted">{fmt(result.Q2)}</td>
                <td className="py-2 text-pass">−{fmt(result.Qc)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {result.resonance && (
        <div
          className={`rounded-xl border p-6 ${
            result.resonance.risk === "high"
              ? "border-fail/30 bg-fail/10"
              : result.resonance.risk === "moderate"
                ? "border-accent/30 bg-accent/10"
                : "border-border bg-surface"
          }`}
        >
          <h3 className="text-base font-semibold text-foreground">Harmonic resonance</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted">Resonance frequency</div>
              <div className="font-semibold text-foreground">{fmt(result.resonance.fr)} Hz</div>
            </div>
            <div>
              <div className="text-xs text-muted">Harmonic order</div>
              <div className="font-semibold text-foreground">{fmt(result.resonance.hr, 2)}th</div>
            </div>
          </div>
          {result.resonance.risk === "high" && (
            <div className="mt-3 text-sm font-medium text-fail">
              ⚠ Resonance below the 5th harmonic — a detuning reactor is required.
            </div>
          )}
          {result.resonance.risk === "moderate" && (
            <div className="mt-3 text-sm font-medium text-accent">
              ⚠ Resonance near the 5th harmonic — consider a detuning reactor.
            </div>
          )}
        </div>
      )}

      {result.reactor && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Detuning reactor</h3>
          <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted">Tuning frequency</div>
              <div className="font-semibold text-foreground">{fmt(result.reactor.ft)} Hz</div>
            </div>
            <div>
              <div className="text-xs text-muted">Reactance XL</div>
              <div className="font-semibold text-foreground">{fmt(result.reactor.XL, 3)} Ω</div>
            </div>
            <div>
              <div className="text-xs text-muted">Reactor rating</div>
              <div className="font-semibold text-foreground">{fmt(result.reactor.reactorKvar)} kVAr</div>
            </div>
          </div>
        </div>
      )}

      {result.savings && (
        <div className="rounded-xl border border-pass/30 bg-pass/10 p-6">
          <h3 className="text-base font-semibold text-foreground">Energy savings</h3>
          <div className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted">Loss reduction</div>
              <div className="font-semibold text-foreground">{fmt(result.savings.lossKw, 2)} kW</div>
            </div>
            <div>
              <div className="text-xs text-muted">Annual energy saving</div>
              <div className="font-semibold text-foreground">{fmt(result.savings.energyKwhPerYr, 0)} kWh</div>
            </div>
            <div>
              <div className="text-xs text-muted">Demand saving</div>
              <div className="font-semibold text-foreground">{fmt(result.savings.demandSavingKva)} kVA</div>
            </div>
            <div>
              <div className="text-xs text-muted">Annual cost saving</div>
              <div className="font-semibold text-pass">{fmt(result.savings.annualCost, 0)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
