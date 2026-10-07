import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/app/(public)/_lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/teacher",
          "/dashboard",
          "/api",
          "/payment",
          "/verify-request",
          "/profile-setup",
          "/certificates/render",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
