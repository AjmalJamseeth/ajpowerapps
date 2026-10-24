import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/idmt-earth-fault");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
