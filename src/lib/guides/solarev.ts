// Category guide: Solar, EV & Renewables.

import type { GuideDoc } from "./types";

export const SOLAREV_GUIDE: GuideDoc = {
  slug: "solar-ev-renewables",
  groupId: "solar-ev",
  title: "Solar, EV & Renewables: A Practical Guide to PV Strings and Charge Points",
  dek: "Why a PV string has to clear three genuinely independent inverter constraints at once, and why an EV charge point's earthing system can outright disqualify a design rather than just derate it.",
  readTime: "10 min read",
  intro: [
    "Solar PV and EV charging are grouped together as this suite's newest, smallest category, but they share a common thread: both involve matching a DC or DC-adjacent source to equipment with hard electrical limits, where getting the match wrong doesn't just reduce performance — it can produce equipment damage (PV) or an outright non-compliant, unsafe circuit (EV charging, on the wrong earthing system). Both calculators in this category are built around checking every relevant limit independently rather than assuming that clearing one check implies the others are also fine.",
  ],
  coreConcepts: [
    {
      heading: "A PV string has three independent constraints, not one",
      body: [
        "Matching a PV array to an inverter means clearing three genuinely separate checks, each governed by a different design variable. The number of modules wired in series (Ns) determines the string's voltage — too many modules in series and the string voltage can exceed the inverter's absolute maximum DC voltage rating, or fall outside its MPPT operating window. The module's own short-circuit current (Isc) determines the string's design current — independent of how many modules are in series — which has to stay within the inverter's maximum DC input current rating for that MPPT channel. And the total array power relative to the inverter's AC power rating (the DC:AC ratio) is a separate sizing decision entirely. A design can clear any one or two of these checks while failing the third, which is exactly why each is checked independently rather than assuming one 'looks about right' implies the others are fine.",
      ],
    },
    {
      heading: "Why string voltage is checked at the coldest temperature, not the hottest",
      body: [
        "It's counterintuitive at first, but PV module voltage rises as cell temperature falls — silicon PV cells have a well-established negative temperature coefficient for open-circuit voltage. That means the highest string voltage a system will ever see happens on the coldest day it's exposed to, not the hottest — which is exactly why the maximum string voltage check (against the inverter's absolute maximum DC voltage rating) uses the site's coldest expected temperature, while the low end of the MPPT operating window is instead checked at the hottest expected temperature, where voltage sags the most. Checking only one temperature extreme, or checking both against the same temperature, misses exactly the condition each specific check is designed to catch.",
      ],
    },
    {
      heading: "DC:AC ratio: intentional oversizing, within limits",
      body: [
        "It's common and often economically sensible to size a PV array's total DC capacity somewhat above the inverter's AC power rating — a DC:AC ratio above 1.0 — because an inverter only actually 'clips' (loses potential output) during the relatively few hours of peak irradiance when the array would otherwise exceed the inverter's AC rating, while a larger array captures more usable energy during the much larger number of lower-irradiance hours that make up most of a year's generation. Pushed too far, though, oversizing starts trading away increasing amounts of that peak-hour energy to clipping for diminishing additional energy capture elsewhere — which is why DC:AC ratio has a sensible working range (a very rough industry rule of thumb is often cited around 1.1-1.3) rather than an open-ended 'more is better' relationship.",
      ],
    },
    {
      heading: "For EV charging, earthing system isn't just a background parameter — it can disqualify a design outright",
      body: [
        "Most electrical design parameters are things you size or derate for. A TN-C-S (PME) earthing system and an EV charge point are a different kind of problem: IEC 60364-7-722 doesn't ask for a derating factor here, it prohibits a PEN (combined protective-and-neutral) conductor from being extended into the final circuit feeding the charge point at all, full stop. The concern is that a PEN conductor fault upstream can put dangerous voltage onto a property's earth terminal — a recognized but generally low-consequence risk for an ordinary socket circuit, but a much more serious one at an EV charge point where a person may be in simultaneous contact with damp ground and a large metal vehicle chassis. A design on a TN-C-S supply has to either convert the final circuit to TN-S, fit open-PEN detection, or use a local TT-style earth electrode — there's no 'derated but acceptable' middle option the way there often is elsewhere in electrical design.",
      ],
    },
    {
      heading: "Why EV charging needs a specific RCD type, not just any RCD",
      body: [
        "Electric vehicle onboard charging equipment (the rectifier and power electronics that convert incoming AC to the DC the battery actually needs) can, under certain fault conditions, produce a smooth DC residual current — and a standard Type AC or even Type A residual current device (RCD), designed primarily around AC and pulsed-DC residual current, can have its trip mechanism 'blinded' by a sufficient smooth DC component, failing to trip when it should. This is why EV charging circuits need either a Type B RCD (which detects AC, pulsed DC, and smooth DC residual current all in one device) or a Type A RCD combined with a separate residual DC detecting device (RDC-DD, per IEC 62955) that specifically watches for smooth DC current and trips before it can blind the upstream Type A device — together treated as providing equivalent protection to a Type B RCD on its own.",
      ],
    },
    {
      heading: "Load diversity at multi-point sites: only with a Load Management System in place",
      body: [
        "For a single EV charge point, sizing is straightforward — the circuit is sized for that point's own full rated current. At a multi-point site, it's tempting to assume not every charge point will draw full rated current simultaneously and apply some diversity factor to reduce the feeder size — but IEC 60364-7-722 specifically ties that permission to having an actual Load Management System (LMS) in place, one that actively monitors and limits total site demand in real time. Without an LMS, the code requires designing as if every point could draw full rated current at the same time, precisely because there's no active control mechanism actually guaranteeing otherwise — diversity isn't a general statistical convenience here, it's conditional on the control system that makes the diversity assumption trustworthy in the first place.",
      ],
    },
  ],
  standardsLandscape: [
    { standard: "IEC 62548", scope: "PV array design requirements — string voltage window, current margins, and DC:AC ratio guidance." },
    { standard: "IEC 60364-7-712", scope: "Electrical installation requirements specific to solar photovoltaic power supply systems." },
    { standard: "IEC 61851-1", scope: "EV conductive charging system modes (Mode 1 through Mode 4) and general charging equipment requirements." },
    { standard: "IEC 60364-7-722", scope: "Electrical installations for EV supplies — earthing arrangement restrictions (including the TN-C-S/PEN exclusion) and load diversity rules." },
    { standard: "IEC 62955", scope: "Residual direct current detecting devices (RDC-DD) — used alongside a Type A RCD as an alternative to a Type B RCD for EV charge points." },
  ],
  workflow: [
    {
      title: "Check the PV string's voltage window at both temperature extremes",
      body: "Verify maximum string voltage (cold extreme) stays under the inverter's absolute maximum DC voltage, and the MPPT window is satisfied at both cold and hot extremes.",
      calculatorHref: "/calculators/solar-pv",
      calculatorName: "Solar PV Sizing",
    },
    {
      title: "Check design current, DC:AC ratio, and size the DC/AC cabling",
      body: "Confirm the module's design current clears the inverter's per-MPPT current limit (independent of series count), check the array's DC:AC ratio, and size DC and AC cable runs.",
      calculatorHref: "/calculators/solar-pv",
      calculatorName: "Solar PV Sizing",
    },
    {
      title: "Size an EV charge point's cable, breaker and RCD",
      body: "Size the circuit for the charge point's rated current, and confirm a Type B RCD (or Type A + RDC-DD) is selected rather than a standard RCD.",
      calculatorHref: "/calculators/ev-charging",
      calculatorName: "EV Charging",
    },
    {
      title: "Check earthing compatibility and, for multi-point sites, diversity requirements",
      body: "Confirm the site's earthing arrangement doesn't disqualify the design (particularly TN-C-S), and that any load diversity applied is backed by an actual Load Management System.",
      calculatorHref: "/calculators/ev-charging",
      calculatorName: "EV Charging",
    },
  ],
  commonMistakes: [
    {
      mistake: "Checking PV string voltage only at standard test conditions (STC) rather than the site's actual coldest expected temperature",
      whyItMatters: "String voltage peaks at the coldest temperature the site will actually experience, not at the 25°C STC reference point — a design that only checks STC voltage can pass on paper while exceeding the inverter's maximum DC voltage on an actual cold morning.",
    },
    {
      mistake: "Assuming a PV design that clears the voltage/MPPT window also clears the inverter's current limit",
      whyItMatters: "String current depends on the module's Isc and is independent of series count, while string voltage depends on series count and temperature — they're governed by completely different variables, so a design can pass one check and still fail the other outright.",
    },
    {
      mistake: "Treating DC:AC ratio as 'more is always better' for energy capture",
      whyItMatters: "Oversizing captures more energy during lower-irradiance hours, but past a certain point increasing amounts of peak-hour energy are lost to inverter clipping — DC:AC ratio has a sensible working range, not an open-ended benefit from oversizing further and further.",
    },
    {
      mistake: "Assuming any earthing system is acceptable for an EV charge point circuit",
      whyItMatters: "A TN-C-S (PME) supply specifically prohibits extending a PEN conductor into the final circuit feeding a charge point — this isn't a derating situation, it requires a specific compliance path (TN-S conversion, open-PEN detection, or a local TT-style electrode) before the design can be considered acceptable at all.",
    },
    {
      mistake: "Selecting a standard Type AC or Type A RCD alone for an EV charging circuit",
      whyItMatters: "EV charging equipment can produce smooth DC residual current under fault conditions, which can blind a standard RCD's trip mechanism — only a Type B RCD, or a Type A RCD paired with a dedicated RDC-DD, provides adequate protection.",
    },
    {
      mistake: "Applying load diversity at a multi-point EV site without an actual Load Management System in place",
      whyItMatters: "IEC 60364-7-722 ties the right to use diversity below 1.0 directly to having an LMS actively managing site demand — without one, code requires designing for every point at full rated current simultaneously, since there's no control mechanism actually enforcing anything less.",
    },
  ],
  faqs: [
    {
      q: "Why does a PV array's design current check stay the same regardless of how many modules are wired in series?",
      a: "Because current in a series string is set by the module's own short-circuit current rating, not by how many modules are strung together — adding or removing modules from a series string changes the string's voltage, not its current. This is exactly why fixing a voltage/MPPT-window failure by shortening the string doesn't automatically fix a separate current-limit failure; the two are governed by different variables entirely.",
    },
    {
      q: "Why can't a standard household RCD adequately protect an EV charging circuit?",
      a: "A standard Type AC or Type A RCD is designed primarily to detect AC (and, for Type A, pulsed DC) residual current — but EV charging equipment's internal power electronics can under fault conditions produce a smooth DC residual current that these standard RCD types can fail to detect, or that can even blind their trip mechanism from detecting a genuine AC fault. A Type B RCD (or Type A plus a dedicated RDC-DD) is specifically designed to also catch that smooth DC component.",
    },
  ],
};
