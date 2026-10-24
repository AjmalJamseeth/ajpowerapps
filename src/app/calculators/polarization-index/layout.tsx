import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/polarization-index");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
