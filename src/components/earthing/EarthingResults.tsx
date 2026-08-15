"use client";

import { EarthingResult } from "@/lib/earthing";
import { Lock } from "lucide-react";

function fmt(n: number | null, d = 2, unit = "") {
  return n !== null && n !== undefined ? `${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}${unit}` : "—";
}

export default function EarthingResults({ result }: { result: EarthingResult }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Quick results</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
            <div className="text-xs text-muted">Grid resistance Rg</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.Rg, 4, " Ω")}</div>
            <div className="mt-0.5 text-xs text-muted">Sverak formula · IEEE 80 Eq. 57</div>
          </div>
          <div className={`rounded-lg border p-4 ${result.GPR && result.GPR > 1000 ? "border-accent/30 bg-accent/10" : "border-border bg-surface-2"}`}>
            <div className="text-xs text-muted">Ground potential rise GPR</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.GPR, 1, " V")}</div>
            <div className="mt-0.5 text-xs text-muted">IG × Rg = {fmt(result.IG, 0)} × {fmt(result.Rg, 4)}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Tolerable touch voltage</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.Etouch, 1, " V")}</div>
          </div>
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Tolerable step voltage</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.Estep, 1, " V")}</div>
          </div>
          <div className="col-span-2 rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">Minimum conductor size</div>
            <div className="mt-1 text-xl font-semibold text-foreground">{fmt(result.Smin, 1, " mm²")}</div>
            <div className="mt-0.5 text-xs text-muted">Adiabatic · IEEE 80 / BS 7430</div>
          </div>
        </div>
      </div>

      {result.mesh ? (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Mesh &amp; step voltage</h3>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className={`rounded-lg border p-4 ${result.mesh.touchPass ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">Mesh voltage Em</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.mesh.touchPass ? "bg-pass/20 text-pass" : "bg-fail/20 text-fail"}`}>
                  {result.mesh.touchPass ? "PASS" : "FAIL"}
                </span>
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">{fmt(result.mesh.Em, 1, " V")}</div>
              <div className="mt-0.5 text-xs text-muted">Tolerable Etouch = {fmt(result.Etouch, 1, " V")}</div>
            </div>
            <div className={`rounded-lg border p-4 ${result.mesh.stepPass ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted">Step voltage Es</div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${result.mesh.stepPass ? "bg-pass/20 text-pass" : "bg-fail/20 text-fail"}`}>
                  {result.mesh.stepPass ? "PASS" : "FAIL"}
                </span>
              </div>
              <div className="mt-1 text-lg font-semibold text-foreground">{fmt(result.mesh.Es, 1, " V")}</div>
              <div className="mt-0.5 text-xs text-muted">Tolerable Estep = {fmt(result.Estep, 1, " V")}</div>
            </div>
          </div>
          <div
            className={`mt-4 rounded-lg border p-3 text-sm font-medium ${
              result.mesh.touchPass && result.mesh.stepPass ? "border-pass/30 bg-pass/10 text-pass" : "border-fail/30 bg-fail/10 text-fail"
            }`}
          >
            {result.mesh.touchPass && result.mesh.stepPass
              ? "✓ Grid satisfies IEEE 80 touch and step voltage requirements."
              : "✕ Grid does NOT satisfy IEEE 80 — increase conductor density, add ground rods, or reduce soil resistivity."}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-6">
          <div className="flex items-start gap-2 text-sm text-muted">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>
              Mesh voltage (Em), step voltage (Es), and the pass/fail safety
              verdict against IEEE 80 tolerable limits are a subscriber
              feature. Grid resistance and GPR above are free.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
