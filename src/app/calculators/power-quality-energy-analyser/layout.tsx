import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/power-quality-energy-analyser");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/power-quality-energy-analyser")} />
      {children}
      <CalcPageExtras href="/calculators/power-quality-energy-analyser" />
    </>
  );
}
