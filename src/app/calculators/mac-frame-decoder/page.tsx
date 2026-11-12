"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, ResultRow, TextField } from "@/components/fields";
import { decodeMac, decodeFrame, parseHex, parseOui, lookupOui, SAMPLE_FRAME, type Finding } from "@/lib/macdecoder";

const SEV: Record<Finding["sev"], [string, string]> = { error: ["Problem", "text-fail"], warning: ["Check", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const hex4 = (n: number) => n.toString(16).toUpperCase().padStart(4, "0");

function Findings({ list }: { list: Finding[] }) {
  if (!list.length) return null;
  return (
    <ul className="space-y-2">
      {list.map((f, i) => (
        <li key={i}>
          <span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span>
          <span className="text-foreground">{f.text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MacFrameDecoderPage() {
  const [mac, setMac] = useState("01-0C-CD-01-00-11");
  const [hex, setHex] = useState(SAMPLE_FRAME);
  const [reg, setReg] = useState<Map<string, string> | null>(null);
  const [regName, setRegName] = useState("");
  const m = useMemo(() => decodeMac(mac), [mac]);
  const bytes = useMemo(() => parseHex(hex), [hex]);
  const f = useMemo(() => (bytes ? decodeFrame(bytes) : null), [bytes]);
  const vendor = (x: string) => (reg ? lookupOui(reg, x) ?? "not in the registry file" : "open the IEEE registry file to look it up");

  const onFile = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      const map = parseOui(String(r.result || ""));
      setReg(map);
      setRegName(`${file.name} · ${map.size.toLocaleString()} prefixes`);
    };
    r.readAsText(file);
  };

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">MAC Address &amp; Ethernet Frame Decoder (GOOSE, SV, PTP, PRP)</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Paste a MAC address to see what it is — an IEC 61850 GOOSE or sampled-value multicast, PTP, spanning tree, PRP/HSR supervision, IP
          multicast or a device&apos;s own address — or paste the start of a frame from Wireshark to decode the VLAN tag, priority, EtherType, APPID
          and the GOOSE or SV header, with range checks against IEC 61850.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <FeedbackButton calculatorName="MAC Address & Ethernet Frame Decoder" />
        </div>
        <div className="mt-6">
          <InfoPanel
            purpose="Substation networks carry several kinds of Layer 2 traffic that look alike in a switch table or a capture. The destination MAC address and the EtherType tell you what a frame is, whether switches will flood it, and whether it is in the address range IEC 61850 recommends. This decoder reads both and explains them in plain language."
            standards={["IEC 61850-8-1 (GOOSE) and IEC 61850-9-2 (sampled values) multicast and APPID ranges", "IEEE 802.1Q VLAN tag and priority", "IEEE 1588 / IEC 61850-9-3 PTP, IEC 62439-3 PRP/HSR, IEC 62439-2 MRP, IEEE 802.1D/AB", "IEEE registration authority OUI registry (opened by you)"]}
            capabilities={[
              "Classifies any MAC address: broadcast, multicast or unicast; locally administered or manufacturer-assigned; and the protocol behind well-known multicast addresses.",
              "Decodes a frame header from hex or a Wireshark hex dump: destination, source, VLAN ID, priority, EtherType, HSR tag and PRP trailer.",
              "For GOOSE and SV: APPID with range check, length, the Edition 2 simulation bit, and the PDU fields (gocbRef, time allowed to live, data set, goID, time stamp, stNum, sqNum, confRev, entries; svID, smpCnt, smpSynch).",
              "Looks up the manufacturer from the IEEE OUI registry file you download and open; nothing is uploaded.",
            ]}
            example={{
              problem: "The sample frame: 01 0c cd 01 00 11 … 81 00 80 0a 88 b8 00 11 …",
              steps: [
                "Destination 01-0C-CD-01-00-11: IEC 61850 GOOSE multicast, inside the recommended range.",
                "81 00 = VLAN tag; 80 0a = priority 4, VLAN 10.",
                "88 b8 = GOOSE; APPID 0011, inside 0000–3FFF.",
                "PDU: gocbRef P132_Q01PROT/LLN0$GO$GCB_TRIP, time allowed to live 2000 ms, stNum 5, sqNum 0, confRev 1, 4 entries.",
              ],
              result: "A correctly addressed, tagged trip GOOSE at its first transmission after a change (sqNum 0).",
            }}
            notes="The decoder reads what you paste; it does not capture traffic. In Wireshark, select a frame and use Copy → as Hex Dump (or …as Hex Stream) to paste it here."
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <Section title="MAC address">
              <TextField label="MAC address" placeholder="01-0C-CD-01-00-11" tip="Any format: 01-0C-CD-01-00-11, 01:0c:cd:01:00:11 or 010c.cd01.0011." value={mac} onChange={setMac} />
            </Section>
            {m ? (
              <ResultCard title="What this address is">
                <ResultRow label="Normalised" value={<span className="font-mono">{m.mac}</span>} />
                <ResultRow label="Type" value={m.kind === "unicast" ? (m.local ? "Unicast, locally administered" : "Unicast, manufacturer-assigned") : m.kind === "multicast" ? "Multicast" : "Broadcast"} />
                {m.traffic && <ResultRow label="Carries" value={m.traffic} />}
                {m.standard && <ResultRow label="Defined by" value={m.standard} />}
                {m.kind === "unicast" && !m.local && <ResultRow label={`Manufacturer (OUI ${m.oui})`} value={vendor(m.mac)} />}
                <ul className="mt-3 list-disc space-y-1 pl-5 text-foreground">{m.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </ResultCard>
            ) : (
              <ResultCard title="What this address is"><p className="text-fail">Enter six pairs of hex digits.</p></ResultCard>
            )}
            <Section title="Manufacturer lookup (optional)">
              <p className="text-sm text-muted">
                Download the IEEE registry once from{" "}
                <a className="text-accent-2 hover:underline" href="https://standards-oui.ieee.org/oui/oui.csv" target="_blank" rel="noopener">standards-oui.ieee.org/oui/oui.csv</a>{" "}
                (or oui.txt) and open it here. It is read in your browser and kept only while this page is open.
              </p>
              <label className="mt-3 inline-block cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">
                Open IEEE OUI file…
                <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
              {regName && <p className="mt-2 text-xs text-pass">{regName}</p>}
            </Section>
          </div>

          <div className="space-y-6">
            <Section title="Frame (hex)">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setHex(SAMPLE_FRAME)} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Load sample GOOSE</button>
                <button type="button" onClick={() => setHex("")} className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent">Clear</button>
              </div>
              <textarea value={hex} onChange={(e) => setHex(e.target.value)} rows={8} spellCheck={false} aria-label="Frame bytes in hex" placeholder="01 0c cd 01 00 11 … or a Wireshark hex dump" className="mt-3 w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs text-foreground focus:border-accent focus:outline-none" />
              <p className="mt-1 text-xs text-muted">At least the first 14 bytes (destination, source, EtherType). Paste the whole frame to decode the GOOSE or SV fields.</p>
            </Section>
            {f ? (
              <>
                <ResultCard title="Ethernet header">
                  <ResultRow label="Destination" value={<span className="font-mono">{f.dst.mac}</span>} />
                  <ResultRow label="Destination carries" value={f.dst.traffic ?? (f.dst.kind === "unicast" ? "a single device (unicast)" : "multicast, not in the common list")} />
                  <ResultRow label="Source" value={<span className="font-mono">{f.src.mac}</span>} />
                  {f.src.kind === "unicast" && !f.src.local && <ResultRow label="Source manufacturer" value={vendor(f.src.mac)} />}
                  <ResultRow label="VLAN tag" value={f.vlan ? `VLAN ${f.vlan.vid}, priority ${f.vlan.pcp}${f.vlan.dei ? ", drop eligible" : ""}` : "none (untagged)"} />
                  <ResultRow label="EtherType" value={`0x${hex4(f.ethertype)} · ${f.ethertypeName}`} />
                  {f.iec && <ResultRow label="APPID / length" value={`${hex4(f.iec.appid)} / ${f.iec.length} bytes`} />}
                  {f.iec && <ResultRow label="Reserved 1 / 2" value={`0x${hex4(f.iec.reserved1)} / 0x${hex4(f.iec.reserved2)}${f.iec.simulation ? " (simulation)" : ""}`} />}
                  <ResultRow label="Bytes pasted" value={String(f.byteCount)} />
                </ResultCard>
                {f.pdu.length > 0 && (
                  <ResultCard title={f.ethertype === 0x88b8 ? "GOOSE PDU" : "Sampled-value PDU"}>
                    {f.pdu.map((x, i) => <ResultRow key={i} label={x.name} value={<span className="break-all font-mono text-xs">{x.value}</span>} />)}
                  </ResultCard>
                )}
                <ResultCard title="Checks"><Findings list={f.findings} /></ResultCard>
              </>
            ) : (
              hex.trim() && <ResultCard title="Ethernet header"><p className="text-fail">Paste at least 14 bytes of hex.</p></ResultCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
