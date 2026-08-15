"use client";

import { CableSizingInput, CableSizingResult } from "@/lib/cable";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

export default function CableResults({
  input,
  result,
}: {
  input: CableSizingInput;
  result: CableSizingResult;
}) {
  if (result.error) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="rounded-lg border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
          {result.error}
        </div>
      </div>
    );
  }

  const sel = result.selected;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">
          {input.label || "Circuit"} — Result
        </h3>

        {!sel ? (
          <div className="mt-4 rounded-lg border border-fail/30 bg-fail/10 p-4 text-sm text-fail">
            No standard size up to 630 mm² satisfies both ampacity and voltage-drop
            for this circuit. Check load, length, or installation method.
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                <div className="text-xs text-muted">Cable Size</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {input.parallelRuns > 1 ? `${input.parallelRuns} × ` : ""}
                  {sel.size} mm²
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {input.material === "Cu" ? "Copper" : "Aluminium"} ·{" "}
                  {input.insulation === "XLPE90" ? "XLPE/EPR 90°C" : "PVC 70°C"}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="text-xs text-muted">Design Current Ib</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {fmt(result.Ib, 1)} A
                </div>
                {result.nPar > 1 && (
                  <div className="mt-0.5 text-xs text-muted">{fmt(result.IbPerRun, 1)} A per run</div>
                )}
              </div>
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <div className="text-xs text-muted">Derated Ampacity Iz</div>
                <div className="mt-1 text-xl font-semibold text-foreground">
                  {fmt(sel.deratedAmp * result.nPar, 1)} A
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {input.premiumEnabled ? `Cf = ${fmt(result.Cf, 3)}` : "No derating (base rating)"}
                </div>
              </div>
              <div
                className={`rounded-lg border p-4 ${
                  sel.vdOK ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"
                }`}
              >
                <div className="text-xs text-muted">Voltage Drop</div>
                <div className={`mt-1 text-xl font-semibold ${sel.vdOK ? "text-pass" : "text-fail"}`}>
                  {sel.vd ? fmt(sel.vd.vd_pct, 2) : "—"}%
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {sel.vd ? `${fmt(sel.vd.vd_volts, 2)} V over ${input.length} m` : ""} (limit {input.maxVD}%)
                </div>
              </div>
            </div>

            <div
              className={`mt-4 rounded-lg border p-3 text-sm font-medium ${
                sel.allOK ? "border-pass/30 bg-pass/10 text-pass" : "border-fail/30 bg-fail/10 text-fail"
              }`}
            >
              {sel.allOK ? "✓ This size satisfies ampacity and voltage-drop requirements." : "⚠ Marginal — review inputs."}
            </div>
          </>
        )}
      </div>

      {result.rows.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Sizing comparison table</h3>
          <p className="mt-1 text-xs text-muted">
            Every standard size evaluated against ampacity and voltage-drop. The
            smallest size that passes both is selected above.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted">
                  <th className="py-2 pr-4 font-medium">Size (mm²)</th>
                  <th className="py-2 pr-4 font-medium">Base ampacity (A)</th>
                  <th className="py-2 pr-4 font-medium">Derated Iz (A)</th>
                  <th className="py-2 pr-4 font-medium">Ampacity</th>
                  <th className="py-2 pr-4 font-medium">Volt drop</th>
                  <th className="py-2 font-medium">Overall</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr
                    key={r.size}
                    className={`border-b border-border/60 ${
                      result.selected?.size === r.size ? "bg-accent/10" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 font-medium text-foreground">{r.size}</td>
                    <td className="py-2 pr-4 text-muted">{r.baseAmp > 0 ? fmt(r.baseAmp, 1) : "—"}</td>
                    <td className="py-2 pr-4 text-muted">{r.baseAmp > 0 ? fmt(r.deratedAmp, 1) : "—"}</td>
                    <td className="py-2 pr-4">
                      {r.baseAmp > 0 ? (
                        <span className={r.ampOK ? "text-pass" : "text-fail"}>{r.ampOK ? "✓" : "✕"}</span>
                      ) : (
                        <span className="text-muted/50">n/a</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {r.vd ? (
                        <span className={r.vdOK ? "text-pass" : "text-fail"}>
                          {r.vdOK ? "✓" : "✕"} {fmt(r.vd.vd_pct, 2)}%
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2">
                      {r.baseAmp > 0 ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            r.allOK ? "bg-pass/15 text-pass" : "bg-fail/15 text-fail"
                          }`}
                        >
                          {r.allOK ? "PASS" : "FAIL"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted/50">n/a for method</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
