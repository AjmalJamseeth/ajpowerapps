// Worked examples for the Transformers, CT/VT & Condition Testing group.
// Every numeric value was produced by running the calculator's own verified
// engine (ct.ts / vt.ts / xfmrsizer.ts / genxfmr.ts / busbar.ts /
// insulationresistance.ts / polarizationindex.ts) directly with tsx, not
// hand-typed.

import type { WorkedExample } from "./types";

export const TRANSFORMERS_EXAMPLES: WorkedExample[] = [
  {
    slug: "ct-sizing-knee-point-voltage-saturation-margin",
    groupId: "transformers",
    calculatorHref: "/calculators/ct-sizing",
    calculatorName: "CT Sizing & Saturation",
    title: "Worked Example: Does a 150 V Knee-Point CT Have Enough Margin for ALF 20?",
    dek: "A 400/1 A protection CT with a 150 V knee point, checked against the required knee-point voltage for its stated accuracy limit factor — and what happens to its output once the fault current exceeds that limit.",
    standard: "IEC 61869-2",
    readTime: "9 min read",
    scenario: [
      { label: "CT ratio", value: "400 : 1 A" },
      { label: "Required accuracy limit factor (ALF)", value: "20" },
      { label: "Knee-point voltage (nameplate)", value: "150 V" },
      { label: "CT secondary winding resistance", value: "2.5 Ω" },
      { label: "Burden", value: "Protection relay, 2.5 VA" },
      { label: "Lead run", value: "20 m one-way, 2.5 mm² Cu, go-and-return loop" },
    ],
    steps: [
      {
        title: "Compute lead resistance and total burden resistance",
        equation: "Rlead = ρ x return factor x L / A          Rrelay = VA / Isecondary²",
        substitution: "Rlead = 0.0175 x 2 x 20 / 2.5 = 0.28 Ω          Rrelay = 2.5 / 1² = 2.5 Ω",
        result: "Rb = Rlead + Rrelay = 2.78 Ω",
      },
      {
        title: "Compute the required knee-point voltage for ALF 20",
        equation: "Vk(required) = ALF x Is x (Rct + Rb)",
        substitution: "20 x 1 x (2.5 + 2.78)",
        result: "Vk(required) = 105.6 V",
      },
      {
        title: "Compare against the CT's actual knee-point voltage",
        equation: "Vk(actual) ≥ Vk(required)?",
        substitution: "150 V ≥ 105.6 V",
        result: "Passes, with about 42% margin",
      },
      {
        title: "Find the CT's actual achievable ALF at this burden",
        equation: "ALF(actual) = Vk(actual) / [Is x (Rct + Rb)]",
        substitution: "150 / [1 x (2.5 + 2.78)]",
        result: "ALF(actual) = 28.4 — this CT can actually support up to about 28.4x rated current before saturating at this burden",
      },
      {
        title: "See what happens to secondary output beyond the ALF",
        body: "The fault-current table sweeps multiples of rated primary current and caps the ideal (linear) secondary output at the rated ALF, showing where the CT's output stops faithfully following the primary current.",
        table: {
          headers: ["Fault multiple", "Primary current", "Ideal secondary (linear)", "Actual output at ALF cap"],
          rows: [
            ["20x (rated ALF)", "8000 A", "20 A", "20 A — still linear"],
            ["50x", "20,000 A", "50 A", "20 A — capped, CT has saturated"],
          ],
        },
      },
    ],
    resultSummary: [
      { check: "Knee-point voltage vs. required for ALF 20", requirement: "≥ 105.6 V", actual: "150 V", pass: true },
      { check: "Actual achievable ALF at this burden", requirement: "n/a (informational)", actual: "28.4", pass: true },
    ],
    finalAnswer: "This CT comfortably supports its stated ALF 20 requirement, with enough real margin (actual ALF ≈ 28.4) to still deliver a faithful secondary current up to about 28 times rated primary current before saturating — beyond that, at 50x rated current in this example, the output simply flattens at 20 A instead of continuing to rise.",
    keyInsight: "A CT's accuracy limit factor isn't a hard cutoff where the CT stops working — it's the point beyond which the secondary current stops accurately representing the primary current because the core saturates. A protection relay that needs to see the true fault current magnitude at very high multiples (not just detect that a fault occurred) needs a CT with enough real margin above the fault current it will actually see, not just enough to clear the nameplate ALF requirement.",
    faqs: [
      {
        q: "Why does lead length matter so much for CT accuracy?",
        a: "Lead resistance adds directly to the total secondary burden the CT has to drive, and burden is one of the two terms (along with CT winding resistance) that determines the required knee-point voltage — a longer or thinner lead run increases Rb, which increases the required Vk for the same ALF, meaning a CT that comfortably meets its accuracy requirement with short leads can fail to meet it if installed with a long lead run to a distant relay panel.",
      },
      {
        q: "What would happen if the relay actually needed to see fault current at 50x rated?",
        a: "With this CT's actual achievable ALF of about 28.4, secondary output saturates well before reaching 50x — the relay would see a current signal that plateaus around 20 A regardless of how much larger the actual primary fault current becomes, which could cause a protection scheme relying on accurate magnitude (like some differential or distance protection) to misoperate. This is exactly why the required ALF should be chosen based on the actual maximum fault current the CT needs to represent faithfully, with margin, not just a generic default value.",
      },
    ],
  },

  {
    slug: "vt-sizing-burden-loading-accuracy-band",
    groupId: "transformers",
    calculatorHref: "/calculators/vt-sizing",
    calculatorName: "VT Sizing",
    title: "Worked Example: Selecting a Standard VA Rating That Keeps a VT Inside Its Accuracy Band",
    dek: "An 11 kV phase-to-earth VT feeding a relay and a meter — sized to a standard VA rating that keeps it loaded in the specific percentage window where accuracy class is actually guaranteed.",
    standard: "IEC 61869-3",
    readTime: "9 min read",
    scenario: [
      { label: "System voltage", value: "11 kV, phase-to-earth connection, directly earthed neutral" },
      { label: "Secondary voltage", value: "110 V (line convention)" },
      { label: "Burden", value: "Protection relay 5 VA + multifunction meter 3 VA = 8 VA total" },
      { label: "Lead run", value: "30 m one-way, 2.5 mm² Cu, go-and-return loop" },
    ],
    steps: [
      {
        title: "Find the voltage factor for this earthing arrangement",
        body: "A directly (solidly) earthed neutral system permits continuous operation at the standard 1.2x voltage factor — no fault-condition overvoltage margin beyond that is needed.",
        result: "Vf = 1.2, continuous rating",
      },
      {
        title: "Compute the rated primary and secondary voltages the VT actually sees",
        equation: "Up = Vline / √3 (phase-to-earth)          Us = Vsecondary / √3",
        substitution: "Up = 11 / 1.732 = 6.351 kV          Us = 110 / 1.732 = 63.51 V",
        result: "Up = 6.351 kV, Us = 63.51 V, turns ratio n = 100",
      },
      {
        title: "Sum the connected burden and select a standard VA rating",
        equation: "Total burden = sum of all connected devices",
        substitution: "5 + 3",
        result: "Total burden = 8 VA -> next standard size = 10 VA",
      },
      {
        title: "Check where the actual loading falls within the accuracy band",
        body: "Accuracy class is only guaranteed within a specific loading window — too lightly loaded and error behavior isn't validated by the standard either.",
        equation: "Load% = burden / selected VA rating",
        substitution: "8 / 10 x 100",
        result: "Load = 80% — within the 25%-100% window where accuracy class is maintained",
      },
      {
        title: "Check the lead voltage drop",
        equation: "Vdrop = Ilead x Rlead,   Ilead = burden / Us",
        substitution: "Ilead = 8 / 63.51 = 0.126 A;   Rlead = 0.42 Ω;   Vdrop = 0.126 x 0.42",
        result: "Vdrop = 0.053 V = 0.083% of Us — negligible",
      },
    ],
    resultSummary: [
      { check: "VT loading within accuracy-maintaining band", requirement: "25%–100% of rated VA", actual: "80% of 10 VA", pass: true },
      { check: "Lead voltage drop", requirement: "n/a (informational — should stay small)", actual: "0.083%", pass: true },
    ],
    finalAnswer: "A 10 VA standard VT rating keeps this 8 VA burden loaded at 80% — comfortably inside the 25-100% window where the stated accuracy class is actually guaranteed, with a negligible 0.083% lead voltage drop.",
    keyInsight: "Oversizing a VT's VA rating 'to be safe' can actually make accuracy worse, not better — a VT loaded well under 25% of its rated burden falls outside the range the accuracy class is validated for, the same way a VT overloaded above 100% does. The right target is comfortably inside that window, not simply as much headroom as possible.",
    faqs: [
      {
        q: "Why would picking a 50 VA VT instead of 10 VA be a problem here?",
        a: "The same 8 VA burden on a 50 VA-rated VT would only load it to 16% — below the 25% floor where the standard's accuracy class guarantee applies, meaning the VT's ratio and phase error at that light loading are technically unspecified by the accuracy class, even though nothing is being overloaded. Matching the standard VA rating reasonably closely to the actual expected burden, not just picking the largest available size, is what keeps the VT inside its guaranteed accuracy window.",
      },
      {
        q: "What changes for an ungrounded or resistance-earthed system instead of solidly earthed?",
        a: "The voltage factor increases substantially — from 1.2x continuous for a directly earthed system up to 1.9x for 8 hours on a resistance- or Petersen-coil-earthed system without automatic fault clearance, because the VT has to survive a sustained earth fault where the healthy phases rise toward full line-to-line voltage rather than being cleared quickly. This changes the VT's required insulation and thermal rating, not just its burden calculation.",
      },
    ],
  },

  {
    slug: "transformer-sizing-n-1-redundant-pair-derating",
    groupId: "transformers",
    calculatorHref: "/calculators/transformer-sizer",
    calculatorName: "Transformer Sizer",
    title: "Worked Example: Sizing an N-1 Redundant Transformer Pair with Ambient Derating",
    dek: "An 800 kW load with growth margin, hot-climate derating, and full N-1 redundancy — each of the two installed transformers has to be able to carry the entire load alone.",
    standard: "IEC 60076-1/-2",
    readTime: "10 min read",
    scenario: [
      { label: "Connected load", value: "800 kW at 0.9 power factor" },
      { label: "Growth margin", value: "15%" },
      { label: "Safety margin", value: "10%" },
      { label: "Ambient temperature", value: "45°C (reference is 40°C per IEC 60076)" },
      { label: "Altitude", value: "1000 m (reference/threshold)" },
      { label: "Cooling class", value: "Oil-immersed, natural cooling (ONAN)" },
      { label: "Redundancy", value: "2 identical units, N-1 (either one must carry full load alone)" },
    ],
    steps: [
      {
        title: "Convert connected load to kVA",
        equation: "designLoadKva = kW / PF",
        substitution: "800 / 0.9",
        result: "designLoadKva = 888.9 kVA",
      },
      {
        title: "Apply growth and safety margins",
        equation: "marginedLoad = designLoad x (1 + growth%) x (1 + safety%)",
        substitution: "888.9 x 1.15 x 1.10",
        result: "marginedLoad = 1124.4 kVA",
      },
      {
        title: "Apply ambient temperature derating",
        body: "IEC 60076 references 40°C max ambient for a transformer's nameplate rating; above that, capacity is commonly derated at roughly 1.25% per °C (an engineering rule of thumb, not the standard's own hot-spot thermal model).",
        equation: "ambientDerate = 1 - max(0, ambient - 40) x 0.0125",
        substitution: "1 - (45 - 40) x 0.0125",
        result: "ambientDerate = 0.9375 (a 6.25% capacity reduction)",
      },
      {
        title: "Apply altitude derating (none triggered here)",
        result: "At exactly 1000 m — the threshold — no altitude derating applies; altitudeDerate = 1.0",
      },
      {
        title: "Find the effective required capacity and per-unit size for N-1",
        equation: "effectiveRequired = marginedLoad / totalDerate          perUnit = effectiveRequired / (N - 1)",
        substitution: "1124.4 / 0.9375 = 1199.4 kVA;   with N = 2, N-1 = 1, so perUnit = 1199.4 / 1",
        result: "Each unit must be sized for the full 1199.4 kVA effective load",
      },
      {
        title: "Round up to the nearest standard size and total installed capacity",
        result: "Recommended = 1500 kVA per unit (ANSI/IEEE standard size) -> total installed = 3000 kVA across both units",
      },
    ],
    resultSummary: [
      { check: "Per-unit required capacity", requirement: "n/a (this is the computed sizing target)", actual: "1199.4 kVA", pass: true },
      { check: "Recommended standard transformer size", requirement: "n/a (this is the result)", actual: "1500 kVA x 2 units", pass: true },
    ],
    finalAnswer: "Even though the actual load only needs about 1199 kVA of effective capacity, full N-1 redundancy means both installed transformers must be rated at 1500 kVA each — 3000 kVA of total installed capacity to reliably deliver about 1200 kVA, a direct and often underappreciated cost of true redundancy.",
    keyInsight: "N-1 redundancy for two units means each one is sized for 100% of the load, not 50% — doubling unit count doesn't halve each unit's required size the way it might intuitively seem to, because the whole point of N-1 is that the system must survive losing any single unit and still carry the full load on what remains.",
    faqs: [
      {
        q: "What if there were three transformers instead of two, still N-1?",
        a: "With three identical units and N-1 redundancy, any two of the three must be able to carry the full load between them, so each unit is sized for effectiveRequired / 2 rather than effectiveRequired / 1 — a meaningfully smaller per-unit size than the two-transformer case, though total installed capacity (3 x that smaller size) doesn't necessarily drop as much as per-unit size alone suggests.",
      },
      {
        q: "Why derate for ambient temperature but reference 40°C specifically?",
        a: "40°C max ambient (with a 30°C monthly average and 20°C yearly average) is IEC 60076's own standard reference service condition that a transformer's nameplate rating is defined against — a transformer isn't 'derated' for operating at exactly its reference conditions, only for operating in a hotter environment than the nameplate rating assumes, which is exactly the 45°C site condition in this example.",
      },
    ],
  },

  {
    slug: "genset-sizing-running-load-vs-motor-starting-dip",
    groupId: "transformers",
    calculatorHref: "/calculators/gen-xfmr",
    calculatorName: "Generator & Transformer Analysis",
    title: "Worked Example: Genset Sizing — When Running Load Governs Over Motor-Starting Dip",
    dek: "Two independent generator-sizing checks — steady running capacity and motor-starting voltage dip — with running load turning out to be the larger, governing requirement in this case.",
    standard: "Generator sizing application-guide practice",
    readTime: "9 min read",
    scenario: [
      { label: "Linear (steady) load", value: "300 kW at 0.85 power factor" },
      { label: "Non-linear load", value: "100 kVA, with a 1.5x non-linear derating factor" },
      { label: "Largest motor starting load", value: "240 kVA starting kVA" },
      { label: "Generator subtransient reactance (Xd'')", value: "0.15 p.u." },
      { label: "Maximum acceptable voltage dip", value: "15%" },
    ],
    steps: [
      {
        title: "Compute running capacity requirement",
        equation: "runKva = (linearKw / PF) + nonlinearKva x derateFactor",
        substitution: "(300 / 0.85) + (100 x 1.5)",
        result: "runKva = 352.9 + 150 = 502.9 kVA",
      },
      {
        title: "Compute the generator size needed to limit motor-starting voltage dip",
        equation: "dipReqKva = (motorStartKva x Xd'') / (maxDip% / 100)",
        substitution: "(240 x 0.15) / 0.15",
        result: "dipReqKva = 240 kVA",
      },
      {
        title: "Compare the two requirements and find the governing one",
        table: {
          headers: ["Requirement", "Size needed", "Governs?"],
          rows: [
            ["Running load", "502.9 kVA", "Yes — larger of the two"],
            ["Motor-starting dip", "240 kVA", "No"],
          ],
        },
        result: "Running load governs at 502.9 kVA",
      },
      {
        title: "Estimate fuel consumption and hourly running cost at the recommended size",
        body: "Using the conventional 0.8 power factor genset rating basis.",
        equation: "kW at full load = recommendedKva x 0.8          fuelRate = SFC x kW",
        substitution: "kW = 502.9 x 0.8 = 402.4;   fuelRate = 0.25 x 402.4",
        result: "Fuel rate = 100.6 L/hr -> $120.71/hr at $1.20/L",
      },
    ],
    resultSummary: [
      { check: "Governing sizing requirement", requirement: "n/a (this is the finding)", actual: "Running load (502.9 kVA) exceeds motor-starting requirement (240 kVA)", pass: true },
      { check: "Recommended generator size", requirement: "n/a (this is the result)", actual: "502.9 kVA", pass: true },
    ],
    finalAnswer: "Running load (502.9 kVA) is more than double the motor-starting requirement (240 kVA) in this scenario, so the generator is sized for steady-state capacity, not starting transient — the opposite of many smaller sites where a single large motor's starting current dominates sizing.",
    keyInsight: "Which requirement governs generator sizing depends entirely on the ratio between total connected load and the largest single starting load — a site with modest continuous load but one large motor often has starting dip as the governing constraint, while a site with substantial baseline load (like this one, with 300 kW linear plus derated non-linear load) more often finds running capacity is what actually drives the sizing decision. Always compute both, since assuming one governs without checking can lead to an undersized unit.",
    faqs: [
      {
        q: "Why does non-linear load get a 1.5x derating factor instead of being added directly?",
        a: "Non-linear loads (VFDs, UPS input rectifiers, switch-mode supplies) draw distorted, harmonic-rich current that a generator's alternator has to handle less efficiently than the equivalent linear kVA — the derating factor accounts for the generator needing extra headroom to serve the same nameplate kVA of non-linear load without overheating or excessive voltage distortion, a widely used sizing practice from generator application guides.",
      },
      {
        q: "What would make the motor-starting dip check govern instead?",
        a: "A larger single motor relative to total site load — for example, the same generator serving a lighter 100 kW linear/non-linear baseline but starting the same 240 kVA motor would find dipReqKva (still 240 kVA, since it only depends on the motor and generator reactance) now exceeds a much smaller running-load requirement, flipping which check governs the final size.",
      },
    ],
  },

  {
    slug: "transformer-efficiency-regulation-from-test-data",
    groupId: "transformers",
    calculatorHref: "/calculators/gen-xfmr",
    calculatorName: "Generator & Transformer Analysis",
    title: "Worked Example: Transformer Efficiency and Voltage Regulation from OC/SC Test Data",
    dek: "A 1000 kVA transformer's own open-circuit and short-circuit test results, used to find its full-load efficiency, the loading point where efficiency actually peaks, and its voltage regulation at rated load.",
    standard: "Standard electrical-machines formulas (Kapp's approximation)",
    readTime: "10 min read",
    scenario: [
      { label: "Rated capacity", value: "1000 kVA" },
      { label: "No-load loss (open-circuit test)", value: "1800 W" },
      { label: "Load loss at rated current (short-circuit test)", value: "11,000 W" },
      { label: "Impedance (nameplate, from SC test)", value: "6.0%" },
      { label: "Loading condition", value: "100% of rated load, 0.85 power factor lagging" },
    ],
    steps: [
      {
        title: "Compute total loss and output at full load",
        equation: "totalLoss = Pfe + x² x Pcu          output = x x S x PF",
        substitution: "totalLoss = 1800 + 1² x 11,000 = 12,800 W          output = 1 x 1,000,000 x 0.85 = 850,000 W",
        result: "totalLoss = 12.8 kW, output = 850 kW",
      },
      {
        title: "Compute efficiency at full load",
        equation: "eff% = output / (output + totalLoss) x 100",
        substitution: "850,000 / (850,000 + 12,800) x 100",
        result: "eff = 98.52%",
      },
      {
        title: "Find the loading point where efficiency actually peaks",
        body: "Maximum efficiency occurs where variable (copper) loss equals fixed (iron) loss — not necessarily at full load.",
        equation: "x(maxEff) = √(Pfe / Pcu)",
        substitution: "√(1800 / 11,000)",
        result: "x(maxEff) = 0.405 (about 40.5% loading) -> peak efficiency = 98.96%, slightly higher than the full-load figure",
      },
      {
        title: "Compute resistive and reactive voltage-drop components",
        equation: "vr% = Pcu / (S x 1000) x 100          vx% = √(z%² - vr%²)",
        substitution: "vr = 11,000 / 1,000,000 x 100 = 1.1%          vx = √(6² - 1.1²) = √34.79",
        result: "vr = 1.1%, vx = 5.90%",
      },
      {
        title: "Apply Kapp's approximate voltage regulation formula",
        equation: "reg% = x(vr·cos(phi) + vx·sin(phi)) + (x²/200)(vx·cos(phi) - vr·sin(phi))²",
        result: "reg = 4.14% at full load, 0.85 PF lagging",
      },
    ],
    resultSummary: [
      { check: "Full-load efficiency", requirement: "n/a (informational)", actual: "98.52%", pass: true },
      { check: "Peak efficiency (occurs at 40.5% loading)", requirement: "n/a (informational)", actual: "98.96%", pass: true },
      { check: "Voltage regulation at full load", requirement: "n/a (informational)", actual: "4.14%", pass: true },
    ],
    finalAnswer: "This 1000 kVA transformer runs at 98.52% efficiency at full load, but is actually most efficient (98.96%) when loaded to only about 40% of rating — and its voltage sags 4.14% between no-load and full-load secondary voltage at 0.85 PF lagging.",
    keyInsight: "A transformer's efficiency curve peaks where fixed loss equals variable loss, not at 100% loading — which is why a transformer that's oversized relative to its typical load (running well below full rating most of the time) isn't necessarily wasting efficiency, and can sometimes be operating closer to its actual efficiency sweet spot than a tightly-sized unit running near full load constantly.",
    faqs: [
      {
        q: "Why does annual energy cost care about average loading separately from peak efficiency?",
        a: "No-load loss (1800 W) is constant 24/7 regardless of load, while load loss scales with the square of loading fraction — so a transformer's annual loss cost depends on its typical average loading over the year (this example uses 60% as a representative average), not just its instantaneous efficiency at any one snapshot like full load or the maximum-efficiency point.",
      },
      {
        q: "What does the impedance percentage (6%) actually limit?",
        a: "Nameplate impedance directly determines available short-circuit current on the secondary side during a fault (roughly rated current / z%, before any source impedance is added) and also sets the reactive voltage-drop component (vx) used in the regulation calculation — a lower-impedance transformer gives tighter voltage regulation under load but also allows higher fault current, which is exactly the kind of trade-off protection studies have to account for.",
      },
    ],
  },

  {
    slug: "busbar-continuous-ampacity-heat-balance",
    groupId: "transformers",
    calculatorHref: "/calculators/busbar-rating",
    calculatorName: "Busbar & Switchgear Rating",
    title: "Worked Example: Solving a Busbar's Continuous Temperature Rise from First Principles",
    dek: "A 100 x 10 mm copper busbar carrying 1200 A, checked by solving the actual heat balance between I²R loss and convective/radiative cooling — not a table lookup.",
    standard: "First-principles heat balance (Ohm's law + McAdams convection + linearized radiation)",
    readTime: "10 min read",
    scenario: [
      { label: "Busbar", value: "1 bar, 100 mm wide x 10 mm thick, copper" },
      { label: "Mounting", value: "Open, vertical, bare finish (emissivity 0.3)" },
      { label: "Ambient temperature", value: "35°C" },
      { label: "Load current", value: "1200 A" },
      { label: "Maximum allowed temperature rise", value: "65 K" },
    ],
    steps: [
      {
        title: "Set up the heat balance",
        body: "At thermal equilibrium, resistive (I²R) heat generation equals heat lost to convection and radiation — but resistance itself rises with temperature, so this has to be solved iteratively rather than in one step.",
        equation: "I²·Rac(T) = [hconv(ΔT) + hrad(ΔT)] x perimeter x ΔT",
      },
      {
        title: "Iterate to convergence",
        body: "Starting from an initial guess and refining until the temperature rise stabilizes.",
        result: "Converges to ΔT = 17.61 K above ambient",
      },
      {
        title: "Find the resulting surface temperature and check against the limit",
        equation: "Ts = ambient + ΔT",
        substitution: "35 + 17.61",
        result: "Ts = 52.61°C — well under the 65 K rise limit (which would allow up to 100°C)",
      },
      {
        title: "Find the maximum current this busbar could carry at the same rise limit",
        body: "Solving the same heat balance in reverse, for the current that produces exactly the maximum allowed 65 K rise.",
        result: "Maximum continuous current = 2478 A — more than double the actual 1200 A load",
      },
    ],
    resultSummary: [
      { check: "Temperature rise at 1200 A", requirement: "≤ 65 K", actual: "17.61 K", pass: true },
      { check: "Maximum continuous current at 65 K rise", requirement: "n/a (informational)", actual: "2478 A", pass: true },
    ],
    finalAnswer: "At 1200 A, this busbar runs only 17.6 K above ambient — well inside its 65 K limit — and could actually carry up to about 2478 A continuously before reaching that same limit, meaning it has substantial thermal headroom beyond its current loading.",
    keyInsight: "A busbar's continuous ampacity isn't a single number pulled from a manufacturer table — it depends on the specific installation's mounting, orientation, finish (emissivity), ambient temperature and even nearby airflow, all of which change how effectively it sheds heat. This first-principles heat-balance approach recomputes the actual thermal limit for the specific installation rather than relying on a generic published rating that may not match the real conditions.",
    faqs: [
      {
        q: "Why does surface finish (bare vs. painted) matter so much for busbar rating?",
        a: "Radiative heat loss scales with emissivity, and a bare copper bus has a fairly low emissivity (about 0.3) compared to a painted finish (about 0.9) — painting an otherwise-identical busbar black can meaningfully increase its radiative cooling and therefore its continuous ampacity at the same temperature-rise limit, which is why the calculator exposes emissivity as an adjustable input rather than hiding it as a fixed constant.",
      },
      {
        q: "Is this a substitute for a manufacturer's IEC 60890 type-test rating?",
        a: "No — this is explicitly a transparent engineering approximation for preliminary sizing, with every coefficient (emissivity, McAdams constant, proximity/skin-effect factors) exposed as an adjustable input rather than hidden. For final equipment specification or formal compliance, a manufacturer's actual IEC 60890 type-test data for the specific busbar configuration should be used.",
      },
    ],
  },

  {
    slug: "insulation-resistance-polarization-index-motor-acceptance",
    groupId: "transformers",
    calculatorHref: "/calculators/insulation-resistance",
    calculatorName: "Insulation Resistance Checker",
    title: "Worked Example: Insulation Resistance and Polarization Index Acceptance Test on a 6.6 kV Motor",
    dek: "Two related IEEE 43 condition-assessment checks on the same winding — a minimum-IR pass/fail and a polarization index that clears its minimum by a much narrower margin.",
    standard: "IEEE 43-2013",
    readTime: "9 min read",
    scenario: [
      { label: "Motor rated voltage", value: "6.6 kV" },
      { label: "1-minute IR reading", value: "15 MΩ" },
      { label: "10-minute IR reading", value: "33 MΩ" },
      { label: "Test temperature", value: "40°C (reference temperature — no correction needed)" },
      { label: "Insulation class", value: "B/F/H" },
    ],
    steps: [
      {
        title: "Compute the minimum required insulation resistance (kV+1 rule)",
        equation: "minRequired(MΩ) = kV(rated) + 1",
        substitution: "6.6 + 1",
        result: "minRequired = 7.6 MΩ",
      },
      {
        title: "Correct the measured IR to the 40°C reference (not needed here)",
        body: "The widely used rule of thumb is that IR roughly halves for every 10°C above 40°C, or doubles for every 10°C below — since this test was already run at exactly 40°C, no correction is applied.",
        result: "Corrected IR = 15 MΩ (unchanged)",
      },
      {
        title: "Check the corrected IR against the minimum",
        equation: "correctedIR ≥ minRequired?",
        substitution: "15 MΩ ≥ 7.6 MΩ",
        result: "Passes, with about 2x margin",
      },
      {
        title: "Compute the polarization index from the two timed readings",
        equation: "PI = IR(10 min) / IR(1 min)",
        substitution: "33 / 15",
        result: "PI = 2.20",
      },
      {
        title: "Compare PI against the Class B/F/H minimum",
        equation: "PI ≥ 2.0 (Class B/F/H minimum)?",
        substitution: "2.20 ≥ 2.0",
        result: "Passes, but with a much narrower margin (10%) than the IR check itself",
      },
    ],
    resultSummary: [
      { check: "1-minute IR (corrected to 40°C) vs. kV+1 rule", requirement: "≥ 7.6 MΩ", actual: "15 MΩ", pass: true },
      { check: "Polarization Index vs. Class B/F/H minimum", requirement: "≥ 2.0", actual: "2.20", pass: true },
    ],
    finalAnswer: "This winding passes both checks — a comfortable 2x margin on the basic IR test, but only a 10% margin on polarization index, which the IEEE 43 'Good' band (2.0-4.0) confirms is an acceptable but not exceptional result. The PI check is the tighter of the two constraints here.",
    keyInsight: "IR and PI test two different things and can disagree — a winding can pass a healthy absolute IR reading while its PI trend (how much IR rises over the 10-minute test as the insulation polarizes) is comparatively weak, or vice versa. PI specifically screens for moisture or contamination, which affects how the reading develops over time rather than its absolute level at any one instant, which is why both checks are run together rather than relying on either alone.",
    faqs: [
      {
        q: "What does a low PI (close to 1.0) actually indicate if the absolute IR reading is still high?",
        a: "A PI close to 1.0 despite an adequate absolute IR value can indicate surface contamination, moisture absorption, or leakage current paths that don't fully 'polarize' the way clean, dry insulation does — the IR reading barely climbs from 1 minute to 10 minutes because the current flowing is dominated by a steady leakage/surface-conduction component rather than the capacitive charging and dielectric absorption current that should decay over the test.",
      },
      {
        q: "Why does insulation class change the minimum PI requirement?",
        a: "Class A insulation (the oldest, least thermally robust classification) has a lower IEEE 43 minimum PI of 1.5, while the more common modern Class B/F/H insulation systems are held to a stricter 2.0 minimum — reflecting that better-quality modern insulation systems are expected to show a stronger polarization trend when healthy, so a weaker trend is a more meaningful red flag for them.",
      },
    ],
  },

  {
    slug: "polarization-index-good-winding-vs-contaminated-winding",
    groupId: "transformers",
    calculatorHref: "/calculators/polarization-index",
    calculatorName: "Polarization Index (PI) Calculator",
    title: "Worked Example: A Healthy PI Trend vs. a Contaminated Winding With the Same Absolute IR",
    dek: "Two windings with a similarly adequate 1-minute IR reading — one develops a strong polarization trend over the 10-minute test and passes comfortably, the other barely rises and fails outright.",
    standard: "IEEE 43-2013",
    incidentBased: false,
    readTime: "7 min read",
    scenario: [
      { label: "Winding 1 — 1-minute IR", value: "15 MΩ" },
      { label: "Winding 1 — 10-minute IR", value: "33 MΩ" },
      { label: "Winding 2 — 1-minute IR", value: "20 MΩ" },
      { label: "Winding 2 — 10-minute IR", value: "25 MΩ" },
      { label: "Insulation class (both)", value: "B/F/H (minimum PI = 2.0)" },
    ],
    steps: [
      {
        title: "Compute Winding 1's polarization index",
        equation: "PI = IR(10 min) / IR(1 min)",
        substitution: "33 / 15",
        result: "PI = 2.20 → 'Good' band (2.0–4.0)",
      },
      {
        title: "Check Winding 1 against the Class B/F/H minimum",
        equation: "PI ≥ 2.0?",
        substitution: "2.20 ≥ 2.0",
        result: "PASS, with a 10% margin",
      },
      {
        title: "Compute Winding 2's polarization index",
        body: "Winding 2's 1-minute IR (20 MΩ) is actually higher than Winding 1's — on an absolute-IR-only view, it would look like the healthier winding.",
        equation: "PI = IR(10 min) / IR(1 min)",
        substitution: "25 / 20",
        result: "PI = 1.25 → 'Questionable' band (1.0–2.0)",
      },
      {
        title: "Check Winding 2 against the Class B/F/H minimum",
        equation: "PI ≥ 2.0?",
        substitution: "1.25 ≥ 2.0",
        result: "FAIL — despite the higher starting IR reading",
      },
    ],
    resultSummary: [
      { check: "Winding 1 PI vs. Class B/F/H minimum", requirement: "≥ 2.0", actual: "2.20 (Good)", pass: true },
      { check: "Winding 2 PI vs. Class B/F/H minimum", requirement: "≥ 2.0", actual: "1.25 (Questionable)", pass: false },
    ],
    finalAnswer: "Winding 1 passes with a PI of 2.20 despite a lower starting (1-minute) IR reading than Winding 2. Winding 2 fails outright at PI 1.25, even though its 1-minute IR reading (20 MΩ) is higher in absolute terms — its resistance barely rises over the 10-minute test, the signature of a trend-based problem that a single-point IR reading alone would miss.",
    keyInsight: "PI is deliberately a trend measurement, not an absolute one — it exists precisely to catch windings whose absolute IR reading looks acceptable at any single instant but which fail to show the rising-resistance trend of healthy, dry insulation as dielectric absorption current decays over the test. A winding can have a perfectly adequate 1-minute IR and still fail PI, which is why IEEE 43 recommends running both checks rather than treating a single spot IR reading as sufficient on its own.",
    faqs: [
      {
        q: "Could a very short test (say, comparing 30-second and 1-minute readings) work as a substitute for the full 10-minute PI test?",
        a: "No — IEEE 43 specifically defines PI using readings at 1 minute and 10 minutes because the dielectric absorption current that PI is designed to characterize decays over a timescale of minutes, not seconds; a shorter comparison window wouldn't capture enough of that decay curve to distinguish a healthy trend from a flat, contamination-affected one, which is why the standard's timing can't be substituted with a shorter test.",
      },
      {
        q: "If a winding fails PI but passes the basic IR check, what's the usual next step?",
        a: "A PI failure with an adequate absolute IR reading typically points toward surface contamination or moisture rather than bulk insulation breakdown, so the usual next steps are cleaning and drying the winding (if accessible) and re-testing, or scheduling more frequent monitoring to watch the trend over time — it's a flag for closer investigation rather than necessarily an immediate failure requiring replacement, though the appropriate response depends on the equipment's criticality and the technician's overall assessment.",
      },
    ],
  },
];
