import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Restrict Next.js to only scan within the project directory
  // This prevents scanning system directories on Windows
  experimental: {
    // Use more restrictive file system access
  },

  images: {
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
    ],
  },

  webpack: (config) => {
    // Restrict webpack context to the project root
    const projectRoot = path.resolve(__dirname);
    config.context = projectRoot;

    // Add alias to fix broken deep import from htmlparser2 -> entities/decode
    config.resolve = {
      ...config.resolve,
      alias: {
        ...(config.resolve?.alias || {}),
        // Map old deep-import to a valid path in entities
        "entities/decode": "entities/lib/decode.js",
        "entities/lib/decode": "entities/lib/decode.js",
      },
    };

    return config;
  },
};

export default nextConfig;
