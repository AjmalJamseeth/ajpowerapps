import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/afci-gfci-requirements");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/afci-gfci-requirements")} />
      {children}
      <CalcPageExtras href="/calculators/afci-gfci-requirements" />
    </>
  );
}
