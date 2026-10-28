import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/duct-bank-heat-rise");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/duct-bank-heat-rise")} />
      {children}
      <CalcPageExtras href="/calculators/duct-bank-heat-rise" />
    </>
  );
}
