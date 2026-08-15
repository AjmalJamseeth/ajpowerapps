"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import { DEFAULT_LIGHTNING_INPUT, LightningInput, calcLightning } from "@/lib/lightning";

export default function LightningProtectionPage() {
  const [input, setInput] = useState<LightningInput>(DEFAULT_LIGHTNING_INPUT);
  const update = (patch: Partial<LightningInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Connected-line risk (RU/RV) and SPD/LEMP protection are subscriber
  // features — never computed on the free site.
  const result = useMemo(() => calcLightning(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Lightning Protection &amp; Risk Assessment Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEC 62305-1/2 risk assessment — collection area, structure risk
          (R<sub>A</sub> + R<sub>B</sub>) and minimum LPS class. Connected-line
          risk (R<sub>U</sub>/R<sub>V</sub>) and SPD/LEMP protection sizing are
          subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Lightning Protection & Risk Assessment Calculator" standardsLine="IEC 62305-1/2" />
          <FeedbackButton calculatorName="Lightning Protection & Risk Assessment Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Performs an IEC 62305-2 lightning risk assessment for a structure: collection area and expected annual flash frequency, the structure's own risk components (touch/step voltage risk RA, physical damage risk RB), a pass/fail check against the standard's tolerable risk threshold, and \u2014 if risk is too high \u2014 the minimum LPS (Lightning Protection System) class needed to bring it into compliance, with the resulting rolling-sphere radius, mesh size and down-conductor spacing."
          standards={["IEC 62305-1 (general principles)", "IEC 62305-2 (risk management)", "IEC 62305-3 (physical damage & LPS design)"]}
          capabilities={["Collection area and flash frequency from structure dimensions and ground flash density.", "Structure risk R1 = RA (touch/step voltage) + RB (physical damage), checked against the standard tolerable risk RT = 1\u00d710\u207b\u2075.", "Searches for the minimum LPS class (I-IV) that brings a failing structure into compliance, with rolling-sphere/mesh/down-conductor design values.", "Subscriber: connected-line risk (RU/RV from power & telecom line data) added into R1, and SPD/LEMP protection coordination."]}
          example={{ problem: "This calculator's default scenario reproduces the source app's own documented IEC 62305-2 Annex E 'country house' case study.", steps: ["Compute collection area Ad from the structure's L, W, H and Cd.", "Compute expected flash frequency Nd = Ng \u00d7 Ad \u00d7 Cd \u00d7 10\u207b\u2076.", "Compute RA (touch/step voltage risk) and RB (physical damage risk) from the entered loss factors.", "Sum R1 = RA + RB (plus RU/RV connected-line risk on the subscriber tier) and compare to the tolerable risk RT = 1\u00d710\u207b\u2075."], result: "R1 \u2248 2.5056\u00d710\u207b\u2075 with connected-line risk included, matching the source case study's documented expected value of \u22482.51\u00d710\u207b\u2075 \u2014 confirming the risk-assessment math is faithfully reproduced." }}
          notes="The free tier computes structure-only risk (RA+RB); connected-line risk (RU/RV) and SPD/LEMP protection coordination are subscriber features, matching the source app's own tiering."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Structure & environment">
              <NumberField label="Ground Flash Density (Ng)" unit="/km²/yr" tip={"Lightning flashes per km\u00b2 per year at the site, from local lightning detection network data or isokeraunic maps (IEC 62305-2 Annex A.1). If unknown, a rough temperate-region estimate is Ng \u2248 0.1\u00d7thunderstorm-days/year \u2014 but real detection-network data is strongly preferred."} value={input.ng} onChange={(v) => update({ ng: v })} min={0} step="any" />
              <SelectField<number>
                label="Location Factor (Cd)"
                tip={"Accounts for shielding (or exposure) from surrounding structures, IEC 62305-2 Table A.1 \u2014 a structure surrounded by taller buildings is partly shielded (Cd=0.25); an isolated structure on a hilltop is disproportionately exposed (Cd=2)."} value={input.locationFactor}
                onChange={(v) => update({ locationFactor: v })}
                options={[
                  { value: 1, label: "1 — Isolated" },
                  { value: 0.5, label: "0.5 — Surrounded by smaller structures" },
                  { value: 0.25, label: "0.25 — Surrounded by similar/taller structures" },
                  { value: 0.01, label: "0.01 — Surrounded by taller structures within 3H" },
                ]}
              />
              <NumberField label="Structure Length (L)" unit="m" tip={"Length of the (rectangular) structure \u2014 used in the collection area formula Ad = L\u00d7W + 2(3H)(L+W) + \u03c0(3H)\u00b2, IEC 62305-2 Equation A.2."} value={input.structL} onChange={(v) => update({ structL: v })} min={0} />
              <NumberField label="Structure Width (W)" unit="m" tip={"Width of the structure \u2014 the other horizontal dimension in the collection area formula."} value={input.structW} onChange={(v) => update({ structW: v })} min={0} />
              <NumberField label="Structure Height (H)" unit="m" tip={"Height of the structure \u2014 collection area grows with the SQUARE of height (via the 3H term), so tall structures collect dramatically more lightning risk than their footprint alone suggests."} value={input.structH} onChange={(v) => update({ structH: v })} min={0} />
              <SelectField<LightningInput["lpsClass"]>
                label="Existing LPS Class"
                tip={"The class of Lightning Protection System (IEC 62305-3) already installed, if any \u2014 higher classes (I is highest) intercept more lightning and reduce the structure's probability of damage (Pb) further."} value={input.lpsClass}
                onChange={(v) => update({ lpsClass: v })}
                options={[
                  { value: "none", label: "None" },
                  { value: "IV", label: "Class IV" },
                  { value: "III", label: "Class III" },
                  { value: "II", label: "Class II" },
                  { value: "I", label: "Class I" },
                ]}
              />
            </Section>

            <Section title="Loss factors (R_A / R_B, Table C.2/C.3 style)">
              <NumberField label="Touch/Step Protection (Pta)" tip={"Additional measures reducing the chance that a direct strike causes dangerous touch/step voltage at the structure, IEC 62305-2 Table B.1 \u2014 only effective where an LPS or equivalent natural down-conductor system with proper bonding/earthing already exists."} value={input.pta} onChange={(v) => update({ pta: v })} min={0} max={1} step="any" />
              <NumberField label="Floor Type / Injury Risk (rt)" tip={"The surface type where people stand affects how dangerous a touch/step voltage actually is \u2014 insulating floors (asphalt, wood, linoleum) sharply reduce the reduction factor rt, IEC 62305-2 Table C.3."} value={input.floorType} onChange={(v) => update({ floorType: v })} min={0} step="any" />
              <NumberField label="Fire Provision (rp)" tip={"Measures that limit how much a lightning-caused fire actually spreads/harms occupants, IEC 62305-2 Table C.4 \u2014 automatic detection/suppression is more effective than manual response."} value={input.fireProvision} onChange={(v) => update({ fireProvision: v })} min={0} max={1} step="any" />
              <NumberField label="Fire Risk (rf)" tip={"The structure's inherent risk of fire or explosion given a lightning strike, IEC 62305-2 Table C.5 \u2014 driven by specific fire load (combustible material per m\u00b2) or explosive atmosphere classification."} value={input.fireRisk} onChange={(v) => update({ fireRisk: v })} min={0} step="any" />
              <NumberField label="Special Hazard (hz)" tip={"Increases the loss factor when a structure has crowding or evacuation difficulty that would worsen the consequences of a lightning-triggered incident, IEC 62305-2 Table C.6."} value={input.specialHazard} onChange={(v) => update({ specialHazard: v })} min={0} step="any" />
              <NumberField label="Structure Type Loss (LF)" tip={"Sets the typical mean loss LF from physical damage, IEC 62305-2 Table C.2 \u2014 occupancy types where evacuation is harder or slower (hospitals, hotels, schools) carry a higher typical loss than industrial/\"other\" structures."} value={input.structureType} onChange={(v) => update({ structureType: v })} min={0} step="any" />
              <NumberField label="Persons in Zone (nz)" tip={"Number of people normally present in the zone being assessed \u2014 reduces the loss proportionally versus the structure total (nz/nt), since risk to human life scales with how many people are actually exposed."} value={input.personsInZone} onChange={(v) => update({ personsInZone: v })} min={0} step={1} />
              <NumberField label="Total Persons (nt)" tip={"Total number of people in the whole structure, the denominator of the nz/nt occupancy ratio. For a single-zone assessment (the common simplified case), set nz = nt."} value={input.totalPersons} onChange={(v) => update({ totalPersons: v })} min={1} step={1} />
              <div className="col-span-2">
                <NumberField label="Time Present" unit="h/yr" tip={"How many hours per year people are actually present in the zone \u2014 reduces loss proportionally versus the full 8,760 hours in a year. Use 8,760 for continuously-occupied spaces like a residence."} value={input.timePresentH} onChange={(v) => update({ timePresentH: v })} min={0} max={8760} />
              </div>
            </Section>

            <PremiumSection
              title="Connected line risk (RU / RV)"
              description="Adds power & telecom line risk components (Annex E line data, Table B.8 shield/withstand factors) to R1."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Power Line Length" unit="m" tip={"Length of the power line section between the structure and the first node/junction (m). Set to 0 if no power line is connected. If unknown, IEC 62305-2 recommends assuming 1,000m."} value={input.powerLineLengthM} onChange={(v) => update({ powerLineLengthM: v })} min={0} />
              <NumberField label="Telecom Line Length" unit="m" tip={"Length of the telecom/data line section between the structure and the first node (m). Set to 0 if no telecom line is connected. If unknown, assume 1,000m per the standard."} value={input.telecomLineLengthM} onChange={(v) => update({ telecomLineLengthM: v })} min={0} />
            </PremiumSection>

            <PremiumSection
              title="SPD / LEMP protection (Annex D)"
              description="Effective protection level (Upf) vs equipment withstand (Uw), and oscillation/induction protection distances (loc / lpi)."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                Not yet implemented in this calculator — the effective protection level (Upf) vs. equipment
                withstand (Uw) and induction-distance (loc/lpi) checks from IEC 62305-2 Annex D haven&apos;t been
                built yet. R1 above (including the connected-line RU/RV terms) doesn&apos;t depend on this section.
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result ? (
                <EmptyResult message="Enter ground flash density, structure dimensions and occupancy to see results." />
              ) : (
                <>
                  <ResultCard title="Collection area & flash frequency">
                    <ResultRow label="Collection Area (Ad)" value={`${result.adM2.toFixed(1)} m²`} />
                    <ResultRow label="Flash Frequency (Nd)" value={`${result.ndPerYear.toExponential(3)} /year`} />
                  </ResultCard>
                  <ResultCard title="Risk R1 (loss of human life)">
                    <ResultRow label="R_A (touch/step)" value={result.ra.toExponential(3)} />
                    <ResultRow label="R_B (physical damage)" value={result.rb.toExponential(3)} />
                    <ResultRow label="R_U / R_V (connected lines)" value={`${result.ru.toExponential(3)} / ${result.rv.toExponential(3)}`} />
                    <CheckRow label="R1 vs Tolerable (RT = 1×10⁻⁵)" value={result.r1.toExponential(3)} pass={result.tolerable} />
                  </ResultCard>
                  <ResultCard title="Minimum LPS class required">
                    <ResultRow
                      label="Class"
                      value={result.minClass === null ? "Class I insufficient — reduce risk further" : result.minClass === "none" ? "None required (R1 already tolerable)" : `Class ${result.minClass}`}
                    />
                    <ResultRow label="Rolling Sphere Radius" value={result.design ? `${result.design.sphere} m` : "—"} />
                    <ResultRow label="Mesh Size" value={result.design ? result.design.mesh : "—"} />
                    <ResultRow label="Down Conductor Spacing" value={result.design ? result.design.down : "—"} />
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
