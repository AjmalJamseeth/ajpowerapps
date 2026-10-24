import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/cable-tray-fill");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
