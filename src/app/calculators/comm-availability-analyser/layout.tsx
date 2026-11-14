import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/comm-availability-analyser");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/comm-availability-analyser")} />
      {children}
      <CalcPageExtras href="/calculators/comm-availability-analyser" />
    </>
  );
}
