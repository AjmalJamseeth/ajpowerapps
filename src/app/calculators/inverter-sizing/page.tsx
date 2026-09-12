"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_INVERTER_SIZING_INPUT,
  InverterSizingInput,
  InverterSizingMode,
  calcInverterSizing,
} from "@/lib/inverterSizing";

export default function InverterSizingPage() {
  const [input, setInput] = useState<InverterSizingInput>(DEFAULT_INVERTER_SIZING_INPUT);
  const update = (patch: Partial<InverterSizingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcInverterSizing(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Inverter Sizing Calculator — Solar, Off-Grid &amp; ILR
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Grid-tied mode sizes an inverter from a target DC:AC ratio (ILR);
          off-grid mode sizes continuous and surge (motor-starting)
          capacity from a connected load.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Inverter Sizing Calculator — Solar, Off-Grid & ILR" standardsLine="DC:AC ratio (ILR) practice for grid-tied PV inverter sizing; standard surge/continuous sizing for off-grid inverters" />
          <FeedbackButton calculatorName="Inverter Sizing Calculator — Solar, Off-Grid & ILR" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Grid-tied mode evaluates the DC:AC ratio (ILR — Inverter Load Ratio) between a PV array's STC DC rating and the inverter's continuous AC rating, a deliberate oversizing practice used to keep the inverter running closer to full output for more of the day at the cost of some solar-noon clipping. Off-grid mode sizes an inverter's continuous and surge (motor-starting) capacity from a connected load."
            standards={["DC:AC ratio (ILR) design practice — typical range 1.1-1.35 for grid-tied string/central inverters"]}
            capabilities={[
              "Grid-tied: recommended inverter AC rating from array DC kW and a target ILR, or evaluate a candidate inverter's actual ILR with a CONSERVATIVE→AGGRESSIVE grading band.",
              "Off-grid: required continuous kVA (load ÷ output PF) and required surge kVA (continuous × a motor-starting surge multiple).",
            ]}
            example={{
              problem: "Grid-tied: 12kWdc array, target ILR 1.2, candidate inverter 10kWac.",
              steps: [
                "Recommended inverter = 12/1.2 = 10kWac",
                "Candidate inverter's actual ILR = 12/10 = 1.2 — within the 1.15-1.35 TYPICAL band",
              ],
              result: "10kWac recommended, candidate inverter's ILR = 1.2 (TYPICAL).",
            }}
            notes="ILR is a design choice, not a hard limit — a higher ILR trades a small amount of clipped energy at peak sun for a smaller, cheaper inverter and higher output during low-light conditions; the ideal ratio depends on local irradiance profile and electricity pricing. Off-grid surge sizing here is a simplified continuous×multiple estimate — for inductive/motor loads with a specific locked-rotor current, cross-check against the inverter manufacturer's actual surge rating curve."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Mode">
              <SelectField<InverterSizingMode>
                label="Mode"
                value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "gridTied", label: "Grid-tied (DC:AC ratio / ILR)" },
                  { value: "offGrid", label: "Off-grid (continuous + surge)" },
                ]}
              />
            </Section>

            {input.mode === "gridTied" ? (
              <Section title="Array & inverter">
                <NumberField label="Array DC rating (STC)" unit="kWdc" value={input.arrayDcKw} onChange={(v) => update({ arrayDcKw: v })} min={0} />
                <NumberField label="Target ILR" tip="Typical range 1.1-1.35 for grid-tied string/central inverters." value={input.targetIlr} onChange={(v) => update({ targetIlr: v })} min={0.5} step={0.05} />
                <NumberField label="Candidate inverter AC rating (optional)" unit="kWac" value={input.candidateInverterAcKw} onChange={(v) => update({ candidateInverterAcKw: v })} min={0} />
              </Section>
            ) : (
              <Section title="Load">
                <NumberField label="Continuous load" unit="kW" value={input.continuousLoadKw} onChange={(v) => update({ continuousLoadKw: v })} min={0} />
                <NumberField label="Output power factor" value={input.outputPowerFactor} onChange={(v) => update({ outputPowerFactor: v })} min={0.1} max={1} step={0.01} />
                <NumberField label="Surge multiple" tip="Motor-starting/inrush multiple of continuous load — commonly 3x for a single motor load, higher for multiple simultaneous starts." value={input.surgeMultiple} onChange={(v) => update({ surgeMultiple: v })} min={1} step={0.5} />
              </Section>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {input.mode === "gridTied" ? (
                result.recommendedInverterAcKw == null ? (
                  <EmptyResult message="Enter array DC rating and target ILR to see the recommended inverter size." />
                ) : (
                  <ResultCard title="Grid-tied inverter sizing">
                    <ResultRow label="Recommended inverter (AC)" value={`${result.recommendedInverterAcKw.toFixed(2)} kWac`} />
                    {result.actualIlr != null && (
                      <>
                        <ResultRow label="Candidate inverter's actual ILR" value={result.actualIlr.toFixed(2)} />
                        <ResultRow label="Grade" value={result.ilrGrade!} />
                      </>
                    )}
                  </ResultCard>
                )
              ) : result.requiredContinuousKva == null ? (
                <EmptyResult message="Enter the connected load to see the required inverter capacity." />
              ) : (
                <ResultCard title="Off-grid inverter sizing">
                  <ResultRow label="Required continuous capacity" value={`${result.requiredContinuousKva.toFixed(2)} kVA`} />
                  <ResultRow label="Required surge capacity" value={`${result.requiredSurgeKva!.toFixed(2)} kVA`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
