import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/sv-waveform-viewer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/sv-waveform-viewer")} />
      {children}
      <CalcPageExtras href="/calculators/sv-waveform-viewer" />
    </>
  );
}
