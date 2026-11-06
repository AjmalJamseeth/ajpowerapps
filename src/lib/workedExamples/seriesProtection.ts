// Protection coordination learning series (5 examples). Relay times come from
// the shared curve engine (iecTime, IEC 60255-151) and are pinned in
// scripts/regression-test.ts ("Learning series — protection"). Fault levels
// are taken from the short-circuit series (same 11/0.4 kV network).

import type { WorkedExample } from "./types";

const IDMT = "/calculators/idmt";
const IDMT_NAME = "IDMT Relay Coordination";
const SI = "t = 0.14 × TMS / ((I/Is)^0.02 − 1)";

export const SERIES_PROTECTION_EXAMPLES: WorkedExample[] = [
  {
    slug: "idmt-relay-tms-calculation-grading-margin-maximum-fault",
    groupId: "protection",
    calculatorHref: IDMT,
    calculatorName: IDMT_NAME,
    title: "How to Calculate the TMS of an Upstream IDMT Relay for a 0.3 s Grading Margin",
    dek: "Part 1 of the protection series. Step by step from the downstream relay time to the upstream TMS, checked at the maximum fault current — and why the margin only grows at lower currents.",
    standard: "IEC 60255-151",
    readTime: "8 min read",
    scenario: [
      { label: "Downstream relay R1 (11 kV feeder)", value: "IEC Standard Inverse, pickup 400 A, TMS 0.10" },
      { label: "Upstream relay R2 (11 kV incomer)", value: "IEC Standard Inverse, pickup 1,000 A, TMS to be found" },
      { label: "Maximum fault at the feeder", value: "13.12 kA (from IEC 60909)" },
      { label: "Grading margin", value: "0.3 s (numeric relays, vacuum breakers)" },
    ],
    steps: [
      { title: "R1 operating time at maximum fault", equation: SI, substitution: "M = 13,120/400 = 32.8;  t1 = 0.14 × 0.10 / (32.8^0.02 − 1)", result: "t1 = 0.194 s" },
      { title: "Required R2 time", substitution: "t2 = 0.194 + 0.3", result: "t2 = 0.494 s" },
      { title: "R2 time at TMS = 1", substitution: "M = 13,120/1,000 = 13.1;  t = 0.14 / (13.1^0.02 − 1)", result: "t(TMS = 1) = 2.650 s" },
      { title: "Required TMS", equation: "TMS = t2 / t(TMS = 1)", substitution: "TMS = 0.494 / 2.650 = 0.186", result: "Select TMS = 0.19 → t2 = 0.503 s, margin 0.31 s" },
      {
        title: "Check the margin across the range",
        table: { headers: ["Fault current", "R1 (s)", "R2 (s)", "Margin (s)"], rows: [["2 kA", "0.428", "1.906", "1.48"], ["4 kA", "0.297", "0.946", "0.65"], ["8 kA", "0.227", "0.626", "0.40"], ["13.12 kA", "0.194", "0.503", "0.31"]] },
      },
    ],
    resultSummary: [
      { check: "Margin at maximum fault", requirement: "≥ 0.3 s", actual: "0.31 s", pass: true },
      { check: "Margin at 2 kA", requirement: "≥ 0.3 s", actual: "1.48 s", pass: true },
    ],
    finalAnswer: "R2 needs a TMS of 0.19, giving 0.503 s at 13.12 kA and a 0.31 s margin over R1. For two relays with the same curve and a higher upstream pickup, the margin is smallest at the maximum fault current.",
    keyInsight: "Always set the margin at the maximum fault current the downstream relay sees. If the curves are of different types (for example SI over EI), check the whole range — they can cross.",
    faqs: [
      { q: "Why 0.3 s and not 0.4 s?", a: "0.4 s is a traditional margin for electromechanical relays and oil breakers. Numeric relays with fast breakers commonly use 0.25–0.3 s; Part 4 shows how the margin is built up." },
      { q: "What sets the pickup?", a: "Above the maximum load current (with margin) and below the minimum fault current the relay must detect, including its back-up zone." },
    ],
  },

  {
    slug: "fuse-relay-grading-margin-lv-feeder",
    groupId: "protection",
    calculatorHref: IDMT,
    calculatorName: IDMT_NAME,
    title: "Fuse–Relay Grading: Setting an IDMT Relay Above a 200 A gG Fuse",
    dek: "Part 2 of the protection series. The margin over a fuse grows with the fuse time (0.4 t + 0.15 s). The steep part of the fuse curve at low current sets the relay TMS.",
    standard: "IEC 60255-151 / IEC 60269",
    readTime: "8 min read",
    scenario: [
      { label: "Downstream", value: "200 A gG fuse on an outgoing feeder" },
      { label: "Fuse total clearing times (manufacturer's curve, values for this example)", value: "1.5 s at 1.5 kA;  0.25 s at 2 kA;  0.02 s at 4 kA;  0.01 s at 15 kA (maximum fault)" },
      { label: "Upstream relay", value: "IEC Standard Inverse, pickup 1,000 A" },
      { label: "Margin rule", value: "t_relay ≥ t_fuse + (0.4 t_fuse + 0.15 s)" },
    ],
    steps: [
      { title: "Required relay times", table: { headers: ["Current", "Fuse (s)", "Required relay (s)"], rows: [["1.5 kA", "1.50", "2.25"], ["2 kA", "0.25", "0.50"], ["4 kA", "0.02", "0.178"], ["15 kA", "0.01", "0.164"]] } },
      { title: "TMS needed at each point", equation: "TMS = t_required / t(TMS = 1)", substitution: "1.5 kA: 2.25/17.19 = 0.131;  2 kA: 0.50/10.03 = 0.050;  4 kA: 0.178/4.98 = 0.036;  15 kA: 0.164/2.52 = 0.065", result: "Governing TMS = 0.131 (at 1.5 kA) → select 0.14" },
      { title: "Relay times with TMS 0.14", result: "2.41 s at 1.5 kA;  1.40 s at 2 kA;  0.70 s at 4 kA;  0.35 s at 15 kA — all above the required times" },
      { title: "Why not an Extremely Inverse curve here?", body: "EI would need only TMS 0.035 at 1.5 kA, but at 15 kA its time falls so fast that TMS 0.46 is needed to keep 0.164 s. With these fuse data SI gives the better overall result; with other fuses EI often wins. Check the whole range either way." },
    ],
    resultSummary: [
      { check: "Margin at 1.5 kA", requirement: "≥ 2.25 s", actual: "2.41 s", pass: true },
      { check: "Margin at 15 kA", requirement: "≥ 0.164 s", actual: "0.35 s", pass: true },
    ],
    finalAnswer: "With the relay at pickup 1,000 A and TMS 0.14 (IEC SI), it grades with the 200 A gG fuse at every current from 1.5 kA to the 15 kA maximum. The low-current end of the fuse curve sets the TMS.",
    keyInsight: "Fuses have no fixed margin: the relay must allow for fuse tolerance, which grows with the fuse operating time. Use the manufacturer's total-clearing curve, not the pre-arcing curve.",
    faqs: [
      { q: "Where does 0.4 t + 0.15 s come from?", a: "It is a commonly used rule for an upstream relay over a downstream fuse: 0.4 t covers fuse tolerance and 0.15 s covers relay overshoot and breaker time." },
      { q: "What about a fuse upstream of a relay?", a: "Then the fuse must not melt before the relay and breaker clear, so compare the fuse's minimum pre-arcing curve with relay time plus breaker time, with margin." },
    ],
  },

  {
    slug: "transformer-protection-inrush-damage-curve-relay-setting",
    groupId: "protection",
    calculatorHref: "/calculators/protection-suite",
    calculatorName: "Protection Coordination Suite (full workbench)",
    title: "Transformer HV Relay Settings: Clearing Inrush and Staying Below the Damage Curve",
    dek: "Part 3 of the protection series. Setting the 11 kV relay of a 1.6 MVA transformer: above inrush, below the IEEE C57.109 damage curve, and with an instantaneous element that ignores LV faults.",
    standard: "IEC 60255-151 / IEEE C57.109",
    readTime: "10 min read",
    scenario: [
      { label: "Transformer", value: "1.6 MVA, 11/0.4 kV, Dyn, uk 6 % — HV full-load current 84.0 A" },
      { label: "Relay", value: "IEC Standard Inverse, pickup 100 A (1.19 × FLC), TMS 0.10" },
      { label: "Maximum LV three-phase fault", value: "37.4 kA at 0.4 kV → 1,360 A seen at 11 kV (16.2 × FLC)" },
      { label: "Inrush (assumed)", value: "8 × FLC for 0.1 s = 672 A (12 × FLC = 1,008 A for comparison)" },
    ],
    steps: [
      { title: "Inrush: the relay must not trip", equation: SI, substitution: "At 672 A: M = 6.72 → t = 0.36 s;  at 1,008 A: t = 0.30 s", result: "Both well above the 0.1 s inrush duration — no trip" },
      { title: "Damage curve (thermal part, IEEE C57.109 category II)", equation: "t = 1250 / I²  (I in per unit of FLC)", substitution: "At 16.2 pu: t = 1250/16.2² = 4.76 s;  relay at 1,360 A: 0.26 s", result: "Relay clears far below the damage curve" },
      { title: "Instantaneous element", body: "Set above the maximum LV fault seen from HV, so the HV relay does not trip for faults the LV breakers should clear, and above inrush.", substitution: "1.3 × 1,360 = 1,768 A → set 1,800 A (> 1,008 A inrush)", result: "Instantaneous 1,800 A: fast for HV-side faults only" },
      { title: "LV earth faults look smaller from HV", body: "With a Dyn transformer an LV phase-to-earth fault appears in only two HV lines, at 1/√3 of the ratio-transformed value.", substitution: "38.8 kA × 0.4/11 / √3 = 815 A", result: "Relay time 0.33 s at 815 A — still well below the damage curve, but this is the case to check for back-up of LV earth faults" },
    ],
    resultSummary: [
      { check: "No trip on inrush", requirement: "t > 0.1 s at 672 A", actual: "0.36 s", pass: true },
      { check: "Below damage curve at max through-fault", requirement: "t < 4.76 s", actual: "0.26 s", pass: true },
      { check: "Instantaneous above LV fault", requirement: "> 1,360 A", actual: "1,800 A", pass: true },
    ],
    finalAnswer: "Pickup 100 A, TMS 0.10 (IEC SI) and instantaneous 1,800 A protect the transformer: the relay rides through inrush, clears through-faults far below the damage curve, and the instantaneous element only sees HV-side faults. Part 4 checks grading with the LV incomer, which needs a slightly higher TMS.",
    keyInsight: "A transformer HV relay sits between three limits: inrush (lower bound in time), the damage curve (upper bound), and selectivity with the LV incomer. The instantaneous setting must stay above the largest LV fault seen from HV.",
    faqs: [
      { q: "What inrush multiple should be used?", a: "Typically 8–12 × FLC for 0.1 s for distribution transformers; use the manufacturer's value when available." },
      { q: "Why only the thermal part of the damage curve?", a: "For category II–IV transformers IEEE C57.109 adds a mechanical-duty curve for frequent faults; the calculator shows the thermal part and notes the limit." },
    ],
  },

  {
    slug: "grading-margin-calculation-radial-feeder-three-relays",
    groupId: "protection",
    calculatorHref: IDMT,
    calculatorName: IDMT_NAME,
    title: "Building Up the Grading Margin: Three Relays From an MCC to the 11 kV Side",
    dek: "Part 4 of the protection series. The margin is not a fixed 0.4 s: it is relay error, CT error, breaker time, overshoot and a safety allowance. Using it properly makes the upstream relays faster.",
    standard: "IEC 60255-151",
    readTime: "10 min read",
    scenario: [
      { label: "R1 — MCC feeder (LV)", value: "IEC SI, pickup 400 A, TMS 0.05; fault at MCC 22.9 kA" },
      { label: "R2 — LV incomer", value: "IEC SI, pickup 2,500 A; fault at LV board 37.4 kA" },
      { label: "R3 — transformer HV relay", value: "IEC SI, pickup 100 A at 11 kV (LV board fault = 1,360 A at 11 kV)" },
      { label: "Margin components (numeric relays)", value: "Relay error 5 %, CT error 10 %, breaker 50 ms, overshoot 20 ms, safety 30 ms" },
    ],
    steps: [
      { title: "Margin formula", equation: "t′ = (2Er + Ect)/100 × t + t_CB + t_o + t_s", substitution: "t′ = (2 × 5 + 10)/100 × t + 0.05 + 0.02 + 0.03 = 0.2 t + 0.10", result: "0.14 s at t = 0.2 s;  0.20 s at t = 0.5 s;  0.30 s at t = 1 s" },
      { title: "R1 at the MCC fault", equation: SI, substitution: "M = 22,905/400 = 57.3 → t1 = 0.083 s", result: "t1 = 0.083 s;  required R2 time = 0.083 + (0.2 × 0.083 + 0.10) = 0.200 s" },
      { title: "R2 TMS", substitution: "t(TMS = 1) at 22.9 kA, M = 9.16 → 3.091 s;  TMS = 0.200/3.091 = 0.065", result: "Select TMS 0.07 → 0.216 s at the MCC fault, 0.176 s at an LV board fault" },
      { title: "R3 TMS (grading with R2 at the LV board fault)", substitution: "Required: 0.176 + (0.2 × 0.176 + 0.10) = 0.312 s;  t(TMS = 1) at 1,360 A = 2.612 s;  TMS = 0.119", result: "Select TMS 0.12 (Part 3's 0.10 is too fast here)" },
      { title: "Compare with a fixed 0.4 s margin", body: "With 0.4 s, R2 would need TMS 0.16 (0.40 s at the LV board), and R3 would be slower again — adding arc-flash energy at the LV board." },
    ],
    resultSummary: [
      { check: "R2 over R1 at 22.9 kA", requirement: "≥ 0.200 s", actual: "0.216 s", pass: true },
      { check: "R3 over R2 at LV board fault", requirement: "≥ 0.312 s", actual: "TMS 0.12 → 0.313 s", pass: true },
    ],
    finalAnswer: "Using a calculated margin (0.2 t + 0.1 s), the LV incomer needs TMS 0.07 and the transformer HV relay TMS 0.12. A blanket 0.4 s margin would have made the upstream relays roughly twice as slow.",
    keyInsight: "The margin should match the equipment. Numeric relays and fast breakers justify 0.2–0.3 s; older electromechanical relays need about 0.35–0.4 s because their errors and overshoot are larger.",
    faqs: [
      { q: "Is the formula from a standard?", a: "It is a widely used engineering method (see protection application guides). IEC 60255 defines relay accuracy; the allowances for breaker time and overshoot come from the equipment data." },
      { q: "Does the margin apply at every current?", a: "Check it at the maximum current that both relays see, and at any point where the curves come closest." },
    ],
  },

  {
    slug: "earth-fault-grading-dyn-transformer-standby-earth-fault",
    groupId: "protection",
    calculatorHref: IDMT,
    calculatorName: IDMT_NAME,
    title: "Earth Fault Grading Across a Dyn Transformer: Feeder EF, Standby Earth Fault and the HV Side",
    dek: "Part 5 of the protection series. LV earth faults do not appear as earth faults on the delta HV side, so the HV earth fault relay can be fast. The neutral standby earth fault relay grades with the LV feeders.",
    standard: "IEC 60255-151",
    readTime: "9 min read",
    scenario: [
      { label: "Transformer", value: "1.6 MVA, 11/0.4 kV Dyn11, LV neutral solidly earthed with a neutral CT" },
      { label: "LV feeder EF relay", value: "IEC SI, pickup 100 A, TMS 0.10" },
      { label: "Standby earth fault (SBEF) on the neutral", value: "IEC SI, pickup 600 A (about 25 % of LV FLC)" },
      { label: "Earth fault at the far DB", value: "3.78 kA (from Part 5 of the short-circuit series)" },
      { label: "Margin", value: "0.3 s" },
    ],
    steps: [
      { title: "Feeder EF time at the DB fault", equation: SI, substitution: "M = 3,777/100 = 37.8 → t = 0.14 × 0.10 / (37.8^0.02 − 1)", result: "t = 0.186 s" },
      { title: "SBEF TMS", substitution: "Required 0.186 + 0.3 = 0.486 s;  t(TMS = 1) at M = 6.3 is 3.735 s;  TMS = 0.130", result: "Select TMS 0.14 → 0.523 s (0.13 gives 0.4856 s, just short)" },
      { title: "SBEF for a fault at the LV board", body: "For an earth fault on the board itself (38.8 kA) the SBEF is the main protection.", result: "SBEF clears in 0.225 s" },
      { title: "The HV side", body: "A Dyn transformer has a delta HV winding, which blocks zero-sequence current. An LV earth fault appears on the HV side only as phase current (815 A in two phases, see Part 3), never as residual current. The HV earth fault relay therefore does not need to grade with LV earth fault protection and can be set low and fast for HV cable and winding faults." },
      { title: "Restricted earth fault (REF)", body: "Faults inside the LV winding near the neutral produce little phase current. A REF relay compares neutral and phase CTs and trips instantaneously for winding faults only." },
    ],
    resultSummary: [
      { check: "SBEF over feeder EF at 3.78 kA", requirement: "≥ 0.486 s", actual: "0.523 s (TMS 0.14)", pass: true },
      { check: "HV EF grading with LV EF needed?", requirement: "Zero sequence blocked by delta", actual: "No", pass: true },
    ],
    finalAnswer: "The feeder EF relay clears the DB fault in 0.186 s; the SBEF on the transformer neutral at TMS 0.14 grades above it with 0.34 s margin. The HV earth fault relay is independent of LV earth faults and can be fast.",
    keyInsight: "Earth fault grading stops at a delta winding. Treat each side of a Dyn transformer as its own earth fault zone, with SBEF and REF covering the LV neutral and winding.",
    faqs: [
      { q: "Why is SBEF needed if the feeders have EF relays?", a: "It backs up the feeder relays and protects the LV board, the transformer LV terminals and the neutral conductor, which no feeder relay covers." },
      { q: "Should SBEF also be below the neutral earthing withstand?", a: "Yes. With solid earthing check the neutral conductor and transformer short-time ratings; with resistance earthing check the resistor's time rating." },
    ],
  },
];
