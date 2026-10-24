import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/motor-protection-sizer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
