import Link from "next/link";
import NavBar from "@/components/NavBar";
import SiteSearch from "@/components/SiteSearch";
import { buildSearchIndex } from "@/lib/searchIndex";
import { categoryHref } from "@/lib/categories";
import { DOMAINS, groupsOf, suitesOf, liveCount, domainOfGroup, domainOfHref, type DomainId } from "@/lib/domains";
import { GUIDES } from "@/lib/guides";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { SAMPLE_FILES } from "@/lib/samples";
import { GROUP_ICONS } from "@/components/groupIcons";

export function DomainHub({ id }: { id: DomainId }) {
  const d = DOMAINS[id], other = DOMAINS[id === "electrical" ? "scada" : "electrical"];
  const groups = groupsOf(id), suites = suitesOf(id);
  const guides = GUIDES.filter((g) => domainOfGroup(g.groupId) === id);
  const samples = SAMPLE_FILES.filter((f) => f.openIn.some((o) => domainOfHref(o.href) === id));
  const search = buildSearchIndex().filter((s) => s.kind !== "Calculator" || domainOfHref(s.href) === id);
  const tone = id === "electrical" ? { text: "text-accent", border: "border-accent/40", bg: "bg-accent/10", hover: "hover:border-accent/60" } : { text: "text-accent-2", border: "border-accent-2/40", bg: "bg-accent-2/10", hover: "hover:border-accent-2/60" };
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <section className="hero-band relative overflow-hidden border-b border-border">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className={`hero-orb -left-24 top-0 h-80 w-80 ${id === "electrical" ? "bg-accent/25" : "bg-accent-2/25"}`} />
        <div className="relative mx-auto max-w-6xl px-6 py-16 sm:py-20">
          <span className={`inline-flex items-center rounded-full border ${tone.border} ${tone.bg} px-3 py-1 text-xs font-medium tracking-wide ${tone.text}`}>{d.kicker}</span>
          <h1 className="hero-title mt-5 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{d.title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{d.tagline}</p>
          <p className="mt-3 max-w-3xl text-sm text-muted">{d.intro}</p>
          <div className="mt-7 max-w-2xl"><SiteSearch items={search} /></div>
          <div className="mt-6 grid max-w-2xl grid-cols-3 gap-3">
            {[["Tools", String(liveCount(id))], ["Categories", String(groups.length)], ["Suites", String(suites.length)]].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-border bg-surface/60 p-3"><div className="text-xs text-muted">{l}</div><div className="mt-1 text-lg font-semibold text-foreground">{v}</div></div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">Looking for {other.title.toLowerCase()}? <Link href={other.href} className={`font-semibold ${id === "electrical" ? "text-accent-2" : "text-accent"} hover:underline`}>Go to the {other.short} section →</Link></p>
        </div>
      </section>

      {suites.length > 0 && (
        <section className="band-white border-b border-border">
          <div className="mx-auto max-w-6xl px-6 py-12">
            <div className="kicker">Full applications</div>
            <h2 className="mt-1 text-2xl font-semibold text-foreground">{d.short} engineering suites</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suites.map((s) => (
                <Link key={s.href} href={s.href} className={`rounded-xl border border-border bg-surface p-5 transition-colors ${tone.hover}`}>
                  <div className="font-semibold text-foreground">{s.name}</div>
                  <p className="mt-2 text-sm text-muted">{s.tagline}</p>
                  <span className={`mt-3 inline-block text-sm font-semibold ${tone.text}`}>Open →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <h2 className="text-2xl font-semibold text-foreground">{d.short} categories</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {groups.map((g) => {
            const Icon = GROUP_ICONS[g.icon];
            const live = g.calculators.filter((c) => c.status === "live");
            return (
              <div key={g.id} className="flex flex-col rounded-xl border border-border bg-surface p-6">
                <Link href={categoryHref(g.id)} className="flex items-center gap-2.5 hover:opacity-90">
                  {Icon && <Icon className={`h-5 w-5 ${tone.text}`} aria-hidden="true" />}
                  <h3 className="text-base font-semibold text-foreground">{g.title}</h3>
                </Link>
                <p className="mt-2 text-sm text-muted">{g.description}</p>
                <ul className="mt-3 space-y-1 text-sm">
                  {live.slice(0, 7).map((c) => <li key={c.href}><Link href={c.href} className="text-foreground hover:underline">{c.name}</Link></li>)}
                </ul>
                <Link href={categoryHref(g.id)} className={`mt-4 text-sm font-semibold ${tone.text} hover:underline`}>All {live.length} tools in {g.title} →</Link>
              </div>
            );
          })}
        </div>
      </section>

      {d.cross.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-6 pb-12">
          <h2 className="text-lg font-semibold text-foreground">Often needed from the {other.short} section</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            {d.cross.map((h) => { const c = CALCULATOR_GROUPS.flatMap((g) => g.calculators).find((x) => x.href === h); return c ? <Link key={h} href={h} className={`rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:underline`}><span className={id === "electrical" ? "text-accent-2" : "text-accent"}>●</span> {c.name}</Link> : null; })}
          </div>
        </section>
      )}

      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Guides</h2>
            <ul className="mt-4 space-y-3">{guides.map((g) => <li key={g.slug}><Link href={`/guides/${g.slug}`} className="font-medium text-foreground hover:underline">{g.title}</Link><p className="text-sm text-muted">{g.dek}</p></li>)}</ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Sample files</h2>
            {samples.length ? <ul className="mt-4 space-y-2 text-sm">{samples.slice(0, 14).map((f) => <li key={f.file}><a href={`/samples/${f.file}`} download className={`font-mono ${tone.text} hover:underline`}>{f.file}</a> <span className="text-muted">— {f.title}</span></li>)}</ul> : <p className="mt-4 text-sm text-muted">Each calculator includes a worked example.</p>}
            <Link href="/samples" className={`mt-4 inline-block text-sm font-semibold ${tone.text} hover:underline`}>All sample files and what to expect →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
