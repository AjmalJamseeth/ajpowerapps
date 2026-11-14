"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { parseScan, parseRegister, parseRules, checkDiscovery, discCsv, DEFAULT_RULES, type Sev, type DiscRow } from "@/lib/discovery";

const SEV: Record<Sev, [string, string]> = { error: ["Error", "text-fail"], warning: ["Warning", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const ST: Record<DiscRow["status"], [string, string]> = { matched: ["in register", "text-pass"], unknown: ["unknown", "text-accent"], missing: ["not found", "text-accent"], "mac-mismatch": ["MAC mismatch", "text-fail"] };
const SCAN = "/samples/S13_station_bus_scan.xml", REG = "/samples/S13_asset_register.csv";

export default function DiscoveryResultCheckerPage() {
  const [scanText, setScanText] = useState("");
  const [scanName, setScanName] = useState("");
  const [regText, setRegText] = useState("");
  const [regName, setRegName] = useState("");
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [scope, setScope] = useState("");
  const [filter, setFilter] = useState<Sev | "all">("all");
  const res = useMemo(() => {
    if (!scanText.trim() || !regText.trim()) return null;
    try {
      const s = parseScan(scanText);
      return { s, r: checkDiscovery(s, parseRegister(regText), parseRules(rules), scope), err: "" };
    } catch (e) {
      return { s: null, r: null, err: (e as Error).message };
    }
  }, [scanText, regText, rules, scope]);
  const read = (f: File | undefined, set: (t: string) => void, setN: (n: string) => void) => { if (!f) return; const rd = new FileReader(); rd.onload = () => { set(String(rd.result || "")); setN(f.name); }; rd.readAsText(f); };
  const sample = async () => {
    const [a, b] = await Promise.all([fetch(SCAN).then((x) => x.text()), fetch(REG).then((x) => x.text())]);
    setScanText(a); setScanName("sample nmap scan of the S13 station bus"); setRegText(b); setRegName("S13 asset register");
  };
  const exportCsv = () => { if (!res?.r) return; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([discCsv(res.r)], { type: "text/csv" })); a.download = "discovery-check.csv"; a.click(); URL.revokeObjectURL(a.href); };
  const r = res?.r;
  const cnt = r ? { error: r.findings.filter((f) => f.sev === "error").length, warning: r.findings.filter((f) => f.sev === "warning").length, info: r.findings.filter((f) => f.sev === "info").length } : null;
  const shown = r ? r.findings.filter((f) => filter === "all" || f.sev === filter) : [];
  const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent";
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Network Discovery Result Checker</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Compare what a network scan really found with the approved IP and asset register: devices nobody registered, registered devices
          that did not answer, an IP address answered by a different MAC address, and open ports that are not on the approved list.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Network Discovery Result Checker" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="The register says what should be on the network; a scan says what is. The differences — a laptop left connected, a replaced relay with a new MAC, an IED moved to the wrong address, Telnet still enabled on a bay controller — are exactly what IEC 62443 asks the asset owner to find and resolve. Reading a scan by eye against a register of hundreds of addresses is slow and error-prone."
            standards={["IEC 62443-2-1 (asset inventory), IEC 62443-3-3 SR 7.7 least functionality and SR 7.8 component inventory", "Nmap XML output format (nmap.org DTD)", "ARP (RFC 826) — address resolution on the local subnet"]}
            capabilities={[
              "Reads nmap XML (-oX), grepable (-oG) and normal output, a Windows or Linux ARP table, or a CSV / plain list of addresses.",
              "Reads the register as CSV (an IP register with one row per address, or the SCL NetStudio asset register with several addresses per device) or an SCL NetStudio project file.",
              "Finds unknown devices, devices at an address other than the design (their MAC is registered elsewhere), MAC mismatches, registered addresses not found within the scanned range, and one MAC answering for several addresses.",
              "Checks every open port against an approved-services list per device name or IP, and calls out clear-text and high-risk services (Telnet, FTP, TFTP, HTTP, SMB, VNC …).",
            ]}
            example={{
              problem: "The sample: an nmap scan of the S13 station bus (10.13.0.0/25) against the S13 asset register.",
              steps: ["10.13.0.15 (P132_Q02) answers with a different MAC: the relay was replaced and the register not updated.", "P87T_T1 is not at 10.13.0.16 but at 10.13.0.21 — its MAC gives it away.", "LAPTOP-ENG07 at 10.13.0.88 is not registered and offers SMB; BCU_J01 still has Telnet and HTTP open; HMI1 has VNC."],
              result: "8 errors and 4 warnings, each with the address and the action — register, correct, remove or disable.",
            }}
            notes="Scan only with the asset owner's permission and in an agreed window: an aggressive scan can disturb old IEDs. Prefer an ARP / host discovery scan (nmap -sn) on the local subnet first, then a limited port list. The files are read in your browser and not uploaded."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Scan result">
              <div className="flex flex-wrap gap-2">
                <label className={`cursor-pointer ${btn}`}>Open scan…<input type="file" accept=".xml,.gnmap,.nmap,.txt,.csv" className="hidden" onChange={(e) => read(e.target.files?.[0], setScanText, setScanName)} /></label>
                <button type="button" onClick={sample} className={btn}>Load sample scan and register</button>
              </div>
              <p className="mt-1 text-xs text-muted">{scanName}{res?.s ? ` · ${res.s.format}, ${res.s.hosts.length} hosts` : ""}</p>
              <textarea value={scanText} onChange={(e) => setScanText(e.target.value)} rows={6} spellCheck={false} aria-label="Scan result" placeholder="Paste nmap output, an ARP table (arp -a) or a list of IP addresses" className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
            </Section>
            <Section title="Register">
              <label className={`cursor-pointer ${btn}`}>Open register…<input type="file" accept=".csv,.txt,.json" className="hidden" onChange={(e) => read(e.target.files?.[0], setRegText, setRegName)} /></label>
              <p className="mt-1 text-xs text-muted">{regName}</p>
              <textarea value={regText} onChange={(e) => setRegText(e.target.value)} rows={5} spellCheck={false} aria-label="Register" placeholder="Paste the IP or asset register (CSV with a heading line), or an SCL NetStudio project" className="mt-2 w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
            </Section>
            <Section title="Approved services and scope">
              <textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={8} spellCheck={false} aria-label="Approved services" className="w-full rounded-lg border border-border bg-surface p-2 font-mono text-[11px] text-foreground" />
              <TextField label="Scanned range (optional)" tip="Registered addresses outside this range are not reported as missing. Taken from the nmap command line when the scan file has it; otherwise the /24 networks of the hosts found." value={scope} onChange={setScope} placeholder={res?.r ? res.r.scope.join(", ") : "10.13.0.0/25"} />
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {res?.err && <ResultCard title="Cannot read"><p className="text-fail">{res.err}</p></ResultCard>}
            {r && cnt && (
              <>
                <div className={`rounded-xl border p-5 ${cnt.error ? "border-fail/50 bg-fail/10" : cnt.warning ? "border-accent/50 bg-accent/10" : "border-pass/50 bg-pass/10"}`}>
                  <div className="text-lg font-semibold text-foreground">{cnt.error ? `${cnt.error} error(s) to resolve` : cnt.warning ? "No errors — warnings to review" : "The network matches the register"}</div>
                  <div className="mt-1 text-sm text-muted">{r.counts.scanned} hosts found · {r.counts.registered} registered addresses in range ({r.scope.join(", ")}) · {r.counts.matched} matched · {r.counts.unknown} unknown · {r.counts.missing} not found · {r.counts.macMismatch} MAC mismatch · {r.counts.unapproved} ports not approved</div>
                </div>
                <ResultCard title="Findings">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(["all", "error", "warning", "info"] as const).map((k) => <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-accent text-accent" : "border-border text-muted"}`}>{k === "all" ? `All (${r.findings.length})` : `${SEV[k][0]} (${cnt[k]})`}</button>)}
                    <button type="button" onClick={exportCsv} className="ml-auto rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export CSV</button>
                  </div>
                  <ul className="space-y-2">{shown.map((f, i) => <li key={i} className="text-sm"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
                </ResultCard>
                <ResultCard title="Addresses">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-left text-muted"><th className="py-1 pr-2">IP</th><th className="py-1 pr-2">Status</th><th className="py-1 pr-2">Register</th><th className="py-1 pr-2">MAC seen</th><th className="py-1 pr-2">Open ports</th><th className="py-1">Not approved</th></tr></thead>
                      <tbody>{r.rows.map((x) => (
                        <tr key={x.ip + x.status} className="border-t border-border text-foreground">
                          <td className="py-1 pr-2 font-mono text-xs">{x.ip}</td>
                          <td className={`py-1 pr-2 text-xs ${ST[x.status][1]}`}>{ST[x.status][0]}</td>
                          <td className="py-1 pr-2 font-mono text-xs">{x.regName || x.scanName || "—"}</td>
                          <td className={`py-1 pr-2 font-mono text-[11px] ${x.status === "mac-mismatch" ? "text-fail" : ""}`}>{x.scanMac || "—"}{x.vendor ? ` · ${x.vendor}` : ""}</td>
                          <td className="py-1 pr-2 font-mono text-[11px]">{x.open || "—"}</td>
                          <td className="py-1 font-mono text-[11px] text-fail">{x.unapproved}</td>
                        </tr>))}</tbody>
                    </table>
                  </div>
                </ResultCard>
              </>
            )}
            {!res && <ResultCard title="Result"><p className="text-muted">Open or paste a scan result and a register, or load the samples.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
