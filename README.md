# AJapps — Electrical Engineering Calculator Suite

A web-based electrical engineering calculator suite, currently with 58 live
calculators.

## Home page & in-app documentation

The home page now includes an "About AJapps" section covering the site's
purpose, target audience, why-choose-this-site value proposition, and a
tag list of every standard the suite implements against.

Every calculator page has:
- An **"About this tool"** collapsible panel (top of the page, below the
  intro paragraph) with: a purpose statement, the specific standards/
  clauses implemented, a bullet list of capabilities (including what's
  free vs. subscriber-gated), a worked example problem with numbered
  steps and a result (pulled from this README's own hand-checked
  "Verification notes" figures, so the example matches the live code
  exactly), and — where relevant — a caveats/notes line.
- **Hover tooltips** on (almost) every input field — a small circular "i"
  icon next to the field label that shows a description on hover, focus,
  or click (keyboard-accessible). For the 27 calculators ported from your
  original AJ Apps Suite, tooltip text is adapted from that app's own
  `GLOSSARY` help-text dictionary (a ~670-line `{term, def, example?}`
  map keyed by field, found at lines 5252-5922 of the source HTML) — so
  the explanations are the same ones your original app already had,
  carried over field-by-field. For the 5 calculators with no source-app
  equivalent (Power Converter, Breaker/Fuse Sizer, Motor Protection
  Sizer, Transformer Sizer, UPS Sizing), tooltip text was authored fresh
  from the same standards citations documented in each `src/lib/*.ts`
  file's header comments.
- Shared components: `src/components/InfoPanel.tsx` (the About-this-tool
  panel) and the `Tip` component + `tip` prop added to `NumberField`/
  `SelectField`/`CheckboxField`/`TextField` in `src/components/fields.tsx`.

## Worked examples ("Examples" section)

A standalone `/examples` section (linked from the top nav) now provides at
least one full worked example per calculator — 59 examples covering all 58
live calculators across all 10 categories (two calculators — Generator/
Transformer Analysis and Insulation Resistance/PI — get one example each
for two related checks they perform). Each example follows a
Scenario → Step 1, Step 2... → Result Summary → FAQs format: a scenario
table of inputs, numbered steps showing the equation/substitution/result
for each stage of the calculation, a pass/fail result summary table, a
highlighted final-answer callout, an optional "key insight" paragraph, and
2 FAQs.

- Architecture mirrors `calculatorCatalog.ts`: `src/lib/workedExamples/types.ts`
  defines the schema, one file per calculator group (`protection.ts`,
  `cables.ts`, `earthing.ts`, `transformers.ts`, `powerquality.ts`,
  `motors.ts`, `backuppower.ts`, `instrumentation.ts`, `solarev.ts`,
  `buildingservices.ts`) each exports a `[GROUP]_EXAMPLES` array, and
  `index.ts` aggregates them all plus lookup helpers
  (`getExampleBySlug`, `getExamplesForCalculator`, `getExamplesForGroup`).
- `src/components/WorkedExamplePage.tsx` renders the shared page layout;
  `src/app/examples/page.tsx` is the grouped index; `src/app/examples/[slug]/page.tsx`
  is the dynamic route (statically generated for every example).
- **Every number in every example was produced by running the calculator's
  own live TypeScript function** (via throwaway `tsx` probe scripts against
  the real exported functions and `DEFAULT_*_INPUT` objects), not
  hand-derived — so a worked example can never diverge from what the
  calculator itself actually outputs.
- Several examples deliberately show a calculator's own default inputs
  producing a genuine **FAIL** rather than only showing passing scenarios —
  e.g. the multi-bus IDMT grading margin, the earthing mesh voltage check,
  the battery end-of-discharge voltage, the intrinsic-safety cable
  capacitance check, and the enclosure natural-convection shortfall — each
  used as the pedagogical centerpiece of its example, with the fix shown as
  a follow-up step.
- All examples are neutral practical scenarios (not tied to named real
  incidents), a deliberate choice to avoid unverified causal attribution.
- Each calculator's "About this tool" panel now cross-links to its matching
  worked example(s) via `getExamplesForCalculator()` (see `InfoPanel.tsx`).

## Guides (category tutorials) and the Resources hub

A separate `/guides` section — reached via the new **Resources** nav dropdown
alongside Worked Examples — provides one substantial conceptual primer
(~1500-2500 words) per calculator category: 10 guides covering all 10
categories. Unlike worked examples (which solve one specific numeric
problem), a guide explains the underlying engineering theory, the standards
landscape, how that category's calculators fit together in a typical
workflow, and common mistakes/misconceptions — the context needed to use
any of that category's calculators correctly in the first place.

- Architecture mirrors the worked-examples pattern: `src/lib/guides/types.ts`
  defines the `GuideDoc` schema (intro, core concepts, standards table,
  ordered workflow linking to calculators, common mistakes, FAQs), one file
  per category in `src/lib/guides/` (`protection.ts`, `cables.ts`,
  `earthing.ts`, `transformers.ts`, `powerquality.ts`, `motors.ts`,
  `backuppower.ts`, `instrumentation.ts`, `solarev.ts`,
  `buildingservices.ts`), and `index.ts` aggregates them plus
  `getGuideBySlug`/`getGuideForGroup` lookup helpers.
- `src/components/GuidePage.tsx` renders the shared layout;
  `src/app/guides/page.tsx` is the index; `src/app/guides/[slug]/page.tsx`
  is the statically-generated dynamic route.
- `src/app/resources/page.tsx` is a new hub page introducing Guides vs.
  Worked Examples and when to use each — the nav's "Examples" link was
  replaced with a "Resources" dropdown (`NavBar.tsx`) linking to both.
- Factual/standards claims in each guide are grounded in the same standard
  references already verified and cited in that category's own calculator
  lib files (header comments), not independently re-researched — keeping
  the guides consistent with what the calculators themselves already cite.

## PDF report export

Every calculator has a **"Download PDF Report"** button (top of the page,
above the About-this-tool panel). Clicking it generates and downloads a
branded, watermarked PDF containing everything on the page:

- A report header block (AJapps branding, calculator name, generation
  timestamp, a "preliminary engineering use only" disclaimer) that's
  invisible in the normal UI and only renders into the captured report.
- Every input section and field, with its current value.
- Every result panel, including pass/fail checks.
- The full "About this tool" content (purpose, standards, capabilities,
  worked example) — the panel is forced open for the capture even if you
  had it collapsed on screen.
- A tiled diagonal "AJapps" watermark on every page, and a footer with
  the calculator name, generation date, and page number.

How it works (`src/components/ReportButton.tsx`): on click, the page
switches to a temporary light-themed, single-column "report mode" (via a
`.report-mode` class + CSS override in `globals.css`, and a
`ajapps:report-mode` window event that `InfoPanel` listens for to force
itself open), the visible content is captured with `html2canvas-pro`
(a fork of `html2canvas` that additionally supports the modern
`oklab()`/`oklch()` CSS color functions Tailwind v4 generates — the
original `html2canvas` can't parse those and throws a console error),
sliced across as many A4 pages as needed, and assembled into a PDF with
`jsPDF` — which also draws the watermark and footer directly (crisp
vector text, not part of the screenshot) — before triggering a download
and reverting the page back to normal. No server round-trip; everything
happens in the browser.

**Verification note**: this feature was verified via TypeScript
type-checking (confirming every `jsPDF`/`html2canvas-pro` call matches
their actual type definitions — `addImage`, `text` with the `angle`
option, `setGState`-free watermark approach, etc.), a full production
build, and manual code review of the paging/slicing math. I was not able
to run a real browser click-through in this environment (no Chromium
available in the sandbox, and the dev server here isn't reachable from
your browser) — worth clicking "Download PDF Report" once yourself after
`npm run dev` to confirm it looks right on a calculator with a lot of
content (e.g. Harmonic Analysis or Cable Sizing), since that's the best
end-to-end check.

## Bug / incorrect-answer reports

Every calculator page has a **"🐛 Report a bug / incorrect answer"**
button (next to "Download PDF Report"), and the NavBar has a compact
**"🐛 Feedback"** link for general site feedback not tied to one
calculator. Both open the same form: issue type, description (required),
"what did you expect instead" (useful for incorrect-answer reports), and
an optional reply-to email.

The app has no backend or database yet (see "Next steps" below), so
reports don't get silently lost or need one set up just to ship this:
submitting the form pre-fills an email addressed to
**oneandonlyajmal@gmail.com** (`mailto:`, opens the visitor's default
mail client) with the form fields plus an auto-captured snapshot of the
page — every input's label + current value, and the visible page text
(which includes computed results). Since some browsers/work machines
have no mail client configured, there are also **"Copy report text"**
and **"Download .txt"** fallback buttons that produce the identical
report so it can be pasted or attached anywhere.

To swap this for something more robust once the site is deployed
publicly — e.g. a form-backend service (Formspree, Web3Forms) that
doesn't rely on the visitor having a mail client, or a Next.js API route
+ transactional email API (Resend, etc.) that logs reports server-side
— the whole mechanism is isolated in `src/components/FeedbackButton.tsx`
(see the `RECIPIENT_EMAIL` constant and `handleEmail`/`handleCopy`/
`handleDownload` functions).

## Free launch period

Every subscriber-only feature across all 29 calculators is unlocked for
launch — full derating, mesh/step voltage checks, saturation analysis,
multi-bank aggregation, the four previously "entirely subscriber"
calculators (Cable Tray Fill, Cable Pulling Tension, Emergency Power,
Motor Calculator), all of it, no account needed. The **PDF report
watermark stays on for everyone** regardless of this setting — it's
free advertising and it means there's nothing to visibly "take away"
when the promo ends.

This is controlled by a single flag: `FREE_LAUNCH` in
`src/lib/launchConfig.ts`. Every `unlocked={FREE_LAUNCH}` /
`calcXxx(input, FREE_LAUNCH)` call site across the app reads from it, so
flipping it back to `false` when you're ready to launch subscriptions
restores normal gating everywhere at once. `FREE_LAUNCH_END_LABEL` in
the same file drives the wording of the site-wide banner in
`NavBar.tsx` — update both when you lock the actual promo end date.

**One deliberate exception**: the Arc Flash calculator's IEEE 1584-2018
section is left locked. Its enclosure size correction factor has a
documented, unresolved accuracy discrepancy (see "Verification notes"
above) — it felt wrong to hand that out during a public free trial for
a safety calculation without you deciding first. Everything else on
that page (2002 and Ralph Lee) is fully free like the rest of the site.

**Two sections describe features that were never actually built** in
the source app's math library, so unlocking them doesn't make numbers
appear: Earthing's "Transferred potential" and "Grid design assistant"
subsections, and the Lightning Protection calculator's "SPD / LEMP
protection (Annex D)" subsection. Each now says so directly in the UI
instead of implying a lock. Everything else in this file — every
formula in every `src/lib/*.ts` — was already ported and verified per
the notes above, so unlocking really does mean full functionality
everywhere else.

Fourteen of the original tools were the first ones live; the list below
now covers all 29:

1. **IDMT relay coordination** — IEC 60255-151 / IEEE C37.112 overcurrent
   relay curves, two-relay coordination checking, and a time-current
   characteristic (TCC) graph.
2. **Cable sizing & voltage drop** — IEC 60364-5-52 current-carrying
   capacity and voltage-drop verification, with derating, short-circuit
   withstand, CPC/earth sizing and a lifecycle-cost optimizer as subscriber
   features.
3. **Arc flash** — incident energy, arc flash boundary and PPE category.
   IEEE 1584-2002 (empirical) and Ralph Lee (theoretical) are free; IEEE
   1584-2018 is a subscriber feature.
4. **Maximum demand** — load-category demand-factor method with design
   current and breaker sizing. Multi-board site aggregation and transformer
   sizing is a subscriber feature.
5. **Earthing grid design** — IEEE 80 grid resistance, GPR and tolerable
   touch/step limits, plus BS 7430 electrode sizing. Mesh/step voltage
   pass-fail, layered soil, parallel electrodes and transferred potential
   are subscriber features.
6. **Power factor correction** — IEC 60831 capacitor bank sizing. Harmonic
   resonance, detuning reactor sizing and energy-savings analysis are
   subscriber features.
7. **CT sizing & saturation** — IEC 61869-2 current transformer ratio,
   itemized burden and accuracy-limit-factor (ALF) / knee-point voltage (Vk)
   check. Saturation/transient analysis, metering accuracy class, thermal &
   mechanical withstand, multi-ratio taps and REF/differential ratio
   matching are subscriber features.
8. **VT sizing** — IEC 61869-3 voltage transformer ratio, rated voltage
   factor by system earthing, and burden checked against standard rated
   outputs. Built from scratch (no equivalent in your original app suite).
   Protection accuracy class, rated thermal limiting output and open-delta
   residual voltage are subscriber features.
9. **Battery & DC system sizing** — IEEE 485 duty-cycle section method for
   vented/VRLA lead-acid batteries, against your own manufacturer Kt table.
   Random/intermittent loads, cell count & voltage window checks, and
   charger sizing (IEEE 946-style) are subscriber features.
10. **Busbar & switchgear rating check** — first-principles heat-balance
    continuous ampacity and temperature rise for rectangular busbars.
    Short-time thermal withstand (IEC 60364-5-54-style) and an
    electrodynamic force check (IEC 60865-1-style) are subscriber features.
11. **Generator & transformer analysis** — genset sizing for running load +
    motor-starting voltage dip, and transformer loss/efficiency/regulation
    from OC/SC test data, both free. Neutral earthing resistor/transformer
    (NGR/NET) sizing is a subscriber feature.
12. **Solar PV sizing** — IEC 62548 & IEC 60364-7-712 string voltage
    window, inverter MPPT/current matching, and DC/AC cable sizing, all
    free. Multi-string parallel arrays with combiner/feeder sizing is a
    subscriber feature.
13. **EV charging** — IEC 61851-1 / IEC 60364-7-722 / IEC 62955 charge
    point cable, breaker and RCD sizing, free. Multi-point site demand with
    load-management-system diversity is a subscriber feature.
14. **MV cable sizing** — IEC 60287-1-1/2-1/3-1 first-principles
    thermal-circuit current rating for single-core MV/HV cables, verified
    against CIGRE Technical Brochure 880. Fully free — no subscriber gate
    in v1 (single-core, unarmoured, XLPE, buried only).

## Running it locally (no coding experience needed)

1. **Install Node.js** (one-time setup) — download the "LTS" version from
   https://nodejs.org and run the installer.
2. **Open a terminal in this folder.**
   - Windows: open this folder in File Explorer, then type `cmd` in the
     address bar and press Enter. (If you use PowerShell instead and see a
     "running scripts is disabled" error, run
     `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or just use
     Command Prompt as above.)
   - Mac: right-click this folder → "New Terminal at Folder" (or open
     Terminal and `cd` into this folder).
3. **Install the project's dependencies** (one-time, takes a minute or two):
   ```
   npm install
   ```
4. **Start the site:**
   ```
   npm run dev
   ```
5. Open your browser to **http://localhost:3000**. The site is now running
   on your laptop. Leave the terminal window open while you use it; press
   `Ctrl+C` in the terminal to stop it.

## Regression testing

Every calculator's math library has an automated regression test — 352
checks across all 58 modules, covering known-good scenarios (many
reproduce the exact figures in "Verification notes" below), null/edge-case
inputs, and pass/fail boundary conditions. Run the whole suite any time
you or an AI assistant touches the math:

```
npm test
```

A clean run ends with `REGRESSION SUMMARY: 352 passed, 0 failed`. The
suite lives at `scripts/regression-test.ts` — extend it whenever you add
a calculator or change a formula, so a future edit can't silently break
an existing one.

## What's included

- `/` — home page
- `/calculators/idmt` — IDMT relay coordination calculator
- `/calculators/cable-sizing` — cable sizing & voltage drop calculator
- `/calculators/arc-flash` — arc flash calculator
- `/calculators/max-demand` — maximum demand calculator
- `/calculators/earthing` — earthing grid design calculator
- `/calculators/power-factor-correction` — power factor correction calculator
- `/calculators/ct-sizing` — CT sizing & saturation calculator
- `/calculators/vt-sizing` — VT sizing calculator
- `/calculators/battery-sizing` — battery & DC system sizing calculator
- `/calculators/busbar-rating` — busbar & switchgear rating check
- `/calculators/gen-xfmr` — generator & transformer analysis (3 tabs)
- `/calculators/solar-pv` — solar PV sizing calculator
- `/calculators/ev-charging` — EV charging calculator
- `/calculators/mv-cable` — MV cable sizing calculator (IEC 60287)
- `/calculators/energy-storage` — energy storage (BESS) sizing calculator
- `/calculators/harmonic-analysis` — harmonic analysis calculator (IEEE 519)
- `/calculators/lightning-protection` — lightning protection & risk assessment
- `/calculators/conduit-fill` — conduit fill calculator (NEC Ch.9 / IEC)
- `/calculators/cable-tray-fill` — cable tray fill calculator (NEC §392.22 / IEC)
- `/calculators/cable-pulling-tension` — cable pulling tension calculator (IEEE 1185)
- `/calculators/lighting-design` — lighting design calculator (lumen method)
- `/calculators/hvac-electrical-sizing` — HVAC electrical sizing (NEC Art. 440 / IEC)
- `/calculators/emergency-power` — emergency power (genset+UPS) load sequencing
- `/calculators/motor-calculator` — standalone motor calculator (NEC Art. 430 / IEC)
- `/calculators/power-converter` — kW / kVA / kVAR / Amps converter
- `/calculators/breaker-fuse-sizer` — circuit breaker & fuse sizer
- `/calculators/motor-protection-sizer` — motor protection sizer
- `/calculators/transformer-sizer` — transformer sizer (N-1 redundant)
- `/calculators/ups-sizing` — UPS sizing calculator
- `/calculators/current-loop-4-20ma` — 4-20mA current loop calculator (loop voltage budget)
- `/calculators/intrinsic-safety` — intrinsic safety (IS) verification (IEC 60079-11 entity concept)
- `/calculators/thermocouple-rtd` — thermocouple & RTD calculator (NIST ITS-90 / IEC 60751)
- `/calculators/control-cable-sizing` — control/instrumentation cable sizing (HART capacitance, EMI guidance)
- `/calculators/pue` — data center PUE calculator (ISO/IEC 30134-2 / Green Grid)
- `/calculators/elevator-demand` — elevator electrical demand calculator (NEC Table 620.14)
- `/calculators/life-cycle-cost` — life-cycle cost (LCC) calculator (discounted cash flow)
- `/calculators/tariff` — demand charge / TOU tariff calculator
- `/calculators/heat-tracing` — heat tracing circuit sizing calculator (IEEE 515 practice)
- `/calculators/enclosure-cooling` — panel/MCC enclosure heat dissipation & ventilation calculator (IEC 60890-derived)
- `/calculators/fg-loop` — fire & gas detection loop power budget calculator
- `/calculators/static-bonding` — hazardous area bonding & static grounding check (NFPA 77)
- `/calculators/esd-energy` — electrostatic discharge spark energy check (IEC 60079-32-1)
- `/calculators/vfd-savings` — pump/fan VFD energy savings calculator (affinity laws)
- `/calculators/generator-sync` — generator paralleling/synchronization check
- `/calculators/idmt-earth-fault` — IDMT earth fault relay setting (50N/51N)
- `/calculators/transformer-differential` — transformer differential protection (87T)
- `/calculators/idmt-grading` — multi-bus IDMT relay grading study
- `/calculators/fault-propagation` — fault current propagation (Base kVA Method)
- `/calculators/insulation-resistance` — insulation resistance (IR) test value checker
- `/calculators/polarization-index` — polarization index (PI) calculator
- `/calculators/touch-voltage` — touch voltage from neutral/earth imbalance
- `/calculators/ohl-voltage-regulation` — overhead line voltage regulation
- `/calculators/line-losses` — distribution line technical losses
- `/calculators/rolling-sphere` — LPS rolling sphere method
- `/calculators/voltage-unbalance` — phase voltage unbalance & motor derating
- `/calculators/panel-balance` — residential/commercial DB panel balancer
- `/calculators/generator-fault-contribution` — parallel generator short-circuit contribution
- `/calculators/genset-fuel` — genset fuel consumption & running cost
- `src/lib/idmt.ts` — IDMT curve math (IEC/IEEE constants, trip time,
  full-range coordination check).
- `src/lib/cable.ts` — cable sizing math (ampacity tables, voltage-drop
  mV/A/m tables, derating factors, short-circuit withstand, CPC sizing,
  lifecycle cost).
- `src/lib/arcflash.ts` — arc flash math (IEEE 1584-2002, Ralph Lee, and
  IEEE 1584-2018 equations/coefficient tables).
- `src/lib/maxdemand.ts` — maximum demand math (per-category demand
  factors, standard breaker/transformer size tables).
- `src/lib/earthing.ts` — earthing grid math (Sverak grid resistance,
  IEEE 80 mesh/step voltage, BS 7430 electrode resistance formulas).
- `src/lib/pfc.ts` — power factor correction math (Qc sizing, capacitance,
  harmonic resonance, detuning reactor, energy savings).
- `src/lib/ct.ts` — CT sizing math (ratio, itemized burden + lead
  resistance, ALF/Vk check, saturation/transient factor, thermal/mechanical
  withstand, metering class limits, multi-ratio taps, REF/differential
  ratio matching).
- `src/lib/vt.ts` — VT sizing math, built from scratch against IEC 61869-3
  (rated voltage factor by earthing system, ratio, burden vs. standard
  rated outputs, secondary lead voltage drop, protection class limits,
  thermal limiting output, open-delta residual voltage).
- `src/lib/battery.ts` — battery sizing math (IEEE 485 changing-load
  section method, piecewise-linear Kt interpolation, cell count & voltage
  window, charger sizing).
- `src/lib/busbar.ts` — busbar rating math (heat-balance ΔT solver via
  damped fixed-point iteration, bisection search for max continuous
  current, bare-conductor short-time withstand reusing `cable.ts`'s
  `CPC_K_BARE`, electrodynamic force/bending-stress check).
- `src/lib/genxfmr.ts` — generator sizing (running + motor-starting kVA),
  transformer losses/efficiency/regulation (Kapp's formula), and NGR/NET
  earthing resistor sizing.
- `src/lib/pv.ts` — solar PV sizing math (string voltage window with
  temperature coefficients, MPPT/current matching, DC/AC cable sizing via
  `cable.ts`'s ampacity/derating/voltage-drop functions, multi-string OCPD).
- `src/lib/ev.ts` — EV charging math (charge-point cable/breaker sizing
  reusing `cable.ts`, mode/earthing/RCD guidance notes, multi-point site
  diversity).
- `src/lib/mvcable.ts` — MV cable sizing math, a first-principles IEC
  60287-1-1 thermal-circuit solver (capacitance, reactance, T1/T3/T4
  thermal resistances, dielectric loss, iterative current-rating equation).
- `src/lib/storage.ts` — energy storage (BESS) sizing math (usable
  energy/nameplate/C-rate sizing, PCS voltage-window & power checks, AC
  cable sizing via `cable.ts`, multi-bank site aggregation & DoD-vs-cycle-
  life interpolation).
- `src/lib/harmonics.ts` — harmonic analysis math (IEEE 519-2014 Table 1
  voltage & Table 2 TDD-referenced current distortion limits, per-order
  breakdown, approximate K-factor).
- `src/lib/lightning.ts` — lightning protection risk assessment math (IEC
  62305-1/2 collection area, structure risk RA/RB, connected-line risk
  RU/RV, minimum LPS class search).
- `src/lib/conduitfill.ts` — conduit fill math (NEC Chapter 9 Table 4/5
  conduit & conductor area tables, IEC/BS 7671 45%/40% space-factor
  method).
- `src/lib/cabletray.ts` — cable tray fill math (NEC §392.22 width/area
  rules by tray type & cable category, IEC 61537-style area-fill).
- `src/lib/cablepulling.ts` — cable pulling tension math (IEEE 1185
  tension/capstan equations, sidewall bearing pressure, 3-cable jam
  ratio).
- `src/lib/lighting.ts` — lighting design math (lumen method per EN
  12464-1/IES Handbook, EN 1838 emergency lighting minimum/uniformity
  check).
- `src/lib/hvac.ts` — HVAC electrical sizing math (NEC Art. 440 MCA/MOCP/
  disconnect sizing, IEC general method, multi-motor combination-load,
  VFD-fed motor).
- `src/lib/emergencypower.ts` — emergency power load sequencing math
  (NFPA 110 Type/Class classification, UPS-to-genset bridge timing,
  staged load-step pickup planner with priority-order checks).
- `src/lib/motor.ts` — standalone motor calculator math (NEC Table
  430.248/430.250 FLC lookups, branch-circuit/OCPD/overload/disconnect
  sizing, starting-method voltage-dip check, multi-motor feeder sizing).
- `src/lib/powerconverter.ts` — kW/kVA/kVAR/Amps power-triangle converter
  for single- and three-phase load profiles, designed from scratch (no
  equivalent module in the source app).
- `src/lib/breakerfuse.ts` — circuit breaker & fuse sizing math, designed
  from scratch: general continuous/non-continuous load OCPD sizing (NEC
  210.19/215.2 + 240.4, or IEC 60364-4-43 Ib≤In≤Iz with I2≤1.45·Iz), and
  a motor starting-current withstand path reusing the same NEC
  430.52(C)(1) percentage method as `motor.ts`.
- `src/lib/motorprotection.ts` — motor protection sizing math, designed
  from scratch: overload relay setting/trip class (NEC 430.32 / IEC
  60947-4-1), AC-3/AC-4 contactor sizing, and ground-fault pickup
  guidance by system grounding type (clearly caveated as typical-practice
  guidance, not a coordination study).
- `src/lib/xfmrsizer.ts` — transformer sizing math, designed from scratch:
  connected-load → design kVA, growth/safety margins, ambient derating
  (typical-practice rate above 40°C, caveated), standard ANSI/IEEE kVA
  ratings, and a general N-unit "any (N-1) carries the full load"
  redundancy model.
- `src/lib/upssizing.ts` — UPS sizing math, designed from scratch: the
  same N-unit redundancy model as the transformer sizer (N+1 in UPS
  terminology), plus an approximate battery energy/Ah figure for the
  stated backup time (points to `battery.ts`'s full IEEE 485 method for
  detailed work).
- `src/lib/loop420.ts` — 4-20mA current loop math, designed from scratch:
  round-trip wire resistance by AWG, total loop resistance, voltage
  available at the transmitter at 20mA, headroom pass/fail, and reverse
  max-loop-resistance/max-cable-length calculation.
- `src/lib/intrinsicsafety.ts` — intrinsic safety entity-concept math,
  designed from scratch (IEC 60079-11): voltage/current/power checks,
  field-cable capacitance/inductance contribution, and the 1% rule for
  selecting full vs. halved Co/Lo before the capacitance/inductance check.
- `src/lib/thermocouple.ts` — thermocouple (NIST ITS-90 inverse
  polynomials, types K/J/T/E) and RTD (IEC 60751 Callendar-Van Dusen,
  Pt100/500/1000) temperature conversion, with cold-junction compensation
  by numerically inverting the trusted inverse polynomial, and RTD
  lead-wire compensation for 2/3/4-wire installations.
- `src/lib/controlcable.ts` — control/instrumentation cable sizing,
  designed from scratch: capacitance-limited maximum cable length for
  HART/4-20mA loops, minimum conductor size guidance, and general-practice
  EMI separation-distance guidance (explicitly caveated as general
  practice, not a verified official IEEE 518 numeric matrix).
- `src/lib/pue.ts` — data center PUE math, designed from scratch: PUE,
  DCiE, non-IT overhead energy/cost, and a classification against the
  commonly-cited Green Grid PUE efficiency scale.
- `src/lib/elevatordemand.ts` — elevator electrical demand math, designed
  from scratch: traction elevator motor power from rated load/speed/
  counterweight balance/efficiency, and the NEC Table 620.14 feeder demand
  factor for a group of elevators.
- `src/lib/lcc.ts` — life-cycle cost math, designed from scratch: standard
  discounted-cash-flow LCC (present worth of escalating operating costs,
  equivalent annual cost via the capital recovery factor), plus a
  two-option comparison with simple payback.
- `src/lib/tariff.ts` — demand charge / TOU tariff math, designed from
  scratch: itemized time-of-use energy charges, peak demand charge, an
  optional power-factor penalty, and a fixed/service charge — every rate
  is a user-supplied input, since tariff structures are genuinely
  utility/region-specific.
- `src/lib/heattracing.ts` — heat tracing math, designed from scratch:
  steady-state cylindrical-conduction heat loss through pipe insulation,
  heater W/m selection against a design safety factor, and circuit
  current/voltage-drop/breaker checks.
- `src/lib/enclosurecooling.ts` — enclosure cooling math, designed from
  scratch: effective dissipating surface area, natural-convection capacity
  vs. installed heat losses, and IEC 60890-derived forced-air fan sizing
  (V = 3.1×Ploss/ΔT) when natural convection is inadequate.
- `src/lib/fgloop.ts` — fire & gas loop math, designed from scratch:
  standby and worst-case-alarm voltage budget for a multi-detector
  initiating device circuit with an end-of-line resistor.
- `src/lib/staticbonding.ts` — static bonding math, designed from scratch:
  resistance-to-ground check against the NFPA 77 static-dissipation
  threshold, with a quality flag distinguishing a tight metallic bond from
  a merely-adequate reading.
- `src/lib/esdenergy.ts` — ESD spark energy math, designed from scratch:
  capacitive discharge energy (E=½CV²) vs. a user-supplied Minimum
  Ignition Energy, with general IEC 60079 gas-group guidance.
- `src/lib/vfdsavings.ts` — VFD savings math, designed from scratch:
  cubic affinity-law power at reduced flow vs. a throttled baseline, and
  the resulting annual energy/cost savings.
- `src/lib/gensync.ts` — generator sync-check math, designed from scratch:
  voltage/frequency/phase-angle difference against adjustable acceptance
  windows, plus the beat period between in-phase instants.
- `src/lib/idmtef.ts` — IDMT earth fault relay math, reusing `idmt.ts`'s
  verified curve engine directly for the 50N/51N variant, plus an optional
  high-set instantaneous stage.
- `src/lib/difftransformer.ts` — transformer differential (87T) protection
  math, designed from scratch: percentage-bias dual-slope restraint
  characteristic (IEEE C37.91-consistent).
- `src/lib/idmtgrading.ts` — multi-bus IDMT grading math, reusing `idmt.ts`'s
  verified `tripTime()` across a chain of up to several relays, with
  cascading grading-margin checks between each successive pair.
- `src/lib/faultpropagation.ts` — fault current propagation math, designed
  from scratch: the classic Base kVA Method, converting each network
  element's %impedance to a common base and accumulating it down a radial
  chain (arithmetic %Z summation — see the calculator's own caveat about
  this being a conservative simplification, not a full R+jX study).
- `src/lib/insulationresistance.ts` — insulation resistance math, designed
  from scratch: IEEE 43's traditional kV+1 minimum-IR formula with a
  40°C temperature correction.
- `src/lib/polarizationindex.ts` — polarization index math, designed from
  scratch: PI = IR(10min)/IR(1min), IEEE 43 condition bands and minimum-PI
  by insulation class.
- `src/lib/touchvoltage.ts` — touch voltage math, designed from scratch:
  ground potential rise and touch voltage from an imbalance current and
  ground-path impedance, checked against IEC 60364-4-41 limits.
- `src/lib/ohlvoltagereg.ts` — overhead line voltage regulation math,
  designed from scratch: the standard short-line approximate voltage-drop
  formula from user-supplied conductor R/X per km (deliberately no
  embedded conductor table).
- `src/lib/linelosses.ts` — distribution line loss math, designed from
  scratch: coincident peak from diversity factor, and annual I²R loss via
  the commonly-cited loss-factor approximation (LSF≈0.3LF+0.7LF²).
- `src/lib/rollingsphere.ts` — LPS rolling sphere math, designed from
  scratch: single-mast protection radius (rp=√(2Rh−h²)) reusing the same
  IEC 62305 sphere radii already used in `lightning.ts`.
- `src/lib/voltageunbalance.ts` — voltage unbalance math, designed from
  scratch: NEMA-style %unbalance and motor derating via linear
  interpolation of the published NEMA MG1 / ANSI C84.1 curve.
- `src/lib/panelbalance.ts` — panel balance math, designed from scratch:
  per-phase load balance and the three-phase unbalanced-current phasor
  formula for neutral current.
- `src/lib/gensyncfault.ts` — parallel generator fault contribution math,
  designed from scratch: subtransient-reactance method, summed across all
  paralleled generators at a common bus.
- `src/lib/gensetfuel.ts` — genset fuel consumption math, designed from
  scratch: runtime and cost from tank size and a user-supplied
  manufacturer-datasheet consumption rate (L/hr or L/kWh).
- Twenty-three of the twenty-nine original math libraries were ported from
  your AJ Apps Suite, adapted to TypeScript, and independently verified;
  VT, the power converter, the breaker/fuse sizer, the motor protection
  sizer, the transformer sizer, the UPS sizer, all four Instrumentation &
  Controls calculators (4-20mA loop, IS verification, thermocouple/RTD,
  control cable sizing), all four Building Services & Economics
  calculators (PUE, elevator demand, LCC, tariff), and all seven
  Specialized Industrial & Plant Engineering calculators (heat tracing,
  enclosure cooling, F&G loop budget, static bonding, ESD spark energy,
  VFD savings, generator sync check) were designed from scratch (see
  "Verification notes" below).
- `src/components/` — shared UI (`PremiumSection.tsx` for the locked
  subscriber-feature panels used across the calculators that have
  subscriber tiers, `fields.tsx` for form inputs, `ItemListEditor.tsx` for
  itemized burden lists), plus per-calculator components in `cable/`,
  `arcflash/`, `maxdemand/`, `earthing/`, `pfc/`, `ct/`, `vt/`, `battery/`,
  `busbar/`, `genxfmr/`, `pv/`, `ev/` and `mvcable/`.

## Current features

### IDMT relay coordination
- Relay 1 & Relay 2 input panels (curve family, curve type, pickup current,
  TMS/TD, CT ratio).
- Trip time calculation at a chosen fault current for both relays.
- Full fault-current-range coordination check (not just a single point),
  with a pass/fail grading-margin verdict (default 0.4 s, editable).
- Log-log TCC graph — plots Relay 1 only. "Add Relay 2 to graph" shows a
  subscriber-feature message.

### Cable sizing & voltage drop
- Free: circuit ID, load by kW+PF or design current, conductor
  material/insulation, IEC 60364-5-52 installation method, cores, parallel
  runs, route length, max voltage drop. Produces the recommended cable size,
  design current, base ampacity, voltage drop, and a full sizing comparison
  table across every standard size (1.5–630 mm²).
- Subscriber (shown but disabled): motor-starting voltage drop, full
  derating (ambient/ground temperature, grouping, layering, spacing, soil
  thermal resistivity, harmonic content), adiabatic short-circuit withstand,
  CPC/earth conductor sizing (IEC 60364-5-54), and a lifecycle-cost
  optimizer that compares capital cost against lifetime I²R losses.

### Arc flash
- Free: IEEE 1584-2002 (empirical — equipment class presets, enclosure,
  grounding, gap) and Ralph Lee (theoretical — no upper voltage limit, the
  fallback above 15 kV). Both return arcing current (2002 only), incident
  energy, arc flash boundary, and PPE category with out-of-range warnings.
- Subscriber (shown but disabled): IEEE 1584-2018, the current edition of
  the standard — electrode configuration (VCB/VCBB/HCB/VOA/HOA), enclosure
  size correction, and the arcing-current-variation check. Implements the
  600 V < Voc ≤ 15 kV range; ≤600 V is intentionally left out (see
  verification notes below).

### Maximum demand
- Free: supply (voltage/phase/PF) and an 8-category load schedule
  (lighting, sockets, HVAC, heating, motors, cooking, EV charging, other),
  each with connected kW and its own demand factor. Produces total
  connected load, diversified maximum demand, effective diversity factor,
  design current, a per-category breakdown table, and a recommended main
  switch/breaker from standard IEC frame sizes.
- Subscriber (shown but disabled): multi-board site aggregation (number of
  boards, site-level diversity) plus a future growth margin, producing
  total site maximum demand and a recommended standard transformer size.

### Earthing grid design
- Free: uniform-soil resistivity, surface layer derating, grid resistance
  Rg (Sverak) and ground potential rise, tolerable touch/step voltage
  limits, adiabatic conductor sizing, and single electrode resistance
  (rod/plate/strip/ring, BS 7430).
- Subscriber (shown but disabled): mesh voltage (Em) and step voltage (Es)
  — i.e. the actual IEEE 80 pass/fail safety check against the tolerable
  limits above — plus Wenner/two-layer/three-layer soil modelling,
  parallel electrode systems, transferred potential (offsite hazard) and
  a grid design assistant that searches for the smallest mesh-spacing
  change that brings a failing grid into compliance. **Note:** this
  mirrors your original app's tiering exactly, which means the free tier
  gives Rg/GPR but not the touch/step compliance verdict itself — worth
  a deliberate look if you want the free tier to include a pass/fail
  result.

### Power factor correction
- Free: system/load setup, existing vs. target power factor, required
  reactive compensation Qc, capacitor bank capacitance and current rating,
  and a before/after comparison table (kVA, current, kVAr).
- Subscriber (shown but disabled): harmonic resonance check against system
  short-circuit level (IEC 61000-4-7), detuning reactor sizing, and annual
  energy/cost savings from reduced I²R losses and kVA demand.

### CT sizing & saturation
- Free: CT ratio (Ip/Is), required accuracy limit factor (ALF), knee-point
  voltage (Vk) input, secondary winding resistance, itemized secondary
  burden (relay/meter/instrument devices summed), lead resistance from
  cable length/CSA, total burden Rb, the resulting Vk required vs. actual
  with a pass/fail verdict, and a fault-current table (primary/secondary
  current at 0.2×–50× In).
- Subscriber (shown but disabled): saturation & transient analysis (time
  constant, transient dimensioning factor Ktd, time-to-saturation),
  metering accuracy class limits (0.1–5.0), thermal & mechanical withstand
  (adiabatic-scaled Ith vs. fault duration, peak current vs. rated dynamic
  withstand), multi-ratio tap analysis, and REF/differential CT ratio
  matching (spill current from ratio mismatch).

### VT sizing
- Free: connection type (phase-phase / phase-earth) and network earthing
  system, which together select the IEC 61869-3 rated voltage factor (Vf)
  and its rated duration; rated primary/secondary voltage and turns ratio;
  itemized secondary burden checked against the standard rated VA sizes
  (10–500 VA) with the 25–100%-of-rated-output range where accuracy class
  is guaranteed; and secondary lead voltage drop to a remote instrument or
  relay panel.
- Subscriber (shown but disabled): protection accuracy class (3P/6P) error
  limits at 5% rated voltage and at rated voltage × Vf, rated thermal
  limiting output check, and an open-delta (broken-delta) residual voltage
  estimate for earth-fault detection schemes.

### Battery & DC system sizing
- Free: duty-cycle period entry (current + duration, editable list), the
  IEEE 485 changing-load section-by-section capacity table with the
  governing section highlighted, your own manufacturer Kt (capacity-rating)
  table, and temperature/aging/design-margin correction factors producing
  the final required rated capacity.
- Subscriber (shown but disabled): random/intermittent loads added on top
  of the governing section, cell count & voltage window check (equalize
  and end-of-discharge voltage against equipment limits), and charger
  sizing (continuous load + recharge current).

### Busbar & switchgear rating check
- Free: busbar configuration (material, bars per phase, width/thickness,
  spacing, orientation, mounting), editable thermal/surface factors
  (emissivity, McAdams coefficient, skin/proximity factors), and the
  resulting continuous rating — AC resistance, I²R loss, equilibrium
  temperature rise (solved by damped fixed-point iteration on the heat
  balance), hot-spot temperature, pass/fail against your permissible rise,
  and the estimated max continuous current at that limit.
- Subscriber (shown but disabled): short-time thermal withstand (adiabatic,
  reusing the same bare-conductor k-factor table as CPC sizing) and an
  electrodynamic force check (parallel-conductor force from peak fault
  current, beam-bending stress between supports vs. allowable stress).

### Generator & transformer analysis
- Free (Generator Sizing tab): running load (linear + non-linear with
  derating), motor-starting voltage-dip requirement, the recommended
  genset rating with its governing constraint, and a fuel-consumption
  estimate at that rating.
- Free (Transformer Losses tab): total loss and efficiency at any loading
  fraction from OC/SC test data, the loading point and value of maximum
  efficiency, %R/%X and Kapp's approximate voltage regulation formula, and
  an optional annual loss-cost estimate.
- Subscriber (shown but disabled, NGR/NET Sizing tab): neutral earthing
  resistor sizing (R = V_LN/I_f per IEEE 142) with HRG/LRG classification,
  power/energy dissipated, the charging-current design check, and neutral
  earthing transformer (NET) secondary resistor sizing when a zigzag/star
  NET is used.

### Solar PV sizing
- Free: PV module datasheet entry (Voc/Vmpp/Isc/Impp/Pmax, temperature
  coefficient), string voltage window at site min/max temperature vs. the
  inverter's max DC voltage and MPPT window, string design current (Isc ×
  1.25) vs. the inverter's max DC input current, DC and AC cable sizing
  (reusing the Cable Sizing calculator's ampacity/derating/voltage-drop
  engine), and the DC:AC oversizing ratio with an over/undersizing note.
- Subscriber (shown but disabled): multi-string array design — combined
  MPPT current across parallel strings, whether string-level overcurrent
  protection is required (IEC 60364-7-712), and the recommended string
  fuse rating.

### EV charging
- Free: charging mode guidance (Mode 1–4), phase/voltage/EVSE rated
  current, cable sizing to a single charge point (ampacity + 5% voltage
  drop), recommended breaker from standard sizes, earthing-arrangement
  guidance (including the TN-C-S/PME PEN-conductor warning), and RCD
  protection guidance (Type B vs. Type A/F + RDC-DD per IEC 62955).
- Subscriber (shown but disabled): multi charge point site design — raw
  vs. diversified design current (IEC 60364-7-722.311's diversity rules,
  with or without a Load Management System) and the recommended feeder
  cable size.

### MV cable sizing
- Fully free — no subscriber gate in v1, matching the source app's own
  tiering. A first-principles IEC 60287-1-1 thermal-circuit solver:
  capacitance and reactance from cable geometry, the T1/T3/T4 thermal
  resistances (conductor-to-sheath, sheath-to-serving, serving-to-ambient
  soil), dielectric loss, sheath circulating-current loss factor λ1′ (for
  solid bonding) or 0 (single-point bonding), and an iterative solve for
  the continuous current rating and resulting conductor/sheath
  temperatures. v1 scope: single-core, unarmoured, XLPE-insulated cable,
  buried in duct or direct — free-air installation and armoured cables
  (with their eddy-current losses) are not yet supported.

### Energy storage (BESS) sizing
- Free: usable energy / nameplate capacity / max power sizing from load,
  backup duration, DoD, RTE and C-rate, PCS DC voltage-window and AC power
  checks, and AC cable sizing (reusing `cable.ts`).
- Subscriber (shown but disabled): multi-bank site aggregation (site
  energy/power) and an approximate DoD-vs-cycle-life estimate.

### Harmonic analysis
- Free: IEEE 519-2014 Table 1 voltage THD & individual-order checks, and
  Table 2 current TDD (referenced to max demand load current IL) &
  individual-order checks, for a 7-harmonic spectrum (h2,3,5,7,9,11,13).
- Subscriber (shown but disabled): full per-order breakdown table
  (% of IL vs. limit) and an approximate transformer K-factor.

### Lightning protection & risk assessment
- Free: IEC 62305-1/2 collection area, structure risk (RA touch/step +
  RB physical damage), R1 vs. tolerable-risk check, and minimum LPS class
  search with rolling-sphere/mesh/down-conductor design values.
- Subscriber (shown but disabled): connected-line risk (RU/RV from power
  & telecom line data) added into R1, and SPD/LEMP protection coordination
  (Annex D effective protection level & protection distances).

### Conduit fill
- Fully free — no subscriber gate in v1, matching the source app's own
  tiering. NEC Chapter 9 Table 4 (conduit area) / Table 5 (conductor area)
  fill-percentage check with minimum trade-size suggestion, or IEC/BS 7671
  45% (conduit) / 40% (trunking) space-factor method.

### Cable tray fill
- Entirely a subscriber feature, matching the source app's own tiering —
  inputs are fully usable for preview, results unlock with subscriber
  accounts. NEC §392.22 width/area rules by tray type (ladder/ventilated
  trough/solid-bottom) and cable category (power/mixed, control/signal,
  single-conductor), or IEC 61537-style area-fill.

### Cable pulling tension
- Entirely a subscriber feature, matching the source app's own tiering.
  IEEE 1185 tension/capstan equations across up to 6 pull-route segments
  (straight horizontal/vertical, bends), sidewall bearing pressure, and
  3-cable jam ratio danger-zone check.

### Lighting design
- Free: lumen method (EN 12464-1 or IES Handbook) for interior room
  types — room area, room index (K), required luminaires, and achieved
  illuminance.
- Subscriber (shown but disabled): exterior/area room types (car parks,
  building exterior), and EN 1838 emergency/escape lighting minimum-
  illuminance & uniformity-ratio checks.

### HVAC electrical sizing
- Free: single motor-compressor branch-circuit sizing — NEC Article 440
  MCA/MOCP/disconnect sizing, or IEC 60364-5-52 general-method design
  current.
- Subscriber (shown but disabled): multi-motor combination-load equipment
  sizing (largest-motor + sum-of-others method) and VFD-fed motor input-
  side/output-side sizing.

### Emergency power (genset+UPS) load sequencing
- Entirely a subscriber feature, matching the source app's own tiering.
  NFPA 110 Type/Class classification from required interruption time &
  runtime, UPS-to-genset bridge timing check (genset ready time vs. UPS
  autonomy, with a 25% margin flag), and a staged load-step pickup
  planner that checks single-step acceptance %, cumulative generator
  loading, and NFPA 110 priority-order (700/701/702) sequencing.

### Motor calculator
- Entirely a subscriber feature, matching the source app's own tiering —
  standalone from any protection-relay motor tab. NEC Article 430 Table
  430.248 (single-phase) / 430.250 (three-phase induction & synchronous)
  FLC lookups, branch-circuit ampacity/OCPD (Table 430.52(C)(1) with the
  430.52(C)(1)(b) exception ceiling)/overload/disconnect sizing, or IEC
  general method; starting-method (DOL/star-delta/soft-starter/VFD)
  voltage-dip check against source short-circuit capacity; and multi-motor
  feeder sizing per NEC 430 Part V.

### kW / kVA / kVAR / Amps converter
- Fully free — no subscriber gate, matching the app's other pure-utility
  calculators (Conduit Fill, MV Cable Sizing). Enter phase, voltage, power
  factor and any one known quantity (kW, kVA, kVAR, or Amps) to get the
  other three from the AC power-triangle relations (S=√(P²+Q²), P=S·PF,
  Q=S·sinφ) and the appropriate single-phase/three-phase current formula.
  No equivalent module exists in the source app — built from scratch.

### Circuit breaker & fuse sizer
- Fully free — no subscriber gate. General/continuous-load path: NEC
  210.19(A)(1)/215.2(A)(1) minimum OCPD (125% continuous + 100%
  non-continuous), rounded to the nearest NEC 240.6(A) standard size,
  checked against cable ampacity per 240.4 (including the 240.4(B)
  next-standard-size-up exception when the cable ampacity itself isn't a
  standard OCPD rating) — or IEC 60364-4-43's Ib≤In≤Iz with the
  conventional operating current I2≤1.45×Iz (I2 = 1.45×In for breakers,
  1.6×In for fuses, so a fuse can fail this check even when a breaker of
  the same rating would pass). Motor-load path reuses the exact NEC
  430.52(C)(1) percentage-of-FLC method (and the 430.52(C)(1)(b)
  exception ceiling) from the standalone Motor Calculator, so the two
  tools always agree. No equivalent module exists in the source app —
  built from scratch.

### Motor protection sizer
- Fully free — no subscriber gate. Overload relay setting uses the same
  NEC 430.32(A)(1) 115%/125% rule as the Motor Calculator and HVAC
  Electrical Sizing modules; trip class (IEC 60947-4-1 Class 10A/10/20/30)
  is selected from the motor's accelerating time; contactor sizing uses
  IEC 60947-4-1's AC-3 (normal starting) vs. AC-4 (jogging/plugging/
  reversing) utilization categories, matched to a standard AC-3 frame-size
  table. **Caveat**: the AC-4 sizing multiplier is a conservative
  rule-of-thumb (there's no single universal AC-4:AC-3 ratio in the
  standard — it's manufacturer/model specific), and the ground-fault
  pickup guidance is typical-practice guidance only, not a substitute for
  a proper protective-device coordination study — both are clearly
  labelled in the app. No equivalent module exists in the source app —
  built from scratch.

### Transformer sizer
- Fully free — no subscriber gate. Sizes a new transformer (or an N-1
  redundant group) from connected load (kW+PF or direct kVA), growth and
  safety margins, ambient derating above the IEC 60076-1/2-aligned 40°C
  reference, and altitude derating above the IEC 60076-2/-11-aligned
  1000m reference (natural- vs. forced-cooled rates, since IEC 60076-2
  requires a steeper temperature-rise reduction per metre for
  forced-cooled types) — rounded to either standard ANSI/IEEE three-phase
  kVA ratings or IEC 60076-1's preferred-number (R10 series) sizes, whose
  different size steps can genuinely change the recommendation for the
  same load. **Caveat**: the 40°C ambient and 1000m altitude reference
  points themselves are directly from IEC 60076-1 §4.2 / IEC 60076-2
  §5.1/§6.3.2, but the specific derating *rates* (%/°C, %/100m) are
  commonly published engineering rules of thumb converting the standards'
  temperature-rise-limit reductions into an approximate capacity factor —
  the loading guides (IEC 60076-7 oil-immersed, IEC 60076-12 dry-type)
  instead use a full hot-spot-temperature/insulation-aging thermal model
  that's out of scope here; always confirm against the manufacturer's
  own thermal/altitude rating curve. **Note**: this calculator is
  distinct from the Generator &amp; Transformer Analysis calculator's
  Transformer tab, which analyzes losses/efficiency/regulation of an
  *existing* unit from test data rather than sizing a new one from load
  — no equivalent "size from load" module exists in the source app, so
  this was built from scratch.

### UPS sizing
- Fully free — no subscriber gate. Required UPS kVA rating from critical
  load, margin, and the same N-unit redundancy model as the transformer
  sizer (commonly called "N+1" in UPS terminology), plus an approximate
  battery energy/Ah figure for the stated backup time. For a full IEEE
  485 duty-cycle section-by-section battery design, use the dedicated
  Battery &amp; DC System Sizing calculator — this module's battery
  figure is a quick sizing estimate, not a replacement for that method.
  No equivalent module exists in the source app — built from scratch.

**Already covered — Generator Sizer**: standby/prime generator kW/kVA
sizing for a facility (running load + motor-starting kVA, with a
voltage-dip check) is already implemented as the Gen tab of the
**Generator &amp; Transformer Analysis** calculator — no new module was
added for this.

No real accounts/payments are wired up yet on any calculator — the
subscriber sections are UI gates ready for when subscriptions launch.

## Verification notes

These are safety/engineering-adjacent calculations, so each math library was
checked against known values before shipping, not just ported and trusted:

- **Cable sizing**: cross-checked a 50 kW/415 V/3-phase/Cu/PVC70/Method C/
  50 m scenario by hand and against the live code — both gave 25 mm² at
  2.64% voltage drop. **Updated**: after the user supplied the official IEC
  60364-5-52:2009 PDF, the ampacity table (`AMPACITY` in `src/lib/cable.ts`)
  was re-transcribed cell-by-cell against the standard's own Table
  B.52.4/B.52.5 (methods A1/B1/C/D1) and Table B.52.10-B.52.13 (methods
  E/F), replacing the previous representative/approximated values. This
  caught two real errors: the XLPE90 "A1" column for both copper and
  aluminium had accidentally been populated with the PVC70 "C" column's
  figures, and the B1/D1/E/F columns drifted from the published values by
  a growing margin at larger conductor sizes (up to ~30A off by 300 mm²
  for method D1). All four ampacity sub-tables (Cu/PVC70, Cu/XLPE90,
  Al/PVC70, Al/XLPE90) across all six installation methods now match the
  standard exactly, including correctly leaving method C/A1/B1/D1
  unavailable above 300 mm² and method F unavailable below 25 mm² — both
  of which reflect gaps in the standard's own tables, not missing data on
  this app's part. The soil-thermal-resistivity correction table
  (`deratingCi`) was also corrected to the standard's exact published
  range (0.5-3 K·m/W, Table B.52.16) instead of an extrapolated 1-3.5
  range. The ambient-temperature, ground-temperature and grouping-factor
  correction tables were checked against the same PDF and found to
  already match Tables B.52.14/B.52.15/B.52.17 exactly — no change needed
  there. The mV/A/m voltage-drop table remains a typical/representative
  resistance-reactance table, since IEC 60364-5-52 Annex G itself only
  publishes a percentage voltage-drop limit and a general formula, not a
  per-size mV/A/m table — this is a genuine, unavoidable approximation
  rather than an oversight, and is now documented as such directly in
  `src/lib/cable.ts`.
- **Maximum demand**: hand-checked a 4-category load schedule end to end
  (connected load, weighted demand, design current, breaker selection, and
  the multi-board/transformer sizing) — every intermediate value matched
  the code exactly.
- **Earthing**: ran the default grid (30×20 m, 4×3 conductors, 100 Ω·m,
  10 kA fault) end to end and confirmed internal consistency across
  Rg → GPR → Em/Es → touch/step pass-fail; results correctly flag an
  unsafe default configuration (no surface layer, no mitigation).
- **Power factor correction**: hand-checked the default 500 kW/PF 0.75→0.95
  scenario — Qc = 276.6 kVAr matched the code exactly.
- **IDMT**: curve outputs checked against the published IEC 60255-151 SI/VI/EI
  reference table at TMS=1.0 for multiple current multiples.
- **Arc flash — bug found and fixed**: IEEE 1584-2002 defines two separate
  arcing-current equations — a full one for ≤1 kV, and a much simpler one
  (independent of gap/enclosure) for 1–15 kV systems. The source app in your
  AJ Apps Suite only implements the ≤1 kV equation and applies it at every
  voltage, which for MV systems produces nonphysical results (in one test
  case, an "arcing current" over 3000 kA — 200x the bolted fault current,
  which is impossible). This is fixed in `src/lib/arcflash.ts` — worth
  knowing about if you use the arc flash module in your original app suite
  for anything above 1 kV.
- **Arc flash 2018**: the arcing-current calculation was independently
  checked against a third-party tool's published Annex D verification figure
  (12.979 kA) and matched to 3 decimal places. The enclosure size correction
  factor (CF) sub-calculation carries a caveat from the original
  implementation: it matched exactly on tested enclosure width, but the
  height calculation has a residual discrepancy against the worked example
  that wasn't fully resolved (results came out modestly more conservative in
  the one case checked, but that isn't proven to hold universally). This
  caveat is shown in the app's locked 2018 section and should be resolved
  before that section goes live for subscribers.
- **CT sizing**: ported directly from your AJ Apps Suite's `CT` module and
  hand-checked with its default scenario (400/1A CT, 2.5VA relay + 20m/2.5mm²
  leads) — Rb = 2.78 Ω, Vk required = 105.6 V at ALF=20, matched the code
  exactly. Saturation, thermal/mechanical and tap-analysis formulas were
  likewise cross-checked term-by-term against the source.
- **VT sizing — built from scratch**: no equivalent module exists in your
  AJ Apps Suite, so this was designed directly from IEC 61869-3 principles
  rather than ported. Sourced from the standard's own structure (rated
  voltage factor by primary connection/earthing system, standard rated
  burden VA values, the 80–120% voltage / 25–100% burden accuracy-guarantee
  range) plus a third-party summary of IEC 61869-3 Table 1 (voltage factors)
  and Table 2 (accuracy class applications), and IEEE C57.13 burden
  convention background. Hand-checked the default 11kV/110V phase-earth
  scenario: Up = 6.351kV, Us = 63.51V, ratio = 100.0 (correctly independent
  of the √3 division, since it cancels for line-to-line vs. phase-earth
  VTs on the same system), 8VA burden → 10VA recommended standard size →
  80% loaded (within the 25–100% accuracy range) — all matched the code.
  Two simplifications are worth knowing about: the secondary lead
  voltage-drop calculation assumes the connected burden draws current in
  phase with the secondary voltage (ignores burden power factor, similar
  to the PFC module's fixed-injection simplification), and the open-delta
  residual voltage figure (3× phase-earth secondary voltage) is a
  theoretical estimate — actual broken-delta winding ratios are
  manufacturer-specific and should be confirmed against the datasheet.
- **Battery sizing**: hand-checked the default illustrative 4-period duty
  cycle end to end, including the changing-load recursion (Aⱼ = A(j-1) ×
  [Kt(Tj)/Kt(T(j-1))] + (Ij - I(j-1)) × Kt(Tj)) — every section's Kt
  interpolation and required capacity matched the code, the governing
  section (4, 195.75) and final corrected capacity (269.156, after
  ×1.00×1.25×1.10) matched exactly, as did the cell-count/voltage-window
  and charger-sizing subscriber calculations.
- **Busbar rating**: hand-checked the electrodynamic force/stress chain
  (100kA peak, 150mm spacing → 13,333 N/m → 600 N·m moment → 360 MPa
  stress vs. 32.9 MPa allowable) and the short-time thermal withstand
  (40kA, 1s, Cu → 251.6 mm² required) against the code — both matched
  exactly. Note the default demo scenario is intentionally a severe
  combination (matches the source app's own placeholder values) and
  correctly fails both subscriber checks — that's the formulas working
  correctly, not a bug.
- **Generator & transformer analysis**: hand-checked all three
  sub-calculators against their default scenarios — generator sizing
  (502.94 kVA running requirement governs over 240 kVA voltage-dip
  requirement), transformer losses/efficiency (98.516% at full load,
  98.964% max efficiency at x=0.405, 4.140% voltage regulation via Kapp's
  formula), and NGR sizing (11kV system → 6350.85V phase voltage → 635.09Ω
  resistor, classified HRG) — every value matched the code exactly.
- **Solar PV sizing**: hand-checked the default 20-module string (49.5V
  Voc, -0.29%/°C, 5°C to 65°C site range) end to end — cold factor 1.058
  → Vmax 1047.42V, hot factor 0.884 → Vmpp range 733.72-878.14V, DC cable
  sizing correctly iterated past 1.5mm² and 2.5mm² (both fail the 2% VD
  limit) to 4mm² at 1.382% VD, and AC cable sizing to 2.5mm² at 2.063% VD
  — every intermediate value matched the code exactly, including the
  pass/fail verdicts (the default scenario intentionally fails the Vmax
  and MPPT window checks, since the placeholder module/inverter values
  from the source app weren't chosen as a mutually-consistent example).
- **EV charging**: hand-checked the default 32A Mode 3 charge point (Cu,
  XLPE90, method C, 25m) — cable sizing correctly iterated to 4mm² at
  3.811% VD (within the 5% limit) and a 32A breaker, and the default
  10-point multi-site scenario (no LMS, so diversity = 1) — 320A raw and
  diversified current, feeder sizing to 120mm² at 1.995% VD — both matched
  the code exactly.
- **MV cable sizing**: ported the full IEC 60287-1-1 thermal-circuit
  solver term-by-term from the source app (which itself cross-checks
  against CIGRE Technical Brochure 880) — geometry build-up, capacitance,
  reactance, T1/T3/T4 thermal resistances, dielectric loss, and the
  iterative rating equation. Re-verified every intermediate formula by
  hand against its IEC 60287-1-1 definition and ran the CIGRE TB880 Case
  #0-1 default scenario (132kV Cu/XLPE/Al-sheath, buried in duct) end to
  end: it converges in 5 iterations to a 821.8A rating with the conductor
  temperature landing exactly at the 90°C limit (as the solving method
  guarantees by construction) and a physically sane 78.7°C sheath
  temperature. This confirms the port is arithmetically faithful to the
  source; it doesn't independently re-derive the CIGRE-published figure
  from scratch, since that would require the full CIGRE TB880 document.

- **Energy storage (BESS)**: hand-checked the default 100kW/2h backup
  scenario end to end — usable energy 200kWh, nameplate 241.546kWh
  (200 / (0.9×0.92)), max power 120.773kW at 0.5 C-rate (≥100kW load,
  passes), voltage window and PCS power checks, AC cable sizing to
  70mm² at 0.984% VD, and the 2-bank site aggregation (483.092kWh /
  241.546kW) with a 3750-cycle estimate at 90% DoD — every value matched
  the code exactly.
- **Harmonic analysis**: hand-checked the default 0.4kV/50-band spectrum
  — VTHD 2.8% (pass, 8% limit), worst individual voltage h5=2% (pass, 5%
  limit), ITHD 6.663%, TDD 5.330% (pass, 8% limit at Isc/IL 20–50), worst
  individual current h5=4% of IL (pass, 7% limit) — and the full per-order
  breakdown table plus K≈1.147 all matched the code exactly.
- **Lightning protection**: re-ran the source app's own IEC 62305-2 Annex
  E "country house" case study end to end with the connected-line risk
  included (subscriber-tier RU/RV) — R1 = 2.5056×10⁻⁵, matching the
  source's documented expected value of ≈2.51×10⁻⁵. The free-tier
  structure-only risk (RA+RB, no lines) was also checked in isolation.
- **Conduit fill**: hand-checked 6× 12 AWG THHN in 3/4" EMT — sum of
  conductor areas 0.0798in² against a 0.533in² total (40% tier for 3+
  conductors → 0.2132in² max) = 14.97% fill, pass, with "1/2" EMT
  suggested as the minimum size — matched the code exactly. IEC circular-
  conduit area-fill formula (πr²) also spot-checked by hand.
- **Cable tray fill**: hand-checked the default power/mixed, no-4/0+
  scenario (6× 0.6in cables in a 12in-wide, 4in-deep ladder tray) —
  area-only rule since no 4/0+ cables present, 1.696in² against a
  14.004in² max (38.9% of area, depth capped at 3in) — matched the code
  exactly. This calculator is entirely a subscriber feature in the source
  app, so results are locked on the free site, but the underlying math
  (including the hybrid Sd+area rule for mixed 4/0+ and smaller cables)
  was ported and verified for when subscriptions launch.
- **Cable pulling tension**: hand-checked the default 3-segment route
  (two 50ft horizontal straights + a 90° bend at 2ft radius, f=0.35,
  w=3.3lb/ft) — tension builds to 57.75lbf, then 115.5lbf, then the bend's
  capstan equation (T×e^(fθ)) takes it to 200.146lbf with 100.073lb/ft
  peak sidewall pressure (both pass their 5000lbf/300lb/ft limits) — and
  the jam ratio (4in ID / 1.45in OD = 2.759, inside the 2.6–3.2 danger
  zone) — every value matched the code exactly.
- **Lighting design**: hand-checked the default 10m×8m office at 500 lux
  target — area 80m², room index K=1.778, exact luminaire count 22.73 →
  23 required, achieved illuminance 506 lux — and the EN 1838 escape-route
  emergency check (1.2 lux measured min ≥ 1 lux required, pass; 12.5:1
  uniformity ratio ≤ 40:1 required, pass) — all matched the code exactly.
- **HVAC electrical sizing**: hand-checked the default single-motor NEC
  scenario (18A RLA) — MCA 22.5A, MOCP 35A (175% RLA = 31.5A rounded up to
  next standard size), disconnect 20.7A — plus the subscriber-tier
  combination-load (compressor 18A + fan 4A → combo MCA 26.5A, combo MOCP
  39A) and VFD-fed motor (25A input/22A output → 31.25A/27.5A MCA) — all
  matched the code exactly.
- **Emergency power load sequencing**: hand-checked the default NFPA 110
  scenario — 10s max interruption → Type 10, 48h min runtime → Class 48;
  genset ready time 1.5+10+0.3=11.8s vs. 30s UPS autonomy (passes with
  >25% margin, 14.75s); and the 3-step load planner (50kW→130kW→280kW,
  correctly ordered emergency→legal→optional priority, no warnings) — all
  matched the code exactly. This calculator is entirely a subscriber
  feature in the source app, so results are locked on the free site, but
  the underlying math was ported and verified for when subscriptions
  launch.
- **Motor calculator**: hand-checked the default 25HP/460V/3-phase
  squirrel-cage motor (NEC) — FLC 34A (Table 430.250), branch ampacity
  42.5A, disconnect/overload 39.1A (115%), max OCPD 60A (175% dual-element
  fuse, rounded up from 59.5A), 430.52(C)(1)(b) exception ceiling 70A
  (225%, rounded down from 76.5A) — plus DOL starting at 180A LRA →
  143.414kVA → 2.788% voltage dip (passes 15% limit) at 5000kVA source
  capacity, and the 2-motor feeder (28A + 14A → 49A ampacity, 64A OCPD) —
  every value matched the code exactly. This calculator is entirely a
  subscriber feature in the source app, so results are locked on the free
  site, but the underlying math was ported and verified for when
  subscriptions launch.

- **kW/kVA/kVAR/Amps converter**: hand-checked the default 3-phase
  100kW/415V/0.85 PF scenario — S=117.647kVA (100/0.85), Q=61.968kVAR
  (S×sin(acos(0.85))), line current 163.68A (S×1000/(√3×415)) — and a
  round-trip check (feeding the computed 117.647kVA back in as the known
  quantity correctly recovers the original 100kW). Also confirmed the two
  ill-defined inverse cases — kW known at PF=0, and kVAR known at PF=1 —
  correctly return null instead of NaN or a division-by-zero throw.

- **Circuit breaker & fuse sizer**: hand-checked the default NEC scenario
  (80A continuous + 20A non-continuous) — minimum OCPD 120A, rounded to
  the standard 125A size, protected by a 130A cable — and the 240.4(B)
  exception path (a 125A breaker on a non-standard 122A cable correctly
  passes via the next-size-up rule, while the same breaker on a
  standard-rated 100A cable correctly fails, since no exception applies
  there). Also confirmed the IEC path's fuse-vs-breaker distinction is
  real: a fuse's I2=1.6×125A=200A fails the 1.45×Iz check on a tight
  cable where the equivalent breaker (I2=1.45×In) passes. The motor path
  was cross-checked against the standalone Motor Calculator's own
  verified 34A-FLA figures (60A recommended, 70A exception ceiling) and
  matched exactly, confirming the two tools stay consistent.
- **Motor protection sizer**: hand-checked the default 34A-FLA scenario —
  115% overload setting (39.1A), Trip Class 10 at an 8s start time, AC-3
  contactor sizing to a 40A standard frame, and a 6.8A ground-fault
  pickup on a solidly grounded system (20%×FLA, above the 5A floor) — all
  matched the code exactly. Also swept all four IEC 60947-4-1 trip-class
  boundaries (2s→10A, 10s→10, 15s→20, 25s→30), confirmed cyclic/frequent-
  starting duty correctly flags a thermal-memory relay recommendation,
  confirmed AC-4 duty correctly doubles the required contactor rating
  (34A→68A, rounding to an 80A frame vs. AC-3's 40A for the same motor),
  and confirmed the HRG ground-fault path correctly withholds a pickup
  value until a system charging current is entered.

- **Transformer sizer**: hand-checked the default 800kW/0.9PF scenario
  (15% growth + 10% safety margin, 45°C ambient, 1000m altitude, N=2
  redundant pair) — design load 888.9kVA, margined load 1124.4kVA,
  ambient derate factor 0.9375 (5°C above the 40°C reference × 1.25%/°C),
  effective required capacity 1199.4kVA, and — since N=2 means any 1 of 2
  units must carry the full load alone — a 1500kVA per-unit
  recommendation (3000kVA total installed) — all matched the code
  exactly. Also confirmed: N=3 correctly halves the per-unit requirement
  (750kVA vs. 1500kVA for the same load); ambient ≤40°C and altitude
  ≤1000m each correctly apply no derating; a naturally-cooled (ONAN)
  transformer at 2000m derates to 0.96 (0.4%/100m × 1000m excess),
  combining with the 45°C ambient factor to exactly 0.9; a forced-cooled
  (ONAF) unit at the same altitude derates further to 0.95, correctly
  reflecting IEC 60076-2's steeper per-metre requirement for forced
  cooling; and switching to IEC 60076-1's preferred-size list recommends
  1250kVA for the same load that rounds to 1500kVA on the ANSI list —
  confirming the standard-basis choice is not just cosmetic.
- **UPS sizing**: hand-checked the default 200kW/0.9PF critical load
  scenario (20% margin, N=2, 15-minute backup, 0.8 DoD, 0.92 inverter
  efficiency, 480V DC bus) — design load 222.2kVA, margined 266.7kVA,
  300kVA recommended UPS size (270kW capability at 0.9 rated PF), 50kWh
  usable battery energy, ≈67.935kWh nameplate battery energy, and
  ≈141.5Ah approximate capacity at 480V — all matched the code exactly.
  Also confirmed N=1 correctly disables redundancy (divides by 1) and
  that a zero backup time correctly withholds a battery estimate instead
  of returning a nonsensical zero.
- **4-20mA current loop**: hand-checked a 24V supply / 250Ω receiver /
  500ft of #22 AWG / 10V transmitter-minimum scenario — 16.14Ω round-trip
  wire resistance, 266.14Ω total loop resistance, 18.677V at the
  transmitter, 8.677V of headroom, pass — matched the code exactly. Also
  confirmed a long thin-gauge run correctly fails the headroom check.
- **Intrinsic safety verification**: hand-checked a P+F-style barrier
  (Uo=28V/Io=93mA/Po=650mW/Co=0.083µF/Lo=4.2mH) against a field device
  (Ui=30V/Ii=130mA/Pi=1000mW/Ci=5nF/Li=0) over 500m of cable at the
  standard 60pF/ft default — voltage/current/power all pass, but the
  cable's 98.5nF plus the device's 5nF (103.5nF total) correctly exceeds
  the barrier's 83nF Co, producing a genuine, correctly-flagged capacitance
  failure at that length; a 50m run with the same components correctly
  passes.
- **Thermocouple & RTD**: verified all four supported thermocouple types
  (K, J, T, E) round-trip against their well-known NIST reference-table
  voltages at 100°C (4.096mV, 5.269mV, 4.279mV, 6.319mV respectively) —
  the code's forward (via numeric inversion) and inverse polynomials
  matched every reference point to well within the NIST-stated tolerance
  (a few thousandths of a degree to a few hundredths of a °C). Also
  confirmed a Type K cold-junction-compensation round trip (measured
  voltage for a 200°C hot junction at a 25°C cold junction, compensated
  back to 200°C) and Pt100 RTD values against the textbook-exact
  Callendar-Van Dusen references (138.51Ω at 100°C, 60.256Ω at −100°C, both
  directions).
- **Control/instrumentation cable sizing**: hand-checked 800m of HART
  cable at 150pF/m against a 200nF host limit — 120nF total, within
  budget, with a 1333.3m maximum length for that cable/host combination —
  matched the code exactly; a 2000m run with the same cable correctly
  exceeds the capacitance budget.
- **Data center PUE**: hand-checked 1,500,000kWh total facility energy
  against 1,000,000kWh IT equipment energy at $0.12/kWh — PUE = 1.5, DCiE
  = 66.67%, 500,000kWh (33.3%) overhead energy costing $60,000, classified
  as "Moderate" on the Green Grid scale — matched the code exactly. Also
  confirmed a lower-overhead scenario correctly classifies as "world-class"
  and that IT energy exceeding total energy (a physically invalid input)
  correctly returns null rather than a nonsensical result.
- **Elevator electrical demand**: hand-checked a 1000kg/1.5m/s/50%-balance/
  70%-efficiency elevator — net unbalanced load 500kg, single-unit motor
  power 10.511kW — against the standard elevator power formula by hand,
  and confirmed the full NEC Table 620.14 demand-factor sweep (1→1.00,
  2→0.95, 9→0.73, 10→0.72, 15→0.72, correctly clamped at the 10-or-more
  value) against two independently cross-checked published summaries of
  the table. 4 elevators at the 0.85 demand factor gives a 35.74kW demand
  load from a 42.04kW connected load — matched the code exactly.
- **Life-cycle cost**: hand-computed the full 20-year discounted-cash-flow
  summation (Σ 12,000×1.03^(t-1)/1.06^t) for the default Option A term by
  term and confirmed it matches the code's present-worth output exactly
  (≈$174,738, LCC≈$224,738); confirmed the premium-efficiency Option B has
  the lower life-cycle cost by ≈$32,965 over 20 years, with a ≈5.143-year
  simple payback on its extra first cost (18,000/3,500); and confirmed
  that at 0% discount/escalation the present worth collapses to a simple
  sum (10 years × $12,000 = $120,000), as it should.
- **Demand charge / TOU tariff**: hand-checked the default two-period
  scenario (8,000kWh peak @ $0.42 + 15,000kWh off-peak @ $0.22 = $6,660
  energy charge; 120kW × $35 = $4,200 demand charge; a 2-point PF
  shortfall at 0.5%/point = 1% penalty = $42; plus a $100 fixed charge) —
  $11,002 total, matched the code exactly. Also confirmed a power factor
  at or above the utility threshold correctly incurs no penalty.
- **Heat tracing circuit sizing**: hand-computed the cylindrical-conduction
  heat loss for the default 114mm pipe / 50mm mineral-wool-insulation /
  20°C ΔT scenario (2π×0.04×20/ln(0.214/0.114) ≈ 7.98 W/m) and confirmed it
  matches the code exactly, along with the 1.3-factor required output
  (≈10.38 W/m, correctly covered by the 20W/m selected cable) and the
  resulting 80m circuit's current (6.96A, within a 16A breaker). Also
  confirmed a 5W/m heater is correctly flagged as inadequate.
- **Panel/MCC enclosure cooling**: hand-computed the default free-standing
  2000×800×600mm enclosure's effective dissipating area (6.08m²) and
  confirmed the natural-convection capacity (5.5×6.08×10 = 334.4W) is
  correctly flagged as inadequate against 600W of losses, with the
  IEC 60890-derived fan sizing (3.1×600/10 = 186 m³/h) matching by hand.
  Also confirmed a lower 200W loss case is correctly handled by natural
  convection alone, with no fan requirement computed.
- **Fire & gas detection loop budget**: hand-checked the default 24V/10-
  detector scenario in both standby (7.4mA, 23.85V at the farthest device)
  and worst-case alarm (36.9mA, 23.26V) states — both pass against a 16V
  minimum, matching the code exactly. Also confirmed an excessively long
  loop (500Ω) correctly fails the alarm-state voltage check.
- **Static bonding & grounding check**: confirmed the default 25kΩ reading
  passes the 1MΩ NFPA 77 threshold and is correctly classified as
  "acceptable" rather than a tight metallic bond (≤10Ω, separately
  confirmed with a 5Ω case); a 2MΩ reading correctly fails.
- **ESD spark energy check**: hand-computed the default 100pF/10,000V
  scenario's spark energy (0.5×100pF×10,000V² = 5mJ) and confirmed it
  correctly fails against a 0.25mJ MIE; a lower 500V case correctly drops
  the spark energy below the MIE and passes.
- **VFD energy savings**: hand-checked the default 75kW/30%-flow-reduction
  scenario — VFD power 75×0.7³=25.725kW, power savings 49.275kW, annual
  energy 295,650kWh, annual cost savings $35,478 — all matched the code
  exactly. Also confirmed zero flow reduction correctly yields zero
  savings.
- **Generator sync check**: hand-checked the default 415V/412V,
  50.05Hz/50.00Hz, 3° scenario — 0.728% voltage difference, 0.05Hz
  frequency difference (20s beat period), all three checks passing —
  matched the code exactly. Also confirmed a 45° phase angle correctly
  fails both the phase check and the overall verdict.
- **IDMT earth fault relay (50N/51N)**: hand-checked a 1500A earth fault
  through a 200:1 CT against a 0.2A (secondary) pickup, IEC SI, TMS 0.2 —
  relay current 7.5A, PSM 37.5×, operating time ≈0.37s, matching the same
  verified curve equation used by the phase IDMT calculator exactly.
- **Transformer differential protection (87T)**: hand-checked the default
  I1=1.05pu/I2=0.98pu scenario — Id=0.07pu, Ir=1.015pu, operate threshold
  0.55375pu (below the 2.0pu knee, slope1 applies) — correctly does not
  trip. A large-mismatch case (I1=3.0pu, I2=0.1pu) correctly trips.
- **Multi-bus IDMT relay grading**: hand-checked a 3-relay chain (pickups
  1A/1.2A/1.5A secondary, CT ratios 200/300/400, TMS 0.1/0.2/0.3, all IEC
  SI) at a 5000A fault — operating times ≈0.21s/0.52s/0.97s, correctly
  showing the first grading step (≈0.31s margin) fails a 0.4s minimum
  while the second (≈0.45s) passes — a genuine illustration of a study
  catching an inadequate step.
- **Fault current propagation (Base kVA Method)**: hand-checked the
  default 1000kVA base/415V/250MVA-source/1000kVA-transformer(6%Z)/
  cable(1.5%Z) chain — source %Z=0.4%, cumulative %Z after the transformer
  =6.4% (15.625MVA), after the cable=7.9% (12.658MVA, ≈17.6kA) — matched
  the code exactly. The arithmetic %Z summation (vs. a full R+jX vector
  sum) is clearly caveated in the UI as a conservative simplification.
- **Insulation resistance checker**: hand-checked a 6.6kV machine reading
  12MΩ at 40°C against the IEEE 43 kV+1 minimum (7.6MΩ) — correctly
  passes; a 2MΩ reading on the same machine correctly fails.
- **Polarization index**: hand-checked IR(1min)=15MΩ/IR(10min)=33MΩ — PI
  2.2, "Good" band, meets the Class B/F/H minimum of 2.0. A declining
  reading (IR(10min) < IR(1min)) correctly bands as "Dangerous" (PI<1.0).
- **Touch voltage from imbalance**: hand-checked 15A through a 2Ω ground
  path (30V GPR, 30V touch voltage) against the 50V dry limit — passes; a
  20A/2Ω wet-environment case (40V) correctly fails the stricter 25V limit.
- **Overhead line voltage regulation**: hand-checked the default 11kV/100A/
  0.85PF/5km scenario against the standard √3×I×(Rcosφ+Xsinφ) formula —
  matched the code to the decimal.
- **Distribution line technical losses**: hand-checked the default 500kW
  peak/1.2 diversity/60% load factor scenario — loss factor 0.432,
  coincident peak 416.667kW — matched the code exactly.
- **LPS rolling sphere method**: hand-checked a 10m mast against a Class
  III (45m) sphere — rp=√(2×45×10−10²)=√800≈28.284m, matched the code
  exactly. A mast taller than its class's sphere radius is correctly
  flagged rather than computed.
- **Phase voltage unbalance & motor derating**: hand-checked Vab=415V/
  Vbc=408V/Vca=420V — 1.529% unbalance, correctly interpolated between
  the published 1%→0.98pu and 2%→0.95pu curve points. A case beyond 5%
  unbalance is correctly flagged rather than extrapolated a derating
  factor.
- **DB panel balancer**: hand-checked IL1=45A/IL2=38A/IL3=52A against the
  three-phase unbalanced-current phasor formula — neutral current
  ≈12.12A, matched the code exactly. A perfectly balanced 40/40/40A case
  correctly gives zero neutral current.
- **Parallel generator fault contribution**: hand-checked two 500kVA/415V
  generators at Xd''=0.12pu — rated current ≈695.6A each, fault
  contribution ≈5.80kA each, ≈11.59kA total at the common bus — matched
  the code exactly.
- **Genset fuel consumption**: hand-checked a 500L tank at a direct 45L/hr
  consumption rate — runtime ≈11.11 hours, $54/hr at $1.20/L — matched
  the code exactly. Also confirmed the L/kWh basis correctly derives the
  same 45L/hr rate from 0.3L/kWh at 150kW load.

## Next steps (not built yet)

- Real user accounts / subscriptions / payments — the site is fully
  unlocked for the free launch period (see above); this is the actual
  paywall infrastructure needed before flipping `FREE_LAUNCH` back off.
- Resolve the IEEE 1584-2018 enclosure size correction factor discrepancy
  noted above before that section is unlocked for real use.
- Build the transferred-potential (Earthing), grid design assistant
  (Earthing), and SPD/LEMP protection (Lightning Protection) math —
  currently described in the UI but not implemented.
- Multi-standard support for cable sizing (AS/NZS 3008, BS 7671, NEC) —
  currently IEC 60364-5-52 only.
- Rare-metal/high-temperature thermocouple types N, R, S and B — the
  Thermocouple & RTD calculator currently supports K, J, T and E only,
  which cover the large majority of general industrial instrumentation;
  the other four were intentionally left out rather than risk
  unverified coefficient data.
- SLD (single-line diagram) builder, load flow analysis, component
  database/part matching, and ETAP/SKM export — scoped out of the current
  roadmap as unrealistic for this project's current stage; the
  Instrumentation & Controls group (4-20mA loop, IS verification,
  thermocouple/RTD, control cable sizing), the Building Services &
  Economics group (PUE, elevator demand, LCC, tariff), and the Specialized
  Industrial & Plant Engineering group (heat tracing, enclosure cooling,
  F&G loop budget, static bonding, ESD spark energy, VFD savings,
  generator sync check) were built instead.
- Advanced Power Systems & Renewables (from the same expansion-pack
  roadmap) — not yet started.
- Cathodic protection sizing, vibration-monitoring thresholds, and
  compressor specific-power benchmarking were considered for the
  Specialized Industrial group but intentionally left out — mostly
  mechanical/corrosion-engineering content with thin genuine electrical
  content, or no real standard to build against honestly.
- A gap analysis against electricalsnotes.com's own tools/calculators
  page identified 14 genuinely-missing electrical calculators, all now
  built and shipped: IDMT earth fault relay, transformer differential
  protection, multi-bus IDMT grading, fault current propagation (Base
  kVA Method), insulation resistance checker, polarization index, touch
  voltage from imbalance, overhead line voltage regulation, distribution
  line technical losses, LPS rolling sphere method, voltage unbalance &
  motor derating, DB panel balancer, parallel generator fault
  contribution, and genset fuel consumption. The mechanical/non-electrical
  items from that same comparison (transformer oil DGA interpretation,
  motor vibration analysis, torque/coupling calculators, and similar) were
  deliberately excluded, consistent with this suite's electrical-only
  scope.
- Deploying the site publicly (e.g. via Vercel) once you're ready for
  others to use it — running locally is just for development/preview.
