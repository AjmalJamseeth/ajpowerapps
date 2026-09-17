import type { MetadataRoute } from "next";

// Tells search engine crawlers everything on the site is fine to index, and
// points them at the sitemap so they can discover every calculator, guide
// and worked example without having to follow every internal link manually.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://www.ajpowerapps.com/sitemap.xml",
  };
}
