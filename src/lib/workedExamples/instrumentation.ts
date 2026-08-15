// Worked examples for the Instrumentation & Process Controls group. Every
// numeric value was produced by running the calculator's own verified
// engine (loop420.ts / intrinsicsafety.ts / thermocouple.ts / fgloop.ts)
// directly with tsx, not hand-typed.

import type { WorkedExample } from "./types";

export const INSTRUMENTATION_EXAMPLES: WorkedExample[] = [
  {
    slug: "4-20ma-loop-voltage-budget-1000ft-run",
    groupId: "instrumentation",
    calculatorHref: "/calculators/current-loop-4-20ma",
    calculatorName: "4-20mA Current Loop",
    title: "Worked Example: Voltage Budget for a 1000-Foot 4-20mA Transmitter Loop",
    dek: "A 24 V loop-powered transmitter at the far end of a 1000-foot run — checking it still gets enough terminal voltage at the worst-case 20 mA signal, and how much farther the same wire gauge could actually reach.",
    standard: "Standard 2-wire loop-powered transmitter power budget (Ohm's law)",
    readTime: "8 min read",
    scenario: [
      { label: "Loop supply voltage", value: "24 V" },
      { label: "Transmitter minimum terminal voltage (at 20 mA)", value: "12 V" },
      { label: "Receiver / PLC input impedance", value: "250 Ω" },
      { label: "Wire gauge", value: "22 AWG (16.14 Ω per 1000 ft)" },
      { label: "One-way cable run", value: "1000 ft" },
    ],
    steps: [
      {
        title: "Compute round-trip wire resistance",
        equation: "Rwire = 2 x L x (Ω per 1000 ft) / 1000",
        substitution: "2 x 1000 x 16.14 / 1000",
        result: "Rwire = 32.28 Ω",
      },
      {
        title: "Find total loop resistance and worst-case wire voltage drop",
        equation: "Rtotal = Rwire + Rreceiver          Vdrop(wire) = 20 mA x Rwire",
        substitution: "32.28 + 250 = 282.28 Ω;   0.020 x 32.28",
        result: "Rtotal = 282.28 Ω, wire voltage drop = 0.646 V at 20 mA",
      },
      {
        title: "Find voltage actually available at the transmitter terminals",
        equation: "Vtransmitter = Vsupply - (20 mA x Rtotal)",
        substitution: "24 - (0.020 x 282.28)",
        result: "Vtransmitter = 18.35 V",
      },
      {
        title: "Check headroom against the transmitter's minimum requirement",
        equation: "headroom = Vtransmitter - Vmin",
        substitution: "18.35 - 12",
        result: "headroom = 6.35 V — passes with real margin",
      },
      {
        title: "Find the maximum cable length this wire gauge could support",
        equation: "maxLoopOhms = (Vsupply - Vmin) / 20 mA;   maxLength = (maxLoopOhms - Rreceiver) / (2 x Ω per unit length)",
        substitution: "(24-12)/0.020 = 600 Ω available;   (600-250) / (2 x 0.01614)",
        result: "maxCableLength ≈ 10,843 ft — this run could be more than 10x longer before starving the transmitter",
      },
    ],
    resultSummary: [
      { check: "Transmitter terminal voltage at 20 mA", requirement: "≥ 12 V", actual: "18.35 V", pass: true },
      { check: "Headroom", requirement: "≥ 0 V", actual: "6.35 V", pass: true },
    ],
    finalAnswer: "This 1000 ft, 22 AWG loop delivers 18.35 V to the transmitter at worst-case 20 mA — 6.35 V of headroom above its 12 V minimum — and the same wire gauge and supply could actually support a run of nearly 10,843 ft before the transmitter would starve.",
    keyInsight: "The voltage budget check always has to use 20 mA (the worst case), not the loop's typical operating current — wire voltage drop is highest exactly when the loop is signaling its maximum value, which is precisely the condition that must never cause the transmitter to starve for voltage and clip its own output.",
    faqs: [
      {
        q: "What happens if a second device (like a local indicator) is added to the loop?",
        a: "Any additional series resistance — an indicator, a second barrier, an isolator — adds directly to Rtotal in the same way the receiver resistance does, reducing both the transmitter's available terminal voltage and the maximum supportable cable length. This calculator's 'other Ω' input exists specifically to let additional loop components be included in the same budget rather than being overlooked.",
      },
      {
        q: "Would a heavier wire gauge meaningfully extend the maximum run?",
        a: "Yes — resistance per unit length drops roughly by half with each two-gauge step up (e.g. 22 AWG to 18 AWG cuts resistance to about 40% of the 22 AWG value), which directly multiplies the maximum supportable length for the same voltage budget. For genuinely long runs approaching a wire gauge's practical limit, stepping up gauge is often more effective than trying to increase supply voltage, which has its own upper limits from device and barrier ratings.",
      },
    ],
  },

  {
    slug: "intrinsic-safety-entity-concept-cable-capacitance-fail",
    groupId: "instrumentation",
    calculatorHref: "/calculators/intrinsic-safety",
    calculatorName: "Intrinsic Safety (IS) Verification",
    title: "Worked Example: An IS Loop That Passes Voltage, Current and Power — But Fails on Cable Capacitance",
    dek: "Every basic entity-concept parameter checks out for this barrier and field device pairing — until a realistic 500 m cable run pushes total capacitance over the barrier's limit.",
    standard: "IEC 60079-11 / IEC 60079-14 entity concept",
    readTime: "11 min read",
    scenario: [
      { label: "Barrier (associated apparatus)", value: "Uo=28V, Io=93mA, Po=650mW, Co=0.083µF, Lo=4.2mH" },
      { label: "Field device (IS apparatus)", value: "Vmax=30V, Imax=130mA, Pmax=1000mW, Ci=5nF, Li=0µH" },
      { label: "Gas group", value: "IIC (most stringent — e.g. hydrogen)" },
      { label: "Field wiring", value: "500 m run, using standard 'unknown cable' assumptions: 197 pF/m, 0.656 µH/m" },
    ],
    steps: [
      {
        title: "Check the basic entity parameters: voltage, current, power",
        table: {
          headers: ["Parameter", "Barrier (safe side)", "Field device (limit)", "Result"],
          rows: [
            ["Voltage", "Uo = 28 V", "Vmax = 30 V", "PASS — 28 ≤ 30"],
            ["Current", "Io = 93 mA", "Imax = 130 mA", "PASS — 93 ≤ 130"],
            ["Power", "Po = 650 mW", "Pmax = 1000 mW", "PASS — 650 ≤ 1000"],
          ],
        },
      },
      {
        title: "Compute total cable capacitance and inductance for the 500 m run",
        equation: "cableCap = (pF/m x length) / 1000          cableInd = µH/m x length",
        substitution: "(197 x 500) / 1000 = 98.5 nF          0.656 x 500 = 328 µH",
        result: "Cable adds 98.5 nF and 328 µH",
      },
      {
        title: "Add the field device's own reactive parameters",
        equation: "totalCi = deviceCi + cableCap          totalLi = deviceLi + cableInd",
        substitution: "5 + 98.5 = 103.5 nF          0 + 328 = 328 µH",
        result: "totalCi = 103.5 nF, totalLi = 328 µH",
      },
      {
        title: "Check whether the 1% rule permits using the barrier's full Co/Lo",
        body: "IEC 60079-14's 1% rule allows using the full published Co/Lo (rather than halving both) if the field-side Li alone (excluding cable) is under 1% of Lo.",
        equation: "Li / (Lo x 1000) < 1%?",
        substitution: "0 / (4.2 x 1000) = 0%",
        result: "Rule applies — full Co (83 nF) and Lo (4.2 mH) may be used, no halving required",
      },
      {
        title: "Compare total capacitance and inductance against the barrier's limits",
        table: {
          headers: ["Parameter", "Barrier limit", "Total (device + cable)", "Result"],
          rows: [
            ["Capacitance", "Co = 83 nF", "103.5 nF", "FAIL — 103.5 > 83"],
            ["Inductance", "Lo = 4200 µH", "328 µH", "PASS — 328 < 4200"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "Voltage, current, power", requirement: "All within barrier limits", actual: "All pass", pass: true },
      { check: "Total inductance", requirement: "≤ 4200 µH", actual: "328 µH", pass: true },
      { check: "Total capacitance", requirement: "≤ 83 nF", actual: "103.5 nF", pass: false },
    ],
    finalAnswer: "This combination fails overall — not on voltage, current or power, which all clear their limits comfortably, but specifically on total capacitance: the 500 m cable run alone contributes 98.5 nF, pushing total capacitance to 103.5 nF against an 83 nF barrier limit.",
    keyInsight: "A loop can pass every 'obvious' entity-concept check (voltage, current, power all look fine) and still fail intrinsic safety verification on cable capacitance or inductance — these reactive parameters are exactly what long cable runs quietly accumulate, and they're easy to overlook if the check stops at voltage/current/power without also totaling cable-contributed Ci and Li against the barrier's Co and Lo.",
    faqs: [
      {
        q: "What are the practical fixes for this capacitance failure?",
        a: "Shortening the cable run (roughly to under 400 m at this cable's 197 pF/m rating would bring total capacitance under 83 nF), using a lower-capacitance cable type, or selecting a barrier with a higher Co rating are the three main levers — the field device's own Ci (5 nF) is a small fraction of the total, so the cable is clearly the dominant contributor and the most effective place to intervene.",
      },
      {
        q: "Why does inductance pass so comfortably while capacitance fails?",
        a: "This particular cable's inductance-per-meter (0.656 µH/m) and the barrier's Lo (4200 µH) leave far more headroom relative to a 500 m run than the capacitance side does — but this balance is entirely cable- and barrier-specific; a different barrier/cable combination could just as easily show the opposite pattern, which is exactly why both parameters have to be checked independently rather than assuming one implies the other.",
      },
    ],
  },

  {
    slug: "thermocouple-cjc-rtd-lead-wire-compensation",
    groupId: "instrumentation",
    calculatorHref: "/calculators/thermocouple-rtd",
    calculatorName: "Thermocouple & RTD",
    title: "Worked Example: Cold-Junction Compensation and RTD Lead-Wire Error, Side by Side",
    dek: "A K-type thermocouple reading corrected for its cold junction, and the same raw Pt100 resistance interpreted three different ways depending on wiring configuration.",
    standard: "NIST ITS-90 / IEC 60751",
    readTime: "10 min read",
    scenario: [
      { label: "Thermocouple type", value: "K-type" },
      { label: "Measured (raw) thermocouple voltage", value: "10.153 mV" },
      { label: "Cold-junction (terminal block) temperature", value: "25°C" },
      { label: "RTD", value: "Pt100 (R0 = 100 Ω)" },
      { label: "Measured resistance", value: "108.5 Ω" },
      { label: "Lead resistance (if known)", value: "0.5 Ω per conductor" },
    ],
    steps: [
      {
        title: "Find the cold junction's equivalent millivolt output",
        body: "A thermocouple only measures the voltage difference between its hot and cold junctions — the cold junction's own temperature has to be converted to an equivalent mV and added back in, using the same trusted NIST ITS-90 inverse polynomial (inverted numerically) rather than a separately-fitted forward curve.",
        result: "25°C cold junction ≈ 1.001 mV equivalent (K-type)",
      },
      {
        title: "Add the cold-junction equivalent to the raw measured voltage",
        equation: "totalMv = measuredMv + cjcEquivalentMv",
        substitution: "10.153 + 1.001",
        result: "totalMv = 11.154 mV",
      },
      {
        title: "Convert total voltage to the true (compensated) hot-junction temperature",
        result: "Hot junction temperature = 274.5°C",
      },
      {
        title: "Compare RTD temperature reading across three lead-wire configurations",
        body: "Using the same raw 108.5 Ω measurement and 0.5 Ω/conductor lead resistance in each case.",
        table: {
          headers: ["Wiring", "Compensated resistance", "Resulting temperature"],
          rows: [
            ["2-wire", "107.5 Ω (both leads subtracted)", "19.24°C"],
            ["3-wire", "108.0 Ω (lead resistance substantially cancelled)", "20.53°C"],
            ["4-wire (Kelvin)", "108.5 Ω (unchanged — no lead error)", "21.82°C"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "Thermocouple compensated hot-junction temperature", requirement: "n/a (this is the result)", actual: "274.5°C", pass: true },
      { check: "RTD reading spread across wiring methods (same raw resistance)", requirement: "n/a (informational)", actual: "19.24°C to 21.82°C — a 2.58°C spread", pass: true },
    ],
    finalAnswer: "Cold-junction compensation adds 1.001 mV to this thermocouple's raw 10.153 mV reading, revealing a true hot-junction temperature of 274.5°C. Separately, the exact same 108.5 Ω raw RTD measurement yields anywhere from 19.24°C to 21.82°C purely depending on which of the three lead-wire configurations is used to interpret it.",
    keyInsight: "A raw sensor reading is meaningless without knowing exactly how it needs to be interpreted — a thermocouple's raw millivolts are useless without cold-junction compensation, and an RTD's raw resistance carries real, quantifiable error from lead-wire resistance unless the wiring configuration (and ideally 4-wire Kelvin sensing) removes it. Both errors are entirely predictable and correctable, which is exactly why instrumentation specifications call out cold-junction compensation method and RTD wiring configuration explicitly rather than leaving them to assumption.",
    faqs: [
      {
        q: "Why does the RTD reading change even though the calculator 'corrects' for lead resistance in the 2-wire and 3-wire cases?",
        a: "The correction only works as well as the assumed lead resistance value actually matches reality — a 2-wire configuration has no independent way to measure its own lead resistance, so any correction applied depends on a separately estimated or datasheet lead-resistance figure, which is exactly why the 2-wire note calls it 'the largest source of error over long runs': the correction is only as good as that external assumption, unlike 4-wire sensing which measures true resistance directly regardless of lead length.",
      },
      {
        q: "Why can't a simple linear approximation replace the NIST inverse polynomial for thermocouples?",
        a: "Thermocouple output is genuinely non-linear across their working temperature range — a linear approximation (using a single fixed mV/°C slope) introduces increasing error the further the reading is from the calibration point it was based on, which is exactly why NIST publishes higher-order polynomial coefficients spanning specific voltage ranges, each fitted to accurately track the real non-linear thermoelectric behavior of that thermocouple type.",
      },
    ],
  },

  {
    slug: "fire-gas-loop-standby-alarm-voltage-budget",
    groupId: "instrumentation",
    calculatorHref: "/calculators/fg-loop",
    calculatorName: "Fire & Gas Detection Loop Budget",
    title: "Worked Example: Standby and Alarm Voltage at the Farthest Device on a 10-Detector Loop",
    dek: "A ten-detector initiating device circuit, checked in both its quiet standby state and its worst-case alarm state — both comfortably clear the minimum operating voltage.",
    standard: "Ohm's-law loop-budget model, consistent with NFPA 72 IDC design practice",
    readTime: "8 min read",
    scenario: [
      { label: "Supply voltage", value: "24 V" },
      { label: "Number of devices", value: "10" },
      { label: "Standby draw per device", value: "0.5 mA" },
      { label: "Alarm draw per device", value: "30 mA" },
      { label: "Devices alarming simultaneously (worst case)", value: "1" },
      { label: "End-of-line resistor", value: "10,000 Ω" },
      { label: "Loop wiring resistance (round trip)", value: "20 Ω" },
      { label: "Minimum operating voltage at farthest device", value: "16 V" },
    ],
    steps: [
      {
        title: "Compute standby-state current",
        equation: "Istandby = (numDevices x standbyMa) / 1000 + (Vsupply / Reol)",
        substitution: "(10 x 0.5) / 1000 + (24 / 10,000)",
        result: "Istandby = 0.0074 A (7.4 mA)",
      },
      {
        title: "Compute standby voltage at the farthest device",
        equation: "Vdevice = Vsupply - (Istandby x Rloop)",
        substitution: "24 - (0.0074 x 20)",
        result: "Vdevice(standby) = 23.85 V — passes the 16 V minimum easily",
      },
      {
        title: "Compute worst-case alarm-state current",
        body: "One device switches to full alarm draw; the other nine remain at their standby draw.",
        equation: "Ialarm = (nAlarm x alarmMa + nStandby x standbyMa) / 1000 + EOLcurrent",
        substitution: "(1 x 30 + 9 x 0.5) / 1000 + 0.0024",
        result: "Ialarm = 0.0369 A (36.9 mA)",
      },
      {
        title: "Compute alarm-state voltage at the farthest device",
        equation: "Vdevice = Vsupply - (Ialarm x Rloop)",
        substitution: "24 - (0.0369 x 20)",
        result: "Vdevice(alarm) = 23.26 V — still passes the 16 V minimum with wide margin",
      },
    ],
    resultSummary: [
      { check: "Standby-state device voltage", requirement: "≥ 16 V", actual: "23.85 V", pass: true },
      { check: "Alarm-state device voltage", requirement: "≥ 16 V", actual: "23.26 V", pass: true },
    ],
    finalAnswer: "Both the quiescent standby condition (23.85 V) and the worst-case single-device alarm condition (23.26 V) leave this loop's farthest device well above its 16 V minimum operating voltage — this loop has substantial headroom for either more devices or a longer wiring run.",
    keyInsight: "Alarm-state voltage barely differs from standby-state voltage here (23.26 V vs 23.85 V) because only one device alarms at a time in this scenario — the moment more devices can alarm simultaneously (a real possibility in an actual fire event with multiple detectors triggering), alarm current climbs much faster and voltage at the farthest device drops correspondingly, which is exactly why 'worst-case simultaneous alarm count' is a deliberately conservative, adjustable input rather than always assuming just one device trips.",
    faqs: [
      {
        q: "Why check both standby and alarm states instead of just the worst case?",
        a: "Standby current is what the loop carries essentially all the time (supervising for wiring faults and device health), so it needs its own check for continuous reliable operation — while alarm current is a transient, higher-draw condition that has to be verified separately because it's the condition the whole system exists to detect and respond to correctly. A loop could pass one check and fail the other, so both need independent verification.",
      },
      {
        q: "Why does the EOL resistor matter for standby current?",
        a: "The end-of-line resistor provides continuous supervisory current specifically so the panel can distinguish a healthy loop from an open or short circuit — this small but constant EOL current adds to standby loop current and therefore standby voltage drop, which is why the calculator includes it in the standby calculation, though its relative contribution shrinks during alarm when device current dominates.",
      },
    ],
  },
];
