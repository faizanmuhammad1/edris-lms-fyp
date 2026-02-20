import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
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

  webpack: (config, { isServer }) => {
    // Restrict webpack context to the project root
    const projectRoot = path.resolve(__dirname);
    config.context = projectRoot;

    // Add alias to fix broken deep import from htmlparser2 -> entities/decode
    // The entities package structure changed, so we need to resolve to the package root
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        // Map old deep-import paths to the entities package itself
        // This works because entities exports decode from its main entry
        "entities/decode": "entities",
        "entities/lib/decode": "entities",
      },
    };

    // Optimize cache to avoid "Serializing big strings" warning
    if (config.cache && !isServer) {
      config.cache = {
        ...config.cache,
        compression: "brotli", // Use brotli compression for smaller cache files
      };
    }

    return config;
  },
};

export default nextConfig;
