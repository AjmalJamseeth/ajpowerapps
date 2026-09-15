import type { MetadataRoute } from "next";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { WORKED_EXAMPLES } from "@/lib/workedExamples";
import { GUIDES } from "@/lib/guides";

// Auto-generated from the same catalog/example/guide data the pages
// themselves render from, so every live calculator, worked example and
// guide is listed here automatically — new content added to those source
// files shows up in the sitemap on the next deploy with no manual step.
const BASE_URL = "https://www.ajpowerapps.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/calculators`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/examples`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/guides`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const calculatorRoutes: MetadataRoute.Sitemap = CALCULATOR_GROUPS.flatMap((group) =>
    group.calculators
      .filter((calc) => calc.status === "live")
      .map((calc) => ({
        url: `${BASE_URL}${calc.href}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      }))
  );

  const exampleRoutes: MetadataRoute.Sitemap = WORKED_EXAMPLES.map((example) => ({
    url: `${BASE_URL}/examples/${example.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const guideRoutes: MetadataRoute.Sitemap = GUIDES.map((guide) => ({
    url: `${BASE_URL}/guides/${guide.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...calculatorRoutes, ...exampleRoutes, ...guideRoutes];
}