// Worked examples for the Solar, EV & Renewables group. Every numeric value
// was produced by running the calculator's own verified engine (pv.ts /
// ev.ts) directly with tsx, not hand-typed.

import type { WorkedExample } from "./types";

export const SOLAREV_EXAMPLES: WorkedExample[] = [
  {
    slug: "solar-pv-string-sizing-two-independent-inverter-mismatches",
    groupId: "solar-ev",
    calculatorHref: "/calculators/solar-pv",
    calculatorName: "Solar PV Sizing",
    title: "Worked Example: A 20-Module String That Fails Two Independent Inverter Checks at Once",
    dek: "A common-looking 550 Wp module and a 10 kW three-phase inverter, checked against IEC 62548's string voltage window and per-MPPT current limit — string length and module current turn out to be two completely separate problems.",
    standard: "IEC 62548 §7 (PV array design) / IEC 60364-7-712",
    incidentBased: false,
    readTime: "10 min read",
    scenario: [
      { label: "Module", value: "Voc=49.5V, Vmpp=41.5V, Isc=13.9A, Impp=13.0A, Pmax=550Wp, tempCoeff(Voc)=-0.29%/°C" },
      { label: "String configuration", value: "20 modules in series (Ns), 1 string in parallel (Np)" },
      { label: "Site temperature range", value: "5°C (cold extreme) to 65°C (hot extreme)" },
      { label: "Inverter MPPT window", value: "200 V to 850 V" },
      { label: "Inverter max DC voltage / max DC current per MPPT", value: "1000 V / 16 A" },
      { label: "Inverter AC rating", value: "10 kW, 3-phase, 400 V" },
    ],
    steps: [
      {
        title: "Compute the cold and hot temperature correction factors",
        body: "PV module voltage rises as temperature falls below the 25°C STC rating, and falls as temperature rises above it — both extremes have to be checked against the inverter's limits.",
        equation: "coldFactor = 1 + (tempCoeff/100) x (siteTempMin - 25)          hotFactor = 1 + (tempCoeff/100) x (siteTempMax - 25)",
        substitution: "1 + (-0.29/100) x (5-25) = 1 + 0.058          1 + (-0.29/100) x (65-25) = 1 - 0.116",
        result: "coldFactor = 1.058, hotFactor = 0.884",
      },
      {
        title: "Check worst-case (cold) open-circuit string voltage against the inverter's max DC voltage",
        equation: "Vmax = Voc x Ns x coldFactor",
        substitution: "49.5 x 20 x 1.058",
        result: "Vmax = 1047.42 V — exceeds the inverter's 1000 V maximum. FAIL",
      },
      {
        title: "Check the MPPT operating window at both temperature extremes",
        equation: "VmppCold = Vmpp x Ns x coldFactor          VmppHot = Vmpp x Ns x hotFactor",
        substitution: "41.5 x 20 x 1.058 = 878.14 V          41.5 x 20 x 0.884 = 733.72 V",
        result: "VmppCold 878.14 V exceeds the 850 V MPPT ceiling (VmppHot 733.72 V clears the 200 V floor fine). FAIL",
      },
      {
        title: "Check the string's design short-circuit current against the inverter's per-MPPT current limit",
        body: "IEC 62548 applies a 1.25x safety margin to the module's rated Isc for this check — and this figure depends only on the module and the 1.25x factor, not on how many modules are wired in series.",
        equation: "IscDesign = Isc x 1.25",
        substitution: "13.9 x 1.25",
        result: "IscDesign = 17.375 A — exceeds the inverter's 16 A max DC current per MPPT. FAIL",
      },
      {
        title: "Size the DC and AC cables (both pass independently of the above)",
        table: {
          headers: ["Cable", "Design current", "Selected size", "Derated ampacity", "Voltage drop"],
          rows: [
            ["DC string cable", "17.375 A", "4 mm²", "36.4 A", "1.38% (≤2% limit) — PASS"],
            ["AC output cable", "18.04 A (10kW/√3/400V x 1.25)", "2.5 mm²", "30 A", "2.06% (≤3% limit) — PASS"],
          ],
        },
      },
      {
        title: "Check the DC:AC ratio",
        equation: "arrayKwp = Ns x Np x Pmax / 1000          ratio = arrayKwp / acPowerKw",
        substitution: "20 x 1 x 550 / 1000 = 11 kWp          11 / 10",
        result: "DC:AC ratio = 1.10 — within the normal 0.8–1.3 range, no clipping concern",
      },
      {
        title: "Attempt a fix: reduce the series count to 19 modules",
        body: "Dropping one module from the string lowers both Vmax and VmppCold proportionally.",
        equation: "Vmax(Ns=19) = 49.5 x 19 x 1.058          VmppCold(Ns=19) = 41.5 x 19 x 1.058",
        substitution: "recomputed with Ns=19",
        result: "Vmax = 995.05 V (PASS, under 1000 V) and VmppCold = 834.23 V (PASS, under 850 V) — the voltage and MPPT-window failures are both resolved",
      },
      {
        title: "Re-check current with the fixed string length",
        body: "IscDesign depends only on the module and the 1.25x margin, not on Ns — so this failure is untouched by shortening the string.",
        result: "IscDesign is still 17.375 A against a 16 A limit — still FAILS, even after fixing the voltage problem",
      },
    ],
    resultSummary: [
      { check: "Max string voltage (cold)", requirement: "≤ 1000 V", actual: "1047.42 V (Ns=20)", pass: false },
      { check: "MPPT window (cold ceiling)", requirement: "≤ 850 V", actual: "878.14 V (Ns=20)", pass: false },
      { check: "Per-MPPT design current", requirement: "≤ 16 A", actual: "17.375 A", pass: false },
      { check: "DC cable voltage drop", requirement: "≤ 2%", actual: "1.38%", pass: true },
      { check: "AC cable voltage drop", requirement: "≤ 3%", actual: "2.06%", pass: true },
    ],
    finalAnswer: "This module and inverter combination fails on three independent grounds at the default 20-module string length: string voltage, MPPT window, and per-MPPT current. Shortening the string to 19 modules resolves the voltage and MPPT-window failures, but the current failure is completely unrelated to string length — this module's Isc simply exceeds what this inverter's MPPT channel is rated to accept, and can only be resolved with a lower-Isc module or an inverter with a higher per-MPPT current rating.",
    keyInsight: "String voltage/MPPT-window checks and per-MPPT current checks are governed by entirely different design levers — series module count controls the first, module short-circuit current controls the second — so a design that 'fixes' one by changing string length can still fail the other outright. Both need to be checked independently rather than assuming that resolving one automatically resolves the array.",
    faqs: [
      {
        q: "Why does the voltage check use the cold extreme and not the hot extreme?",
        a: "PV voltage rises as temperature falls, so the coldest expected site temperature produces the highest string voltage — this is exactly the condition that risks exceeding an inverter's absolute maximum DC input voltage rating, which is why IEC 62548 requires the cold-extreme calculation for this specific check even though the array will spend far more of its life at higher temperatures.",
      },
      {
        q: "Could adding a second parallel string (Np=2) fix the current problem?",
        a: "Not on this calculator's free-tier per-MPPT current check — that check compares a single string's Isc-based design current against the inverter's per-MPPT limit, because each string is assumed to land on its own MPPT input. A second string only helps if it is wired to a separate MPPT channel with its own headroom, not if both strings are combined onto the same overloaded input; combining multiple strings onto a shared combiner is exactly what the subscriber-tier multi-string OCPD sizing in this calculator is for.",
      },
    ],
  },

  {
    slug: "ev-charge-point-sizing-and-multi-point-site-diversity",
    groupId: "solar-ev",
    calculatorHref: "/calculators/ev-charging",
    calculatorName: "EV Charging",
    title: "Worked Example: Single Charge Point Sizing, a TN-C-S Earthing Trap, and Multi-Point Site Diversity",
    dek: "One 32A Mode 3 charge point, a common earthing mistake the calculator catches automatically, and how a Load Management System can roughly halve a 10-point site's feeder size.",
    standard: "IEC 61851-1 / IEC 60364-7-722 / IEC 62955",
    incidentBased: false,
    readTime: "10 min read",
    scenario: [
      { label: "Charge point mode", value: "Mode 3 (AC, with communication)" },
      { label: "Rated current / voltage", value: "32 A, 400 V 3-phase" },
      { label: "Circuit route length", value: "25 m, Method C, Cu/XLPE" },
      { label: "Earthing system (for illustration)", value: "TN-C-S (PME)" },
      { label: "Site size", value: "10 charge points" },
      { label: "Site feeder length", value: "40 m" },
    ],
    steps: [
      {
        title: "Size the single charge point's circuit cable and breaker",
        equation: "Ib = ratedCurrentA = 32 A",
        result: "Selected cable: 4 mm², derated ampacity 40 A, voltage drop 3.81% (≤5% limit — PASS). Breaker: 32 A (next standard size ≥ Ib)",
      },
      {
        title: "Check the earthing system for a TN-C-S (PME) conflict",
        body: "A TN-C-S supply carries a combined protective-and-neutral (PEN) conductor upstream of the property — IEC 60364-7-722 prohibits extending a PEN conductor into the final circuit feeding an EV charge point, because a lost PEN connection could otherwise put dangerous voltage onto the vehicle's exposed metalwork.",
        result: "TN-C-S triggers a warning: convert this circuit to TN-S locally, and fit an open-PEN detection device or a local TT-style earth electrode — regardless of which RCD type is fitted",
      },
      {
        title: "Confirm the RCD choice is compliant",
        result: "Type A + RDC-DD per IEC 62955 selected — the RDC-DD trips on ≥6 mA smooth DC before it can blind the upstream Type A RCD, treated as equivalent protection to a Type B RCD",
      },
      {
        title: "Size the site feeder for 10 points with no Load Management System",
        body: "IEC 60364-7-722.311 requires a diversity factor of 1 (no reduction at all) when there is no LMS — every point must be assumed capable of drawing full rated current simultaneously.",
        equation: "rawA = numPoints x perPointA          diversifiedA = rawA x diversityFactor",
        substitution: "10 x 32 = 320 A          320 x 1 (no LMS)",
        result: "diversifiedA = 320 A → feeder sized to 120 mm², derated ampacity 322 A, voltage drop 2.00% (≤5% — PASS)",
      },
      {
        title: "Re-size the same 10-point site with a Load Management System declared",
        equation: "diversifiedA = rawA x diversityFactor",
        substitution: "320 x 0.6 (LMS-declared factor)",
        result: "diversifiedA = 192 A → feeder drops to 70 mm², derated ampacity 229 A, voltage drop 2.10% (≤5% — PASS)",
      },
    ],
    resultSummary: [
      { check: "Single charge point voltage drop", requirement: "≤ 5%", actual: "3.81%", pass: true },
      { check: "Earthing check (TN-C-S)", requirement: "No PEN in final circuit", actual: "Warning triggered — conversion required", pass: false },
      { check: "10-point feeder, no LMS", requirement: "Support 320 A", actual: "120 mm², 322 A capacity", pass: true },
      { check: "10-point feeder, with LMS (0.6)", requirement: "Support 192 A", actual: "70 mm², 229 A capacity", pass: true },
    ],
    finalAnswer: "The single 32 A charge point circuit sizes cleanly to a 4 mm² cable and 32 A breaker. On a TN-C-S supply, the calculator flags a mandatory earthing conversion before the circuit can be considered compliant. At full 10-point site scale, declaring a Load Management System with a 0.6 diversity factor drops the required feeder from 120 mm² (no LMS, 320 A) to 70 mm² (with LMS, 192 A) — a substantial reduction, but one that is only permitted with an LMS in place; without one, the code requires designing for the full undiversified load.",
    keyInsight: "Diversity factors for EV sites are not a general convenience — IEC 60364-7-722.311 ties the right to apply any diversity below 1.0 directly to having a Load Management System in place. Without an LMS, every charge point must be assumed capable of running at full rated current at the same time, which is why the 'no LMS' feeder here has to support the full 320 A raw demand rather than any reduced figure.",
    faqs: [
      {
        q: "Why does a TN-C-S supply specifically get flagged as a problem, when TN-S and TT don't?",
        a: "In a TN-C-S (PME) system, the neutral and protective earth share a single PEN conductor for part of the network — if that PEN conductor breaks upstream, the property's earth terminal can float up to line voltage. On a normal socket circuit this is a recognized but generally low-frequency risk; on an EV charge point, a person may be standing on damp ground with one hand on a metal vehicle chassis connected to that same earth, which is exactly the scenario IEC 60364-7-722 singles out with mandatory extra protection (PEN conductor exclusion from the final circuit, open-PEN detection, or a local TT-style electrode).",
      },
      {
        q: "What exactly does the LMS-declared diversity figure of 0.6 represent, and where does it come from?",
        a: "It is not a fixed code value — IEC 60364-7-722 deliberately leaves the exact figure to the Load Management System's own real-time control strategy and the site design, which is why this calculator's note explicitly says to 'use your LMS/DSO-approved figure and verify it independently' rather than presenting 0.6 as a universal constant; a different LMS product or site agreement could justify a different figure entirely.",
      },
    ],
  },
];
