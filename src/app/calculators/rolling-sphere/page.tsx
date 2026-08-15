"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_ROLLING_SPHERE_INPUT, RollingSphereInput, LpsClass, calcRollingSphere } from "@/lib/rollingsphere";

export default function RollingSpherePage() {
  const [input, setInput] = useState<RollingSphereInput>(DEFAULT_ROLLING_SPHERE_INPUT);
  const update = (patch: Partial<RollingSphereInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcRollingSphere(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          LPS Rolling Sphere Method
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Protection radius of a single air-terminal (mast) against a
          rolling sphere of the radius defined by IEC 62305 for the chosen
          LPS class.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="LPS Rolling Sphere Method" standardsLine="IEC 62305 rolling-sphere radii by LPS class" />
          <FeedbackButton calculatorName="LPS Rolling Sphere Method" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes the horizontal protection radius of a single air-terminal (mast) of a given height, against a rolling sphere of the radius defined by IEC 62305 for the chosen Lightning Protection System (LPS) class — using the same rolling-sphere radii already used in the Lightning Protection calculator for consistency."
            standards={["IEC 62305 (protection against lightning) — rolling sphere method, Class I=20m, II=30m, III=45m, IV=60m"]}
            capabilities={[
              "Protection radius from mast height and LPS class, using rp = √(2Rh − h²) — the geometry of a sphere resting on the ground and just touching the tip of the mast.",
              "Flags when mast height exceeds the sphere radius (the simple single-mast formula no longer applies and a multi-terminal/mesh study is required).",
            ]}
            example={{
              problem: "Class III LPS (R=45m), 10m mast.",
              steps: [
                "rp = √(2×45×10 − 10²) = √(900 − 100) = √800 ≈ 28.28m.",
              ],
              result: "≈28.28m protection radius — hand-checked and matched the live code exactly.",
            }}
            notes="This is the single-mast geometry only — for multiple air terminals, a mesh, or a structure taller than the class's sphere radius, a full multi-point rolling-sphere or mesh-method study is required (not covered by this simple formula)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="LPS class & mast">
              <SelectField<LpsClass>
                label="LPS class"
                value={input.lpsClass}
                onChange={(v) => update({ lpsClass: v })}
                options={[
                  { value: "I", label: "Class I (R=20m)" },
                  { value: "II", label: "Class II (R=30m)" },
                  { value: "III", label: "Class III (R=45m)" },
                  { value: "IV", label: "Class IV (R=60m)" },
                ]}
              />
              <NumberField label="Mast height" unit="m" value={input.mastHeightM} onChange={(v) => update({ mastHeightM: v })} min={0} step={0.5} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {input.mastHeightM == null ? (
                <EmptyResult message="Enter a mast height to see the protection radius." />
              ) : result.heightExceedsSphere ? (
                <ResultCard title="Rolling sphere check">
                  <ResultRow label="Sphere radius (this class)" value={`${result.sphereRadiusM} m`} />
                  <ResultRow label="Result" value="Mast height exceeds the sphere radius — single-mast formula doesn't apply; a multi-terminal/mesh study is required." />
                </ResultCard>
              ) : (
                <ResultCard title="Rolling sphere check">
                  <ResultRow label="Sphere radius (this class)" value={`${result.sphereRadiusM} m`} />
                  <ResultRow label="Protection radius" value={`${result.protectionRadiusM!.toFixed(2)} m`} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
