import { calcJsonLd, calcMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

export const metadata = calcMetadata("/calculators/current-loop-4-20ma");

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={calcJsonLd("/calculators/current-loop-4-20ma")} />
      {children}
    </>
  );
}
