import Link from "next/link";
import NavBar from "@/components/NavBar";
import { pageMeta } from "@/lib/seo";
import { SAMPLE_FILES } from "@/lib/samples";

export const metadata = pageMeta(
  "/samples",
  "Sample IEC 61850 SCD, GOOSE Capture & Register Files",
  "Download sample IEC 61850 files to practise with: an SCD of a 132/33 kV substation, a GOOSE and sampled-value capture with deliberate faults, a network design project, and an IP register with seeded errors."
);

export default function SamplesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="kicker">Practise on real files</div>
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Sample files</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Files to download and open in the IEC 61850 and SCADA tools. They are built from the tools&apos; own demonstration data, so you can
          compare what you see with the guides and worked examples — including the faults that were put in on purpose. They contain no real
          project or customer data.
        </p>
        <div className="mt-8 space-y-5">
          {SAMPLE_FILES.map((f) => (
            <section key={f.file} className="rounded-xl border border-border bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{f.title}</h2>
                  <p className="mt-0.5 text-xs text-muted">{f.format} · <span className="font-mono">{f.file}</span></p>
                </div>
                <a href={`/samples/${f.file}`} download className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
                  Download
                </a>
              </div>
              <p className="mt-3 text-sm text-muted">{f.what}</p>
              <h3 className="mt-4 text-sm font-semibold text-foreground">What you should see</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted">{f.expect.map((e) => <li key={e}>{e}</li>)}</ul>
              <p className="mt-4 text-sm">
                <span className="text-muted">Open in: </span>
                {f.openIn.map((o, i) => (
                  <span key={o.href + o.name}>
                    {i > 0 && " · "}
                    <Link href={o.href} className="text-accent-2 hover:underline">{o.name}</Link>
                  </span>
                ))}
              </p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
