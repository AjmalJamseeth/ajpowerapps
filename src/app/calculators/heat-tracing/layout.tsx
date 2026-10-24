import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/heat-tracing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
