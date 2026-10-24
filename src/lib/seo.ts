import type { Metadata } from "next";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";

const BASE = "https://www.ajpowerapps.com";

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
  };
}

/** Metadata for a calculator page, taken from its catalog card. */
export function calcMetadata(href: string): Metadata {
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
