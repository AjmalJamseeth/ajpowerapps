import { ImageResponse } from "next/og";

// Default social-share image (Open Graph / Twitter) used by every page that
// doesn't define its own. Generated at build time.
export const alt = "AJapps — free standards-based electrical engineering calculators";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #05080d 0%, #0b1622 60%, #0e2a33 100%)",
          color: "#e6edf3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 34, color: "#22d3ee", letterSpacing: 2 }}>AJapps · ajpowerapps.com</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
          Electrical Engineering Calculators
        </div>
        <div style={{ fontSize: 36, marginTop: 28, color: "#9fb0c0" }}>
          Protection & IDMT · Arc flash · Short circuit · Cable sizing · Earthing — free, no signup
        </div>
        <div style={{ display: "flex", marginTop: 48, height: 6, width: 360, background: "#fbbf24", borderRadius: 3 }} />
      </div>
    ),
    size
  );
}
