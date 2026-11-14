"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { readCapture, packets, tcpConns, isoT } from "@/lib/pcapnet";
import { analyse104, points104Csv, TYPES, cotName, IEC104_DEFAULTS } from "@/lib/iec104cap";
import { analyseMb, regMapCsv, FC } from "@/lib/modbuscap";
import { analyseDnp3, AFC, IIN1, IIN2 } from "@/lib/dnp3cap";

type Sev = "error" | "warning" | "info" | "ok";
const SEV: Record<Sev, [string, string]> = { error: ["Error", "text-fail"], warning: ["Warning", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const SAMPLES = [
  ["IEC 104 gateway", "/samples/S13_IEC104_gateway_capture.pcap"],
  ["Modbus TCP meter", "/samples/S13_ModbusTCP_meter_capture.pcap"],
  ["DNP3 RTU", "/samples/S13_DNP3_RTU_capture.pcap"],
];
const dl = (name: string, text: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
const Findings = ({ list }: { list: { sev: Sev; text: string; no?: number }[] }) => (
  <ul className="space-y-2">{list.map((f, i) => <li key={i} className="text-sm"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span>{f.no ? <span className="mr-2 font-mono text-xs text-muted">frame {f.no}</span> : null}<span className="text-foreground">{f.text}</span></li>)}</ul>
);
const th = "py-1 pr-3 text-left font-normal text-muted", td = "py-1 pr-3 align-top";

export default function ScadaProtocolAnalyserPage() {
  const [buf, setBuf] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("");
  const [p104, setP104] = useState({ port: "2404", k: "12", w: "8", t1: "15", t2: "10", t3: "20" });
  const [pMb, setPMb] = useState({ port: "502", timeout: "1" });
  const [pDnp, setPDnp] = useState("20000");
  const [tabSel, setTabSel] = useState<"104" | "mb" | "dnp" | "">("");
  const [lim, setLim] = useState(300);
  const res = useMemo(() => {
    if (!buf) return null;
    try {
      const pk = packets(readCapture(buf));
      const n = (s: string, d: number) => (Number.isFinite(Number(s)) && s !== "" ? Number(s) : d);
      const ports = [n(p104.port, 2404), n(pMb.port, 502), n(pDnp, 20000)];
      const conns = tcpConns(pk, ports);
      const i104 = analyse104(conns, { port: ports[0], k: n(p104.k, 12), w: n(p104.w, 8), t1: n(p104.t1, 15), t2: n(p104.t2, 10), t3: n(p104.t3, 20) });
      const mb = analyseMb(conns, ports[1], n(pMb.timeout, 1));
      const dnp = analyseDnp3(conns, pk, ports[2]);
      return { pk: pk.length, i104, mb, dnp, err: "" };
    } catch (e) {
      return { pk: 0, i104: [], mb: [], dnp: null, err: (e as Error).message };
    }
  }, [buf, p104, pMb, pDnp]);
  const open = (f?: File) => { if (!f) return; f.arrayBuffer().then((b) => { setBuf(new Uint8Array(b)); setName(f.name); setLim(300); setTabSel(""); }); };
  const sample = (u: string, label: string) => fetch(u).then((r) => r.arrayBuffer()).then((b) => { setBuf(new Uint8Array(b)); setName(`sample: ${label}`); setLim(300); setTabSel(""); });
  const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent";
  const counts = res ? { "104": res.i104.reduce((x, c) => x + c.apdus.length, 0), mb: res.mb.reduce((x, c) => x + c.txns.length, 0), dnp: res.dnp?.apps.length ?? 0 } : { "104": 0, mb: 0, dnp: 0 };
  const tab = tabSel || (counts.mb > counts["104"] && counts.mb >= counts.dnp ? "mb" : counts.dnp > counts["104"] ? "dnp" : "104");
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCADA Protocol Capture Analyser — IEC 104, Modbus TCP, DNP3</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Open a Wireshark capture of a telecontrol or SCADA link and read it as a protocol engineer would: every IEC 60870-5-104 APDU with
          sequence numbers, causes, addresses, values, quality and time tags; every Modbus TCP request with its response, exception and
          response time, and the register map it reveals; every DNP3 frame with CRC check, function code, internal indications and objects —
          with findings that explain what is wrong and what to check.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SCADA Protocol Capture Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="When a control centre loses data from a substation, a gateway shows points as invalid or a Modbus meter stops updating, the capture holds the answer — but reading hundreds of frames by hand is slow, and the meaning of a sequence-number jump, a cause of transmission 47 or an IIN bit is not obvious. The analyser decodes the frames, checks them against the protocol rules and the configured parameters, and lists the problems with the frame numbers to look at in Wireshark."
            standards={["IEC 60870-5-104 (APCI, k, w, t1–t3) and IEC 60870-5-101 (ASDU types, causes of transmission, CP56Time2a)", "Modbus Application Protocol V1.1b3 and Modbus Messaging on TCP/IP V1.0b", "IEEE 1815 (DNP3): data link layer with CRC, transport function, application layer, IIN", "pcap and pcapng capture file formats"]}
            capabilities={[
              "Reads pcap and pcapng (Ethernet, VLAN, Linux cooked, raw IP) and reassembles each TCP connection in both directions, dropping retransmissions and noting gaps.",
              "IEC 104: I/S/U frames, STARTDT, send/receive sequence numbers, k and w limits, unconfirmed TESTFR/STARTDT within t1, idle t3, 40 ASDU types decoded with value, quality (IV, NT, SB, BL, OV) and time tag, general interrogation and command select/execute sequences, causes 44–47, time-tag offset against the capture clock, and a point list (CSV).",
              "Modbus TCP: request/response matching by transaction id, exceptions explained, unanswered requests, response times, byte-count and limit checks, polling blocks with their cycle, writes, and a register map of every address read or written (CSV).",
              "DNP3 over TCP or UDP: link frames with CRC check of every block, transport reassembly, application function codes, IIN bits (restart, need time, event buffer overflow, trouble …), object headers and values for the common groups, unanswered requests, SELECT without OPERATE, unconfirmed unsolicited responses.",
            ]}
            example={{
              problem: "The sample IEC 104 capture between the control centre and gateway GW1.",
              steps: ["The general interrogation is confirmed after 12 ms and terminated after 0.06 s; IOA 3003 comes with IV quality.", "The controlled station's send sequence number jumps from 16 to 18 and the controlling station lets 9 I-frames go unacknowledged (w = 8).", "A single command to IOA 5099 is answered with cause 47 (unknown IOA); a TESTFR is never confirmed; all time tags are 4 h ahead of the capture clock — local time instead of UTC."],
              result: "Each finding with its frame number, ready to raise with the gateway or SCADA team.",
            }}
            notes="Capture at the point that matters (a mirror port next to the gateway or RTU) and long enough to include a general interrogation or integrity poll. TLS-protected links (IEC 104 on 19998, DNP3 over TLS) cannot be decoded. Files are read in your browser and not uploaded."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          <div className="space-y-6">
            <Section title="Capture">
              <label className={`cursor-pointer ${btn}`}>Open capture…<input type="file" accept=".pcap,.pcapng,.cap" className="hidden" onChange={(e) => open(e.target.files?.[0])} /></label>
              <div className="mt-3 flex flex-col gap-2">{SAMPLES.map(([l, u]) => <button key={u} type="button" onClick={() => sample(u, l)} className={btn}>Sample: {l}</button>)}</div>
              <p className="mt-2 text-xs text-muted">{name}{res && !res.err ? ` · ${res.pk} IPv4 packets` : ""}</p>
            </Section>
            <Section title="IEC 104 parameters">
              <div className="grid grid-cols-2 gap-2">
                {(["port", "k", "w", "t1", "t2", "t3"] as const).map((k) => <TextField key={k} label={k === "port" ? "TCP port" : k === "k" || k === "w" ? k : `${k} (s)`} value={p104[k]} onChange={(v) => setP104({ ...p104, [k]: v })} />)}
              </div>
              <p className="mt-1 text-xs text-muted">Defaults per IEC 60870-5-104: k {IEC104_DEFAULTS.k}, w {IEC104_DEFAULTS.w}, t1 15 s, t2 10 s, t3 20 s. Enter the values configured on the link.</p>
            </Section>
            <Section title="Modbus and DNP3">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Modbus port" value={pMb.port} onChange={(v) => setPMb({ ...pMb, port: v })} />
                <TextField label="Time-out (s)" value={pMb.timeout} onChange={(v) => setPMb({ ...pMb, timeout: v })} />
                <TextField label="DNP3 port" value={pDnp} onChange={setPDnp} />
              </div>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {res?.err && <ResultCard title="Cannot read the file"><p className="text-fail">{res.err}</p></ResultCard>}
            {res && !res.err && (
              <>
                <div className="flex flex-wrap gap-2">
                  {([["104", "IEC 104"], ["mb", "Modbus TCP"], ["dnp", "DNP3"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setTabSel(k)} className={`rounded-full border px-4 py-1.5 text-sm ${tab === k ? "border-accent text-accent" : "border-border text-muted"}`}>{l} ({counts[k]})</button>)}
                </div>
                {tab === "104" && (res.i104.length ? res.i104.map((c, ci) => (
                  <div key={ci} className="space-y-4">
                    <ResultCard title={`IEC 104 connection ${c.client} → ${c.server}`}>
                      <p className="mb-3 text-sm text-muted">{isoT(c.start)} – {isoT(c.end)} UTC · {c.stats.i} I-frames, {c.stats.s} S-frames, {c.stats.u} U-frames · {c.stats.gi} interrogation(s), {c.stats.cmds} command(s) · most unacknowledged I-frames: controlled station {c.stats.maxUnackS}, controlling station {c.stats.maxUnackC}{c.stats.timeOffset !== null ? ` · time tags − capture clock ${c.stats.timeOffset.toFixed(3)} s` : ""}</p>
                      <Findings list={c.findings} />
                    </ResultCard>
                    <ResultCard title={`Point list (${c.points.length})`}>
                      <button type="button" onClick={() => dl("iec104-points.csv", points104Csv(c))} className="mb-2 rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export CSV</button>
                      <div className="max-h-80 overflow-auto"><table className="w-full text-sm"><thead><tr><th className={th}>CA</th><th className={th}>IOA</th><th className={th}>Type</th><th className={th}>Count</th><th className={th}>Causes</th><th className={th}>Last value</th><th className={th}>Quality</th></tr></thead>
                        <tbody>{c.points.map((p) => <tr key={p.ca + "|" + p.ioa} className="border-t border-border text-foreground"><td className={td}>{p.ca}</td><td className={`${td} font-mono`}>{p.ioa}</td><td className={`${td} font-mono text-xs`}>{TYPES[p.type]?.id}</td><td className={td}>{p.count}</td><td className={`${td} text-xs`}>{[...p.cots].map(cotName).join(", ")}</td><td className={`${td} font-mono text-xs`}>{p.last}</td><td className={`${td} text-xs ${p.lastQ.length ? "text-fail" : ""}`}>{p.lastQ.join(" ") || "good"}</td></tr>)}</tbody></table></div>
                    </ResultCard>
                    <ResultCard title="Frames">
                      <div className="max-h-[32rem] overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Frame</th><th className={th}>Time</th><th className={th}>From</th><th className={th}>APCI</th><th className={th}>ASDU</th></tr></thead>
                        <tbody>{c.apdus.slice(0, lim).map((a, i) => <tr key={i} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{a.no}</td><td className={`${td} font-mono`}>{(a.t - c.start).toFixed(3)}</td><td className={td}>{a.dir === "c2s" ? "controlling" : "controlled"}</td><td className={`${td} font-mono`}>{a.kind === "I" ? `I N(S)=${a.ns} N(R)=${a.nr}` : a.kind === "S" ? `S N(R)=${a.nr}` : a.u}</td>
                          <td className={td}>{a.asdu && <><span className="font-mono">{TYPES[a.asdu.type]?.id ?? `type ${a.asdu.type}`}</span> · {cotName(a.asdu.cot)}{a.asdu.neg ? " · NEGATIVE" : ""}{a.asdu.test ? " · TEST" : ""} · CA {a.asdu.ca}<div className="font-mono text-muted">{a.asdu.objs.slice(0, 6).map((o) => `${o.ioa}: ${o.value}${o.q.length ? ` [${o.q.join(" ")}]` : ""}${o.time ? ` @ ${o.time.iso}${o.time.invalid ? " (IV)" : ""}` : ""}`).join(" · ")}{a.asdu.objs.length > 6 ? ` … +${a.asdu.objs.length - 6}` : ""}</div>{a.asdu.err && <div className="text-fail">{a.asdu.err}</div>}</>}</td></tr>)}</tbody></table></div>
                      {c.apdus.length > lim && <button type="button" onClick={() => setLim(lim + 1000)} className="mt-2 text-sm text-accent">Show more ({c.apdus.length - lim} left)</button>}
                    </ResultCard>
                  </div>
                )) : <ResultCard title="IEC 104"><p className="text-muted">No TCP connection on port {p104.port} in this capture.</p></ResultCard>)}
                {tab === "mb" && (res.mb.length ? (
                  <>
                    {res.mb.map((c, ci) => (
                      <ResultCard key={ci} title={`Modbus TCP ${c.client} → ${c.server}`}>
                        <p className="mb-3 text-sm text-muted">{c.stats.req} requests, {c.stats.rsp} responses, {c.stats.exc} exceptions, {c.stats.noResp} unanswered{c.stats.avgMs !== null ? ` · response time average ${c.stats.avgMs.toFixed(0)} ms, maximum ${c.stats.maxMs!.toFixed(0)} ms` : ""}</p>
                        <Findings list={c.findings} />
                        <h3 className="mt-4 mb-1 text-sm font-semibold text-foreground">Polling blocks</h3>
                        <table className="w-full text-sm"><thead><tr><th className={th}>Unit</th><th className={th}>Function</th><th className={th}>Start</th><th className={th}>Quantity</th><th className={th}>Polls</th><th className={th}>Cycle</th></tr></thead>
                          <tbody>{c.blocks.map((b, i) => <tr key={i} className="border-t border-border text-foreground"><td className={td}>{b.unit}</td><td className={td}>{b.fc} {FC[b.fc]}</td><td className={`${td} font-mono`}>{b.addr}</td><td className={td}>{b.qty}</td><td className={td}>{b.count}</td><td className={td}>{b.periodS !== null ? `${b.periodS.toFixed(2)} s` : "—"}</td></tr>)}</tbody></table>
                      </ResultCard>
                    ))}
                    <ResultCard title={`Register map (${res.mb.reduce((n, c) => n + c.regs.length, 0)} addresses)`}>
                      <button type="button" onClick={() => dl("modbus-register-map.csv", regMapCsv(res.mb))} className="mb-2 rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export register map (CSV)</button>
                      <div className="max-h-96 overflow-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Unit</th><th className={th}>Table</th><th className={th}>Address</th><th className={th}>Notation</th><th className={th}>Reads</th><th className={th}>Writes</th><th className={th}>Last</th><th className={th}>Min–max</th><th className={th}>Changes</th></tr></thead>
                        <tbody>{res.mb.flatMap((c) => c.regs).map((r) => <tr key={`${r.unit}|${r.table}|${r.addr}`} className="border-t border-border text-foreground"><td className={td}>{r.unit}</td><td className={td}>{r.table}</td><td className={`${td} font-mono`}>{r.addr}</td><td className={`${td} font-mono`}>{r.notation}</td><td className={td}>{r.reads}</td><td className={td}>{r.writes}</td><td className={`${td} font-mono`}>{r.last}</td><td className={`${td} font-mono text-xs`}>{r.min}–{r.max}</td><td className={td}>{r.changes}</td></tr>)}</tbody></table></div>
                      <p className="mt-2 text-xs text-muted">Values are raw 16-bit registers or bits. Two registers often hold one 32-bit float — decode a pair with the SCADA Value Converter. Fill in tag names and descriptions in the CSV, then check it with the SCADA Tag Database Validator.</p>
                    </ResultCard>
                  </>
                ) : <ResultCard title="Modbus TCP"><p className="text-muted">No TCP connection on port {pMb.port} in this capture.</p></ResultCard>)}
                {tab === "dnp" && res.dnp && (res.dnp.apps.length || res.dnp.links.length ? (
                  <>
                    <ResultCard title="DNP3">
                      <p className="mb-3 text-sm text-muted">{res.dnp.links.length} link frames ({res.dnp.links.filter((l) => !l.crcOk).length} with CRC errors), {res.dnp.apps.length} application messages · {res.dnp.pairs.map((p) => `master ${p.master} ↔ outstation ${p.outstation}`).join(", ")}</p>
                      <Findings list={res.dnp.findings} />
                    </ResultCard>
                    <ResultCard title="Application messages">
                      <div className="max-h-[32rem] overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Frame</th><th className={th}>From</th><th className={th}>Function</th><th className={th}>Seq</th><th className={th}>IIN</th><th className={th}>Objects</th></tr></thead>
                        <tbody>{res.dnp.apps.map((m, i) => <tr key={i} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{m.no}</td><td className={td}>{m.dir} {m.src}</td><td className={td}>{AFC[m.fc] ?? `FC ${m.fc}`}{m.con ? " (CON)" : ""}{m.uns ? " (UNS)" : ""}</td><td className={td}>{m.seq}</td>
                          <td className={`${td} ${m.iin && (m.iin[0] & 0xd0 || m.iin[1] & 0x2f) ? "text-accent" : ""}`}>{m.iin ? [...IIN1.filter((_, b) => m.iin![0] & (1 << b)), ...IIN2.filter((_, b) => m.iin![1] & (1 << b))].join(", ") || "—" : ""}</td>
                          <td className={td}>{m.objs.map((o, k) => <div key={k}><span className="font-mono">{o.name}</span> {o.range}{o.values.length ? <span className="text-muted"> · {o.values.slice(0, 8).join(" · ")}</span> : null}{o.err ? <span className="text-accent"> · {o.err}</span> : null}</div>)}</td></tr>)}</tbody></table></div>
                    </ResultCard>
                  </>
                ) : <ResultCard title="DNP3"><p className="text-muted">No DNP3 frames on port {pDnp} in this capture.</p></ResultCard>)}
              </>
            )}
            {!res && <ResultCard title="Result"><p className="text-muted">Open a capture or load one of the samples.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
