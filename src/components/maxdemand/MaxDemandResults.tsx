"use client";

import { MaxDemandResult } from "@/lib/maxdemand";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function MaxDemandResults({ result }: { result: MaxDemandResult }) {
  const activeRows = result.rows.filter((r) => r.loadKw > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Maximum demand result</h3>

        {result.totalConnectedKw === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
            Enter connected load for at least one category.
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="text-xs text-muted">Total connected load</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.totalConnectedKw)} kW</div>
              </div>
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                <div className="text-xs text-muted">Diversified maximum demand</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.totalDemandKw)} kW</div>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="text-xs text-muted">Effective diversity factor</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {result.effectiveDfPct !== null ? `${fmt(result.effectiveDfPct, 1)}%` : "—"}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="text-xs text-muted">Maximum demand current</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {result.currentA !== null ? `${fmt(result.currentA, 1)} A` : "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-pass/30 bg-pass/10 p-4">
              <span className="text-sm text-muted">Recommended main switch / breaker</span>
              <span className="text-lg font-semibold text-pass">
                {result.recommendedBreaker ? `${result.recommendedBreaker} A` : "—"}
              </span>
            </div>
          </>
        )}
      </div>

      {activeRows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Per-category breakdown</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-4 font-medium">Category</th>
                  <th className="py-2 pr-4 font-medium">Connected</th>
                  <th className="py-2 pr-4 font-medium">DF</th>
                  <th className="py-2 font-medium">Demand</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((r) => (
                  <tr key={r.key} className="border-b border-border/60">
                    <td className="py-2 pr-4 text-foreground">{r.label}</td>
                    <td className="py-2 pr-4 text-muted">{fmt(r.loadKw)} kW</td>
                    <td className="py-2 pr-4 text-muted">{r.dfPct}%</td>
                    <td className="py-2 font-medium text-foreground">{fmt(r.demandKw)} kW</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.site && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Site &amp; transformer</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <div className="text-xs text-muted">Total site maximum demand</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{fmt(result.site.siteMdKw)} kW</div>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <div className="text-xs text-muted">Transformer required (with margin)</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{fmt(result.site.transformerKva, 1)} kVA</div>
            </div>
            <div className="rounded-lg border border-pass/30 bg-pass/10 p-4">
              <div className="text-xs text-muted">Recommended standard transformer</div>
              <div className="mt-1 text-lg font-semibold text-pass">
                {result.site.recommendedTransformer ? `${result.site.recommendedTransformer} kVA` : "None ≥ requirement"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
