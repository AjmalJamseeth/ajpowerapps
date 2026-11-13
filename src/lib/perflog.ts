// Performance and disk log analyser: reads a Windows Performance Monitor CSV
// (typeperf, relog or a Data Collector Set saved as CSV) and judges CPU,
// memory, disk, network and process counters against stated rules of thumb.

export interface Series {
  counter: string; // full path, e.g. \\HOST\Processor(_Total)\% Processor Time
  object: string; // Processor
  instance: string; // _Total
  name: string; // % Processor Time
  values: number[];
}

export interface PerfLog {
  host: string;
  times: string[];
  series: Series[];
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let c = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') (c += '"'), i++;
        else q = false;
      } else c += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") (out.push(c), (c = ""));
    else c += ch;
  }
  out.push(c);
  return out;
}

export function parsePerfCsv(text: string): PerfLog | null {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return null;
  const head = splitCsv(lines[0]);
  if (head.length < 2) return null;
  const series: Series[] = head.slice(1).map((h) => {
    const m = h.match(/^\\\\([^\\]+)\\([^\\(]+)(?:\(([^)]*)\))?\\(.+)$/);
    return { counter: h, object: m ? m[2] : h, instance: m ? m[3] ?? "" : "", name: m ? m[4] : h, values: [] };
  });
  const host = (head[1].match(/^\\\\([^\\]+)/) || [])[1] ?? "";
  const times: string[] = [];
  for (const l of lines.slice(1)) {
    const c = splitCsv(l);
    if (c.length < 2) continue;
    times.push(c[0]);
    series.forEach((s, k) => {
      const v = parseFloat(String(c[k + 1]).trim());
      s.values.push(Number.isFinite(v) ? v : NaN);
    });
  }
  return { host, times, series };
}

export interface Stat {
  min: number;
  avg: number;
  max: number;
  p95: number;
  n: number;
}
export function stat(v: number[]): Stat | null {
  const x = v.filter(Number.isFinite).sort((a, b) => a - b);
  if (!x.length) return null;
  return { min: x[0], max: x[x.length - 1], avg: x.reduce((a, b) => a + b, 0) / x.length, p95: x[Math.min(x.length - 1, Math.floor(0.95 * (x.length - 1)))], n: x.length };
}
const share = (v: number[], f: (x: number) => boolean) => {
  const x = v.filter(Number.isFinite);
  return x.length ? (100 * x.filter(f).length) / x.length : 0;
};
/** Least-squares slope per sample. */
function slope(v: number[]): number {
  const pts = v.map((y, i) => [i, y]).filter(([, y]) => Number.isFinite(y));
  const n = pts.length;
  if (n < 3) return 0;
  const mx = pts.reduce((a, [x]) => a + x, 0) / n, my = pts.reduce((a, [, y]) => a + y, 0) / n;
  const num = pts.reduce((a, [x, y]) => a + (x - mx) * (y - my), 0), den = pts.reduce((a, [x]) => a + (x - mx) ** 2, 0);
  return den ? num / den : 0;
}

export interface PerfFinding {
  sev: "error" | "warning" | "info" | "ok";
  area: string;
  text: string;
}
export interface PerfRow {
  area: string;
  counter: string;
  unit: string;
  s: Stat;
  rule: string;
  verdict: "ok" | "warning" | "error" | "info";
}
export interface PerfResult {
  rows: PerfRow[];
  findings: PerfFinding[];
  topCpu: { name: string; avg: number; max: number }[];
  growth: { name: string; startMB: number; endMB: number }[];
  duration: string;
}

export function analysePerf(log: PerfLog, opts: { cores: number; ramGB: number }): PerfResult {
  const rows: PerfRow[] = [];
  const F: PerfFinding[] = [];
  const find = (obj: RegExp, name: RegExp, inst?: RegExp) => log.series.filter((s) => obj.test(s.object) && name.test(s.name) && (!inst || inst.test(s.instance)));
  const add = (area: string, s: Series, unit: string, rule: string, bad: (x: number) => boolean, warn: (x: number) => boolean, scale = 1) => {
    const v = s.values.map((x) => x * scale);
    const st = stat(v);
    if (!st) return null;
    const pb = share(v, bad), pw = share(v, warn);
    const verdict: PerfRow["verdict"] = pb >= 10 ? "error" : pw >= 10 ? "warning" : "ok";
    rows.push({ area, counter: `${s.object}${s.instance ? `(${s.instance})` : ""}\\${s.name}`, unit, s: st, rule, verdict });
    return { st, pb, pw, verdict };
  };
  // CPU
  for (const s of find(/^Processor( Information)?$/, /^% Processor Time$/, /^_Total$|^0,_Total$/)) {
    const r = add("CPU", s, "%", "warning > 80 %, critical > 90 % for 10 % of the time", (x) => x > 90, (x) => x > 80);
    if (r && r.verdict !== "ok") F.push({ sev: r.verdict === "error" ? "error" : "warning", area: "CPU", text: `CPU above ${r.verdict === "error" ? 90 : 80} % for ${(r.verdict === "error" ? r.pb : r.pw).toFixed(0)} % of the samples (95th percentile ${r.st.p95.toFixed(0)} %). See the busiest processes below.` });
  }
  for (const s of find(/^System$/, /^Processor Queue Length$/)) {
    const lim = 2 * Math.max(1, opts.cores);
    const r = add("CPU", s, "threads", `warning above 2 per core (${lim} for ${opts.cores} cores)`, (x) => x > 2 * lim, (x) => x > lim);
    if (r && r.verdict !== "ok") F.push({ sev: "warning", area: "CPU", text: `Processor queue above ${lim} for ${r.pw.toFixed(0)} % of the time: threads are waiting for CPU.` });
  }
  // Memory
  for (const s of find(/^Memory$/, /^Available MBytes$/)) {
    const ram = opts.ramGB * 1024, w = Math.max(500, 0.1 * ram), b = Math.max(200, 0.05 * ram);
    const r = add("Memory", s, "MB", `warning below ${w.toFixed(0)} MB (10 % of RAM), critical below ${b.toFixed(0)} MB`, (x) => x < b, (x) => x < w);
    if (r && r.verdict !== "ok") F.push({ sev: r.verdict === "error" ? "error" : "warning", area: "Memory", text: `Available memory fell to ${r.st.min.toFixed(0)} MB. Windows pages to disk and everything slows down; look for a process whose Private Bytes keep growing.` });
  }
  for (const s of find(/^Memory$/, /^% Committed Bytes In Use$/)) {
    const r = add("Memory", s, "%", "warning > 80 %, critical > 90 %", (x) => x > 90, (x) => x > 80);
    if (r && r.verdict !== "ok") F.push({ sev: "warning", area: "Memory", text: `Committed memory above ${r.verdict === "error" ? 90 : 80} % of the commit limit: close to running out of virtual memory.` });
  }
  for (const s of find(/^Memory$/, /^Pages\/sec$/)) add("Memory", s, "/s", "information only: high values matter together with low available memory", () => false, () => false);
  // Disk latency
  for (const s of find(/^PhysicalDisk$|^LogicalDisk$/, /^Avg\. Disk sec\/(Read|Write)$/)) {
    if (/_Total/.test(s.instance)) continue;
    const r = add("Disk", s, "ms", "warning > 20 ms, critical > 50 ms for 10 % of the time", (x) => x > 50, (x) => x > 20, 1000);
    if (r && r.verdict !== "ok") F.push({ sev: r.verdict === "error" ? "error" : "warning", area: "Disk", text: `${s.object}(${s.instance}) ${s.name.replace("Avg. Disk sec/", "").toLowerCase()} latency above ${r.verdict === "error" ? 50 : 20} ms for ${(r.verdict === "error" ? r.pb : r.pw).toFixed(0)} % of the time (max ${r.st.max.toFixed(0)} ms). The disk is too slow for the load, failing, or shared with other virtual machines.` });
  }
  for (const s of find(/^PhysicalDisk$/, /^(Avg\. Disk Queue Length|Current Disk Queue Length)$/)) if (!/_Total/.test(s.instance)) add("Disk", s, "", "information: judge together with latency", () => false, () => false);
  for (const s of find(/^LogicalDisk$/, /^% Free Space$/)) {
    if (/_Total/.test(s.instance)) continue;
    const r = add("Disk", s, "%", "warning below 15 %, critical below 5 %", (x) => x < 5, (x) => x < 15);
    if (r && r.verdict !== "ok") F.push({ sev: r.verdict === "error" ? "error" : "warning", area: "Disk", text: `Volume ${s.instance} has only ${r.st.min.toFixed(1)} % of its space available. Historian, logs and Windows Update need space; a full volume stops writing.` });
  }
  // Network
  const bw = find(/^Network (Interface|Adapter)$/, /^Current Bandwidth$/);
  for (const s of find(/^Network (Interface|Adapter)$/, /^Bytes Total\/sec$/)) {
    const b = bw.find((x) => x.instance === s.instance);
    const cap = b ? stat(b.values)?.max ?? 0 : 0;
    if (cap > 0) {
      const r = add("Network", { ...s, values: s.values.map((x) => (100 * x * 8) / cap) }, "% of link", "warning > 70 % of the link speed", (x) => x > 90, (x) => x > 70);
      if (r && r.verdict !== "ok") F.push({ sev: "warning", area: "Network", text: `${s.instance}: traffic above 70 % of the ${(cap / 1e6).toFixed(0)} Mb/s link for ${r.pw.toFixed(0)} % of the time.` });
    } else add("Network", s, "B/s", "add Current Bandwidth to judge utilisation", () => false, () => false);
  }
  for (const s of find(/^Network (Interface|Adapter)$/, /^(Packets Received Errors|Packets Outbound Errors)$/)) {
    const st = stat(s.values);
    if (st && st.max > 0) F.push({ sev: "warning", area: "Network", text: `${s.instance}: ${s.name.toLowerCase()} recorded — check the cable, switch port and duplex.` });
    if (st) rows.push({ area: "Network", counter: `${s.object}(${s.instance})\\${s.name}`, unit: "", s: st, rule: "should stay 0", verdict: st.max > 0 ? "warning" : "ok" });
  }
  for (const s of find(/^Paging File$/, /^% Usage$/, /_Total/)) {
    const r = add("Memory", s, "%", "warning > 70 %", (x) => x > 90, (x) => x > 70);
    if (r && r.verdict !== "ok") F.push({ sev: "warning", area: "Memory", text: "The page file is heavily used: physical memory is not enough for the workload." });
  }
  // Processes
  const procCpu = find(/^Process$/, /^% Processor Time$/).filter((s) => !/^(_Total|Idle)$/.test(s.instance));
  const topCpu = procCpu.map((s) => ({ name: s.instance, st: stat(s.values) })).filter((x) => x.st).map((x) => ({ name: x.name, avg: x.st!.avg / Math.max(1, opts.cores), max: x.st!.max / Math.max(1, opts.cores) })).sort((a, b) => b.avg - a.avg).slice(0, 8);
  const growth: PerfResult["growth"] = [];
  for (const s of find(/^Process$/, /^Private Bytes$/)) {
    if (/^(_Total|Idle)$/.test(s.instance)) continue;
    const v = s.values.filter(Number.isFinite);
    if (v.length < 6) continue;
    const sl = slope(s.values), start = v[0] / 2 ** 20, end = v[v.length - 1] / 2 ** 20;
    if (sl > 0 && end > start * 1.3 && end - start > 100) growth.push({ name: s.instance, startMB: start, endMB: end });
  }
  for (const g of growth) F.push({ sev: "warning", area: "Memory", text: `${g.name}: private memory grew steadily from ${g.startMB.toFixed(0)} MB to ${g.endMB.toFixed(0)} MB during the log — a possible memory leak. Log it over a longer period and report it to the vendor if it keeps growing.` });
  if (!F.length && rows.length) F.push({ sev: "ok", area: "All", text: "No counter exceeded its threshold for a significant share of the log." });
  const duration = log.times.length > 1 ? `${log.times[0]} → ${log.times[log.times.length - 1]} (${log.times.length} samples)` : `${log.times.length} sample`;
  return { rows, findings: F, topCpu, growth, duration };
}

export const TYPEPERF_COUNTERS = [
  "\\Processor(_Total)\\% Processor Time",
  "\\System\\Processor Queue Length",
  "\\Memory\\Available MBytes",
  "\\Memory\\% Committed Bytes In Use",
  "\\Memory\\Pages/sec",
  "\\Paging File(_Total)\\% Usage",
  "\\PhysicalDisk(*)\\Avg. Disk sec/Read",
  "\\PhysicalDisk(*)\\Avg. Disk sec/Write",
  "\\PhysicalDisk(*)\\Current Disk Queue Length",
  "\\LogicalDisk(*)\\% Free Space",
  "\\Network Interface(*)\\Bytes Total/sec",
  "\\Network Interface(*)\\Current Bandwidth",
  "\\Network Interface(*)\\Packets Received Errors",
  "\\Process(*)\\% Processor Time",
  "\\Process(*)\\Private Bytes",
];

export function sampleCsv(): string {
  const host = "SCADA-SRV01";
  const cols = ["\\Processor(_Total)\\% Processor Time", "\\System\\Processor Queue Length", "\\Memory\\Available MBytes", "\\PhysicalDisk(0 C: D:)\\Avg. Disk sec/Read", "\\PhysicalDisk(0 C: D:)\\Avg. Disk sec/Write", "\\LogicalDisk(D:)\\% Free Space", "\\Process(historian)\\Private Bytes", "\\Process(historian)\\% Processor Time", "\\Process(MsMpEng)\\% Processor Time"];
  const L = [[`(PDH-CSV 4.0) (Arabian Standard Time)(-240)`, ...cols.map((c) => `\\\\${host}${c}`)].map((x) => `"${x}"`).join(",")];
  for (let i = 0; i < 40; i++) {
    const t = new Date(Date.UTC(2026, 10, 12, 6, 0, 0) + i * 15000);
    const ts = `11/12/2026 ${String(10 + Math.floor((i * 15) / 3600)).padStart(2, "0")}:${String(Math.floor((i * 15) / 60) % 60).padStart(2, "0")}:${String((i * 15) % 60).padStart(2, "0")}.000`;
    void t;
    const scan = i >= 18 && i <= 30; // antivirus scan window
    const cpu = scan ? 88 + (i % 3) * 3 : 22 + (i % 5) * 2;
    const vals = [cpu, scan ? 9 : 1, 1450 - i * 18, scan ? 0.065 : 0.008, scan ? 0.041 : 0.012, 11.8 - i * 0.01, (900 + i * 9) * 2 ** 20, 12 + (i % 4), scan ? 280 : 2];
    L.push([ts, ...vals.map((v) => String(+v.toFixed(6)))].map((x) => `"${x}"`).join(","));
  }
  return L.join("\r\n");
}
