import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/goose-sv-analyzer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/goose-sv-analyzer")} />
      {children}
      <CalcPageExtras href="/calculators/goose-sv-analyzer" />
    </>
  );
}
