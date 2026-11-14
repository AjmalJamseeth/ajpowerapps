"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { parseText, parseCaptureEvents, analyseSources, timeline, timelineCsv, isoMs, type Source } from "@/lib/timeline";

const SAMPLE = ["S13_SOE_P132_Q01.csv", "S13_SOE_P87T_T1.csv", "S13_SCADA_event_list.csv", "S13_switch_syslog.log", "S13_GOOSE_station_bus.pcap"];
const COLORS = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#a78bfa", "#fb7185", "#34d399", "#60a5fa"];

export default function SoeIncidentTimelinePage() {
  const [src, setSrc] = useState<Source[]>([]);
  const [year, setYear] = useState(String(new Date().getUTCFullYear()));
  const [win, setWin] = useState("2");
  const [only, setOnly] = useState(false);
  const an = useMemo(() => analyseSources(src), [src]);
  const tl = useMemo(() => timeline(src, Number(win) || 0), [src, win]);
  const add = async (files: FileList | null) => {
    if (!files) return;
    const out: Source[] = [];
    for (const f of Array.from(files)) {
      if (/\.(pcap|pcapng|cap)$/i.test(f.name)) out.push(parseCaptureEvents(f.name, new Uint8Array(await f.arrayBuffer())));
      else out.push(parseText(f.name, await f.text(), Number(year) || undefined));
    }
    setSrc([...src, ...out]);
  };
  const sample = async () => {
    const out: Source[] = [];
    for (const f of SAMPLE) {
      const r = await fetch("/samples/" + f);
      out.push(/\.pcap$/.test(f) ? parseCaptureEvents(f, new Uint8Array(await r.arrayBuffer())) : parseText(f, await r.text(), 2026));
    }
    setSrc(out);
  };
  const set = (i: number, k: "offset" | "tz", v: number) => setSrc(src.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const apply = () => setSrc(src.map((s) => { const g = an.suggestions.filter((x) => x.src === s.name); return g.length ? { ...s, offset: s.offset + g.reduce((a, x) => a + x.offset, 0) } : s; }));
  const col = (n: string) => COLORS[src.findIndex((s) => s.name === n) % COLORS.length];
  const rows = only ? tl.rows.filter((r) => !/Alm|fan/i.test(r.signal + r.desc)) : tl.rows;
  const exportCsv = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([timelineCsv(tl.rows)], { type: "text/csv" })); a.download = "incident-timeline.csv"; a.click(); URL.revokeObjectURL(a.href); };
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SOE Checker &amp; Incident Timeline</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Put the event lists of an incident on one time line: IED sequence-of-events files, the SCADA event list, switch syslog, Windows
          event exports and captures (GOOSE state changes, IEC 104 time-tagged events). The checker finds time-quality problems, duplicates,
          chattering, sources in local time and clocks that put effect before cause — and suggests the corrections.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SOE Checker and Incident Timeline" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="After a trip, the question is always 'what happened first?'. The answer is spread over several devices, each with its own clock, time zone and file format. If one relay's clock is 300 ms behind or the SCADA list is in local time, the reconstructed sequence is wrong — a breaker that seems to open before the protection tripped, a GOOSE that seems to arrive before it was sent. Merging the sources and checking cause against effect finds the clock problems and gives one reliable sequence."
            standards={["IEC 61850-7-2 (TimeStamp with TimeQuality: ClockNotSynchronized, ClockFailure, accuracy)", "IEC 61850-5 (time performance classes; event time-stamping)", "IEC 60870-5-104 (CP56Time2a time tags)", "RFC 3164 / RFC 5424 (syslog)"]}
            capabilities={[
              "Reads CSV event lists (a time column plus device, signal, value, description, time quality and received time, found from the headings), syslog (RFC 3164 and 5424), Windows event CSV exports, and pcap captures (GOOSE state changes, IEC 104 spontaneous time-tagged events).",
              "Per source: time quality not synchronised, coarse resolution, duplicates, chattering signals, events received before they happened.",
              "Across sources: sources whole hours apart (local time instead of UTC), an event recorded as received from device X before X sent it (clock behind), trip-to-breaker-open times outside 20–100 ms; suggested corrections that can be applied in one click.",
              "One merged time line, relative to the first protection trip, filtered to a window around it; CSV export.",
            ]}
            example={{ problem: "A line fault on Q01, recorded by P132_Q01, P87T_T1, the SCADA event list, switch SW1's syslog and a GOOSE capture.", steps: ["The SCADA list is 4 h ahead (local time) and contains a duplicate breaker event.", "P87T_T1's events are flagged not synchronised, and it records the intertrip from P132_Q01 307 ms before P132_Q01 sent it; it also has a chattering fan alarm.", "After the suggested corrections: start −19 ms, trip and GOOSE at 0, intertrip received at +4 ms, breaker open at +50 ms, port link down at +67 ms."], result: "One time line of the disturbance, with each clock problem named." }}
            notes="Set each source's time zone if the file is in local time, or apply the suggestions. Corrections are estimates from cause and effect (about 4 ms GOOSE transfer time is assumed); confirm with the device's time-sync status. Files are read in your browser."
          />
        </div>
        <div className="mt-8 space-y-6">
          <ResultCard title={`Sources (${src.length})`}>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <label className={`cursor-pointer ${btn}`}>Add files…<input type="file" multiple accept=".csv,.txt,.log,.pcap,.pcapng" className="hidden" onChange={(e) => add(e.target.files)} /></label>
              <button type="button" onClick={sample} className={btn}>Load the sample disturbance</button>
              {src.length > 0 && <button type="button" onClick={() => setSrc([])} className={btn}>Clear</button>}
              <div className="w-28"><TextField label="Year (syslog)" value={year} onChange={setYear} /></div>
              <div className="w-36"><TextField label="Window ± s (0 = all)" value={win} onChange={setWin} /></div>
            </div>
            {src.length > 0 && (
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Source</th><th className={th}>Kind</th><th className={th}>Events</th><th className={th}>Time zone (UTC+h)</th><th className={th}>Correction (s)</th></tr></thead>
                <tbody>{src.map((s, i) => <tr key={s.name + i} className="border-t border-border text-foreground"><td className={td}><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: col(s.name) }} />{s.name}{s.err ? <div className="text-xs text-fail">{s.err}</div> : null}</td><td className={td}>{s.kind}</td><td className={td}>{s.events.length}</td>
                  <td className={td}><input type="number" value={s.tz} onChange={(e) => set(i, "tz", Number(e.target.value) || 0)} className="w-20 rounded border border-border bg-surface-2 px-2 py-1 text-sm" aria-label="time zone" /></td>
                  <td className={td}><input type="number" step="0.001" value={+s.offset.toFixed(3)} onChange={(e) => set(i, "offset", Number(e.target.value) || 0)} className="w-28 rounded border border-border bg-surface-2 px-2 py-1 text-sm" aria-label="correction" /></td></tr>)}</tbody></table></div>
            )}
          </ResultCard>
          {src.length > 0 && (
            <ResultCard title="Checks">
              <FindingList list={an.findings} />
              {an.suggestions.length > 0 && <div className="mt-3"><p className="text-sm text-foreground">Suggested corrections: {an.suggestions.map((g) => `${g.src} ${g.offset > 0 ? "+" : ""}${Math.abs(g.offset) >= 60 ? (g.offset / 3600).toFixed(0) + " h" : (g.offset * 1000).toFixed(0) + " ms"} (${g.why})`).join("; ")}.</p><button type="button" onClick={apply} className="mt-2 rounded-lg border border-accent px-3 py-1.5 text-sm text-accent">Apply suggested corrections</button></div>}
            </ResultCard>
          )}
          {rows.length > 0 && (
            <ResultCard title={`Time line (${rows.length} events, zero = ${isoMs(tl.t0)} UTC)`}>
              <div className="mb-2 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> hide alarm noise (Alm / fan)</label><button type="button" onClick={exportCsv} className="ml-auto rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export CSV</button></div>
              <div className="max-h-[36rem] overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Time (UTC)</th><th className={th}>ms</th><th className={th}>Source</th><th className={th}>Device</th><th className={th}>Signal</th><th className={th}>Value</th><th className={th}>Description</th></tr></thead>
                <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{isoMs(r.t).slice(11)}</td><td className={`${td} text-right font-mono ${Math.abs(r.rel) < 0.0005 ? "text-accent" : ""}`}>{(r.rel * 1000).toFixed(0)}</td><td className={td}><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: col(r.src) }} title={r.src} /></td><td className={`${td} font-mono`}>{r.device}</td><td className={`${td} font-mono`}>{r.signal}</td><td className={td}>{r.value}</td><td className={td}>{r.desc}{r.quality ? <span className="text-muted"> · {r.quality}</span> : null}</td></tr>)}</tbody></table></div>
            </ResultCard>
          )}
          {!src.length && <ResultCard title="Result"><p className="text-muted">Add the event files of an incident, or load the sample disturbance.</p></ResultCard>}
        </div>
      </div>
    </div>
  );
}
