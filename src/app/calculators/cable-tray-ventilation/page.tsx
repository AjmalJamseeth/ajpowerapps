"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import {
  DEFAULT_CABLE_TRAY_VENTILATION_INPUT,
  CableTrayVentilationInput,
  calcCableTrayVentilation,
} from "@/lib/cabletrayventilation";

export default function CableTrayVentilationPage() {
  const [input, setInput] = useState<CableTrayVentilationInput>(DEFAULT_CABLE_TRAY_VENTILATION_INPUT);
  const update = (patch: Partial<CableTrayVentilationInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcCableTrayVentilation(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Cable Tray Ventilation Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Open-area (perforation) ratio of a cable tray over a given
          length — a quick screening indicator of how freely a ventilated
          tray can dissipate heat compared to a solid-bottom tray.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Cable Tray Ventilation Calculator" standardsLine="Open-area ratio = open (perforated) area / total tray plan area" />
          <FeedbackButton calculatorName="Cable Tray Ventilation Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes the open (perforated) area of a cable tray as a percentage of its total plan area over a given length — a simple screening indicator used alongside cable ampacity/fill checks to gauge how freely a ventilated or perforated tray can dissipate heat compared to a fully solid-bottom tray. Ladder tray is effectively ~100% open; perforated trough tray is typically 15-40% depending on the hole pattern; solid-bottom tray is 0%."
            standards={["Open-area ratio = open (perforated) area / (tray width × length) — a general screening metric, not a normative code table"]}
            capabilities={[
              "Ventilation (open-area) ratio from tray width, assessed length, and total open/perforated area.",
              "Grading band from LOW to HIGH for a quick sense of how ventilated the tray section is.",
            ]}
            example={{
              problem: "300mm wide tray, 10m length assessed, 1.2m² total perforated open area.",
              steps: [
                "Total tray plan area = 0.3m × 10m = 3.0m²",
                "Ventilation ratio = 1.2/3.0 × 100 = 40%",
              ],
              result: "40% open area — GOOD ventilation band.",
            }}
            notes="This is a plan-area open ratio, not a full convective heat-transfer calculation — it doesn't replace an ampacity derating study for enclosed or heavily loaded trays (see the Cable Tray Fill and Cable Ampacity calculators for capacity/fill limits)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Tray dimensions">
              <NumberField label="Tray width" unit="mm" value={input.trayWidthMm} onChange={(v) => update({ trayWidthMm: v })} min={0} step={10} />
              <NumberField label="Assessed length" unit="m" value={input.trayLengthM} onChange={(v) => update({ trayLengthM: v })} min={0} step={0.5} />
              <NumberField label="Total open (perforated) area" unit="m²" value={input.openAreaM2} onChange={(v) => update({ openAreaM2: v })} min={0} step={0.05} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.ventilationRatioPct == null ? (
                <EmptyResult message="Enter tray dimensions and open area to see the ventilation ratio." />
              ) : (
                <ResultCard title="Ventilation ratio">
                  <ResultRow label="Total tray plan area" value={`${result.totalTrayAreaM2!.toFixed(2)} m²`} />
                  <ResultRow label="Ventilation ratio" value={`${result.ventilationRatioPct.toFixed(1)}%`} />
                  <ResultRow label="Grade" value={result.grade!} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
