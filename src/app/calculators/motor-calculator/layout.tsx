import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export const metadata = calcMetadata("/calculators/motor-calculator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/motor-calculator")} />
      {children}
    </>
  );
}
