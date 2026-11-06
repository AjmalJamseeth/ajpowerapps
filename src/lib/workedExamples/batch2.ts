// Worked examples, batch 2 (November 2026). Every number below was produced
// by running the calculator's own library function with the stated inputs,
// and each one is pinned in scripts/regression-test.ts
// ("Worked examples batch 2").

import type { WorkedExample } from "./types";

export const BATCH2_EXAMPLES: WorkedExample[] = [
  // ------------------------------------------------------------------ motors
  {
    slug: "motor-acceleration-time-fan-90kw",
    groupId: "motors",
    calculatorHref: "/calculators/motor-acceleration-time",
    calculatorName: "Motor Acceleration Time Calculator",
    title: "Worked Example: Run-Up Time of a 90 kW Fan With a High-Inertia Impeller",
    dek: "How long a direct-on-line 90 kW motor takes to bring a large fan up to speed, and why the answer must be compared with the motor's locked-rotor withstand time.",
    standard: "t = J·ω / T_acc",
    readTime: "7 min read",
    scenario: [
      { label: "Motor", value: "90 kW, 4-pole, rated speed 1485 rpm, direct-on-line start" },
      { label: "Inertia", value: "Motor rotor 1.2 kg·m² + fan impeller 45 kg·m² (direct drive) = 46.2 kg·m²" },
      { label: "Average motor torque during run-up", value: "≈ 1.4 × rated torque (from the motor's speed–torque curve)" },
      { label: "Average fan load torque during run-up", value: "≈ 174 N·m (fan torque rises with speed², averaged over the run-up)" },
    ],
    steps: [
      {
        title: "Rated torque of the motor",
        equation: "Tn = 9550 × P / n",
        substitution: "Tn = 9550 × 90 / 1485",
        result: "Tn = 578.8 N·m",
      },
      {
        title: "Average net accelerating torque",
        equation: "T_acc = T_motor,avg − T_load,avg",
        substitution: "T_acc = 1.4 × 578.8 − 174 = 810 − 174",
        result: "T_acc ≈ 636 N·m",
        note: "The average is taken over the whole run-up. With the actual motor and load curves, a step-by-step integration gives a more exact result; the average-torque method is the usual first check.",
      },
      {
        title: "Target angular velocity",
        equation: "ω = 2π × n / 60",
        substitution: "ω = 2π × 1485 / 60",
        result: "ω = 155.5 rad/s",
      },
      {
        title: "Acceleration time",
        equation: "t = J × ω / T_acc",
        substitution: "t = 46.2 × 155.5 / 636",
        result: "t = 11.3 s",
      },
      {
        title: "Compare with the motor's locked-rotor withstand",
        body: "During run-up the motor draws close to its starting current, so the run-up time must be safely shorter than the motor's permissible locked-rotor (stall) time, from the motor data sheet. A common practice is to require the run-up time to be no more than about 80% of the hot stall time, and to set the motor protection between the two.",
      },
    ],
    resultSummary: [
      { check: "Acceleration time", requirement: "Calculated", actual: "11.3 s (classed as a slow start)", pass: true },
      { check: "Margin to stall time (example: 15 s hot stall time)", requirement: "t ≤ 0.8 × 15 = 12 s", actual: "11.3 s — only just within", pass: true },
    ],
    finalAnswer: "The fan takes about 11.3 s to reach speed. With a typical hot stall time of around 15 s, the margin is small, so the overload protection setting must be checked carefully, or a larger motor, a high-inertia motor design, or a soft or VFD start considered.",
    keyInsight: "Run-up time grows in direct proportion to inertia. A heavy fan impeller can make the start several times longer than the same motor driving a pump, even when the steady-state power is identical.",
    faqs: [
      { q: "How do I refer load inertia through a belt or gearbox?", a: "Multiply the load inertia by the square of the speed ratio (load speed ÷ motor speed) before adding it to the motor inertia." },
      { q: "Does reduced starting voltage change the run-up time?", a: "Yes. Motor torque falls roughly with the square of the voltage, so a 20% voltage dip during starting cuts torque by about 36% and lengthens the run-up." },
    ],
  },
  {
    slug: "soft-starter-sizing-derating-hot-high-site",
    groupId: "motors",
    calculatorHref: "/calculators/soft-starter-sizing",
    calculatorName: "Soft Starter Sizing Calculator",
    title: "Worked Example: Soft Starter Selection for a 140 A Motor at 50 °C, 1500 m and 12 Starts per Hour",
    dek: "A 160 A soft starter looks big enough for a 140 A motor until ambient, altitude and starting duty are applied. How the derated capacity is worked out and which size passes.",
    standard: "IEC 60947-4-2 (practice)",
    readTime: "6 min read",
    scenario: [
      { label: "Motor", value: "75 kW, 400 V, full-load current 140 A" },
      { label: "Site", value: "Ambient 50 °C, altitude 1500 m" },
      { label: "Duty", value: "12 starts per hour" },
      { label: "Candidate soft starters", value: "160 A and 200 A, both rated 400 V" },
    ],
    scenarioNote: "The derating rates used (1% per °C above 40 °C, 1% per 100 m above 1000 m, and a starts-per-hour factor) are typical manufacturer figures. The chosen manufacturer's own derating curves take precedence.",
    steps: [
      { title: "Ambient temperature factor", equation: "k_T = 1 − 0.01 × (T − 40)", substitution: "k_T = 1 − 0.01 × (50 − 40)", result: "k_T = 0.90" },
      { title: "Altitude factor", equation: "k_A = 1 − 0.01 × (h − 1000) / 100", substitution: "k_A = 1 − 0.01 × 500 / 100", result: "k_A = 0.95" },
      { title: "Starting duty factor", body: "11 to 20 starts per hour reduces the thermal capacity available for running current.", result: "k_D = 0.90 (12 starts/h)" },
      { title: "Derated capacity of the 160 A unit", equation: "I_derated = I_rated × k_T × k_A × k_D", substitution: "160 × 0.90 × 0.95 × 0.90", result: "123.1 A < 140 A — not adequate" },
      { title: "Derated capacity of the 200 A unit", substitution: "200 × 0.90 × 0.95 × 0.90", result: "153.9 A ≥ 140 A — adequate" },
    ],
    resultSummary: [
      { check: "Voltage rating", requirement: "≥ 400 V", actual: "400 V", pass: true },
      { check: "160 A unit, derated", requirement: "≥ 140 A", actual: "123.1 A", pass: false },
      { check: "200 A unit, derated", requirement: "≥ 140 A", actual: "153.9 A", pass: true },
    ],
    finalAnswer: "The 160 A soft starter is only good for 123.1 A at this site and duty, so the 200 A unit (153.9 A derated) is required.",
    keyInsight: "The three derating factors multiply. Each looks small on its own, but together they remove 23% of the rating here.",
    faqs: [
      { q: "Does a bypass contactor change the sizing?", a: "An internally or externally bypassed soft starter carries running current through the contactor, so many manufacturers allow higher ratings or more starts. Use the bypassed rating tables in that case." },
      { q: "Why do more starts per hour reduce the rating?", a: "Each start heats the thyristors with several times rated current. More starts leave less time to cool, so less continuous current can be carried." },
    ],
  },

  // -------------------------------------------------------------- solar / EV
  {
    slug: "solar-charge-controller-mppt-48v-3-2kw",
    groupId: "solar-ev",
    calculatorHref: "/calculators/solar-charge-controller-sizing",
    calculatorName: "Solar Charge Controller Sizing",
    title: "Worked Example: Sizing an MPPT Charge Controller for a 3.2 kW Array on 48 V and 24 V Batteries",
    dek: "The same 3.2 kW array needs a 100 A controller on a 48 V battery but a 200 A controller on 24 V. How the current rating is worked out.",
    standard: "NEC 690.8 practice",
    readTime: "6 min read",
    scenario: [
      { label: "PV array", value: "3.2 kW (STC)" },
      { label: "Controller type", value: "MPPT" },
      { label: "Battery", value: "48 V nominal (compared with 24 V)" },
      { label: "Design margin", value: "10% on top of the 125% continuous factor" },
    ],
    steps: [
      { title: "Output (charging) current at 48 V", equation: "I = P_array / V_battery", substitution: "I = 3200 / 48", result: "I = 66.7 A" },
      { title: "Apply the continuous factor and margin", equation: "I_req = I × 1.25 × (1 + margin)", substitution: "I_req = 66.7 × 1.25 × 1.10", result: "I_req = 91.7 A" },
      { title: "Select a standard rating", result: "100 A controller" },
      {
        title: "Repeat for a 24 V battery",
        substitution: "3200 / 24 = 133.3 A; 133.3 × 1.25 × 1.10 = 183.3 A",
        result: "200 A controller (or two 100 A controllers on split arrays)",
      },
      {
        title: "Check the PV input side",
        body: "The controller's maximum PV input voltage must exceed the array's open-circuit voltage at the lowest site temperature, and its PV input current must cover the array short-circuit current. These are separate checks on the controller data sheet.",
      },
    ],
    resultSummary: [
      { check: "48 V system controller rating", requirement: "≥ 91.7 A", actual: "100 A", pass: true },
      { check: "24 V system controller rating", requirement: "≥ 183.3 A", actual: "200 A", pass: true },
    ],
    finalAnswer: "On a 48 V battery the 3.2 kW array needs a 100 A MPPT controller (91.7 A required). On 24 V the current doubles, and a 200 A controller or two smaller controllers are needed.",
    keyInsight: "For an MPPT controller the output current is set by array power and battery voltage, not by the array current. Doubling the battery voltage halves the controller size.",
    faqs: [
      { q: "How is a PWM controller sized instead?", a: "A PWM controller passes the array current almost directly, so it is sized from array short-circuit current × 1.25 (× margin), with the array voltage matched to the battery." },
      { q: "Can the array power exceed the controller rating?", a: "Many MPPT controllers allow some array oversizing and simply limit output current, but check the manufacturer's maximum array power and input current limits." },
    ],
  },
  {
    slug: "inverter-sizing-dc-ac-ratio-100kw",
    groupId: "solar-ev",
    calculatorHref: "/calculators/inverter-sizing",
    calculatorName: "Inverter Sizing — Solar, Off-Grid & ILR",
    title: "Worked Example: Choosing the Inverter Size for a 100 kWp Array Using the DC:AC Ratio",
    dek: "A 100 kWp rooftop array with a target DC:AC ratio of 1.25. Why a 75 kW inverter is typical and a 60 kW inverter would clip heavily.",
    standard: "DC:AC ratio (ILR) practice",
    readTime: "6 min read",
    scenario: [
      { label: "PV array", value: "100 kWp DC at STC" },
      { label: "Target DC:AC ratio", value: "1.25" },
      { label: "Candidates", value: "75 kW and 60 kW AC inverters" },
    ],
    steps: [
      { title: "Inverter size for the target ratio", equation: "P_AC = P_DC / ILR", substitution: "P_AC = 100 / 1.25", result: "P_AC = 80 kW" },
      { title: "Ratio with a 75 kW inverter", equation: "ILR = P_DC / P_AC", substitution: "ILR = 100 / 75", result: "ILR = 1.33 — typical range (1.15–1.35)" },
      { title: "Ratio with a 60 kW inverter", substitution: "ILR = 100 / 60", result: "ILR = 1.67 — aggressive, clipping likely" },
      {
        title: "Why oversizing the array is normal",
        body: "A PV array rarely delivers its STC rating because of temperature, soiling, irradiance below 1000 W/m² and DC losses. A moderate DC:AC ratio keeps the inverter near full output for more hours, accepting a little clipping around midday. The acceptable ratio depends on climate and should be confirmed with an energy-yield simulation.",
      },
    ],
    resultSummary: [
      { check: "75 kW inverter", requirement: "ILR within 1.15–1.35", actual: "1.33", pass: true },
      { check: "60 kW inverter", requirement: "ILR within 1.15–1.35", actual: "1.67", pass: false },
    ],
    finalAnswer: "An 80 kW inverter matches the target ratio exactly; a 75 kW unit gives 1.33, still in the typical range. A 60 kW unit (1.67) would clip a significant part of the energy on clear days.",
    keyInsight: "The DC:AC ratio is an economic choice, not a safety limit. Electrically, the inverter's DC input voltage and current limits must still be checked separately.",
    faqs: [
      { q: "What DC:AC ratio is used in hot climates?", a: "Hot sites lose more array output to temperature, so ratios at the upper end of the range are common, but yield simulation should confirm the clipping loss." },
      { q: "Does a high ratio harm the inverter?", a: "No. The inverter limits its own output. The risk is lost energy, plus the need to stay within the inverter's maximum DC input current and voltage." },
    ],
  },
  {
    slug: "wind-turbine-power-output-30m-rotor",
    groupId: "solar-ev",
    calculatorHref: "/calculators/wind-turbine-power-output",
    calculatorName: "Wind Turbine Power Output",
    title: "Worked Example: Power From a 30 m Rotor at 8 m/s and 10 m/s",
    dek: "Electrical output of a small wind turbine from the wind power equation, and why a 25% rise in wind speed nearly doubles the power.",
    standard: "P = ½ρAv³·Cp·η",
    readTime: "5 min read",
    scenario: [
      { label: "Rotor diameter", value: "30 m" },
      { label: "Wind speed", value: "8 m/s (and 10 m/s for comparison)" },
      { label: "Air density", value: "1.225 kg/m³ (sea level, 15 °C)" },
      { label: "Power coefficient Cp", value: "0.42 (Betz limit 0.593)" },
      { label: "Generator and drive efficiency", value: "94%" },
    ],
    steps: [
      { title: "Swept area", equation: "A = π × (D/2)²", substitution: "A = π × 15²", result: "A = 706.9 m²" },
      { title: "Electrical power at 8 m/s", equation: "P = 0.5 × ρ × A × v³ × Cp × η", substitution: "P = 0.5 × 1.225 × 706.9 × 8³ × 0.42 × 0.94", result: "P = 87.5 kW" },
      { title: "Electrical power at 10 m/s", substitution: "P = 0.5 × 1.225 × 706.9 × 10³ × 0.42 × 0.94", result: "P = 170.9 kW" },
      {
        title: "Check against the turbine's rating",
        body: "Above rated wind speed the turbine limits its output by pitch or stall control, so the equation only applies up to the rated point. Real Cp also varies with wind speed; the manufacturer's power curve should be used for yield estimates.",
      },
    ],
    resultSummary: [
      { check: "Cp within Betz limit", requirement: "≤ 0.593", actual: "0.42", pass: true },
      { check: "Output at 8 m/s", requirement: "Calculated", actual: "87.5 kW", pass: true },
      { check: "Output at 10 m/s", requirement: "Calculated", actual: "170.9 kW", pass: true },
    ],
    finalAnswer: "The 30 m rotor delivers about 87.5 kW at 8 m/s and 170.9 kW at 10 m/s, provided both are below the turbine's rated wind speed.",
    keyInsight: "Power rises with the cube of wind speed: (10/8)³ = 1.95. A small error in the site's wind speed becomes a large error in energy, which is why site wind measurement matters more than any other input.",
    faqs: [
      { q: "How does altitude affect output?", a: "Air density falls with altitude and temperature, and power falls in direct proportion. At 1000 m density is roughly 10% lower than at sea level." },
      { q: "Why can Cp not exceed 0.593?", a: "The Betz limit shows that no turbine can extract more than 16/27 of the kinetic energy in the wind, because the air must keep moving to leave the rotor." },
    ],
  },
  {
    slug: "solar-panel-tilt-angle-latitude-24-5",
    groupId: "solar-ev",
    calculatorHref: "/calculators/solar-panel-tilt-angle",
    calculatorName: "Solar Panel Tilt Angle",
    title: "Worked Example: Fixed Tilt Angle for a Site at 24.5° Latitude",
    dek: "Year-round, winter-biased and summer-biased tilt angles for a site in the Gulf region, and when the rule of thumb is good enough.",
    standard: "Latitude rule of thumb",
    readTime: "4 min read",
    scenario: [
      { label: "Site latitude", value: "24.5° N" },
      { label: "Mounting", value: "Fixed tilt, facing due south" },
    ],
    steps: [
      { title: "Year-round tilt", equation: "β ≈ latitude", substitution: "β ≈ 24.5°", result: "β = 24.5°" },
      { title: "Winter-biased tilt", equation: "β ≈ latitude + 15°", substitution: "β ≈ 24.5 + 15", result: "β = 39.5°" },
      { title: "Summer-biased tilt", equation: "β ≈ latitude − 15°", substitution: "β ≈ 24.5 − 15", result: "β = 9.5°" },
      {
        title: "Practical adjustments",
        body: "In dusty climates a slightly steeper tilt helps rain and cleaning remove soiling, and very low tilts (below about 10°) hold dust and water. On large ground-mounted plants the tilt is usually set by an energy-yield simulation that also accounts for row spacing and shading.",
      },
    ],
    resultSummary: [
      { check: "Year-round tilt", requirement: "≈ latitude", actual: "24.5°", pass: true },
      { check: "Winter / summer bias", requirement: "latitude ± 15°", actual: "39.5° / 9.5°", pass: true },
    ],
    finalAnswer: "For year-round production at 24.5° latitude, tilt the modules at about 24.5° facing south. Use about 39.5° to favour winter output or 9.5° to favour summer output.",
    keyInsight: "Near the optimum the yield curve is flat: a few degrees either side changes annual energy by only around 1%, so structural, wind-load and cleaning considerations can decide the final angle.",
    faqs: [
      { q: "Which direction should panels face in the southern hemisphere?", a: "Due north, with the same tilt rules applied to the absolute latitude." },
      { q: "Is a tracker better than an optimised fixed tilt?", a: "Single-axis trackers typically gain 15–25% more energy at sunny low-latitude sites, at higher cost and maintenance." },
    ],
  },

  // ----------------------------------------------------------- short circuit
  {
    slug: "switchgear-sccr-2500kva-480v",
    groupId: "short-circuit",
    calculatorHref: "/calculators/switchgear-short-circuit-rating",
    calculatorName: "Switchgear Short-Circuit Rating",
    title: "Worked Example: Is a 50 kA Switchboard Adequate on a 2500 kVA, 480 V Transformer?",
    dek: "Available fault current from transformer kVA and impedance, checked against breaker interrupting rating and switchboard SCCR per NEC 110.9 and 110.10.",
    standard: "NEC 110.9 / 110.10",
    readTime: "6 min read",
    scenario: [
      { label: "Transformer", value: "2500 kVA, 480 V secondary, 5.75% impedance" },
      { label: "Main breaker interrupting rating", value: "65 kA" },
      { label: "Switchboard SCCR (nameplate)", value: "50 kA" },
      { label: "Assumption", value: "Infinite utility source; no cable impedance (screening value)" },
    ],
    steps: [
      { title: "Transformer full-load current", equation: "I_FL = kVA × 1000 / (√3 × V)", substitution: "I_FL = 2,500,000 / (√3 × 480)", result: "I_FL = 3007 A" },
      { title: "Available symmetrical fault current", equation: "I_SC = I_FL / (%Z / 100)", substitution: "I_SC = 3007 / 0.0575", result: "I_SC = 52.3 kA" },
      { title: "Approximate peak current", equation: "i_p ≈ √2 × 1.8 × I_SC", substitution: "i_p ≈ 1.414 × 1.8 × 52.3", result: "i_p ≈ 133 kA", note: "1.8 is a conservative screening factor. A full IEC 60909 calculation uses κ from the actual X/R ratio." },
      { title: "Compare with the ratings", body: "Breaker: 65 kA ≥ 52.3 kA, adequate. Switchboard SCCR: 50 kA < 52.3 kA, not adequate." },
    ],
    resultSummary: [
      { check: "Breaker interrupting rating (NEC 110.9)", requirement: "≥ 52.3 kA", actual: "65 kA", pass: true },
      { check: "Switchboard SCCR (NEC 110.10)", requirement: "≥ 52.3 kA", actual: "50 kA", pass: false },
    ],
    finalAnswer: "The available fault current is about 52.3 kA. The 65 kA breaker is adequate, but the 50 kA switchboard rating is not: a 65 kA rated switchboard is needed, or a detailed study including utility and cable impedance must show the actual fault current is below 50 kA.",
    keyInsight: "Breaker interrupting rating and equipment SCCR are two separate checks. A high-rated breaker inside a lower-rated switchboard does not raise the switchboard's rating unless the combination is tested and listed as a series rating.",
    faqs: [
      { q: "Why is this result conservative?", a: "It ignores the utility source impedance and cables, both of which reduce the fault current. Motor contribution, which increases it, is also ignored, so a full study is needed when the margin is small." },
      { q: "What is a series rating?", a: "A tested combination in which an upstream device protects a downstream device with a lower interrupting rating. It must be listed and marked; it cannot be assumed by calculation." },
    ],
  },

  // ------------------------------------------------------------------ cables
  {
    slug: "feeder-tap-rule-25ft-400a-feeder",
    groupId: "cables",
    calculatorHref: "/calculators/feeder-tap-rule",
    calculatorName: "Feeder Tap Rule Calculator (NEC 240.21(B))",
    title: "Worked Example: 25-ft Tap From a 400 A Feeder — Why 1 AWG Fails and 1/0 Passes",
    dek: "A 20 ft tap from a 400 A feeder to a panel. The NEC 240.21(B)(2) one-third rule decides the conductor size.",
    standard: "NEC 240.21(B)(2)",
    readTime: "5 min read",
    scenario: [
      { label: "Feeder protection", value: "400 A" },
      { label: "Tap length", value: "20 ft, in rigid conduit" },
      { label: "Tap terminates in", value: "A single breaker at the panel" },
      { label: "Conductors (75 °C Cu, NEC 310.16)", value: "1 AWG = 130 A, 1/0 AWG = 150 A" },
    ],
    steps: [
      { title: "Minimum tap ampacity", equation: "I_tap ≥ OCPD_feeder / 3", substitution: "400 / 3", result: "133.3 A" },
      { title: "Try 1 AWG with a 125 A breaker", body: "Length 20 ft ≤ 25 ft and protected — pass. Breaker 125 A ≤ 130 A — pass.", result: "130 A < 133.3 A — fails the one-third rule" },
      { title: "Try 1/0 AWG with a 150 A breaker", body: "Length and protection pass. 150 A ≥ 133.3 A — pass. Breaker 150 A ≤ 150 A — pass.", result: "All four conditions met" },
    ],
    resultSummary: [
      { check: "Length ≤ 25 ft", requirement: "≤ 25 ft", actual: "20 ft", pass: true },
      { check: "1 AWG ampacity ≥ 1/3 of 400 A", requirement: "≥ 133.3 A", actual: "130 A", pass: false },
      { check: "1/0 AWG ampacity ≥ 1/3 of 400 A", requirement: "≥ 133.3 A", actual: "150 A", pass: true },
      { check: "Terminal breaker ≤ tap ampacity", requirement: "≤ 150 A", actual: "150 A", pass: true },
    ],
    finalAnswer: "1 AWG (130 A) misses the one-third requirement by 3.3 A. 1/0 AWG copper (150 A) with a 150 A breaker at the panel complies with NEC 240.21(B)(2).",
    keyInsight: "The tap must satisfy the one-third rule even if the panel load is small, because until it reaches the terminal breaker the tap is only protected by the 400 A feeder device.",
    faqs: [
      { q: "When can the 10-ft rule be used instead?", a: "For taps up to 10 ft, the tap ampacity must be at least the terminating device rating and, for field installations leaving the enclosure, at least one-tenth of the feeder OCPD rating." },
      { q: "Does conductor termination temperature matter?", a: "Yes. Use the ampacity column allowed by the terminal temperature rating, usually 75 °C for equipment over 100 A (NEC 110.14(C))." },
    ],
  },

  // ------------------------------------------------------------ backup power
  {
    slug: "transfer-switch-sizing-250kw-480v",
    groupId: "backup-power",
    calculatorHref: "/calculators/transfer-switch-sizing",
    calculatorName: "Transfer Switch Sizing",
    title: "Worked Example: Transfer Switch for a 250 kW Standby Load at 480 V",
    dek: "Load current, the 125% continuous-load factor and the next standard transfer switch rating — and why a load that looks like 400 A needs a 600 A switch.",
    standard: "NEC 215.2 / UL 1008 ratings",
    readTime: "5 min read",
    scenario: [
      { label: "Standby load", value: "250 kW at 0.9 power factor" },
      { label: "Supply", value: "480 V, three-phase" },
      { label: "Continuous portion", value: "80% of the load runs 3 hours or more" },
      { label: "System", value: "Optional standby (NEC Article 702)" },
    ],
    steps: [
      { title: "Load current", equation: "I = P / (√3 × V × PF)", substitution: "I = 250,000 / (√3 × 480 × 0.9)", result: "I = 334.1 A" },
      { title: "Split into continuous and non-continuous parts", substitution: "Continuous 0.8 × 334.1 = 267.3 A; non-continuous 66.8 A", result: "267.3 A + 66.8 A" },
      { title: "Minimum switch rating", equation: "I_min = 1.25 × I_cont + I_noncont", substitution: "1.25 × 267.3 + 66.8", result: "I_min = 400.9 A" },
      { title: "Next standard rating", body: "Standard ratings run …, 300, 400, 600 A. 400.9 A is just above 400 A.", result: "600 A transfer switch" },
    ],
    resultSummary: [
      { check: "Minimum ampere rating", requirement: "≥ 400.9 A", actual: "600 A selected", pass: true },
      { check: "400 A switch", requirement: "≥ 400.9 A", actual: "400 A", pass: false },
    ],
    finalAnswer: "The minimum rating is 400.9 A, so a 600 A transfer switch is required. A 400 A switch would be adequate only if the continuous share of the load were slightly lower.",
    keyInsight: "Results that land just above a standard rating are worth a second look at the load data: confirming the continuous fraction or the power factor can avoid a jump to the next frame size.",
    faqs: [
      { q: "What else must the transfer switch be checked for?", a: "Its withstand and closing rating (WCR) must be at least the available fault current for the upstream protective device type and clearing time, per its UL 1008 listing." },
      { q: "Does a motor-heavy load change the selection?", a: "Motor loads affect transfer switch type (in-phase monitor or delayed transition) and inrush; check the manufacturer's application guide." },
    ],
  },

  // ---------------------------------------------------------------- earthing
  {
    slug: "ground-ring-resistance-building-perimeter",
    groupId: "earthing",
    calculatorHref: "/calculators/ground-ring-resistance",
    calculatorName: "Ground Ring Resistance Calculator",
    title: "Worked Example: Can a Perimeter Ring Electrode Reach 10 Ω in 200 Ω·m Soil?",
    dek: "A buried ring around a small building, checked against the 10 Ω usually aimed for in lightning protection earthing. A 12 m ring falls short; a 20 m ring passes.",
    standard: "IEEE Std 142 ring formula",
    readTime: "6 min read",
    scenario: [
      { label: "Soil resistivity", value: "200 Ω·m (measured, Wenner method)" },
      { label: "Conductor", value: "Bare copper, 10 mm diameter" },
      { label: "Burial depth", value: "0.6 m" },
      { label: "Target", value: "10 Ω (low-frequency earth resistance aimed for in BS EN 62305-3)" },
      { label: "Options", value: "Ring of 12 m diameter (close to the building) or 20 m diameter (around the site)" },
    ],
    scenarioNote: "BS 7430:2011 does not give a ring formula, so the ring-of-wire formula from IEEE Std 142 (Dwight) is used, with s equal to twice the burial depth.",
    steps: [
      {
        title: "Ring formula",
        equation: "R = ρ / (2π²D) × [ln(8D/d) + ln(4D/s)],  s = 2h",
        body: "D is the ring diameter, d the conductor diameter and h the burial depth.",
      },
      {
        title: "12 m ring",
        substitution: "R = 200 / (2π² × 12) × [ln(8×12/0.01) + ln(4×12/1.2)] = 0.844 × (9.170 + 3.689)",
        result: "R = 10.86 Ω — above the 10 Ω target",
      },
      {
        title: "20 m ring",
        substitution: "R = 200 / (2π² × 20) × [ln(8×20/0.01) + ln(4×20/1.2)] = 0.507 × (9.680 + 4.200)",
        result: "R = 7.03 Ω — meets the target",
      },
      {
        title: "Other ways to lower the resistance",
        body: "Instead of a larger ring, earth rods can be added to the 12 m ring, driven deep where the soil is wetter. The conductor size has only a small effect: doubling the diameter lowers the 12 m ring by about 0.6 Ω.",
      },
    ],
    resultSummary: [
      { check: "12 m ring", requirement: "≤ 10 Ω", actual: "10.86 Ω", pass: false },
      { check: "20 m ring", requirement: "≤ 10 Ω", actual: "7.03 Ω", pass: true },
    ],
    finalAnswer: "In 200 Ω·m soil a 12 m ring gives about 10.9 Ω and misses the 10 Ω target; a 20 m ring gives 7.0 Ω and meets it. Confirm the installed value with a fall-of-potential test.",
    keyInsight: "Ring resistance falls roughly in inverse proportion to the ring diameter. Size matters far more than conductor thickness.",
    faqs: [
      { q: "Why not use BS 7430 for the ring?", a: "BS 7430:2011 gives formulas for rods, plates, straight strips, meshes and some star and cruciform layouts, but not for a ring. IEEE Std 142's ring-of-wire formula is the usual reference." },
      { q: "Is the 10 Ω target mandatory?", a: "BS EN 62305-3 recommends a low earth resistance, if possible below 10 Ω, for a lightning protection earth. Electrical safety requirements for the installation are set separately, for example by disconnection times and touch voltages." },
    ],
  },
];
