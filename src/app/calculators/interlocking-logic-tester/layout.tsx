import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/interlocking-logic-tester");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/interlocking-logic-tester")} />
      {children}
      <CalcPageExtras href="/calculators/interlocking-logic-tester" />
    </>
  );
}
