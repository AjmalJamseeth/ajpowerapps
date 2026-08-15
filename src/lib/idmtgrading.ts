// Multi-Bus IDMT Relay Grading — cascading grading-margin check for a
// radial chain of IDMT relays (e.g. up to 5, downstream to source), at a
// single fault current seen by all of them (the classic "grading study"
// check: each upstream relay must trip a safe margin later than the one
// immediately downstream of it, at the same fault current). Reuses
// idmt.ts's already-verified tripTime() curve math for every relay in the
// chain rather than re-deriving it. Designed from scratch; no equivalent
// module in the source app.

import { RelaySettings, DEFAULT_RELAY, tripTime } from "./idmt";

export interface IdmtGradingInput {
  relays: RelaySettings[]; // ordered downstream -> upstream (source)
  faultCurrentPrimary: number | null;
  gradingMarginS: number; // minimum acceptable margin between successive relays, typically 0.3-0.4s
}

export const DEFAULT_IDMT_GRADING_INPUT: IdmtGradingInput = {
  relays: [
    { ...DEFAULT_RELAY("Relay 1 (Load end)"), pickupCurrent: 1, ctRatio: 200, timeDial: 0.1 },
    { ...DEFAULT_RELAY("Relay 2"), pickupCurrent: 1.2, ctRatio: 300, timeDial: 0.2 },
    { ...DEFAULT_RELAY("Relay 3 (Source)"), pickupCurrent: 1.5, ctRatio: 400, timeDial: 0.3 },
  ],
  faultCurrentPrimary: 5000,
  gradingMarginS: 0.4,
};

export interface GradingStep {
  label: string; // "Relay 1 -> Relay 2"
  tDownstream: number | null;
  tUpstream: number | null;
  margin: number | null;
  pass: boolean | null;
}

export interface IdmtGradingResult {
  operatingTimes: { label: string; timeS: number | null }[];
  steps: GradingStep[];
  allPass: boolean | null;
}

export function calcIdmtGrading(input: IdmtGradingInput): IdmtGradingResult {
  const { relays, faultCurrentPrimary, gradingMarginS } = input;

  if (faultCurrentPrimary == null || relays.length === 0) {
    return { operatingTimes: [], steps: [], allPass: null };
  }

  const operatingTimes = relays.map((r) => {
    const t = tripTime(r, faultCurrentPrimary);
    return { label: r.label, timeS: isFinite(t) ? t : null };
  });

  const steps: GradingStep[] = [];
  for (let i = 0; i < operatingTimes.length - 1; i++) {
    const down = operatingTimes[i];
    const up = operatingTimes[i + 1];
    let margin: number | null = null;
    let pass: boolean | null = null;
    if (down.timeS != null && up.timeS != null) {
      margin = up.timeS - down.timeS;
      pass = margin >= gradingMarginS;
    }
    steps.push({ label: `${down.label} → ${up.label}`, tDownstream: down.timeS, tUpstream: up.timeS, margin, pass });
  }

  const anyChecked = steps.some((s) => s.pass !== null);
  const allPass = anyChecked ? steps.every((s) => s.pass !== false) : null;

  return { operatingTimes, steps, allPass };
}
