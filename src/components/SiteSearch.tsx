"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { SearchItem } from "@/lib/searchIndex";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "");

function score(item: SearchItem, terms: string[]): number {
  const title = norm(item.title);
  const text = norm(item.text);
  let total = 0;
  for (const t of terms) {
    if (title.includes(t)) total += title.startsWith(t) ? 6 : 4;
    else if (text.includes(t)) total += 1;
    else return 0; // every term must match somewhere
  }
  return total + (item.kind === "Calculator" ? 0.5 : 0);
}

export default function SiteSearch({ items, autoFocus = false }: { items: SearchItem[]; autoFocus?: boolean }) {
  const [q, setQ] = useState("");

  // Support /calculators?q=... links (also used by the WebSite search action).
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the URL after hydration
    if (initial) setQ(initial);
  }, []);

  const results = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter((t) => t.length > 0);
    if (!terms.length) return [];
    return items
      .map((it) => ({ it, s: score(it, terms) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.it);
  }, [q, items]);

  return (
    <div id="search" className="w-full max-w-2xl scroll-mt-24">
      <label className="relative block">
        <span className="sr-only">Search calculators, guides and worked examples</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search, e.g. cable sizing, IEEE 1584, IDMT, earthing"
          className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-accent-2/60 focus:outline-none"
        />
      </label>
      {q.trim() && (
        <div className="mt-2 rounded-lg border border-border bg-surface">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No matches. Try a shorter word or a standard number.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {results.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm hover:bg-surface-2">
                    <span className="text-foreground">{r.title}</span>
                    <span className="shrink-0 text-xs text-muted">{r.kind}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
