import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/life-cycle-cost");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
