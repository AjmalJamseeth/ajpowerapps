import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/intrinsic-safety");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
