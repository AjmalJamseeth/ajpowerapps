"use client";

import { ReactNode, useState, useId } from "react";

export function Tip({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!text) return null;
  return (
    <span className="relative ml-1 inline-block align-middle">
      <button
        type="button"
        aria-describedby={id}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
        className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted/50 text-[9px] font-bold leading-none text-muted hover:border-accent-2 hover:text-accent-2 focus:border-accent-2 focus:text-accent-2 focus:outline-none"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-surface-2 p-3 text-[11px] font-normal leading-snug normal-case text-foreground shadow-xl"
        >
          {text}
          <span className="absolute left-1/2 top-full -mt-px h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-border bg-surface-2" />
        </span>
      )}
    </span>
  );
}

export function NumberField({
  label,
  hint,
  tip,
  unit,
  value,
  onChange,
  min,
  max,
  step = "any",
  disabled,
}: {
  label: string;
  hint?: string;
  tip?: string;
  unit?: string;
  value: number | null;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: string | number;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-muted">
        {label}
        {hint && <span className="ml-1 text-muted/60">({hint})</span>}
        <Tip text={tip} />
      </label>
      <div className="mt-1.5 flex items-center rounded-md border border-border bg-surface-2 focus-within:border-accent-2">
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="w-full rounded-md bg-transparent px-3 py-2 text-sm text-foreground outline-none disabled:cursor-not-allowed"
        />
        {unit && <span className="pr-3 text-xs text-muted">{unit}</span>}
      </div>
    </div>
  );
}

export function SelectField<T extends string | number>({
  label,
  hint,
  tip,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  hint?: string;
  tip?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-muted">
        {label}
        {hint && <span className="ml-1 text-muted/60">({hint})</span>}
        <Tip text={tip} />
      </label>
      <select
        value={String(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const isNumeric = typeof options[0]?.value === "number";
          onChange((isNumeric ? Number(raw) : raw) as T);
        }}
        disabled={disabled}
        className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none disabled:cursor-not-allowed"
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TextField({
  label,
  tip,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  tip?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="flex items-center text-xs font-medium text-muted">
        {label}
        <Tip text={tip} />
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
      />
    </div>
  );
}

export function CheckboxField({
  label,
  hint,
  tip,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  tip?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-amber-400"
      />
      <span className="inline-flex items-center">
        {label}
        {hint && <span className="ml-1 text-xs text-muted">({hint})</span>}
        <Tip text={tip} />
      </span>
    </label>
  );
}

export function Section({ title, children, badge }: { title: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {badge}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function ResultCard({ title, badge, children }: { title: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {badge}
      </div>
      <div className="mt-4 space-y-2 text-sm">{children}</div>
    </div>
  );
}

export function ResultRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

export function CheckRow({ label, value, pass }: { label: string; value: ReactNode; pass: boolean | null }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <span className="text-muted">{label}</span>
      <span className={`text-right font-medium ${pass === null ? "text-foreground" : pass ? "text-pass" : "text-fail"}`}>
        {value}
        {pass !== null && (pass ? " ✓" : " ✗")}
      </span>
    </div>
  );
}

export function EmptyResult({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-foreground">Results</h3>
      <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">{message}</div>
    </div>
  );
}

export function ProBanner({ feature }: { feature: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-muted">
      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
        Subscriber
      </span>
      <span>
        {feature} is a subscriber feature. Inputs below are fully usable for
        preview — results unlock with subscriber accounts, coming soon.
      </span>
    </div>
  );
}
