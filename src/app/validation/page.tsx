import Link from "next/link";
import NavBar from "@/components/NavBar";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL, breadcrumbJsonLd, pageMeta } from "@/lib/seo";
import { runValidation, type ValidationRow } from "@/lib/validation";
import { BUILD_LABEL } from "@/lib/buildInfo";

export const metadata = pageMeta(
  "/validation",
  "Validation Register – Calculator Results vs Independent References",
  "Per-tool validation register for AJapps: inputs, independent reference (standard table, the standard's own worked example or hand calculation), expected and actual results, tolerance and pass/fail."
);

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(1) : Math.abs(v) >= 1 ? v.toFixed(3) : v.toFixed(4));

export default function ValidationPage() {
  const rows = runValidation();
  const passed = rows.filter((r) => r.pass).length;
  const areas = Array.from(new Set(rows.map((r) => r.area)));
  const byType = (t: ValidationRow["referenceType"]) => rows.filter((r) => r.referenceType === t).length;

  return (
    <div className="flex flex-1 flex-col">
      <JsonLd
        data={[
          { "@context": "https://schema.org", "@type": "WebPage", name: "Validation register", url: `${SITE_URL}/validation` },
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Verification & Changes", path: "/verification" },
            { name: "Validation register", path: "/validation" },
          ]),
        ]}
      />
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Validation register</h1>
        <p className="mt-4 max-w-3xl text-muted">
          Each line compares a calculator&apos;s result with a reference obtained independently of the site&apos;s code: a value printed
          in a standard&apos;s table, a worked example published in the standard itself, or a hand calculation from the standard&apos;s
          formula done separately. The acceptance tolerance is fixed before the test. The whole register is run automatically before
          every release, and the results below are produced by this build.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="block text-2xl font-semibold text-foreground">{passed} / {rows.length}</span>
            <span className="text-sm text-muted">cases within tolerance</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="block text-2xl font-semibold text-foreground">{byType("Standard table")}</span>
            <span className="text-sm text-muted">against printed table values</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="block text-2xl font-semibold text-foreground">{byType("Standard worked example")}</span>
            <span className="text-sm text-muted">against the standards&apos; own worked examples</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4">
            <span className="block text-2xl font-semibold text-foreground">{byType("Hand calculation from the standard's formula")}</span>
            <span className="text-sm text-muted">against independent hand calculations</span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="/validation/register.csv" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            Download the register (CSV)
          </a>
          <span className="text-xs text-muted">{BUILD_LABEL}. Prepared by Ajmal Jamseeth (AJapps). Not yet independently reviewed.</span>
        </div>

        {areas.map((area) => (
          <section key={area} className="mt-10">
            <h2 className="text-xl font-semibold text-foreground">{area}</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
              <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border text-foreground">
                    <th className="px-3 py-2 font-semibold">ID</th>
                    <th className="px-3 py-2 font-semibold">Tool / quantity</th>
                    <th className="px-3 py-2 font-semibold">Inputs</th>
                    <th className="px-3 py-2 font-semibold">Reference</th>
                    <th className="px-3 py-2 text-right font-semibold">Expected</th>
                    <th className="px-3 py-2 text-right font-semibold">Actual</th>
                    <th className="px-3 py-2 text-right font-semibold">Dev. / tol.</th>
                    <th className="px-3 py-2 font-semibold">Result</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {rows.filter((r) => r.area === area).map((r) => (
                    <tr key={r.id} className="border-b border-border/60 align-top">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">{r.id}</td>
                      <td className="px-3 py-2">
                        <Link href={r.href} className="text-accent-2 hover:underline">{r.tool}</Link>
                        <div className="text-foreground">{r.quantity}</div>
                        {r.note && <div className="mt-1 text-xs">{r.note}</div>}
                      </td>
                      <td className="px-3 py-2">{r.inputs}</td>
                      <td className="px-3 py-2">
                        {r.reference}
                        <div className="mt-1 text-xs italic">{r.referenceType}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">{r.expected} {r.unit}</td>
                      <td className="px-3 py-2 text-right font-mono text-foreground">{fmt(r.actual)} {r.unit}</td>
                      <td className="px-3 py-2 text-right font-mono">{r.deviationPct.toFixed(2)} % / ±{r.tolerancePct} %</td>
                      <td className={`px-3 py-2 font-semibold ${r.pass ? "text-pass" : "text-fail"}`}>{r.pass ? "PASS" : "FAIL"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <h2 className="mt-12 text-xl font-semibold text-foreground">How to read this register</h2>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-muted">
          <li>
            <span className="text-foreground">Standard table:</span> the calculator&apos;s value must equal the printed value exactly
            (tolerance 0 %). Only sample entries are listed here; during the November 2026 review every entry of Tables B.52.4 and B.52.5
            used by the cable calculator (methods A1, B1, B2, C and D1, copper and aluminium) was compared with the standard.
          </li>
          <li>
            <span className="text-foreground">Standard worked example:</span> the standard&apos;s own example is re-run with its inputs. Small
            differences come from rounding in the published example, explained in the note where they occur.
          </li>
          <li>
            <span className="text-foreground">Hand calculation:</span> the standard&apos;s formula evaluated separately from the site&apos;s
            code. This confirms the formula is implemented correctly; it does not test the data a user enters.
          </li>
          <li>
            Passing these cases does not certify a design. See{" "}
            <Link href="/verification" className="text-accent-2 hover:underline">Verification &amp; changes</Link> for what the tests do and
            do not prove, known issues and the correction log.
          </li>
        </ul>
      </div>
    </div>
  );
}
