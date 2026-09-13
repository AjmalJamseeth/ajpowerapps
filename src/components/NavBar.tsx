import Link from "next/link";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNav } from "@/components/MobileNav";
import { FREE_LAUNCH } from "@/lib/launchConfig";
import { CALCULATOR_GROUPS, TOTAL_LIVE_COUNT } from "@/lib/calculatorCatalog";
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
  ChevronDown,
  GraduationCap,
  BookOpen,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { TOTAL_GUIDES } from "@/lib/guides";
import { TOTAL_EXAMPLES } from "@/lib/workedExamples";

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

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur relative">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-background font-bold">
            A
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            AJ<span className="text-accent">apps</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted sm:flex">
          <div className="group relative">
            <Link
              href="/calculators"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Calculators
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-[560px] -translate-x-1/2 rounded-xl border border-border bg-surface p-4 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                {CALCULATOR_GROUPS.map((g) => {
                  const Icon = GROUP_ICONS[g.icon];
                  return (
                    <Link
                      key={g.id}
                      href={`/calculators#${g.id}`}
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                    >
                      {Icon && <Icon className="h-4 w-4 text-accent-2" aria-hidden="true" />}
                      <span>{g.title}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <Link
                  href="/calculators"
                  className="block rounded-md px-2 py-2 text-sm font-semibold text-accent-2 transition-colors hover:bg-surface-2"
                >
                  Browse all {TOTAL_LIVE_COUNT} calculators →
                </Link>
              </div>
            </div>
          </div>
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
          <a
            href="#pricing"
            className="hover:text-foreground transition-colors"
          >
            Pricing
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted sm:inline">
            {FREE_LAUNCH ? "Free for launch" : "Subscriptions coming soon"}
          </span>
          <ThemeToggle />
          <FeedbackButton
            calculatorName="General / Site Feedback"
            buttonLabel="💬 Feedback"
            buttonClassName="hidden text-sm text-muted hover:text-accent-2 transition-colors sm:inline"
          />
          <Link
            href="/calculators"
            className="hidden rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 sm:inline-block"
          >
            Browse calculators
          </Link>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
