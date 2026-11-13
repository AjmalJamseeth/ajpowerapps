"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, NumberField } from "@/components/fields";
import { parsePerfCsv, analysePerf, sampleCsv, TYPEPERF_COUNTERS } from "@/lib/perflog";

const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const f = (x: number) => (Math.abs(x) >= 100 ? x.toFixed(0) : x.toFixed(2));

export default function PerformanceLogAnalyserPage() {
  const [text, setText] = useState<string>(() => sampleCsv());
  const [name, setName] = useState("sample: SCADA-SRV01, antivirus scan during operation");
  const [cores, setCores] = useState(4);
  const [ram, setRam] = useState(16);
  const log = useMemo(() => parsePerfCsv(text), [text]);
  const r = useMemo(() => (log ? analysePerf(log, { cores, ramGB: ram }) : null), [log, cores, ram]);
  const cmd = `typeperf -cf counters.txt -si 15 -sc 960 -f CSV -o C:\\PerfLogs\\scada_perf.csv`;
  const onFile = (file?: File) => { if (!file) return; const rd = new FileReader(); rd.onload = () => { setText(String(rd.result || "")); setName(file.name); }; rd.readAsText(file); };
  const counterFile = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([TYPEPERF_COUNTERS.join("\r\n")], { type: "text/plain" })); a.download = "counters.txt"; a.click(); URL.revokeObjectURL(a.href); };
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Performance &amp; Disk Log Analyser for SCADA Servers</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Record a Performance Monitor log on a slow SCADA server, HMI or historian and open it here: CPU, memory, disk latency, free space,
          network and the busiest processes are judged against stated thresholds, and memory leaks are spotted from the trend.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Performance & Disk Log Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="'The SCADA is slow' can be the CPU, memory, a slow or failing disk, a full volume, the network, or one process — often an antivirus scan or a leaking application. A short performance log answers it with numbers instead of guesses."
            standards={["Windows Performance Monitor counters (PDH CSV format)", "Thresholds are common engineering rules of thumb, stated next to each counter"]}
            capabilities={[
              "Reads CSV logs from typeperf, relog or a Data Collector Set (convert .blg with: relog log.blg -f csv -o log.csv).",
              "Min, average, maximum and 95th percentile per counter, and the share of time above the warning and critical levels.",
              "CPU and processor queue, available and committed memory, page file, disk read/write latency and queue, available disk space, network utilisation and errors.",
              "Busiest processes (CPU per core) and processes whose private memory grows steadily (possible leak).",
            ]}
            example={{
              problem: "The sample: a 10-minute log of a SCADA server with an antivirus scan starting during operation.",
              steps: ["CPU above 90 % for 20 % of the samples; MsMpEng (antivirus) averages 23 % of all cores and peaks at 70 %.", "Disk read latency up to 65 ms during the scan.", "The historian's private memory grows from 900 to 1251 MB."],
              result: "Move scheduled scans outside operating hours or exclude the historian archive as the vendor recommends, and log the historian's memory over a day to confirm the leak.",
            }}
            notes="Thresholds depend on the workload and the vendor's requirements; treat them as guidance. A log of a few hours at 15-second intervals during the slow period is ideal."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Log file">
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open CSV…<input type="file" accept=".csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
                <button type="button" onClick={() => { setText(sampleCsv()); setName("sample: SCADA-SRV01, antivirus scan during operation"); }} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample</button>
              </div>
              <p className="mt-2 text-xs text-muted">{name}{log ? ` · ${log.series.length} counters` : ""}</p>
              <NumberField label="CPU cores" value={cores} onChange={setCores} step={1} min={1} />
              <NumberField label="Installed RAM" unit="GB" value={ram} onChange={setRam} step={1} min={1} />
            </Section>
            <Section title="How to record the log">
              <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
                <li><button type="button" onClick={counterFile} className="text-accent-2 hover:underline">Download counters.txt</button> and copy it to the server.</li>
                <li>In Command Prompt, in that folder, run (15 s samples for 4 hours):</li>
              </ol>
              <code className="mt-2 block break-all rounded-lg border border-border bg-surface p-2 font-mono text-xs text-foreground">{cmd}</code>
              <p className="mt-2 text-xs text-muted">typeperf only reads counters; it changes nothing. Stop early with Ctrl+C. Open the CSV here.</p>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {!r ? <ResultCard title="Result"><p className="text-fail">Not a Performance Monitor CSV (the first line must list the counters).</p></ResultCard> : (
              <>
                <ResultCard title="Findings">
                  <p className="mb-2 text-xs text-muted">{r.duration}</p>
                  <ul className="space-y-2">{r.findings.map((x, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[x.sev][1]}`}>{SEV[x.sev][0]}</span><span className="text-foreground">{x.text}</span></li>)}</ul>
                </ResultCard>
                {r.topCpu.length > 0 && (
                  <ResultCard title="Busiest processes (CPU, % of all cores)">
                    {r.topCpu.map((p) => <div key={p.name} className="flex justify-between border-t border-border py-1 text-sm text-foreground first:border-0"><span className="font-mono">{p.name}</span><span>avg {p.avg.toFixed(1)} % · max {p.max.toFixed(0)} %</span></div>)}
                  </ResultCard>
                )}
                <ResultCard title="Counters">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-muted"><th className="py-1 pr-2">Counter</th><th className="py-1 pr-2">Avg</th><th className="py-1 pr-2">P95</th><th className="py-1 pr-2">Max</th><th className="py-1">Rule</th></tr></thead>
                      <tbody>{r.rows.map((x, i) => (
                        <tr key={i} className="border-t border-border text-foreground">
                          <td className={`py-1 pr-2 font-mono text-xs ${x.verdict === "error" ? "text-fail" : x.verdict === "warning" ? "text-accent" : ""}`}>{x.counter}</td>
                          <td className="py-1 pr-2">{f(x.s.avg)} {x.unit}</td><td className="py-1 pr-2">{f(x.s.p95)}</td><td className="py-1 pr-2">{f(x.s.max)}</td>
                          <td className="py-1 text-xs text-muted">{x.rule}</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                </ResultCard>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
