import { getTeacherCourse } from "@/app/data/teacher/get-teacher-course";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { CourseStatusBadge } from "../../../_components/CourseStatusBadge";
import { DeleteCourseButton } from "./_components/DeleteCourseButton";
import { EditTeacherCourseForm } from "./_components/EditTeacherCourseForm";
import { TeacherCourseStructure } from "./_components/TeacherCourseStructure";

type Params = Promise<{ courseId: string }>;
type SearchParams = Promise<{ tab?: string }>;

export const dynamic = "force-dynamic";

// Video processing and Whisper transcription run in after() within this time limit.
export const maxDuration = 60;

// Shared by generateMetadata and the page so the course is loaded once per request.
const getCourse = cache(getTeacherCourse);

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const course = await getCourse(courseId);
  return { title: `Edit ${course.title}` };
}

export default async function TeacherEditCourseRoute({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ courseId }, { tab }] = await Promise.all([params, searchParams]);
  const data = await getCourse(courseId);

  const lessonCount = data.chapter.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
  const chapterCount = data.chapter.length;
  const defaultTab = tab === "structure" ? "course-structure" : "basic-info";

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{data.title}</span>}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <CourseStatusBadge status={data.status} />
            <span>
              {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"} · {lessonCount}{" "}
              {lessonCount === 1 ? "lesson" : "lessons"}
            </span>
          </span>
        }
        backHref="/teacher/courses"
        backLabel="All courses"
        actions={
          <>
            <Link
              href={`/courses/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", className: "h-10 hover:scale-100" })}
            >
              <ExternalLink aria-hidden="true" />
              View course page
              <span className="sr-only">(opens in a new tab)</span>
            </Link>
            <DeleteCourseButton courseId={data.id} courseTitle={data.title} />
          </>
        }
      />

      <Tabs defaultValue={defaultTab} className="w-full gap-4">
        <TabsList className="grid h-10 w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="basic-info" className="px-4">
            Course details
          </TabsTrigger>
          <TabsTrigger value="course-structure" className="px-4">
            Chapters & lessons
          </TabsTrigger>
        </TabsList>

        {/* Kept mounted so unsaved edits survive switching tabs. */}
        <TabsContent value="basic-info" forceMount className="data-[state=inactive]:hidden">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b p-4 sm:p-6 [.border-b]:pb-4 sm:[.border-b]:pb-6">
              <CardTitle>
                <h2 className="text-lg font-semibold">Course details</h2>
              </CardTitle>
              <CardDescription>Title, description, thumbnail, price and visibility.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <EditTeacherCourseForm data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course-structure">
          <Card className="gap-0 py-0">
            <CardHeader className="border-b p-4 sm:p-6 [.border-b]:pb-4 sm:[.border-b]:pb-6">
              <CardTitle>
                <h2 className="text-lg font-semibold">Chapters & lessons</h2>
              </CardTitle>
              <CardDescription>
                Add, edit and reorder chapters and lessons. To reorder, drag a handle, or focus it and press Space, then
                the arrow keys.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <TeacherCourseStructure data={data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
