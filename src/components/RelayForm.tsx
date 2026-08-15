"use client";

import { RelaySettings, curveOptions } from "@/lib/idmt";
import { Tip } from "@/components/fields";

export default function RelayForm({
  relay,
  onChange,
  accentClass,
}: {
  relay: RelaySettings;
  onChange: (next: RelaySettings) => void;
  accentClass: string;
}) {
  const update = (patch: Partial<RelaySettings>) => onChange({ ...relay, ...patch });

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
        <h3 className="text-base font-semibold text-foreground">{relay.label}</h3>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="flex items-center text-xs font-medium text-muted">Curve standard<Tip text="IEC 60255-151 and IEEE C37.112 define different curve-shape families and equations for the same inverse-time concept — pick the standard your protection scheme/relay is configured to." /></label>
          <div className="mt-1.5 flex rounded-md border border-border bg-surface-2 p-1">
            {(["IEC", "IEEE"] as const).map((fam) => (
              <button
                key={fam}
                type="button"
                onClick={() =>
                  update({
                    curveFamily: fam,
                    curveType: fam === "IEC" ? "SI" : "MI",
                  })
                }
                className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                  relay.curveFamily === fam
                    ? "bg-accent text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {fam}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          <label className="flex items-center text-xs font-medium text-muted">Curve type<Tip text="The specific curve shape within the chosen family (e.g. Standard/Very/Extremely Inverse for IEC, Moderately/Very/Extremely Inverse for IEEE) — steeper curves trip much faster at high fault current relative to pickup, which changes how easily two relays grade against each other." /></label>
          <select
            value={relay.curveType}
            onChange={(e) => update({ curveType: e.target.value as RelaySettings["curveType"] })}
            className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          >
            {curveOptions(relay.curveFamily).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center text-xs font-medium text-muted">
            Pickup current, Is (A)
            <Tip text="The relay-side current above which the relay starts timing toward a trip — normally set above maximum normal load current but below the minimum fault current it must detect. All curve equations are based on the multiple of pickup (I/Is), not raw current." />
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={relay.pickupCurrent}
            onChange={(e) => update({ pickupCurrent: parseFloat(e.target.value) || 0 })}
            className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
        </div>

        <div>
          <label className="flex items-center text-xs font-medium text-muted">
            {relay.curveFamily === "IEC" ? "TMS" : "Time dial (TD)"}
            <Tip text="Scales the whole curve up or down in time without changing its shape — a higher TMS/TD shifts the entire curve slower (longer operating time at every current), used to create grading margin against downstream devices without changing the curve family or pickup." />
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={relay.timeDial}
            onChange={(e) => update({ timeDial: parseFloat(e.target.value) || 0 })}
            className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
        </div>

        <div className="col-span-2">
          <label className="flex items-center text-xs font-medium text-muted">
            CT ratio (primary : 1) — use 1 if fault current entered is already relay-side
            <Tip text="Converts a primary (system-side) fault current into the relay-side (secondary) current the curve equations actually use. If the fault current you'll enter is already relay-side, leave this at 1 to skip the conversion." />
          </label>
          <input
            type="number"
            min={0}
            step="any"
            value={relay.ctRatio}
            onChange={(e) => update({ ctRatio: parseFloat(e.target.value) || 1 })}
            className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
