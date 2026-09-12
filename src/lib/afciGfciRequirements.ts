// AFCI/GFCI Protection Requirements Calculator — location-based lookup of
// whether a dwelling-unit branch circuit typically requires AFCI
// protection (NEC 210.12(A)) and/or GFCI protection (NEC 210.8(A)),
// based on the commonly enumerated 2020/2023 NEC dwelling-unit location
// lists. This is a code-reference lookup, not a first-principles
// calculation — the underlying lists change between NEC editions (most
// recently GFCI coverage was extended to laundry areas and all kitchen
// receptacles in the 2020 cycle) and are subject to local amendments, so
// results are flagged as "typically required" rather than a definitive
// ruling. Designed from scratch; no equivalent module exists elsewhere in
// AJapps.

export type DwellingLocation =
  | "kitchen" | "bathroom" | "bedroom" | "livingFamilyDiningRoom"
  | "laundryArea" | "garage" | "outdoors" | "unfinishedBasement"
  | "crawlSpace" | "hallwayClosetSunroom" | "sinkWithin6ft" | "other";

interface LocationRequirement {
  label: string;
  afciRequired: boolean | "verify";
  gfciRequired: boolean | "verify";
  afciCitation: string;
  gfciCitation: string;
}

export const DWELLING_LOCATIONS: Record<DwellingLocation, LocationRequirement> = {
  kitchen: {
    label: "Kitchen",
    afciRequired: true, gfciRequired: true,
    afciCitation: "NEC 210.12(A) — kitchens",
    gfciCitation: "NEC 210.8(A)(6) — all 125-250V, 15/20A receptacles in kitchens",
  },
  bathroom: {
    label: "Bathroom",
    afciRequired: false, gfciRequired: true,
    afciCitation: "Not on the 210.12(A) enumerated list",
    gfciCitation: "NEC 210.8(A)(1) — bathrooms",
  },
  bedroom: {
    label: "Bedroom",
    afciRequired: true, gfciRequired: false,
    afciCitation: "NEC 210.12(A) — bedrooms",
    gfciCitation: "Not on the 210.8(A) list unless within 6ft of a sink",
  },
  livingFamilyDiningRoom: {
    label: "Living / family / dining room, den, library, sunroom",
    afciRequired: true, gfciRequired: false,
    afciCitation: "NEC 210.12(A) — family rooms, dining rooms, living rooms, parlors, libraries, dens, sunrooms",
    gfciCitation: "Not on the 210.8(A) list unless within 6ft of a sink",
  },
  laundryArea: {
    label: "Laundry area",
    afciRequired: true, gfciRequired: true,
    afciCitation: "NEC 210.12(A) — laundry areas",
    gfciCitation: "NEC 210.8(A)(11) — laundry areas (2020 NEC addition)",
  },
  garage: {
    label: "Garage / accessory building",
    afciRequired: false, gfciRequired: true,
    afciCitation: "Not on the 210.12(A) enumerated list",
    gfciCitation: "NEC 210.8(A)(2) — garages, accessory buildings",
  },
  outdoors: {
    label: "Outdoors",
    afciRequired: false, gfciRequired: true,
    afciCitation: "Not on the 210.12(A) enumerated list",
    gfciCitation: "NEC 210.8(A)(3) — outdoors",
  },
  unfinishedBasement: {
    label: "Unfinished basement",
    afciRequired: "verify", gfciRequired: true,
    afciCitation: "Not explicitly enumerated — some AHJs apply 210.12(A)'s \"similar rooms/areas\" broadly; verify locally",
    gfciCitation: "NEC 210.8(A)(5) — unfinished basements",
  },
  crawlSpace: {
    label: "Crawl space (at or below grade)",
    afciRequired: false, gfciRequired: true,
    afciCitation: "Not on the 210.12(A) enumerated list",
    gfciCitation: "NEC 210.8(A)(4) — crawl spaces at or below grade level",
  },
  hallwayClosetSunroom: {
    label: "Hallway, closet, or recreation room",
    afciRequired: true, gfciRequired: false,
    afciCitation: "NEC 210.12(A) — closets, hallways, recreation rooms",
    gfciCitation: "Not on the 210.8(A) list unless within 6ft of a sink",
  },
  sinkWithin6ft: {
    label: "Any receptacle within 6ft of a sink edge",
    afciRequired: "verify", gfciRequired: true,
    afciCitation: "Depends on the room the sink is in — check that room's own AFCI requirement separately",
    gfciCitation: "NEC 210.8(A)(7) — receptacles within 6ft of the outside edge of a sink",
  },
  other: {
    label: "Other / not listed here",
    afciRequired: "verify", gfciRequired: "verify",
    afciCitation: "Verify against the full NEC 210.12(A) list and any local amendments",
    gfciCitation: "Verify against the full NEC 210.8(A) list and any local amendments",
  },
};

export interface AfciGfciInput {
  location: DwellingLocation;
}

export const DEFAULT_AFCI_GFCI_INPUT: AfciGfciInput = { location: "kitchen" };

export function lookupAfciGfci(input: AfciGfciInput): LocationRequirement {
  return DWELLING_LOCATIONS[input.location];
}
