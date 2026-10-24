import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/lightning-protection");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
