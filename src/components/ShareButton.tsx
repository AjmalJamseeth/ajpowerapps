"use client";

import { useEffect, useState } from "react";
import { encodeShare, getShareGetter, subscribeShare } from "@/lib/shareState";

export function ShareButton() {
  const [available, setAvailable] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setAvailable(getShareGetter() != null);
    update();
    return subscribeShare(update);
  }, []);

  if (!available) return null;

  const share = async () => {
    const g = getShareGetter();
    if (!g) return;
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeShare(g())}`;
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copied");
    } catch {
      window.prompt("Copy this link:", url);
      setMsg(null);
    }
    setTimeout(() => setMsg(null), 2500);
  };

  return (
    <button
      type="button"
      onClick={share}
      title="Copy a link that opens this calculator with the current inputs"
      className="no-print inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-2/60 hover:text-accent-2"
    >
      {msg ?? <>🔗 Share inputs</>}
    </button>
  );
}
