// Category guide: Power Quality, Demand & Metering.

import type { GuideDoc } from "./types";

export const POWERQUALITY_GUIDE: GuideDoc = {
  slug: "power-quality-demand-metering",
  groupId: "power-quality",
  title: "Power Quality, Demand & Metering: A Practical Guide",
  dek: "Why fixing power factor can introduce a new harmonic problem, how demand-factor sizing accounts for diversity, and why utility tariffs are the one part of this category with no universal standard behind them.",
  readTime: "14 min read",
  intro: [
    "This category covers the electrical quantities that determine how efficiently, cleanly, and cost-effectively a site actually uses power — as opposed to whether individual circuits are safely sized (covered elsewhere). Power factor, harmonics, demand, unbalance, and tariffs are all connected to each other in practice: correcting power factor can interact with harmonics already present on site, unbalanced loading affects both motor life and the accuracy of a maximum-demand estimate, and the tariff a site pays can directly reward or penalize how well the other four are managed.",
    "One quantity in this category is fundamentally different from the rest. Power factor correction, harmonics, demand-factor sizing, and voltage unbalance are all grounded in published, largely universal engineering standards. Utility tariffs are not — billing structures are genuinely specific to each utility and region, with no single governing standard, which is exactly why every rate figure in the tariff calculator is a required user input rather than a built-in constant.",
  ],
  coreConcepts: [
    {
      heading: "Why low power factor is a capacity problem, not just an energy problem",
      body: [
        "Power factor is the ratio between real power (kW, the power that actually does useful work) and apparent power (kVA, the total power the electrical system — transformers, cables, generators — actually has to be sized to deliver). A load with a low power factor draws more current for the same real power output than a load with a high power factor, because a larger share of that current is reactive current shuttling back and forth to sustain magnetic fields (in motors, transformers, and other inductive loads) without doing any net useful work. This is why poor power factor is fundamentally a capacity and current problem, not an energy-consumption problem in the usual sense — it doesn't necessarily waste kWh on the meter, but it does force every piece of upstream equipment (transformers, switchgear, cables) to be larger than it would otherwise need to be, and it's exactly why many utility tariffs apply a direct power-factor penalty (covered further below).",
        "Power factor correction (PFC) capacitor banks work by supplying local reactive power right at the load, so the reactive current no longer has to be drawn all the way from the source — IEC 60831 governs the design and rating of the capacitor banks themselves, sized here to move the site from its existing power factor to a chosen target.",
      ],
    },
    {
      heading: "Why adding PFC capacitors can create a new harmonic problem",
      body: [
        "Capacitors and the system's own inductance (transformer and cable reactance) together form a resonant circuit, and every capacitor bank added to a system shifts that resonant frequency. If the resulting resonant point happens to land near a harmonic frequency that's already present on site — very plausible on a site with significant VFD, UPS, or other non-linear load — the capacitor bank can amplify that harmonic rather than simply improving power factor, sometimes dramatically. This is exactly why a harmonic resonance check (informed by IEC 61000-4-7 measurement guidance and the site's short-circuit MVA) belongs immediately after power factor correction sizing in this category's typical workflow, not as an unrelated, optional afterthought.",
      ],
    },
    {
      heading: "Two different IEEE 519 tables, two different responsible parties",
      body: [
        "IEEE 519-2014 splits harmonic distortion limits into two genuinely different tables with different underlying logic. Table 1 sets voltage distortion limits at the point of common coupling — this is fundamentally the utility/system operator's responsibility, since voltage distortion reflects the overall health of the supply as seen by every customer connected to that point. Table 2 sets current distortion limits for an individual customer's injected harmonic current, referenced to Total Demand Distortion (TDD) against that customer's own maximum demand current (IL) — this is the individual site's responsibility, since it's specifically about how much harmonic pollution one customer is allowed to inject back into the shared system.",
        "Table 2's limits also scale with the ratio of available short-circuit current to load current (Isc/IL) at the point of connection — a site connected to a comparatively 'stiffer' supply (high fault level relative to its own load) is allowed proportionally more harmonic current injection than one on a comparatively 'weaker' supply, because the same absolute harmonic current represents a smaller disturbance to a stiffer system. Mixing up which table applies to which measurement, or applying a current-injection mindset to what's actually a voltage-quality question (or vice versa), is a common and easy conceptual error.",
      ],
    },
    {
      heading: "Maximum demand: why not every connected load counts at full rating",
      body: [
        "The whole premise of demand-factor sizing is that not every piece of connected load in a category runs at its full rated power at the same instant — a demand factor for each load category (lighting, sockets, HVAC, heating, and so on) captures the realistic simultaneous-use fraction for that category, based on general practice and typically refined against a specific site's actual metered behavior over time. Lighting circuits, for instance, are commonly assigned a high demand factor (most installed lighting genuinely does run concurrently during occupied hours), while general socket outlets get a meaningfully lower one (most connected equipment on general-purpose outlets is not drawing full rated power simultaneously). Summing connected load at 100% demand factor across every category would systematically oversize the incoming supply, transformer, and switchgear relative to what the site will actually draw in practice.",
      ],
    },
    {
      heading: "Voltage unbalance: why the motor derating curve is steep, not linear",
      body: [
        "Voltage unbalance (the NEMA-style definition: maximum deviation of any phase voltage from the average of all three, divided by that average) is disproportionately damaging to motors specifically because unbalanced supply voltage produces a negative-sequence current component, and the additional heating that negative-sequence current causes in a motor's rotor scales roughly with the square of the unbalance percentage — not linearly. This is exactly why the published NEMA MG1/ANSI C84.1 derating curve drops off increasingly steeply as unbalance rises (a jump from 1% to 2% unbalance costs meaningfully more derating than the jump from 0% to 1%), and why motors are explicitly flagged as needing manufacturer consultation above roughly 5% unbalance rather than having their derating simply extrapolated further along the same curve.",
      ],
    },
    {
      heading: "Panel balancing and the neutral conductor",
      body: [
        "Balancing loads evenly across the three phases in a panel isn't only about not overloading any single phase — it also directly affects neutral conductor current. In a perfectly balanced linear three-phase system, the vector sum of the three phase currents returning through the neutral is close to zero; any imbalance between phases leaves a residual current that has to return through the neutral conductor instead, so an unbalanced panel doesn't just waste capacity on the lighter-loaded phases, it also increases neutral loading in proportion to that imbalance. This becomes particularly important on panels with significant non-linear (harmonic-producing) load, where triplen harmonics (3rd, 9th, 15th, and other odd multiples of 3) from single-phase non-linear loads can actually add together in the neutral rather than cancel — a phenomenon that can drive genuinely high neutral current even on a panel that looks reasonably balanced on the fundamental (50/60Hz) current alone.",
      ],
    },
    {
      heading: "The single-phase vs. three-phase current formula: an easy place to go wrong",
      body: [
        "Converting between real power, apparent power, reactive power, and current is straightforward algebra (kVA = kW / PF, kVAR = kVA × sin(the power factor angle), and so on) — but the current formula itself differs by system type, and using the wrong one is one of the more common practical errors in power-quality work: I = P / (V × PF) for single-phase, but I = P / (√3 × V × PF) for three-phase, where V is the line-to-line voltage. Missing the √3 factor (or double-counting it) produces a current figure off by a factor of roughly 1.73 — large enough to meaningfully mis-size a breaker or conductor if the error goes unnoticed.",
      ],
    },
    {
      heading: "Tariffs: the one part of this category with no universal standard",
      body: [
        "Every other topic in this category traces back to a published engineering standard — IEC 60831, IEEE 519, NEMA MG1. Utility tariff structures don't have an equivalent universal reference: rate schedules, time-of-use period definitions, demand charge structures, and power-factor penalty formulas are all set independently by each utility and regulator, and vary enormously between them. A demand charge specifically bills for the site's peak kW drawn during the billing period — separately from, and often in addition to, straightforward energy (kWh) charges — which is precisely why smoothing out peak demand (through load scheduling, or the maximum-demand diversity concepts covered above) can reduce a bill even without reducing total energy consumption. Many tariffs also apply a direct power-factor penalty, which is the most concrete financial argument for the power factor correction work covered at the start of this category — poor power factor isn't just a capacity problem, it can be a direct line item on the bill.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 60831", scope: "Design and sizing standard for self-healing shunt power capacitor banks — the basis for the Power Factor Correction calculator." },
    { standard: "IEEE 519-2014", scope: "Harmonic distortion limits — Table 1 (voltage, at the point of common coupling) and Table 2 (current, TDD-referenced to the customer's own max demand current)." },
    { standard: "IEC 61000-4-7", scope: "Harmonic measurement methodology, referenced for the power factor correction capacitor bank's resonance-risk guidance." },
    { standard: "NEMA MG1 / ANSI C84.1", scope: "Voltage unbalance definition and the published motor derating curve used by the Voltage Unbalance & Motor Derating calculator." },
    { standard: "General demand-factor practice (IEC 60439-style guidance)", scope: "Load-category demand factors for diversified maximum demand — general engineering practice refined by site-specific metering, not a single mandatory numbered standard." },
  ],
  workflow: [
    {
      title: "Check power factor and size correction capacitors",
      body: "Establish the existing power factor and size a capacitor bank to reach the target power factor.",
      calculatorHref: "/calculators/power-factor-correction",
      calculatorName: "Power Factor Correction",
    },
    {
      title: "Before finalizing the capacitor bank, check harmonic distortion and resonance risk",
      body: "Confirm the new capacitor bank doesn't create a resonance point near an existing harmonic on site, and that voltage/current distortion stay within IEEE 519 limits.",
      calculatorHref: "/calculators/harmonic-analysis",
      calculatorName: "Harmonic Analysis",
    },
    {
      title: "Estimate maximum demand to size the incoming supply",
      body: "Apply category demand factors to connected load to get a realistic diversified maximum demand for sizing the transformer, main breaker, and service.",
      calculatorHref: "/calculators/max-demand",
      calculatorName: "Maximum Demand",
    },
    {
      title: "Check voltage unbalance and any resulting motor derating",
      body: "Measure or estimate phase voltage unbalance and check whether connected motors need derating against the NEMA curve.",
      calculatorHref: "/calculators/voltage-unbalance",
      calculatorName: "Voltage Unbalance & Motor Derating",
    },
    {
      title: "Balance panel loads across phases to minimize neutral current",
      body: "Distribute circuits evenly across the three phases, checking the resulting neutral current — especially important on panels with significant non-linear load.",
      calculatorHref: "/calculators/panel-balance",
      calculatorName: "DB Panel Balancer",
    },
    {
      title: "Convert between kW, kVA, kVAR and Amps as needed throughout",
      body: "Use the power triangle to move between whichever quantities are known at each stage of the design, taking care to use the correct single-phase or three-phase current formula.",
      calculatorHref: "/calculators/power-converter",
      calculatorName: "kW / kVA / kVAR / Amps Converter",
    },
    {
      title: "Estimate the resulting monthly bill",
      body: "Bring together energy consumption, peak demand, and power factor to estimate the actual cost impact of the design and any correction work done above.",
      calculatorHref: "/calculators/tariff",
      calculatorName: "Demand Charge / TOU Tariff",
    },
  ],
  commonMistakes: [
    {
      mistake: "Sizing PFC capacitors purely for target power factor without checking harmonic resonance",
      whyItMatters: "A capacitor bank changes the system's resonant frequency — on a site with significant non-linear load, the new resonant point can land near an existing harmonic and amplify distortion rather than simply improving power factor, sometimes substantially. The resonance check isn't optional on sites with meaningful VFD, UPS, or other non-linear load.",
    },
    {
      mistake: "Applying IEEE 519's voltage distortion limits (Table 1) where the current distortion limits (Table 2) actually apply, or vice versa",
      whyItMatters: "The two tables represent different responsibilities (utility/system-wide voltage quality vs. an individual customer's injected current) and are structured differently (Table 2 scales with the site's own Isc/IL ratio) — applying the wrong table's limit to a measurement doesn't just give a wrong number, it evaluates against the wrong physical question entirely.",
    },
    {
      mistake: "Treating demand-factor category values as fixed, universal constants",
      whyItMatters: "Published demand factors are general engineering practice, not a mandatory numbered standard — a specific site's real simultaneous-use pattern can differ from the general category assumption, and factors should ideally be refined against actual metered demand data over time rather than trusted indefinitely as generic starting values.",
    },
    {
      mistake: "Assuming voltage unbalance derating scales roughly linearly with unbalance percentage",
      whyItMatters: "The NEMA MG1 derating curve is steep and non-linear — negative-sequence heating scales roughly with the square of unbalance, so a small increase in unbalance percentage at higher unbalance levels costs disproportionately more derating than the same size increase at low unbalance.",
    },
    {
      mistake: "Balancing a panel by fundamental current alone and ignoring neutral loading from harmonics",
      whyItMatters: "Triplen harmonics from non-linear single-phase loads can add together in the neutral conductor rather than cancel, meaning a panel that looks reasonably balanced at fundamental frequency can still carry surprisingly high neutral current — a real consideration on panels feeding significant electronic or VFD load.",
    },
    {
      mistake: "Using the single-phase current formula for a three-phase load, or forgetting the √3 factor",
      whyItMatters: "I = P/(V×PF) applies to single-phase; three-phase requires I = P/(√3×V×PF) — mixing the two up produces a current figure off by roughly a factor of 1.73, large enough to meaningfully mis-size downstream equipment if it goes unnoticed.",
    },
    {
      mistake: "Assuming a tariff structure or demand charge formula from one utility applies generally",
      whyItMatters: "Unlike the rest of this category, tariff structures have no universal governing standard — rates, time-of-use periods, demand charges, and power-factor penalties are all utility- and region-specific, so a rate structure from one utility applied to a different site's bill estimate can produce a materially incorrect result.",
    },
  ],
  faqs: [
    {
      q: "Why does this guide put the harmonic analysis check immediately after power factor correction?",
      a: "Because the two are physically coupled, not just topically related — adding PFC capacitors changes the system's resonant frequency, and that resonance can interact badly with harmonics already present on site. Sizing a capacitor bank without immediately checking its resonance risk against existing harmonic content leaves a real, avoidable gap in the design process.",
    },
    {
      q: "Why doesn't this category have a single universal formula for estimating a utility bill, the way cable ampacity has standard published tables?",
      a: "Utility billing is a commercial/regulatory arrangement specific to each utility and region, not a physical engineering phenomenon governed by a single standard — rate structures, time-of-use definitions, and penalty formulas genuinely vary between utilities in ways that can't be captured by one universal calculation. This is exactly why the tariff calculator asks for every rate as a direct input rather than assuming any built-in figure.",
    },
  ],
};
