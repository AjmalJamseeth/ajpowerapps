import NavBar from "@/components/NavBar";

const APP_SRC = "/61850-academy/index.html";

const FEATURES: [string, string][] = [
  ["Labs", "Ten guided labs from beginner to advanced. Each lab sets a goal, gives the steps, checks each step automatically as you do it, and ends with a short quiz that explains every answer."],
  ["Substation", "A live 132/33 kV substation: two 132 kV lines, a 60 MVA transformer and a 33 kV incomer, with breakers, disconnectors and earth switches. Apply faults, make a breaker stick and watch the protection respond."],
  ["SCADA HMI", "Operate breakers and disconnectors from a control-room view with select-before-operate, interlocking and the alarm list, as an operator does."],
  ["IEDs", "Open each IED (line distance P_L1 and P_L2, transformer differential P_T1, bay controller B_J01) and the station gateway: mode and behaviour, logical nodes, GOOSE publication and subscriptions with LGOS supervision, reports and settings."],
  ["Network", "The station bus as a drawing. Unplug a cable, change a VLAN or a switch port and see which messages stop and which subscribers raise an alarm."],
  ["Sniffer", "Every GOOSE and MMS message decoded field by field: stNum, sqNum, time allowed to live, test flag, confRev, VLAN and priority, and the MMS select, operate and report services."],
  ["Timeline", "The sequence of events of the last incident with the time of each fault, pickup, trip, GOOSE and breaker change, so you can measure fault clearance time."],
  ["Glossary", "The IEC 61850 terms used in the labs, explained in plain language."],
];

/** 61850 Academy — IEC 61850 training simulator, embedded with its description. */
export default function Academy61850Page() {
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 pb-4 pt-8">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">61850 Academy — IEC 61850 Training Simulator</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Learn IEC 61850 on a live virtual 132/33 kV substation. Operate breakers from SCADA, apply faults, watch distance, differential and
          breaker-failure protection trip over GOOSE, unplug a cable and see the subscriber raise an alarm — then slow the clock down and read
          every message frame by frame. Ten guided labs check your steps and end with a quiz.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={APP_SRC} target="_blank" rel="noopener" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90">
            Open full screen ↗
          </a>
          <span className="rounded-md border border-pass/40 bg-pass/10 px-3 py-1.5 text-xs text-foreground">
            A simulation: it runs only in your browser and never connects to a real device or network.
          </span>
        </div>
      </div>

      <div className="w-full px-3 pb-6">
        <iframe src={APP_SRC} title="61850 Academy — IEC 61850 training simulator" className="block h-[calc(100vh-5rem)] min-h-[860px] w-full rounded-xl border border-border bg-[#050a13]" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 pb-8">
        <h2 className="text-xl font-semibold text-foreground">What is inside 61850 Academy</h2>
        <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <li key={t} className="rounded-xl border border-border bg-surface p-4">
              <span className="font-semibold text-foreground">{t}.</span> <span className="text-muted">{d}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          After the labs, practise on real files: open an SCD in{" "}
          <a href="/calculators/iec-61850-scl-editor" className="text-accent-2 hover:underline">SCL Studio</a>, design the network in{" "}
          <a href="/calculators/scl-netstudio" className="text-accent-2 hover:underline">SCL NetStudio</a> and check a Wireshark capture with the{" "}
          <a href="/calculators/goose-sv-analyzer" className="text-accent-2 hover:underline">GOOSE &amp; SV Capture Analyzer</a>.
        </p>
        <p className="mt-3 text-xs text-muted">
          The simulator models the behaviour described in IEC 61850 in a simplified form for training. Timings, protection characteristics and
          device behaviour are representative, not those of a particular manufacturer; always follow the IED manual and the project
          documentation on a real system.
        </p>
      </div>
    </div>
  );
}
