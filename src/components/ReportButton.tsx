"use client";

import { useRef, useState } from "react";

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

      pdf.save(`AJapps-${slugify(title)}-report-${slugify(label)}.pdf`);
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
