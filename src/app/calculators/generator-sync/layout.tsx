import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/generator-sync");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
