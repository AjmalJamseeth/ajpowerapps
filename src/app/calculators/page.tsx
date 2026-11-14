import Link from "next/link";
import { categoryHref } from "@/lib/categories";
import NavBar from "@/components/NavBar";
import SiteSearch from "@/components/SiteSearch";
import { buildSearchIndex } from "@/lib/searchIndex";
import { GROUP_ICONS } from "@/components/groupIcons";
import { DOMAIN_LIST, groupsOf, liveCount } from "@/lib/domains";
import { CALCULATOR_GROUPS, ROADMAP_ITEMS, TOTAL_LIVE_COUNT, type CalcCard } from "@/lib/calculatorCatalog";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/calculators", `Electrical & SCADA Engineering Calculators (${TOTAL_LIVE_COUNT} Tools)`, "Standards-based electrical engineering calculators: IDMT relay coordination, arc flash, short circuit, cable sizing, earthing, transformers, motors, VFDs and more.");


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
          {TOTAL_LIVE_COUNT} tools in two sections — <Link href="/electrical" className="text-accent hover:underline">Electrical Power Engineering</Link> and{" "}
          <Link href="/scada" className="text-accent-2 hover:underline">SCADA, IEC 61850 &amp; Automation</Link> — organized into {CALCULATOR_GROUPS.length} categories.
        </p>
        <div className="mt-6">
          <SiteSearch items={buildSearchIndex()} />
        </div>

        <div className="sticky top-16 z-10 -mx-6 mt-8 border-b border-border bg-background/95 px-6 py-3 backdrop-blur">
          {DOMAIN_LIST.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-2 py-0.5">
              <a href={`#${d.id}`} className={`mr-1 text-xs font-semibold uppercase tracking-wide ${d.id === "electrical" ? "text-accent" : "text-accent-2"}`}>{d.short}</a>
              {groupsOf(d.id).map((g) => (
                <a key={g.id} href={`#${g.id}`} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent-2/60 hover:text-accent-2">{g.title}</a>
              ))}
            </div>
          ))}
        </div>

        {DOMAIN_LIST.map((d) => (
          <div key={d.id} id={d.id} className="mt-14 scroll-mt-32">
            <div className={`border-b pb-3 ${d.id === "electrical" ? "border-accent/40" : "border-accent-2/40"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${d.id === "electrical" ? "text-accent" : "text-accent-2"}`}>{d.kicker}</div>
              <h2 className="mt-1 text-2xl font-semibold text-foreground"><Link href={d.href} className="hover:underline">{d.title}</Link> <span className="text-sm font-normal text-muted">· {liveCount(d.id)} tools</span></h2>
            </div>
            <div className="mt-10 space-y-16">
          {groupsOf(d.id).map((g) => {
            const Icon = GROUP_ICONS[g.icon];
            return (
              <section key={g.id} id={g.id} className="scroll-mt-32">
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="h-5 w-5 text-accent-2" aria-hidden="true" />}
                  <h2 className="text-xl font-semibold text-foreground">
                    <Link href={categoryHref(g.id)} className="hover:text-accent-2">
                      {g.title}
                    </Link>
                  </h2>
                </div>
                <p className="mt-1.5 max-w-2xl text-sm text-muted">
                  {g.description}{" "}
                  <Link href={categoryHref(g.id)} className="whitespace-nowrap text-accent-2 hover:underline">
                    {g.title} page →
                  </Link>
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {g.calculators.map((c) => (
                    <CalcTile key={c.name} c={c} />
                  ))}
                </div>
              </section>
            );
          })}
            </div>
          </div>
        ))}

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
