"use client";

import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "ajapps-theme";

// No React state here on purpose: which icon is visible is driven entirely
// by CSS off the `.light` class already present on <html> (set before paint
// by the inline script in layout.tsx), via the `[.light_&]:` arbitrary
// selector variants below. That avoids any server/client hydration mismatch
// — there's no state to get out of sync with the DOM in the first place.
export function ThemeToggle() {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // localStorage unavailable (private browsing, etc.) — theme just
      // won't persist across reloads, which is a harmless degradation.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light/dark theme"
      title="Toggle light/dark theme"
      className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-border bg-surface-2 text-muted transition-colors hover:border-accent-2/60 hover:text-foreground"
    >
      <Sun className="h-4 w-4 [.light_&]:hidden" aria-hidden="true" />
      <Moon className="hidden h-4 w-4 [.light_&]:block" aria-hidden="true" />
    </button>
  );
}
