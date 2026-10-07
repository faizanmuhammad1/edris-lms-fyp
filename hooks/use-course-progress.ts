"use client";

import { CourseSidebarDataType } from "@/app/data/course/get-course-sidebar-data";
import { useMemo } from "react";

interface iAppProps {
  courseData: CourseSidebarDataType["course"];
}

interface CourseProgressResult {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
}

export function isLessonFullyComplete(lesson: iAppProps["courseData"]["chapter"][number]["lessons"][number]) {
  const lessonMarkedComplete = lesson.lessonProgress.some(
    (progress) => progress.lessonId === lesson.id && progress.completed
  );

  const requiresQuiz = !!lesson.quiz && lesson.quiz.isPublished;
  const quizPassed =
    !requiresQuiz ||
    lesson.quiz!.attempts.some(
      (attempt) =>
        typeof attempt.score === "number" &&
        attempt.score >= lesson.quiz!.passingScore
    );

  const requiresAssignment = !!lesson.assignment;
  const assignmentSubmitted =
    !requiresAssignment || lesson.assignment!.submissions.length > 0;

  return lessonMarkedComplete && quizPassed && assignmentSubmitted;
}

export function useCourseProgress({
  courseData,
}: iAppProps): CourseProgressResult {
  return useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;

    courseData.chapter.forEach((chapter) => {
      chapter.lessons.forEach((lesson) => {
        totalLessons++;

        if (isLessonFullyComplete(lesson)) {
          completedLessons++;
        }
      });
    });

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;

    return {
      totalLessons,
      completedLessons,
      progressPercentage,
    };
  }, [courseData]);
}
