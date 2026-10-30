import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/iec-61850-scl-editor");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/iec-61850-scl-editor")} />
      {children}
      <CalcPageExtras href="/calculators/iec-61850-scl-editor" />
    </>
  );
}
