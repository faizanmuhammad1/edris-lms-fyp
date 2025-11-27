import { getTeacherCourses } from "@/app/data/teacher/get-teacher-courses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Suspense } from "react";
import { CourseManagement } from "./_components/CourseManagement";
import { TeacherCourseCardSkeleton } from "./_components/TeacherCourseCard";
import { Sparkles, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TeacherCoursesPage() {
  const coursesPromise = getTeacherCourses();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 p-6">
        <Card className="border-border/50 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm text-primary">
                <Sparkles className="h-4 w-4" />
                <span>Teacher Workspace</span>
              </div>
              <CardTitle className="text-3xl">Manage Your Courses</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Drag & drop to re-order, filter by status or level, and jump into editing with one click. Everything you
                need to curate your catalog sits in one carefully organized space.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/teacher/courses/new">
                <Button size="lg" className="w-full bg-primary shadow-lg shadow-primary/25 hover:scale-[1.01]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </Link>
              <Link href="/teacher/analytics">
                <Button size="lg" variant="outline" className="w-full border-border/60 hover:border-primary/40">
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        <Suspense fallback={<TeacherCourseCardSkeletonLayout />}>
          <RenderCourses coursesPromise={coursesPromise} />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderCourses({ coursesPromise }: { coursesPromise: Promise<Awaited<ReturnType<typeof getTeacherCourses>>> }) {
  const data = await coursesPromise;

  return <CourseManagement courses={data} />;
}

function TeacherCourseCardSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <TeacherCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
