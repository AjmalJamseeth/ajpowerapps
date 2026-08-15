"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow } from "@/components/fields";
import {
  DEFAULT_CONTROL_CABLE_INPUT,
  ControlCableInput,
  ConductorPurpose,
  calcControlCable,
  EMI_SEPARATION_GUIDANCE,
} from "@/lib/controlcable";

export default function ControlCableSizingPage() {
  const [input, setInput] = useState<ControlCableInput>(DEFAULT_CONTROL_CABLE_INPUT);
  const update = (patch: Partial<ControlCableInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcControlCable(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Control / Instrumentation Cable Sizing
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Capacitance-limited maximum cable length for 4-20mA/HART loops,
          minimum conductor size guidance, and general EMI separation-distance
          practice for routing instrument cable alongside power/VFD cable.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Control / Instrumentation Cable Sizing" standardsLine="HART/4-20mA cable capacitance limits; IEEE 518-style EMI guidance" />
          <FeedbackButton calculatorName="Control / Instrumentation Cable Sizing" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Checks whether a proposed instrument/HART cable run stays within the host system's maximum permitted loop capacitance, recommends a minimum conductor size for the run length, and gives general-practice EMI separation-distance guidance for routing signal cable near power/VFD cable."
            standards={["HART/4-20mA cable capacitance practice (host-specific — no single universal IEC constant)", "General practice consistent with IEEE 518 EMI separation-distance guidance"]}
            capabilities={[
              "Total cable capacitance from cable length and the cable's per-length capacitance rating, checked against the host/multiplexer's maximum system capacitance.",
              "Maximum cable length the host's capacitance budget allows, for the entered cable type.",
              "Minimum conductor size (AWG) recommendation by run length.",
              "General EMI separation-distance guidance for instrument cable routed near VFD/power cable.",
            ]}
            example={{
              problem: "800m of HART cable at 150pF/m, host maximum system capacitance 200nF.",
              steps: [
                "Total cable capacitance = 150 pF/m × 800m = 120,000 pF = 120nF.",
                "120nF ≤ 200nF → within the host's capacitance budget, pass.",
                "Maximum length for this cable/host combination = 200,000nF-equivalent pF ÷ 150 pF/m = 1,333m.",
              ],
              result: "120nF at 800m, well within the 200nF host limit, with headroom to roughly 1,333m before hitting the capacitance ceiling — hand-checked and matched the live code exactly.",
            }}
            notes="HART maximum system capacitance is genuinely host/multiplexer-specific — there is no single universal IEC number, so it must be entered from the host's own datasheet, not assumed. The EMI separation distances shown are commonly-cited general practice figures, not a verified official IEEE 518 numeric matrix — always confirm against your project's actual IEEE 518 edition or site EMI standard for design-critical spacing. Minimum conductor size guidance is general industry practice, not a single hard standard requirement."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Cable & loop">
              <SelectField<ConductorPurpose>
                label="Circuit type"
                value={input.purpose}
                onChange={(v) => update({ purpose: v })}
                options={[
                  { value: "4-20mA", label: "4-20mA analog (non-HART)" },
                  { value: "hart", label: "HART (4-20mA + digital)" },
                  { value: "digital-io", label: "Digital I/O" },
                  { value: "general-signal", label: "General signal cable" },
                ]}
              />
              <NumberField
                label="Cable length"
                unit="m"
                tip="Total length of the instrument cable run."
                value={input.cableLengthM}
                onChange={(v) => update({ cableLengthM: v })}
                min={0}
              />
              <NumberField
                label="Cable capacitance"
                unit="pF/m"
                tip="From the cable's own datasheet — HART-rated cable is often specified at or below 150 pF/m; general instrument cable can be higher."
                value={input.cableCapPfPerM}
                onChange={(v) => update({ cableCapPfPerM: v })}
                min={0}
              />
              <NumberField
                label="Host max system capacitance"
                unit="nF"
                tip="From the HART host/multiplexer/barrier's own datasheet — this is genuinely device-specific, not a single universal IEC number."
                value={input.maxSystemCapacitanceNf}
                onChange={(v) => update({ maxSystemCapacitanceNf: v })}
                min={0}
              />
              <NumberField
                label="Run length (for conductor sizing)"
                unit="m"
                tip="Used only for the minimum conductor size recommendation below."
                value={input.runLengthM}
                onChange={(v) => update({ runLengthM: v })}
                min={0}
              />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <ResultCard title="Capacitance check">
                {result.totalCableCapNf != null && (
                  <ResultRow label="Total cable capacitance" value={`${result.totalCableCapNf.toFixed(1)} nF`} />
                )}
                {result.capacitanceOk !== null && (
                  <CheckRow label="Within host capacitance limit" value={result.capacitanceOk ? "Yes" : "No — exceeds limit"} pass={result.capacitanceOk} />
                )}
                {result.maxLengthForCapacitanceM != null && (
                  <ResultRow label="Max length for this cable/host" value={`${result.maxLengthForCapacitanceM.toFixed(0)} m`} />
                )}
              </ResultCard>

              <ResultCard title="Conductor size">
                <p className="text-sm text-foreground">{result.minConductorAwgRecommendation}</p>
              </ResultCard>

              <ResultCard title="EMI separation guidance (general practice)">
                {EMI_SEPARATION_GUIDANCE.map((g) => (
                  <ResultRow key={g.pairing} label={g.pairing} value={g.distance} />
                ))}
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
