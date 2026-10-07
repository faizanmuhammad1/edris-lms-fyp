import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BookOpen, Compass } from "lucide-react";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { getEnrolledCourses } from "@/app/data/user/get-enrolled-courses";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CourseProgressCard } from "../_components/CourseProgressCard";
import { PageContainer } from "../_components/PageContainer";

export const metadata: Metadata = {
  title: "My Courses",
};

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
  const sortedCourses = [...enrolledCourses].sort((a, b) =>
    a.Course.title.localeCompare(b.Course.title)
  );

  return (
    <PageContainer>
      <PageHeader
        title="My courses"
        description="Every course you're enrolled in, with your progress in each."
        actions={
          sortedCourses.length > 0 ? (
            <Button variant="outline" size="lg" asChild>
              <Link href="/courses">
                <Compass aria-hidden="true" />
                Browse courses
              </Link>
            </Button>
          ) : undefined
        }
      />

      {sortedCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="You haven't enrolled in any courses. Browse the catalog to find your first one."
          buttonText="Browse courses"
          href="/courses"
        />
      ) : (
        <section aria-label="Enrolled courses">
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedCourses.map((course) => (
              <li key={course.Course.id} className="flex">
                <CourseProgressCard data={course} headingLevel="h2" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </PageContainer>
  );
}
