import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/ev-charging");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
