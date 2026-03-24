"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { CheckCircle, Lock, Loader2, AlertTriangle } from "lucide-react";
import { useCallback, useRef, useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { QuizReport } from "./QuizReport";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CommentWithReplies } from "@/app/actions/comments";
import { CommentSection } from "@/components/general/CommentSection";
import { LessonChatbot } from "@/components/dashboard/LessonChatbot";
import {
  VideoPlayer,
  type VideoPlayerHandle,
} from "@/components/dashboard/VideoPlayer";
import { LessonPdfViewer } from "./LessonPdfViewer";
import { LessonAttachmentsList } from "./LessonAttachmentsList";
import { LessonAssignmentCard } from "./LessonAssignmentCard";
import { LiveLessonSummary } from "@/components/dashboard/LiveLessonSummary";

interface iAppProps {
  data: LessonContentType;
  comments: CommentWithReplies[];
}

export function CourseContent({ data, comments }: iAppProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();
  const videoTimestampRef = useRef(0);
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);

  const handleVideoTimeUpdate = useCallback((currentTime: number) => {
    videoTimestampRef.current = currentTime;
  }, []);

  const getVideoTimestamp = useCallback(() => videoTimestampRef.current, []);

  const handleSeekVideo = useCallback((seconds: number) => {
    videoPlayerRef.current?.seekTo(seconds);
  }, []);

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        markLessonComplete(data.id, data.Chapter.Course.slug)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        triggerConfetti();
        // Refresh the page to show the quiz
        router.refresh();
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }
  const lessonType = data.lessonType ?? "Video";
  const showVideo =
    (lessonType === "Video" || lessonType === "Mixed") &&
    (data.videoKey ?? data.muxPlaybackId);
  const isReading = lessonType === "Reading";

  const lessonMarkedComplete =
    data.lessonProgress.length > 0 && data.lessonProgress[0]?.completed;

  const hasQuiz = !!data.quiz;
  const quizPassed =
    !hasQuiz ||
    data.quiz!.attempts.some(
      (a) =>
        a.isCompleted &&
        typeof a.score === "number" &&
        a.score >= data.quiz!.passingScore
    );

  const hasAssignment = !!data.assignment;
  const assignmentSubmitted =
    !hasAssignment || (data.assignment!.submissions?.length ?? 0) > 0;

  const fullyComplete = lessonMarkedComplete && quizPassed && assignmentSubmitted;

  const pendingItems: string[] = [];
  if (lessonMarkedComplete && hasQuiz && !quizPassed)
    pendingItems.push("Pass the quiz");
  if (lessonMarkedComplete && hasAssignment && !assignmentSubmitted)
    pendingItems.push("Submit the assignment");

  return (
    <div className="flex flex-col h-full bg-background/50 min-h-screen">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 space-y-8">

        {/* Title & Action Bar - always first */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/50">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {data.title}
            </h1>
            {isReading && !lessonMarkedComplete && (
              <p className="text-sm text-muted-foreground">Reading lesson — when you&apos;ve finished, mark as complete.</p>
            )}
          </div>
          <div className="flex-shrink-0">
            {fullyComplete ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-medium text-sm">
                <CheckCircle className="size-4" />
                <span>Lesson Completed</span>
              </div>
            ) : lessonMarkedComplete && pendingItems.length > 0 ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium text-sm">
                <AlertTriangle className="size-4" />
                <span>{pendingItems.join(" & ")}</span>
              </div>
            ) : (
              <Button onClick={onSubmit} disabled={pending} size="lg" className="w-full sm:w-auto shadow-sm">
                {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle className="size-4 mr-2" />}
                Mark as Complete
              </Button>
            )}
          </div>
        </div>

        {/* Video Section - only for Video/Mixed with video */}
        {showVideo && (
          <div className="space-y-4">
            <VideoPlayer
              ref={videoPlayerRef}
              lessonId={data.id}
              videoKey={data.videoKey ?? ""}
              thumbnailKey={data.thumbnailKey ?? ""}
              startTime={data.lessonProgress[0]?.lastWatchedPosition ?? 0}
              muxPlaybackId={data.muxStatus === "ready" ? data.muxPlaybackId : null}
              muxStatus={data.muxStatus ?? undefined}
              onComplete={onSubmit}
              onCurrentTimeUpdate={handleVideoTimeUpdate}
            />
          </div>
        )}

        {/* Video Summary */}
        {data.videoSummary && <LiveLessonSummary key={data.videoSummary} summary={data.videoSummary} />}

        {/* Description Section */}
        {data.description && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <RenderDescription json={JSON.parse(data.description)} />
          </div>
        )}

        {/* Lesson PDF */}
        {data.pdfKey && (
          <LessonPdfViewer
            lessonId={data.id}
            fileKey={data.pdfKey}
            fileName={data.pdfFileName}
          />
        )}

        {/* Attachments */}
        {data.attachments && data.attachments.length > 0 && (
          <LessonAttachmentsList lessonId={data.id} attachments={data.attachments} />
        )}

        {/* Assignment */}
        {data.assignment && (
          <LessonAssignmentCard
            assignment={data.assignment}
            slug={data.Chapter.Course.slug}
            lessonId={data.id}
          />
        )}

        {/* Quiz Section */}
        {data.quiz && (
          <div className="pt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">Q</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Knowledge Check</h2>
            </div>

            {data.lessonProgress.length > 0 && data.lessonProgress[0]?.completed ? (
              <Card className="border-border/60 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">Quiz Results & History</CardTitle>
                  <CardDescription>Review your past attempts and scores.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <QuizReport
                    quiz={{
                      id: data.quiz.id,
                      title: data.quiz.title,
                      description: data.quiz.description,
                      timeLimit: data.quiz.timeLimit,
                      passingScore: data.quiz.passingScore,
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
                    onStartQuiz={() => {
                      const quizUrl = `/dashboard/${data.Chapter.Course.slug}/${data.id}/quiz`;
                      const quizWindow = window.open(
                        quizUrl,
                        "quiz-window",
                        "fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=no"
                      );

                      try {
                        quizWindow?.moveTo(0, 0);
                        quizWindow?.resizeTo(screen.width, screen.height);
                      } catch {
                        // Ignore if blocked
                      }

                      const handleMessage = (event: MessageEvent) => {
                        if (event.data.type === "quizCompleted" || event.data.type === "quizCancelled") {
                          router.refresh();
                          window.removeEventListener("message", handleMessage);
                        }
                      };
                      window.addEventListener("message", handleMessage);

                      const pollInterval = setInterval(() => {
                        if (quizWindow?.closed) {
                          clearInterval(pollInterval);
                          router.refresh();
                        }
                      }, 1000);
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/5 shadow-none">
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto bg-muted p-3 rounded-full w-fit mb-2">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-lg">Quiz Locked</CardTitle>
                  <CardDescription>
                    Complete the lesson above to unlock this quiz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <Button variant="secondary" disabled className="opacity-50">
                    <Lock className="size-4 mr-2" /> Start Quiz
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Separator className="my-8" />

        {/* Comments Section */}
        <div className="space-y-6">

          <CommentSection lessonId={data.id} comments={comments} />
        </div>
      </div>
      <LessonChatbot
        lessonId={data.id}
        getVideoTimestamp={getVideoTimestamp}
        hasTranscript={data.transcriptionStatus === "COMPLETED"}
        onSeekVideo={handleSeekVideo}
      />
    </div>
  );
}
