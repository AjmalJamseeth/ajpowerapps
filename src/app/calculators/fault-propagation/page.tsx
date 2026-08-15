"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_FAULT_PROPAGATION_INPUT, FaultElement, FaultPropagationInput, calcFaultPropagation } from "@/lib/faultpropagation";

function ElementsEditor({ elements, onChange }: { elements: FaultElement[]; onChange: (e: FaultElement[]) => void }) {
  const update = (i: number, patch: Partial<FaultElement>) => onChange(elements.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const remove = (i: number) => onChange(elements.filter((_, idx) => idx !== i));
  const add = () => onChange([...elements, { label: `Element ${elements.length + 1}`, pctZ: 1, elementBaseKva: 1000 }]);

  return (
    <div className="col-span-2 space-y-2">
      {elements.map((el, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={el.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Element"
            className="w-32 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <input
            type="number"
            value={el.pctZ}
            onChange={(e) => update(i, { pctZ: parseFloat(e.target.value) || 0 })}
            step="any"
            min={0}
            placeholder="%Z"
            className="w-full min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-muted">%Z at</span>
          <input
            type="number"
            value={el.elementBaseKva}
            onChange={(e) => update(i, { elementBaseKva: parseFloat(e.target.value) || 0 })}
            step="any"
            min={0}
            placeholder="kVA"
            className="w-24 shrink-0 rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
          />
          <span className="shrink-0 text-xs text-muted">kVA</span>
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
        + Add element (transformer / cable)
      </button>
    </div>
  );
}

export default function FaultPropagationPage() {
  const [input, setInput] = useState<FaultPropagationInput>(DEFAULT_FAULT_PROPAGATION_INPUT);
  const update = (patch: Partial<FaultPropagationInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcFaultPropagation(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Fault Current Propagation Through a Distribution Network
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          The classic &quot;Base kVA Method&quot; — converts every element&apos;s
          %impedance to a common kVA base and accumulates it down a radial
          chain (source → transformer → cable → sub-panel) to estimate
          available fault current at each point.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Fault Current Propagation (Base kVA Method)" standardsLine="Base kVA Method — scalar %Z approximation, see caveat below" />
          <FeedbackButton calculatorName="Fault Current Propagation Through a Distribution Network" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates available short-circuit current at successive points down a radial network by converting each element's %impedance to a common kVA base and accumulating it along the path — the classic textbook 'Base kVA Method' quick-estimate technique."
            standards={["Base kVA Method (standard percentage-impedance short-circuit estimation technique)"]}
            capabilities={[
              "Source impedance derived from utility fault MVA.",
              "Any number of series elements (transformers, cables), each entered as %Z at its own rated kVA and auto-converted to the common base.",
              "Fault MVA and fault current (kA) reported progressively at each point down the chain.",
            ]}
            example={{
              problem: "Base 1000kVA, 415V system, 250MVA source, 1000kVA transformer at 6%Z, cable at 1.5%Z (same base).",
              steps: [
                "Source %Z = (1/250)×100 = 0.4%.",
                "After transformer: cumulative %Z = 0.4+6 = 6.4% → fault MVA = 100/6.4 = 15.6 MVA.",
                "After cable: cumulative %Z = 6.4+1.5 = 7.9% → fault MVA = 100/7.9 = 12.66 MVA → ≈17.6kA at 415V.",
              ],
              result: "≈17.6kA available fault current at the sub-panel — hand-checked and matched the live code exactly.",
            }}
            notes="IMPORTANT SIMPLIFICATION: this combines %Z magnitudes arithmetically rather than resolving each element into R and X and summing vectorially. Arithmetic summation slightly OVERSTATES total impedance and therefore UNDERSTATES fault current relative to a full R+jX study. Use this for quick estimates only — never finalize protective device interrupting-rating selections from this figure alone; use a full R+X or dedicated short-circuit study for that."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Base & system">
              <NumberField label="Base kVA" unit="kVA" value={input.baseKva} onChange={(v) => update({ baseKva: v })} min={1} />
              <NumberField label="System voltage (line-line)" unit="kV" value={input.systemKv} onChange={(v) => update({ systemKv: v })} min={0} step={0.001} />
              <NumberField label="Utility/source fault level" unit="MVA" value={input.sourceFaultMva} onChange={(v) => update({ sourceFaultMva: v })} min={0} />
            </Section>

            <Section title="Series elements (source → load)">
              <ElementsEditor elements={input.elements} onChange={(elements) => update({ elements })} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.points.length === 0 ? (
                <EmptyResult message="Enter a source fault level to see fault current at each point." />
              ) : (
                <ResultCard title="Fault current down the network">
                  <ResultRow label="Source %Z (at base)" value={`${result.sourcePctZ!.toFixed(3)}%`} />
                  <div className="my-2 border-t border-border" />
                  {result.points.map((p, i) => (
                    <ResultRow key={i} label={p.label} value={`${p.faultCurrentKa.toFixed(2)} kA (${p.faultMva.toFixed(1)} MVA)`} />
                  ))}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
