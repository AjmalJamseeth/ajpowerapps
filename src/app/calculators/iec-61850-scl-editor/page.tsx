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
  ["Open in NetStudio", "Send the file you are working on straight to SCL NetStudio to design its network: IP plan, GOOSE/SV addressing, bandwidth, ports and cables. Nothing is uploaded; the hand-over stays in your browser."],
  ["Engineering registers in Excel", "IED, communication, GOOSE and SV, report, data-set, logical-node and GOOSE-input registers and a full signal list, downloaded as one Excel workbook."],
  ["Change-impact report", "Compare two revisions and get what changed, what it affects and what to re-test, including data sets changed without a new confRev."],
  ["FAT / SAT test sheets", "Point-to-point test sheets generated per IED from the data sets, with the expected check for every signal, ready to print or fill in Excel."],
  ["SCADA tag-list checker", "Check a SCADA point list (CSV) against the SCD: wrong references or FC, duplicates, points not in any report, missing units or scaling, and unmapped signals."],
  ["GOOSE and SV capture analyzer", "Open a Wireshark pcap or pcapng file and compare every GOOSE and sampled-value stream with the SCD: missing or unexpected streams, wrong MAC, APPID, VLAN, confRev or data set."],
  ["Reference and quality explainer", "Explain any object reference part by part and decode IEC 61850 quality flags."],
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
          SCD or a CID for a single IED. It also produces engineering registers in Excel, change-impact reports, FAT/SAT test sheets, a SCADA tag-list check and a GOOSE capture analysis. A sample 132/33 kV substation is loaded so you can try it straight away.
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
        <h2 className="mt-8 text-xl font-semibold text-foreground">What &ldquo;0 errors&rdquo; does and does not mean</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-foreground">
                <th className="py-2 pr-4 font-semibold">Level</th>
                <th className="py-2 pr-4 font-semibold">Checked by SCL Studio?</th>
              </tr>
            </thead>
            <tbody className="text-muted">
              <tr className="border-b border-border/60"><td className="py-2 pr-4">1. The file is well-formed XML and reads as SCL</td><td className="py-2 pr-4 text-pass">Yes</td></tr>
              <tr className="border-b border-border/60"><td className="py-2 pr-4">2. Validation against the official IEC 61850-6 XML schema (XSD) for the edition</td><td className="py-2 pr-4">No — the schema files are not bundled. Run a schema validator or the system configuration tool.</td></tr>
              <tr className="border-b border-border/60"><td className="py-2 pr-4">3. Internal consistency: references resolve (ExtRef, data sets, data types, ClientLN), unique GOOSE/SV addresses, IP subnets, report and data-set settings</td><td className="py-2 pr-4 text-pass">Yes — this is what the validation panel reports</td></tr>
              <tr className="border-b border-border/60"><td className="py-2 pr-4">4. Acceptance by a particular manufacturer&apos;s IED and tool (device limits, private extensions)</td><td className="py-2 pr-4">No — import the file into the manufacturer&apos;s tool</td></tr>
              <tr><td className="py-2 pr-4">5. Real GOOSE, sampled-value and report exchange on the network</td><td className="py-2 pr-4">No — test on the system (FAT/SAT); the test sheets and GOOSE capture analyzer help prepare and check it</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          To check the GOOSE and sampled-value traffic itself in a Wireshark capture, with clause references for every finding, use the{" "}
          <a href="/calculators/goose-sv-analyzer" className="text-accent-2 hover:underline">GOOSE &amp; SV Capture Analyzer</a>.
        </p>
        <p className="mt-4 text-xs text-muted">
          SCL Studio is an engineering aid for reviewing and correcting configuration files. Always load the final file into the IED
          manufacturer&apos;s configuration tool, and test GOOSE and sampled-value exchanges on the real system before energisation.
        </p>
      </div>
    </div>
  );
}
