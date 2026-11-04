// Category guide: Short Circuit & Arc Flash.

import type { GuideDoc } from "./types";

export const SHORTCIRCUIT_GUIDE: GuideDoc = {
  slug: "short-circuit-arc-flash",
  groupId: "short-circuit",
  title: "Short Circuit & Arc Flash Guide: IEC 60909 and IEEE 1584",
  dek: "How short-circuit currents are calculated, which value sizes which piece of equipment, how arc-flash incident energy follows from fault current and clearing time, and the mistakes that most often make a study wrong.",
  readTime: "12 min read",
  intro: [
    "A short-circuit study answers two questions: can every piece of equipment survive and interrupt the largest fault it may see, and will the protection operate for the smallest fault it must clear. An arc-flash study then uses the same fault currents, together with the protection clearing times, to estimate the heat a worker could receive at each piece of equipment.",
    "The two studies are linked. Higher fault current makes equipment ratings harder to meet but usually makes protection trip faster, while a lower arcing current can slow the protection and increase the arc-flash energy. That is why both maximum and minimum fault conditions matter.",
  ],
  coreConcepts: [
    {
      heading: "The equivalent voltage source method (IEC 60909)",
      body: [
        "IEC 60909-0 replaces all sources with one equivalent voltage c·Un/√3 at the fault location, and uses the positive-, negative- and zero-sequence impedances of the network. The voltage factor c is 1.05 or 1.10 for maximum currents at low voltage (depending on the supply tolerance) and 1.10 above 1 kV, and 0.95 or 1.00 for minimum currents.",
        "Every element contributes an impedance: the utility from its short-circuit power, transformers with the correction factor KT, generators with KG, induction motors from their locked-rotor current, and cables from their length. For the minimum case, motors are left out and cable resistance is raised to its value at the end of the fault (80 °C).",
      ],
    },
    {
      heading: "Which current sizes which equipment",
      body: [
        "The initial symmetrical current Ik″ is the starting point. The peak current ip, including the DC offset of the first half-cycle, sets the making capacity of breakers and the mechanical forces on busbars. The breaking current Ib, lower near generators because their contribution decays, is compared with the breaker's breaking capacity. The thermal equivalent current Ith over the fault duration sets the short-time withstand of switchgear, cables and CTs.",
        "Earth-fault currents depend on how the system is earthed and on transformer vector groups. In a solidly earthed system close to a transformer star point, the single-phase fault can exceed the three-phase fault.",
      ],
    },
    {
      heading: "Arc flash: incident energy, boundary and PPE",
      body: [
        "In an arcing fault the current is lower than the bolted fault current, because the arc itself has impedance. IEEE 1584-2018 calculates the arcing current and the incident energy at a working distance from the voltage, bolted fault current, electrode configuration (VCB, VCBB, HCB, VOA, HOA), gap, enclosure size and arc duration. The arc-flash boundary is the distance at which the energy falls to 1.2 cal/cm².",
        "Incident energy is directly proportional to arc duration, which is set by the protective device clearing the arcing current. Halving the clearing time halves the energy. This makes protection settings, maintenance switches, zone-selective interlocking and arc-flash relays the most effective ways to reduce the hazard.",
      ],
    },
    {
      heading: "Why minimum fault current matters for arc flash",
      body: [
        "An inverse-time relay or fuse trips more slowly at lower current. If the arcing current falls just below an instantaneous setting, the clearing time can jump from tens of milliseconds to over a second, and the incident energy rises many times. IEEE 1584-2018 therefore also checks a reduced arcing current, and a study should consider every operating mode, such as a generator-only supply or one transformer out of service.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 60909-0", scope: "Calculation of short-circuit currents in three-phase AC systems: voltage factor, correction factors, Ik″, ip, Ib and Ith." },
    { standard: "IEC 60909-4", scope: "Worked examples for IEC 60909-0 calculations." },
    { standard: "IEEE 1584-2018", scope: "Arc-flash hazard calculations from 208 V to 15 kV, with electrode configuration and enclosure size." },
    { standard: "NFPA 70E", scope: "Electrical safety in the workplace: arc-flash risk assessment, PPE selection and equipment labelling." },
    { standard: "IEC 60947-2", scope: "Low-voltage circuit-breakers, including breaking capacity (Icu, Ics) and making capacity (Icm)." },
    { standard: "NEC 110.9 / 110.10", scope: "Interrupting rating and short-circuit current rating of equipment in US installations." },
  ],
  workflow: [
    { title: "Model the network and calculate fault currents at every bus", body: "Enter the utility, generators, transformers, cables and motors, and read Ik″, ip, Ib, Ith and earth-fault currents for maximum and minimum conditions.", calculatorHref: "/calculators/iec-60909", calculatorName: "IEC 60909 Short-Circuit Calculator" },
    { title: "Check switchgear and breaker ratings", body: "Compare breaking capacity with the maximum fault current and making capacity with the peak current at each switchboard.", calculatorHref: "/calculators/switchgear-short-circuit-rating", calculatorName: "Switchgear Short-Circuit Rating" },
    { title: "Add generator contributions where relevant", body: "For sites with several generators in parallel, check their combined contribution to the common bus.", calculatorHref: "/calculators/generator-fault-contribution", calculatorName: "Parallel Generator Fault Contribution" },
    { title: "Run the arc-flash study with the real protection settings", body: "Use the bus fault currents and the protective device at each bus to find incident energy, the arc-flash boundary and PPE, and print labels.", calculatorHref: "/calculators/arc-flash-study", calculatorName: "Arc Flash Study (IEEE 1584-2018)" },
    { title: "Check single points quickly", body: "For one piece of equipment, or to compare IEEE 1584-2018 with the 2002 method or the Ralph Lee method, use the single-point arc-flash calculator.", calculatorHref: "/calculators/arc-flash", calculatorName: "Arc Flash" },
  ],
  commonMistakes: [
    { mistake: "Leaving motors out of the maximum short-circuit calculation", whyItMatters: "Running motors feed the fault for several cycles; on LV boards they can add 10% or more to the breaking and peak duty." },
    { mistake: "Comparing a breaker's breaking capacity with Ik″ but ignoring the peak current", whyItMatters: "A breaker can have enough breaking capacity and still not enough making capacity (Icm) for the asymmetric first peak." },
    { mistake: "Using only the maximum fault current for arc flash", whyItMatters: "A lower arcing current can fall below an instantaneous setting and make the protection much slower, giving a far higher incident energy." },
    { mistake: "Using the device's nominal curve without breaker opening time", whyItMatters: "The arc lasts until the breaker contacts part. Leaving out the opening time (often 50–80 ms) understates the energy at fast-tripping locations." },
  ],
  faqs: [
    { q: "What is the difference between IEC 60909 and IEEE 1584?", a: "IEC 60909 calculates bolted short-circuit currents for equipment rating and protection. IEEE 1584 uses those currents to calculate arcing current and arc-flash incident energy for worker safety." },
    { q: "Do I need a short-circuit study before an arc-flash study?", a: "Yes. The arc-flash calculation needs the bolted fault current at each bus and the clearing time of the protection, so the short-circuit study and the protection settings come first." },
    { q: "Which fault current should I use for cable short-circuit withstand?", a: "The maximum current that can flow through the cable for the time the upstream protection takes to clear it, checked with S ≥ I·√t / k." },
  ],
};
