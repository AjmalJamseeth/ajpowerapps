"use client";

import { EvResult } from "@/lib/ev";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function EvResults({ result }: { result: EvResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter the EVSE rated current to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Charge point sizing result</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Design current Ib</span>
            <span className="text-foreground">{fmt(result.designCurrentA, 1)} A</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Recommended cable size</span>
            <span className="text-foreground">{result.cable.size ? `${result.cable.size} mm²` : "No standard size satisfies ampacity & 5% VD"}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Derated ampacity</span>
            <span className="text-foreground">{result.cable.amp !== null ? `${fmt(result.cable.amp, 1)} A` : "—"}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Voltage drop</span>
            <span className="text-foreground">{result.cable.vd !== null ? `${fmt(result.cable.vd, 2)}%` : "—"}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">Recommended breaker</span>
            <span className="text-foreground">{result.breakerA ? `${result.breakerA} A` : "—"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">What this result covers</h3>
        <ul className="mt-3 space-y-1.5 text-sm">
          {[
            ["Cable current rating (ambient and grouping)", true],
            ["Voltage drop (5% limit)", true],
            ["Breaker rating: Ib ≤ In ≤ cable rating", true],
            ["Short-circuit withstand of the cable", false],
            ["Earth fault loop impedance / disconnection time", false],
            ["Breaker breaking capacity", false],
            ["Buried runs, soil, thermal insulation, harmonics", false],
            ["Local EV wiring rules and supply-authority requirements", false],
          ].map(([label, done]) => (
            <li key={label as string} className="flex justify-between gap-3 border-b border-border/40 pb-1.5 last:border-0">
              <span className="text-muted">{label as string}</span>
              <span className={done ? "text-accent-2" : "text-muted"}>{done ? "Checked" : "Not checked"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Use the LV Cable Sizing calculator for the short-circuit withstand and protective-conductor checks, and verify earth fault loop impedance for the actual supply.
        </p>
      </div>

      {result.modeNote && (
        <div className="rounded-lg border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-muted">{result.modeNote}</div>
      )}
      {result.earthingWarning && (
        <div className="rounded-lg border border-fail/30 bg-fail/10 px-4 py-3 text-sm text-fail">{result.earthingWarning}</div>
      )}
      <div className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted">{result.rcdNote}</div>

      {result.multiSite && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Multi charge point site</h3>
          <div className="mt-3 text-xs text-muted">{result.multiSite.note}</div>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Raw total (no diversity)</span>
              <span className="text-foreground">{fmt(result.multiSite.rawA, 1)} A</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Diversified design current</span>
              <span className="text-foreground">{fmt(result.multiSite.diversifiedA, 1)} A</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted">Recommended feeder size</span>
              <span className="text-foreground">
                {result.multiSite.feeder.size ? `${result.multiSite.feeder.size} mm²` : "No standard size found — consider parallel feeder runs"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
