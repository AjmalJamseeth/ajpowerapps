import NavBar from "@/components/NavBar";

const APP_SRC = "/goose-sv-analyzer/index.html";

const FEATURES: [string, string][] = [
  ["Reads Wireshark captures", "Open or drag a .pcap or .pcapng file from the station bus or process bus. VLAN, HSR and PRP frames are handled."],
  ["GOOSE checks (IEC 61850-8-1 / 7-2)", "Addressing and APPID ranges, goosePdu structure, stNum and sqNum sequences, time allowed to live, retransmission after a change, data changed without a new stNum, confRev and data-set layout, simulation, ndsCom and quality flags."],
  ["Sampled values (IEC 61850-9-2 / 9-2LE)", "savPdu structure, lost, duplicated or out-of-order samples, smpCnt wrap, sample rate, smpSynch, channel quality, neutral against the sum of the phases."],
  ["Clause references", "Every finding names the clause of IEC 61850-7-2, -8-1, -9-2 or the other standard it is based on, with what was expected and observed, causes, actions and impact."],
  ["Compare with the SCD", "Add the SCD file to check APPID, MAC address, VLAN, confRev, data set, goID, number of entries, MaxTime and smpRate of every stream, and to list configured streams that were not received."],
  ["Report", "Printable report and CSV export of every finding, with frame numbers and times."],
];

/** GOOSE / SV capture analyzer — conformance checks on Wireshark captures, with clause references. */
export default function GooseSvAnalyzerPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">GOOSE &amp; Sampled Values Capture Analyzer (IEC 61850)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Check the GOOSE and sampled-value traffic in a Wireshark capture against IEC 61850-8-1 and 9-2: 86 checks, each with a verdict,
          an explanation and the clause of the standard it is based on. Add the SCD file to compare every stream with its configuration.
          Click <span className="text-foreground">Load demo</span> for a capture of one bay with deliberate faults.
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
            Private: capture and SCL files are read in your browser and never uploaded.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          src={APP_SRC}
          title="GOOSE and sampled values capture analyzer"
          className="block h-[calc(100vh-5rem)] min-h-[820px] w-full rounded-xl border border-border bg-[#050a14]"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">What the analyzer checks</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          The analyzer checks the frames in the capture file; it cannot listen to the network. A PC capture adds its own timing jitter, so
          use a hardware-timestamped capture for precise timing. Clause references are to IEC 61850-7-2:2010, -8-1:2011 and -9-2:2011
          (Edition 2) unless stated; confirm them against your copy of the standard before quoting them. Not a certification of the devices.
        </p>
      </div>
    </div>
  );
}
