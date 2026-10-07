import type { TeacherQuizAttemptItem } from "@/app/data/teacher/get-teacher-quiz-attempts";
import type { TeacherAssignmentSubmissionItem } from "@/app/data/teacher/get-teacher-assignment-submissions";
import type { QuizAttemptDetailData } from "@/components/quiz-attempt-detail/QuizAttemptDetail";

export type QuizAttempt = TeacherQuizAttemptItem;
export type Submission = TeacherAssignmentSubmissionItem;

export type ProgressTab = "students" | "quizzes" | "assignments";
export const PROGRESS_TABS: ProgressTab[] = ["students", "quizzes", "assignments"];

/** Integrity events for an attempt (same counting as the attempt detail view, incl. print/screenshot log entries). */
export function getTotalViolations(a: QuizAttempt): number {
  const logged = a.violationLog.filter((v) => v.type === "printscreen" || v.type === "print").length;
  return (
    a.tabSwitchCount +
    a.backButtonCount +
    a.windowBlurCount +
    a.visibilityChangeCount +
    a.copyAttemptCount +
    a.pasteAttemptCount +
    a.rightClickCount +
    a.devToolsAttemptCount +
    logged
  );
}

export type Severity = "clean" | "low" | "medium" | "high";

export function getSeverity(total: number): Severity {
  if (total === 0) return "clean";
  if (total <= 2) return "low";
  if (total <= 5) return "medium";
  return "high";
}

/** Seconds as m:ss (or h:mm:ss for long attempts). */
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** When the attempt finished (or started, if it was never submitted). */
export function attemptDate(a: QuizAttempt): Date {
  return new Date(a.submittedAt ?? a.startedAt);
}

export function toDetailData(a: QuizAttempt): QuizAttemptDetailData {
  return {
    student: { name: a.student.name, email: a.student.email, image: a.student.image },
    course: { title: a.course.title },
    lesson: { title: a.lesson.title },
    quiz: {
      title: a.quiz.title,
      passingScore: a.quiz.passingScore,
      questions: a.quiz.questions.map((q) => ({
        id: q.id,
        question: q.question,
        points: q.points,
        position: q.position,
        options: q.options,
      })),
    },
    score: a.score,
    timeSpent: a.timeSpent,
    startedAt: a.startedAt,
    submittedAt: a.submittedAt,
    passed: a.passed,
    tabSwitchCount: a.tabSwitchCount,
    backButtonCount: a.backButtonCount,
    windowBlurCount: a.windowBlurCount,
    visibilityChangeCount: a.visibilityChangeCount,
    copyAttemptCount: a.copyAttemptCount,
    pasteAttemptCount: a.pasteAttemptCount,
    rightClickCount: a.rightClickCount,
    devToolsAttemptCount: a.devToolsAttemptCount,
    violationLog: a.violationLog,
    answers: a.answers.map((ans) => ({
      questionId: ans.questionId,
      optionId: ans.optionId,
      isCorrect: ans.isCorrect,
    })),
  };
}

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  image: string | null;
  courses: string[];
  attempts: QuizAttempt[];
  submissions: Submission[];
  /** Average quiz score (0-100), or null without attempts. */
  averageScore: number | null;
  passedCount: number;
  flaggedCount: number;
  needsGrading: number;
  /** ISO string of the most recent attempt or submission. */
  lastActivity: string;
}

/** Groups attempts and submissions per student. */
export function summarizeStudents(attempts: QuizAttempt[], submissions: Submission[]): StudentSummary[] {
  const map = new Map<string, StudentSummary & { courseSet: Set<string>; last: number }>();

  const ensure = (s: QuizAttempt["student"]) => {
    let entry = map.get(s.id);
    if (!entry) {
      entry = {
        id: s.id,
        name: s.name || "Student",
        email: s.email,
        image: s.image,
        courses: [],
        courseSet: new Set(),
        attempts: [],
        submissions: [],
        averageScore: null,
        passedCount: 0,
        flaggedCount: 0,
        needsGrading: 0,
        lastActivity: "",
        last: 0,
      };
      map.set(s.id, entry);
    }
    return entry;
  };

  for (const a of attempts) {
    const entry = ensure(a.student);
    entry.attempts.push(a);
    entry.courseSet.add(a.course.title);
    if (a.passed) entry.passedCount += 1;
    if (getTotalViolations(a) > 0) entry.flaggedCount += 1;
    entry.last = Math.max(entry.last, attemptDate(a).getTime());
  }

  for (const s of submissions) {
    const entry = ensure(s.student);
    entry.submissions.push(s);
    entry.courseSet.add(s.course.title);
    if (s.status === "Submitted") entry.needsGrading += 1;
    entry.last = Math.max(entry.last, new Date(s.submittedAt).getTime());
  }

  return [...map.values()]
    .map(({ courseSet, last, ...entry }) => ({
      ...entry,
      courses: [...courseSet].sort((a, b) => a.localeCompare(b)),
      averageScore:
        entry.attempts.length > 0
          ? Math.round(entry.attempts.reduce((sum, a) => sum + a.score, 0) / entry.attempts.length)
          : null,
      lastActivity: new Date(last).toISOString(),
    }))
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}
