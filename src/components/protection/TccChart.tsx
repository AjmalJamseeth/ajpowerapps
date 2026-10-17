"use client";

import { useState } from "react";
import { relayTimeS, type BusOutcome, type DamageCurve, type RelayDef } from "@/lib/protsettings";

// Time-current chart (log-log) of the relays before (dashed) and after (solid)
// the proposal, with vertical markers for the arcing and maximum fault
// currents of the selected bus. All currents are shown at one reference
// voltage; each relay is converted with its own CT-side voltage.

const COLORS = ["#22d3ee", "#a78bfa", "#fbbf24", "#34d399", "#f472b6", "#60a5fa", "#fb923c", "#a3e635"];

export default function TccChart({
  before,
  after,
  devKvOf,
  refKv,
  bus,
  busKv,
  targetMs,
  damage = [],
}: {
  before: RelayDef[];
  after: RelayDef[];
  devKvOf: (r: RelayDef) => number;
  refKv: number;
  bus: BusOutcome | null;
  busKv: number;
  targetMs: number | null;
  damage?: DamageCurve[];
}) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setHidden((h) => { const n = new Set(h); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const W = 760;
  const H = 420;
  const L = 56;
  const R = 16;
  const T = 14;
  const B = 44;
  const xMin = 10;
  const xMax = 100000;
  const yMin = 0.01;
  const yMax = 100;
  const lx = (i: number) => L + ((Math.log10(Math.max(i, xMin)) - Math.log10(xMin)) / (Math.log10(xMax) - Math.log10(xMin))) * (W - L - R);
  const ly = (t: number) => T + (1 - (Math.log10(Math.min(Math.max(t, yMin), yMax)) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (H - T - B);

  const path = (r: RelayDef, mult = 1) => {
    const k = refKv / devKvOf(r);
    const pts: [number, number][] = [];
    const N = 140;
    const extra = r.instPickupA > 0 ? [r.instPickupA / k * 0.9999, r.instPickupA / k] : [];
    const xs: number[] = [];
    for (let i = 0; i <= N; i++) xs.push(xMin * Math.pow(xMax / xMin, i / N));
    xs.push(...extra);
    xs.sort((a, b) => a - b);
    for (const x of xs) {
      const t = relayTimeS(r, x * k) * mult;
      if (Number.isFinite(t) && t >= yMin * 0.5) pts.push([lx(x), ly(t)]);
    }
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  };

  const dmgPath = (c: DamageCurve) => {
    const rel = after.find((r) => r.id === c.relayId);
    const k = rel ? refKv / devKvOf(rel) : 1;
    return c.points.map((p, i) => `${i === 0 ? "M" : "L"}${lx(p[0] * k).toFixed(1)},${ly(p[1]).toFixed(1)}`).join(" ");
  };

  const markers: { x: number; label: string; color: string; dash: string }[] = [];
  if (bus && bus.model !== "none") {
    const toRef = (kA: number) => (kA * 1000 * busKv) / refKv;
    markers.push({ x: toRef(bus.ibfMaxKa), label: `Ibf max ${bus.ibfMaxKa.toFixed(1)} kA`, color: "#f87171", dash: "6 4" });
    markers.push({ x: toRef(bus.iarcKa), label: `Iarc ${bus.iarcKa.toFixed(1)} kA`, color: "#fbbf24", dash: "3 3" });
    if (bus.iarcMinKa > 0 && Math.abs(bus.iarcMinKa - bus.iarcKa) > 0.01) markers.push({ x: toRef(bus.iarcMinKa), label: `Iarc min ${bus.iarcMinKa.toFixed(1)} kA`, color: "#fb923c", dash: "2 3" });
  }

  const xTicks = [10, 100, 1000, 10000, 100000];
  const yTicks = [0.01, 0.1, 1, 10, 100];
  const fmtI = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Time-current coordination chart">
        <rect x={0} y={0} width={W} height={H} rx={10} className="fill-surface-2" opacity={0.35} />
        {xTicks.map((v) => (
          <g key={`x${v}`}>
            <line x1={lx(v)} x2={lx(v)} y1={T} y2={H - B} className="stroke-border" strokeWidth={1} />
            <text x={lx(v)} y={H - B + 16} textAnchor="middle" fontSize={11} className="fill-muted">{fmtI(v)}</text>
          </g>
        ))}
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={L} x2={W - R} y1={ly(v)} y2={ly(v)} className="stroke-border" strokeWidth={1} />
            <text x={L - 6} y={ly(v) + 4} textAnchor="end" fontSize={11} className="fill-muted">{v}</text>
          </g>
        ))}
        <text x={(L + W - R) / 2} y={H - 6} textAnchor="middle" fontSize={11} className="fill-muted">Current at {refKv} kV (A)</text>
        <text x={14} y={(T + H - B) / 2} textAnchor="middle" fontSize={11} className="fill-muted" transform={`rotate(-90 14 ${(T + H - B) / 2})`}>Operating time (s)</text>

        {targetMs !== null && (
          <g>
            <line x1={L} x2={W - R} y1={ly(targetMs / 1000)} y2={ly(targetMs / 1000)} stroke="#34d399" strokeWidth={1.2} strokeDasharray="5 4" />
            <text x={W - R - 4} y={ly(targetMs / 1000) - 4} textAnchor="end" fontSize={10} fill="#34d399">time needed for the target ≈ {targetMs.toFixed(0)} ms (incl. breaker)</text>
          </g>
        )}

        {markers.map((m, i) => (
          <g key={m.label}>
            <line x1={lx(m.x)} x2={lx(m.x)} y1={T} y2={H - B} stroke={m.color} strokeWidth={1.4} strokeDasharray={m.dash} />
            <text x={lx(m.x) - 3} y={T + 12 + i * 12} textAnchor="end" fontSize={10} fill={m.color}>{m.label}</text>
          </g>
        ))}

        {damage.filter((c) => !hidden.has(c.relayId)).map((c) => (
          <path key={`d${c.relayId}`} d={dmgPath(c)} fill="none" stroke="#ef4444" strokeWidth={1.6} strokeDasharray="2 3" opacity={0.85} />
        ))}
        {after.map((r, i) =>
          !hidden.has(r.id) && r.bandTol && r.bandTol > 0 ? (
            <g key={`band${r.id}`}>
              <path d={path(r, 1 + r.bandTol)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={1} opacity={0.4} />
              <path d={path(r, 1 - r.bandTol)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={1} opacity={0.4} />
            </g>
          ) : null
        )}
        {before.map((r, i) => hidden.has(r.id) ? null : (
          <path key={`b${r.id}`} d={path(r)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.55} />
        ))}
        {after.map((r, i) => hidden.has(r.id) ? null : (
          <path key={`a${r.id}`} d={path(r)} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth={2.4} />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
        {after.map((r, i) => (
          <label key={r.id} className="inline-flex cursor-pointer items-center gap-1.5">
            <input type="checkbox" checked={!hidden.has(r.id)} onChange={() => toggle(r.id)} className="accent-cyan-400" />
            <span className="h-0.5 w-5" style={{ background: COLORS[i % COLORS.length] }} />
            {r.name}
          </label>
        ))}
        {damage.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dotted border-red-500" />asset withstand curve</span>}
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-muted" />before</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-muted" />proposed</span>
      </div>
    </div>
  );
}
