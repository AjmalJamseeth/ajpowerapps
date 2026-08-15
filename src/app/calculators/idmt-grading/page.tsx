"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import RelayForm from "@/components/RelayForm";
import { DEFAULT_RELAY, RelaySettings } from "@/lib/idmt";
import { DEFAULT_IDMT_GRADING_INPUT, IdmtGradingInput, calcIdmtGrading } from "@/lib/idmtgrading";

export default function IdmtGradingPage() {
  const [input, setInput] = useState<IdmtGradingInput>(DEFAULT_IDMT_GRADING_INPUT);
  const update = (patch: Partial<IdmtGradingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const updateRelay = (i: number, next: RelaySettings) => {
    update({ relays: input.relays.map((r, idx) => (idx === i ? next : r)) });
  };
  const addRelay = () => {
    update({ relays: [...input.relays, DEFAULT_RELAY(`Relay ${input.relays.length + 1}`)] });
  };
  const removeRelay = (i: number) => {
    if (input.relays.length <= 2) return;
    update({ relays: input.relays.filter((_, idx) => idx !== i) });
  };

  const result = useMemo(() => calcIdmtGrading(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Multi-Bus IDMT Relay Grading
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Cascading grading-margin check across a radial chain of IDMT
          relays (up to source), at a single fault current seen by all of
          them — each upstream relay must trip a safe margin later than the
          one immediately downstream.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Multi-Bus IDMT Relay Grading" standardsLine="IEC 60255-151 / IEEE C37.112 curve math (same engine as the 2-relay IDMT calculator)" />
          <FeedbackButton calculatorName="Multi-Bus IDMT Relay Grading" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Extends the 2-relay IDMT coordination check to a full radial chain of up to several relays (load end to source), computing each relay's operating time at one common fault current and checking that every successive downstream-to-upstream step has adequate grading margin."
            standards={["IEC 60255-151 / IEEE C37.112 — same curve mathematics reused directly from the verified 2-relay IDMT calculator"]}
            capabilities={[
              "Operating time for every relay in the chain at a single evaluated fault current.",
              "Grading margin between each successive pair (downstream → upstream) against a configurable minimum (typically 0.3–0.4s).",
              "Overall pass/fail across the whole chain.",
            ]}
            example={{
              problem: "3 relays: Relay 1 pickup 1A/CT200:1/TMS0.1, Relay 2 pickup 1.2A/CT300:1/TMS0.2, Relay 3 pickup 1.5A/CT400:1/TMS0.3, all IEC SI, at a 5000A primary fault, 0.4s minimum margin.",
              steps: [
                "Relay 1: relay current 25A, PSM 25 → t≈0.21s.",
                "Relay 2: relay current 16.67A, PSM 13.9 → t≈0.52s.",
                "Relay 3: relay current 12.5A, PSM 8.3 → t≈0.97s.",
                "Margins: Relay1→2 ≈0.31s (below 0.4s, fails), Relay2→3 ≈0.45s (passes).",
              ],
              result: "First step fails the 0.4s margin in this example — a genuine illustration of a grading study catching an inadequate step, hand-checked against the underlying curve equation.",
            }}
            notes="This checks grading at only the one fault current you enter, not the full current range — for a rigorous study, repeat across the expected fault-current range (or use the 2-relay calculator's full-range sweep for any single adjacent pair)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <div className="space-y-4">
              {input.relays.map((relay, i) => (
                <div key={i} className="relative">
                  <RelayForm relay={relay} onChange={(next) => updateRelay(i, next)} accentClass={i % 2 === 0 ? "bg-accent" : "bg-accent-2"} />
                  {input.relays.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeRelay(i)}
                      className="absolute right-4 top-4 rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-fail/40 hover:text-fail"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addRelay}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60"
              >
                + Add relay upstream
              </button>
            </div>

            <Section title="Fault current & grading margin">
              <NumberField label="Fault current (primary)" unit="A" value={input.faultCurrentPrimary} onChange={(v) => update({ faultCurrentPrimary: v })} min={0} />
              <NumberField label="Minimum grading margin" unit="s" value={input.gradingMarginS} onChange={(v) => update({ gradingMarginS: v })} min={0} step={0.05} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.steps.length === 0 ? (
                <EmptyResult message="Add at least two relays and a fault current to see the grading study." />
              ) : (
                <ResultCard title="Grading study">
                  {result.operatingTimes.map((t, i) => (
                    <ResultRow key={i} label={t.label} value={t.timeS != null ? `${t.timeS.toFixed(3)} s` : "No trip"} />
                  ))}
                  <div className="my-2 border-t border-border" />
                  {result.steps.map((s, i) => (
                    <CheckRow key={i} label={s.label} value={s.margin != null ? `${s.margin.toFixed(3)}s margin` : "N/A"} pass={s.pass} />
                  ))}
                  <CheckRow label="Overall grading" value={result.allPass ? "PASS" : "FAIL"} pass={result.allPass} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
