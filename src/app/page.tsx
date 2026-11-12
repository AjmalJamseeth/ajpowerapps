import Link from "next/link";
import { AUTOMATED_CHECKS } from "@/lib/siteFacts";
import SiteSearch from "@/components/SiteSearch";
import { buildSearchIndex } from "@/lib/searchIndex";
import { categoryHref } from "@/lib/categories";
import NavBar from "@/components/NavBar";
import {
  ShieldCheck,
  Cable,
  Zap,
  Waypoints,
  Activity,
  CircleGauge,
  BatteryCharging,
  Gauge,
  Sun,
  Building2,
  CircuitBoard,
  Network,
  type LucideIcon,
} from "lucide-react";
import { CALCULATOR_GROUPS, TOTAL_LIVE_COUNT } from "@/lib/calculatorCatalog";
import { SITE_URL, pageMeta } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { SUITES } from "@/lib/suites";
import { BUILD_LABEL } from "@/lib/buildInfo";
import { PowerNetMotif } from "@/components/PowerNetMotif";
import { TraceDivider } from "@/components/TraceDivider";

export const metadata = { ...pageMeta("/", "AJ Power Apps – Electrical & SCADA Engineering Calculators", "Electrical power, protection and SCADA engineering tools: IDMT relay coordination, arc flash, short circuit, cable sizing, earthing, IEC 61850 SCL and GOOSE tools, substation networks and more — every method explained. No signup."), title: { absolute: "AJ Power Apps – Electrical & SCADA Engineering Calculators" } };

const GROUP_ICONS: Record<string, LucideIcon> = {
  ShieldCheck,
  Cable,
  Zap,
  Waypoints,
  Activity,
  CircleGauge,
  BatteryCharging,
  Gauge,
  Sun,
  Building2,
  CircuitBoard,
  Network,
};

const POPULAR: [string, string][] = [
  ["/calculators/idmt", "IDMT relay coordination calculator"],
  ["/calculators/protection-suite", "Protection coordination suite (TCC curves)"],
  ["/calculators/iec-61850-scl-editor", "IEC 61850 SCL editor (SCD, ICD, CID)"],
  ["/calculators/arc-flash", "Arc flash calculator (IEEE 1584)"],
  ["/calculators/iec-60909", "IEC 60909 short-circuit calculator"],
  ["/calculators/cable-sizing", "Cable sizing & voltage drop calculator"],
  ["/calculators/max-demand", "Maximum demand calculator"],
  ["/calculators/earthing", "Earthing grid design calculator (IEEE 80)"],
  ["/calculators/power-factor-correction", "Power factor correction calculator"],
  ["/calculators/cable-tray-fill", "Cable tray fill calculator (NEC 392)"],
  ["/calculators/conduit-fill", "Conduit fill calculator (NEC Chapter 9)"],
  ["/calculators/motor-torque", "Motor torque calculator"],
  ["/calculators/vfd-sizing", "VFD sizing calculator"],
  ["/calculators/rolling-sphere", "Rolling sphere method calculator"],
  ["/calculators/transformer-sizer", "Transformer sizing calculator"],
  ["/calculators/ct-sizing", "CT sizing & saturation calculator"],
];

const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AJapps",
    alternateName: ["AJ Power Apps", "ajpowerapps.com"],
    url: SITE_URL,
    description: "Electrical power, protection and SCADA engineering calculators and applications, with every method explained.",
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/calculators?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AJapps",
    alternateName: ["AJ Power Apps", "ajpowerapps.com"],
    url: SITE_URL,
    founder: { "@type": "Person", name: "Ajmal Jamseeth", jobTitle: "Electrical Engineer", url: `${SITE_URL}/about` },
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd data={HOME_JSON_LD} />
      <NavBar />

      {/* Hero */}
      <section className="hero-band relative overflow-hidden border-b border-border">
        <div className="hero-grid pointer-events-none absolute inset-0" />
        <div className="hero-orb -left-24 top-0 h-80 w-80 bg-accent-2/25" />
        <div className="hero-orb -right-16 top-24 h-72 w-72 bg-accent/20" style={{ animationDelay: "-6s" }} />
        <svg
          className="hero-wave pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-60"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 60 Q150 0 300 60 T600 60 T900 60 T1200 60" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          <path d="M0 70 Q150 10 300 70 T600 70 T900 70 T1200 70" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.6" />
        </svg>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div>
          <span className="inline-flex items-center rounded-full border border-accent-2/40 bg-accent-2/10 px-3 py-1 text-xs font-medium tracking-wide text-accent-2 shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)]">
            {TOTAL_LIVE_COUNT} tools · power · protection · IEC 61850 · SCADA
          </span>
          <h1 className="hero-title mt-6 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Electrical power and SCADA engineering — calculated, and explained.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            AJapps (AJ Power Apps) brings power-system design, protection, substation automation and SCADA networking together:
            calculators and full engineering suites for protection coordination, cables, earthing, short circuit and arc flash,
            IEC 61850 SCL, GOOSE and network design, and the IT and network checks SCADA engineers meet on site.
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted">
            Every tool states what it does, what it needs from you, the standard, formula and assumptions behind each result, and
            where it stops — so you understand the answer instead of trusting it blindly.
          </p>
          <div className="mt-8">
            <SiteSearch items={buildSearchIndex()} />
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/calculators"
              className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Browse all calculators
            </Link>
            <a
              href="#about"
              className="rounded-md border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent-2/60 hover:text-accent-2"
            >
              What is AJapps? ↓
            </a>
          </div>

          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Tools", value: String(TOTAL_LIVE_COUNT) },
              { label: "Categories", value: String(CALCULATOR_GROUPS.length) },
              { label: "Automated checks", value: String(AUTOMATED_CHECKS) },
              { label: "Account needed", value: "No" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface/60 p-3">
                <div className="text-xs text-muted">{s.label}</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
          </div>
          <div className="hidden md:block md:max-w-md lg:max-w-none">
            <PowerNetMotif />
          </div>
        </div>
      </section>

      {/* Engineering suites */}
      <section className="band-white border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="kicker">Full applications</div>
              <h2 className="mt-1 text-2xl font-semibold text-foreground">Engineering Suites</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted">Full applications for whole studies, running in your browser with nothing uploaded.</p>
            </div>
            <Link href="/suites" className="text-sm font-semibold text-accent-2 hover:underline">
              All engineering suites →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SUITES.map((s) => (
              <Link key={s.href} href={s.href} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent-2/60">
                <div className="font-semibold text-foreground">{s.name}</div>
                <p className="mt-2 text-sm text-muted">{s.tagline}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-accent-2">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <TraceDivider />

      {/* About / purpose / standards / audience */}
      <section id="about" className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold text-foreground">About AJapps</h2>
          <p className="mt-4 max-w-3xl text-muted">
            Most online electrical calculators handle one job — a single voltage-drop
            formula, a single motor FLC lookup — in isolation, with no citation for
            where the numbers come from. AJapps takes the opposite approach: every
            module is built around a recognized standard
            (IEC, IEEE, NEC, NFPA, BS, or a manufacturer/industry loading guide where
            no single standard applies), every result that depends on a rule-of-thumb
            correction factor says so explicitly instead of presenting it with false
            precision, and every calculator ships with an &ldquo;About this tool&rdquo;
            panel plus hover tooltips on every input so you can see exactly what a
            field means and which clause drives it before you commit numbers to a
            design.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Who it&apos;s for
              </h3>
              <p className="mt-2 text-sm text-muted">
                Protection and relay engineers grading IDMT curves and sizing CTs and VTs; substation automation and SCADA
                engineers working with IEC 61850 SCL files, GOOSE, sampled values, gateways and station networks;
                commissioning engineers who need to find a communication fault on site without waiting for support;
                design and consulting engineers running cable, earthing, short-circuit, arc-flash and load studies; and
                students and trainees who want to see the standard and the reasoning behind every result.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Why choose AJapps
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
                <li>Each module names the standard it follows, and the clause or table wherever one applies.</li>
                <li>Tool guides explain what each tool does, what it needs, how it calculates and where it stops — the knowledge, not only the number.</li>
                <li>Rule-of-thumb figures (e.g. altitude/ambient derating rates without a full thermal model) are labeled as such, not dressed up as normative values.</li>
                <li>Core results need no signup — deeper analysis (full harmonic breakdowns, saturation studies, multi-site aggregation) is clearly marked as advanced.</li>
                <li>Hover tooltips and a worked example on every calculator, so the tool teaches the standard as you use it.</li>
                <li>Runs entirely in the browser — no installation, no plugin, results update live as inputs change.</li>
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Standards this suite is built on
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "IEC 60255", "IEEE C37.112", "IEC 61850-6", "IEEE C37.91", "IEEE 1584", "IEC 60364-5-52", "IEEE 80",
                "BS 7430", "IEC 60831", "IEC 61869-2/3", "IEEE 43", "IEEE 485", "IEEE 1188",
                "IEC 60287", "IEEE 1547", "IEC 62933", "IEEE 519-2014", "IEC 62305-1/2",
                "NEC Ch. 9", "NEC §392.22", "IEEE 1185", "EN 12464-1", "EN 1838",
                "NEC Art. 440", "NFPA 110", "NFPA 77", "NEC Art. 430", "NEC 210.19/215.2/240.4",
                "IEC 60364-4-43", "IEC 60947-4-1", "IEC 60034-1", "IEC 60076 series",
                "IEC 62548", "IEC 60364-7-712", "IEC 61851-1", "IEC 60364-7-722", "IEC 62955",
                "IEC 60364-4-41", "IEC 60079-32-1", "NEMA MG1 / ANSI C84.1", "ISO/IEC 30134-2",
              ].map((s) => (
                <span key={s} className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground">
                  {s}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted/80">
              Full per-standard citations, edition notes and worked-example
              verification figures are documented on each calculator&apos;s own
              &ldquo;About this tool&rdquo; panel.
            </p>
          </div>
        </div>
      </section>

      {/* Popular calculators — direct links help visitors and search engines reach the main tools */}
      <section className="mx-auto w-full max-w-6xl px-6 pt-20">
        <h2 className="text-2xl font-semibold text-foreground">Popular calculators</h2>
        <ul className="mt-6 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className="text-accent-2 hover:underline">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Browse by category */}
      <section id="calculators" className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-semibold text-foreground">Browse by category</h2>
        <p className="mt-2 max-w-2xl text-muted">
          {TOTAL_LIVE_COUNT} live calculators across {CALCULATOR_GROUPS.length}{" "}
          categories — protection, cabling, earthing, transformers, power
          quality, motors, backup power, instrumentation, renewables and
          facilities. Each category page lists every calculator with a full
          &ldquo;About this tool&rdquo; panel.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CALCULATOR_GROUPS.map((g) => {
            const Icon = GROUP_ICONS[g.icon];
            return (
              <Link
                key={g.id}
                href={categoryHref(g.id)}
                className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="h-5 w-5 text-accent-2" aria-hidden="true" />}
                  <h3 className="text-base font-semibold text-foreground">{g.title}</h3>
                </div>
                <p className="mt-2 flex-1 text-sm text-muted">{g.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted">{g.calculators.length} {g.calculators.length === 1 ? "tool" : "calculators"}</span>
                  <span className="font-semibold text-accent-2 group-hover:opacity-80">View category →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Value props */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 sm:grid-cols-3">
          <div>
            <div className="text-accent text-2xl font-bold">Cited, not guessed</div>
            <p className="mt-2 text-sm text-muted">
              Formulas trace to a named standard — IEC, IEEE, NEC, NFPA or BS,
              with the clause or table where one applies — documented on the
              calculator itself, not buried in a help file.
            </p>
          </div>
          <div>
            <div className="text-accent text-2xl font-bold">Honest about precision</div>
            <p className="mt-2 text-sm text-muted">
              Where a figure is an engineering rule-of-thumb rather than a
              literal standard value (e.g. a derating rate), the tool says so
              instead of overstating accuracy.
            </p>
          </div>
          <div>
            <div className="text-accent text-2xl font-bold">Knowledge, shared openly</div>
            <p className="mt-2 text-sm text-muted">
              No need to wait for a senior engineer to explain it: each tool guide sets out the method, formulas,
              assumptions and limits, so you can check the answer and defend it.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted">
          © {new Date().getFullYear()} AJapps (AJ Power Apps, ajpowerapps.com) — built by{" "}
          <Link href="/about" className="text-accent-2 hover:underline">
            Ajmal Jamseeth
          </Link>
          . For preliminary engineering use only — always verify results against project-specific standards.{" "}
          <Link href="/verification" className="text-accent-2 hover:underline">
            How results are checked
          </Link>
          {" · "}
          <Link href="/terms" className="text-accent-2 hover:underline">
            Terms &amp; disclaimer
          </Link>
          {" · "}
          <span title="Release that produced this page">{BUILD_LABEL}</span>
        </div>
      </footer>
    </div>
  );
}
