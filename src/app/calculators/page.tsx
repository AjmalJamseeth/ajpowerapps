import Link from "next/link";
import NavBar from "@/components/NavBar";
import {
  ShieldCheck,
  Cable,
  Zap,
  Waypoints,
  Activity,
  CircleGauge,
  BatteryCharging,
  Gauge,
  Sun,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { CALCULATOR_GROUPS, ROADMAP_ITEMS, TOTAL_LIVE_COUNT, type CalcCard } from "@/lib/calculatorCatalog";

const GROUP_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Cable,
  Zap,
  Waypoints,
  Activity,
  CircleGauge,
  BatteryCharging,
  Gauge,
  Sun,
  Building2,
};

function CalcTile({ c }: { c: CalcCard }) {
  return (
    <div className="group relative flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40">
      {c.status === "soon" && (
        <span className="absolute right-4 top-4 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          Coming soon
        </span>
      )}
      {c.status === "live" && (
        <span className="absolute right-4 top-4 rounded-full bg-pass/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-pass">
          Live
        </span>
      )}
      <h3 className="pr-16 text-lg font-semibold text-foreground">{c.name}</h3>
      <p className="mt-2 flex-1 text-sm text-muted">{c.description}</p>
      {c.status === "live" ? (
        <Link href={c.href} className="mt-6 inline-flex items-center text-sm font-semibold text-accent-2 hover:opacity-80">
          Open calculator →
        </Link>
      ) : (
        <span className="mt-6 inline-flex items-center text-sm font-semibold text-muted/60">Notify me →</span>
      )}
    </div>
  );
}

export default function CalculatorsIndex() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Calculators</h1>
        <p className="mt-2 max-w-2xl text-muted">
          {TOTAL_LIVE_COUNT} standards-based electrical engineering tools,
          organized into {CALCULATOR_GROUPS.length} categories. Jump to a
          category or scroll through all of them below.
        </p>

        <div className="sticky top-16 z-10 -mx-6 mt-8 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
          <div className="flex flex-wrap gap-2">
            {CALCULATOR_GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent-2/60 hover:text-accent-2"
              >
                {g.title}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 space-y-16">
          {CALCULATOR_GROUPS.map((g) => {
            const Icon = GROUP_ICONS[g.icon];
            return (
              <section key={g.id} id={g.id} className="scroll-mt-32">
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="h-5 w-5 text-accent-2" aria-hidden="true" />}
                  <h2 className="text-xl font-semibold text-foreground">{g.title}</h2>
                </div>
                <p className="mt-1.5 max-w-2xl text-sm text-muted">{g.description}</p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.calculators.map((c) => (
                    <CalcTile key={c.name} c={c} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-16 rounded-xl border border-dashed border-border bg-surface/40 p-6">
          <h2 className="text-base font-semibold text-foreground">Roadmap — not built yet</h2>
          <p className="mt-1.5 text-sm text-muted">
            Items under active consideration for future batches. Not live,
            not linked — listed here for visibility only.
          </p>
          <ul className="mt-4 grid gap-x-8 gap-y-1.5 text-sm text-muted sm:grid-cols-2">
            {ROADMAP_ITEMS.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-muted/50">–</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
