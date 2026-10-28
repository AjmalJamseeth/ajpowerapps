import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { CalcPageExtras } from "@/components/CalcPageExtras";

export const metadata = calcMetadata("/calculators/switchgear-short-circuit-rating");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/switchgear-short-circuit-rating")} />
      {children}
      <CalcPageExtras href="/calculators/switchgear-short-circuit-rating" />
    </>
  );
}
