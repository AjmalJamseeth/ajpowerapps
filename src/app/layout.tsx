import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.ajpowerapps.com"),
  title: {
    default: "AJapps — Electrical Power & SCADA Engineering Tools",
    template: "%s | AJapps",
  },
  description:
    "Electrical power, protection and SCADA engineering tools: relay coordination, arc flash, short circuit, cable sizing, earthing, transformers, IEC 61850 SCL and GOOSE analysis, substation network design and SCADA connectivity. Every method, standard and limit explained. No signup required.",
  openGraph: {
    title: "AJapps — Electrical Power & SCADA Engineering Tools",
    description:
      "Electrical power, protection and SCADA engineering tools — calculators, engineering suites and IEC 61850 applications, with every method explained. No signup required.",
    url: "https://www.ajpowerapps.com",
    siteName: "AJapps",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AJapps — Electrical Power & SCADA Engineering Tools",
    description:
      "Electrical power and SCADA engineering tools, with every method explained.",
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
