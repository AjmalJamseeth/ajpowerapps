// Feature switches for work that is built and tested but not offered to the public yet.
//
// studio: the Protection & Arc-Flash Studio (/calculators/arc-flash-protection-settings),
// which turns a target arc-flash PPE category into coordinated relay settings. While this is
// false the page is not listed in the catalog, home page, navigation or sitemap, is marked
// noindex, and the Protection Coordination Suite page does not offer its hand-off buttons.
// Set it to true to relist everything when the feature is released.
export const FEATURES = {
  studio: false,
} as const;
