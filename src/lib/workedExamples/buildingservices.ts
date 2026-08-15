// Worked examples for the Building Services & Facilities group. Every
// numeric value was produced by running the calculator's own verified
// engine (hvac.ts / lighting.ts / elevatordemand.ts / pue.ts / lcc.ts /
// heattracing.ts / enclosurecooling.ts) directly with tsx, not hand-typed.

import type { WorkedExample } from "./types";

export const BUILDINGSERVICES_EXAMPLES: WorkedExample[] = [
  {
    slug: "hvac-compressor-branch-circuit-and-combination-load-nec440",
    groupId: "building-services",
    calculatorHref: "/calculators/hvac-electrical-sizing",
    calculatorName: "HVAC Electrical Sizing",
    title: "Worked Example: A Single Compressor Circuit vs. a Compressor-Plus-Fan Combination Load",
    dek: "NEC Article 440 branch-circuit sizing for one compressor motor, then the same compressor paired with a condenser fan on a shared feeder — showing why combination-load sizing isn't just 'add the two MCAs together'.",
    standard: "NEC Article 440 (hermetic refrigerant motor-compressors)",
    incidentBased: false,
    readTime: "9 min read",
    scenario: [
      { label: "Compressor rated-load current (RLA)", value: "18 A" },
      { label: "Compressor locked-rotor amps (LRA)", value: "110 A" },
      { label: "Second load on the feeder — condenser fan RLA", value: "4 A" },
      { label: "Standard", value: "NEC Article 440" },
    ],
    steps: [
      {
        title: "Size the single compressor's minimum circuit ampacity (MCA)",
        equation: "MCA = 1.25 x RLA",
        substitution: "1.25 x 18",
        result: "MCA = 22.5 A",
      },
      {
        title: "Size the maximum overcurrent protection (MOCP) — NEC 440.22(A)",
        body: "MOCP starts at 175% of RLA, rounds up to the next standard breaker/fuse size, but is capped so it never exceeds 225% of RLA.",
        equation: "base = 1.75 x RLA (round up to standard size)          cap = 2.25 x RLA",
        substitution: "1.75 x 18 = 31.5 → next standard size 35 A          2.25 x 18 = 40.5 A cap",
        result: "MOCP = 35 A (35 ≤ 40.5 cap, so no reduction needed)",
      },
      {
        title: "Size the disconnect switch rating",
        equation: "discA = 1.15 x RLA",
        substitution: "1.15 x 18",
        result: "Disconnect = 20.7 A",
      },
      {
        title: "Now combine the compressor with the condenser fan on one feeder",
        body: "NEC combination-load sizing does not simply sum each device's own MCA — instead, the largest motor gets its own 125% factor, and every other load on the same feeder is added at 100% (its full RLA, no margin).",
        equation: "comboMCA = 1.25 x largestRLA + sum(otherRLAs)",
        substitution: "1.25 x 18 + 4",
        result: "comboMCA = 26.5 A (not 22.5 + 5 = 27.5 A, which is what a naive 'add both MCAs' approach would give)",
      },
      {
        title: "Size the combination MOCP and disconnect",
        equation: "comboMOCP = MOCP(largest) + sum(otherRLAs)          comboDisc = 1.15 x sum(allRLAs)",
        substitution: "35 + 4          1.15 x 22",
        result: "comboMOCP = 39 A, comboDisc = 25.3 A",
      },
    ],
    resultSummary: [
      { check: "Single compressor MCA", requirement: "n/a (sizing basis)", actual: "22.5 A", pass: true },
      { check: "Single compressor MOCP", requirement: "≤ 40.5 A cap", actual: "35 A", pass: true },
      { check: "Combination-load MCA (compressor + fan)", requirement: "n/a (sizing basis)", actual: "26.5 A", pass: true },
      { check: "Combination-load MOCP", requirement: "n/a (sizing basis)", actual: "39 A", pass: true },
    ],
    finalAnswer: "The standalone compressor needs a 22.5 A MCA feeding a 35 A MOCP and a 20.7 A disconnect. Once the condenser fan shares the same feeder, the correct combination-load MCA is 26.5 A — only the largest motor (the compressor) gets the 125% margin, while the fan's 4 A is added at its own full rated current, not at 125%.",
    keyInsight: "A frequent sizing mistake is adding each device's own already-125%-margined MCA together for a shared feeder — that double-counts the safety margin on every motor except the largest, producing an oversized (and non-compliant with the Article 440 method) result. NEC combination-load sizing applies the 125% factor exactly once, to the single largest motor, and full RLA to everything else on that feeder.",
    faqs: [
      {
        q: "Why does only the largest motor get the 125% margin in a combination load?",
        a: "The 125% factor exists to keep the branch-circuit conductor comfortably above one motor's starting and running behavior — once that largest motor's margin is included, the other loads on the same feeder are already running loads (not the one setting the peak starting/thermal condition), so NEC 440.22(A) only requires them to be counted at their full rated current rather than re-applying the margin to each one individually.",
      },
      {
        q: "Does the same logic apply to a VFD-fed motor input and output circuit?",
        a: "No — a VFD's input and output circuits are sized independently of each other and of any combination-load calculation, because the VFD itself decouples the fixed-frequency supply side from the variable-frequency motor side; this calculator's separate VFD section applies the 125% (NEC) or IEC margin factor directly to the drive's rated input current and to the motor's RLA on the output side, each on its own.",
      },
    ],
  },

  {
    slug: "lighting-lumen-method-interior-office-vs-exterior-car-park",
    groupId: "building-services",
    calculatorHref: "/calculators/lighting-design",
    calculatorName: "Lighting Design",
    title: "Worked Example: Lumen-Method Fixture Count for an Open-Plan Office and a Car Park Traffic Route",
    dek: "The same EN 12464-1 lumen-method formula applied to a 500 lux interior office and a 75 lux exterior car park traffic route — two very different target illuminances driving two very different fixture counts.",
    standard: "EN 12464-1 lumen method",
    incidentBased: false,
    readTime: "9 min read",
    scenario: [
      { label: "Room 1: Open-plan office", value: "10 m x 8 m, mounting height 2.5 m, target 500 lux" },
      { label: "Luminaire (office)", value: "4000 lm, UF=0.55, MF=0.8" },
      { label: "Area 2: Car park traffic route", value: "40 m x 20 m, mounting height 8 m, target 75 lux" },
      { label: "Luminaire (car park, floodlight)", value: "20,000 lm, UF=0.45, MF=0.75" },
    ],
    steps: [
      {
        title: "Compute the office's room index and exact luminaire count",
        equation: "K = (L x W) / (Hm x (L+W))          nExact = (E x Area) / (flux x UF x MF)",
        substitution: "(10x8)/(2.5x18) = 1.78          (500 x 80) / (4000 x 0.55 x 0.8)",
        result: "K = 1.78, nExact = 22.73 luminaires",
      },
      {
        title: "Round up to a whole number of luminaires and find the achieved illuminance",
        equation: "nRequired = ceil(nExact)          achievedLux = (n x flux x UF x MF) / Area",
        substitution: "ceil(22.73) = 23          (23 x 4000 x 0.55 x 0.8) / 80",
        result: "nRequired = 23 luminaires, achieved 506.0 lux (comfortably ≥ 500 lux target)",
      },
      {
        title: "Repeat the same method for the exterior car park route (subscriber-tier area type)",
        equation: "K = (L x W) / (Hm x (L+W))          nExact = (E x Area) / (flux x UF x MF)",
        substitution: "(40x20)/(8x60) = 1.67          (75 x 800) / (20000 x 0.45 x 0.75)",
        result: "K = 1.67, nExact = 8.89 → nRequired = 9 floodlights",
      },
      {
        title: "Check the achieved illuminance for the car park",
        equation: "achievedLux = (n x flux x UF x MF) / Area",
        substitution: "(9 x 20000 x 0.45 x 0.75) / 800",
        result: "achievedLux = 75.94 lux (≥ 75 lux target)",
      },
    ],
    resultSummary: [
      { check: "Office achieved illuminance", requirement: "≥ 500 lux", actual: "506.0 lux", pass: true },
      { check: "Office luminaire count", requirement: "n/a (sizing basis)", actual: "23 luminaires", pass: true },
      { check: "Car park achieved illuminance", requirement: "≥ 75 lux", actual: "75.94 lux", pass: true },
      { check: "Car park luminaire count", requirement: "n/a (sizing basis)", actual: "9 floodlights", pass: true },
    ],
    finalAnswer: "The office needs 23 luminaires at 4000 lm each to hold 500 lux, achieving 506.0 lux. The car park traffic route, despite covering ten times the floor area, needs only 9 floodlights because its 75 lux target is 85% lower than the office's — illuminance target, not room size alone, is what drives luminaire count.",
    keyInsight: "The lumen method's fixture count scales with the ratio of target illuminance to (luminaire output x utilization x maintenance factor) x area — a large area with a low target (like a car park route) can need far fewer fixtures than a small area with a high target (like a technical drawing office at 750 lux), which is why area alone is a poor proxy for lighting cost or fixture count without also weighing the target illuminance for that specific space type.",
    faqs: [
      {
        q: "What do the utilization factor (UF) and maintenance factor (MF) actually represent?",
        a: "UF accounts for how much of a luminaire's emitted light actually reaches the working plane, given room proportions, mounting height, and surface reflectances — a low, wide room with light-colored walls has a higher UF than a tall, narrow room with dark surfaces. MF accounts for the light loss expected over the maintenance cycle from lamp lumen depreciation and luminaire dirt accumulation before the next cleaning or relamping — both factors are why the same luminaire in two different rooms is very unlikely to hit the same lux value.",
      },
      {
        q: "Why is the car park lighting listed as a subscriber-tier feature rather than free like the office?",
        a: "Interior room types are free on this calculator, while exterior/area lighting types (car parks, building exteriors) are grouped as a subscriber feature — reflecting that exterior lighting design typically involves additional considerations (light trespass, glare, pole spacing) beyond the same basic lumen-method illuminance target used here.",
      },
    ],
  },

  {
    slug: "elevator-electrical-demand-single-unit-vs-four-elevator-feeder",
    groupId: "building-services",
    calculatorHref: "/calculators/elevator-demand",
    calculatorName: "Elevator Electrical Demand",
    title: "Worked Example: Single Elevator Motor Power vs. a Four-Elevator Group Feeder Under NEC 620.14",
    dek: "One traction elevator's motor power from its rated load, speed, and counterweight balance, then the NEC Table 620.14 demand factor that lets a shared four-elevator feeder be sized well below the sum of all four running flat-out.",
    standard: "Standard traction-elevator power formula + NEC Table 620.14",
    incidentBased: false,
    readTime: "8 min read",
    scenario: [
      { label: "Rated load per car", value: "1000 kg" },
      { label: "Rated speed", value: "1.5 m/s" },
      { label: "Counterweight balance factor", value: "0.5 (50% of rated load balanced)" },
      { label: "Drive efficiency (mechanical x motor)", value: "0.7" },
      { label: "Number of identical elevators on the shared feeder", value: "4" },
      { label: "Feeder voltage / power factor", value: "415 V 3-phase / 0.85" },
    ],
    steps: [
      {
        title: "Find the net (unbalanced) load the motor must actually move",
        body: "The counterweight balances a fraction of the rated load — the motor only has to move the remaining unbalanced portion at rated speed.",
        equation: "netLoad = ratedLoad x (1 - balanceFactor)",
        substitution: "1000 x (1 - 0.5)",
        result: "netLoad = 500 kg",
      },
      {
        title: "Compute one elevator's motor power",
        equation: "P(kW) = netLoad x 9.81 x speed / (1000 x efficiency)",
        substitution: "500 x 9.81 x 1.5 / (1000 x 0.7)",
        result: "singleUnitPowerKw = 10.51 kW",
      },
      {
        title: "Estimate the single unit's full-load current",
        equation: "FLA ≈ P(W) / (√3 x V x PF)",
        substitution: "10,510.7 / (1.732 x 415 x 0.85)",
        result: "singleUnitFlaApprox = 17.20 A",
      },
      {
        title: "Find the connected load for all 4 elevators (before any demand factor)",
        equation: "connectedLoad = singleUnitPower x numElevators",
        substitution: "10.51 x 4",
        result: "connectedLoadKw = 42.04 kW — this is what the feeder would need if all 4 ran at full power simultaneously with zero diversity",
      },
      {
        title: "Apply the NEC Table 620.14 demand factor for 4 elevators on one feeder",
        body: "Table 620.14 reflects the reality that not every elevator in a group runs at full duty simultaneously — the demand factor drops as more elevators share a feeder.",
        equation: "demandLoad = connectedLoad x demandFactor(n)",
        substitution: "42.04 x 0.85 (the Table 620.14 factor for exactly 4 elevators)",
        result: "demandLoadKw = 35.74 kW, demandLoadFlaApprox = 58.49 A",
      },
    ],
    resultSummary: [
      { check: "Single unit motor power", requirement: "n/a (sizing basis)", actual: "10.51 kW", pass: true },
      { check: "Connected load (4 units, no diversity)", requirement: "n/a (informational)", actual: "42.04 kW", pass: true },
      { check: "NEC 620.14 demand factor (n=4)", requirement: "n/a (code table lookup)", actual: "0.85", pass: true },
      { check: "Feeder demand load", requirement: "n/a (sizing basis)", actual: "35.74 kW / 58.49 A", pass: true },
    ],
    finalAnswer: "Each elevator's motor draws 10.51 kW to move its 500 kg net (unbalanced) load at 1.5 m/s. Four of them would connect to 42.04 kW with zero diversity, but NEC Table 620.14's 0.85 demand factor for a 4-elevator group brings the feeder design load down to 35.74 kW (58.49 A) — about 15% smaller than sizing for all four running flat-out at once.",
    keyInsight: "NEC 620.14's demand factor exists because elevator group operation is inherently non-simultaneous by design — a dispatch system rarely runs every car in a bank at full duty at the same instant, so sizing the shared feeder for 100% connected load on every unit would be a real but avoidable oversizing. The demand factor gets smaller as more elevators share a feeder (down to 0.72 for 10 or more), reflecting that duty-cycle overlap becomes statistically less likely to hit 100% concurrently as the group grows.",
    faqs: [
      {
        q: "Does the demand factor apply to each elevator's own branch circuit, or only to the shared feeder?",
        a: "Only to the shared feeder — each individual elevator's own branch circuit and motor protection still has to be sized for that elevator's own full-load current with no diversity applied, since any single car can and does run at full duty at any moment. The demand factor is specifically a feeder-level allowance for the statistical unlikelihood of every car in the group being at full duty at exactly the same instant.",
      },
      {
        q: "Why does a higher counterweight balance factor reduce motor power?",
        a: "The counterweight's whole purpose is to offset most of the car's weight so the motor only has to supply the net difference — a higher balance factor (closer to 1.0) leaves less unbalanced load for the motor to lift, directly reducing both motor power and current, though in practice the balance factor is chosen based on expected average passenger loading, not maximized purely to minimize motor size.",
      },
    ],
  },

  {
    slug: "data-center-pue-dcie-and-the-1-5-boundary-classification",
    groupId: "building-services",
    calculatorHref: "/calculators/pue",
    calculatorName: "Data Center PUE",
    title: "Worked Example: A Data Center Sitting Exactly on the PUE 1.5 Efficiency-Band Boundary",
    dek: "A facility drawing 1,500,000 kWh against 1,000,000 kWh of IT load lands on a PUE of exactly 1.5 — and the classification rule's strict less-than comparison puts it in the band below where a casual reading might expect.",
    standard: "ISO/IEC 30134-2 (PUE metric) — Green Grid informal efficiency bands",
    incidentBased: false,
    readTime: "7 min read",
    scenario: [
      { label: "Total facility energy (measurement period)", value: "1,500,000 kWh" },
      { label: "IT equipment energy (same period)", value: "1,000,000 kWh" },
      { label: "Electricity rate", value: "$0.12 / kWh" },
    ],
    steps: [
      {
        title: "Compute PUE",
        equation: "PUE = totalFacilityEnergy / itEquipmentEnergy",
        substitution: "1,500,000 / 1,000,000",
        result: "PUE = 1.50 exactly",
      },
      {
        title: "Compute DCiE (the reciprocal, as a percentage)",
        equation: "DCiE = (itEquipmentEnergy / totalFacilityEnergy) x 100",
        substitution: "(1,000,000 / 1,500,000) x 100",
        result: "DCiE = 66.67%",
      },
      {
        title: "Compute overhead (non-IT) energy and its annual cost",
        equation: "overhead = total - it          overheadCost = overhead x rate",
        substitution: "1,500,000 - 1,000,000 = 500,000 kWh          500,000 x 0.12",
        result: "overheadEnergyKwh = 500,000 kWh (33.33% of total), overheadAnnualCost = $60,000",
      },
      {
        title: "Classify the PUE against the Green Grid efficiency bands",
        body: "The classification uses a strict less-than comparison at each band boundary: PUE < 1.2 is 'world-class', PUE < 1.5 is 'efficient', PUE < 2.0 is 'moderate', and so on. A PUE of exactly 1.5 does not satisfy 'PUE < 1.5', so it falls through to the next band down.",
        result: "band = 'moderate' (PUE 1.5–2.0) — not 'efficient', even though 1.5 is the number commonly cited as the efficient/moderate dividing line",
      },
    ],
    resultSummary: [
      { check: "PUE", requirement: "n/a (this is the result)", actual: "1.50", pass: true },
      { check: "DCiE", requirement: "n/a (this is the result)", actual: "66.67%", pass: true },
      { check: "Efficiency band classification", requirement: "n/a (informational)", actual: "Moderate (PUE 1.5–2.0)", pass: true },
    ],
    finalAnswer: "This facility's PUE of exactly 1.50 classifies as 'Moderate (PUE 1.5–2.0)' rather than 'Efficient (PUE 1.2–1.5)' — the boundary comparison is strictly less-than, so landing exactly on 1.5 places it in the lower band. The facility spends $60,000 a year on the 500,000 kWh of non-IT overhead energy, 33.33% of its total draw.",
    keyInsight: "Efficiency-band boundaries in any classification scheme need an explicit rule for values that land exactly on the boundary — this calculator treats a PUE of exactly 1.5 as belonging to the band below the 'efficient' threshold, since the 'efficient' band is defined as PUE < 1.5, not PUE ≤ 1.5. A facility this close to a band boundary is a reminder that small operational efficiency gains (a few percent off total facility energy) can be the difference between two full classification bands.",
    faqs: [
      {
        q: "Are the Green Grid PUE bands an official ISO/IEC standard?",
        a: "No — ISO/IEC 30134-2 standardizes the PUE metric itself and its measurement methodology, but the specific efficiency bands (world-class, efficient, moderate, poor, and so on) come from The Green Grid's widely-cited 2007 white paper, an informal industry reference scale rather than a formally mandated classification within the ISO/IEC standard itself.",
      },
      {
        q: "What kinds of measures typically move a data center from 'moderate' toward 'efficient'?",
        a: "Common levers include raising chilled-water or supply-air temperatures to reduce cooling energy, using free/economizer cooling during favorable outdoor conditions, improving UPS and power-distribution efficiency, and better hot-aisle/cold-aisle containment to reduce the fan and cooling energy needed per unit of IT load — all of which reduce the 'overhead' energy in the numerator without touching the IT equipment energy in the denominator.",
      },
    ],
  },

  {
    slug: "life-cycle-cost-standard-vs-premium-efficiency-transformer",
    groupId: "building-services",
    calculatorHref: "/calculators/life-cycle-cost",
    calculatorName: "Life-Cycle Cost (LCC)",
    title: "Worked Example: Standard vs. Premium-Efficiency Equipment Over a 20-Year Discounted Life Cycle",
    dek: "A $18,000 higher upfront cost for premium-efficiency equipment, evaluated against its lower annual operating cost over 20 years at a 6% discount rate — with a clear payback point.",
    standard: "Discounted-cash-flow engineering economics (consistent with IEEE 1013 practice)",
    incidentBased: false,
    readTime: "9 min read",
    scenario: [
      { label: "Option A — Standard efficiency", value: "Initial cost $50,000, annual operating cost $12,000 (3%/yr escalation)" },
      { label: "Option B — Premium efficiency", value: "Initial cost $68,000, annual operating cost $8,500 (3%/yr escalation)" },
      { label: "Discount rate", value: "6% per year" },
      { label: "Analysis period", value: "20 years" },
      { label: "Salvage value (both options)", value: "$0" },
    ],
    steps: [
      {
        title: "Compute the present worth of Option A's escalating operating costs",
        equation: "PW = Σ [annualCost x (1+e)^(t-1)] / (1+r)^t, for t = 1 to 20",
        substitution: "e = 3%, r = 6%, annualCost = $12,000",
        result: "presentWorthOperating(A) = $174,738.39",
      },
      {
        title: "Compute Option A's total life-cycle cost",
        equation: "LCC = initialCost + presentWorthOperating - presentWorthSalvage",
        substitution: "50,000 + 174,738.39 - 0",
        result: "LCC(A) = $224,738.39",
      },
      {
        title: "Repeat for Option B's escalating operating costs and total LCC",
        equation: "PW = Σ [annualCost x (1+e)^(t-1)] / (1+r)^t          LCC = initialCost + PW - salvage",
        substitution: "annualCost = $8,500          68,000 + presentWorthOperating(B)",
        result: "presentWorthOperating(B) = $123,773.03, LCC(B) = $191,773.03",
      },
      {
        title: "Compare the two options' life-cycle cost and find the lower-cost option",
        equation: "savings = LCC(A) - LCC(B)",
        substitution: "224,738.39 - 191,773.03",
        result: "lccSavingsBvsA = $32,965.36 — Option B (premium) has the lower life-cycle cost",
      },
      {
        title: "Compute simple payback on the extra upfront cost",
        equation: "payback = (initialCost_B - initialCost_A) / (annualCost_A - annualCost_B)",
        substitution: "(68,000 - 50,000) / (12,000 - 8,500)",
        result: "simplePaybackYears = 5.14 years",
      },
      {
        title: "Compute each option's Equivalent Annual Cost (EAC) for comparison on an annualized basis",
        equation: "EAC = LCC x CRF, where CRF = r(1+r)^N / ((1+r)^N - 1)",
        result: "EAC(A) = $19,593.72/yr, EAC(B) = $16,719.65/yr — Option B is about $2,874/yr cheaper on an annualized basis too",
      },
    ],
    resultSummary: [
      { check: "Option A life-cycle cost", requirement: "n/a (comparison basis)", actual: "$224,738.39", pass: true },
      { check: "Option B life-cycle cost", requirement: "n/a (comparison basis)", actual: "$191,773.03", pass: true },
      { check: "Lower life-cycle cost option", requirement: "n/a (this is the result)", actual: "Option B (premium efficiency)", pass: true },
      { check: "Simple payback on the extra $18,000 upfront cost", requirement: "n/a (informational)", actual: "5.14 years", pass: true },
    ],
    finalAnswer: "Despite costing $18,000 more upfront, the premium-efficiency option has a $32,965 lower life-cycle cost over 20 years at a 6% discount rate — its extra upfront cost pays back in 5.14 years from the $3,500/year operating-cost saving, and it remains the cheaper option on both total LCC and equivalent-annual-cost bases.",
    keyInsight: "Simple payback period and life-cycle cost can agree (as they do here) or disagree depending on the analysis period and discount rate — payback only asks 'when does the extra cost break even', while LCC captures the entire remaining value of ongoing savings after that break-even point, discounted back to present value. A project could have an attractive payback but a poor LCC if the analysis period is short relative to the payback, so both figures are worth checking rather than relying on payback alone.",
    faqs: [
      {
        q: "Why does the operating cost escalation rate matter separately from the discount rate?",
        a: "The discount rate converts future dollars to present value regardless of what's driving them, while the escalation rate reflects that the operating cost itself is expected to grow year over year (e.g. from rising energy prices) — the calculation nets these two effects against each other every year, which is why a 3% escalation against a 6% discount rate still produces a declining (not flat) contribution to present worth from later years, not a simple 20x multiplication of the annual cost.",
      },
      {
        q: "What does Equivalent Annual Cost (EAC) add that life-cycle cost alone doesn't show?",
        a: "EAC converts a lump-sum life-cycle cost into a level annual figure using the capital recovery factor, which is useful for comparing options with different initial costs and cash-flow timing on a common 'cost per year' basis, or for comparing against an annual budget or lease-equivalent figure — it carries exactly the same ranking information as total LCC (the cheaper LCC option always has the cheaper EAC too) but expressed in a more budget-familiar unit.",
      },
    ],
  },

  {
    slug: "heat-tracing-circuit-sizing-and-a-voltage-drop-trap-on-a-long-run",
    groupId: "building-services",
    calculatorHref: "/calculators/heat-tracing",
    calculatorName: "Heat Tracing Circuit Sizing",
    title: "Worked Example: Pipe Heat-Loss Sizing That Passes — Until a Realistic Cable Resistance Is Added",
    dek: "An 80 m freeze-protection circuit on a 114 mm insulated pipe sizes cleanly for heater output and breaker rating — but adding the heating cable's own resistance reveals a voltage drop that blows past any reasonable limit.",
    standard: "Cylindrical-conduction heat-loss method (IEEE 515 practice)",
    incidentBased: false,
    readTime: "9 min read",
    scenario: [
      { label: "Pipe outer diameter / insulation thickness", value: "114 mm / 50 mm (k=0.04 W/m·K, mineral wool)" },
      { label: "Maintain temperature / minimum ambient", value: "10°C / -10°C" },
      { label: "Design factor", value: "1.3 (IEEE 515 practice margin)" },
      { label: "Selected heater output", value: "20 W/m" },
      { label: "Circuit length / voltage", value: "80 m / 230 V" },
      { label: "Breaker rating", value: "16 A" },
    ],
    steps: [
      {
        title: "Compute steady-state radial conduction heat loss through the insulation",
        equation: "Q(W/m) = 2π x k x ΔT / ln(Douter / Dinner)",
        substitution: "ΔT = 10-(-10) = 20°C          2π x 0.04 x 20 / ln(214mm/114mm)",
        result: "heatLossWPerM = 7.98 W/m",
      },
      {
        title: "Apply the design factor to find the required heater output",
        equation: "requiredWPerM = heatLossWPerM x designFactor",
        substitution: "7.98 x 1.3",
        result: "requiredWPerM = 10.38 W/m — the selected 20 W/m heater comfortably covers this. PASS",
      },
      {
        title: "Size the circuit power and current for the full 80 m run",
        equation: "circuitPowerW = heaterOutputWPerM x length          circuitCurrentA = circuitPowerW / voltage",
        substitution: "20 x 80 = 1600 W          1600 / 230",
        result: "circuitPowerW = 1600 W, circuitCurrentA = 6.96 A",
      },
      {
        title: "Check the breaker rating",
        result: "6.96 A ≤ 16 A breaker rating. PASS",
      },
      {
        title: "Now add the heating cable's own resistance (0.05 Ω/m) and re-check voltage drop",
        body: "The initial pass above skipped the voltage-drop check because no cable resistance was entered — a self-regulating or constant-wattage cable's real resistance per meter is needed to check whether the far end of an 80 m run still receives enough voltage to deliver its rated output.",
        equation: "totalR = resistancePerM x length          Vdrop = current x totalR",
        substitution: "0.05 x 80 = 4 Ω          6.96 x 4",
        result: "voltageDropV = 27.83 V, voltageDropPct = 12.10% of the 230 V supply",
      },
    ],
    resultSummary: [
      { check: "Heater output vs. required W/m", requirement: "heaterOutput ≥ requiredWPerM", actual: "20 W/m ≥ 10.38 W/m", pass: true },
      { check: "Circuit current vs. breaker rating", requirement: "≤ 16 A", actual: "6.96 A", pass: true },
      { check: "Voltage drop (with 0.05 Ω/m cable resistance)", requirement: "typically ≤ 5-10% for heat-tracing circuits", actual: "12.10%", pass: false },
    ],
    finalAnswer: "The heater output and breaker sizing both pass comfortably for this 80 m circuit. But once the heating cable's own 0.05 Ω/m resistance is factored in, the voltage drop reaches 12.10% of the 230 V supply — well beyond typical acceptable limits — meaning the far end of this run would receive significantly reduced voltage and, for a constant-wattage cable, a correspondingly reduced actual heat output right where freeze protection may matter most.",
    keyInsight: "A heat-tracing circuit can pass its power-output sizing and breaker check while still failing on voltage drop, because those are governed by entirely different physics — output sizing depends on the required W/m vs. the heater's rating, while voltage drop depends on cable resistance accumulating over the full run length. Leaving the cable-resistance input at zero silently skips this check altogether, which is exactly why it's worth deliberately entering a manufacturer's real resistance-per-meter figure rather than accepting the default of 0.",
    faqs: [
      {
        q: "What are the typical fixes for a voltage-drop failure like this one?",
        a: "The main levers are shortening the circuit run (splitting one long circuit into two shorter ones fed from separate breakers), increasing the supply voltage to the heat-tracing circuit if the installation allows it, or selecting a heating cable with lower resistance per meter for the same output — splitting into shorter circuits is often the simplest fix since it directly reduces the total resistance the current has to travel through.",
      },
      {
        q: "Does this voltage-drop concern apply the same way to self-regulating heating cables?",
        a: "Self-regulating cables behave somewhat differently from constant-wattage cables because their output already varies with temperature along the cable's length, but they still rely on adequate voltage reaching every point along the circuit to produce their rated output — a large voltage drop reduces the power delivered at the far end of either cable type, so the voltage-drop check remains relevant regardless of which heating cable technology is used, even though the exact resistance-per-meter figure and its behavior differ.",
      },
    ],
  },

  {
    slug: "enclosure-cooling-natural-convection-shortfall-fan-sizing",
    groupId: "building-services",
    calculatorHref: "/calculators/enclosure-cooling",
    calculatorName: "Panel/MCC Enclosure Cooling",
    title: "Worked Example: A 600 W Enclosure Where Natural Convection Alone Isn't Enough",
    dek: "A standard free-standing MCC enclosure with 600 W of internal losses — checked against its own natural-convection dissipating capacity, which turns out to fall well short, forcing a forced-air fan sizing calculation.",
    standard: "IEC 60890-derived enclosure heat-rise method",
    incidentBased: false,
    readTime: "9 min read",
    scenario: [
      { label: "Enclosure dimensions", value: "2000 mm (H) x 800 mm (W) x 600 mm (D), free-standing" },
      { label: "Internal component losses", value: "600 W" },
      { label: "Ambient temperature", value: "35°C" },
      { label: "Maximum allowable internal temperature", value: "45°C" },
      { label: "Natural convection coefficient", value: "5.5 W/(m²·K) — bare/unpainted steel" },
    ],
    steps: [
      {
        title: "Compute the enclosure's effective dissipating surface area",
        body: "A free-standing enclosure counts its top, both sides, front, and back (a wall-mounted enclosure would exclude the back face, which sits against the wall).",
        equation: "Area = top + sides + front + back = (W x D) + 2(H x D) + (H x W) + (H x W)",
        substitution: "(0.8x0.6) + 2(2x0.6) + (2x0.8) + (2x0.8) = 0.48 + 2.4 + 1.6 + 1.6",
        result: "effectiveAreaM2 = 6.08 m²",
      },
      {
        title: "Find the allowable temperature rise above ambient",
        equation: "ΔT = maxInternalTemp - ambientTemp",
        substitution: "45 - 35",
        result: "allowableDeltaT = 10 K",
      },
      {
        title: "Compute how much heat the enclosure can shed by natural convection alone at that ΔT",
        equation: "Qconv = convectionCoeff x Area x ΔT",
        substitution: "5.5 x 6.08 x 10",
        result: "naturalConvectionCapacityW = 334.4 W",
      },
      {
        title: "Compare natural-convection capacity against the actual internal losses",
        result: "334.4 W of natural-convection capacity vs. 600 W of actual internal losses — natural convection alone cannot keep up. FAIL",
      },
      {
        title: "Size the required forced-air fan flow to make up the shortfall",
        equation: "requiredAirflow(m³/h) = 3.1 x Ploss(W) / ΔT(K)",
        substitution: "3.1 x 600 / 10",
        result: "requiredFanAirflowM3h = 186 m³/h",
      },
    ],
    resultSummary: [
      { check: "Natural convection capacity vs. internal losses", requirement: "≥ 600 W", actual: "334.4 W", pass: false },
      { check: "Required forced-air fan flow", requirement: "n/a (this is the corrective sizing result)", actual: "186 m³/h", pass: true },
    ],
    finalAnswer: "This enclosure's natural-convection surface can only shed 334.4 W at its allowable 10 K temperature rise — well short of the 600 W of actual internal losses. Left as-is, the enclosure would run hotter than its 45°C limit. A forced-air fan rated for at least 186 m³/h is required to make up the difference and hold the internal temperature within limits.",
    keyInsight: "Natural-convection cooling capacity scales with surface area and allowable ΔT, while internal losses scale with the equipment actually installed inside — a physically large enclosure doesn't automatically have enough surface area for a densely-packed, high-loss equipment layout. This is a genuinely common design trap: an enclosure sized generously for physical equipment fit can still be thermally undersized for natural convection alone, which is exactly why this check exists as a distinct step from simply confirming the equipment fits inside the box.",
    faqs: [
      {
        q: "Besides adding a forced-air fan, what other options address a natural-convection shortfall?",
        a: "A larger enclosure (more surface area), a painted rather than bare-steel finish (painted steel has a somewhat higher convection coefficient, roughly 6–7 vs. 5.5 W/(m²·K)), relocating or upgrading components to reduce total internal losses, or active air conditioning for enclosures in high-ambient or dust/moisture-sensitive environments where simple filtered forced-air ventilation isn't appropriate — the right choice depends on the ambient environment and how much of a shortfall needs to be covered.",
      },
      {
        q: "Why does a wall-mounted enclosure have less dissipating area than an identical free-standing one?",
        a: "A wall-mounted enclosure's rear face sits directly against the wall it's mounted to, blocking airflow and convective heat transfer from that face entirely — the calculator excludes the back face from the effective area for wall-mounted units, which means a wall-mounted enclosure of identical dimensions has meaningfully less natural-convection capacity than a free-standing one and may need a fan sooner for the same internal losses.",
      },
    ],
  },
];
