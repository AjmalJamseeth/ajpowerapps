import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/energy-storage");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
