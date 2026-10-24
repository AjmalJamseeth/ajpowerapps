import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/mv-cable");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
