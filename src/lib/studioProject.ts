// Native project handling for the Protection & Arc-Flash Studio: writing the
// studio's devices as a Protection Coordination Workbench (PCW-PRO) project
// file so it opens in the standalone workbench, and the reverse (reading one)
// through suiteBridge.suiteToRelays. Pure functions, tested in the regression
// suite and checked against the real workbench loader.

import type { BusIn } from "./iec60909";
import { baseCurrentA, DEVICE_TYPE_LABEL, type DeviceEngine } from "./deviceModels";
import { CURVE_KEY, type RelayDef } from "./protsettings";
import type { SuiteDevice, SuitePair, SuiteProject } from "./suiteBridge";

const IDMT_LABEL: Record<string, Record<string, string>> = {
  iec: { standard_inverse: "IEC Standard Inverse", very_inverse: "IEC Very Inverse", extremely_inverse: "IEC Extremely Inverse", long_time_inverse: "IEC Long-Time Inverse" },
  ieee: { moderately_inverse: "IEEE Moderately Inverse", very_inverse: "IEEE Very Inverse", extremely_inverse: "IEEE Extremely Inverse" },
};

const ANSI: Record<string, string> = {
  iec: "50 / 51", ieee: "50 / 51", dt: "51DT", instantaneous: "50", lsig: "LSIG", thermalmag: "Thermal-magnetic", mcb: "MCB",
  fuse: "Fuse", motor: "49 / 48", negseq: "46", custom_equation: "Custom", points: "Custom",
};

const num = (x: number) => (Math.abs(x) >= 100 ? String(Math.round(x)) : String(Math.round(x * 1000) / 1000));

export interface ExportOptions {
  projectName: string;
  plotRefKV: number;
  defaultCTI: number;
  buses: BusIn[];
  /** maximum fault current (A) at the bus each device feeds, at the device's own voltage — written to same-voltage grading pairs */
  faultA?: Record<string, number>;
  kvOf: (r: RelayDef) => number;
}

/** Write the studio's devices as a workbench project (formatVersion 1). */
export function relaysToSuiteProject(relays: RelayDef[], o: ExportOptions): SuiteProject {
  const used = new Set<string>();
  const circuitOf = new Map<string, string>();
  for (const r of relays) {
    const bus = o.buses.find((b) => b.id === r.busId)?.name ?? "Circuit";
    let c = `${bus} — ${r.name}`;
    let n = 2;
    while (used.has(c.toLowerCase())) c = `${bus} — ${r.name} (${n++})`;
    used.add(c.toLowerCase());
    circuitOf.set(r.id, c);
  }
  const labelOf = (r: RelayDef) => `${circuitOf.get(r.id)}.${r.name}`;
  const parent = new Map<string, RelayDef>();
  for (const p of relays) for (const d of p.downstream) if (!parent.has(d)) parent.set(d, p);

  const curves: SuiteDevice[] = relays.map((r) => {
    const kv = o.kvOf(r);
    const e = r.engine;
    const type = e ? e.type : r.curveFamily === "IEC" ? "iec" : "ieee";
    const key = e ? e.key : CURVE_KEY[r.curveFamily][r.curveType];
    const par = parent.get(r.id);
    const base: SuiteDevice = {
      id: r.id,
      name: r.name,
      circuit: circuitOf.get(r.id) as string,
      device: e ? DEVICE_TYPE_LABEL[e.type] ?? e.type : `Numerical relay — ${r.curveFamily} IDMT`,
      deviceTypeValue: type === "points" ? "custom_points" : type,
      ansi: ANSI[type] ?? "",
      bracket: "",
      ct: "—",
      bus: `${kv} kV`,
      kv,
      feederType: "Other",
      upstream: par ? labelOf(par) : "—",
      downstream: "—",
      band: !!(r.bandTol && r.bandTol > 0),
      curveType: "",
      pickup: `${num(r.pickupA)} A`,
      tms: "—",
      inst: "—",
    };
    if (!e) {
      const lab = IDMT_LABEL[type]?.[key as string] ?? "";
      base.curveType = lab;
      base.tms = String(r.tms);
      base.engine = { type, key, tms: r.tms, pickup_a: r.pickupA };
      if (r.instPickupA > 0) base.inst = `${num(r.instPickupA)} A @ ${num(r.instMs / 1000)} s`;
      base.elements = [
        { el: "51", range: "", amps: String(r.pickupA), vt: "", ct: "", sensor: "", tap: "", dial: String(r.tms), curve: lab, remarks: "" },
        ...(r.instPickupA > 0 ? [{ el: "50", range: "", amps: String(r.instPickupA), vt: "", ct: "", sensor: "", tap: "", dial: `${num(r.instMs / 1000)} s`, curve: "DT", remarks: "" }] : []),
      ];
    } else if (e.type === "points") {
      base.curveType = "Custom point table";
      (base as { nativePts?: [number, number][] }).nativePts = (e.points ?? []).map((p) => [p[0], p[1]] as [number, number]);
    } else {
      base.curveType = DEVICE_TYPE_LABEL[e.type] ?? e.type;
      const eng: DeviceEngine = JSON.parse(JSON.stringify(e));
      if (eng.type === "lsig" && r.bandTol) eng.bandTolerance = r.bandTol;
      base.engine = eng as SuiteDevice["engine"];
      base.elements = [{ el: ANSI[e.type] ?? "", range: "", amps: String(baseCurrentA(e)), vt: "", ct: "", sensor: "", tap: "", dial: "", curve: DEVICE_TYPE_LABEL[e.type] ?? e.type, remarks: "" }];
    }
    base.sheetInfo = {
      location: "", serial: "", panelNo: "", sheetNo: "", page: "1 of 1", settingDate: "", revisionDate: "", application: o.projectName,
      relayType: base.device, devNo: r.name, preparedBy: "", approvedBy: "",
    };
    return base;
  });

  const pairs: SuitePair[] = [];
  for (const p of relays) {
    for (const did of p.downstream) {
      const d = relays.find((x) => x.id === did);
      if (!d) continue;
      const pair: SuitePair = { up: p.id, down: d.id, base: Math.max(1, Math.round((d.engine ? baseCurrentA(d.engine) : d.pickupA) || 1)) };
      const f = o.faultA?.[d.id];
      if (f && f > 0 && Math.abs(o.kvOf(p) - o.kvOf(d)) < 1e-9) pair.maxFaultA = Math.round(f);
      pairs.push(pair);
    }
  }

  return {
    formatVersion: 1,
    savedAt: new Date().toISOString(),
    projectName: o.projectName,
    plotRefKV: o.plotRefKV,
    defaultCTI: o.defaultCTI,
    autoCurveCounter: relays.length + 1,
    advDamageEnabled: false,
    titleBlock: {},
    curves,
    referenceCurves: [],
    gradingPairs: pairs,
    enabled: {},
    customColors: { dark: {}, report: {} },
  } as SuiteProject;
}
