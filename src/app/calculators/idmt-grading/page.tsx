"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";

// Multi-Bus IDMT Grading has been merged into the IDMT Relay Coordination
// calculator, which now supports adding any number of relays to a chain
// (not just 2, and not just 3) with the more rigorous full-fault-current-
// range sweep applied to every step — a strict superset of what this
// single-fault-current tool did. This page now just forwards visitors
// (and any bookmarked/inbound links) to the merged calculator.
export default function IdmtGradingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/calculators/idmt");
  }, [router]);

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">
          This calculator has moved
        </h1>
        <p className="mt-3 text-sm text-muted">
          Multi-Bus IDMT Grading has been merged into the IDMT Relay
          Coordination calculator, which now supports adding any number of
          relays to a chain with the full fault-current-range sweep applied
          to every step. Redirecting you there now.
        </p>
        <Link
          href="/calculators/idmt"
          className="mt-6 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          Go to IDMT Relay Coordination →
        </Link>
      </div>
    </div>
  );
}
