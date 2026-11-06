"use client";

import { useRef, useState } from "react";
import { ShareButton } from "@/components/ShareButton";

export interface ReportButtonProps {
  title: string; // calculator name, e.g. "Transformer Sizer"
  standardsLine?: string; // short one-line standards summary shown in the report header
}

const REPORT_MODE_EVENT = "ajapps:report-mode";
const FOOTER_URL = "www.ajpowerapps.com";

function todayLabel(): string {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Optional title-block fields printed on the report. Remembered in this
// browser so an engineer fills them in once per project.
const FIELDS_KEY = "ajapps:report-fields";
const FIELD_DEFS = [
  { key: "project", label: "Project" },
  { key: "client", label: "Client" },
  { key: "docRef", label: "Document / calc ref." },
  { key: "revision", label: "Revision" },
  { key: "preparedBy", label: "Prepared by" },
  { key: "checkedBy", label: "Checked by" },
] as const;
type FieldKey = (typeof FIELD_DEFS)[number]["key"];
type ReportFields = Record<FieldKey, string>;
const EMPTY_FIELDS: ReportFields = { project: "", client: "", docRef: "", revision: "", preparedBy: "", checkedBy: "" };

function loadFields(): ReportFields {
  try {
    const raw = window.localStorage.getItem(FIELDS_KEY);
    return raw ? { ...EMPTY_FIELDS, ...JSON.parse(raw) } : EMPTY_FIELDS;
  } catch {
    return EMPTY_FIELDS;
  }
}
function saveFields(f: ReportFields) {
  try {
    window.localStorage.setItem(FIELDS_KEY, JSON.stringify(f));
  } catch {
    /* storage unavailable — fields still apply to this report */
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function ReportButton({ title, standardsLine }: ReportButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");
  // Computed fresh, client-side only, at the moment a report is generated —
  // never during the initial render, so server and client always agree on
  // the initial "" value and there's no hydration mismatch from
  // locale/timezone differences between the Node SSR environment and the
  // browser (toLocaleString(undefined, ...) can format the same instant
  // differently — e.g. 24-hour vs 12-hour AM/PM — depending on each
  // environment's default ICU locale).
  const [generatedLabel, setGeneratedLabel] = useState("");
  const [fields, setFields] = useState<ReportFields>(EMPTY_FIELDS);
  const [formOpen, setFormOpen] = useState(false);
  const filled = FIELD_DEFS.filter((d) => fields[d.key].trim());

  const handleDownload = async () => {
    if (status === "working") return;
    setStatus("working");
    const label = todayLabel();
    setGeneratedLabel(label);
    const html = document.documentElement;
    let overlay: HTMLDivElement | null = null;
    const savedScroll = window.scrollY;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        // html2canvas-pro (not the plain html2canvas package) — Tailwind
        // v4 renders color/opacity utilities using modern CSS oklab()/
        // oklch() color functions, which the original html2canvas can't
        // parse ("Attempting to parse an unsupported color function").
        // html2canvas-pro is a maintained fork with support for those.
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const container = btnRef.current?.closest<HTMLElement>(
        ".mx-auto.w-full.max-w-6xl.px-6.py-10"
      );
      if (!container) throw new Error("Report container not found");

      // Switch to the light, single-column report layout and force every
      // "About this tool" panel open so the report includes as much
      // information as possible — purpose, standards, capabilities, and
      // the worked example, not just the raw input/result fields.
      // Cover the screen while the page is temporarily restyled, so the
      // user never sees the dark -> light flash. The overlay sits outside
      // the captured container, so it doesn't appear in the PDF.
      overlay =document.createElement("div");
      const bg = getComputedStyle(document.body).backgroundColor;
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;" +
        "flex-direction:column;gap:14px;font:500 15px system-ui,sans-serif;color:#cbd5e1;background:" +
        (bg && bg !== "rgba(0, 0, 0, 0)" ? bg : "#0b1020");
      overlay.innerHTML =
        '<div style="width:34px;height:34px;border:3px solid #475569;border-top-color:#22d3ee;border-radius:50%;animation:ajspin 0.8s linear infinite"></div>' +
        "<div>Generating report…</div>" +
        "<style>@keyframes ajspin{to{transform:rotate(360deg)}}</style>";
      document.body.appendChild(overlay);

      html.classList.add("report-mode");
      window.dispatchEvent(new CustomEvent(REPORT_MODE_EVENT, { detail: { on: true } }));
      // Let React re-render (panels opening, grid collapsing to one
      // column) and the browser reflow before we screenshot it.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 250));

      // Positions of blocks that should not be sliced through by a page
      // break (cards, tables rows, charts, labels, paragraphs...).
      const cRect = container.getBoundingClientRect();
      const blockRects: { top: number; bottom: number }[] = [];
      container
        .querySelectorAll<HTMLElement>(
          "section, table, tr, svg, figure, img, canvas, p, li, h1, h2, h3, h4, label, [data-pdf-avoid], " +
            "[class*='rounded'], [class*='border']"
        )
        .forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.height > 4) blockRects.push({ top: r.top - cRect.top, bottom: r.bottom - cRect.top });
        });

      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: container.scrollWidth,
      });
      const ratio = canvas.height / cRect.height; // canvas px per CSS px

      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const frame = 16; // outer border inset
      const padX = 18; // space between border and content
      const padTop = 20;
      const footerHeight = 30;
      const margin = frame + padX;
      const contentWidthPt = pageWidth - margin * 2;
      const contentHeightPt = pageHeight - frame - padTop - frame - footerHeight;

      // px -> pt scale, and how many source pixels fit on one PDF page
      const pxToPt = contentWidthPt / canvas.width;
      const pagePxHeight = Math.floor(contentHeightPt / pxToPt);

      // Choose page breaks that don't cut through a block. A block taller
      // than ~90% of a page is ignored (it has to be split somewhere).
      const rects = blockRects
        .map((b) => ({ top: Math.round(b.top * ratio), bottom: Math.round(b.bottom * ratio) }))
        .filter((b) => b.bottom - b.top < pagePxHeight * 0.9);
      const breaks: number[] = [0];
      for (let y = 0; y < canvas.height; ) {
        let cut = y + pagePxHeight;
        if (cut >= canvas.height) {
          breaks.push(canvas.height);
          break;
        }
        for (let guard = 0; guard < 60; guard++) {
          let newCut = cut;
          for (const b of rects) {
            if (b.top < newCut && b.bottom > newCut && b.top > y + pagePxHeight * 0.3) newCut = b.top;
          }
          if (newCut === cut) break;
          cut = newCut;
        }
        breaks.push(cut);
        y = cut;
      }
      const totalPages = breaks.length - 1;

      const drawFrame = (pageNum: number) => {
        pdf.setDrawColor(148, 163, 184);
        pdf.setLineWidth(1);
        pdf.roundedRect(frame, frame, pageWidth - frame * 2, pageHeight - frame * 2, 6, 6, "S");
        // footer rule
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.5);
        pdf.line(frame + 10, pageHeight - frame - footerHeight + 6, pageWidth - frame - 10, pageHeight - frame - footerHeight + 6);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(FOOTER_URL, frame + 14, pageHeight - frame - 10);
        const pn = String(pageNum) + " / " + String(totalPages);
        pdf.text(pn, pageWidth - frame - 14 - pdf.getTextWidth(pn), pageHeight - frame - 10);
      };

      const sliceCanvas = document.createElement("canvas");
      const sliceCtx = sliceCanvas.getContext("2d");
      if (!sliceCtx) throw new Error("2D context unavailable");

      for (let page = 0; page < totalPages; page++) {
        const sy = breaks[page];
        const sHeight = Math.max(1, breaks[page + 1] - sy);
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sHeight;
        sliceCtx.fillStyle = "#ffffff";
        sliceCtx.fillRect(0, 0, canvas.width, sHeight);
        sliceCtx.drawImage(canvas, 0, sy, canvas.width, sHeight, 0, 0, canvas.width, sHeight);
        const sliceData = sliceCanvas.toDataURL("image/png");
        const sliceHeightPt = sHeight * pxToPt;

        if (page > 0) pdf.addPage();
        pdf.addImage(sliceData, "PNG", margin, frame + padTop, contentWidthPt, sliceHeightPt, undefined, "FAST");
        drawFrame(page + 1);
      }

      const ref = fields.docRef.trim() ? `${slugify(fields.docRef)}-` : "";
      pdf.save(`AJapps-${ref}${slugify(title)}-report-${slugify(label)}.pdf`);
      setStatus("idle");
    } catch (err) {
      console.error("Report generation failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    } finally {
      html.classList.remove("report-mode");
      window.dispatchEvent(new CustomEvent(REPORT_MODE_EVENT, { detail: { on: false } }));
      // Wait for the dark theme to be back before removing the cover.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.scrollTo(0, savedScroll);
      overlay?.remove();
    }
  };

  return (
    <div className="report-wrap">
      {/* Only visible while report-mode is active (i.e. inside the
          captured screenshot) — gives the PDF a proper title/branding
          block instead of just starting mid-page at the calculator UI. */}
      <div className="report-header-block mb-6 border-b-2 border-border pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-bold text-white">A</span>
          <span className="text-lg font-bold text-foreground">
            AJ<span className="text-accent">apps</span>
          </span>
          <span className="ml-2 text-sm text-muted">Engineering Calculation Report</span>
        </div>
        <p className="mt-3 text-xl font-semibold text-foreground">{title}</p>
        {standardsLine && <p className="mt-1 text-xs text-muted">{standardsLine}</p>}
        <p className="mt-1 text-xs text-muted">Generated {generatedLabel}</p>
        {filled.length > 0 && (
          <table className="mt-3 w-full border-collapse text-xs">
            <tbody>
              {Array.from({ length: Math.ceil(filled.length / 2) }, (_, i) => filled.slice(i * 2, i * 2 + 2)).map((pair, i) => (
                <tr key={i}>
                  {pair.map((d) => (
                    <td key={d.key} className="w-1/2 border border-border px-2 py-1">
                      <span className="text-muted">{d.label}: </span>
                      <span className="font-medium text-foreground">{fields[d.key]}</span>
                    </td>
                  ))}
                  {pair.length === 1 && <td className="w-1/2 border border-border px-2 py-1" />}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-2 text-xs italic text-muted">
          For preliminary engineering use only — always verify results against project-specific
          standards and a qualified engineer&apos;s review before use in a real design.
        </p>
      </div>

      <div className="no-print flex flex-wrap gap-3">
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          setFields(loadFields());
          setFormOpen(true);
        }}
        disabled={status === "working"}
        className="no-print inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-2/60 hover:text-accent-2 disabled:cursor-wait disabled:opacity-60"
      >
        {status === "working" ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-accent-2" />
            Generating report…
          </>
        ) : status === "error" ? (
          "Couldn’t generate report — try again"
        ) : (
          <>📄 Download PDF Report</>
        )}
      </button>
      <ShareButton />
      </div>

      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report details"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}
        >
          <form
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              saveFields(fields);
              setFormOpen(false);
              void handleDownload(); // waits for the re-render before capturing
            }}
          >
            <h3 className="text-base font-semibold text-foreground">Report details (optional)</h3>
            <p className="mt-1 text-xs text-muted">Printed in the report title block. Saved in this browser for next time.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FIELD_DEFS.map((d) => (
                <label key={d.key} className="block text-xs text-muted">
                  {d.label}
                  <input
                    value={fields[d.key]}
                    maxLength={80}
                    onChange={(e) => setFields((f) => ({ ...f, [d.key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-sm text-foreground focus:border-accent-2/60 focus:outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setFields(EMPTY_FIELDS)} className="mr-auto text-xs text-muted hover:text-foreground">
                Clear
              </button>
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground">
                Cancel
              </button>
              <button type="submit" className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-background hover:opacity-90">
                Generate PDF
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
