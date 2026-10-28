import Link from "next/link";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { CALC_ARTICLES } from "@/lib/calcArticles";
import { GUIDES } from "@/lib/guides";
import { getExamplesForCalculator } from "@/lib/workedExamples";

// Server-rendered content under every calculator: a short written guide with a
// reference table and FAQs (for the most-searched calculators), plus links to
// related calculators, the category guide and the worked examples. This gives
// each page real indexable text and strong internal links.
export function CalcPageExtras({ href }: { href: string }) {
  const group = CALCULATOR_GROUPS.find((g) => g.calculators.some((c) => c.href === href));
  const article = CALC_ARTICLES[href];
  const related = group ? group.calculators.filter((c) => c.href !== href && c.status === "live").slice(0, 8) : [];
  const guide = group ? GUIDES.find((g) => g.groupId === group.id) : undefined;
  const examples = getExamplesForCalculator(href);

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16 text-sm leading-relaxed text-muted">
      {article && (
        <article className="rounded-xl border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">{article.heading}</h2>
          {article.paragraphs.map((p, i) => (
            <p key={i} className="mt-3">
              {p}
            </p>
          ))}
          {article.formula && (
            <div className="mt-5">
              <h3 className="text-base font-semibold text-foreground">Formulas</h3>
              <dl className="mt-2 space-y-1.5">
                {article.formula.map((f) => (
                  <div key={f.label} className="flex flex-wrap gap-x-2">
                    <dt className="font-medium text-foreground">{f.label}:</dt>
                    <dd className="font-mono text-[13px]">{f.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          {article.table && (
            <div className="mt-5">
              <h3 className="text-base font-semibold text-foreground">{article.table.caption}</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[420px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr>
                      {article.table.headers.map((h) => (
                        <th key={h} className="border-b border-border px-3 py-2 font-semibold text-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {article.table.rows.map((r, i) => (
                      <tr key={i} className="odd:bg-surface-2/40">
                        {r.map((c, j) => (
                          <td key={j} className="border-b border-border/60 px-3 py-1.5">
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {article.table.note && <p className="mt-2 text-xs">{article.table.note}</p>}
            </div>
          )}
          {article.faqs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-base font-semibold text-foreground">Frequently asked questions</h3>
              {article.faqs.map((f) => (
                <div key={f.q} className="mt-3">
                  <h4 className="font-medium text-foreground">{f.q}</h4>
                  <p className="mt-1">{f.a}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      {(related.length > 0 || guide || examples.length > 0) && (
        <nav aria-label="Related pages" className="mt-6 grid gap-6 rounded-xl border border-border bg-surface p-6 md:grid-cols-2">
          {related.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground">Related calculators{group ? ` — ${group.title}` : ""}</h2>
              <ul className="mt-2 space-y-1.5">
                {related.map((c) => (
                  <li key={c.href}>
                    <Link href={c.href} className="text-accent-2 hover:underline">
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(guide || examples.length > 0) && (
            <div>
              <h2 className="text-base font-semibold text-foreground">Learn more</h2>
              <ul className="mt-2 space-y-1.5">
                {examples.map((e) => (
                  <li key={e.slug}>
                    <Link href={`/examples/${e.slug}`} className="text-accent-2 hover:underline">
                      {e.title.replace(/^Worked Example:\s*/i, "Worked example: ")}
                    </Link>
                  </li>
                ))}
                {guide && (
                  <li>
                    <Link href={`/guides/${guide.slug}`} className="text-accent-2 hover:underline">
                      Guide: {guide.title}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}
        </nav>
      )}
    </section>
  );
}
