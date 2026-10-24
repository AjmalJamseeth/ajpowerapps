import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/afci-gfci-requirements");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
