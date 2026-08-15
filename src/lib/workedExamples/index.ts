// Aggregates every group's worked examples into one list, plus lookup
// helpers. Mirrors the calculatorCatalog.ts single-source-of-truth pattern:
// add a new group file, import it here, and both /examples and any
// per-calculator cross-links stay in sync automatically.

import type { WorkedExample } from "./types";
import { PROTECTION_EXAMPLES } from "./protection";
import { CABLES_EXAMPLES } from "./cables";
import { EARTHING_EXAMPLES } from "./earthing";
import { TRANSFORMERS_EXAMPLES } from "./transformers";
import { POWERQUALITY_EXAMPLES } from "./powerquality";
import { MOTORS_EXAMPLES } from "./motors";
import { BACKUPPOWER_EXAMPLES } from "./backuppower";
import { INSTRUMENTATION_EXAMPLES } from "./instrumentation";
import { SOLAREV_EXAMPLES } from "./solarev";
import { BUILDINGSERVICES_EXAMPLES } from "./buildingservices";

export const WORKED_EXAMPLES: WorkedExample[] = [
  ...PROTECTION_EXAMPLES,
  ...CABLES_EXAMPLES,
  ...EARTHING_EXAMPLES,
  ...TRANSFORMERS_EXAMPLES,
  ...POWERQUALITY_EXAMPLES,
  ...MOTORS_EXAMPLES,
  ...BACKUPPOWER_EXAMPLES,
  ...INSTRUMENTATION_EXAMPLES,
  ...SOLAREV_EXAMPLES,
  ...BUILDINGSERVICES_EXAMPLES,
];

export const TOTAL_EXAMPLES = WORKED_EXAMPLES.length;

export function getExampleBySlug(slug: string): WorkedExample | undefined {
  return WORKED_EXAMPLES.find((e) => e.slug === slug);
}

export function getExamplesForCalculator(calculatorHref: string): WorkedExample[] {
  return WORKED_EXAMPLES.filter((e) => e.calculatorHref === calculatorHref);
}

export function getExamplesForGroup(groupId: string): WorkedExample[] {
  return WORKED_EXAMPLES.filter((e) => e.groupId === groupId);
}
