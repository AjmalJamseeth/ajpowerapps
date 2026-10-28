import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/wire-ampacity-nec");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/wire-ampacity-nec")} />
      {children}
      <CalcPageExtras href="/calculators/wire-ampacity-nec" />
    </>
  );
}
