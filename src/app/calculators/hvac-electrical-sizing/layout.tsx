import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/hvac-electrical-sizing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/hvac-electrical-sizing")} />
      {children}
      <CalcPageExtras href="/calculators/hvac-electrical-sizing" />
    </>
  );
}
