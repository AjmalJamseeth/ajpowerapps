import NavBar from "@/components/NavBar";

const APP_SRC = "/dga/dga-analyzer.html";

const FEATURES: [string, string][] = [
  ["IEC 60599:2022 gas ratios", "C2H2/C2H4, CH4/H2 and C2H4/C2H6 ratios classify partial discharge (PD), discharges of low and high energy (D1, D2) and thermal faults (T1, T2, T3)."],
  ["Duval Triangles and Pentagons", "Duval Triangle 1 for mineral oil, Triangles 4 and 5 for low-temperature and high-temperature thermal faults, and Duval Pentagons 1 and 2."],
  ["IEEE C57.104-2019 status", "Gas levels and rates of change compared with the IEEE tables for the transformer's age and oxygen/nitrogen ratio, with a DGA status from 1 to 3."],
  ["Gas trends and history", "Every sample for each transformer and on-load tap changer, with trend charts and rates of increase."],
  ["Fleet dashboard", "All transformers ranked by condition, so the units that need attention first stand out."],
  ["Lab PDF import", "Read gas values from laboratory reports directly in the browser, check them, and add them to the fleet."],
  ["Reasoning and reports", "A step-by-step explanation of each diagnosis and a printable PDF report."],
  ["Private", "All data stays in your browser; nothing is uploaded. Back up and restore your fleet as a file."],
];

/** DGA Analyzer — dissolved gas analysis for oil-filled transformers, embedded with its description. */
export default function DgaAnalyzerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">DGA Analyzer — Transformer Oil Dissolved Gas Analysis</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Enter or import the dissolved gas results of a transformer oil sample and get the fault interpretation by IEC 60599 gas
          ratios, the Duval Triangles and Pentagons and IEEE C57.104-2019, with gas trends over time for every transformer in your
          fleet. A demonstration fleet of six transformers is loaded so you can try it straight away.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={APP_SRC}
            target="_blank"
            rel="noopener"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open full screen ↗
          </a>
          <span className="rounded-md border border-pass/40 bg-pass/10 px-3 py-1.5 text-xs text-foreground">
            Private: data is stored only in your browser and is never uploaded.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          src={APP_SRC}
          title="DGA Analyzer — transformer oil dissolved gas analysis"
          className="block h-[calc(100vh-5rem)] min-h-[820px] w-full rounded-xl border border-border bg-[#0e1117]"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">What the DGA Analyzer does</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          DGA interpretation supports, but does not replace, engineering judgement. Confirm an abnormal result with a repeat sample,
          consider the transformer&apos;s history, loading and design, and verify thresholds against the current editions of the
          standards before taking a unit out of service.
        </p>
      </div>
    </div>
  );
}
