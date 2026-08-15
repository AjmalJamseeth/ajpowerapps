"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, CheckRow, EmptyResult } from "@/components/fields";
import { DEFAULT_STATIC_BONDING_INPUT, StaticBondingInput, calcStaticBonding } from "@/lib/staticbonding";

export default function StaticBondingPage() {
  const [input, setInput] = useState<StaticBondingInput>(DEFAULT_STATIC_BONDING_INPUT);
  const update = (patch: Partial<StaticBondingInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcStaticBonding(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Hazardous Area Bonding &amp; Static Grounding Check
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Checks a measured bonding/grounding resistance-to-ground against
          the commonly-cited threshold for adequate static-electricity
          dissipation.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Hazardous Area Bonding & Static Grounding Check" standardsLine="NFPA 77 static-dissipation guidance" />
          <FeedbackButton calculatorName="Hazardous Area Bonding & Static Grounding Check" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks a measured bonding/grounding connection's resistance-to-ground (e.g. at a tank truck/rail car loading rack, drum-filling station, or other flammable-liquid transfer bonding point) against the commonly-cited threshold for adequate static-electricity dissipation, and flags whether an unusually high (but still 'passing') reading might indicate a connection problem worth investigating."
            standards={["NFPA 77 (Recommended Practice on Static Electricity) — the commonly-cited 1 megohm (1×10⁶Ω) threshold for adequate static-charge dissipation"]}
            capabilities={[
              "Pass/fail check of measured resistance against the (adjustable) static-dissipation threshold, defaulting to NFPA 77's commonly-cited 1 megohm.",
              "Quality flag distinguishing a tight all-metal bond (≤10Ω) from a merely-adequate-for-static-dissipation reading, since a high reading on what should be an all-metal path often indicates corrosion or a loose connection even though it still numerically passes.",
            ]}
            example={{
              problem: "A tank truck bonding cable measures 25,000Ω to the grounding grid.",
              steps: [
                "25,000Ω is well below the 1,000,000Ω (1 megohm) NFPA 77 threshold for static dissipation.",
                "It's also well above the ≤10Ω expected of a tight all-metal path, suggesting some resistance in the connection (e.g. a clamp with light corrosion) — still functionally adequate for static dissipation, but worth a look.",
              ],
              result: "Passes the static-dissipation threshold, flagged as 'acceptable' rather than 'tight metallic bond' — hand-checked and matched the live code exactly.",
            }}
            notes="1 megohm is the commonly-cited NFPA 77 threshold specifically for static-charge dissipation — it is NOT an equipment-grounding (fault-current) requirement, which needs a much lower, low-impedance path. Don't use this threshold for equipotential bonding required for electrical safety/fault-clearing purposes — those systems are properly all-metal, low-resistance connections (typically well under 10Ω)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Measurement">
              <NumberField label="Measured resistance to ground" unit="Ω" value={input.measuredResistanceOhms} onChange={(v) => update({ measuredResistanceOhms: v })} min={0} />
              <NumberField label="Static-dissipation threshold" unit="Ω" tip="Defaults to the commonly-cited NFPA 77 figure of 1,000,000Ω (1 megohm) — adjust if your site procedure specifies a different limit." value={input.thresholdOhms} onChange={(v) => update({ thresholdOhms: v })} min={0} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.pass == null ? (
                <EmptyResult message="Enter a measured resistance to see the static-dissipation check." />
              ) : (
                <ResultCard title="Result">
                  <CheckRow label="Adequate for static dissipation" value={`${input.measuredResistanceOhms?.toLocaleString()} Ω`} pass={result.pass} />
                  <p className="pt-2 text-xs text-muted">{result.qualityNote}</p>
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
