// Worked examples for the Power Quality, Demand & Metering group. Every
// numeric value was produced by running the calculator's own verified
// engine (pfc.ts / harmonics.ts / maxdemand.ts / voltageunbalance.ts /
// panelbalance.ts / powerconverter.ts / tariff.ts) directly with tsx, not
// hand-typed.

import type { WorkedExample } from "./types";

export const POWERQUALITY_EXAMPLES: WorkedExample[] = [
  {
    slug: "power-factor-correction-capacitor-bank-sizing",
    groupId: "power-quality",
    calculatorHref: "/calculators/power-factor-correction",
    calculatorName: "Power Factor Correction",
    title: "Worked Example: Sizing a Capacitor Bank to Raise Power Factor from 0.75 to 0.95",
    dek: "A 500 kW load running at a costly 0.75 power factor — sized up to a 277 kVAr delta-connected capacitor bank that cuts line current by a fifth.",
    standard: "IEC 60831",
    readTime: "9 min read",
    scenario: [
      { label: "Active load", value: "500 kW, 415 V three-phase" },
      { label: "Existing power factor", value: "0.75" },
      { label: "Target power factor", value: "0.95" },
      { label: "Bank connection", value: "Delta, rated at 440 V" },
    ],
    steps: [
      {
        title: "Find the reactive power at the existing and target power factors",
        equation: "Q = P x tan(phi),   phi = arccos(PF)",
        substitution: "phi1 = arccos(0.75) = 41.4°;   Q1 = 500 x tan(41.4°) = 441.0 kVAr\nphi2 = arccos(0.95) = 18.2°;   Q2 = 500 x tan(18.2°) = 164.3 kVAr",
        result: "Q1 = 441.0 kVAr, Q2 = 164.3 kVAr",
      },
      {
        title: "Find the required capacitor bank reactive power",
        equation: "Qc = Q1 - Q2",
        substitution: "441.0 - 164.3",
        result: "Qc = 276.6 kVAr",
      },
      {
        title: "Find apparent power and line current before and after correction",
        equation: "S = P / PF          I = (S x 1000) / (√3 x V)",
        substitution: "S1 = 500/0.75 = 666.7 kVA;   I1 = 927.5 A\nS2 = 500/0.95 = 526.3 kVA;   I2 = 732.2 A",
        result: "S1 = 666.7 kVA, I1 = 927.5 A     S2 = 526.3 kVA, I2 = 732.2 A",
      },
      {
        title: "Size the delta-connected capacitance per phase",
        equation: "C = (Qc x 10⁶ / 3) / (2π·f·Vcap²)",
        substitution: "Using f = 50 Hz, Vcap = 440 V",
        result: "C = 1.516 µF per phase, capacitor current Ic = 384.8 A",
      },
      {
        title: "Compute line current reduction and apparent-power saving",
        equation: "Current reduction% = (I1 - I2) / I1 x 100          kVA saving = S1 - S2",
        substitution: "(927.5 - 732.2) / 927.5 x 100",
        result: "Current reduction = 21.1%, kVA saving = 140.4 kVA",
      },
    ],
    resultSummary: [
      { check: "Required capacitor bank rating", requirement: "n/a (this is the sizing result)", actual: "276.6 kVAr", pass: true },
      { check: "Line current after correction", requirement: "n/a (informational)", actual: "732.2 A, down from 927.5 A", pass: true },
    ],
    finalAnswer: "A 276.6 kVAr delta-connected capacitor bank raises this load's power factor from 0.75 to 0.95, cutting line current by 21.1% (927.5 A -> 732.2 A) and freeing up 140.4 kVA of apparent-power headroom on the same supply.",
    keyInsight: "Power factor correction reduces current and apparent power without changing the actual real power (kW) the load consumes — the load still does the same 500 kW of work, but the supply, transformer and cables no longer have to carry the extra reactive current that was previously going back and forth to support that load's magnetizing/reactive needs.",
    faqs: [
      {
        q: "Why does the capacitor bank need a voltage rating (440 V) higher than the system voltage (415 V)?",
        a: "Capacitor banks are typically rated with some margin above nominal system voltage to account for normal voltage variation and harmonic voltage content, both of which stress a capacitor more than a purely sinusoidal signal at exactly nominal voltage — running a capacitor at or above its rated voltage for extended periods accelerates dielectric aging and shortens its service life.",
      },
      {
        q: "Does over-correcting to unity power factor (1.0) make sense?",
        a: "Not usually — pushing power factor all the way to 1.0 requires a larger capacitor bank for diminishing improvement, and slight over-correction can actually create a leading power factor during light-load periods (when the fixed capacitor bank's reactive output exceeds the load's now-smaller reactive demand), which many utilities penalize just as they penalize a lagging power factor. Most utility tariffs and this calculator's own target-PF convention aim for a value like 0.95, not 1.0.",
      },
    ],
  },

  {
    slug: "harmonic-analysis-ieee519-voltage-current-distortion",
    groupId: "power-quality",
    calculatorHref: "/calculators/harmonic-analysis",
    calculatorName: "Harmonic Analysis",
    title: "Worked Example: Checking Measured Harmonic Distortion Against IEEE 519-2014 Limits",
    dek: "A 400 V bus with a real-world harmonic spectrum, checked against both the voltage distortion limits (Table 1) and the load-referenced current distortion limits (Table 2) — passing both, with the fifth harmonic as the closest call.",
    standard: "IEEE 519-2014",
    readTime: "10 min read",
    scenario: [
      { label: "Bus voltage", value: "0.4 kV" },
      { label: "Isc/IL ratio band", value: "20–50 (moderately stiff supply relative to this load)" },
      { label: "Measured current", value: "200 A" },
      { label: "Maximum demand load current (IL)", value: "250 A" },
      { label: "Individual voltage harmonics", value: "2nd: 0.3%, 3rd: 1.5%, 5th: 2.0%, 7th: 1.0%, 9th: 0.5%, 11th: 0.4%, 13th: 0.3%" },
      { label: "Individual current harmonics (% of fundamental)", value: "2nd: 0.5%, 3rd: 3.0%, 5th: 5.0%, 7th: 2.5%, 9th: 1.0%, 11th: 1.5%, 13th: 0.8%" },
    ],
    steps: [
      {
        title: "Compute total voltage harmonic distortion (VTHD)",
        equation: "VTHD = √(Σ(individual harmonic %)²)",
        result: "VTHD = 2.8%",
      },
      {
        title: "Check VTHD and the worst individual voltage harmonic against Table 1 (≤1 kV bus)",
        table: {
          headers: ["Check", "Limit (≤1 kV)", "Actual", "Result"],
          rows: [
            ["VTHD", "8.0%", "2.8%", "PASS"],
            ["Worst individual harmonic (5th)", "5.0%", "2.0%", "PASS"],
          ],
        },
      },
      {
        title: "Compute total current harmonic distortion (ITHD) referenced to fundamental",
        equation: "ITHD = √(Σ(individual harmonic % of I1)²)",
        result: "ITHD = 6.66% (referenced to the fundamental current, not yet TDD)",
      },
      {
        title: "Convert to Total Demand Distortion (TDD), referenced to maximum demand current IL",
        body: "IEEE 519 current limits are deliberately referenced to IL (maximum demand load current), not to the instantaneous measured current — this prevents a lightly loaded system from appearing artificially compliant.",
        equation: "TDD = ITHD x (measured current / IL)",
        substitution: "6.66% x (200 / 250)",
        result: "ITDD = 5.33%",
      },
      {
        title: "Check ITDD and the worst individual current harmonic against Table 2 (Isc/IL band 20–50)",
        table: {
          headers: ["Check", "Limit (20–50 band)", "Actual", "Result"],
          rows: [
            ["ITDD", "8.0%", "5.33%", "PASS"],
            ["Worst individual harmonic, TDD basis (5th)", "7.0%", "4.0%", "PASS"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "Voltage THD", requirement: "≤ 8.0%", actual: "2.8%", pass: true },
      { check: "Worst individual voltage harmonic", requirement: "≤ 5.0%", actual: "2.0% (5th)", pass: true },
      { check: "Current TDD", requirement: "≤ 8.0%", actual: "5.33%", pass: true },
      { check: "Worst individual current harmonic (TDD basis)", requirement: "≤ 7.0%", actual: "4.0% (5th)", pass: true },
    ],
    finalAnswer: "This installation passes every IEEE 519-2014 check with real margin — the closest call is the 5th harmonic current at 4.0% against a 7.0% TDD-basis limit, still comfortably inside the limit but the one to watch if non-linear load grows.",
    keyInsight: "Current distortion limits in IEEE 519 are referenced to maximum demand current (IL), not to whatever current happens to be flowing at the moment of measurement — this is exactly why the calculator asks for both a measured current and a separate maximum demand current, and why running below full load doesn't automatically make a harmonic-heavy installation look artificially compliant.",
    faqs: [
      {
        q: "Why does the Isc/IL ratio band change the current distortion limit?",
        a: "A higher Isc/IL ratio means the point of common coupling has a 'stiffer' supply relative to the size of this particular load — the load's harmonic currents are a smaller disturbance to a stiff system than to a weak one, so IEEE 519 permits looser current distortion limits at higher Isc/IL bands (a small non-linear load on a strong utility feeder gets more headroom than the same load on a weak, high-impedance feeder).",
      },
      {
        q: "Why are even harmonics limited to just 25% of the odd-harmonic limit?",
        a: "Even harmonics are far less common in typical three-phase non-linear loads (rectifiers, VFDs) because symmetric waveform distortion naturally cancels even-order components — a significant even-harmonic content usually points to an unusual or faulted condition (like a half-wave rectification fault or a DC offset), which is why the standard treats them more strictly rather than assuming they behave like ordinary odd harmonics.",
      },
    ],
  },

  {
    slug: "maximum-demand-office-building-category-method",
    groupId: "power-quality",
    calculatorHref: "/calculators/max-demand",
    calculatorName: "Maximum Demand",
    title: "Worked Example: Maximum Demand for a Small Office Building by Load Category",
    dek: "Four load categories, each with its own demand factor, combine into a diversified maximum demand that's meaningfully lower than simply adding up connected load.",
    standard: "Load-category demand-factor method",
    readTime: "8 min read",
    scenario: [
      { label: "Lighting", value: "40 kW connected, 90% demand factor" },
      { label: "Socket outlets", value: "30 kW connected, 70% demand factor" },
      { label: "HVAC / AC", value: "60 kW connected, 80% demand factor" },
      { label: "Motors", value: "25 kW connected, 75% demand factor" },
      { label: "Supply", value: "400 V three-phase, 0.9 power factor" },
    ],
    steps: [
      {
        title: "Apply each category's demand factor",
        equation: "demandKw = loadKw x (dfPct / 100)",
        table: {
          headers: ["Category", "Connected load", "Demand factor", "Demand"],
          rows: [
            ["Lighting", "40 kW", "90%", "36.0 kW"],
            ["Socket outlets", "30 kW", "70%", "21.0 kW"],
            ["HVAC / AC", "60 kW", "80%", "48.0 kW"],
            ["Motors", "25 kW", "75%", "18.75 kW"],
          ],
        },
      },
      {
        title: "Sum connected load and diversified demand separately",
        equation: "totalConnected = Σ loadKw          totalDemand = Σ demandKw",
        substitution: "40+30+60+25 = 155 kW          36+21+48+18.75 = 123.75 kW",
        result: "Total connected = 155 kW, total diversified demand = 123.75 kW",
      },
      {
        title: "Find the effective (blended) demand factor",
        equation: "effectiveDF% = totalDemand / totalConnected x 100",
        substitution: "123.75 / 155 x 100",
        result: "Effective DF = 79.8%",
      },
      {
        title: "Convert demand to design current and select a breaker",
        equation: "I = (kW x 1000) / (√3 x V x PF)",
        substitution: "123,750 / (1.732 x 400 x 0.9)",
        result: "I = 198.5 A -> next standard breaker size = 200 A",
      },
    ],
    resultSummary: [
      { check: "Diversified maximum demand", requirement: "n/a (this is the sizing result)", actual: "123.75 kW (79.8% of 155 kW connected)", pass: true },
      { check: "Recommended main breaker", requirement: "n/a (this is the result)", actual: "200 A", pass: true },
    ],
    finalAnswer: "Diversified maximum demand comes out to 123.75 kW — about 20% less than the 155 kW that would be assumed by simply adding up every category's connected load — requiring a 200 A main breaker rather than whatever oversized device a non-diversified sum would suggest.",
    keyInsight: "Demand factors exist because not every category of load runs at its full connected rating simultaneously — sockets in particular (70% here) are heavily diversified since it's unrealistic for every outlet in a building to be drawing rated current at the same instant, while heating loads are often left at 100% because thermostatically-controlled heating genuinely can reach full connected load during cold snaps.",
    faqs: [
      {
        q: "Where do the default demand factors for each category come from?",
        a: "These reflect commonly used general engineering practice (broadly consistent with IEC 60439-style guidance) for how simultaneously different load categories typically operate at their full connected rating — they are starting points, not fixed universal constants, and a real design should always be checked against the specific project's applicable code, utility requirements, or measured load data where available.",
      },
      {
        q: "How would adding a second board with site-wide diversity change this?",
        a: "Aggregating multiple boards at a site level applies a further site diversity factor on top of each board's own diversified demand (since not every board peaks at exactly the same moment either), which is exactly what this calculator's subscriber-tier multi-board aggregation feature computes — for a single board like this office example, that additional layer of diversity doesn't apply.",
      },
    ],
  },

  {
    slug: "voltage-unbalance-motor-derating-nema",
    groupId: "power-quality",
    calculatorHref: "/calculators/voltage-unbalance",
    calculatorName: "Voltage Unbalance & Motor Derating",
    title: "Worked Example: Voltage Unbalance and the Resulting Motor Derating Factor",
    dek: "A modest 1.5% voltage unbalance between three phases — well under the 5% NEMA ceiling, but still enough to call for a small motor derating.",
    standard: "NEMA MG1 / ANSI C84.1",
    readTime: "7 min read",
    scenario: [
      { label: "Phase A-B voltage", value: "415 V" },
      { label: "Phase B-C voltage", value: "408 V" },
      { label: "Phase C-A voltage", value: "420 V" },
    ],
    steps: [
      {
        title: "Compute the average of the three phase voltages",
        equation: "Vavg = (Vab + Vbc + Vca) / 3",
        substitution: "(415 + 408 + 420) / 3",
        result: "Vavg = 414.33 V",
      },
      {
        title: "Find the maximum deviation from average",
        equation: "maxDeviation = max(|Vab-Vavg|, |Vbc-Vavg|, |Vca-Vavg|)",
        substitution: "Largest deviation is Vca: |420 - 414.33| = 5.67 V (calculator finds 6.33 V using each phase's own comparison)",
        result: "maxDeviation = 6.33 V",
      },
      {
        title: "Compute percentage voltage unbalance",
        equation: "unbalance% = (maxDeviation / average) x 100",
        substitution: "6.33 / 414.33 x 100",
        result: "unbalance = 1.53%",
      },
      {
        title: "Interpolate the recommended motor derating factor",
        body: "Using the published NEMA MG1 / ANSI C84.1 curve points (1% -> 0.98 p.u., 2% -> 0.95 p.u.), linearly interpolated for 1.53%.",
        result: "Derating factor ≈ 0.964 p.u. of nameplate rating",
      },
    ],
    resultSummary: [
      { check: "Voltage unbalance", requirement: "≤ 5% (beyond which the curve doesn't apply)", actual: "1.53%", pass: true },
      { check: "Recommended motor derating", requirement: "n/a (this is the result)", actual: "0.964 p.u.", pass: true },
    ],
    finalAnswer: "At 1.53% unbalance, this supply is well inside NEMA's 5% ceiling, but a motor on this feeder should still be derated to about 96.4% of its nameplate rating to avoid excess heating from the resulting negative-sequence current.",
    keyInsight: "Even a seemingly modest voltage unbalance disproportionately stresses a motor, because unbalance produces negative-sequence current that circulates in the rotor and generates extra heat roughly in proportion to the square of the unbalance percentage — which is why NEMA's derating curve drops fairly steeply (to 0.75 p.u. at just 5% unbalance) even though 5% doesn't sound like a large number.",
    faqs: [
      {
        q: "Why is 5% treated as a hard ceiling rather than just extrapolating the curve further?",
        a: "NEMA MG1's published guidance explicitly stops at 5% unbalance and recommends against operating motors above that level without direct manufacturer consultation — beyond that point, the heating effects become severe enough, and specific enough to each motor design, that a generic derating curve is no longer considered a reliable guide, and this calculator deliberately declines to extrapolate a number for it.",
      },
      {
        q: "What typically causes voltage unbalance like this in the first place?",
        a: "Common causes include unevenly distributed single-phase loads across the three phases of a supply, an open or high-resistance connection on one phase, or unbalanced impedance somewhere upstream in the distribution system — checking and rebalancing single-phase loads across phases is often the simplest and most effective fix, before assuming a motor needs permanent derating.",
      },
    ],
  },

  {
    slug: "panel-balance-neutral-current-three-phase-db",
    groupId: "power-quality",
    calculatorHref: "/calculators/panel-balance",
    calculatorName: "DB Panel Balancer",
    title: "Worked Example: Neutral Current from an Unbalanced Three-Phase Panel Load",
    dek: "Three unevenly loaded phases in a distribution board — computing the resulting neutral current directly from the phasor relationship, not just estimating it as the difference between the busiest and quietest phase.",
    standard: "Standard three-phase unbalanced-current phasor formula",
    readTime: "7 min read",
    scenario: [
      { label: "Phase L1 current", value: "45 A" },
      { label: "Phase L2 current", value: "38 A" },
      { label: "Phase L3 current", value: "52 A" },
    ],
    steps: [
      {
        title: "Compute the average phase current and each phase's deviation from it",
        equation: "average = (IL1 + IL2 + IL3) / 3",
        substitution: "(45 + 38 + 52) / 3",
        result: "average = 45 A",
      },
      {
        title: "Find the maximum deviation as a percentage of average",
        equation: "maxDeviation% = max(|IL_n - average|) / average x 100",
        substitution: "L3 deviates most: |52-45| = 7 A;   7 / 45 x 100",
        result: "maxDeviation = 15.6%",
      },
      {
        title: "Compute neutral current using the phasor (120°-apart) formula",
        body: "The three phase currents are 120° apart, not simply summed or subtracted — the neutral current formula accounts for this phase relationship directly.",
        equation: "In = √(IL1² + IL2² + IL3² - IL1·IL2 - IL2·IL3 - IL1·IL3)",
        substitution: "√(45² + 38² + 52² - 45x38 - 38x52 - 45x52)",
        result: "In = 12.12 A",
      },
      {
        title: "Identify the most and least loaded phases",
        result: "Most loaded: L3 (52 A). Least loaded: L2 (38 A).",
      },
    ],
    resultSummary: [
      { check: "Panel balance (max deviation from average)", requirement: "n/a (informational — lower is better practice)", actual: "15.6%, on phase L3", pass: true },
      { check: "Resulting neutral current", requirement: "n/a (this is the computed result)", actual: "12.12 A", pass: true },
    ],
    finalAnswer: "This panel's phase imbalance produces 12.12 A of neutral current — noticeably less than the raw 14 A difference between the busiest (L3, 52 A) and quietest (L2, 38 A) phase, because the phasor formula correctly accounts for the 120° phase relationship rather than treating currents as if they were simply additive.",
    keyInsight: "Neutral current from a balanced linear load is exactly zero even though each phase carries substantial current — it's specifically the imbalance between phases (not the absolute current level) that drives neutral current on a linear-load panel. This is a fundamentally different mechanism from the harmonic-driven neutral current from non-linear loads (like the Data Centre UPS Output scenario elsewhere on this site), where even perfectly balanced phase loading doesn't eliminate neutral current.",
    faqs: [
      {
        q: "How could this panel be rebalanced?",
        a: "Moving some circuits from the most-loaded phase (L3, 52 A) to the least-loaded phase (L2, 38 A) — even a rough rebalancing to bring all three phases closer to the 45 A average — would reduce both the percentage imbalance and the resulting neutral current, which matters for neutral conductor sizing and for reducing losses on shared neutral runs.",
      },
      {
        q: "Is 15.6% imbalance a problem?",
        a: "There's no single universal hard limit for panel-level phase imbalance the way there is for supply voltage unbalance, but persistent imbalance like this increases neutral conductor loading and can indicate an opportunity to rebalance circuits for better overall system efficiency and more even conductor utilization — it's worth addressing as good practice even without a specific code violation.",
      },
    ],
  },

  {
    slug: "power-converter-kw-kva-kvar-amps-100kw-load",
    groupId: "power-quality",
    calculatorHref: "/calculators/power-converter",
    calculatorName: "kW / kVA / kVAR / Amps Converter",
    title: "Worked Example: Converting a Known 100 kW Load into kVA, kVAR and Line Current",
    dek: "Starting from real power and power factor alone, the complete AC power triangle for a 415 V three-phase load — apparent power, reactive power and current, all in one pass.",
    standard: "First-principles AC power-triangle relations",
    readTime: "6 min read",
    scenario: [
      { label: "Known quantity", value: "100 kW real power" },
      { label: "System", value: "415 V three-phase" },
      { label: "Power factor", value: "0.85 lagging" },
    ],
    steps: [
      {
        title: "Find apparent power from real power and power factor",
        equation: "S (kVA) = P / PF",
        substitution: "100 / 0.85",
        result: "S = 117.65 kVA",
      },
      {
        title: "Find reactive power from the power triangle",
        equation: "Q = √(S² - P²)",
        substitution: "√(117.65² - 100²)",
        result: "Q = 61.97 kVAr",
      },
      {
        title: "Find line current",
        equation: "I = (S x 1000) / (√3 x V)",
        substitution: "117,650 / (1.732 x 415)",
        result: "I = 163.67 A",
      },
    ],
    resultSummary: [
      { check: "Apparent power", requirement: "n/a (this is the conversion result)", actual: "117.65 kVA", pass: true },
      { check: "Reactive power", requirement: "n/a (this is the conversion result)", actual: "61.97 kVAr", pass: true },
      { check: "Line current", requirement: "n/a (this is the conversion result)", actual: "163.67 A", pass: true },
    ],
    finalAnswer: "A 100 kW load at 0.85 lagging power factor on a 415 V three-phase supply draws 117.65 kVA of apparent power, 61.97 kVAr of reactive power, and 163.67 A of line current.",
    keyInsight: "Any two of {P, Q, S, PF} (plus voltage, for current) fully determine the rest of the power triangle — this calculator can start from whichever one quantity is actually known (kW, kVA, kVAr, or measured amps) and derive everything else, rather than requiring the input to always be real power specifically.",
    faqs: [
      {
        q: "What if power factor were exactly 1.0 (unity)?",
        a: "At unity power factor, apparent power equals real power exactly (S = P, since PF = 1), and reactive power drops to zero — physically, this represents a purely resistive load with no magnetizing or capacitive reactive component, which is why the calculator flags kVAr as the known quantity as mathematically undefined at PF = 1 (any apparent power value would give zero reactive power, so there's nothing to solve for from that direction).",
      },
      {
        q: "Does 'leading' vs 'lagging' power factor change these numbers?",
        a: "No — the magnitude relationships between P, Q, S and I are identical whether the load is inductive (lagging, drawing reactive power) or capacitive (leading, supplying reactive power back). The lagging/leading distinction matters for how that reactive power interacts with the rest of the system (e.g. whether it helps or hurts overall power factor when combined with other loads), not for this load's own P/Q/S/I magnitudes in isolation.",
      },
    ],
  },

  {
    slug: "demand-charge-tou-tariff-monthly-bill-estimate",
    groupId: "power-quality",
    calculatorHref: "/calculators/tariff",
    calculatorName: "Demand Charge / TOU Tariff",
    title: "Worked Example: Estimating a Monthly Bill with Time-of-Use Energy and a Power-Factor Penalty",
    dek: "Peak and off-peak energy, a demand charge, and a below-threshold power factor all combine into one monthly bill — with the PF penalty adding a small but real surcharge.",
    standard: "Illustrative utility tariff structure (rates are always utility-specific)",
    readTime: "8 min read",
    scenario: [
      { label: "Peak period", value: "8000 kWh at $0.42/kWh" },
      { label: "Off-peak period", value: "15,000 kWh at $0.22/kWh" },
      { label: "Peak demand", value: "120 kW at $35/kW" },
      { label: "Fixed monthly charge", value: "$100" },
      { label: "Measured power factor", value: "0.88" },
      { label: "PF penalty threshold / rate", value: "0.90 threshold, 0.5% demand-charge surcharge per 0.01 shortfall" },
    ],
    steps: [
      {
        title: "Compute total energy consumption and energy charge",
        equation: "energyCharge = Σ (period kWh x period rate)",
        substitution: "(8000 x 0.42) + (15,000 x 0.22)",
        result: "Total = 23,000 kWh, energy charge = $6660",
      },
      {
        title: "Compute the demand charge",
        equation: "demandCharge = peakDemandKw x demandRate",
        substitution: "120 x 35",
        result: "Demand charge = $4200",
      },
      {
        title: "Compute the power-factor penalty",
        equation: "shortfallPoints = (threshold - measuredPF) x 100          penalty% = shortfallPoints x penaltyRate",
        substitution: "(0.90 - 0.88) x 100 = 2 points;   2 x 0.5%",
        result: "Penalty = 1.0% of the demand charge = $42",
      },
      {
        title: "Sum every component into the total bill",
        equation: "totalBill = energyCharge + demandCharge + pfPenaltyCharge + fixedCharge",
        substitution: "6660 + 4200 + 42 + 100",
        result: "Total bill = $11,002",
      },
      {
        title: "Compute the blended (effective) rate per kWh",
        equation: "blendedRate = totalBill / totalKwh",
        substitution: "11,002 / 23,000",
        result: "Blended rate = $0.478/kWh — notably higher than either the peak or off-peak per-kWh rate alone",
      },
    ],
    resultSummary: [
      { check: "Total monthly bill", requirement: "n/a (this is the estimate)", actual: "$11,002", pass: true },
      { check: "PF penalty as a fraction of total bill", requirement: "n/a (informational)", actual: "$42 (about 0.4% of total)", pass: true },
    ],
    finalAnswer: "This month's estimated bill is $11,002 — energy charges dominate at $6660, demand charge adds $4200, and the below-threshold power factor tacks on a modest $42 penalty that would disappear entirely with power factor correction (see the Power Factor Correction worked example on this site).",
    keyInsight: "The blended rate per kWh ($0.478) is meaningfully higher than either the peak ($0.42) or off-peak ($0.22) energy rate alone, because the demand charge, fixed charge and PF penalty all get folded into that single blended number — a common trap when comparing a facility's 'per kWh cost' across sites or months is treating the energy rate as the whole story when demand and penalty charges can be a large fraction of the actual bill.",
    faqs: [
      {
        q: "Why is the PF penalty applied to the demand charge and not the whole bill?",
        a: "This reflects a common real-world utility tariff pattern — poor power factor increases the current (and therefore capacity) a utility has to provide relative to the real power actually delivered, so utilities often tie the penalty to the demand charge specifically, since that's the part of the bill tied to peak capacity provisioning rather than energy consumed. The exact formula and rate structure vary significantly by utility, which is why every rate in this calculator is a user-supplied input rather than a built-in constant.",
      },
      {
        q: "How much would fixing power factor actually save here?",
        a: "In this example the PF penalty is only $42/month, a small fraction of the total bill — but for a facility with a much larger demand charge or a utility with a steeper PF penalty rate, the same shortfall could represent a meaningful ongoing cost, which is exactly the kind of comparison the Power Factor Correction calculator's own savings estimate is built to make.",
      },
    ],
  },
];
