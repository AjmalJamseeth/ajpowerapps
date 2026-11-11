"use client";

import { useMemo } from "react";
import { useShareableInput } from "@/lib/shareState";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { TextField, SelectField, Section, ResultCard, ResultRow } from "@/components/fields";
import { calcScadaConnect, DEFAULT_SCADA_CONNECT_INPUT, SERVICES, type ScadaConnectInput, type ServiceKey, type EndpointIn } from "@/lib/scadaconnect";
import { ipStr, cidr } from "@/lib/ipv4";

const VERDICT_STYLE: Record<string, string> = {
  direct: "border-pass/50 bg-pass/10 text-pass",
  routed: "border-accent/50 bg-accent/10 text-accent",
  "one-way": "border-fail/50 bg-fail/10 text-fail",
  no: "border-fail/50 bg-fail/10 text-fail",
};
const SEV_STYLE: Record<string, string> = { error: "text-fail", warning: "text-accent", info: "text-accent-2", ok: "text-pass" };
const SEV_LABEL: Record<string, string> = { error: "Problem", warning: "Check", info: "Next step", ok: "OK" };
const HOW: Record<string, string> = { local: "directly on the LAN", gateway: "through its default gateway", "no-route": "— no route (no gateway)" };

export default function ScadaConnectivityPage() {
  const [input, setInput] = useShareableInput<ScadaConnectInput>(DEFAULT_SCADA_CONNECT_INPUT);
  const upd = (side: "a" | "b", patch: Partial<EndpointIn>) => setInput((p) => ({ ...p, [side]: { ...p[side], ...patch } }));
  const r = useMemo(() => calcScadaConnect(input), [input]);
  const A = input.aName || "Laptop", B = input.bName || "IED";

  const side = (s: "a" | "b", title: string) => (
    <Section title={title}>
      <TextField label="Name" value={s === "a" ? input.aName : input.bName} onChange={(v) => setInput((p) => ({ ...p, [s === "a" ? "aName" : "bName"]: v }))} />
      <TextField label="IP address" placeholder="10.13.0.14" tip="The IPv4 address set on this device's network adapter." value={input[s].ip} onChange={(v) => upd(s, { ip: v })} />
      <TextField label="Subnet mask" placeholder="255.255.255.0 or /24" tip="The subnet mask (or prefix length) set on this device. Each device decides with its OWN mask whether the other is on the same LAN." value={input[s].mask} onChange={(v) => upd(s, { mask: v })} />
      <TextField label="Default gateway" placeholder="leave empty if none" tip="The router this device sends traffic to when the destination is outside its own subnet. Leave empty if none is configured." value={input[s].gateway} onChange={(v) => upd(s, { gateway: v })} />
    </Section>
  );

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SCADA Connectivity Assistant — Can My Laptop Talk to the IED?</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Enter the IP address, subnet mask and gateway of your laptop (or SCADA server) and of the IED. The assistant checks the addressing
          from both sides and tells you in plain language whether they can talk directly, only through a router, or not at all — and what
          to change.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="SCADA Connectivity Assistant" standardsLine="IPv4 addressing (RFC 791, RFC 950, RFC 1918, RFC 3927)" />
          <FeedbackButton calculatorName="SCADA Connectivity Assistant" />
        </div>
        <div className="mt-6">
          <InfoPanel
            purpose="Diagnoses the most common reason a laptop, engineering PC or SCADA server cannot reach an IED, RTU or gateway: IP addressing. Each device decides on its own, using its own subnet mask, whether the other device is on the same LAN (send directly) or on another network (send to its default gateway). The assistant repeats that decision for both devices, so it also finds the confusing one-way cases caused by different masks."
            standards={["IPv4 addressing and subnetting (RFC 791, RFC 950)", "Private address ranges (RFC 1918) and link-local addresses (RFC 3927)", "Well-known service ports: IEC 61850 MMS TCP 102, IEC 60870-5-104 TCP 2404, DNP3 TCP 20000, Modbus TCP 502"]}
            capabilities={[
              "Validates both addresses, masks (dotted or /prefix) and gateways.",
              "Decides from each side whether the other device is local or must be reached through the gateway.",
              "Finds duplicate addresses, network or broadcast addresses used by a device, link-local (169.254.x.x) addresses, gateways outside their own subnet, and mask mismatches that make traffic one-way.",
              "Suggests a laptop address in the IED's subnet, and the service port to test next (MMS, IEC 104, DNP3, Modbus, HTTP/HTTPS, SSH).",
            ]}
            example={{
              problem: "Laptop 10.13.0.200 / 255.255.255.0, no gateway. IED 10.13.0.14 / 255.255.255.128, gateway 10.13.0.1.",
              steps: [
                "Laptop: 10.13.0.14 is inside its subnet 10.13.0.0/24 → sends directly.",
                "IED: 10.13.0.200 is outside its subnet 10.13.0.0/25 (.0–.127) → sends its reply to gateway 10.13.0.1.",
                "The two sides disagree: requests arrive, replies go to the router and are usually lost.",
              ],
              result: "Mask mismatch (one-way). Set the laptop to an address inside 10.13.0.0/25, for example 10.13.0.117 / 255.255.255.128.",
            }}
            notes="The assistant checks addressing only. Cabling, switch-port VLANs, firewalls and whether the IED answers ping are listed as next steps."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            {side("a", "Laptop / SCADA server")}
            {side("b", "IED / RTU / gateway")}
            <Section title="Service to test next">
              <SelectField<ServiceKey>
                label="Protocol"
                value={input.service}
                onChange={(v) => setInput((p) => ({ ...p, service: v }))}
                options={(Object.keys(SERVICES) as ServiceKey[]).map((k) => ({ value: k, label: `${SERVICES[k].label}${SERVICES[k].port !== "—" ? " — " + SERVICES[k].port : ""}` }))}
              />
            </Section>
          </div>
          <div className="lg:col-span-2">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className={`rounded-xl border p-5 ${r.verdict ? VERDICT_STYLE[r.verdict] : "border-border bg-surface text-muted"}`}>
                <div className="text-xs uppercase tracking-wide opacity-80">Result</div>
                <div className="mt-1 text-lg font-semibold">{r.headline}</div>
                {r.verdict && r.aSeesB && r.bSeesA && (
                  <div className="mt-3 space-y-1 text-sm text-foreground">
                    <div>{A} → {B}: {HOW[r.aSeesB]}</div>
                    <div>{B} → {A}: {HOW[r.bSeesA]}</div>
                  </div>
                )}
              </div>
              {r.a && r.b && (
                <ResultCard title="Subnets">
                  <ResultRow label={`${A} subnet`} value={cidr(r.a.subnet)} />
                  <ResultRow label={`${A} usable range`} value={`${ipStr(r.a.subnet.firstHost)} – ${ipStr(r.a.subnet.lastHost)}`} />
                  <ResultRow label={`${B} subnet`} value={cidr(r.b.subnet)} />
                  <ResultRow label={`${B} usable range`} value={`${ipStr(r.b.subnet.firstHost)} – ${ipStr(r.b.subnet.lastHost)}`} />
                </ResultCard>
              )}
              {r.findings.length > 0 && (
                <ResultCard title="Why">
                  <ul className="space-y-2">
                    {r.findings.map((f, i) => (
                      <li key={i}>
                        <span className={`mr-2 text-xs font-semibold uppercase ${SEV_STYLE[f.sev]}`}>{SEV_LABEL[f.sev]}</span>
                        <span className="text-foreground">{f.text}</span>
                      </li>
                    ))}
                  </ul>
                </ResultCard>
              )}
              {r.fixes.length > 0 && (
                <ResultCard title="What to change">
                  <ul className="list-disc space-y-1.5 pl-5 text-foreground">
                    {r.fixes.map((x, i) => <li key={i}>{x}</li>)}
                  </ul>
                </ResultCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
