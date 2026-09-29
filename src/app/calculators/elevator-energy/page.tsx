"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_ELEVATOR_ENERGY_INPUT, ElevatorEnergyInput, calcElevatorEnergy } from "@/lib/elevatorenergy";

export default function ElevatorEnergyPage() {
  const [input, setInput] = useState<ElevatorEnergyInput>(DEFAULT_ELEVATOR_ENERGY_INPUT);
  const update = (patch: Partial<ElevatorEnergyInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcElevatorEnergy(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Elevator Energy Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Estimates a traction elevator&apos;s annual electrical energy
          consumption (kWh/year) from its running power, daily duty cycle,
          regenerative-drive credit and standby (idle-mode) power draw.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Elevator Energy Calculator" standardsLine="Simplified running + standby energy method, structured after ISO 25745-2" />
          <FeedbackButton calculatorName="Elevator Energy Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates annual electrical energy consumption for a single traction elevator by splitting the day into running time (motor drawing power to move the car) and standby/idle time (controller, lighting and brake-hold power draw while parked), then scaling by trips/day and operating days/year — a simplified preliminary estimate, structured the same way as ISO 25745-2's running-energy-plus-standby-energy method."
            standards={["ISO 25745-2 (Energy calculation and classification for lifts) — structural method (running energy + standby energy) followed here as a simplified preliminary estimate, not a full standard-compliant classification, which requires manufacturer-measured motor and standby power per the standard's test procedure.", "Standard elevator-engineering motor power formula (net unbalanced load × speed ÷ drive efficiency) — same relation used in the Elevator Electrical Demand calculator."]}
            capabilities={[
              "Running power per trip from rated load, speed, counterweight balance factor and drive efficiency.",
              "Energy per trip, with an optional regenerative-drive credit (energy recovered on counterweight-heavy descents).",
              "Daily running energy, standby energy for the remaining idle hours, and their sum.",
              "Annual energy consumption from operating days per year.",
            ]}
            example={{
              problem: "1000kg rated load, 1.5 m/s speed, 50% counterweight balance, 70% drive efficiency, 25s average run time/trip, no regen credit, 150W standby, 150 trips/day, 365 operating days/year.",
              steps: [
                "Net unbalanced load = 1000 × (1 − 0.50) = 500kg.",
                "Running power = 500 × 9.81 × 1.5 / (1000 × 0.70) = 10.511kW.",
                "Energy/trip = 10.511 × (25/3600) × (1 − 0) = 0.0730kWh.",
                "Daily running hours = 150 × 25/3600 = 1.042h; daily running energy = 150 × 0.0730 = 10.94kWh.",
                "Standby hours = 24 − 1.042 = 22.958h; standby energy = 0.150 × 22.958 = 3.44kWh.",
                "Daily total = 10.94 + 3.44 = 14.38kWh; annual = 14.38 × 365 ≈ 5,249kWh/year.",
              ],
              result: "≈5,249 kWh/year — hand-checked and matched the live code exactly.",
            }}
            notes="This is a preliminary planning estimate, not a substitute for manufacturer-measured energy data or a full ISO 25745-2 classification. The regenerative-drive credit is a simplified flat percentage reduction on running energy — actual regeneration depends on the specific drive's ability to return energy to the supply and on real trip load/direction patterns. Standby power varies significantly by controller technology (LED vs fluorescent car lighting, sleep-mode controllers, etc.) — use the manufacturer's published standby figure where available."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Elevator">
              <NumberField label="Rated load" unit="kg" tip="The elevator car's rated (contract) load capacity." value={input.ratedLoadKg} onChange={(v) => update({ ratedLoadKg: v })} min={0} />
              <NumberField label="Rated speed" unit="m/s" tip="The elevator's rated travel speed." value={input.speedMs} onChange={(v) => update({ speedMs: v })} min={0} />
              <NumberField label="Counterweight balance factor" hint="0-1" tip="Fraction of the rated load offset by the counterweight — typically around 0.5 (50%) for passenger elevators." value={input.balanceFactor} onChange={(v) => update({ balanceFactor: v })} min={0} max={1} step={0.05} />
              <NumberField label="Overall drive efficiency" hint="0-1" tip="Combined mechanical and motor efficiency — commonly 0.6-0.7 for geared traction, higher for modern gearless VVVF drives." value={input.efficiency} onChange={(v) => update({ efficiency: v })} min={0.01} max={1} step={0.01} />
            </Section>

            <Section title="Duty cycle">
              <NumberField label="Average run time per trip" unit="s" tip="Average time the motor is actively running per trip — depends on travel distance and speed profile." value={input.avgRunTimeSecPerTrip} onChange={(v) => update({ avgRunTimeSecPerTrip: v })} min={0} />
              <NumberField label="Trips per day" tip="Total number of trips (starts) the elevator makes per operating day." value={input.tripsPerDay} onChange={(v) => update({ tripsPerDay: v })} min={0} step={1} />
              <NumberField label="Regenerative-drive credit" unit="%" tip="Energy recovered and returned to the supply on counterweight-heavy descents, for a regenerative VVVF drive. Use 0 for a non-regenerative drive." value={input.regenCreditPct} onChange={(v) => update({ regenCreditPct: v })} min={0} max={100} step={5} />
              <NumberField label="Standby (idle-mode) power" unit="W" tip="Power drawn while parked — controller electronics, car lighting, brake-hold. Typically 50-300W depending on controller technology." value={input.standbyPowerW} onChange={(v) => update({ standbyPowerW: v })} min={0} />
              <NumberField label="Operating days per year" value={input.operatingDaysPerYear} onChange={(v) => update({ operatingDaysPerYear: v })} min={1} max={366} step={1} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.runningPowerKw == null ? (
                <EmptyResult message="Enter elevator and duty-cycle inputs to see the energy estimate." />
              ) : (
                <>
                  <ResultCard title="Running power & per-trip energy">
                    <ResultRow label="Net unbalanced load" value={`${result.netLoadKg?.toFixed(0)} kg`} />
                    <ResultRow label="Running power" value={`${result.runningPowerKw.toFixed(2)} kW`} />
                    <ResultRow label="Energy per trip" value={`${result.energyPerTripKwh!.toFixed(4)} kWh`} />
                  </ResultCard>

                  <ResultCard title="Daily & annual energy">
                    <ResultRow label="Daily running hours" value={`${result.dailyRunningHours!.toFixed(2)} h`} />
                    <ResultRow label="Daily running energy" value={`${result.dailyRunningEnergyKwh!.toFixed(2)} kWh`} />
                    <ResultRow label="Daily standby energy" value={`${result.dailyStandbyEnergyKwh!.toFixed(2)} kWh`} />
                    <ResultRow label="Daily total energy" value={`${result.dailyTotalEnergyKwh!.toFixed(2)} kWh`} />
                    <ResultRow
                      label="Annual energy"
                      value={<span className="text-lg text-accent-2">{result.annualEnergyKwh!.toFixed(0)} kWh/year</span>}
                    />
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
