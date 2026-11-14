import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/gateway-mapping-builder");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/gateway-mapping-builder")} />
      {children}
      <CalcPageExtras href="/calculators/gateway-mapping-builder" />
    </>
  );
}
