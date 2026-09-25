import type { NextConfig } from "next";

/**
 * Stage 09 — Next.js security headers + image hosts.
 * API upload host is env-driven; do not hardcode a production domain.
 */
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
let apiHostname = "localhost";
let apiProtocol: "http" | "https" = "http";
let apiPort: string | undefined = "4000";
try {
  const u = new URL(apiUrl);
  apiHostname = u.hostname;
  apiProtocol = u.protocol === "https:" ? "https" : "http";
  apiPort = u.port || undefined;
} catch {
  /* keep defaults */
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiProtocol,
        hostname: apiHostname,
        ...(apiPort ? { port: apiPort } : {}),
        pathname: "/uploads/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
