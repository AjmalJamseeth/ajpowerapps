"use client";

import { VtInput, VtResult } from "@/lib/vt";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function VtResults({ input, result }: { input: VtInput; result: VtResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter the system voltage to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">VT sizing result</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Rated ratio</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.n, 1)} : 1</div>
            <div className="mt-0.5 text-xs text-muted">
              {fmt(result.upKv, 3)} kV / {fmt(result.usV, 2)} V
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Voltage factor Vf</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {result.vf}× ({result.vfTimeLabel})
            </div>
            <div className="mt-0.5 text-xs text-muted">{result.vfBasis}</div>
          </div>
          <div className={`rounded-lg border p-4 ${result.accuracyMaintained ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"}`}>
            <div className="text-xs text-muted">Connected burden</div>
            <div className={`mt-1 text-xl font-semibold ${result.accuracyMaintained ? "text-pass" : "text-fail"}`}>
              {fmt(result.burdenVaTotal)} VA
            </div>
            <div className="mt-0.5 text-xs text-muted">
              {fmt(result.loadPct, 0)}% of {result.selectedVa} VA rated output
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Recommended standard size</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{result.recommendedVa} VA</div>
            <div className="mt-0.5 text-xs text-muted">Smallest standard size ≥ burden</div>
          </div>
        </div>
        {!result.accuracyMaintained && result.burdenVaTotal > 0 && (
          <div className="mt-4 rounded-lg border border-fail/30 bg-fail/10 px-3 py-2 text-sm text-fail">
            ❌ Burden is outside the 25–100% of rated output range where
            accuracy class is guaranteed — pick a different standard VA
            rating or adjust the connected burden.
          </div>
        )}
        {result.accuracyMaintained && (
          <div className="mt-4 rounded-lg border border-pass/30 bg-pass/10 px-3 py-2 text-sm text-pass">
            ✅ Burden is within the 25–100% of rated output range — accuracy
            class {input.accuracyClass} is maintained (also requires 80–120%
            rated voltage, per IEC 61869-3).
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Burden breakdown</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[380px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 pr-4 font-medium">Device</th>
                <th className="py-2 font-medium">VA @ rated secondary voltage</th>
              </tr>
            </thead>
            <tbody>
              {input.burdenItems.map((it, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-foreground">{it.label}</td>
                  <td className="py-2 text-muted">{fmt(it.va)} VA</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Total</td>
                <td className="py-2 font-medium text-foreground">{fmt(result.burdenVaTotal)} VA</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Secondary lead voltage drop</h3>
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted">Lead resistance</div>
            <div className="font-semibold text-foreground">{fmt(result.rlead, 3)} Ω</div>
          </div>
          <div>
            <div className="text-xs text-muted">Secondary loop current</div>
            <div className="font-semibold text-foreground">{fmt(result.ileadA, 3)} A</div>
          </div>
          <div>
            <div className="text-xs text-muted">Voltage drop</div>
            <div className="font-semibold text-foreground">
              {fmt(result.vdropV, 3)} V ({fmt(result.vdropPct, 2)}%)
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted">
          Approximate — assumes the connected burden draws current in phase
          with the secondary voltage. Long lead runs to a remote relay panel
          can meaningfully erode metering/protection accuracy even when the
          VT itself is correctly sized.
        </div>
      </div>
    </div>
  );
}
