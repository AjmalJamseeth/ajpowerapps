"use client";

import { NumberField, CheckboxField, SelectField, TextField } from "@/components/fields";
import {
  CABLE_PRESETS,
  GEN_PRESETS,
  GRID_PRESETS,
  MOTOR_PRESETS,
  TRAFO_PRESETS,
  typicalGenRToX,
  typicalMotorRToX,
  type BranchIn,
  type CableIn,
  type Preset,
  type ScNetwork,
  type ScSettings,
  type TieIn,
  type TrafoIn,
  type VectorGroup,
} from "@/lib/iec60909";

// Random suffix so ids never collide with ids inside loaded/imported scenarios.
const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function Card({
  tag,
  tagClass,
  title,
  onRemove,
  presets,
  onPreset,
  children,
}: {
  tag: string;
  tagClass: string;
  title: string;
  onRemove: () => void;
  presets?: Preset<never>[];
  onPreset?: (i: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tagClass}`}>{tag}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <div className="ml-auto flex items-center gap-2">
          {presets && onPreset && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value !== "") onPreset(Number(e.target.value));
                e.target.value = "";
              }}
              aria-label="Apply typical values"
              className="max-w-[230px] rounded-md border border-border bg-surface px-2 py-1 text-xs text-accent-2 focus:border-accent-2 focus:outline-none"
            >
              <option value="">Apply typical values…</option>
              {presets.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-fail/40 hover:text-fail"
          >
            Remove
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60"
    >
      + {children}
    </button>
  );
}

function Panel({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------


/** The network input editor shared by the IEC 60909 and arc-flash study pages. */
export default function NetworkEditor({
  net,
  setNet,
}: {
  net: ScNetwork;
  setNet: React.Dispatch<React.SetStateAction<ScNetwork>>;
}) {
  const setSettings = (patch: Partial<ScSettings>) => setNet((n) => ({ ...n, settings: { ...n.settings, ...patch } }));

  // generic list helpers
  const upd = <K extends "buses" | "grids" | "gens" | "motors" | "branches">(key: K, id: string, patch: object) =>
    setNet((n) => ({ ...n, [key]: (n[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) }) as ScNetwork);
  const rm = (key: "grids" | "gens" | "motors" | "branches", id: string) =>
    setNet((n) => ({ ...n, [key]: (n[key] as { id: string }[]).filter((x) => x.id !== id) }) as ScNetwork);
  const removeBus = (id: string) =>
    setNet((n) => ({
      ...n,
      buses: n.buses.filter((b) => b.id !== id),
      grids: n.grids.filter((x) => x.busId !== id),
      gens: n.gens.filter((x) => x.busId !== id),
      motors: n.motors.filter((x) => x.busId !== id),
      branches: n.branches.filter((x) => x.fromBus !== id && x.toBus !== id),
    }));

  const busOptions = net.buses.map((b) => ({ value: b.id, label: `${b.name} (${b.unKv} kV)` }));
  const firstBus = net.buses[0]?.id ?? "";
  const lastBus = net.buses[net.buses.length - 1]?.id ?? firstBus;

  const addBus = () =>
    setNet((n) => ({
      ...n,
      buses: [...n.buses, { id: uid("b"), name: `Bus ${n.buses.length + 1}`, unKv: n.buses[n.buses.length - 1]?.unKv ?? 11, ratingKa: 0 }],
    }));
  const addGrid = () =>
    setNet((n) => ({ ...n, grids: [...n.grids, { id: uid("g"), name: `Grid ${n.grids.length + 1}`, busId: firstBus, skMva: 250, rToX: 0.1, z0ToZ1: 1 }] }));
  const addGen = () =>
    setNet((n) => ({
      ...n,
      gens: [
        ...n.gens,
        { id: uid("gn"), name: `Gen ${n.gens.length + 1}`, busId: firstBus, srMva: 2.5, urKv: 11, xdPct: 14, cosPhi: 0.8, rToX: 0.07, x0Pct: 7, neutralOhm: 0 },
      ],
    }));
  const addMotor = () =>
    setNet((n) => ({
      ...n,
      motors: [
        ...n.motors,
        { id: uid("m"), name: `Motor ${n.motors.length + 1}`, busId: lastBus, prKw: 160, urKv: 0.4, cosPhi: 0.88, eff: 0.95, ilrRatio: 7, rToX: 0.42 },
      ],
    }));
  const addBranch = (kind: BranchIn["kind"]) =>
    setNet((n) => {
      const from = n.buses[n.buses.length - 2]?.id ?? firstBus;
      const to = n.buses[n.buses.length - 1]?.id ?? firstBus;
      const base = { id: uid("br"), fromBus: from, toBus: to };
      let br: BranchIn;
      if (kind === "transformer")
        br = { ...base, kind, name: `T${n.branches.length + 1}`, srMva: 1.6, ukPct: 6, pkKw: 15, group: "Dyn", z0ToZ1: 1, neutralFromOhm: 0, neutralToOhm: 0, applyKt: true };
      else if (kind === "cable")
        br = { ...base, kind, name: `Cable ${n.branches.length + 1}`, rOhmKm: 0.0754, xOhmKm: 0.078, r0OhmKm: 0.3016, x0OhmKm: 0.234, lengthKm: 0.1, parallel: 1 };
      else br = { ...base, kind, name: `Tie ${n.branches.length + 1}`, closed: true };
      return { ...n, branches: [...n.branches, br] };
    });

  const applyPreset = <T extends { id: string }>(key: "grids" | "gens" | "motors" | "branches", id: string, p: Preset<T>) => upd(key, id, p.values);

  return (
    <>
        {/* ---------------- Network editor ---------------- */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">Build your network</h2>
          <p className="mt-1 text-sm text-muted">
            Add or edit anything below — the diagram and tables above update immediately. Use “Apply typical values…” on any item to start
            from a realistic set of constants.
          </p>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <Panel title="Study settings">
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="LV voltage tolerance"
                tip="Selects cmax for networks up to 1 kV (IEC 60909-0 Table 1): +6 % tolerance → cmax 1.05; +10 % → cmax 1.10. cmin is 0.95 either way. MV/HV uses cmax 1.10 and cmin 1.00."
                value={net.settings.lvTolerancePct}
                onChange={(v) => setSettings({ lvTolerancePct: Number(v) as 6 | 10 })}
                options={[
                  { value: 6, label: "+6 % (cmax 1.05)" },
                  { value: 10, label: "+10 % (cmax 1.10)" },
                ]}
              />
              <SelectField
                label="System frequency"
                tip="Used for the thermal equivalent factor m (depends on f·Tk)."
                value={net.settings.frequencyHz}
                onChange={(v) => setSettings({ frequencyHz: Number(v) as 50 | 60 })}
                options={[
                  { value: 50, label: "50 Hz" },
                  { value: 60, label: "60 Hz" },
                ]}
              />
              <NumberField
                label="Minimum time delay tmin"
                unit="s"
                min={0}
                tip="Shortest time from fault inception to the first contact separation of the breaker (protection delay + opening time). Typical 0.05–0.1 s. It sets the AC-decay factor μ for generators (shorter tmin → higher μ)."
                value={net.settings.tminS}
                onChange={(v) => setSettings({ tminS: v })}
              />
              <NumberField
                label="Fault duration Tk"
                unit="s"
                min={0}
                tip="Duration of the short circuit for the thermal equivalent current Ith (typically 1 s or 3 s, the equipment short-time rating)."
                value={net.settings.tkS}
                onChange={(v) => setSettings({ tkS: v })}
              />
            </div>
          </Panel>

          <Panel title="Buses" hint="Each bus is a busbar at one nominal voltage. Sources and branches attach to buses.">
            {net.buses.map((b) => (
              <div key={b.id} className="grid grid-cols-[1fr_90px_100px_auto] items-end gap-2">
                <TextField label="Name" value={b.name} onChange={(v) => upd("buses", b.id, { name: v })} tip="Label shown on the diagram and in the report." />
                <NumberField label="Un" unit="kV" min={0} value={b.unKv} onChange={(v) => upd("buses", b.id, { unKv: v })} tip="Nominal line-to-line system voltage of this bus (e.g. 0.4, 0.69, 3.3, 6.6, 11, 33, 132 kV). Sets c and the per-unit base." />
                <NumberField label="Rating" unit="kA" min={0} value={b.ratingKa} onChange={(v) => upd("buses", b.id, { ratingKa: v })} tip="Optional: switchgear short-circuit breaking rating. If above 0, the bus is checked against the largest Ik″ and flagged red if inadequate. Typical: 25 / 31.5 / 40 kA (MV), 36 / 50 / 65 kA (LV)." />
                <button
                  type="button"
                  onClick={() => removeBus(b.id)}
                  className="mb-0.5 rounded-md border border-border px-2 py-2 text-xs text-muted hover:border-fail/40 hover:text-fail"
                  aria-label={`Remove ${b.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
            <AddButton onClick={addBus}>Add bus</AddButton>
          </Panel>
        </div>

        <div className="mt-6 space-y-4">
          <Panel title="Sources — utility, generators, motors" hint="Any number per bus. Generators and the utility feed the fault; motors add to the maximum fault current only.">
            {net.grids.map((g) => (
              <Card key={g.id} tag="Grid" tagClass="bg-accent-2/15 text-accent-2" title={g.name} onRemove={() => rm("grids", g.id)} presets={GRID_PRESETS as unknown as Preset<never>[]} onPreset={(i) => applyPreset("grids", g.id, GRID_PRESETS[i])}>
                <TextField label="Name" value={g.name} onChange={(v) => upd("grids", g.id, { name: v })} />
                <SelectField label="Connected to bus" value={g.busId} onChange={(v) => upd("grids", g.id, { busId: v })} options={busOptions} tip="The bus where this utility / network feeder connects." />
                <NumberField label="Sk″" unit="MVA" min={0} value={g.skMva} onChange={(v) => upd("grids", g.id, { skMva: v })} tip="Initial symmetrical short-circuit power of the supply at its connection point (= √3·Un·Ik″Q). Get it from the utility. Typical: 150–500 MVA at 11 kV, 500–1500 MVA at 33 kV, 3000–10000 MVA at 132 kV." />
                <NumberField label="R/X" min={0} value={g.rToX} onChange={(v) => upd("grids", g.id, { rToX: v })} tip="Ratio of source resistance to reactance. 0.1 is the IEC default when unknown (X/R = 10); LV supplies are often 0.2–0.4." />
                <NumberField label="Z0/Z1" min={0} value={g.z0ToZ1} onChange={(v) => upd("grids", g.id, { z0ToZ1: v })} tip="Zero- to positive-sequence impedance ratio of the source. 1.0 is typical for a solidly earthed utility; only affects earth-fault currents." />
              </Card>
            ))}
            {net.gens.map((g) => (
              <Card key={g.id} tag="Generator" tagClass="bg-accent/15 text-accent" title={g.name} onRemove={() => rm("gens", g.id)} presets={GEN_PRESETS as unknown as Preset<never>[]} onPreset={(i) => applyPreset("gens", g.id, GEN_PRESETS[i])}>
                <TextField label="Name" value={g.name} onChange={(v) => upd("gens", g.id, { name: v })} />
                <SelectField label="Connected to bus" value={g.busId} onChange={(v) => upd("gens", g.id, { busId: v })} options={busOptions} tip="Bus at the generator terminals (the generator transformer, if any, is added as a separate transformer branch)." />
                <NumberField label="Rated power SrG" unit="MVA" min={0} value={g.srMva} onChange={(v) => upd("gens", g.id, { srMva: v })} tip="Nameplate apparent power." />
                <NumberField label="Rated voltage UrG" unit="kV" min={0} value={g.urKv} onChange={(v) => upd("gens", g.id, { urKv: v })} tip="Nameplate terminal voltage. Used in KG = Un/UrG · cmax/(1+xd″·sinφ)." />
                <NumberField label="Subtransient xd″" unit="%" min={0} value={g.xdPct} onChange={(v) => upd("gens", g.id, { xdPct: v })} tip="Saturated subtransient reactance on its own rating. Typical 12–20 % (turbo 10–20 %, salient-pole 12–25 %)." />
                <NumberField label="Rated cos φ" min={0} max={1} step={0.01} value={g.cosPhi} onChange={(v) => upd("gens", g.id, { cosPhi: v })} tip="Rated power factor, used to get sin φ for KG. Typical 0.8–0.9." />
                <div>
                  <NumberField label="RG/Xd″" min={0} step={0.01} value={g.rToX} onChange={(v) => upd("gens", g.id, { rToX: v })} tip="Resistance to reactance ratio. IEC 60909-0 values when not known: 0.15 (UrG ≤ 1 kV), 0.07 (> 1 kV and < 100 MVA), 0.05 (> 1 kV and ≥ 100 MVA)." />
                  <button type="button" onClick={() => upd("gens", g.id, { rToX: typicalGenRToX(g.urKv, g.srMva) })} className="mt-1 text-[11px] text-accent-2 hover:underline">
                    Set IEC typical
                  </button>
                </div>
                <NumberField label="Zero-seq x0" unit="%" min={0} value={g.x0Pct} onChange={(v) => upd("gens", g.id, { x0Pct: v })} tip="Zero-sequence reactance. Typically 0.4–0.6 × xd″ (5–10 %). Only affects earth faults." />
                <NumberField label="Neutral resistance" unit="Ω" min={0} value={g.neutralOhm} onChange={(v) => upd("gens", g.id, { neutralOhm: v })} tip="Neutral earthing resistor at the generator (Ω, at generator voltage). 0 = solidly earthed. Enters the zero-sequence path as 3·Rn." />
              </Card>
            ))}
            {net.motors.map((m) => (
              <Card key={m.id} tag="Motor" tagClass="bg-pass/15 text-pass" title={m.name} onRemove={() => rm("motors", m.id)} presets={MOTOR_PRESETS as unknown as Preset<never>[]} onPreset={(i) => applyPreset("motors", m.id, MOTOR_PRESETS[i])}>
                <TextField label="Name" value={m.name} onChange={(v) => upd("motors", m.id, { name: v })} />
                <SelectField label="Connected to bus" value={m.busId} onChange={(v) => upd("motors", m.id, { busId: v })} options={busOptions} tip="Bus feeding the motor (group several similar motors into one equivalent by adding their ratings)." />
                <NumberField label="Rated power Pr" unit="kW" min={0} value={m.prKw} onChange={(v) => upd("motors", m.id, { prKw: v })} tip="Rated mechanical (shaft) power. For a group, enter the total." />
                <NumberField label="Rated voltage" unit="kV" min={0} value={m.urKv} onChange={(v) => upd("motors", m.id, { urKv: v })} tip="Motor nameplate voltage." />
                <NumberField label="cos φ" min={0} max={1} step={0.01} value={m.cosPhi} onChange={(v) => upd("motors", m.id, { cosPhi: v })} tip="Rated power factor. Typical 0.85–0.9." />
                <NumberField label="Efficiency" min={0} max={1} step={0.01} value={m.eff} onChange={(v) => upd("motors", m.id, { eff: v })} tip="Rated efficiency (0–1). SrM = Pr/(η·cos φ). Typical 0.92–0.96." />
                <NumberField label="ILR / IrM" min={0} value={m.ilrRatio} onChange={(v) => upd("motors", m.id, { ilrRatio: v })} tip="Locked-rotor current divided by rated current. Typical 5–7 (LV up to 8)." />
                <div>
                  <NumberField label="RM/XM" min={0} step={0.01} value={m.rToX} onChange={(v) => upd("motors", m.id, { rToX: v })} tip="IEC 60909-0: 0.42 for LV motor groups (with cables), 0.15 for MV motors < 1 MW per pole pair, 0.10 for ≥ 1 MW per pole pair." />
                  <button type="button" onClick={() => upd("motors", m.id, { rToX: typicalMotorRToX(m.urKv, m.prKw) })} className="mt-1 text-[11px] text-accent-2 hover:underline">
                    Set IEC typical
                  </button>
                </div>
              </Card>
            ))}
            <div className="flex flex-wrap gap-2">
              <AddButton onClick={addGrid}>Utility / grid source</AddButton>
              <AddButton onClick={addGen}>Generator</AddButton>
              <AddButton onClick={addMotor}>Motor</AddButton>
            </div>
          </Panel>

          <Panel title="Branches — transformers, cables, bus ties" hint="Each branch joins two buses. For a transformer, the ‘from’ bus is the first-listed winding side (HV side by convention).">
            {net.branches.map((b) => {
              const common = (
                <>
                  <TextField label="Name" value={b.name} onChange={(v) => upd("branches", b.id, { name: v })} />
                  <SelectField label="From bus" value={b.fromBus} onChange={(v) => upd("branches", b.id, { fromBus: v })} options={busOptions} tip="First end of the branch (the HV side for a transformer)." />
                  <SelectField label="To bus" value={b.toBus} onChange={(v) => upd("branches", b.id, { toBus: v })} options={busOptions} tip="Second end of the branch (the LV side for a transformer)." />
                </>
              );
              if (b.kind === "transformer") {
                const t = b as TrafoIn;
                return (
                  <Card key={b.id} tag="Transformer" tagClass="bg-accent/15 text-accent" title={t.name} onRemove={() => rm("branches", t.id)} presets={TRAFO_PRESETS as unknown as Preset<never>[]} onPreset={(i) => applyPreset("branches", t.id, TRAFO_PRESETS[i])}>
                    {common}
                    <NumberField label="Rated power Sr" unit="MVA" min={0} value={t.srMva} onChange={(v) => upd("branches", t.id, { srMva: v })} tip="Nameplate rating. 1 MVA = 1000 kVA." />
                    <NumberField label="Impedance uk" unit="%" min={0} value={t.ukPct} onChange={(v) => upd("branches", t.id, { ukPct: v })} tip="Short-circuit voltage at rated current. Typical: 4 % up to 630 kVA, 6 % for 0.8–3.15 MVA, 7.5–14 % for 5–40 MVA." />
                    <NumberField label="Load loss Pk" unit="kW" min={0} value={t.pkKw} onChange={(v) => upd("branches", t.id, { pkKw: v })} tip="Copper (load) losses at rated current, from the test report. Gives the resistive part ukr = Pk/Sr. Enter 0 for a purely reactive model." />
                    <SelectField
                      label="Vector group"
                      value={t.group}
                      onChange={(v) => upd("branches", t.id, { group: v as VectorGroup })}
                      options={[
                        { value: "Dyn", label: "Dyn (Δ from / earthed Y to)" },
                        { value: "YNd", label: "YNd (earthed Y from / Δ to)" },
                        { value: "YNyn", label: "YNyn (both earthed Y)" },
                        { value: "Yy", label: "Yy / Dd (no earth path)" },
                      ]}
                      tip="Decides how zero-sequence current flows. Dyn: the earthed LV star supplies earth faults on the LV side only. YNyn passes zero-sequence through. Yy/Dd blocks it. Affects line-to-earth results only."
                    />
                    <NumberField label="Z0/Z1" min={0} value={t.z0ToZ1} onChange={(v) => upd("branches", t.id, { z0ToZ1: v })} tip="Zero- to positive-sequence impedance ratio. ≈1.0 for Dyn; 0.8–1.0 for 3-limb YNyn." />
                    <NumberField label="Neutral R (from side)" unit="Ω" min={0} value={t.neutralFromOhm} onChange={(v) => upd("branches", t.id, { neutralFromOhm: v })} tip="Neutral earthing resistor on the ‘from’ winding (Ω at that winding’s voltage). Used for YNd / YNyn." />
                    <NumberField label="Neutral R (to side)" unit="Ω" min={0} value={t.neutralToOhm} onChange={(v) => upd("branches", t.id, { neutralToOhm: v })} tip="Neutral earthing resistor on the ‘to’ winding (Ω at that winding’s voltage), e.g. an NER on an 11 kV star secondary. Used for Dyn / YNyn." />
                    <div className="col-span-2 sm:col-span-3">
                      <CheckboxField label="Apply impedance correction factor KT" checked={t.applyKt} onChange={(v) => upd("branches", t.id, { applyKt: v })} tip="IEC 60909-0 cl. 3.3.3: KT = 0.95·cmax/(1+0.6·xT) for network transformers. Untick only for power-station unit transformers (generator + step-up transformer), which use a different correction." />
                    </div>
                  </Card>
                );
              }
              if (b.kind === "cable") {
                const c = b as CableIn;
                return (
                  <Card key={b.id} tag="Cable / line" tagClass="bg-accent-2/15 text-accent-2" title={c.name} onRemove={() => rm("branches", c.id)} presets={CABLE_PRESETS as unknown as Preset<never>[]} onPreset={(i) => applyPreset("branches", c.id, CABLE_PRESETS[i])}>
                    {common}
                    <NumberField label="r (positive)" unit="Ω/km" min={0} value={c.rOhmKm} onChange={(v) => upd("branches", c.id, { rOhmKm: v })} tip="Positive-sequence resistance per km at 20 °C (the code raises it to 80 °C for minimum fault currents). From the cable datasheet." />
                    <NumberField label="x (positive)" unit="Ω/km" min={0} value={c.xOhmKm} onChange={(v) => upd("branches", c.id, { xOhmKm: v })} tip="Positive-sequence reactance per km. Typical 0.07–0.11 Ω/km for cables, 0.3–0.4 for overhead lines." />
                    <NumberField label="r0 (zero)" unit="Ω/km" min={0} value={c.r0OhmKm} onChange={(v) => upd("branches", c.id, { r0OhmKm: v })} tip="Zero-sequence resistance per km. About 3–4 × r for a 3-core cable (depends on armour/sheath return)." />
                    <NumberField label="x0 (zero)" unit="Ω/km" min={0} value={c.x0OhmKm} onChange={(v) => upd("branches", c.id, { x0OhmKm: v })} tip="Zero-sequence reactance per km. About 3 × x for a 3-core cable." />
                    <NumberField label="Length" unit="km" min={0} value={c.lengthKm} onChange={(v) => upd("branches", c.id, { lengthKm: v })} tip="Route length in km (0.05 km = 50 m)." />
                    <NumberField label="Parallel runs" min={1} step={1} value={c.parallel} onChange={(v) => upd("branches", c.id, { parallel: Math.max(1, Math.round(v)) })} tip="Number of identical cables in parallel per phase; the impedance is divided by this number." />
                  </Card>
                );
              }
              const t = b as TieIn;
              return (
                <Card key={b.id} tag="Bus tie" tagClass="bg-muted/20 text-muted" title={t.name} onRemove={() => rm("branches", t.id)}>
                  {common}
                  <div className="col-span-2 sm:col-span-3">
                    <CheckboxField label="Tie breaker closed" checked={t.closed} onChange={(v) => upd("branches", t.id, { closed: v })} tip="Closed: the two buses are joined (a bus coupler). Open: the buses are separated and each only sees its own sources — useful for comparing split-bus and parallel operation." />
                  </div>
                </Card>
              );
            })}
            <div className="flex flex-wrap gap-2">
              <AddButton onClick={() => addBranch("transformer")}>Transformer</AddButton>
              <AddButton onClick={() => addBranch("cable")}>Cable / line</AddButton>
              <AddButton onClick={() => addBranch("tie")}>Bus tie</AddButton>
            </div>
          </Panel>
        </div>

    </>
  );
}
