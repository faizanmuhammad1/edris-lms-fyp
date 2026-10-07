import { EmptyState } from "@/components/general/EmptyState";
import { CourseProgressCard } from "../_components/CourseProgressCard";
import {
  EnrolledCourseType,
  getEnrolledCourses,
} from "@/app/data/user/get-enrolled-courses";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export default async function StudentCoursesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true, teacherStatus: true },
    });

    if (user?.role === "admin") {
      redirect("/admin");
    }

    if (user?.role === "teacher" || user?.teacherStatus === "Approved") {
      redirect("/teacher");
    }
  }

  const enrolledCourses = await getEnrolledCourses();

  const sortedCourses: EnrolledCourseType[] = [...enrolledCourses].sort((a, b) =>
    a.Course.title.localeCompare(b.Course.title)
  );

  return (
    <>
      <section className="mb-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">My courses</h1>
          <p className="text-muted-foreground">
            All courses you&apos;ve purchased, with progress for each one.
          </p>
        </div>
      </section>

      {sortedCourses.length === 0 ? (
        <EmptyState
          title="No courses yet"
          description="You haven&apos;t enrolled in any courses. Browse the catalog to get started."
          buttonText="Browse courses"
          href="/courses"
        />
      ) : (
        <section className="mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedCourses.map((course) => (
              <CourseProgressCard key={course.Course.id} data={course} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

