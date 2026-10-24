import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/motor-acceleration-time");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
