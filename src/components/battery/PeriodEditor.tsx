"use client";

import { BattPeriod } from "@/lib/battery";

export default function PeriodEditor({
  periods,
  onChange,
}: {
  periods: BattPeriod[];
  onChange: (p: BattPeriod[]) => void;
}) {
  const update = (i: number, patch: Partial<BattPeriod>) =>
    onChange(periods.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const remove = (i: number) => onChange(periods.filter((_, idx) => idx !== i));
  const add = () => onChange([...periods, { current: 0, duration: 10 }]);

  let cum = 0;

  return (
    <div className="col-span-2 space-y-2">
      {periods.length === 0 && (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          No periods yet — add one below.
        </div>
      )}
      {periods.map((p, i) => {
        cum += p.duration || 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-xs text-muted">{i + 1}</span>
            <input
              type="number"
              value={p.current}
              onChange={(e) => update(i, { current: parseFloat(e.target.value) || 0 })}
              step="any"
              placeholder="Current"
              className="w-20 shrink-0 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
            />
            <span className="shrink-0 text-xs text-muted">A for</span>
            <input
              type="number"
              value={p.duration}
              onChange={(e) => update(i, { duration: parseFloat(e.target.value) || 0 })}
              step="any"
              placeholder="Duration"
              className="w-20 shrink-0 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
            />
            <span className="shrink-0 text-xs text-muted">min (cum. {cum})</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="ml-auto shrink-0 rounded-md border border-border px-2 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail"
            >
              ✕
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60"
      >
        + Add Period
      </button>
    </div>
  );
}
