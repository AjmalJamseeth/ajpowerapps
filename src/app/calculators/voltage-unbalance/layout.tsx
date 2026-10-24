import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/voltage-unbalance");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
