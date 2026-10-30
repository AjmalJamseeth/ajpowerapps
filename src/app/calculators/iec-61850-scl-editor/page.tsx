import NavBar from "@/components/NavBar";

const STUDIO_SRC = "/iec-61850/scl-studio.html";

const FEATURES: [string, string][] = [
  ["Open any SCL file", "SCD, ICD, CID, IID, SSD and SED files from Edition 1, 2 and 2.1, including large substation files."],
  ["See the whole system", "Substation structure (voltage levels, bays, equipment), IED inventory, logical devices and logical nodes, data types."],
  ["Follow the data flow", "GOOSE and sampled-value publishers and subscribers, data sets, report control blocks and ExtRef inputs."],
  ["Check the addressing", "Subnetworks, access points, IP, MAC and APPID values, with automatic assignment of unique GOOSE/SV addresses."],
  ["Validate", "Consistency checks with errors and warnings, such as unresolved references, duplicate APPID or IP addresses, and gateways outside the subnet."],
  ["Edit safely", "Schema-guided forms that insert elements in the correct order, a full element explorer and the XML source, with undo and redo."],
  ["Compare two files", "See what changed between two versions of an SCD or CID."],
  ["Export", "Save the edited file, or export a CID for one IED."],
];

/** IEC 61850 SCL Studio — the browser-based SCD/ICD/CID viewer and editor, embedded with its description. */
export default function SclEditorPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">IEC 61850 SCL Editor — View and Edit SCD, ICD and CID Files</h1>
        <p className="mt-2 max-w-3xl text-muted">
          SCL Studio opens IEC 61850 substation configuration files in your browser. Explore the substation, IEDs, logical nodes,
          GOOSE, sampled values and reports; validate the file; edit it with guided forms or the XML source; and export a corrected
          SCD or a CID for a single IED. A sample 132/33 kV substation is loaded so you can try it straight away.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={STUDIO_SRC}
            target="_blank"
            rel="noopener"
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
          >
            Open full screen ↗
          </a>
          <span className="rounded-md border border-pass/40 bg-pass/10 px-3 py-1.5 text-xs text-foreground">
            Private: files are read and edited only in your browser and are never uploaded.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          src={STUDIO_SRC}
          title="SCL Studio — IEC 61850 SCD, ICD and CID viewer and editor"
          className="block h-[calc(100vh-5rem)] min-h-[820px] w-full rounded-xl border border-border bg-[#050a13]"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">What you can do with SCL Studio</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          SCL Studio is an engineering aid for reviewing and correcting configuration files. Always load the final file into the IED
          manufacturer&apos;s configuration tool, and test GOOSE and sampled-value exchanges on the real system before energisation.
        </p>
      </div>
    </div>
  );
}
