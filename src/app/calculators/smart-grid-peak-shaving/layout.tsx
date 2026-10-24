import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/smart-grid-peak-shaving");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
