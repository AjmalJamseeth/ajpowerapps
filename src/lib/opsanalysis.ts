// Operations analysis of SCADA records: alarm system performance (EEMUA 191 /
// ISA-18.2 / IEC 62682 key performance indicators) from an alarm journal, and
// communication availability (MTBF, MTTR, outages, common-cause events) from a
// status log.

import { parseTime } from "./timeline";

const split = (l: string, d: string) => { const o: string[] = []; let c = "", q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; } else if (ch === '"') q = true; else if (ch === d) { o.push(c.trim()); c = ""; } else c += ch; } o.push(c.trim()); return o; };
function table(text: string) {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const d = [",", ";", "\t"].sort((a, b) => (lines[0] ?? "").split(b).length - (lines[0] ?? "").split(a).length)[0];
  return { h: split(lines[0] ?? "", d), rows: lines.slice(1).map((l) => split(l, d)) };
}
export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string }

/* ------------------------------------------------------------ alarms */
export interface Alarm { t: number; tag: string; desc: string; state: "alarm" | "return" | "ack" | "other"; prio: "high" | "medium" | "low" | "?" }
export function parseAlarms(text: string): { alarms: Alarm[]; err?: string } {
  const { h, rows } = table(text), ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const ct = ci(/^(time|timestamp|date|event time|alarm time)/i), cg = ci(/^(tag|point|alarm|name|source|object)$/i), cd = ci(/desc|message|text/i), cs = ci(/^(state|status|event|condition|type)$/i), cp = ci(/prio|severity|class/i);
  if (ct < 0 || (cg < 0 && cd < 0)) return { alarms: [], err: `Columns needed: time and tag (found: ${h.join(", ")}).` };
  const out: Alarm[] = [];
  for (const r of rows) {
    const t = parseTime(r[ct] ?? ""); if (t === null) continue;
    const s = (cs >= 0 ? r[cs] : "ALM").toLowerCase(), p = (cp >= 0 ? r[cp] : "").toLowerCase();
    const state = /^(rtn|return|normal|clear|cleared|off|0|inactive|ok)/.test(s) ? "return" : /^(ack|acknowledged)/.test(s) ? "ack" : /^(alm|alarm|on|1|active|raise|unack|new|come)/.test(s) || !s ? "alarm" : "other";
    const prio = /^(1|high|critical|emergency|urgent|h)$/.test(p) ? "high" : /^(2|medium|med|m|warning)$/.test(p) ? "medium" : /^(3|4|low|l|info|minor)$/.test(p) ? "low" : "?";
    out.push({ t, tag: cg >= 0 ? r[cg] : r[cd], desc: cd >= 0 ? r[cd] : "", state, prio });
  }
  return { alarms: out.sort((a, b) => a.t - b.t) };
}

export interface AlarmKpi {
  days: number; total: number; perDay: number; per10: number; peak10: number; pctFlood: number; floods: { start: number; end: number; count: number; top: string[] }[];
  top: { tag: string; desc: string; n: number; pct: number }[]; top10pct: number; chatter: { tag: string; desc: string; n: number }[]; standing: { tag: string; desc: string; since: number; hours: number }[];
  prio: Record<string, number>; pairs: { a: string; b: string; n: number; ratio: number }[]; findings: Finding[];
}
export function alarmKpi(A: Alarm[], operators = 1, end?: number): AlarmKpi {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const al = A.filter((a) => a.state === "alarm");
  const t0 = A[0]?.t ?? 0, t1 = end ?? A[A.length - 1]?.t ?? 0, days = Math.max(1 / 24, (t1 - t0) / 86400);
  const bins = new Map<number, Alarm[]>();
  for (const a of al) { const b = Math.floor((a.t - t0) / 600); bins.set(b, [...(bins.get(b) ?? []), a]); }
  const nb = Math.max(1, Math.ceil((t1 - t0) / 600));
  const counts = [...Array(nb).keys()].map((i) => (bins.get(i)?.length ?? 0) / operators);
  const per10 = al.length / operators / nb, peak10 = Math.max(0, ...counts), pctFlood = (100 * counts.filter((c) => c > 10).length) / nb;
  // floods: consecutive 10-min windows above 10 alarms
  const floods: AlarmKpi["floods"] = [];
  for (let i = 0; i < nb; i++) if (counts[i] > 10) {
    let j = i; while (j + 1 < nb && counts[j + 1] > 10) j++;
    const xs = al.filter((a) => a.t >= t0 + i * 600 && a.t < t0 + (j + 1) * 600), m = new Map<string, number>();
    for (const a of xs) m.set(a.tag, (m.get(a.tag) ?? 0) + 1);
    floods.push({ start: t0 + i * 600, end: t0 + (j + 1) * 600, count: xs.length, top: [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, n]) => `${k} (${n})`) });
    i = j;
  }
  const tm = new Map<string, { desc: string; n: number }>();
  for (const a of al) { const e = tm.get(a.tag) ?? { desc: a.desc, n: 0 }; e.n++; tm.set(a.tag, e); }
  const top = [...tm.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10).map(([tag, e]) => ({ tag, desc: e.desc, n: e.n, pct: (100 * e.n) / Math.max(1, al.length) }));
  const top10pct = top.reduce((s, x) => s + x.pct, 0);
  // chattering: 3 or more alarms of one tag within 60 s
  const chatter: AlarmKpi["chatter"] = [];
  for (const [tag, e] of tm) { const ts = al.filter((a) => a.tag === tag).map((a) => a.t); let c = false; for (let i = 0; i + 2 < ts.length; i++) if (ts[i + 2] - ts[i] <= 60) { c = true; break; } if (c) chatter.push({ tag, desc: e.desc, n: e.n }); }
  // standing: last event of a tag is an alarm older than 24 h at the end of the record
  const standing: AlarmKpi["standing"] = [];
  const hasReturns = A.some((a) => a.state === "return");
  if (hasReturns) for (const tag of tm.keys()) { const ev = A.filter((a) => a.tag === tag && (a.state === "alarm" || a.state === "return")); const last = ev[ev.length - 1]; if (last?.state === "alarm" && t1 - last.t > 86400) standing.push({ tag, desc: last.desc, since: last.t, hours: (t1 - last.t) / 3600 }); }
  const prio: Record<string, number> = { high: 0, medium: 0, low: 0, "?": 0 };
  for (const a of al) prio[a.prio]++;
  // consequential alarms: B follows A within 2 s in at least 80 % of A's occurrences (A at least 3 times)
  const pairs: AlarmKpi["pairs"] = [];
  const tags = [...tm.keys()].filter((k) => tm.get(k)!.n >= 3).slice(0, 200);
  for (const a of tags) { const ta = al.filter((x) => x.tag === a).map((x) => x.t); for (const b of tags) { if (a === b) continue; const tb = al.filter((x) => x.tag === b).map((x) => x.t); const n = ta.filter((t) => tb.some((u) => u - t >= 0 && u - t <= 2)).length; if (n >= 3 && n / ta.length >= 0.8) pairs.push({ a, b, n, ratio: n / ta.length }); } }
  pairs.sort((x, y) => y.n - x.n);
  const perDay = al.length / operators / days;
  // findings against EEMUA 191 / ISA-18.2 guidance
  add(per10 <= 1 ? "ok" : per10 <= 2 ? "warning" : "error", `Average ${per10.toFixed(2)} alarms per 10 minutes per operator (${perDay.toFixed(0)} per day). Guidance: about 1 per 10 min (≈150 per day) is very likely acceptable, about 2 (≈300 per day) the most manageable.`);
  if (pctFlood > 1) add("warning", `${pctFlood.toFixed(1)} % of 10-minute periods are floods (more than 10 alarms); guidance is below about 1 %. Peak ${peak10.toFixed(0)} alarms in 10 minutes.`); else add("ok", `Flood periods ${pctFlood.toFixed(1)} % (peak ${peak10.toFixed(0)} in 10 minutes).`);
  if (floods.length) add("info", `${floods.length} flood(s): ${floods.slice(0, 3).map((f) => `${new Date(f.start * 1000).toISOString().slice(0, 16).replace("T", " ")} (${f.count} alarms; most: ${f.top.slice(0, 3).join(", ")})`).join("; ")}.`);
  if (tm.size < 30) add("info", `Only ${tm.size} different alarms in the journal; the three most frequent (${top.slice(0, 3).map((x) => x.tag).join(", ")}) make ${top.slice(0, 3).reduce((s, x) => s + x.pct, 0).toFixed(0)} % of all alarms — start the rationalisation with them.`);
  else if (top10pct > 5) add("warning", `The 10 most frequent alarms make ${top10pct.toFixed(0)} % of all alarms (guidance: a few per cent). Fixing these 'bad actors' gives the largest reduction: ${top.slice(0, 3).map((x) => x.tag).join(", ")}.`);
  if (chatter.length) add("warning", `${chatter.length} chattering alarm(s) (3 or more within a minute): ${chatter.slice(0, 5).map((c) => c.tag).join(", ")}. Add deadband / on-off delay or repair the signal.`);
  if (standing.length) add("warning", `${standing.length} standing alarm(s) active for more than 24 h: ${standing.slice(0, 5).map((s) => `${s.tag} (${s.hours.toFixed(0)} h)`).join(", ")}. A standing alarm is no longer an alarm: fix the cause, shelve it with a review date, or re-classify it.`);
  else if (!hasReturns) add("info", "The journal has no return-to-normal events, so standing alarms cannot be found.");
  const known = prio.high + prio.medium + prio.low;
  if (known) { const h = (100 * prio.high) / known, m = (100 * prio.medium) / known; add(h > 10 ? "warning" : "ok", `Priority distribution of alarms: high ${h.toFixed(0)} %, medium ${m.toFixed(0)} %, low ${(100 - h - m).toFixed(0)} % (guidance about 5 / 15 / 80 %).${h > 10 ? " Too many high-priority alarms dilute their meaning." : ""}`); }
  if (pairs.length) add("info", `${pairs.length} consequential pair(s): the second alarm almost always follows the first within 2 s, e.g. ${pairs[0].a} → ${pairs[0].b} (${pairs[0].n}×). Candidates for state-based suppression.`);
  return { days, total: al.length, perDay, per10, peak10, pctFlood, floods, top, top10pct, chatter, standing, prio, pairs: pairs.slice(0, 20), findings: F };
}

/* ------------------------------------------------------------ availability */
export interface StatusEv { t: number; dev: string; up: boolean }
export function parseStatus(text: string): { ev: StatusEv[]; err?: string } {
  const { h, rows } = table(text), ci = (re: RegExp) => h.findIndex((x) => re.test(x));
  const ct = ci(/^(time|timestamp|date|event time)/i), cd = ci(/^(device|link|ied|rtu|station|connection|point|tag|name)$/i), cs = ci(/^(state|status|value|event|condition)$/i);
  if (ct < 0 || cd < 0 || cs < 0) return { ev: [], err: `Columns needed: time, device and state (found: ${h.join(", ")}).` };
  const ev: StatusEv[] = [];
  for (const r of rows) {
    const t = parseTime(r[ct] ?? ""), s = (r[cs] ?? "").toLowerCase(); if (t === null) continue;
    const down = /down|fail|lost|error|alarm|bad|offline|disconnect|^0$|timeout|interrupt/.test(s), up = /up|ok|normal|restor|online|connect|good|^1$|return/.test(s);
    if (!down && !up) continue;
    ev.push({ t, dev: r[cd], up: up && !down });
  }
  return { ev: ev.sort((a, b) => a.t - b.t) };
}
export interface Outage { dev: string; start: number; end: number; open: boolean }
export interface DevAvail { dev: string; down: number; outages: number; avail: number; mtbf: number | null; mttr: number | null; longest: number; flaps: number }
export function availability(E: StatusEv[], start?: number, end?: number, target = 99.95, flapS = 10) {
  const F: Finding[] = [], add = (sev: Finding["sev"], text: string) => F.push({ sev, text });
  const t0 = start ?? E[0]?.t ?? 0, t1 = end ?? E[E.length - 1]?.t ?? 0, span = Math.max(1, t1 - t0);
  const devs = [...new Set(E.map((e) => e.dev))], outages: Outage[] = [];
  for (const d of devs) {
    let downAt: number | null = null;
    const ev = E.filter((e) => e.dev === d);
    if (ev[0] && ev[0].up && ev[0].t > t0) { /* starts up */ }
    for (const e of ev) { if (!e.up && downAt === null) downAt = e.t; else if (e.up && downAt !== null) { outages.push({ dev: d, start: downAt, end: e.t, open: false }); downAt = null; } }
    if (downAt !== null) outages.push({ dev: d, start: downAt, end: t1, open: true });
  }
  const rows: DevAvail[] = devs.map((d) => {
    const o = outages.filter((x) => x.dev === d), down = o.reduce((s, x) => s + (Math.min(x.end, t1) - Math.max(x.start, t0)), 0), n = o.length;
    return { dev: d, down, outages: n, avail: 100 * (1 - down / span), mtbf: n ? (span - down) / n : null, mttr: n ? down / n : null, longest: Math.max(0, ...o.map((x) => x.end - x.start)), flaps: o.filter((x) => x.end - x.start < flapS).length };
  }).sort((a, b) => a.avail - b.avail);
  const hrs = (s: number) => (s >= 3600 ? `${(s / 3600).toFixed(1)} h` : s >= 60 ? `${(s / 60).toFixed(1)} min` : `${s.toFixed(0)} s`);
  for (const r of rows) {
    if (r.avail < target) add(r.avail < target - 0.5 ? "error" : "warning", `${r.dev}: availability ${r.avail.toFixed(3)} % (target ${target} %), ${r.outages} outage(s), ${hrs(r.down)} down, longest ${hrs(r.longest)}.`);
    if (r.flaps >= 3) add("warning", `${r.dev}: ${r.flaps} outages shorter than ${flapS} s — a flapping link (loose connector, duplex mismatch, timer settings at the limit).`);
  }
  const open = outages.filter((o) => o.open);
  if (open.length) add("warning", `Still down at the end of the record: ${open.map((o) => `${o.dev} (since ${new Date(o.start * 1000).toISOString().slice(0, 16).replace("T", " ")})`).join(", ")}.`);
  // common cause: 3 or more devices going down within 5 s of each other
  const starts = [...outages].sort((a, b) => a.start - b.start), common: { t: number; devs: string[]; dur: number }[] = [];
  for (let i = 0; i < starts.length; i++) { const g = starts.filter((o) => o.start >= starts[i].start && o.start - starts[i].start <= 5); const ds = [...new Set(g.map((o) => o.dev))]; if (ds.length >= 3 && !common.some((c) => Math.abs(c.t - starts[i].start) <= 5)) common.push({ t: starts[i].start, devs: ds, dur: Math.max(...g.map((o) => o.end - o.start)) }); }
  for (const c of common) add("warning", `Common-cause outage at ${new Date(c.t * 1000).toISOString().slice(0, 19).replace("T", " ")} UTC: ${c.devs.join(", ")} went down together for up to ${hrs(c.dur)}. Look for what they share — a switch, a power supply, the gateway or a firewall.`);
  const overall = rows.length ? rows.reduce((s, r) => s + r.avail, 0) / rows.length : 100;
  if (!F.some((f) => f.sev !== "info")) add("ok", `All ${rows.length} links meet ${target} % availability.`);
  return { rows, outages, common, overall, span, t0, t1, findings: F };
}
