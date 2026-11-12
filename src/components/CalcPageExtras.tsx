import Link from "next/link";
import { BUILD_LABEL } from "@/lib/buildInfo";
import { categoryHref } from "@/lib/categories";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { CALC_ARTICLES } from "@/lib/calcArticles";
import { GUIDES } from "@/lib/guides";
import { getExamplesForCalculator } from "@/lib/workedExamples";
import { REFERENCE_TABLES, type RefTable } from "@/lib/referenceTables";
import { TOOL_GUIDES, type ToolGuide } from "@/lib/toolGuides";

function DataTable({ t }: { t: RefTable }) {
  return (
    <div className="mt-5">
      <h3 className="text-base font-semibold text-foreground">{t.caption}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-[13px]">
          <thead>
            <tr>
              {t.headers.map((h, i) => (
                <th key={i} className="border-b border-border px-3 py-2 font-semibold text-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
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
      {t.note && <p className="mt-2 text-xs">{t.note}</p>}
    </div>
  );
}

function GuideBlock({ title, items, tone }: { title: string; items: string[]; tone?: "warn" }) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "warn" ? "border-accent/50 bg-accent/5" : "border-border bg-background/40"}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{title}</h3>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        {items.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

/** "Know before you use": what the tool is, why, what it needs, how it works and how far to trust it. */
function ToolGuideSection({ g, hasHowTo }: { g: ToolGuide; hasHowTo: boolean }) {
  return (
    <section id="tool-guide" className="mb-6 rounded-xl border border-accent-2/40 bg-surface p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-2">Tool guide · know before you use</div>
      <h2 className="mt-1 text-xl font-semibold text-foreground">What this tool is, how it works and how far to trust it</h2>
      <p className="mt-2 text-foreground">{g.what}</p>
      <p className="mt-2 text-xs">
        Read this before relying on a result. Every method, formula, assumption and limit is stated here, so you can check the answer yourself
        instead of accepting it blindly.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <GuideBlock title="What it can do" items={g.can} />
        <GuideBlock title="Why you need it" items={g.why} />
        <GuideBlock title="Understand this first" items={g.understand} />
        <GuideBlock title="What you need before you start" items={g.need} />
        {g.use && !hasHowTo && <GuideBlock title="How to use it" items={g.use} />}
        <GuideBlock title="What you get" items={g.output} />
        <GuideBlock title="How to read the results" items={g.interpret} />
        <GuideBlock title="Technical basis" items={g.basis} />
        <GuideBlock title="Limits: when not to rely on it" items={g.limits} tone="warn" />
      </div>
      {hasHowTo && (
        <p className="mt-4 text-xs">
          Step-by-step instructions: <a href="#how-to-use" className="text-accent-2 hover:underline">How to use</a>.
        </p>
      )}
    </section>
  );
}

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
  const refTables = REFERENCE_TABLES[href] ?? [];
  const toolGuide = TOOL_GUIDES[href];

  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-16 text-sm leading-relaxed text-muted">
      {toolGuide && <ToolGuideSection g={toolGuide} hasHowTo={!!article?.howTo} />}
      {article?.howTo && (
        <section id="how-to-use" className="mb-6 rounded-xl border border-accent-2/40 bg-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">{article.howTo.title}</h2>
          <ol className="mt-4 space-y-4">
            {article.howTo.steps.map((st, i) => (
              <li key={st.title} className="flex gap-3">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-accent-2/15 text-sm font-semibold text-accent-2">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{st.title}</h3>
                  <p className="mt-1">{st.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
      {article?.howTo && examples.length > 0 && (
        <section id="worked-examples" className="mb-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-xl font-semibold text-foreground">Worked examples</h2>
          <p className="mt-1">Step-by-step examples you can follow in the application, with every result checked against it.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {examples.map((ex) => (
              <Link key={ex.slug} href={`/examples/${ex.slug}`} className="rounded-lg border border-border p-4 transition-colors hover:border-accent-2/60">
                <div className="font-semibold text-foreground">{ex.title.replace(/^Worked Example:\s*/, "")}</div>
                <p className="mt-1 text-xs">{ex.dek}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
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
          {article.table && <DataTable t={article.table} />}
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

      {refTables.length > 0 && (
        <section className={`${article ? "mt-6 " : ""}rounded-xl border border-border bg-surface p-6`}>
          <h2 className="text-xl font-semibold text-foreground">Reference tables</h2>
          {refTables.map((t) => (
            <DataTable key={t.caption} t={t} />
          ))}
        </section>
      )}

      {(related.length > 0 || guide || examples.length > 0) && (
        <nav aria-label="Related pages" className="mt-6 grid gap-6 rounded-xl border border-border bg-surface p-6 md:grid-cols-2">
          {related.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Related calculators
                {group && (
                  <>
                    {" — "}
                    <Link href={categoryHref(group.id)} className="text-accent-2 hover:underline">
                      {group.title}
                    </Link>
                  </>
                )}
              </h2>
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
      <p className="mt-8 border-t border-border pt-4 text-xs text-muted">
        For preliminary engineering use. Results must be checked by a qualified engineer against the project&apos;s standards.{" "}
        <Link href="/verification" className="text-accent-2 hover:underline">How results are checked</Link>
        {" · "}
        <Link href="/terms" className="text-accent-2 hover:underline">Terms &amp; disclaimer</Link>
        {" · "}
        <span title="Release that produced this page">{BUILD_LABEL}</span>
      </p>
    </section>
  );
}
