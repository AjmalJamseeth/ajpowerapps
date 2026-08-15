"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow } from "@/components/fields";
import { DEFAULT_EMERGENCYPOWER_INPUT, EmergencyPowerInput, EpsPriority, LoadStep, calcEmergencyPower } from "@/lib/emergencypower";

export default function EmergencyPowerPage() {
  const [input, setInput] = useState<EmergencyPowerInput>(DEFAULT_EMERGENCYPOWER_INPUT);
  const update = (patch: Partial<EmergencyPowerInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const updateStep = (i: number, patch: Partial<LoadStep>) => update({ steps: input.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  const result = useMemo(() => calcEmergencyPower(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Emergency Power (Genset+UPS) Load Sequencing</h1>
        <p className="mt-2 max-w-2xl text-muted">
          NFPA 110 Type/Class classification, UPS-to-genset bridge timing
          check, and staged load-step pickup planner.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Emergency Power (Genset+UPS) Load Sequencing" standardsLine="NFPA 110, ISO 8528" />
          <FeedbackButton calculatorName="Emergency Power (Genset+UPS) Load Sequencing" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Plans and checks emergency/standby power system design against NFPA 110's Type/Class classification framework: whether a UPS can bridge the gap until the generator is ready (the 'bridge check'), and whether a staged sequence of load steps can be picked up by the generator without exceeding its single-step acceptance limit or violating NFPA 110's priority-order (700/701/702) restoration-time requirements."
          standards={["NFPA 110 (emergency and standby power systems)", "ISO 8528 (reciprocating internal combustion engine driven AC generating sets, referenced by the general method)"]}
          capabilities={["NFPA 110 Type classification from required maximum interruption time, and Class from required minimum runtime.", "UPS-to-generator bridge timing check: genset ready time (start delay + crank-to-rated + transfer time) versus available UPS/battery autonomy, with a 25% margin flag.", "Staged load-step pickup planner checking single-step generator acceptance percentage, cumulative loading, and NFPA 110 priority-order (700 emergency / 701 legally-required standby / 702 optional standby) sequencing."]}
          example={{ problem: "A Level 1 facility requires a maximum 10-second interruption and 48-hour minimum runtime. The genset takes 1.5s ATS start delay + 10s crank-to-rated + 0.3s transfer time, bridged by a UPS with 30s of autonomy. Three load steps of 50kW, 130kW and 280kW connect in priority order.", steps: ["10s max interruption \u2192 NFPA 110 Type 10.", "48h min runtime \u2192 NFPA 110 Class 48.", "Genset ready time = 1.5 + 10 + 0.3 = 11.8s.", "Bridge check: 11.8s required vs. 30s UPS autonomy available \u2014 passes, with (30\u221211.8)/11.8 \u2248 154% margin (well above the 25% flag threshold).", "Load steps connect in ascending priority order (emergency \u2192 legal \u2192 optional) with no step exceeding the generator's single-step acceptance limit."], result: "Type 10 / Class 48 classification, bridge check passes with >25% margin, load sequence has no priority-order or step-size warnings \u2014 matches the calculator's default scenario exactly." }}
          notes="This calculator is entirely a subscriber feature in the source app; it's unlocked here for free during launch (see the banner at the top of the site for the current promo window)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Classification (NFPA 110 Type/Class)">
              <SelectField<EmergencyPowerInput["standard"]> label="Standard Basis" tip={"NFPA 110 (US) classifies systems by named Type/Class letters; the general method instead checks the same timing/runtime requirements directly (ISO 8528-aligned) without the NFPA label."} value={input.standard} onChange={(v) => update({ standard: v })} options={[
                { value: "nfpa", label: "NFPA 110 (US)" },
                { value: "general", label: "General method (IEC/ISO 8528-aligned)" },
              ]} />
              <SelectField<EmergencyPowerInput["level"]> label="EPSS Level" tip={"NFPA 110 Level 1 systems are required where failure could result in loss of life or serious injury (hospitals, life-safety systems); Level 2 covers less-critical applications with more relaxed installation/testing requirements."} value={input.level} onChange={(v) => update({ level: v })} options={[
                { value: "1", label: "Level 1 — life-safety critical" },
                { value: "2", label: "Level 2 — less critical" },
              ]} />
              <NumberField label="Req'd Max Interruption" unit="s" tip={"The longest time your application can tolerate being without power after a utility failure, before life-safety or process risk becomes unacceptable \u2014 the design requirement the NFPA 110 \"Type\" classification (or the bridge-check target) must meet or beat."} value={input.maxInterruptS} onChange={(v) => update({ maxInterruptS: v })} min={0} step="any" />
              <NumberField label="Req'd Min Runtime" unit="h" tip={"The minimum duration the emergency power supply must sustain full rated load without refueling or recharging \u2014 the design requirement the NFPA 110 \"Class\" classification must meet or beat. NFPA 110 7.9 also requires main fuel tanks be sized at a minimum of 133% of the Class runtime's fuel consumption."} value={input.minRuntimeH} onChange={(v) => update({ minRuntimeH: v })} min={0} step="any" />
            </Section>

            <Section title="UPS-to-genset bridge check">
              <NumberField label="ATS Start Delay" unit="s" tip={"Deliberate delay before the ATS signals the generator to start after detecting a utility outage \u2014 commonly a fraction of a second to a few seconds, to ride through brief utility blips without starting the genset unnecessarily."} value={input.atsStartDelayS} onChange={(v) => update({ atsStartDelayS: v })} min={0} step="any" />
              <NumberField label="Genset Crank-to-Rated" unit="s" tip={"Time from the generator receiving a start signal to reaching rated voltage/frequency and being ready to accept load \u2014 from the genset manufacturer's datasheet, typically 8-15 seconds for a diesel standby set."} value={input.crankToRatedS} onChange={(v) => update({ crankToRatedS: v })} min={0} step="any" />
              <NumberField label="ATS Transfer Time" unit="s" tip={"The mechanical/electrical operating time of the transfer switch itself once it decides to transfer \u2014 typically well under a second (a few power-line cycles) for open-transition switches. Confirm against the specific transfer switch's listed operating time."} value={input.atsTransferTimeS} onChange={(v) => update({ atsTransferTimeS: v })} min={0} step="any" />
              <NumberField label="UPS/Battery Autonomy" unit="s" tip={"How long the UPS can bridge the load on battery alone, from utility loss until the generator is ready and transferred \u2014 must exceed the genset's total ready time (start delay + crank-to-rated + transfer time) with margin."} value={input.upsAutonomyS} onChange={(v) => update({ upsAutonomyS: v })} min={0} step="any" />
            </Section>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-foreground">Staged load-step pickup planner</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <NumberField label="Generator Rated Output" unit="kW" tip={"The generator's continuous (or standby, per its nameplate/ISO 8528 rating class) real-power output rating \u2014 the ceiling that total connected/sequenced load must never exceed once fully stepped on."} value={input.genRatedKw} onChange={(v) => update({ genRatedKw: v })} min={0} />
                <NumberField label="Max Single-Step Acceptance" unit="%" tip={"The largest single load block the generator can accept in one step without excessive frequency/voltage dip or stalling \u2014 from the genset manufacturer's step-load acceptance curve, commonly 25-40% of rated kW for a single step."} value={input.maxStepPct} onChange={(v) => update({ maxStepPct: v })} min={0} max={100} step="any" />
              </div>
              <div className="mt-4 space-y-2">
                {input.steps.map((s, i) => (
                  <div key={i} className="grid grid-cols-[1.6fr_1.3fr_0.8fr_0.9fr] items-end gap-2">
                    <div>
                      <label className="block text-xs font-medium text-muted">{i === 0 ? "Description" : ""}</label>
                      <input value={s.desc} onChange={(e) => updateStep(i, { desc: e.target.value })} className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground" />
                    </div>
                    <SelectField<EpsPriority> label={i === 0 ? "Priority" : ""} tip={i === 0 ? "Which NEC branch this load belongs to — determines both the required connection-time ceiling and its correct position in the shed/restore sequence relative to other loads." : undefined} value={s.priority} onChange={(v) => updateStep(i, { priority: v })} options={[
                      { value: "emergency", label: "Emergency (700)" },
                      { value: "legal", label: "Legal Standby (701)" },
                      { value: "optional", label: "Optional (702)" },
                    ]} />
                    <NumberField label={i === 0 ? "kW" : ""} tip={i === 0 ? "The real-power block this step adds to the bus when it connects." : undefined} value={s.kw} onChange={(v) => updateStep(i, { kw: v })} min={0} step="any" />
                    <NumberField label={i === 0 ? "Time (s)" : ""} tip={i === 0 ? "Seconds after the generator is ready and transferred that this step connects. Enter steps in ascending time order — the planner checks higher-priority loads never connect later than lower-priority ones." : undefined} value={s.timeS} onChange={(v) => updateStep(i, { timeS: v })} min={0} step="any" />
                  </div>
                ))}
                <div className="flex gap-2">
                  <button type="button" onClick={() => update({ steps: [...input.steps, { desc: `Load ${input.steps.length + 1}`, priority: "optional", kw: null, timeS: null }] })} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60">+ Add Load</button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              <ResultCard title="Classification result">
                <ResultRow label="NFPA 110 Type" value={result.type ?? "— (enter interruption time; general method has no Type label)"} />
                <ResultRow label="NFPA 110 Class" value={result.class ?? "— (enter runtime; general method has no Class label)"} />
                {result.typeCompare !== null && (
                  <CheckRow label="Genset Ready ≤ Required Interruption" value={`${result.gensetReadyS?.toFixed(2)}s vs ${input.maxInterruptS}s`} pass={result.typeCompare} />
                )}
              </ResultCard>
              <ResultCard title="Bridge check result">
                <ResultRow label="Genset Ready Time" value={result.gensetReadyS != null ? `${result.gensetReadyS.toFixed(2)} s` : "—"} />
                <CheckRow
                  label="Bridge Check"
                  value={result.bridgeStatus == null ? "—" : result.bridgeStatus === "pass" ? `passes (≥25% margin, needs ${result.bridgeMargin?.toFixed(2)}s)` : result.bridgeStatus === "marginal" ? `marginal — under 25% margin (needs ${result.bridgeMargin?.toFixed(2)}s for full margin)` : `fails — UPS autonomy below genset ready time`}
                  pass={result.bridgeStatus == null ? null : result.bridgeStatus === "pass" ? true : result.bridgeStatus === "marginal" ? null : false}
                />
              </ResultCard>
              <ResultCard title="Load-step sequence result">
                {result.stepLines.length === 0 ? (
                  <ResultRow label="Sequence" value="Enter generator rating, max step % and at least one load step (kW > 0)." />
                ) : (
                  result.stepLines.map((l, i) => <ResultRow key={i} label={l} value="" />)
                )}
                {result.warnings.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-border pt-2">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-fail">⚠ {w}</p>
                    ))}
                  </div>
                )}
              </ResultCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
