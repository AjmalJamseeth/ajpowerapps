import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/breaker-wear-analyser");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/breaker-wear-analyser")} />
      {children}
      <CalcPageExtras href="/calculators/breaker-wear-analyser" />
    </>
  );
}
