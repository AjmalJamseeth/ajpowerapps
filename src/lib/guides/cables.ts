// Category guide: Cables & Line Engineering.

import type { GuideDoc } from "./types";

export const CABLES_GUIDE: GuideDoc = {
  slug: "cables-line-engineering",
  groupId: "cables",
  title: "Cables & Line Engineering: A Practical Guide to Conductor Sizing and Installation",
  dek: "Why a cable has to pass two independent checks to be correctly sized, how MV cables are sized completely differently from LV ones, and why fill and pulling-tension limits matter just as much as the electrical sizing itself.",
  readTime: "15 min read",
  intro: [
    "A cable is one of the few pieces of electrical equipment that has to satisfy two genuinely independent requirements at once, and either one alone is not enough. It has to carry the expected current without overheating (a thermal, ampacity requirement), and it has to deliver that current to the load without the voltage sagging so much along the way that equipment at the far end misbehaves (a functional, voltage-drop requirement). A cable can pass one check and fail the other — a long, lightly-loaded run is often voltage-drop-limited rather than ampacity-limited, while a short, heavily-loaded run is usually the opposite — which is why both checks are run independently and the larger resulting conductor size is the one that actually governs.",
    "This category also covers a layer of practical reality that pure electrical sizing doesn't touch: a correctly-sized cable can still end up damaged or unreliable if it's installed incorrectly. Overfilling a conduit traps heat and makes pulling physically difficult or impossible; exceeding a cable's pulling tension or sidewall bearing pressure during installation can stretch or crush conductors and insulation in ways that don't show up on an insulation resistance test that same day but shorten the cable's service life. That's why conduit/tray fill and pulling tension get their own dedicated calculators here rather than being treated as an afterthought to the core sizing question.",
    "The calculators in this category also deliberately span very different physical regimes — low-voltage building cables, medium-voltage buried feeders, overhead lines, and low-current instrument cables — because each regime is genuinely governed by different physics and different standards, not just a scaled-up or scaled-down version of the same method.",
  ],
  coreConcepts: [
    {
      heading: "Ampacity and voltage drop are two separate checks — size for whichever is larger",
      body: [
        "Ampacity (current-carrying capacity) is fundamentally a thermal limit: how much current can flow before the conductor's insulation exceeds its rated operating temperature, given how the cable is installed (in free air, in a duct bank, buried, in a group with other loaded conductors) and the ambient temperature it's installed in. Standard reference tables — IEC 60364-5-52 in most of the world, NEC Chapter 3/Article 310 in North America — publish base ampacity values for a specific reference installation method and ambient temperature, then apply correction (derating) factors for anything different from that reference condition: higher ambient temperature reduces the safe current, and grouping several loaded conductors together reduces it further because they're now sharing and reinforcing each other's heat.",
        "Voltage drop is a completely separate, non-thermal check: even a cable that runs comfortably cool can still deliver an unacceptably low voltage to the load simply because of its resistance (and, for larger conductors or longer runs, its reactance) over distance. Most standards and good practice guides recommend keeping voltage drop within roughly 3-5% of nominal for general circuits, tighter for motor starting or sensitive electronic loads — a limit whose exact number is a project/standard-specific policy choice, not a fixed physical constant. The correct final conductor size for any given run is whichever of the two checks — ampacity or voltage drop — demands the larger cable.",
      ],
    },
    {
      heading: "Why NEC and IEC cable sizing methods aren't interchangeable",
      body: [
        "NEC and IEC ampacity tables aren't just different units on the same underlying physics — they're organized around different reference conditions, different installation-method taxonomies, and in places different underlying assumptions about grouping and thermal derating, so a size that satisfies one standard's table cannot simply be assumed to satisfy the other's without an independent check. This is exactly why this category's LV Cable Sizing calculator explicitly follows IEC 60364-5-52's own installation reference methods and correction factors as its basis, transcribed directly from the standard's own tables, rather than approximating or interpolating between the two systems.",
      ],
    },
    {
      heading: "Medium-voltage cables need a fundamentally different method: the thermal-circuit approach",
      body: [
        "Low-voltage ampacity tables are pre-computed lookups — someone already solved the heat-balance problem for a set of standard conditions and published the answer as a table. That approach stops being practical once you get into medium- and high-voltage single-core cables, where sheath losses, dielectric losses, and soil thermal resistivity all become significant and highly installation-specific, so a generic table can't capture enough of the real variation to be trustworthy.",
        "IEC 60287 instead defines a first-principles thermal-circuit method: model every source of heat generation in the cable (conductor I²R loss, dielectric loss, sheath/screen circulating and eddy current losses) and every path that heat has to escape through (insulation, bedding, serving, surrounding soil or duct), then solve for the current that brings the conductor to its maximum allowable temperature given that specific installation's thermal resistances. It's a meaningfully more involved calculation than an LV ampacity lookup, but it's the only approach that properly accounts for how much a specific burial depth, soil type, or duct arrangement actually affects a real MV cable's safe rating.",
      ],
    },
    {
      heading: "Why conduit and tray fill limits exist",
      body: [
        "Fill limits serve two separate purposes that happen to point in the same direction. The first is thermal: conductors bundled tightly together in a conduit or tray share and reinforce each other's heat, which is part of why grouping derating factors exist in the first place — an overfilled conduit can push conductors well past the thermal condition the ampacity table assumed. The second is purely mechanical: cable has to actually be pullable through the conduit without excessive friction or jamming, and without so little clearance that insulation gets abraded during the pull.",
        "The exact fill percentages differ by code and by conductor count — NEC Chapter 9 Table 1 uses different maximum fill percentages depending on how many conductors are in the raceway (a single conductor is allowed a higher percentage than two, and two a higher percentage than three or more, reflecting how much space multiple round conductors geometrically waste when packed together), while the IEC/BS 7671 space-factor method uses a flat 45% for conduit and 40% for trunking. Cable tray fill follows its own separate NEC §392.22 width/area rules by tray type and cable category, or an IEC 61537-style area-fill approach — again organized differently from conduit fill because a tray's open, laid-in geometry doesn't behave the same way a fully enclosed conduit does thermally or mechanically.",
      ],
    },
    {
      heading: "Pulling tension: damage that doesn't show up until later",
      body: [
        "During installation, a long cable pull generates real mechanical stress that has nothing to do with the cable's electrical rating: friction against the conduit or tray, the cable's own weight on vertical or inclined sections, and the tighter bend radius at each corner all add up along the pull. IEEE 1185's capstan and tension equations model exactly this — tension builds multiplicatively at each bend (governed by the bend angle and the friction coefficient) on top of whatever straight-run friction and gravity have already added.",
        "Two related limits matter alongside total pulling tension: sidewall bearing pressure (the force the cable presses outward against a bend, per unit length — too much can crush the insulation right at that bend) and jam ratio (the ratio between conduit inner diameter and cable outer diameter for multi-cable pulls, which flags configurations where cables can wedge against each other and the conduit wall, physically jamming the pull). A cable pulled beyond these limits can look completely fine on delivery and even pass an initial insulation resistance test, while carrying latent mechanical damage — micro-cracking in the insulation, conductor strand damage — that only manifests as a fault months or years later. This is exactly why pulling tension is treated as a design calculation to be checked before the pull, not just a field technique to be careful about.",
      ],
    },
    {
      heading: "Instrument and control cable: a different limiting factor entirely",
      body: [
        "Power and control cables are sized primarily around current and voltage drop, but a 4-20mA or HART instrument loop's cable is very rarely current-limited at all — instrument loop currents are tiny. Instead, the practical limiting factor is often the cable's own distributed capacitance accumulating over a long run, which matters specifically for HART communication (a digital signal superimposed on the 4-20mA analog current) and for intrinsically safe circuits where total circuit capacitance has to stay under a barrier's rated limit (see the Instrumentation & Process Controls category guide for more on that). A long enough run of ordinary instrument cable can exceed a host system's or barrier's maximum allowable capacitance well before any voltage-drop or ampacity concern would ever become relevant — a genuinely different governing constraint from the rest of this category.",
      ],
    },
    {
      heading: "Overhead lines: why you supply your own R and X instead of picking from a table",
      body: [
        "Underground and building cables have standardized, table-lookup ampacity because their installation geometry is relatively constrained and repeatable. Overhead line conductors (ACSR, AAAC, AAC and others) are a different story: resistance and reactance per unit length depend not just on the conductor itself but on the specific phase spacing and geometric mean distance of that particular line design, which varies pole-to-pole and project-to-project far more than a buried cable's installation does. Rather than embed a simplified or potentially mismatched conductor table, this category's Overhead Line Voltage Regulation calculator asks for R and X per km directly from the specific conductor's own datasheet for the actual line geometry — a deliberate choice to avoid the transcription risk of a generic table that might not match the real line being designed.",
      ],
    },
    {
      heading: "Distribution losses: why annual energy loss isn't just peak loss × 8,760 hours",
      body: [
        "I²R loss in a line depends on the square of current, and current varies continuously through the day and year — so simply taking the loss at peak load and multiplying by every hour of the year would badly overstate annual energy loss, since the line spends most of its time well below peak. The standard shortcut for this, used when detailed interval load data isn't available, is the load-factor-to-loss-factor approximation: loss factor ≈ 0.3 × load factor + 0.7 × load factor². Because losses scale with the square of current, a feeder's loss factor is always lower than its load factor for any load factor under 100% — reflecting that average losses are disproportionately driven by the peak periods rather than by the more numerous lighter-load hours. This is explicitly an approximation, not an exact physical relationship, and is clearly caveated as such in the Distribution Line Technical Losses calculator.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 60364-5-52:2009", scope: "LV cable current-carrying capacity, installation reference methods, and correction/derating factors — the basis for the LV Cable Sizing calculator's ampacity tables." },
    { standard: "IEC 60364-5-54", scope: "Protective conductor (CPC) sizing and adiabatic short-circuit withstand — a subscriber feature of the LV Cable Sizing calculator." },
    { standard: "IEC 60287-1-1 / -2-1 / -3-1", scope: "First-principles thermal-circuit current rating method for MV/HV cables — current rating equations, thermal resistance, and operating-condition sections." },
    { standard: "NEC Chapter 9 Table 1 / IEC / BS 7671 space-factor method", scope: "Conduit fill percentage limits by conductor count (NEC) or a flat 45%/40% space factor for conduit/trunking (IEC/BS 7671)." },
    { standard: "NEC §392.22 / IEC 61537", scope: "Cable tray fill rules — width/area limits by tray type and cable category (NEC), or area-fill method (IEC)." },
    { standard: "IEEE 1185", scope: "Cable pulling tension, capstan (bend-tension) equations, sidewall bearing pressure, and jam ratio for multi-cable conduit pulls." },
    { standard: "CIGRE Technical Brochure 880", scope: "Independent cross-check reference for the MV Cable Sizing calculator's IEC 60287-based thermal-circuit results." },
  ],
  workflow: [
    {
      title: "Determine the design current and check ampacity for the installation method",
      body: "Start from the load's design current (including any continuous-load margin) and the actual installation method, grouping, and ambient temperature — not a generic assumption.",
      calculatorHref: "/calculators/cable-sizing",
      calculatorName: "Cable Sizing & Voltage Drop",
    },
    {
      title: "For MV/HV feeders, use the thermal-circuit method instead of an LV lookup table",
      body: "Once conductors and voltages move into the MV/HV range, switch to the physics-based thermal-circuit approach that properly accounts for burial depth, soil resistivity, and sheath losses.",
      calculatorHref: "/calculators/mv-cable",
      calculatorName: "MV Cable Sizing",
    },
    {
      title: "Check that the selected conductors and count actually fit the raceway",
      body: "Verify conduit fill for the actual conductor sizes and count chosen in the sizing step above — a cable that passes ampacity and voltage drop can still fail to physically or thermally belong in an undersized conduit.",
      calculatorHref: "/calculators/conduit-fill",
      calculatorName: "Conduit Fill",
    },
    {
      title: "For tray-routed cable runs, check tray fill against the applicable code",
      body: "Cable tray has its own separate fill rules from conduit — check width/area limits by tray type and cable category for tray-routed sections of the same design.",
      calculatorHref: "/calculators/cable-tray-fill",
      calculatorName: "Cable Tray Fill",
    },
    {
      title: "For long or high-tension pulls, check pulling tension before the pull",
      body: "Model the actual pull path — straight runs, bends, vertical sections — and confirm tension, sidewall bearing pressure, and jam ratio all stay within limits before cable goes in the ground or conduit.",
      calculatorHref: "/calculators/cable-pulling-tension",
      calculatorName: "Cable Pulling Tension",
    },
    {
      title: "Size instrument/control cable separately, against capacitance rather than current",
      body: "For 4-20mA and HART loops specifically, check capacitance-limited maximum length and EMI separation from power/VFD cable — a different governing constraint from the power cables above.",
      calculatorHref: "/calculators/control-cable-sizing",
      calculatorName: "Control / Instrumentation Cable Sizing",
    },
    {
      title: "For overhead sections, check voltage regulation using the actual conductor's R and X",
      body: "Use the specific conductor's own datasheet R/X per km for the real line geometry, rather than a generic table, to check voltage regulation over the line's length.",
      calculatorHref: "/calculators/ohl-voltage-regulation",
      calculatorName: "Overhead Line Voltage Regulation",
    },
    {
      title: "Estimate annual technical losses for the completed feeder design",
      body: "Once the feeder is sized, estimate the ongoing energy cost of its own resistive losses using peak load, diversity, and load factor.",
      calculatorHref: "/calculators/line-losses",
      calculatorName: "Distribution Line Technical Losses",
    },
  ],
  commonMistakes: [
    {
      mistake: "Sizing a cable for ampacity alone and skipping the voltage-drop check (or vice versa)",
      whyItMatters: "The two checks are genuinely independent and can each fail on their own — a long, lightly loaded run is commonly voltage-drop-limited well before it's anywhere near its ampacity limit, while a short, heavily loaded run is usually the opposite. The correct final size is whichever check demands the larger conductor, so skipping either check can leave a cable that looks adequately sized but fails the check that was skipped.",
    },
    {
      mistake: "Applying an NEC-derived rule of thumb to an IEC-designed installation, or vice versa",
      whyItMatters: "The two standards' ampacity tables are built around different reference installation methods, different derating conventions, and in places different underlying assumptions — a size that clears one standard's table cannot be assumed to clear the other's without an independent check against that standard's own method.",
    },
    {
      mistake: "Using an LV-style ampacity table approach for MV/HV cable sizing",
      whyItMatters: "MV/HV single-core cables have sheath losses, dielectric losses, and soil-thermal-resistivity dependence that a generic LV table simply doesn't capture — IEC 60287's thermal-circuit method exists specifically because a pre-computed table can't represent enough of the real installation-specific variation to be trustworthy at these voltage levels.",
    },
    {
      mistake: "Treating conduit/tray fill as a purely mechanical 'will it physically fit' question",
      whyItMatters: "Fill limits are also a thermal derating consideration — conductors bundled tightly together share and reinforce each other's heat, which is exactly why grouping correction factors exist in ampacity calculations in the first place. An overfilled conduit can push conductors past the thermal condition their ampacity was actually calculated for, independent of whether the cables physically fit.",
    },
    {
      mistake: "Assuming a cable that passes inspection right after a difficult pull is undamaged",
      whyItMatters: "Exceeding pulling tension, sidewall bearing pressure, or jam ratio limits during installation can cause latent insulation or conductor damage that doesn't show up on an initial insulation resistance test — the damage can progress and manifest as a fault well after commissioning, which is exactly why pulling tension is checked as a design calculation before the pull rather than relied on as a pass/fail outcome after the fact.",
    },
    {
      mistake: "Sizing instrument cable the same way as power cable (by current/voltage drop alone)",
      whyItMatters: "4-20mA and HART instrument loops carry very little current, so ampacity and voltage drop are rarely the binding constraint — cable capacitance accumulating over a long run is often the real limit, for HART digital communication integrity and for intrinsically safe circuit capacitance limits alike, and needs its own dedicated check rather than being assumed adequate because the current is low.",
    },
    {
      mistake: "Using a generic conductor table for overhead line voltage regulation instead of the actual conductor's datasheet R/X",
      whyItMatters: "Overhead line resistance and reactance per unit length depend on the specific conductor and the actual phase spacing/geometric mean distance of that line design, which varies far more between projects than a buried cable's installation does — a generic or mismatched table value can meaningfully misstate voltage regulation for the real line geometry.",
    },
  ],
  faqs: [
    {
      q: "If a cable passes both ampacity and voltage drop, is it definitely correctly sized?",
      a: "For the electrical sizing question, yes — but this category's calculators also cover installation-feasibility checks (conduit/tray fill, pulling tension) that are just as capable of failing even when the electrical sizing is fine. A cable that's electrically correct but physically overfilled in its conduit or pulled beyond its tension rating can still end up unreliable, so a complete cable design generally needs to clear all of the relevant checks for its situation, not just the electrical ones.",
    },
    {
      q: "Why does this category treat LV cable sizing, MV cable sizing, and overhead line voltage regulation as three separate calculators instead of one generalized tool?",
      a: "Each one is genuinely governed by a different underlying method, not just a different input range on the same formula — LV sizing uses pre-computed IEC 60364-5-52 ampacity tables, MV sizing solves a first-principles IEC 60287 thermal circuit, and overhead lines use conductor-specific R/X values rather than any lookup table at all. Trying to force all three into one generalized calculator would mean applying at least one of these methods outside the conditions it was actually derived for.",
    },
  ],
};
