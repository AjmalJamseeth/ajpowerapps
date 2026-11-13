"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow, TextField } from "@/components/fields";
import { explain, detect, COMMANDS, type CommandKey, type Sev } from "@/lib/cmdexplain";
import { CMD_SAMPLES } from "@/lib/cmdsamples";

const SEV: Record<Sev, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };

export default function CommandOutputExplainerPage() {
  const [text, setText] = useState(CMD_SAMPLES.ipconfig);
  const [mode, setMode] = useState<CommandKey | "auto">("auto");
  const [target, setTarget] = useState("10.20.4.10");
  const key = mode === "auto" ? detect(text) : mode;
  const r = useMemo(() => (text.trim() ? explain(text, key, target) : null), [text, key, target]);
  const copy = (c: string) => { try { navigator.clipboard.writeText(c); } catch { /* ignore */ } };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Command Output Explainer — ipconfig, ping, route, netstat, w32tm</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Paste the output of a Windows network or time command and get it explained line by line in plain language: what it shows, what is
          wrong, and what to do next. Written for SCADA and commissioning engineers who are asked to &ldquo;send the ipconfig&rdquo; and want to
          understand it first.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Command Output Explainer" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Most communication problems on site can be diagnosed from a handful of standard Windows commands. The output is hard to read if you do not work with networks every day, so the problem is escalated and waits. This tool reads the output for you, explains each part and flags the faults it shows, so you can fix the common cases yourself or escalate with the right evidence."
            standards={["IPv4 addressing and routing (RFC 791, RFC 950, RFC 1122)", "ICMP echo and time exceeded (RFC 792)", "ARP (RFC 826), link-local addresses (RFC 3927)", "NTP (RFC 5905) as used by the Windows Time service"]}
            capabilities={[
              "Recognises the command automatically: ipconfig /all, route print, arp -a, ping, tracert, netstat -ano, w32tm /query /status, w32tm /stripchart, nslookup.",
              "ipconfig: duplicate and link-local addresses, gateways outside the subnet, several default gateways, VPN and Wi-Fi conflicts, overlapping adapters.",
              "route print: which route and adapter Windows really uses for a given address (longest prefix, then lowest metric).",
              "ping and tracert: the real meaning of 'Destination host unreachable', time-outs, loss, TTL and where a path stops.",
              "netstat: SYN_SENT (blocked or closed ports), CLOSE_WAIT leaks, exposed services, SCADA ports by name.",
              "w32tm: not synchronised, local CMOS clock, host time provider, dispersion, measured offset against the station clock.",
            ]}
            example={{
              problem: "ping 10.13.0.17 shows 'Reply from 10.13.0.200: Destination host unreachable' four times, and 'Received = 4, Lost = 0 (0% loss)'.",
              steps: [
                "The replies come from 10.13.0.200 — the laptop itself — not from the IED.",
                "On the local subnet this means no device answered the ARP request for 10.13.0.17.",
                "Windows counts these messages as received, so '0% loss' is misleading.",
              ],
              result: "The IED is off, unplugged, on another VLAN or has a different address. Check the link LED, the switch port VLAN and the IED's front-panel address.",
            }}
            notes="Everything stays in your browser. Remove names or addresses you do not want to share before pasting output into a support ticket."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-2">
            <Section title="Paste the output">
              <div className="flex flex-wrap gap-2">
                <select aria-label="Command" value={mode} onChange={(e) => setMode(e.target.value as CommandKey | "auto")} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground">
                  <option value="auto">Detect automatically</option>
                  {COMMANDS.map((c) => <option key={c.key} value={c.key}>{c.cmd}</option>)}
                </select>
                <button type="button" onClick={() => setText("")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Clear</button>
              </div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={18} spellCheck={false} aria-label="Command output" className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none" />
              {key === "route" && <TextField label="Which route is used for this address?" placeholder="IED address" value={target} onChange={setTarget} />}
            </Section>
            <Section title="Examples and how to run each command">
              <ul className="space-y-2 text-sm">
                {COMMANDS.map((c) => (
                  <li key={c.key} className="rounded-lg border border-border p-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <code className="font-mono text-xs text-foreground">{c.cmd}</code>
                      <span className="flex gap-2">
                        <button type="button" onClick={() => copy(c.cmd)} className="text-xs text-accent-2 hover:underline">Copy</button>
                        <button type="button" onClick={() => { setText(CMD_SAMPLES[c.key]); setMode("auto"); }} className="text-xs text-accent-2 hover:underline">Load example</button>
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{c.what}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">Run them in Command Prompt (Win+R, cmd). To copy the output, select it with the mouse and press Enter, or add <code className="font-mono">| clip</code> to the command.</p>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-3">
            {!r ? (
              <ResultCard title="Result"><p className="text-muted">{text.trim() ? "The output was not recognised. Choose the command in the list, or paste the complete output including its first lines." : "Paste an output or load an example."}</p></ResultCard>
            ) : (
              <>
                <div className="rounded-xl border border-accent-2/40 bg-surface p-5">
                  <div className="text-xs uppercase tracking-wide text-accent-2">{r.command}</div>
                  <div className="mt-1 text-lg font-semibold text-foreground">{r.title}</div>
                  <p className="mt-1 text-sm text-muted">{r.summary}</p>
                </div>
                <ResultCard title="What it says">
                  {r.findings.length ? (
                    <ul className="space-y-2.5">{r.findings.map((f, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
                  ) : <p className="text-muted">Nothing to flag.</p>}
                </ResultCard>
                {r.facts.length > 0 && <ResultCard title="Key values">{r.facts.map((f) => <ResultRow key={f.label} label={f.label} value={f.value} />)}</ResultCard>}
                {r.table && r.table.rows.length > 0 && (
                  <ResultCard title="As read from the output">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-left text-muted">{r.table.headers.map((h) => <th key={h} className="py-1 pr-3">{h}</th>)}</tr></thead>
                        <tbody>{r.table.rows.map((row, i) => <tr key={i} className="border-t border-border text-foreground">{row.map((c, j) => <td key={j} className="py-1 pr-3 font-mono text-xs">{c}</td>)}</tr>)}</tbody>
                      </table>
                    </div>
                  </ResultCard>
                )}
                {r.next.length > 0 && <ResultCard title="Next steps"><ul className="list-disc space-y-1.5 pl-5 text-foreground">{r.next.map((n) => <li key={n}>{n}</li>)}</ul></ResultCard>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
