import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/wind-turbine-power-output");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
