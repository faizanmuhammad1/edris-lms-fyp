import { cn } from "@/lib/utils";
import { Check, Play, BookOpen, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface iAppProps {
  lesson: {
    id: string;
    title: string;
    position: number;
    description: string | null;
    lessonType?: string | null;
    videoKey?: string | null;
  };
  slug: string;
  isActive?: boolean;
  completed: boolean;
  partiallyComplete?: boolean;
  /** Called when the lesson link is followed (e.g. to close the mobile outline drawer). */
  onNavigate?: () => void;
}

export function LessonItem({ lesson, slug, isActive, completed, partiallyComplete, onNavigate }: iAppProps) {
  const isReading =
    lesson.lessonType === "Reading" || (lesson.lessonType === "Mixed" && !lesson.videoKey);

  const status = completed
    ? "Completed"
    : partiallyComplete
      ? "Quiz or assignment pending"
      : isActive
        ? "Current lesson"
        : null;

  return (
    <Link
      href={`/dashboard/${slug}/${lesson.id}`}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "border-border/60 bg-card hover:bg-accent/60",
        completed && "border-green-300 bg-green-50 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/30 dark:hover:bg-green-950/50",
        partiallyComplete && "border-amber-300 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50",
        isActive && "border-primary ring-1 ring-primary/40",
        isActive && !completed && !partiallyComplete && "bg-primary/10 hover:bg-primary/15"
      )}
    >
      <span className="shrink-0" aria-hidden="true">
        {completed ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-green-700">
            <Check className="size-3 text-white" />
          </span>
        ) : partiallyComplete ? (
          <span className="flex size-5 items-center justify-center rounded-full bg-amber-600">
            <AlertTriangle className="size-3 text-white" />
          </span>
        ) : (
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full border-2 bg-background",
              isActive ? "border-primary" : "border-muted-foreground/60"
            )}
          >
            {isReading ? (
              <BookOpen className={cn("size-2.5", isActive ? "text-primary" : "text-muted-foreground")} />
            ) : (
              <Play
                className={cn("size-2.5 fill-current", isActive ? "text-primary" : "text-muted-foreground")}
              />
            )}
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block font-medium break-words",
            completed && "text-green-900 dark:text-green-100",
            partiallyComplete && "text-amber-900 dark:text-amber-100",
            isActive && !completed && !partiallyComplete && "text-primary"
          )}
        >
          {lesson.position}. {lesson.title}
        </span>
        <span className="block text-xs text-muted-foreground">
          {isReading ? "Reading" : "Video"}
          {status && <> · {status}</>}
        </span>
      </span>
    </Link>
  );
}
