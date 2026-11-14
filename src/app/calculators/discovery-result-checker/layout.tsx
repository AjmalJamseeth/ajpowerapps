import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/discovery-result-checker");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/discovery-result-checker")} />
      {children}
      <CalcPageExtras href="/calculators/discovery-result-checker" />
    </>
  );
}
