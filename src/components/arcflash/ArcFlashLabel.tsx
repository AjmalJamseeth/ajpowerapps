import type { ArcFlashBusResult } from "@/lib/arcflashstudy";

// NFPA 70E / ANSI Z535 style arc-flash warning label. Rendered with fixed
// colours (white background, black text) so it prints correctly in either
// site theme.

const f = (x: number, d = 0) => (Number.isFinite(x) ? x.toFixed(d) : "–");
const inches = (mm: number) => `${f(mm / 25.4)} in`;
const feetIn = (m: number) => {
  const totalIn = (m * 1000) / 25.4;
  return `${Math.floor(totalIn / 12)} ft ${f(totalIn % 12)} in`;
};

export default function ArcFlashLabel({ r, upstream, date }: { r: ArcFlashBusResult; upstream: string; date: string }) {
  const danger = r.ppe.cat === 5;
  const head = danger ? "#dc2626" : "#f97316";
  const p = r.ppe;
  return (
    <div
      className="af-label overflow-hidden rounded-md border-2 text-[11px] leading-snug"
      style={{ background: "#ffffff", color: "#111827", borderColor: head, breakInside: "avoid" }}
    >
      <div className="px-3 py-1.5 text-center text-base font-extrabold tracking-wide" style={{ background: head, color: "#fff" }}>
        {danger ? "DANGER" : "WARNING"}
        <div className="text-[10px] font-semibold tracking-normal">{danger ? "No safe PPE category — do not work energized" : "Arc Flash and Shock Hazard — appropriate PPE required"}</div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 px-3 py-2">
        <div className="col-span-2 border-b pb-1" style={{ borderColor: "#d1d5db" }}>
          <span className="text-sm font-bold">{r.name}</span>{" "}
          <span style={{ color: "#4b5563" }}>
            · {f(r.unKv, r.unKv < 1 ? 3 : 1)} kV · {r.equipLabel}
          </span>
        </div>
        <div>
          <div className="font-bold">Arc flash hazard</div>
          <div>
            Incident energy: <b>{f(r.eCal, 1)} cal/cm²</b>
          </div>
          <div>
            at working distance <b>{f(r.workingMm)} mm</b> ({inches(r.workingMm)})
          </div>
          <div>
            Arc-flash boundary: <b>{f(r.afbMm)} mm</b> ({feetIn(r.afbMm / 1000)})
          </div>
        </div>
        <div>
          <div className="font-bold">Required PPE</div>
          <div className="inline-block rounded px-1.5 py-0.5 font-bold" style={{ background: p.color, color: p.cat === 0 || p.cat === 1 || p.cat === 2 ? "#111827" : "#fff" }}>
            {p.cat === 0 ? "Category 0 / none" : p.cat === 5 ? "Exceeds Category 4" : p.name}
          </div>
          <div>{p.minArcRating ? `Minimum arc rating ${p.minArcRating} cal/cm²` : p.cat === 5 ? "De-energize / reduce energy" : "Normal work wear"}</div>
        </div>
        <div className="col-span-2 border-t pt-1" style={{ borderColor: "#d1d5db" }}>
          <div className="font-bold">Shock hazard (AC)</div>
          <div>
            Nominal voltage <b>{f(r.unKv * 1000)} V</b> · Limited approach{" "}
            <b>{r.shock.limitedFixedM ? `${f(r.shock.limitedFixedM, 1)} m (${feetIn(r.shock.limitedFixedM)})` : "n/a"}</b> · Restricted approach <b>{r.shock.restricted}</b>
          </div>
        </div>
        <div className="col-span-2 border-t pt-1 text-[10px]" style={{ borderColor: "#d1d5db", color: "#4b5563" }}>
          Upstream device: {upstream} · Gap {f(r.gapMm)} mm · {r.config} · Study date {date} · IEEE 1584-2018 · Verify before work
        </div>
      </div>
    </div>
  );
}
