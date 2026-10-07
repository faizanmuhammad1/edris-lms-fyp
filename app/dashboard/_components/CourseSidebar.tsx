"use client";

import { CourseSidebarDataType } from "@/app/data/course/get-course-sidebar-data";
import { Button } from "@/components/ui/button";
import { CollapsibleContent, Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Award, ChevronDown, Play } from "lucide-react";
import { LessonItem } from "./LessonItem";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useCourseProgress, isLessonFullyComplete } from "@/hooks/use-course-progress";

interface iAppProps {
  course: CourseSidebarDataType["course"];
  /** Called after a lesson or link is followed (closes the mobile drawer). */
  onNavigate?: () => void;
}

export function CourseSidebar({ course, onNavigate }: iAppProps) {
  const pathname = usePathname();
  const currentLessonId = pathname.split("/").pop();

  const { completedLessons, totalLessons, progressPercentage } = useCourseProgress({ courseData: course });
  const allDone = totalLessons > 0 && completedLessons === totalLessons;

  // Expand the chapter containing the current lesson (or the first chapter on the overview page).
  const activeChapterId =
    course.chapter.find((chapter) => chapter.lessons.some((lesson) => lesson.id === currentLessonId))?.id ??
    course.chapter[0]?.id;

  return (
    <div className="flex flex-col">
      <div className="border-b border-border pb-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10" aria-hidden="true">
            <Play className="size-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Not a heading: the page's h1 is the lesson or course title. */}
            <Link
              href={`/dashboard/${course.slug}`}
              onClick={onNavigate}
              className="line-clamp-2 py-0.5 text-base leading-tight font-semibold break-words hover:text-primary hover:underline"
              title={course.title}
            >
              {course.title}
            </Link>
            <p className="mt-1 truncate text-xs text-muted-foreground">{course.category}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {completedLessons}/{totalLessons} lessons
            </span>
          </div>
          <Progress value={progressPercentage} className="h-1.5" aria-label="Course progress" />
          <p className="text-xs text-muted-foreground">{progressPercentage}% complete</p>
          {allDone ? (
            <Button asChild className="mt-2 w-full" size="lg">
              <Link href={`/dashboard/certificate/${course.slug}`} onClick={onNavigate}>
                <Award aria-hidden="true" />
                View certificate
              </Link>
            </Button>
          ) : (
            totalLessons > 0 && (
              <p className="mt-1 text-xs leading-snug text-muted-foreground">
                Complete all lessons to unlock your certificate.
              </p>
            )
          )}
        </div>
      </div>

      <div className="space-y-3 py-4">
        {course.chapter.map((chapter) => {
          const chapterDone = chapter.lessons.filter((lesson) => isLessonFullyComplete(lesson)).length;
          return (
            <Collapsible key={chapter.id} defaultOpen={chapter.id === activeChapterId}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="group/chapter h-auto min-h-11 w-full justify-start gap-2 bg-card p-3 whitespace-normal shadow-none hover:scale-100 hover:bg-accent/50"
                >
                  <ChevronDown
                    className="size-4 shrink-0 text-primary transition-transform group-data-[state=closed]/chapter:-rotate-90"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-sm font-semibold break-words text-foreground">
                      {chapter.position}: {chapter.title}
                    </span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {chapterDone}/{chapter.lessons.length} lessons completed
                    </span>
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="mt-3 space-y-2 border-l-2 pl-3">
                  {chapter.lessons.map((lesson) => {
                    const fullyDone = isLessonFullyComplete(lesson);
                    const markedComplete = lesson.lessonProgress.some(
                      (p) => p.lessonId === lesson.id && p.completed
                    );
                    return (
                      <li key={lesson.id}>
                        <LessonItem
                          lesson={lesson}
                          slug={course.slug}
                          isActive={currentLessonId === lesson.id}
                          completed={fullyDone}
                          partiallyComplete={markedComplete && !fullyDone}
                          onNavigate={onNavigate}
                        />
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        {course.chapter.length === 0 && (
          <p className="text-sm text-muted-foreground">This course doesn&apos;t have any lessons yet.</p>
        )}
      </div>
    </div>
  );
}
