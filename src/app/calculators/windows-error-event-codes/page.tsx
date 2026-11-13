"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, TextField } from "@/components/fields";
import { searchCodes, TAGS, CODES } from "@/lib/errorcodes";

export default function ErrorEventCodesPage() {
  const [q, setQ] = useState("10061");
  const [tag, setTag] = useState("");
  const res = useMemo(() => searchCodes(q, tag), [q, tag]);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Windows Error &amp; Event Code Explainer for SCADA Engineers</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Type an error number (10060, 0x80070005, 1789), an event ID (7031, 1129, 4625) or a word, and get its meaning in plain language with the
          typical causes on a SCADA system and what to check — covering network, time, domain logon, services, disks, DCOM/OPC DA and TLS.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Windows Error & Event Code Explainer" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="SCADA servers, historians and engineering workstations run on Windows, and their problems first appear as an error number or an event ID. Knowing that 10060 means 'no answer at all' while 10061 means 'answered but nothing listening', or that event 1129 at logon is a network-at-boot problem, points straight to the cause."
            standards={["Microsoft Win32, HRESULT and Windows Sockets error codes", "Windows event IDs: Service Control Manager, Kernel-Power, disk, Time-Service, GroupPolicy, NETLOGON, DistributedCOM, Schannel, Security auditing", "Kerberos (RFC 4120) error codes"]}
            capabilities={[
              `${CODES.length} entries, each with the meaning, typical causes on a SCADA system and what to check.`,
              "Search by number in decimal or hex (a Win32 code entered as 0x8007xxxx is found too), by symbolic name or by word.",
              "Filter by area: network, time, domain logon, services and crashes, disk, DCOM/OPC DA, TLS, security, hardware.",
            ]}
            example={{
              problem: "An IEC 104 client in the control centre logs 'connect failed, error 10061' for one RTU, and 10060 for another.",
              steps: [
                "10061 (connection refused): the RTU answered but nothing listens on TCP 2404 — service off, wrong port, or client limit reached.",
                "10060 (timed out): the other RTU never answered — off, unreachable, or a firewall drops the packets.",
              ],
              result: "Two different faults: check the IEC 104 server settings on the first RTU, and the path and firewall to the second.",
            }}
            notes="The list covers the codes most often met on SCADA hosts; it is not the complete Microsoft list. The event text and Microsoft's documentation remain the reference."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-1">
            <Section title="Search">
              <TextField label="Code, event ID or word" placeholder="10060, 0x80070005, 7031, time" value={q} onChange={setQ} />
              <div className="mt-3 flex flex-wrap gap-2">
                {TAGS.map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setTag(k)} className={`rounded-full border px-3 py-1 text-xs ${tag === k ? "border-accent text-accent" : "border-border text-muted"}`}>{l}</button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">{res.length} of {CODES.length} entries.</p>
            </Section>
          </div>
          <div className="space-y-4 lg:col-span-3">
            {res.length === 0 && <div className="rounded-xl border border-border bg-surface p-5 text-muted">No entry found. Try the number without leading zeros, or a word from the message.</div>}
            {res.slice(0, 60).map((e) => (
              <article key={e.kind + e.codes.join()} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded bg-accent-2/15 px-2 py-0.5 font-mono text-xs text-accent-2">{e.codes.join(" · ")}</span>
                  <span className="text-xs text-muted">{e.kind} · {e.source}</span>
                </div>
                <h2 className="mt-2 text-base font-semibold text-foreground">{e.title}</h2>
                <p className="mt-1 text-sm text-foreground">{e.meaning}</p>
                <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-muted">Typical causes</div><ul className="mt-1 list-disc space-y-1 pl-5 text-foreground">{e.causes.map((c) => <li key={c}>{c}</li>)}</ul></div>
                  <div><div className="text-xs font-semibold uppercase tracking-wide text-muted">What to check</div><ul className="mt-1 list-disc space-y-1 pl-5 text-foreground">{e.check.map((c) => <li key={c}>{c}</li>)}</ul></div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
