// Category guide: Backup Power (Batteries, UPS & Generators).

import type { GuideDoc } from "./types";

export const BACKUPPOWER_GUIDE: GuideDoc = {
  slug: "backup-power-batteries-ups-generators",
  groupId: "backup-power",
  title: "Backup Power: A Practical Guide to Batteries, UPS & Generators",
  dek: "Why backup power is really two different technologies covering two different timescales, how NFPA 110's Type and Class ratings describe two independent things, and why nameplate battery capacity always overstates what's actually usable.",
  readTime: "13 min read",
  intro: [
    "Backup power design is fundamentally about bridging timescales. A UPS can respond to a power loss in milliseconds but can only economically sustain a load for minutes to a few hours before its batteries are exhausted. A generator can run more or less indefinitely once started, but it genuinely can't start, reach rated speed, and pick up load in less than several seconds to tens of seconds — nowhere near fast enough to prevent a momentary interruption on its own. Neither technology alone solves the whole backup power problem for a facility that can't tolerate any interruption at all, which is exactly why UPS and generator systems are so often paired together, with the UPS covering the instant-response gap and the generator taking over for anything longer.",
    "This category's five calculators map onto that layered picture: classifying what a system actually needs to achieve (NFPA 110, NEC priority), sizing the UPS and its battery bank, checking that the handoff between UPS and generator actually works without a gap, sizing the generator's fuel supply for the required runtime, and — for a related but distinct application — sizing battery energy storage (BESS) for grid-interactive or larger-scale use.",
  ],
  coreConcepts: [
    {
      heading: "NFPA 110's Type and Class: two independent axes, not one rating",
      body: [
        "NFPA 110 classifies emergency and standby power systems along two genuinely separate axes that are easy to conflate into a single number but describe completely different things. Type describes how fast the system must restore power — Type U (uninterrupted, effectively 0 seconds), Type 10 (within 10 seconds), Type 60, Type 120, or Type M (manual start, no automatic time requirement). Class describes how long the system must be able to run at its rated load without refueling or recharging — Class 0.083 (5 minutes) through Class 48 (48 hours) up to Class X (unlimited, i.e. connected to a continuous fuel supply). A complete system specification needs both a Type and a Class stated together (for instance, 'Type 10, Class 2' means power must be restored within 10 seconds and the system must be able to sustain rated load for at least 2 hours) — quoting only one of the two leaves the specification genuinely incomplete.",
      ],
    },
    {
      heading: "NEC 700/701/702: priority tiers with different maximum interruption times",
      body: [
        "NEC further separates standby systems into three priority tiers based on what's actually at stake if power is interrupted. Emergency systems (NEC Article 700) cover life-safety loads — egress lighting, fire alarm, and similar — and carry the strictest maximum permitted interruption time (commonly cited around 10 seconds). Legally required standby systems (NEC Article 701) cover loads a jurisdiction's code requires backup for but that aren't immediately life-safety critical (certain HVAC, communications, or industrial process equipment) and get a more relaxed maximum interruption time (commonly around 60 seconds). Optional standby systems (NEC Article 702) cover loads a facility chooses to back up for business continuity reasons — with no code-mandated maximum interruption time at all, since the decision to back them up (and how quickly) is the facility's own choice rather than a life-safety code requirement. Sizing and sequencing a backup system without recognizing which tier a given load actually belongs to risks either overspending on non-critical loads or, worse, under-protecting a genuinely life-safety-critical one.",
      ],
    },
    {
      heading: "The UPS-to-generator bridge: where the whole strategy can quietly fail",
      body: [
        "A facility can have a correctly sized UPS and a correctly sized generator and still have a real gap in coverage if the timing between them doesn't actually add up. The sequence after a utility outage typically runs: the automatic transfer switch (ATS) waits a short confirmation delay before deciding the outage is real, the generator then has to crank and reach rated speed and voltage, and the ATS then has its own transfer time to actually switch the load over — and the UPS's battery autonomy has to cover the entire sum of that sequence, with margin, or the load loses power in the gap between the UPS running out and the generator actually being ready to carry it. This bridge-timing check is exactly why it's treated as a distinct calculation in this category rather than assumed to work out automatically just because both a UPS and a generator are present.",
      ],
    },
    {
      heading: "A quick UPS battery estimate vs. a full IEEE 485 duty-cycle design",
      body: [
        "Sizing a UPS's own battery bank for a straightforward, roughly constant-current backup period is a reasonably simple estimate: usable energy is approximately load times time, and nameplate battery capacity is usable energy divided by depth-of-discharge and round-trip efficiency. But a genuinely rigorous battery design — particularly for DC systems with a duty cycle that varies significantly over time, such as an initial high current spike for closing a breaker or annunciating alarms followed by a much lower sustained standby load — needs IEEE 485's full duty-cycle section method instead. That method breaks the discharge into multiple current/duration sections and applies a capacity-rating factor (Kt) specific to the battery product's own published data, accounting for the fact that a battery doesn't deliver a simple fixed amp-hour capacity regardless of how fast it's discharged — faster discharge rates extract proportionally less total capacity than slower ones. The quick UPS estimate is a reasonable first-pass sizing tool; the dedicated battery calculator is the right tool once the duty cycle is well-defined and the design needs to be load-tested and specified against a real product's data sheet.",
      ],
    },
    {
      heading: "Depth of discharge and round-trip efficiency: why usable energy is always less than nameplate",
      body: [
        "A battery's nameplate (rated) capacity is never fully usable in practice — depth of discharge (DoD) limits how far the battery can be discharged without significantly shortening its service life, and round-trip efficiency (RTE) accounts for energy lost internally during charge and discharge. Both vary meaningfully by chemistry: lithium-ion batteries commonly tolerate a high DoD (around 90%) with high round-trip efficiency (around 92%), lead-acid batteries are typically limited to a much shallower DoD (around 50%) to preserve cycle life with somewhat lower efficiency (around 85%), and flow batteries can often discharge fully (100% DoD) but at a meaningfully lower round-trip efficiency (around 75%) due to their different underlying electrochemistry. These are chemistry-typical defaults, not universal constants — always confirmed against the specific manufacturer's own data sheet — but the underlying principle holds regardless of chemistry: usable energy is always some fraction of nameplate capacity, never the full nameplate figure, and that fraction is chemistry-dependent.",
        "Depth of discharge also trades off directly against cycle life for most battery chemistries — discharging more deeply on every cycle generally reduces the total number of cycles the battery can deliver before its capacity degrades below a useful threshold, which is why chemistry and DoD selection is as much an economic decision (upfront capacity cost vs. expected replacement interval) as a purely technical one.",
      ],
    },
    {
      heading: "Generator fuel consumption isn't a single fixed number",
      body: [
        "A generator's fuel consumption rate genuinely depends on how heavily it's loaded, not just its nameplate rating — running significantly below rated load is often noticeably less fuel-efficient per kWh delivered than running closer to rated capacity, since a generator engine has real fixed losses that don't scale down proportionally with load. Sizing fuel storage and estimating running cost from a generator's actual consumption rate at its expected operating load (rather than assuming a single generic rate regardless of loading) gives a meaningfully more accurate runtime and cost estimate than a flat nameplate-based assumption would.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEEE 485", scope: "Duty-cycle section method for sizing vented/VRLA lead-acid battery banks — the basis for the Battery & DC System Sizing calculator." },
    { standard: "IEEE 946", scope: "Practical DC system charger-sizing guidance, applied alongside IEEE 485 in the battery sizing calculator." },
    { standard: "NFPA 110", scope: "Type (restoration time) and Class (runtime duration) classification for emergency and standby power systems." },
    { standard: "NEC Articles 700 / 701 / 702", scope: "Emergency, legally required standby, and optional standby system priority tiers and their associated maximum interruption times." },
    { standard: "IEEE 1547 / IEC 62933 / IEC 61427-2", scope: "Grid-interconnection and sizing alignment references for battery energy storage systems (BESS)." },
  ],
  workflow: [
    {
      title: "Classify the standby/emergency power requirement and check the UPS-to-generator bridge",
      body: "Determine the NFPA 110 Type/Class and NEC priority tier the system needs to meet, and verify the UPS's autonomy actually covers the full ATS-delay-plus-generator-start sequence with margin.",
      calculatorHref: "/calculators/emergency-power",
      calculatorName: "Emergency Power (Genset+UPS)",
    },
    {
      title: "Size the UPS for the critical load and chosen redundancy configuration",
      body: "Determine required UPS kVA rating from critical load, margin, and redundancy (N+1 or better), plus a first-pass battery energy estimate for the stated ride-through time.",
      calculatorHref: "/calculators/ups-sizing",
      calculatorName: "UPS Sizing",
    },
    {
      title: "For a full duty-cycle battery design, use the dedicated IEEE 485 calculator",
      body: "Once the duty cycle is well-defined (including any initial high-current sections), run the full section-by-section battery design against a real product's capacity-rating data.",
      calculatorHref: "/calculators/battery-sizing",
      calculatorName: "Battery & DC System Sizing",
    },
    {
      title: "Check generator runtime and fuel cost for the required backup duration",
      body: "Estimate runtime and running cost from the generator's actual fuel consumption rate at its expected operating load, and size fuel storage accordingly.",
      calculatorHref: "/calculators/genset-fuel",
      calculatorName: "Genset Fuel Consumption & Running Cost",
    },
    {
      title: "For larger-scale or grid-interactive storage, size a BESS instead",
      body: "For applications beyond simple UPS ride-through — grid services, renewable integration, larger-scale facility storage — size battery energy storage against its own usable-energy, C-rate, and PCS voltage-window requirements.",
      calculatorHref: "/calculators/energy-storage",
      calculatorName: "Energy Storage (BESS)",
    },
  ],
  commonMistakes: [
    {
      mistake: "Assuming a correctly sized UPS and a correctly sized generator automatically work together without a coverage gap",
      whyItMatters: "The UPS's battery autonomy has to cover the entire ATS confirmation delay plus generator crank-to-rated time plus ATS transfer time, with margin — sizing each component independently without checking this combined bridge timing can leave a real gap where load loses power even though both systems are individually adequate.",
    },
    {
      mistake: "Confusing NFPA 110 Type (restoration time) with Class (runtime duration)",
      whyItMatters: "They're independent specifications describing different things — a system can meet a fast Type rating but a short Class rating, or vice versa. A complete specification needs both stated together; quoting only one leaves the actual requirement ambiguous.",
    },
    {
      mistake: "Treating all standby loads as having the same maximum permitted interruption time",
      whyItMatters: "NEC 700/701/702 assign meaningfully different maximum interruption times to life-safety (Emergency), code-required (Legally Required Standby), and business-continuity (Optional Standby) loads — sequencing or prioritizing loads without recognizing which tier they belong to risks under-protecting a genuinely life-safety-critical load.",
    },
    {
      mistake: "Using the UPS calculator's quick battery estimate for a critical, well-defined duty-cycle design",
      whyItMatters: "The quick estimate (load × time, adjusted for DoD and efficiency) is a reasonable first-pass figure, but a duty cycle with a significant initial high-current section (breaker closing, alarm annunciation) needs the full IEEE 485 section method and real product capacity-rating data to be sized accurately — the quick estimate can understate battery requirements for a demanding duty cycle.",
    },
    {
      mistake: "Treating nameplate battery or BESS capacity as fully usable energy",
      whyItMatters: "Depth of discharge and round-trip efficiency both reduce usable energy below nameplate capacity, and both vary meaningfully by chemistry — assuming full nameplate capacity is available overstates actual backup runtime, sometimes significantly depending on the chemistry involved.",
    },
    {
      mistake: "Assuming generator fuel consumption rate is constant regardless of load level",
      whyItMatters: "Generators are often less fuel-efficient per kWh delivered at partial load than near rated load — using a single generic consumption-rate assumption regardless of expected operating load can meaningfully misstate runtime and running cost.",
    },
  ],
  faqs: [
    {
      q: "Why use both a UPS and a generator instead of just a bigger UPS, or a generator with a faster start?",
      a: "The two technologies solve fundamentally different parts of the timescale problem, and pushing either one to cover the whole range is generally impractical. A UPS large enough to bridge a long outage on batteries alone would need an enormous, expensive battery bank for what's usually a short-duration need. A generator fast enough to respond in milliseconds isn't how internal combustion or turbine engines actually work — even a fast-start unit needs real time to reach rated speed and voltage. Pairing a UPS (fast response, limited duration) with a generator (slower response, effectively unlimited duration with fuel) covers the full timescale more economically than either technology stretched to do the other's job.",
    },
    {
      q: "What's the difference between the Battery & DC System Sizing calculator and the Energy Storage (BESS) calculator, since both size batteries?",
      a: "They're aimed at different applications with different governing considerations. Battery & DC System Sizing follows IEEE 485's duty-cycle method, aimed at traditional DC system/UPS battery banks with a defined discharge duty cycle. Energy Storage (BESS) is aligned to IEEE 1547/IEC 62933/IEC 61427-2 for larger-scale or grid-interactive storage applications, where C-rate, power-conversion-system (PCS) voltage windows, and usable-energy sizing for services beyond simple backup ride-through (like grid support or renewable integration) matter in ways a straightforward UPS battery duty cycle doesn't capture.",
    },
  ],
};
