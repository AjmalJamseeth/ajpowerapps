import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/diversity-factor");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
