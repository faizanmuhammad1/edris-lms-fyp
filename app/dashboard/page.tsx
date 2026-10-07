import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, Award, BookOpen, Compass } from "lucide-react";
import { EmptyState } from "@/components/general/EmptyState";
import { PageHeader } from "@/components/general/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudentStatsOverview } from "@/components/dashboard/StudentStatsOverview";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAllCourses } from "../data/course/get-all-courses";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { getCertificates } from "../data/user/get-certificates";
import { CourseProgressCard } from "./_components/CourseProgressCard";
import { ExploreCourseCard } from "./_components/ExploreCourseCard";
import { PageContainer } from "./_components/PageContainer";
import { getCourseProgress } from "./_components/progress-utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

const EXPLORE_LIMIT = 6;

function SectionHeading({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

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

  // "Continue learning" highlights the most advanced unfinished course, then a not-yet-started one.
  const withProgress = enrolledCourses.map((enrollment) => ({
    enrollment,
    percentage: getCourseProgress(enrollment.Course).percentage,
  }));
  const featured =
    [...withProgress]
      .filter((c) => c.percentage > 0 && c.percentage < 100)
      .sort((a, b) => b.percentage - a.percentage)[0] ??
    withProgress.find((c) => c.percentage < 100) ??
    withProgress[0] ??
    null;
  const otherCourses = enrolledCourses.filter(
    (e) => e.Course.id !== featured?.enrollment.Course.id
  );

  const enrolledIds = new Set(enrolledCourses.map((e) => e.Course.id));
  const exploreCourses = courses.filter((course) => !enrolledIds.has(course.id));
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <PageContainer className="gap-10">
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "My learning"}
        description="Track your progress and pick up where you left off."
        actions={
          <Button variant="outline" size="lg" asChild>
            <Link href="/courses">
              <Compass aria-hidden="true" />
              Browse courses
            </Link>
          </Button>
        }
      />

      <section aria-labelledby="overview-heading" className="space-y-4">
        <h2 id="overview-heading" className="sr-only">
          Learning overview
        </h2>
        <StudentStatsOverview enrolledCourses={enrolledCourses} certificatesCount={certificates.length} />
      </section>

      {enrolledCourses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="You're not enrolled in any courses yet"
          description="Find a course that matches your goals. Once you enroll, your progress and certificates will appear here."
          buttonText="Browse courses"
          href="/courses"
        />
      ) : (
        <>
          {featured && (
            <section aria-labelledby="continue-heading" className="space-y-4">
              <SectionHeading
                id="continue-heading"
                title="Continue learning"
                description="Pick up where you left off."
              />
              <CourseProgressCard data={featured.enrollment} featured />
            </section>
          )}

          {otherCourses.length > 0 && (
            <section aria-labelledby="courses-heading" className="space-y-4">
              <SectionHeading
                id="courses-heading"
                title="Your other courses"
                action={
                  <Button variant="ghost" asChild className="self-start sm:self-auto">
                    <Link href="/dashboard/courses">
                      View all courses
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {otherCourses.slice(0, 3).map((course) => (
                  <CourseProgressCard key={course.Course.id} data={course} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {certificates.length > 0 && (
        <section aria-labelledby="certificates-heading" className="space-y-4">
          <SectionHeading
            id="certificates-heading"
            title="Recent certificates"
            description="Certificates for courses you've completed."
            action={
              <Button variant="ghost" asChild className="self-start sm:self-auto">
                <Link href="/dashboard/certificates">
                  All certificates
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            }
          />
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {certificates.slice(0, 4).map((cert) => (
              <li key={cert.certificateId}>
                <Card className="relative h-full gap-0 py-0 transition-shadow hover:shadow-md has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/50">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Award className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="font-semibold leading-snug break-words">
                        <Link
                          href={`/dashboard/certificate/${cert.courseSlug}`}
                          className="line-clamp-2 outline-none after:absolute after:inset-0 after:content-[''] hover:text-primary"
                          title={cert.courseTitle}
                        >
                          {cert.courseTitle}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Issued{" "}
                        <time dateTime={cert.issuedOn}>
                          {new Date(cert.issuedOn).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </time>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="explore-heading" className="space-y-4">
        <SectionHeading
          id="explore-heading"
          title="Explore more courses"
          description="Keep growing your skills with another course."
          action={
            exploreCourses.length > EXPLORE_LIMIT ? (
              <Button variant="ghost" asChild className="self-start sm:self-auto">
                <Link href="/courses">
                  See all
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            ) : undefined
          }
        />
        {exploreCourses.length === 0 ? (
          <EmptyState
            titleAs="h3"
            icon={Compass}
            title="You're enrolled in every course"
            description="New courses are added regularly. Check back soon for more."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {exploreCourses.slice(0, EXPLORE_LIMIT).map((course) => (
              <ExploreCourseCard key={course.id} data={course} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
