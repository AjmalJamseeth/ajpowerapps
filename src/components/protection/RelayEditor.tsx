"use client";

import { CheckboxField, NumberField, SelectField } from "@/components/fields";
import { IDMT_CURVE_OPTIONS_EXPORT } from "@/components/arcflash/curveOptions";
import { MAX_RELAYS, type RelayDef } from "@/lib/protsettings";
import type { BusIn } from "@/lib/iec60909";

const uid = () => "r" + Math.random().toString(36).slice(2, 8);

/** Editor for the protection relays (up to 8): where they sit, who they grade over, and their settings. */
export default function RelayEditor({
  relays,
  setRelays,
  buses,
}: {
  relays: RelayDef[];
  setRelays: (r: RelayDef[]) => void;
  buses: BusIn[];
}) {
  const patch = (id: string, p: Partial<RelayDef>) => setRelays(relays.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) =>
    setRelays(relays.filter((r) => r.id !== id).map((r) => ({ ...r, downstream: r.downstream.filter((d) => d !== id) })));
  const add = () => {
    if (relays.length >= MAX_RELAYS) return;
    const kv = buses[0]?.unKv ?? 0.4;
    setRelays([
      ...relays,
      {
        id: uid(), name: `R${relays.length + 1} new relay`, busId: buses[0]?.id ?? "", deviceKv: 0, downstream: [],
        loadA: 100, inrushA: 0, curveFamily: "IEC", curveType: "SI", pickupA: 120, tms: 0.1, instPickupA: 0, instMs: 50,
        breakerMs: 50, locked: false,
      },
    ]);
    void kv;
  };
  const toggleDown = (r: RelayDef, id: string) =>
    patch(r.id, { downstream: r.downstream.includes(id) ? r.downstream.filter((d) => d !== id) : [...r.downstream, id] });

  return (
    <div className="space-y-4">
      {relays.map((r) => (
        <div key={r.id} className="rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              value={r.name}
              onChange={(e) => patch(r.id, { name: e.target.value })}
              className="w-64 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold text-foreground focus:border-accent-2 focus:outline-none"
            />
            <div className="flex items-center gap-3">
              <CheckboxField
                label="Lock (do not change)"
                tip="A locked relay keeps its settings. The solver works around it and tells you if that blocks a target."
                checked={r.locked}
                onChange={(v) => patch(r.id, { locked: v })}
              />
              <button
                type="button"
                onClick={() => remove(r.id)}
                className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail"
              >
                Delete relay
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SelectField
              label="Feeds / clears bus"
              tip="The bus on the load side of this relay. An arc at that bus is cleared by this relay (and backed up by every relay upstream of it). Its maximum fault current also sets the upper end of the grading range and the instantaneous floor of the relay above it."
              value={r.busId}
              onChange={(v) => patch(r.id, { busId: v })}
              options={[{ value: "", label: "— none —" }, ...buses.map((b) => ({ value: b.id, label: `${b.name} (${b.unKv} kV)` }))]}
            />
            <NumberField label="CT-side voltage" unit="kV" min={0} value={r.deviceKv} onChange={(v) => patch(r.id, { deviceKv: v })} tip="Voltage level where the relay is connected. 0 = the voltage of the bus it feeds. A relay on the HV side of a transformer sees fault current scaled by the voltage ratio." />
            <NumberField label="Max load current" unit="A" min={0} value={r.loadA} onChange={(v) => patch(r.id, { loadA: v })} tip="Highest continuous current through the relay (full-load current of the transformer, feeder or motor group). The pickup is never set below the overload factor × this value." />
            <NumberField label="Inrush / starting current" unit="A" min={0} value={r.inrushA} onChange={(v) => patch(r.id, { inrushA: v })} tip="Transformer magnetising inrush (typically 8–12 × rated current) or motor starting current. Any instantaneous element is kept above this. Enter 0 to ignore." />
            <SelectField label="Curve family" value={r.curveFamily} onChange={(v) => patch(r.id, { curveFamily: v, curveType: v === "IEC" ? "SI" : "MI" })} options={[{ value: "IEC", label: "IEC 60255-151" }, { value: "IEEE", label: "IEEE C37.112" }]} />
            <SelectField label="Curve type" value={r.curveType} onChange={(v) => patch(r.id, { curveType: v })} options={IDMT_CURVE_OPTIONS_EXPORT[r.curveFamily]} />
            <NumberField label="Pickup" unit="A" min={0} value={r.pickupA} onChange={(v) => patch(r.id, { pickupA: v })} tip="Overcurrent pickup in primary amps at the CT-side voltage." />
            <NumberField label="TMS / time dial" min={0} step={0.005} value={r.tms} onChange={(v) => patch(r.id, { tms: v })} tip="Time multiplier (IEC) or time dial (IEEE)." />
            <NumberField label="Instantaneous pickup" unit="A" min={0} value={r.instPickupA} onChange={(v) => patch(r.id, { instPickupA: v })} tip="Instantaneous (50) pickup in primary amps; 0 = off." />
            <NumberField label="Instantaneous time" unit="ms" min={0} value={r.instMs} onChange={(v) => patch(r.id, { instMs: v })} tip="Operating time of the instantaneous element (typically 20–50 ms)." />
            <NumberField label="Breaker opening time" unit="ms" min={0} value={r.breakerMs} onChange={(v) => patch(r.id, { breakerMs: v })} tip="Breaker opening time added to the relay time for the arc-flash clearing time (typically 50 ms)." />
          </div>

          <div className="mt-4">
            <div className="text-xs font-medium text-muted">Grades over (downstream relays this relay backs up)</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {relays.filter((x) => x.id !== r.id).length === 0 && <span className="text-xs text-muted">Add another relay to define grading.</span>}
              {relays
                .filter((x) => x.id !== r.id)
                .map((x) => (
                  <label
                    key={x.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs ${r.downstream.includes(x.id) ? "border-accent-2 bg-accent-2/10 text-foreground" : "border-border text-muted"}`}
                  >
                    <input type="checkbox" className="accent-cyan-400" checked={r.downstream.includes(x.id)} onChange={() => toggleDown(r, x.id)} />
                    {x.name}
                  </label>
                ))}
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        disabled={relays.length >= MAX_RELAYS}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-accent-2 hover:border-accent-2/60 disabled:opacity-50"
      >
        {relays.length >= MAX_RELAYS ? `Maximum of ${MAX_RELAYS} relays` : "+ Add relay"}
      </button>
    </div>
  );
}
