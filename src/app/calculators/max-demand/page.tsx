"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { NumberField, SelectField, Section } from "@/components/fields";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import PremiumSection from "@/components/PremiumSection";
import MaxDemandResults from "@/components/maxdemand/MaxDemandResults";
import {
  CATEGORIES,
  CategoryInput,
  DEFAULT_MAXDEMAND_INPUT,
  Phase,
  calcMaxDemand,
} from "@/lib/maxdemand";

const CAT_LOAD_TIP: Record<string, string> = {"lighting": "Sum of all installed lighting circuit ratings. Modern LED lighting is far more diversity-tolerant than old incandescent loads, but a demand factor still applies since not every fitting operates at the same instant.", "sockets": "Sum of all general-purpose socket outlet circuit ratings \u2014 office equipment, small appliances, general power points.", "hvac": "Sum of all air conditioning and mechanical ventilation load ratings.", "heating": "Sum of all space heating and water heating load ratings \u2014 resistive heating loads are typically thermostatically cycled, but individual water heaters can draw full rated power for extended periods.", "motors": "Sum of all motor load ratings, at their rated (not starting) power. Motor starting current diversity is a separate, short-duration concern handled at the protection/short-circuit level, not here.", "cooking": "Sum of all cooking appliance load ratings \u2014 commercial kitchen equipment or domestic cooking circuits.", "ev": "Sum of all EV charge point ratings \u2014 pulled through from the same convention used in the EV Charging calculator.", "other": "Any connected load not covered by the categories above (lifts, standby systems, process equipment, etc.)."};
const CAT_DF_TIP: Record<string, string> = {"lighting": "IEC 60439 guidance suggests 90% for lighting on distribution switchboards. Use 100% for small installations or safety/emergency lighting where near-simultaneous operation is realistic.", "sockets": "IEC 60439 guidance suggests 70% for socket outlet circuits, reflecting that not every outlet is loaded to its rated current simultaneously.", "hvac": "IEC 60439 guidance suggests 80% for HVAC loads \u2014 some non-coincidence exists between zones, but HVAC runs closer to fully loaded than lighting or sockets during peak conditions.", "heating": "Commonly taken at 100% since heating loads, once calling for heat, draw their full connected rating \u2014 apply a lower factor only with specific evidence of non-coincident operation.", "motors": "A commonly-cited industrial average is around 75%, but this varies enormously by process \u2014 continuous-duty process motors may run at 90-100%, intermittent-duty motors can be much lower.", "cooking": "Cooking equipment has strong diversity in most codes since not every appliance in a kitchen runs at full power simultaneously \u2014 cross-check against your governing code's detailed cooking-equipment table for large kitchens.", "ev": "IEC 60364-7-722 Clause 722.311 requires a diversity factor of 1 (100%) unless a Load Management System (LMS) is installed and its declared factor is used instead. Do not reduce below 100% without a documented LMS.", "other": "Default 100% (no diversity assumed) \u2014 reduce only where you have specific justification for the load category in question."};

export default function MaxDemandPage() {
  const [supplyVoltage, setSupplyVoltage] = useState(DEFAULT_MAXDEMAND_INPUT.supplyVoltage);
  const [phase, setPhase] = useState<Phase>(DEFAULT_MAXDEMAND_INPUT.phase);
  const [powerFactor, setPowerFactor] = useState(DEFAULT_MAXDEMAND_INPUT.powerFactor);
  const [categories, setCategories] = useState<CategoryInput[]>(DEFAULT_MAXDEMAND_INPUT.categories);

  const [numBoards, setNumBoards] = useState(DEFAULT_MAXDEMAND_INPUT.numBoards);
  const [siteDiversityPct, setSiteDiversityPct] = useState(DEFAULT_MAXDEMAND_INPUT.siteDiversityPct);
  const [growthMarginPct, setGrowthMarginPct] = useState(DEFAULT_MAXDEMAND_INPUT.growthMarginPct);

  const updateCategory = (key: string, patch: Partial<CategoryInput>) => {
    setCategories((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  };

  const result = useMemo(
    () =>
      calcMaxDemand({
        supplyVoltage,
        phase,
        powerFactor,
        categories,
        premiumEnabled: FREE_LAUNCH, // multi-board/transformer sizing is a subscriber feature — preview only
        numBoards,
        siteDiversityPct,
        growthMarginPct,
      }),
    [supplyVoltage, phase, powerFactor, categories, numBoards, siteDiversityPct, growthMarginPct]
  );

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Maximum Demand Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Load-category demand-factor method — connected load and demand
          factor per category, diversified maximum demand, design current
          and recommended main switch size.
        </p>

<div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Maximum Demand Calculator" standardsLine="IEC 60439 demand-factor guidance" />
          <FeedbackButton calculatorName="Maximum Demand Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose={"Estimates a facility's diversified maximum demand from a load-category schedule — the design current and switchgear/transformer sizing basis, rather than sizing for the (much higher, unrealistic) sum of every connected load's full nameplate rating simultaneously."}
          standards={["IEC 60439 (demand-factor guidance by load category)", "IEC 60364-7-722 (EV charging diversity requirements)"]}
          capabilities={["Per-category connected load and demand factor for 8 common categories (lighting, sockets, HVAC, heating, motors, cooking, EV charging, other).", "Total connected load, diversified maximum demand, effective diversity factor, and design current.", "Recommended main switch/breaker from standard IEC frame sizes.", "Subscriber: multi-board site aggregation with a further site-level diversity factor and future growth margin, producing a recommended transformer size."]}
          example={{ problem: "A site has 4 load categories: 100kW lighting at 90% DF, 80kW sockets at 70% DF, 150kW HVAC at 80% DF, and 200kW motors at 75% DF, on a 415V 3-phase supply at 0.9 assumed PF.", steps: ["Demand per category = connected load × demand factor: lighting 90kW, sockets 56kW, HVAC 120kW, motors 150kW.", "Total connected load = 100+80+150+200 = 530kW.", "Total diversified maximum demand = 90+56+120+150 = 416kW.", "Effective diversity factor = 416/530 ≈ 78.5%.", "Design current (3-phase) = 416,000 / (√3 × 415 × 0.9) ≈ 643A."], result: "Every intermediate value — connected load, weighted demand, design current, and breaker selection — was hand-checked end to end and matched the live code exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Supply">
              <NumberField label="Supply voltage" unit="V" tip={"Nominal supply voltage \u2014 phase voltage for single-phase, line-to-line for three-phase. Used to convert the diversified maximum demand from kW into amperes."} value={supplyVoltage} onChange={setSupplyVoltage} min={100} />
              <SelectField<Phase>
                label="Phase"
                tip={"Single-phase or three-phase supply \u2014 determines which current-conversion formula applies (I = P/(V\u00d7PF) for 1-phase, I = P/(\u221a3\u00d7V\u00d7PF) for 3-phase)."} value={phase}
                onChange={setPhase}
                options={[
                  { value: "1ph", label: "Single-phase" },
                  { value: "3ph", label: "Three-phase" },
                ]}
              />
              <NumberField label="Assumed power factor" tip={"The blended power factor of the diversified load mix, used to convert kW to kVA/amperes. 0.85-0.95 is typical for a mixed commercial load; a motor-heavy industrial load can run lower unless power-factor corrected."} value={powerFactor} onChange={setPowerFactor} min={0.5} max={1} step={0.01} />
            </Section>

            <div className="rounded-xl border border-border bg-surface p-6">
              <h3 className="text-base font-semibold text-foreground">
                Load schedule <span className="font-normal text-muted">(connected kW &amp; demand factor)</span>
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                {CATEGORIES.map((cat) => {
                  const c = categories.find((x) => x.key === cat.key)!;
                  return (
                    <div key={cat.key} className="col-span-2 grid grid-cols-2 gap-4 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                      <NumberField
                        label={cat.label}
                        unit="kW"
                        tip={CAT_LOAD_TIP[cat.key]}
                        value={c.loadKw}
                        onChange={(v) => updateCategory(cat.key, { loadKw: v })}
                        min={0}
                      />
                      <NumberField
                        label={`${cat.label} DF`}
                        unit="%"
                        tip={CAT_DF_TIP[cat.key]}
                        value={c.dfPct}
                        onChange={(v) => updateCategory(cat.key, { dfPct: v })}
                        min={0}
                        max={100}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <PremiumSection
              title="Multi-board site & transformer"
              description="Aggregates several identical boards onto a common incomer or transformer with a further site-level diversity factor and future growth margin."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Number of boards" hint="identical" tip={"How many identical or independent distribution boards feed from the common upstream supply or transformer being sized \u2014 used to apply a further site-level diversity factor on top of each board's own maximum demand."} value={numBoards} onChange={setNumBoards} min={1} step={1} />
              <NumberField label="Site-level diversity" unit="%" tip={"Additional diversity factor applied when combining multiple sub-boards' maximum demands onto a common incomer or transformer \u2014 typically 80-90% for related boards in the same building."} value={siteDiversityPct} onChange={setSiteDiversityPct} min={1} max={100} />
              <div className="col-span-2">
                <NumberField label="Future growth margin" unit="%" tip={"Additional capacity margin added on top of the calculated maximum demand when sizing the transformer or main incomer, to allow for future load growth \u2014 commonly 15-25% per general engineering practice."} value={growthMarginPct} onChange={setGrowthMarginPct} min={0} max={100} />
              </div>
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <MaxDemandResults result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
