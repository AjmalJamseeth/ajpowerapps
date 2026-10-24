import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/elevator-demand");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
