"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { tryCatch } from "@/hooks/try-catch";
import { getLessonsToTranscribe } from "../../_actions/transcribe-course";
import { transcribeLesson } from "../../_actions/transcribe-lesson";

interface TranscribeCourseButtonProps {
    courseId: string;
    hasUntranscribedLessons: boolean;
    /** False when no lesson has a video; nothing is rendered then. */
    hasVideoLessons?: boolean;
}

type Phase = "idle" | "preparing" | "running";

interface RunProgress {
    current: number;
    total: number;
    title: string;
}

export function TranscribeCourseButton({
    courseId,
    hasUntranscribedLessons,
    hasVideoLessons = true,
}: TranscribeCourseButtonProps) {
    const router = useRouter();
    const [phase, setPhase] = useState<Phase>("idle");
    const [progress, setProgress] = useState<RunProgress | null>(null);
    const [status, setStatus] = useState("");
    const [stopRequested, setStopRequested] = useState(false);
    const stopRef = useRef(false);

    const busy = phase !== "idle";

    if (!hasVideoLessons && !busy && !status) {
        return null;
    }

    async function handleTranscribe() {
        stopRef.current = false;
        setStopRequested(false);
        setPhase("preparing");
        setProgress(null);
        setStatus("Preparing transcription...");
        const toastId = toast.loading("Preparing transcription...");

        try {
            const { data: pending, error } = await tryCatch(getLessonsToTranscribe(courseId));
            if (error || !pending) {
                const message = "We couldn't start transcription. Please try again.";
                setStatus(message);
                toast.error(message, { id: toastId });
                return;
            }
            if (!pending.success) {
                setStatus(pending.error);
                toast.error(pending.error, { id: toastId });
                return;
            }
            if (pending.lessons.length === 0) {
                const message = "All lesson videos are already transcribed.";
                setStatus(message);
                toast.success(message, { id: toastId });
                return;
            }

            setPhase("running");
            const total = pending.lessons.length;

            // One request per lesson keeps each transcription within a single function's time limit.
            let completed = 0;
            let attempted = 0;
            const failures: string[] = [];
            for (const [index, lesson] of pending.lessons.entries()) {
                if (stopRef.current) break;
                const message = `Transcribing lesson ${index + 1} of ${total}: ${lesson.title}`;
                setProgress({ current: index + 1, total, title: lesson.title });
                setStatus(message);
                toast.loading(message, { id: toastId });

                const { data: result } = await tryCatch(transcribeLesson(lesson.id, courseId));
                attempted++;
                if (result?.success) {
                    completed++;
                } else {
                    failures.push(
                        `${lesson.title}: ${result && !result.success ? result.error : "Transcription failed. Please try again."}`
                    );
                }
            }

            const stoppedEarly = attempted < total;
            const lessonWord = (n: number) => `lesson${n === 1 ? "" : "s"}`;

            if (failures.length === 0 && !stoppedEarly) {
                const message = `Transcribed ${completed} ${lessonWord(completed)}.`;
                setStatus(message);
                toast.success(message, { id: toastId });
            } else if (failures.length === 0) {
                const message = `Stopped. Transcribed ${completed} of ${total} ${lessonWord(total)}.`;
                setStatus(message);
                toast.info(message, { id: toastId });
            } else {
                const message = `Transcribed ${completed} of ${total} ${lessonWord(total)}; ${failures.length} failed. Use Retry on a lesson to try again.`;
                setStatus(message);
                toast.warning(message, {
                    id: toastId,
                    description: failures.slice(0, 3).join("\n"),
                });
            }
        } finally {
            setPhase("idle");
            setProgress(null);
            setStopRequested(false);
            router.refresh();
        }
    }

    function handleStop() {
        stopRef.current = true;
        setStopRequested(true);
        setStatus("Stopping after the current lesson...");
    }

    const percent = progress ? Math.round(((progress.current - 1) / progress.total) * 100) : 0;

    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
                {!hasUntranscribedLessons && !busy ? (
                    <Badge
                        variant="outline"
                        className="h-10 gap-1.5 px-3 text-sm text-emerald-700 sm:h-9 dark:text-emerald-400"
                    >
                        <CheckCircle2 aria-hidden="true" className="size-4" />
                        All videos transcribed
                    </Badge>
                ) : (
                    <Button
                        type="button"
                        onClick={handleTranscribe}
                        disabled={busy}
                        aria-busy={busy}
                        variant="outline"
                        className="h-10 gap-2 sm:h-9"
                    >
                        {busy ? (
                            <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                        ) : (
                            <Sparkles className="size-4 text-primary" aria-hidden="true" />
                        )}
                        {phase === "preparing"
                            ? "Preparing..."
                            : phase === "running" && progress
                                ? `Transcribing ${progress.current} of ${progress.total}...`
                                : "Transcribe videos"}
                    </Button>
                )}
                {phase === "running" && (
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-10 sm:h-9"
                        onClick={handleStop}
                        disabled={stopRequested}
                    >
                        {stopRequested ? "Stopping..." : "Stop"}
                    </Button>
                )}
            </div>

            {phase === "running" && progress && (
                <Progress
                    value={percent}
                    className="h-1.5 w-full sm:w-64"
                    aria-label="Course transcription progress"
                />
            )}

            <p
                role="status"
                aria-live="polite"
                className={cn(
                    "max-w-xs break-words text-xs text-muted-foreground sm:max-w-sm",
                    !status && "sr-only"
                )}
            >
                {status}
            </p>
        </div>
    );
}
