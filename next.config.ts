import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/tools/code-explainer", destination: "/tools/how-it-works", permanent: true },
      { source: "/tools/error-explainer", destination: "/tools/error-resolver", permanent: true },
      { source: "/tools/package-advisor", destination: "/tools/tool-finder", permanent: true },
      { source: "/tools/integration-planner", destination: "/tools/integration-blueprint", permanent: true },
      { source: "/tools/health-checker", destination: "/tools/connection-health-check", permanent: true },
      { source: "/tools/dependency-audit", destination: "/tools/compatibility-check", permanent: true },
      { source: "/tools/migration-assistant", destination: "/tools/upgrade-assistant", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
        ],
      },
    ];
  },
};

export default nextConfig;
