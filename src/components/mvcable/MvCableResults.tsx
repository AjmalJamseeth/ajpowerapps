"use client";

import { MvCableResult } from "@/lib/mvcable";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function MvCableResults({ result }: { result: MvCableResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter the full cable geometry (conductor, insulation, sheath) and installation conditions to see results. If the inputs don&apos;t converge to a physical solution, check the geometry and soil values.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Current rating result</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between rounded-lg border border-accent/30 bg-accent/10 p-3 font-semibold">
            <span className="text-foreground">Continuous current rating I</span>
            <span className="text-foreground">{fmt(result.ratingA, 1)} A</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2 pt-1">
            <span className="text-muted">Conductor temperature θc</span>
            <span className="text-foreground">{fmt(result.thetaCondC, 2)} °C</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Sheath temperature θs</span>
            <span className="text-foreground">{fmt(result.thetaSheathC, 2)} °C</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Iterations to converge</span>
            <span className="text-foreground">{result.iterations}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Thermal & loss detail</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">T1 (conductor → sheath)</span>
            <span className="text-foreground">{fmt(result.t1, 4)} K·m/W</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">T3 (sheath → armour/serving)</span>
            <span className="text-foreground">{fmt(result.t3, 4)} K·m/W</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">T4 (cable surface → ambient)</span>
            <span className="text-foreground">{fmt(result.t4, 4)} K·m/W</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Sheath loss factor λ1′</span>
            <span className="text-foreground">{fmt(result.lambda1, 4)}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Dielectric loss Wd</span>
            <span className="text-foreground">{fmt(result.dielectricLossWPerM, 4)} W/m</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Capacitance C</span>
            <span className="text-foreground">{fmt(result.capacitanceFPerM * 1e9, 4)} nF/m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
