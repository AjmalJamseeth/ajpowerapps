// Time synchronisation analysis: PTP (IEC/IEEE 61850-9-3 power profile) and
// NTP from captures, Windows w32tm output, and a comparison of time sources
// against the IEC 61850-5 time performance classes.

import { type Eth, ptp, ntp, PTPMSG, type Ptp } from "./l2cap";

export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string; no?: number }
export const CLASSES: [string, number][] = [["T5", 1e-6], ["T4", 4e-6], ["T3", 25e-6], ["T2", 100e-6], ["T1", 1e-3], ["T0", 10e-3]];
export const bestClass = (absErrS: number) => CLASSES.find(([, l]) => absErrS <= l)?.[0] ?? "worse than T0 (10 ms)";
export const CLOCKCLASS: Record<number, string> = { 6: "locked to a primary reference (GPS)", 7: "holdover, within specification", 13: "locked to an application-specific source", 14: "holdover (application source)", 52: "degraded (was 7, out of holdover spec)", 58: "degraded (was 14)", 187: "degraded, may be followed", 193: "degraded, may be followed", 248: "default — not synchronised to anything", 255: "slave only" };
const TS: Record<number, string> = { 0x10: "atomic clock", 0x20: "GNSS (GPS)", 0x30: "terrestrial radio", 0x40: "PTP", 0x50: "NTP", 0x60: "hand set", 0x90: "other", 0xa0: "internal oscillator" };

export interface Gm { id: string; prio1: number; cls: number; acc: number; variance: number; prio2: number; utcOffset: number; steps: number; src: number; traceable: boolean; first: number; firstNo: number; classes: { t: number; cls: number }[]; sender: string; domain: number }
export interface PtpResult { msgs: { t: number; no: number; src: string; p: Ptp }[]; gms: Gm[]; best: Gm | null; findings: Finding[]; syncStats: { n: number; mean: number; jitter: number } | null; captureOffset: number | null; domains: number[] }

const bmca = (a: Gm, b: Gm) => a.prio1 - b.prio1 || a.cls - b.cls || a.acc - b.acc || a.variance - b.variance || a.prio2 - b.prio2 || a.id.localeCompare(b.id);

export function analysePtp(E: Eth[], opt: { domain: number; utcOffset: number; syncInt: number } = { domain: 0, utcOffset: 37, syncInt: 1 }): PtpResult {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
  const msgs: PtpResult["msgs"] = [];
  let udp = 0;
  for (const e of E) { const p = ptp(e); if (p) { msgs.push({ t: e.t, no: e.no, src: e.src, p }); if (e.udp) udp++; } }
  if (!msgs.length) { add("info", "No PTP messages in this capture."); return { msgs, gms: [], best: null, findings: F, syncStats: null, captureOffset: null, domains: [] }; }
  const domains = [...new Set(msgs.map((m) => m.p.domain))];
  for (const d of domains.filter((d) => d !== opt.domain)) { const m = msgs.find((x) => x.p.domain === d)!; add("warning", `${m.src} uses PTP domain ${d}; the network uses domain ${opt.domain}. Devices in another domain ignore each other — it will not synchronise.`, m.no); }
  if (udp) add("warning", `${udp} PTP message(s) over UDP. The power profile (IEC/IEEE 61850-9-3) uses layer-2 Ethernet multicast; UDP needs routing and adds variable delay.`);
  const dom = msgs.filter((m) => m.p.domain === opt.domain);
  if (dom.some((m) => m.p.type === 1)) { const m = dom.find((x) => x.p.type === 1)!; add("warning", `${m.src} sends Delay_Req (end-to-end delay measurement) in a network using peer delay (Pdelay). The power profile uses peer-to-peer delay; an end-to-end device gets no Delay_Resp from transparent clocks and cannot correct for path delay.`, m.no); }
  // grandmasters from Announce
  const gm = new Map<string, Gm>();
  for (const m of dom.filter((x) => x.p.type === 11 && x.p.ann)) {
    const a = m.p.ann!;
    let g = gm.get(a.gm);
    if (!g) gm.set(a.gm, (g = { id: a.gm, prio1: a.prio1, cls: a.cls, acc: a.acc, variance: a.variance, prio2: a.prio2, utcOffset: a.utcOffset, steps: a.steps, src: a.src, traceable: a.timeTraceable, first: m.t, firstNo: m.no, classes: [], sender: m.src, domain: m.p.domain }));
    if (!g.classes.length || g.classes[g.classes.length - 1].cls !== a.cls) g.classes.push({ t: m.t, cls: a.cls });
    Object.assign(g, { prio1: a.prio1, cls: a.cls, acc: a.acc, variance: a.variance, prio2: a.prio2, utcOffset: a.utcOffset, src: a.src, traceable: a.timeTraceable });
  }
  const gms = [...gm.values()].sort(bmca), best = gms[0] ?? null;
  if (!gms.length) add("error", "No Announce messages: no grandmaster is visible at this capture point.");
  if (gms.length > 1) {
    add("warning", `${gms.length} grandmaster candidates announce in domain ${opt.domain}: ${gms.map((g) => `${g.id} (priority1 ${g.prio1}, class ${g.cls})`).join("; ")}. The best master clock algorithm selects ${best!.id}.`, gms[1].firstNo);
    const better = gms.find((g) => g.cls < best!.cls);
    if (better && best!.cls >= 187) add("error", `The selected grandmaster ${best!.id} is ${CLOCKCLASS[best!.cls] ?? "class " + best!.cls} but wins because of its priority1 ${best!.prio1}; ${better.id} (class ${better.cls}, ${CLOCKCLASS[better.cls] ?? ""}) would be the right source. Set priority1 so only intended grandmasters can win (e.g. 128 on the GPS clocks, 255 or slave-only elsewhere).`, best!.firstNo);
  }
  for (const g of gms) {
    for (const c of g.classes.slice(1)) add(c.cls >= 52 ? "error" : "warning", `Grandmaster ${g.id} changed clock class to ${c.cls} (${CLOCKCLASS[c.cls] ?? "?"}) — ${c.cls === 7 ? "it lost its GPS reference and runs on its oscillator; accuracy degrades with time" : "its accuracy is no longer guaranteed"}.`);
    if (g.utcOffset !== opt.utcOffset) add("error", `Grandmaster ${g.id} announces currentUtcOffset ${g.utcOffset} s; the current TAI–UTC offset is ${opt.utcOffset} s. Devices converting PTP time to UTC will be ${Math.abs(opt.utcOffset - g.utcOffset)} s wrong.`, g.firstNo);
    if (g.cls === 6 && !g.traceable) add("warning", `Grandmaster ${g.id} is locked (class 6) but timeTraceable is false.`, g.firstNo);
  }
  // sync interval, follow-up, sequence
  let syncStats: PtpResult["syncStats"] = null;
  const sc = new Map<string, number>(); for (const m of dom.filter((x) => x.p.type === 0)) sc.set(m.p.clock, (sc.get(m.p.clock) ?? 0) + 1);
  const master = [...sc.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const mGm = gms.find((g) => g.id === master) ?? best;
  if (master && best && master !== best.id) add("info", `Sync messages come from ${master}${mGm && mGm.id === master ? ` (class ${mGm.cls})` : ""} — the clock the slaves currently follow; the best announced candidate is ${best.id}. When the slaves re-run the selection they will move to ${best.id}.`);
  if (master) {
    const sy = dom.filter((m) => m.p.type === 0 && m.p.clock === master);
    if (sy.length > 2) {
      const d = sy.slice(1).map((m, i) => m.t - sy[i].t), mean = d.reduce((a, b) => a + b, 0) / d.length, jit = Math.max(...d.map((x) => Math.abs(x - mean)));
      if (Math.abs(mean - opt.syncInt) > 0.1 * opt.syncInt) add("warning", `Sync interval ${mean.toFixed(3)} s; the profile uses ${opt.syncInt} s.`);
      const gaps = sy.slice(1).filter((m, i) => m.p.seq !== ((sy[i].p.seq + 1) & 0xffff)).length;
      if (gaps) add("warning", `${gaps} gap(s) in the Sync sequence numbers: Sync messages lost.`);
      const two = sy.filter((m) => m.p.twoStep), fu = dom.filter((m) => m.p.type === 8 && m.p.clock === master);
      const miss = two.filter((s) => !fu.some((f) => f.p.seq === s.p.seq));
      if (miss.length) add("warning", `${miss.length} two-step Sync message(s) without Follow_Up (sequence ${miss.slice(0, 5).map((m) => m.p.seq).join(", ")}). Slaves cannot use those Syncs; repeated loss degrades synchronisation.`, miss[0].no);
      syncStats = { n: sy.length, mean, jitter: jit };
    }
  }
  // peer delay
  const preq = dom.filter((m) => m.p.type === 2), presp = dom.filter((m) => m.p.type === 3);
  const unanswered = preq.filter((r) => !presp.some((s) => s.p.seq === r.p.seq && s.t >= r.t && s.t - r.t < 1));
  if (unanswered.length) add("warning", `${unanswered.length} Pdelay_Req without Pdelay_Resp (from ${[...new Set(unanswered.map((m) => m.src))].join(", ")}): the neighbour does not support peer delay.`, unanswered[0].no);
  // capture clock against PTP time (precise origin of Follow_Up, or one-step Sync)
  let captureOffset: number | null = null;
  if (master) {
    const off = mGm && mGm.id === master ? mGm.utcOffset : opt.utcOffset;
    const fu = dom.filter((m) => (m.p.type === 8 || (m.p.type === 0 && !m.p.twoStep)) && m.p.clock === master && m.p.ts);
    if (fu.length) { const o = fu.map((m) => m.p.ts! - off - m.t).sort((a, b) => a - b); captureOffset = o[Math.floor(o.length / 2)]; }
  }
  if (best && !F.some((f) => f.sev === "error" || f.sev === "warning")) add("ok", `Grandmaster ${best.id}, class ${best.cls}, ${TS[best.src] ?? ""}; messages as the power profile expects.`);
  return { msgs, gms, best, findings: F, syncStats, captureOffset, domains };
}
export const ptpName = (t: number) => PTPMSG[t] ?? `type ${t}`;
export const timeSourceName = (s: number) => TS[s] ?? `0x${s.toString(16)}`;

export interface NtpServer { ip: string; stratum: number; refid: string; li: number; rootDisp: number; samples: { t: number; offset: number; delay: number }[]; unanswered: number; kod: string }
export function analyseNtp(E: Eth[], captureOn: "client" | "other" = "client"): { servers: NtpServer[]; findings: Finding[] } {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const reqs: { e: Eth; x: number }[] = [], srv = new Map<string, NtpServer>();
  for (const e of E) {
    const n = ntp(e);
    if (!n) continue;
    if (n.mode === 3) { reqs.push({ e, x: n.xmt }); continue; }
    if (n.mode !== 4) continue;
    const ip = e.udp!.src;
    let s = srv.get(ip);
    if (!s) srv.set(ip, (s = { ip, stratum: n.stratum, refid: n.refid, li: n.li, rootDisp: n.rootDisp, samples: [], unanswered: 0, kod: "" }));
    Object.assign(s, { stratum: n.stratum, refid: n.refid, li: n.li, rootDisp: n.rootDisp });
    if (n.stratum === 0) s.kod = n.refid;
    const q = reqs.find((r) => Math.abs(r.x - n.orig) < 1e-6);
    if (q && n.stratum !== 0) { const T1 = n.orig, T2 = n.recv, T3 = n.xmt, T4 = e.t; s.samples.push({ t: e.t, offset: ((T2 - T1) + (T3 - T4)) / 2, delay: (T4 - T1) - (T3 - T2) }); }
  }
  for (const r of reqs) { const ip = r.e.udp!.dst; let s = srv.get(ip); if (!s) srv.set(ip, (s = { ip, stratum: -1, refid: "", li: 0, rootDisp: 0, samples: [], unanswered: 0, kod: "" })); }
  for (const r of reqs) { const s = srv.get(r.e.udp!.dst)!; if (!E.some((e) => { const n = ntp(e); return n && n.mode === 4 && Math.abs(n.orig - r.x) < 1e-6; })) s.unanswered++; }
  if (!reqs.length && !srv.size) add("info", "No NTP / SNTP messages in this capture.");
  if (captureOn !== "client") add("info", "The capture was not taken on the client: offsets use the capture time as the client's receive time and are approximate.");
  for (const s of srv.values()) {
    if (s.stratum === -1) { add("error", `${s.ip} never answered (${s.unanswered} request(s)): server down, firewall (UDP 123) or wrong address.`); continue; }
    if (s.kod) add("error", `${s.ip} sent a Kiss-o'-Death "${s.kod}": the client is told to ${s.kod === "RATE" ? "poll less often" : s.kod === "DENY" || s.kod === "RSTR" ? "stop — access denied" : "stop or change server"}.`);
    if (s.li === 3 || s.stratum === 16) add("error", `${s.ip} is not synchronised (leap indicator ${s.li}, stratum ${s.stratum}${s.refid ? `, reference ${s.refid}` : ""}). Clients must not use it; if it is configured as a source, remove it or fix its own time source.`);
    else if (/LOCL|LCL/i.test(s.refid) || s.stratum >= 10) add("warning", `${s.ip} serves its local clock (reference ${s.refid}, stratum ${s.stratum}), not a traceable time source.`);
    if (s.rootDisp > 1) add("warning", `${s.ip}: root dispersion ${s.rootDisp.toFixed(2)} s — its own time is uncertain by that much.`);
    if (s.samples.length) {
      const o = s.samples.map((x) => x.offset).sort((a, b) => a - b), med = o[Math.floor(o.length / 2)], dl = s.samples.reduce((a, x) => a + x.delay, 0) / s.samples.length;
      if (s.li !== 3 && s.stratum !== 16) {
        const sev = Math.abs(med) > 1 ? "error" : Math.abs(med) > 0.1 ? "warning" : Math.abs(med) > 0.01 ? "info" : "ok";
        add(sev, `Client clock against ${s.ip} (stratum ${s.stratum}, ${s.refid}): offset ${(med * 1000).toFixed(1)} ms (median of ${o.length}), round-trip delay ${(dl * 1000).toFixed(1)} ms. ${Math.abs(med) > 0.01 ? `The client is ${med < 0 ? "ahead" : "behind"} by ${Math.abs(med * 1000).toFixed(0)} ms; ` : ""}${sev === "error" || sev === "warning" ? "events time-stamped by this computer are out of order with IED events." : "within 10 ms."}`);
      }
    }
    if (s.unanswered) add("warning", `${s.ip}: ${s.unanswered} request(s) without answer.`);
  }
  return { servers: [...srv.values()], findings: F };
}

export interface W32 { status: Record<string, string>; strip: { time: string; offset: number }[]; findings: Finding[] }
export function parseW32tm(text: string): W32 {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const status: Record<string, string> = {}, strip: W32["strip"] = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const l = raw.trim();
    let m = l.match(/^(Leap Indicator|Stratum|Precision|Root Delay|Root Dispersion|ReferenceId|Last Successful Sync Time|Source|Poll Interval|Phase Offset|ClockRate|State Machine|Time Source Flags|Server Role|Last Sync Error|Time since Last Good Sync Time):\s*(.*)$/i);
    if (m) { status[m[1]] = m[2]; continue; }
    m = l.match(/^(\d{1,2}:\d{2}:\d{2}),\s*([+-]?\d+\.\d+)s/);
    if (m) strip.push({ time: m[1], offset: parseFloat(m[2]) });
  }
  const src = status.Source ?? "";
  if (/Local CMOS Clock|Free-running System Clock|VM IC Time Synchronization Provider/i.test(src)) add("error", `Source: "${src}" — Windows is not synchronising to a time server (it uses its own clock${/VM IC/.test(src) ? " or the hypervisor" : ""}). Configure the station clock as the NTP source (w32tm /config /manualpeerlist:<server> /syncfromflags:manual /update).`);
  const st = parseInt(status.Stratum ?? "", 10);
  if (st === 0 || st >= 16) add("error", `Stratum ${status.Stratum}: not synchronised.`);
  const rd = parseFloat(status["Root Dispersion"] ?? "");
  if (rd > 1) add("warning", `Root dispersion ${rd.toFixed(2)} s: Windows itself estimates its time uncertain by more than a second — usually because the last successful synchronisation is long ago.`);
  const pi = (status["Poll Interval"] ?? "").match(/(\d+)\s*\((\d+)s\)/);
  if (pi && +pi[2] > 1024) add("warning", `Poll interval ${pi[2]} s (${(+pi[2] / 3600).toFixed(1)} h). Between polls the PC clock drifts unchecked; for SCADA servers set MaxPollInterval to 6–10 (64–1024 s).`);
  if (/^1\b|^2\b/.test(status["Leap Indicator"] ?? "")) add("info", `Leap indicator ${status["Leap Indicator"]}: a leap second is announced.`);
  if (/^3\b/.test(status["Leap Indicator"] ?? "")) add("error", "Leap indicator 3: not synchronised.");
  if (strip.length) {
    const o = strip.map((x) => x.offset).sort((a, b) => a - b), med = o[Math.floor(o.length / 2)];
    const sev = Math.abs(med) > 1 ? "error" : Math.abs(med) > 0.1 ? "warning" : Math.abs(med) > 0.01 ? "info" : "ok";
    add(sev, `w32tm /stripchart: offset ${(med * 1000).toFixed(1)} ms (median of ${o.length}; negative means this computer is ahead of the server).`);
  }
  if (!Object.keys(status).length && !strip.length) add("info", "No w32tm /query /status or /stripchart output found.");
  return { status, strip, findings: F };
}
