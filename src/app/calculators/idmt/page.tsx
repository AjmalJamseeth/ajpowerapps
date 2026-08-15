"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Tip } from "@/components/fields";
import RelayForm from "@/components/RelayForm";
import ResultsPanel from "@/components/ResultsPanel";
import TccChart from "@/components/TccChart";
import { DEFAULT_RELAY, checkCoordination, RelaySettings } from "@/lib/idmt";

export default function IdmtCalculatorPage() {
  const [relay1, setRelay1] = useState<RelaySettings>(() => ({
    ...DEFAULT_RELAY("Relay 1 (Downstream)"),
    pickupCurrent: 100,
    timeDial: 0.1,
    curveType: "SI",
  }));
  const [relay2, setRelay2] = useState<RelaySettings>(() => ({
    ...DEFAULT_RELAY("Relay 2 (Upstream)"),
    pickupCurrent: 150,
    timeDial: 0.25,
    curveType: "SI",
  }));

  const [faultCurrent, setFaultCurrent] = useState(2000);
  const [maxCurrent, setMaxCurrent] = useState(10000);
  const [requiredMargin, setRequiredMargin] = useState(0.4);

  const minCurrent = useMemo(
    () => Math.max(1, Math.min(relay1.pickupCurrent, relay2.pickupCurrent) * 1.05),
    [relay1.pickupCurrent, relay2.pickupCurrent]
  );

  const coordination = useMemo(
    () =>
      checkCoordination(relay1, relay2, {
        minCurrent,
        maxCurrent,
        requiredMargin,
      }),
    [relay1, relay2, minCurrent, maxCurrent, requiredMargin]
  );

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          IDMT Relay Coordination Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Enter settings for two relays to compute trip times and check
          grading margin across the full fault-current range. Curves per IEC
          60255-151 and IEEE C37.112.
        </p>

<div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="IDMT Relay Coordination Calculator" standardsLine="IEC 60255-151 / IEEE C37.112" />
          <FeedbackButton calculatorName="IDMT Relay Coordination Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
          purpose={"Checks that two overcurrent relays in series (an upstream and downstream device protecting the same feeder) trip in the correct order with adequate time separation across the ENTIRE fault-current range they could see — not just at one arbitrarily chosen current — using inverse-time (IDMT) curves from IEC 60255-151 or IEEE C37.112."}
          standards={["IEC 60255-151 (measuring relays and protection equipment — functional requirements for over/undercurrent protection)", "IEEE C37.112 (IEEE standard for inverse-time characteristics for overcurrent relays)"]}
          capabilities={["Computes trip time for both relays at any single fault current, given curve family/type, pickup, TMS/time-dial and CT ratio.", "Sweeps the full fault-current range (not just one point) and reports the worst-case (minimum) grading margin anywhere in that range, so a violation buried at one particular current can't be missed.", "Plots a log-log Time-Current Characteristic (TCC) graph of Relay 1.", "Pass/fail verdict against a configurable required grading margin (CTI), defaulting to the commonly used 0.4s for electromechanical relays."]}
          example={{ problem: "A downstream relay (pickup 100A, TMS 0.1, IEC Standard Inverse) must grade against an upstream relay (pickup 150A, TMS 0.25, same curve) at a 2000A fault.", steps: ["Compute each relay's multiple of pickup: downstream = 2000/100 = 20×, upstream = 2000/150 = 13.3×.", "Apply the IEC Standard Inverse equation t = TMS × (0.14 / (M^0.02 − 1)) to each relay using its own multiple and TMS.", "Compare the two trip times — the difference is the grading margin at this specific current.", "Repeat across the full current sweep range to find the worst-case (minimum) margin anywhere, not just at this one point."], result: "The full-range sweep is what determines pass/fail against the required CTI — a comfortable margin at one current doesn't guarantee compliance everywhere, which is why this calculator checks the whole range rather than a single point." }}
          notes="Curve outputs were checked against the published IEC 60255-151 SI/VI/EI reference table at TMS=1.0 for multiple current multiples."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <RelayForm relay={relay1} onChange={setRelay1} accentClass="bg-accent" />
          <RelayForm relay={relay2} onChange={setRelay2} accentClass="bg-accent-2" />
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2">
          <div>
            <label className="flex items-center text-xs font-medium text-muted">
              Fault current to evaluate (A)
              <Tip text="The specific fault current (relay-side, after CT ratio) to compute a single trip time for each relay — used for the point coordination-margin check shown below." />
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={faultCurrent}
              onChange={(e) => setFaultCurrent(parseFloat(e.target.value) || 0)}
              className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="flex items-center text-xs font-medium text-muted">
              Max fault current for graph & sweep (A)
              <Tip text="Upper bound of the current axis for the TCC graph and the full-range coordination sweep — set it to at least the maximum fault current either relay could realistically see, so the sweep can't miss a grading violation just outside its range." />
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={maxCurrent}
              onChange={(e) => setMaxCurrent(parseFloat(e.target.value) || 0)}
              className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <TccChart
              relay1={relay1}
              relay2={relay2}
              minCurrent={minCurrent}
              maxCurrent={maxCurrent}
            />
          </div>
          <div className="lg:col-span-2">
            <ResultsPanel
              relay1={relay1}
              relay2={relay2}
              faultCurrent={faultCurrent}
              requiredMargin={requiredMargin}
              onRequiredMarginChange={setRequiredMargin}
              coordination={coordination}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
