import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/cable-pulling-tension");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
