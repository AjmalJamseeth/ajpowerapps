import Link from "next/link";
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
  type LucideIcon,
} from "lucide-react";
import { CALCULATOR_GROUPS, TOTAL_LIVE_COUNT } from "@/lib/calculatorCatalog";

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
};

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 15% 20%, rgba(251,191,36,0.15), transparent 40%), radial-gradient(600px circle at 85% 30%, rgba(34,211,238,0.15), transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            {TOTAL_LIVE_COUNT} standards-based calculators, one suite
          </span>
          <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Your one-stop shop for electrical engineering calculations.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            From protection relay coordination to solar PV sizing, AJapps
            covers protection, cable &amp; conductor sizing, earthing,
            power quality, backup power, instrumentation, renewables and
            facilities engineering — built on cited IEC, IEEE, NEC and
            NFPA references, hand-verified, free to use, no signup
            required.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
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
              { label: "Calculators", value: String(TOTAL_LIVE_COUNT) },
              { label: "Categories", value: String(CALCULATOR_GROUPS.length) },
              { label: "Automated checks", value: "352" },
              { label: "Account needed", value: "No" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-surface/60 p-3">
                <div className="text-xs text-muted">{s.label}</div>
                <div className="mt-1 text-lg font-semibold text-foreground">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About / purpose / standards / audience */}
      <section id="about" className="border-b border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-semibold text-foreground">About AJapps</h2>
          <p className="mt-4 max-w-3xl text-muted">
            Most online electrical calculators handle one job — a single voltage-drop
            formula, a single motor FLC lookup — in isolation, with no citation for
            where the numbers come from. AJapps takes the opposite approach: every
            module is built around a named clause or table in a recognized standard
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
                Protection &amp; relay engineers doing IDMT grading and CT/VT sizing;
                design and consulting engineers running cable, earthing, lighting,
                conduit/tray and load studies; EPC and site engineers sizing
                transformers, generators, UPS and motor protection; solar, BESS and EV
                infrastructure designers; and electrical engineering students who want
                to see the standard clause behind every formula, not just an answer.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                Why choose AJapps
              </h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
                <li>Every module cites the specific standard clause or table it implements, not just a standard&apos;s name.</li>
                <li>Rule-of-thumb figures (e.g. altitude/ambient derating rates without a full thermal model) are labeled as such, not dressed up as normative values.</li>
                <li>Core results are free with no signup — deeper analysis (full harmonic breakdowns, saturation studies, multi-site aggregation) is clearly marked where it sits behind a subscriber tier.</li>
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
                "IEC 60255", "IEEE C37.112", "IEEE C37.91", "IEEE 1584", "IEC 60364-5-52", "IEEE 80",
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
                href={`/calculators#${g.id}`}
                className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
              >
                <div className="flex items-center gap-2.5">
                  {Icon && <Icon className="h-5 w-5 text-accent-2" aria-hidden="true" />}
                  <h3 className="text-base font-semibold text-foreground">{g.title}</h3>
                </div>
                <p className="mt-2 flex-1 text-sm text-muted">{g.description}</p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted">{g.calculators.length} calculators</span>
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
              Every formula traces to a named standard clause or table — IEC,
              IEEE, NEC, NFPA or BS — documented on the calculator itself, not
              buried in a help file.
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
            <div className="text-accent text-2xl font-bold">No install required</div>
            <p className="mt-2 text-sm text-muted">
              Runs in the browser. Results, checks and pass/fail limits update
              instantly as you adjust inputs.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / subscriber teaser */}
      <section id="pricing" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-surface to-surface-2 p-8 sm:p-12">
          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Coming soon
          </span>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">
            Subscriber features
          </h2>
          <p className="mt-3 max-w-2xl text-muted">
            Every calculator on AJapps will stay free for single-relay,
            single-circuit results. Subscribers will unlock multi-device TCC
            overlays, exportable coordination reports, saved projects and more.
          </p>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted">
          © {new Date().getFullYear()} AJapps. For preliminary engineering
          use only — always verify results against project-specific standards.
        </div>
      </footer>
    </div>
  );
}
