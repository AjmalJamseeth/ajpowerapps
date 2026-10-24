import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/rolling-sphere");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
