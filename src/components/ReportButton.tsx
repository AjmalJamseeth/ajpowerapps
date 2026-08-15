"use client";

import { useRef, useState } from "react";

export interface ReportButtonProps {
  title: string; // calculator name, e.g. "Transformer Sizer"
  standardsLine?: string; // short one-line standards summary shown in the report header
}

const REPORT_MODE_EVENT = "ajapps:report-mode";
const WATERMARK_TEXT = "AJapps";

function todayLabel(): string {
  return new Date().toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const handleDownload = async () => {
    if (status === "working") return;
    setStatus("working");
    const label = todayLabel();
    setGeneratedLabel(label);
    const html = document.documentElement;
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
      html.classList.add("report-mode");
      window.dispatchEvent(new CustomEvent(REPORT_MODE_EVENT, { detail: { on: true } }));
      // Let React re-render (panels opening, grid collapsing to one
      // column) and the browser reflow before we screenshot it.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        windowWidth: container.scrollWidth,
      });

      const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 28;
      const footerHeight = 26;
      const contentWidthPt = pageWidth - margin * 2;
      const contentHeightPt = pageHeight - margin * 2 - footerHeight;

      // px -> pt scale, and how many source pixels fit on one PDF page
      const pxToPt = contentWidthPt / canvas.width;
      const pagePxHeight = Math.floor(contentHeightPt / pxToPt);

      const drawWatermark = () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(42);
        pdf.setTextColor(232, 232, 232);
        for (let y = 70; y < pageHeight; y += 150) {
          for (let x = -40; x < pageWidth + 80; x += 210) {
            pdf.text(WATERMARK_TEXT, x, y, { angle: 35 });
          }
        }
      };

      const drawFooter = (pageNum: number, pageCount: number) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          `AJapps — ${title} — generated ${label} — for preliminary engineering use only, verify against project-specific standards.`,
          margin,
          pageHeight - 12
        );
        pdf.text(String(pageNum) + " / " + String(pageCount), pageWidth - margin - 24, pageHeight - 12);
      };

      const totalPages = Math.max(1, Math.ceil(canvas.height / pagePxHeight));

      const sliceCanvas = document.createElement("canvas");
      const sliceCtx = sliceCanvas.getContext("2d");
      if (!sliceCtx) throw new Error("2D context unavailable");

      for (let page = 0; page < totalPages; page++) {
        const sy = page * pagePxHeight;
        const sHeight = Math.min(pagePxHeight, canvas.height - sy);
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sHeight;
        sliceCtx.clearRect(0, 0, canvas.width, sHeight);
        sliceCtx.drawImage(canvas, 0, sy, canvas.width, sHeight, 0, 0, canvas.width, sHeight);
        const sliceData = sliceCanvas.toDataURL("image/png");
        const sliceHeightPt = sHeight * pxToPt;

        if (page > 0) pdf.addPage();
        pdf.addImage(sliceData, "PNG", margin, margin, contentWidthPt, sliceHeightPt, undefined, "FAST");
        drawWatermark();
        drawFooter(page + 1, totalPages);
      }

      pdf.save(`AJapps-${slugify(title)}-report-${slugify(label)}.pdf`);
      setStatus("idle");
    } catch (err) {
      console.error("Report generation failed:", err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2500);
    } finally {
      html.classList.remove("report-mode");
      window.dispatchEvent(new CustomEvent(REPORT_MODE_EVENT, { detail: { on: false } }));
    }
  };

  return (
    <div className="no-print">
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
        <h2 className="mt-3 text-xl font-semibold text-foreground">{title}</h2>
        {standardsLine && <p className="mt-1 text-xs text-muted">{standardsLine}</p>}
        <p className="mt-1 text-xs text-muted">Generated {generatedLabel}</p>
        <p className="mt-2 text-xs italic text-muted">
          For preliminary engineering use only — always verify results against project-specific
          standards and a qualified engineer&apos;s review before use in a real design.
        </p>
      </div>

      <button
        ref={btnRef}
        type="button"
        onClick={handleDownload}
        disabled={status === "working"}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent-2/60 hover:text-accent-2 disabled:cursor-wait disabled:opacity-60"
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
    </div>
  );
}
