import type { NextConfig } from "next";

/**
 * Stage 09 — Next.js security headers + image hosts.
 * API upload host is env-driven; do not hardcode a production domain.
 *
 * Browser calls use same-origin `/api` and `/uploads` rewrites so auth
 * cookies are not cross-port (fixes intermittent "Authentication required").
 */
const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
).replace(/\/$/, "");
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
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
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
