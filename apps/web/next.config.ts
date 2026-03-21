import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // Disabled to prevent stale cache issues
});

const nextConfig: NextConfig = {
  transpilePackages: ["@kiddokeys/ui", "@kiddokeys/types"],
  output: "export",
  images: {
    unoptimized: true, // Required for static export
  },
};

export default withPWA(nextConfig);
