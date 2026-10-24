import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/wire-ampacity-nec");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
