import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/comtrade-fault-analyser");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/comtrade-fault-analyser")} />
      {children}
      <CalcPageExtras href="/calculators/comtrade-fault-analyser" />
    </>
  );
}
