import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/lighting-design");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
