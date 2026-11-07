import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/engineering-sketch-studio");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/engineering-sketch-studio")} />
      {children}
      <CalcPageExtras href="/calculators/engineering-sketch-studio" />
    </>
  );
}
