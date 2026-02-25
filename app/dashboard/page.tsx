import { EmptyState } from "@/components/general/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCourses } from "../data/course/get-all-courses";
import {
  EnrolledCourseType,
  getEnrolledCourses,
} from "../data/user/get-enrolled-courses";
import { getCertificates } from "../data/user/get-certificates";
import { PublicCourseCard } from "../(public)/_components/PublicCourseCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

import { CourseProgressCard } from "./_components/CourseProgressCard";
import { StudentStatsOverview } from "@/components/dashboard/StudentStatsOverview";

export default async function DashboardPage() {
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

  const [courses, enrolledCourses, certificates] = await Promise.all([
    getAllCourses(),
    getEnrolledCourses(),
    getCertificates(),
  ]);

  const primaryCourse: EnrolledCourseType | null =
    enrolledCourses.length > 0 ? enrolledCourses[0] : null;
  const otherCourses: EnrolledCourseType[] =
    primaryCourse && enrolledCourses.length > 1
      ? enrolledCourses.slice(1)
      : [];

  return (
    <>
      {/* My learning overview (headline + stats) */}
      <section className="mb-8">
        <div className="flex flex-col gap-1 mb-3">
          <h1 className="text-3xl font-bold">My learning overview</h1>
          <p className="text-muted-foreground">
            Track your overall progress and where you&apos;re spending your time.
          </p>
        </div>
        <StudentStatsOverview
          enrolledCourses={enrolledCourses}
          certificatesCount={certificates.length}
        />
      </section>

      {/* Continue learning */}
      {primaryCourse && (
        <section className="mb-8">
          <div className="flex flex-col gap-1 mb-4">
            <h2 className="text-2xl font-semibold">Continue learning</h2>
            <p className="text-muted-foreground">
              Jump back into your most recently active course.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)]">
            <CourseProgressCard data={primaryCourse} />
          </div>
        </section>
      )}

      {enrolledCourses.length === 0 ? (
        <EmptyState
          title="No courses purchased"
          description="You haven't purchased any courses yet."
          buttonText="Browse Courses"
          href="/courses"
        />
      ) : otherCourses.length === 0 && primaryCourse ? null : (
        <section className="mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(otherCourses.length > 0 ? otherCourses : enrolledCourses).map(
              (course) => (
                <CourseProgressCard key={course.Course.id} data={course} />
              )
            )}
          </div>
        </section>
      )}

      {/* Quick access to recent certificates */}
      {certificates.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-col gap-2 mb-5">
            <h2 className="text-2xl font-bold">Recent Certificates</h2>
            <p className="text-muted-foreground">
              Access certificates for your completed courses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.slice(0, 4).map((cert) => (
              <Card key={cert.certificateId} className="flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg line-clamp-2">
                    {cert.courseTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">
                    Issued {new Date(cert.issuedOn).toLocaleDateString()}
                  </p>
                  <a
                    href={`/dashboard/${cert.courseSlug}/certificate`}
                    className="inline-flex mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    View certificate
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <div className="flex flex-col gap-2 mb-5">
          <h2 className="text-2xl font-semibold">Explore more courses</h2>
          <p className="text-muted-foreground">
            Browse other courses you can purchase to continue growing your
            skills.
          </p>
        </div>

        {courses.filter(
          (course) =>
            !enrolledCourses.some(
              ({ Course: enrolled }) => enrolled.id === course.id
            )
        ).length === 0 ? (
          <EmptyState
            title="No courses available"
            description="You have already purchased all available courses."
            buttonText="Browse Courses"
            href="/courses"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses
              .filter(
                (course) =>
                  !enrolledCourses.some(
                    ({ Course: enrolled }) => enrolled.id === course.id
                  )
              )
              .map((course) => (
                <PublicCourseCard key={course.id} data={course} />
              ))}
          </div>
        )}
      </section>
    </>
  );
}
