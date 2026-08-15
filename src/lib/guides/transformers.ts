// Category guide: Transformers, CT/VT & Condition Testing.

import type { GuideDoc } from "./types";

export const TRANSFORMERS_GUIDE: GuideDoc = {
  slug: "transformers-ct-vt-condition-testing",
  groupId: "transformers",
  title: "Transformers, CT/VT & Condition Testing: A Practical Guide",
  dek: "Why CTs and VTs behave like opposite kinds of electrical sources, how a transformer's rating changes with ambient and altitude, and what separates sizing new equipment from assessing the condition of equipment already in service.",
  readTime: "15 min read",
  intro: [
    "This category spans three related but distinct jobs: sizing the major power equipment itself (transformers, busbars), sizing the instrument transformers that let protection and metering equipment safely 'see' that power equipment's current and voltage (CTs and VTs), and assessing the ongoing health of equipment already in service (insulation resistance and polarization index testing). They're grouped together because a transformer installation genuinely needs all three — a correctly sized transformer still needs correctly sized instrumentation around it, and both eventually need periodic condition assessment over the equipment's service life.",
    "One theme worth flagging up front: CTs and VTs, despite both being called 'instrument transformers' and often discussed in the same breath, behave like opposite types of electrical source, with opposite safety hazards if handled wrong. Getting this backwards is one of the more consequential mistakes possible in this category, and it's covered in detail below.",
  ],
  coreConcepts: [
    {
      heading: "CTs and VTs are opposite kinds of source — and have opposite safety rules",
      body: [
        "A current transformer (CT) is, functionally, a current source: its whole job is to reproduce a scaled-down version of the primary current in its secondary winding, essentially independent of what impedance (burden) is connected to that secondary. This has a critical and somewhat counterintuitive consequence: a CT's secondary must never be left open-circuited while primary current is flowing. With nowhere for the secondary current to go, the CT tries to force that current through infinite impedance, and the resulting secondary voltage can spike to dangerous, insulation-damaging levels — this is precisely why CT secondaries are always short-circuited (via a shorting terminal block) before any connected relay or meter is disconnected for maintenance.",
        "A voltage transformer (VT), by contrast, is a voltage source: its job is to reproduce a scaled-down version of the primary voltage across its secondary terminals, and it expects to see a relatively high-impedance burden. The equivalent hazard is reversed: a VT secondary must never be short-circuited, since a voltage source driven into a short circuit draws very high current, which can damage the VT winding or blow its secondary fuse (and, either way, remove the voltage signal that protection relays downstream may be relying on). Every burden budget, every accuracy check in this category's CT and VT calculators sits on top of this fundamental difference in how the two devices behave.",
      ],
    },
    {
      heading: "CT accuracy: burden, accuracy limit factor, and the knee point",
      body: [
        "A CT's rated burden (in VA) is the maximum load its secondary can drive while still maintaining its rated accuracy class — every relay coil, meter, and length of secondary lead wire connected to that CT consumes some of that burden budget, and the cumulative total (including lead resistance, which itself depends on cable length and cross-sectional area) has to stay within the CT's rating. For protection CTs specifically, the Accuracy Limit Factor (ALF) describes how far above rated current the CT is still guaranteed to reproduce current accurately (e.g. an ALF of 20 means up to 20 times rated current) — a critical figure because protection relays need an accurate current signal precisely during the high-current fault conditions they're meant to detect, not just at normal load.",
        "Knee-point voltage is the practical boundary of that accurate region: beyond it, the CT's magnetic core saturates and secondary output stops scaling linearly with primary current, which can seriously degrade protection performance (particularly for differential and earth-fault schemes, which rely on CT outputs staying proportional even during severe faults). A CT sized with an inadequate knee-point voltage for its actual burden and required ALF can saturate exactly when accurate current information matters most.",
      ],
    },
    {
      heading: "VT sizing: burden vs. standard outputs, and why earthing system changes the required voltage factor",
      body: [
        "VT sizing checks a similar burden budget to CTs (all connected relay coils, meters, and instruments against the VT's rated output), but its most distinctive consideration is the voltage factor — how much continuous overvoltage above nominal the VT must be able to withstand, and for how long, during a system earth fault. This isn't fixed; it depends entirely on the power system's earthing arrangement. In a directly (solidly) earthed system, an earth fault is cleared quickly and the healthy phases see only a modest, brief overvoltage, so a lower voltage factor suffices. In systems without automatic fault clearing (some resistance-earthed or Petersen-coil-earthed systems, where a single earth fault can be tolerated and left connected for an extended period rather than tripped immediately), the healthy-phase overvoltage can persist far longer, so the VT has to be rated for a correspondingly higher voltage factor and duration — a VT correctly sized for one earthing arrangement can be significantly undersized if the same design is reused on a differently-earthed system.",
      ],
    },
    {
      heading: "Sizing a new transformer vs. analyzing one already in service",
      body: [
        "These are genuinely different problems even though they both concern transformers. Sizing a new transformer starts from connected load, applies growth and safety margins, and selects a standard kVA rating (ANSI/IEEE or IEC preferred sizes) — with ambient and altitude derating applied against the transformer's rated nameplate conditions. Analyzing an existing transformer instead starts from open-circuit and short-circuit factory or field test data to determine that specific unit's actual core loss, copper loss, efficiency at various loading levels, and voltage regulation — quantities that describe how a particular transformer performs, not how to select one in the first place.",
        "A transformer's standard nameplate rating assumes specific reference service conditions (per IEC 60076: 40°C maximum ambient, 30°C monthly average, 20°C yearly average) — operating outside those conditions requires derating. Ambient derating above the reference point is commonly approximated at around 1.25% capacity reduction per °C (a widely cited rule of thumb consistent with IEEE C57.96 dry-type guidance), while the standards' own formal loading guides (IEC 60076-7 for oil-immersed, IEC 60076-12 for dry-type) instead model this with a full hot-spot-temperature and insulation-aging thermal calculation dependent on cooling class and load-cycle shape — meaningfully more detailed than the simple percentage rule, and the correct reference for anything beyond preliminary sizing. Altitude derating is a separate, independent effect — thinner air at elevation both reduces convective cooling efficiency and reduces dielectric (insulation breakdown) strength around bushings and in air-cooled sections — and applies its own separate correction (roughly 1K permitted temperature-rise reduction per 400m above 1000m for naturally-cooled ONAN transformers, and per 250m for forced-cooled ONAF/OFAF types).",
      ],
    },
    {
      heading: "A transformer's efficiency and voltage regulation are load-dependent, not fixed numbers",
      body: [
        "A transformer's total loss at any given loading is the sum of its core (iron) loss — roughly constant regardless of load, since it depends on the magnetizing voltage which stays close to rated regardless of load current — and its copper loss, which scales with the square of the load fraction (loss = Pfe + x²·Pcu, where x is the fraction of rated load). Because these two loss components scale so differently with load, efficiency itself varies with loading level and typically peaks somewhere below full load rather than at 100% — a transformer quoted as '98% efficient' without a stated loading point is an incomplete figure. Voltage regulation (the difference between no-load and full-load secondary voltage, expressed as a percentage) is estimated from the same open-circuit/short-circuit test data using Kapp's approximate formula, and likewise varies with both loading level and load power factor.",
      ],
    },
    {
      heading: "Busbar rating: three genuinely different physical checks, not one",
      body: [
        "Busbar and switchgear rating actually combines three physically distinct phenomena that are easy to conflate into a single 'is it rated high enough' question. Continuous ampacity is a steady-state heat-balance problem — resistive (I²R) heating balanced against convective and radiative heat loss to the surroundings, solved for the current that holds the busbar at its maximum allowable operating temperature indefinitely. Short-time thermal withstand is a completely different, much faster phenomenon: how much fault current the busbar can carry for a brief, defined duration (typically 1-3 seconds) during a short circuit before adiabatic heating (too fast for meaningful heat loss to the surroundings) raises conductor temperature past a safe limit. Electrodynamic force is not a thermal phenomenon at all — it's the mechanical force between parallel current-carrying conductors during high fault current, which can physically bend or dislodge busbars and their supports if the mounting isn't braced to withstand it. A busbar comfortably rated for continuous ampacity can still be dangerously inadequate for short-time withstand or electrodynamic force, because each check is governed by different physics and has to be verified independently.",
      ],
    },
    {
      heading: "Insulation resistance and polarization index: absolute value vs. trend",
      body: [
        "Once transformers, motors, and other rotating or wound equipment are in service, periodic insulation testing is one of the standard ways to catch developing insulation problems before they cause a failure. Insulation Resistance (IR) is a single absolute reading — commonly checked against IEEE 43's kV+1 rule of thumb (minimum acceptable megohms roughly equal to rated kV plus 1) — while Polarization Index (PI) is a ratio of two readings taken 1 and 10 minutes into the same test, capturing how much the resistance trends upward as the insulation polarizes. A winding can have an adequate absolute IR reading while still showing a weak PI trend (often a sign of surface contamination or moisture), which is exactly why both are run together rather than relying on either alone — see the Protection & Relaying guide's discussion of grading margins for the broader theme of why single-number checks often need a companion check to be trustworthy.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 61869-2", scope: "Current transformer (CT) accuracy class, ratio, and burden definitions — the basis for the CT Sizing & Saturation calculator." },
    { standard: "IEC 61869-3", scope: "Voltage transformer (VT) accuracy, ratio, and voltage factor requirements by earthing arrangement — the basis for the VT Sizing calculator." },
    { standard: "IEC 60076-1 / -2", scope: "Transformer standard reference service conditions (ambient/altitude) and the basis for the Transformer Sizer's derating logic." },
    { standard: "IEC 60076-7 / -12", scope: "Formal loading guides (oil-immersed / dry-type) using full hot-spot-temperature and insulation-aging thermal models — the authoritative reference beyond the simplified ambient-derating rule of thumb." },
    { standard: "IEEE C57.96", scope: "Dry-type transformer loading guidance, cross-referenced for the ambient derating rule of thumb used in preliminary sizing." },
    { standard: "IEC 60865-1", scope: "Electrodynamic force calculation method for busbars carrying high fault current, used in the Busbar & Switchgear Rating calculator." },
    { standard: "IEC 60890", scope: "Formal type-test verification of enclosure/busbar temperature rise — the authoritative reference this calculator's heat-balance approximation is explicitly not a substitute for." },
    { standard: "IEEE 43-2013", scope: "Insulation resistance (kV+1 rule) and polarization index acceptance criteria for rotating machinery and wound equipment." },
    { standard: "IEEE 142", scope: "Neutral earthing resistor (NGR/NET) sizing — R = V(line-neutral)/rated fault current — a subscriber feature of the Generator & Transformer Analysis calculator." },
  ],
  workflow: [
    {
      title: "Size a new transformer from connected load",
      body: "Start from connected load, growth and safety margins, and select a standard kVA rating, applying ambient and altitude derating if the installation departs from standard reference conditions.",
      calculatorHref: "/calculators/transformer-sizer",
      calculatorName: "Transformer Sizer",
    },
    {
      title: "Size CTs for the protection and metering circuits around it",
      body: "Check ratio, burden, and accuracy limit factor against the actual connected relay/meter burden and lead length — remembering a CT secondary must never be left open-circuited in service.",
      calculatorHref: "/calculators/ct-sizing",
      calculatorName: "CT Sizing & Saturation",
    },
    {
      title: "Size VTs, matched to the system's earthing arrangement",
      body: "Check burden against standard rated outputs, and confirm the voltage factor is adequate for how long an earth fault can persist on this specific system's earthing arrangement.",
      calculatorHref: "/calculators/vt-sizing",
      calculatorName: "VT Sizing",
    },
    {
      title: "Size the busbars and switchgear connecting everything",
      body: "Check all three independent busbar phenomena: continuous ampacity (heat balance), short-time thermal withstand, and electrodynamic force during fault current.",
      calculatorHref: "/calculators/busbar-rating",
      calculatorName: "Busbar & Switchgear Rating",
    },
    {
      title: "Once in service, analyze an existing transformer's real performance",
      body: "Use open-circuit and short-circuit test data to determine actual core/copper loss, load-dependent efficiency, and voltage regulation for a specific installed unit.",
      calculatorHref: "/calculators/gen-xfmr",
      calculatorName: "Generator & Transformer Analysis",
    },
    {
      title: "Periodically verify winding insulation condition",
      body: "Check the absolute insulation resistance reading against the kV+1 minimum, corrected for test temperature.",
      calculatorHref: "/calculators/insulation-resistance",
      calculatorName: "Insulation Resistance Checker",
    },
    {
      title: "And confirm the polarization trend, not just the absolute reading",
      body: "Run the companion 1-minute/10-minute ratio check to catch trend-based problems (contamination, moisture) that an absolute IR reading alone can miss.",
      calculatorHref: "/calculators/polarization-index",
      calculatorName: "Polarization Index (PI)",
    },
  ],
  commonMistakes: [
    {
      mistake: "Leaving a CT secondary open-circuited while primary current is flowing",
      whyItMatters: "A CT is a current source — with no path for secondary current, it can develop dangerously high open-circuit voltage across its own winding insulation, posing a genuine safety hazard. CT secondaries must always be shorted (via a shorting terminal block) before any downstream device is disconnected for maintenance.",
    },
    {
      mistake: "Short-circuiting a VT secondary, or forgetting the opposite hazard applies",
      whyItMatters: "A VT is a voltage source — a short circuit on its secondary drives excessive current that can damage the winding or blow the secondary protection fuse, and either way removes the voltage signal any downstream protection relay may depend on. CTs and VTs need opposite handling precautions, and confusing the two is a real and consequential mistake.",
    },
    {
      mistake: "Sizing a VT's voltage factor without considering the system's earthing arrangement",
      whyItMatters: "How long an earth fault can persist before clearing — and therefore how much sustained overvoltage the VT must withstand on the healthy phases — depends entirely on the earthing system. A VT correctly sized for a directly earthed, fast-clearing system can be significantly undersized if reused on a system where earth faults are tolerated for an extended period before clearing.",
    },
    {
      mistake: "Treating the ambient-derating rule of thumb (roughly 1.25%/°C) as a precise engineering figure",
      whyItMatters: "It's a widely cited approximation for preliminary sizing, not the formal method — the standards' own loading guides (IEC 60076-7/-12) use a full hot-spot-temperature and insulation-aging model dependent on cooling class and load-cycle shape, which can give a meaningfully different answer. Always confirm against the manufacturer's specific thermal rating curve for anything beyond a first-pass estimate.",
    },
    {
      mistake: "Quoting a transformer's efficiency or voltage regulation as a single fixed number",
      whyItMatters: "Both are load-dependent — core loss stays roughly constant while copper loss scales with the square of load fraction, so efficiency typically peaks below full load rather than at it, and regulation varies with both loading level and power factor. A figure quoted without its loading point is incomplete.",
    },
    {
      mistake: "Assuming a busbar rated for continuous ampacity is automatically adequate for short-time withstand or electrodynamic force",
      whyItMatters: "These are three physically distinct checks — steady-state heat balance, adiabatic short-duration heating, and mechanical force from parallel-conductor magnetic interaction — governed by different physics. A busbar sized comfortably for one can still be dangerously inadequate for another, so each needs its own independent check.",
    },
    {
      mistake: "Relying on an absolute insulation resistance reading alone, without checking polarization index",
      whyItMatters: "A winding can show an adequate absolute IR reading while still failing to develop a healthy polarization trend over the 10-minute test — often a sign of surface contamination or moisture that an absolute-value-only check would miss entirely.",
    },
  ],
  faqs: [
    {
      q: "Why are CT sizing and VT sizing separate calculators instead of one combined 'instrument transformer' tool?",
      a: "Despite the shared 'instrument transformer' label, CTs and VTs are functionally opposite kinds of source with opposite burden conventions, opposite safety hazards, and different standards-driven sizing considerations (accuracy limit factor and knee-point voltage for CTs; voltage factor tied to system earthing for VTs) — treating them as interchangeable variations of one calculation would obscure exactly the distinction that matters most for using either one safely.",
    },
    {
      q: "Why does this category have both a 'size a new transformer' calculator and a separate 'analyze an existing transformer' calculator?",
      a: "They solve different problems with different starting data — sizing starts from connected load and selects an appropriately rated new unit, while analysis starts from a specific transformer's own open-circuit/short-circuit test results to characterize how that particular unit actually performs. A newly sized transformer doesn't have test data yet, and an existing transformer doesn't need to be re-sized — the two calculators serve different points in a transformer's lifecycle.",
    },
  ],
};
