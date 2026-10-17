"use client";

import { useState } from "react";
import { CheckboxField, NumberField, SelectField, Tip } from "@/components/fields";
import { IDMT_CURVE_OPTIONS_EXPORT } from "@/components/arcflash/curveOptions";
import { MAX_RELAYS, type DamageAsset, type RelayDef } from "@/lib/protsettings";
import { baseCurrentA, DEVICE_KINDS, defaultEngine, type DeviceEngine } from "@/lib/deviceModels";
import type { BusIn } from "@/lib/iec60909";

const uid = () => "r" + Math.random().toString(36).slice(2, 8);
const kindOf = (r: RelayDef) => (r.engine ? r.engine.type : "idmt");

/** Parse "current, time" lines into a point table. */
function parsePoints(text: string): [number, number][] {
  return text
    .split(/\n/)
    .map((l) => l.trim().split(/[\s,;]+/).map(Number))
    .filter((p) => p.length >= 2 && p[0] > 0 && p[1] > 0 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
    .map((p) => [p[0], p[1]] as [number, number]);
}

/** Device list editor: every kind of protection device, where it sits and what it grades over. */
export default function RelayEditor({
  relays,
  setRelays,
  buses,
}: {
  relays: RelayDef[];
  setRelays: (r: RelayDef[]) => void;
  buses: BusIn[];
}) {
  const [newKind, setNewKind] = useState("idmt");
  const patch = (id: string, p: Partial<RelayDef>) => setRelays(relays.map((r) => (r.id === id ? { ...r, ...p } : r)));
  const remove = (id: string) =>
    setRelays(relays.filter((r) => r.id !== id).map((r) => ({ ...r, downstream: r.downstream.filter((d) => d !== id) })));

  const blank = (kind: string, n: number): RelayDef => {
    const base: RelayDef = {
      id: uid(), name: `D${n} new device`, busId: buses[0]?.id ?? "", deviceKv: 0, downstream: [], loadA: 100, inrushA: 0,
      curveFamily: "IEC", curveType: "SI", pickupA: 120, tms: 0.1, instPickupA: 0, instMs: 50, breakerMs: 50, locked: false,
    };
    return applyKind(base, kind);
  };
  const applyKind = (r: RelayDef, kind: string): RelayDef => {
    if (kind === "idmt") return { ...r, engine: undefined, bandTol: undefined, tms: r.tms || 0.1, pickupA: r.pickupA || 120 };
    const engine = defaultEngine(kind, r.pickupA > 1 ? r.pickupA : 100) as DeviceEngine;
    return { ...r, engine, pickupA: baseCurrentA(engine) || 1, tms: 0, instPickupA: 0, bandTol: kind === "lsig" ? 0.2 : 0 };
  };
  const add = () => {
    if (relays.length >= MAX_RELAYS) return;
    setRelays([...relays, blank(newKind, relays.length + 1)]);
  };
  const patchEngine = (r: RelayDef, p: Partial<DeviceEngine>) => {
    const engine = { ...(r.engine as DeviceEngine), ...p };
    patch(r.id, { engine, pickupA: baseCurrentA(engine) || r.pickupA });
  };
  const toggleDown = (r: RelayDef, id: string) =>
    patch(r.id, { downstream: r.downstream.includes(id) ? r.downstream.filter((d) => d !== id) : [...r.downstream, id] });

  const engineFields = (r: RelayDef) => {
    const e = r.engine as DeviceEngine;
    const setL = (k: string, v: number | boolean) => patchEngine(r, { lsig: { ...(e.lsig as NonNullable<DeviceEngine["lsig"]>), [k]: v } });
    const setT = (k: string, v: number) => patchEngine(r, { tm: { ...(e.tm as NonNullable<DeviceEngine["tm"]>), [k]: v } });
    switch (e.type) {
      case "dt":
        return (
          <>
            <NumberField label="Pickup" unit="A" min={0} value={e.pickup_a ?? 0} onChange={(v) => patchEngine(r, { pickup_a: v })} />
            <NumberField label="Delay" unit="s" min={0} step={0.05} value={e.delayS ?? 0} onChange={(v) => patchEngine(r, { delayS: v })} />
          </>
        );
      case "instantaneous":
        return (
          <>
            <NumberField label="Pickup" unit="A" min={0} value={e.pickup_a ?? 0} onChange={(v) => patchEngine(r, { pickup_a: v })} />
            <NumberField label="Operate time" unit="s" min={0} step={0.01} value={e.operateS ?? 0.02} onChange={(v) => patchEngine(r, { operateS: v })} />
          </>
        );
      case "lsig":
        return (
          <>
            <NumberField label="Long-time pickup Ir" unit="A" min={0} value={e.lsig?.Ir ?? 0} onChange={(v) => setL("Ir", v)} tip="Long-time (thermal) pickup." />
            <NumberField label="Long-time delay (at 2 × Ir)" unit="s" min={0} value={e.lsig?.TL ?? 0} onChange={(v) => setL("TL", v)} tip="Trip time at twice Ir — the figure datasheets publish." />
            <NumberField label="Short-time pickup Ist" unit="A" min={0} value={e.lsig?.Ist ?? 0} onChange={(v) => setL("Ist", v)} />
            <NumberField label="Short-time delay" unit="s" min={0} step={0.05} value={e.lsig?.TS ?? 0} onChange={(v) => setL("TS", v)} />
            <CheckboxField label="Short-time I²t ON" checked={!!e.lsig?.stI2tOn} onChange={(v) => setL("stI2tOn", v)} tip="Ramped (I²t) short-time band instead of a flat delay." />
            <NumberField label="Instantaneous pickup" unit="A" min={0} value={e.lsig?.Iinst ?? 0} onChange={(v) => setL("Iinst", v)} tip="0 = no instantaneous stage." />
            <NumberField label="Instantaneous time" unit="s" min={0} step={0.01} value={e.lsig?.instDelay ?? 0.02} onChange={(v) => setL("instDelay", v)} />
            <NumberField
              label="Time band ±"
              unit="%"
              min={0}
              value={Math.round((r.bandTol ?? 0) * 100)}
              onChange={(v) => {
                patch(r.id, { bandTol: v / 100, engine: { ...e, bandTolerance: v / 100 } });
              }}
              tip="Tolerance on the operating time. The upper band is used for the arc-flash clearing time (worst case). 0 = centre line only."
            />
          </>
        );
      case "thermalmag":
        return (
          <>
            <NumberField label="Thermal pickup Ir" unit="A" min={0} value={e.tm?.Ir ?? 0} onChange={(v) => setT("Ir", v)} />
            <NumberField label="Thermal delay (at 2 × Ir)" unit="s" min={0} value={e.tm?.TL ?? 0} onChange={(v) => setT("TL", v)} />
            <NumberField label="Magnetic pickup" unit="A" min={0} value={e.tm?.Iinst ?? 0} onChange={(v) => setT("Iinst", v)} tip="0 = none." />
            <NumberField label="Magnetic operate time" unit="s" min={0} step={0.01} value={e.tm?.instDelay ?? 0.02} onChange={(v) => setT("instDelay", v)} />
          </>
        );
      case "mcb":
        return (
          <>
            <SelectField label="Characteristic" value={e.mcbType ?? "C"} onChange={(v) => patchEngine(r, { mcbType: v })} options={[{ value: "B", label: "B (3–5 × In)" }, { value: "C", label: "C (5–10 × In)" }, { value: "D", label: "D (10–20 × In)" }]} />
            <NumberField label="Rated current In" unit="A" min={0} value={e.InAmps ?? 0} onChange={(v) => patchEngine(r, { InAmps: v })} />
          </>
        );
      case "fuse":
        return <NumberField label="Rated current In (gG)" unit="A" min={0} value={e.InAmps ?? 0} onChange={(v) => patchEngine(r, { InAmps: v })} tip="Total clearing time curve of a gG fuse, anchored at the IEC 60269 conventional currents. Use a custom point table for the manufacturer's own curve." />;
      case "motor":
        return (
          <>
            <NumberField label="Thermal setting Ith (≈ FLC)" unit="A" min={0} value={e.motor?.Ith ?? 0} onChange={(v) => patchEngine(r, { motor: { ...(e.motor as NonNullable<DeviceEngine["motor"]>), Ith: v } })} />
            <NumberField label="Thermal time constant τ" unit="s" min={0} value={e.motor?.tau ?? 0} onChange={(v) => patchEngine(r, { motor: { ...(e.motor as NonNullable<DeviceEngine["motor"]>), tau: v } })} />
            <NumberField label="Locked-rotor pickup" unit="A" min={0} value={e.lockedRotor?.pickupA ?? 0} onChange={(v) => patchEngine(r, { lockedRotor: { stallTimeS: e.lockedRotor?.stallTimeS ?? 10, pickupA: v } })} />
            <NumberField label="Stall time" unit="s" min={0} value={e.lockedRotor?.stallTimeS ?? 0} onChange={(v) => patchEngine(r, { lockedRotor: { pickupA: e.lockedRotor?.pickupA ?? 0, stallTimeS: v } })} />
          </>
        );
      case "negseq":
        return (
          <>
            <NumberField label="Withstand constant K (I2²t)" min={0} value={e.negseq?.K ?? 0} onChange={(v) => patchEngine(r, { negseq: { ...(e.negseq as NonNullable<DeviceEngine["negseq"]>), K: v } })} />
            <NumberField label="Rated current I1" unit="A" min={0} value={e.negseq?.I1rated ?? 0} onChange={(v) => patchEngine(r, { negseq: { ...(e.negseq as NonNullable<DeviceEngine["negseq"]>), I1rated: v } })} />
            <NumberField label="Pickup I2/I1" min={0} step={0.01} value={e.negseq?.pickupPu ?? 0.05} onChange={(v) => patchEngine(r, { negseq: { ...(e.negseq as NonNullable<DeviceEngine["negseq"]>), pickupPu: v } })} />
            <NumberField label="Minimum time" unit="s" min={0} step={0.05} value={e.negseq?.minTimeS ?? 0.2} onChange={(v) => patchEngine(r, { negseq: { ...(e.negseq as NonNullable<DeviceEngine["negseq"]>), minTimeS: v } })} />
          </>
        );
      case "custom_equation": {
        const iecStyle = !!e.customParams && "k" in e.customParams;
        const cp = e.customParams ?? {};
        const setC = (k: string, v: number) => patchEngine(r, { customParams: { ...cp, [k]: v } });
        return (
          <>
            <SelectField
              label="Equation shape"
              value={iecStyle ? "iec" : "ieee"}
              onChange={(v) => patchEngine(r, { customParams: v === "iec" ? { k: 0.14, alpha: 0.02, L: 0 } : { A: 0.0515, p: 0.02, B: 0.114 } })}
              options={[{ value: "iec", label: "IEC: t = TMS·k/((I/Is)^α − 1) + L" }, { value: "ieee", label: "IEEE: t = TD·(A/((I/Is)^p − 1) + B)" }]}
            />
            <NumberField label="Pickup Is" unit="A" min={0} value={e.pickup_a ?? 0} onChange={(v) => patchEngine(r, { pickup_a: v })} />
            <NumberField label="TMS / TD" min={0} step={0.01} value={e.tms ?? 0} onChange={(v) => patchEngine(r, { tms: v })} />
            {iecStyle ? (
              <>
                <NumberField label="k" value={cp.k ?? 0} onChange={(v) => setC("k", v)} />
                <NumberField label="α" value={cp.alpha ?? 0} onChange={(v) => setC("alpha", v)} />
                <NumberField label="L" unit="s" value={cp.L ?? 0} onChange={(v) => setC("L", v)} />
              </>
            ) : (
              <>
                <NumberField label="A" value={cp.A ?? 0} onChange={(v) => setC("A", v)} />
                <NumberField label="p" value={cp.p ?? 0} onChange={(v) => setC("p", v)} />
                <NumberField label="B" value={cp.B ?? 0} onChange={(v) => setC("B", v)} />
              </>
            )}
          </>
        );
      }
      case "points":
        return (
          <div className="col-span-2 sm:col-span-3">
            <label className="flex items-center text-xs font-medium text-muted">
              Point table (current A, time s — one pair per line)
              <Tip text="Manufacturer curve points. Interpolated log-log; the end values are held outside the table." />
            </label>
            <textarea
              rows={5}
              defaultValue={(e.points ?? []).map((p) => `${p[0]}, ${p[1]}`).join("\n")}
              onBlur={(ev) => {
                const pts = parsePoints(ev.target.value);
                if (pts.length >= 2) patchEngine(r, { points: pts });
              }}
              className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-foreground focus:border-accent-2 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-muted">Applied when you click outside the box. At least two valid lines are needed.</p>
          </div>
        );
      default:
        return null;
    }
  };

  const setDamage = (r: RelayDef, d: DamageAsset | undefined) => patch(r.id, { damage: d });

  return (
    <div className="space-y-4">
      {relays.map((r) => {
        const kind = kindOf(r);
        const tr = r.damage?.kind === "transformer" ? r.damage : null;
        const cb = r.damage?.kind === "cable" ? r.damage : null;
        return (
          <div key={r.id} className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                value={r.name}
                onChange={(e) => patch(r.id, { name: e.target.value })}
                className="w-64 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm font-semibold text-foreground focus:border-accent-2 focus:outline-none"
              />
              <div className="flex items-center gap-3">
                {kind === "idmt" && (
                  <CheckboxField
                    label="Lock (do not change)"
                    tip="A locked relay keeps its settings. The solver works around it and tells you if that blocks a target."
                    checked={r.locked}
                    onChange={(v) => patch(r.id, { locked: v })}
                  />
                )}
                <button type="button" onClick={() => remove(r.id)} className="rounded-md border border-border px-2.5 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail">
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField
                label="Device type"
                tip="Only IDMT relays are tuned by the solver. Every other type is a fixed device: it takes part in grading, in the time-current chart and in the arc-flash clearing time."
                value={kind}
                onChange={(v) => setRelays(relays.map((x) => (x.id === r.id ? applyKind(x, v) : x)))}
                options={DEVICE_KINDS}
              />
              <SelectField
                label="Feeds / clears bus"
                tip="The bus on the load side of this device. An arc at that bus is cleared by it (and backed up by every device upstream of it). Its maximum fault current also sets the upper end of the grading range and the instantaneous floor of the device above it."
                value={r.busId}
                onChange={(v) => patch(r.id, { busId: v })}
                options={[{ value: "", label: "— none —" }, ...buses.map((b) => ({ value: b.id, label: `${b.name} (${b.unKv} kV)` }))]}
              />
              <NumberField label="CT-side voltage" unit="kV" min={0} value={r.deviceKv} onChange={(v) => patch(r.id, { deviceKv: v })} tip="Voltage level where the device is connected. 0 = the voltage of the bus it feeds. A device on the HV side of a transformer sees fault current scaled by the voltage ratio." />
              {kind === "idmt" ? (
                <>
                  <NumberField label="Max load current" unit="A" min={0} value={r.loadA} onChange={(v) => patch(r.id, { loadA: v })} tip="Highest continuous current through the relay (full-load current of the transformer, feeder or motor group). The pickup is never set below the overload factor × this value." />
                  <NumberField label="Inrush / starting current" unit="A" min={0} value={r.inrushA} onChange={(v) => patch(r.id, { inrushA: v })} tip="Transformer magnetising inrush (typically 8–12 × rated current) or motor starting current. Any instantaneous element is kept above this. Enter 0 to ignore." />
                  <SelectField label="Curve family" value={r.curveFamily} onChange={(v) => patch(r.id, { curveFamily: v, curveType: v === "IEC" ? "SI" : "MI" })} options={[{ value: "IEC", label: "IEC 60255-151" }, { value: "IEEE", label: "IEEE C37.112" }]} />
                  <SelectField label="Curve type" value={r.curveType} onChange={(v) => patch(r.id, { curveType: v })} options={IDMT_CURVE_OPTIONS_EXPORT[r.curveFamily]} />
                  <NumberField label="Pickup" unit="A" min={0} value={r.pickupA} onChange={(v) => patch(r.id, { pickupA: v })} tip="Overcurrent pickup in primary amps at the CT-side voltage." />
                  <NumberField label="TMS / time dial" min={0} step={0.005} value={r.tms} onChange={(v) => patch(r.id, { tms: v })} tip="Time multiplier (IEC) or time dial (IEEE)." />
                  <NumberField label="Instantaneous pickup" unit="A" min={0} value={r.instPickupA} onChange={(v) => patch(r.id, { instPickupA: v })} tip="Instantaneous (50) pickup in primary amps; 0 = off." />
                  <NumberField label="Instantaneous time" unit="ms" min={0} value={r.instMs} onChange={(v) => patch(r.id, { instMs: v })} tip="Operating time of the instantaneous element (typically 20–50 ms)." />
                </>
              ) : (
                engineFields(r)
              )}
              <NumberField label="Breaker opening time" unit="ms" min={0} value={r.breakerMs} onChange={(v) => patch(r.id, { breakerMs: v })} tip="Breaker opening time added to the operating time for the arc-flash clearing time (typically 50 ms; use 0 for a breaker whose trip curve already includes it)." />
            </div>

            <div className="mt-4">
              <div className="flex items-center text-xs font-medium text-muted">
                Protected asset (damage-curve check)
                <Tip text="Optional. Enter the transformer or cable this device protects: its total clearing time must stay below the asset's through-fault / adiabatic withstand curve (IEEE C57.109 thermal part, IEC 60364-5-54). Shown on the chart and checked before and after the proposal." />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SelectField
                  label="Asset"
                  value={r.damage ? r.damage.kind : "none"}
                  onChange={(v) =>
                    setDamage(r, v === "transformer" ? { kind: "transformer", mva: 1.6, zPct: 6 } : v === "cable" ? { kind: "cable", material: "copper", insulation: "xlpe", csaMm2: 185 } : undefined)
                  }
                  options={[{ value: "none", label: "None" }, { value: "transformer", label: "Transformer" }, { value: "cable", label: "Cable" }]}
                />
                {tr && (
                  <>
                    <NumberField label="Rating" unit="MVA" min={0} value={tr.mva} onChange={(v) => setDamage(r, { ...tr, mva: v })} />
                    <NumberField label="Impedance" unit="%" min={0} value={tr.zPct} onChange={(v) => setDamage(r, { ...tr, zPct: v })} />
                    <NumberField label="Voltage on the device side" unit="kV" min={0} value={tr.kvLine ?? 0} onChange={(v) => setDamage(r, { ...tr, kvLine: v })} tip="0 = the device's CT-side voltage." />
                  </>
                )}
                {cb && (
                  <>
                    <SelectField label="Conductor" value={cb.material} onChange={(v) => setDamage(r, { ...cb, material: v as "copper" | "aluminum" })} options={[{ value: "copper", label: "Copper" }, { value: "aluminum", label: "Aluminium" }]} />
                    <SelectField label="Insulation" value={cb.insulation} onChange={(v) => setDamage(r, { ...cb, insulation: v as "pvc" | "xlpe" })} options={[{ value: "pvc", label: "PVC" }, { value: "xlpe", label: "XLPE" }]} />
                    <NumberField label="Cross-section" unit="mm²" min={0} value={cb.csaMm2} onChange={(v) => setDamage(r, { ...cb, csaMm2: v })} />
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium text-muted">Grades over (downstream devices this one backs up)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {relays.filter((x) => x.id !== r.id).length === 0 && <span className="text-xs text-muted">Add another device to define grading.</span>}
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
        );
      })}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[280px]">
          <SelectField label="New device type" value={newKind} onChange={setNewKind} options={DEVICE_KINDS} />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={relays.length >= MAX_RELAYS}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-accent-2 hover:border-accent-2/60 disabled:opacity-50"
        >
          {relays.length >= MAX_RELAYS ? `Maximum of ${MAX_RELAYS} devices` : "+ Add device"}
        </button>
      </div>
    </div>
  );
}
