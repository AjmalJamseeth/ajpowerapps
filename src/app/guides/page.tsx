import Link from "next/link";
import NavBar from "@/components/NavBar";
import { CALCULATOR_GROUPS } from "@/lib/calculatorCatalog";
import { GUIDES, TOTAL_GUIDES } from "@/lib/guides";

export default function GuidesIndexPage() {
  const guidesWithGroup = GUIDES.map((guide) => ({
    guide,
    group: CALCULATOR_GROUPS.find((g) => g.id === guide.groupId),
  }));

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />

      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Guides</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Category primers covering the underlying engineering — core concepts, the standards
          landscape, and how each category&apos;s calculators fit together — {TOTAL_GUIDES} so far,
          growing toward one per category. For step-by-step numeric problems, see{" "}
          <Link href="/examples" className="text-accent-2 hover:underline">
            Worked Examples
          </Link>{" "}
          instead.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {guidesWithGroup.map(({ guide, group }) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group flex flex-col rounded-xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                  {group?.title ?? "Guide"}
                </span>
                <span className="text-[11px] text-muted">{guide.readTime}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground">{guide.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted">{guide.dek}</p>
              <span className="mt-4 text-xs font-semibold text-accent-2 group-hover:opacity-80">
                Read the guide →
              </span>
            </Link>
          ))}

          {CALCULATOR_GROUPS.filter((g) => !GUIDES.some((guide) => guide.groupId === g.id)).map((g) => (
            <div
              key={g.id}
              className="flex flex-col rounded-xl border border-dashed border-border bg-surface/40 p-6 text-muted"
            >
              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted w-fit">
                {g.title}
              </span>
              <h2 className="mt-3 text-lg font-semibold text-foreground/70">{g.title} guide</h2>
              <p className="mt-2 flex-1 text-sm">Coming soon.</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
