// "Why is my GOOSE not working?" — compares what the SCD says each GOOSE
// stream should look like with what a capture shows on the wire, check by
// check in the order a subscriber applies them, and explains each failure.

import { parseXml, kids, kid, all } from "./gatewaymap";
import { type Eth, goose, fmtVal, type Goose } from "./l2cap";

export interface Expected {
  ied: string; ld: string; cb: string; gocbRef: string; goID: string; datSet: string; confRev: number | null; members: number | null;
  mac: string; appid: number | null; vlan: number | null; prio: number | null; minT: number | null; maxT: number | null; subnet: string; subs: string[];
}
export function expectedFromScd(scd: string): Expected[] {
  const R = parseXml(scd), scl = kid(R, "SCL");
  if (!scl) throw new Error("Not an SCL file.");
  const out: Expected[] = [];
  const gse = new Map<string, { a: Record<string, string>; min: number | null; max: number | null; subnet: string }>();
  for (const sn of kids(kid(scl, "Communication"), "SubNetwork")) for (const cap of kids(sn, "ConnectedAP")) for (const g of kids(cap, "GSE")) {
    const a: Record<string, string> = {};
    for (const p of kids(kid(g, "Address"), "P")) a[p.attrs.type] = p.text.trim();
    const t = (n: string) => { const e = kid(g, n); return e ? Number(e.text.trim()) : null; };
    gse.set(`${cap.attrs.iedName}|${g.attrs.ldInst}|${g.attrs.cbName}`, { a, min: t("MinTime"), max: t("MaxTime"), subnet: sn.attrs.name });
  }
  const ext: { sub: string; pub: string; cb: string; ld: string }[] = [];
  for (const ied of kids(scl, "IED")) for (const er of all(ied, "ExtRef")) if (er.attrs.iedName) ext.push({ sub: ied.attrs.name, pub: er.attrs.iedName, cb: er.attrs.srcCBName ?? "", ld: er.attrs.srcLDInst ?? er.attrs.ldInst ?? "" });
  for (const ied of kids(scl, "IED")) for (const ld of all(ied, "LDevice")) for (const ln0 of kids(ld, "LN0")) for (const g of kids(ln0, "GSEControl")) {
    const n = ied.attrs.name, li = ld.attrs.inst, ds = kids(ln0, "DataSet").find((d) => d.attrs.name === g.attrs.datSet);
    const ad = gse.get(`${n}|${li}|${g.attrs.name}`), a = ad?.a ?? {};
    const gocbRef = `${n}${li}/LLN0$GO$${g.attrs.name}`;
    out.push({
      ied: n, ld: li, cb: g.attrs.name, gocbRef, goID: g.attrs.appID || gocbRef, datSet: `${n}${li}/LLN0$${g.attrs.datSet ?? ""}`,
      confRev: g.attrs.confRev ? Number(g.attrs.confRev) : null, members: ds ? kids(ds, "FCDA").length : null,
      mac: (a["MAC-Address"] ?? "").toUpperCase(), appid: a.APPID ? parseInt(a.APPID, 16) : null, vlan: a["VLAN-ID"] ? parseInt(a["VLAN-ID"], 16) : null, prio: a["VLAN-PRIORITY"] ? Number(a["VLAN-PRIORITY"]) : null,
      minT: ad?.min ?? null, maxT: ad?.max ?? null, subnet: ad?.subnet ?? "",
      subs: [...new Set(ext.filter((x) => x.pub === n && (!x.cb || (x.cb === g.attrs.name && (!x.ld || x.ld === li)))).map((x) => x.sub))],
    });
  }
  return out;
}

export interface Observed {
  key: string; src: string; dst: string; appid: number; gocbRef: string; goID: string; datSet: string; vlans: (number | null)[]; prios: (number | null)[];
  frames: { t: number; no: number; g: Goose }[]; confRevs: number[]; sim: boolean; test: boolean; ndsCom: boolean; tal: number; n: number;
  maxGap: number; maxGapAt: number; worst: { ratio: number; gap: number; tal: number; no: number }; late: number; lostSq: number; dataNoSt: { no: number }[]; stChanges: number; badQ: string[]; notSync: boolean;
}
export function observe(E: Eth[]): Observed[] {
  const m = new Map<string, Observed>();
  for (const e of E) {
    const g = goose(e);
    if (!g) continue;
    const key = `${e.src}|${g.appid}|${g.gocbRef}`;
    let o = m.get(key);
    if (!o) m.set(key, (o = { key, src: e.src, dst: e.dst, appid: g.appid, gocbRef: g.gocbRef, goID: g.goID, datSet: g.datSet, vlans: [], prios: [], frames: [], confRevs: [], sim: false, test: false, ndsCom: false, tal: g.tal, n: g.n, maxGap: 0, maxGapAt: 0, worst: { ratio: 0, gap: 0, tal: 0, no: 0 }, late: 0, lostSq: 0, dataNoSt: [], stChanges: 0, badQ: [], notSync: false }));
    if (!o.vlans.includes(e.vlan)) o.vlans.push(e.vlan);
    if (!o.prios.includes(e.prio)) o.prios.push(e.prio);
    if (!o.confRevs.includes(g.confRev)) o.confRevs.push(g.confRev);
    o.sim = o.sim || g.sim; o.test = o.test || g.test; o.ndsCom = o.ndsCom || g.ndsCom; o.tal = Math.min(o.tal || g.tal, g.tal || o.tal);
    if (g.tq & 0x20) o.notSync = true;
    const prev = o.frames[o.frames.length - 1];
    if (prev) {
      const gap = e.t - prev.t;
      if (gap > o.maxGap) { o.maxGap = gap; o.maxGapAt = e.no; }
      const ptal = prev.g.tal / 1000;
      if (ptal > 0) { const ratio = gap / ptal; if (ratio > o.worst.ratio) o.worst = { ratio, gap, tal: ptal, no: e.no }; if (ratio > 1) o.late++; }
      if (g.stNum === prev.g.stNum) {
        if (g.sqNum !== prev.g.sqNum + 1 && !(g.sqNum === 0 && prev.g.sqNum > 1000)) o.lostSq += Math.max(1, g.sqNum - prev.g.sqNum - 1);
        if (g.data.map(fmtVal).join() !== prev.g.data.map(fmtVal).join()) o.dataNoSt.push({ no: e.no });
      } else o.stChanges++;
    }
    for (const v of g.data) { const s = fmtVal(v); if (/q=(invalid|questionable)|\+test/.test(s) && !o.badQ.includes(s)) o.badQ.push(s); }
    o.frames.push({ t: e.t, no: e.no, g });
  }
  return [...m.values()];
}

export type St = "pass" | "fail" | "warn" | "na";
export interface Check { id: string; label: string; st: St; detail: string; fix?: string }
export interface Diagnosis { exp: Expected | null; obs: Observed | null; title: string; verdict: St; summary: string; checks: Check[] }

export const SYMPTOMS: [string, string][] = [
  ["missing", "The subscriber reports the GOOSE as missing / lost"],
  ["mismatch", "The subscriber reports a configuration mismatch"],
  ["nochange", "The subscriber receives it, but the value does not follow"],
  ["intermittent", "It works, then drops out from time to time"],
  ["afterchange", "It stopped after a change (new SCD, firmware, IED replaced)"],
];
const SYM_ADVICE: Record<string, string> = {
  missing: "A subscriber declares a GOOSE lost when no valid message arrives within the time allowed to live of the last one. Look first at presence, VLAN, MAC/APPID and the repetition gaps below.",
  mismatch: "Configuration mismatch means frames arrive but a field the subscriber checks differs from its configuration: goID/gocbRef, data set reference, confRev or the number of entries. Look at those checks.",
  nochange: "Frames arrive and are accepted, but the subscriber ignores the value — typically test/simulation mode, invalid or test quality, ndsCom, or a subscriber input mapped to the wrong member position.",
  intermittent: "Intermittent loss usually comes from repetition gaps longer than the time allowed to live (network load, lost frames, a ring reconfiguring) or a TAL set without margin. Look at the gap and sequence checks.",
  afterchange: "After a change, the most common causes are a confRev or data set that changed in the publisher but not in the subscriber's configuration, a new MAC/APPID/VLAN not set up in the switches, or a replaced IED still with its factory configuration.",
};
const fmtVlan = (v: number | null) => (v === null ? "untagged" : String(v));

export function diagnose(exp: Expected[], obs: Observed[], subscriber = "", captureEnd = 0): Diagnosis[] {
  const used = new Set<string>(), out: Diagnosis[] = [];
  const list = subscriber ? exp.filter((x) => x.subs.includes(subscriber)) : exp;
  for (const x of list) {
    const C: Check[] = [], add = (id: string, label: string, st: St, detail: string, fix?: string) => C.push({ id, label, st, detail, fix });
    const byRef = obs.find((o) => o.gocbRef === x.gocbRef), byAddr = obs.find((o) => (x.appid !== null && o.appid === x.appid) || (x.mac && o.dst === x.mac));
    const o = byRef ?? byAddr ?? null;
    if (o) used.add(o.key);
    if (!o) {
      add("present", "Stream present in the capture", "fail", `No GOOSE with gocbRef ${x.gocbRef}${x.appid !== null ? `, APPID ${x.appid.toString(16).toUpperCase().padStart(4, "0")}` : ""}${x.mac ? ` or MAC ${x.mac}` : ""} was captured.`, "Check where the capture was taken (a port in the stream's VLAN), that the publisher's control block is enabled (GoEna) and its logical device is on, that the IED is configured with this SCD, and that every switch on the path carries VLAN " + fmtVlan(x.vlan) + ".");
      out.push({ exp: x, obs: null, title: `${x.ied} ${x.ld}/${x.cb}`, verdict: "fail", summary: "Not on the wire at the capture point.", checks: C });
      continue;
    }
    add("present", "Stream present in the capture", "pass", `${o.frames.length} frames from ${o.src}${byRef ? "" : " (matched by address, not by gocbRef)"}.`);
    add("mac", "Destination MAC address", !x.mac ? "na" : o.dst === x.mac ? "pass" : "fail", x.mac ? `Captured ${o.dst}, SCD ${x.mac}.` : "No MAC address in the SCD.", "Subscribers and switch multicast filters listen to the configured MAC; load the SCD address into the publisher or correct the SCD.");
    add("appid", "APPID", x.appid === null ? "na" : o.appid === x.appid ? "pass" : "fail", `Captured ${o.appid.toString(16).toUpperCase().padStart(4, "0")}${x.appid !== null ? `, SCD ${x.appid.toString(16).toUpperCase().padStart(4, "0")}` : ""}.`, "Subscribers filter on APPID; a different APPID is discarded.");
    const vOk = x.vlan === null || o.vlans.every((v) => v === x.vlan || (v === null)), untag = o.vlans.includes(null);
    add("vlan", "VLAN", x.vlan === null ? "na" : o.vlans.some((v) => v !== null && v !== x.vlan) ? "fail" : untag ? "warn" : "pass", `Captured ${o.vlans.map(fmtVlan).join(", ")}${x.vlan !== null ? `, SCD ${x.vlan}` : ""}.`, untag ? "Untagged at the capture point: the switch port sends the VLAN untagged (fine for many subscribers, but the priority is lost on that link). If the publisher sends untagged, its VLAN setting is missing." : "A stream in another VLAN does not reach ports configured for the planned VLAN; set the publisher's VLAN or the switch VLAN membership.");
    void vOk;
    add("prio", "802.1p priority", x.prio === null ? "na" : o.prios.every((p) => p === null || p === x.prio) ? (o.prios.some((p) => p !== null && p < 4) ? "warn" : "pass") : "warn", `Captured ${o.prios.map((p) => (p === null ? "—" : p)).join(", ")}${x.prio !== null ? `, SCD ${x.prio}` : ""}.`, "A low priority queues the GOOSE behind ordinary traffic under load; use the configured priority (4 or higher for protection).");
    add("gocbref", "gocbRef", o.gocbRef === x.gocbRef ? "pass" : "fail", `Captured ${o.gocbRef}.`, "The control block reference differs: the IED name, LD instance or control block name in the device differs from the SCD (often an IED not renamed after replacement).");
    add("goid", "goID (appID in SCL)", o.goID === x.goID ? "pass" : "fail", `Captured ${o.goID}, SCD ${x.goID}.`, "Subscribers check the goID; load the SCD into the publisher.");
    add("datset", "Data set reference", o.datSet === x.datSet ? "pass" : "fail", `Captured ${o.datSet}, SCD ${x.datSet}.`, "The publisher sends a different data set; the subscriber rejects it.");
    add("confrev", "confRev", x.confRev === null ? "na" : o.confRevs.every((c) => c === x.confRev) ? "pass" : "fail", `Captured ${o.confRevs.join(", ")}${x.confRev !== null ? `, SCD ${x.confRev}` : ""}.`, "Publisher and subscriber configurations are from different revisions. Export the CIDs of the publisher and every subscriber from the same SCD and load them.");
    add("entries", "Number of data set entries", x.members === null ? "na" : o.n === x.members ? "pass" : "fail", `Captured ${o.n}${x.members !== null ? `, SCD ${x.members}` : ""}.`, "The data set layout differs; subscribers decode by position and reject a different count.");
    add("sim", "Simulation / test flag", o.sim || o.test ? "fail" : "pass", o.sim || o.test ? `${o.sim ? "Simulation bit set in the header" : ""}${o.sim && o.test ? " and " : ""}${o.test ? "test = TRUE in the PDU" : ""}.` : "Not set.", "A subscriber that is not itself in simulation ignores simulated frames (IEC 61850-7-4 LPHD.Sim, Ed2). Take the publisher (or test set) out of test mode.");
    add("ndscom", "ndsCom (needs commissioning)", o.ndsCom ? "fail" : "pass", o.ndsCom ? "ndsCom = TRUE: the publisher's control block is not properly configured (for example an empty data set)." : "FALSE.", "Configure the control block and data set in the publisher.");
    const w = o.worst;
    add("tal", "Each frame within the previous frame's time allowed to live", o.frames.length < 2 ? "na" : w.ratio > 1 ? "fail" : w.ratio > 0.9 ? "warn" : "pass", o.frames.length < 2 ? "Only one frame captured." : `${o.late} late frame(s). Worst: ${w.gap.toFixed(3)} s after a frame that allowed ${w.tal.toFixed(3)} s (frame ${w.no})${x.maxT ? `; MaxTime ${x.maxT} ms` : ""}.`, w.ratio > 1 ? "The subscriber declares the stream lost in this gap. Find why frames stopped (publisher, network, ring reconfiguration) or check the capture did not drop frames." : "Little margin: one lost or delayed repetition makes the subscriber declare the GOOSE lost. The publisher should announce about twice the interval to its next message.");
    const tal = o.tal / 1000;
    if (captureEnd && o.frames.length) { const silent = captureEnd - o.frames[o.frames.length - 1].t; if (silent > tal && silent > 1) add("silent", "Still publishing at the end of the capture", "fail", `No frame for the last ${silent.toFixed(1)} s of the capture.`, "The publisher stopped sending: IED restart, control block disabled, link down."); }
    add("seq", "sqNum continuity", o.lostSq ? "warn" : "pass", o.lostSq ? `${o.lostSq} repetition(s) missing in the capture.` : "Continuous.", "Lost repetitions point to network load, a faulty link or a capture that dropped frames.");
    add("stnum", "stNum changes with data", o.dataNoSt.length ? "fail" : "pass", o.dataNoSt.length ? `Data changed without a new stNum (frame ${o.dataNoSt[0].no}).` : `${o.stChanges} state change(s), each with a new stNum.`, "A subscriber may ignore a value change that comes without a new stNum; this is a publisher fault — report it to the IED vendor.");
    add("quality", "Quality of the values", o.badQ.length ? "warn" : "pass", o.badQ.length ? `Seen: ${o.badQ.join(", ")}.` : "All members good (where quality is included).", "Invalid or test quality makes a well-configured subscriber ignore the value; find the cause in the publisher.");
    add("time", "Time stamp quality", o.notSync ? "warn" : "pass", o.notSync ? "ClockNotSynchronized is set in the GOOSE time stamp." : "Synchronised.", "The publisher's clock is not synchronised; check its time source (SNTP/PTP).");
    if (subscriber && x.subnet) add("subnet", `${subscriber} on the publisher's subnetwork`, "na", `The stream is published on subnetwork ${x.subnet}; GOOSE is layer 2 and reaches only devices in the same LAN and VLAN.`);
    const fails = C.filter((c) => c.st === "fail"), warns = C.filter((c) => c.st === "warn");
    out.push({ exp: x, obs: o, title: `${x.ied} ${x.ld}/${x.cb}`, verdict: fails.length ? "fail" : warns.length ? "warn" : "pass", summary: fails.length ? `Not accepted by a correctly configured subscriber: ${fails.map((f) => f.label).join(", ")}.` : warns.length ? `Received, with ${warns.length} point(s) to review.` : "On the wire exactly as configured; if the subscriber still fails, check the subscriber's own configuration (its CID, input mapping, simulation mode).", checks: C });
  }
  if (!subscriber) for (const o of obs.filter((o) => !used.has(o.key))) out.push({ exp: null, obs: o, title: o.gocbRef || o.goID, verdict: "warn", summary: `Captured from ${o.src} but not in the SCD (or not loaded): either an old configuration still running in a device, or a stream from outside this SCD.`, checks: [] });
  return out;
}
export const symptomAdvice = (s: string[]) => s.map((k) => SYM_ADVICE[k]).filter(Boolean);
