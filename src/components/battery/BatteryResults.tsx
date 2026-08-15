"use client";

import { BatteryInput, BatteryResult } from "@/lib/battery";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function BatteryResults({ result }: { input: BatteryInput; result: BatteryResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter at least one duty-cycle period to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Section-by-section capacity (IEEE 485)</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 pr-4 font-medium">Section</th>
                <th className="py-2 pr-4 font-medium">I (A)</th>
                <th className="py-2 pr-4 font-medium">Cumulative T (min)</th>
                <th className="py-2 pr-4 font-medium">Kt(T)</th>
                <th className="py-2 font-medium">Required Aⱼ</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr
                  key={r.section}
                  className={`border-b border-border/60 last:border-0 ${r.section === result.maxSection ? "text-accent font-semibold" : ""}`}
                >
                  <td className="py-2 pr-4">{r.section}</td>
                  <td className="py-2 pr-4">{r.i}</td>
                  <td className="py-2 pr-4">{r.t}</td>
                  <td className="py-2 pr-4">{fmt(r.kt, 4)}</td>
                  <td className="py-2">
                    {fmt(r.a, 3)}
                    {r.section === result.maxSection ? " ← governs" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Required battery capacity</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Largest section (uncorrected)</span>
            <span className="text-foreground">
              {fmt(result.maxA, 3)} (section {result.maxSection})
            </span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">+ Random/intermittent loads</span>
            <span className="text-foreground">{result.randomSum > 0 ? `+${fmt(result.randomSum, 3)}` : "none entered"}</span>
          </div>
          <div className="flex justify-between rounded-lg border border-accent/30 bg-accent/10 p-3 font-semibold">
            <span className="text-foreground">Required rated capacity</span>
            <span className="text-foreground">{fmt(result.final, 3)}</span>
          </div>
          <div className="text-xs text-muted">In whatever units your Kt table used (Ah, positive-plate number, etc.).</div>
        </div>
      </div>

      {result.cell && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Cell count & voltage window</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted">Number of cells</div>
              <div className="font-semibold text-foreground">{result.cell.nCells}</div>
            </div>
            <div>
              <div className="text-xs text-muted">String voltage at equalize</div>
              <div className="font-semibold text-foreground">{fmt(result.cell.vEqString, 1)} V</div>
            </div>
            <div>
              <div className="text-xs text-muted">Equalize check</div>
              <div className={`font-semibold ${result.cell.eqPass ? "text-pass" : "text-fail"}`}>
                {result.cell.eqPass === null ? "Enter equipment max V" : result.cell.eqPass ? "✅ PASS" : "❌ FAIL"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted">String voltage at EOD</div>
              <div className="font-semibold text-foreground">{fmt(result.cell.vEodString, 1)} V</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs text-muted">EOD voltage check</div>
              <div className={`font-semibold ${result.cell.eodPass ? "text-pass" : "text-fail"}`}>
                {result.cell.eodPass === null ? "Enter equipment min V" : result.cell.eodPass ? "✅ PASS" : "❌ FAIL"}
              </div>
            </div>
          </div>
        </div>
      )}

      {result.charger && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Charger sizing</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted">Recharge current</div>
              <div className="font-semibold text-foreground">{fmt(result.charger.rechargeA, 2)} A</div>
            </div>
            <div>
              <div className="text-xs text-muted">Required charger rating</div>
              <div className="font-semibold text-foreground">{fmt(result.charger.totalChgA, 2)} A</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
