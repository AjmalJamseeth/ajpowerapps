"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, SelectField, Section, ResultCard, ResultRow, CheckRow, EmptyResult } from "@/components/fields";
import {
  ConduitFillInput,
  ConduitType,
  DEFAULT_CONDUITFILL_INPUT,
  IecCableRow,
  IecShape,
  NEC_CONDUIT,
  NecWireRow,
  TRADE_SIZE_ORDER,
  WIRE_SIZE_ORDER,
  WireInsulation,
  WireSize,
  calcConduitFillIec,
  calcConduitFillNec,
} from "@/lib/conduitfill";

const CONDUIT_TYPES: { value: ConduitType; label: string }[] = [
  { value: "EMT", label: "EMT" },
  { value: "RMC", label: "RMC (Rigid Metal)" },
  { value: "IMC", label: "IMC" },
  { value: "PVC40", label: "PVC Schedule 40" },
  { value: "PVC80", label: "PVC Schedule 80" },
  { value: "FMC", label: "FMC (Flexible Metal)" },
  { value: "LFMC", label: "LFMC (Liquidtight Flex)" },
  { value: "ENT", label: "ENT" },
];
const INSULATIONS: { value: WireInsulation; label: string }[] = [
  { value: "THHN", label: "THHN/THWN/THWN-2" },
  { value: "TW", label: "TW" },
  { value: "THW_THHW", label: "THW/THHW/THW-2" },
  { value: "XHHW", label: "XHHW/XHHW-2/XHH" },
  { value: "RHW", label: "RHH/RHW/RHW-2" },
];

export default function ConduitFillPage() {
  const [input, setInput] = useState<ConduitFillInput>(DEFAULT_CONDUITFILL_INPUT);
  const update = (patch: Partial<ConduitFillInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const necResult = useMemo(() => calcConduitFillNec(input), [input]);
  const iecResult = useMemo(() => calcConduitFillIec(input), [input]);

  const tradeSizes = TRADE_SIZE_ORDER.filter((s) => NEC_CONDUIT[input.necConduitType][s] != null);

  const updateNecRow = (i: number, patch: Partial<NecWireRow>) => {
    const rows = input.necWires.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    update({ necWires: rows });
  };
  const addNecRow = () => update({ necWires: [...input.necWires, { insulation: "THHN", size: 12, qty: 0 }] });
  const removeNecRow = (i: number) => update({ necWires: input.necWires.filter((_, idx) => idx !== i) });

  const updateIecRow = (i: number, patch: Partial<IecCableRow>) => {
    const rows = input.iecCables.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    update({ iecCables: rows });
  };
  const addIecRow = () => update({ iecCables: [...input.iecCables, { diaMm: null, qty: 0 }] });
  const removeIecRow = (i: number) => update({ iecCables: input.iecCables.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Conduit Fill Calculator</h1>
        <p className="mt-2 max-w-2xl text-muted">
          NEC Chapter 9 Table 1/4/5 (US) or IEC/BS 7671 45% space-factor
          method (conduit) / 40% (trunking). Free — no subscriber gating.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Conduit Fill Calculator" standardsLine="NEC Chapter 9, IEC/BS 7671 space-factor" />
          <FeedbackButton calculatorName="Conduit Fill Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Checks whether a set of conductors or cables fits within a conduit, tubing, or trunking raceway without exceeding the maximum allowable fill percentage \u2014 the rule that keeps conductors coolable and pullable without insulation damage."
          standards={["NEC Chapter 9 Table 1 (fill percentages)", "NEC Chapter 9 Table 4 (conduit internal area)", "NEC Chapter 9 Table 5 (conductor area)", "IEC / BS 7671 45%/40% space-factor practice"]}
          capabilities={["NEC path: select conduit type & trade size, add any number of conductor rows (insulation + AWG size + quantity), and get the fill percentage against the correct 1/2/3+ conductor fill tier.", "Suggests the minimum standard trade size that keeps the fill percentage compliant.", "IEC/BS 7671 path: circular conduit (45%) or rectangular trunking (40%) space-factor check from actual cable outer diameters.", "Fully free \u2014 no subscriber gate, matching the source app's own tiering."]}
          example={{ problem: "Six 12 AWG THHN conductors are pulled into a 3/4\" EMT conduit. Check the fill percentage.", steps: ["Look up each conductor's individual area from NEC Chapter 9 Table 5 (12 AWG THHN) and sum: total conductor area = 0.0798 in\u00b2.", "With 3+ conductors, the applicable fill tier is 40% of the conduit's internal area.", "3/4\" EMT internal area (Table 4) = 0.533 in\u00b2 \u2192 40% allowable = 0.2132 in\u00b2.", "Fill % = 0.0798 / 0.533 = 14.97%."], result: "14.97% fill, well within the 40% limit \u2014 pass, with 1/2\" EMT suggested as the minimum size that would still work." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Standard basis">
              <SelectField<ConduitFillInput["standard"]>
                label="Standard Basis"
                tip={"NEC Chapter 9 uses fixed conduit/conductor area tables (Table 4/5); IEC/BS 7671 practice uses a simpler 45% (conduit) / 40% (trunking) space-factor rule applied to the raceway's actual cross-sectional area."} value={input.standard}
                onChange={(v) => update({ standard: v })}
                options={[
                  { value: "nec", label: "NEC Chapter 9 (US)" },
                  { value: "iec", label: "IEC / BS 7671 space-factor (International)" },
                ]}
              />
            </Section>

            {input.standard === "nec" ? (
              <>
                <Section title="Conduit">
                  <SelectField<ConduitType>
                    label="Conduit Type"
                    tip={"The raceway material/type \u2014 sets which NEC Chapter 9 Table 4 internal-area column applies (steel EMT/RMC/IMC vs. PVC schedules vs. flexible types each have different internal areas at the same trade size)."} value={input.necConduitType}
                    onChange={(v) => update({ necConduitType: v, necTradeSize: TRADE_SIZE_ORDER.find((s) => NEC_CONDUIT[v][s] != null) || input.necTradeSize })}
                    options={CONDUIT_TYPES}
                  />
                  <SelectField<string>
                    label="Trade Size"
                    tip={"The nominal trade size of the conduit/tubing. Available sizes depend on the type selected above \u2014 not every type is manufactured in every size. Internal area for the selected size/type is taken directly from NEC Chapter 9 Table 4."} value={input.necTradeSize}
                    onChange={(v) => update({ necTradeSize: v })}
                    options={tradeSizes.map((s) => ({ value: s, label: `${s}"` }))}
                  />
                </Section>
                <div className="rounded-xl border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold text-foreground">Conductors</h3>
                  <div className="mt-4 space-y-2">
                    {input.necWires.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1.4fr_1fr_0.7fr_auto] items-end gap-2">
                        <SelectField<WireInsulation> label={i === 0 ? "Insulation" : ""} tip={i === 0 ? "Conductor insulation type — sets which NEC Chapter 9 Table 5 area applies for this conductor." : undefined} value={row.insulation} onChange={(v) => updateNecRow(i, { insulation: v })} options={INSULATIONS} />
                        <SelectField<WireSize> label={i === 0 ? "Size" : ""} tip={i === 0 ? "AWG or kcmil conductor size. NEC 300.17 / Chapter 9 Note 3 requires every current-carrying conductor AND every equipment grounding/bonding conductor pulled into the raceway to be counted — add the ground wire as its own row." : undefined} value={row.size} onChange={(v) => updateNecRow(i, { size: v })} options={WIRE_SIZE_ORDER.map((s) => ({ value: s, label: `${s} AWG` }))} />
                        <NumberField label={i === 0 ? "Qty" : ""} tip={i === 0 ? "How many conductors of this exact insulation type + size are in this conduit run. Leave at 0 for unused rows." : undefined} value={row.qty} onChange={(v) => updateNecRow(i, { qty: v })} min={0} step={1} />
                        <button type="button" onClick={() => removeNecRow(i)} className="mb-0.5 rounded-md border border-border px-2 py-2 text-xs text-muted hover:border-fail/40 hover:text-fail">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={addNecRow} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60">+ Add Conductor</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Section title="Raceway">
                  <SelectField<IecShape>
                    label="Shape"
                    tip={"Circular conduit uses a 45% maximum space factor; rectangular trunking uses 40%, per common IEC/BS 7671 practice."} value={input.iecShape}
                    onChange={(v) => update({ iecShape: v })}
                    options={[
                      { value: "conduit", label: "Conduit (circular, 45%)" },
                      { value: "trunking", label: "Trunking (rectangular, 40%)" },
                    ]}
                  />
                  <div />
                  {input.iecShape === "conduit" ? (
                    <NumberField label="Bore Diameter" unit="mm" tip={"The actual internal diameter of the conduit in mm, from the manufacturer's datasheet for the specific conduit being specified. Bore varies by wall thickness even at the same nominal/trade size, so use the real bore rather than the nominal size."} value={input.iecBoreDiaMm} onChange={(v) => update({ iecBoreDiaMm: v })} min={0} />
                  ) : (
                    <>
                      <NumberField label="Width" unit="mm" tip={"Internal (usable) width of the trunking cross-section, from the manufacturer's datasheet."} value={input.iecWidthMm} onChange={(v) => update({ iecWidthMm: v })} min={0} />
                      <NumberField label="Height" unit="mm" tip={"Internal (usable) height/depth of the trunking cross-section, from the manufacturer's datasheet."} value={input.iecHeightMm} onChange={(v) => update({ iecHeightMm: v })} min={0} />
                    </>
                  )}
                </Section>
                <div className="rounded-xl border border-border bg-surface p-6">
                  <h3 className="text-base font-semibold text-foreground">Cables</h3>
                  <div className="mt-4 space-y-2">
                    {input.iecCables.map((row, i) => (
                      <div key={i} className="grid grid-cols-[1.3fr_0.7fr_auto] items-end gap-2">
                        <NumberField label={i === 0 ? "Cable OD (mm)" : ""} tip={i === 0 ? "Actual overall (outside) diameter of this cable in mm, from the manufacturer's datasheet — there's no single harmonized IEC/BS 7671 diameter table the way NEC Table 5 exists for US building wire." : undefined} value={row.diaMm} onChange={(v) => updateIecRow(i, { diaMm: v })} min={0} step="any" />
                        <NumberField label={i === 0 ? "Qty" : ""} tip={i === 0 ? "How many cables of this exact overall diameter are in this run. Leave at 0 for unused rows." : undefined} value={row.qty} onChange={(v) => updateIecRow(i, { qty: v })} min={0} step={1} />
                        <button type="button" onClick={() => removeIecRow(i)} className="mb-0.5 rounded-md border border-border px-2 py-2 text-xs text-muted hover:border-fail/40 hover:text-fail">✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={addIecRow} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60">+ Add Cable</button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24 space-y-6">
              {input.standard === "nec" ? (
                !necResult ? (
                  <EmptyResult message="Select a conduit and add at least one conductor with quantity > 0." />
                ) : (
                  <ResultCard title="NEC fill result">
                    <ResultRow label="Total Conductors" value={necResult.count} />
                    <ResultRow label="Fill Tier" value={necResult.tierLabel} />
                    <ResultRow label="Sum of Conductor Areas" value={`${necResult.sumArea.toFixed(4)} in²`} />
                    <ResultRow label="Max Allowable Area" value={`${necResult.maxArea.toFixed(4)} in² (of ${necResult.areaTotal.toFixed(4)} in² total)`} />
                    <CheckRow label="Fill %" value={`${necResult.fillPct.toFixed(1)}%`} pass={necResult.pass} />
                    <ResultRow label="Suggested Min. Trade Size" value={necResult.suggestion ? `${necResult.suggestion}" ${input.necConduitType}` : "None in range — reduce conductors or split runs"} />
                  </ResultCard>
                )
              ) : !iecResult ? (
                <EmptyResult message="Enter raceway dimensions and add at least one cable with quantity > 0." />
              ) : (
                <ResultCard title="IEC / BS 7671 fill result">
                  <ResultRow label="Raceway Area" value={`${iecResult.racewayAreaMm2.toFixed(1)} mm²`} />
                  <ResultRow label="Max Fill %" value={`${(iecResult.maxPct * 100).toFixed(0)}%`} />
                  <ResultRow label="Max Allowable Area" value={`${iecResult.maxAreaMm2.toFixed(1)} mm²`} />
                  <ResultRow label="Sum of Cable Areas" value={`${iecResult.sumAreaMm2.toFixed(1)} mm²`} />
                  <CheckRow label="Fill %" value={`${iecResult.fillPct.toFixed(1)}%`} pass={iecResult.pass} />
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
