import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/wind-turbine-power-output");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/wind-turbine-power-output")} />
      {children}
      <CalcPageExtras href="/calculators/wind-turbine-power-output" />
    </>
  );
}
