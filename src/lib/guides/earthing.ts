// Category guide: Earthing, Lightning & Static Safety.

import type { GuideDoc } from "./types";

export const EARTHING_GUIDE: GuideDoc = {
  slug: "earthing-lightning-static-safety",
  groupId: "earthing",
  title: "Earthing, Lightning & Static Safety: A Practical Guide to Ground Potential and Spark Risk",
  dek: "Why a low earthing resistance doesn't automatically mean a safe touch voltage, how the rolling sphere method actually works, and why bonding resistance and spark energy are two different hazards that both need checking.",
  readTime: "14 min read",
  intro: [
    "This category covers three hazards that all trace back to the same underlying idea — uncontrolled voltage appearing somewhere it shouldn't — but that arise from very different physical causes and are addressed with very different methods. A fault current flowing into the earth raises the local ground potential and can put a dangerous voltage across a person's body if they're touching equipment or standing in the wrong place at the wrong time. A lightning strike delivers an enormous, extremely fast current pulse that has to be captured and safely routed to ground before it can pick its own, far more destructive path through a structure. And a small isolated conductive object accumulating static charge can discharge a spark with more than enough energy to ignite a flammable atmosphere, even with no fault current or lightning involved at all.",
    "The common thread across all six calculators here is that none of them can be judged safe by a single number in isolation. A ground resistance reading by itself doesn't tell you whether touch voltage is safe. A lightning air-terminal's height doesn't tell you whether it actually protects a given point on a structure. A bonding resistance reading doesn't tell you whether a spark hazard has been fully eliminated. Each calculator exists because the intuitive single-number answer to 'is this safe' is usually incomplete on its own.",
  ],
  coreConcepts: [
    {
      heading: "Ground potential rise (GPR) and why low resistance alone doesn't guarantee safety",
      body: [
        "When fault current flows into an earthing grid, the grid's potential rises above true (remote) earth by an amount equal to the fault current times the grid's resistance to earth — this is ground potential rise (GPR). It's tempting to assume that a low grid resistance is automatically safe, but GPR depends on both resistance and fault current, and even a well-designed low-resistance grid can have a large GPR if the available fault current is high enough. What actually matters for personnel safety isn't GPR itself but how much of that GPR can appear across a person's body — the touch voltage (between a grounded structure and a point on the ground near it) and step voltage (between two points on the ground a stride apart).",
        "IEEE 80 defines tolerable touch and step voltage limits based on body current thresholds and fault clearing time (faster clearing tolerates a higher voltage, since the hazard is really about total energy delivered to the body, not voltage alone), and a surface derating factor that accounts for a high-resistivity surface layer (crushed rock, asphalt) at the person's feet reducing the current that can actually flow through the body for a given touch voltage. A grid design is only actually validated once computed touch and step voltages — not grid resistance alone — are checked against these tolerable limits for the specific fault current, clearing time, and surface material at that site.",
      ],
    },
    {
      heading: "Lightning risk assessment: a probability-based decision, not a fixed answer",
      body: [
        "IEC 62305's risk assessment approach doesn't ask 'does this structure need lightning protection' as a yes/no design rule — it computes an actual estimated risk (expected annual loss, combining strike frequency, structure and location characteristics, and the probability of a given type of damage) and compares it against a tolerable risk threshold, then works backward to find the minimum Lightning Protection System (LPS) class that brings the risk below that threshold. Collection area — the effective ground area that attracts strikes to the structure, larger than the structure's own footprint because tall structures attract strikes from a wider surrounding radius — location factors (isolated structures on high ground are struck more often than sheltered ones), and any existing shielding on incoming services all feed into this probability calculation.",
        "LPS class (I through IV, from most to least stringent) is the risk assessment's output, not an input chosen by preference — a higher class (I) corresponds to a denser air-terminal mesh, a smaller rolling sphere radius, and closer-spaced down-conductors, because it's designed to intercept a wider range of strike severities including the smaller, more probable strikes that a lower class would miss.",
      ],
    },
    {
      heading: "The rolling sphere method: pure geometry, not electrical calculation",
      body: [
        "Once an LPS class (and therefore a rolling sphere radius) is established, the rolling sphere method determines where air terminals actually need to be to protect a structure — and it's a purely geometric model, not an electrical one. Imagine a sphere of the class's specified radius rolling over and around the structure in every possible direction and orientation; any point the sphere can touch is considered exposed to a direct strike, while any point the sphere can never reach (because a taller feature, like an air terminal, holds the sphere away) is considered shielded.",
        "For a single mast of height h protecting a flat surrounding area, geometry gives the protected radius at ground level as rp = √(2Rh − h²), where R is the class's rolling sphere radius — the mast effectively pushes the sphere away from the ground out to that radius. This formula only holds while the mast height is less than or equal to the sphere radius; once a mast is taller than R, the simple single-mast geometry breaks down (the sphere would rest against the mast partway up rather than at its tip) and a full mesh or multi-terminal study is required instead of a single protection-radius number.",
      ],
    },
    {
      heading: "Touch voltage from neutral/earth imbalance is a different scenario from grid GPR",
      body: [
        "Grid GPR arises from a genuine earth fault delivering large current into the earthing system. A separate, often more everyday hazard comes from ordinary, imperfect neutral/earth current balance — a modest imbalance current returning partly through an unintended ground path (bonding, cable armor, structural steel) develops its own touch voltage across whatever impedance that path presents, even with no fault condition at all. This is checked against IEC 60364-4-41's conventional touch-voltage limits, which are lower in wet or conductive locations (25V) than in normal dry conditions (50V) — reflecting that wet skin and better body contact dramatically increase the current that a given touch voltage can drive through a person.",
      ],
    },
    {
      heading: "Static bonding: a bulk conductive path, not a spark-by-spark check",
      body: [
        "Static electricity accumulates whenever a charge-generating process (liquid flow through a pipe, powder handling, friction) isn't matched by an equally fast path for that charge to dissipate. Bonding and grounding provide that continuous, low-resistance conductive path — connecting a tank truck or drum to the same reference ground as the loading rack, for instance, so charge can equalize continuously rather than building up on an isolated conductor. NFPA 77's commonly cited threshold of 1 megohm (10⁶ Ω) or less for adequate static dissipation is a bulk resistance check on that bonding path — it's not verifying the absence of any possible spark, only that the conductive path is good enough to prevent meaningful charge accumulation in the first place.",
      ],
    },
    {
      heading: "ESD spark energy: the check for what bonding alone doesn't cover",
      body: [
        "Even with adequate bonding, small isolated conductive objects (a loose fitting, an ungrounded tool, a person not wearing conductive footwear) can still accumulate charge and discharge a spark. The energy in that discharge is a simple capacitive relationship, E = ½CV² — a function of the object's capacitance to ground and the voltage it charges to — and the screening question is whether that energy exceeds the surrounding atmosphere's Minimum Ignition Energy (MIE), the smallest spark energy that atmosphere is known to ignite from.",
        "MIE is a property of the specific flammable substance, not a universal constant, and can vary by orders of magnitude between different gases, vapors, and dusts — which is exactly why this calculator always takes MIE as a direct user input from the substance's own published data (e.g. IEC 60079-20-1 tables) rather than assuming a single built-in value. IEC 60079 gas group (IIA/IIB/IIC) is a related but coarser classification used mainly for equipment certification, and correlates loosely with how demanding a substance's MIE tends to be (Group IIC substances, like hydrogen, are associated with the lowest, most easily ignited energies) — but gas group alone isn't a substitute for looking up the substance's actual MIE value.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEEE Std 80", scope: "Earthing grid resistance, ground potential rise, and tolerable touch/step voltage limits based on body current and fault clearing time." },
    { standard: "BS 7430:2011", scope: "Earth electrode sizing and configuration guidance, used alongside IEEE 80 in the Earthing Grid Design calculator." },
    { standard: "IEC 62305-1 / -2", scope: "Lightning protection risk assessment methodology — collection area, location/shielding factors, and the risk-to-LPS-class decision process." },
    { standard: "IEC 62305 (rolling sphere geometry)", scope: "Defines the rolling sphere radius associated with each LPS class (I-IV), used for air-terminal placement and protection radius geometry." },
    { standard: "IEC 60364-4-41", scope: "Conventional touch-voltage limits (50V dry/normal, 25V wet/conductive locations) used for the neutral/earth imbalance touch-voltage check." },
    { standard: "NFPA 77", scope: "Recommended practice on static electricity — the commonly cited 1 megohm bonding/grounding resistance threshold for adequate static dissipation." },
    { standard: "IEC 60079-32-1", scope: "Electrostatic hazards in hazardous areas — the basis for the spark-energy-vs-MIE screening method used in the ESD calculator." },
    { standard: "IEC 60079-20-1", scope: "Reference source for substance-specific Minimum Ignition Energy (MIE) and gas group data used as inputs to the ESD calculator." },
  ],
  workflow: [
    {
      title: "Design the earthing grid and check GPR against tolerable touch/step voltage",
      body: "Start with the site's earthing grid — resistance, ground potential rise, and touch/step voltage checked against IEEE 80 limits for the actual fault current, clearing time, and surface material, not resistance alone.",
      calculatorHref: "/calculators/earthing",
      calculatorName: "Earthing Grid Design",
    },
    {
      title: "Assess overall lightning risk and determine the required LPS class",
      body: "Run the IEC 62305 risk assessment for the structure to establish whether lightning protection is needed at all, and if so, the minimum LPS class required to bring risk below the tolerable threshold.",
      calculatorHref: "/calculators/lightning-protection",
      calculatorName: "Lightning Protection",
    },
    {
      title: "Use the resulting LPS class to place air terminals with the rolling sphere method",
      body: "Once the LPS class (and its rolling sphere radius) is known, check a single mast's actual protection radius, or flag where a full mesh study is needed instead.",
      calculatorHref: "/calculators/rolling-sphere",
      calculatorName: "LPS Rolling Sphere Method",
    },
    {
      title: "Separately check touch voltage from ordinary neutral/earth imbalance",
      body: "This is a different, more everyday scenario from grid fault GPR — check it against IEC 60364-4-41's wet/dry limits independently.",
      calculatorHref: "/calculators/touch-voltage",
      calculatorName: "Touch Voltage from Imbalance",
    },
    {
      title: "For flammable-liquid transfer points, verify bonding/grounding resistance",
      body: "Confirm the bulk conductive bonding path at loading racks, tank trucks, or drum-filling points meets the NFPA 77 static-dissipation threshold.",
      calculatorHref: "/calculators/static-bonding",
      calculatorName: "Static Bonding & Grounding Check",
    },
    {
      title: "Check residual ESD spark risk from isolated conductive objects",
      body: "Even with adequate bonding, screen any small isolated conductive object's potential spark energy against the atmosphere's actual Minimum Ignition Energy.",
      calculatorHref: "/calculators/esd-energy",
      calculatorName: "ESD Spark Energy Check",
    },
  ],
  commonMistakes: [
    {
      mistake: "Assuming a low earthing grid resistance reading is automatically safe",
      whyItMatters: "Ground potential rise depends on both resistance and available fault current, and touch/step voltage safety depends further on surface derating and fault clearing time — a low-resistance grid can still produce an unsafe touch voltage if fault current is high enough or the surface derating and clearing time aren't favorable, so resistance alone isn't a sufficient safety check.",
    },
    {
      mistake: "Choosing an LPS class by preference or convention rather than from the actual risk assessment",
      whyItMatters: "LPS class is meant to be the output of IEC 62305's risk calculation for the specific structure, location, and its actual usage/contents — an arbitrarily chosen class (even a seemingly conservative one) may not correspond to the tolerable risk threshold that risk assessment is designed to achieve for that particular structure.",
    },
    {
      mistake: "Applying the single-mast rolling sphere formula when mast height exceeds the sphere radius",
      whyItMatters: "The rp = √(2Rh − h²) formula is only geometrically valid for h ≤ R — beyond that point the sphere would contact the mast partway up rather than resting on the ground at the calculated radius, so the simple formula no longer describes the real protected zone and a full mesh or multi-terminal study is required instead.",
    },
    {
      mistake: "Treating grid GPR and neutral/earth imbalance touch voltage as the same check",
      whyItMatters: "Grid GPR is driven by genuine fault current into the earthing system under fault conditions, while imbalance-driven touch voltage can appear during entirely normal operation from ordinary neutral/earth current imbalance — they're different scenarios with different limits and different root causes, and a site can need both checked independently.",
    },
    {
      mistake: "Treating a passing bonding-resistance reading as proof that no spark hazard exists",
      whyItMatters: "The NFPA 77 bonding resistance threshold verifies the bulk conductive path is good enough to prevent meaningful bulk charge accumulation — it doesn't address small isolated conductive objects (a loose fitting, an ungrounded tool) that can still accumulate their own charge and spark independently of the main bonding path, which is exactly the separate hazard the ESD spark energy check screens for.",
    },
    {
      mistake: "Using gas group (IIA/IIB/IIC) as a substitute for the substance's actual Minimum Ignition Energy",
      whyItMatters: "Gas group is a coarser classification used mainly for equipment certification and only loosely correlates with MIE — the actual MIE value for the specific substance involved can vary meaningfully within a single gas group, so equipment-certification group alone isn't a reliable substitute for looking up the substance's own published MIE data.",
    },
  ],
  faqs: [
    {
      q: "Why are earthing grid design and touch voltage from imbalance two separate calculators when both ultimately check a touch voltage?",
      a: "They model two different physical scenarios with different causes, current magnitudes, and even different applicable standards in places — grid GPR is a fault-condition calculation tied to the earthing system's own resistance and available fault current, while imbalance touch voltage is a normal-operation scenario driven by an unintended return-current path. Keeping them separate reflects that a site needs to check both independently, not that either one is redundant.",
    },
    {
      q: "How does this category relate to intrinsic safety, which also deals with hazardous areas?",
      a: "They address different layers of the same broader hazardous-area safety picture. This category's static bonding and ESD checks are about preventing an ignition source (a spark) from existing in the first place, largely independent of any specific electrical equipment. Intrinsic safety (covered in the Instrumentation & Process Controls guide) is about ensuring that electrical equipment deliberately installed in a hazardous area can't itself release enough energy to ignite the atmosphere even under fault conditions — both are aimed at preventing ignition, but from different directions.",
    },
  ],
};
