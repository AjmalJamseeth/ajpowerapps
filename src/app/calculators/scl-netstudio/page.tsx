import NavBar from "@/components/NavBar";

const APP_SRC = "/scl-netstudio/index.html";

const FEATURES: [string, string][] = [
  ["Project & devices", "List the IEDs, merging units, gateways, clocks and switches, with the networks each one is on (station bus, process bus, management, SCADA DMZ, engineering) — or import them from an SCD. Every other tool works from this inventory."],
  ["IP plan", "Subnet calculator and VLSM planner: split one address block between the station networks with growth allowance, then assign every device its address in a fixed order. Exported to Excel and written back into the SCD Communication section."],
  ["VLAN & multicast", "Allocate a unique MAC address, APPID, VLAN and priority to every GOOSE and sampled-value stream from one set of rules, check them against the IEC 61850-8-1 / 9-2 ranges, and derive the VLAN membership of every switch port, with a vendor-neutral switch configuration template."],
  ["Bandwidth", "Load of every device port and uplink from GOOSE, sampled values and MMS, in steady state and during a GOOSE avalanche, with or without multicast filtering."],
  ["Latency", "Transfer time t = ta + tb + tc of a GOOSE message through the switches, including frame transmission, switch latency, worst-case queuing behind a full-size frame and cable propagation, compared with the IEC 61850-5 transfer time class (TT6 = 3 ms for trips)."],
  ["Redundancy", "RSTP, MRP, PRP and HSR compared; HSR ring load, worst path and maximum ring size for a latency budget; PRP bill of quantities (duplicated switches, cables, RedBoxes)."],
  ["Time synchronisation", "PTP (IEC 61850-9-3), SNTP, IRIG-B or 1PPS error budget against the time performance class each function needs (T0–T5), and how long devices stay accurate if GPS is lost."],
  ["Firewall planner", "Security zones and conduits in the style of IEC 62443, the services allowed on each conduit, warnings for unencrypted protocols (IEC 62351) and rules that break the zone model, and a rule table for the firewall team."],
  ["Ports & cables", "Switch-port and cable schedule from the design: every device link and switch-to-switch link gets a switch port and a cable ID (doubled for PRP, ring links for HSR), with medium, cable type and length. Checks duplicate ports, switches without enough ports, devices without a switch, and cable lengths against the 100 m copper channel and the multimode reach; cable quantities and a port map per switch. The VLAN membership and switch configuration use the same port numbers, and unused ports are shut down in the template."],
  ["Asset register", "Register of every networked device and switch: panel, manufacturer, model, firmware, serial number and MAC address next to the IP addresses, switch ports and VLANs from the design. Finds duplicate serial numbers, MAC and IP addresses, multicast MACs entered as device MACs, and one model running several firmware versions. Export to Excel, complete it, and import it back as CSV."],
  ["Capture analyser", "Open a Wireshark capture taken on site and compare it with the plan: GOOSE stNum/sqNum and time allowed to live, sampled-value continuity and synchronisation, addressing and VLANs, unknown publishers and TCP retransmissions."],
];

/** SCL NetStudio — IEC 61850 substation network engineering, embedded with its description. */
export default function SclNetStudioPage() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCL NetStudio — IEC 61850 Substation Network Design</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Design and check the communication network of an IEC 61850 substation in one place: IP plan, VLANs and multicast addressing for
          GOOSE and sampled values, bandwidth, GOOSE transfer time, PRP/HSR redundancy, PTP time synchronisation, firewall zones, the
          switch-port and cable schedule, the network asset register and a capture analyser to verify the result on site. A sample 132/33 kV substation is loaded so you can try every tool straight away.
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
            Private: your project and files stay in your browser and are never uploaded.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe
          src={APP_SRC}
          title="SCL NetStudio — IEC 61850 substation network design"
          className="block h-[calc(100vh-5rem)] min-h-[860px] w-full rounded-xl border border-border bg-[#050a13]"
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">The nine tools in SCL NetStudio</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          SCL NetStudio designs the network around the IEDs. To view, validate and edit the SCL files themselves, use{" "}
          <a href="/calculators/iec-61850-scl-editor" className="text-accent-2 hover:underline">SCL Studio</a>; for a detailed conformance check
          of GOOSE and sampled values in a capture, with clause references, use the{" "}
          <a href="/calculators/goose-sv-analyzer" className="text-accent-2 hover:underline">GOOSE &amp; SV Capture Analyzer</a>.
        </p>
        <p className="mt-3 text-xs text-muted">
          Bandwidth, latency and time-error results are engineering estimates from the stated assumptions (frame sizes, switch latency,
          worst-case queuing, clock error per device). Confirm them with the switch and IED manufacturers&apos; data and test them on site.
          The firewall planner proposes rules for review by the security team; it is not a security assessment.
        </p>
      </div>
    </div>
  );
}
