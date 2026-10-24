import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/insulation-resistance");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
