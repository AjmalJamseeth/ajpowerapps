import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/scada-troubleshooting-assistant");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/scada-troubleshooting-assistant")} />
      {children}
      <CalcPageExtras href="/calculators/scada-troubleshooting-assistant" />
    </>
  );
}
