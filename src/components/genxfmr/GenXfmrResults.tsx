"use client";

import { GenResult, XfmrResult, NgrResult } from "@/lib/genxfmr";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function GenResultPanel({ result }: { result: GenResult }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Genset sizing result</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Genset kVA required for running load</span>
            <span className="text-foreground">{fmt(result.runKva, 1)} kVA</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Genset kVA required for voltage-dip limit</span>
            <span className="text-foreground">{result.dipReqKva !== null ? `${fmt(result.dipReqKva, 1)} kVA` : "Enter motor starting kVA"}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-accent/30 bg-accent/10 p-3 font-semibold">
            <span className="text-foreground">Recommended genset rating</span>
            <span className="text-foreground">{result.recommendedKva > 0 ? `${fmt(result.recommendedKva, 1)} kVA` : "—"}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Governing constraint</span>
            <span className="text-foreground">
              {result.governing === "dip" ? "Motor-starting voltage dip" : result.governing === "running" ? "Running (steady-state) load" : "—"}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Fuel estimate (at recommended rating)</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Fuel consumption at full load</span>
            <span className="text-foreground">{result.fuelRateLPerHr !== null ? `${fmt(result.fuelRateLPerHr, 1)} L/hr` : "—"}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Fuel cost per hour</span>
            <span className="text-foreground">{result.fuelCostPerHr !== null ? `$${fmt(result.fuelCostPerHr, 2)}` : "Enter fuel cost"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function XfmrResultPanel({ result }: { result: XfmrResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter no-load and/or load loss (from OC/SC test data) to see results.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Losses & efficiency</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Total loss at loading x</span>
            <span className="text-foreground">
              {fmt(result.totalLossW, 1)} W ({fmt(result.totalLossW / 1000, 3)} kW)
            </span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Efficiency at loading x</span>
            <span className="text-foreground">{fmt(result.effPct, 3)}%</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Loading fraction for max efficiency</span>
            <span className="text-foreground">{result.maxEffX !== null ? `${fmt(result.maxEffX, 3)} (${fmt(result.maxEffX * 100, 1)}%)` : "—"}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Maximum efficiency</span>
            <span className="text-foreground">{result.maxEffPct !== null ? `${fmt(result.maxEffPct, 3)}%` : "—"}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Voltage regulation</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">%R (resistance voltage, at rated I)</span>
            <span className="text-foreground">{fmt(result.vrPct, 3)}%</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">%X (reactance voltage)</span>
            <span className="text-foreground">{fmt(result.vxPct, 3)}%</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Voltage regulation at loading x</span>
            <span className="text-foreground">{fmt(result.regPct, 3)}%</span>
          </div>
        </div>
      </div>
      {result.annual && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Annual loss cost (approx.)</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Annual no-load loss energy</span>
              <span className="text-foreground">{fmt(result.annual.noLoadKwh, 0)} kWh/yr</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Annual load loss energy</span>
              <span className="text-foreground">{fmt(result.annual.loadKwh, 0)} kWh/yr</span>
            </div>
            <div className="flex justify-between pt-1 font-semibold">
              <span className="text-foreground">Total annual loss cost</span>
              <span className="text-foreground">${fmt(result.annual.costPerYr, 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NgrResultPanel({ result }: { result: NgrResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Subscriber feature — shown for preview only on the free site.
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">NGR sizing result</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Phase (line-neutral) voltage</span>
            <span className="text-foreground">{fmt(result.vPhaseV, 1)} V</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Grounding classification</span>
            <span className="text-foreground">{result.classification === "HRG" ? "High-Resistance Grounding (HRG)" : "Low-Resistance Grounding (LRG)"}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-accent/30 bg-accent/10 p-3 font-semibold">
            <span className="text-foreground">NGR resistance R = VLN/If</span>
            <span className="text-foreground">{fmt(result.rOhm, 2)} Ω</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2 pt-1">
            <span className="text-muted">Power dissipated at rated If</span>
            <span className="text-foreground">{fmt(result.pKw, 2)} kW</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Energy dissipated over time rating</span>
            <span className="text-foreground">{fmt(result.eMj, 3)} MJ</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Charging current check (If ≥ Ic)</span>
            <span className={`font-semibold ${result.icPass ? "text-pass" : result.icPass === false ? "text-fail" : "text-foreground"}`}>
              {result.icPass === null ? "Enter Ic to check" : result.icPass ? "✅ PASS" : "❌ FAIL"}
            </span>
          </div>
        </div>
      </div>
      {result.net && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">NET (if used)</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">NET short-time rating</span>
              <span className="text-foreground">{fmt(result.net.netKva, 2)} kVA</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted">Secondary resistor value</span>
              <span className="text-foreground">{fmt(result.net.rSecOhm, 3)} Ω</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
