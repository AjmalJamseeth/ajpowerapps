// Interlocking logic tester (offline): parses interlocking release conditions
// written as Boolean expressions over switchgear positions (double points) and
// single points, evaluates them over every combination of input values, and
// checks fail-safe behaviour when an input is intermediate, bad, invalid, lost
// (GOOSE time allowed to live expired) or in test — the way IEC 61850-7-4 CILO
// release logic should behave — and against a specification.

export type SigType = "DPS" | "SPS";
export interface Sig { name: string; type: SigType; source: string; desc: string; goose: boolean }
export type Val = "ON" | "OFF" | "INT" | "BAD";
export type Health = "good" | "invalid" | "lost" | "test";
type Tri = 1 | 0 | -1; // true, false, unknown

type Node =
  | { k: "or" | "and"; a: Node; b: Node }
  | { k: "not"; a: Node }
  | { k: "cmp"; id: string; neg: boolean; v: Val };

export interface Rule { name: string; text: string; ast: Node | null; ids: string[]; err?: string; line: number }

const VALS: Record<string, Val> = { ON: "ON", CLOSED: "ON", CLOSE: "ON", TRUE: "ON", "1": "ON", OFF: "OFF", OPEN: "OFF", OPENED: "OFF", FALSE: "OFF", "0": "OFF", INT: "INT", INTERMEDIATE: "INT", MOVING: "INT", BAD: "BAD", FAULTY: "BAD", "11": "BAD", "00": "INT" };

export function parseSignals(text: string): { sigs: Sig[]; errs: string[] } {
  const sigs: Sig[] = [], errs: string[] = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const l = raw.replace(/#.*/, "").trim();
    if (!l) return;
    const m = l.match(/^([A-Za-z_][\w.]*)\s+(DPS|SPS|DPC|SPC)\b\s*(?:(GOOSE|local)\b\s*([\w.-]*))?\s*(.*)$/i);
    if (!m) { errs.push(`Signals line ${i + 1}: "${l}" — write: name DPS|SPS [GOOSE source | local] description`); return; }
    const t = /^D/i.test(m[2]) ? "DPS" : "SPS";
    if (sigs.some((s) => s.name.toLowerCase() === m[1].toLowerCase())) { errs.push(`Signals line ${i + 1}: ${m[1]} defined twice.`); return; }
    sigs.push({ name: m[1], type: t, goose: /goose/i.test(m[3] ?? ""), source: m[4] || (/goose/i.test(m[3] ?? "") ? "GOOSE" : "local"), desc: m[5] });
  });
  return { sigs, errs };
}

function tokenize(s: string): string[] {
  const out: string[] = [];
  const re = /\s*(==|!=|<>|=|&&|\|\||[&|!()]|\bAND\b|\bOR\b|\bNOT\b|\bIS\b|[A-Za-z_][\w.]*|\d+)\s*/giy;
  let m: RegExpExecArray | null, last = 0;
  while ((m = re.exec(s))) { out.push(m[1]); last = re.lastIndex; }
  if (last < s.trim().length && s.slice(last).trim()) throw new Error(`cannot read "${s.slice(last).trim()}"`);
  return out;
}

function parseExpr(text: string): { ast: Node; ids: string[] } {
  const tk = tokenize(text);
  let p = 0;
  const ids = new Set<string>();
  const peek = () => (tk[p] ?? "").toUpperCase();
  const or = (): Node => { let a = and(); while (peek() === "|" || peek() === "||" || peek() === "OR") { p++; a = { k: "or", a, b: and() }; } return a; };
  const and = (): Node => { let a = not(); while (peek() === "&" || peek() === "&&" || peek() === "AND") { p++; a = { k: "and", a, b: not() }; } return a; };
  const not = (): Node => { if (peek() === "!" || peek() === "NOT") { p++; return { k: "not", a: not() }; } return atom(); };
  const atom = (): Node => {
    if (peek() === "(") { p++; const e = or(); if (tk[p] !== ")") throw new Error("missing )"); p++; return e; }
    const id = tk[p];
    if (!id || !/^[A-Za-z_]/.test(id) || VALS[id.toUpperCase()]) throw new Error(`expected a signal name at "${tk.slice(p).join(" ") || "end"}"`);
    p++; ids.add(id);
    let neg = false;
    const op = peek();
    if (op === "==" || op === "=" || op === "IS") { p++; if (op === "IS" && peek() === "NOT") { p++; neg = true; } }
    else if (op === "!=" || op === "<>") { p++; neg = true; }
    else return { k: "cmp", id, neg: false, v: "ON" }; // bare single point = TRUE
    const v = VALS[(tk[p] ?? "").toUpperCase()];
    if (!v) throw new Error(`expected ON, OFF, INT or BAD after ${id}`);
    p++;
    return { k: "cmp", id, neg, v };
  };
  const ast = or();
  if (p < tk.length) throw new Error(`unexpected "${tk.slice(p).join(" ")}"`);
  return { ast, ids: [...ids] };
}

export function parseRules(text: string): Rule[] {
  const out: Rule[] = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const l = raw.replace(/#.*/, "").trim();
    if (!l) return;
    const m = l.match(/^([^:]+):\s*(.+)$/);
    if (!m) { out.push({ name: `line ${i + 1}`, text: l, ast: null, ids: [], err: 'write "name: condition", for example "QB1 operate: QA1 = OFF & QC1 = OFF"', line: i + 1 }); return; }
    try { const r = parseExpr(m[2]); out.push({ name: m[1].trim(), text: m[2].trim(), ast: r.ast, ids: r.ids, line: i + 1 }); }
    catch (e) { out.push({ name: m[1].trim(), text: m[2].trim(), ast: null, ids: [], err: (e as Error).message, line: i + 1 }); }
  });
  return out;
}

export interface InState { v: Val; h: Health }
/** Fail-safe (Kleene) evaluation: an input that is not good, or a BAD position, makes its comparison unknown; unknown never releases. */
function evalSafe(n: Node, s: Record<string, InState>): Tri {
  switch (n.k) {
    case "or": { const a = evalSafe(n.a, s), b = evalSafe(n.b, s); return a === 1 || b === 1 ? 1 : a === -1 || b === -1 ? -1 : 0; }
    case "and": { const a = evalSafe(n.a, s), b = evalSafe(n.b, s); return a === 0 || b === 0 ? 0 : a === -1 || b === -1 ? -1 : 1; }
    case "not": { const a = evalSafe(n.a, s); return a === -1 ? -1 : a === 1 ? 0 : 1; }
    case "cmp": { const x = s[n.id]; if (!x || x.h !== "good" || x.v === "BAD") return -1; const r = x.v === n.v; return (n.neg ? !r : r) ? 1 : 0; }
  }
}
/** What an implementation that ignores quality does: it uses the last received value as if it were good. */
function evalNaive(n: Node, s: Record<string, InState>): boolean {
  switch (n.k) {
    case "or": return evalNaive(n.a, s) || evalNaive(n.b, s);
    case "and": return evalNaive(n.a, s) && evalNaive(n.b, s);
    case "not": return !evalNaive(n.a, s);
    case "cmp": { const x = s[n.id]; const r = !!x && x.v === n.v; return n.neg ? !r : r; }
  }
}

export interface Combo { vals: Record<string, Val>; release: boolean }
export interface Mismatch { vals: Record<string, Val>; impl: boolean; spec: boolean }
export interface Degrade { input: string; health: Health | "BAD" | "INT"; base: Record<string, Val>; safe: Tri; naive: boolean }
export interface TestCase { step: number; setup: Record<string, string>; action: string; expect: "RELEASED" | "BLOCKED"; why: string }
export interface RuleResult {
  rule: Rule; inputs: string[]; total: number; releases: number; combos: Combo[];
  mismatches: Mismatch[]; specMissing: boolean;
  hazards: Degrade[]; // degraded inputs that keep the release in a quality-blind implementation
  failsafeOk: boolean; tests: TestCase[]; findings: { sev: "error" | "warning" | "info" | "ok"; text: string }[];
}

const domain = (t: SigType): Val[] => (t === "DPS" ? ["OFF", "ON", "INT", "BAD"] : ["OFF", "ON"]);
const fmt = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join(", ");

export function testRule(rule: Rule, sigs: Sig[], spec?: Rule, maxCombos = 65536): RuleResult {
  const F: RuleResult["findings"] = [], add = (sev: RuleResult["findings"][0]["sev"], text: string) => F.push({ sev, text });
  const base: RuleResult = { rule, inputs: [], total: 0, releases: 0, combos: [], mismatches: [], specMissing: !spec, hazards: [], failsafeOk: true, tests: [], findings: F };
  if (!rule.ast) { add("error", `${rule.name}: ${rule.err}`); return base; }
  const sm = new Map(sigs.map((s) => [s.name.toLowerCase(), s]));
  const inputs = [...new Set([...rule.ids, ...(spec?.ids ?? [])])];
  const unknown = inputs.filter((i) => !sm.has(i.toLowerCase()));
  if (unknown.length) { add("error", `${rule.name}: signal${unknown.length > 1 ? "s" : ""} ${unknown.join(", ")} not defined in the signal list.`); return { ...base, inputs }; }
  const S = inputs.map((i) => sm.get(i.toLowerCase())!);
  const canon = (n: Node): Node => n.k === "cmp" ? { ...n, id: sm.get(n.id.toLowerCase())!.name } : n.k === "not" ? { k: "not", a: canon(n.a) } : { k: n.k, a: canon(n.a), b: canon(n.b) };
  const ast = canon(rule.ast), sast = spec?.ast ? canon(spec.ast) : null;
  for (const s of S) if (s.type === "SPS") { const bad = (function f(n: Node): boolean { return n.k === "cmp" ? n.id === s.name && (n.v === "INT" || n.v === "BAD") : n.k === "not" ? f(n.a) : f(n.a) || f(n.b); })(ast); if (bad) add("warning", `${rule.name}: ${s.name} is a single point but is compared with INT or BAD.`); }
  const total = S.reduce((n, s) => n * domain(s.type).length, 1);
  if (total > maxCombos) { add("error", `${rule.name}: ${total.toLocaleString()} combinations — more than ${maxCombos.toLocaleString()}; split the condition.`); return { ...base, inputs: S.map((s) => s.name) }; }
  const names = S.map((s) => s.name), combos: Combo[] = [], mism: Mismatch[] = [], specCombos: Combo[] = [];
  const st: Record<string, InState> = {};
  const idx = new Array(S.length).fill(0);
  for (let c = 0; c < total; c++) {
    const vals: Record<string, Val> = {};
    S.forEach((s, i) => { vals[s.name] = domain(s.type)[idx[i]]; st[s.name] = { v: vals[s.name], h: "good" }; });
    const rel = evalSafe(ast, st) === 1;
    combos.push({ vals, release: rel });
    if (sast) { const sp = evalSafe(sast, st) === 1; specCombos.push({ vals, release: sp }); if (sp !== rel) mism.push({ vals, impl: rel, spec: sp }); }
    for (let i = S.length - 1; i >= 0; i--) { idx[i]++; if (idx[i] < domain(S[i].type).length) break; idx[i] = 0; }
  }
  const releases = combos.filter((c) => c.release).length;
  if (!releases) add("error", `${rule.name}: the operation is never released — the condition is a contradiction.`);
  else if (releases === combos.length) add("warning", `${rule.name}: released in every combination — the condition blocks nothing.`);
  const unusedSpec = sast ? names.filter((n) => !rule.ids.some((i) => i.toLowerCase() === n.toLowerCase())) : [];
  if (unusedSpec.length) add("warning", `${rule.name}: the specification uses ${unusedSpec.join(", ")}, the implemented logic does not.`);
  if (sast) {
    const loose = mism.filter((m) => m.impl && !m.spec), strict = mism.filter((m) => !m.impl && m.spec);
    if (loose.length) add("error", `${rule.name}: released in ${loose.length} combination(s) where the specification blocks, e.g. ${fmt(loose[0].vals)}. This is unsafe.`);
    if (strict.length) add("warning", `${rule.name}: blocked in ${strict.length} combination(s) where the specification releases, e.g. ${fmt(strict[0].vals)}. Safe, but operators will be blocked unnecessarily.`);
    if (!mism.length) add("ok", `${rule.name}: identical to the specification in all ${total} combinations.`);
  }
  // degraded inputs: for every released combination, degrade each input
  const hazards: Degrade[] = [];
  let failsafeOk = true;
  for (const c of combos.filter((x) => x.release)) {
    for (const s of S) {
      for (const h of ["invalid", "lost", "test"] as Health[]) {
        S.forEach((x) => { st[x.name] = { v: c.vals[x.name], h: "good" }; });
        st[s.name] = { v: c.vals[s.name], h };
        const safe = evalSafe(ast, st), naive = evalNaive(ast, st);
        if (safe === 1) {
          // release does not depend on this input in this state (another branch of an OR holds): acceptable
          continue;
        }
        if (naive && hazards.length < 400 && !hazards.some((z) => z.input === s.name && z.health === h)) hazards.push({ input: s.name, health: h, base: c.vals, safe, naive });
      }
    }
  }
  const hz = new Map<string, Degrade[]>();
  for (const z of hazards) hz.set(z.input, [...(hz.get(z.input) ?? []), z]);
  const localHz: string[] = [];
  for (const [inp, zs] of hz) {
    const s = sm.get(inp.toLowerCase())!;
    if (!s.goose) { localHz.push(inp); continue; }
    add("warning", `${rule.name}: if ${inp} (GOOSE from ${s.source}) becomes ${zs.map((z) => z.health).join(" / ")}, an implementation that does not check quality and GOOSE supervision keeps the last value and still releases (e.g. with ${fmt(zs[0].base)}). Loss, invalid quality or test mode of a GOOSE input must block.`);
  }
  if (localHz.length) add("info", `${rule.name}: ${localHz.join(", ")} (local inputs) must also block when their position supervision reports invalid; check that the bay controller uses the quality, not only the value.`);
  const st0 = (vals: Record<string, Val>, over?: [string, InState]) => { const o: Record<string, InState> = Object.fromEntries(names.map((n) => [n, { v: vals[n], h: "good" as Health }])); if (over) o[over[0]] = over[1]; return o; };
  // BAD (11) or intermediate positions that release because of "!=" tests
  for (const s of S.filter((x) => x.type === "DPS")) {
    const bad = combos.find((c) => (c.vals[s.name] === "BAD") && evalNaive(ast, st0(c.vals)) && evalSafe(ast, st0(c.vals, [s.name, { v: "BAD", h: "invalid" }])) !== 1);
    if (bad) { failsafeOk = false; add("warning", `${rule.name}: a BAD (11) position of ${s.name} satisfies the condition as written (${fmt(bad.vals)}) — through a "!=" test. Write it with "= OFF" / "= ON" so only a definite position releases.`); }
  }
  // test cases (FAT / SAT): a released state, then for each input the change that must block
  const tests: TestCase[] = [];
  const definite = (c: Combo) => Object.values(c.vals).every((v) => v === "ON" || v === "OFF");
  const ref = sast ? specCombos : combos, refAst = sast ?? ast; // tests follow the specification when there is one
  const rels = [...ref.filter((c) => c.release && definite(c)), ...ref.filter((c) => c.release && !definite(c))];
  if (rels.length) {
    tests.push({ step: 1, setup: { ...rels[0].vals }, action: `Operate (${rule.name})`, expect: "RELEASED", why: "all conditions fulfilled" });
    const key = (v: Record<string, Val>) => names.map((n) => v[n]).join("|");
    const map = new Map(ref.map((c) => [key(c.vals), c.release]));
    for (const s of S) {
      let done = false;
      for (const c of rels) {
        for (const v of domain(s.type)) {
          if (v === c.vals[s.name] || v === "BAD") continue;
          const vals = { ...c.vals, [s.name]: v };
          if (map.get(key(vals)) === false) { tests.push({ step: tests.length + 1, setup: vals, action: `Set ${s.name} = ${v}, operate`, expect: "BLOCKED", why: `${s.name} ${v} must block (from a released state)` }); done = true; break; }
        }
        if (done) break;
      }
      if (s.goose) {
        const c = rels.find((x) => evalSafe(refAst, st0(x.vals, [s.name, { v: x.vals[s.name], h: "lost" }])) !== 1);
        if (c) tests.push({ step: tests.length + 1, setup: { ...c.vals }, action: `Interrupt the GOOSE from ${s.source} (or put the publisher in test mode) until the time allowed to live expires, operate`, expect: "BLOCKED", why: `loss of ${s.name} must block` });
      }
    }
  }
  if (!F.some((f) => f.sev === "error" || f.sev === "warning")) add("ok", `${rule.name}: ${releases} of ${total} combinations release; fail-safe for invalid, lost and test inputs.`);
  return { rule, inputs: names, total, releases, combos, mismatches: mism, specMissing: !spec, hazards, failsafeOk: failsafeOk && !hz.size, tests, findings: F };
}

export function testAll(sigText: string, implText: string, specText: string) {
  const { sigs, errs } = parseSignals(sigText);
  const impl = parseRules(implText), spec = parseRules(specText);
  const res = impl.map((r) => testRule(r, sigs, spec.find((s) => s.name.toLowerCase() === r.name.toLowerCase())));
  const extraSpec = spec.filter((s) => !impl.some((r) => r.name.toLowerCase() === s.name.toLowerCase()));
  const unused = sigs.filter((s) => !impl.some((r) => r.ids.some((i) => i.toLowerCase() === s.name.toLowerCase())));
  return { sigs, errs, res, extraSpec, unused };
}

export function testSheetCsv(res: RuleResult[]): string {
  const e = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const L = ["Function,Step,Initial state,Action,Expected,Reason,Result,Tested by,Date"];
  for (const r of res) for (const t of r.tests) L.push([r.rule.name, String(t.step), fmt(t.setup), t.action, t.expect, t.why, "", "", ""].map(e).join(","));
  return L.join("\r\n");
}

export const SAMPLE_SIGNALS = `# name  type  source  description
QA1  DPS  local            Circuit breaker
QB1  DPS  local            Busbar 1 disconnector
QB2  DPS  local            Busbar 2 disconnector
QB9  DPS  local            Line disconnector
QC1  DPS  local            Earth switch, breaker side
QC2  DPS  local            Earth switch, busbar side of the line disconnector
QC9  DPS  local            Line earth switch
BC_QA1  DPS  GOOSE BCU_BC  Bus coupler circuit breaker
BC_QB1  DPS  GOOSE BCU_BC  Bus coupler busbar 1 disconnector
BC_QB2  DPS  GOOSE BCU_BC  Bus coupler busbar 2 disconnector
LINE_V  SPS  GOOSE P132_Q01  Line voltage present (from the line protection)`;

export const SAMPLE_IMPL = `# Interlocking as configured in the bay controller (deliberate faults)
QB1 operate: QA1 = OFF & QC1 = OFF & QC2 = OFF & QB2 = OFF | BC_QA1 = ON & BC_QB1 = ON & BC_QB2 = ON
QB2 operate: QA1 = OFF & QC1 = OFF & QC2 = OFF & (QB1 = OFF | BC_QA1 = ON & BC_QB1 = ON & BC_QB2 = ON)
QB9 operate: QA1 = OFF & QC2 = OFF & QC9 = OFF
QC9 close: QB9 = OFF & LINE_V != ON
QA1 close: QB1 != INT & QB2 != INT & QB9 != INT`;

export const SAMPLE_SPEC = `# Interlocking specification
QB1 operate: QA1 = OFF & QC1 = OFF & QC2 = OFF & (QB2 = OFF | BC_QA1 = ON & BC_QB1 = ON & BC_QB2 = ON)
QB2 operate: QA1 = OFF & QC1 = OFF & QC2 = OFF & (QB1 = OFF | BC_QA1 = ON & BC_QB1 = ON & BC_QB2 = ON)
QB9 operate: QA1 = OFF & QC2 = OFF & QC9 = OFF
QC9 close: QB9 = OFF & LINE_V = OFF
QA1 close: (QB1 = ON | QB1 = OFF) & (QB2 = ON | QB2 = OFF) & (QB9 = ON | QB9 = OFF)`;
