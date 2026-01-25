import { getCourseSidebarData } from "@/app/data/course/get-course-sidebar-data";
import { getCourseReviews } from "@/app/actions/reviews";
import { ReviewForm } from "@/components/general/ReviewForm";
import { ReviewList } from "@/components/general/ReviewList";
import { BookOpen, Clock, BarChart } from "lucide-react";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Separator } from "@/components/ui/separator";

interface iAppProps {
  params: Promise<{ slug: string }>;
}

export default async function CourseSlugRoute({ params }: iAppProps) {
  const { slug } = await params;
  const { course } = await getCourseSidebarData(slug);
  const reviews = await getCourseReviews(course.id);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">{course.title}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{course.duration} Hours</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="w-4 h-4" />
            <span>{course.level}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.category}</span>
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">About this Course</h2>
            <div className="prose dark:prose-invert max-w-none">
              <RenderDescription json={JSON.parse(course.description)} />
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-2xl font-semibold mb-6">Student Reviews</h2>
            <div className="mb-8">
              <ReviewForm courseId={course.id} />
            </div>
            <ReviewList reviews={reviews} />
          </div>
        </div>
      </div>
    </div>
  );
}
