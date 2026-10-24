import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/spd-rating");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
