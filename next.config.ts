import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable cross-origin isolation for WebContainers
  // WebContainers require SharedArrayBuffer which needs COOP/COEP headers
  async headers() {
    return [
      {
        source: "/builder/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
