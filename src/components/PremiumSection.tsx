"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";

export default function PremiumSection({
  title,
  description,
  children,
  unlocked,
}: {
  title: string;
  description: string;
  children: ReactNode;
  unlocked: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
          Subscriber
        </span>
      </div>

      {!unlocked && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent/25 bg-accent/10 px-3 py-2 text-xs text-muted">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span>
            {description} Fields below are shown for preview — full
            calculation unlocks with subscriber accounts, coming soon.
          </span>
        </div>
      )}

      <div className={`mt-4 grid grid-cols-2 gap-4 ${!unlocked ? "pointer-events-none opacity-40" : ""}`}>
        {children}
      </div>
    </div>
  );
}
