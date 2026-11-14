// PRP, HSR (IEC 62439-3) and RSTP (IEEE 802.1Q) analysis of a capture.

import { type Eth, prpSup, bpdu } from "./l2cap";

export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string; no?: number }
export interface PrpNode { mac: string; frames: number; lans: Set<string>; lost: number; badSize: number; sup: number; supMode: string; redbox: string | null; vdan: string[]; firstNo: number }
export interface PrpResult { lan: "A" | "B" | "?"; nodes: PrpNode[]; findings: Finding[]; frames: number; plain: number }

export function analysePrp(E: Eth[], lanSel: "A" | "B" | "auto" = "auto", lifeCheck = 2): PrpResult {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
  const nodes = new Map<string, PrpNode & { last: Map<string, number>; supT: number[] }>();
  const get = (m: string, no: number) => { let n = nodes.get(m); if (!n) nodes.set(m, (n = { mac: m, frames: 0, lans: new Set(), lost: 0, badSize: 0, sup: 0, supMode: "", redbox: null, vdan: [], firstNo: no, last: new Map(), supT: [] })); return n; };
  let plain = 0, tagged = 0;
  for (const e of E) {
    const s = prpSup(e);
    if (s) { const n = get(s.node || e.src, e.no); n.sup++; n.supT.push(e.t); n.supMode = s.mode; n.redbox = s.redbox; n.vdan = s.vdan; }
    if (!e.prp) { if (e.etype !== 0x88cc && !e.dst.startsWith("01-80-C2") && !e.hsr) plain++; continue; }
    tagged++;
    const n = get(e.src, e.no);
    n.frames++; n.lans.add(e.prp.lan);
    if (!e.prp.sizeOk) { n.badSize++; if (n.badSize === 1) add("error", `${e.src}: LSDU size ${e.prp.size} in the redundancy trailer does not match the frame (frame ${e.no}). The receiver treats it as a non-PRP frame and duplicates are not discarded.`, e.no); }
    if (s) continue;
    const prev = n.last.get(e.prp.lan);
    if (prev !== undefined) { const gap = (e.prp.seq - prev - 1 + 65536) % 65536; if (gap > 0 && gap < 1000) n.lost += gap; }
    n.last.set(e.prp.lan, e.prp.seq);
  }
  const counts = { A: 0, B: 0 } as Record<string, number>;
  for (const n of nodes.values()) for (const l of n.lans) counts[l] = (counts[l] ?? 0) + n.frames;
  const lan = lanSel !== "auto" ? lanSel : (counts.A ?? 0) >= (counts.B ?? 0) ? "A" : "B";
  if (!tagged) add("info", "No PRP-tagged frames (no redundancy control trailer) in this capture.");
  for (const n of nodes.values()) {
    if (n.lans.size > 1) add("error", `${n.mac} sends frames tagged LAN A and LAN B on the same capture point: LAN A and LAN B are connected together (a cross-patched cable or a switch linking both LANs). PRP then has no independent paths, and duplicates circulate.`, n.firstNo);
    else if (n.frames && !n.lans.has(lan)) add("error", `${n.mac}: all its frames carry LAN ${[...n.lans][0]} on the LAN ${lan} network — its LAN ${[...n.lans][0]} port is patched into the LAN ${lan} switch (A/B swapped).`, n.firstNo);
    if (n.lost) add("warning", `${n.mac}: ${n.lost} frame(s) missing in its sequence on this LAN. PRP hides the loss from applications (the other LAN delivers), but this LAN has a fault — check the port, cable and switch counters.`);
    if (n.frames && !n.sup) add("warning", `${n.mac} sends PRP frames but no supervision frames in this capture. Supervision (every ${lifeCheck} s, to 01-15-4E-00-01-xx) is how the network management sees that both of its LAN connections work.`);
    if (n.sup && n.supT.length > 1) { const gaps = n.supT.slice(1).map((t, i) => t - n.supT[i]); const mx = Math.max(...gaps); if (mx > lifeCheck * 1.5) add("warning", `${n.mac}: supervision frames ${mx.toFixed(1)} s apart (LifeCheckInterval ${lifeCheck} s).`); }
    if (n.redbox) add("info", `RedBox ${n.redbox} represents ${n.vdan.length} single-attached node(s) (VDAN): ${n.vdan.join(", ") || "none listed"}.`);
  }
  if (tagged && plain) add("info", `${plain} frame(s) without a PRP trailer: from single-attached nodes (SAN) or frames that do not need duplication — normal, but SANs on one LAN have no redundancy.`);
  if (tagged && !F.some((f) => f.sev === "error" || f.sev === "warning")) add("ok", `${nodes.size} PRP nodes on LAN ${lan}, sequences continuous, supervision present.`);
  return { lan, nodes: [...nodes.values()].map(({ last, supT, ...n }) => { void last; void supT; return n; }), findings: F, frames: tagged, plain };
}

export interface HsrNode { mac: string; frames: number; dup: number; lost: number; badSize: number; paths: Set<number> }
export function analyseHsr(E: Eth[]): { nodes: HsrNode[]; findings: Finding[]; frames: number } {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
  const m = new Map<string, HsrNode & { seen: Set<number>; last: number | null }>();
  let n0 = 0;
  for (const e of E) {
    if (!e.hsr) continue;
    n0++;
    let n = m.get(e.src);
    if (!n) m.set(e.src, (n = { mac: e.src, frames: 0, dup: 0, lost: 0, badSize: 0, paths: new Set(), seen: new Set(), last: null }));
    n.frames++; n.paths.add(e.hsr.path);
    if (e.hsr.size !== e.payload.length + 6 && e.hsr.size !== e.len - 14) { n.badSize++; if (n.badSize === 1) add("error", `${e.src}: HSR tag LSDU size ${e.hsr.size} does not match the frame (frame ${e.no}).`, e.no); }
    if (n.seen.has(e.hsr.seq)) { n.dup++; if (n.dup === 1) add("error", `${e.src}: sequence ${e.hsr.seq} seen twice at the same port (frame ${e.no}). A frame passing a port twice is circulating in the ring: a node is not removing its own frames or duplicates, or two rings are joined.`, e.no); continue; }
    n.seen.add(e.hsr.seq);
    if (n.last !== null) { const g = (e.hsr.seq - n.last - 1 + 65536) % 65536; if (g > 0 && g < 1000) n.lost += g; }
    n.last = e.hsr.seq;
  }
  for (const n of m.values()) if (n.lost) add("warning", `${n.mac}: ${n.lost} frame(s) missing in its sequence on this port; the other ring direction delivers them, but one ring segment has a fault.`);
  if (!n0) add("info", "No HSR-tagged frames (EtherType 0x892F) in this capture.");
  else if (!F.some((f) => f.sev !== "info")) add("ok", `${m.size} HSR nodes, no duplicates at this port and continuous sequences.`);
  return { nodes: [...m.values()].map(({ seen, last, ...n }) => { void seen; void last; return n; }), findings: F, frames: n0 };
}

export interface RstpRow { t: number; no: number; src: string; root: string; bridge: string; cost: number; port: number; tc: boolean; ver: number; role: string }
export function analyseRstp(E: Eth[], knownBridges: string[] = []): { rows: RstpRow[]; roots: string[]; tcs: number; findings: Finding[] } {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
  const rows: RstpRow[] = [];
  for (const e of E) { const b = bpdu(e); if (b) rows.push({ t: e.t, no: e.no, src: e.src, root: b.root, bridge: b.bridge, cost: b.cost, port: b.port, tc: b.tc, ver: b.ver, role: b.role }); }
  if (!rows.length) { add("info", "No spanning-tree BPDUs in this capture."); return { rows, roots: [], tcs: 0, findings: F }; }
  const cnt = new Map<string, number>(); for (const r of rows) cnt.set(r.root, (cnt.get(r.root) ?? 0) + 1);
  const best = [...cnt.keys()].sort((x, y) => +x.split("/")[0] - +y.split("/")[0] || x.localeCompare(y))[0];
  const t0 = rows.find((x) => x.root === best)!.t, own = new Set<string>();
  for (const b of [...new Set(rows.map((r) => r.src))]) { const r = rows.find((x) => x.src === b && x.t > t0 && x.bridge === x.root && x.root !== best && +x.root.split("/")[0] > +best.split("/")[0]); if (r && !knownBridges.includes(b)) { own.add(b); add("warning", `${b} sends BPDUs claiming to be root (${r.root}) while the network root is ${best}: it runs its own spanning tree — typically an IED or other device with bridging enabled, or a switch cut off from the rest. If it is an IED, disable bridging (or use BPDU guard on its port).`, r.no); } }
  const main = rows.filter((r) => !own.has(r.src));
  const roots = main.map((r) => r.root).filter((x, i, a) => i === 0 || a[i - 1] !== x);
  if (roots.length > 1) { const ch = main.find((r, i) => i && r.root !== main[i - 1].root); add("warning", `The root bridge changed: ${roots.join(" → ")}${ch ? ` (frame ${ch.no})` : ""}. Each change reconverges the network and flushes MAC tables. Set the bridge priorities so the intended root has the lowest value and its backup the next — a switch configured with a lower priority by mistake takes over the root.`, ch?.no); }
  const tcs = rows.filter((r) => r.tc).length;
  if (tcs) add(tcs > 3 ? "warning" : "info", `${tcs} BPDU(s) with the topology-change flag. Topology changes flush MAC tables and flood traffic for a moment; repeated changes point to a port going up and down (an IED port not configured as edge port, a flapping link).`, rows.find((r) => r.tc)?.no);
  if (rows.some((r) => r.ver < 2)) add("warning", "Legacy STP (version 0) BPDUs present: the network falls back to slow STP convergence (30–50 s) on those links. Use RSTP everywhere.");
  for (const b of [...new Set(rows.map((r) => r.src))]) if (knownBridges.length && !knownBridges.includes(b) && !own.has(b)) add("error", `BPDUs from ${b}, which is not in the list of switches.`, rows.find((r) => r.src === b)?.no);
  return { rows, roots, tcs, findings: F };
}
