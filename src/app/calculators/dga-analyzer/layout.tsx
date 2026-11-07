import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/dga-analyzer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/dga-analyzer")} />
      {children}
      <CalcPageExtras href="/calculators/dga-analyzer" />
    </>
  );
}
