import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/static-bonding");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
