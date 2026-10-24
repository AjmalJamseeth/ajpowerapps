import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/vfd-sizing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
