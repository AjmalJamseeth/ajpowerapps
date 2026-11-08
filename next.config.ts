import type { NextConfig } from "next";

// Build identifier shown in page footers and PDF reports, so a page or report
// can always be traced to the release that produced it. Vercel provides the
// commit; local builds fall back to "local".
const BUILD_ID = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.BUILD_ID_OVERRIDE || "local").slice(0, 7);
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
    NEXT_PUBLIC_BUILD_DATE: BUILD_DATE,
  },
  // Hides the dev-mode "N" indicator badge (Route/Bundler/Route Info popup)
  // shown while running `next dev`. Dev-only — it never appears for site
  // visitors or in the production build either way. Compile/runtime errors
  // still surface normally with this off.
  devIndicators: false,

  // One canonical host: the bare domain redirects to www, and the retired
  // Multi-Bus IDMT Grading page redirects to the merged IDMT calculator.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ajpowerapps.com" }],
        destination: "https://www.ajpowerapps.com/:path*",
        permanent: true,
      },
      {
        source: "/calculators/idmt-grading",
        destination: "/calculators/idmt",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
