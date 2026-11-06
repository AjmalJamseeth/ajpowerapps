// Arc flash learning series (5 examples), IEEE 1584-2018. Results come from
// calcAf2018 / analyseArcFlash and are pinned in scripts/regression-test.ts
// ("Learning series — arc flash"). Unless stated, the equipment is 415 V
// low-voltage switchgear (IEEE 1584-2018 typical: gap 32 mm, enclosure
// 508 × 508 × 508 mm, working distance 609.6 mm).

import type { WorkedExample } from "./types";

const AF = "/calculators/arc-flash";
const AF_NAME = "Arc Flash";
const LVSG = { label: "Equipment", value: "415 V LV switchgear: gap 32 mm, enclosure 508 × 508 × 508 mm, working distance 610 mm" };

export const SERIES_ARCFLASH_EXAMPLES: WorkedExample[] = [
  {
    slug: "arc-flash-electrode-configuration-vcb-vcbb-hcb",
    groupId: "short-circuit",
    calculatorHref: AF,
    calculatorName: AF_NAME,
    title: "Arc Flash Electrode Configuration: VCB vs VCBB vs HCB at a 415 V Switchboard",
    dek: "Part 1 of the arc flash series. Same fault current, same clearing time — and the incident energy changes from 3.3 to 5.9 cal/cm² just by how the conductors are arranged.",
    standard: "IEEE 1584-2018",
    readTime: "8 min read",
    scenario: [LVSG, { label: "Bolted fault current", value: "30 kA" }, { label: "Clearing time", value: "100 ms" }],
    steps: [
      { title: "What the configurations mean", body: "VCB: vertical conductors in a box. VCBB: vertical conductors ending in an insulating barrier, which pushes the arc towards the worker. HCB: horizontal conductors pointing out of the box, directing the plasma straight out. IEEE 1584-2018 gives each its own coefficients." },
      { title: "Arcing current", body: "The arc's own impedance limits the current. IEEE 1584-2018 also calculates a reduced arcing current (variation factor) to check slower protection.", result: "VCB 19.9 kA;  VCBB 22.4 kA;  HCB 19.2 kA" },
      {
        title: "Incident energy at 610 mm",
        table: { headers: ["Configuration", "E (cal/cm²)", "Arc-flash boundary (mm)", "Indicative PPE"], rows: [["VCB", "3.29", "1,146", "Category 1"], ["VCBB", "4.39", "1,249", "Category 2"], ["HCB", "5.87", "1,333", "Category 2"]] },
      },
      { title: "Which one to use", body: "Choose the configuration that matches the actual bus arrangement where work is done — for example, HCB for horizontal bus bars facing the door or for breaker line-side terminals pointing out. When in doubt, check more than one and use the higher energy." },
    ],
    resultSummary: [
      { check: "VCB", requirement: "≤ 4 cal/cm² for Category 1", actual: "3.29 cal/cm²", pass: true },
      { check: "HCB", requirement: "≤ 4 cal/cm² for Category 1", actual: "5.87 cal/cm²", pass: false },
    ],
    finalAnswer: "At 30 kA and 100 ms the incident energy is 3.29 cal/cm² for VCB, 4.39 for VCBB and 5.87 for HCB. Picking the wrong configuration can understate the hazard by almost half.",
    keyInsight: "In IEEE 1584-2018 geometry matters as much as current. HCB typically gives the highest energy because the arc plasma is driven towards the worker.",
    faqs: [
      { q: "Why did IEEE 1584-2018 add configurations?", a: "Testing showed that electrode orientation and barriers change the energy reaching the worker substantially, which the 2002 edition did not capture." },
      { q: "Which configuration is typical for LV switchgear?", a: "VCB is the usual default, but many MCC buckets and breaker terminals are better described by VCBB or HCB." },
    ],
  },

  {
    slug: "arc-flash-clearing-time-effect-incident-energy",
    groupId: "short-circuit",
    calculatorHref: AF,
    calculatorName: AF_NAME,
    title: "Arc Flash and Clearing Time: 50 ms, 300 ms and 1 s at the Same Switchboard",
    dek: "Part 2 of the arc flash series. Incident energy is proportional to arc duration. The same 30 kA fault gives 1.6, 9.9 or 32.9 cal/cm² depending only on how fast the protection clears it.",
    standard: "IEEE 1584-2018",
    readTime: "7 min read",
    scenario: [LVSG, { label: "Bolted fault current", value: "30 kA (arcing current 19.9 kA, VCB)" }, { label: "Clearing times compared", value: "50 ms (instantaneous), 300 ms (short-time delay), 1,000 ms (IDMT at low current)" }],
    steps: [
      { title: "Energy is linear in time", equation: "E ∝ I_arc^x × t / D^y", body: "For a given arcing current and distance, doubling the arc time doubles the energy." },
      {
        title: "Results",
        table: { headers: ["Clearing time", "E (cal/cm²)", "Boundary (mm)", "Indicative PPE"], rows: [["50 ms", "1.64", "742", "Category 1"], ["300 ms", "9.87", "2,278", "Category 3"], ["1,000 ms", "32.9", "4,840", "Category 4"]] },
      },
      { title: "Where long clearing times come from", body: "Short-time delays added for selectivity (often 0.3–0.5 s), upstream relays protecting LV boards from the HV side, and arcing currents falling below an instantaneous setting (see Part 4)." },
    ],
    resultSummary: [
      { check: "50 ms", requirement: "≤ 8 cal/cm²", actual: "1.64 cal/cm²", pass: true },
      { check: "300 ms", requirement: "≤ 8 cal/cm²", actual: "9.87 cal/cm²", pass: false },
      { check: "1,000 ms", requirement: "≤ 40 cal/cm²", actual: "32.9 cal/cm²", pass: true },
    ],
    finalAnswer: "Reducing the clearing time from 1 s to 50 ms reduces the incident energy from 32.9 to 1.64 cal/cm² — a factor of 20. Clearing time is the most powerful lever in arc flash mitigation.",
    keyInsight: "Selectivity and arc flash pull in opposite directions: every time delay added for coordination adds energy. Arc-flash relays, zone interlocking and maintenance switches resolve the conflict.",
    faqs: [
      { q: "Does the boundary also scale linearly?", a: "No. The boundary grows more slowly than the energy, because energy falls off with distance raised to a power." },
      { q: "Is there a maximum arc time?", a: "IEEE 1584-2018 notes that 2 s is a reasonable maximum when a person can move away from the arc; the calculator uses this as a cap." },
    ],
  },

  {
    slug: "arc-flash-maintenance-mode-switch-energy-reduction",
    groupId: "short-circuit",
    calculatorHref: AF,
    calculatorName: AF_NAME,
    title: "Arc Flash Maintenance Mode: Cutting 20.6 cal/cm² to 2.9 at a Main LV Switchboard",
    dek: "Part 3 of the arc flash series. A main ACB with a 430 ms short-time delay gives Category 3. An energy-reducing maintenance switch that clears in 60 ms brings it to Category 1 while people work.",
    standard: "IEEE 1584-2018 / NFPA 70E",
    readTime: "7 min read",
    scenario: [LVSG, { label: "Bolted fault current", value: "50 kA (arcing current 27.8 kA)" }, { label: "Normal clearing", value: "430 ms (short-time delay 0.4 s + breaker)" }, { label: "Maintenance mode", value: "Instantaneous trip enabled, total 60 ms" }],
    steps: [
      { title: "Normal settings", result: "E = 20.6 cal/cm², boundary 3.6 m — Category 3 arc flash suit" },
      { title: "Maintenance mode", result: "E = 2.87 cal/cm², boundary 1.05 m — Category 1" },
      { title: "How it works", body: "A switch (often with an indicator light and padlock) temporarily enables a fast instantaneous or arc-flash setting while work is done. Selectivity is given up only during that time." },
      { title: "Procedure points", body: "The switch must be on before the work starts and confirmed (light, display), it must be on the upstream device feeding the equipment being worked on, and it must be returned to normal afterwards. Labels should show both energies and say which applies." },
    ],
    resultSummary: [
      { check: "Normal mode", requirement: "≤ 8 cal/cm²", actual: "20.6 cal/cm²", pass: false },
      { check: "Maintenance mode", requirement: "≤ 8 cal/cm²", actual: "2.87 cal/cm²", pass: true },
    ],
    finalAnswer: "Enabling the maintenance switch reduces the incident energy at the main switchboard from 20.6 to 2.87 cal/cm², and the boundary from 3.6 m to 1.05 m.",
    keyInsight: "The maintenance setting protects the equipment the upstream breaker feeds, not the breaker's own line side. Faults on the line side are cleared by the device further upstream.",
    faqs: [
      { q: "Does NFPA 70E require energy reduction?", a: "NFPA 70 (NEC 240.87) requires an energy-reducing method for breakers rated 1,200 A or more; maintenance switches are one of the accepted methods." },
      { q: "What are the alternatives?", a: "Zone-selective interlocking, arc-flash relays with light sensors, bus differential protection, or remote racking and operation." },
    ],
  },

  {
    slug: "arc-flash-minimum-fault-current-generator-supply-slow-clearing",
    groupId: "short-circuit",
    calculatorHref: AF,
    calculatorName: AF_NAME,
    title: "Arc Flash at Minimum Fault Current: Why Generator Supply Can Give Eight Times More Energy",
    dek: "Part 4 of the arc flash series. On the transformer the arcing current trips the instantaneous element in 70 ms (2.7 cal/cm²). On a standby generator the current falls below it and the arc lasts 1.8 s (23 cal/cm²).",
    standard: "IEEE 1584-2018",
    readTime: "9 min read",
    scenario: [
      LVSG,
      { label: "Bolted fault current", value: "37 kA on the transformer; 12 kA on the standby generator" },
      { label: "Protection", value: "IEC Standard Inverse, pickup 2,500 A, TMS 0.3; instantaneous 15 kA (20 ms); breaker 50 ms" },
    ],
    steps: [
      { title: "Transformer supply (maximum)", body: "Arcing current 23.3 kA is above the 15 kA instantaneous setting.", result: "t = 20 + 50 = 70 ms → E = 2.74 cal/cm² (Category 1)" },
      {
        title: "Generator supply (minimum)",
        equation: "t = 0.14 × TMS / ((I/Ip)^0.02 − 1) + breaker",
        substitution: "Arcing current 8.37 kA < 15 kA → IDMT: 0.14 × 0.3 / ((8370/2500)^0.02 − 1) + 0.05",
        result: "t = 1.77 s → E = 23.0 cal/cm² (Category 3); the reduced arcing current 7.31 kA gives 1.99 s",
      },
      { title: "Fix: lower the instantaneous setting", body: "Set the instantaneous element to 6 kA, above downstream devices' let-through and motor starting but below the minimum arcing current.", result: "t = 70 ms → E = 0.91 cal/cm² on generator supply" },
    ],
    resultSummary: [
      { check: "Transformer supply", requirement: "≤ 8 cal/cm²", actual: "2.74 cal/cm²", pass: true },
      { check: "Generator supply, inst 15 kA", requirement: "≤ 8 cal/cm²", actual: "23.0 cal/cm²", pass: false },
      { check: "Generator supply, inst 6 kA", requirement: "≤ 8 cal/cm²", actual: "0.91 cal/cm²", pass: true },
    ],
    finalAnswer: "The lower fault current on generator supply drops the arcing current below the instantaneous pickup, so the arc lasts 1.8 s and the energy rises from 2.7 to 23 cal/cm². Lowering the instantaneous setting to 6 kA (or a generator-mode setting group) restores fast clearing.",
    keyInsight: "The highest incident energy often comes from the lowest fault current. Every operating mode — normal, one transformer out, generator only — must be studied.",
    faqs: [
      { q: "Why compare the instantaneous setting with the arcing current, not the bolted current?", a: "The protection sees the current that actually flows during the arc, which at LV can be half the bolted value." },
      { q: "Can setting groups help?", a: "Yes. Many numeric relays switch to a generator setting group automatically when the incomer opens and the generator closes." },
    ],
  },

  {
    slug: "arc-flash-study-network-labels-ppe-every-bus",
    groupId: "short-circuit",
    calculatorHref: "/calculators/arc-flash-study",
    calculatorName: "Arc Flash Study (IEEE 1584-2018)",
    title: "Arc Flash Study for a Small Network: Energy, Boundary and PPE at Every Bus",
    dek: "Part 5 of the arc flash series. An 11 kV board, a 0.4 kV LV board and an MCC studied together. The LV board is the worst point because its incomer faults are cleared by the 11 kV relay.",
    standard: "IEEE 1584-2018 / IEC 60909",
    readTime: "10 min read",
    scenario: [
      { label: "Network", value: "250 MVA grid + 2.5 MVA generator at 11 kV → 1.6 MVA, 6 % transformer → 0.4 kV LV board → 50 m cable → MCC with a 160 kW motor" },
      { label: "11 kV board", value: "15 kV switchgear, clearing 300 ms" },
      { label: "LV board", value: "LV switchgear, cleared by the transformer's 11 kV relay (IEC SI, pickup 100 A, TMS 0.15, breaker 50 ms)" },
      { label: "MCC", value: "Shallow LV MCC, cleared by the feeder breaker in 100 ms" },
      { label: "Basis", value: "Fault currents at nominal voltage (c = 1), maximum and minimum cases" },
    ],
    steps: [
      { title: "Fault currents from IEC 60909", result: "11 kV board 14.2 kA;  LV board 39.7 kA;  MCC 23.0 kA" },
      {
        title: "Results at each bus",
        table: { headers: ["Bus", "Clearing", "E (cal/cm²)", "Boundary", "Indicative PPE"], rows: [["11 kV switchboard", "300 ms", "4.70", "2.18 m", "Category 2"], ["0.4 kV LV board", "526 ms", "21.2", "3.68 m", "Category 3"], ["MCC", "100 ms", "2.54", "0.73 m", "Category 1"]] },
      },
      { title: "Why the LV board is worst", body: "A fault on the LV board's incoming terminals is upstream of the LV incomer breaker, so only the 11 kV relay can clear it. Seen from 11 kV the current is small (about 1.4 kA), so the IDMT relay takes over half a second." },
      { title: "Mitigation", body: "The calculator reports that 199 ms would bring the LV board to Category 2. A maintenance setting on the 11 kV relay clearing in 50 ms gives 2.01 cal/cm²." },
      { title: "Labels", body: "Each bus gets a label with the incident energy (or PPE category), the arc-flash boundary, working distance, voltage and the limited and restricted approach boundaries, as NFPA 70E 130.5(H) requires." },
    ],
    resultSummary: [
      { check: "11 kV switchboard", requirement: "≤ 8 cal/cm²", actual: "4.70 cal/cm²", pass: true },
      { check: "0.4 kV LV board", requirement: "≤ 8 cal/cm²", actual: "21.2 cal/cm²", pass: false },
      { check: "MCC", requirement: "≤ 8 cal/cm²", actual: "2.54 cal/cm²", pass: true },
    ],
    finalAnswer: "The study gives 4.7 cal/cm² at the 11 kV board, 21.2 at the LV board and 2.5 at the MCC. The LV board needs mitigation: a maintenance setting on the 11 kV relay reduces it to 2.0 cal/cm².",
    keyInsight: "The worst location is usually the main LV board fed directly from a transformer, because its incomer terminals rely on HV protection that cannot be fast without losing selectivity.",
    faqs: [
      { q: "Why is nominal voltage (c = 1) used for arc flash?", a: "IEEE 1584 works from the available bolted fault current at the operating voltage; the IEC 60909 maximum factor would overstate it. The minimum case is also studied because lower current can mean slower clearing." },
      { q: "Is this the default network in the calculator?", a: "Yes. Open the Arc Flash Study calculator to see the same network and change any value." },
    ],
  },
];
