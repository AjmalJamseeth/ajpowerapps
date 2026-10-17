"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import { InfoPanel } from "@/components/InfoPanel";
import { ReportButton } from "@/components/ReportButton";
import { FeedbackButton } from "@/components/FeedbackButton";
import { CheckboxField, NumberField, SelectField, Tip } from "@/components/fields";
import ProjectManager from "@/components/ProjectManager";
import ShortCircuitSld, { type SldOverlay } from "@/components/shortcircuit/ShortCircuitSld";
import NetworkEditor from "@/components/shortcircuit/NetworkEditor";
import ArcFlashInputs from "@/components/arcflash/ArcFlashInputs";
import RelayEditor from "@/components/protection/RelayEditor";
import TccChart from "@/components/protection/TccChart";
import CompareSection from "@/components/protection/CompareSection";
import { analyseShortCircuit, type ScNetwork } from "@/lib/iec60909";
import { buildHandoff, HANDOFF_TO_OPTIMISER, HANDOFF_TO_SUITE, putHandoff, takeHandoff } from "@/lib/suiteBridge";
import {
  deviceKvOf,
  isProtStudy,
  makeDefaultProtStudy,
  solveProtection,
  type BusOutcome,
  type ProtOptions,
  type ProtStudy,
  type RelayDef,
} from "@/lib/protsettings";

interface IncomingRelays {
  at: string;
  projectName: string;
  relays: RelayDef[];
  skipped: { name: string; circuit: string; reason: string }[];
  notes: string[];
}

const f = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));
const catLabel = (c: number) => (c < 0 ? "no target" : c === 0 ? "< 1.2 cal/cm²" : `Cat ${c} (≤ ${[0, 4, 8, 25, 40][c]} cal/cm²)`);

type Status = { key: string; label: string; color: string };
function statusOf(before: BusOutcome, after: BusOutcome): Status {
  if (after.met === null) return { key: "none", label: "No target", color: "#64748b" };
  if (after.met) return before.met ? { key: "met", label: "Already met", color: "#34d399" } : { key: "ok", label: "Achieved", color: "#34d399" };
  if (after.maintE !== null && after.maintE <= after.targetE * (1 + 1e-9)) return { key: "maint", label: "Only in maintenance mode", color: "#fbbf24" };
  return { key: "partial", label: "Best possible — target not met", color: "#f87171" };
}

const relayText = (r: RelayDef) =>
  `${r.curveType} · ${f(r.pickupA, 0)} A · TMS ${f(r.tms, 3)} · ${r.instPickupA > 0 ? `inst ${f(r.instPickupA, 0)} A / ${f(r.instMs, 0)} ms` : "no inst"}`;

export default function ProtectionSettingsPage() {
  const [study, setStudy] = useState<ProtStudy>(() => makeDefaultProtStudy());
  const [undo, setUndo] = useState<RelayDef[] | null>(null);
  const [selId, setSelId] = useState("");
  const [refKv, setRefKv] = useState(0);
  const router = useRouter();
  const [incoming, setIncoming] = useState<IncomingRelays | null>(null);
  const [sendMsg, setSendMsg] = useState("");

  // relays waiting from the Protection Coordination Suite
  useEffect(() => {
    const h = takeHandoff<IncomingRelays>(HANDOFF_TO_OPTIMISER, true);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a hand-off that only exists in the browser
    if (h && Array.isArray(h.relays) && h.relays.length > 0) setIncoming(h);
  }, []);

  const deferred = useDeferredValue(study);
  const sol = useMemo(() => solveProtection(deferred), [deferred]);
  const sc = useMemo(() => analyseShortCircuit(deferred.net), [deferred.net]);

  const setNet: React.Dispatch<React.SetStateAction<ScNetwork>> = (u) =>
    setStudy((s) => ({ ...s, net: typeof u === "function" ? (u as (n: ScNetwork) => ScNetwork)(s.net) : u }));
  const setRelays = (relays: RelayDef[]) => setStudy((s) => ({ ...s, relays }));
  const setAlt = (alt: RelayDef[] | undefined) => setStudy((s) => ({ ...s, alt }));
  const setOpt = (patch: Partial<ProtOptions>) => setStudy((s) => ({ ...s, opt: { ...s.opt, ...patch } }));
  const setTarget = (busId: string, cat: number) => setStudy((s) => ({ ...s, targets: { ...s.targets, [busId]: cat } }));
  const setAllTargets = (cat: number) => setStudy((s) => ({ ...s, targets: Object.fromEntries(s.net.buses.map((b) => [b.id, cat])) }));

  const apply = () => {
    setUndo(study.relays);
    setStudy((s) => ({ ...s, relays: sol.proposed.map((r) => ({ ...r, downstream: [...r.downstream] })) }));
  };
  const loadIncoming = () => {
    if (!incoming) return;
    setUndo(study.relays);
    setStudy((st) => {
      // a bus is pre-assigned only when exactly one bus has the relay's voltage; everything else is left for the user
      const relays = incoming.relays.map((r) => {
        const same = st.net.buses.filter((b) => Math.abs(b.unKv - r.deviceKv) < 0.01 * Math.max(r.deviceKv, 0.1));
        return { ...r, busId: same.length === 1 ? same[0].id : "" };
      });
      return { ...st, relays, alt: undefined, suiteLink: { projectName: incoming.projectName } };
    });
    takeHandoff(HANDOFF_TO_OPTIMISER);
    setIncoming(null);
  };
  const discardIncoming = () => {
    takeHandoff(HANDOFF_TO_OPTIMISER);
    setIncoming(null);
  };
  const sendToSuite = () => {
    const faults: Record<string, number> = {};
    for (const r of study.relays) {
      const b = study.net.buses.find((x) => x.id === r.busId);
      const res = b ? sc.buses.find((x) => x.busId === b.id) : undefined;
      if (b && res?.energised) faults[r.id] = (res.ik3 * 1000 * b.unKv) / deviceKvOf(r, study.net);
    }
    const h = buildHandoff(study.relays, sol.proposed, faults);
    if (!putHandoff(HANDOFF_TO_SUITE, h)) {
      setSendMsg("The browser blocked local storage, so the proposal cannot be passed on. Allow site data and try again.");
      return;
    }
    router.push("/calculators/protection-suite");
  };
  const revert = () => {
    if (!undo) return;
    setRelays(undo);
    setUndo(null);
  };

  const selectedId = deferred.net.buses.some((b) => b.id === selId) ? selId : deferred.net.buses[0]?.id ?? "";
  const selAfter = sol.after.find((b) => b.busId === selectedId) ?? null;
  const kvOptions = [...new Set(deferred.relays.map((r) => deviceKvOf(r, deferred.net)))].sort((a, b) => b - a);
  const refKvUse = kvOptions.includes(refKv) ? refKv : kvOptions[0] ?? 0.4;
  const selBus = deferred.net.buses.find((b) => b.id === selectedId);

  const overlay = useMemo(() => {
    const o: Record<string, SldOverlay> = {};
    for (const a of sol.after) {
      const b = sol.before.find((x) => x.busId === a.busId)!;
      if (a.model === "none") {
        o[a.busId] = { color: "#64748b", lines: ["no result"], frac: 0, selected: a.busId === selectedId };
        continue;
      }
      const st = statusOf(b, a);
      o[a.busId] = {
        color: a.ppe.color,
        lines: [
          `E ${f(b.eCal, 1)} → ${f(a.eCal, 1)} cal/cm²`,
          `${st.label} · ${a.targetCat < 0 ? "no target" : `target Cat ${a.targetCat}`}`,
          `${f(b.tMs, 0)} → ${f(a.tMs, 0)} ms`,
        ],
        frac: Math.min(1, a.eCal / 40),
        selected: a.busId === selectedId,
      };
    }
    return o;
  }, [sol, selectedId]);

  const th = "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted";
  const thl = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted";
  const td = "px-3 py-2 text-right tabular-nums text-foreground";
  const c = sol.counts;
  const unresolved = c.partial + c.maintenanceOnly;

  return (
    <div className="flex flex-1 flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Arc-Flash &amp; Protection Setting Optimiser</h1>
        <p className="mt-2 max-w-3xl text-muted">
          Set a target PPE category for each bus and let the tool propose relay settings that reach it <em>without breaking coordination</em>. It links the
          IEC 60909 short-circuit network, the IEEE 1584-2018 arc-flash study and the IDMT grading of up to {8} relays: it lowers TMS to the grading limit,
          then pickup, then adds an instantaneous element above the downstream maximum fault, and if it still cannot reach the target it returns the best
          achievable setting with the blocking reason and what to add (ZSI, arc-flash relay, bus differential, maintenance mode).
        </p>
        <div className="mt-4 max-w-3xl rounded-lg border border-accent-2/30 bg-accent-2/10 px-4 py-3 text-sm text-muted">
          <span className="font-semibold text-foreground">Use this when arc flash and coordination are studied together.</span> For a plain arc-flash study
          use the Arc Flash Study; for a plain relay grading check use the IDMT Grading calculator.
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ReportButton title="Arc-Flash & Protection Setting Optimiser" standardsLine="IEEE 1584-2018 · IEC 60909-0 · IEC 60255-151 / IEEE C37.112 · NFPA 70E reference" />
          <FeedbackButton calculatorName="Arc-Flash & Protection Setting Optimiser" />
        </div>

        <div className="mt-6">
          <InfoPanel
            purpose="Finds relay settings that bring the arc-flash incident energy at each bus down to a chosen PPE category while keeping the upstream/downstream grading margin. The incident energy is proportional to the arc duration, and the arc duration is the relay time at the arcing current, so the settings, the fault levels and the arc-flash result are solved together."
            standards={[
              "IEEE Std 1584-2018 (incident energy, arcing-current variation)",
              "IEC 60909-0 (maximum and minimum fault currents)",
              "IEC 60255-151 and IEEE C37.112 (inverse-time curves)",
              "NFPA 70E (PPE categories — reference)",
            ]}
            capabilities={[
              "Per-bus target category; maximum and minimum fault, and the reduced-arcing-current case, are all evaluated.",
              "Staged search that changes as little as possible: TMS (preferred margin) → TMS (minimum margin) → pickup → instantaneous → optional curve change; downstream relays can be speeded up within their own grading limits.",
              "Grading re-checked over the whole current range for every proposal; instantaneous kept above downstream maximum fault and inrush.",
              "Best-possible result with the limiting constraint, the clearing time still needed and hardware recommendations when a target cannot be met by settings alone.",
              "Single-line diagram, time-current chart (before/after with arcing-current markers), grading and change tables.",
            ]}
            example={{
              problem: "Default network: 11 kV board (R4), 1.6 MVA transformer (R3 on the HV side, R2 LV incomer) and an MCC feeder (R1). Target: Category 2 everywhere.",
              steps: [
                "11 kV board: 10.9 cal/cm² (694 ms) needs ≤ 8 → an instantaneous element at 1.2 × the downstream maximum fault clears in about 100 ms → 1.6 cal/cm².",
                "MCC: already below the target; R1 is speeded up only because it lets R2 go faster.",
                "LV board: the downstream MCC fault (23.5 kA) is above the LV arcing current (20 kA), so no instantaneous setting can be selective; the TMS is limited by grading to R1 → best possible ≈ 16 cal/cm².",
                "The tool reports the 199 ms still needed, that maintenance mode reaches 2.0 cal/cm², and recommends ZSI or an arc-flash relay.",
              ],
              result: "Targets met where settings can do it; where they cannot, the tool says so and why instead of breaking selectivity.",
            }}
            notes="This is a proposal, not a protection setting sheet. Grading is checked for three-phase faults at the maximum fault level with currents referred through transformers by the voltage ratio; earth-fault grading, transformer and cable damage curves, CT saturation and manufacturer-specific curves are not verified. Relay times exclude tolerance; the grading margin must cover breaker time, overshoot and errors. Always have the settings reviewed by a protection engineer and re-check the arc-flash study after applying them."
          />
        </div>

        {incoming && (
          <div className="mt-8 rounded-xl border border-accent-2/40 bg-accent-2/10 p-5">
            <div className="text-sm font-semibold text-foreground">
              {incoming.relays.length} relay{incoming.relays.length === 1 ? "" : "s"} waiting from the Protection Coordination Suite ({incoming.projectName})
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
              {incoming.notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
              {incoming.skipped.length > 0 && <li>Not imported: {incoming.skipped.map((x) => `${x.name} (${x.reason})`).join("; ")}.</li>}
            </ul>
            <p className="mt-2 text-xs text-muted">Loading replaces the relays below with these (the network and targets stay). You can undo it.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={loadIncoming} className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-background hover:opacity-90">
                Load these relays
              </button>
              <button type="button" onClick={discardIncoming} className="rounded-md border border-border px-4 py-1.5 text-sm text-foreground hover:border-accent-2/60">
                Discard
              </button>
            </div>
          </div>
        )}

        <div className="mt-8">
          <ProjectManager<ProtStudy>
            storageKey="ajapps-protsettings-scenarios"
            fileTag="arc-flash-protection-settings"
            current={study}
            onLoad={(s) => {
              setStudy(s);
              setUndo(null);
            }}
            makeNew={makeDefaultProtStudy}
            validate={isProtStudy}
          />
        </div>

        {/* ---------------- Summary ---------------- */}
        <div className="mt-8 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">Result</h2>
            <div className="no-print flex gap-2">
              <button type="button" onClick={apply} disabled={sol.changes.length === 0} className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40">
                Use proposed settings
              </button>
              {study.suiteLink && (
                <button type="button" onClick={sendToSuite} className="rounded-md border border-border px-4 py-1.5 text-sm text-foreground hover:border-accent-2/60">
                  Send to the Protection Suite →
                </button>
              )}
              {undo && (
                <button type="button" onClick={revert} className="rounded-md border border-border px-4 py-1.5 text-sm text-foreground hover:border-accent-2/60">
                  Undo
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Targets set", c.total, "#94a3b8"],
              ["Met (already or by the proposal)", c.alreadyMet + c.achieved, "#34d399"],
              ["Only with maintenance mode", c.maintenanceOnly, "#fbbf24"],
              ["Best possible, not met", c.partial, "#f87171"],
            ].map(([l, v, col]) => (
              <div key={String(l)} className="rounded-lg border border-border bg-surface-2/60 p-3">
                <div className="text-2xl font-semibold tabular-nums" style={{ color: String(col) }}>{v}</div>
                <div className="text-[11px] text-muted">{l}</div>
              </div>
            ))}
          </div>
          {sendMsg && <p className="mt-3 text-sm text-fail">{sendMsg}</p>}
          {study.suiteLink && <p className="mt-3 text-xs text-muted">Relays imported from the Protection Coordination Suite ({study.suiteLink.projectName}). &ldquo;Send to the Protection Suite&rdquo; passes the proposed settings and the maximum fault levels back for you to preview and apply there.</p>}
          {sol.changes.length === 0 && c.total > 0 && unresolved === 0 && <p className="mt-3 text-sm text-muted">Every target is already met; no change is needed.</p>}
          {sol.gradingAfter.some((g) => g.pass === false) && (
            <p className="mt-3 text-sm text-fail">One or more relay pairs are below the minimum grading margin — see the grading table.</p>
          )}
        </div>

        {/* ---------------- SLD ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold text-foreground">Single-line diagram — incident energy before → after the proposal</h2>
            <span className="text-xs text-muted">Colours show the PPE category after the proposal. Click a bus to see it on the chart.</span>
          </div>
          <div className="mt-4">
            <ShortCircuitSld net={deferred.net} result={sc} overlay={overlay} onSelectBus={setSelId} />
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">
            {[
              ["#34d399", "< 1.2 cal/cm² (Cat 0)"],
              ["#a3e635", "≤ 4 (Cat 1)"],
              ["#fbbf24", "≤ 8 (Cat 2)"],
              ["#fb923c", "≤ 25 (Cat 3)"],
              ["#f87171", "≤ 40 (Cat 4)"],
              ["#e11d48", "> 40 — DANGER"],
            ].map(([col, l]) => (
              <span key={l} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: col }} />
                {l}
              </span>
            ))}
          </div>
        </div>

        {/* ---------------- Bus table ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Arc-flash result by bus</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={thl}>Bus</th>
                  <th className={thl}>Target</th>
                  <th className={th}>E before (cal/cm²)</th>
                  <th className={th}>E after (cal/cm²)</th>
                  <th className={th}>Clearing before → after (ms)</th>
                  <th className={th}>Needed for target (ms)</th>
                  <th className={th}>With maintenance mode</th>
                  <th className={thl}>Status</th>
                </tr>
              </thead>
              <tbody>
                {sol.after.map((a) => {
                  const b = sol.before.find((x) => x.busId === a.busId)!;
                  const st = statusOf(b, a);
                  return (
                    <tr key={a.busId} onClick={() => setSelId(a.busId)} className={`cursor-pointer border-b border-border/60 last:border-0 ${a.busId === selectedId ? "bg-accent-2/10" : ""}`}>
                      <td className="px-3 py-2 text-left font-medium text-foreground">
                        {a.name}
                        <div className="text-[11px] font-normal text-muted">{a.unprotected ? "no relay assigned" : a.relayNames.join(" · ")}</div>
                      </td>
                      <td className="px-3 py-2 text-left text-foreground">{catLabel(a.targetCat)}</td>
                      {a.model === "none" ? (
                        <td colSpan={5} className="px-3 py-2 text-right text-muted">outside the model or not energised</td>
                      ) : (
                        <>
                          <td className={td} style={{ color: b.ppe.color }}>{f(b.eCal, 1)}</td>
                          <td className={`${td} font-semibold`} style={{ color: a.ppe.color }}>{f(a.eCal, 1)}</td>
                          <td className={td}>{f(b.tMs, 0)} → {f(a.tMs, 0)}</td>
                          <td className={td}>{a.reqMs !== null ? f(a.reqMs, 0) : a.met === false ? "–" : "met"}</td>
                          <td className={td}>{a.maintE !== null ? f(a.maintE, 1) : "–"}</td>
                        </>
                      )}
                      <td className="px-3 py-2 text-left">
                        <span className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold" style={{ background: st.color, color: "#0b1020" }}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            E is the worse of maximum and minimum fault current and of the average and reduced arcing current (IEEE 1584-2018). Clearing time includes the
            breaker. Maintenance mode uses {deferred.opt.maintenanceMs} ms total.
          </p>
        </div>

        {/* ---------------- Relay settings ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Proposed relay settings</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={thl}>Relay</th>
                  <th className={thl}>Present setting</th>
                  <th className={thl}>Proposed setting</th>
                  <th className={thl}>Why</th>
                </tr>
              </thead>
              <tbody>
                {sol.proposed.map((r) => {
                  const ch = sol.changes.find((x) => x.id === r.id);
                  const orig = deferred.relays.find((x) => x.id === r.id)!;
                  return (
                    <tr key={r.id} className="border-b border-border/60 align-top last:border-0">
                      <td className="px-3 py-2 text-left font-medium text-foreground">
                        {r.name}
                        <div className="text-[11px] font-normal text-muted">{deviceKvOf(r, deferred.net)} kV{r.locked ? " · locked" : ""}</div>
                      </td>
                      <td className="px-3 py-2 text-left text-muted">{relayText(orig)}</td>
                      <td className={`px-3 py-2 text-left ${ch ? "font-semibold text-accent-2" : "text-foreground"}`}>{ch ? relayText(r) : "unchanged"}</td>
                      <td className="px-3 py-2 text-left text-xs text-muted">
                        {ch ? (
                          <>
                            <div className="font-medium text-foreground">{ch.stage}</div>
                            {ch.notes.map((n, i) => (
                              <div key={i}>{n}</div>
                            ))}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ---------------- Cautions ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Cautions and limitations</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
            {sol.cautions.map((t, i) => (
              <li key={i} className={t.includes("not met by settings") || t.includes("below the minimum") ? "text-fail" : ""}>{t}</li>
            ))}
          </ul>
          {sol.recommendations.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold text-foreground">Where settings alone cannot reach the target — recommended measures</h3>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted">
                {sol.recommendations.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* ---------------- TCC ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center text-lg font-semibold text-foreground">
              Time-current coordination chart
              <Tip text="Dashed = present settings, solid = proposed. The vertical lines are the maximum fault current and the arcing currents (average and reduced) of the selected bus, so you can read the clearing time straight off the curves. The green line is the clearing time needed to reach the target." />
            </h2>
            <div className="flex flex-wrap gap-2">
              <select value={selectedId} onChange={(e) => setSelId(e.target.value)} className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none">
                {deferred.net.buses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <select value={refKvUse} onChange={(e) => setRefKv(Number(e.target.value))} className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none">
                {kvOptions.map((k) => (
                  <option key={k} value={k}>plot at {k} kV</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <TccChart
              before={deferred.relays}
              after={sol.proposed}
              devKvOf={(r) => deviceKvOf(r, deferred.net)}
              refKv={refKvUse}
              bus={selAfter}
              busKv={selBus?.unKv ?? refKvUse}
              targetMs={selAfter?.reqMs ?? null}
            />
          </div>
        </div>

        {/* ---------------- Grading ---------------- */}
        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">Grading margins</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className={thl}>Downstream → upstream</th>
                  <th className={th}>Smallest margin before (s)</th>
                  <th className={th}>Smallest margin proposed (s)</th>
                  <th className={th}>At (A, downstream relay)</th>
                  <th className={thl}>Result</th>
                </tr>
              </thead>
              <tbody>
                {sol.gradingAfter.map((g) => {
                  const gb = sol.gradingBefore.find((x) => x.upId === g.upId && x.downId === g.downId);
                  return (
                    <tr key={g.upId + g.downId} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2 text-left font-medium text-foreground">{g.downName} → {g.upName}</td>
                      <td className={td} style={{ color: gb && gb.pass === false ? "#f87171" : undefined }}>{f(gb?.minMarginS, 2)}</td>
                      <td className={`${td} font-semibold`}>{f(g.minMarginS, 2)}</td>
                      <td className={td}>{g.atDownA !== null ? f(g.atDownA, 0) : "–"}</td>
                      <td className="px-3 py-2 text-left">
                        {g.pass === null ? (
                          <span className="text-muted">no overlap</span>
                        ) : g.pass ? (
                          <span className="text-pass">{g.preferred ? "OK (preferred margin)" : "OK (reduced margin)"}</span>
                        ) : (
                          <span className="text-fail">below minimum</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Checked at {48} log-spaced currents between 1.05 × the downstream pickup and the maximum fault at the bus the downstream relay feeds. Required: minimum {deferred.opt.minMarginS.toFixed(2)} s, preferred {deferred.opt.prefMarginS.toFixed(2)} s.
          </p>
        </div>

        <div className="mt-6">
          <CompareSection study={study} sol={sol} setAlt={setAlt} />
        </div>

        {/* ---------------- Inputs ---------------- */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">1 · Targets and solver rules</h2>
          <p className="mt-1 text-sm text-muted">What PPE category each bus should reach, and how far the solver may go.</p>
        </div>
        <div className="mt-4 rounded-xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">Target category per bus</h3>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value !== "") setAllTargets(Number(e.target.value));
                e.target.value = "";
              }}
              className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-accent-2 focus:outline-none"
            >
              <option value="">Set all buses to…</option>
              <option value="-1">No target</option>
              {[0, 1, 2, 3, 4].map((k) => (
                <option key={k} value={k}>{catLabel(k)}</option>
              ))}
            </select>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {study.net.buses.map((b) => (
              <SelectField
                key={b.id}
                label={`${b.name} (${b.unKv} kV)`}
                value={study.targets[b.id] ?? -1}
                onChange={(v) => setTarget(b.id, v)}
                options={[{ value: -1, label: "No target" }, ...[0, 1, 2, 3, 4].map((k) => ({ value: k, label: catLabel(k) }))]}
              />
            ))}
          </div>

          <h3 className="mt-6 text-base font-semibold text-foreground">Solver rules</h3>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumberField label="Minimum grading margin" unit="s" min={0} step={0.05} value={study.opt.minMarginS} onChange={(v) => setOpt({ minMarginS: v })} tip="The smallest time gap between a downstream relay and the relay above it that the solver may use. 0.3 s is common with numerical relays and fast breakers; 0.4–0.5 s for electromechanical relays or slow breakers. It must cover breaker opening time, relay overshoot and timing/CT errors." />
            <NumberField label="Preferred grading margin" unit="s" min={0} step={0.05} value={study.opt.prefMarginS} onChange={(v) => setOpt({ prefMarginS: v })} tip="The solver first tries to meet the target while keeping this margin, and only goes down to the minimum margin if needed. Pairs that end between the two are flagged." />
            <NumberField label="Pickup floor (× load current)" min={1} step={0.05} value={study.opt.overloadFactor} onChange={(v) => setOpt({ overloadFactor: v })} tip="Pickup is never lowered below this multiple of the relay's maximum load current. 1.05–1.2 is typical; transformer feeders often use 1.1–1.3 × full-load current." />
            <NumberField label="Instantaneous above downstream fault (×)" min={1} step={0.05} value={study.opt.instMarginX} onChange={(v) => setOpt({ instMarginX: v })} tip="An instantaneous element is set at least this multiple above the maximum fault current at the downstream device, so it never operates for a fault the downstream relay should clear. 1.2–1.3 is typical (it also covers DC offset and CT errors)." />
            <NumberField label="Instantaneous operating time" unit="ms" min={0} value={study.opt.instMs} onChange={(v) => setOpt({ instMs: v })} tip="Operating time given to an instantaneous element the solver adds (typically 20–50 ms for numerical relays)." />
            <NumberField label="Maintenance-mode clearing time" unit="ms" min={1} value={study.opt.maintenanceMs} onChange={(v) => setOpt({ maintenanceMs: v })} tip="Total clearing time (relay + breaker) when an arc-flash maintenance switch or arc-flash relay is active. Typically 40–80 ms." />
            <NumberField label="Lowest TMS" min={0} step={0.005} value={study.opt.tmsMin} onChange={(v) => setOpt({ tmsMin: v })} tip="Smallest time multiplier the relay accepts (commonly 0.025 for IEC, 0.5 for some IEEE time-dial scales — adjust to your relay)." />
            <NumberField label="Highest TMS" min={0} step={0.1} value={study.opt.tmsMax} onChange={(v) => setOpt({ tmsMax: v })} tip="Largest time multiplier the relay accepts (commonly 1.0–1.5 for IEC)." />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <CheckboxField label="Allow lowering pickups" checked={study.opt.allowPickup} onChange={(v) => setOpt({ allowPickup: v })} tip="Lower pickup shifts the whole curve left (faster at the arcing current) but reduces the margin over load current." />
            <CheckboxField label="Allow adding / lowering instantaneous" checked={study.opt.allowInst} onChange={(v) => setOpt({ allowInst: v })} tip="Instantaneous elements give the biggest time reduction but only work when the arcing current is well above the downstream maximum fault." />
            <CheckboxField label="Allow changing to a more inverse curve" checked={study.opt.allowCurve} onChange={(v) => setOpt({ allowCurve: v })} tip="Tries the other curve types of the same family (SI, VI, EI, LTI). Off by default because it changes the character of the whole scheme." />
            <CheckboxField label="Allow speeding up downstream relays" checked={study.opt.allowDownstream} onChange={(v) => setOpt({ allowDownstream: v })} tip="If an upstream relay is held back by a downstream relay, the solver tries to make the downstream relay faster too (within its own grading and inrush limits). Locked relays are never changed." />
            <CheckboxField label="Show maintenance-mode result" checked={study.opt.allowMaintenance} onChange={(v) => setOpt({ allowMaintenance: v })} tip="Reports the incident energy with an arc-flash maintenance switch / fast setting group as a separate, temporary measure. It never replaces the permanent settings." />
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">2 · Relays and coordination</h2>
          <p className="mt-1 text-sm text-muted">Up to 8 relays. Say which bus each one feeds and which relays it grades over; the grading range follows from the fault levels.</p>
        </div>
        <div className="mt-4">
          <RelayEditor relays={study.relays} setRelays={setRelays} buses={study.net.buses} />
        </div>

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">3 · Network (short-circuit model)</h2>
          <p className="mt-1 text-sm text-muted">Same editor as the IEC 60909 calculator. Fault levels, the diagram and the arcing currents all follow from it.</p>
        </div>
        <NetworkEditor net={study.net} setNet={setNet} />

        <div className="mt-10">
          <h2 className="text-lg font-semibold text-foreground">4 · Arc-flash equipment data</h2>
          <p className="mt-1 text-sm text-muted">Equipment class, electrode configuration, enclosure and working distance for each bus. Protection is defined by the relays above.</p>
        </div>
        <div className="mt-4">
          <ArcFlashInputs net={study.net} setNet={setNet} hideProtection />
        </div>

        {/* ---------------- Method ---------------- */}
        <div className="mt-10 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground">How the proposal is calculated</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs leading-relaxed text-muted">
            <li>Fault currents (maximum and minimum, nominal-voltage basis) come from the IEC 60909 model; arcing currents and incident energy from IEEE 1584-2018 for each bus.</li>
            <li>The clearing time of a bus is the fastest of the relays assigned to it and every relay upstream of it, each evaluated at the arcing current referred to its own CT voltage, plus its breaker time.</li>
            <li>Relays are processed from the load end to the source end. Each relay first keeps the minimum grading margin to its (possibly faster) downstream relays; if its bus meets the target nothing else changes.</li>
            {sol.log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
            <li>The solver tries, in order, the settings that disturb the scheme least, and stops at the first one that meets the target. The search keeps the slowest TMS that still meets the target so that coordination is left as relaxed as possible.</li>
            <li>If no combination meets the target, the lowest-energy coordinated setting is kept, the limiting constraint is reported and hardware measures are suggested.</li>
          </ol>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-surface p-6">
          <h2 className="flex items-center text-lg font-semibold text-foreground">
            Typical values
            <Tip text="Starting points only. Use the relay and breaker manufacturer's data wherever it is available." />
          </h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-1.5 pr-3">Item</th>
                  <th className="py-1.5 pr-3">Typical value</th>
                  <th className="py-1.5">Note</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Grading margin", "0.3–0.5 s", "Breaker time + relay overshoot + errors; numerical relays allow the lower end"],
                  ["Phase pickup", "1.05–1.3 × full-load current", "Transformer feeders: also above emergency overload"],
                  ["Instantaneous pickup", "≥ 1.2–1.3 × downstream max fault", "And above inrush: 8–12 × transformer rated current"],
                  ["Motor start current", "6–8 × full-load current", "Check the start time against the TMS"],
                  ["Relay instantaneous time", "20–50 ms", "Numerical relay element"],
                  ["Breaker opening time", "40–80 ms (2–5 cycles)", "Included in the arc-flash clearing time"],
                  ["Arc-flash relay (light + current)", "35–60 ms total", "Independent of overcurrent grading"],
                  ["Zone-selective interlocking", "≈ 100–150 ms for a bus fault", "Keeps selectivity for downstream faults"],
                ].map(([a, b, c2]) => (
                  <tr key={a} className="border-b border-border/60 last:border-0">
                    <td className="py-1.5 pr-3 text-foreground">{a}</td>
                    <td className="py-1.5 pr-3 text-accent-2">{b}</td>
                    <td className="py-1.5 text-muted">{c2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
