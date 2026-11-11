import Link from "next/link";
import { BUILD_LABEL } from "@/lib/buildInfo";
import NavBar from "@/components/NavBar";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { TOTAL_EXAMPLES } from "@/lib/workedExamples";
import { AUTOMATED_CHECKS, CHANGE_LOG, KNOWN_ISSUES } from "@/lib/siteFacts";

export const metadata = pageMeta(
  "/verification",
  "Verification & Changes – How AJapps Calculators Are Checked",
  "How AJapps calculators are checked against IEC, IEEE, NEC and NFPA standards, the automated test suite, known limitations, and a dated log of corrections."
);

const LIMITATIONS = [
  "The tools are for preliminary design and checking. Final designs should follow the project's own standards and be reviewed by a qualified engineer.",
  "IEC 60364-5-52 tabulates methods A1, B1, B2, C and D1 only up to 300 mm². Larger sizes are shown as unavailable for those methods rather than extrapolated.",
  "The resistance and reactance per metre used for voltage drop are typical published values. IEC 60364-5-52 does not tabulate them, so manufacturer data should be used where it differs.",
  "Arc-flash results follow IEEE 1584-2018 within its stated range (208 V to 15 kV, with its limits on gap and fault current).",
  "Cable pulling assumes identical round cables and a uniform friction coefficient along the route. Maximum tension and sidewall pressure limits should come from the cable manufacturer.",
  "Where a figure is an engineering rule of thumb rather than a value from a standard, the calculator says so on the page.",
];

export default function VerificationPage() {
  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Verification & Changes",
            url: `${SITE_URL}/verification`,
            about: "How AJapps electrical engineering calculators are checked, and a log of corrections",
          },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Verification & Changes", path: "/verification" },
          ]),
        ]}
      />
      <NavBar />
      <div className="mx-auto w-full max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Verification &amp; changes</h1>
        <p className="mt-6 text-lg text-muted">
          How the calculators are checked, what they do not cover, and every correction that changed a published result.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="block text-2xl font-semibold text-foreground">{AUTOMATED_CHECKS}</span>
            <span className="text-sm text-muted">automated checks, run on every update</span>
          </div>
          <Link href="/examples" className="rounded-xl border border-border bg-surface p-4 hover:border-accent-2/60">
            <span className="block text-2xl font-semibold text-foreground">{TOTAL_EXAMPLES}</span>
            <span className="text-sm text-muted">worked examples with every step shown</span>
          </Link>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="block text-2xl font-semibold text-foreground">{CHANGE_LOG.length}</span>
            <span className="text-sm text-muted">dated review rounds logged below</span>
          </div>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-foreground">How results are checked</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-6 text-muted">
          <li>
            <span className="text-foreground">Formulas and tables from the standard.</span> Each calculator names the standard it
            follows. Table values, such as IEC 60364-5-52 current ratings or NEC 310.16 ampacities, are entered from the
            standard and checked against it.
          </li>
          <li>
            <span className="text-foreground">Hand calculations.</span> For each calculator, at least one case is worked by hand
            and compared with the tool&apos;s result. Many of these are published as worked examples.
          </li>
          <li>
            <span className="text-foreground">Automated regression tests.</span> {AUTOMATED_CHECKS} checks compare calculator
            results with the hand-calculated and tabulated values. Worked-example results are included, so a change that alters a
            published number makes a test fail. The suite runs before every update is published.
          </li>
          <li>
            <span className="text-foreground">Periodic review.</span> The calculators and their wording are re-reviewed
            periodically. Confirmed errors are corrected, a test is added for each, and the change is logged below.
          </li>
        </ol>

        <h2 className="mt-12 text-xl font-semibold text-foreground">What the tests do and do not prove</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          <li>
            A regression test stops a result from changing unnoticed. On its own it does not prove the original result was right —
            that comes from the reference it is compared with.
          </li>
          <li>
            The references are independent of the code wherever possible: printed table values (IEC 60364-5-52, IEC 60502-2,
            NEC 310.16), worked cases published in the standards themselves (for example the IEEE 1584-2018 Annex D arc-flash
            cases), and hand calculations shown step by step in the worked examples.
          </li>
          <li>
            The full applications (Engineering Suites) carry their own checks: for example the Cable Engineering Suite compares 198
            results of its ten-circuit example project with an independently prepared workbook.
          </li>
          <li>
            The tests have not been witnessed by a third party, and the site has not yet had an independent technical review. Use
            the results for preliminary design and independent checking; final designs, protection settings and earthing safety
            need project-specific verification.
          </li>
          <li>Every page and PDF report shows the build it came from ({BUILD_LABEL} for this page), so a result can be traced to a release.</li>
        </ul>

        <div className="mt-6 rounded-xl border border-accent-2/40 bg-surface p-5">
          <h3 className="font-semibold text-foreground">Validation register</h3>
          <p className="mt-1 text-sm text-muted">
            Per-case evidence for the cable, protection, earthing, arc-flash, short-circuit and transformer calculators and the Cable Engineering Suite: inputs, the independent reference
            (standard table, the standard&apos;s own worked example or hand calculation), expected and actual values, tolerance and result.{" "}
            <Link href="/validation" className="text-accent-2 hover:underline">Open the validation register</Link> or{" "}
            <a href="/validation/register.csv" className="text-accent-2 hover:underline">download it as CSV</a>.
          </p>
        </div>

        <h2 className="mt-12 text-xl font-semibold text-foreground">Known issues and open items</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          {KNOWN_ISSUES.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>

        <h2 className="mt-12 text-xl font-semibold text-foreground">Known limitations</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          {LIMITATIONS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>

        <h2 className="mt-12 text-xl font-semibold text-foreground">Change log</h2>
        <p className="mt-3 text-muted">Corrections and additions that changed a calculated result or published content, newest first.</p>
        <div className="mt-6 space-y-8">
          {CHANGE_LOG.map((entry) => (
            <section key={entry.title} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-accent-2">{entry.date}</p>
              <h3 className="mt-1 text-lg font-semibold text-foreground">{entry.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                {entry.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <h2 className="mt-12 text-xl font-semibold text-foreground">Found an error?</h2>
        <p className="mt-3 text-muted">
          Please use the Feedback button at the top of any page and say which calculator, the inputs used and the result you
          expected. Confirmed errors are corrected and recorded here.
        </p>
        <p className="mt-6">
          <Link href="/about" className="text-accent-2 hover:underline">
            About the author →
          </Link>
          <span className="mx-3 text-muted">·</span>
          <Link href="/terms" className="text-accent-2 hover:underline">
            Terms of use &amp; disclaimer →
          </Link>
        </p>
      </div>
    </div>
  );
}
