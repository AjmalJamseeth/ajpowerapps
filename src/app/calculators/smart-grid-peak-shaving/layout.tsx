import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/smart-grid-peak-shaving");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/smart-grid-peak-shaving")} />
      {children}
      <CalcPageExtras href="/calculators/smart-grid-peak-shaving" />
    </>
  );
}
