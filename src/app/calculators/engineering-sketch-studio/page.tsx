import NavBar from "@/components/NavBar";

const APP_SRC = "/sketch-studio/index.html";

const FEATURES: [string, string][] = [
  ["620 symbols", "Electrical (IEC 60617 / IEEE 315 style, ANSI protection functions), instrumentation, mechanical, civil, IT & networking, control logic, flowchart and annotation symbols."],
  ["Smart wiring", "Wires snap to symbol terminals on a 2.5 mm grid, with wire numbers, terminal numbering, auto-tagging and tag checks."],
  ["Multi-sheet drawings", "Several sheets per project with title blocks, revision fields, grouping, alignment and a tidy-up command."],
  ["Wizards and templates", "Transformer feeder, switchboard and flowchart wizards, panel layouts, macros and your own templates and symbol library."],
  ["Reports", "Bill of materials, instrument index, terminal schedules, loop sheets, cable and LAN schedules, protection functions and an ANSI ↔ IEC cross-reference."],
  ["Mark-up", "Insert a picture or PDF page and mark up scanned drawings with coloured pens."],
  ["Export", "SVG, DXF for CAD, PNG at up to 600 DPI, vector PDF, CSV lists for Excel and a ZIP of all sheets."],
  ["Private", "Everything runs in your browser; nothing is uploaded. Save and reopen projects as a file."],
];

/** Engineering Sketch Studio — browser drawing tool for single-line, schematic and process sketches. */
export default function EngineeringSketchStudioPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Engineering Sketch Studio — Single-Line &amp; Schematic Drawings</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Draw single-line diagrams, schematics, loop sheets, P&amp;ID-style sketches, network diagrams and flowcharts in the browser, with
          620 engineering symbols, wiring that snaps to terminals, title blocks and schedules generated from the drawing. Click
          <span className="text-foreground"> Load demo</span> to see a transformer feeder drawn in the app.
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
            Private: drawings stay in your browser and are never uploaded.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          src={APP_SRC}
          title="Engineering Sketch Studio — single-line and schematic drawings"
          className="block h-[calc(100vh-5rem)] min-h-[860px] w-full rounded-xl border border-border bg-[#050a14]"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">What Engineering Sketch Studio does</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Symbols are original artwork in the style of IEC 60617 and IEEE 315. Drawings made here are sketches and engineering
          drafts; check them against your project&apos;s drawing standards before issue.
        </p>
      </div>
    </div>
  );
}
