"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField, SelectField } from "@/components/fields";
import { emptyLog, parseLog, sha256Hex, sclInfo, guessKind, checkAgainstLog, logIssues, logCsv, newId, CFG_KINDS, CFG_STATUS, type CfgLog, type CfgEntry, type CfgKind, type CfgStatus, type FileCheck, type SclInfo } from "@/lib/configlog";

const KEY = "ajapps.configlog.v1";
const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const today = () => new Date().toISOString().slice(0, 10);
type Draft = Omit<CfgEntry, "id">;
const blank: Draft = { device: "", kind: "Other", file: "", sizeBytes: 0, sha256: "", version: "", revision: "", date: today(), by: "", reason: "", status: "Draft", notes: "" };

export default function ConfigVersionLogPage() {
  const [log, setLog] = useState<CfgLog>(emptyLog());
  const [draft, setDraft] = useState<Draft>(blank);
  const [scl, setScl] = useState<SclInfo | null>(null);
  const [checks, setChecks] = useState<FileCheck[]>([]);
  const [checkDev, setCheckDev] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { try { const t = localStorage.getItem(KEY); if (t) setLog(parseLog(t)); } catch { /* ignore */ } }, []);
  const save = (l: CfgLog) => { setLog(l); try { localStorage.setItem(KEY, JSON.stringify(l)); } catch { /* storage unavailable */ } };
  const issues = useMemo(() => logIssues(log), [log]);
  const devices = useMemo(() => [...new Set(log.entries.map((e) => e.device))].sort(), [log]);

  const readFile = (f: File) => new Promise<{ buf: ArrayBuffer; text: string | null }>((res) => { const r = new FileReader(); r.onload = () => { const buf = r.result as ArrayBuffer; const small = buf.byteLength < 50e6; let text: string | null = null; if (small) { try { text = new TextDecoder("utf-8", { fatal: false }).decode(buf); if (/\u0000/.test(text.slice(0, 2000))) text = null; } catch { text = null; } } res({ buf, text }); }; r.readAsArrayBuffer(f); });
  const onAddFile = async (f?: File) => {
    if (!f) return;
    const { buf, text } = await readFile(f);
    const sha = await sha256Hex(buf);
    const info = text ? sclInfo(text) : null;
    setScl(info);
    const last = info?.history[info.history.length - 1];
    setDraft((d) => ({ ...d, file: f.name, sizeBytes: buf.byteLength, sha256: sha, kind: guessKind(f.name, text), version: info?.version || last?.version || d.version, revision: info?.revision || d.revision, date: last?.when?.slice(0, 10) || d.date, device: d.device || (info?.ieds.length === 1 ? info.ieds[0].name : info?.headerId || ""), reason: d.reason || (last ? [last.what, last.why].filter(Boolean).join(" — ") : ""), by: d.by || last?.who || "" }));
  };
  const add = () => { if (!draft.device.trim() || !draft.sha256) { setMsg("Choose a file and enter the device."); return; } save({ ...log, entries: [...log.entries, { ...draft, id: newId() }] }); setDraft(blank); setScl(null); setMsg("Version added. Download the log to keep it."); };
  const onCheck = async (files: FileList | null) => { if (!files) return; const out: FileCheck[] = []; for (const f of Array.from(files)) { const { buf } = await readFile(f); out.push(checkAgainstLog(log, f.name, await sha256Hex(buf), checkDev)); } setChecks(out); };
  const dl = (data: string, name: string, type: string) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([data], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); };
  const openLog = (f?: File) => { if (!f) return; const r = new FileReader(); r.onload = () => { try { save(parseLog(String(r.result))); setMsg(`Opened ${f.name}.`); } catch (e) { setMsg((e as Error).message); } }; r.readAsText(f); };
  const sample = () => fetch("/samples/S13_configuration_log.json").then((r) => r.text()).then((t) => { save(parseLog(t)); setMsg("Sample log loaded. Try Check files with S13_Sample.scd from the Sample files page."); });
  const upd = (id: string, p: Partial<CfgEntry>) => save({ ...log, entries: log.entries.map((e) => (e.id === id ? { ...e, ...p } : e)) });
  const del = (id: string) => save({ ...log, entries: log.entries.filter((e) => e.id !== id) });

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Configuration Version Log — SCD, CID, Switch &amp; RTU Files</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Keep a record of which version of every configuration file is approved and which is in each device — SCD and CID files, switch, RTU,
          gateway and PLC configurations, HMI projects and firmware — identified by its SHA-256 fingerprint, with who changed it, when and why.
          Then check any file to see whether it is a recorded, approved version.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Configuration Version Log" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Years after commissioning, nobody is sure which SCD is the real one, whether the CID in a relay matches it, or which switch configuration was approved. File names and dates lie; a SHA-256 fingerprint does not — any change to a file, even one character, gives a different fingerprint. This log ties each fingerprint to a device, a version and a reason, so the question 'is this the approved file?' has a definite answer."
            standards={["IEC 62443-2-1 / -3-3: configuration management and change control", "IEC 61850-6: SCL Header version, revision and History (Hitem)", "SHA-256 (FIPS 180-4) file fingerprints"]}
            capabilities={[
              "Fingerprint any file in the browser (SHA-256) and record device, type, version, revision, date, author, reason and status.",
              "Read the SCL Header and History of SCD/CID/ICD files to fill version, revision, date, author and reason automatically.",
              "Check files (for example a CID read back from a relay or a switch configuration backup) against the log: recorded and approved, superseded, draft, recorded for another device, or unknown.",
              "Log checks: several versions marked Installed, approved versions not yet installed, entries without reason or author, one file under two versions. Export as JSON (to reopen) and CSV.",
            ]}
            example={{
              problem: "The sample log of S13: the station SCD 1.2 is Installed; SW1 configuration 4 and P132_Q02 firmware 3.2.1 are Approved but not installed.",
              steps: ["Check files with S13_Sample.scd and device 'S13 station' → matches SCD 1.2 rev A, installed 2026-10-02.", "Check a modified copy of the same SCD → not a recorded version: find out what changed before using it."],
              result: "Proof that the file in use is the approved one — or an early warning that it is not.",
            }}
            notes="The log is kept in this browser for convenience. Download it (JSON) after every change and store it with the project records; the downloaded file is the record. Files are fingerprinted locally and never uploaded."
          />
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1"><TextField label="Site / project" value={log.site} onChange={(v) => save({ ...log, site: v })} /></div>
          <button type="button" onClick={() => { if (confirm("Start a new, empty log? Download the current one first if you need it.")) save(emptyLog()); }} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">New log</button>
          <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open log…<input type="file" accept=".json" className="hidden" onChange={(e) => openLog(e.target.files?.[0])} /></label>
          <button type="button" onClick={sample} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample log</button>
          <button type="button" onClick={() => dl(JSON.stringify(log, null, 1), `configuration_log_${today()}.json`, "application/json")} className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-background">Download log</button>
          <button type="button" onClick={() => dl(logCsv(log), `configuration_log_${today()}.csv`, "text/csv")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Export CSV</button>
        </div>
        {msg && <p className="mt-2 text-sm text-accent-2">{msg}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Section title="Add a version">
            <label className="inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Choose file…<input type="file" className="hidden" onChange={(e) => onAddFile(e.target.files?.[0])} /></label>
            {draft.sha256 && <p className="mt-2 break-all font-mono text-[11px] text-muted">{draft.file} · {draft.sizeBytes.toLocaleString()} bytes · SHA-256 {draft.sha256}</p>}
            {scl && <p className="mt-1 text-xs text-muted">SCL header {scl.headerId} v{scl.version} rev {scl.revision}{scl.toolID ? ` (${scl.toolID})` : ""} · {scl.ieds.length} IED(s){scl.history.length ? ` · last history: ${scl.history[scl.history.length - 1].when} ${scl.history[scl.history.length - 1].what}` : ""}</p>}
            <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
              <TextField label="Device / system" placeholder="P132_Q01, SW1, S13 station" value={draft.device} onChange={(v) => setDraft({ ...draft, device: v })} />
              <SelectField<CfgKind> label="Type" value={draft.kind} onChange={(v) => setDraft({ ...draft, kind: v })} options={CFG_KINDS.map((k) => ({ value: k, label: k }))} />
              <TextField label="Version" value={draft.version} onChange={(v) => setDraft({ ...draft, version: v })} />
              <TextField label="Revision" value={draft.revision} onChange={(v) => setDraft({ ...draft, revision: v })} />
              <TextField label="Date" placeholder="YYYY-MM-DD" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
              <TextField label="By" value={draft.by} onChange={(v) => setDraft({ ...draft, by: v })} />
              <SelectField<CfgStatus> label="Status" value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={CFG_STATUS.map((k) => ({ value: k, label: k }))} />
              <TextField label="Reason / change request" value={draft.reason} onChange={(v) => setDraft({ ...draft, reason: v })} />
            </div>
            <button type="button" onClick={add} className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background">Add to log</button>
          </Section>
          <Section title="Check files against the log">
            <TextField label="Device the files came from (optional)" placeholder="e.g. P132_Q01" value={checkDev} onChange={setCheckDev} />
            <label className="mt-2 inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Choose file(s)…<input type="file" multiple className="hidden" onChange={(e) => onCheck(e.target.files)} /></label>
            <ul className="mt-3 space-y-2">{checks.map((c, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[c.sev][1]}`}>{SEV[c.sev][0]}</span><span className="font-mono text-xs text-foreground">{c.file}</span><div className="text-sm text-foreground">{c.text}</div></li>)}</ul>
            <p className="mt-2 text-xs text-muted">Read the file back from the device (or take the switch&apos;s configuration backup) and check it here before and after every change.</p>
          </Section>
        </div>

        {issues.length > 0 && <ResultCard title="Log checks"><ul className="space-y-1.5">{issues.map((x, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[x.sev][1]}`}>{SEV[x.sev][0]}</span><span className="text-foreground">{x.text}</span></li>)}</ul></ResultCard>}
        <div className="mt-6 space-y-4">
          {devices.length === 0 && <p className="text-muted">The log is empty. Add a version or load the sample log.</p>}
          {devices.map((dv) => (
            <ResultCard key={dv} title={dv}>
              <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted"><th className="py-1 pr-2">Type</th><th className="py-1 pr-2">Version</th><th className="py-1 pr-2">Date</th><th className="py-1 pr-2">By</th><th className="py-1 pr-2">Reason</th><th className="py-1 pr-2">Status</th><th className="py-1 pr-2">File / SHA-256</th><th /></tr></thead>
                <tbody>{log.entries.filter((e) => e.device === dv).sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
                  <tr key={e.id} className="border-t border-border align-top text-foreground">
                    <td className="py-1 pr-2">{e.kind}</td><td className="py-1 pr-2">{e.version}{e.revision ? ` rev ${e.revision}` : ""}</td><td className="py-1 pr-2">{e.date}</td><td className="py-1 pr-2">{e.by}</td><td className="py-1 pr-2">{e.reason}</td>
                    <td className="py-1 pr-2"><select value={e.status} onChange={(ev) => upd(e.id, { status: ev.target.value as CfgStatus })} className="rounded border border-border bg-surface px-1 text-xs">{CFG_STATUS.map((s) => <option key={s}>{s}</option>)}</select></td>
                    <td className="py-1 pr-2"><div>{e.file}</div><div className="break-all font-mono text-[10px] text-muted">{e.sha256}</div></td>
                    <td className="py-1"><button type="button" onClick={() => { if (confirm(`Remove ${e.file} from the log?`)) del(e.id); }} className="text-fail">×</button></td>
                  </tr>))}</tbody></table></div>
            </ResultCard>
          ))}
        </div>
      </div>
    </div>
  );
}
