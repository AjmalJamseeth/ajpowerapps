"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

export interface FeedbackButtonProps {
  /** Calculator name, e.g. "Transformer Sizer", or "General / Site Feedback" for the NavBar link. */
  calculatorName: string;
  /** Override the trigger button's visible label (defaults to the full "Report a bug…" text). */
  buttonLabel?: string;
  /** Override the trigger button's classes, e.g. for a compact NavBar variant. */
  buttonClassName?: string;
}

// Where reports go. The app has no backend/database yet (see README "Next
// steps"), so this is a zero-setup, zero-cost approach: pre-fill an email to
// AJMAL via a mailto: link, with a copy/download fallback in case the
// visitor's browser has no mail client configured (common on work machines,
// locked-down browsers, or mobile). Swap this out for a form-backend
// service (Formspree, Web3Forms) or a server email API (Resend, etc.) once
// the site is deployed publicly and a proper inbox pipeline is worth setting up.
const RECIPIENT_EMAIL = "oneandonlyajmal@gmail.com";

const ISSUE_TYPES = [
  "Incorrect calculation result",
  "Something's broken / error",
  "Confusing or unclear",
  "Feature request",
  "Other",
] as const;

const CONTAINER_SELECTOR = ".mx-auto.w-full.max-w-6xl.px-6.py-10";
const SNAPSHOT_CAP = 3000; // for clipboard copy / .txt download
const MAILTO_SNAPSHOT_CAP = 1200; // mailto URLs have practical length limits

function todayLabel(): string {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function labelFor(el: Element): string {
  const parent = el.parentElement;
  const label = parent?.querySelector("label");
  if (label) {
    return label.textContent?.trim().replace(/\s+/g, " ") ?? "field";
  }
  return (
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    el.id ||
    "field"
  );
}

function buildSnapshot(cap: number): string {
  try {
    const container = document.querySelector<HTMLElement>(CONTAINER_SELECTOR);
    if (!container) return "(No page snapshot available.)";

    const fields = Array.from(
      container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input, select, textarea"
      )
    );
    const inputLines = fields
      .map((el) => `- ${labelFor(el)}: ${el.value}`)
      .join("\n");

    let pageText = (container.innerText || "").replace(/\n{3,}/g, "\n\n").trim();
    if (pageText.length > cap) {
      pageText = pageText.slice(0, cap) + " …[truncated]";
    }

    return `Input values:\n${inputLines || "(none found)"}\n\nFull page text (includes computed results):\n${pageText}`;
  } catch {
    return "(Snapshot capture failed.)";
  }
}

export function FeedbackButton({ calculatorName, buttonLabel, buttonClassName }: FeedbackButtonProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<string>(ISSUE_TYPES[0]);
  const [description, setDescription] = useState("");
  const [expected, setExpected] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "copied" | "downloaded" | "needs-description">("idle");

  const reset = () => {
    setIssueType(ISSUE_TYPES[0]);
    setDescription("");
    setExpected("");
    setReporterEmail("");
    setStatus("idle");
  };

  const buildReportText = (cap: number) => {
    const snapshot = buildSnapshot(cap);
    return [
      `AJapps feedback: ${issueType}`,
      `Calculator: ${calculatorName}`,
      `Page: ${typeof window !== "undefined" ? window.location.href : ""}`,
      `Time: ${todayLabel()}`,
      `Reporter email: ${reporterEmail || "(not provided)"}`,
      "",
      "Description:",
      description || "(none provided)",
      "",
      "Additional detail:",
      expected || "(not applicable)",
      "",
      "--- Auto-captured page snapshot ---",
      snapshot,
    ].join("\n");
  };

  const validate = () => {
    if (!description.trim()) {
      setStatus("needs-description");
      return false;
    }
    return true;
  };

  const handleEmail = () => {
    if (!validate()) return;
    const subject = `AJapps feedback: ${issueType} — ${calculatorName}`;
    const body = buildReportText(MAILTO_SNAPSHOT_CAP);
    const url = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const handleCopy = async () => {
    if (!validate()) return;
    try {
      await navigator.clipboard.writeText(buildReportText(SNAPSHOT_CAP));
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  };

  const handleDownload = () => {
    if (!validate()) return;
    const blob = new Blob([buildReportText(SNAPSHOT_CAP)], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ajapps-feedback-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("downloaded");
    setTimeout(() => setStatus("idle"), 2000);
  };

  return (
    <div className="no-print">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ??
          "inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-2/60 hover:text-accent-2"
        }
      >
        {buttonLabel ?? "💬 Feedback / feature request"}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 px-4 py-8"
          onClick={() => {
            setOpen(false);
            reset();
          }}
        >
          <div
            className="mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-xl border-b border-border bg-surface px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Send feedback</h3>
                <p className="mt-1 text-xs text-muted">
                  Bug reports, incorrect results, or feature requests — {calculatorName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 px-6 pb-6 pt-4">
              <div>
                <label className="text-xs font-medium text-muted">Issue type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted">
                  {issueType === "Feature request" ? "What would you like to see?" : "What went wrong?"}{" "}
                  <span className="text-fail">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
                  placeholder={
                    issueType === "Feature request"
                      ? "Describe the feature or calculator you'd like to see added…"
                      : "Describe the bug or the answer you think is wrong…"
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted">
                  {issueType === "Feature request"
                    ? "Any extra detail? (optional — use cases, standards to follow, etc.)"
                    : "What did you expect instead? (optional — helpful for incorrect-answer reports)"}
                </label>
                <textarea
                  value={expected}
                  onChange={(e) => setExpected(e.target.value)}
                  rows={2}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
                  placeholder={
                    issueType === "Feature request"
                      ? "e.g. a Cathodic Protection Sizing calculator per NACE SP0169"
                      : "e.g. hand-calculated this and got 42.3 A, not 45.1 A"
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted">Your email (optional, for follow-up)</label>
                <input
                  type="email"
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-accent-2 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <p className="text-xs text-muted">
                The current inputs and results on this page are captured automatically and included with your
                report, so there&apos;s no need to retype them.
              </p>

              {status === "needs-description" && (
                <p className="text-xs text-fail">Please describe the issue before sending.</p>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleEmail}
                  className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  ✉️ Email report
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm text-foreground hover:border-accent-2/60"
                >
                  {status === "copied" ? "Copied ✓" : "Copy report text"}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-md border border-border bg-surface-2 px-4 py-2 text-sm text-foreground hover:border-accent-2/60"
                >
                  {status === "downloaded" ? "Downloaded ✓" : "Download .txt"}
                </button>
              </div>
              <p className="text-[11px] text-muted">
                &quot;Email report&quot; opens your default mail client addressed to {RECIPIENT_EMAIL}. If nothing
                opens (no mail client configured), use Copy or Download and send it however&apos;s easiest.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
