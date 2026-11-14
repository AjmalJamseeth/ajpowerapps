import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/alarm-rationalisation-analyser");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/alarm-rationalisation-analyser")} />
      {children}
      <CalcPageExtras href="/calculators/alarm-rationalisation-analyser" />
    </>
  );
}
