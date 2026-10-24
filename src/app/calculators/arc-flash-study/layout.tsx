import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/arc-flash-study");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
