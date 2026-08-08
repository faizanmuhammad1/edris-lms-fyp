import { prisma } from "@/lib/db";

export async function getAllCourses(category?: string) {
  const data = await prisma.course.findMany({
    where: {
      status: "Published",
      ...(category && { category }),
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
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  return data;
}

export type PublicCourseType = Awaited<ReturnType<typeof getAllCourses>>[0];
