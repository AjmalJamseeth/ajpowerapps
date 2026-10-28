import { notFound } from "next/navigation";
import WorkedExamplePage from "@/components/WorkedExamplePage";
import { JsonLd } from "@/components/JsonLd";
import { WORKED_EXAMPLES, getExampleBySlug } from "@/lib/workedExamples";
import { SITE_URL, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return WORKED_EXAMPLES.map((e) => ({ slug: e.slug }));
}

// "Worked Example: X" -> "X (Worked Example)" so the topic words lead the search result title.
function seoTitle(title: string): string {
  const t = title.replace(/^Worked Example:\s*/i, "");
  return t === title ? title : `${t} (Worked Example)`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);
  if (!example) return {};
  return pageMeta(`/examples/${slug}`, seoTitle(example.title), example.dek);
}

export default async function ExampleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);
  if (!example) notFound();
  const url = `${SITE_URL}/examples/${slug}`;
  const data: object[] = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: seoTitle(example.title),
      description: example.dek,
      url,
      mainEntityOfPage: url,
      proficiencyLevel: "Expert",
      about: example.standard,
      author: { "@type": "Organization", name: "AJapps", url: SITE_URL },
      publisher: { "@type": "Organization", name: "AJapps", url: SITE_URL },
      isPartOf: { "@type": "WebSite", name: "AJapps", url: SITE_URL },
    },
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Worked examples", path: "/examples" },
      { name: seoTitle(example.title), path: `/examples/${slug}` },
    ]),
  ];
  if (example.faqs.length > 0) {
    data.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: example.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return (
    <>
      <JsonLd data={data} />
      <WorkedExamplePage example={example} />
    </>
  );
}
