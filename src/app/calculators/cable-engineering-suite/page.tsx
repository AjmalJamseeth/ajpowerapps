import NavBar from "@/components/NavBar";

const APP_SRC = "/cable-suite/index.html";

const FEATURES: [string, string][] = [
  ["Cable schedule sizing", "Size every circuit of a project in one table: current capacity, voltage drop (circuit and cumulative), short-circuit withstand, earth-fault loop impedance and motor starting, with the governing criterion for each cable."],
  ["Ratings and derating", "IEC 60364-5-52:2009 Annex B ratings for LV cables and IEC 60502-2:2014 Annex B ratings for MV cables, with ambient, ground, depth, soil resistivity and grouping factors."],
  ["Quick size", "One load, one route: the smallest cable that passes every check, and why the next size down fails."],
  ["Fault level and protection", "Source fault level with the IEC 60909 transformer correction, adiabatic short-circuit check, earth-fault loop impedance and disconnection checks."],
  ["IEC 60287 current rating", "Thermal-resistance method with mutual heating of single-core cables, duct banks with duct air space and wall, dielectric loss and cyclic loading guidance."],
  ["HV cable studies", "Sequence impedances, induced sheath voltage for single-point and cross bonding, and sheath losses."],
  ["Installation", "Pulling tension and sidewall pressure for one or three cables, bending radius and jam ratio, tray, duct and trench fill, drum schedule, glands and lugs."],
  ["Testing", "Insulation resistance with temperature correction and PI/DAR, conductor resistance to IEC 60228, and VLF/AC withstand test levels to IEC 60502-2 and IEEE 400.2."],
  ["Reports", "Printable reports for every module and an Excel export of the cable schedule."],
  ["Private", "Everything runs in your browser; nothing is uploaded. Save and reopen projects as a file."],
];

/** CableEng Suite — cable design and sizing workbench, embedded with its description. */
export default function CableEngineeringSuitePage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Cable Engineering Suite — Design &amp; Sizing</h1>
        <p className="mt-2 max-w-3xl text-muted">
          A complete cable engineering workbench for LV and MV projects: size a full cable schedule to IEC 60364-5-52 and IEC 60502-2,
          rate cables by IEC 60287, check fault level, earth-fault loop impedance and voltage drop, and plan pulling, fill, drums and
          site tests. A worked example project of ten circuits is included so you can try it straight away.
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
            Private: the suite runs in your browser and nothing is uploaded.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          src={APP_SRC}
          title="Cable Engineering Suite — design and sizing"
          className="block h-[calc(100vh-5rem)] min-h-[860px] w-full rounded-xl border border-border bg-[#0e1117]"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">What the Cable Engineering Suite does</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Tabulated ratings and correction factors are averages from the standards. Values outside the published tables are flagged
          in orange. Confirm cable data, thermal resistances and loss factors with the manufacturer before issuing a design.
        </p>
      </div>
    </div>
  );
}
