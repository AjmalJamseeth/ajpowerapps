"use client";

import { useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { FeedbackButton } from "@/components/FeedbackButton";
import { Section, ResultCard, TextField } from "@/components/fields";
import { extractSignals, buildMap, checkMap, mapCsv, parseGatewayList, compareGateway, t104Id, DEFAULT_RULES, type MapRules } from "@/lib/gatewaymap";

type Sev = "error" | "warning" | "info" | "ok";
const SEV: Record<Sev, [string, string]> = { error: ["Error", "text-fail"], warning: ["Warning", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };
const th = "py-1 pr-3 text-left font-normal text-muted", td = "py-1 pr-3 align-top";

export default function GatewayMappingBuilderPage() {
  const [scd, setScd] = useState("");
  const [scdName, setScdName] = useState("");
  const [gw, setGw] = useState("");
  const [rules, setRules] = useState<MapRules>(DEFAULT_RULES);
  const [off, setOff] = useState<string[]>([]);
  const [view, setView] = useState<"104" | "mb" | "dnp">("104");
  const [gl, setGl] = useState("");
  const [glName, setGlName] = useState("");
  const model = useMemo(() => { if (!scd) return null; try { return { m: extractSignals(scd, gw), err: "" }; } catch (e) { return { m: null, err: (e as Error).message }; } }, [scd, gw]);
  const ieds = useMemo(() => { if (!scd) return [] as string[]; try { return extractSignals(scd).ieds; } catch { return []; } }, [scd]);
  const rows = useMemo(() => (model?.m ? buildMap(model.m.signals.filter((s) => !off.includes(s.ref + "|" + s.kind)), rules) : []), [model, rules, off]);
  const fnd = useMemo(() => (rows.length ? checkMap(rows, rules) : []), [rows, rules]);
  const cmp = useMemo(() => { if (!gl.trim() || !rows.length) return null; try { return compareGateway(rows, parseGatewayList(gl)); } catch (e) { return [{ sev: "error" as Sev, text: (e as Error).message }]; } }, [gl, rows]);
  const read = (f: File | undefined, set: (t: string) => void, setN: (n: string) => void) => { if (!f) return; const r = new FileReader(); r.onload = () => { set(String(r.result || "")); setN(f.name); }; r.readAsText(f); };
  const sample = async () => {
    const [a, b] = await Promise.all([fetch("/samples/S13_Sample.scd").then((r) => r.text()), fetch("/samples/S13_gateway_pointlist.csv").then((r) => r.text())]);
    setScd(a); setScdName("S13 sample SCD"); setGw("GW1"); setGl(b); setGlName("sample gateway point list"); setOff([]);
  };
  const onScd = (t: string) => { setScd(t); setOff([]); try { const m = extractSignals(t); const counts = new Map<string, number>(); for (const c of t.matchAll(/<ClientLN[^>]*iedName="([^"]+)"/g)) counts.set(c[1], (counts.get(c[1]) ?? 0) + 1); setGw([...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? ""); void m; } catch { setGw(""); } };
  const exportCsv = () => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([mapCsv(rows)], { type: "text/csv" })); a.download = "gateway-mapping.csv"; a.click(); URL.revokeObjectURL(a.href); };
  const num = (v: string, d: number) => (v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
  const btn = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent";
  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Gateway Mapping Builder — IEC 61850 to IEC 104, Modbus and DNP3</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Build the signal list of a station gateway from the SCD: every value the IEDs report to the gateway and every controllable object,
          with an IEC 60870-5-104 type and information object address, a Modbus register and a DNP3 point allocated by rules you set — then
          compare it with the point list exported from the gateway tool.
        </p>
        <div className="mt-6 flex flex-wrap gap-3"><FeedbackButton calculatorName="Gateway Mapping Builder" /></div>
        <div className="mt-6">
          <InfoPanel
            purpose="The gateway signal list is usually typed by hand from the SCD into a spreadsheet and then into the gateway tool — the most error-prone step of SCADA engineering. A double point mapped as a single point, an address used twice or a data-set member forgotten shows up only during point-to-point testing. Deriving the list from the SCD by fixed rules, and checking the gateway's export against it, removes those errors before testing."
            standards={["IEC 61850-6 (SCL: data sets, report control blocks, data type templates)", "IEC 61850-7-3 (common data classes) and IEC 61850-80-1 (mapping guideline IEC 61850 ↔ IEC 60870-5-104)", "IEC 60870-5-101/104 (type identifications, information object address)", "Modbus Application Protocol V1.1b3; IEEE 1815 (DNP3) object groups"]}
            capabilities={[
              "Reads the SCD and collects, per IED, the members of the data sets used by report control blocks whose client is the gateway, and the controllable objects (SPC, DPC, APC, INC, BSC with a control model other than status-only).",
              "Resolves each member's common data class from the data type templates (including sub-objects such as A.phsA) and its description (dU or DOI/LN description).",
              "Allocates IEC 104 types (with or without time tag) and IOAs in a block per IED with a range per kind of signal; Modbus discrete inputs, input registers (float32 / uint32 in two registers), coils and holding registers; DNP3 binary, double-bit, analog and counter inputs with event classes, CROB and analog outputs.",
              "Checks duplicate IOAs, ranges that overflow, commands without position feedback, CSWI and XCBR both controllable, events without time tags and Modbus's missing quality; compares the gateway's point list (CSV) by 61850 reference: missing, extra, wrong type, different IOA, duplicates.",
            ]}
            example={{
              problem: "The S13 sample SCD with gateway GW1 and the sample point list exported from the gateway tool.",
              steps: ["7 signals of P132_Q01: three measurands, the protection start, the breaker position and two controllable positions.", "The gateway sends the breaker position XCBR1.Pos as a single point (M_SP_TB_1) although it is a double point (DPC).", "IOA 1002 is used twice, for two points that are not reported to the gateway at all; A.phsA is missing from the gateway."],
              result: "One wrong type, one duplicate address, two orphan points and two missing signals — corrected in the gateway before testing.",
            }}
            notes="The allocation rules are a proposal; the control centre's addressing convention takes precedence — set the IOA ranges to match it. The tool does not write gateway configuration files; enter or import the mapping in the gateway's own tool, export its point list and compare it here."
          />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <Section title="SCD">
              <div className="flex flex-wrap gap-2">
                <label className={`cursor-pointer ${btn}`}>Open SCD…<input type="file" accept=".scd,.cid,.icd,.xml" className="hidden" onChange={(e) => read(e.target.files?.[0], onScd, setScdName)} /></label>
                <button type="button" onClick={sample} className={btn}>Load sample</button>
              </div>
              <p className="mt-1 text-xs text-muted">{scdName}</p>
              {ieds.length > 0 && (
                <label className="mt-3 block text-xs text-muted">Gateway (report client)
                  <select value={gw} onChange={(e) => setGw(e.target.value)} className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground">
                    <option value="">All reports (any client)</option>{ieds.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </label>
              )}
            </Section>
            <Section title="Allocation rules">
              <div className="grid grid-cols-2 gap-2">
                <TextField label="Common address (CA)" value={String(rules.ca)} onChange={(v) => setRules({ ...rules, ca: num(v, 1) })} />
                <TextField label="First IOA" value={String(rules.iedStart)} onChange={(v) => setRules({ ...rules, iedStart: num(v, 1000) })} />
                <TextField label="IOAs per IED" value={String(rules.iedBlock)} onChange={(v) => setRules({ ...rules, iedBlock: num(v, 1000) })} />
                {(Object.keys(rules.off) as (keyof MapRules["off"])[]).map((k) => <TextField key={k} label={`Offset: ${k}`} value={String(rules.off[k])} onChange={(v) => setRules({ ...rules, off: { ...rules.off, [k]: num(v, 0) } })} />)}
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={rules.withTime} onChange={(e) => setRules({ ...rules, withTime: e.target.checked })} /> IEC 104 types with time tag (CP56Time2a)</label>
              <label className="mt-2 block text-xs text-muted">Modbus 32-bit word order
                <select value={rules.mbWordOrder} onChange={(e) => setRules({ ...rules, mbWordOrder: e.target.value as MapRules["mbWordOrder"] })} className="mt-1 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-sm text-foreground"><option value="ABCD">ABCD (high word first)</option><option value="CDAB">CDAB (low word first)</option></select>
              </label>
            </Section>
            <Section title="Gateway point list (optional)">
              <label className={`cursor-pointer ${btn}`}>Open point list (CSV)…<input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => read(e.target.files?.[0], setGl, setGlName)} /></label>
              <p className="mt-1 text-xs text-muted">{glName || "Export from the gateway tool: a column with the 61850 reference, one with the IOA, optionally CA and type."}</p>
            </Section>
          </div>
          <div className="space-y-6 lg:col-span-2">
            {model?.err && <ResultCard title="Cannot read the SCD"><p className="text-fail">{model.err}</p></ResultCard>}
            {model?.m && (
              <>
                <ResultCard title={`Signals (${rows.length} mapped of ${model.m.signals.length})`}>
                  <ul className="space-y-2">{[...model.m.issues.map((i) => ({ sev: i.sev as Sev, text: i.text })), ...fnd].map((f, i) => <li key={i} className="text-sm"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul>
                  {model.m.signals.length === 0 && <p className="text-muted">No reported data sets{gw ? ` with ${gw} as client` : ""} and no controllable objects found.</p>}
                </ResultCard>
                {cmp && <ResultCard title="Gateway point list against the SCD"><ul className="space-y-2">{cmp.map((f, i) => <li key={i} className="text-sm"><span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span><span className="text-foreground">{f.text}</span></li>)}</ul></ResultCard>}
                <ResultCard title="Mapping">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {([["104", "IEC 104"], ["mb", "Modbus"], ["dnp", "DNP3"]] as const).map(([k, l]) => <button key={k} type="button" onClick={() => setView(k)} className={`rounded-full border px-3 py-1 text-xs ${view === k ? "border-accent text-accent" : "border-border text-muted"}`}>{l}</button>)}
                    <button type="button" onClick={exportCsv} disabled={!rows.length} className="ml-auto rounded-lg border border-border px-3 py-1 text-xs text-foreground hover:border-accent">Export mapping (CSV)</button>
                  </div>
                  <div className="max-h-[36rem] overflow-auto"><table className="w-full text-xs"><thead><tr><th className={th}>Use</th><th className={th}>Reference</th><th className={th}>CDC</th><th className={th}>Description</th>
                    {view === "104" && <><th className={th}>Type</th><th className={th}>CA</th><th className={th}>IOA</th></>}{view === "mb" && <><th className={th}>Table</th><th className={th}>Address</th><th className={th}>Format</th></>}{view === "dnp" && <><th className={th}>Group</th><th className={th}>Index</th><th className={th}>Class</th></>}</tr></thead>
                    <tbody>{model.m.signals.map((s) => { const k = s.ref + "|" + s.kind, r = rows.find((x) => x.ref === s.ref && x.kind === s.kind); return (
                      <tr key={k} className={`border-t border-border ${r ? "text-foreground" : "text-muted"}`}>
                        <td className={td}><input type="checkbox" checked={!off.includes(k)} onChange={(e) => setOff(e.target.checked ? off.filter((x) => x !== k) : [...off, k])} aria-label={`use ${s.ref}`} /></td>
                        <td className={`${td} font-mono`}>{s.ref}{s.kind.startsWith("cmd") ? <span className="text-accent"> · control ({s.ctlModel})</span> : null}<div className="text-muted">{s.source}</div></td>
                        <td className={td}>{s.cdc}</td><td className={td}>{s.desc}</td>
                        {r && view === "104" && <><td className={`${td} font-mono`}>{t104Id(r.t104)}</td><td className={td}>{r.ca}</td><td className={`${td} font-mono`}>{r.ioa}</td></>}
                        {r && view === "mb" && <><td className={td}>{r.mbTable}</td><td className={`${td} font-mono`}>{r.mbAddr}{r.mbCount > 1 ? `–${r.mbAddr + r.mbCount - 1}` : ""}</td><td className={td}>{r.mbFormat}</td></>}
                        {r && view === "dnp" && <><td className={td}>{r.dnpGroup}</td><td className={`${td} font-mono`}>{r.dnpIndex}</td><td className={td}>{r.dnpClass ?? "—"}</td></>}
                        {!r && <td className={td} colSpan={3}>not used</td>}
                      </tr>); })}</tbody></table></div>
                </ResultCard>
              </>
            )}
            {!model && <ResultCard title="Result"><p className="text-muted">Open an SCD or load the sample.</p></ResultCard>}
          </div>
        </div>
      </div>
    </div>
  );
}
