"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow, TextField } from "@/components/fields";
import { parseReport, analyse, compareReports, anonymise, AREAS, DEFAULT_APPROVED, type Report, type Area } from "@/lib/winhealth";
import { COLLECTOR_FILE, COLLECTOR_SHA256, COLLECTOR_VERSION, COLLECTOR_READS } from "@/lib/collectorInfo";

const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const TABS = ["Findings", "Services", "Events", "Ports & firewall", "Baseline", "Compare"] as const;
const SAMPLE = "/samples/AJCollector_SAMPLE_SCADA-SRV01.json";
const RUN = "powershell.exe -ExecutionPolicy Bypass -File .\\AJ-Collector.ps1";

export default function WindowsHealthAnalyserPage() {
  const [rep, setRep] = useState<Report | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [base, setBase] = useState<Report | null>(null);
  const [approved, setApproved] = useState(DEFAULT_APPROVED);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Findings");
  const [area, setArea] = useState<Area | "All">("All");
  const load = (text: string, n: string, asBase = false) => {
    try { const r = parseReport(text); if (asBase) setBase(r); else { setRep(r); setName(n); setErr(""); } } catch (e) { setErr(`${n}: ${(e as Error).message}`); }
  };
  const loadSample = () => fetch(SAMPLE).then((r) => r.text()).then((t) => load(t, "sample report: SCADA-SRV01 (deliberate faults)")).catch(() => setErr("Could not load the sample."));
  useEffect(() => { loadSample(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const onFile = (f: File | undefined, asBase = false) => { if (!f) return; const r = new FileReader(); r.onload = () => load(String(r.result || ""), f.name, asBase); r.readAsText(f); };
  const a = useMemo(() => (rep ? analyse(rep, approved) : null), [rep, approved]);
  const changes = useMemo(() => (rep && base ? compareReports(base, rep) : null), [rep, base]);
  const shown = a ? a.findings.filter((f) => area === "All" || f.area === area) : [];
  const dlAnon = () => { if (!rep) return; const { json } = anonymise(rep); const el = document.createElement("a"); el.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); el.download = (name || "report").replace(/\.json$/i, "") + "_anonymised.json"; el.click(); URL.revokeObjectURL(el.href); };
  const sys = rep?.system ?? {};

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Windows Health Analyser for SCADA Servers (AJ Collector)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Run the read-only AJ Collector on a SCADA server, HMI, historian or engineering workstation — no installation — and open its report
          here. The analyser explains services, events, boot and logon delays, time, domain, network, listening ports, firewall, accounts,
          security settings and certificates, compares the computer with a baseline, and makes an anonymised copy to send to support.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Windows Health Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Installing diagnostic software on a SCADA server usually needs vendor approval, so the problem waits. A short, readable PowerShell script that only reads settings and logs is far easier to approve. It saves one file; the analysis happens here, in your browser, and the same file can be compared with an earlier one to see exactly what changed."
            standards={["Windows event, service, firewall and account information as reported by Windows itself", "Security checks in line with common hardening practice (IEC 62443 system hardening, Microsoft security baselines)", "Thresholds and rules stated with each finding"]}
            capabilities={[
              "System: end of support, pending restart, patch age, available memory. Disks: available space, physical health, disk errors.",
              "Services: automatic services not running (with crash history and dependency chain), named service accounts, remote access agents, print spooler on servers.",
              "Events grouped and explained; boot duration, Group Policy and Netlogon delays; time source, stratum, dispersion and clock steps; domain secure channel.",
              "Network findings from ipconfig, route and netstat; listening ports compared with your approved list; firewall profiles and risky rules.",
              "Accounts and a security baseline: built-in Administrator, guest, passwordless and dormant accounts, local admins, password policy, NLA, SMBv1, UAC, USB, AutoRun, LLMNR, antivirus, audit policy. Certificates expiring or weak.",
              "Compare with a baseline report (services, ports, administrators, software, updates, firewall rules, certificates, security settings) and download an anonymised copy.",
            ]}
            example={{
              problem: "The sample report of SCADA-SRV01, taken after operators complained of slow logon and a historian that keeps stopping.",
              steps: [
                "Historian Service stopped although Automatic: it crashed 5 times (7031) and historian.exe faults in ntdll.dll (1000).",
                "Boot takes 185 s; Group Policy 1129 and Netlogon 5719 at start-up: the domain controller is not reachable when Windows starts.",
                "Security: NLA off on Remote Desktop, SMBv1 on, a remote support agent installed with a firewall rule open to any address, an operator account in Administrators.",
              ],
              result: "Send the historian crash details to the vendor, make the server's switch port an edge port, and raise the security items through the site's change process.",
            }}
            notes="The collector never changes anything and the report is analysed in your browser, never uploaded. Use 'Download anonymised copy' before sending a report to a vendor or support team."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Section title={`1. Get the AJ Collector ${COLLECTOR_VERSION}`}>
            <div className="flex flex-wrap items-center gap-3">
              <a href={COLLECTOR_FILE} download className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background">Download AJ-Collector.ps1</a>
              <a href={COLLECTOR_FILE} target="_blank" rel="noopener" className="text-sm text-accent-2 hover:underline">Read the script first ↗</a>
            </div>
            <p className="mt-3 text-xs text-muted">SHA-256: <span className="break-all font-mono">{COLLECTOR_SHA256}</span> — check it on the target computer with <code className="font-mono">Get-FileHash .\AJ-Collector.ps1</code>.</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted">
              <li>Copy the script to the computer through the site&apos;s approved transfer process.</li>
              <li>Open PowerShell <b>as administrator</b> (for the complete report) in that folder and run:<code className="mt-1 block break-all rounded border border-border bg-surface p-2 font-mono text-xs text-foreground">{RUN}</code>&ldquo;Bypass&rdquo; applies to this one run only and changes no policy.</li>
              <li>It takes about a minute and writes <span className="font-mono">AJCollector_&lt;computer&gt;_&lt;date&gt;.json</span>. Open that file below.</li>
            </ol>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-accent-2">What the collector reads ({COLLECTOR_READS.length} parts) and what it never does</summary>
              <table className="mt-2 w-full text-xs">
                <tbody>{COLLECTOR_READS.map(([k, v, adm]) => <tr key={k} className="border-t border-border"><td className="py-1 pr-2 font-semibold text-foreground">{k}</td><td className="py-1 pr-2 text-muted">{v}</td><td className="py-1 text-muted">{adm ? "admin" : ""}</td></tr>)}</tbody>
              </table>
              <p className="mt-2 text-xs text-muted">It never changes a setting, starts or stops a service, installs anything, reads private keys or passwords, or sends anything over the network. Parts that need administrator rights are skipped and listed in the report when run without them. If scripts are blocked on the computer, run the commands from the Command Output Explainer by hand instead.</p>
            </details>
          </Section>
          <Section title="2. Open the report">
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Open report (.json)…<input type="file" accept=".json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
              <button type="button" onClick={loadSample} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample report</button>
              <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Baseline to compare…<input type="file" accept=".json" className="hidden" onChange={(e) => onFile(e.target.files?.[0], true)} /></label>
              {rep && <button type="button" onClick={dlAnon} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Download anonymised copy</button>}
            </div>
            {err && <p className="mt-2 text-sm text-fail">{err}</p>}
            {rep && <p className="mt-2 text-xs text-muted">{name} · collected {rep.meta?.collectedLocal} · {rep.meta?.isAdmin ? "as administrator" : "without administrator rights"}{base ? ` · baseline: ${base.meta?.computer} ${base.meta?.collectedLocal}` : ""}</p>}
            <TextField label="Approved listening ports (protocol matrix)" tip="Ports that are allowed to listen on this computer. Others are reported for review." value={approved} onChange={setApproved} />
          </Section>
        </div>

        {a && rep && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {(["error", "warning", "info", "ok"] as const).map((k) => <div key={k} className="rounded-xl border border-border bg-surface p-4"><div className={`text-2xl font-semibold ${SEV[k][1]}`}>{a.counts[k]}</div><div className="text-xs text-muted">{SEV[k][0]}</div></div>)}
            </div>
            <ResultCard title={`${rep.meta?.computer} — ${sys.os ?? ""}`}>
              <ResultRow label="Hardware" value={`${sys.manufacturer ?? ""} ${sys.model ?? ""} · ${sys.cpu ?? ""} (${sys.cores ?? "?"} cores) · ${sys.ramGB ?? "?"} GB RAM`} />
              <ResultRow label="Last boot / uptime" value={`${String(sys.lastBoot ?? "").slice(0, 16).replace("T", " ")} UTC · ${sys.uptimeHours ?? "?"} h`} />
              <ResultRow label="Domain" value={sys.partOfDomain ? sys.domain : `workgroup`} />
              <ResultRow label="Disks" value={(rep.disks ?? []).map((d: { name: string; freeGB: number; sizeGB: number }) => `${d.name} ${d.freeGB}/${d.sizeGB} GB available`).join(" · ")} />
            </ResultCard>
            <div className="mt-6 flex flex-wrap gap-2">
              {TABS.map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-lg border px-3 py-1.5 text-sm ${tab === t ? "border-accent text-accent" : "border-border text-foreground"}`}>{t}</button>)}
            </div>
            <div className="mt-4 space-y-4">
              {tab === "Findings" && (
                <ResultCard title="Findings">
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {(["All", ...AREAS] as const).map((x) => { const n = x === "All" ? a.findings.length : a.findings.filter((f) => f.area === x).length; return n ? <button key={x} type="button" onClick={() => setArea(x)} className={`rounded-full border px-2.5 py-0.5 text-xs ${area === x ? "border-accent text-accent" : "border-border text-muted"}`}>{x} ({n})</button> : null; })}
                  </div>
                  <ul className="space-y-2">{shown.map((f, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="mr-2 text-xs text-muted">{f.area}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
                </ResultCard>
              )}
              {tab === "Services" && (
                <ResultCard title="Services">
                  {a.serviceIssues.length ? <ul className="mb-4 space-y-1.5">{a.serviceIssues.map((s) => <li key={s.name} className="text-foreground"><b>{s.display}</b> ({s.name}) — {s.state}, {s.startMode}: {s.reason}</li>)}</ul> : <p className="mb-3 text-pass">Every automatic service is running (known on-demand services excluded).</p>}
                  <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted"><th className="py-1 pr-2">Service</th><th className="py-1 pr-2">State</th><th className="py-1 pr-2">Start</th><th className="py-1 pr-2">Account</th><th className="py-1">Depends on</th></tr></thead>
                    <tbody>{(rep.services ?? []).map((s: { name: string; display: string; state: string; startMode: string; account: string; dependsOn: string[] }) => <tr key={s.name} className={`border-t border-border ${s.startMode === "Auto" && s.state !== "Running" ? "text-accent" : "text-foreground"}`}><td className="py-1 pr-2">{s.display} <span className="text-muted">({s.name})</span></td><td className="py-1 pr-2">{s.state}</td><td className="py-1 pr-2">{s.startMode}</td><td className="py-1 pr-2">{s.account}</td><td className="py-1">{(s.dependsOn ?? []).join(", ")}</td></tr>)}</tbody></table></div>
                </ResultCard>
              )}
              {tab === "Events" && (
                <ResultCard title={`Events (last ${rep.meta?.days ?? 7} days, grouped)`}>
                  <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted"><th className="py-1 pr-2">Level</th><th className="py-1 pr-2">Source · ID</th><th className="py-1 pr-2">Count</th><th className="py-1 pr-2">Last</th><th className="py-1">Meaning</th></tr></thead>
                    <tbody>{a.events.map((g, i) => <tr key={i} className="border-t border-border align-top text-foreground"><td className={`py-1 pr-2 ${g.level === "Error" || g.level === "Critical" ? "text-fail" : g.level === "Warning" ? "text-accent" : "text-muted"}`}>{g.level}</td><td className="py-1 pr-2">{g.source.replace("Microsoft-Windows-", "")} · <b>{g.id}</b><div className="text-muted">{g.log}</div></td><td className="py-1 pr-2">{g.count}</td><td className="py-1 pr-2">{String(g.last).slice(0, 16).replace("T", " ")}</td><td className="py-1">{g.code ? <><b>{g.code.title}</b><div className="text-muted">{g.code.check[0]}</div></> : <span className="text-muted">{g.sample.slice(0, 160)}</span>}</td></tr>)}</tbody></table></div>
                  <p className="mt-2 text-xs text-muted">Full explanations: <a href="/calculators/windows-error-event-codes" className="text-accent-2 hover:underline">Windows Error &amp; Event Code Explainer</a>.</p>
                </ResultCard>
              )}
              {tab === "Ports & firewall" && (
                <>
                  <ResultCard title="Listening ports">
                    <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-left text-muted"><th className="py-1 pr-2">Port</th><th className="py-1 pr-2">Service</th><th className="py-1 pr-2">Process</th><th className="py-1 pr-2">Address</th><th className="py-1 pr-2">Approved</th><th className="py-1">Open to any address</th></tr></thead>
                      <tbody>{a.ports.map((p, i) => <tr key={i} className="border-t border-border text-foreground"><td className="py-1 pr-2 font-mono">{p.proto} {p.port}</td><td className="py-1 pr-2">{p.label}</td><td className="py-1 pr-2">{p.process}</td><td className="py-1 pr-2 font-mono">{p.address}</td><td className={`py-1 pr-2 ${p.approved ? "text-pass" : "text-accent"}`}>{p.approved ? "yes" : "review"}</td><td className={`py-1 ${p.exposed ? "text-accent" : ""}`}>{p.exposed ? "yes (firewall rule)" : ""}</td></tr>)}</tbody></table></div>
                  </ResultCard>
                  <ResultCard title="Firewall">
                    {(rep.firewall?.profiles ?? []).map((p: { name: string; enabled: string; inbound: string }) => <ResultRow key={p.name} label={`${p.name} profile`} value={`${p.enabled === "True" ? "on" : "OFF"}, inbound default ${p.inbound}`} />)}
                    <p className="mt-2 text-xs text-muted">{(rep.firewall?.rules ?? []).length} enabled rules; risky ones are listed under Findings → Ports &amp; firewall.</p>
                  </ResultCard>
                </>
              )}
              {tab === "Baseline" && (
                <ResultCard title="Security baseline">
                  <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{a.baseline.map((b, i) => <tr key={i} className="border-t border-border align-top"><td className={`py-1.5 pr-2 text-xs font-semibold uppercase ${SEV[b.verdict][1]}`}>{SEV[b.verdict][0]}</td><td className="py-1.5 pr-2 text-foreground">{b.check}</td><td className="py-1.5 pr-2 text-foreground">{b.value}</td><td className="py-1.5 text-xs text-muted">{b.why}</td></tr>)}</tbody></table></div>
                  <p className="mt-2 text-xs text-muted">Hardening must follow the SCADA vendor&apos;s approved configuration; change settings only through the site&apos;s change process.</p>
                </ResultCard>
              )}
              {tab === "Compare" && (
                <ResultCard title="Changes since the baseline">
                  {!changes ? <p className="text-muted">Open an earlier report of the same computer with &ldquo;Baseline to compare&rdquo;. Keep a report taken after commissioning as the approved baseline.</p> : changes.length === 0 ? <p className="text-pass">No differences in services, ports, administrators, users, software, updates, firewall, certificates or security settings.</p> : (
                    <ul className="space-y-1.5">{changes.map((c, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${c.kind === "added" ? "text-accent" : c.kind === "removed" ? "text-fail" : "text-accent-2"}`}>{c.kind}</span><span className="mr-2 text-xs text-muted">{c.area}</span><span className="text-foreground">{c.text}</span></li>)}</ul>
                  )}
                </ResultCard>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
