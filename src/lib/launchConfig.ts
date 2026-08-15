// Single toggle for the "free for launch" promotional period: every
// subscriber-only feature across all 29 calculators is unlocked while this
// is true, EXCEPT the PDF report watermark (src/components/ReportButton.tsx),
// which intentionally stays on regardless of this flag.
//
// To restore normal subscriber gating once real accounts/payments are
// wired up, set FREE_LAUNCH back to false — every `unlocked={FREE_LAUNCH}`
// and `calcXxx(input, FREE_LAUNCH)` call site reverts automatically.
export const FREE_LAUNCH = true;

// Adjust to your actual go-live + promo-end dates. Shown in the site-wide
// banner (NavBar.tsx) and can be referenced anywhere else that mentions
// the launch window.
export const FREE_LAUNCH_END_LABEL = "mid-November 2026";
