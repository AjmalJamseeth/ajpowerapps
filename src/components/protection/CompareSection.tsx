"use client";

import { useMemo } from "react";
import { IDMT_CURVE_OPTIONS_EXPORT } from "@/components/arcflash/curveOptions";
import { Tip } from "@/components/fields";
import { evaluateSet, mergeAlt, type ProtSolution, type ProtStudy, type RelayDef } from "@/lib/protsettings";

const f = (x: number | null | undefined, d = 1) => (x === null || x === undefined || !Number.isFinite(x) ? "–" : x.toFixed(d));
const inp = "w-full min-w-0 rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-foreground focus:border-accent-2 focus:outline-none";

/** Three-way comparison: existing settings, a second proposal typed in (e.g. the arc-flash consultant's), and the tool's proposal. */
export default function CompareSection({
  study,
  sol,
  setAlt,
}: {
  study: ProtStudy;
  sol: ProtSolution;
  setAlt: (alt: RelayDef[] | undefined) => void;
}) {
  const altRelays = useMemo(() => mergeAlt(study.relays, study.alt), [study.relays, study.alt]);
  const alt = useMemo(() => (study.alt ? evaluateSet(study, altRelays) : null), [study, altRelays]);
  const patch = (id: string, p: Partial<RelayDef>) => setAlt(altRelays.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const th = "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted";
  const thl = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted";
  const td = "px-3 py-2 text-right tabular-nums text-foreground";

  if (!study.alt || !alt) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="flex items-center text-lg font-semibold text-foreground">
          Compare with another proposal
          <Tip text="Typical use: the arc-flash consultant has proposed new settings. Type them in here and see, side by side with the existing settings and the tool's proposal, whether they meet the targets and whether they keep the grading margin." />
        </h2>
        <p className="mt-1 text-sm text-muted">
          Enter another set of relay settings (for example the arc-flash consultant&apos;s) and compare it with the existing settings and the tool&apos;s proposal: incident energy, PPE
          category and grading margins side by side.
        </p>
        <button type="button" onClick={() => setAlt(study.relays.map((r) => ({ ...r, downstream: [...r.downstream] })))} className="no-print mt-4 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90">
          Start a comparison set (copies the existing settings)
        </button>
      </div>
    );
  }

  const altBad = alt.grading.filter((g) => g.pass === false);
  const altMet = alt.buses.filter((b) => b.met === true).length;
  const targets = alt.buses.filter((b) => b.met !== null).length;
  const toolBad = sol.gradingAfter.filter((g) => g.pass === false).length;
  const toolMet = sol.after.filter((b) => b.met === true).length;
  const exBad = sol.gradingBefore.filter((g) => g.pass === false).length;
  const exMet = sol.before.filter((b) => b.met === true).length;

  const cell = (met: boolean | null, e: number, color: string) => (
    <td className={td} style={{ color }}>
      {f(e, 1)} {met === null ? "" : met ? "✓" : "✗"}
    </td>
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center text-lg font-semibold text-foreground">
          Comparison: existing · other proposal · tool proposal
          <Tip text="The middle set is whatever you type below (for example the arc-flash consultant's settings). Nothing is optimised for it — it is only evaluated, so you can see where it misses a target or breaks grading." />
        </h2>
        <div className="no-print flex gap-2">
          <button type="button" onClick={() => setAlt(study.relays.map((r) => ({ ...r, downstream: [...r.downstream] })))} className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:border-accent-2/60">
            Reset to existing
          </button>
          <button type="button" onClick={() => setAlt(undefined)} className="rounded-md border border-border px-3 py-1.5 text-xs text-muted hover:border-fail/40 hover:text-fail">
            Remove comparison
          </button>
        </div>
      </div>

      <h3 className="mt-4 text-sm font-semibold text-foreground">Settings of the other proposal</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={thl}>Relay</th>
              <th className={thl}>Curve</th>
              <th className={thl}>Pickup (A)</th>
              <th className={thl}>TMS</th>
              <th className={thl}>Inst. pickup (A, 0 = off)</th>
              <th className={thl}>Inst. time (ms)</th>
            </tr>
          </thead>
          <tbody>
            {altRelays.map((r) => (
              <tr key={r.id} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-1.5 text-left font-medium text-foreground">{r.name}</td>
                <td className="px-2 py-1.5">
                  <select value={r.curveType} onChange={(e) => patch(r.id, { curveType: e.target.value })} className={inp}>
                    {IDMT_CURVE_OPTIONS_EXPORT[r.curveFamily].map((o) => (
                      <option key={o.value} value={o.value}>{o.value}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5"><input type="number" className={inp} value={r.pickupA} onChange={(e) => patch(r.id, { pickupA: parseFloat(e.target.value) || 0 })} /></td>
                <td className="px-2 py-1.5"><input type="number" step={0.005} className={inp} value={r.tms} onChange={(e) => patch(r.id, { tms: parseFloat(e.target.value) || 0 })} /></td>
                <td className="px-2 py-1.5"><input type="number" className={inp} value={r.instPickupA} onChange={(e) => patch(r.id, { instPickupA: parseFloat(e.target.value) || 0 })} /></td>
                <td className="px-2 py-1.5"><input type="number" className={inp} value={r.instMs} onChange={(e) => patch(r.id, { instMs: parseFloat(e.target.value) || 0 })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Existing settings", exMet, exBad],
          ["Other proposal", altMet, altBad.length],
          ["Tool proposal", toolMet, toolBad],
        ].map(([l, met, bad], i) => (
          <div key={String(l)} className="rounded-lg border border-border bg-surface-2/60 p-3">
            <div className="text-xs font-semibold text-foreground">{l}</div>
            <div className="mt-1 text-sm text-muted">
              <span className={Number(met) === targets ? "text-pass" : "text-fail"}>{met} of {targets} targets met</span>
              {" · "}
              <span className={Number(bad) === 0 ? "text-pass" : "text-fail"}>{Number(bad) === 0 ? "grading OK" : `${bad} grading pair${Number(bad) > 1 ? "s" : ""} below minimum`}</span>
            </div>
            <div className="sr-only">{i}</div>
          </div>
        ))}
      </div>

      <h3 className="mt-5 text-sm font-semibold text-foreground">Incident energy by bus (cal/cm²) — ✓ meets target, ✗ does not</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={thl}>Bus</th>
              <th className={thl}>Target</th>
              <th className={th}>Existing</th>
              <th className={th}>Other proposal</th>
              <th className={th}>Tool proposal</th>
            </tr>
          </thead>
          <tbody>
            {sol.after.map((a) => {
              const b = sol.before.find((x) => x.busId === a.busId)!;
              const o = alt.buses.find((x) => x.busId === a.busId)!;
              return (
                <tr key={a.busId} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 text-left font-medium text-foreground">{a.name}</td>
                  <td className="px-3 py-2 text-left text-muted">{a.targetCat < 0 ? "none" : a.targetCat === 0 ? "< 1.2" : `≤ ${f(a.targetE, 0)}`}</td>
                  {cell(b.met, b.eCal, b.ppe.color)}
                  {cell(o.met, o.eCal, o.ppe.color)}
                  {cell(a.met, a.eCal, a.ppe.color)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="mt-5 text-sm font-semibold text-foreground">Smallest grading margin (s) — minimum required {f(study.opt.minMarginS, 2)}</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={thl}>Downstream → upstream</th>
              <th className={th}>Existing</th>
              <th className={th}>Other proposal</th>
              <th className={th}>Tool proposal</th>
            </tr>
          </thead>
          <tbody>
            {sol.gradingAfter.map((g) => {
              const gb = sol.gradingBefore.find((x) => x.upId === g.upId && x.downId === g.downId);
              const ga = alt.grading.find((x) => x.upId === g.upId && x.downId === g.downId);
              const c = (x: typeof g | undefined) => (
                <td className={td} style={{ color: x && x.pass === false ? "#f87171" : undefined }}>
                  {f(x?.minMarginS, 2)}
                  {x && x.pass === false ? " ✗" : ""}
                </td>
              );
              return (
                <tr key={g.upId + g.downId} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 text-left font-medium text-foreground">{g.downName} → {g.upName}</td>
                  {c(gb)}
                  {c(ga)}
                  {c(g)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-muted">
        {altBad.length === 0 && altMet === targets
          ? "The other proposal meets every target and keeps the minimum grading margin."
          : `The other proposal ${altMet === targets ? "meets every target" : `meets ${altMet} of ${targets} targets`}${
              altBad.length > 0 ? ` and breaks the minimum grading margin at ${altBad.map((g) => `${g.downName} → ${g.upName}`).join(", ")}` : ""
            }. ${
              toolMet >= altMet && toolBad <= altBad.length
                ? "The tool's proposal is at least as good on both counts; use it as the starting point for the joint discussion."
                : "Compare the tables above to see which constraint each proposal gives up."
            }`}
      </p>
    </div>
  );
}
