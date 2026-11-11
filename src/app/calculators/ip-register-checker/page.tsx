"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow } from "@/components/fields";
import { checkRegister, SAMPLE_REGISTER, type Sev } from "@/lib/ipregister";

const SEV_STYLE: Record<Sev, string> = { error: "text-fail", warning: "text-accent", info: "text-accent-2" };
const SEV_LABEL: Record<Sev, string> = { error: "Error", warning: "Warning", info: "Info" };

function csvCell(s: string) {
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function IpRegisterCheckerPage() {
  const [text, setText] = useState<string>(SAMPLE_REGISTER);
  const [filter, setFilter] = useState<Sev | "all">("all");
  const r = useMemo(() => checkRegister(text), [text]);
  const shown = r.findings.filter((f) => filter === "all" || f.sev === filter);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => setText(String(rd.result || ""));
    rd.readAsText(file);
  };

  const exportCsv = () => {
    const lines = ["Severity,Code,Lines,Finding", ...r.findings.map((f) => [f.sev, f.code, f.lines.join(" "), f.text].map(csvCell).join(","))];
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ip-register-findings.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">IP Address Register Consistency Checker</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Paste or open the IP address list of a substation or SCADA network (CSV or a copy from Excel). The checker finds duplicate
          addresses and MACs, network and broadcast addresses given to devices, gateways outside their subnet, mixed masks and gateways on
          one LAN, and overlapping subnets — with the line number of every problem. Nothing is uploaded; the check runs in your browser.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="IP Address Register Check" standardsLine="IPv4 addressing (RFC 791, RFC 950, RFC 1918, RFC 3927)" />
          <FeedbackButton calculatorName="IP Address Register Consistency Checker" />
        </div>
        <div className="mt-6">
          <InfoPanel
            purpose="An IP address register (the device list with IP, mask, gateway, MAC and VLAN) is the reference for configuring IEDs, switches, gateways and SCADA. A single wrong entry — a duplicate address, a /24 among /25 devices, a gateway typed in the wrong subnet — causes faults that are slow to find on site. This tool checks the whole list at once before it is issued for configuration."
            standards={["IPv4 addressing and subnetting (RFC 791, RFC 950)", "Private address ranges (RFC 1918) and link-local addresses (RFC 3927)", "IEEE 802 MAC address format (EUI-48)"]}
            capabilities={[
              "Reads comma, semicolon or tab separated text (a direct copy from Excel works) and detects the columns from the header: device name, IP address, mask, gateway, MAC, VLAN, network.",
              "Accepts the mask in its own column or as IP/prefix (10.13.0.14/25).",
              "Per device: invalid IP, mask or MAC, network or broadcast address used, loopback, link-local or multicast addresses, gateway outside its own subnet or equal to the device.",
              "Across the register: duplicate IPs, MACs and names; mixed masks or gateways inside one VLAN or network; overlapping subnets; one subnet spread over several VLANs.",
              "Subnet summary table and a findings list with line numbers, exportable to CSV.",
            ]}
            example={{
              problem: "The built-in sample: 16 devices on a station bus 10.13.0.0/25, a process bus 10.13.0.128/26, switch management 10.13.0.192/27 and a SCADA DMZ 10.13.1.0/28.",
              steps: [
                "P132_Q01 and P87T_T1 both have 10.13.0.14 → duplicate IP (error).",
                "BCU_J01 has 255.255.255.0 among /25 devices → mixed masks and an overlapping subnet.",
                "BCU_J02 gateway 10.13.1.1 is outside 10.13.0.0/25 → unreachable gateway.",
                "BCU_J03 is 10.13.0.127, the broadcast address of 10.13.0.0/25 → cannot be used.",
                "MU_Q01 and MU_T1 share one MAC; LAPTOP is on 169.254.x.x (no address configured).",
              ],
              result: "7 errors, 3 warnings and 2 notes, each with its line number — corrected before the register is issued.",
            }}
            notes="The checker tests the register for internal consistency. It cannot know whether an entry matches the device actually installed — confirm on site or against the SCL file."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Register">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setText(SAMPLE_REGISTER)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample register</button>
                <button type="button" onClick={() => setText("")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Clear</button>
                <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">
                  Open CSV / TXT…
                  <input type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                </label>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                spellCheck={false}
                rows={20}
                aria-label="IP address register"
                placeholder={"Device,IP address,Subnet mask,Gateway,MAC address,VLAN\nP132_Q01,10.13.0.14,255.255.255.128,10.13.0.1,00-21-C1-11-00-04,1"}
                className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none"
              />
              <p className="mt-2 text-xs text-muted">
                First line = column headings. In Excel, select the table and copy — paste here directly (tab separated). Columns recognised: {Object.keys(r.columns).join(", ") || "none yet"}.
              </p>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            <div className={`rounded-xl border p-5 ${r.counts.error ? "border-fail/50 bg-fail/10 text-fail" : r.counts.warning ? "border-accent/50 bg-accent/10 text-accent" : "border-pass/50 bg-pass/10 text-pass"}`}>
              <div className="text-xs uppercase tracking-wide opacity-80">Result</div>
              <div className="mt-1 text-lg font-semibold">
                {r.rows.length === 0 ? "Paste a register to check" : r.counts.error ? `${r.counts.error} error${r.counts.error > 1 ? "s" : ""} to correct` : r.counts.warning ? `No errors — ${r.counts.warning} warning${r.counts.warning > 1 ? "s" : ""} to review` : "Register is consistent"}
              </div>
              <div className="mt-2 text-sm text-foreground">{r.rows.length} devices · {r.counts.error} errors · {r.counts.warning} warnings · {r.counts.info} notes</div>
            </div>

            {r.subnets.length > 0 && (
              <ResultCard title="Subnets in the register">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted"><th className="py-1 pr-3">Subnet</th><th className="py-1 pr-3">Devices</th><th className="py-1 pr-3">VLAN</th><th className="py-1 pr-3">Gateway</th><th className="py-1">Network</th></tr></thead>
                    <tbody>
                      {r.subnets.map((s) => (
                        <tr key={s.cidr} className="border-t border-border text-foreground">
                          <td className="py-1 pr-3 font-mono">{s.cidr}</td>
                          <td className="py-1 pr-3">{s.devices} / {s.subnet.hosts}</td>
                          <td className="py-1 pr-3">{s.vlans.join(", ") || "—"}</td>
                          <td className="py-1 pr-3 font-mono">{s.gateways.join(", ") || "—"}</td>
                          <td className="py-1">{s.networks.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResultCard>
            )}

            {r.findings.length > 0 && (
              <ResultCard title="Findings">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {(["all", "error", "warning", "info"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-accent text-accent" : "border-border text-muted"}`}>
                      {k === "all" ? `All (${r.findings.length})` : `${SEV_LABEL[k]} (${r.counts[k]})`}
                    </button>
                  ))}
                  <button type="button" onClick={exportCsv} className="ml-auto rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export findings CSV</button>
                </div>
                <ul className="space-y-2">
                  {shown.map((f, i) => (
                    <li key={i} className="text-sm">
                      <span className={`mr-2 text-xs font-semibold uppercase ${SEV_STYLE[f.sev]}`}>{SEV_LABEL[f.sev]}</span>
                      <span className="mr-2 font-mono text-xs text-muted">line {f.lines.join(", ")}</span>
                      <span className="text-foreground">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </ResultCard>
            )}
            {r.rows.length > 0 && r.findings.length === 0 && (
              <ResultCard title="Findings"><ResultRow label="Checks passed" value="No problems found" /></ResultCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
