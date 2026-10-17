"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { FEATURES } from "@/lib/features";
import {
  applyHandoff,
  HANDOFF_TO_OPTIMISER,
  HANDOFF_TO_SUITE,
  isSuiteProject,
  putHandoff,
  suiteToRelays,
  takeHandoff,
  type SuiteHandoff,
  type SuiteProject,
} from "@/lib/suiteBridge";

const SUITE_SRC = "/protection-suite/index.html";

/** Protection Coordination Workbench (PCW-PRO) embedded unchanged, with a two-way link to the Arc-Flash & Protection Setting Optimiser. */
export default function ProtectionSuitePage() {
  const router = useRouter();
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, setPending] = useState<SuiteHandoff | null>(null);
  const [preview, setPreview] = useState<{ lines: string[]; project: SuiteProject } | null>(null);
  const [previous, setPrevious] = useState<SuiteProject | null>(null);
  const [busy, setBusy] = useState(false);

  // send a request to the workbench and wait for its answer
  const call = useCallback(<T,>(type: string, payload?: unknown): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const win = frameRef.current?.contentWindow;
      if (!win) return reject(new Error("The workbench is not loaded yet."));
      const id = Math.random().toString(36).slice(2);
      const timer = setTimeout(() => {
        window.removeEventListener("message", onMsg);
        reject(new Error("The workbench did not answer. Reload the page and try again."));
      }, 6000);
      function onMsg(ev: MessageEvent) {
        if (ev.origin !== window.location.origin) return;
        const m = ev.data as { source?: string; id?: string; ok?: boolean; payload?: T; error?: string } | null;
        if (!m || m.source !== "pcw" || m.id !== id) return;
        clearTimeout(timer);
        window.removeEventListener("message", onMsg);
        if (m.ok) resolve(m.payload as T);
        else reject(new Error(m.error || "The workbench reported an error."));
      }
      window.addEventListener("message", onMsg);
      win.postMessage({ source: "ajapps", type, id, payload }, window.location.origin);
    });
  }, []);

  // the workbench announces itself when it has loaded
  useEffect(() => {
    const onReady = (ev: MessageEvent) => {
      if (ev.origin !== window.location.origin) return;
      const m = ev.data as { source?: string; type?: string } | null;
      if (m && m.source === "pcw" && m.type === "ready") setReady(true);
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, []);

  // the announcement can be missed if the frame loads before this page hydrates, so also ask for it
  useEffect(() => {
    if (ready) return;
    let tries = 0;
    const t = setInterval(() => {
      if (++tries > 12) return clearInterval(t);
      call("ping")
        .then(() => setReady(true))
        .catch(() => undefined);
    }, 1000);
    return () => clearInterval(t);
  }, [ready, call]);

  // proposal waiting from the optimiser
  useEffect(() => {
    const h = takeHandoff<SuiteHandoff>(HANDOFF_TO_SUITE, true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a hand-off that only exists in the browser
    if (h && Array.isArray(h.updates)) setPending(h);
  }, []);

  const showPreview = async () => {
    if (!pending) return;
    setBusy(true);
    setMsg(null);
    try {
      const project = await call<unknown>("getProject");
      if (!isSuiteProject(project) || project.curves.length === 0) throw new Error("Open or create a project in the workbench first, then preview the proposal.");
      setPreview(applyHandoff(project, pending));
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
    } finally {
      setBusy(false);
    }
  };

  const applyPending = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const before = await call<unknown>("getProject");
      await call("loadProject", preview.project);
      if (isSuiteProject(before)) setPrevious(before);
      takeHandoff(HANDOFF_TO_SUITE);
      setPending(null);
      setPreview(null);
      setMsg({ text: "Proposed settings applied to the workbench. Check the grading table in the workbench, then save the project from there. You can undo below.", ok: true });
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
    } finally {
      setBusy(false);
    }
  };

  const undo = async () => {
    if (!previous) return;
    setBusy(true);
    try {
      await call("loadProject", previous);
      setPrevious(null);
      setMsg({ text: "Previous settings restored.", ok: true });
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    takeHandoff(HANDOFF_TO_SUITE);
    setPending(null);
    setPreview(null);
  };

  const sendToOptimiser = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const project = await call<unknown>("getProject");
      if (!isSuiteProject(project)) throw new Error("This does not look like a workbench project.");
      const imp = suiteToRelays(project);
      if (imp.relays.length === 0) throw new Error(imp.notes[0] ?? "No IDMT relays to send.");
      const ok = putHandoff(HANDOFF_TO_OPTIMISER, { at: new Date().toISOString(), projectName: project.projectName ?? "Workbench project", relays: imp.relays, skipped: imp.skipped, notes: imp.notes });
      if (!ok) throw new Error("The browser blocked local storage, so the relays cannot be passed on. Allow site data and try again.");
      router.push("/calculators/arc-flash-protection-settings");
    } catch (e) {
      setMsg({ text: (e as Error).message, ok: false });
      setBusy(false);
    }
  };

  const btn = "rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-2/60 disabled:opacity-50";

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Protection Coordination Suite</h1>
        <p className="mt-2 max-w-3xl text-muted">
          The full protection coordination workbench: time-current curves for IDMT, definite-time, LSIG breakers, MCB, fuses, motor and custom curves, grading checks,
          damage-curve overlays, suggested setting changes, transformer, busbar, line and generator protection setting tools, CT/VT sizing, LV board coordination, relay
          import and settings sheets.{FEATURES.studio ? " Use the buttons below to link it with the arc-flash study." : ""}
        </p>

        {FEATURES.studio && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={btn} disabled={!ready || busy} onClick={sendToOptimiser}>
                Check these relays for arc flash →
              </button>
              <span className="text-xs text-muted">
                Sends the IEC/IEEE IDMT relays and their grading links to the Arc-Flash &amp; Protection Setting Optimiser. Other device types stay here.
              </span>
            </div>
            {!ready && <p className="mt-2 text-xs text-muted">Loading the workbench…</p>}
            {msg && <p className={`mt-3 text-sm ${msg.ok ? "text-pass" : "text-fail"}`}>{msg.text}</p>}
            {previous && (
              <button type="button" className={`${btn} mt-3`} disabled={busy} onClick={undo}>
                Undo the applied settings
              </button>
            )}
          </div>
        )}

        {FEATURES.studio && pending && (
          <div className="mt-4 rounded-xl border border-accent-2/40 bg-accent-2/10 p-4">
            <div className="text-sm font-semibold text-foreground">Proposed settings are waiting from the Arc-Flash &amp; Protection Setting Optimiser</div>
            <p className="mt-1 text-xs text-muted">
              {pending.updates.length} relay{pending.updates.length === 1 ? "" : "s"} changed
              {pending.faults.length > 0 ? ` and ${pending.faults.length} maximum fault level${pending.faults.length === 1 ? "" : "s"} from the short-circuit study` : ""}. Nothing is changed until you apply it.
            </p>
            {!preview ? (
              <div className="mt-3 flex gap-2">
                <button type="button" className={btn} disabled={!ready || busy} onClick={showPreview}>
                  Preview the changes
                </button>
                <button type="button" className={btn} onClick={dismiss}>
                  Discard
                </button>
              </div>
            ) : (
              <>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {preview.lines.length === 0 ? <li>The workbench already has these settings.</li> : preview.lines.map((l, i) => <li key={i}>{l}</li>)}
                </ul>
                <div className="mt-3 flex gap-2">
                  <button type="button" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50" disabled={busy} onClick={applyPending}>
                    Apply to the workbench
                  </button>
                  <button type="button" className={btn} onClick={dismiss}>
                    Discard
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          ref={frameRef}
          src={SUITE_SRC}
          title="Protection Coordination Workbench"
          className="block h-[calc(100vh-5rem)] min-h-[860px] w-full rounded-xl border border-border bg-[#0b0f14]"
        />
      </div>
    </div>
  );
}
