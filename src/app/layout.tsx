import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ajpowerapps.com"),
  title: {
    default: "AJapps — Electrical Engineering Calculators",
    template: "%s | AJapps",
  },
  description:
    "81 standards-based electrical engineering calculators covering protection relay coordination, cable sizing, earthing, transformers, power quality, backup power, instrumentation, renewables and facilities engineering. Built on cited IEC, IEEE, NEC and NFPA references. Free, no signup required.",
  keywords: [
    "electrical engineering calculator",
    "IDMT relay coordination",
    "arc flash calculator",
    "cable sizing calculator",
    "earthing grid design",
    "protection relay grading",
    "IEC 60364",
    "IEEE 1584",
    "NEC calculator",
  ],
  openGraph: {
    title: "AJapps — Electrical Engineering Calculators",
    description:
      "81 standards-based electrical engineering calculators — protection relay coordination, cable sizing, earthing, transformers, power quality, backup power, renewables and more. Free, no signup required.",
    url: "https://www.ajpowerapps.com",
    siteName: "AJapps",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AJapps — Electrical Engineering Calculators",
    description:
      "81 standards-based electrical engineering calculators. Free, no signup required.",
  },
  alternates: {
    canonical: "/",
  },
};

// Runs before paint so the correct theme class is on <html> before any
// content renders — avoids a flash of the wrong theme on load. Dark is
// always the site's default; light mode only applies if the visitor has
// explicitly chosen it before via the ThemeToggle (saved to localStorage).
// The OS/browser color-scheme preference is intentionally not consulted,
// so a light-mode OS does not silently override the site's dark default.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("ajapps-theme");
    if (saved === "light") document.documentElement.classList.add("light");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
