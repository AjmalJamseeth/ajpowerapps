// Shared content schema for the worked-examples library. One WorkedExample
// per calculator (at minimum), grouped by the same 10 category ids used in
// calculatorCatalog.ts so the /examples index and /calculators index stay
// aligned. Numeric values in each example are derived by running the
// calculator's own already-verified lib function(s) with the stated inputs
// (see the generator scripts referenced in each group file's header comment)
// rather than being hand-typed, so the worked example can never silently
// drift from what the live calculator would actually produce.

export interface ScenarioParam {
  label: string;
  value: string;
}

export interface StepBlock {
  title: string;
  body?: string; // optional prose before the equation
  equationLabel?: string; // e.g. "Eq. 1"
  equation?: string; // symbolic form, e.g. "Ib = P / (V x PF)"
  substitution?: string; // numbers plugged in, e.g. "Ib = 7200 / (230 x 1.0)"
  result?: string; // the step's headline output, e.g. "Ib = 31.3 A"
  note?: string; // clarifying aside
  table?: { headers: string[]; rows: string[][] };
}

export interface ResultRow {
  check: string;
  requirement: string;
  actual: string;
  pass: boolean;
}

export interface Faq {
  q: string;
  a: string;
}

export interface WorkedExample {
  slug: string; // used as /examples/[slug]
  groupId: string; // matches CALCULATOR_GROUPS[].id
  calculatorHref: string; // matches CalcCard.href
  calculatorName: string; // matches CalcCard.name
  title: string;
  dek: string; // one-line description shown on index cards and page header
  standard: string; // short badge, e.g. "IEEE 1584-2018"
  readTime: string; // e.g. "10 min read"
  incidentBased?: boolean; // true if framed around a named real-world incident
  scenario: ScenarioParam[];
  scenarioNote?: string;
  steps: StepBlock[];
  resultSummary: ResultRow[];
  finalAnswer: string;
  keyInsight?: string;
  faqs: Faq[];
}
