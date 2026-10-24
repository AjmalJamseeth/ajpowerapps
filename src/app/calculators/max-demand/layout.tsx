import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/max-demand");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
