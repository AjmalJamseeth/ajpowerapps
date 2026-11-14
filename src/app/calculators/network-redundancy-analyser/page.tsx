"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { readCapture, isoT } from "@/lib/pcapnet";
import { eth } from "@/lib/l2cap";
import { analysePrp, analyseHsr, analyseRstp } from "@/lib/redundancy";

const SAMPLES = [["PRP LAN A with RSTP", "/samples/S13_PRP_RSTP_capture.pcap"], ["HSR ring port", "/samples/S13_HSR_ring_capture.pcap"]];

export default function NetworkRedundancyAnalyserPage() {
  const [buf, setBuf] = useState<Uint8Array | null>(null);
  const [name, setName] = useState("");
  const [lan, setLan] = useState<"auto" | "A" | "B">("auto");
  const [life, setLife] = useState("2");
  const [sw, setSw] = useState("");
  const r = useMemo(() => {
    if (!buf) return null;
    try {
      const E = eth(readCapture(buf));
      const known = sw.split(/[\s,;]+/).map((x) => x.trim().toUpperCase().replace(/:/g, "-")).filter(Boolean);
      return { E: E.length, prp: analysePrp(E, lan, Number(life) || 2), hsr: analyseHsr(E), rstp: analyseRstp(E, known), err: "" };
    } catch (e) { return { E: 0, prp: null, hsr: null, rstp: null, err: (e as Error).message }; }
  }, [buf, lan, life, sw]);
  const open = (f?: File) => { if (f) f.arrayBuffer().then((b) => { setBuf(new Uint8Array(b)); setName(f.name); }); };
  const sample = (u: string, l: string) => fetch(u).then((x) => x.arrayBuffer()).then((b) => { setBuf(new Uint8Array(b)); setName("sample: " + l); });
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">PRP, HSR &amp; RSTP Capture Analyser</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Check a substation network&apos;s redundancy from a capture: PRP redundancy trailers and supervision frames (LAN A / B mixing,
          lost frames, wrong LSDU size, nodes without supervision, RedBoxes), HSR tags (circulating frames, gaps) and RSTP BPDUs (root changes,
          topology changes, devices running their own spanning tree).
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="PRP HSR RSTP Capture Analyser" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="PRP and HSR deliver every frame twice, so a broken LAN, a cross-patched cable or a node that is not removing duplicates stays invisible to the applications — until the second path fails too. RSTP rings hide their problems in the same way until a root change or a flapping port floods the network. A capture shows these hidden faults directly."
            standards={["IEC 62439-3 (PRP and HSR: redundancy control trailer, HSR tag, supervision frames, LifeCheckInterval)", "IEEE 802.1Q (RSTP: BPDU format, root bridge, topology change)", "IEC 61850-90-4 (network engineering guidelines for substations)"]}
            capabilities={[
              "PRP: frames per node with their LAN identifier; frames tagged LAN A and LAN B at one capture point (LANs joined); a node's frames all on the wrong LAN (A/B swapped); gaps in each node's sequence numbers on this LAN; LSDU size that does not match the frame; supervision frames, their interval, RedBoxes and the single-attached nodes they represent; nodes without supervision.",
              "HSR: frames per node, the same sequence number passing the port twice (circulating frame), sequence gaps, LSDU size.",
              "RSTP: root bridge and its changes, topology-change flags, legacy STP, devices that send BPDUs claiming to be root (an IED with bridging enabled), BPDUs from devices not in your switch list.",
            ]}
            example={{ problem: "The sample capture on PRP LAN A of the S13 station bus, with RSTP between the switches.", steps: ["GW1's frames all carry LAN B: its LAN B port is patched into the LAN A switch.", "P87T_T1 loses 5 frames on LAN A; BCU_J01 sends one frame with a wrong LSDU size and no supervision frames.", "The root moves from SW1 to SW2 (priority set to 4096 by mistake), and BCU_J01's port sends its own BPDUs."], result: "Five hidden faults that PRP and RSTP were masking, each with the device to look at." }}
            notes="Capture on one LAN (A or B) at a mirror port of a switch; to compare A and B, capture both. A capture point sees only the traffic forwarded to it — mirror an uplink to see more nodes."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="Capture">
              <div className="flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open capture…<input type="file" accept=".pcap,.pcapng,.cap" className="hidden" onChange={(e) => open(e.target.files?.[0])} /></label>
                {SAMPLES.map(([l, u]) => <button key={u} type="button" onClick={() => sample(u, l)} className={btn}>Sample: {l}</button>)}
              </div>
              <p className="mt-2 text-xs text-muted">{name}{r && !r.err ? ` · ${r.E} Ethernet frames` : ""}</p>
            </Section>
            <Section title="Settings">
              <label className="block text-xs text-muted">Captured on
                <select value={lan} onChange={(e) => setLan(e.target.value as "auto" | "A" | "B")} className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground"><option value="auto">PRP LAN: detect</option><option value="A">PRP LAN A</option><option value="B">PRP LAN B</option></select>
              </label>
              <div className="mt-2"><TextField label="PRP LifeCheckInterval (s)" value={life} onChange={setLife} /></div>
              <div className="mt-2"><TextField label="Switch MAC addresses (optional)" tip="BPDUs from any other device are reported." value={sw} onChange={setSw} placeholder="02-AA-00-00-0F-01, …" /></div>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {r?.err && <ResultCard title="Cannot read the file"><p className="text-fail">{r.err}</p></ResultCard>}
            {r?.prp && r.prp.frames > 0 && (
              <ResultCard title={`PRP — LAN ${r.prp.lan} (${r.prp.frames} tagged frames)`}>
                <FindingList list={r.prp.findings} />
                <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Node</th><th className={th}>Frames</th><th className={th}>LAN id</th><th className={th}>Lost</th><th className={th}>Bad size</th><th className={th}>Supervision</th></tr></thead>
                  <tbody>{r.prp.nodes.map((n) => <tr key={n.mac} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{n.mac}{n.redbox ? <span className="text-muted"> · RedBox ({n.vdan.length} VDAN)</span> : null}</td><td className={td}>{n.frames}</td><td className={`${td} ${n.lans.size > 1 || (n.frames && !n.lans.has(r.prp!.lan)) ? "text-fail" : ""}`}>{[...n.lans].join(" + ") || "—"}</td><td className={`${td} ${n.lost ? "text-accent" : ""}`}>{n.lost}</td><td className={`${td} ${n.badSize ? "text-fail" : ""}`}>{n.badSize}</td><td className={`${td} ${n.frames && !n.sup ? "text-accent" : ""}`}>{n.sup ? `${n.sup} (${n.supMode})` : "none"}</td></tr>)}</tbody></table></div>
              </ResultCard>
            )}
            {r?.hsr && r.hsr.frames > 0 && (
              <ResultCard title={`HSR (${r.hsr.frames} tagged frames)`}>
                <FindingList list={r.hsr.findings} />
                <div className="mt-3 overflow-x-auto"><table className="w-full text-sm"><thead><tr><th className={th}>Node</th><th className={th}>Frames</th><th className={th}>Seen twice</th><th className={th}>Lost</th><th className={th}>Path ids</th></tr></thead>
                  <tbody>{r.hsr.nodes.map((n) => <tr key={n.mac} className="border-t border-border text-foreground"><td className={`${td} font-mono`}>{n.mac}</td><td className={td}>{n.frames}</td><td className={`${td} ${n.dup ? "text-fail" : ""}`}>{n.dup}</td><td className={`${td} ${n.lost ? "text-accent" : ""}`}>{n.lost}</td><td className={td}>{[...n.paths].join(", ")}</td></tr>)}</tbody></table></div>
              </ResultCard>
            )}
            {r?.rstp && r.rstp.rows.length > 0 && (
              <ResultCard title={`RSTP (${r.rstp.rows.length} BPDUs)`}>
                <FindingList list={r.rstp.findings} />
                <div className="mt-3 max-h-72 overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Frame</th><th className={th}>Time</th><th className={th}>From</th><th className={th}>Root</th><th className={th}>Cost</th><th className={th}>Role</th><th className={th}>TC</th></tr></thead>
                  <tbody>{r.rstp.rows.map((x) => <tr key={x.no} className="border-t border-border text-foreground"><td className={td}>{x.no}</td><td className={`${td} font-mono`}>{isoT(x.t).slice(11)}</td><td className={`${td} font-mono`}>{x.src}</td><td className={`${td} font-mono`}>{x.root}</td><td className={td}>{x.cost}</td><td className={td}>{x.role}</td><td className={`${td} ${x.tc ? "text-accent" : ""}`}>{x.tc ? "yes" : ""}</td></tr>)}</tbody></table></div>
              </ResultCard>
            )}
            {r && !r.err && r.prp && !r.prp.frames && r.hsr && !r.hsr.frames && r.rstp && !r.rstp.rows.length && <ResultCard title="Result"><p className="text-muted">No PRP, HSR or spanning-tree frames in this capture.</p></ResultCard>}
            {!r && <ResultCard title="Result"><p className="text-muted">Open a capture or load a sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
