import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/app/(public)/_lib/seo";

// Regenerate at most once an hour so new/updated courses show up without a redeploy.
export const revalidate = 3600;

const staticPages: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/courses", changeFrequency: "daily", priority: 0.9 },
  { path: "/teach", changeFrequency: "monthly", priority: 0.6 },
  { path: "/verification", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.2 },
  { path: "/accessibility", changeFrequency: "yearly", priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const courses = await prisma.course.findMany({
      where: { status: "Published" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    for (const course of courses) {
      entries.push({
        url: absoluteUrl(`/courses/${encodeURIComponent(course.slug)}`),
        lastModified: course.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  } catch (error) {
    // Still serve the static pages if the database is unavailable.
    console.error("[sitemap] failed to load courses", error);
  }

  return entries;
}
