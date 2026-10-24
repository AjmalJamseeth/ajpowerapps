import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/duct-bank-heat-rise");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
