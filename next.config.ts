import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the dev-mode "N" indicator badge (Route/Bundler/Route Info popup)
  // shown while running `next dev`. Dev-only — it never appears for site
  // visitors or in the production build either way. Compile/runtime errors
  // still surface normally with this off.
  devIndicators: false,
};

export default nextConfig;
