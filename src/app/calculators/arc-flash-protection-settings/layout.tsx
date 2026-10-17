import type { Metadata } from "next";
import { FEATURES } from "@/lib/features";

// While the studio is not public (see src/lib/features.ts) the page stays reachable by its URL but is kept out of search results.
export const metadata: Metadata = {
  title: "Protection & Arc-Flash Studio",
  robots: FEATURES.studio ? undefined : { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
