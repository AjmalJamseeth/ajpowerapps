"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_SOLAR_TILT_ANGLE_INPUT, SolarTiltAngleInput, TiltMode, calcSolarTiltAngle } from "@/lib/solarTiltAngle";

export default function SolarPanelTiltAnglePage() {
  const [input, setInput] = useState<SolarTiltAngleInput>(DEFAULT_SOLAR_TILT_ANGLE_INPUT);
  const update = (patch: Partial<SolarTiltAngleInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcSolarTiltAngle(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Solar Panel Tilt Angle Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Recommended fixed-mount PV tilt angle from site latitude, for
          year-round, summer-biased, or winter-biased production.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Solar Panel Tilt Angle Calculator" standardsLine="Widely published rule-of-thumb: tilt ≈ latitude (year-round), latitude±15° (seasonal bias)" />
          <FeedbackButton calculatorName="Solar Panel Tilt Angle Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Recommends a fixed-mount PV array tilt angle from the site's latitude, using the widely published rule-of-thumb relationships: tilt equal to latitude for balanced year-round (or two-season) production, latitude+15° when biasing toward winter output (compensating for the sun's lower angle), and latitude−15° when biasing toward summer output."
            standards={["Widely published PV tilt rule-of-thumb: tilt ≈ latitude (year-round); latitude±15° (seasonal bias) — a practical approximation, not an exact analytical optimum"]}
            capabilities={[
              "Year-round, two-season, summer-biased, and winter-biased tilt recommendations from latitude.",
              "Latitude regime classification (EQUATORIAL to POLAR) for quick site context.",
            ]}
            example={{
              problem: "35° latitude site, year-round optimization.",
              steps: ["Recommended tilt ≈ latitude = 35°"],
              result: "35° tilt — MID-LATITUDE regime.",
            }}
            notes="This is a widely used rule-of-thumb, not the output of a full solar-resource/irradiance simulation — actual optimal tilt is also influenced by local cloud cover patterns, snow shedding needs, and racking/structural constraints. For performance-critical designs, cross-check against a site-specific simulation (e.g. PVsyst, NREL PVWatts) or the array manufacturer's guidance."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Site & optimization target">
              <NumberField label="Site latitude" tip="Absolute value — hemisphere doesn't change the tilt magnitude, only the array's compass orientation (south-facing in the northern hemisphere, north-facing in the southern)." unit="°" value={input.latitudeDeg} onChange={(v) => update({ latitudeDeg: v })} min={0} max={90} step={0.5} />
              <SelectField<TiltMode>
                label="Optimization target"
                value={input.mode}
                onChange={(v) => update({ mode: v })}
                options={[
                  { value: "yearRound", label: "Year-round (tilt ≈ latitude)" },
                  { value: "twoSeason", label: "Two-season (spring/fall, tilt ≈ latitude)" },
                  { value: "summer", label: "Summer-biased (tilt ≈ latitude − 15°)" },
                  { value: "winter", label: "Winter-biased (tilt ≈ latitude + 15°)" },
                ]}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.recommendedTiltDeg == null ? (
                <EmptyResult message="Enter the site latitude to see the recommended tilt angle." />
              ) : (
                <ResultCard title="Recommended tilt">
                  <ResultRow label="Recommended tilt angle" value={`${result.recommendedTiltDeg.toFixed(1)}°`} />
                  <ResultRow label="Latitude regime" value={result.latitudeRegime!} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
