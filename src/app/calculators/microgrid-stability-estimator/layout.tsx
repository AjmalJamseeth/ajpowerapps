import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/microgrid-stability-estimator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/microgrid-stability-estimator")} />
      {children}
      <CalcPageExtras href="/calculators/microgrid-stability-estimator" />
    </>
  );
}
