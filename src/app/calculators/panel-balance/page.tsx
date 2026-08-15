"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_PANEL_BALANCE_INPUT, PanelBalanceInput, calcPanelBalance } from "@/lib/panelbalance";

export default function PanelBalancePage() {
  const [input, setInput] = useState<PanelBalanceInput>(DEFAULT_PANEL_BALANCE_INPUT);
  const update = (patch: Partial<PanelBalanceInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcPanelBalance(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Residential / Commercial DB Panel Balancer
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Per-phase load balance check for a 3-phase distribution board, and
          the resulting neutral current from the standard unbalanced-phasor
          formula.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Residential / Commercial DB Panel Balancer" standardsLine="Standard 3-phase neutral current phasor formula" />
          <FeedbackButton calculatorName="Residential / Commercial DB Panel Balancer" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks per-phase load balance across a 3-phase distribution board/panel and computes the resulting neutral current, using the standard three-phase unbalanced-current phasor formula (currents 120° apart)."
            standards={["Standard three-phase unbalanced-current phasor formula: In = √(IL1²+IL2²+IL3²−IL1·IL2−IL2·IL3−IL1·IL3)"]}
            capabilities={[
              "Average phase current and maximum percentage deviation from average.",
              "Identifies the most- and least-loaded phase.",
              "Neutral current from the phasor formula (not a simple arithmetic difference).",
            ]}
            example={{
              problem: "IL1=45A, IL2=38A, IL3=52A.",
              steps: [
                "Average = (45+38+52)/3 = 45A.",
                "In = √(45²+38²+52²−45×38−38×52−45×52) = √(2025+1444+2704−1710−1976−2340) = √147 ≈ 12.12A.",
              ],
              result: "≈12.1A neutral current — hand-checked and matched the live code exactly.",
            }}
            notes="This assumes balanced 120° phase spacing and linear loads — significant harmonic content (especially triplen harmonics from non-linear loads) can cause neutral current to exceed what this formula predicts; see the Harmonic Analysis calculator for that case."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Per-phase currents">
              <NumberField label="IL1" unit="A" value={input.il1} onChange={(v) => update({ il1: v })} min={0} />
              <NumberField label="IL2" unit="A" value={input.il2} onChange={(v) => update({ il2: v })} min={0} />
              <NumberField label="IL3" unit="A" value={input.il3} onChange={(v) => update({ il3: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.neutralCurrentA == null ? (
                <EmptyResult message="Enter all three phase currents to see the balance check." />
              ) : (
                <ResultCard title="Panel balance">
                  <ResultRow label="Average current" value={`${result.average!.toFixed(1)} A`} />
                  <ResultRow label="Max deviation" value={`${result.maxDeviationPct!.toFixed(1)}%`} />
                  <ResultRow label="Most loaded" value={result.mostLoadedPhase!} />
                  <ResultRow label="Least loaded" value={result.leastLoadedPhase!} />
                  <ResultRow label="Neutral current" value={`${result.neutralCurrentA.toFixed(2)} A`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
