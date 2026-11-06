"use client";

// Display-unit toggles for number inputs. Calculators always work in their
// own base unit (m, °C, kW); a field can show and accept an alternative unit
// (ft, °F, hp) and converts at the input boundary only. The choice is
// remembered site-wide in this browser.

import { useSyncExternalStore } from "react";

export interface UnitAlt {
  alt: string;
  toAlt: (v: number) => number;
  fromAlt: (v: number) => number;
}

export const UNIT_ALTS: Record<string, UnitAlt> = {
  m: { alt: "ft", toAlt: (v) => v / 0.3048, fromAlt: (v) => v * 0.3048 },
  "°C": { alt: "°F", toAlt: (v) => (v * 9) / 5 + 32, fromAlt: (v) => ((v - 32) * 5) / 9 },
  kW: { alt: "hp", toAlt: (v) => v / 0.745699872, fromAlt: (v) => v * 0.745699872 },
};

const KEY = "ajapps:unit-alts";
const listeners = new Set<() => void>();
let cache: Record<string, boolean> | null = null;

function read(): Record<string, boolean> {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

export function toggleUnit(base: string) {
  const next = { ...read(), [base]: !read()[base] };
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* not persisted */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** True when the alternative unit is selected for this base unit. */
export function useAltUnit(base: string | undefined): boolean {
  return useSyncExternalStore(
    subscribe,
    () => (base && UNIT_ALTS[base] ? !!read()[base] : false),
    () => false
  );
}

export const roundDisplay = (v: number) => Number(v.toFixed(4));
