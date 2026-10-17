import type { BranchIn, BusIn, BusResult, ScNetwork, ScResult } from "@/lib/iec60909";

// Auto-populating single-line diagram for the IEC 60909 calculator. It is
// generated entirely from the network input + the analysis result: the
// user never draws anything. Layout is a tree (spanning tree of the bus /
// branch graph) with sources above each bus and motors below, and the
// short-circuit levels printed next to every bus.

const LEVEL_GAP = 215;
const TOP = 120;
const ELEM_GAP = 112;
const TEXT_W = 190;
const MIN_BAR = 130;
const PGAP = 170; // horizontal spacing between parallel branches

const linkXs = (cx: number, count: number) =>
  Array.from({ length: count }, (_, i) => cx + (i - (count - 1) / 2) * PGAP);

interface Node {
  bus: BusIn;
  res: BusResult | undefined;
  above: { kind: "Grid" | "Generator"; name: string; spec: string }[];
  below: { name: string; spec: string }[];
  children: { branch: BranchIn; node: Node; extras: BranchIn[] }[];
  depth: number;
  inParallel: number; // number of parallel branches arriving from the parent
  cx: number;
  barL: number;
  barR: number;
  y: number;
}

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const f = (x: number, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : "–");

function buildForest(net: ScNetwork, result: ScResult): Node[] {
  const resById = new Map(result.buses.map((r) => [r.busId, r]));
  const nodes = new Map<string, Node>();
  for (const bus of net.buses) {
    nodes.set(bus.id, {
      bus,
      res: resById.get(bus.id),
      above: [
        ...net.grids.filter((g) => g.busId === bus.id).map((g) => ({ kind: "Grid" as const, name: g.name, spec: `${f(g.skMva, 0)} MVA` })),
        ...net.gens.filter((g) => g.busId === bus.id).map((g) => ({ kind: "Generator" as const, name: g.name, spec: `${f(g.srMva, 2)} MVA` })),
      ],
      below: net.motors.filter((m) => m.busId === bus.id).map((m) => ({ name: m.name, spec: `${f(m.prKw, 0)} kW` })),
      children: [],
      depth: 0,
      inParallel: 1,
      cx: 0,
      barL: 0,
      barR: 0,
      y: 0,
    });
  }
  const adj = new Map<string, { branch: BranchIn; other: string }[]>();
  for (const b of net.branches) {
    if (!nodes.has(b.fromBus) || !nodes.has(b.toBus) || b.fromBus === b.toBus) continue;
    (adj.get(b.fromBus) ?? adj.set(b.fromBus, []).get(b.fromBus)!).push({ branch: b, other: b.toBus });
    (adj.get(b.toBus) ?? adj.set(b.toBus, []).get(b.toBus)!).push({ branch: b, other: b.fromBus });
  }
  const seen = new Set<string>();
  const roots: Node[] = [];
  // Roots: buses carrying a grid source first, highest voltage first, then anything left over.
  const order = [...net.buses].sort((a, b) => {
    const sa = nodes.get(a.id)!.above.some((s) => s.kind === "Grid") ? 1 : 0;
    const sb = nodes.get(b.id)!.above.some((s) => s.kind === "Grid") ? 1 : 0;
    return sb - sa || b.unKv - a.unKv;
  });
  for (const start of order) {
    if (seen.has(start.id)) continue;
    seen.add(start.id);
    const root = nodes.get(start.id)!;
    roots.push(root);
    const queue = [root];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const e of adj.get(cur.bus.id) ?? []) {
        if (seen.has(e.other)) continue;
        seen.add(e.other);
        const child = nodes.get(e.other)!;
        child.depth = cur.depth + 1;
        cur.children.push({ branch: e.branch, node: child, extras: [] });
        queue.push(child);
      }
      // Further branches between the same two buses (e.g. transformers in parallel)
      const used = new Set(cur.children.map((c) => c.branch.id));
      for (const e of adj.get(cur.bus.id) ?? []) {
        const link = cur.children.find((c) => c.node.bus.id === e.other);
        if (link && !used.has(e.branch.id) && !link.extras.some((x) => x.id === e.branch.id)) link.extras.push(e.branch);
      }
    }
  }
  return roots;
}

function layout(node: Node, left: number): number {
  for (const c of node.children) c.node.inParallel = 1 + c.extras.length;
  let cursor = left;
  for (const c of node.children) cursor += layout(c.node, cursor);
  const childSum = cursor - left;
  node.y = TOP + node.depth * LEVEL_GAP;
  const own = Math.max(MIN_BAR, ELEM_GAP * Math.max(node.above.length, node.below.length) + 30, PGAP * node.inParallel + 20);
  if (node.children.length) {
    const xs = node.children.flatMap((c) => linkXs(c.node.cx, 1 + c.extras.length));
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    node.cx = mid;
    node.barL = Math.max(left + 10, Math.min(Math.min(...xs) - 24, mid - own / 2));
    node.barR = Math.max(Math.max(...xs) + 24, node.barL + own);
  } else {
    node.barL = left + 10;
    node.barR = node.barL + own;
    node.cx = (node.barL + node.barR) / 2;
  }
  return Math.max(childSum, node.barR - left) + TEXT_W;
}

function flatten(node: Node, out: Node[] = []): Node[] {
  out.push(node);
  node.children.forEach((c) => flatten(c.node, out));
  return out;
}

function GridSymbol({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={14} className="fill-surface-2 stroke-accent-2" strokeWidth={2} />
      <path d={`M${x - 8} ${y} q4 -9 8 0 t8 0`} className="fill-none stroke-accent-2" strokeWidth={1.8} />
    </g>
  );
}
function LetterSymbol({ x, y, letter, cls }: { x: number; y: number; letter: string; cls: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={14} className={`fill-surface-2 ${cls}`} strokeWidth={2} />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontWeight={700} className="fill-foreground">
        {letter}
      </text>
    </g>
  );
}

function branchSpec(b: BranchIn): string {
  if (b.kind === "transformer") return `${f(b.srMva, 2)} MVA · ${f(b.ukPct, 1)} % · ${b.group}`;
  if (b.kind === "cable") return `${f(b.lengthKm * 1000, 0)} m${b.parallel > 1 ? ` × ${b.parallel}` : ""}`;
  return b.closed ? "closed" : "OPEN";
}

export default function ShortCircuitSld({ net, result }: { net: ScNetwork; result: ScResult }) {
  if (net.buses.length === 0) {
    return <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">Add a bus to start building the diagram.</div>;
  }
  const roots = buildForest(net, result);
  let cursor = 10;
  for (const r of roots) cursor += layout(r, cursor);
  const all = roots.flatMap((r) => flatten(r));
  const maxDepth = Math.max(...all.map((n) => n.depth));
  const width = Math.max(560, cursor);
  const height = TOP + maxDepth * LEVEL_GAP + 150;
  const maxIk = Math.max(...result.buses.map((b) => b.ik3), 1e-9);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: Math.min(width, 1000) }}
        className="h-auto w-full"
        role="img"
        aria-label="Auto-generated single-line diagram with short-circuit levels at every bus"
      >
        {/* Branch links first so buses draw over them */}
        {all.flatMap((p) =>
          p.children.flatMap(({ branch, node: c, extras }) => {
            const list = [branch, ...extras];
            const xs = linkXs(c.cx, list.length);
            return list.map((br, bi) => {
              const x = xs[bi];
              const y1 = p.y;
              const y2 = c.y;
              const mid = (y1 + y2) / 2;
              const open = br.kind === "tie" && !br.closed;
              return (
                <g key={`${p.bus.id}-${br.id}`}>
                  <line x1={x} y1={y1} x2={x} y2={mid - 18} className="stroke-accent-2" strokeWidth={2} strokeDasharray={open ? "4 3" : undefined} />
                  <line x1={x} y1={mid + 18} x2={x} y2={y2} className="stroke-accent-2" strokeWidth={2} strokeDasharray={open ? "4 3" : undefined} />
                  {br.kind === "transformer" ? (
                    <g className="fill-none stroke-accent" strokeWidth={2}>
                      <circle cx={x} cy={mid - 8} r={12} />
                      <circle cx={x} cy={mid + 8} r={12} />
                    </g>
                  ) : br.kind === "cable" ? (
                    <rect x={x - 8} y={mid - 16} width={16} height={32} rx={2} className="fill-surface-2 stroke-accent" strokeWidth={2} />
                  ) : (
                    <rect x={x - 9} y={mid - 9} width={18} height={18} className={open ? "fill-none stroke-fail" : "fill-accent stroke-accent"} strokeWidth={2} />
                  )}
                  <text x={x + 24} y={mid - 2} fontSize={12} className="fill-foreground">
                    {trunc(br.name, 18)}
                  </text>
                  <text x={x + 24} y={mid + 12} fontSize={11} className="fill-muted">
                    {trunc(branchSpec(br), 24)}
                  </text>
                </g>
              );
            });
          })
        )}

        {all.map((n) => {
          const r = n.res;
          const bad = r?.ratingOk === false;
          const frac = r && r.energised ? Math.min(1, r.ik3 / maxIk) : 0;
          const spread = (count: number) =>
            Array.from({ length: count }, (_, i) => {
              let x = n.barL + 40 + i * ELEM_GAP;
              if (n.depth > 0 && Math.abs(x - n.cx) < 30) x += 34;
              return Math.min(x, n.barR - 14);
            });
          const ux = spread(n.above.length);
          const dx = spread(n.below.length);
          return (
            <g key={n.bus.id}>
              {/* Sources above */}
              {n.above.map((s, i) => (
                <g key={`a${i}`}>
                  <line x1={ux[i]} y1={n.y - 3} x2={ux[i]} y2={n.y - 38} className="stroke-accent-2" strokeWidth={2} />
                  {s.kind === "Grid" ? <GridSymbol x={ux[i]} y={n.y - 52} /> : <LetterSymbol x={ux[i]} y={n.y - 52} letter="G" cls="stroke-accent" />}
                  <text x={ux[i]} y={n.y - 78} textAnchor="middle" fontSize={11} className="fill-foreground">
                    {trunc(s.name, 16)}
                  </text>
                  <text x={ux[i]} y={n.y - 67} textAnchor="middle" fontSize={10} className="fill-muted">
                    {s.spec}
                  </text>
                </g>
              ))}
              {/* Motors below */}
              {n.below.map((m, i) => (
                <g key={`m${i}`}>
                  <line x1={dx[i]} y1={n.y + 3} x2={dx[i]} y2={n.y + 32} className="stroke-accent-2" strokeWidth={2} />
                  <LetterSymbol x={dx[i]} y={n.y + 46} letter="M" cls="stroke-pass" />
                  <text x={dx[i]} y={n.y + 72} textAnchor="middle" fontSize={11} className="fill-foreground">
                    {trunc(m.name, 16)}
                  </text>
                  <text x={dx[i]} y={n.y + 83} textAnchor="middle" fontSize={10} className="fill-muted">
                    {m.spec}
                  </text>
                </g>
              ))}

              {/* Bus bar */}
              <rect
                x={n.barL}
                y={n.y - 4}
                width={n.barR - n.barL}
                height={8}
                rx={4}
                className={bad ? "fill-fail" : "fill-foreground"}
                opacity={r?.energised === false ? 0.35 : 0.95}
              />

              {/* Readout */}
              <text x={n.barR + 12} y={n.y - 16} fontSize={13} fontWeight={600} className="fill-foreground">
                {trunc(n.bus.name, 22)} · {f(n.bus.unKv, n.bus.unKv < 1 ? 2 : 1)} kV
              </text>
              {r && r.energised ? (
                <g>
                  <text x={n.barR + 12} y={n.y} fontSize={12} className={bad ? "fill-fail" : "fill-accent-2"} fontWeight={600}>
                    Ik″ = {f(r.ik3, 2)} kA
                  </text>
                  <text x={n.barR + 12} y={n.y + 14} fontSize={11} className="fill-muted">
                    ip = {f(r.ip, 1)} kA · Ib = {f(r.ib, 1)} kA
                  </text>
                  <text x={n.barR + 12} y={n.y + 27} fontSize={11} className="fill-muted">
                    Ik1 = {r.ikLG === null ? "n/a" : f(r.ikLG, 1)} kA
                    {n.bus.ratingKa > 0 ? ` · rated ${f(n.bus.ratingKa, 0)} kA ${r.ratingOk ? "✓" : "✗"}` : ""}
                  </text>
                  <rect x={n.barR + 12} y={n.y + 33} width={TEXT_W - 30} height={5} rx={2.5} className="fill-surface-2" />
                  <rect x={n.barR + 12} y={n.y + 33} width={Math.max(3, (TEXT_W - 30) * frac)} height={5} rx={2.5} className={bad ? "fill-fail" : "fill-accent-2"} />
                </g>
              ) : (
                <text x={n.barR + 12} y={n.y} fontSize={12} className="fill-muted">
                  not energised (no source)
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
