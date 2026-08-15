"use client";

export interface LabeledVaItem {
  label: string;
  va: number;
}

export default function ItemListEditor({
  items,
  onChange,
  addLabel = "Device",
  disabled,
}: {
  items: LabeledVaItem[];
  onChange: (items: LabeledVaItem[]) => void;
  addLabel?: string;
  disabled?: boolean;
}) {
  const update = (i: number, patch: Partial<LabeledVaItem>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { label: `${addLabel} ${items.length + 1}`, va: 1 }]);

  return (
    <div className="col-span-2 space-y-2">
      {items.length === 0 && (
        <div className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs text-muted">
          No devices added — click &ldquo;+ Add&rdquo; to itemize burden.
        </div>
      )}
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={it.label}
            onChange={(e) => update(i, { label: e.target.value })}
            disabled={disabled}
            placeholder="Device"
            className="w-full min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none disabled:cursor-not-allowed"
          />
          <input
            type="number"
            value={it.va}
            onChange={(e) => update(i, { va: parseFloat(e.target.value) || 0 })}
            disabled={disabled}
            step="any"
            min={0}
            placeholder="VA"
            className="w-20 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none disabled:cursor-not-allowed"
          />
          <span className="shrink-0 text-xs text-muted">VA</span>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={disabled}
            className="shrink-0 rounded-md border border-border px-2 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail disabled:cursor-not-allowed"
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
        + Add {addLabel}
      </button>
    </div>
  );
}
