"use client";

import { FREE_LAUNCH } from "@/lib/launchConfig";
import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section } from "@/components/fields";
import PremiumSection from "@/components/PremiumSection";
import PeriodEditor from "@/components/battery/PeriodEditor";
import KtTableEditor from "@/components/battery/KtTableEditor";
import BatteryResults from "@/components/battery/BatteryResults";
import { DEFAULT_BATTERY_INPUT, BatteryInput, calcBattery } from "@/lib/battery";

export default function BatterySizingPage() {
  const [input, setInput] = useState<BatteryInput>(DEFAULT_BATTERY_INPUT);
  const update = (patch: Partial<BatteryInput>) => setInput((prev) => ({ ...prev, ...patch }));

  // Random loads, cell/voltage window and charger sizing are subscriber
  // features — never computed on the free site.
  const result = useMemo(() => calcBattery(input, FREE_LAUNCH), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Battery &amp; DC System Sizing Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          IEEE 485 duty-cycle section method for vented/VRLA lead-acid
          batteries. Enter your battery manufacturer&apos;s own published
          capacity-rating (Kt) table — IEEE 485 defines the calculation
          method, not the table itself. Random/intermittent loads, cell
          count &amp; voltage window checks, and charger sizing (IEEE
          946-style) are subscriber features.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Battery & DC System Sizing Calculator" standardsLine="IEEE 485, IEEE 1188, IEEE 946" />
          <FeedbackButton calculatorName="Battery & DC System Sizing Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose="Sizes a stationary lead-acid battery (vented or VRLA) for a DC system \u2014 substation control power, UPS, switchgear tripping supply \u2014 using IEEE 485's changing-load duty-cycle section method, which correctly identifies which period of a multi-stage discharge actually governs the required battery size (not simply the highest current or the longest duration alone)."
          standards={["IEEE 485 (recommended practice for sizing lead-acid batteries for stationary applications)", "IEEE 1188 (aging factor guidance)", "IEEE 946 (charger sizing, referenced for the subscriber-tier charger calculation)"]}
          capabilities={["Duty-cycle section-by-section required capacity, correctly implementing IEEE 485's changing-load recursion (not just the worst single period in isolation).", "Your own manufacturer's Kt (capacity-rating factor) table \u2014 IEEE 485 defines the calculation method, not the table itself, since Kt is product/chemistry-specific.", "Temperature, aging and design-margin correction factors producing the final required rated capacity.", "Subscriber: random/intermittent loads added on top of the governing section, cell count & voltage window check, and charger sizing."]}
          example={{ problem: "This calculator's default scenario reproduces an illustrative 4-period duty cycle end to end, including the changing-load recursion.", steps: ["For each period, compute the net current (background load \u00b1 switching events).", "Apply the changing-load recursion: A\u2c7c = A(j-1) \u00d7 [Kt(Tj)/Kt(T(j-1))] + (Ij - I(j-1)) \u00d7 Kt(Tj), carrying capacity forward period by period.", "Identify the governing (worst-case) section \u2014 the one demanding the largest required capacity, not necessarily the highest-current or longest one.", "Apply temperature, aging and design-margin correction factors to the governing section's capacity."], result: "Governing section 4 requires 195.75 Ah; after \u00d71.00 temperature \u00d7 1.25 aging \u00d7 1.10 margin, final corrected capacity = 269.156 Ah \u2014 hand-checked and matched the live code exactly." }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Duty cycle (periods)">
              <div className="col-span-2 text-xs text-muted">
                Break the discharge into sequential periods, each with its
                own constant net current. Periods run back-to-back in the
                order listed. The prefilled values are an illustrative
                example — replace with your own load profile.
              </div>
              <PeriodEditor periods={input.periods} onChange={(periods) => update({ periods })} />
            </Section>

            <Section title="Capacity rating table (Kt)">
              <div className="col-span-2 text-xs text-muted">
                From your battery&apos;s data sheet: the capacity-rating
                factor at each discharge time, to your required end-of-
                discharge voltage. <b>The values below are a placeholder,
                not real product data</b> — replace them with your
                manufacturer&apos;s published Kt table before using this for
                a real design.
              </div>
              <KtTableEditor table={input.ktTable} onChange={(ktTable) => update({ ktTable })} />
            </Section>

            <Section title="Correction factors">
              <NumberField label="Temperature correction factor" hint="1.00 at 25°C reference" tip={"Battery capacity is lower at temperatures below the manufacturer's reference (usually 25\u00b0C) \u2014 this factor scales up the required capacity to compensate for a colder installed/ambient temperature, taken from the manufacturer's own temperature-derating curve."} value={input.tempCF} onChange={(v) => update({ tempCF: v })} min={1} step={0.01} />
              <NumberField label="Aging factor" hint="IEEE 1188: ~1.25 typical" tip={"Batteries lose capacity as they age even when otherwise healthy \u2014 this factor sizes the battery for its capacity near end of life, not when brand new. IEEE 1188 commonly suggests around 1.25, i.e. sizing for roughly 80% of original rated capacity remaining."} value={input.agingCF} onChange={(v) => update({ agingCF: v })} min={1} step={0.01} />
              <NumberField label="Design margin" hint="growth / cell variation" tip={"An additional allowance on top of the aging factor for future load growth and normal cell-to-cell capacity variation within a string \u2014 a general engineering safety margin, not tied to a specific standard's number."} value={input.marginCF} onChange={(v) => update({ marginCF: v })} min={1} step={0.01} />
            </Section>

            <PremiumSection
              title="Random / intermittent loads"
              description="Loads that could switch on at any single moment during the duty cycle — sized on their own and added on top of whichever period needs the most capacity."
              unlocked={FREE_LAUNCH}
            >
              <div className="col-span-2 text-xs text-muted">
                Preview only — random load entries are not added to the
                free-tier result.
              </div>
            </PremiumSection>

            <PremiumSection
              title="Cell count & voltage window"
              description="Checks the string voltage at equalize and end-of-discharge against your equipment's allowable DC voltage window."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="System DC voltage" unit="V" tip={"The nominal DC bus voltage the battery string is designed to deliver \u2014 sets the starting point for working out how many cells are needed in series."} value={input.sysV} onChange={(v) => update({ sysV: v })} />
              <NumberField label="Nominal voltage / cell" unit="V" tip={"The cell's nominal (float/normal-operation) voltage, from the manufacturer's data \u2014 combined with system DC voltage, this sets the nominal number of cells in the string."} value={input.vNomCell} onChange={(v) => update({ vNomCell: v })} />
              <NumberField label="Equalize voltage / cell" unit="V" tip={"The cell's equalize/boost-charge voltage, from the manufacturer's data \u2014 the highest voltage the string reaches during a charging cycle, checked against the connected equipment's maximum allowable voltage."} value={input.vEqCell} onChange={(v) => update({ vEqCell: v })} />
              <NumberField label="Min voltage / cell at EOD" unit="V" tip={"The cell's minimum allowable voltage at end-of-discharge (EOD), from the manufacturer's data \u2014 the lowest voltage the string reaches when fully discharged to its rated capacity, checked against the connected equipment's minimum allowable voltage."} value={input.vEodCell} onChange={(v) => update({ vEodCell: v })} />
              <NumberField label="Equipment max allowable V" unit="V" tip={"The highest DC voltage the connected equipment (protection relays, control systems, etc.) can tolerate \u2014 checked against the string's equalize-charge voltage to make sure charging never overvoltages the equipment it backs up."} value={input.eqMaxV} onChange={(v) => update({ eqMaxV: v })} />
              <NumberField label="Equipment min allowable V" unit="V" tip={"The lowest DC voltage the connected equipment can still operate correctly at \u2014 checked against the string's end-of-discharge voltage to make sure the battery can be fully utilised without the equipment failing first."} value={input.eqMinV} onChange={(v) => update({ eqMinV: v })} />
            </PremiumSection>

            <PremiumSection
              title="Charger sizing"
              description="A practical charger-sizing method (IEEE 946 territory) — explicitly outside IEEE 485's own scope, so treat it as a starting point, not a standard's worked procedure."
              unlocked={FREE_LAUNCH}
            >
              <NumberField label="Continuous steady-state DC load" unit="A" tip={"The normal, continuously-connected DC load the charger must supply directly (protection relays, control power) at the same time as it recharges the battery \u2014 separate from the duty-cycle discharge loads above."} value={input.chgLoad} onChange={(v) => update({ chgLoad: v })} />
              <NumberField label="Target recharge time" unit="hr" tip={"How quickly you want the charger to restore the battery to full charge after a discharge event \u2014 a shorter target time requires a larger (higher current) charger for the same discharged capacity."} value={input.chgTime} onChange={(v) => update({ chgTime: v })} />
              <NumberField label="Recharge efficiency factor" hint="charging losses" tip={"Accounts for charging losses \u2014 not all the Ah put into the battery during recharge returns as usable discharge Ah, so the charger must supply somewhat more than the nominal discharged capacity. Typically 1.10-1.20 for lead-acid."} value={input.chgEff} onChange={(v) => update({ chgEff: v })} />
            </PremiumSection>
          </div>

          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-24">
              <BatteryResults input={input} result={result} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
