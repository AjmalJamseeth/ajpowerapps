"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { FindingList, thCls as th, tdCls as td, btnCls as btn } from "@/components/FindingList";
import { parsePointList, newProject, progress, linkEvidence, punchList, resultsCsv, type Project, type Res } from "@/lib/commtest";
import { readCapture, packets, tcpConns } from "@/lib/pcapnet";
import { analyse104, cotName } from "@/lib/iec104cap";

const KEY = "ajapps.commtest.v1";
const RES: [Res, string, string][] = [["", "open", "text-muted"], ["pass", "pass", "text-pass"], ["fail", "fail", "text-fail"], ["na", "n/a", "text-muted"]];
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export default function CommissioningTestManagerPage() {
  const [P, setP] = useState<Project | null>(null);
  const [name, setName] = useState("S13 132/33 kV substation");
  const [stage, setStage] = useState<"FAT" | "SAT">("FAT");
  const [errs, setErrs] = useState<string[]>([]);
  const [msg, setMsg] = useState<{ sev: "error" | "warning" | "info" | "ok"; text: string }[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "fail">("all");
  const [tester, setTester] = useState("");
  useEffect(() => { try { const j = JSON.parse(localStorage.getItem(KEY) || "null"); if (j?.format === "AJapps commissioning tests") setP(j); } catch { /* none */ } }, []);
  useEffect(() => { if (P) try { localStorage.setItem(KEY, JSON.stringify(P)); } catch { /* storage full */ } }, [P]);
  const pr = useMemo(() => (P ? progress(P) : null), [P]);
  const load = (text: string) => { const r = parsePointList(text); setErrs(r.errs); if (r.points.length) { setP(newProject(name, stage, r.points)); setMsg([]); } };
  const openList = (f?: File) => { if (f) f.text().then(load); };
  const sample = () => fetch("/samples/S13_GW1_IEC104_signal_list.csv").then((r) => r.text()).then(load);
  const evidence = async (f?: File | null, url?: string) => {
    if (!P) return;
    const buf = f ? new Uint8Array(await f.arrayBuffer()) : new Uint8Array(await (await fetch(url!)).arrayBuffer());
    const pk = packets(readCapture(buf)), conns = analyse104(tcpConns(pk, [2404]));
    const m = new Map<string, { ca: number; ioa: number; values: string[]; cots: string[] }>();
    for (const c of conns) for (const a of c.apdus) if (a.asdu) for (const o of a.asdu.objs) { const k = `${a.asdu.ca}|${o.ioa}`; const e = m.get(k) ?? { ca: a.asdu.ca, ioa: o.ioa, values: [], cots: [] }; if (!e.values.includes(o.value)) e.values.push(o.value); const cn = cotName(a.asdu.cot); if (!e.cots.includes(cn)) e.cots.push(cn); m.set(k, e); }
    const Q: Project = JSON.parse(JSON.stringify(P)), r = linkEvidence(Q, [...m.values()].filter((x) => x.ioa > 0), f?.name ?? url!.split("/").pop()!);
    setP(Q);
    setMsg([{ sev: "ok", text: `${r.linked} point(s) seen in the capture; evidence added to the matching steps (still to be confirmed by the tester).` }, ...(r.notSeen.length ? [{ sev: "warning" as const, text: `Not seen in the capture: ${r.notSeen.map((p) => `${p.name} (IOA ${p.ioa})`).join(", ")}. Test them, or check that they are configured in the gateway.` }] : []), ...(r.unknown.length ? [{ sev: "warning" as const, text: `In the capture but not in the signal list: ${r.unknown.map((x) => `CA ${x.ca} IOA ${x.ioa}`).join(", ")} — extra points in the gateway, or a list that is not complete.` }] : [])]);
  };
  const setStep = (id: string, k: "res" | "value" | "remark", v: string) => setP((old) => old && { ...old, steps: old.steps.map((s) => (s.id === id ? { ...s, [k]: v, ...(k === "res" ? { by: tester || s.by, date: new Date().toISOString().slice(0, 10) } : {}) } : s)) });
  const dl = (n: string, t: string, ty = "text/csv") => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: ty })); a.download = n; a.click(); URL.revokeObjectURL(a.href); };
  const report = () => {
    if (!P || !pr) return;
    const pl = punchList(P), rows = P.steps.map((s) => { const p = P.points.find((x) => x.id === s.pid)!; return `<tr><td>${esc(p.device)}</td><td>${esc(p.name)}</td><td>${esc(s.text)}</td><td>${esc(s.expect)}</td><td class="${s.res}">${s.res || "open"}</td><td>${esc(s.value)}</td><td>${esc(s.remark)}${s.evidence ? `<br><i>${esc(s.evidence)}</i>` : ""}</td><td>${esc(s.by)} ${esc(s.date)}</td></tr>`; }).join("");
    const w = window.open("", "_blank"); if (!w) return;
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(P.name)} ${P.stage} report</title><style>body{font:11px Arial;margin:14mm}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin:8px 0}th,td{border:1px solid #999;padding:3px 4px;text-align:left;vertical-align:top}th{background:#0e7490;color:#fff}.pass{color:#166534;font-weight:bold}.fail{color:#b91c1c;font-weight:bold}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>${esc(P.name)} — ${P.stage} test report</h1><p>${esc(P.level)} · ${P.points.length} points · ${pr.total} steps: ${pr.pass} pass, ${pr.fail} fail, ${pr.na} n/a, ${pr.open} open (${pr.pct.toFixed(0)} % done) · generated ${new Date().toLocaleString()} by AJapps Commissioning Test Manager</p><h2>Punch list (${pl.length})</h2>${pl.length ? `<table><tr><th>Device</th><th>Point</th><th>Step</th><th>Expected</th><th>Remark</th><th>Tested</th></tr>${pl.map((x) => `<tr><td>${esc(x.device)}</td><td>${esc(x.point)}</td><td>${esc(x.step)}</td><td>${esc(x.expect)}</td><td>${esc(x.remark)}</td><td>${esc(x.by)} ${esc(x.date)}</td></tr>`).join("")}</table>` : "<p>No failed steps.</p>"}<h2>Results</h2><table><tr><th>Device</th><th>Point</th><th>Step</th><th>Expected</th><th>Result</th><th>Observed</th><th>Remark / evidence</th><th>Tested</th></tr>${rows}</table><p>Witnesses: ${esc(P.witnesses || "")}</p><table style="width:60%;margin-top:12mm"><tr><th></th><th>Name</th><th>Signature</th><th>Date</th></tr><tr><td>Tested by</td><td></td><td></td><td></td></tr><tr><td>Witnessed by</td><td></td><td></td><td></td></tr><tr><td>Accepted by</td><td></td><td></td><td></td></tr></table><script>setTimeout(function(){window.print()},300)<\/script></body></html>`);
    w.document.close();
  };
  const shown = P ? P.points.filter((p) => filter === "all" || P.steps.some((s) => s.pid === p.id && (filter === "open" ? !s.res : s.res === "fail"))) : [];
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Commissioning Test Manager — FAT / SAT Point-to-Point</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Turn a signal list into point-to-point test steps for the FAT or SAT, record each result as you test, attach evidence from an
          IEC 104 capture, follow progress per device, and print the report with the punch list and sign-off — in the browser, kept on this
          computer.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Commissioning Test Manager" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="Point-to-point testing proves every signal from the device to the control centre: hundreds of points, each with several states, tested by different people over days. Spreadsheets lose track of what was tested, by whom and how; the punch list and the evidence are rebuilt at the end. A structured test list with the expected result for every step, filled in as you go, makes the FAT/SAT traceable and the report immediate."
            standards={["IEC 61850-10 and IEC 61850-4 (testing and quality assurance in the engineering process)", "IEC 62381 (FAT, FIT and SAT for process automation systems)", "IEC 60870-5-104 (point addressing for the evidence check)"]}
            capabilities={[
              "Reads a signal list (CSV): the Gateway Mapping Builder export, an IEC 104 point list, or any list with tag, description, type, CA/IOA, unit and range columns.",
              "Creates test steps by signal kind: single points (ON, OFF, invalid), double points (closed, open, intermediate/bad), analog values (injection at 0/50/100 % of range, limits, invalid), counters, commands (select/execute both ways, blocked by interlocking or local mode) and set points.",
              "Records result, observed value, remark, tester and date per step; filters open and failed steps; progress per device.",
              "Links evidence from an IEC 104 capture (values and confirmations seen for each CA/IOA), lists points not seen and points in the capture missing from the list; prints the report with punch list and sign-off; exports CSV; saves and opens the test file.",
            ]}
            example={{ problem: "The GW1 IEC 104 signal list of the S13 sample (11 points) and the sample IEC 104 capture as evidence.", steps: ["33 test steps are created for the FAT.", "Linking the capture finds 10 of the 11 points with values (e.g. IOA 2001 seen ON (10)); Q01_Q (IOA 3004) was never sent.", "IOA 5099 appears in the capture but is not in the list — the control centre sent a command to an address the gateway does not have."], result: "A traceable FAT record with evidence, an open item for IOA 3004 and a question for the control centre about IOA 5099." }}
            notes="Evidence from a capture shows that a value was transmitted; the tester still confirms that the right value appeared at the right place. The test file is stored in this browser — save it regularly and keep it with the project records."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          <div className="space-y-6">
            <Section title="Test project">
              <TextField label="Project" value={P?.name ?? name} onChange={(v) => (P ? setP({ ...P, name: v }) : setName(v))} />
              <label className="mt-2 block text-xs text-muted">Stage
                <select value={P?.stage ?? stage} onChange={(e) => (P ? setP({ ...P, stage: e.target.value as "FAT" | "SAT" }) : setStage(e.target.value as "FAT" | "SAT"))} className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground"><option value="FAT">FAT (factory)</option><option value="SAT">SAT (site)</option></select>
              </label>
              <div className="mt-2"><TextField label="Tester (filled into each result)" value={tester} onChange={setTester} /></div>
              <div className="mt-3 flex flex-col gap-2">
                <label className={`cursor-pointer ${btn}`}>Open signal list (CSV)…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => openList(e.target.files?.[0])} /></label>
                <button type="button" onClick={sample} className={btn}>Sample: GW1 IEC 104 list</button>
                <label className={`cursor-pointer ${btn}`}>Open saved test file…<input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0]?.text().then((t) => { try { const j = JSON.parse(t); if (j.format === "AJapps commissioning tests") setP(j); } catch { setErrs(["Not a test file."]); } })} /></label>
              </div>
              {errs.length > 0 && <ul className="mt-2 space-y-1 text-xs text-accent">{errs.slice(0, 6).map((e, i) => <li key={i}>{e}</li>)}</ul>}
            </Section>
            {P && (
              <Section title="Evidence and output">
                <div className="flex flex-col gap-2">
                  <label className={`cursor-pointer ${btn}`}>Link IEC 104 capture…<input type="file" accept=".pcap,.pcapng" className="hidden" onChange={(e) => evidence(e.target.files?.[0])} /></label>
                  <button type="button" onClick={() => evidence(null, "/samples/S13_IEC104_gateway_capture.pcap")} className={btn}>Sample capture as evidence</button>
                  <button type="button" onClick={report} className={btn}>Print report</button>
                  <button type="button" onClick={() => dl(`${P.name}_${P.stage}_results.csv`, resultsCsv(P))} className={btn}>Export results (CSV)</button>
                  <button type="button" onClick={() => dl(`${P.name}_${P.stage}.tests.json`, JSON.stringify(P, null, 1), "application/json")} className={btn}>Save test file</button>
                  <button type="button" onClick={() => { if (confirm("Remove this test project from the browser?")) { setP(null); localStorage.removeItem(KEY); } }} className={btn}>Close project</button>
                </div>
                <div className="mt-2"><TextField label="Witnesses" value={P.witnesses} onChange={(v) => setP({ ...P, witnesses: v })} /></div>
              </Section>
            )}
          </div>
          <div className="space-y-6 lg:col-span-3">
            {P && pr && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {[["Steps", pr.total], ["Passed", pr.pass], ["Failed", pr.fail], ["Open", pr.open], ["Done", `${pr.pct.toFixed(0)} %`]].map(([l, v]) => <div key={String(l)} className="rounded-lg border border-border bg-surface p-3"><div className="text-xs text-muted">{l}</div><div className={`mt-1 text-lg font-semibold ${l === "Failed" && pr.fail ? "text-fail" : "text-foreground"}`}>{v}</div></div>)}
                </div>
                {msg.length > 0 && <ResultCard title="Evidence from the capture"><FindingList list={msg} /></ResultCard>}
                <ResultCard title="Progress per device">
                  <table className="w-full text-sm"><thead><tr><th className={th}>Device</th><th className={th}>Steps</th><th className={th}>Done</th><th className={th}>Failed</th></tr></thead>
                    <tbody>{pr.devices.map((d) => <tr key={d.device} className="border-t border-border text-foreground"><td className={td}>{d.device}</td><td className={td}>{d.total}</td><td className={td}>{d.done} ({d.total ? Math.round((100 * d.done) / d.total) : 0} %)</td><td className={`${td} ${d.fail ? "text-fail" : ""}`}>{d.fail}</td></tr>)}</tbody></table>
                </ResultCard>
                <ResultCard title={`${P.stage} test steps — ${P.level}`}>
                  <div className="mb-3 flex gap-2">{(["all", "open", "fail"] as const).map((k) => <button key={k} type="button" onClick={() => setFilter(k)} className={`rounded-full border px-3 py-1 text-xs ${filter === k ? "border-accent text-accent" : "border-border text-muted"}`}>{k === "all" ? "All points" : k === "open" ? "With open steps" : "With failures"}</button>)}</div>
                  <div className="space-y-4">
                    {shown.map((p) => (
                      <div key={p.id} className="rounded-lg border border-border p-3">
                        <div className="text-sm font-semibold text-foreground">{p.name} <span className="font-normal text-muted">· {p.desc} · {p.device}{p.ioa !== null ? ` · CA ${p.ca ?? "—"} IOA ${p.ioa}` : ""} · {p.kind}</span></div>
                        <table className="mt-2 w-full text-xs"><tbody>{P.steps.filter((s) => s.pid === p.id).map((s) => (
                          <tr key={s.id} className="border-t border-border align-top text-foreground">
                            <td className={`${td} w-2/5`}>{s.text}<div className="text-muted">Expected: {s.expect}</div>{s.evidence && <div className="mt-1 text-accent-2">Evidence: {s.evidence}</div>}</td>
                            <td className={td}><div className="flex gap-1">{RES.map(([v, l, c]) => <button key={l} type="button" onClick={() => setStep(s.id, "res", v)} className={`rounded border px-2 py-0.5 ${s.res === v ? `border-current ${c} font-semibold` : "border-border text-muted"}`}>{l}</button>)}</div>{s.by && <div className="mt-1 text-muted">{s.by} {s.date}</div>}</td>
                            <td className={td}><input value={s.value} onChange={(e) => setStep(s.id, "value", e.target.value)} placeholder="observed" aria-label="observed value" className="w-full rounded border border-border bg-surface-2 px-2 py-1" /></td>
                            <td className={td}><input value={s.remark} onChange={(e) => setStep(s.id, "remark", e.target.value)} placeholder="remark" aria-label="remark" className="w-full rounded border border-border bg-surface-2 px-2 py-1" /></td>
                          </tr>))}</tbody></table>
                      </div>
                    ))}
                  </div>
                </ResultCard>
              </>
            )}
            {!P && <ResultCard title="Result"><p className="text-muted">Open a signal list or load the sample to create the test steps.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
