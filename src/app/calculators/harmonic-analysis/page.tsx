"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import {
  DEFAULT_HARMONICS_INPUT,
  HARMONIC_ORDERS,
  HarmonicOrder,
  HarmonicsInput,
  IscIlBand,
  ISC_IL_BAND_LABEL,
  calcHarmonics,
} from "@/lib/harmonics";

const H_VOLTAGE_TIP: Record<number, string> = {"2": "2nd-order voltage harmonic as a % of the fundamental. Even-order harmonics are usually small in a healthy 3-phase system \u2014 a significant value here often points to unbalanced loading, a half-wave rectification fault, or a DC-offset condition.", "3": "3rd-order (triplen) voltage harmonic \u2014 typically the dominant harmonic from single-phase non-linear loads (switch-mode supplies, LED drivers). Triplens add arithmetically (rather than cancel) in a neutral conductor on a 3-phase 4-wire system.", "5": "5th-order voltage harmonic \u2014 the classic dominant harmonic from 6-pulse three-phase rectifiers and VSDs, usually the single largest contributor to VTHD on a drive-heavy system.", "7": "7th-order voltage harmonic \u2014 the other characteristic harmonic of 6-pulse rectifier/VSD loads, second in magnitude after the 5th on most drive-dominated systems.", "9": "9th-order (triplen) voltage harmonic \u2014 less common than the 3rd but from the same class of single-phase/unbalanced non-linear sources.", "11": "11th-order voltage harmonic \u2014 characteristic of 12-pulse rectifier systems (where the 5th and 7th are largely cancelled by the phase-shifting transformer).", "13": "13th-order voltage harmonic \u2014 the other characteristic order for 12-pulse rectifier systems, paired with the 11th."};
const H_CURRENT_TIP: Record<number, string> = {"2": "2nd-order current harmonic as a % of the measured fundamental current \u2014 usually small in a healthy system.", "3": "3rd-order (triplen) current harmonic \u2014 the dominant signature of single-phase non-linear loads. On a 3-phase 4-wire system these sum arithmetically in the neutral rather than cancelling.", "5": "5th-order current harmonic \u2014 the classic dominant order for 6-pulse VSD/rectifier loads.", "7": "7th-order current harmonic \u2014 paired with the 5th as the other characteristic order of 6-pulse rectifier loads.", "9": "9th-order (triplen) current harmonic.", "11": "11th-order current harmonic \u2014 characteristic order for 12-pulse rectifier systems.", "13": "13th-order current harmonic \u2014 paired with the 11th for 12-pulse rectifier systems."};

export default function HarmonicAnalysisPage() {
  const [input, setInput] = useState<HarmonicsInput>(DEFAULT_HARMONICS_INPUT);
  const update = (patch: Partial<HarmonicsInput>) => setInput((prev) => ({ ...prev, ...patch }));
  const updateV = (h: HarmonicOrder, val: number) => setInput((prev) => ({ ...prev, vPct: { ...prev.vPct, [h]: val } }));
  const updateI = (h: HarmonicOrder, val: number) => setInput((prev) => ({ ...prev, iPctOfI1: { ...prev.iPctOfI1, [h]: val } }));

  // Full harmonic breakdown table & K-factor are subscriber features,
  // gated by FREE_LAUNCH (unlocked during the launch promo).
  const result = useMemo(() => calcHarmonics(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Harmonic Analysis Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEEE 519-2014 Table 1 (voltage) &amp; Table 2 (current, TDD-referenced
          to max demand load current I<sub>L</sub>) distortion limit checks.
          Full per-order breakdown table and K-factor estimate are subscriber
          features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Harmonic Analysis Calculator" standardsLine="IEEE 519-2014 Table 1 & 2" />
          <FeedbackButton calculatorName="Harmonic Analysis Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Checks a site's voltage and current harmonic distortion against IEEE 519-2014's limits \u2014 the standard used across North America (and widely referenced elsewhere) to keep non-linear loads (VFDs, rectifiers, switch-mode supplies) from degrading power quality for other customers on the same system."
          standards={["IEEE 519-2014 Table 1 (voltage distortion limits)", "IEEE 519-2014 Table 2 (current distortion limits, TDD-referenced)"]}
          capabilities={["Voltage THD and worst individual-order check against Table 1, banded by bus voltage.", "Current TDD (referenced to maximum demand load current IL) and worst individual-order check against Table 2, banded by Isc/IL ratio.", "Accepts up to 7 individually-entered harmonic orders (2nd-13th) plus a residual term for everything else.", "Subscriber: full per-order breakdown table (% of IL vs. limit) and an approximate transformer K-factor."]}
          example={{ problem: "A 0.4kV bus with an Isc/IL ratio in the 20-50 band shows a 5th voltage harmonic of 2% and a 5th current harmonic of 4% of IL. Check compliance.", steps: ["Table 1 (0.4kV, general system) limits: 5% individual, 8% VTHD.", "Combine all entered orders by RSS to get VTHD \u2248 2.8% \u2014 passes the 8% limit.", "Worst individual voltage order (h5 = 2%) passes the 5% individual limit.", "Table 2 (Isc/IL 20-50 band) individual current limit for h5 is 7% of IL \u2014 the entered 4% passes.", "Combine all current orders by RSS, referenced to IL, to get TDD \u2248 5.330% \u2014 passes the 8% TDD limit for this Isc/IL band."], result: "VTHD 2.8% (pass), ITDD 5.330% (pass), both worst individual orders pass \u2014 matches the calculator's default scenario exactly, including an approximate K-factor \u22481.147 on the subscriber tier." }}
          notes="TDD requires both the measured current (at the time harmonics were recorded) and the maximum demand load current IL \u2014 without IL, the calculator can report ITHD but not the standard's TDD/pass-fail verdict."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="System basis">
              <NumberField label="Bus Voltage" unit="kV" tip={"The nominal system voltage at the Point of Common Coupling (kV) \u2014 selects which row of IEEE 519-2014 Table 1 applies for voltage distortion limits (limits get tighter at higher voltage)."} value={input.busVoltageKv} onChange={(v) => update({ busVoltageKv: v })} min={0} step="any" />
              <SelectField<IscIlBand>
                label="Isc / IL Ratio Band"
                tip={"Ratio of available short-circuit current to maximum demand load current at the PCC \u2014 IEEE 519's measure of supply 'stiffness'. A higher ratio means Table 2's current limits get progressively more generous."} value={input.iscIlBand}
                onChange={(v) => update({ iscIlBand: v })}
                options={([20, 50, 100, 1000, 9999] as IscIlBand[]).map((b) => ({ value: b, label: ISC_IL_BAND_LABEL[b] }))}
              />
              <NumberField label="Measured Current" unit="A" tip={"The actual fundamental (50/60Hz) load current present when the harmonic percentages were measured. Needed to convert the calculated ITHD into the standard's ITDD (relative to maximum demand current)."} value={input.measuredCurrentA} onChange={(v) => update({ measuredCurrentA: v })} min={0} />
              <NumberField label="Max Demand Load Current (IL)" unit="A" tip={"IEEE 519 defines this as the average of the peak demand current over the previous 12 months \u2014 common practice at the design stage is to use the load's maximum rated/operating current instead. Denominator for TDD and Table 2's per-order limits."} value={input.maxDemandCurrentA} onChange={(v) => update({ maxDemandCurrentA: v })} min={0} />
            </Section>

            <Section title="Voltage harmonic spectrum (% of fundamental)">
              {HARMONIC_ORDERS.map((h) => (
                <NumberField key={h} label={`h${h}`} unit="%" tip={H_VOLTAGE_TIP[h]} value={input.vPct[h]} onChange={(v) => updateV(h, v)} min={0} step="any" />
              ))}
              <NumberField label="Residual (h≥15, unlisted)" unit="%" tip={"Combined RSS contribution of all voltage harmonic orders not entered individually (15th and higher, plus skipped even orders) \u2014 leave at 0 if not known."} value={input.vResidualPct} onChange={(v) => update({ vResidualPct: v })} min={0} step="any" />
            </Section>

            <Section title="Current harmonic spectrum (% of I1)">
              {HARMONIC_ORDERS.map((h) => (
                <NumberField key={h} label={`h${h}`} unit="%" tip={H_CURRENT_TIP[h]} value={input.iPctOfI1[h]} onChange={(v) => updateI(h, v)} min={0} step="any" />
              ))}
              <NumberField label="Residual (h≥15, unlisted)" unit="%" tip={"Combined RSS contribution of all current harmonic orders not entered individually \u2014 leave at 0 if not known."} value={input.iResidualPct} onChange={(v) => update({ iResidualPct: v })} min={0} step="any" />
            </Section>

            <PremiumSection
              title="Full breakdown & K-factor"
              description="Per-order % of IL vs Table 2 limit for every entered harmonic, plus an approximate transformer K-factor from the entered current spectrum."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                See the full per-order table and K-factor estimate in the results panel to the right.
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {!result ? (
                <EmptyResult message="Enter the bus voltage and harmonic spectrum to see results." />
              ) : (
                <>
                  <ResultCard title="Voltage distortion (Table 1)">
                    <CheckRow label="VTHD" value={`${result.vthd.toFixed(2)}% (limit ${result.vthdLimit}%)`} pass={result.vthdPass} />
                    <ResultRow label="Worst individual order" value={result.worstV ? `h${result.worstV.h} = ${result.worstV.pct.toFixed(2)}%` : "—"} />
                    <CheckRow label="Individual limit" value={`limit ${result.vIndLimit}%`} pass={result.vIndPass} />
                  </ResultCard>
                  <ResultCard title="Current distortion (Table 2, TDD)">
                    <ResultRow label="ITHD" value={`${result.ithd.toFixed(2)}%`} />
                    <CheckRow
                      label="TDD"
                      value={result.itdd !== null ? `${result.itdd.toFixed(2)}% (limit ${result.itddLimit}%)` : "enter measured & IL current"}
                      pass={result.itddPass}
                    />
                    <ResultRow label="Worst individual order" value={result.worstI ? `h${result.worstI.h} = ${result.worstI.tddPct.toFixed(2)}% of IL` : "—"} />
                    <CheckRow label="Individual limit" value={result.worstI ? `limit ${result.worstI.limit.toFixed(2)}%` : "—"} pass={result.iIndPass} />
                  </ResultCard>
                  <ResultCard title="Full breakdown & K-factor">
                    {result.pro ? (
                      <>
                        {result.pro.rows.map((r) => (
                          <CheckRow
                            key={r.h}
                            label={`h${r.h}`}
                            value={`${r.pctI1}% of I₁${r.pctIL != null ? ` (${r.pctIL.toFixed(2)}% of IL vs ${r.limit.toFixed(2)}% limit)` : " — enter IL for % of IL"}`}
                            pass={r.pass}
                          />
                        ))}
                        <ResultRow label="Approx. K-Factor" value={result.pro.kFactor.toFixed(3)} />
                      </>
                    ) : (
                      <ResultRow label="Breakdown" value="Enter bus voltage and harmonic spectrum to see the full breakdown." />
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
