/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "marshal-lms-yt-video-subscribe.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
      {
        hostname: "lmsbucket6969.fly.storage.tigris.dev",
        port: "",
        protocol: "https",
      },
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
};

export default nextConfig;
