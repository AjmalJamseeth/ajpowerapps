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
import { DEFAULT_RELAY, checkChainCoordination, RelaySettings } from "@/lib/idmt";

const ACCENT_CLASSES = ["bg-accent", "bg-accent-2", "bg-[#a78bfa]", "bg-[#f472b6]", "bg-[#34d399]", "bg-[#fb7185]"];

export default function IdmtCalculatorPage() {
  const [relays, setRelays] = useState<RelaySettings[]>(() => [
    { ...DEFAULT_RELAY("Relay 1 (Downstream)"), pickupCurrent: 100, timeDial: 0.1, curveType: "SI" },
    { ...DEFAULT_RELAY("Relay 2 (Upstream)"), pickupCurrent: 150, timeDial: 0.25, curveType: "SI" },
  ]);

  const updateRelay = (i: number, next: RelaySettings) => {
    setRelays((prev) => prev.map((r, idx) => (idx === i ? next : r)));
  };
  const addRelay = () => {
    setRelays((prev) => [...prev, DEFAULT_RELAY(`Relay ${prev.length + 1} (Upstream)`)]);
  };
  const removeRelay = (i: number) => {
    setRelays((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));
  };

  const [faultCurrent, setFaultCurrent] = useState(2000);
  const [maxCurrent, setMaxCurrent] = useState(10000);
  const [requiredMargin, setRequiredMargin] = useState(0.4);

  const minCurrent = useMemo(
    () => Math.max(1, Math.min(...relays.map((r) => r.pickupCurrent)) * 1.05),
    [relays]
  );

  const chainResult = useMemo(
    () =>
      checkChainCoordination(relays, {
        minCurrent,
        maxCurrent,
        requiredMargin,
      }),
    [relays, minCurrent, maxCurrent, requiredMargin]
  );

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
          IDMT Relay Coordination Calculator
        </h1>
        <p className="mt-2 max-w-2xl text-muted">
          Enter settings for two or more relays (downstream to source) to
          compute trip times and check grading margin across the full
          fault-current range. Curves per IEC 60255-151 and IEEE C37.112.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="IDMT Relay Coordination Calculator" standardsLine="IEC 60255-151 / IEEE C37.112" />
          <FeedbackButton calculatorName="IDMT Relay Coordination Calculator" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose={"Checks that a chain of two or more overcurrent relays in series (from the load end up to the source) trips in the correct order with adequate time separation across the ENTIRE fault-current range they could see — not just at one arbitrarily chosen current — using inverse-time (IDMT) curves from IEC 60255-151 or IEEE C37.112. Add relays to check a full radial grading chain, not just a single pair."}
            standards={["IEC 60255-151 (measuring relays and protection equipment — functional requirements for over/undercurrent protection)", "IEEE C37.112 (IEEE standard for inverse-time characteristics for overcurrent relays)"]}
            capabilities={["Computes trip time for every relay in the chain at any single fault current, given curve family/type, pickup, TMS/time-dial and CT ratio.", "Sweeps the full fault-current range (not just one point) for every successive relay pair, reporting the worst-case (minimum) grading margin anywhere in that range for each step.", "Plots a log-log Time-Current Characteristic (TCC) graph with every relay's curve overlaid.", "Pass/fail verdict per step and for the overall chain, against a configurable required grading margin (CTI), defaulting to the commonly used 0.4s for electromechanical relays."]}
            example={{ problem: "A downstream relay (pickup 100A, TMS 0.1, IEC Standard Inverse) must grade against an upstream relay (pickup 150A, TMS 0.25, same curve) at a 2000A fault.", steps: ["Compute each relay's multiple of pickup: downstream = 2000/100 = 20×, upstream = 2000/150 = 13.3×.", "Apply the IEC Standard Inverse equation t = TMS × (0.14 / (M^0.02 − 1)) to each relay using its own multiple and TMS.", "Compare the two trip times — the difference is the grading margin at this specific current.", "Repeat across the full current sweep range to find the worst-case (minimum) margin anywhere, not just at this one point — and repeat again for every additional relay pair if more than two relays are in the chain."], result: "The full-range sweep is what determines pass/fail against the required CTI — a comfortable margin at one current doesn't guarantee compliance everywhere, which is why this calculator checks the whole range, for every adjacent pair, rather than a single point on a single pair." }}
            notes="Curve outputs were checked against the published IEC 60255-151 SI/VI/EI reference table at TMS=1.0 for multiple current multiples. This calculator previously shipped as two separate tools (a 2-relay full-range checker, and a separate Multi-Bus Grading tool limited to a single fault current) — they've been merged here so any chain length gets the more rigorous full-range sweep."
          />
        </div>

        <div className="mt-8 space-y-4">
          {relays.map((relay, i) => (
            <div key={i} className="relative">
              <RelayForm relay={relay} onChange={(next) => updateRelay(i, next)} accentClass={ACCENT_CLASSES[i % ACCENT_CLASSES.length]} />
              {relays.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeRelay(i)}
                  className="absolute right-4 top-4 rounded-md border border-border px-2 py-1 text-xs text-muted hover:border-fail/40 hover:text-fail"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addRelay}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent-2 hover:border-accent-2/60"
          >
            + Add relay upstream
          </button>
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
              <Tip text="Upper bound of the current axis for the TCC graph and the full-range coordination sweep — set it to at least the maximum fault current any relay could realistically see, so the sweep can't miss a grading violation just outside its range." />
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
              relays={relays}
              minCurrent={minCurrent}
              maxCurrent={maxCurrent}
            />
          </div>
          <div className="lg:col-span-2">
            <ResultsPanel
              relays={relays}
              faultCurrent={faultCurrent}
              requiredMargin={requiredMargin}
              onRequiredMarginChange={setRequiredMargin}
              chainResult={chainResult}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
