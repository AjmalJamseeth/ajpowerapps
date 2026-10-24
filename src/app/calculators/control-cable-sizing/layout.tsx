import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/control-cable-sizing");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
