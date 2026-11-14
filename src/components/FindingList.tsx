// Shared list of findings (severity label + text) for the analysis tools.
type Sev = "error" | "warning" | "info" | "ok";
const SEV: Record<Sev, [string, string]> = { error: ["Error", "text-fail"], warning: ["Warning", "text-accent"], info: ["Note", "text-accent-2"], ok: ["OK", "text-pass"] };

export function FindingList({ list, empty }: { list: { sev: Sev; text: string; no?: number }[]; empty?: string }) {
  if (!list.length) return <p className="text-sm text-muted">{empty ?? "No findings."}</p>;
  return (
    <ul className="space-y-2">
      {list.map((f, i) => (
        <li key={i} className="text-sm">
          <span className={`mr-2 text-xs font-semibold uppercase ${SEV[f.sev][1]}`}>{SEV[f.sev][0]}</span>
          {f.no ? <span className="mr-2 font-mono text-xs text-muted">frame {f.no}</span> : null}
          <span className="text-foreground">{f.text}</span>
        </li>
      ))}
    </ul>
  );
}
export const thCls = "py-1 pr-3 text-left font-normal text-muted";
export const tdCls = "py-1 pr-3 align-top";
export const btnCls = "rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-accent";
