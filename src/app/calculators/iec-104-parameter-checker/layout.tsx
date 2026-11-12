import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/iec-104-parameter-checker");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/iec-104-parameter-checker")} />
      {children}
      <CalcPageExtras href="/calculators/iec-104-parameter-checker" />
    </>
  );
}
