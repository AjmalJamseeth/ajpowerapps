import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/hvac-electrical-sizing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
