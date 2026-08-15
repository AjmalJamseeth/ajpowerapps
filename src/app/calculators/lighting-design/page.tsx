"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import { DEFAULT_LIGHTING_INPUT, EmergAreaType, LightingInput, LightingStandard, ROOM_TYPES, calcLighting } from "@/lib/lighting";

export default function LightingDesignPage() {
  const [input, setInput] = useState<LightingInput>(DEFAULT_LIGHTING_INPUT);
  const update = (patch: Partial<LightingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Exterior/area room types and EN 1838 emergency lighting check are
  // subscriber features — never computed on the free site.
  const result = useMemo(() => calcLighting(input, FREE_LAUNCH), [input]);
  const rows = ROOM_TYPES[input.standard];

  const onStandardChange = (std: LightingStandard) => {
    update({ standard: std, roomTypeIndex: 0, targetE: ROOM_TYPES[std][0].lux });
  };
  const onRoomTypeChange = (idx: number) => {
    const row = ROOM_TYPES[input.standard][idx];
    update({ roomTypeIndex: idx, targetE: row ? row.lux : input.targetE });
  };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Lighting Design Calculator</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Lumen method (EN 12464-1 or IES Handbook). Interior room types are
          free — exterior/area lighting and EN 1838 emergency lighting checks
          are subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Lighting Design Calculator" standardsLine="EN 12464-1, IES Handbook, EN 1838" />
          <FeedbackButton calculatorName="Lighting Design Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes the number of luminaires needed to hit a target maintained illuminance in a room, using the standard lumen method \u2014 and, on the subscriber tier, checks measured emergency/escape lighting illuminance against EN 1838's minimum and uniformity-ratio requirements."
          standards={["EN 12464-1 (interior lighting of work places)", "IES Lighting Handbook (US)", "EN 1838 (emergency lighting)"]}
          capabilities={["Interior room-type presets with standard representative illuminance targets (EN 12464-1 or IES).", "Room Index (K), exact and rounded-up required luminaire count, and achieved illuminance from the rounded count.", "Subscriber: exterior/area room types (car parks, building exteriors).", "Subscriber: EN 1838 escape-route/anti-panic/high-risk-area minimum illuminance and uniformity-ratio pass/fail check."]}
          example={{ problem: "A 10m \u00d7 8m office needs a maintained 500 lux, using luminaires rated 5,000 lm each, with utilization factor 0.6 and maintenance factor 0.8.", steps: ["Room area = 10 \u00d7 8 = 80 m\u00b2.", "Room Index K = (L\u00d7W) / (Hm\u00d7(L+W)) \u2014 with a typical mounting height, K \u2248 1.778.", "Exact luminaire count N = (E \u00d7 Area) / (Flux \u00d7 UF \u00d7 MF) = (500 \u00d7 80) / (5000 \u00d7 0.6 \u00d7 0.8) \u2248 22.73.", "Round up to a whole number of luminaires: N = 23.", "Achieved illuminance with 23 luminaires \u2248 506 lux."], result: "23 luminaires required, achieving 506 lux against the 500 lux target \u2014 matches the calculator's default scenario exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Room & target">
              <SelectField<LightingStandard> label="Standard Basis" tip={"EN 12464-1 (Europe/IEC) and the IES Lighting Handbook (US) publish different representative maintained-illuminance targets for the same room type \u2014 pick the framework your project follows."} value={input.standard} onChange={onStandardChange} options={[
                { value: "en", label: "EN 12464-1 (Europe/IEC)" },
                { value: "ies", label: "IES Lighting Handbook (US)" },
              ]} />
              <SelectField<number> label="Room / Area Type" tip={"Selecting a type auto-fills the Target Illuminance field with the standard's representative maintained-illuminance value for that space. You can still edit the value afterward."} value={input.roomTypeIndex} onChange={onRoomTypeChange} options={rows.map((r, i) => ({ value: i, label: `${r.label} — ${r.lux} lux` }))} />
              <div className="col-span-2">
                <NumberField label="Target Maintained Illuminance" unit="lux" tip={"The average illuminance (lux) to be maintained on the working plane over the maintenance cycle \u2014 the design target the lumen method solves for. Auto-filled from the Room/Area Type selection, but editable."} value={input.targetE} onChange={(v) => update({ targetE: v })} min={0} />
              </div>
              <NumberField label="Length" unit="m" tip={"Room length \u2014 used for area and Room Index."} value={input.lengthM} onChange={(v) => update({ lengthM: v })} min={0} />
              <NumberField label="Width" unit="m" tip={"Room width \u2014 used for area and Room Index."} value={input.widthM} onChange={(v) => update({ widthM: v })} min={0} />
              <div className="col-span-2">
                <NumberField label="Mounting Height Above Working Plane" unit="m" tip={"Height of the luminaire above the WORKING PLANE (typically desk height, \u22480.85m above floor for offices) \u2014 not the height above the floor. Used in the Room Index formula K = (L\u00d7W) / (Hm\u00d7(L+W))."} value={input.mountHeightM} onChange={(v) => update({ mountHeightM: v })} min={0.1} />
              </div>
            </Section>

            <Section title="Luminaire">
              <NumberField label="Flux per Luminaire" unit="lm" tip={"Total light output (lumens) of ONE luminaire, from the manufacturer's datasheet \u2014 for LED fixtures this is usually stated directly; for lamp-in-fitting designs, multiply lamp lumens \u00d7 number of lamps per fitting."} value={input.fluxLm} onChange={(v) => update({ fluxLm: v })} min={0} />
              <NumberField label="Utilization Factor (0-1)" tip={"Fraction of luminaire flux that actually reaches the working plane, accounting for room reflectances and geometry (from the luminaire manufacturer's UF table against Room Index K)."} value={input.utilizationFactor} onChange={(v) => update({ utilizationFactor: v })} min={0} max={1} step="any" />
              <div className="col-span-2">
                <NumberField label="Maintenance Factor (0-1)" tip={"Fraction of initial illuminance still delivered after the maintenance cycle (lamp lumen depreciation, dirt accumulation) \u2014 the lumen method sizes for maintained, not initial, illuminance."} value={input.maintenanceFactor} onChange={(v) => update({ maintenanceFactor: v })} min={0} max={1} step="any" />
              </div>
            </Section>

            <PremiumSection
              title="Emergency / escape lighting (EN 1838)"
              description="Checks measured minimum & maximum illuminance against EN 1838 requirements for escape routes, open areas, or high-risk task areas."
              unlocked={FREE_LAUNCH}
            >
              <SelectField<EmergAreaType> label="Area Type" tip={"EN 1838 sets different minimum-illuminance and uniformity requirements depending on the function of the space during a power failure."} value={input.emergType} onChange={(v) => update({ emergType: v })} options={[
                { value: "escape", label: "Escape Route (≤2m wide)" },
                { value: "antipanic", label: "Open Area / Anti-Panic (>60 m²)" },
                { value: "highrisk", label: "High-Risk Task Area" },
              ]} />
              <div />
              <NumberField label="Measured Min. Illuminance" unit="lux" tip={"The lowest horizontal illuminance (lux) achieved anywhere in the relevant zone, from your photometric layout or an on-site meter reading \u2014 compared against the EN 1838 minimum for the selected area type."} value={input.emergMeasuredMin} onChange={(v) => update({ emergMeasuredMin: v })} min={0} step="any" />
              <NumberField label="Measured Max. Illuminance" unit="lux" tip={"The highest horizontal illuminance (lux) in the same zone \u2014 used with the minimum to check the EN 1838 uniformity ratio (Emax:Emin)."} value={input.emergMeasuredMax} onChange={(v) => update({ emergMeasuredMax: v })} min={0} step="any" />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result || result.areaM2 === null ? (
                <EmptyResult message="Enter target illuminance, room dimensions and luminaire data to see results." />
              ) : (
                <>
                  <ResultCard title="Lumen method result">
                    <ResultRow label="Room Area" value={`${result.areaM2.toFixed(1)} m²`} />
                    <ResultRow label="Room Index (K)" value={result.roomIndexK !== null ? result.roomIndexK.toFixed(2) : "—"} />
                    <ResultRow label="Required Luminaires (N)" value={result.nRequired !== null ? `${result.nRequired} (exact ${result.nExact?.toFixed(2)})` : "—"} />
                    <ResultRow label="Achieved Illuminance (rounded N)" value={result.achievedLux !== null ? `${result.achievedLux.toFixed(0)} lux` : "—"} />
                  </ResultCard>
                  <ResultCard title="Emergency lighting check">
                    {!result.emerg ? (
                      <ResultRow label="Emergency lighting check" value="—" />
                    ) : (
                      <>
                        <ResultRow label="EN 1838 Required Minimum" value={`${result.emerg.reqMin} lux (${result.emerg.other})`} />
                        <ResultRow label="Max Uniformity Ratio" value={`${result.emerg.reqUniformity}:1`} />
                        <CheckRow label="Minimum Illuminance Check" value={input.emergMeasuredMin != null ? `${input.emergMeasuredMin} lux measured` : "enter measured min."} pass={result.emerg.minCheck} />
                        <CheckRow label="Uniformity Check" value={result.emerg.uniformityRatio != null ? `${result.emerg.uniformityRatio.toFixed(2)}:1 measured` : "enter measured max."} pass={result.emerg.uniformityCheck} />
                      </>
                    )}
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
