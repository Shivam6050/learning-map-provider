import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bound build-time page workers on small development and CI machines.
  experimental: { cpus: 2 },
  turbopack: {
    root: __dirname,
  },
  // Baseline security headers. Not a substitute for the RLS/validation
  // work done elsewhere — this is the browser-side layer (clickjacking,
  // MIME-sniffing, referrer leakage), which is a different attack
  // surface than the server-side one.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
