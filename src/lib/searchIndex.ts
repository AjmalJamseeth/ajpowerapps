// Flat list of calculators, guides and worked examples for the site search box.
import { CALCULATOR_GROUPS } from "./calculatorCatalog";
import { GUIDES } from "./guides";
import { WORKED_EXAMPLES } from "./workedExamples";

export interface SearchItem {
  kind: "Calculator" | "Guide" | "Worked example";
  title: string;
  href: string;
  text: string; // extra searchable text (description, category, standard)
}

export function buildSearchIndex(): SearchItem[] {
  const calcs: SearchItem[] = CALCULATOR_GROUPS.flatMap((g) =>
    g.calculators
      .filter((c) => c.status === "live")
      .map((c) => ({ kind: "Calculator" as const, title: c.name, href: c.href, text: `${g.title} ${c.description}` }))
  );
  const guides: SearchItem[] = GUIDES.map((g) => ({ kind: "Guide" as const, title: g.title, href: `/guides/${g.slug}`, text: g.dek }));
  const examples: SearchItem[] = WORKED_EXAMPLES.map((e) => ({
    kind: "Worked example" as const,
    title: e.title.replace(/^Worked Example:\s*/, ""),
    href: `/examples/${e.slug}`,
    text: `${e.calculatorName} ${e.standard} ${e.dek}`,
  }));
  return [...calcs, ...guides, ...examples];
}
