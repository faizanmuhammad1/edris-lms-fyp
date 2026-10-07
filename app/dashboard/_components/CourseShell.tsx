"use client";

import { useState, type ReactNode } from "react";
import { ListTree } from "lucide-react";
import type { CourseSidebarDataType } from "@/app/data/course/get-course-sidebar-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { CourseSidebar } from "./CourseSidebar";

interface CourseShellProps {
  course: CourseSidebarDataType["course"];
  children: ReactNode;
}

/**
 * Course layout: a sticky outline column on large screens and a toggleable
 * drawer (with a compact progress bar) on phones and tablets.
 */
export function CourseShell({ course, children }: CourseShellProps) {
  const [outlineOpen, setOutlineOpen] = useState(false);
  const { completedLessons, totalLessons, progressPercentage } = useCourseProgress({ courseData: course });

  return (
    <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
      <aside aria-label="Course outline" className="hidden shrink-0 border-r border-border lg:block lg:w-80">
        <div className="sticky top-0 max-h-svh overflow-y-auto overscroll-contain p-4">
          <CourseSidebar course={course} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Phone / tablet outline toggle */}
        <div className="flex items-center gap-3 border-b px-4 py-2 sm:px-6 lg:hidden">
          <Sheet open={outlineOpen} onOpenChange={setOutlineOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="lg" className="shrink-0">
                <ListTree aria-hidden="true" />
                Course outline
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 p-0">
              <SheetHeader className="border-b pr-12">
                <SheetTitle>Course outline</SheetTitle>
                <SheetDescription className="sr-only">
                  Lessons in this course and your progress.
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                <CourseSidebar course={course} onNavigate={() => setOutlineOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium" title={course.title}>
              {course.title}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Progress value={progressPercentage} className="h-1.5" aria-label="Course progress" />
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {completedLessons}/{totalLessons}
              </span>
            </div>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
