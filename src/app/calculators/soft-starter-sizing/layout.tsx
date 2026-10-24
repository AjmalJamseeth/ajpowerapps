import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/soft-starter-sizing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
