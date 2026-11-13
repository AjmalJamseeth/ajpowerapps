"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { TREES, ticketText, type Step } from "@/lib/troubleshoot";

const SEV: Record<string, string> = { error: "border-fail/50 bg-fail/10", warning: "border-accent/50 bg-accent/10", ok: "border-pass/50 bg-pass/10" };
const FIELDS = ["Site / substation", "Device and IP address", "Date and time of the problem", "Reported by"];

export default function TroubleshootingAssistantPage() {
  const [treeId, setTreeId] = useState<string | null>(null);
  const [node, setNode] = useState<string>("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const tree = TREES.find((t) => t.id === treeId) ?? null;
  const start = (id: string) => { const t = TREES.find((x) => x.id === id)!; setTreeId(id); setNode(t.start); setSteps([]); setResult(null); };
  const choose = (label: string, next?: string, res?: string) => {
    if (!tree) return;
    setSteps((s) => [...s, { node, q: tree.nodes[node].q, answer: label }]);
    if (res) setResult(res); else if (next) setNode(next);
  };
  const back = () => {
    if (!steps.length) { setTreeId(null); return; }
    const last = steps[steps.length - 1];
    setSteps(steps.slice(0, -1)); setNode(last.node); setResult(null);
  };
  const ticket = tree && result ? ticketText(tree, steps, result, fields) : "";
  const copy = () => { try { navigator.clipboard.writeText(ticket); } catch { /* ignore */ } };
  const download = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ticket], { type: "text/plain" })); a.download = `ticket-${treeId}.txt`; a.click(); URL.revokeObjectURL(a.href); };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCADA Troubleshooting &amp; Escalation Assistant</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Pick the symptom, answer a few questions, and get the likely cause, what to do yourself and which tool to use. When the fix needs the
          network, IT or security team, the assistant writes the ticket for you — with the checks you made and the evidence to attach — so the
          request is understood the first time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SCADA Troubleshooting & Escalation Assistant" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Support requests from site often wait because they arrive without the basic checks or evidence, and go back and forth. This assistant follows the order an experienced engineer would check things in, tells you what each answer means, and turns the result into a clear request."
            standards={["IPv4, ARP and TCP behaviour (RFC 791, 826, 9293)", "IEC 60870-5-104 link parameters", "IEC 61850-8-1 GOOSE", "Windows Time service, Active Directory and Group Policy behaviour"]}
            capabilities={[
              `${TREES.length} guided checks: no communication with a device, IEC 104 drops, wrong time, slow workstation, logon and domain problems, disk full, GOOSE not received.`,
              "Each answer is explained; each conclusion gives the cause, actions and the tool to use next.",
              "An escalation ticket with site details, the checks made, the likely cause, a precise request and an evidence checklist, ready to copy or download.",
            ]}
            example={{
              problem: "SCADA cannot connect to a bay controller.",
              steps: ["Link LEDs lit → addressing checked → ping times out → no ARP entry for the device."],
              result: "The device does not answer at the Ethernet level: wrong VLAN on a switch port, a different address, or the device is off. The ticket asks the network team to confirm the ports' VLAN and the MAC table entry.",
            }}
            notes="The assistant guides the order of checks; it cannot see your network. Always attach the command outputs it lists."
          />
        </div>

        {!tree ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TREES.map((t) => (
              <button key={t.id} type="button" onClick={() => start(t.id)} className="rounded-xl border border-border bg-surface p-5 text-left transition-colors hover:border-accent-2/60">
                <div className="font-semibold text-foreground">{t.title}</div>
                <p className="mt-2 text-sm text-muted">{t.symptom}</p>
                <span className="mt-3 inline-block text-sm font-semibold text-accent-2">Start →</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">{tree.title}</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={back} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">← Back</button>
                  <button type="button" onClick={() => setTreeId(null)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Other symptom</button>
                </div>
              </div>
              {steps.length > 0 && (
                <ol className="space-y-1 text-sm text-muted">
                  {steps.map((s, i) => <li key={i}>{i + 1}. {s.q} <span className="font-semibold text-foreground">→ {s.answer}</span></li>)}
                </ol>
              )}
              {!result ? (
                <div className="rounded-xl border border-accent-2/40 bg-surface p-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-accent-2">Question {steps.length + 1}</div>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">{tree.nodes[node].q}</h3>
                  <p className="mt-2 text-sm text-muted">{tree.nodes[node].help}</p>
                  <div className="mt-4 flex flex-col gap-2">
                    {tree.nodes[node].options.map((o) => (
                      <button key={o.label} type="button" onClick={() => choose(o.label, o.next, o.result)} className="rounded-lg border border-border px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:border-accent-2/60">{o.label}</button>
                    ))}
                  </div>
                </div>
              ) : (
                (() => { const r = tree.results[result]; return (
                  <div className={`rounded-xl border p-6 ${SEV[r.sev]}`}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted">Likely cause</div>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{r.title}</h3>
                    <p className="mt-2 text-sm text-foreground">{r.cause}</p>
                    <h4 className="mt-4 text-sm font-semibold text-foreground">What to do</h4>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">{r.actions.map((a) => <li key={a}>{a}</li>)}</ul>
                    {r.tools.length > 0 && (<p className="mt-4 text-sm"><span className="text-muted">Tools: </span>{r.tools.map((t, i) => <span key={t.href + t.name}>{i > 0 && " · "}<a href={t.href} className="text-accent-2 hover:underline">{t.name}</a></span>)}</p>)}
                    {r.escalate && <p className="mt-3 text-sm text-foreground"><span className="font-semibold">Escalate to:</span> {r.escalate.to}</p>}
                  </div>
                ); })()
              )}
            </div>
            <div className="space-y-4 lg:col-span-2">
              <div className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-semibold text-foreground">Evidence to collect</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">{tree.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
              </div>
              {result && (
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="font-semibold text-foreground">Ticket</h3>
                  <div className="mt-2 space-y-2">
                    {FIELDS.map((f) => (
                      <label key={f} className="block text-xs text-muted">{f}
                        <input value={fields[f] ?? ""} onChange={(e) => setFields((p) => ({ ...p, [f]: e.target.value }))} className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-foreground" />
                      </label>
                    ))}
                  </div>
                  <textarea readOnly value={ticket} rows={14} aria-label="Ticket text" className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground" />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={copy} className="rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-background">Copy</button>
                    <button type="button" onClick={download} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Download .txt</button>
                  </div>
                  <p className="mt-2 text-xs text-muted">Replace the &lt;placeholders&gt; in the request with the real values before sending.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
