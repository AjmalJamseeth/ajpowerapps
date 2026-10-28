import type { Metadata } from "next";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";

export const SITE_URL = "https://www.ajpowerapps.com";
const BASE = SITE_URL;

/** Shorten to a search-snippet length at a word boundary. */
export function snippet(text: string, max = 158): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.—-]+$/, "") + "…";
}

/** Page-level metadata: own title, description and canonical URL. The site title template adds "| AJapps". */
export function pageMeta(path: string, title: string, description: string): Metadata {
  const desc = snippet(description);
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: { title, description: desc, url: `${BASE}${path}`, siteName: "AJapps", type: "website" },
    twitter: { card: "summary_large_image", title, description: desc },
  };
}

// Search-focused titles and descriptions for the pages Google already shows
// for real queries (from Search Console): the words people type go first.
// Keep titles under ~52 characters so " | AJapps" still fits in the result.
const CALC_SEO: Record<string, { title: string; description: string }> = {
  "/calculators/max-demand": {
    title: "Maximum Demand Calculator – Demand Factor Table",
    description:
      "Free maximum demand calculation by load category (lighting, sockets, HVAC, motors, EV) with demand factors, design current, breaker and transformer size.",
  },
  "/calculators/idmt": {
    title: "IDMT Relay Calculator – Trip Time & Grading",
    description:
      "Free IDMT relay calculator: trip time for IEC 60255 and IEEE C37.112 curves, plug setting multiplier, TCC plot and grading check for two or more relays.",
  },
  "/calculators/cable-tray-fill": {
    title: "Cable Tray Fill Calculator – NEC 392.22",
    description:
      "Check cable tray fill to NEC 392.22 for ladder, ventilated and solid-bottom trays and multiconductor, control or single-conductor cables, or 40–50% area fill.",
  },
  "/calculators/motor-torque": {
    title: "Motor Torque Calculator – kW or HP to N·m",
    description:
      "Motor power to torque: T = 9550 × kW / rpm (N·m) or 5252 × HP / rpm (lb-ft). A quick kW-to-torque and watts-to-torque calculator for motors and engines.",
  },
  "/calculators/vfd-sizing": {
    title: "VFD Sizing Calculator – Drive Current & Derating",
    description:
      "Size a variable frequency drive from motor FLA with variable or constant torque duty, margin, and ambient and altitude derating; check a candidate drive.",
  },
  "/calculators/rolling-sphere": {
    title: "Rolling Sphere Method Calculator (IEC 62305)",
    description:
      "Lightning mast protection radius by the rolling sphere method, with the IEC 62305-3 sphere radius of 20, 30, 45 or 60 m for LPS Class I to IV.",
  },
  "/calculators/earthing": {
    title: "Earthing Design Calculator – IEEE 80 Grid",
    description:
      "Earthing grid design to IEEE 80: grid resistance, GPR, tolerable and actual touch and step voltage, conductor size, plus BS 7430 rod and plate electrodes.",
  },
  "/calculators/power-factor-correction": {
    title: "Power Factor Correction Capacitor Calculator",
    description:
      "kVAr needed to correct power factor, capacitance per phase in µF, capacitor nameplate rating, current reduction, resonance check and detuning reactor.",
  },
  "/calculators/arc-flash": {
    title: "Arc Flash Calculator (Free) – IEEE 1584",
    description:
      "Free arc flash calculator: incident energy, arc-flash boundary and indicative PPE category using IEEE 1584-2018, IEEE 1584-2002 or the Ralph Lee method.",
  },
  "/calculators/arc-flash-study": {
    title: "Arc Flash Study – IEEE 1584-2018 Labels & PPE",
    description:
      "Arc-flash study to IEEE 1584-2018: incident energy, boundary and PPE at every bus on a single-line diagram, relay clearing times and printable labels.",
  },
  "/calculators/elevator-demand": {
    title: "Elevator Demand Calculator – NEC 620.14",
    description:
      "Elevator motor power from rated load, speed, counterweight and efficiency, with NEC Table 620.14 demand factors for several elevators on one feeder.",
  },
  "/calculators/cable-sizing": {
    title: "Cable Sizing & Voltage Drop Calculator (IEC)",
    description:
      "LV cable sizing to IEC 60364-5-52: current rating with derating, voltage drop, short-circuit withstand, protective conductor size and life-cycle cost.",
  },
  "/calculators/iec-60909": {
    title: "IEC 60909 Short Circuit Calculator",
    description:
      "IEC 60909 short-circuit calculator: Ik″, peak ip, breaking Ib, Ith, line-to-line and earth faults at every bus, with a single-line diagram and full working.",
  },
  "/calculators/motor-calculator": {
    title: "Motor Calculator – NEC 430 FLC & Breaker Size",
    description:
      "NEC Article 430 motor calculator: FLC tables, conductor size, maximum breaker or fuse, overload setting, disconnect, starting voltage dip and motor feeder.",
  },
  "/calculators/protection-suite": {
    title: "Protection Coordination Software (Free, Online)",
    description:
      "Free online protection coordination: time-current curves for relays, breakers, fuses and motors, grading checks, damage curves, 87T/87B/87L and CT/VT sizing.",
  },
  "/calculators/wire-ampacity-nec": {
    title: "Wire Size Calculator – NEC 310.16 Ampacity",
    description:
      "NEC wire size calculator: Table 310.16 ampacity with ambient correction, conductor bundling adjustment, terminal temperature limit and 240.4(D) rule.",
  },
  "/calculators/conduit-fill": {
    title: "Conduit Fill Calculator – NEC Chapter 9",
    description:
      "Conduit fill to NEC Chapter 9 for EMT, RMC, IMC, PVC and flexible conduit, with the smallest compliant trade size, plus the IEC/BS space-factor method.",
  },
};

/** Metadata for a calculator page, taken from its catalog card (or a search-focused override). */
export function calcMetadata(href: string): Metadata {
  const o = CALC_SEO[href];
  if (o) return pageMeta(href, o.title, o.description);
  for (const g of CALCULATOR_GROUPS) {
    const c = g.calculators.find((x) => x.href === href);
    if (c) {
      // searchers type "... calculator", so make sure the title says it
      const title = /calculator|study|suite|selector/i.test(c.name) ? c.name : `${c.name} Calculator`;
      return pageMeta(href, title, c.description);
    }
  }
  return { alternates: { canonical: href } };
}

/** schema.org structured data for a calculator page (WebApplication + breadcrumb). */
export function calcJsonLd(href: string): object[] {
  for (const g of CALCULATOR_GROUPS) {
    const c = g.calculators.find((x) => x.href === href);
    if (!c) continue;
    const o = CALC_SEO[href];
    const name = o?.title ?? (/calculator|study|suite|selector/i.test(c.name) ? c.name : `${c.name} Calculator`);
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name,
        url: `${BASE}${href}`,
        description: snippet(o?.description ?? c.description, 300),
        applicationCategory: "EngineeringApplication",
        operatingSystem: "Any (runs in a web browser)",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "AJapps", url: BASE },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Calculators", path: "/calculators" },
        { name: g.title, path: `/calculators#${g.id}` },
        { name, path: href },
      ]),
    ];
  }
  return [];
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${BASE}${it.path}` })),
  };
}
