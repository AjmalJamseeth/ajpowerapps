// Aggregates every category's guide into one list, plus lookup helpers.
// Mirrors the workedExamples/index.ts single-source-of-truth pattern: add
// a new group file, import it here, and /guides stays in sync.

import type { GuideDoc } from "./types";
import { PROTECTION_GUIDE } from "./protection";
import { CABLES_GUIDE } from "./cables";
import { EARTHING_GUIDE } from "./earthing";
import { TRANSFORMERS_GUIDE } from "./transformers";
import { POWERQUALITY_GUIDE } from "./powerquality";
import { MOTORS_GUIDE } from "./motors";
import { BACKUPPOWER_GUIDE } from "./backuppower";
import { INSTRUMENTATION_GUIDE } from "./instrumentation";
import { SOLAREV_GUIDE } from "./solarev";
import { BUILDINGSERVICES_GUIDE } from "./buildingservices";

export const GUIDES: GuideDoc[] = [
  PROTECTION_GUIDE,
  CABLES_GUIDE,
  EARTHING_GUIDE,
  TRANSFORMERS_GUIDE,
  POWERQUALITY_GUIDE,
  MOTORS_GUIDE,
  BACKUPPOWER_GUIDE,
  INSTRUMENTATION_GUIDE,
  SOLAREV_GUIDE,
  BUILDINGSERVICES_GUIDE,
];

export const TOTAL_GUIDES = GUIDES.length;

export function getGuideBySlug(slug: string): GuideDoc | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuideForGroup(groupId: string): GuideDoc | undefined {
  return GUIDES.find((g) => g.groupId === groupId);
}
