import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/conduit-fill");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
