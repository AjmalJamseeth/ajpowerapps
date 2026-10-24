import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/genset-fuel");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
