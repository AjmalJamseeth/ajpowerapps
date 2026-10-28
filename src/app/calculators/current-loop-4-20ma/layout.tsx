import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/current-loop-4-20ma");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/current-loop-4-20ma")} />
      {children}
      <CalcPageExtras href="/calculators/current-loop-4-20ma" />
    </>
  );
}
