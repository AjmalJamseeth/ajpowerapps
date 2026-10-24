import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/panel-balance");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
