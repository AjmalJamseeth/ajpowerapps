"use client";

import { CoordinationResult, RelaySettings, tripTime } from "@/lib/idmt";

function formatTime(t: number) {
  if (!isFinite(t)) return "No trip";
  if (t < 0.001) return `${(t * 1000).toFixed(2)} ms`;
  return `${t.toFixed(3)} s`;
}

export default function ResultsPanel({
  relay1,
  relay2,
  faultCurrent,
  requiredMargin,
  onRequiredMarginChange,
  coordination,
}: {
  relay1: RelaySettings;
  relay2: RelaySettings;
  faultCurrent: number;
  requiredMargin: number;
  onRequiredMarginChange: (v: number) => void;
  coordination: CoordinationResult;
}) {
  const t1 = tripTime(relay1, faultCurrent);
  const t2 = tripTime(relay2, faultCurrent);
  const marginHere = isFinite(t1) && isFinite(t2) ? t2 - t1 : null;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-foreground">Results</h3>

      <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="text-xs text-muted">{relay1.label} trip time</div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {formatTime(t1)}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            at {faultCurrent.toLocaleString()} A
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="text-xs text-muted">{relay2.label} trip time</div>
          <div className="mt-1 text-xl font-semibold text-foreground">
            {formatTime(t2)}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            at {faultCurrent.toLocaleString()} A
          </div>
        </div>
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

      {marginHere !== null ? (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            marginHere >= requiredMargin
              ? "border-pass/30 bg-pass/10"
              : "border-fail/30 bg-fail/10"
          }`}
        >
          <div className="text-xs text-muted">Margin at {faultCurrent.toLocaleString()} A</div>
          <div
            className={`mt-1 text-xl font-semibold ${
              marginHere >= requiredMargin ? "text-pass" : "text-fail"
            }`}
          >
            {marginHere >= 0 ? "+" : ""}
            {marginHere.toFixed(3)} s
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          One or both relays do not operate at this fault current — increase
          the fault current above both pickup settings.
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <h4 className="text-sm font-semibold text-foreground">
          Full-range coordination check
        </h4>
        <p className="mt-1 text-xs text-muted">
          Grading margin swept across the entire fault current range shown on
          the graph, not just the single point above.
        </p>

        {coordination.anyEvaluated ? (
          <div
            className={`mt-3 flex items-center justify-between rounded-lg border p-4 ${
              coordination.overallPass
                ? "border-pass/30 bg-pass/10"
                : "border-fail/30 bg-fail/10"
            }`}
          >
            <div>
              <div
                className={`text-sm font-semibold ${
                  coordination.overallPass ? "text-pass" : "text-fail"
                }`}
              >
                {coordination.overallPass ? "Coordinated" : "Coordination violation"}
              </div>
              <div className="mt-0.5 text-xs text-muted">
                Minimum margin {coordination.minMargin?.toFixed(3)} s at{" "}
                {coordination.minMarginAt?.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                A
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                coordination.overallPass
                  ? "bg-pass/20 text-pass"
                  : "bg-fail/20 text-fail"
              }`}
            >
              {coordination.overallPass ? "PASS" : "FAIL"}
            </span>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
            No overlapping operating range found for both relays across the
            graph&apos;s fault current range.
          </div>
        )}
      </div>
    </div>
  );
}
