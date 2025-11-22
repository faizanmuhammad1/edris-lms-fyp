// server-only

import { prisma } from "@/lib/db";
import { requireAdmin } from "./require-admin";

export async function adminGetRecentCourses() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  await requireAdmin();

  const data = await prisma.course.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 2,
    select: {
      id: true,
      title: true,
      smallDescription: true,
      duration: true,
      level: true,
      status: true,
      price: true,
      fileKey: true,
      slug: true,
    },
  });

  if (data.length === 0) {
    // Demo fallback: two recent-looking courses
    const mock = [
      {
        id: "mock-1",
        title: "Introduction to Next.js",
        smallDescription: "Build modern web apps with Next.js and React.",
        duration: 180,
        level: "Beginner" as const,
        status: "Published" as const,
        price: 0,
        fileKey: "thumbnails/nextjs.png",
        slug: "introduction-to-nextjs",
      },
      {
        id: "mock-2",
        title: "TypeScript Basics",
        smallDescription: "Type-safe JavaScript for scalable apps.",
        duration: 150,
        level: "Beginner" as const,
        status: "Draft" as const,
        price: 0,
        fileKey: "thumbnails/typescript.png",
        slug: "typescript-basics",
      },
    ];

    return mock as typeof data;
  }

  return data;
}
