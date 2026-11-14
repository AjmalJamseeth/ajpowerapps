import Link from "next/link";
import { categoryHref } from "@/lib/categories";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import { DOMAIN_LIST, groupsOf, suitesOf, liveCount } from "@/lib/domains";
import { GROUP_ICONS } from "@/components/groupIcons";
import { ChevronDown, GraduationCap, BookOpen, LayoutGrid, Search, AppWindow } from "lucide-react";
import { TOTAL_GUIDES } from "@/lib/guides";
import { TOTAL_EXAMPLES } from "@/lib/workedExamples";


export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur relative">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="AJapps home" className="flex items-center gap-2">
          <span aria-hidden="true" className="logo-mark flex h-8 w-8 items-center justify-center rounded-md bg-accent text-background font-bold" />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            AJ<span className="text-accent">apps</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 whitespace-nowrap text-sm text-muted md:flex lg:gap-8">
          {DOMAIN_LIST.map((d) => {
            const tone = d.id === "electrical" ? "text-accent" : "text-accent-2";
            return (
              <div key={d.id} className="group relative">
                <Link href={d.href} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <span className={`h-1.5 w-1.5 rounded-full ${d.id === "electrical" ? "bg-accent" : "bg-accent-2"}`} aria-hidden="true" />
                  {d.id === "electrical" ? "Electrical" : "SCADA & Automation"}
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-[620px] -translate-x-1/2 rounded-xl border border-border bg-surface p-4 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className={`mb-2 px-2 text-xs font-semibold uppercase tracking-wide ${tone}`}>{d.title}</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                    {groupsOf(d.id).map((g) => {
                      const Icon = GROUP_ICONS[g.icon];
                      return (
                        <Link key={g.id} href={categoryHref(g.id)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                          {Icon && <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />}
                          <span>{g.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                  {suitesOf(d.id).length > 0 && (
                    <div className="mt-2 border-t border-border pt-2">
                      <div className="px-2 pb-1 text-xs text-muted">Engineering suites</div>
                      <div className="grid grid-cols-2 gap-x-6">
                        {suitesOf(d.id).map((s) => (
                          <Link key={s.href} href={s.href} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                            <AppWindow className={`h-4 w-4 flex-none ${tone}`} aria-hidden="true" />
                            <span>{s.short}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 border-t border-border pt-2">
                    <Link href={d.href} className={`block rounded-md px-2 py-2 text-sm font-semibold ${tone} transition-colors hover:bg-surface-2`}>
                      {d.title}: all {liveCount(d.id)} tools →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="group relative">
            <Link
              href="/resources"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Resources
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-surface p-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <Link
                href="/suites"
                className="flex items-start gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <AppWindow className="mt-0.5 h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
                <span>
                  <span className="block font-medium text-foreground">Engineering Suites</span>
                  <span className="block text-xs text-muted">Electrical and SCADA applications</span>
                </span>
              </Link>
              <Link
                href="/samples"
                className="flex items-start gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <LayoutGrid className="mt-0.5 h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
                <span>
                  <span className="block font-medium text-foreground">Sample files</span>
                  <span className="block text-xs text-muted">Files to try every tool with</span>
                </span>
              </Link>
              <Link
                href="/guides"
                className="flex items-start gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <GraduationCap className="mt-0.5 h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
                <span>
                  <span className="block font-medium text-foreground">Guides</span>
                  <span className="block text-xs text-muted">{TOTAL_GUIDES} category primers</span>
                </span>
              </Link>
              <Link
                href="/examples"
                className="flex items-start gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <BookOpen className="mt-0.5 h-4 w-4 flex-none text-accent-2" aria-hidden="true" />
                <span>
                  <span className="block font-medium text-foreground">Worked Examples</span>
                  <span className="block text-xs text-muted">{TOTAL_EXAMPLES} step-by-step problems</span>
                </span>
              </Link>
              <div className="mt-1 border-t border-border pt-1">
                <Link
                  href="/resources"
                  className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-semibold text-accent-2 transition-colors hover:bg-surface-2"
                >
                  <LayoutGrid className="h-4 w-4 flex-none" aria-hidden="true" />
                  Browse all resources →
                </Link>
              </div>
            </div>
          </div>
          <Link href="/about" className="hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/calculators#search" aria-label="Search calculators" title="Search" className="text-muted transition-colors hover:text-accent-2">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
          <ThemeToggle />
          <FeedbackButton
            calculatorName="General / Site Feedback"
            buttonLabel="💬 Feedback"
            buttonClassName="hidden whitespace-nowrap text-sm text-muted hover:text-accent-2 transition-colors lg:inline"
          />
          <Link
            href="/calculators"
            className="hidden rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 xl:inline-block"
          >
            All tools
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
