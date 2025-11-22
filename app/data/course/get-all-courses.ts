import { prisma } from "@/lib/db";

export async function getAllCourses() {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const data = await prisma.course.findMany({
    where: {
      status: "Published",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      title: true,
      price: true,
      smallDescription: true,
      slug: true,
      fileKey: true,
      id: true,
      level: true,
      duration: true,
      category: true,
    },
  });

  if (data.length === 0) {
    // Mock fallback courses for demo environments
    const mock = [
      {
        id: "course-nextjs",
        title: "Introduction to Next.js",
        smallDescription: "Build modern web apps with Next.js and React.",
        price: 0,
        slug: "introduction-to-nextjs",
        fileKey: "thumbnails/nextjs.png",
        level: "Beginner" as const,
        duration: 180,
        category: "Web Development",
      },
      {
        id: "course-ts-basics",
        title: "TypeScript Basics",
        smallDescription: "Type-safe JavaScript for scalable apps.",
        price: 0,
        slug: "typescript-basics",
        fileKey: "thumbnails/typescript.png",
        level: "Beginner" as const,
        duration: 150,
        category: "Programming",
      },
      {
        id: "course-react-state",
        title: "React State Management",
        smallDescription: "Manage complex state with hooks and patterns.",
        price: 0,
        slug: "react-state-management",
        fileKey: "thumbnails/react.png",
        level: "Intermediate" as const,
        duration: 210,
        category: "Web Development",
      },
      {
        id: "course-tailwind",
        title: "Tailwind CSS Fundamentals",
        smallDescription: "Style fast with utility-first CSS.",
        price: 0,
        slug: "tailwind-css-fundamentals",
        fileKey: "thumbnails/tailwind.png",
        level: "Beginner" as const,
        duration: 120,
        category: "Design",
      },
      {
        id: "course-prisma-pg",
        title: "Prisma with PostgreSQL",
        smallDescription: "Type-safe database access with Prisma.",
        price: 0,
        slug: "prisma-with-postgresql",
        fileKey: "thumbnails/prisma.png",
        level: "Intermediate" as const,
        duration: 200,
        category: "Databases",
      },
      {
        id: "course-node-auth",
        title: "Node.js APIs and Auth",
        smallDescription: "Build secure REST APIs with Node and auth.",
        price: 0,
        slug: "nodejs-apis-and-auth",
        fileKey: "thumbnails/node.png",
        level: "Intermediate" as const,
        duration: 240,
        category: "Backend",
      },
    ];

    return mock as typeof data;
  }

  return data;
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];
