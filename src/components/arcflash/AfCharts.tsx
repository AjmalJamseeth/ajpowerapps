import type { ArcFlashBusResult } from "@/lib/arcflashstudy";

// SVG graphics for the arc-flash study: boundary plan view, incident energy
// against working distance, incident energy against clearing time, and a
// bar ranking of every bus.

const PPE_LINES = [
  { y: 1.2, label: "1.2 (boundary)", color: "#34d399" },
  { y: 4, label: "4 (Cat 1)", color: "#a3e635" },
  { y: 8, label: "8 (Cat 2)", color: "#fbbf24" },
  { y: 25, label: "25 (Cat 3)", color: "#fb923c" },
  { y: 40, label: "40 (Cat 4)", color: "#f87171" },
];

const fmt = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "–");

// --------------------------------------------------------------------------
// Boundary plan view
// --------------------------------------------------------------------------
export function BoundaryDiagram({ r }: { r: ArcFlashBusResult }) {
  const afb = r.afbMm;
  const limitedMm = (r.shock.limitedFixedM ?? 0) * 1000;
  const restrictedMm = (r.shock.restrictedM ?? 0) * 1000;
  const maxMm = Math.max(afb, limitedMm, r.workingMm, 1);
  const R = 120;
  const s = (mm: number) => (mm / maxMm) * R;
  const cx = 200;
  const cy = 140;
  const rings = [
    { mm: limitedMm, label: `Limited approach ${fmt(limitedMm / 1000, 2)} m`, color: "#22d3ee", dash: "6 4" },
    { mm: afb, label: `Arc-flash boundary ${fmt(afb / 1000, 2)} m`, color: "#f87171", dash: "" },
    { mm: restrictedMm, label: `Restricted approach ${fmt(restrictedMm / 1000, 2)} m`, color: "#a78bfa", dash: "3 3" },
  ].filter((x) => x.mm > 0);
  rings.sort((a, b) => b.mm - a.mm);

  return (
    <svg viewBox="0 0 400 350" className="h-auto w-full max-w-md" role="img" aria-label="Arc-flash boundary plan view">
      <rect x={0} y={0} width={400} height={350} rx={12} className="fill-surface-2" opacity={0.4} />
      {rings.map((g, i) => (
        <g key={g.label}>
          <circle cx={cx} cy={cy} r={s(g.mm)} fill={g.color} opacity={0.07 + 0.03 * (rings.length - i)} />
          <circle cx={cx} cy={cy} r={s(g.mm)} fill="none" stroke={g.color} strokeWidth={2} strokeDasharray={g.dash || undefined} />
        </g>
      ))}
      <rect x={cx - 32} y={cy - 20} width={64} height={40} rx={4} className="fill-surface stroke-foreground" strokeWidth={2} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={11} fontWeight={600} className="fill-foreground">
        {r.name.length > 10 ? r.name.slice(0, 9) + "…" : r.name}
      </text>
      {/* working distance marker */}
      <circle cx={cx} cy={cy} r={s(r.workingMm)} fill="none" stroke="#fbbf24" strokeWidth={1.5} strokeDasharray="2 4" />
      <g transform={`translate(${cx + s(r.workingMm)}, ${cy})`}>
        <circle r={7} fill="#fbbf24" />
        <text y={4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#020617">
          W
        </text>
      </g>
      {/* legend */}
      <g fontSize={11}>
        {[...rings, { mm: r.workingMm, label: `Working distance ${fmt(r.workingMm / 1000, 2)} m`, color: "#fbbf24", dash: "2 4" }].map((g, i) => (
          <g key={g.label} transform={`translate(12, ${288 + i * 16})`}>
            <line x1={0} y1={-3} x2={22} y2={-3} stroke={g.color} strokeWidth={2.5} strokeDasharray={g.dash || undefined} />
            <text x={28} y={0} className="fill-foreground">
              {g.label}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

// --------------------------------------------------------------------------
// Generic line chart
// --------------------------------------------------------------------------
interface LineChartProps {
  xs: number[];
  ys: number[];
  xLabel: string;
  yLabel: string;
  yMax?: number;
  markers?: { x: number; y: number; label: string }[];
  logX?: boolean;
}

function LineChart({ xs, ys, xLabel, yLabel, markers = [], logX = false, yMax }: LineChartProps) {
  const W = 520;
  const H = 300;
  const m = { l: 56, r: 74, t: 14, b: 44 };
  const pw = W - m.l - m.r;
  const ph = H - m.t - m.b;
  const finite = ys.filter((y) => Number.isFinite(y) && y > 0);
  const yTop = yMax ?? Math.max(60, ...finite) * 1.15;
  const yBot = Math.min(0.5, ...finite) * 0.8;
  const lx = (x: number) => (logX ? Math.log10(x) : x);
  const x0 = lx(xs[0]);
  const x1 = lx(xs[xs.length - 1]);
  const px = (x: number) => m.l + ((lx(x) - x0) / (x1 - x0)) * pw;
  const py = (y: number) => m.t + ph - ((Math.log10(Math.max(y, yBot)) - Math.log10(yBot)) / (Math.log10(yTop) - Math.log10(yBot))) * ph;
  const path = xs.map((x, i) => `${i ? "L" : "M"}${px(x).toFixed(1)} ${py(ys[i]).toFixed(1)}`).join(" ");
  const xTicks = (() => {
    const n = 5;
    return Array.from({ length: n + 1 }, (_, i) => xs[0] + ((xs[xs.length - 1] - xs[0]) * i) / n);
  })();
  const yTicks = [0.5, 1, 2, 5, 10, 20, 50, 100, 200].filter((v) => v >= yBot && v <= yTop);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${yLabel} against ${xLabel}`}>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={m.l} x2={m.l + pw} y1={py(v)} y2={py(v)} className="stroke-border" strokeWidth={0.7} />
          <text x={m.l - 6} y={py(v) + 3} textAnchor="end" fontSize={10} className="fill-muted">
            {v}
          </text>
        </g>
      ))}
      {xTicks.map((v) => (
        <g key={v}>
          <line x1={px(v)} x2={px(v)} y1={m.t} y2={m.t + ph} className="stroke-border" strokeWidth={0.5} opacity={0.6} />
          <text x={px(v)} y={m.t + ph + 14} textAnchor="middle" fontSize={10} className="fill-muted">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {PPE_LINES.filter((l) => l.y >= yBot && l.y <= yTop).map((l) => (
        <g key={l.y}>
          <line x1={m.l} x2={m.l + pw} y1={py(l.y)} y2={py(l.y)} stroke={l.color} strokeWidth={1} strokeDasharray="5 4" />
          <text x={m.l + pw + 4} y={py(l.y) + 3} fontSize={9} fill={l.color}>
            {l.label}
          </text>
        </g>
      ))}
      <path d={path} fill="none" className="stroke-accent-2" strokeWidth={2.4} />
      {markers.map((mk) => (
        <g key={mk.label}>
          <circle cx={px(mk.x)} cy={py(mk.y)} r={5} className="fill-accent stroke-background" strokeWidth={1.5} />
          <text x={px(mk.x) + 8} y={py(mk.y) - 7} fontSize={10} fontWeight={600} className="fill-accent">
            {mk.label}
          </text>
        </g>
      ))}
      <text x={m.l + pw / 2} y={H - 6} textAnchor="middle" fontSize={11} className="fill-foreground">
        {xLabel}
      </text>
      <text x={14} y={m.t + ph / 2} textAnchor="middle" fontSize={11} className="fill-foreground" transform={`rotate(-90 14 ${m.t + ph / 2})`}>
        {yLabel}
      </text>
    </svg>
  );
}

export function EnergyVsDistanceChart({ r }: { r: ArcFlashBusResult }) {
  if (!r.energyFn) return <p className="text-sm text-muted">Not available for this bus.</p>;
  const lo = 305;
  const hi = Math.max(2000, r.workingMm * 2.2, r.afbMm * 1.1);
  const xs = Array.from({ length: 36 }, (_, i) => lo + ((hi - lo) * i) / 35);
  const ys = xs.map((d) => r.energyFn!({ dMm: d }));
  return (
    <LineChart
      xs={xs}
      ys={ys}
      xLabel="Working distance (mm)"
      yLabel="Incident energy (cal/cm²)"
      markers={[{ x: r.workingMm, y: r.eCal, label: `${fmt(r.eCal, 1)} at ${fmt(r.workingMm, 0)} mm` }]}
    />
  );
}

export function EnergyVsTimeChart({ r }: { r: ArcFlashBusResult }) {
  if (!r.energyFn || !r.governing) return <p className="text-sm text-muted">Not available for this bus.</p>;
  const hi = Math.max(1000, (r.governing.tMs + r.governing.tMinMs) * 1.5);
  const xs = Array.from({ length: 30 }, (_, i) => 20 + ((hi - 20) * i) / 29);
  const ys = xs.map((t) => r.energyFn!({ tMs: t }));
  return (
    <LineChart
      xs={xs}
      ys={ys}
      xLabel="Total arc clearing time (ms)"
      yLabel="Incident energy (cal/cm²)"
      markers={[{ x: Math.max(20, r.governing.tMs), y: r.eCal, label: `now: ${fmt(r.eCal, 1)} @ ${fmt(r.governing.tMs, 0)} ms` }]}
    />
  );
}

// --------------------------------------------------------------------------
// Ranking bar chart
// --------------------------------------------------------------------------
export function RankingChart({ rows }: { rows: ArcFlashBusResult[] }) {
  const list = rows.filter((r) => r.model !== "none");
  const max = Math.max(45, ...list.map((r) => r.eCal));
  return (
    <div className="space-y-2">
      {list
        .slice()
        .sort((a, b) => b.eCal - a.eCal)
        .map((r) => (
          <div key={r.busId} className="grid grid-cols-[150px_1fr_90px] items-center gap-2 text-xs">
            <span className="truncate text-foreground">{r.name}</span>
            <div className="relative h-4 overflow-hidden rounded bg-surface-2">
              {[8, 25, 40].map((v) => (
                <span key={v} className="absolute top-0 h-full w-px bg-muted/40" style={{ left: `${(v / max) * 100}%` }} />
              ))}
              <div className="h-full rounded" style={{ width: `${Math.max(1.5, (r.eCal / max) * 100)}%`, background: r.ppe.color }} />
            </div>
            <span className="text-right tabular-nums text-muted">{fmt(r.eCal, 1)} cal/cm²</span>
          </div>
        ))}
      <p className="pt-1 text-[11px] text-muted">Vertical lines mark 8, 25 and 40 cal/cm² (PPE Category 2, 3 and 4 limits).</p>
    </div>
  );
}
