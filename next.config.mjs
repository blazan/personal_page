/**
 * Next.js configuration.
 *
 * Kept as .mjs rather than .ts on purpose: loading a TypeScript config makes
 * Next trace the whole `typescript` package into the standalone output, which
 * would add ~9 MB to the runtime image for no benefit.
 *
 * Security headers applied to every response.
 * A strict Content-Security-Policy is intentionally omitted here because the
 * contact form and admin panel rely on inline styles/scripts injected by Next.
 * Tighten `script-src` with nonces if you later add a CDN.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Emits a self-contained server bundle in .next/standalone so the Docker
  // runtime image does not need the full node_modules tree or dev tooling.
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // better-sqlite3 and sharp are native addons: they must stay outside the
  // bundler and be required at runtime straight from node_modules.
  serverExternalPackages: ["better-sqlite3", "sharp"],

  images: {
    // Seed content references Unsplash; uploaded images are served locally.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Uploaded WebP files are immutable: the filename contains a random
        // token, so a long cache lifetime is safe and keeps pages fast.
        source: "/api/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
