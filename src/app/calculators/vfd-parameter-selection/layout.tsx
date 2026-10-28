import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/vfd-parameter-selection");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/vfd-parameter-selection")} />
      {children}
      <CalcPageExtras href="/calculators/vfd-parameter-selection" />
    </>
  );
}
