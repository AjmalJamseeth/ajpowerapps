import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/vfd-parameter-selection");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
