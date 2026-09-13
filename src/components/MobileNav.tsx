"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, GraduationCap, BookOpen, LayoutGrid } from "lucide-react";
import { FeedbackButton } from "@/components/FeedbackButton";

// Everything the desktop NavBar exposes through its hover dropdowns
// (Calculators, Resources, Pricing, Feedback) is unreachable on a touch
// screen, since hover states never fire and that entire <nav> is hidden
// below the `sm` breakpoint. This gives mobile visitors the same
// destinations via a tap-to-open panel instead.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border bg-surface-2 text-muted transition-colors hover:border-accent-2/60 hover:text-foreground"
      >
        {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-border bg-background px-6 py-4 shadow-xl">
          <nav className="flex flex-col gap-1 text-sm">
            <Link
              href="/calculators"
              onClick={close}
              className="flex items-center gap-2.5 rounded-md px-2 py-2.5 font-medium text-foreground hover:bg-surface-2"
            >
              <LayoutGrid className="h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
              Calculators
            </Link>
            <Link
              href="/guides"
              onClick={close}
              className="flex items-center gap-2.5 rounded-md px-2 py-2.5 font-medium text-foreground hover:bg-surface-2"
            >
              <GraduationCap className="h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
              Guides
            </Link>
            <Link
              href="/examples"
              onClick={close}
              className="flex items-center gap-2.5 rounded-md px-2 py-2.5 font-medium text-foreground hover:bg-surface-2"
            >
              <BookOpen className="h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
              Worked Examples
            </Link>
            <Link
              href="/resources"
              onClick={close}
              className="rounded-md px-2 py-2.5 text-muted hover:bg-surface-2 hover:text-foreground"
            >
              All resources →
            </Link>
            <a
              href="/#pricing"
              onClick={close}
              className="rounded-md px-2 py-2.5 text-muted hover:bg-surface-2 hover:text-foreground"
            >
              Pricing
            </a>
            <div className="mt-1 border-t border-border pt-2">
              <FeedbackButton
                calculatorName="General / Site Feedback"
                buttonLabel="💬 Feedback / feature request"
                buttonClassName="w-full rounded-md px-2 py-2.5 text-left text-muted hover:bg-surface-2 hover:text-foreground"
              />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
