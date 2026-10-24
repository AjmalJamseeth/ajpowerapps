import { calcMetadata } from "@/lib/seo";

export const metadata = calcMetadata("/calculators/motor-torque");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
