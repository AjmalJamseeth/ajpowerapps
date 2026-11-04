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
  let t = title.replace(/^Worked Example:\s*/i, "");
  // keep the search title near Google's display limit: drop a trailing clause after " — " or ":" when too long
  if (t.length > 60) {
    const m = t.match(/^(.{20,}?)(?: — |: )/);
    if (m && m[1].length <= 60) t = m[1];
  }
  if (!/^Worked Example:/i.test(title)) return t;
  // add the label only while the full result title (with " | AJapps") stays near Google's ~60-character display limit
  return t.length <= 40 ? `${t} (Worked Example)` : t;
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
      author: { "@type": "Person", name: "Ajmal Jamseeth", jobTitle: "Electrical Engineer", url: `${SITE_URL}/about` },
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
