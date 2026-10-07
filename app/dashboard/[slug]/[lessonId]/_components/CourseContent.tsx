"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { tryCatch } from "@/hooks/try-catch";
import { CheckCircle, Lock, Loader2, AlertTriangle } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useTransition, type ReactNode } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CommentWithReplies } from "@/app/actions/comments";
import { LessonChatbot } from "@/components/dashboard/LessonChatbot";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/dashboard/VideoPlayer";
import { LessonAttachmentsList } from "./LessonAttachmentsList";
import { LiveLessonSummary } from "@/components/dashboard/LiveLessonSummary";

// Secondary lesson features are code-split so the video and lesson text load first.
const SectionSkeleton = ({ className = "h-40" }: { className?: string }) => (
  <Skeleton className={`w-full rounded-xl ${className}`} />
);
const QuizReport = dynamic(() => import("./QuizReport").then((m) => m.QuizReport), {
  loading: () => <SectionSkeleton className="h-56" />,
});
const LessonPdfViewer = dynamic(() => import("./LessonPdfViewer").then((m) => m.LessonPdfViewer), {
  loading: () => <SectionSkeleton className="h-28" />,
});
const LessonAssignmentCard = dynamic(
  () => import("./LessonAssignmentCard").then((m) => m.LessonAssignmentCard),
  { loading: () => <SectionSkeleton className="h-64" /> }
);
const CommentSection = dynamic(
  () => import("@/components/general/CommentSection").then((m) => m.CommentSection),
  { loading: () => <SectionSkeleton className="h-48" /> }
);

/** Celebration effect, loaded only when it fires (skipped for reduced-motion users). */
async function fireConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    const count = 200;
    const fire = (particleRatio: number, opts: Record<string, unknown>) =>
      confetti({ origin: { y: 0.7 }, ...opts, particleCount: Math.floor(count * particleRatio) });
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  } catch {
    // Purely decorative.
  }
}

interface iAppProps {
  data: LessonContentType;
  comments: CommentWithReplies[];
  /** Lesson notes, rendered on the server. */
  description?: ReactNode;
  /** Assignment instructions, rendered on the server. */
  assignmentDescription?: ReactNode;
}

export function CourseContent({ data, comments, description, assignmentDescription }: iAppProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const videoTimestampRef = useRef(0);
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const quizWatchCleanupRef = useRef<(() => void) | null>(null);

  const courseSlug = data.Chapter.Course.slug;

  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    videoTimestampRef.current = currentTime;
  }, []);

  const getVideoTimestamp = useCallback(() => videoTimestampRef.current, []);

  const handleSeekVideo = useCallback((seconds: number) => {
    videoPlayerRef.current?.seekTo(seconds);
  }, []);

  // Stop watching a quiz window when leaving the lesson.
  useEffect(() => () => quizWatchCleanupRef.current?.(), []);

  const lessonType = data.lessonType ?? "Video";
  const showVideo =
    (lessonType === "Video" || lessonType === "Mixed") && (data.videoKey ?? data.muxPlaybackId);
  const isReading = lessonType === "Reading";

  const lessonMarkedComplete = data.lessonProgress.length > 0 && !!data.lessonProgress[0]?.completed;

  const hasQuiz = !!data.quiz;
  const quizPassed =
    !hasQuiz ||
    data.quiz!.attempts.some(
      (a) => a.isCompleted && typeof a.score === "number" && a.score >= data.quiz!.passingScore
    );

  const hasAssignment = !!data.assignment;
  const assignmentSubmitted = !hasAssignment || (data.assignment!.submissions?.length ?? 0) > 0;

  const fullyComplete = lessonMarkedComplete && quizPassed && assignmentSubmitted;

  const pendingItems: string[] = [];
  if (lessonMarkedComplete && hasQuiz && !quizPassed) pendingItems.push("Pass the quiz");
  if (lessonMarkedComplete && hasAssignment && !assignmentSubmitted) pendingItems.push("Submit the assignment");

  function onSubmit() {
    if (pending) return;
    startTransition(async () => {
      const { data: result, error } = await tryCatch(markLessonComplete(data.id, courseSlug));

      if (error) {
        toast.error("We couldn't save your progress. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(hasQuiz ? "Lesson completed. The quiz is now unlocked." : "Lesson marked as complete");
        void fireConfetti();
        router.refresh();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  function startQuiz() {
    if (!data.quiz) return;
    const quizUrl = `/dashboard/${courseSlug}/${data.id}/quiz`;
    const quizWindow = window.open(
      quizUrl,
      "quiz-window",
      "fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=no"
    );

    // Popup blocked (common on phones and in in-app browsers): open the quiz in this tab.
    if (!quizWindow) {
      router.push(quizUrl);
      return;
    }

    try {
      quizWindow.moveTo(0, 0);
      quizWindow.resizeTo(screen.width, screen.height);
    } catch {
      // Ignore if blocked
    }

    quizWatchCleanupRef.current?.();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "quizCompleted" || event.data?.type === "quizCancelled") {
        router.refresh();
        cleanup();
      }
    };
    const pollInterval = window.setInterval(() => {
      if (quizWindow.closed) {
        router.refresh();
        cleanup();
      }
    }, 1000);
    function cleanup() {
      window.removeEventListener("message", handleMessage);
      window.clearInterval(pollInterval);
      quizWatchCleanupRef.current = null;
    }
    window.addEventListener("message", handleMessage);
    quizWatchCleanupRef.current = cleanup;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-6 pb-28 sm:px-6 md:pt-8 lg:px-8">
      {/* Title & primary action */}
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground break-words">{data.Chapter.title}</p>
          <h1 className="text-2xl font-bold tracking-tight break-words text-foreground md:text-3xl">{data.title}</h1>
          {isReading && !lessonMarkedComplete && (
            <p className="text-sm text-muted-foreground">
              Reading lesson: when you&apos;ve finished, mark it as complete.
            </p>
          )}
        </div>
        <div className="shrink-0" aria-live="polite">
          {fullyComplete ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-400">
              <CheckCircle className="size-4" aria-hidden="true" />
              Lesson completed
            </p>
          ) : lessonMarkedComplete && pendingItems.length > 0 ? (
            <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              <span>To finish: {pendingItems.join(" & ")}</span>
            </p>
          ) : (
            <Button onClick={onSubmit} disabled={pending} aria-busy={pending} size="lg" className="w-full sm:w-auto">
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <CheckCircle aria-hidden="true" />
              )}
              {pending ? "Saving…" : "Mark as complete"}
            </Button>
          )}
        </div>
      </header>

      {showVideo && (
        <VideoPlayer
          ref={videoPlayerRef}
          lessonId={data.id}
          videoKey={data.videoKey ?? ""}
          thumbnailKey={data.thumbnailKey ?? ""}
          startTime={data.lessonProgress[0]?.lastWatchedPosition ?? 0}
          muxPlaybackId={data.muxStatus === "ready" ? data.muxPlaybackId : null}
          muxStatus={data.muxStatus ?? undefined}
          // Finishing the video marks the lesson complete (once).
          onComplete={lessonMarkedComplete ? undefined : onSubmit}
          onCurrentTimeUpdate={handleVideoTimeUpdate}
        />
      )}

      {data.videoSummary && <LiveLessonSummary key={data.videoSummary} summary={data.videoSummary} />}

      {description && (
        <section aria-label="Lesson notes" className="max-w-none break-words">
          {description}
        </section>
      )}

      {data.pdfKey && <LessonPdfViewer lessonId={data.id} fileKey={data.pdfKey} fileName={data.pdfFileName} />}

      {data.attachments && data.attachments.length > 0 && (
        <LessonAttachmentsList lessonId={data.id} attachments={data.attachments} />
      )}

      {data.assignment && (
        <LessonAssignmentCard
          // Remount when a submission appears so the card picks up fresh server data.
          key={data.assignment.submissions[0]?.id ?? "no-submission"}
          assignment={data.assignment}
          description={assignmentDescription}
          slug={courseSlug}
          lessonId={data.id}
        />
      )}

      {data.quiz && (
        <section aria-labelledby="knowledge-check-heading" className="space-y-4">
          <h2 id="knowledge-check-heading" className="text-xl font-semibold tracking-tight">
            Knowledge check
          </h2>

          {lessonMarkedComplete ? (
            <Card>
              <CardContent>
                <QuizReport
                  quiz={{
                    id: data.quiz.id,
                    title: data.quiz.title,
                    description: data.quiz.description,
                    timeLimit: data.quiz.timeLimit,
                    passingScore: data.quiz.passingScore,
                    questionCount: data.quiz.questions.length,
                  }}
                  attempts={data.quiz.attempts.map((attempt) => ({
                    id: attempt.id,
                    score: attempt.score,
                    timeSpent: attempt.timeSpent,
                    startedAt: attempt.startedAt,
                    submittedAt: attempt.submittedAt,
                    isCompleted: attempt.isCompleted,
                    tabSwitchCount: attempt.tabSwitchCount,
                    backButtonCount: attempt.backButtonCount,
                    windowBlurCount: attempt.windowBlurCount,
                    visibilityChangeCount: attempt.visibilityChangeCount,
                    copyAttemptCount: attempt.copyAttemptCount,
                    pasteAttemptCount: attempt.pasteAttemptCount,
                    rightClickCount: attempt.rightClickCount,
                    devToolsAttemptCount: attempt.devToolsAttemptCount,
                  }))}
                  onStartQuiz={startQuiz}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed bg-muted/20 shadow-none">
              <CardHeader className="items-center text-center">
                <div className="mx-auto mb-2 w-fit rounded-full bg-muted p-3">
                  <Lock className="size-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <CardTitle>
                  <h3 className="text-lg font-semibold">Quiz locked</h3>
                </CardTitle>
                <CardDescription>Mark this lesson as complete to unlock the quiz.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      )}

      <Separator />

      <CommentSection lessonId={data.id} comments={comments} />

      <LessonChatbot
        lessonId={data.id}
        getVideoTimestamp={getVideoTimestamp}
        hasTranscript={data.transcriptionStatus === "COMPLETED"}
        onSeekVideo={handleSeekVideo}
      />
    </div>
  );
}
