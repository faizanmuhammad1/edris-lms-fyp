import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  async redirects() {
    return [
      {
        source: '/signup',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // output: "standalone",
  experimental: {
    serverActions: {
      // File uploads go straight to storage via presigned URLs, not through server actions.
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    '/**/*': ['./lib/generated/prisma/libquery_engine-*'],
  },
  turbopack: {
    resolveAlias: {
      "entities/decode": "entities",
      "entities/lib/decode": "entities",
    },
  },

  images: {
    // DiceBear avatars are SVGs; sandbox them so an SVG can never run script.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        hostname: "edris-lms.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "avatar.vercel.sh",
        port: "",
        protocol: "https",
      },
      {
        hostname: "images.unsplash.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "lmsbucket6969.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "edris-lms-fyp.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "api.dicebear.com",
        port: "",
        protocol: "https",
      },
      {
        hostname: "edris-lms-fyp.t3.storage.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "image.mux.com",
        port: "",
        protocol: "https",
      },
    ],
  },

  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Restrict webpack context to the project root
    const projectRoot = path.resolve(__dirname);
    config.context = projectRoot;

    // Add alias to fix broken deep import from htmlparser2 -> entities/decode
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        "entities/decode": "entities",
        "entities/lib/decode": "entities",
      },
    };

    // Optimize cache to avoid "Serializing big strings" warning
    if (config.cache && !isServer) {
      config.cache = {
        ...config.cache,
        compression: "brotli",
      };
    }

    return config;
  },
} satisfies NextConfig;

export default nextConfig;