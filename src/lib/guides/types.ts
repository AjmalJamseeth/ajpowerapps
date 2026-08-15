// Shared content schema for the category tutorial guides. One GuideDoc per
// calculator category (matching the 10 CALCULATOR_GROUPS ids), giving each
// category a conceptual primer: core theory, the standards landscape, how
// that category's calculators fit together in a typical workflow, and
// common mistakes/misconceptions. This is deliberately a different content
// type from workedExamples — a worked example shows how to solve one
// specific numeric problem; a guide explains the underlying engineering
// so the reader has the context to use any of the category's calculators
// correctly in the first place.

export interface Faq {
  q: string;
  a: string;
}

export interface GuideSection {
  heading: string;
  body: string[]; // one or more paragraphs
}

export interface StandardRef {
  standard: string; // e.g. "IEEE C37.112-1996"
  scope: string; // what it covers, in this category's context
}

export interface WorkflowStep {
  title: string;
  body: string;
  calculatorHref?: string; // links to the relevant calculator, if this step maps to one
  calculatorName?: string;
}

export interface CommonMistake {
  mistake: string;
  whyItMatters: string;
}

export interface GuideDoc {
  slug: string; // used as /guides/[slug]
  groupId: string; // matches CALCULATOR_GROUPS[].id
  title: string;
  dek: string; // one-line description shown on index cards and page header
  readTime: string; // e.g. "14 min read"
  intro: string[]; // opening paragraphs — why this category matters
  coreConcepts: GuideSection[];
  standardsLandscape: StandardRef[];
  workflow: WorkflowStep[]; // typical order of use across this category's calculators
  commonMistakes: CommonMistake[];
  faqs: Faq[];
}
