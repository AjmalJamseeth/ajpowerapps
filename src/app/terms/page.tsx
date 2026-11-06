import Link from "next/link";
import NavBar from "@/components/NavBar";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/terms",
  "Terms of Use & Engineering Disclaimer",
  "Terms of use for AJapps electrical engineering calculators, including the engineering disclaimer, intended use and limitation of liability."
);

const UPDATED = "November 2026";

const SECTIONS: { h: string; p: string[] }[] = [
  {
    h: "Intended use",
    p: [
      "AJapps provides calculators, guides and worked examples for preliminary electrical engineering design, checking and education. Results are estimates based on the methods and standards named on each page and on the inputs you provide.",
      "The tools do not replace the judgement of a qualified engineer, the project's own specifications, the edition of a standard that applies to your project, local regulations, or manufacturers' data. Final designs, settings and safety decisions must be checked and approved by a suitably qualified person.",
    ],
  },
  {
    h: "No warranty",
    p: [
      "The site is provided \"as is\". Although the calculations are checked against the standards and by an automated test suite (see Verification & changes), no guarantee is given that any result is accurate, complete or suitable for a particular purpose. Standards are revised, and a tool may not reflect the latest edition or a national variation.",
    ],
  },
  {
    h: "Safety-related results",
    p: [
      "Arc-flash, earthing, protection settings, short-circuit ratings and similar results affect personal safety. Do not use them for energised work, equipment labelling or protection settings without an engineering study reviewed and approved under your organisation's procedures.",
    ],
  },
  {
    h: "Limitation of liability",
    p: [
      "To the extent permitted by law, the author is not liable for any loss, damage, injury or cost arising from the use of, or reliance on, the site or its results.",
    ],
  },
  {
    h: "Your data",
    p: [
      "Calculations run in your browser. Inputs are not sent to a server, except where you choose to send feedback or use a feature that says otherwise. Some tools save your projects in your browser's local storage on your own device.",
    ],
  },
  {
    h: "Content and changes",
    p: [
      "Text, tools and worked examples on this site are the author's work and may not be copied or republished without permission. Standards are referred to by number; their text remains the property of the publishing bodies. These terms may be updated; the date below shows the latest revision.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Terms of use &amp; engineering disclaimer</h1>
        <p className="mt-3 text-sm text-muted">Last updated {UPDATED}</p>
        {SECTIONS.map((s) => (
          <section key={s.h}>
            <h2 className="mt-10 text-xl font-semibold text-foreground">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="mt-3 text-muted">
                {t}
              </p>
            ))}
          </section>
        ))}
        <p className="mt-10 text-muted">
          See also{" "}
          <Link href="/verification" className="text-accent-2 hover:underline">
            Verification &amp; changes
          </Link>{" "}
          and{" "}
          <Link href="/about" className="text-accent-2 hover:underline">
            About
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
