"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { readCapture, isoT } from "@/lib/pcapnet";
import { eth } from "@/lib/l2cap";
import { analysePtp, analyseNtp, parseW32tm, bestClass, CLASSES, CLOCKCLASS, ptpName, timeSourceName } from "@/lib/timesync";

const SAMPLES = [["PTP power profile", "/samples/S13_PTP_capture.pcap"], ["NTP from the HMI", "/samples/S13_NTP_capture.pcap"]];
interface Reading { name: string; ms: string }

export default function TimeSyncAnalyserPage() {
  const [buf, setBuf] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("");
  const [w32, setW32] = useState("");
  const [dom, setDom] = useState("0");
  const [utc, setUtc] = useState("37");
  const [onClient, setOnClient] = useState(true);
  const [manual, setManual] = useState<Reading[]>([{ name: "", ms: "" }]);
  const cap = useMemo(() => { if (!buf) return null; try { const E = eth(readCapture(buf)); return { E, ptp: analysePtp(E, { domain: Number(dom) || 0, utcOffset: Number(utc) || 37, syncInt: 1 }), ntp: analyseNtp(E, onClient ? "client" : "other"), err: "" }; } catch (e) { return { E: [], ptp: null, ntp: null, err: (e as Error).message }; } }, [buf, dom, utc, onClient]);
  const w = useMemo(() => (w32.trim() ? parseW32tm(w32) : null), [w32]);
  const open = (f?: File) => { if (f) f.arrayBuffer().then((b) => { setBuf(new Uint8Array(b)); setName(f.name); }); };
  const sample = (u: string, l: string) => fetch(u).then((x) => x.arrayBuffer()).then((b) => { setBuf(new Uint8Array(b)); setName("sample: " + l); });
  const sampleW = () => fetch("/samples/S13_HMI1_w32tm.txt").then((x) => x.text()).then(setW32);
  // time source comparison
  const sources: { name: string; err: number; how: string }[] = [];
  if (cap?.ptp?.captureOffset != null) sources.push({ name: "Capture computer vs PTP grandmaster", err: cap.ptp.captureOffset, how: "PTP Follow_Up time − UTC offset − capture time" });
  for (const s of cap?.ntp?.servers ?? []) if (s.samples.length && s.stratum > 0 && s.stratum < 16) { const o = s.samples.map((x) => x.offset).sort((a, b) => a - b); sources.push({ name: `Client vs NTP server ${s.ip}`, err: o[Math.floor(o.length / 2)], how: "NTP offset (median)" }); }
  if (w?.strip.length) { const o = w.strip.map((x) => x.offset).sort((a, b) => a - b); sources.push({ name: "Windows (w32tm stripchart)", err: o[Math.floor(o.length / 2)], how: "w32tm /stripchart (median)" }); }
  for (const m of manual) if (m.name.trim() && m.ms.trim() && Number.isFinite(Number(m.ms))) sources.push({ name: m.name, err: Number(m.ms) / 1000, how: "entered" });
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Time Sync Analyser — PTP, NTP and w32tm</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Check the time synchronisation of a substation: PTP grandmasters, clock class, UTC offset, domain, delay mechanism and message
          rates against the IEC/IEEE 61850-9-3 power profile; NTP servers, stratum, offset and delay from a capture; Windows w32tm output; and
          how close each time source is, against the IEC 61850-5 time performance classes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Time Sync Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Sequence-of-events records, disturbance records and sampled values are only useful if every device has the same time. A grandmaster that lost GPS, a wrong UTC offset, a rogue device winning the master selection, an NTP server that is itself unsynchronised or a Windows PC polling once every nine hours each put events in the wrong order — usually unnoticed until an incident is investigated."
            standards={["IEC/IEEE 61850-9-3 (PTP power utility profile: layer 2, peer delay, 1 s messages, domain 0)", "IEEE 1588-2019 (PTP messages, clock class, best master clock algorithm)", "RFC 5905 (NTPv4: stratum, leap indicator, offset θ and delay δ)", "IEC 61850-5 (time performance classes T0–T5)"]}
            capabilities={[
              "PTP: grandmaster candidates and the one the best master clock algorithm selects; clock class changes (GPS lost → holdover); an unsynchronised device winning by priority1; currentUtcOffset; timeTraceable; other domains; UDP transport; end-to-end Delay_Req in a peer-delay network; Sync interval and lost Syncs; two-step Syncs without Follow_Up; Pdelay requests not answered; the capture computer's offset from PTP time.",
              "NTP: each server's stratum, reference, leap indicator and root dispersion; Kiss-o'-Death; unanswered requests; offset θ = ((T2 − T1) + (T3 − T4)) / 2 and delay δ = (T4 − T1) − (T3 − T2) per request.",
              "w32tm /query /status and /stripchart: source (including local CMOS clock), stratum, root dispersion, poll interval, offsets.",
              "Time source comparison: every measured or entered offset against classes T0 (10 ms) to T5 (1 µs).",
            ]}
            example={{ problem: "The S13 samples: a PTP capture, an NTP capture from HMI1 and its w32tm output.", steps: ["PTP: GPS1 goes into holdover (class 7); a device announcing priority1 64 with class 248 would win the selection and announces UTC offset 36 s; one Sync without Follow_Up; a device in domain 93 and one using Delay_Req.", "NTP: HMI1 is 850 ms ahead of GPS1; the second configured server 10.13.1.1 is unsynchronised (stratum 16).", "w32tm: root dispersion 7.8 s and a 9-hour poll interval explain the drift."], result: "Fix the priority1 of the rogue device, remove the unsynchronised NTP server, shorten the Windows poll interval." }}
            notes="Capture PTP on a port of a PTP-aware switch, and NTP on the client computer itself (the offset uses the capture time as the client's receive time). Files are read in your browser."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="Capture">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open capture…<input type="file" accept=".pcap,.pcapng,.cap" className="hidden" onChange={(e) => open(e.target.files?.[0])} /></label>
                {SAMPLES.map(([l, u]) => <button key={u} type="button" onClick={() => sample(u, l)} className={btn}>Sample: {l}</button>)}
              </div>
              <p className="mt-2 text-xs text-muted">{name}</p>
              <div className="mt-2 grid grid-cols-2 gap-2"><TextField label="PTP domain" value={dom} onChange={setDom} /><TextField label="TAI−UTC (s)" value={utc} onChange={setUtc} /></div>
              <label className="mt-2 flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={onClient} onChange={(e) => setOnClient(e.target.checked)} /> NTP capture taken on the client</label>
            </Section>
            <Section title="w32tm output (optional)">
              <button type="button" onClick={sampleW} className={btn}>Load sample</button>
              <textarea value={w32} onChange={(e) => setW32(e.target.value)} rows={7} spellCheck={false} aria-label="w32tm output" placeholder="Paste w32tm /query /status and/or w32tm /stripchart /computer:<server> /samples:5" className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
            </Section>
            <Section title="Other readings (optional)">
              {manual.map((m, i) => <div key={i} className="mb-2 grid grid-cols-3 gap-2"><div className="col-span-2"><TextField label="Source" value={m.name} onChange={(v) => setManual(manual.map((x, j) => (j === i ? { ...x, name: v } : x)))} placeholder="P132_Q01 vs GPS (test set)" /></div><TextField label="Error (ms)" value={m.ms} onChange={(v) => setManual(manual.map((x, j) => (j === i ? { ...x, ms: v } : x)))} /></div>)}
              <button type="button" onClick={() => setManual([...manual, { name: "", ms: "" }])} className="text-sm text-accent">+ add reading</button>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {cap?.err && <ResultCard title="Cannot read the file"><p className="text-fail">{cap.err}</p></ResultCard>}
            {cap?.ptp && cap.ptp.msgs.length > 0 && (
              <ResultCard title={`PTP (${cap.ptp.msgs.length} messages)`}>
                <FindingList list={cap.ptp.findings} />
                {cap.ptp.gms.length > 0 && <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Grandmaster</th><th className={th}>Priority1</th><th className={th}>Clock class</th><th className={th}>Source</th><th className={th}>UTC offset</th><th className={th}>Selected</th></tr></thead>
                  <tbody>{cap.ptp.gms.map((g) => <tr key={g.id} className="border-t border-border text-foreground"><td className={`${td} font-mono text-xs`}>{g.id}</td><td className={td}>{g.prio1}</td><td className={td}>{g.classes.map((c) => c.cls).join(" → ")}<div className="text-xs text-muted">{CLOCKCLASS[g.cls] ?? ""}</div></td><td className={td}>{timeSourceName(g.src)}</td><td className={td}>{g.utcOffset} s</td><td className={td}>{cap.ptp!.best?.id === g.id ? "yes" : ""}</td></tr>)}</tbody></table></div>}
                <div className="mt-3 max-h-64 overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Frame</th><th className={th}>Time</th><th className={th}>Message</th><th className={th}>From</th><th className={th}>Seq</th><th className={th}>Domain</th></tr></thead>
                  <tbody>{cap.ptp.msgs.slice(0, 300).map((m) => <tr key={m.no} className="border-t border-border text-foreground"><td className={td}>{m.no}</td><td className={`${td} font-mono`}>{isoT(m.t).slice(11)}</td><td className={td}>{ptpName(m.p.type)}</td><td className={`${td} font-mono`}>{m.src}</td><td className={td}>{m.p.seq}</td><td className={td}>{m.p.domain}</td></tr>)}</tbody></table></div>
              </ResultCard>
            )}
            {cap?.ntp && cap.ntp.servers.length > 0 && (
              <ResultCard title="NTP / SNTP">
                <FindingList list={cap.ntp.findings} />
                <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Server</th><th className={th}>Stratum</th><th className={th}>Reference</th><th className={th}>Samples</th><th className={th}>Offset</th><th className={th}>Delay</th></tr></thead>
                  <tbody>{cap.ntp.servers.map((s) => { const o = s.samples.map((x) => x.offset).sort((a, b) => a - b); const med = o.length ? o[Math.floor(o.length / 2)] : null; return <tr key={s.ip} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{s.ip}</td><td className={`${td} ${s.stratum === 16 ? "text-fail" : ""}`}>{s.stratum < 0 ? "no answer" : s.stratum}</td><td className={td}>{s.refid}</td><td className={td}>{s.samples.length}</td><td className={td}>{med !== null ? `${(med * 1000).toFixed(1)} ms` : "—"}</td><td className={td}>{s.samples.length ? `${(1000 * s.samples.reduce((a, x) => a + x.delay, 0) / s.samples.length).toFixed(1)} ms` : "—"}</td></tr>; })}</tbody></table></div>
              </ResultCard>
            )}
            {w && <ResultCard title="w32tm"><FindingList list={w.findings} />{Object.keys(w.status).length > 0 && <div className="mt-3 grid grid-cols-2 gap-x-4 text-sm">{Object.entries(w.status).map(([k, v]) => <div key={k} className="border-t border-border py-1"><span className="text-muted">{k}: </span><span className="text-foreground">{v}</span></div>)}</div>}</ResultCard>}
            {sources.length > 0 && (
              <ResultCard title="Time source comparison">
                <table className="w-full text-sm"><thead><tr><th className={th}>Source</th><th className={th}>Error</th><th className={th}>Best class met</th><th className={th}>From</th></tr></thead>
                  <tbody>{sources.map((s, i) => <tr key={i} className="border-t border-border text-foreground"><td className={td}>{s.name}</td><td className={`${td} font-mono`}>{Math.abs(s.err) >= 1e-3 ? `${(s.err * 1000).toFixed(2)} ms` : `${(s.err * 1e6).toFixed(1)} µs`}</td><td className={`${td} ${Math.abs(s.err) > 0.01 ? "text-fail" : ""}`}>{bestClass(Math.abs(s.err))}</td><td className={`${td} text-xs text-muted`}>{s.how}</td></tr>)}</tbody></table>
                <p className="mt-2 text-xs text-muted">IEC 61850-5 classes: {CLASSES.map(([c, l]) => `${c} ±${l >= 1e-3 ? l * 1000 + " ms" : l * 1e6 + " µs"}`).join(", ")}. Typical needs: SCADA / event lists T1 (1 ms) or T0; sampled values for protection T4–T5.</p>
              </ResultCard>
            )}
            {!cap && !w && <ResultCard title="Result"><p className="text-muted">Open a capture, paste w32tm output, or load a sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
