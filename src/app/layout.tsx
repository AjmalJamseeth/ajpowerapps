import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AJapps — Electrical Engineering Calculators",
  description:
    "Free electrical protection engineering calculators: IDMT relay coordination, arc flash, maximum demand and more.",
};

// Runs before paint so the correct theme class is on <html> before any
// content renders — avoids a flash of the wrong theme on load. Reads a
// saved preference first, falling back to the OS/browser color-scheme
// preference; dark is the default when neither is available.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var saved = localStorage.getItem("ajapps-theme");
    var wantsLight = saved ? saved === "light" : window.matchMedia("(prefers-color-scheme: light)").matches;
    if (wantsLight) document.documentElement.classList.add("light");
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
