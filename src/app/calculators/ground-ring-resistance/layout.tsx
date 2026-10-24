import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/ground-ring-resistance");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
