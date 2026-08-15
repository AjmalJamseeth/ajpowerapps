// Worked examples for the Backup Power group. Every numeric value was
// produced by running the calculator's own verified engine (battery.ts /
// upssizing.ts / emergencypower.ts / gensetfuel.ts / storage.ts) directly
// with tsx, not hand-typed.

import type { WorkedExample } from "./types";

export const BACKUPPOWER_EXAMPLES: WorkedExample[] = [
  {
    slug: "battery-duty-cycle-sizing-end-of-discharge-voltage-fail",
    groupId: "backup-power",
    calculatorHref: "/calculators/battery-sizing",
    calculatorName: "Battery & DC System Sizing",
    title: "Worked Example: A Duty-Cycle Battery Sizing That Passes Capacity but Fails Its Own Voltage Window",
    dek: "The IEEE 485 section method correctly sizes battery capacity for a four-period duty cycle — but the resulting cell count doesn't actually keep the string above its minimum discharge voltage.",
    standard: "IEEE 485",
    readTime: "11 min read",
    scenario: [
      { label: "Duty cycle", value: "5 A for 15 min, then 35 A for 10 min, then 15 A for 75 min, then 45 A for 10 min" },
      { label: "Correction factors", value: "Temperature 1.0, aging 1.25, design margin 1.1" },
      { label: "System DC voltage", value: "125 V nominal" },
      { label: "Cell voltages", value: "Nominal 2.17 V, equalize 2.33 V, end-of-discharge 1.75 V" },
      { label: "Acceptance window", value: "135–105 V for a 58-cell string" },
    ],
    steps: [
      {
        title: "Compute the required capacity section by section (IEEE 485 method)",
        body: "Each later section's requirement isn't just its own current — it accounts for the capacity already 'used up' by earlier sections, scaled by how the battery's capacity-rating factor (Kt) changes with duration.",
        table: {
          headers: ["Section", "Current", "Cumulative time", "Kt factor", "Required capacity"],
          rows: [
            ["1", "5 A", "15 min", "1.75", "8.75 A"],
            ["2", "35 A", "25 min", "2.15", "75.25 A"],
            ["3", "15 A", "100 min", "4.10", "61.5 A"],
            ["4", "45 A", "110 min", "4.35", "195.75 A"],
          ],
        },
        result: "The governing (largest) requirement is Section 4: 195.75 A",
      },
      {
        title: "Apply temperature, aging and design-margin correction factors",
        equation: "final = maxSectionA x tempCF x agingCF x marginCF",
        substitution: "195.75 x 1.0 x 1.25 x 1.1",
        result: "final = 269.2 Ah required battery capacity",
      },
      {
        title: "Find the number of cells for the 125 V system",
        equation: "nCells = round(systemV / cellVnominal)",
        substitution: "round(125 / 2.17)",
        result: "58 cells",
      },
      {
        title: "Check the string voltage at equalize charge",
        equation: "vEqString = nCells x vEqCell",
        substitution: "58 x 2.33",
        result: "135.14 V — within the 140 V maximum acceptance limit",
      },
      {
        title: "Check the string voltage at end of discharge",
        equation: "vEodString = nCells x vEodCell",
        substitution: "58 x 1.75",
        result: "101.5 V — below the 105 V minimum acceptance limit",
      },
    ],
    resultSummary: [
      { check: "Required battery capacity", requirement: "n/a (this is the sizing result)", actual: "269.2 Ah", pass: true },
      { check: "String voltage at equalize charge", requirement: "≤ 140 V", actual: "135.14 V", pass: true },
      { check: "String voltage at end of discharge", requirement: "≥ 105 V", actual: "101.5 V", pass: false },
    ],
    finalAnswer: "The duty-cycle capacity sizing itself is sound (269.2 Ah), but 58 cells at 1.75 V end-of-discharge only delivers 101.5 V — 3.5 V short of this system's 105 V minimum acceptance window. The cell count needs revisiting, not the capacity.",
    keyInsight: "Battery capacity sizing (how many amp-hours) and cell-count/voltage-window checking (how many cells, and does the string stay in an acceptable voltage range through the full discharge) are two genuinely separate calculations that can each pass or fail independently — a battery with plenty of capacity can still be the wrong string configuration if its end-of-discharge voltage falls outside what the connected DC equipment can tolerate.",
    faqs: [
      {
        q: "What fixes the end-of-discharge voltage shortfall?",
        a: "Adding one more cell (59 instead of 58) raises vEodString to 59 x 1.75 = 103.25 V — still short. The real fix here is usually a battery/cell chemistry with a higher end-of-discharge voltage point, or accepting a load-dependent cutoff earlier in the discharge (raising vEodCell), or revisiting the connected equipment's actual minimum operating voltage, since simply adding cells one at a time doesn't close a 3.5 V gap quickly without also pushing the equalize-charge voltage toward its own 140 V ceiling.",
      },
      {
        q: "Why does the required capacity look at the largest single section instead of summing all four?",
        a: "The section method reflects that later sections have to be supported by whatever capacity remains after earlier sections have already drawn on the battery — so Section 4's 195.75 A requirement already implicitly accounts for the capacity used in Sections 1-3 (that's what the ktPrev/kt ratio term in each section's formula does), rather than needing to be added to them separately. Simply summing all four sections' raw currents would badly oversize the battery.",
      },
    ],
  },

  {
    slug: "ups-sizing-n-plus-1-redundancy-battery-runtime",
    groupId: "backup-power",
    calculatorHref: "/calculators/ups-sizing",
    calculatorName: "UPS Sizing",
    title: "Worked Example: Sizing a Redundant (N+1) UPS System and Its Battery Runtime",
    dek: "A 200 kW critical load, sized to a standard UPS frame with full N+1 redundancy — plus how much battery energy a 15-minute ride-through actually needs.",
    standard: "Standard UPS/battery sizing relations",
    readTime: "9 min read",
    scenario: [
      { label: "Critical load", value: "200 kW at 0.9 power factor" },
      { label: "Design margin", value: "20%" },
      { label: "Redundancy", value: "2 UPS frames, N+1 (either one can carry the full load alone)" },
      { label: "UPS rated output PF", value: "0.9" },
      { label: "Required backup time", value: "15 minutes" },
      { label: "Battery depth of discharge / inverter efficiency", value: "80% / 92%" },
      { label: "DC bus voltage", value: "480 V" },
    ],
    steps: [
      {
        title: "Convert critical load to kVA and apply design margin",
        equation: "designLoadKva = kW / PF          marginedLoad = designLoadKva x (1 + margin%)",
        substitution: "200 / 0.9 = 222.2 kVA;   222.2 x 1.20",
        result: "marginedLoad = 266.7 kVA",
      },
      {
        title: "Find per-unit required capacity for N+1 redundancy",
        body: "With 2 frames installed and N+1 redundancy, either frame alone must carry the full margined load.",
        equation: "perUnitRequired = marginedLoad / (N - 1)",
        substitution: "266.7 / 1",
        result: "perUnitRequired = 266.7 kVA per frame",
      },
      {
        title: "Round up to a standard UPS frame size",
        result: "Recommended = 300 kVA per frame -> 270 kW real-power capability at 0.9 output PF",
      },
      {
        title: "Compute usable battery energy for the required backup time",
        equation: "usableEnergy = loadKw x (backupMinutes / 60)",
        substitution: "200 x (15 / 60)",
        result: "usableEnergy = 50 kWh",
      },
      {
        title: "Convert to nameplate battery energy and approximate Ah",
        equation: "nameplateEnergy = usableEnergy / (DoD x inverterEff)          Ah ≈ (nameplateEnergy x 1000) / DCvoltage",
        substitution: "50 / (0.80 x 0.92) = 67.9 kWh;   67,935 / 480",
        result: "nameplateEnergy = 67.9 kWh, ≈141.5 Ah at 480 V DC",
      },
    ],
    resultSummary: [
      { check: "Recommended UPS frame size", requirement: "n/a (this is the sizing result)", actual: "300 kVA (270 kW) per frame, 2 frames installed", pass: true },
      { check: "Battery nameplate energy", requirement: "n/a (this is the sizing result)", actual: "67.9 kWh (≈141.5 Ah at 480 V)", pass: true },
    ],
    finalAnswer: "Full N+1 redundancy for this 200 kW load requires two 300 kVA UPS frames (600 kVA installed to reliably deliver 266.7 kVA), each backed by roughly 68 kWh of nameplate battery energy to bridge 15 minutes.",
    keyInsight: "Depth of discharge and inverter efficiency both shrink usable energy relative to nameplate battery capacity — a battery can't be discharged to 0% DoD without damage, and DC-to-AC conversion isn't lossless, so the nameplate battery has to be meaningfully larger (67.9 kWh here) than the 50 kWh the load actually needs, purely to account for those two real-world losses.",
    faqs: [
      {
        q: "Why does N+1 redundancy here mean each unit carries the full load, not half?",
        a: "N+1 specifically means N units are needed to carry the load, plus 1 spare — with N=1 required unit and 1 spare (2 total installed), each individual frame has to be sized for the full margined load, since either one must be able to run the entire critical load alone if the other fails or is taken down for maintenance. This is the same underlying principle as the N-1 redundancy convention used in the Transformer Sizer calculator, just phrased from the opposite direction (N+1 installed vs. N-1 surviving).",
      },
      {
        q: "Is this battery estimate as rigorous as the dedicated Battery & DC System Sizing calculator?",
        a: "No — this is explicitly a quick sizing estimate (usable energy = load x time, then correcting for DoD and efficiency), not a full IEEE 485 duty-cycle section-by-section design. For a final battery specification, especially one with a varying load profile rather than one constant load for the whole backup period, the dedicated Battery & DC System Sizing calculator's full method should be used instead.",
      },
    ],
  },

  {
    slug: "emergency-power-genset-ups-bridge-timing-nfpa110",
    groupId: "backup-power",
    calculatorHref: "/calculators/emergency-power",
    calculatorName: "Emergency Power (Genset+UPS)",
    title: "Worked Example: When the Generator Alone Doesn't Meet Its Own Type Rating — and the UPS Saves It",
    dek: "This NFPA 110 Type 10 system's generator actually takes 11.8 seconds to be ready — 1.8 seconds over its own Type 10 target — but the UPS bridge easily covers the gap.",
    standard: "NFPA 110",
    readTime: "10 min read",
    scenario: [
      { label: "Target maximum interruption", value: "10 seconds (defines NFPA Type 10)" },
      { label: "Minimum runtime requirement", value: "48 hours (defines NFPA Class 48)" },
      { label: "ATS start delay", value: "1.5 s" },
      { label: "Genset crank-to-rated time", value: "10 s" },
      { label: "ATS transfer time", value: "0.3 s" },
      { label: "UPS autonomy (battery ride-through)", value: "30 s" },
      { label: "Generator rated output", value: "500 kW" },
      { label: "Load steps", value: "50 kW emergency @5s, 80 kW legally-required @10s, 150 kW optional @15s" },
    ],
    steps: [
      {
        title: "Classify the system under NFPA 110",
        result: "Type 10 (≤10 s target interruption), Class 48 (≥48 h minimum runtime) — based on the stated design targets",
      },
      {
        title: "Compute how long the generator actually takes to be ready",
        equation: "gensetReadyS = ATS start delay + crank-to-rated time + ATS transfer time",
        substitution: "1.5 + 10 + 0.3",
        result: "gensetReadyS = 11.8 s",
      },
      {
        title: "Compare the actual genset-ready time against the Type 10 target",
        equation: "gensetReadyS ≤ maxInterruptS?",
        substitution: "11.8 s ≤ 10 s?",
        result: "No — the generator alone takes 1.8 s longer than its own Type 10 target allows",
      },
      {
        title: "Check whether the UPS bridge covers the gap with margin",
        body: "The bridge check requires the UPS autonomy to exceed the genset-ready time by a 25% safety margin, not just barely cover it.",
        equation: "requiredMargin = gensetReadyS x 1.25          UPS autonomy ≥ requiredMargin?",
        substitution: "11.8 x 1.25 = 14.75 s;   30 s ≥ 14.75 s?",
        result: "Yes — bridge status = PASS, with substantial margin",
      },
      {
        title: "Check the staged load pickup sequence against generator capacity and priority order",
        table: {
          headers: ["Time", "Load step", "Priority", "Cumulative", "% of rated"],
          rows: [
            ["5 s", "+50 kW Life-Safety Lighting", "Emergency", "50.0 kW", "10%"],
            ["10 s", "+80 kW Load 2", "Legally-Required", "130.0 kW", "26%"],
            ["15 s", "+150 kW Load 3", "Optional", "280.0 kW", "56%"],
          ],
        },
        result: "No warnings — priority order is correct (emergency first) and cumulative load stays well under the 500 kW generator rating at every step",
      },
    ],
    resultSummary: [
      { check: "Generator alone meets Type 10 target", requirement: "gensetReadyS ≤ 10 s", actual: "11.8 s", pass: false },
      { check: "UPS bridge covers the gap with 25% margin", requirement: "UPS autonomy ≥ 14.75 s", actual: "30 s", pass: true },
      { check: "Staged load pickup sequence", requirement: "Priority order correct, no overload", actual: "No warnings", pass: true },
    ],
    finalAnswer: "The generator alone doesn't technically meet the system's own Type 10 (≤10 s) target — it needs 11.8 s. This is exactly why the UPS bridge exists: its 30 s autonomy comfortably covers the gap with better than the required 25% margin, and the staged load pickup plan is correctly sequenced and within generator capacity throughout.",
    keyInsight: "A generator's crank-to-rated time is a real physical characteristic of the machine, not something a specification can simply overrule — when an NFPA Type rating demands a faster restoration time than the generator alone can deliver, a UPS bridge (or a faster-starting generator) is a genuine engineering necessity, not a redundant nice-to-have. This calculator's separate 'genset alone vs. Type target' and 'does the UPS bridge cover the gap' checks are what surface a mismatch like this before it becomes a real-world life-safety gap.",
    faqs: [
      {
        q: "Why does the bridge check require 25% margin instead of just matching the genset-ready time exactly?",
        a: "Real generator starting times vary run to run (battery condition, ambient temperature, fuel system priming, and simple mechanical variability all affect actual crank time), so a bridge system sized with zero margin against a single nominal genset-ready time could fail on a day when the generator happens to start slightly slower than usual — the 25% margin exists specifically to absorb that real-world variability.",
      },
      {
        q: "What would happen if the load steps were sequenced out of priority order?",
        a: "NFPA 110 Chapter 6.3 requires higher-priority loads (Emergency, NEC 700) to be restored before lower-priority loads (Legally-Required Standby, then Optional Standby) — the calculator specifically flags a warning if a lower-priority step is scheduled to pick up before a higher-priority one, since that would mean life-safety loads are waiting behind less critical loads for power restoration, which is a genuine code violation, not just a scheduling inefficiency.",
      },
    ],
  },

  {
    slug: "genset-fuel-runtime-tank-sizing",
    groupId: "backup-power",
    calculatorHref: "/calculators/genset-fuel",
    calculatorName: "Genset Fuel Consumption & Running Cost",
    title: "Worked Example: Runtime and Hourly Cost from a Genset's Own Fuel Consumption Rate",
    dek: "A straightforward but essential check — how long a 500 L tank actually keeps a generator running, and what that costs per hour.",
    standard: "User-supplied genset fuel consumption rate",
    readTime: "6 min read",
    scenario: [
      { label: "Fuel tank capacity", value: "500 L" },
      { label: "Fuel consumption basis", value: "Per-hour rate (already reflects the expected load point)" },
      { label: "Consumption rate", value: "45 L/hr" },
      { label: "Fuel price", value: "$1.20/L" },
    ],
    steps: [
      {
        title: "Confirm the consumption rate basis",
        result: "Consumption = 45 L/hr (taken directly from the genset's own datasheet at this load point, not derived from a generic assumption)",
      },
      {
        title: "Compute runtime from tank capacity",
        equation: "runtimeHours = tankLiters / consumptionRate",
        substitution: "500 / 45",
        result: "runtimeHours = 11.11 hours",
      },
      {
        title: "Compute hourly running cost",
        equation: "costPerHour = consumptionRate x fuelPrice",
        substitution: "45 x 1.20",
        result: "costPerHour = $54.00/hr",
      },
    ],
    resultSummary: [
      { check: "Runtime on a full 500 L tank", requirement: "n/a (this is the computed result)", actual: "11.11 hours", pass: true },
      { check: "Hourly fuel cost", requirement: "n/a (this is the computed result)", actual: "$54.00/hr", pass: true },
    ],
    finalAnswer: "A full 500 L tank keeps this generator running for 11.11 hours at 45 L/hr, at an hourly fuel cost of $54.00 — useful both for refueling logistics planning and for comparing against a site's minimum runtime requirement (like the Class 48 h target in the Emergency Power worked example).",
    keyInsight: "Fuel consumption rate is deliberately never a built-in constant in this calculator — it varies significantly by genset model, engine size, and load level, so using a generic assumed rate instead of the specific unit's own datasheet figure (or better, a measured value from the actual installation) could meaningfully misstate runtime, which matters directly for life-safety minimum-runtime compliance.",
    faqs: [
      {
        q: "What if fuel consumption is only known per kWh rather than per hour?",
        a: "The calculator also accepts a per-kWh basis, in which case the consumption rate is multiplied by the actual load in kW to get an hourly rate — this matters because a genset's L/kWh efficiency typically varies with load level (often worse at very light or very heavy loads than at its optimal mid-range point), so the per-kWh figure used should match the actual expected operating load, not just an arbitrary reference point.",
      },
      {
        q: "How does this connect to the NFPA runtime Class requirement?",
        a: "A facility with an NFPA Class 48 requirement (48-hour minimum runtime) needs either a large enough tank to run 48 hours without refueling, or a documented, reliable refueling plan (fuel supply contract, on-site bulk storage) that can sustain the generator beyond what the day tank alone provides — this runtime calculation is exactly the check that reveals whether the installed tank size alone is sufficient or whether a refueling plan is required.",
      },
    ],
  },

  {
    slug: "bess-sizing-2-hour-backup-cable-sizing",
    groupId: "backup-power",
    calculatorHref: "/calculators/energy-storage",
    calculatorName: "Energy Storage (BESS)",
    title: "Worked Example: Sizing a Li-ion BESS for 2 Hours of Backup, Including Its AC Output Cable",
    dek: "A 100 kW, 2-hour backup requirement sized up to nameplate battery energy, checked against C-rate and PCS voltage window, and carried through to an actual AC cable size.",
    standard: "IEEE 1547 / IEC 62933",
    readTime: "10 min read",
    scenario: [
      { label: "Chemistry", value: "Lithium-ion (90% DoD, 92% round-trip efficiency)" },
      { label: "Load power / backup duration", value: "100 kW for 2 hours" },
      { label: "C-rate", value: "0.5 C" },
      { label: "Nominal DC voltage / PCS window", value: "700 V nominal, 600–850 V PCS operating range" },
      { label: "PCS rated AC power", value: "100 kW, 400 V three-phase" },
      { label: "AC cable", value: "Copper, Method C, 20 m run, 30°C ambient" },
    ],
    steps: [
      {
        title: "Compute usable energy required",
        equation: "usableEnergy = loadKw x backupHours",
        substitution: "100 x 2",
        result: "usableEnergy = 200 kWh",
      },
      {
        title: "Convert to nameplate battery energy",
        equation: "nameplate = usableEnergy / (DoD x roundTripEfficiency)",
        substitution: "200 / (0.90 x 0.92)",
        result: "nameplate = 241.5 kWh",
      },
      {
        title: "Check the C-rate delivers enough power",
        equation: "maxPower = cRate x nameplateKwh",
        substitution: "0.5 x 241.5",
        result: "maxPower = 120.8 kW ≥ 100 kW load — passes",
      },
      {
        title: "Check the DC voltage falls inside the PCS operating window",
        equation: "pcsMin ≤ nominalVoltage ≤ pcsMax?",
        substitution: "600 ≤ 700 ≤ 850",
        result: "Passes",
      },
      {
        title: "Size the AC output cable",
        equation: "acCurrent = (PCS_kW x 1000) / (√3 x V);   designCurrent = acCurrent x 1.25",
        substitution: "(100,000) / (1.732 x 400) = 144.3 A;   144.3 x 1.25 = 180.4 A",
        result: "70 mm² Cu, Method C -> 229 A ampacity, 0.98% voltage drop — both pass",
      },
    ],
    resultSummary: [
      { check: "C-rate delivers enough power for the load", requirement: "maxPower ≥ 100 kW", actual: "120.8 kW", pass: true },
      { check: "Nominal DC voltage within PCS window", requirement: "600–850 V", actual: "700 V", pass: true },
      { check: "AC output cable ampacity", requirement: "≥ 180.4 A", actual: "229 A (70 mm² Cu)", pass: true },
      { check: "AC output cable voltage drop", requirement: "≤ 3%", actual: "0.98%", pass: true },
    ],
    finalAnswer: "This BESS needs 241.5 kWh of nameplate battery energy to deliver 100 kW for 2 hours, comfortably clears its own C-rate and PCS voltage-window checks, and connects to the grid through a 70 mm² copper AC cable with plenty of ampacity and voltage-drop margin.",
    keyInsight: "The gap between usable energy (200 kWh) and nameplate energy (241.5 kWh) — a 20.75% uplift — comes entirely from depth of discharge and round-trip efficiency, both genuine physical characteristics of the battery chemistry, not safety margin in the traditional sense. A lead-acid system with this app's default 50% DoD and 85% efficiency would need a dramatically larger nameplate rating (about 470 kWh) for the identical 200 kWh usable requirement, which is a big part of why lithium-ion has become the default choice for space- and weight-constrained BESS applications.",
    faqs: [
      {
        q: "Why does the AC cable get sized off 125% of rated current rather than the actual PCS current?",
        a: "This mirrors the same NEC-style continuous-load convention used throughout this suite's cable-sizing calculators — a source that can run continuously at its full rated output (like a PCS/inverter operating for the full backup duration) is treated the same way a continuous load is, with a 125% factor applied before selecting cable ampacity, to build in margin for genuinely continuous full-power operation rather than a brief peak.",
      },
      {
        q: "What determines whether C-rate or PCS AC power is the tighter constraint?",
        a: "In this example, the battery's C-rate-limited power (120.8 kW) comfortably exceeds both the 100 kW load and the 100 kW PCS rating, so neither the battery nor the inverter is the bottleneck — but for a system with a much lower C-rate (energy-optimized rather than power-optimized battery chemistry) or a smaller PCS relative to nameplate energy, either check could become the actual limiting factor, which is exactly why both are verified independently rather than assuming one implies the other.",
      },
    ],
  },
];
