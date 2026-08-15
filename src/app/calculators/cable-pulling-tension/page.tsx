"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { CablePullingInput, DEFAULT_CABLEPULLING_INPUT, PullSegment, SegmentType, calcCablePulling } from "@/lib/cablepulling";

export default function CablePullingTensionPage() {
  const [input, setInput] = useState<CablePullingInput>(DEFAULT_CABLEPULLING_INPUT);
  const update = (patch: Partial<CablePullingInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const updateSeg = (i: number, patch: Partial<PullSegment>) => update({ segments: input.segments.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  const result = useMemo(() => calcCablePulling(input), [input]);

  const lenUnit = input.units === "metric" ? "m" : "ft";
  const tUnit = input.units === "metric" ? "N" : "lbf";
  const wUnit = input.units === "metric" ? "kg/m" : "lb/ft";
  const swUnit = input.units === "metric" ? "N/m" : "lb/ft";
  const jamUnit = input.units === "metric" ? "mm" : "in";

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Cable Pulling Tension Calculator</h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEEE 1185 tension/capstan equations, sidewall bearing pressure and
          3-cable jam ratio.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Cable Pulling Tension Calculator" standardsLine="IEEE 1185" />
          <FeedbackButton calculatorName="Cable Pulling Tension Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Predicts the pulling tension a cable builds up as it's winched through a multi-segment conduit or duct route \u2014 straight sections via friction, bends via the exponential capstan equation \u2014 and checks it, along with sidewall bearing pressure and the classic 3-cable jam ratio, against manufacturer limits before a pull is attempted in the field."
          standards={["IEEE 1185 (cable pulling tension/capstan equations)"]}
          capabilities={["Segment-by-segment tension buildup across up to 6 pull-route segments (straight horizontal/vertical, or bends) in actual pull order.", "Capstan-equation tension multiplication at each bend, from bend angle and friction coefficient.", "Sidewall bearing pressure at each bend, checked against the cable's rated limit.", "3-cable jam ratio (conduit ID \u00f7 cable OD) with a check against the published 2.6-3.2 jamming danger zone."]}
          example={{ problem: "A pull route has two 50ft horizontal straight sections and one 90\u00b0 bend of 2ft radius, with friction coefficient 0.35 and cable weight 3.3 lb/ft.", steps: ["First straight section: tension builds from friction alone \u2192 57.75 lbf.", "Second straight section (before the bend): tension continues to build \u2192 115.5 lbf.", "At the 90\u00b0 bend, the capstan equation (T_out = T_in \u00d7 e^(f\u00d7\u03b8)) multiplies tension to 200.146 lbf.", "Peak sidewall pressure at the bend = T_out / radius = 200.146 / 2 = 100.073 lb/ft."], result: "Final tension 200.146 lbf and peak sidewall pressure 100.073 lb/ft \u2014 both comfortably pass typical 5,000 lbf / 300 lb/ft limits. A separate 3-cable jam-ratio check (4in conduit ID / 1.45in cable OD = 2.759) falls inside the 2.6-3.2 danger zone, flagging a real jamming risk worth mitigating." }}
          notes="This calculator is entirely a subscriber feature in the source app; it's unlocked here for free during launch (see the banner at the top of the site for the current promo window)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Setup">
              <SelectField<CablePullingInput["units"]> label="Units" tip={"Imperial (lb/ft/lbf) or metric (kg/m/N) \u2014 sets the unit labels used throughout the calculator and the underlying tension/pressure formulas."} value={input.units} onChange={(v) => update({ units: v })} options={[
                { value: "imperial", label: "Imperial (lb, ft, lbf)" },
                { value: "metric", label: "Metric (kg, m, N)" },
              ]} />
              <NumberField label="Friction Coefficient" tip={"Coefficient of friction between the cable jacket and the conduit/duct wall \u2014 drives both straight-section tension buildup and the exponential capstan-equation multiplier at bends. Typical published values run roughly 0.35-0.5 depending on jacket material, lubrication, and conduit type."} value={input.frictionCoeff} onChange={(v) => update({ frictionCoeff: v })} min={0} step="any" />
              <NumberField label={`Total Cable Weight (${wUnit})`} tip={"Combined weight of ALL cables being pulled together simultaneously, per unit length (e.g. 3 cables \u00d7 their individual weight, summed)."} value={input.cableWeight} onChange={(v) => update({ cableWeight: v })} min={0} step="any" />
              <NumberField label={`Starting Tension (${tUnit})`} tip={"Tension already in the cable as it enters the first segment of this pull \u2014 normally 0 for a fresh pull starting at a reel, but nonzero if this run continues from a previous pull segment or back-tension is deliberately applied at the reel."} value={input.startTension} onChange={(v) => update({ startTension: v })} min={0} step="any" />
              <NumberField label={`Max Allowable Tension (${tUnit})`} tip={"The cable's rated maximum pulling tension limit, from the manufacturer's datasheet \u2014 the final calculated tension must stay below this to avoid conductor/insulation damage."} value={input.maxTension} onChange={(v) => update({ maxTension: v })} min={0} step="any" />
              <NumberField label={`Max Sidewall Pressure (${swUnit})`} tip={"The cable's rated sidewall bearing pressure limit at bends, from the manufacturer's datasheet. Published general ranges run roughly 300-500 lb/ft (4,380-7,300 N/m) of bend radius depending on cable construction, with armoured cables typically at the lower end."} value={input.maxSidewallPressure} onChange={(v) => update({ maxSidewallPressure: v })} min={0} step="any" />
            </Section>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-foreground">Pull route (in pull order)</h3>
              <div className="mt-4 space-y-3">
                {input.segments.map((seg, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-3">
                    <SelectField<SegmentType> label={`Segment ${i + 1}`} tip={i === 0 ? "Segments are entered in pull order, from the reel to the far end. Tension carries forward from one segment to the next, so order matters." : undefined} value={seg.type} onChange={(v) => updateSeg(i, { type: v })} options={[
                      { value: "none", label: "— unused —" },
                      { value: "straightH", label: "Straight — Horizontal" },
                      { value: "straightUp", label: "Straight — Vertical Up" },
                      { value: "straightDown", label: "Straight — Vertical Down" },
                      { value: "bend", label: "Bend" },
                    ]} />
                    {(seg.type === "straightH" || seg.type === "straightUp" || seg.type === "straightDown") && (
                      <div className="mt-2"><NumberField label={`Length (${lenUnit})`} tip="Length of this straight section. Horizontal sections build tension by friction; vertical sections also add or subtract tension from the cable's own weight depending on pull direction." value={seg.lengthM} onChange={(v) => updateSeg(i, { lengthM: v })} min={0} step="any" /></div>
                    )}
                    {seg.type === "bend" && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <NumberField label="Angle (deg)" tip="Total angle turned through this bend, in degrees (e.g. 90 for a right-angle bend) — converted internally to radians for the capstan equation." value={seg.angleDeg} onChange={(v) => updateSeg(i, { angleDeg: v })} min={0} max={180} step="any" />
                        <NumberField label={`Radius (${lenUnit})`} tip="Radius of this bend — used to compute sidewall bearing pressure (SWBP = tension ÷ radius) at this bend. A tighter radius concentrates the same tension into higher pressure against the cable jacket." value={seg.radiusM} onChange={(v) => updateSeg(i, { radiusM: v })} min={0} step="any" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Section title="Jam ratio (3 cables in conduit)">
              <NumberField label={`Conduit ID (${jamUnit})`} tip={"Internal (bore) diameter of the conduit, in the same units as the cable OD below."} value={input.jamConduitId} onChange={(v) => update({ jamConduitId: v })} min={0} step="any" />
              <NumberField label={`Cable OD (${jamUnit})`} tip={"Overall diameter of ONE of the (identical) cables being pulled together \u2014 the jam ratio check specifically applies to the common case of 3 identical round cables cradled together in a conduit."} value={input.jamCableOd} onChange={(v) => update({ jamCableOd: v })} min={0} step="any" />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result ? (
                <EmptyResult message="Enter friction coefficient and cable weight to see results." />
              ) : (
                <>
                  <ResultCard title="Tension result">
                    <ResultRow label={`Final Pulling Tension (${tUnit})`} value={result.finalTension.toFixed(1)} />
                    <CheckRow label="Tension Check" value={input.maxTension != null ? `≤ ${input.maxTension} ${tUnit}` : "no limit set"} pass={result.tensionPass} />
                    <ResultRow label={`Peak Sidewall Pressure (${swUnit})`} value={result.maxSidewallPressure.toFixed(1)} />
                    <CheckRow label="Sidewall Pressure Check" value={input.maxSidewallPressure != null ? `≤ ${input.maxSidewallPressure} ${swUnit}` : "no limit set"} pass={result.sidewallPass} />
                  </ResultCard>
                  <ResultCard title="Tension build-up (segment by segment)">
                    {result.lines.map((l, i) => (
                      <ResultRow key={i} label={l.text} value="" />
                    ))}
                  </ResultCard>
                  <ResultCard title="Jam ratio result (3-cable)">
                    <ResultRow label="Jam Ratio J = ID/OD" value={result.jamRatio != null ? result.jamRatio.toFixed(3) : "—"} />
                    <CheckRow
                      label="Jamming Risk"
                      value={result.jamDanger == null ? "n/a" : result.jamDanger ? "Inside 2.6–3.2 danger zone" : "Outside danger zone"}
                      pass={result.jamDanger == null ? null : !result.jamDanger}
                    />
                  </ResultCard>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
