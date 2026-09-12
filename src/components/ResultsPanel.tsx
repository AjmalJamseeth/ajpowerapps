"use client";

import { ChainCoordinationResult, RelaySettings, tripTime } from "@/lib/idmt";

function formatTime(t: number) {
  if (!isFinite(t)) return "No trip";
  if (t < 0.001) return `${(t * 1000).toFixed(2)} ms`;
  return `${t.toFixed(3)} s`;
}

export default function ResultsPanel({
  relays,
  faultCurrent,
  requiredMargin,
  onRequiredMarginChange,
  chainResult,
}: {
  relays: RelaySettings[];
  faultCurrent: number;
  requiredMargin: number;
  onRequiredMarginChange: (v: number) => void;
  chainResult: ChainCoordinationResult;
}) {
  const tripTimes = relays.map((r) => tripTime(r, faultCurrent));

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-foreground">Results</h3>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        {relays.map((r, i) => (
          <div key={i} className="rounded-lg border border-border bg-surface-2 p-4">
            <div className="text-xs text-muted">{r.label} trip time</div>
            <div className="mt-1 text-xl font-semibold text-foreground">
              {formatTime(tripTimes[i])}
            </div>
            <div className="mt-0.5 text-xs text-muted">
              at {faultCurrent.toLocaleString()} A
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-2 p-4">
        <div>
          <div className="text-xs text-muted">Required grading margin (CTI)</div>
          <div className="mt-0.5 text-[11px] text-muted/70">
            0.4 s typical for electromechanical relays, 0.3 s for numerical/digital
          </div>
        </div>
        <input
          type="number"
          min={0}
          step="0.05"
          value={requiredMargin}
          onChange={(e) => onRequiredMarginChange(parseFloat(e.target.value) || 0)}
          className="w-24 rounded-md border border-border bg-background px-3 py-2 text-right text-sm text-foreground focus:border-accent-2 focus:outline-none"
        />
      </div>

      {relays.length > 1 && (
        <div className="mt-4 space-y-2">
          {relays.slice(0, -1).map((r, i) => {
            const tDown = tripTimes[i];
            const tUp = tripTimes[i + 1];
            const marginHere = isFinite(tDown) && isFinite(tUp) ? tUp - tDown : null;
            const up = relays[i + 1];
            return (
              <div
                key={i}
                className={`rounded-lg border p-4 ${
                  marginHere == null
                    ? "border-border bg-surface-2"
                    : marginHere >= requiredMargin
                    ? "border-pass/30 bg-pass/10"
                    : "border-fail/30 bg-fail/10"
                }`}
              >
                <div className="text-xs text-muted">
                  {r.label} → {up.label} margin at {faultCurrent.toLocaleString()} A
                </div>
                {marginHere != null ? (
                  <div className={`mt-1 text-xl font-semibold ${marginHere >= requiredMargin ? "text-pass" : "text-fail"}`}>
                    {marginHere >= 0 ? "+" : ""}
                    {marginHere.toFixed(3)} s
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-muted">One or both relays do not operate at this current.</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <h4 className="text-sm font-semibold text-foreground">
          Full-range chain coordination check
        </h4>
        <p className="mt-1 text-xs text-muted">
          Grading margin swept across the entire fault current range shown on
          the graph for every successive relay pair, not just the single
          point above.
        </p>

        <div className="mt-3 space-y-2">
          {chainResult.steps.map((s, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg border p-4 ${
                !s.anyEvaluated
                  ? "border-border bg-surface-2"
                  : s.pass
                  ? "border-pass/30 bg-pass/10"
                  : "border-fail/30 bg-fail/10"
              }`}
            >
              <div>
                <div className={`text-sm font-semibold ${!s.anyEvaluated ? "text-muted" : s.pass ? "text-pass" : "text-fail"}`}>
                  {s.label}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  {s.anyEvaluated
                    ? `Minimum margin ${s.minMargin?.toFixed(3)} s at ${s.minMarginAt?.toLocaleString(undefined, { maximumFractionDigits: 0 })} A`
                    : "No overlapping operating range found across the graph's fault current range."}
                </div>
              </div>
              {s.anyEvaluated && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.pass ? "bg-pass/20 text-pass" : "bg-fail/20 text-fail"}`}>
                  {s.pass ? "PASS" : "FAIL"}
                </span>
              )}
            </div>
          ))}
        </div>

        {chainResult.allPass != null && chainResult.steps.length > 1 && (
          <div
            className={`mt-3 flex items-center justify-between rounded-lg border p-4 ${
              chainResult.allPass ? "border-pass/30 bg-pass/10" : "border-fail/30 bg-fail/10"
            }`}
          >
            <div className={`text-sm font-semibold ${chainResult.allPass ? "text-pass" : "text-fail"}`}>
              Overall chain grading
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chainResult.allPass ? "bg-pass/20 text-pass" : "bg-fail/20 text-fail"}`}>
              {chainResult.allPass ? "PASS" : "FAIL"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
