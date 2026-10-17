"use client";

import { CheckboxField, NumberField, SelectField } from "@/components/fields";
import { ELECTRODE_CONFIG_INFO, EQUIPMENT_CLASSES, type ElectrodeConfig, type EquipClassId } from "@/lib/arcflash2018";
import { IDMT_CURVE_OPTIONS_EXPORT } from "@/components/arcflash/curveOptions";
import { afOf } from "@/lib/arcflashstudy";
import type { BusArcFlashIn, ProtectionIn, ScNetwork } from "@/lib/iec60909";

/** Per-bus arc-flash inputs: equipment class, electrode configuration, geometry, protective device and mitigation. */
export default function ArcFlashInputs({
  net,
  setNet,
  hideProtection = false,
}: {
  net: ScNetwork;
  setNet: React.Dispatch<React.SetStateAction<ScNetwork>>;
  /** Hide the per-bus protective device and mitigation inputs (used where relays are defined separately). */
  hideProtection?: boolean;
}) {
  const setAf = (busId: string, patch: Partial<BusArcFlashIn>) =>
    setNet((n) => ({ ...n, buses: n.buses.map((b) => (b.id === busId ? { ...b, af: { ...afOf(b), ...patch } } : b)) }));
  const setProt = (busId: string, patch: Partial<ProtectionIn>) =>
    setNet((n) => ({
      ...n,
      buses: n.buses.map((b) => {
        if (b.id !== busId) return b;
        const cur = afOf(b);
        return { ...b, af: { ...cur, protection: { ...cur.protection, ...patch } } };
      }),
    }));
  const setSettings = (patch: Partial<ScNetwork["settings"]>) => setNet((n) => ({ ...n, settings: { ...n.settings, ...patch } }));

  const applyClass = (busId: string, id: EquipClassId) => {
    const c = EQUIPMENT_CLASSES.find((e) => e.id === id);
    if (!c) return;
    if (id === "custom") return setAf(busId, { equipClass: id });
    setAf(busId, { equipClass: id, gapMm: c.gapMm, workingMm: c.workingDistMm, heightMm: c.heightMm, widthMm: c.widthMm, depthMm: c.depthMm });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Study settings</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CheckboxField
            label="Use nominal-voltage fault current (c = 1.0)"
            tip="IEEE 1584 takes the bolted fault current at the system voltage. The IEC 60909 value includes the voltage factor c (1.05–1.10), which would overstate the arcing current. Leave ticked for a conventional arc-flash study; untick to use the IEC maximum Ik″."
            checked={net.settings.afNominalC ?? true}
            onChange={(v) => setSettings({ afNominalC: v })}
          />
          <NumberField
            label="Longest arc duration considered"
            unit="ms"
            min={100}
            tip="IEEE 1584-2018 clause 6.9.1: if the clearing time exceeds 2 s, engineering judgement may cap the exposure at about 2 s because a person normally moves away. Default 2000 ms; raise it if egress could be blocked."
            value={net.settings.afMaxArcMs ?? 2000}
            onChange={(v) => setSettings({ afMaxArcMs: v })}
          />
        </div>
      </div>

      {net.buses.map((b) => {
        const af = afOf(b);
        const p = af.protection;
        return (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {b.name} <span className="text-sm font-normal text-muted">({b.unKv} kV)</span>
              </h3>
              <span className="text-xs text-muted">Arc-flash data for this bus</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField
                label="Equipment class"
                tip="Loads the typical electrode gap, enclosure size and working distance from IEEE 1584-2018 Tables 8 and 10. Choose Custom to enter your own measured values."
                value={af.equipClass as EquipClassId}
                onChange={(v) => applyClass(b.id, v)}
                options={EQUIPMENT_CLASSES.map((e) => ({ value: e.id, label: e.label }))}
              />
              <SelectField
                label="Electrode configuration"
                tip="How the conductors are arranged in the equipment (Annex C/G). VCB is the usual and generally conservative choice for switchgear and MCCs. VCBB suits vertical conductors ending at an insulating barrier, HCB horizontal conductors in a box, VOA/HOA are open air."
                value={af.config as ElectrodeConfig}
                onChange={(v) => setAf(b.id, { config: v })}
                options={ELECTRODE_CONFIG_INFO.map((e) => ({ value: e.value, label: e.label }))}
              />
              <NumberField label="Electrode gap" unit="mm" min={0} value={af.gapMm} onChange={(v) => setAf(b.id, { gapMm: v, equipClass: "custom" })} tip="Distance between conductors in the equipment. Typical (Table 8): 25 mm LV MCC/panel, 32 mm LV switchgear, 104 mm 5 kV, 152 mm 15 kV. Model range: 6.35–76.2 mm up to 600 V, 19–254 mm above." />
              <NumberField label="Working distance" unit="mm" min={0} value={af.workingMm} onChange={(v) => setAf(b.id, { workingMm: v })} tip="Distance from the arc source to the worker's head and torso (Table 10): 457 mm panelboards/MCCs, 610 mm LV switchgear, 914 mm MV equipment. The model is valid from 305 mm." />
              <NumberField label="Enclosure height" unit="mm" min={0} value={af.heightMm} onChange={(v) => setAf(b.id, { heightMm: v })} tip="Enclosure (box) height. Sizes above 1244.6 mm are treated as 1244.6 mm. Ignored for open-air configurations." />
              <NumberField label="Enclosure width" unit="mm" min={0} value={af.widthMm} onChange={(v) => setAf(b.id, { widthMm: v })} tip="Enclosure width; should be more than four times the electrode gap. Ignored for open-air configurations." />
              <NumberField label="Enclosure depth" unit="mm" min={0} value={af.depthMm} onChange={(v) => setAf(b.id, { depthMm: v })} tip="Enclosure depth. Only matters for LV equipment below 600 V with both height and width under 508 mm: depth ≤ 203.2 mm makes it a ‘shallow’ enclosure." />
            </div>

            {!hideProtection && (
              <>
            <h4 className="mt-5 text-sm font-semibold text-foreground">Protective device that clears an arc at this bus</h4>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <SelectField
                label="Clearing time source"
                tip="Fixed: you enter the total time (relay + breaker, from the coordination study or time-current curve). IDMT relay: the time is calculated from the arcing current using an IEC/IEEE curve, so it changes between the average and reduced arcing current."
                value={p.mode}
                onChange={(v) => setProt(b.id, { mode: v })}
                options={[
                  { value: "fixed", label: "Fixed total clearing time" },
                  { value: "idmt", label: "IDMT relay + breaker" },
                ]}
              />
              {p.mode === "fixed" ? (
                <NumberField label="Total clearing time" unit="ms" min={1} value={p.fixedMs} onChange={(v) => setProt(b.id, { fixedMs: v })} tip="Total time from fault start to arc extinction: device operating time plus breaker opening/interrupting time (typically 50 ms, about 3 cycles) plus any lockout or auxiliary relay delay. Use the longest time in the TCC band." />
              ) : (
                <>
                  <SelectField label="Curve family" value={p.curveFamily} onChange={(v) => setProt(b.id, { curveFamily: v, curveType: v === "IEC" ? "SI" : "MI" })} options={[{ value: "IEC", label: "IEC 60255-151" }, { value: "IEEE", label: "IEEE C37.112" }]} />
                  <SelectField label="Curve type" value={p.curveType} onChange={(v) => setProt(b.id, { curveType: v })} options={IDMT_CURVE_OPTIONS_EXPORT[p.curveFamily]} />
                  <NumberField label="Device voltage" unit="kV" min={0} value={p.deviceKv} onChange={(v) => setProt(b.id, { deviceKv: v })} tip="Voltage level where the protective device is located. Enter 0 if it is on this bus. If it sits on the HV side of the supply transformer, enter that voltage: the arcing current seen by the device is scaled by the voltage ratio." />
                  <NumberField label="Pickup" unit="A" min={0} value={p.pickupA} onChange={(v) => setProt(b.id, { pickupA: v })} tip="Relay pickup in primary amps at the device voltage." />
                  <NumberField label="TMS / time dial" min={0} step={0.01} value={p.tms} onChange={(v) => setProt(b.id, { tms: v })} tip="Time multiplier (IEC) or time dial (IEEE) of the relay." />
                  <NumberField label="Instantaneous pickup" unit="A" min={0} value={p.instPickupA} onChange={(v) => setProt(b.id, { instPickupA: v })} tip="Instantaneous (50) element pickup at the device voltage. 0 disables it. When the arcing current exceeds it, the relay operates in the instantaneous time below." />
                  <NumberField label="Instantaneous time" unit="ms" min={0} value={p.instMs} onChange={(v) => setProt(b.id, { instMs: v })} tip="Relay operating time of the instantaneous element (typically 20–50 ms)." />
                  <NumberField label="Breaker opening time" unit="ms" min={0} value={p.breakerMs} onChange={(v) => setProt(b.id, { breakerMs: v })} tip="Circuit breaker opening/interrupting time added to the relay time (IEEE 1584-2018 clause 6.9.4). Typically 50 ms (3 cycles); 80 ms for slower breakers." />
                </>
              )}
            </div>

            <h4 className="mt-5 text-sm font-semibold text-foreground">Mitigation what-if</h4>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="col-span-2 sm:col-span-1">
                <CheckboxField
                  label="Energy-reducing maintenance mode"
                  tip="Compare the result with a maintenance switch, arc-flash relay or zone-selective interlocking that forces fast clearing while someone works on the equipment. The table shows the energy with and without it."
                  checked={af.maintenanceOn}
                  onChange={(v) => setAf(b.id, { maintenanceOn: v })}
                />
              </div>
              <NumberField label="Clearing time in maintenance mode" unit="ms" min={1} disabled={!af.maintenanceOn} value={af.maintenanceMs} onChange={(v) => setAf(b.id, { maintenanceMs: v })} tip="Total clearing time (relay + breaker) with the mitigation active. Typical: 40–80 ms for instantaneous or optical arc-flash relays." />
            </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
