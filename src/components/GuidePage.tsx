import Link from "next/link";
import NavBar from "@/components/NavBar";
import type { GuideDoc } from "@/lib/guides/types";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { getExamplesForGroup } from "@/lib/workedExamples";

export default function GuidePage({ guide }: { guide: GuideDoc }) {
  const group = CALCULATOR_GROUPS.find((g) => g.id === guide.groupId);
  const groupExamples = getExamplesForGroup(guide.groupId);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/guides" className="hover:text-foreground">Guides</Link>
          <span>/</span>
          <span className="text-foreground">{guide.title}</span>
        </nav>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            Guide
          </span>
          <span className="text-xs text-muted">{guide.readTime}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {guide.title}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{guide.dek}</p>

        {group && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/calculators#${group.id}`}
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Browse {group.title} calculators
            </Link>
            {groupExamples.length > 0 && (
              <Link
                href={`/examples#${group.id}`}
                className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                See worked examples in this category
              </Link>
            )}
          </div>
        )}

        {/* Intro */}
        <section className="mt-10 space-y-4 text-sm leading-relaxed text-muted">
          {guide.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>

        {/* Core concepts */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Core concepts</h2>
          <div className="mt-4 space-y-6">
            {guide.coreConcepts.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <h3 className="text-base font-semibold text-foreground">{c.heading}</h3>
                <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
                  {c.body.map((p, pi) => (
                    <p key={pi}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Standards landscape */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Standards landscape</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <tbody>
                {guide.standardsLandscape.map((s, i) => (
                  <tr key={s.standard} className={i > 0 ? "border-t border-border" : undefined}>
                    <td className="w-1/3 bg-surface-2 px-4 py-2.5 align-top font-medium text-foreground">
                      {s.standard}
                    </td>
                    <td className="px-4 py-2.5 text-muted">{s.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Workflow */}
        <section className="mt-10 space-y-4">
          <h2 className="text-xl font-semibold text-foreground">How the calculators fit together</h2>
          <p className="text-sm text-muted">
            A typical order of use across this category, from first assessment to final sign-off.
          </p>
          <ol className="space-y-4">
            {guide.workflow.map((step, i) => (
              <li key={i} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.body}</p>
                    {step.calculatorHref && (
                      <Link
                        href={step.calculatorHref}
                        className="mt-2 inline-block text-xs font-semibold text-accent-2 hover:opacity-80"
                      >
                        Open {step.calculatorName} →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Common mistakes */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Common mistakes &amp; misconceptions</h2>
          <div className="mt-4 space-y-3">
            {guide.commonMistakes.map((m, i) => (
              <div key={i} className="rounded-xl border border-fail/25 bg-fail/5 p-5">
                <h3 className="text-sm font-semibold text-foreground">{m.mistake}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{m.whyItMatters}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQs */}
        {guide.faqs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">Frequently asked questions</h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border">
              {guide.faqs.map((f, i) => (
                <details key={i} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none text-sm font-medium text-foreground marker:content-none">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {group && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">Calculators in {group.title}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {group.calculators.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="rounded-lg border border-border bg-surface p-4 text-sm transition-colors hover:border-accent/40"
                >
                  <div className="font-medium text-foreground">{c.name}</div>
                  <div className="mt-1 text-xs text-muted">{c.description}</div>
                </Link>
              ))}
            </div>
            <Link href="/guides" className="mt-4 inline-block text-sm font-semibold text-accent-2 hover:opacity-80">
              ← Back to all guides
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
