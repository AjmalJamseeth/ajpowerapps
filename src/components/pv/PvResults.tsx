"use client";

import { PvResult } from "@/lib/pv";

function fmt(n: number, d = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function CheckRow({ label, value, pass }: { label: string; value: string; pass: boolean | null }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2">
      <span className="text-muted">{label}</span>
      <span className={pass === null ? "text-foreground" : pass ? "text-pass" : "text-fail"}>
        {value}
        {pass !== null && (pass ? " ✓" : " ✗")}
      </span>
    </div>
  );
}

export default function PvResults({ result }: { result: PvResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Results</h3>
        <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4 text-sm text-muted">
          Enter the PV module datasheet values (Voc, Vmpp, Isc, temperature coefficient) and modules per string to see results.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">String voltage window</h3>
        <div className="mt-4 space-y-2 text-sm">
          <CheckRow label="Vmax (cold, Voc basis)" value={`${fmt(result.vMax, 1)} V`} pass={result.vMaxPass} />
          <CheckRow
            label="Vmpp range (hot → cold)"
            value={`${fmt(result.vMppHot, 1)} – ${fmt(result.vMppCold, 1)} V`}
            pass={result.mpptPass}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h3 className="text-base font-semibold text-foreground">Current & cable sizing</h3>
        <div className="mt-4 space-y-2 text-sm">
          <CheckRow label="String design current (Isc × 1.25)" value={`${fmt(result.iscDesign, 2)} A`} pass={result.iscPass} />
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">DC cable size</span>
            <span className="text-foreground">{result.dc.size ? `${result.dc.size} mm²` : "No standard size satisfies ampacity & 2% VD"}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">DC voltage drop</span>
            <span className="text-foreground">{result.dc.vd !== null ? `${fmt(result.dc.vd, 2)}%` : "—"}</span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-2">
            <span className="text-muted">AC cable size</span>
            <span className="text-foreground">{result.ac.size ? `${result.ac.size} mm²` : "No standard size satisfies ampacity & 3% VD"}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-muted">AC voltage drop</span>
            <span className="text-foreground">{result.ac.vd !== null ? `${fmt(result.ac.vd, 2)}%` : "—"}</span>
          </div>
        </div>
      </div>

      {result.dcAcRatio && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">DC:AC oversizing ratio</h3>
          <div className="mt-3 text-sm">
            <div className="text-xl font-semibold text-foreground">{fmt(result.dcAcRatio.ratio, 2)}×</div>
            <div className="mt-1 text-xs text-muted">
              {fmt(result.dcAcRatio.arrayKwp, 2)} kWp array / {result.dcAcRatio.arrayKwp > 0 ? "" : ""} inverter AC rating
              {result.dcAcRatio.note && ` — ${result.dcAcRatio.note}`}
            </div>
          </div>
        </div>
      )}

      {result.multiString && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h3 className="text-base font-semibold text-foreground">Multi-string array</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">Combined MPPT current (Np × Isc × 1.25)</span>
              <span className="text-foreground">{fmt(result.multiString.combinedIscA, 2)} A</span>
            </div>
            <div className="flex justify-between border-b border-border/60 pb-2">
              <span className="text-muted">String OCPD required?</span>
              <span className="text-foreground">
                {result.multiString.ocpdRequired ? "Yes — 3+ strings paralleled (IEC 60364-7-712 §712.433.1.101.2)" : "Not required for ≤2 parallel strings"}
              </span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-muted">Recommended string fuse rating</span>
              <span className="text-foreground">
                {result.multiString.ocpdRequired
                  ? result.multiString.fuseA
                    ? `${result.multiString.fuseA} A`
                    : `${fmt(result.multiString.minRatingA, 1)} A min`
                  : "—"}{" "}
                {result.multiString.ocpdRequired && `(valid range ${fmt(result.multiString.minRatingA, 1)}–${fmt(result.multiString.maxRatingA, 1)} A)`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
