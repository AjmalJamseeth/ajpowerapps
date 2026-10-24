import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/enclosure-cooling");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
