"use client";

import { useMemo } from "react";
import { useShareableInput } from "@/lib/shareState";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import { CablePullingInput, DEFAULT_CABLEPULLING_INPUT, PullConfiguration, PullSegment, SegmentType, calcCablePulling } from "@/lib/cablepulling";

export default function CablePullingTensionPage() {
  const [input, setInput] = useShareableInput<CablePullingInput>(DEFAULT_CABLEPULLING_INPUT);
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
          IEEE 1185 tension and capstan equations for one or three cables, with
          the weight correction factor, sidewall bearing pressure and jam ratio.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Cable Pulling Tension Calculator" standardsLine="IEEE 1185" />
          <FeedbackButton calculatorName="Cable Pulling Tension Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Predicts the pulling tension a cable builds up as it's winched through a multi-segment conduit or duct route \u2014 straight sections via friction, bends via the exponential capstan equation \u2014 and checks it, along with sidewall bearing pressure and the classic 3-cable jam ratio, against manufacturer limits before a pull is attempted in the field."
          standards={["IEEE 1185 (cable pulling tension/capstan equations)"]}
          capabilities={["Segment-by-segment tension buildup across up to 6 pull-route segments (straight horizontal/vertical, or bends) in actual pull order.", "One cable, or three identical cables in triangular or cradled configuration, with the weight correction factor wc applied to friction in straight sections and bends.", "Capstan-equation tension multiplication at each bend: T_out = T_in \u00d7 e^(wc\u00b7f\u00b7\u03b8).", "Sidewall bearing pressure on the most heavily loaded cable at each bend (T/R for one cable, wc\u00b7T/2R triangular, (3wc\u22122)\u00b7T/3R cradled), checked against the cable's rated limit.", "Three-cable jam ratio (conduit ID \u00f7 cable OD) with a check against the 2.6\u20133.2 jamming danger zone."]}
          example={{ problem: "Three identical single-core cables are pulled together, cradled, into a 4 in ID conduit. Each cable is 1.45 in OD and weighs 1.1 lb/ft, so the total weight is w = 3.3 lb/ft. The route is two 50 ft horizontal straights, then a 90\u00b0 bend of 2 ft radius. Friction coefficient f = 0.35, no back-tension.", steps: ["Weight correction (cradled): d/(D\u2212d) = 1.45/2.55 = 0.569, wc = 1 + (4/3)\u00d70.569\u00b2 = 1.431.", "First straight: T = wc\u00b7f\u00b7w\u00b7L = 1.431\u00d70.35\u00d73.3\u00d750 = 82.6 lbf.", "Second straight: +82.6 \u2192 T = 165.3 lbf.", "90\u00b0 bend: T = 165.3 \u00d7 e^(1.431\u00d70.35\u00d7\u03c0/2) = 165.3 \u00d7 2.196 = 363.0 lbf.", "Sidewall pressure (cradled) = (3wc\u22122)\u00b7T/(3R) = 2.293\u00d7363.0/6 = 138.8 lb/ft."], result: "Final tension 363.0 lbf and sidewall pressure 138.8 lb/ft, both within the 5,000 lbf and 300 lb/ft limits used here. The jam ratio 4/1.45 = 2.76 lies inside the 2.6\u20133.2 danger zone, so a different conduit size or cable arrangement should be considered." }}
          notes="Weight entered is the total of all cables pulled together. Use the cable manufacturer's limits for maximum tension and sidewall pressure; values in the example are illustrative. The calculation assumes identical round cables and uniform friction along the route."
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
              <SelectField<PullConfiguration> label="Cables pulled" tip={"One cable, or three identical cables pulled together. Three cables settle either in a triangle (triplexed, or when the conduit is tight) or cradled side by side in the bottom of the conduit (when it is roomier). Three cables press harder on the conduit wall than their weight alone, which the weight correction factor wc accounts for. Cradled gives the higher wc, so use it if unsure."} value={input.configuration} onChange={(v) => update({ configuration: v })} options={[
                { value: "single", label: "One cable" },
                { value: "triangular", label: "Three cables \u2014 triangular" },
                { value: "cradled", label: "Three cables \u2014 cradled" },
              ]} />
              <NumberField label={`Total Cable Weight (${wUnit})`} tip={"Combined weight of ALL cables pulled together, per unit length. For three cables enter 3 \u00d7 the weight of one cable."} value={input.cableWeight} onChange={(v) => update({ cableWeight: v })} min={0} step="any" />
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

            <Section title="Conduit and cable diameters">
              <NumberField label={`Conduit ID (${jamUnit})`} tip={"Internal (bore) diameter of the conduit, in the same units as the cable OD below."} value={input.jamConduitId} onChange={(v) => update({ jamConduitId: v })} min={0} step="any" />
              <NumberField label={`Cable OD (${jamUnit})`} tip={"Overall diameter of ONE of the identical cables. For three cables it sets the weight correction factor and the jam ratio."} value={input.jamCableOd} onChange={(v) => update({ jamCableOd: v })} min={0} step="any" />
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
                    {result.cableCount === 3 && <ResultRow label="Weight correction factor wc" value={result.weightCorrection.toFixed(3)} />}
                    <ResultRow label={`Peak Sidewall Pressure (${swUnit})`} value={result.maxSidewallPressure.toFixed(1)} />
                    <CheckRow label="Sidewall Pressure Check" value={input.maxSidewallPressure != null ? `≤ ${input.maxSidewallPressure} ${swUnit}` : "no limit set"} pass={result.sidewallPass} />
                    {result.warnings.map((w, i) => (
                      <p key={i} className="mt-2 text-sm text-accent">{w}</p>
                    ))}
                  </ResultCard>
                  <ResultCard title="Tension build-up (segment by segment)">
                    {result.lines.map((l, i) => (
                      <ResultRow key={i} label={l.text} value="" />
                    ))}
                  </ResultCard>
                  <ResultCard title="Jam ratio (three cables)">
                    <ResultRow label="Jam Ratio J = ID/OD" value={result.jamRatio != null ? result.jamRatio.toFixed(3) : "—"} />
                    <CheckRow
                      label="Jamming Risk"
                      value={result.jamDanger == null ? (result.cableCount === 1 ? "n/a for one cable" : "n/a") : result.jamDanger ? "Inside 2.6–3.2 danger zone" : "Outside danger zone"}
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
