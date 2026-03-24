import { buttonVariants } from "@/components/ui/button";
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
}

export function LessonItem({ lesson, slug, isActive, completed, partiallyComplete }: iAppProps) {
  return (
    <Link
      href={`/dashboard/${slug}/${lesson.id}`}
      className={buttonVariants({
        variant: completed ? "secondary" : "outline",
        className: cn(
          "w-full p-2.5 h-auto justify-start transition-all border-border/60 shadow-sm",
          !completed && !partiallyComplete && !isActive && "bg-card hover:bg-accent/50",
          completed &&
          "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-800 dark:text-green-200",
          partiallyComplete &&
          "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-200",
          isActive &&
          !completed &&
          !partiallyComplete &&
          "bg-primary/10 dark:bg-primary/20 border-primary/50 hover:bg-primary/20 dark:hover:bg-primary/30 text-primary"
        ),
      })}
    >
      <div className="flex items-center gap-2.5 w-full min-w-0">
        <div className="shrink-0">
          {completed ? (
            <div className="size-5 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center">
              <Check className="size-3 text-white" />
            </div>
          ) : partiallyComplete ? (
            <div className="size-5 rounded-full bg-amber-500 dark:bg-amber-400 flex items-center justify-center">
              <AlertTriangle className="size-3 text-white" />
            </div>
          ) : (
            <div
              className={cn(
                "size-5 rounded-full border-2 bg-background flex justify-center items-center",
                isActive
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-muted-foreground/60"
              )}
            >
              {lesson.lessonType === "Reading" || (lesson.lessonType === "Mixed" && !lesson.videoKey) ? (
                <BookOpen
                  className={cn(
                    "size-2.5",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              ) : (
                <Play
                  className={cn(
                    "size-2.5 fill-current",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p
            className={cn(
              "text-xs font-medium truncate",
              completed
                ? "text-green-800 dark:text-green-200"
                : partiallyComplete
                  ? "text-amber-800 dark:text-amber-200"
                  : isActive
                    ? "text-primary font-semibold"
                    : "text-foreground"
            )}
          >
            {lesson.position}. {lesson.title}
          </p>
          {completed && (
            <p className="text-[10px] text-green-700 dark:text-green-300 font-medium">
              Completed
            </p>
          )}

          {partiallyComplete && (
            <p className="text-[10px] text-amber-600 dark:text-amber-300 font-medium">
              Quiz / Assignment pending
            </p>
          )}

          {isActive && !completed && !partiallyComplete && (
            <p className="text-[10px] text-primary font-medium">
              Currently Watching
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
