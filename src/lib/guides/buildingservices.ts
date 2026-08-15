// Category guide: Building Services & Facilities.

import type { GuideDoc } from "./types";

export const BUILDINGSERVICES_GUIDE: GuideDoc = {
  slug: "building-services-facilities",
  groupId: "building-services",
  title: "Building Services & Facilities: A Practical Guide",
  dek: "Why this category's calculators often need a non-electrical answer — heat transfer, photometry, mechanics, or economics — before the electrical sizing question can even be asked.",
  readTime: "13 min read",
  intro: [
    "Unlike most other categories in this suite, Building Services & Facilities isn't organized around a single engineering discipline — it's organized around a single practical reality: facility electrical design constantly has to interface with problems that aren't electrical at all. Sizing a heat-tracing circuit starts with a heat-transfer problem (how much heat does this pipe lose through its insulation). Lighting design starts with a photometry problem (how much illuminance does this room actually need). Elevator sizing starts with a mechanics problem (how much power does it take to lift an unbalanced load at a given speed). Comparing two equipment options starts with a discounted-cash-flow economics problem. In every case, the electrical sizing — a breaker rating, a fixture count, a feeder size — is downstream of solving that other problem first.",
    "The seven calculators here reflect that variety deliberately rather than trying to force everything into one unifying formula. What they share is a facilities-management context: they're the calculations that come up when specifying or evaluating the electrical side of a building's mechanical, lighting, vertical-transportation, and data-center infrastructure.",
  ],
  coreConcepts: [
    {
      heading: "HVAC compressor circuits follow a different code article than ordinary motors",
      body: [
        "A hermetic refrigerant motor-compressor — the kind found in most HVAC equipment — is sized under NEC Article 440, not the general motor rules of Article 430, because a sealed compressor motor behaves differently enough (particularly around starting current and thermal protection) that the Code gives it its own dedicated sizing method. Article 440's overcurrent protection sizing formula (percentages of rated-load current, rounded to standard breaker sizes with both a floor and a ceiling) looks superficially similar to Article 430's motor rules but isn't identical, and using the wrong article's formula for an HVAC compressor circuit can produce an incorrect result even though both articles are nominally about 'motor' overcurrent protection. When an HVAC unit combines a compressor with a condenser fan on one feeder, the combination-load sizing principle is the same one covered in the Motors & Drives guide — only the largest motor gets the full margin, everything else on the same feeder is added at its own rated current.",
      ],
    },
    {
      heading: "Lighting design: why area alone never tells you the fixture count",
      body: [
        "The lumen method's core relationship — required fixture count = (target illuminance × area) / (luminaire output × utilization factor × maintenance factor) — makes clear that floor area is only one of several inputs, and not even the dominant one for most design decisions. Target illuminance varies enormously by space type (a technical drawing office needs meaningfully more lux than a corridor, and an outdoor car park needs a small fraction of either), so two rooms of identical area can need very different fixture counts purely because of what the space is used for. Utilization factor (how much emitted light actually reaches the working plane, shaped by room proportions and surface reflectance) and maintenance factor (expected light loss from lamp depreciation and dirt accumulation before the next service) then further adjust that base relationship — which is why a lighting design pulled from 'square footage times a rule of thumb' rather than the actual target illuminance for that specific space type is a common and easy source of under- or over-lighting.",
      ],
    },
    {
      heading: "Elevator group demand factor: diversity that doesn't need active management",
      body: [
        "Sizing a shared feeder for multiple elevators raises the same underlying question covered elsewhere in this suite (Power Quality's maximum demand, Solar/EV's charge-point diversity): not every connected device draws its full rated current simultaneously, so is some reduction below the full connected load justified? For elevators specifically, NEC Table 620.14's demand factor is a straightforward table lookup based purely on the number of elevators sharing the feeder — no active load-management system or real-time control is required to apply it, unlike the EV charging diversity case covered in the Solar, EV & Renewables guide. That's because elevator dispatch behavior is inherently, structurally non-simultaneous by design (a dispatch algorithm rarely, if ever, runs every car in a bank at full duty at the exact same instant), so the code table reflects a statistical property of how elevator groups actually operate rather than requiring an active system to enforce it.",
      ],
    },
    {
      heading: "PUE: a ratio that needs its measurement basis stated to mean anything",
      body: [
        "Power Usage Effectiveness (PUE) — total facility energy divided by IT equipment energy — is a simple ratio, but a bare PUE number without its measurement period and conditions stated is an incomplete figure: PUE typically varies with outdoor conditions (affecting cooling load), IT utilization level, and the specific period measured, so a single instantaneous reading and a well-documented annual average can tell meaningfully different stories about the same facility. It's also worth being precise about what's official and what isn't: ISO/IEC 30134-2 standardizes the PUE metric and its measurement methodology, but the commonly cited efficiency bands ('world-class,' 'efficient,' 'moderate,' and so on) come from The Green Grid's widely referenced but informal industry white paper, not a formally mandated ISO/IEC classification — useful context, but not an official grade.",
      ],
    },
    {
      heading: "Life-cycle cost vs. simple payback: why the two can disagree",
      body: [
        "Comparing a lower-upfront-cost option against a higher-upfront, lower-operating-cost option (standard vs. premium-efficiency equipment is the classic example) is a decision that shows up across several categories in this suite — VFD retrofits, power factor correction, generator fuel choices — and life-cycle cost (LCC) is the general tool for answering it rigorously. Simple payback period (how long until the extra upfront cost is recovered from operating savings) is intuitive but incomplete: it ignores the time value of money entirely, and it ignores every cash flow that happens after the payback point, including the fact that the cheaper-to-run option keeps saving money for the rest of the analysis period. A discounted-cash-flow LCC comparison — including present-worth of all future operating costs, any salvage value, and typically an escalation rate for energy costs — captures the whole picture, and can occasionally favor a different option than a naive payback comparison would, particularly when the analysis period extends well beyond the payback point.",
      ],
    },
    {
      heading: "Heat tracing: an electrical circuit sized from a heat-transfer answer",
      body: [
        "Sizing a trace-heating circuit genuinely starts as a heat-transfer problem, not an electrical one: steady-state radial conduction through a pipe's insulation layer (a function of pipe diameter, insulation thickness and thermal conductivity, and the temperature difference being maintained against the coldest expected ambient) determines how much heating power per meter of pipe is actually required, with a design margin applied on top for a safety factor. Only once that required W/m figure is established does the calculation become electrical — sizing the circuit's power, current, breaker rating, and (importantly, and easy to overlook on long runs) voltage drop over the heating cable's own resistance. A trace-heating design that looks adequate on heater output and breaker sizing alone can still fail on voltage drop specifically because that check depends on a completely different input (the heating cable's own resistance per meter) that's easy to leave unset or unchecked.",
      ],
    },
    {
      heading: "Enclosure cooling: physically fitting isn't the same as thermally adequate",
      body: [
        "An enclosure sized generously enough to physically contain all its installed equipment can still be thermally undersized, because natural-convection cooling capacity and equipment heat loss are governed by entirely different things — cooling capacity scales with the enclosure's external surface area and the allowable temperature rise above ambient, while heat loss scales with whatever components happen to be installed inside, regardless of how much spare physical room they leave. A busy, densely packed panel in a physically spacious enclosure can still exceed natural-convection capacity well before the enclosure looks 'full,' which is exactly why enclosure cooling is checked as an explicit heat-balance calculation rather than assumed to follow automatically from adequate physical fit.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "NEC Article 440", scope: "Hermetic refrigerant motor-compressor branch-circuit and overcurrent protection sizing — distinct from Article 430's general motor rules." },
    { standard: "EN 12464-1 / IES Handbook", scope: "Target illuminance values by space type and the lumen method for interior and exterior lighting design." },
    { standard: "NEC Table 620.14", scope: "Demand factor for a group of elevators sharing a single feeder, based purely on elevator count." },
    { standard: "ISO/IEC 30134-2", scope: "Standardizes the Power Usage Effectiveness (PUE) metric and its measurement methodology (efficiency bands themselves are an informal Green Grid industry reference, not part of this standard)." },
    { standard: "Discounted-cash-flow engineering economics (consistent with IEEE 1013 practice)", scope: "Life-cycle cost, present worth, equivalent annual cost, and payback calculation method — general engineering-economics practice, not a single numbered standard." },
    { standard: "IEEE 515", scope: "Electric resistance trace-heating design and application practice." },
    { standard: "IEC 60079-30", scope: "Hazardous-area trace-heating requirements, including ground-fault equipment protection (GFEP) for classified locations." },
    { standard: "IEC 60890-derived enclosure heat-rise method", scope: "Widely-published (manufacturer application-note-based) natural-convection and forced-air enclosure cooling sizing approach — a transparent engineering approximation, not a substitute for formal type-test verification." },
  ],
  workflow: [
    {
      title: "Size HVAC compressor and motor branch circuits",
      body: "Apply NEC Article 440's specific overcurrent protection formula (not Article 430's general motor rules), including combination-load sizing for a compressor plus fan on one feeder.",
      calculatorHref: "/calculators/hvac-electrical-sizing",
      calculatorName: "HVAC Electrical Sizing",
    },
    {
      title: "Design interior (or exterior) lighting fixture counts",
      body: "Start from the correct target illuminance for the specific space type, not area alone, and apply the lumen method to find fixture count and achieved illuminance.",
      calculatorHref: "/calculators/lighting-design",
      calculatorName: "Lighting Design",
    },
    {
      title: "Size elevator motor power and group feeder demand",
      body: "Compute single-unit motor power from load/speed/balance/efficiency, then apply the NEC Table 620.14 demand factor for the actual number of elevators sharing the feeder.",
      calculatorHref: "/calculators/elevator-demand",
      calculatorName: "Elevator Electrical Demand",
    },
    {
      title: "Assess data center efficiency, where applicable",
      body: "Compute PUE and DCiE with a clearly stated measurement period, and treat the informal Green Grid efficiency bands as context rather than an official classification.",
      calculatorHref: "/calculators/pue",
      calculatorName: "Data Center PUE",
    },
    {
      title: "Compare equipment options economically over their full life cycle",
      body: "Use discounted-cash-flow life-cycle cost — not simple payback alone — to compare a lower-upfront vs. higher-upfront, lower-operating-cost option.",
      calculatorHref: "/calculators/life-cycle-cost",
      calculatorName: "Life-Cycle Cost (LCC)",
    },
    {
      title: "Size electrical trace-heating circuits for freeze protection",
      body: "Start from the pipe's actual heat loss through its insulation, then size heater output, circuit current, breaker rating, and voltage drop over the run.",
      calculatorHref: "/calculators/heat-tracing",
      calculatorName: "Heat Tracing Circuit Sizing",
    },
    {
      title: "Check enclosure cooling for any panels or MCCs specified along the way",
      body: "Verify natural-convection heat-dissipation capacity against actual installed component losses, and size a forced-air fan if natural convection alone is inadequate.",
      calculatorHref: "/calculators/enclosure-cooling",
      calculatorName: "Panel/MCC Enclosure Cooling",
    },
  ],
  commonMistakes: [
    {
      mistake: "Applying general NEC Article 430 motor rules to an HVAC compressor circuit",
      whyItMatters: "Hermetic refrigerant motor-compressors are specifically covered by Article 440, whose overcurrent protection formula differs from Article 430's general motor rules — using the wrong article's formula can produce an incorrect sizing result even though both nominally cover 'motor' protection.",
    },
    {
      mistake: "Sizing lighting fixture count from floor area alone, without confirming the correct target illuminance for that space type",
      whyItMatters: "Target illuminance varies enormously by space type — two rooms of identical area can legitimately need very different fixture counts, so area-based rules of thumb without a stated target illuminance are a common source of under- or over-lighting.",
    },
    {
      mistake: "Assuming elevator group demand factor requires an active load-management system, the way EV charging diversity does",
      whyItMatters: "NEC Table 620.14's demand factor is a straightforward code table lookup based purely on elevator count — it reflects the inherently non-simultaneous nature of elevator dispatch operation, unlike EV charging diversity, which specifically requires an active Load Management System to be permitted at all.",
    },
    {
      mistake: "Quoting a PUE figure without its measurement period, or treating the Green Grid efficiency bands as an official ISO classification",
      whyItMatters: "PUE varies with outdoor conditions, IT utilization, and measurement period — a bare number without that context is incomplete, and the commonly cited efficiency bands are an informal industry reference (Green Grid), not part of the ISO/IEC 30134-2 standard itself.",
    },
    {
      mistake: "Comparing two equipment options by simple payback period alone",
      whyItMatters: "Simple payback ignores the time value of money and every cash flow after the payback point — a full discounted-cash-flow life-cycle cost comparison can occasionally favor a different option than payback alone would suggest, particularly over longer analysis periods.",
    },
    {
      mistake: "Sizing a trace-heating circuit's heater output and breaker without separately checking voltage drop",
      whyItMatters: "Voltage drop depends on the heating cable's own resistance per meter, a completely separate input from heater output sizing — a circuit that passes heater-output and breaker checks can still fail badly on voltage drop over a long run if that input is left unset or unchecked.",
    },
    {
      mistake: "Assuming an enclosure with plenty of spare physical room is automatically thermally adequate",
      whyItMatters: "Cooling capacity depends on external surface area and allowable temperature rise, while heat loss depends on installed component losses — the two aren't linked to physical fit, so a spacious-looking enclosure can still exceed its natural-convection capacity well before it looks 'full.'",
    },
  ],
  faqs: [
    {
      q: "Why does this category group together such different topics — lighting, elevators, PUE, economics, heat tracing?",
      a: "They're unified by context rather than by shared physics: all seven are calculations that come up when specifying or evaluating the electrical side of a building's mechanical, lighting, vertical-transportation, and data-center infrastructure — a facilities-management grouping rather than a single-discipline one. Several of them also share the pattern of needing a non-electrical answer (heat transfer, photometry, mechanics, discounted-cash-flow economics) before the electrical sizing question can even be posed.",
    },
    {
      q: "Should a facility design decision be justified with life-cycle cost or simple payback?",
      a: "Simple payback is a reasonable quick screening figure — easy to compute and explain — but it's incomplete for a considered decision because it ignores the time value of money and every cash flow after the payback point. Life-cycle cost is the more rigorous comparison for an actual investment decision, particularly when the analysis period extends well beyond the payback point or when comparing options with meaningfully different cash-flow timing.",
    },
  ],
};
