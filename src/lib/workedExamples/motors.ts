// Worked examples for the Motors & Drives group. Every numeric value was
// produced by running the calculator's own verified engine (motor.ts /
// motorprotection.ts / vfdsavings.ts) directly with tsx, not hand-typed.

import type { WorkedExample } from "./types";

export const MOTORS_EXAMPLES: WorkedExample[] = [
  {
    slug: "motor-branch-circuit-sizing-25hp-dol-nec430",
    groupId: "motors",
    calculatorHref: "/calculators/motor-calculator",
    calculatorName: "Motor Calculator",
    title: "Worked Example: Branch-Circuit Sizing for a 25 HP DOL Motor per NEC Article 430",
    dek: "A 25 HP motor's branch circuit sized entirely off its NEC table full-load current, not nameplate — plus checking the voltage dip its direct-on-line start produces at the site's short-circuit capacity.",
    standard: "NEC Article 430",
    readTime: "10 min read",
    scenario: [
      { label: "Motor", value: "25 HP, three-phase squirrel-cage induction, 460 V" },
      { label: "Full-load current source", value: "NEC Table 430.250" },
      { label: "Overcurrent device", value: "Time-delay fuse" },
      { label: "Starting method", value: "Direct-on-line (DOL), locked-rotor current 180 A" },
      { label: "System short-circuit capacity", value: "5000 kVA" },
      { label: "Maximum acceptable starting voltage dip", value: "15%" },
    ],
    steps: [
      {
        title: "Look up full-load current from NEC Table 430.250 (not nameplate)",
        body: "NEC Article 430 deliberately requires using the table FLC value for sizing calculations, even if the nameplate current differs slightly — the table value is what standardizes protection coordination across motors of the same rating.",
        result: "FLC = 34 A (25 HP, 460 V, three-phase induction)",
      },
      {
        title: "Size the branch-circuit conductor ampacity",
        equation: "branchAmpacity = 125% x FLC",
        substitution: "1.25 x 34",
        result: "42.5 A minimum conductor ampacity",
      },
      {
        title: "Size the disconnect and overload protection",
        equation: "disconnect = 115% x FLC          overload = 115% x FLC (no high-temp/high-SF marking assumed)",
        substitution: "1.15 x 34",
        result: "Disconnect and overload both = 39.1 A",
      },
      {
        title: "Size the branch-circuit OCPD (time-delay fuse, 'other' motor category)",
        equation: "maxOcpd = 175% x FLC, rounded to standard size",
        substitution: "1.75 x 34 = 59.5 A -> standard size",
        result: "maxOcpd = 60 A (with a 70 A exception ceiling available if 60 A can't start the motor)",
      },
      {
        title: "Find starting current and starting kVA",
        equation: "startKva = √3 x V x Istart / 1000",
        substitution: "1.732 x 460 x 180 / 1000",
        result: "startKva = 143.4 kVA",
      },
      {
        title: "Check the resulting voltage dip against the system's short-circuit capacity",
        equation: "dip% = startKva / (scCapacityKva + startKva) x 100",
        substitution: "143.4 / (5000 + 143.4) x 100",
        result: "dip = 2.79%, well under the 15% limit",
      },
    ],
    resultSummary: [
      { check: "Branch-circuit conductor ampacity", requirement: "≥ 42.5 A", actual: "42.5 A (sizing target)", pass: true },
      { check: "Branch-circuit OCPD", requirement: "n/a (this is the sizing result)", actual: "60 A time-delay fuse", pass: true },
      { check: "DOL starting voltage dip", requirement: "≤ 15%", actual: "2.79%", pass: true },
    ],
    finalAnswer: "This 25 HP motor needs a 42.5 A-rated conductor, a 60 A time-delay fuse, and 39.1 A disconnect/overload ratings — and its direct-on-line start produces only a 2.79% voltage dip against this site's strong 5000 kVA short-circuit capacity, so no reduced-voltage starting method is needed here.",
    keyInsight: "Every downstream protection figure in this calculation traces back to the single NEC table FLC value (34 A), not the motor's actual nameplate current — this is a deliberate feature of NEC Article 430, not an approximation, since it keeps branch-circuit sizing consistent and predictable across motors of the same horsepower/voltage/phase rating regardless of small manufacturer-to-manufacturer nameplate variation.",
    faqs: [
      {
        q: "Why would the same motor need a reduced-voltage starter at a different site?",
        a: "Voltage dip depends on the ratio between starting kVA and the system's short-circuit capacity at that point — the same 143.4 kVA starting demand against a weaker 1000 kVA system (instead of this example's 5000 kVA) would produce a dip around 12.5%, getting close to the 15% limit, and against an even weaker system could exceed it, at which point a star-delta, soft starter, or VFD start would be needed to reduce starting current.",
      },
      {
        q: "What's the difference between the 60 A standard OCPD and the 70 A exception ceiling?",
        a: "NEC 430.52(C)(1)(b) permits going up to a higher percentage of FLC (225% for a time-delay fuse, versus the standard 175%) specifically when the standard-size device genuinely can't carry the motor's starting current without nuisance tripping — it's not a size to default to, but a documented exception to use only when the lower standard size has actually proven insufficient.",
      },
    ],
  },

  {
    slug: "motor-protection-overload-contactor-ground-fault",
    groupId: "motors",
    calculatorHref: "/calculators/motor-protection-sizer",
    calculatorName: "Motor Protection Sizer",
    title: "Worked Example: Overload, Contactor and Ground-Fault Settings for a 34 A Motor",
    dek: "Three independent protection settings for the same motor — overload trip class chosen from its starting time, contactor size from its duty, and ground-fault pickup from the system's earthing arrangement.",
    standard: "NEC 430.32 / IEC 60947-4-1",
    readTime: "9 min read",
    scenario: [
      { label: "Motor full-load current", value: "34 A" },
      { label: "Service factor / temp rise marking", value: "Standard (not ≥1.15 SF or ≤40°C rise)" },
      { label: "Starting time", value: "8 seconds" },
      { label: "Duty class", value: "S1 — continuous running" },
      { label: "Starts per hour", value: "4" },
      { label: "Contactor duty", value: "AC-3 (normal start/stop)" },
      { label: "System grounding", value: "Solidly grounded" },
    ],
    steps: [
      {
        title: "Set the overload relay pickup",
        body: "Without a high-service-factor or low-temperature-rise nameplate marking, NEC 430.32 defaults to the more conservative 115% setting.",
        equation: "settingA = FLA x 115%",
        substitution: "34 x 1.15",
        result: "settingA = 39.1 A",
      },
      {
        title: "Select the overload relay trip class from starting time",
        body: "IEC 60947-4-1 trip classes are named for their maximum trip time (seconds) at 7.2x rated current — a longer starting time needs a trip class that tolerates that duration without nuisance tripping during a normal start.",
        substitution: "8 seconds falls in the 2–10 second band",
        result: "Trip Class 10",
      },
      {
        title: "Check whether thermal memory (electronic overload) is required",
        equation: "Required if duty class is S4/S5, or starts/hour > 15",
        substitution: "S1 duty, 4 starts/hour — neither condition met",
        result: "A standard bimetal overload relay is adequate; thermal memory not required",
      },
      {
        title: "Size the contactor",
        body: "AC-3 duty (normal motor starting/stopping) uses the motor's FLA directly, with no additional multiplier.",
        equation: "requiredEquivalentA = FLA (AC-3)",
        result: "34 A required -> rounds up to the next standard contactor frame, 40 A",
      },
      {
        title: "Set ground-fault pickup for the solidly grounded system",
        equation: "pickupA = max(20% x FLA, 5 A)",
        substitution: "max(0.2 x 34, 5) = max(6.8, 5)",
        result: "pickupA = 6.8 A, fast definite-time delay (0.1 s)",
      },
    ],
    resultSummary: [
      { check: "Overload relay setting", requirement: "n/a (this is the sizing result)", actual: "39.1 A, Trip Class 10", pass: true },
      { check: "Contactor size", requirement: "≥ 34 A (AC-3)", actual: "40 A standard frame", pass: true },
      { check: "Ground-fault pickup", requirement: "n/a (this is the sizing result)", actual: "6.8 A, 0.1 s delay", pass: true },
    ],
    finalAnswer: "This motor's protection scheme calls for a 39.1 A overload set to Trip Class 10, a 40 A AC-3 contactor, and a fast (0.1 s) ground-fault trip at 6.8 A — three independent settings, each driven by a different characteristic of the motor and its installation.",
    keyInsight: "Overload trip class and contactor duty rating solve two completely different problems — trip class is about tolerating a normal motor start's inrush without nuisance tripping, while contactor rating is about the switching duty of making and breaking the circuit itself. A motor with a long starting time and light switching duty (or vice versa) can need very different combinations of these two settings, which is why they're sized independently rather than from one single number.",
    faqs: [
      {
        q: "What would change with AC-4 (jogging/reversing) contactor duty instead of AC-3?",
        a: "AC-4 duty applies a 2.0x conservative multiplier to the required equivalent current (a rule-of-thumb, not a single universal standard ratio, since it's genuinely manufacturer/model specific) — for this 34 A motor, that would push the requirement to 68 A, jumping to an 80 A standard contactor frame instead of 40 A, reflecting the much more severe electrical wear of frequent jogging or plugging duty compared to normal start/stop.",
      },
      {
        q: "Why does an HRG (high-resistance grounded) system need a completely different ground-fault approach?",
        a: "On a solidly grounded system, ground faults draw high current that a simple percentage-of-FLA pickup can reliably detect quickly. HRG systems are deliberately designed to limit ground-fault current to a small, controlled charging current — so ground-fault pickup instead has to be set relative to that system's own charging current (roughly 2x it) with a longer alarm/delayed-trip time, since the goal on an HRG system is often to alarm and allow orderly shutdown rather than instantly trip.",
      },
    ],
  },

  {
    slug: "vfd-energy-savings-centrifugal-pump-affinity-laws",
    groupId: "motors",
    calculatorHref: "/calculators/vfd-savings",
    calculatorName: "Pump/Fan VFD Energy Savings",
    title: "Worked Example: Energy Savings from Switching a Throttled Pump to VFD Control",
    dek: "A 75 kW pump motor, currently running throttled at reduced flow — the affinity laws show why VFD speed control saves dramatically more energy than a valve ever could.",
    standard: "Centrifugal-load affinity laws (power ∝ speed³)",
    readTime: "8 min read",
    scenario: [
      { label: "Motor rated power", value: "75 kW" },
      { label: "Required flow reduction", value: "30% (operating at 70% of full flow)" },
      { label: "Current control method", value: "Throttling valve (baseline power ≈100% of rated, since a valve barely reduces motor power)" },
      { label: "Operating hours", value: "6000 hours/year" },
      { label: "Electricity rate", value: "$0.12/kWh" },
    ],
    steps: [
      {
        title: "Find the flow fraction at the reduced-flow operating point",
        equation: "flowFraction = 1 - flowReduction%",
        substitution: "1 - 0.30",
        result: "flowFraction = 0.70 (70% of full flow)",
      },
      {
        title: "Apply the cubic affinity law to find VFD power at reduced speed",
        body: "For a centrifugal pump/fan against a quadratic system curve, speed reduction tracks flow reduction, and power scales with the cube of speed.",
        equation: "vfdPower = ratedPower x flowFraction³",
        substitution: "75 x 0.70³ = 75 x 0.343",
        result: "vfdPower = 25.73 kW",
      },
      {
        title: "Compare against the throttled baseline power",
        body: "A throttling valve reduces flow by adding restriction, not by slowing the motor — the motor keeps drawing close to its full rated power even though less fluid is actually moving.",
        result: "Baseline (throttled) power ≈ 75 kW (unchanged from full-flow, full-speed power)",
      },
      {
        title: "Compute power savings and annualize",
        equation: "powerSavings = baselinePower - vfdPower          annualSavings = powerSavings x hours x rate",
        substitution: "75 - 25.73 = 49.28 kW;   49.28 x 6000 x 0.12",
        result: "Annual energy savings = 295,650 kWh -> $35,478/year",
      },
    ],
    resultSummary: [
      { check: "VFD power at 70% flow", requirement: "n/a (this is the computed result)", actual: "25.73 kW, down from ≈75 kW throttled", pass: true },
      { check: "Annual cost savings", requirement: "n/a (this is the computed result)", actual: "$35,478/year", pass: true },
    ],
    finalAnswer: "Switching from a throttling valve to VFD speed control at this pump's typical 70%-flow operating point saves roughly 49 kW continuously — worth about $35,478 per year at 6000 operating hours and $0.12/kWh, entirely from the cubic relationship between speed and power.",
    keyInsight: "The cube law is what makes VFD retrofits so consistently attractive for variable-flow applications — a modest 30% flow reduction, which might seem to warrant only a modest power reduction, actually corresponds to a much larger 65.7% power reduction (0.70³ = 0.343, so power drops to 34.3% of rated) once speed is actually allowed to drop along with flow, rather than being held constant and throttled.",
    faqs: [
      {
        q: "Why does a throttling valve barely reduce motor power at all?",
        a: "A throttling valve reduces flow by adding artificial resistance to the system, forcing the pump to work against a higher effective head at the same speed — the motor still has to do nearly as much work overcoming that added resistance, so throttled power stays close to full-load power even though delivered flow has dropped. This is exactly the wasted energy a VFD retrofit eliminates by letting the pump simply slow down instead.",
      },
      {
        q: "Does this savings estimate apply to any pump or fan?",
        a: "It applies specifically to centrifugal-type loads against a system curve dominated by friction/velocity losses (a 'quadratic' system curve) — positive-displacement pumps, and systems dominated by static head rather than friction, don't follow the same cubic power-vs-flow relationship, and the baseline throttled-power assumption itself is a conservative simplification; a bankable savings estimate should use actual trended power data or a real pump/fan curve rather than this default assumption.",
      },
    ],
  },
];
