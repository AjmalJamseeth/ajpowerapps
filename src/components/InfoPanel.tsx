"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getExamplesForCalculator } from "@/lib/workedExamples";

// ReportButton dispatches this on window right before/after capturing the
// page, so every InfoPanel on the page can force itself open (so its
// content — purpose, standards, capabilities, worked example — is
// included in the generated report) and restore its prior state after.
const REPORT_MODE_EVENT = "ajapps:report-mode";

export interface InfoPanelProps {
  purpose: string; // 1-2 paragraph description of what the tool does & why it matters
  standards: string[]; // list of standard references, e.g. "NEC Article 430"
  capabilities: string[]; // bullet-style capability statements (rendered as prose list)
  example: {
    problem: string;
    steps: string[]; // worked calculation steps
    result: string; // final answer / takeaway
  };
  notes?: string; // optional caveat/limitation paragraph
}

export function InfoPanel({ purpose, standards, capabilities, example, notes }: InfoPanelProps) {
  const [open, setOpen] = useState(false);
  const priorOpen = useRef(false);
  const pathname = usePathname();
  const relatedExamples = pathname ? getExamplesForCalculator(pathname) : [];

  useEffect(() => {
    const onReportMode = (e: Event) => {
      const on = (e as CustomEvent<{ on: boolean }>).detail?.on;
      setOpen((current) => {
        if (on) {
          priorOpen.current = current;
          return true;
        }
        return priorOpen.current;
      });
    };
    window.addEventListener(REPORT_MODE_EVENT, onReportMode);
    return () => window.removeEventListener(REPORT_MODE_EVENT, onReportMode);
  }, []);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="rounded-full bg-accent-2/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-2">
            About this tool
          </span>
          Purpose, standards &amp; a worked example
        </span>
        <span className="text-muted transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }}>
          ▾
        </span>
      </button>
      {open && (
        <div className="space-y-5 border-t border-border px-6 py-5 text-sm leading-relaxed text-muted">
          <p>{purpose}</p>

          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">Standards followed</h4>
            <div className="flex flex-wrap gap-1.5">
              {standards.map((s) => (
                <span key={s} className="rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] text-foreground">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">What it can do</h4>
            <ul className="list-disc space-y-1 pl-5">
              {capabilities.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">Example problem</h4>
            <p className="mb-2">{example.problem}</p>
            <ol className="list-decimal space-y-1 pl-5">
              {example.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <p className="mt-2 font-medium text-foreground">{example.result}</p>
          </div>

          {relatedExamples.length > 0 && (
            <div className="rounded-lg border border-accent-2/30 bg-accent-2/5 p-4">
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
                Want the full step-by-step version?
              </h4>
              <ul className="space-y-1.5">
                {relatedExamples.map((ex) => (
                  <li key={ex.slug}>
                    <Link href={`/examples/${ex.slug}`} className="text-accent-2 hover:underline">
                      {ex.title} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {notes && <p className="text-xs italic text-muted/80">{notes}</p>}
        </div>
      )}
    </div>
  );
}
