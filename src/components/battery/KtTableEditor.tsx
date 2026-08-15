"use client";

import { BattKtPoint } from "@/lib/battery";

export default function KtTableEditor({
  table,
  onChange,
  disabled,
}: {
  table: BattKtPoint[];
  onChange: (t: BattKtPoint[]) => void;
  disabled?: boolean;
}) {
  const update = (i: number, patch: Partial<BattKtPoint>) =>
    onChange(table.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  const remove = (i: number) => onChange(table.filter((_, idx) => idx !== i));
  const add = () => onChange([...table, { t: 60, kt: 3.0 }]);

  return (
    <div className="col-span-2 space-y-2">
      <div className="flex gap-2 text-[10px] text-muted">
        <span className="w-20">Time (min)</span>
        <span>Kt factor</span>
      </div>
      {table.length === 0 && (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          No Kt points — add at least two.
        </div>
      )}
      {table.map((k, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="number"
            value={k.t}
            onChange={(e) => update(i, { t: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            step="any"
            className="w-20 shrink-0 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none disabled:cursor-not-allowed"
          />
          <input
            type="number"
            value={k.kt}
            onChange={(e) => update(i, { kt: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            step="any"
            className="w-20 shrink-0 rounded-md border border-border bg-surface-2 px-2 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="ml-auto shrink-0 rounded-md border border-border px-2 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={disabled}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60 disabled:cursor-not-allowed"
      >
        + Add Point
      </button>
    </div>
  );
}
