import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/switchgear-short-circuit-rating");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
