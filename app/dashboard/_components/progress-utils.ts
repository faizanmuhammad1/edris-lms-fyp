/**
 * Pure (server- and client-safe) course progress helpers.
 * Mirrors the rules in hooks/use-course-progress: a lesson counts as complete when it is
 * marked complete, its published quiz (if any) is passed, and its assignment (if any) is submitted.
 */

interface ProgressLesson {
  id: string;
  lessonProgress: { lessonId: string; completed: boolean }[];
  quiz?: {
    passingScore: number;
    isPublished: boolean;
    attempts: { score: number | null }[];
  } | null;
  assignment?: { submissions: { id: string }[] } | null;
}

interface ProgressCourse<L extends ProgressLesson = ProgressLesson> {
  chapter: { lessons: L[] }[];
}

export function isLessonComplete(lesson: ProgressLesson): boolean {
  const marked = lesson.lessonProgress.some(
    (progress) => progress.lessonId === lesson.id && progress.completed
  );
  const quiz = lesson.quiz;
  const quizPassed =
    !quiz ||
    !quiz.isPublished ||
    quiz.attempts.some(
      (attempt) => typeof attempt.score === "number" && attempt.score >= quiz.passingScore
    );
  const assignmentSubmitted = !lesson.assignment || lesson.assignment.submissions.length > 0;
  return marked && quizPassed && assignmentSubmitted;
}

export function getCourseProgress(course: ProgressCourse) {
  let totalLessons = 0;
  let completedLessons = 0;
  for (const chapter of course.chapter) {
    for (const lesson of chapter.lessons) {
      totalLessons += 1;
      if (isLessonComplete(lesson)) completedLessons += 1;
    }
  }
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return { totalLessons, completedLessons, percentage };
}

/** The first lesson that still needs work, or the first lesson when everything is done. */
export function getNextLesson<L extends ProgressLesson>(course: ProgressCourse<L>): L | null {
  const lessons = course.chapter.flatMap((chapter) => chapter.lessons);
  return lessons.find((lesson) => !isLessonComplete(lesson)) ?? lessons[0] ?? null;
}

/** Human-readable status shown next to progress bars (never rely on color alone). */
export function progressLabel(percentage: number): string {
  if (percentage >= 100) return "Completed";
  if (percentage > 0) return "In progress";
  return "Not started";
}
