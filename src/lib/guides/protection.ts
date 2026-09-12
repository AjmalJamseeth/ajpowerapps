// Category guide: Protection & Relaying. A conceptual primer, distinct from
// the numeric worked examples in workedExamples/protection.ts — this
// explains the underlying theory, standards landscape, and how the
// category's 9 calculators fit together, rather than solving one specific
// problem.

import type { GuideDoc } from "./types";

export const PROTECTION_GUIDE: GuideDoc = {
  slug: "protection-relaying",
  groupId: "protection",
  title: "Protection & Relaying: A Practical Guide to Coordinating Fault Protection",
  dek: "How overcurrent, differential and arc-flash protection actually fit together — the core theory, the standards behind it, and a sensible order to work through this category's 9 calculators.",
  readTime: "16 min read",
  intro: [
    "Protection & relaying is the part of electrical design whose whole job is to fail gracefully. Every other calculator in this suite is about making a system work correctly under normal conditions — this category is about what happens the moment something goes wrong: a short circuit, an earth fault, a transformer internal failure, a generator out of sync. The goal isn't to prevent faults (that's an impossible standard) but to clear them fast enough, and in the right place, that the damage stays contained to the smallest possible part of the system and everyone nearby stays safe.",
      "That containment principle has a name: selectivity, also called discrimination or coordination. A well-coordinated system trips only the protective device closest to the fault, leaving everything upstream still energized and serving unaffected loads. A poorly coordinated system either fails to trip fast enough (letting a fault do more damage or burn longer, which directly worsens arc-flash incident energy) or trips too much of the network at once (an outage far larger than the fault itself justified). Almost everything in this category — grading margins, differential restraint, curve shape selection — exists in service of getting that selectivity right.",
    "This guide doesn't replace a protection coordination study or a qualified protection engineer's sign-off — real sites have CT ratios, relay firmware quirks, utility interconnection requirements and asset-specific withstand curves that no general-purpose calculator can fully capture. What it does do is walk through the concepts these 9 calculators are built on, so the numbers they produce mean something to you rather than being numbers in isolation.",
  ],
  coreConcepts: [
    {
      heading: "Selectivity and the grading margin (coordination time interval)",
      body: [
        "When two protective devices are in series — say a feeder relay downstream and a busbar relay upstream — both may see the same fault current for a fault on the feeder. Only the downstream device should trip. The tool that keeps that true is the grading margin, also called the coordination time interval (CTI): the upstream device's trip time is deliberately set some margin longer than the downstream device's trip time at the same fault current, so the downstream device always gets a fair head start.",
        "That margin isn't just an arbitrary buffer — it has to cover several real sources of timing uncertainty stacked together: the downstream relay's own overshoot (how long it keeps timing internally after the fault current has already cleared), the downstream circuit breaker's actual interrupting time (the relay tripping isn't instantaneous — the breaker still has to mechanically open and clear the arc), and a safety margin for relay timing tolerance. A commonly cited range for this combined margin is roughly 0.2 to 0.4 seconds, but that figure is a starting guideline shaped by the specific relay and breaker technology involved, not a universal constant — electromechanical relays with significant overshoot typically need a larger margin than modern microprocessor-based relays with near-zero overshoot.",
      ],
    },
    {
      heading: "Inverse-time (IDMT) curves: pickup, time multiplier, and curve shape",
      body: [
        "An inverse-definite-minimum-time (IDMT) relay doesn't trip at a fixed time — it trips faster as fault current increases, following a curve. Two settings shape that curve: the pickup current (the threshold above which the relay starts timing at all — below pickup, the relay does nothing, so pickup is not itself a trip point) and the time multiplier setting (TMS, sometimes called TDS or time dial), which scales how quickly the curve moves along the time axis without changing its underlying shape.",
        "The curve's shape itself comes from a small family of standardized equations — standard inverse, very inverse, extremely inverse, and long-time inverse, among others — each defined by IEC 60255-151 and harmonized in IEEE C37.112. Extremely inverse curves clear very quickly at high fault currents but are comparatively slow near pickup; standard inverse is a gentler slope throughout. The choice of curve shape (not just TMS) is itself a coordination decision — extremely inverse curves are often favored close to transformers and fuses specifically because their steep high-current response coordinates more naturally with fuse melting-time curves and with a transformer's own thermal withstand limit, which itself becomes much more restrictive at high currents.",
      ],
    },
    {
      heading: "Phase overcurrent vs. earth-fault protection",
      body: [
        "Phase overcurrent relays (device 50/51 in ANSI/IEEE C37.2 numbering) respond to current in the phase conductors and are primarily sized around load current and phase-to-phase fault levels. Earth-fault relays (50N/51N) are a separate, deliberately more sensitive layer that responds to the residual (zero-sequence) current — the imbalance between the phases that only appears when current is returning to source via earth rather than through the other phases. Because earth-fault current on a solidly or resistance-earthed system is often much smaller than a bolted three-phase fault current, earth-fault protection can and should be set far more sensitively than phase protection without risking nuisance tripping on normal load — this is exactly why it's implemented as its own relay element rather than folded into the phase overcurrent settings.",
      ],
    },
    {
      heading: "Differential protection: the 'what goes in must come out' principle",
      body: [
        "Differential protection (device 87) is conceptually the simplest protection principle and one of the fastest and most secure in practice: it compares the current entering a protected zone (say, a transformer) against the current leaving it. Under normal load or an external ('through') fault, those currents should match (after accounting for the transformer's turns ratio and vector group) — any significant mismatch means current is going somewhere it shouldn't, inside the protected zone itself, which almost always means an internal fault.",
        "The practical complication is that 'should match exactly' never quite happens in the real world — CT accuracy class and ratio errors, magnetizing inrush current when a transformer first energizes, and on-load tap changer position all introduce some legitimate mismatch even with no internal fault. Percentage-bias (percentage-restraint) differential relaying, the approach described in guides like IEEE C37.91, solves this by scaling the trip threshold up as the through-current itself increases — tolerating more mismatch when more current is flowing, since CT errors scale roughly proportionally, while still being sensitive enough to catch a genuine internal fault. This dual-slope restraint characteristic — the exact shape a differential relay's trip/no-trip boundary should follow — is what this category's Transformer Differential Protection calculator checks a given operating point against.",
      ],
    },
    {
      heading: "Where fault current comes from, and why it changes at every point in the network",
      body: [
        "Available fault current isn't a single number for a site — it's a function of exactly where the fault occurs, because every piece of equipment between the source and that point (transformer, cable, busbar) adds impedance, and impedance is what limits fault current. Fault current is generally highest right at the source and progressively lower moving downstream through the network, which is precisely why relay settings and breaker interrupting ratings both need to be checked at every point individually rather than assumed constant across a site.",
        "The base kVA (or per-unit) method used in this category's Fault Current Propagation calculator is the classic hand-calculation approach for this: express every impedance in the network — source, transformer, cable — on one common base, sum them along the fault path, and derive available fault current from the combined per-unit impedance. It's a simplification (it doesn't capture every real-world nonlinearity a full short-circuit study would), but it's the same foundational method taught in protection courses and is more than adequate for sizing studies and first-pass coordination work.",
        "Rotating machines (generators, and to a lesser extent large motors) complicate this further because, unlike a fixed utility source, their fault contribution isn't constant over time — it decays from an initial subtransient value, through a transient value, down to a lower sustained steady-state value, as the machine's internal flux redistributes after the fault begins. This category's generator calculators use subtransient reactance specifically because it represents the machine's fault contribution in the first cycle or two — the highest, most conservative figure, and the one that matters most for breaker interrupting duty and for the fastest protection elements.",
      ],
    },
    {
      heading: "Arc flash: why clearing time matters as much as fault current",
      body: [
        "Arc flash incident energy — the quantity that ultimately determines the PPE category a worker needs before opening a panel — depends on both the available fault current and how long the arc is allowed to burn before a protective device clears it. This is the single most important reason arc flash studies are done after protection coordination is settled, not before: two sites with identical fault current levels can have wildly different incident energy purely because one clears the fault in 3 cycles and the other in 30, and a coordination change made for an unrelated reason (a new grading margin, a different curve shape) can silently move a piece of equipment into a higher hazard category.",
        "This category's Arc Flash calculator supports both the long-standing Ralph Lee method (a simpler, generally conservative model, useful for a quick bounding estimate) and the IEEE 1584 empirical model (2002 edition free, 2018 edition — with its refined equations and enclosure-size dependence — as a subscriber feature), reflecting that different projects and jurisdictions still specify different methods.",
      ],
    },
    {
      heading: "Overcurrent protective device (OCPD) sizing fundamentals",
      body: [
        "Sizing a breaker or fuse is a smaller, more mechanical problem than relay coordination, but it has its own well-defined rules. General branch-circuit and feeder OCPD sizing (NEC Article 240, and the continuous-load 125% margin from NEC 210.19/215.2) starts from the load's expected current, not fault current — the device has to carry normal and continuous load comfortably without nuisance tripping, while still being rated to interrupt whatever fault current is actually available at that point (its interrupting rating, a completely separate number from its continuous current rating).",
        "Motor circuits add a further wrinkle: a motor's starting (inrush) current is routinely 5–8 times its full-load running current for a few seconds, and NEC 430.52 specifically permits sizing motor branch-circuit short-circuit protection well above the motor's full-load current specifically to ride through that starting transient without nuisance tripping, while a separate, more sensitive overload device (sized much closer to full-load current) protects the motor's winding insulation from sustained overload. Conflating these two protective functions — using one device sized for one purpose to try to do the other's job — is a common and avoidable design error.",
      ],
    },
    {
      heading: "Generator synchronization and fault contribution",
      body: [
        "Before a generator breaker closes to parallel a generator with a live bus (or with the utility), four quantities have to match closely enough to avoid a damaging inrush transient: voltage magnitude, frequency, phase angle, and phase sequence. A synchronization check relay (device 25) automates verifying the first three are within tolerance and that frequency slip is small enough for the phase angle to stay within window as the breaker actually closes — this category's Generator Sync Check calculator models exactly that check.",
        "Once paralleled, each generator becomes an independent source of fault current at the common bus, on top of whatever the utility or other generators contribute — and because generator fault contribution itself decays over time (as covered above), the combined available fault current at a bus with multiple generators paralleled is a genuinely different, generally larger, and time-varying quantity compared to a single-source system. The Parallel Generator Fault Contribution calculator sums each machine's individual subtransient-reactance-based contribution to give the combined figure that breaker interrupting ratings at that bus actually need to be checked against.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 60255-151", scope: "Defines the standard inverse-time overcurrent relay curve equations (standard inverse, very inverse, extremely inverse, long-time inverse) used by the IDMT calculators in this category." },
    { standard: "IEEE C37.112-1996", scope: "The IEEE-side equivalent/harmonization of inverse-time curve shapes, widely implemented in North American protective relays alongside the IEC curve family." },
    { standard: "IEEE C37.91", scope: "Guide for protective relay applications to power transformers — the basis for the percentage-bias (dual-slope restraint) differential protection characteristic used in the Transformer Differential Protection calculator." },
    { standard: "IEEE 1584-2002 / IEEE 1584-2018", scope: "Empirical arc-flash incident energy and boundary calculation methods; 2018 refines the equations and adds explicit enclosure-size dependence." },
    { standard: "Ralph Lee method", scope: "An older, simpler arc-flash energy estimation approach — generally more conservative, still specified on some projects and useful as a quick bounding check." },
    { standard: "NEC Article 240 / 210.19 / 215.2", scope: "General overcurrent protection rules and the 125% continuous-load sizing margin for branch circuits and feeders." },
    { standard: "NEC Article 430 (incl. 430.52)", scope: "Motor circuit protection — separate rules for motor branch-circuit short-circuit protection (sized to ride through starting current) and motor overload protection (sized close to full-load current)." },
    { standard: "ANSI/IEEE C37.2", scope: "Standard device function numbering (50/51 overcurrent, 50N/51N earth fault, 87 differential, 25 sync check) used throughout this category's calculators and result labels." },
  ],
  workflow: [
    {
      title: "Establish available fault current at each point in the network",
      body: "Before setting a single relay, find out how much fault current is actually available where each protective device sits — every downstream setting and every arc-flash figure depends on this.",
      calculatorHref: "/calculators/fault-propagation",
      calculatorName: "Fault Current Propagation (Base kVA Method)",
    },
    {
      title: "Set phase overcurrent relay curves and check grading across the whole chain",
      body: "Pick a curve shape and time multiplier for each relay, then verify the coordination time interval holds across the fault current range — add relays to the chain (not just a pair) to confirm every link from load end to source maintains its margin, not just one pair.",
      calculatorHref: "/calculators/idmt",
      calculatorName: "IDMT Relay Coordination",
    },
    {
      title: "Add earth-fault protection alongside the phase elements",
      body: "Set the more sensitive 50N/51N earth-fault stage using the same verified curve engine, sized for the site's earthing arrangement rather than load current.",
      calculatorHref: "/calculators/idmt-earth-fault",
      calculatorName: "IDMT Earth Fault Relay (50N/51N)",
    },
    {
      title: "Protect major transformers with differential relaying",
      body: "For transformers where speed and security both matter (large or critical units), check the operating point against the percentage-bias trip/restraint characteristic.",
      calculatorHref: "/calculators/transformer-differential",
      calculatorName: "Transformer Differential Protection (87T)",
    },
    {
      title: "Size downstream breakers and fuses",
      body: "With relay settings established, size the physical OCPDs themselves — general loads against continuous-load and interrupting-rating rules, motor circuits against their separate starting-withstand and overload requirements.",
      calculatorHref: "/calculators/breaker-fuse-sizer",
      calculatorName: "Circuit Breaker & Fuse Sizer",
    },
    {
      title: "Assess arc flash hazard using the actual clearing times just established",
      body: "Now that real device clearing times are known from the coordination work above, calculate incident energy and PPE category using those times — not a generic assumption.",
      calculatorHref: "/calculators/arc-flash",
      calculatorName: "Arc Flash",
    },
    {
      title: "For sites with generators: verify synchronization before paralleling",
      body: "Confirm voltage, frequency and phase-angle windows are met before any generator breaker closes onto a live bus.",
      calculatorHref: "/calculators/generator-sync",
      calculatorName: "Generator Sync Check",
    },
    {
      title: "Quantify combined generator fault contribution at the common bus",
      body: "Once multiple sources can be paralleled, re-check breaker interrupting duty and protection settings against the combined, time-varying fault contribution from all sources together.",
      calculatorHref: "/calculators/generator-fault-contribution",
      calculatorName: "Parallel Generator Fault Contribution",
    },
  ],
  commonMistakes: [
    {
      mistake: "Treating the grading margin as a fixed universal number",
      whyItMatters: "A 0.2-0.4s range is a common starting guideline, not a law — the correct margin for a specific relay/breaker pair depends on that relay's actual overshoot time and that breaker's actual interrupting time. Electromechanical relays generally need a noticeably larger margin than modern microprocessor relays with near-zero overshoot; using one fixed number everywhere can either waste clearing-time budget or, worse, leave too little margin for genuine miscoordination risk.",
    },
    {
      mistake: "Confusing pickup current with a trip point",
      whyItMatters: "Pickup is only the threshold above which an IDMT relay starts timing along its inverse curve — it is not itself a definite-time trip setting. A relay sitting just above pickup can still take a very long time to trip; assuming 'above pickup means it trips soon' misreads how inverse-time protection actually behaves.",
    },
    {
      mistake: "Using the same curve shape everywhere regardless of position in the network",
      whyItMatters: "Curve shape is a coordination decision, not just a formality — extremely inverse curves often coordinate better with fuses and with a transformer's thermal withstand near the transformer, while a gentler standard inverse curve may suit a different location. Picking one shape site-wide and only adjusting TMS can leave real coordination gaps at specific points in the network.",
    },
    {
      mistake: "Calculating arc flash before protection coordination is finalized",
      whyItMatters: "Incident energy depends directly on protective device clearing time, not just fault current — a later change to relay settings, curve shape, or grading margin can silently move a panel into a different PPE category. Arc flash studies done against provisional settings need to be re-checked once coordination is actually finalized.",
    },
    {
      mistake: "Sizing a breaker or fuse only against full-load current",
      whyItMatters: "A device sized purely for continuous load current may still have an inadequate interrupting rating for the fault current actually available at that point, and — for motor circuits specifically — may nuisance-trip on normal starting inrush if the separate short-circuit protection and overload protection functions aren't sized to their own distinct rules (NEC 430.52 vs. standard overload sizing).",
    },
    {
      mistake: "Assuming a generator's fault contribution is constant, the way a utility source's effectively is",
      whyItMatters: "A generator's fault current decays from a subtransient value through a transient value down to a lower steady-state value within a few cycles to seconds — protection settings or breaker checks based on only one point in that curve (especially if the wrong one is picked for the wrong purpose) can miscoordinate or under-rate equipment for the actual worst-case instant.",
    },
    {
      mistake: "Treating a sync-check pass as confirmation that a generator is safe to parallel in every respect",
      whyItMatters: "A sync-check relay verifies voltage, frequency and phase-angle windows, but phase sequence (rotation) is a separate check that some implementations and wiring errors can bypass — a generator wired with reversed phase sequence can still appear to satisfy voltage/frequency/angle windows momentarily while being fundamentally unsafe to close onto the bus, which is why phase sequence is normally verified once, physically, at commissioning, not relied upon as an ongoing sync-check output.",
    },
  ],
  faqs: [
    {
      q: "What's the actual difference between 'protection' and 'coordination' (grading)?",
      a: "Protection is the broader goal — detecting and clearing faults safely and quickly. Coordination (or grading) is the specific discipline of making sure multiple protective devices in series agree on which one should act first for a given fault location, so that only the necessary portion of the network is interrupted. A system can have individually well-set protective devices that are still poorly coordinated with each other, which is why coordination is checked as its own distinct step rather than assumed to follow automatically from correct individual settings.",
    },
    {
      q: "Can these calculators be used directly to set real protection relays on a live site?",
      a: "They're built to the same standard equations and methods a protection engineer would use by hand or in dedicated coordination software, and every worked example's numbers come from the calculators' own verified code — but a real site has CT ratios and accuracy classes, specific relay firmware behavior, utility interconnection requirements, and asset-specific withstand data that a general-purpose calculator can't fully capture. Treat results here as a solid engineering starting point and cross-check, not a substitute for a formal coordination study reviewed by a qualified protection engineer, especially before commissioning actual site settings.",
    },
    {
      q: "Why does this category cover both relay settings (IDMT, differential) and physical device sizing (breaker/fuse) together?",
      a: "They're two layers of the same protection scheme working together — relay settings determine when and how fast a circuit breaker is told to trip, while breaker/fuse sizing determines whether the physical device itself can safely carry normal load, ride through legitimate transients like motor starting, and actually interrupt the fault current available at its location. A site can have perfectly coordinated relay settings and still be unsafe if the breaker's own interrupting rating is inadequate for the fault current it might be asked to clear.",
    },
  ],
};
