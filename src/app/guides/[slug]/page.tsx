import { notFound } from "next/navigation";
import GuidePage from "@/components/GuidePage";
import { JsonLd } from "@/components/JsonLd";
import { GUIDES, getGuideBySlug } from "@/lib/guides";
import { SITE_URL, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return pageMeta(`/guides/${slug}`, guide.title, guide.dek);
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  const url = `${SITE_URL}/guides/${slug}`;
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: guide.title,
            description: guide.dek,
            url,
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: "AJapps", url: SITE_URL },
            publisher: { "@type": "Organization", name: "AJapps", url: SITE_URL },
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: guide.title, path: `/guides/${slug}` },
          ]),
        ]}
      />
      <GuidePage guide={guide} />
    </>
  );
}
