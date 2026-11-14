"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard } from "@/components/fields";
import { readCapture } from "@/lib/pcapnet";
import { eth } from "@/lib/l2cap";
import { expectedFromScd, observe, diagnose, SYMPTOMS, symptomAdvice, type St } from "@/lib/goosetrouble";

const ST: Record<St, [string, string]> = { pass: ["✓ pass", "text-pass"], fail: ["✗ fail", "text-fail"], warn: ["! check", "text-accent"], na: ["—", "text-muted"] };
const th = "py-1 pr-3 text-left font-normal text-muted", td = "py-1 pr-3 align-top";
const SETS = [
  { label: "Demonstration bay (four GOOSE streams)", scd: "/samples/GOOSE_SV_demo_bay1.scd", cap: "/samples/GOOSE_SV_demo_bay1.pcap" },
  { label: "S13 station bus (two protection GOOSE)", scd: "/samples/S13_Sample.scd", cap: "/samples/S13_GOOSE_station_bus.pcap" },
];

export default function GooseTroubleshooterPage() {
  const [scd, setScd] = useState("");
  const [scdName, setScdName] = useState("");
  const [buf, setBuf] = useState<Uint8Array | null>(null);
  const [capName, setCapName] = useState("");
  const [sub, setSub] = useState("");
  const [sym, setSym] = useState<string[]>([]);
  const exp = useMemo(() => { if (!scd) return { list: [], err: "" }; try { return { list: expectedFromScd(scd), err: "" }; } catch (e) { return { list: [], err: (e as Error).message }; } }, [scd]);
  const cap = useMemo(() => { if (!buf) return { E: [], err: "" }; try { return { E: eth(readCapture(buf)), err: "" }; } catch (e) { return { E: [], err: (e as Error).message }; } }, [buf]);
  const obs = useMemo(() => observe(cap.E), [cap]);
  const subs = useMemo(() => [...new Set(exp.list.flatMap((x) => x.subs))].sort(), [exp]);
  const diag = useMemo(() => (exp.list.length && buf ? diagnose(exp.list, obs, sub, cap.E.length ? cap.E[cap.E.length - 1].t : 0) : null), [exp, obs, sub, buf, cap]);
  const readText = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => { setScd(String(r.result || "")); setScdName(f.name); setSub(""); }; r.readAsText(f); };
  const readBin = (f?: File) => { if (!f) return; f.arrayBuffer().then((b) => { setBuf(new Uint8Array(b)); setCapName(f.name); }); };
  const sample = async (s: (typeof SETS)[0]) => { const [a, b] = await Promise.all([fetch(s.scd).then((r) => r.text()), fetch(s.cap).then((r) => r.arrayBuffer())]); setScd(a); setScdName(s.scd.split("/").pop()!); setBuf(new Uint8Array(b)); setCapName(s.cap.split("/").pop()!); setSub(""); };
  const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent";
  const advice = symptomAdvice(sym);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">GOOSE Troubleshooter — “Why is my GOOSE not working?”</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Load the SCD and a capture taken at the subscriber&apos;s switch port. For every GOOSE stream (or every stream a chosen subscriber
          uses), the troubleshooter compares what is on the wire with what the SCD says, check by check in the order a subscriber applies
          them — and tells you which check fails, why the subscriber then ignores the message, and what to change.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="GOOSE Troubleshooter" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="A GOOSE that does not arrive is the most common IEC 61850 commissioning problem, and the subscriber's indication ('missing', 'config mismatch') rarely says which of a dozen settings is wrong. The answer is almost always visible by comparing a capture with the SCD: wrong confRev, a VLAN not on the port, a simulation flag, a time allowed to live without margin. Doing that comparison field by field by hand takes long and is easy to get wrong."
            standards={["IEC 61850-8-1 (GOOSE frame: APPID, gocbRef, timeAllowedtoLive, datSet, goID, stNum, sqNum, simulation, confRev, ndsCom, numDatSetEntries)", "IEC 61850-6 (GSE address: MAC, APPID, VLAN, priority, MinTime, MaxTime; GSEControl; ExtRef)", "IEC 61850-7-4 Ed2 (LPHD.Sim: simulated GOOSE)", "IEC 61850-90-4 (network engineering guidelines)"]}
            capabilities={[
              "Reads the GOOSE control blocks, their communication addresses, data sets and subscribers (ExtRef) from the SCD.",
              "Decodes every GOOSE frame in a pcap / pcapng capture and groups them per stream.",
              "Checks, per stream: present, destination MAC, APPID, VLAN, priority, gocbRef, goID, data set, confRev, number of entries, simulation / test, ndsCom, every frame within the previous frame's time allowed to live, publisher stopped, sqNum continuity, stNum changing with the data, quality of the values and time-stamp synchronisation.",
              "Lists captured streams that are not in the SCD; filters to the streams one subscriber uses; adds guidance for the symptom you see.",
            ]}
            example={{
              problem: "The demonstration bay: four GOOSE streams in the SCD and a five-second capture.",
              steps: ["gcbTrip: one repetition arrives 48 ms after a frame that allowed 32 ms — the subscriber declares it lost.", "gcbStatus: published with confRev 2 while the SCD says 3 (configuration mismatch), and silent for 3 s.", "gcbIntlk: simulation bit and test set (ignored by a subscriber not in simulation), priority 1 instead of 4, a value change without a new stNum; gcbAlarm is not on the wire at all."],
              result: "One clear cause per stream, with the fix: reload the CIDs from one SCD revision, take the test set out of simulation, check the switch path of gcbAlarm.",
            }}
            notes="Capture at a mirror port of the subscriber's switch port (or as close as possible) so the capture sees what the subscriber sees. The capture shows the publisher side; the subscriber's own configuration (its CID, input mapping, simulation mode) must match the same SCD. Files are read in your browser."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="SCD and capture">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open SCD…<input type="file" accept=".scd,.cid,.icd,.xml" className="hidden" onChange={(e) => readText(e.target.files?.[0])} /></label>
                <label className={`cursor-pointer ${btn}`}>Open capture…<input type="file" accept=".pcap,.pcapng,.cap" className="hidden" onChange={(e) => readBin(e.target.files?.[0])} /></label>
                {SETS.map((s) => <button key={s.cap} type="button" onClick={() => sample(s)} className={btn}>Sample: {s.label}</button>)}
              </div>
              <p className="mt-2 text-xs text-muted">{scdName}{exp.list.length ? ` · ${exp.list.length} GOOSE control block(s)` : ""}<br />{capName}{cap.E.length ? ` · ${obs.length} GOOSE stream(s) in ${cap.E.length} frames` : ""}</p>
              {(exp.err || cap.err) && <p className="mt-1 text-sm text-fail">{exp.err || cap.err}</p>}
            </Section>
            {subs.length > 0 && (
              <Section title="Subscriber">
                <select value={sub} onChange={(e) => setSub(e.target.value)} className="w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground">
                  <option value="">All streams</option>{subs.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Section>
            )}
            <Section title="What do you see?">
              <div className="space-y-2">{SYMPTOMS.map(([k, l]) => <label key={k} className="flex items-start gap-2 text-sm text-foreground"><input type="checkbox" className="mt-1" checked={sym.includes(k)} onChange={(e) => setSym(e.target.checked ? [...sym, k] : sym.filter((x) => x !== k))} />{l}</label>)}</div>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {advice.length > 0 && <ResultCard title="Where to look first">{advice.map((a, i) => <p key={i} className="mb-2 text-sm text-foreground">{a}</p>)}</ResultCard>}
            {diag && diag.map((d, i) => (
              <ResultCard key={i} title={d.title}>
                <p className={`mb-3 text-sm font-semibold ${ST[d.verdict][1]}`}>{d.summary}</p>
                {d.exp && <p className="mb-2 text-xs text-muted">SCD: MAC {d.exp.mac || "—"} · APPID {d.exp.appid !== null ? d.exp.appid.toString(16).toUpperCase().padStart(4, "0") : "—"} · VLAN {d.exp.vlan ?? "—"} · priority {d.exp.prio ?? "—"} · confRev {d.exp.confRev ?? "—"} · {d.exp.members ?? "?"} entries{d.exp.subs.length ? ` · subscribers ${d.exp.subs.join(", ")}` : ""}</p>}
                {d.checks.length > 0 && (
                  <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Check</th><th className={th}>Result</th><th className={th}>Detail</th></tr></thead>
                    <tbody>{d.checks.map((c) => <tr key={c.id} className="border-t border-border text-foreground"><td className={td}>{c.label}</td><td className={`${td} whitespace-nowrap ${ST[c.st][1]}`}>{ST[c.st][0]}</td><td className={td}>{c.detail}{(c.st === "fail" || c.st === "warn") && c.fix ? <div className="mt-1 text-xs text-muted">{c.fix}</div> : null}</td></tr>)}</tbody></table></div>
                )}
              </ResultCard>
            ))}
            {!diag && exp.list.length > 0 && !buf && (
              <ResultCard title="Expected streams (open a capture to compare)">
                <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Control block</th><th className={th}>MAC</th><th className={th}>APPID</th><th className={th}>VLAN</th><th className={th}>confRev</th><th className={th}>goID</th><th className={th}>Subscribers</th></tr></thead>
                  <tbody>{exp.list.map((x) => <tr key={x.gocbRef} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{x.gocbRef}</td><td className={`${td} font-mono`}>{x.mac}</td><td className={td}>{x.appid?.toString(16).toUpperCase().padStart(4, "0")}</td><td className={td}>{x.vlan}</td><td className={td}>{x.confRev}</td><td className={`${td} font-mono`}>{x.goID}</td><td className={td}>{x.subs.join(", ")}</td></tr>)}</tbody></table></div>
              </ResultCard>
            )}
            {!scd && <ResultCard title="Result"><p className="text-muted">Open the SCD and a capture, or load a sample set.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
