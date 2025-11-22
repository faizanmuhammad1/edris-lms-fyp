"use client";

import { LessonContentType } from "@/app/data/course/get-lesson-content";
import { RenderDescription } from "@/components/rich-text-editor/RenderDescription";
import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useConstructUrl } from "@/hooks/use-construct-url";
import { BookIcon, CheckCircle, Lock } from "lucide-react";
import { useTransition } from "react";
import { markLessonComplete } from "../actions";
import { toast } from "sonner";
import { useConfetti } from "@/hooks/use-confetti";
import { QuizReport } from "./QuizReport";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

interface iAppProps {
  data: LessonContentType;
}

export function CourseContent({ data }: iAppProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { triggerConfetti } = useConfetti();

  function VideoPlayer({
    thumbnailKey,
    videoKey,
  }: {
    thumbnailKey: string;
    videoKey: string;
  }) {
    const videoUrl = useConstructUrl(videoKey);
    const thumbnailUrl = useConstructUrl(thumbnailKey);

    if (!videoKey) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center">
          <BookIcon className="size-16 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            This lesson does not have a video yet
          </p>
        </div>
      );
    }

    return (
      <div className="aspect-video bg-black rounded-lg relative overflow-hidden">
        <video
          className="w-full h-full object-cover"
          controls
          poster={thumbnailUrl}
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

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
    <div className="flex flex-col h-full bg-background pl-6">
      <VideoPlayer
        thumbnailKey={data.thumbnailKey ?? ""}
        videoKey={data.videoKey ?? ""}
      />

      <div className="py-4 border-b">
        {data.lessonProgress.length > 0 ? (
          <Button
            variant="outline"
            className="bg-green-500/10 text-green-500 hover:text-green-600"
          >
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Completed
          </Button>
        ) : (
          <Button variant="outline" onClick={onSubmit} disabled={pending}>
            <CheckCircle className="size-4 mr-2 text-green-500" />
            Mark as Complete
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {data.title}
        </h1>

        {data.description && (
          <RenderDescription json={JSON.parse(data.description)} />
        )}
      </div>

      {data.quiz && (
        <>
          <Separator className="my-8" />
          {data.lessonProgress.length > 0 && data.lessonProgress[0]?.completed ? (
            <div className="pb-6">
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
                  
                  // Try to maximize window if fullscreen not available
                  try {
                    quizWindow?.moveTo(0, 0);
                    quizWindow?.resizeTo(screen.width, screen.height);
                  } catch (e) {
                    // Ignore if browser blocks window manipulation
                  }
                  
                  // Listen for quiz completion/cancellation message
                  const handleMessage = (event: MessageEvent) => {
                    if (event.data.type === "quizCompleted" || event.data.type === "quizCancelled") {
                      router.refresh();
                      window.removeEventListener("message", handleMessage);
                    }
                  };
                  window.addEventListener("message", handleMessage);
                  
                  // Also poll for window closure as fallback
                  const pollInterval = setInterval(() => {
                    if (quizWindow?.closed) {
                      clearInterval(pollInterval);
                      router.refresh();
                    }
                  }, 1000);
                }}
              />
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  Quiz Locked
                </CardTitle>
                <CardDescription>
                  Complete this lesson to unlock the quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Watch the video and mark the lesson as complete to take the quiz and test your knowledge.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
