"use client";

import { BusbarResult } from "@/lib/busbar";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function BusbarResults({ result }: { result: BusbarResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter bar width and thickness to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Continuous rating & temperature rise</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">Total cross-section (all bars)</span>
            <span className="text-foreground">{fmt(result.areaTotalMm2, 1)} mm²</span>
          </div>
          {result.deltaTK !== null ? (
            <>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted">AC resistance (per metre)</span>
                <span className="text-foreground">{fmt(result.racMOhmPerM!, 4)} mΩ/m</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted">I²R loss (per metre)</span>
                <span className="text-foreground">{fmt(result.plossWPerM!, 2)} W/m</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted">Calculated temperature rise ΔT</span>
                <span className="text-foreground">{fmt(result.deltaTK, 1)} K</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted">Resulting hot-spot temperature</span>
                <span className="text-foreground">{fmt(result.tsC!, 1)} °C</span>
              </div>
              <div className={`flex justify-between rounded-lg border p-3 font-semibold ${result.tempPass ? "border-pass/30 bg-pass/10 text-pass" : "border-fail/30 bg-fail/10 text-fail"}`}>
                <span>Continuous rating check</span>
                <span>{result.tempPass ? "✅ PASS" : "❌ FAIL"}</span>
              </div>
            </>
          ) : (
            <div className="text-xs text-muted">Enter a design (load) current above.</div>
          )}
          <div className="flex justify-between pt-1">
            <span className="text-muted">Estimated max continuous current at ΔT limit</span>
            <span className="text-foreground">{fmt(result.maxIA, 0)} A</span>
          </div>
        </div>
      </div>

      {result.thermal && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Short-time thermal withstand</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">k-factor used (bare conductor)</span>
              <span className="text-foreground">{result.thermal.kUsed}</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Minimum CSA required (adiabatic)</span>
              <span className="text-foreground">{fmt(result.thermal.minCsaMm2, 1)} mm²</span>
            </div>
            <div className={`flex justify-between rounded-lg border p-3 font-semibold ${result.thermal.pass ? "border-pass/30 bg-pass/10 text-pass" : "border-fail/30 bg-fail/10 text-fail"}`}>
              <span>Thermal withstand check</span>
              <span>{result.thermal.pass ? "✅ PASS" : "❌ FAIL"}</span>
            </div>
          </div>
        </div>
      )}

      {result.mech && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Electrodynamic force check</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted">Force per unit length</div>
              <div className="font-semibold text-foreground">{fmt(result.mech.forceNPerM, 1)} N/m</div>
            </div>
            <div>
              <div className="text-xs text-muted">Bending moment</div>
              <div className="font-semibold text-foreground">{fmt(result.mech.momentNm, 2)} N·m</div>
            </div>
            <div>
              <div className="text-xs text-muted">Bending stress σ</div>
              <div className="font-semibold text-foreground">{fmt(result.mech.stressMPa, 2)} MPa</div>
            </div>
            <div>
              <div className="text-xs text-muted">Allowable stress</div>
              <div className="font-semibold text-foreground">{fmt(result.mech.allowStressMPa, 2)} MPa</div>
            </div>
            <div className={`col-span-2 flex justify-between rounded-lg border p-3 font-semibold ${result.mech.pass ? "border-pass/30 bg-pass/10 text-pass" : "border-fail/30 bg-fail/10 text-fail"}`}>
              <span>Mechanical check</span>
              <span>{result.mech.pass ? "✅ PASS" : "❌ FAIL"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
