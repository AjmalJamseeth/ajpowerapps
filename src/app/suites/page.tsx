import Link from "next/link";
import NavBar from "@/components/NavBar";
import { DOMAIN_LIST, suitesOf } from "@/lib/domains";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(
  "/suites",
  "Electrical & SCADA Engineering Software Online – Engineering Suites",
  "Full electrical and SCADA engineering applications in the browser: protection coordination, cable engineering, IEC 61850 SCL Studio, SCL NetStudio network design, 61850 Academy training, transformer DGA and engineering drawings."
);

export default function SuitesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="kicker">Power · protection · automation</div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Engineering Suites</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Complete engineering applications for whole studies, not single calculations. Each one opens in your browser, with nothing
          to install and nothing uploaded: your projects and files stay on your computer.
        </p>

        {DOMAIN_LIST.map((d) => (
          <div key={d.id} className="mt-10">
            <h2 className={`text-sm font-semibold uppercase tracking-wide ${d.id === "electrical" ? "text-accent" : "text-accent-2"}`}><Link href={d.href} className="hover:underline">{d.title}</Link></h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {suitesOf(d.id).map((s) => (
            <section key={s.href} className="flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent-2/60">
              <h2 className="text-xl font-semibold text-foreground">{s.name}</h2>
              <p className="mt-1 text-sm text-muted">{s.tagline}</p>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-foreground">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted">
                <span className="font-semibold text-foreground">Standards:</span> {s.standards}
              </p>
              <div className="mt-5 flex-1" />
              <Link
                href={s.href}
                className="self-start rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
              >
                Open {s.name} →
              </Link>
            </section>
          ))}
        </div>

          </div>
        ))}

        <p className="mt-8 text-sm text-muted">
          Looking for a single calculation instead? <Link href="/calculators" className="text-accent-2 hover:underline">Browse all calculators</Link>.
        </p>
      </div>
    </div>
  );
}
