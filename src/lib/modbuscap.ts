// Modbus TCP capture analysis: MBAP framing, request/response matching by
// transaction identifier, exceptions, response times, unanswered requests,
// polling blocks and a register map of everything that was read or written.

import { type TcpConn, markAt } from "./pcapnet";

export const FC: Record<number, string> = {
  1: "Read Coils", 2: "Read Discrete Inputs", 3: "Read Holding Registers", 4: "Read Input Registers", 5: "Write Single Coil", 6: "Write Single Register",
  7: "Read Exception Status", 8: "Diagnostics", 11: "Get Comm Event Counter", 15: "Write Multiple Coils", 16: "Write Multiple Registers", 17: "Report Server ID",
  22: "Mask Write Register", 23: "Read/Write Multiple Registers", 43: "Encapsulated Interface (Read Device Identification)",
};
export const EXC: Record<number, [string, string]> = {
  1: ["Illegal function", "The device does not support this function code."],
  2: ["Illegal data address", "The address (or address + quantity) is outside the device's register map: wrong map, wrong offset (1-based vs 0-based) or block too long."],
  3: ["Illegal data value", "A value in the request is not allowed (quantity out of range, bad coil value)."],
  4: ["Server device failure", "The device failed while executing the request."],
  5: ["Acknowledge", "Accepted; processing takes long."],
  6: ["Server device busy", "Retry later."],
  8: ["Memory parity error", "Record file read failed a consistency check."],
  10: ["Gateway path unavailable", "The gateway has no path to the target unit (unit id not configured)."],
  11: ["Gateway target device failed to respond", "The gateway forwarded the request but the serial device did not answer: check the serial line, address and timing."],
};
export const TABLE: Record<number, "coil" | "discrete" | "holding" | "input"> = { 1: "coil", 2: "discrete", 3: "holding", 4: "input", 5: "coil", 6: "holding", 15: "coil", 16: "holding", 23: "holding" };
const NOTE: Record<string, number> = { coil: 0, discrete: 100000, input: 300000, holding: 400000 };

export interface Mb { dir: "req" | "rsp"; t: number; no: number; tid: number; pid: number; len: number; unit: number; fc: number; pdu: Uint8Array; err?: string }
export interface Txn { req: Mb; rsp?: Mb; ms?: number; exc?: number; addr?: number; qty?: number; values?: number[]; write?: boolean }
export interface RegRow { unit: number; table: string; addr: number; notation: string; reads: number; writes: number; last: number | null; min: number | null; max: number | null; changes: number }
export interface Finding { sev: "error" | "warning" | "info" | "ok"; text: string; no?: number }
export interface ConnMb {
  client: string; server: string; start: number; end: number; txns: Txn[]; findings: Finding[]; regs: RegRow[];
  blocks: { unit: number; fc: number; addr: number; qty: number; count: number; periodS: number | null }[];
  stats: { req: number; rsp: number; exc: number; noResp: number; avgMs: number | null; maxMs: number | null };
}

export function frameMb(bytes: Uint8Array): { off: number; d: Uint8Array }[] {
  const out: { off: number; d: Uint8Array }[] = [];
  let o = 0;
  while (o + 8 <= bytes.length) {
    const len = (bytes[o + 4] << 8) | bytes[o + 5];
    if (len < 2 || len > 254) { o++; continue; }
    if (o + 6 + len > bytes.length) break;
    out.push({ off: o, d: bytes.subarray(o, o + 6 + len) });
    o += 6 + len;
  }
  return out;
}

const u16 = (d: Uint8Array, o: number) => (d[o] << 8) | d[o + 1];

export function analyseMb(conns: TcpConn[], port = 502, timeoutS = 1): ConnMb[] {
  return conns.filter((c) => c.port === port).map((c) => {
    const F: Finding[] = [], add = (sev: Finding["sev"], text: string, no?: number) => F.push({ sev, text, no });
    const msgs: Mb[] = [];
    for (const [dir, D] of [["req", c.c2s], ["rsp", c.s2c]] as const) {
      for (const f of frameMb(D.bytes)) {
        const m = markAt(D, f.off), d = f.d;
        const x: Mb = { dir, t: m.t, no: m.no, tid: u16(d, 0), pid: u16(d, 2), len: u16(d, 4), unit: d[6], fc: d[7], pdu: d.subarray(7) };
        if (x.pid !== 0) x.err = `protocol identifier ${x.pid} (must be 0 for Modbus)`;
        msgs.push(x);
      }
    }
    msgs.sort((a, b) => a.t - b.t || a.no - b.no);
    const txns: Txn[] = [], open = new Map<number, Txn>();
    for (const m of msgs) {
      if (m.err) add("error", `Frame ${m.no}: ${m.err}.`, m.no);
      if (m.dir === "req") {
        if (open.has(m.tid)) add("warning", `Transaction id ${m.tid} reused while the previous request with that id is unanswered.`, m.no);
        const tx: Txn = { req: m };
        const p = m.pdu;
        if ([1, 2, 3, 4].includes(m.fc) && p.length >= 5) { tx.addr = u16(p, 1); tx.qty = u16(p, 3); }
        else if ([5, 6].includes(m.fc) && p.length >= 5) { tx.addr = u16(p, 1); tx.qty = 1; tx.values = [m.fc === 5 ? (u16(p, 3) === 0xff00 ? 1 : 0) : u16(p, 3)]; tx.write = true; if (m.fc === 5 && ![0xff00, 0].includes(u16(p, 3))) add("error", `Write Single Coil with value 0x${u16(p, 3).toString(16)}: only 0xFF00 (ON) and 0x0000 (OFF) are valid.`, m.no); }
        else if ([15, 16].includes(m.fc) && p.length >= 6) {
          tx.addr = u16(p, 1); tx.qty = u16(p, 3); tx.write = true; const bc = p[5];
          if (m.fc === 16) { tx.values = []; for (let i = 0; i < tx.qty && 6 + 2 * i + 1 < p.length; i++) tx.values.push(u16(p, 6 + 2 * i)); if (bc !== tx.qty * 2) add("error", `Write Multiple Registers: byte count ${bc} does not match quantity ${tx.qty} (expected ${tx.qty * 2}).`, m.no); }
          else { tx.values = []; for (let i = 0; i < tx.qty; i++) tx.values.push((p[6 + (i >> 3)] >> (i & 7)) & 1); }
        }
        if (tx.qty !== undefined && ((m.fc <= 2 && tx.qty > 2000) || ((m.fc === 3 || m.fc === 4) && tx.qty > 125) || (m.fc === 16 && tx.qty > 123))) add("error", `${FC[m.fc]} of ${tx.qty} items exceeds the protocol limit (2000 bits / 125 registers / 123 written registers).`, m.no);
        txns.push(tx); open.set(m.tid, tx);
      } else {
        const tx = open.get(m.tid);
        if (!tx) { add("warning", `Response with transaction id ${m.tid} that matches no open request (late answer after a time-out, or duplicated).`, m.no); continue; }
        open.delete(m.tid);
        tx.rsp = m; tx.ms = (m.t - tx.req.t) * 1000;
        if (m.unit !== tx.req.unit) add("warning", `Response unit id ${m.unit} differs from the request (${tx.req.unit}).`, m.no);
        if (m.fc === (tx.req.fc | 0x80)) tx.exc = m.pdu[1];
        else if (m.fc !== tx.req.fc) add("error", `Response function code ${m.fc} to a request with function code ${tx.req.fc}.`, m.no);
        else if ([1, 2, 3, 4].includes(m.fc)) {
          const bc = m.pdu[1], data = m.pdu.subarray(2);
          const want = m.fc <= 2 ? Math.ceil((tx.qty ?? 0) / 8) : (tx.qty ?? 0) * 2;
          if (bc !== want || data.length !== bc) add("error", `${FC[m.fc]} response: byte count ${bc} with ${data.length} data bytes; the request asked for ${tx.qty} item(s) = ${want} bytes.`, m.no);
          tx.values = [];
          if (m.fc <= 2) for (let i = 0; i < (tx.qty ?? 0); i++) tx.values.push((data[i >> 3] >> (i & 7)) & 1);
          else for (let i = 0; i + 1 < data.length; i += 2) tx.values.push(u16(data, i));
        }
      }
    }
    // findings
    const now = msgs.length ? msgs[msgs.length - 1].t : 0;
    const noResp = txns.filter((x) => !x.rsp && now - x.req.t > timeoutS);
    if (noResp.length) add("error", `${noResp.length} request(s) without a response (time-out ${timeoutS} s): ${[...new Set(noResp.map((x) => `unit ${x.req.unit} ${FC[x.req.fc] ?? "fc " + x.req.fc}${x.addr !== undefined ? ` @${x.addr}` : ""}`))].slice(0, 6).join(", ")}. Check that the unit id is right and the device (or the device behind the gateway) is online.`, noResp[0].req.no);
    const excs = txns.filter((x) => x.exc !== undefined);
    const byExc = new Map<string, Txn[]>();
    for (const x of excs) { const k = `${x.req.unit}|${x.req.fc}|${x.addr}|${x.exc}`; byExc.set(k, [...(byExc.get(k) ?? []), x]); }
    for (const [, xs] of byExc) { const x = xs[0], e = EXC[x.exc!] ?? [`exception ${x.exc}`, ""]; add(x.exc === 5 || x.exc === 6 ? "warning" : "error", `Unit ${x.req.unit}, ${FC[x.req.fc] ?? "fc " + x.req.fc}${x.addr !== undefined ? ` address ${x.addr}, quantity ${x.qty}` : ""}: exception ${x.exc} "${e[0]}"${xs.length > 1 ? ` (${xs.length} times)` : ""}. ${e[1]}`, x.rsp!.no); }
    const ms = txns.filter((x) => x.ms !== undefined).map((x) => x.ms!);
    const avg = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : null, max = ms.length ? Math.max(...ms) : null;
    if (max !== null && max > 500) { const slow = txns.find((x) => x.ms === max)!; add("warning", `Slowest response ${max.toFixed(0)} ms (unit ${slow.req.unit}, ${FC[slow.req.fc]}); average ${avg!.toFixed(0)} ms. Slow answers usually come from a gateway polling serial devices; set the master's time-out above the worst case.`, slow.rsp!.no); }
    const writes = txns.filter((x) => x.write);
    if (writes.length) add("info", `${writes.length} write request(s) seen (${[...new Set(writes.map((x) => FC[x.req.fc]))].join(", ")}). Modbus has no authentication: any device that reaches port 502 can write; restrict it with the firewall.`);
    // register map
    const regs = new Map<string, RegRow>();
    for (const x of txns) {
      if (x.addr === undefined || !x.values || x.exc !== undefined || (!x.rsp && !x.write)) continue;
      const tb = TABLE[x.req.fc]; if (!tb) continue;
      x.values.forEach((v, i) => {
        const a = x.addr! + i, k = `${x.req.unit}|${tb}|${a}`;
        let r = regs.get(k);
        if (!r) regs.set(k, (r = { unit: x.req.unit, table: tb, addr: a, notation: String(NOTE[tb] + a + 1).padStart(tb === "coil" ? 5 : 6, "0"), reads: 0, writes: 0, last: null, min: null, max: null, changes: 0 }));
        if (x.write) r.writes++; else r.reads++;
        if (r.last !== null && r.last !== v) r.changes++;
        r.last = v; r.min = r.min === null ? v : Math.min(r.min, v); r.max = r.max === null ? v : Math.max(r.max, v);
      });
    }
    // polling blocks
    const bm = new Map<string, Txn[]>();
    for (const x of txns.filter((x) => !x.write && x.addr !== undefined)) { const k = `${x.req.unit}|${x.req.fc}|${x.addr}|${x.qty}`; bm.set(k, [...(bm.get(k) ?? []), x]); }
    const blocks = [...bm.values()].map((xs) => { const ts = xs.map((x) => x.req.t); const per = ts.length > 1 ? (ts[ts.length - 1] - ts[0]) / (ts.length - 1) : null; return { unit: xs[0].req.unit, fc: xs[0].req.fc, addr: xs[0].addr!, qty: xs[0].qty!, count: xs.length, periodS: per }; }).sort((a, b) => a.unit - b.unit || a.fc - b.fc || a.addr - b.addr);
    const ov = blocks.filter((b, i) => blocks.some((o, j) => j !== i && o.unit === b.unit && o.fc === b.fc && o.addr < b.addr + b.qty && b.addr < o.addr + o.qty && !(o.addr === b.addr && o.qty === b.qty)));
    if (ov.length) add("info", `Overlapping polling blocks for unit ${ov[0].unit} (${FC[ov[0].fc]}): the same registers are read more than once per cycle.`);
    if (!F.some((f) => f.sev === "error" || f.sev === "warning") && txns.length) add("ok", `${txns.length} transactions, every request answered without exception.`);
    return {
      client: c.client, server: c.server, start: c.start, end: c.end, txns, findings: F, blocks,
      regs: [...regs.values()].sort((a, b) => a.unit - b.unit || a.table.localeCompare(b.table) || a.addr - b.addr),
      stats: { req: txns.length, rsp: txns.filter((x) => x.rsp).length, exc: excs.length, noResp: noResp.length, avgMs: avg, maxMs: max },
    };
  });
}

/** Register map as CSV (opens in Excel; fits the SCADA Tag Database Validator columns). */
export function regMapCsv(cs: ConnMb[]): string {
  const L = ["Device,Unit,Table,Address (0-based),Register notation,Reads,Writes,Last value,Min,Max,Changes,Tag,Description,Type,Unit of measure"];
  for (const c of cs) for (const r of c.regs) L.push([c.server, r.unit, r.table, r.addr, r.notation, r.reads, r.writes, r.last ?? "", r.min ?? "", r.max ?? "", r.changes, "", "", r.table === "coil" || r.table === "discrete" ? "digital" : "register", ""].join(","));
  return L.join("\r\n");
}
