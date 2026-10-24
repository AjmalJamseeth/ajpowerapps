import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
