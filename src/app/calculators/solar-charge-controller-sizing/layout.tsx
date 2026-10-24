import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/solar-charge-controller-sizing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
