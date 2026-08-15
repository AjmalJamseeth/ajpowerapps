"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_GEN_SYNC_FAULT_INPUT, GenSyncFaultInput, GeneratorEntry, calcGenSyncFault } from "@/lib/gensyncfault";

function GeneratorsEditor({ generators, onChange }: { generators: GeneratorEntry[]; onChange: (g: GeneratorEntry[]) => void }) {
  const update = (i: number, patch: Partial<GeneratorEntry>) => onChange(generators.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  const remove = (i: number) => onChange(generators.filter((_, idx) => idx !== i));
  const add = () => onChange([...generators, { label: `Genset ${generators.length + 1}`, ratedKva: 500, xdSubtransientPu: 0.12 }]);

  return (
    <div className="col-span-2 space-y-2">
      {generators.map((g, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={g.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Generator"
            className="w-28 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <input
            type="number"
            value={g.ratedKva}
            onChange={(e) => update(i, { ratedKva: parseFloat(e.target.value) || 0 })}
            step="any"
            min={0}
            placeholder="kVA"
            className="w-full min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-muted">kVA, Xd&apos;&apos;</span>
          <input
            type="number"
            value={g.xdSubtransientPu}
            onChange={(e) => update(i, { xdSubtransientPu: parseFloat(e.target.value) || 0 })}
            step="any"
            min={0}
            placeholder="p.u."
            className="w-20 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-muted">p.u.</span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="shrink-0 rounded-md border border-border px-2 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60"
      >
        + Add generator
      </button>
    </div>
  );
}

export default function GeneratorFaultContributionPage() {
  const [input, setInput] = useState<GenSyncFaultInput>(DEFAULT_GEN_SYNC_FAULT_INPUT);
  const update = (patch: Partial<GenSyncFaultInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcGenSyncFault(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Parallel Generator Short-Circuit Contribution
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Per-generator fault current contribution at a common bus, using
          the standard subtransient-reactance method, summed across all
          paralleled generators.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Parallel Generator Short-Circuit Contribution" standardsLine="Subtransient reactance method" />
          <FeedbackButton calculatorName="Parallel Generator Short-Circuit Contribution" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates each paralleled generator's fault current contribution at a common bus using the standard subtransient-reactance method: Ifault = Irated ÷ Xd'' — then sums the individual contributions arithmetically, since generators in parallel simply add their contributions at a common bus to a first approximation."
            standards={["Subtransient-reactance fault contribution method (standard generator short-circuit estimation)"]}
            capabilities={[
              "Rated current and fault contribution for each generator, from its rated kVA and subtransient reactance (Xd'').",
              "Total fault current at the common bus.",
            ]}
            example={{
              problem: "Two 500kVA generators at 415V, each Xd''=0.12pu.",
              steps: [
                "Rated current per generator = 500,000/(√3×415) ≈ 695.6A.",
                "Fault contribution per generator = 695.6/0.12 ≈ 5,797A ≈ 5.80kA.",
                "Total at bus = 5.80 × 2 ≈ 11.59kA.",
              ],
              result: "≈11.59kA total fault contribution — hand-checked and matched the live code exactly.",
            }}
            notes="This ignores network/inter-machine impedance between the generators and the common bus, and doesn't account for fault current decay over time (subtransient vs transient vs steady-state) — it's a first-approximation screening tool, not a substitute for a full short-circuit study when sizing switchgear."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Common bus">
              <NumberField label="System voltage (line-line)" unit="kV" value={input.systemKv} onChange={(v) => update({ systemKv: v })} min={0} step={0.001} />
            </Section>

            <Section title="Generators">
              <GeneratorsEditor generators={input.generators} onChange={(generators) => update({ generators })} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.totalFaultKa == null ? (
                <EmptyResult message="Add at least one generator to see the fault contribution." />
              ) : (
                <ResultCard title="Fault contribution">
                  {result.contributions.map((c, i) => (
                    <ResultRow key={i} label={c.label} value={`${c.faultContributionKa.toFixed(2)} kA (rated ${c.ratedCurrentA.toFixed(0)}A)`} />
                  ))}
                  <div className="my-2 border-t border-border" />
                  <ResultRow label="Total at bus" value={<span className="text-lg text-accent-2">{result.totalFaultKa.toFixed(2)} kA</span>} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
