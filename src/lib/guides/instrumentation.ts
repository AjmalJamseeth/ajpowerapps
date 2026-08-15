// Category guide: Instrumentation & Process Controls.

import type { GuideDoc } from "./types";

export const INSTRUMENTATION_GUIDE: GuideDoc = {
  slug: "instrumentation-process-controls",
  groupId: "instrumentation",
  title: "Instrumentation & Process Controls: A Practical Guide",
  dek: "Why 4-20mA loops deliberately never use zero for zero, how the intrinsic safety entity concept lets you combine certified components without a full system drawing, and why thermocouples and RTDs fail in completely different ways.",
  readTime: "13 min read",
  intro: [
    "Instrumentation circuits carry very little power compared to the rest of this suite's calculators — a 4-20mA loop or a thermocouple signal is milliwatts, not kilowatts — but they're held to a different kind of rigor precisely because that small signal often represents something safety- or process-critical: a tank level, a gas concentration, a bearing temperature. This category's four calculators cover the signal integrity side (loop voltage budgets, temperature sensor accuracy) and the ignition-safety side (intrinsic safety) of instrumentation circuits, plus the specific reliability requirements of fire and gas detection loops.",
    "A recurring theme worth flagging up front: several of the concepts here exist specifically so that a wiring fault or a sensor's own physical limitations don't silently produce a wrong-but-plausible-looking reading. A live-zero signal convention, cold-junction compensation, and loop supervision are all, in different ways, mechanisms for making sure the system can tell the difference between 'everything is fine' and 'something has gone wrong' rather than defaulting to the former.",
  ],
  coreConcepts: [
    {
      heading: "Why 4-20mA uses a 'live zero' instead of starting at 0mA",
      body: [
        "The 4-20mA convention deliberately represents the minimum process value as 4mA rather than 0mA — a design choice usually called a 'live zero.' The reason is entirely about fault detection: if 0mA represented the minimum valid reading, there would be no way to electrically distinguish between 'the process variable is genuinely at its minimum' and 'the loop wiring has failed, the transmitter has lost power, or a connection has broken' — both conditions would look identical, 0mA, to the receiving system. By reserving 0mA exclusively for a fault condition and using 4mA as the lowest valid signal, the receiving system (a PLC, DCS, or panel meter) can immediately recognize a loop failure as a distinct, out-of-range condition rather than silently reading it as a plausible low process value.",
      ],
    },
    {
      heading: "The loop voltage budget: making sure the transmitter still has enough voltage at worst case",
      body: [
        "A 2-wire loop-powered transmitter draws its own operating power from the same loop current it's using to send its signal, which means the supply voltage has to be split between what the transmitter itself needs to operate and what's lost to wire resistance and any other loop component (a receiver's input resistance, a barrier, an indicator) — and that split has to work out correctly at the worst-case condition, 20mA (full-scale signal), not just at a typical operating point. This is why loop voltage budget calculations always check headroom at 20mA specifically: it's simultaneously the point of highest wire voltage drop and the point at which the transmitter is trying to communicate its most important (full-scale) reading, so it's exactly the wrong moment for the transmitter to be starved of operating voltage.",
      ],
    },
    {
      heading: "Intrinsic safety's entity concept: combining certified components without a full system drawing",
      body: [
        "Intrinsic safety (IS) is a protection technique for hazardous areas that works by limiting the electrical energy available in a circuit so low that it can never generate a spark or hot surface capable of igniting the surrounding atmosphere, even under fault conditions. Rather than requiring every specific combination of barrier and field device to go through its own full certified system (control-drawing) evaluation, IEC 60079-11/60079-14's entity concept allows combining any IS-certified associated apparatus (barrier) with any IS-certified field apparatus by independently checking each of their published entity parameters against each other: the barrier's maximum output voltage, current, and power must each stay within the field device's maximum input ratings for those same three quantities, and the total capacitance and inductance the field device and its connecting cable present must stay within the barrier's own maximum permitted capacitance and inductance.",
        "That last check is where cable length quietly matters more than it might seem — a field device's own rated capacitance and inductance are usually small, but cable itself has real distributed capacitance and inductance per unit length, and a long enough cable run can push total circuit capacitance or inductance over the barrier's limit even when the field device alone would have been comfortably within it. IEC 60079-14 does also define a '1% rule': if the field-side inductance excluding the cable is under 1% of the barrier's rated maximum inductance, the full (not halved) capacitance and inductance limits may be used in the entity concept check — a permitted simplification, not something that removes the need to check cable-contributed capacitance and inductance in the first place.",
      ],
    },
    {
      heading: "A thermocouple measures a temperature difference, not an absolute temperature",
      body: [
        "A thermocouple generates its small millivolt signal from the Seebeck effect — a voltage that arises from the temperature difference between its two junctions (the measurement junction out at the sensor, and the reference or 'cold' junction back at the instrument's own terminals), not from either junction's absolute temperature. This is exactly why cold-junction compensation is mandatory rather than optional: the raw millivolt reading alone only tells you how much hotter or colder the measurement junction is than whatever temperature the cold junction happens to be at that moment, and if the cold junction isn't held at a known, fixed reference temperature (which it almost never is in a real installation), its own temperature has to be independently measured and its equivalent millivolt contribution added back into the calculation — using the superposition law of thermoelectric circuits — to recover the actual measurement junction temperature. Skipping cold-junction compensation doesn't just introduce a small error; it can be off by however many degrees the actual cold-junction temperature differs from whatever the calculation assumed.",
      ],
    },
    {
      heading: "An RTD measures resistance, not voltage — which makes lead-wire resistance the enemy",
      body: [
        "A resistance temperature detector (RTD) works on a fundamentally different physical principle than a thermocouple: its resistance changes in a predictable, well-characterized way with temperature (the Callendar-Van Dusen equation, standardized for platinum RTDs in IEC 60751), and measuring that resistance requires passing a small excitation current through the element and reading the resulting voltage. Because the measurement is fundamentally a resistance measurement, any resistance in the wiring between the instrument and the RTD element — the lead wire itself — adds directly to whatever resistance is being measured, indistinguishable from the RTD's own resistance unless something specifically compensates for it. This is the entire reason 2-wire, 3-wire, and 4-wire RTD wiring configurations exist and give meaningfully different accuracy: a 4-wire (Kelvin) connection separates the current-carrying and voltage-sensing paths so lead resistance genuinely drops out of the measurement, while a 2-wire connection has no way to distinguish lead resistance from element resistance at all and is the most vulnerable to error over any meaningful cable run.",
      ],
    },
    {
      heading: "Fire and gas loop supervision: detecting a wiring fault, not just an alarm condition",
      body: [
        "A fire or gas detection initiating device circuit (IDC) has to do something an ordinary instrumentation loop doesn't: continuously verify its own wiring integrity, not just report a process condition. This is what the end-of-line (EOL) resistor is for — by maintaining a small, continuous supervisory current through the entire loop at all times, the panel can distinguish a healthy, intact loop from an open circuit (broken wire — current drops to zero) or a short circuit (current spikes to an abnormal level), both of which represent a real fault in the life-safety system's own wiring, distinct from and in addition to an actual alarm condition. This is exactly why a fire/gas loop's voltage budget has to be checked in both its standby state (continuous supervisory current, including the EOL) and its worst-case alarm state (one or more devices drawing full alarm current) — the loop has to work correctly in both states, not just when something is actually detected.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "4-20mA live-zero convention", scope: "Widespread industry practice for 2-wire loop-powered transmitters — not a single numbered standard, but a near-universal convention enabling fault detection via the 0-4mA dead band." },
    { standard: "IEC 60079-11 / IEC 60079-14", scope: "Intrinsic safety apparatus certification and the entity concept system-design method for combining certified components without a full system drawing." },
    { standard: "NIST ITS-90", scope: "Official inverse polynomial functions (millivolts to °C) for common base-metal thermocouple types (K, J, T, E) and the basis for cold-junction compensation." },
    { standard: "IEC 60751", scope: "Callendar-Van Dusen standard coefficients for platinum RTD resistance-to-temperature conversion (\"alpha-385\")." },
    { standard: "NFPA 72 (IDC design practice)", scope: "General fire alarm initiating device circuit design practice — informs the fire & gas loop's standby/alarm voltage budget and end-of-line supervision approach, not a single fixed published formula." },
  ],
  workflow: [
    {
      title: "Check the loop voltage budget for a 2-wire transmitter circuit",
      body: "Verify supply voltage clears the transmitter's minimum operating voltage at worst-case 20mA, after wire voltage drop and any other loop component burden.",
      calculatorHref: "/calculators/current-loop-4-20ma",
      calculatorName: "4-20mA Current Loop",
    },
    {
      title: "For hazardous-area installations, verify the intrinsic safety entity concept",
      body: "Check the barrier's voltage/current/power against the field device's limits, and separately check total circuit capacitance and inductance (including cable) against the barrier's own maximum.",
      calculatorHref: "/calculators/intrinsic-safety",
      calculatorName: "Intrinsic Safety (IS) Verification",
    },
    {
      title: "Convert thermocouple or RTD readings to temperature",
      body: "Apply cold-junction compensation for thermocouples, or the appropriate lead-wire-compensated wiring configuration for RTDs, to get an accurate temperature from the raw sensor signal.",
      calculatorHref: "/calculators/thermocouple-rtd",
      calculatorName: "Thermocouple & RTD",
    },
    {
      title: "For fire/gas detection circuits, check both standby and alarm voltage budgets",
      body: "Confirm the farthest device on the loop sees adequate voltage in both the continuous supervisory (standby) state and the worst-case simultaneous-alarm state.",
      calculatorHref: "/calculators/fg-loop",
      calculatorName: "Fire & Gas Detection Loop Budget",
    },
  ],
  commonMistakes: [
    {
      mistake: "Treating 0mA as a valid low-end process reading instead of a fault indicator",
      whyItMatters: "The entire point of the 4-20mA live-zero convention is to reserve 0mA exclusively for a fault condition (broken wire, lost power) so it can never be confused with a genuine minimum process reading — a receiving system or design that doesn't respect this distinction loses the loop's built-in fault-detection capability.",
    },
    {
      mistake: "Checking loop voltage budget at a typical operating current instead of worst-case 20mA",
      whyItMatters: "Wire voltage drop and transmitter voltage demand are both highest at 20mA (full-scale signal) — a loop that looks fine at a lower, more typical current can still fail to deliver adequate voltage to the transmitter exactly when it's trying to report its most important full-scale reading.",
    },
    {
      mistake: "Checking intrinsic safety voltage/current/power but forgetting cable-contributed capacitance and inductance",
      whyItMatters: "A field device's own entity parameters are often comfortably within a barrier's limits, but a long cable run's own distributed capacitance and inductance add on top of the device's figures and can push the total over the barrier's maximum even when the device alone would pass — this is a genuinely common and easy-to-overlook failure mode in real IS loop design.",
    },
    {
      mistake: "Reading a thermocouple's raw millivolt output without cold-junction compensation",
      whyItMatters: "A thermocouple only measures the temperature difference between its two junctions, not an absolute temperature — without adding back the cold junction's own equivalent temperature contribution, the reading can be off by however many degrees the actual cold-junction temperature differs from whatever was assumed (or ignored).",
    },
    {
      mistake: "Using a 2-wire RTD connection over a long cable run without accounting for lead-wire resistance error",
      whyItMatters: "An RTD measurement is fundamentally a resistance measurement, and lead-wire resistance adds directly to it — a 2-wire connection has no way to separate lead resistance from element resistance, making it the most vulnerable configuration to measurement error over any meaningful cable length, unlike a 3-wire or especially a 4-wire (Kelvin) connection.",
    },
    {
      mistake: "Checking a fire/gas loop's voltage budget only in the alarm state and skipping standby",
      whyItMatters: "The loop has to work correctly in both states — standby supervisory current (including any end-of-line resistor) confirms the wiring itself is healthy at all times, which is a distinct requirement from confirming the loop can still deliver adequate voltage when devices go into alarm.",
    },
  ],
  faqs: [
    {
      q: "Why does the entity concept let you mix and match IS-certified components instead of requiring one certified system for every combination?",
      a: "Because entity parameters (voltage, current, power, capacitance, inductance) are defined and published independently for each certified component specifically so they can be checked against each other without re-certifying every possible pairing — as long as each side's parameters clear the other's limits (including cable-contributed capacitance/inductance), the combination is considered safe under the entity concept, which is far more practical than requiring a dedicated system certification for every barrier/device/cable combination that might ever be installed.",
    },
    {
      q: "If a thermocouple and an RTD can both measure the same temperature range, why would you choose one over the other?",
      a: "They have different strengths tied to the same physical differences covered above — thermocouples are simpler, more rugged, and can measure much higher temperatures, but their signal is small and non-linear and always needs cold-junction compensation. RTDs are generally more accurate and stable over their more limited temperature range, but need an excitation current and, for longer cable runs, a 3-wire or 4-wire connection to avoid lead-resistance error. The choice usually comes down to the required accuracy, the temperature range, and the practical cable run length for that specific installation.",
    },
  ],
};
