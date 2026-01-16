import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable cross-origin isolation for WebContainers
  // WebContainers require SharedArrayBuffer which needs COOP/COEP headers
  async headers() {
    return [
      {
        // Apply to ALL routes for full cross-origin isolation
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "credentialless",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
