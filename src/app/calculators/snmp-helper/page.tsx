"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow, TextField, SelectField } from "@/components/fields";
import { decodeOid, analyseWalk, compareWalks, SAMPLE_WALK, SAMPLE_WALK_2, v3Advice, OIDS, type SecLevel } from "@/lib/snmphelper";

const SEV: Record<string, [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const ST: Record<number, string> = { 1: "up", 2: "down", 3: "testing", 5: "dormant", 6: "not present", 7: "lower layer down" };

export default function SnmpHelperPage() {
  const [oid, setOid] = useState("1.3.6.1.2.1.2.2.1.14.4");
  const [walk, setWalk] = useState(SAMPLE_WALK);
  const [walk2, setWalk2] = useState("");
  const [secs, setSecs] = useState("");
  const [lvl, setLvl] = useState<SecLevel>("authPriv");
  const [auth, setAuth] = useState("SHA");
  const [priv, setPriv] = useState("AES-128");
  const d = useMemo(() => decodeOid(oid), [oid]);
  const w = useMemo(() => analyseWalk(walk), [walk]);
  const dl = useMemo(() => (walk2.trim() ? compareWalks(walk, walk2, Number(secs) || 0) : null), [walk, walk2, secs]);
  const adv = useMemo(() => v3Advice(lvl, auth, priv), [lvl, auth, priv]);
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">SNMP Helper — OID Decoder, snmpwalk Analyser, SNMPv3</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Understand SNMP without a network background: decode an OID, paste an snmpwalk from a switch to get a port table with errors, duplex
          problems and down links, and check SNMPv3 security settings before configuring the switch and the management system.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="SNMP Helper" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Substation switches, clocks, firewalls and servers report their health through SNMP, but the raw output is a list of numbers. Reading the right counters — errors, discards, duplex, link state, spanning-tree changes — shows most cabling and port problems without waiting for the network team."
            standards={["SNMPv2-MIB, IF-MIB (RFC 2863), EtherLike-MIB (RFC 3635)", "BRIDGE-MIB (RFC 4188), Q-BRIDGE-MIB (RFC 4363), LLDP-MIB (IEEE 802.1AB)", "ENTITY-MIB (RFC 6933), HOST-RESOURCES-MIB (RFC 2790)", "SNMPv3 USM (RFC 3414), AES (RFC 3826), SHA-2 (RFC 7860)"]}
            capabilities={[
              `OID decoder for ${OIDS.length} common objects with plain-language meaning, plus vendor identification of private OIDs.`,
              "snmpwalk analyser (named or numeric output): system information, port table, LLDP neighbours, and findings for down links, CRC errors, duplex mismatch, 10 Mb/s links, discards and spanning-tree changes.",
              "Two readings: paste a second walk of the same switch taken some minutes later to see which counters are still rising — new errors, discards, late collisions and link changes per port — and the average traffic and utilisation from the 64-bit octet counters.",
              "SNMPv3 checker: security level, authentication and privacy protocols, and what both ends must match.",
            ]}
            example={{
              problem: "The sample walk of switch SW2: port 4 (BCU_J01) shows 1843 input errors, half duplex, 37 late collisions and 10 Mb/s.",
              steps: ["Half duplex with late collisions is a duplex mismatch.", "10 Mb/s on an IED port means negotiation failed or a cable pair is damaged.", "The CRC errors follow from the mismatch."],
              result: "Set the switch port and the IED to auto-negotiation (or both to 100 Mb/s full duplex) and re-check the counters after some minutes.",
            }}
            notes="Get a walk with the switch's management tool or a command such as snmpwalk -v2c -c <community> <switch IP> 1.3.6.1.2.1 (read-only). Counters are totals since the last reset, so a single reading cannot tell an old fault from an active one: take a second reading 5–15 minutes later and paste it as the second reading. The interval is taken from sysUpTime in both readings (or enter it). Rate = change of the counter ÷ interval; utilisation = octets × 8 ÷ interval ÷ port speed, an average — peaks are higher."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Section title="OID decoder">
              <TextField label="OID" placeholder="1.3.6.1.2.1.2.2.1.8.3" value={oid} onChange={setOid} />
            </Section>
            <ResultCard title={d.def ? d.def.name : "OID"}>
              {d.def && <ResultRow label="MIB" value={d.def.mib} />}
              {d.def && <ResultRow label="Meaning" value={d.def.desc} />}
              {d.enterprise && <ResultRow label="Vendor" value={d.enterprise} />}
              <p className="mt-2 text-sm text-foreground">{d.note}</p>
            </ResultCard>
            <Section title="SNMPv3 settings">
              <SelectField<SecLevel> label="Security level" value={lvl} onChange={setLvl} options={[{ value: "authPriv", label: "authPriv — authentication and encryption" }, { value: "authNoPriv", label: "authNoPriv — authentication only" }, { value: "noAuthNoPriv", label: "noAuthNoPriv — neither" }]} />
              <SelectField<string> label="Authentication" value={auth} onChange={setAuth} options={["MD5", "SHA", "SHA-224", "SHA-256", "SHA-384", "SHA-512"].map((x) => ({ value: x, label: x }))} />
              <SelectField<string> label="Privacy" value={priv} onChange={setPriv} options={["DES", "AES-128", "AES-192", "AES-256"].map((x) => ({ value: x, label: x }))} />
            </Section>
            <ResultCard title="SNMPv3 assessment">
              <ul className="space-y-2">{adv.map((a, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[a.sev][1]}`}>{SEV[a.sev][0]}</span><span className="text-foreground">{a.text}</span></li>)}</ul>
              <p className="mt-3 text-xs text-muted">Polls use UDP 161 to the device; traps and informs use UDP 162 to the management system. Use SNMPv3 or, if v2c is unavoidable, a non-default read-only community restricted to the management system&apos;s address.</p>
            </ResultCard>
          </div>
          <div className="space-y-6">
            <Section title="snmpwalk output">
              <div className="flex gap-2">
                <button type="button" onClick={() => setWalk(SAMPLE_WALK)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample switch</button>
                <button type="button" onClick={() => setWalk("")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Clear</button>
              </div>
              <textarea value={walk} onChange={(e) => setWalk(e.target.value)} rows={12} spellCheck={false} aria-label="snmpwalk output" className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground" />
            </Section>
            <Section title="Second reading (optional)">
              <div className="flex flex-wrap items-end gap-2">
                <button type="button" onClick={() => { setWalk(SAMPLE_WALK); setWalk2(SAMPLE_WALK_2); }} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample second reading</button>
                <button type="button" onClick={() => setWalk2("")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Clear</button>
                <div className="w-44"><TextField label="Interval s (if no sysUpTime)" value={secs} onChange={setSecs} placeholder="300" /></div>
              </div>
              <textarea value={walk2} onChange={(e) => setWalk2(e.target.value)} rows={5} spellCheck={false} aria-label="second snmpwalk output" placeholder="Paste a walk of the same switch taken some minutes after the first one" className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground" />
            </Section>
            {dl && (
              <ResultCard title={`Change between the readings${dl.seconds ? ` (${Math.round(dl.seconds)} s, from ${dl.source === "sysUpTime" ? "sysUpTime" : "the entered interval"})` : ""}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted"><th className="py-1 pr-2">Port</th><th className="py-1 pr-2">New in err</th><th className="py-1 pr-2">New out disc</th><th className="py-1 pr-2">In Mb/s</th><th className="py-1 pr-2">Out Mb/s</th><th className="py-1">Util %</th></tr></thead>
                    <tbody>{dl.rows.map((r) => (
                      <tr key={r.index} className="border-t border-border text-foreground">
                        <td className="py-1 pr-2 font-mono text-xs">{r.name || r.index}{r.alias ? ` · ${r.alias}` : ""}</td>
                        <td className={`py-1 pr-2 font-mono ${r.dInErr ? "text-fail" : ""}`}>{r.dInErr ?? "—"}</td>
                        <td className={`py-1 pr-2 font-mono ${r.dOutDisc ? "text-accent" : ""}`}>{r.dOutDisc ?? "—"}</td>
                        <td className="py-1 pr-2 font-mono">{r.inMbps != null ? r.inMbps.toFixed(2) : "—"}</td>
                        <td className="py-1 pr-2 font-mono">{r.outMbps != null ? r.outMbps.toFixed(2) : "—"}</td>
                        <td className={`py-1 font-mono ${r.utilPct != null && r.utilPct >= 70 ? "text-fail" : ""}`}>{r.utilPct != null ? r.utilPct.toFixed(1) : "—"}</td>
                      </tr>))}</tbody>
                  </table>
                </div>
                <ul className="mt-3 space-y-2">{dl.findings.map((f, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
              </ResultCard>
            )}
            {w.sys.length > 0 && <ResultCard title="Device">{w.sys.map((s) => <ResultRow key={s.label} label={s.label} value={s.value} />)}</ResultCard>}
            {w.ifs.length > 0 && (
              <ResultCard title="Ports">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted"><th className="py-1 pr-2">Port</th><th className="py-1 pr-2">Description</th><th className="py-1 pr-2">Speed</th><th className="py-1 pr-2">State</th><th className="py-1 pr-2">In err</th><th className="py-1 pr-2">Out disc</th><th className="py-1">Duplex</th></tr></thead>
                    <tbody>{w.ifs.map((r) => (
                      <tr key={r.index} className="border-t border-border text-foreground">
                        <td className="py-1 pr-2 font-mono text-xs">{r.name || r.index}</td><td className="py-1 pr-2">{r.alias}</td>
                        <td className="py-1 pr-2">{r.speedMb != null ? `${r.speedMb} Mb/s` : "—"}</td>
                        <td className={`py-1 pr-2 ${r.admin === 1 && r.oper === 2 ? "text-accent" : ""}`}>{r.admin === 2 ? "shut down" : r.oper != null ? ST[r.oper] ?? r.oper : "—"}</td>
                        <td className={`py-1 pr-2 font-mono ${Math.max(r.inErr, r.fcs) > 0 ? "text-fail" : ""}`}>{Math.max(r.inErr, r.fcs)}</td>
                        <td className="py-1 pr-2 font-mono">{r.outDisc}</td>
                        <td className={`py-1 ${r.duplex === 2 ? "text-fail" : ""}`}>{r.duplex === 3 ? "full" : r.duplex === 2 ? "half" : "—"}</td>
                      </tr>))}</tbody>
                  </table>
                </div>
              </ResultCard>
            )}
            {w.lldp.length > 0 && <ResultCard title="LLDP neighbours">{w.lldp.map((l) => <ResultRow key={l.local} label={`Local port ${l.local}`} value={`${l.name} ${l.port}`} />)}</ResultCard>}
            <ResultCard title="Findings">
              <ul className="space-y-2">{w.findings.map((f, i) => <li key={i}><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
              {w.findings.length === 0 && <p className="text-muted">Paste a walk that includes the IF-MIB interface table.</p>}
              {w.unknown > 0 && <p className="mt-2 text-xs text-muted">{w.unknown} line(s) with OIDs outside the common list were skipped.</p>}
            </ResultCard>
          </div>
        </div>
      </div>
    </div>
  );
}
