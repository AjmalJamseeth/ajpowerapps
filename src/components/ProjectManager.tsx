"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser-local scenario manager. Lets a user save the current inputs under a
// name, reload, overwrite or delete scenarios at any time, and export/import
// them as a JSON file (to back up, move between devices, or share). No
// account or server involved — data stays in this browser's localStorage.

interface Saved<T> {
  id: string;
  name: string;
  savedAt: number;
  data: T;
}

interface Props<T> {
  /** localStorage key, unique per calculator. */
  storageKey: string;
  /** Label used in the file name, e.g. "iec-60909". */
  fileTag: string;
  /** Current state of the calculator. */
  current: T;
  /** Replace the calculator state with a loaded scenario. */
  onLoad: (data: T) => void;
  /** Fresh starting state for "New scenario". */
  makeNew: () => T;
  /** Rejects malformed data from imported files / old saves. */
  validate: (data: unknown) => data is T;
}

const newId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function ProjectManager<T>({ storageKey, fileTag, current, onLoad, makeNew, validate }: Props<T>) {
  const [items, setItems] = useState<Saved<T>[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [storageOk, setStorageOk] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const persist = useCallback(
    (next: Saved<T>[]) => {
      setItems(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
        setStorageOk(true);
      } catch {
        setStorageOk(false);
      }
    },
    [storageKey]
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Reading browser storage after mount (not available during SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setItems(parsed.filter((p) => p && typeof p.id === "string" && validate(p.data)));
      }
    } catch {
      setStorageOk(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const flash = (text: string, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const clone = (d: T): T => JSON.parse(JSON.stringify(d));
  const active = items.find((i) => i.id === activeId) ?? null;

  const saveAsNew = () => {
    const nm = name.trim() || `Scenario ${items.length + 1}`;
    const item: Saved<T> = { id: newId(), name: nm, savedAt: Date.now(), data: clone(current) };
    persist([item, ...items]);
    setActiveId(item.id);
    setName("");
    flash(`Saved “${nm}”.`);
  };

  const overwrite = () => {
    if (!active) return;
    persist(items.map((i) => (i.id === active.id ? { ...i, data: clone(current), savedAt: Date.now() } : i)));
    flash(`Updated “${active.name}”.`);
  };

  const load = (item: Saved<T>) => {
    onLoad(clone(item.data));
    setActiveId(item.id);
    flash(`Loaded “${item.name}”.`);
  };

  const remove = (item: Saved<T>) => {
    if (!window.confirm(`Delete scenario “${item.name}”? This cannot be undone.`)) return;
    persist(items.filter((i) => i.id !== item.id));
    if (activeId === item.id) setActiveId(null);
    flash(`Deleted “${item.name}”.`);
  };

  const rename = (item: Saved<T>) => {
    const nm = window.prompt("Rename scenario", item.name);
    if (nm && nm.trim()) persist(items.map((i) => (i.id === item.id ? { ...i, name: nm.trim() } : i)));
  };

  const duplicate = (item: Saved<T>) => {
    const copy: Saved<T> = { id: newId(), name: `${item.name} (copy)`, savedAt: Date.now(), data: clone(item.data) };
    persist([copy, ...items]);
  };

  const startNew = () => {
    onLoad(makeNew());
    setActiveId(null);
    flash("Started a new scenario (not saved yet).");
  };

  const download = (list: Saved<T>[], label: string) => {
    const blob = new Blob([JSON.stringify({ app: "ajapps", tool: fileTag, version: 1, scenarios: list }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ajapps-${fileTag}-${label}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text());
      const list: Saved<T>[] = (Array.isArray(parsed?.scenarios) ? parsed.scenarios : [])
        .filter((p: { data?: unknown }) => p && validate(p.data))
        .map((p: Saved<T>) => ({ id: newId(), name: String(p.name ?? "Imported"), savedAt: Date.now(), data: p.data }));
      if (!list.length) throw new Error("no valid scenarios");
      persist([...list, ...items]);
      flash(`Imported ${list.length} scenario${list.length > 1 ? "s" : ""}.`);
    } catch {
      flash("That file isn't a valid AJapps scenario file for this calculator.", false);
    }
  };

  const btn = "rounded-md border border-border px-2.5 py-1 text-xs text-foreground hover:border-accent-2/60 hover:text-accent-2";

  return (
    <div className="no-print rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Projects &amp; scenarios</h2>
        <span className="text-xs text-muted">Saved in this browser — export a file to back up or move devices</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveAsNew()}
          placeholder="Scenario name, e.g. Parallel T1+T3, tie open"
          className="min-w-[220px] flex-1 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
        />
        <button type="button" onClick={saveAsNew} className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
          Save as new
        </button>
        {active && (
          <button type="button" onClick={overwrite} className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:border-accent-2/60">
            Update “{active.name.length > 18 ? active.name.slice(0, 17) + "…" : active.name}”
          </button>
        )}
        <button type="button" onClick={startNew} className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:border-accent-2/60">
          New scenario
        </button>
      </div>

      {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-pass" : "text-fail"}`}>{msg.text}</p>}
      {!storageOk && (
        <p className="mt-2 text-xs text-fail">
          This browser is blocking local storage (private mode?), so scenarios can&apos;t be kept between visits. Use Export to save a file.
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No saved scenarios yet. Build a network, give it a name and press “Save as new”.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border/60 rounded-lg border border-border">
          {items.map((it) => (
            <li key={it.id} className={`flex flex-wrap items-center gap-2 px-3 py-2 ${it.id === activeId ? "bg-accent-2/10" : ""}`}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {it.name}
                  {it.id === activeId && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-accent-2">open</span>}
                </div>
                <div className="text-[11px] text-muted">{new Date(it.savedAt).toLocaleString()}</div>
              </div>
              <button type="button" className={btn} onClick={() => load(it)}>Open</button>
              <button type="button" className={btn} onClick={() => rename(it)}>Rename</button>
              <button type="button" className={btn} onClick={() => duplicate(it)}>Duplicate</button>
              <button type="button" className={btn} onClick={() => download([it], it.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase())}>Export</button>
              <button type="button" className={`${btn} hover:!border-fail/40 hover:!text-fail`} onClick={() => remove(it)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={!items.length} onClick={() => download(items, "all-scenarios")}>
          Export all
        </button>
        <button type="button" className={btn} onClick={() => fileRef.current?.click()}>
          Import file…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
