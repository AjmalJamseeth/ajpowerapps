import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/generator-fault-contribution");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
