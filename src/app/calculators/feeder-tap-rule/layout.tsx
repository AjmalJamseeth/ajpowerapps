import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/feeder-tap-rule");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
