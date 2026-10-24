import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/gen-xfmr");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
