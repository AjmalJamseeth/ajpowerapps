// The site has two distinct sections: Electrical Power Engineering and
// SCADA, IEC 61850 & Automation. Every calculator group, suite and guide
// belongs to exactly one of them. Calculator URLs do not change.

import { CALCULATOR_GROUPS, type CalcGroup } from "./calculatorCatalog";
import { SUITES, type Suite } from "./suites";

export type DomainId = "electrical" | "scada";
export interface Domain {
  id: DomainId;
  title: string;
  short: string;
  href: string;
  kicker: string;
  tagline: string;
  intro: string;
  groups: string[];
  suites: string[];
  cross: string[]; // tools of the other section that are often needed here
}

export const DOMAINS: Record<DomainId, Domain> = {
  electrical: {
    id: "electrical",
    title: "Electrical Power Engineering",
    short: "Electrical",
    href: "/electrical",
    kicker: "Power · protection · cables · earthing",
    tagline: "Design, protect and maintain power systems: short circuit and arc flash, protection and relaying, cables, earthing, transformers, power quality, motors, backup power and renewables.",
    intro: "Calculators and full engineering suites for power-system design and maintenance, each built on a named standard (IEC, IEEE, NEC, BS) with the formula, assumptions and limits shown — from a single cable to a protection coordination study, a disturbance record or a transformer's ageing.",
    groups: ["short-circuit", "protection", "cables", "earthing", "transformers", "power-quality", "motors", "backup-power", "instrumentation", "solar-ev", "building-services"],
    suites: ["/calculators/protection-suite", "/calculators/cable-engineering-suite", "/calculators/dga-analyzer", "/calculators/engineering-sketch-studio"],
    cross: ["/calculators/soe-incident-timeline", "/calculators/sv-waveform-viewer", "/calculators/time-sync-analyser"],
  },
  scada: {
    id: "scada",
    title: "SCADA, IEC 61850 & Automation",
    short: "SCADA",
    href: "/scada",
    kicker: "IEC 61850 · networks · protocols · commissioning",
    tagline: "Engineer, commission and troubleshoot substation automation and SCADA: IEC 61850 SCL, GOOSE and sampled values, station networks, telecontrol protocols, time synchronisation, cybersecurity and commissioning records.",
    intro: "Tools for substation automation and SCADA engineers — from the SCD and the network design to the capture taken on site — written so that an engineer without a network background can find the fault, understand it and escalate with evidence. Files are read in your browser and never uploaded.",
    groups: ["iec-61850", "scada-it", "commissioning"],
    suites: ["/calculators/iec-61850-scl-editor", "/calculators/scl-netstudio", "/calculators/iec-61850-academy"],
    cross: ["/calculators/comtrade-fault-analyser", "/calculators/distance-protection-settings"],
  },
};
export const DOMAIN_LIST: Domain[] = [DOMAINS.electrical, DOMAINS.scada];

export function domainOfGroup(groupId: string): DomainId {
  return DOMAINS.scada.groups.includes(groupId) ? "scada" : "electrical";
}
export function domainOfHref(href: string): DomainId | null {
  const g = CALCULATOR_GROUPS.find((x) => x.calculators.some((c) => c.href === href));
  if (g) return domainOfGroup(g.id);
  if (DOMAINS.scada.suites.includes(href)) return "scada";
  if (DOMAINS.electrical.suites.includes(href)) return "electrical";
  return null;
}
export function groupsOf(d: DomainId): CalcGroup[] {
  return DOMAINS[d].groups.map((id) => CALCULATOR_GROUPS.find((g) => g.id === id)).filter((g): g is CalcGroup => !!g);
}
export function suitesOf(d: DomainId): Suite[] {
  return SUITES.filter((s) => (domainOfHref(s.href) ?? "electrical") === d);
}
export function liveCount(d: DomainId): number {
  return new Set(groupsOf(d).flatMap((g) => g.calculators.filter((c) => c.status === "live").map((c) => c.href))).size;
}
