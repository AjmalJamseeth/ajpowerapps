// Sequence-of-events checks and incident timeline: event lists from IEDs and
// SCADA (CSV), syslog, Windows event exports and captures (GOOSE state
// changes, IEC 104 time-tagged events) merged on one UTC time line, with
// per-source corrections, time-quality checks and causality checks between
// sources that reveal clock offsets.

import { readCapture, packets, tcpConns } from "./pcapnet";
import { eth, goose, fmtVal } from "./l2cap";
import { analyse104, TYPES } from "./iec104cap";

export interface Ev { t: number; src: string; device: string; signal: string; value: string; desc: string; quality: string; recv: number | null; line: number }
export interface Source { name: string; kind: string; events: Ev[]; offset: number; tz: number; err?: string }

const MON: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
/** Parse a date/time string as if it were UTC (time zone handled by the source setting). */
export function parseTime(s: string, year = new Date().getUTCFullYear()): number | null {
  const x = String(s).trim();
  let m = x.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2}):(\d{2})(?:[.,](\d+))?\s*(Z|[+-]\d{2}:?\d{2})?$/i);
  if (m) {
    let t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) / 1000 + (m[7] ? +("0." + m[7]) : 0);
    if (m[8] && m[8].toUpperCase() !== "Z") { const z = m[8].replace(":", ""), sg = z[0] === "-" ? -1 : 1; t -= sg * (+z.slice(1, 3) * 3600 + +z.slice(3, 5) * 60); }
    return t;
  }
  m = x.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})[ ,]+(\d{1,2}):(\d{2}):(\d{2})(?:[.,](\d+))?$/);
  if (m) return Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5], +m[6]) / 1000 + (m[7] ? +("0." + m[7]) : 0); // dd/mm/yyyy
  m = x.match(/^([A-Za-z]{3})\s+(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})(?:[.,](\d+))?$/);
  if (m && MON[m[1].toLowerCase()] !== undefined) return Date.UTC(year, MON[m[1].toLowerCase()], +m[2], +m[3], +m[4], +m[5]) / 1000 + (m[6] ? +("0." + m[6]) : 0);
  return null;
}

function splitCsv(l: string, d: string): string[] { const o: string[] = []; let c = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === d) { o.push(c.trim()); c = ""; } else c += ch; } o.push(c.trim()); return o; }

export function parseText(name: string, text: string, year?: number): Source {
  const t = String(text).replace(/^﻿/, "");
  const lines = t.split(/\r?\n/).filter((l) => l.trim());
  const ev: Ev[] = [];
  // syslog
  if (lines.length && lines.every((l) => /^<\d+>/.test(l) || !l.trim())) {
    lines.forEach((l, i) => {
      let m = l.match(/^<\d+>1\s+(\S+)\s+(\S+)\s+(\S+)\s+\S+\s+\S+\s+(?:\[.*?\]|-)\s*(.*)$/);
      if (m) { const tt = parseTime(m[1]); if (tt !== null) ev.push({ t: tt, src: name, device: m[2], signal: m[3], value: "", desc: m[4], quality: "", recv: null, line: i + 1 }); return; }
      m = l.match(/^<\d+>([A-Za-z]{3}\s+\d{1,2}\s+\d{1,2}:\d{2}:\d{2}(?:\.\d+)?)\s+(\S+)\s+(.*)$/);
      if (m) { const tt = parseTime(m[1], year); if (tt !== null) ev.push({ t: tt, src: name, device: m[2], signal: (m[3].match(/%[\w-]+/) || [""])[0], value: (m[3].match(/\b(down|up)\b/i) || [""])[0], desc: m[3], quality: "", recv: null, line: i + 1 }); }
    });
    return { name, kind: "syslog", events: ev, offset: 0, tz: 0 };
  }
  // CSV
  const d = [",", ";", "\t"].sort((a, b) => lines[0].split(b).length - lines[0].split(a).length)[0];
  const h = splitCsv(lines[0], d);
  const ci = (re: RegExp, not?: RegExp) => h.findIndex((x) => re.test(x) && !(not && not.test(x)));
  const ct = ci(/^(time|timestamp|event time|date|date and time|time \(utc\)|timecreated|time created|utc time|local time)/i, /quality/i);
  if (ct < 0) return { name, kind: "unknown", events: [], offset: 0, tz: 0, err: `No time column found (columns: ${h.join(", ")}).` };
  const cdv = ci(/^(device|ied|source|station|host|computer|machinename|providername)$/i), csg = ci(/^(signal|point|tag|object|reference|event|id|event id)$/i), cv = ci(/^(value|state|status|new value)$/i), cd = ci(/desc|message|text|name/i), cq = ci(/quality|time quality|tq/i), cr = ci(/^(received|receive time|arrival)/i);
  lines.slice(1).forEach((l, i) => {
    const r = splitCsv(l, d), tt = parseTime(r[ct] ?? "", year);
    if (tt === null) return;
    ev.push({ t: tt, src: name, device: cdv >= 0 ? r[cdv] : name.replace(/\.\w+$/, ""), signal: csg >= 0 ? r[csg] : cd >= 0 ? r[cd] : "", value: cv >= 0 ? r[cv] : "", desc: cd >= 0 ? r[cd] : "", quality: cq >= 0 ? r[cq] : "", recv: cr >= 0 ? parseTime(r[cr] ?? "", year) : null, line: i + 2 });
  });
  return { name, kind: /timecreated|providername/i.test(lines[0]) ? "Windows events" : "event list (CSV)", events: ev, offset: 0, tz: 0 };
}

export function parseCaptureEvents(name: string, buf: Uint8Array): Source {
  const fr = readCapture(buf), E = eth(fr), ev: Ev[] = [];
  const last = new Map<string, { st: number; v: string }>();
  for (const e of E) {
    const g = goose(e);
    if (!g) continue;
    const k = g.gocbRef, v = g.data.map(fmtVal).join(", "), p = last.get(k);
    if (p && g.stNum !== p.st) ev.push({ t: e.t, src: name, device: g.gocbRef.split("/")[0], signal: `GOOSE ${g.gocbRef.split("$").pop()}`, value: v, desc: `GOOSE state change stNum ${g.stNum} (publisher time ${new Date(g.t * 1000).toISOString().slice(11, 23)})`, quality: g.tq & 0x20 ? "not synchronised" : "", recv: null, line: e.no });
    last.set(k, { st: g.stNum, v });
  }
  try {
    const pk = packets(fr), c = analyse104(tcpConns(pk, [2404]));
    for (const cn of c) for (const a of cn.apdus) if (a.asdu && a.asdu.cot === 3) for (const o of a.asdu.objs) if (o.time) ev.push({ t: o.time.epoch, src: name, device: cn.server, signal: `IEC 104 CA ${a.asdu.ca} IOA ${o.ioa}`, value: o.value, desc: `${TYPES[a.asdu.type]?.id ?? a.asdu.type} spontaneous (received ${new Date(a.t * 1000).toISOString().slice(11, 23)})`, quality: o.time.invalid ? "time invalid" : o.q.join(" "), recv: a.t, line: a.no });
  } catch { /* not TCP */ }
  return { name, kind: "capture", events: ev, offset: 0, tz: 0 };
}

export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string }
export interface Suggest { src: string; offset: number; why: string }
const isOn = (v: string) => /^(1|on|true|trip|open|off->on|closed?)$/i.test(v.trim()) || /^TRUE/.test(v);
const trip = (e: Ev) => /\b(tr|op|trip|operate)\b|\.Tr\.|\.Op\.|PTRC|GCB_TRIP/i.test(`${e.signal} ${e.desc}`);
export const evTime = (e: Ev, s: Source) => e.t - s.tz * 3600 + s.offset;

export function analyseSources(S: Source[]): { findings: Finding[]; suggestions: Suggest[] } {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text }), sug: Suggest[] = [];
  const ok = S.filter((s) => s.events.length);
  for (const s of S) if (s.err) add("error", `${s.name}: ${s.err}`);
  for (const s of ok) {
    const E = s.events;
    const ns = E.filter((e) => /not ?sync|unsync|clockfailure|invalid/i.test(e.quality));
    if (ns.length) add("warning", `${s.name}: ${ns.length} of ${E.length} event(s) carry a time quality "not synchronised"/"invalid": the device clock is not locked to the station time; its time stamps cannot be compared with the other sources.`);
    const ms = E.map((e) => Math.round((e.t % 1) * 1000));
    if (E.length >= 4 && ms.every((x) => x % 1000 === 0)) add("info", `${s.name}: all time stamps are whole seconds — the resolution is too coarse for a sequence of events.`);
    else if (E.length >= 4 && ms.every((x) => x % 10 === 0)) add("info", `${s.name}: time stamps have 10 ms resolution.`);
    const seen = new Map<string, number>();
    for (const e of E) { const k = `${e.device}|${e.signal}|${e.value}|${e.t.toFixed(3)}`; seen.set(k, (seen.get(k) ?? 0) + 1); }
    const dup = [...seen.entries()].filter(([, n]) => n > 1);
    if (dup.length) add("warning", `${s.name}: ${dup.length} event(s) recorded twice with the same time (${dup[0][0].split("|").slice(0, 3).join(" ")}) — the event is counted twice in reports, often a gateway sending both a spontaneous and an interrogation response.`);
    const by = new Map<string, Ev[]>();
    for (const e of E) by.set(`${e.device}|${e.signal}`, [...(by.get(`${e.device}|${e.signal}`) ?? []), e]);
    for (const [k, es] of by) { es.sort((a, b) => a.t - b.t); for (let i = 0; i + 5 < es.length; i++) if (es[i + 5].t - es[i].t <= 10) { add("warning", `${s.name}: ${k.replace("|", " ")} changes ${es.length} times (6 changes within ${(es[i + 5].t - es[i].t).toFixed(1)} s) — chattering. It floods the event list and can hide real events; check the contact or use a debounce / chatter filter.`); break; } }
    const rb = E.filter((e) => e.recv !== null && e.recv - e.t < -0.005);
    if (rb.length) add("error", `${s.name}: ${rb.length} event(s) received before they happened (receive time earlier than event time) — the clocks of the device and the receiver differ by at least ${Math.max(...rb.map((e) => e.t - e.recv!)).toFixed(3)} s.`);
    const late = E.filter((e) => e.recv !== null && e.recv - e.t > 1);
    if (late.length) add("info", `${s.name}: ${late.length} event(s) reached the receiver more than 1 s after they happened.`);
  }
  // whole-hour offsets: local time instead of UTC
  if (ok.length > 1) {
    const med = (s: Source) => { const t = s.events.map((e) => e.t).sort((a, b) => a - b); return t[Math.floor(t.length / 2)]; };
    const ref = ok.map(med).sort((a, b) => a - b)[Math.floor(ok.length / 2)];
    for (const s of ok) {
      const d = med(s) - ref, h = Math.round(d / 3600);
      if (h !== 0 && Math.abs(d - h * 3600) < 120) { sug.push({ src: s.name, offset: -h * 3600, why: `about ${h} h from the other sources: local time (UTC${h > 0 ? "+" : ""}${h}) instead of UTC` }); add("warning", `${s.name} is ${h > 0 ? "+" : ""}${h} h from the other sources: it uses local time. Apply a ${-h} h correction to put it on UTC.`); }
    }
  }
  // causality: an event that says it was received from device X must come after X's corresponding event
  const all = ok.flatMap((s) => s.events.map((e) => ({ e, s })));
  const devices = [...new Set(all.map((x) => x.e.device).filter(Boolean))];
  for (const { e, s } of all) {
    const txt = `${e.desc} ${e.signal}`;
    if (!/receiv|from|intertrip|goose|ind_/i.test(txt) || !isOn(e.value)) continue;
    const other = devices.find((d) => d !== e.device && txt.includes(d));
    if (!other) continue;
    const corrE = evTime(e, s), hs = suggestFor(sug, s.name);
    const cands = all.filter((x) => x.s !== s && (x.e.device === other || x.e.device.startsWith(other)) && trip(x.e) && isOn(x.e.value)).map((x) => ({ ...x, tt: evTime(x.e, x.s) + suggestFor(sug, x.s.name) }));
    const near = cands.sort((a, b) => Math.abs(a.tt - (corrE + hs)) - Math.abs(b.tt - (corrE + hs)))[0];
    if (!near || Math.abs(near.tt - (corrE + hs)) > 5) continue;
    const dt = corrE + hs - near.tt;
    if (dt < 0) {
      const off = -dt + 0.004;
      add("error", `${s.name}: "${e.desc || e.signal}" is recorded ${(-dt * 1000).toFixed(0)} ms BEFORE ${other} sent it (${near.s.name}: ${near.e.desc || near.e.signal}). Cause and effect are reversed, so ${e.device}'s clock is behind by at least ${(-dt * 1000).toFixed(0)} ms. Suggested correction +${(off * 1000).toFixed(0)} ms (assuming about 4 ms GOOSE transfer time).`);
      if (!sug.some((x) => x.src === s.name)) sug.push({ src: s.name, offset: off, why: `received ${(-dt * 1000).toFixed(0)} ms before it was sent by ${other}` });
    } else if (dt > 0.1) add("info", `${s.name}: ${e.device} records the signal from ${other} ${(dt * 1000).toFixed(0)} ms after it was sent — slow for a GOOSE (expected a few ms); check time synchronisation or the transfer path.`);
  }
  // trip -> breaker open plausibility per device
  for (const s of ok) for (const tr of s.events.filter((e) => trip(e) && isOn(e.value))) {
    const op = s.events.find((e) => /pos|cb|breaker|xcbr|qa\d/i.test(`${e.signal} ${e.desc}`) && /off|open/i.test(e.value) && e.t >= tr.t - 0.01 && e.t - tr.t < 1);
    if (op) { const d = (op.t - tr.t) * 1000; if (d < 10 || d > 150) add("warning", `${s.name}: breaker open ${d.toFixed(0)} ms after the trip — outside the usual 20–100 ms; check the time stamps or the breaker.`); }
  }
  if (!F.some((f) => f.sev !== "info") && ok.length) add("ok", `${ok.reduce((n, s) => n + s.events.length, 0)} events from ${ok.length} source(s); no time-quality, duplicate, chattering or causality problems found.`);
  return { findings: F, suggestions: sug };
}
const suggestFor = (sug: Suggest[], name: string) => sug.filter((x) => x.src === name && Math.abs(x.offset) >= 3000).reduce((a, x) => a + x.offset, 0);

export interface Row { t: number; rel: number; src: string; device: string; signal: string; value: string; desc: string; quality: string }
export function timeline(S: Source[], windowS = 0, zero?: number): { rows: Row[]; t0: number } {
  const rows = S.flatMap((s) => s.events.map((e) => ({ e, s, t: evTime(e, s) }))).sort((a, b) => a.t - b.t);
  const firstTrip = rows.find((r) => trip(r.e) && isOn(r.e.value));
  const t0 = zero ?? firstTrip?.t ?? rows[0]?.t ?? 0;
  return { t0, rows: rows.filter((r) => !windowS || Math.abs(r.t - t0) <= windowS).map((r) => ({ t: r.t, rel: r.t - t0, src: r.s.name, device: r.e.device, signal: r.e.signal, value: r.e.value, desc: r.e.desc, quality: r.e.quality })) };
}
export const isoMs = (t: number) => new Date(Math.round(t * 1000)).toISOString().replace("T", " ").replace("Z", "");
export function timelineCsv(rows: Row[]): string {
  const e = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return ["Time (UTC),Relative (ms),Source,Device,Signal,Value,Description,Quality", ...rows.map((r) => [isoMs(r.t), (r.rel * 1000).toFixed(1), r.src, r.device, r.signal, r.value, r.desc, r.quality].map((x) => e(String(x))).join(","))].join("\r\n");
}
