import { notFound } from "next/navigation";
import WorkedExamplePage from "@/components/WorkedExamplePage";
import { WORKED_EXAMPLES, getExampleBySlug } from "@/lib/workedExamples";

export function generateStaticParams() {
  return WORKED_EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);
  if (!example) return {};
  return {
    title: `${example.title} | AJapps`,
    description: example.dek,
  };
}

export default async function ExampleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);
  if (!example) notFound();
  return <WorkedExamplePage example={example} />;
}
