import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { adminGetCourse } from "@/app/data/admin/admin-get-course";
import { CourseStatusBadge } from "@/app/admin/_components/StatusBadge";
import { PageHeader } from "@/components/general/PageHeader";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { EditCourseForm } from "./_components/EditCourseForm";
import { CourseStructure } from "./_components/CourseStructure";

type Params = Promise<{ courseId: string }>;
type SearchParams = Promise<{ tab?: string | string[] }>;

export const metadata: Metadata = {
  title: "Admin · Edit course",
};

// Video processing and Whisper transcription run in after() within this time limit.
export const maxDuration = 60;

export default async function EditRoute({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { courseId } = await params;
  const { tab } = await searchParams;
  const data = await adminGetCourse(courseId);
  // ?tab=structure opens the outline directly (used by the lesson editor's back link)
  const defaultTab = tab === "structure" ? "course-structure" : "basic-info";

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="break-words">{data.title}</span>}
        backHref="/admin/courses"
        backLabel="All courses"
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <CourseStatusBadge status={data.status} />
            <span>
              {data.user?.name ? `By ${data.user.name}. ` : ""}Edit the course details, then
              organise its chapters and lessons.
            </span>
          </span>
        }
        actions={
          <>
            <Link
              href={`/courses/${data.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline" }), "flex-1 sm:flex-none")}
            >
              <ExternalLink aria-hidden="true" />
              Preview
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
            <Link
              href={`/admin/courses/${data.id}/delete`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "flex-1 text-destructive hover:text-destructive sm:flex-none"
              )}
            >
              <Trash2 aria-hidden="true" />
              Delete course
            </Link>
          </>
        }
      />

      <Tabs defaultValue={defaultTab} className="w-full gap-4">
        <TabsList className="grid h-11 w-full grid-cols-2">
          <TabsTrigger value="basic-info">Basic info</TabsTrigger>
          <TabsTrigger value="course-structure">Course structure</TabsTrigger>
        </TabsList>

        <TabsContent value="basic-info">
          <Card className="gap-4 py-4 sm:gap-6 sm:py-6">
            <CardHeader className="px-4 sm:px-6">
              <h2 className="text-lg font-semibold leading-none">Basic info</h2>
              <CardDescription>
                The title, pricing and descriptions students see on the course page.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <EditCourseForm data={data} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course-structure">
          <CourseStructure data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
