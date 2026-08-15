// Category guide: Motors & Drives.

import type { GuideDoc } from "./types";

export const MOTORS_GUIDE: GuideDoc = {
  slug: "motors-drives",
  groupId: "motors",
  title: "Motors & Drives: A Practical Guide to Motor Circuits and VFD Savings",
  dek: "Why a motor circuit needs two genuinely different protective devices doing two different jobs, how overload relay trip class is chosen, and why VFD energy-savings estimates are deliberately conservative.",
  readTime: "11 min read",
  intro: [
    "A motor is one of the few loads in a typical electrical system that has a dramatically different startup behavior from its running behavior — drawing several times its running current for a few seconds every time it starts, then settling to a much lower steady value. This category's calculators exist because that gap between starting and running behavior is exactly what makes motor circuit design different from ordinary load circuit design: everything from conductor sizing to protective device selection to contactor duty rating has to accommodate a legitimate, repeated inrush transient without treating it as a fault.",
      "The three calculators here cover circuit sizing, protection sizing, and one specific but common retrofit decision (switching a pump or fan from throttled to variable-speed control) — together spanning both the initial design of a motor circuit and one of the more common ways an existing motor installation gets revisited later for energy savings.",
  ],
  coreConcepts: [
    {
      heading: "Full-load current tables vs. a specific motor's actual nameplate current",
      body: [
        "NEC Article 430 branch-circuit and overcurrent protective device sizing is based on standardized full-load current (FLC) tables (Table 430.248 for single-phase, Table 430.250 for three-phase) looked up by the motor's horsepower and voltage — not the specific motor's actual nameplate current. This is a deliberate design choice: sizing conductors and protective devices off a standardized table keeps circuit design consistent regardless of which manufacturer's motor is ultimately installed for a given horsepower rating, since two different manufacturers' motors of the 'same' horsepower can have slightly different actual nameplate currents. Overload protection is the one place a motor's own real nameplate current becomes directly relevant, precisely because overload protection exists to protect that specific physical unit's winding insulation from overheating — the table value is a code-basis abstraction, the nameplate value is what actually flows through that particular motor.",
      ],
    },
    {
      heading: "Two protective devices, two different jobs — and why they're never interchangeable",
      body: [
        "Every motor circuit needs two functionally distinct protective elements, and confusing their roles is one of the most consequential mistakes possible in this category. Branch-circuit short-circuit protection (a breaker or fuse, sized under NEC 430.52 well above full-load current — commonly 150-300% of FLC depending on device type) exists purely to clear a genuine short circuit or ground fault fast, and is deliberately sized loose enough to ride through the motor's normal starting inrush without nuisance tripping. Overload protection (a thermal or electronic overload relay, sized much closer to full-load current — typically 115-125% of FLC) exists to protect the motor's own winding insulation from sustained overload conditions that are well below short-circuit level but still damaging if allowed to persist. A device sized for one job cannot do the other's job: a short-circuit protective device sized loose enough to tolerate starting inrush would never trip in time to protect the motor from a sustained mild overload, while an overload relay sized close to FLC would trip immediately on every normal start.",
      ],
    },
    {
      heading: "Overload relay trip class: matched to starting time, not motor size",
      body: [
        "IEC 60947-4-1 defines standard overload relay trip classes (10A, 10, 20, 30 — named for the maximum time in seconds the relay is allowed to take to trip at 7.2 times its current setting), and the right class for a given motor is chosen based on how long that motor's load legitimately takes to accelerate to full speed, not the motor's horsepower. A light, quick-starting load (Class 10A or 10) needs a relay that trips relatively fast on a genuine stall, since its normal start is already brief. A heavy, high-inertia load — a large fan, a compressor, a crusher — can legitimately take much longer to accelerate, and needs a slower Class 20 or 30 relay specifically so the relay doesn't misinterpret a long but entirely normal start as a stall condition and nuisance-trip partway through every startup.",
      ],
    },
    {
      heading: "Contactor duty: AC-3 vs. AC-4, and why there's no universal conversion ratio",
      body: [
        "IEC 60947-4-1's utilization categories describe how demanding a contactor's actual switching duty is, not just the current it carries. AC-3 covers normal starting and stopping of squirrel-cage motors — the default, least severe case, where the contactor mostly just closes once at start and opens once at stop. AC-4 covers jogging, plugging, and reversing duty — repeatedly interrupting the motor while it's still drawing near-starting current, which is a meaningfully harsher duty on the contactor's contacts than a single clean start/stop cycle. Critically, there is no single standard-mandated ratio between a contactor's AC-3 and AC-4 current ratings — that relationship is manufacturer- and model-specific, so any general multiplier (a commonly used conservative rule of thumb is roughly 2x) should always be checked against the specific contactor's own published AC-3/AC-4 utilization tables before final selection, not trusted as a universal constant.",
      ],
    },
    {
      heading: "Starting method and voltage dip",
      body: [
        "How a motor is started — direct-on-line (DOL), star-delta, soft starter, or VFD — changes both the peak starting current the circuit has to tolerate and how much that starting current disturbs voltage elsewhere on the same supply. DOL starting draws the highest inrush (commonly several times FLC) for the shortest duration; star-delta and soft starters reduce peak starting current at the cost of reduced starting torque; a VFD ramps current up much more gradually still. The voltage-dip consequence of a large DOL start matters most on a limited-capacity source — a generator or a weak grid connection — where a large motor starting can pull system voltage down enough to disturb other connected loads momentarily, which is exactly the check this category's calculators (and the genset sizing calculator in the Transformers, CT/VT & Condition Testing category) perform before assuming a given starting method is acceptable on a given source.",
      ],
    },
    {
      heading: "VFD energy savings: affinity laws, and why the estimate is deliberately conservative",
      body: [
        "For centrifugal pumps and fans specifically, the affinity laws are simple but powerful: flow rate scales roughly linearly with speed, while power draw scales roughly with speed cubed. That cubic relationship is why even a modest reduction in flow requirement — achieved by slowing the pump or fan down with a VFD rather than throttling a valve or damper at full speed — can produce a disproportionately large power reduction, which is the whole economic case for VFD retrofits on variable-flow applications.",
        "The baseline comparison matters enormously to the result, though: this category's VFD savings calculator defaults to a conservative assumption that throttled (valve/damper) control barely reduces motor power at reduced flow — a deliberately cautious simplification, not a fitted curve for any specific real pump or fan. Real throttled-control power at reduced flow can vary meaningfully depending on the specific pump/fan curve and the type of flow-control device used, so a genuinely bankable savings estimate for a specific retrofit decision should use actual trended power data or manufacturer pump/fan curves rather than the default conservative baseline alone — the calculator's default is intentionally a safe first-pass estimate, not a final number.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "NEC Article 430 (incl. 430.6, 430.52, 430.32)", scope: "Motor full-load current tables, branch-circuit short-circuit protection sizing (ride-through of starting inrush), and overload protection sizing (close to actual full-load current)." },
    { standard: "IEC 60947-4-1", scope: "Overload relay standard trip classes (10A/10/20/30) and contactor utilization categories (AC-3 normal duty, AC-4 severe jogging/plugging/reversing duty)." },
    { standard: "IEC 60034-1", scope: "Motor duty type classification (S1 continuous through S8 continuous-periodic with speed changes), used to flag when a simple overload relay isn't appropriate for cyclic/intermittent duty." },
    { standard: "DOE/utility VFD retrofit guidance", scope: "General industry practice for the centrifugal-load affinity laws (flow ∝ speed, power ∝ speed³) used in VFD energy-savings estimates — textbook fluid-machinery physics, not a single numbered standard." },
  ],
  workflow: [
    {
      title: "Determine full-load current and size the branch circuit, OCPD, and disconnect",
      body: "Start from the motor's horsepower/voltage (NEC table lookup) or nameplate current (IEC method) to size conductors, short-circuit protection, and the disconnect.",
      calculatorHref: "/calculators/motor-calculator",
      calculatorName: "Motor Calculator",
    },
    {
      title: "Size overload protection, contactor duty, and ground-fault pickup separately",
      body: "Choose overload relay setting and trip class based on the motor's actual starting/acceleration behavior, and confirm contactor duty rating and ground-fault protection guidance.",
      calculatorHref: "/calculators/motor-protection-sizer",
      calculatorName: "Motor Protection Sizer",
    },
    {
      title: "For centrifugal pumps/fans, evaluate a VFD retrofit's energy savings",
      body: "Estimate the power and cost savings of switching from throttled to VFD speed control, using the affinity laws — then feed the result into a full payback analysis if needed.",
      calculatorHref: "/calculators/vfd-savings",
      calculatorName: "Pump/Fan VFD Energy Savings",
    },
  ],
  commonMistakes: [
    {
      mistake: "Treating branch-circuit short-circuit protection and overload protection as interchangeable or redundant",
      whyItMatters: "They perform genuinely different jobs at genuinely different current levels — short-circuit protection is sized loose to ride through starting inrush and only reacts to a true fault, while overload protection is sized close to full-load current specifically to catch sustained overload that short-circuit protection would never see. A circuit missing either one is missing real protection, not just redundant protection.",
    },
    {
      mistake: "Selecting overload relay trip class based on motor horsepower rather than actual starting/acceleration time",
      whyItMatters: "Trip class is about how long the relay tolerates elevated current before tripping, which needs to match how long that specific load legitimately takes to start — a high-inertia load given too fast a trip class (e.g. Class 10 on a load that needs Class 30) will nuisance-trip on every normal start.",
    },
    {
      mistake: "Assuming a fixed AC-4:AC-3 contactor rating ratio (like the common 2x rule of thumb) applies to any contactor",
      whyItMatters: "There is no standard-mandated ratio between these ratings — it's manufacturer- and model-specific, so a generic multiplier should only be used as a rough first estimate and always confirmed against that specific contactor's own published utilization tables before final selection.",
    },
    {
      mistake: "Starting a large motor DOL on a limited-capacity source without checking voltage dip",
      whyItMatters: "DOL starting draws the highest inrush of the common starting methods — on a generator or otherwise limited-capacity source, that inrush can pull system voltage down enough to disturb other connected equipment, which is exactly why a voltage-dip check against the source's available capacity matters before assuming any starting method is acceptable.",
    },
    {
      mistake: "Treating the default VFD savings estimate as a guaranteed, bankable figure",
      whyItMatters: "The default throttled-baseline assumption is a deliberately conservative simplification, not a fitted curve for any specific real pump or fan — an investment-grade savings estimate needs actual trended power data or manufacturer pump/fan curves, not the calculator's conservative default baseline alone.",
    },
  ],
  faqs: [
    {
      q: "Why are motor circuit sizing and motor protection sizing two separate calculators instead of one?",
      a: "They correspond to two genuinely different protective functions with different sizing rules and different current levels — branch-circuit/OCPD sizing (which has to ride through starting inrush) and overload/contactor/ground-fault sizing (which has to protect the motor from sustained overload and match its actual switching duty) are separate design decisions, even though both apply to the same physical motor circuit.",
    },
    {
      q: "Does switching a motor to VFD control always save energy?",
      a: "Only for loads where flow or output genuinely needs to vary and was previously being throttled at full speed — the affinity laws' power-savings benefit comes specifically from slowing the motor down rather than running it at full speed and wasting the excess as throttling losses. A motor that already runs at a constant, fully-utilized output for its entire duty cycle has little or no throttling loss to eliminate, so a VFD retrofit there would add cost without a comparable energy-savings return.",
    },
  ],
};
