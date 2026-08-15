"use client";

import { PpeResult } from "@/lib/arcflash";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function ppeColor(cat: string) {
  if (cat === "—") return "border-border bg-surface-2 text-muted";
  if (cat === "1") return "border-pass/30 bg-pass/10 text-pass";
  if (cat === "2") return "border-accent-2/30 bg-accent-2/10 text-accent-2";
  if (cat === "3") return "border-accent/30 bg-accent/10 text-accent";
  return "border-fail/30 bg-fail/10 text-fail"; // 4, DANGER
}

export default function ArcFlashResults({
  ready,
  arcingCurrent,
  incidentEnergy,
  boundaryMm,
  ppe,
  rangeWarning,
}: {
  ready: boolean;
  arcingCurrent: number | null;
  incidentEnergy: number | null;
  boundaryMm: number | null;
  ppe: PpeResult | null;
  rangeWarning?: string | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-foreground">Results</h3>

      {!ready ? (
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter the fault current, voltage, distance and arc duration to see results.
        </div>
      ) : (
        <>
          {rangeWarning && (
            <div className="mt-4 rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-accent">
              ⚠ {rangeWarning}
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            {arcingCurrent !== null && (
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="text-xs text-muted">Arcing current Ia</div>
                <div className="mt-1 text-xl font-semibold text-foreground">{fmt(arcingCurrent)} kA</div>
              </div>
            )}
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <div className="text-xs text-muted">Incident energy</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {incidentEnergy !== null ? `${fmt(incidentEnergy)} cal/cm²` : "—"}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <div className="text-xs text-muted">Arc flash boundary</div>
              <div className="mt-1 text-xl font-semibold text-foreground">
                {boundaryMm !== null ? `${fmt(boundaryMm, 0)} mm (${fmt(boundaryMm / 25.4, 1)} in)` : "—"}
              </div>
            </div>
          </div>

          {ppe && (
            <div className={`mt-4 rounded-lg border p-4 ${ppeColor(ppe.cat)}`}>
              <div className="flex items-center justify-between">
                <div className="text-xs opacity-80">PPE category</div>
                {ppe.cat !== "—" && (
                  <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold">
                    {ppe.cat === "DANGER" ? "DANGER" : `Category ${ppe.cat}`}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm font-medium">{ppe.label}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
