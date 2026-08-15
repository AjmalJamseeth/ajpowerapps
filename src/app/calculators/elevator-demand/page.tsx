"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NumberField, Section, ResultCard, ResultRow, EmptyResult } from "@/components/fields";
import { DEFAULT_ELEVATOR_DEMAND_INPUT, ElevatorDemandInput, calcElevatorDemand } from "@/lib/elevatordemand";

export default function ElevatorDemandPage() {
  const [input, setInput] = useState<ElevatorDemandInput>(DEFAULT_ELEVATOR_DEMAND_INPUT);
  const update = (patch: Partial<ElevatorDemandInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const result = useMemo(() => calcElevatorDemand(input), [input]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          Elevator Electrical Demand Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Traction elevator motor power from rated load, speed, counterweight
          balance and drive efficiency, plus NEC Table 620.14 feeder demand
          factor for a group of elevators on a shared feeder.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Elevator Electrical Demand Calculator" standardsLine="Elevator power engineering + NEC Table 620.14" />
          <FeedbackButton calculatorName="Elevator Electrical Demand Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Estimates a traction elevator's motor power from its rated load, speed, counterweight balance factor and overall drive efficiency, then applies the NEC Table 620.14 feeder demand factor to size a shared feeder for a group of similar elevators — since not all elevators in a bank run simultaneously at full load."
            standards={["NEC Table 620.14 (feeder demand factors, two or more elevators)", "Standard elevator-engineering motor power formula (mechanical power from net unbalanced load × speed, divided by drive efficiency)"]}
            capabilities={[
              "Single-unit motor power from rated load, speed, counterweight balance factor (fraction of load offset by the counterweight) and overall efficiency.",
              "Approximate 3-phase full-load current from the computed power, voltage and power factor.",
              "Connected load for N identical elevators and the NEC Table 620.14 demand factor for that count (1.00 down to 0.72 for 10 or more).",
              "Demand load (kW and approximate FLA) after applying the demand factor.",
            ]}
            example={{
              problem: "1000kg rated load, 1.5 m/s speed, 50% counterweight balance, 70% overall drive efficiency, 4 identical elevators on a shared 415V/0.85PF feeder.",
              steps: [
                "Net unbalanced load = 1000 × (1 − 0.50) = 500kg.",
                "Single-unit power = 500 × 9.81 × 1.5 / (1000 × 0.70) = 10.51kW.",
                "Connected load for 4 units = 10.51 × 4 = 42.04kW.",
                "NEC Table 620.14 demand factor for 4 elevators = 0.85.",
                "Demand load = 42.04 × 0.85 = 35.74kW.",
              ],
              result: "10.51kW per unit, 42.04kW connected, 35.74kW after the NEC demand factor — hand-checked and matched the live code exactly.",
            }}
            notes="The motor power formula is a standard elevator-engineering estimate for preliminary electrical sizing — final sizing should use the actual elevator manufacturer's motor nameplate data. The demand factor table assumes all elevators on the feeder are of similar size; for mixed-size banks, engineering judgment is required. Escalators aren't covered here — they run continuously regardless of passenger load and are typically sized directly from the manufacturer's motor nameplate (see the Motor Calculator for branch-circuit/OCPD sizing from a known FLC)."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Section title="Single elevator">
              <NumberField label="Rated load" unit="kg" tip="The elevator car's rated (contract) load capacity." value={input.ratedLoadKg} onChange={(v) => update({ ratedLoadKg: v })} min={0} />
              <NumberField label="Rated speed" unit="m/s" tip="The elevator's rated travel speed." value={input.speedMs} onChange={(v) => update({ speedMs: v })} min={0} />
              <NumberField label="Counterweight balance factor" hint="0-1" tip="Fraction of the rated load offset by the counterweight — typically around 0.5 (50%) for passenger elevators, meaning the motor only has to move the unbalanced remainder." value={input.balanceFactor} onChange={(v) => update({ balanceFactor: v })} min={0} max={1} step={0.05} />
              <NumberField label="Overall drive efficiency" hint="0-1" tip="Combined mechanical (sheave/rope/guide losses) and motor efficiency — commonly around 0.6-0.7 for geared traction drives, higher for modern gearless VVVF drives." value={input.efficiency} onChange={(v) => update({ efficiency: v })} min={0.01} max={1} step={0.01} />
            </Section>

            <Section title="Feeder / group">
              <NumberField label="Number of elevators" tip="Count of identical elevators sharing the same feeder — used to look up the NEC Table 620.14 demand factor." value={input.numElevators} onChange={(v) => update({ numElevators: v })} min={1} step={1} />
              <NumberField label="Supply voltage" unit="V" tip="Line-to-line supply voltage, used for the approximate 3-phase full-load current estimate." value={input.voltageV} onChange={(v) => update({ voltageV: v })} min={1} />
              <NumberField label="Power factor" hint="0-1" tip="Assumed motor power factor, used for the approximate FLA estimate." value={input.powerFactor} onChange={(v) => update({ powerFactor: v })} min={0.1} max={1} step={0.01} />
            </Section>
          </div>

          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              {result.singleUnitPowerKw == null ? (
                <EmptyResult message="Enter rated load and speed to see motor power results." />
              ) : (
                <ResultCard title="Single-unit motor power">
                  <ResultRow label="Net unbalanced load" value={`${result.netLoadKg?.toFixed(0)} kg`} />
                  <ResultRow label="Motor power" value={`${result.singleUnitPowerKw.toFixed(2)} kW`} />
                  {result.singleUnitFlaApprox != null && <ResultRow label="Approx. full-load current" value={`${result.singleUnitFlaApprox.toFixed(1)} A`} />}
                </ResultCard>
              )}

              {result.demandLoadKw != null && (
                <ResultCard title="Feeder demand (NEC Table 620.14)">
                  <ResultRow label="Connected load" value={`${result.connectedLoadKw?.toFixed(1)} kW`} />
                  <ResultRow label="Demand factor" value={result.demandFactor.toFixed(2)} />
                  <ResultRow label="Demand load" value={<span className="text-lg text-accent-2">{result.demandLoadKw.toFixed(1)} kW</span>} />
                  {result.demandLoadFlaApprox != null && <ResultRow label="Approx. demand FLA" value={`${result.demandLoadFlaApprox.toFixed(1)} A`} />}
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
