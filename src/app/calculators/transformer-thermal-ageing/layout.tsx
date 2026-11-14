import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/transformer-thermal-ageing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/transformer-thermal-ageing")} />
      {children}
      <CalcPageExtras href="/calculators/transformer-thermal-ageing" />
    </>
  );
}
