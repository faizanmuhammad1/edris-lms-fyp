"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { CheckCircle, Lock, Loader2 } from "lucide-react";
import { useTransition } from "react";
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
import { VideoPlayer } from "@/components/dashboard/VideoPlayer";

interface iAppProps {
  data: LessonContentType;
  comments: CommentWithReplies[];
}

export function CourseContent({ data, comments }: iAppProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

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
  return (
    <div className="flex flex-col h-full bg-background/50 min-h-screen">
      <div className="max-w-5xl mx-auto w-full px-4 md:px-6 py-6 md:py-8 space-y-8">

        {/* Video Section */}
        <div className="space-y-4">
          <VideoPlayer
            lessonId={data.id}
            videoKey={data.videoKey ?? ""}
            thumbnailKey={data.thumbnailKey ?? ""}
            startTime={data.lessonProgress[0]?.lastWatchedPosition ?? 0}
            muxPlaybackId={data.muxStatus === "ready" ? data.muxPlaybackId : null}
            onComplete={onSubmit}
          />

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/50">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {data.title}
              </h1>
            </div>

            <div className="flex-shrink-0">
              {data.lessonProgress.length > 0 ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-medium text-sm">
                  <CheckCircle className="size-4" />
                  <span>Lesson Completed</span>
                </div>
              ) : (
                <Button onClick={onSubmit} disabled={pending} size="lg" className="w-full sm:w-auto shadow-sm">
                  {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle className="size-4 mr-2" />}
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        {data.description && (
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <RenderDescription json={JSON.parse(data.description)} />
          </div>
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
                    Complete the video lesson above to unlock this quiz.
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
      <LessonChatbot />
    </div>
  );
}
