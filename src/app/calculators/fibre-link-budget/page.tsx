"use client";

import { useMemo } from "react";
import { useShareableInput } from "@/lib/shareState";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow } from "@/components/fields";
import { calcFibreBudget, DEFAULT_FIBRE_BUDGET_INPUT, FIBRES, XCVRS, COMPONENT_LOSS, type FibreBudgetInput, type FibreKey, type XcvrKey, type LossBasis } from "@/lib/fibrebudget";

const db = (x: number) => `${x.toFixed(2)} dB`;

export default function FibreLinkBudgetPage() {
  const [input, setInput] = useShareableInput<FibreBudgetInput>(DEFAULT_FIBRE_BUDGET_INPUT);
  const update = (p: Partial<FibreBudgetInput>) => setInput((prev) => ({ ...prev, ...p }));
  const r = useMemo(() => calcFibreBudget(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Fibre-Optic Link Budget Calculator</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Check whether a fibre link between two switches or IEDs works: transceiver power budget against fibre, connector and splice loss
          plus a safety margin, the reach limit of the Ethernet standard (often the real limit on multimode fibre), and receiver overload on
          short links.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Fibre-Optic Link Budget" standardsLine="IEEE 802.3 (reach), TIA-568.3-D (component loss)" />
          <FeedbackButton calculatorName="Fibre-Optic Link Budget Calculator" />
        </div>
        <div className="mt-6">
          <InfoPanel
            purpose="A fibre link works when the light that reaches the receiver is stronger than the receiver's sensitivity, with enough margin for ageing, repairs and dirty connectors — and when the link is within the distance the Ethernet standard allows for that fibre. On multimode fibre the distance limit comes from modal bandwidth, so a link can have power to spare and still fail."
            standards={["IEEE 802.3 — reach of 100BASE-FX/LX10 and 1000BASE-SX/LX/LX10 by fibre type", "TIA-568.3-D — maximum loss of fibre, connector pairs (0.75 dB) and splices (0.3 dB)", "ITU-T G.652 — typical single-mode attenuation"]}
            capabilities={[
              "Transceiver presets (100BASE-FX, 100BASE-LX10, 1000BASE-SX, -LX, -LX10, vendor ZX) with editable transmit power and receiver sensitivity from the datasheet.",
              "Fibre presets for OS2 single-mode and OM1–OM4 multimode at the right wavelength, or a custom attenuation.",
              "Connector and splice loss on the TIA maximum basis or on typical installed values.",
              "Margin left after a chosen safety margin, worst-case received power, receiver overload check, maximum length by loss and by the standard's reach.",
            ]}
            example={{
              problem: "1000BASE-LX over 3.2 km of OS2 at 1310 nm with 4 connector pairs and 2 splices, 3 dB margin.",
              steps: [
                "Budget = Tx min − Rx sensitivity = −11.5 − (−19) = 7.5 dB.",
                "Loss at TIA maximum: fibre 3.2 × 0.4 = 1.28, connectors 4 × 0.75 = 3.00, splices 2 × 0.3 = 0.60 → 4.88 dB.",
                "Margin left = 7.5 − 4.88 − 3 = −0.38 dB → fails on maximum values.",
                "With typical installed losses (0.5 dB connectors, 0.1 dB splices): 3.48 dB → 1.02 dB left → passes.",
              ],
              result: "Marginal on the worst-case basis. Measure the installed loss (OTDR or loss test set), clean connectors, or use 1000BASE-LX10 (10 dB budget).",
            }}
            notes="Transceiver power figures are representative values. Always use the actual module's datasheet, and verify the installed link with a loss measurement."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Transceiver">
              <SelectField<XcvrKey>
                label="Transceiver / standard"
                value={input.xcvr}
                onChange={(v) => { const x = XCVRS[v]; update({ xcvr: v, txMin: x.txMin, txMax: x.txMax, rxSens: x.rxSens, rxOverload: x.rxOverload }); }}
                options={(Object.keys(XCVRS) as XcvrKey[]).map((k) => ({ value: k, label: XCVRS[k].label }))}
              />
              <NumberField label="Transmit power, minimum" unit="dBm" tip="Minimum average launch power from the datasheet (worst case for the budget)." value={input.txMin} onChange={(v) => update({ txMin: v })} step={0.5} />
              <NumberField label="Receiver sensitivity" unit="dBm" tip="Weakest average received power the receiver works with (datasheet)." value={input.rxSens} onChange={(v) => update({ rxSens: v })} step={0.5} />
              <NumberField label="Transmit power, maximum" unit="dBm" tip="Maximum launch power, used for the overload check." value={input.txMax} onChange={(v) => update({ txMax: v })} step={0.5} />
              <NumberField label="Receiver overload" unit="dBm" tip="Strongest received power the receiver tolerates (datasheet). Short single-mode links with high-power optics can exceed it." value={input.rxOverload} onChange={(v) => update({ rxOverload: v })} step={0.5} />
            </Section>
            <Section title="Fibre and route">
              <SelectField<FibreKey>
                label="Fibre type and wavelength"
                value={input.fibre}
                onChange={(v) => update({ fibre: v, attDbKm: FIBRES[v].att })}
                options={(Object.keys(FIBRES) as FibreKey[]).map((k) => ({ value: k, label: `${FIBRES[k].label}${k !== "custom" ? ` — ${FIBRES[k].att} dB/km` : ""}` }))}
              />
              <NumberField label="Attenuation" unit="dB/km" tip="Cable attenuation at the transceiver wavelength. Defaults are TIA-568.3-D maximum values for multimode and typical ITU-T G.652 values for single-mode; use the cable datasheet where available." value={input.attDbKm} onChange={(v) => update({ attDbKm: v })} step={0.05} min={0} />
              <NumberField label="Link length" unit="km" value={input.lengthKm} onChange={(v) => update({ lengthKm: v })} step={0.1} min={0} />
              <NumberField label="Connector pairs" tip="Mated connector pairs on the link, including patch panels at both ends (a patch cord into a panel at each end is typically 2 pairs, plus any intermediate panels)." value={input.connectors} onChange={(v) => update({ connectors: v })} step={1} min={0} />
              <NumberField label="Splices" tip="Fusion or mechanical splices along the route, including pigtail splices at the panels." value={input.splices} onChange={(v) => update({ splices: v })} step={1} min={0} />
            </Section>
            <Section title="Losses and margin">
              <SelectField<LossBasis>
                label="Connector and splice loss basis"
                value={input.basis}
                onChange={(v) => update({ basis: v, connectorDb: COMPONENT_LOSS[v].connector, spliceDb: COMPONENT_LOSS[v].splice })}
                options={(Object.keys(COMPONENT_LOSS) as LossBasis[]).map((k) => ({ value: k, label: `${COMPONENT_LOSS[k].label} — ${COMPONENT_LOSS[k].connector} / ${COMPONENT_LOSS[k].splice} dB` }))}
              />
              <NumberField label="Loss per connector pair" unit="dB" value={input.connectorDb} onChange={(v) => update({ connectorDb: v })} step={0.05} min={0} />
              <NumberField label="Loss per splice" unit="dB" value={input.spliceDb} onChange={(v) => update({ spliceDb: v })} step={0.05} min={0} />
              <NumberField label="Safety margin" unit="dB" tip="Allowance for ageing, temperature, repair splices and dirty connectors. 3 dB is common practice." value={input.marginDb} onChange={(v) => update({ marginDb: v })} step={0.5} min={0} />
            </Section>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className={`rounded-xl border p-5 ${r.pass ? "border-pass/50 bg-pass/10 text-pass" : "border-fail/50 bg-fail/10 text-fail"}`}>
                <div className="text-xs uppercase tracking-wide opacity-80">Result</div>
                <div className="mt-1 text-lg font-semibold">{r.pass ? `Link works — ${db(r.marginLeftDb)} spare after the margin` : r.reachOk === false ? "Beyond the standard's reach" : r.overload ? "Receiver overload" : `Not enough power — short by ${db(-r.marginLeftDb)}`}</div>
              </div>
              <ResultCard title="Loss budget">
                <ResultRow label="Power budget (Tx min − Rx sensitivity)" value={db(r.budgetDb)} />
                <ResultRow label={`Fibre ${input.lengthKm} km × ${input.attDbKm} dB/km`} value={db(r.fibreLossDb)} />
                <ResultRow label={`Connectors ${input.connectors} × ${input.connectorDb} dB`} value={db(r.connectorLossDb)} />
                <ResultRow label={`Splices ${input.splices} × ${input.spliceDb} dB`} value={db(r.spliceLossDb)} />
                <ResultRow label="Total link loss" value={db(r.totalLossDb)} />
                <ResultRow label="Safety margin" value={db(input.marginDb)} />
                <CheckRow label="Margin left" value={db(r.marginLeftDb)} pass={r.marginLeftDb >= 0} />
              </ResultCard>
              <ResultCard title="Power at the receiver">
                <ResultRow label="Worst case (weakest Tx, full loss)" value={`${r.rxMinDbm.toFixed(1)} dBm`} />
                <CheckRow label="Strongest case vs overload" value={`${r.rxMaxDbm.toFixed(1)} dBm (limit ${input.rxOverload} dBm)`} pass={!r.overload} />
              </ResultCard>
              <ResultCard title="Distance">
                {r.maxLengthByLossKm != null && <ResultRow label="Maximum length by loss" value={`${r.maxLengthByLossKm.toFixed(2)} km`} />}
                <CheckRow label="Reach of the standard on this fibre" value={r.reachKm != null ? `${r.reachKm} km` : "not specified"} pass={r.reachOk} />
                {r.maxLengthKm != null && <ResultRow label="Maximum usable length" value={`${r.maxLengthKm.toFixed(2)} km`} />}
              </ResultCard>
              {r.notes.length > 0 && (
                <ResultCard title="Notes">
                  <ul className="list-disc space-y-1.5 pl-5 text-foreground">{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
