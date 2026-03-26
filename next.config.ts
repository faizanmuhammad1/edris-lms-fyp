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
  // output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "5000mb",
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
    dangerouslyAllowSVG: true,
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