import { EmptyState } from "@/components/general/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllCourses } from "../data/course/get-all-courses";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { getCertificates } from "../data/user/get-certificates";
import { PublicCourseCard } from "../(public)/_components/PublicCourseCard";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

import { CourseProgressCard } from "./_components/CourseProgressCard";

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

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Enrolled Courses</h1>
        <p className="text-muted-foreground">
          Here you can see all the courses you have access to
        </p>
      </div>

      {/* Certificates summary */}
      <section className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Certificates</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-3xl font-bold">{certificates.length}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Total certificates earned
              </p>
            </CardContent>
          </Card>

          {/* You can add more summary cards here if needed */}
        </div>
      </section>

      {enrolledCourses.length === 0 ? (
        <EmptyState
          title="No courses purchased"
          description="You haven't purchased any courses yet."
          buttonText="Browse Courses"
          href="/courses"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {enrolledCourses.map((course) => (
            <CourseProgressCard key={course.Course.id} data={course} />
          ))}
        </div>
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
          <h1 className="text-3xl font-bold">Available Courses</h1>
          <p className="text-muted-foreground">
            Here you can see all the courses you can purchase
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
