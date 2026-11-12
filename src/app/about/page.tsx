import Link from "next/link";
import NavBar from "@/components/NavBar";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { TOTAL_LIVE_COUNT } from "@/lib/calculatorCatalog";
import { TOTAL_GUIDES } from "@/lib/guides";
import { TOTAL_EXAMPLES } from "@/lib/workedExamples";

export const metadata = pageMeta(
  "/about",
  "About – Ajmal Jamseeth, Electrical Engineer",
  "AJapps is built by Ajmal Jamseeth, an electrical engineer in the smelting industry, to give engineers reliable, standards-based tools for design and analysis."
);

// Add the LinkedIn profile URL here when available; it is then linked on the page and in the structured data.
const LINKEDIN_URL = "";

export default function AboutPage() {
  const person = {
    "@type": "Person",
    name: "Ajmal Jamseeth",
    jobTitle: "Electrical Engineer",
    ...(LINKEDIN_URL ? { sameAs: [LINKEDIN_URL] } : {}),
  };
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About AJapps",
            url: `${SITE_URL}/about`,
            mainEntity: { "@context": "https://schema.org", ...person },
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "AJapps",
            alternateName: ["AJ Power Apps", "ajpowerapps.com"],
            url: SITE_URL,
            founder: person,
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <NavBar />
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">About</h1>
        <p className="mt-6 text-lg text-foreground">
          I&apos;m Ajmal Jamseeth, an electrical engineer working in the smelting industry. I built AJapps to give engineers
          reliable, standards-based tools for everyday power-system, protection, substation automation and SCADA work, and as my
          contribution to the electrical engineering community.
        </p>
        <p className="mt-4 text-lg text-muted">
          The site is growing. Simulation tools and power analysis programs are coming in the next updates, so check back soon.
        </p>
        {LINKEDIN_URL && (
          <p className="mt-4">
            <a href={LINKEDIN_URL} target="_blank" rel="noopener me" className="text-accent-2 hover:underline">
              Ajmal Jamseeth on LinkedIn ↗
            </a>
          </p>
        )}

        <h2 className="mt-12 text-xl font-semibold text-foreground">Why every tool explains itself</h2>
        <p className="mt-3 text-muted">
          When I was a trainee, knowledge came from senior engineers — and often only when they needed a job done. Today information
          is everywhere, but much of it is unverified, and a number without its reasoning is easy to misuse. So every tool here
          comes with a tool guide: what the tool is, why you need it, what to understand first, what you need before you start,
          how to use it, what it gives you, how to read the result, the standard, formulas and assumptions behind it, and where it
          stops. Use the knowledge, not only the number — and if something does not add up, tell me through the feedback button.
        </p>

        <h2 className="mt-12 text-xl font-semibold text-foreground">How the tools are checked</h2>
        <p className="mt-3 text-muted">
          Each calculator follows a named standard — IEC, IEEE, NEC, NFPA or BS — and its formulas and table values are checked
          against that standard. An automated test suite re-checks the results against hand-calculated values every time the site
          is updated, and the worked examples show each calculation step by step. Where a figure is an engineering rule of thumb
          rather than a value from a standard, the tool says so.{" "}
          <Link href="/verification" className="text-accent-2 hover:underline">
            Read how results are checked and the change log
          </Link>
          .
        </p>
        <p className="mt-3 text-muted">
          The tools are intended for preliminary engineering. Always verify results against the project&apos;s own standards and
          have final designs reviewed by a qualified engineer.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Link href="/calculators" className="rounded-xl border border-border bg-surface p-4 hover:border-accent-2/60">
            <span className="block text-2xl font-semibold text-foreground">{TOTAL_LIVE_COUNT}</span>
            <span className="text-sm text-muted">calculators and tools</span>
          </Link>
          <Link href="/guides" className="rounded-xl border border-border bg-surface p-4 hover:border-accent-2/60">
            <span className="block text-2xl font-semibold text-foreground">{TOTAL_GUIDES}</span>
            <span className="text-sm text-muted">category guides</span>
          </Link>
          <Link href="/examples" className="rounded-xl border border-border bg-surface p-4 hover:border-accent-2/60">
            <span className="block text-2xl font-semibold text-foreground">{TOTAL_EXAMPLES}</span>
            <span className="text-sm text-muted">worked examples</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
