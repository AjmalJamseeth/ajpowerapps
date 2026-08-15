"use client";

import { CtInput, CtResult } from "@/lib/ct";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function CtResults({ input, result }: { input: CtInput; result: CtResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter CT primary and secondary current to see results.
        </div>
      </div>
    );
  }

  const relayVa = input.burdenItems.reduce((s, it) => s + (it.va || 0), 0) || 2.5;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">CT sizing result</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">CT ratio</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {input.ip}/{input.is} A
            </div>
            <div className="mt-0.5 text-xs text-muted">n = {fmt(result.n, 0)}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Total burden Rb</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.rb, 3)} Ω</div>
            <div className="mt-0.5 text-xs text-muted">{fmt(result.burdenVa)} VA at rated Is</div>
          </div>
          <div className={`rounded-lg border p-4 ${result.alfPass ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"}`}>
            <div className="text-xs text-muted">ALF actual {result.alfPass ? "✅" : "❌"}</div>
            <div className={`mt-1 text-xl font-semibold ${result.alfPass ? "text-pass" : "text-fail"}`}>
              {input.vk > 0 ? `${fmt(result.alfActual, 1)}×` : "—"}
            </div>
            <div className="mt-0.5 text-xs text-muted">Required ALF = {input.alfRated}×</div>
          </div>
          <div className={`rounded-lg border p-4 ${result.alfPass ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"}`}>
            <div className="text-xs text-muted">Vk required</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.vkReq, 1)} V</div>
            <div className="mt-0.5 text-xs text-muted">Actual Vk = {input.vk || "not set"} V</div>
          </div>
        </div>
        {!result.alfPass && input.vk > 0 && (
          <div className="mt-4 rounded-lg border border-fail/30 bg-fail/10 px-3 py-2 text-sm text-fail">
            ❌ FAIL — increase knee-point voltage Vk or reduce secondary burden.
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
                <th className="py-2 pr-4 font-medium">VA @ In</th>
                <th className="py-2 font-medium">Resistance</th>
              </tr>
            </thead>
            <tbody>
              {input.burdenItems.map((it, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2 pr-4 text-foreground">{it.label}</td>
                  <td className="py-2 pr-4 text-muted">{fmt(it.va)} VA</td>
                  <td className="py-2 text-muted">{fmt((it.va || 0) / (input.is * input.is), 3)} Ω</td>
                </tr>
              ))}
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 text-foreground">Lead resistance ({input.cableL} m, {input.cableA} mm²)</td>
                <td className="py-2 pr-4 text-muted">—</td>
                <td className="py-2 text-muted">{fmt(result.rlead, 3)} Ω</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">Total</td>
                <td className="py-2 pr-4 font-medium text-foreground">{fmt(relayVa)} VA (relay/meter)</td>
                <td className="py-2 font-medium text-foreground">{fmt(result.rb, 3)} Ω</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Fault current table</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted">
                <th className="py-2 pr-4 font-medium">Fault level</th>
                <th className="py-2 pr-4 font-medium">Primary (A)</th>
                <th className="py-2 pr-4 font-medium">Secondary ideal (A)</th>
                <th className="py-2 font-medium">Secondary at ALF limit (A)</th>
              </tr>
            </thead>
            <tbody>
              {result.faultTable.map((r) => (
                <tr key={r.multiple} className="border-b border-border/60 last:border-0">
                  <td className="py-2 pr-4 text-foreground">{r.multiple}× In</td>
                  <td className="py-2 pr-4 text-muted">{fmt(r.primaryA, 0)}</td>
                  <td className="py-2 pr-4 text-muted">{fmt(r.secondaryIdealA)}</td>
                  <td className="py-2 text-muted">{fmt(r.secondaryAtAlfA)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
