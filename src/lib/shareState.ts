"use client";
/* eslint-disable react-hooks/set-state-in-effect -- inputs are read from the URL once after hydration */

// Shareable calculator inputs: the current inputs are encoded into a ?s=
// query parameter, and a calculator opened from such a link starts with those
// inputs. Only keys that exist in the calculator's defaults, with a matching
// value type, are accepted, so an edited or old link can never inject
// unexpected fields.

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

type Getter = () => unknown;
let currentGetter: Getter | null = null;
const listeners = new Set<() => void>();

export function getShareGetter(): Getter | null {
  return currentGetter;
}
export function subscribeShare(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function setGetter(g: Getter | null) {
  currentGetter = g;
  listeners.forEach((l) => l());
}

function toBase64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeShare(value: unknown): string {
  return toBase64Url(JSON.stringify(value));
}

const kind = (v: unknown) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

// Merge `incoming` into `defaults`, keeping only known keys whose type fits.
// A number field may be null (blank input) and vice versa.
export function mergeKnown<T>(defaults: T, incoming: unknown): T {
  if (kind(defaults) !== "object" || kind(incoming) !== "object") return defaults;
  const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
  for (const [k, def] of Object.entries(defaults as Record<string, unknown>)) {
    if (!(k in (incoming as object))) continue;
    const v = (incoming as Record<string, unknown>)[k];
    const kd = kind(def), kv = kind(v);
    const numericish = (a: string, b: string) => (a === "number" || a === "null") && (b === "number" || b === "null");
    if (kd === kv || numericish(kd, kv)) {
      if (kv === "number" && !Number.isFinite(v as number)) continue;
      if (kd === "object") out[k] = mergeKnown(def, v);
      else if (kd === "array") out[k] = (v as unknown[]).slice(0, 200);
      else if (kv === "string") out[k] = (v as string).slice(0, 500);
      else out[k] = v;
    }
  }
  return out as T;
}

export function decodeShare<T>(defaults: T, s: string): T | null {
  try {
    return mergeKnown(defaults, JSON.parse(fromBase64Url(s)));
  } catch {
    return null;
  }
}

/** Drop-in replacement for useState(defaults) that supports share links. */
export function useShareableInput<T>(defaults: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(defaults);

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("s");
    if (!s) return;
    const decoded = decodeShare(defaults, s);
    if (decoded) setState(decoded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setGetter(() => state);
  }, [state]);
  useEffect(() => () => setGetter(null), []);

  return [state, setState];
}
