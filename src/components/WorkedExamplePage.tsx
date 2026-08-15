import Link from "next/link";
import NavBar from "@/components/NavBar";
import type { WorkedExample } from "@/lib/workedExamples/types";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";

function StepCard({ step, index }: { step: WorkedExample["steps"][number]; index: number }) {
  return (
    <div id={`step-${index + 1}`} className="rounded-xl border border-border bg-surface p-6">
      <h3 className="text-lg font-semibold text-foreground">
        Step {index + 1}: {step.title}
      </h3>
      {step.body && <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>}

      {step.equation && (
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 font-mono text-sm text-foreground">
          {step.equationLabel && (
            <div className="mb-1 text-[11px] uppercase tracking-wide text-muted">{step.equationLabel}</div>
          )}
          <div>{step.equation}</div>
          {step.substitution && <div className="mt-1 text-accent-2">{step.substitution}</div>}
          {step.result && <div className="mt-2 text-base font-semibold text-accent">{step.result}</div>}
        </div>
      )}

      {step.table && (
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-2">
                {step.table.headers.map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold text-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {step.table.rows.map((row, ri) => (
                <tr key={ri} className="border-t border-border">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-muted">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {step.note && <p className="mt-3 text-xs italic text-muted/80">{step.note}</p>}
    </div>
  );
}

export default function WorkedExamplePage({ example }: { example: WorkedExample }) {
  const group = CALCULATOR_GROUPS.find((g) => g.id === example.groupId);
  const related = (group?.calculators ?? [])
    .filter((c) => c.href !== example.calculatorHref)
    .slice(0, 4);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />

      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link href="/examples" className="hover:text-foreground">Examples</Link>
          <span>/</span>
          <span className="text-foreground">{example.title}</span>
        </nav>

        {/* Header */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] font-medium text-accent">
            {example.standard}
          </span>
          <span className="text-xs text-muted">{example.readTime}</span>
          {example.incidentBased && (
            <span className="rounded-full border border-accent-2/30 bg-accent-2/10 px-2.5 py-0.5 text-[11px] font-medium text-accent-2">
              Real-world incident
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {example.title}
        </h1>
        <p className="mt-3 max-w-2xl text-muted">{example.dek}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={example.calculatorHref}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open {example.calculatorName} calculator
          </Link>
        </div>

        {/* Scenario */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Scenario</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <tbody>
                {example.scenario.map((p, i) => (
                  <tr key={p.label} className={i > 0 ? "border-t border-border" : undefined}>
                    <td className="w-1/3 bg-surface-2 px-4 py-2.5 font-medium text-foreground">{p.label}</td>
                    <td className="px-4 py-2.5 text-muted">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {example.scenarioNote && (
            <p className="mt-3 text-sm text-muted">{example.scenarioNote}</p>
          )}
        </section>

        {/* Steps */}
        <section className="mt-10 space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Step-by-step calculation</h2>
          {example.steps.map((step, i) => (
            <StepCard key={i} step={step} index={i} />
          ))}
        </section>

        {/* Result summary */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Result summary</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-2">
                  <th className="px-4 py-2.5 font-semibold text-foreground">Check</th>
                  <th className="px-4 py-2.5 font-semibold text-foreground">Requirement</th>
                  <th className="px-4 py-2.5 font-semibold text-foreground">Actual</th>
                  <th className="px-4 py-2.5 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {example.resultSummary.map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="px-4 py-2.5 text-foreground">{r.check}</td>
                    <td className="px-4 py-2.5 text-muted">{r.requirement}</td>
                    <td className="px-4 py-2.5 text-muted">{r.actual}</td>
                    <td className={`px-4 py-2.5 font-semibold ${r.pass ? "text-pass" : "text-fail"}`}>
                      {r.pass ? "✓ PASS" : "✗ FAIL"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg border border-accent/25 bg-accent/5 p-4 text-sm font-medium text-foreground">
            {example.finalAnswer}
          </div>
          {example.keyInsight && (
            <p className="mt-4 text-sm leading-relaxed text-muted">
              <span className="font-semibold text-foreground">Key insight: </span>
              {example.keyInsight}
            </p>
          )}
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-xl border border-accent/20 bg-gradient-to-br from-surface to-surface-2 p-6">
          <h3 className="text-base font-semibold text-foreground">Try it with your own numbers</h3>
          <p className="mt-1 text-sm text-muted">
            Every input in this example is editable in the live calculator — free, no signup.
          </p>
          <Link
            href={example.calculatorHref}
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open {example.calculatorName} calculator →
          </Link>
        </section>

        {/* FAQs */}
        {example.faqs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">Frequently asked questions</h2>
            <div className="mt-3 divide-y divide-border rounded-xl border border-border">
              {example.faqs.map((f, i) => (
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
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">More in {group?.title}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {related.map((c) => (
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
            <Link href="/examples" className="mt-4 inline-block text-sm font-semibold text-accent-2 hover:opacity-80">
              ← Back to all worked examples
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
