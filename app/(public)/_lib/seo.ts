import type { Metadata } from "next";

/** Canonical site origin (no trailing slash). Mirrors metadataBase in app/layout.tsx. */
export const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.edrislms.com").replace(/\/$/, "");

export const SITE_NAME = "Edris LMS";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Edris LMS — online courses with AI tutoring and verified certificates",
};

type PageMetadataInput = {
  /** Page title; the root layout template appends "| Edris LMS". */
  title: string;
  description: string;
  /** Site-relative canonical path, e.g. "/courses". */
  path: string;
  image?: { url: string; alt?: string; width?: number; height?: number } | null;
  noindex?: boolean;
  /** Use the title as-is (no template), e.g. for the home page. */
  absoluteTitle?: boolean;
};

/** Consistent title/description/canonical/Open Graph/Twitter metadata for public pages. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex,
  absoluteTitle,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

/** Serialises JSON-LD safely for a <script type="application/ld+json"> tag. */
export function jsonLd(data: unknown): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/** Trims text to a meta-description friendly length on a word boundary. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
