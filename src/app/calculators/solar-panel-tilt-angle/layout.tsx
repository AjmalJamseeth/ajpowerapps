import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/solar-panel-tilt-angle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/solar-panel-tilt-angle")} />
      {children}
      <CalcPageExtras href="/calculators/solar-panel-tilt-angle" />
    </>
  );
}
