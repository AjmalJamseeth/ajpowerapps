import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/fg-loop");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
