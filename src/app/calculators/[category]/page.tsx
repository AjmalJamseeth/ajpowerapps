import Link from "next/link";
import { notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import { DOMAINS, domainOfGroup } from "@/lib/domains";
import { JsonLd } from "@/components/JsonLd";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { CATEGORY_PAGES, categoryHref, groupIdForSlug } from "@/lib/categories";
import { GUIDES } from "@/lib/guides";
import { WORKED_EXAMPLES } from "@/lib/workedExamples";
import { SITE_URL, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

// Only the category slugs exist here; every calculator has its own static folder.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(CATEGORY_PAGES).map((c) => ({ category: c.slug }));
}

function load(slug: string) {
  const id = groupIdForSlug(slug);
  const group = id ? CALCULATOR_GROUPS.find((g) => g.id === id) : undefined;
  if (!id || !group) return null;
  return { id, group, page: CATEGORY_PAGES[id] };
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const d = load(category);
  if (!d) return {};
  return pageMeta(categoryHref(d.id), d.page.title, d.group.description);
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const d = load(category);
  if (!d) notFound();
  const { id, group, page } = d;
  const calcs = group.calculators.filter((c) => c.status === "live");
  const guide = GUIDES.find((g) => g.groupId === id);
  const examples = WORKED_EXAMPLES.filter((e) => e.groupId === id);
  const url = `${SITE_URL}${categoryHref(id)}`;
  const others = CALCULATOR_GROUPS.filter((g) => g.id !== id);

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: page.title,
            description: group.description,
            url,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: calcs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${SITE_URL}${c.href}` })),
            },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: DOMAINS[domainOfGroup(id)].title, path: DOMAINS[domainOfGroup(id)].href },
            { name: group.title, path: categoryHref(id) },
          ]),
        ]}
      />
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="text-xs text-muted">
          <Link href="/" className="hover:text-accent-2">Home</Link> ›{" "}
          <Link href={DOMAINS[domainOfGroup(id)].href} className={domainOfGroup(id) === "electrical" ? "text-accent hover:underline" : "text-accent-2 hover:underline"}>{DOMAINS[domainOfGroup(id)].title}</Link> › <span className="text-foreground">{group.title}</span>
        </nav>
        <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">{page.title}</h1>
        {page.intro.map((p, i) => (
          <p key={i} className="mt-3 max-w-3xl text-muted">
            {p}
          </p>
        ))}

        <h2 className="mt-10 text-xl font-semibold text-foreground">
          {calcs.length} {calcs.length === 1 ? "tool" : "calculators"} in {group.title}
        </h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {calcs.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-2/60"
            >
              <h3 className="font-semibold text-foreground group-hover:text-accent-2">{c.name}</h3>
              <p className="mt-2 text-sm text-muted">{c.description}</p>
            </Link>
          ))}
        </div>

        {(guide || examples.length > 0) && (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {guide && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-base font-semibold text-foreground">Category guide</h2>
                <Link href={`/guides/${guide.slug}`} className="mt-2 block font-medium text-accent-2 hover:underline">
                  {guide.title}
                </Link>
                <p className="mt-1 text-sm text-muted">{guide.dek}</p>
              </div>
            )}
            {examples.length > 0 && (
              <div className="rounded-xl border border-border bg-surface p-5">
                <h2 className="text-base font-semibold text-foreground">Worked examples</h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {examples.map((e) => (
                    <li key={e.slug}>
                      <Link href={`/examples/${e.slug}`} className="text-accent-2 hover:underline">
                        {e.title.replace(/^Worked Example:\s*/i, "")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <nav aria-label="Other categories" className="mt-12">
          <h2 className="text-base font-semibold text-foreground">Other categories</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((g) => (
              <li key={g.id}>
                <Link
                  href={categoryHref(g.id)}
                  className="inline-block rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent-2/60 hover:text-accent-2"
                >
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
