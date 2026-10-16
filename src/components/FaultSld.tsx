import type { FaultPropagationPoint } from "@/lib/faultpropagation";

// Read-only single-line diagram (SLD) of a radial chain, drawn from the
// results of calcFaultPropagation. Purely a visualisation: it never feeds
// back into the calculation. points[0] is the incoming/source bus and
// points[i] (i >= 1) is the bus downstream of element i.

const ROW = 120;
const TOP = 70;
const BUS_X = 90;
const BUS_W = 130;
const BAR_X = 250;
const BAR_W = 270;

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function isTransformer(label: string): boolean {
  return /transformer|xfmr|trafo|\btx\b|\bt\d/i.test(label);
}

export default function FaultSld({ points }: { points: FaultPropagationPoint[] }) {
  if (points.length === 0) return null;

  const maxKa = Math.max(...points.map((p) => p.faultCurrentKa), 1e-9);
  const height = TOP + (points.length - 1) * ROW + 70;
  const busY = (i: number) => TOP + i * ROW;

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">Network diagram</h3>
        <span className="text-xs text-muted">Visualisation only · not to scale</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Source at the top, load at the bottom. The bar beside each bus shows its available fault current
        relative to the source.
      </p>

      <svg
        viewBox={`0 0 560 ${height}`}
        className="mt-4 h-auto w-full"
        role="img"
        aria-label="Single-line diagram of the fault current propagation chain"
      >
        {/* Utility source symbol */}
        <circle cx={BUS_X + BUS_W / 2} cy={26} r={16} className="fill-surface-2 stroke-accent-2" strokeWidth={2} />
        <path
          d={`M${BUS_X + BUS_W / 2 - 9} 26 q4.5 -10 9 0 t9 0`}
          className="fill-none stroke-accent-2"
          strokeWidth={1.8}
        />
        <text x={BUS_X + BUS_W / 2 + 26} y={30} className="fill-muted" fontSize={12}>
          Utility source
        </text>
        <line
          x1={BUS_X + BUS_W / 2}
          y1={42}
          x2={BUS_X + BUS_W / 2}
          y2={busY(0)}
          className="stroke-accent-2"
          strokeWidth={2}
        />

        {points.map((p, i) => {
          const y = busY(i);
          const cx = BUS_X + BUS_W / 2;
          const frac = Math.min(1, p.faultCurrentKa / maxKa);
          const prev = i > 0 ? points[i - 1] : null;
          const deltaZ = prev ? p.cumulativePctZ - prev.cumulativePctZ : 0;
          const trafo = prev ? isTransformer(p.label) : false;
          const midY = prev ? y - ROW / 2 : 0;

          return (
            <g key={i}>
              {/* Connector + series element from the previous bus */}
              {prev && (
                <g>
                  <line x1={cx} y1={busY(i - 1)} x2={cx} y2={midY - 16} className="stroke-accent-2" strokeWidth={2} />
                  <line x1={cx} y1={midY + 16} x2={cx} y2={y} className="stroke-accent-2" strokeWidth={2} />
                  {trafo ? (
                    <g className="fill-none stroke-accent" strokeWidth={2}>
                      <circle cx={cx} cy={midY - 7} r={11} />
                      <circle cx={cx} cy={midY + 7} r={11} />
                    </g>
                  ) : (
                    <rect
                      x={cx - 8}
                      y={midY - 15}
                      width={16}
                      height={30}
                      rx={2}
                      className="fill-surface-2 stroke-accent"
                      strokeWidth={2}
                    />
                  )}
                  <text x={cx + 28} y={midY - 2} className="fill-foreground" fontSize={12}>
                    {truncate(p.label, 34)}
                  </text>
                  <text x={cx + 28} y={midY + 14} className="fill-muted" fontSize={11}>
                    +{deltaZ.toFixed(2)}% Z at base
                  </text>
                </g>
              )}

              {/* Bus bar */}
              <rect
                x={BUS_X}
                y={y - 3}
                width={BUS_W}
                height={6}
                rx={3}
                className="fill-foreground"
                opacity={0.9}
              />

              {/* Readout */}
              <text x={BAR_X} y={y - 14} className="fill-foreground" fontSize={13} fontWeight={600}>
                {i === 0 ? "Incoming bus" : `Bus ${i}`} — {p.faultCurrentKa.toFixed(2)} kA
              </text>
              <text x={BAR_X} y={y + 2} className="fill-muted" fontSize={11}>
                {p.faultMva.toFixed(1)} MVA · cumulative {p.cumulativePctZ.toFixed(2)}% Z
              </text>
              <rect x={BAR_X} y={y + 10} width={BAR_W} height={7} rx={3.5} className="fill-surface-2" />
              <rect
                x={BAR_X}
                y={y + 10}
                width={Math.max(4, BAR_W * frac)}
                height={7}
                rx={3.5}
                className="fill-accent-2"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
