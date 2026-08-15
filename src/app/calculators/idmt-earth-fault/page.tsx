"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import RelayForm from "@/components/RelayForm";
import { DEFAULT_EF_RELAY_INPUT, EfRelayInput, calcEfRelay } from "@/lib/idmtef";

export default function IdmtEarthFaultPage() {
  const [input, setInput] = useState<EfRelayInput>(DEFAULT_EF_RELAY_INPUT);
  const update = (patch: Partial<EfRelayInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcEfRelay(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          IDMT Earth Fault Relay Setting (50N/51N)
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Earth-fault variant of the IDMT overcurrent relay — same IEC
          60255-151 / IEEE C37.112 curve mathematics, applied to a
          residual/earth-fault CT circuit, plus an optional high-set
          instantaneous stage.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="IDMT Earth Fault Relay Setting (50N/51N)" standardsLine="IEC 60255-151 / IEEE C37.112" />
          <FeedbackButton calculatorName="IDMT Earth Fault Relay Setting (50N/51N)" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Computes the trip time of an earth-fault (50N/51N) IDMT relay at a given earth-fault current, using the same verified IEC 60255-151 / IEEE C37.112 inverse-time curve mathematics as the phase-overcurrent IDMT calculator — only the CT arrangement (residual/core-balance) and typical pickup levels differ, not the underlying curve physics."
            standards={["IEC 60255-151 (measuring relays and protection equipment)", "IEEE C37.112 (inverse-time characteristics for overcurrent relays)"]}
            capabilities={[
              "Plug setting multiplier (PSM) and IDMT operating time from the earth-fault relay's curve family, type, pickup, time dial and CT ratio.",
              "Optional high-set instantaneous earth-fault stage (Ie>>) with its own definite-time delay.",
            ]}
            example={{
              problem: "Relay: IEC SI, pickup 0.2A (secondary), CT ratio 200:1, TMS 0.2. Earth fault current 1500A primary.",
              steps: [
                "Relay current = 1500/200 = 7.5A.",
                "PSM = 7.5/0.2 = 37.5×.",
                "t = TMS × (0.14 / (PSM^0.02 − 1)) = 0.2 × (0.14 / (37.5^0.02 − 1)) ≈ 0.37s.",
              ],
              result: "≈0.37s IDMT operating time — hand-checked against the same verified curve equation used by the phase IDMT calculator.",
            }}
            notes="Reuses the already-verified idmt.ts curve engine directly rather than re-deriving the equations, to avoid a second, potentially-inconsistent implementation."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <RelayForm relay={input.relay} onChange={(relay) => update({ relay })} accentClass="bg-accent" />

            <Section title="Fault current & instantaneous stage">
              <NumberField label="Earth fault current (primary)" unit="A" value={input.faultCurrentPrimary} onChange={(v) => update({ faultCurrentPrimary: v })} min={0} />
              <NumberField label="Instantaneous pickup, Ie&gt;&gt; (primary)" unit="A" tip="High-set instantaneous stage — set to 0 to disable." value={input.instantaneousPickupPrimary} onChange={(v) => update({ instantaneousPickupPrimary: v })} min={0} />
              <NumberField label="Instantaneous time delay" unit="s" value={input.instantaneousTimeS} onChange={(v) => update({ instantaneousTimeS: v })} min={0} step={0.01} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              {result.relayCurrent == null ? (
                <EmptyResult message="Enter an earth fault current to see the relay response." />
              ) : (
                <ResultCard title="Earth fault relay response">
                  <ResultRow label="Relay (secondary) current" value={`${result.relayCurrent.toFixed(2)} A`} />
                  <ResultRow label="Plug setting multiplier" value={`${result.psm!.toFixed(2)}×`} />
                  <ResultRow label="IDMT operating time" value={result.operatingTimeS != null ? `${result.operatingTimeS.toFixed(3)} s` : "No trip (below pickup)"} />
                  {result.instantaneousOperates != null && (
                    <CheckRow label="Instantaneous stage" value={result.instantaneousOperates ? `Operates in ${result.instantaneousTimeS}s` : "Does not operate"} pass={result.instantaneousOperates ? true : null} />
                  )}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
