"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getLessonsToTranscribe } from "../../_actions/transcribe-course";
import { transcribeLesson } from "../../_actions/transcribe-lesson";

interface TranscribeCourseButtonProps {
    courseId: string;
    hasUntranscribedLessons: boolean;
}

export function TranscribeCourseButton({ courseId, hasUntranscribedLessons }: TranscribeCourseButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    if (!hasUntranscribedLessons) {
        return (
            <Button
                disabled
                variant="outline"
                size="sm"
                className="gap-2 text-green-600 border-green-200 bg-green-50"
            >
                <Check className="h-4 w-4" />
                Transcribed
            </Button>
        );
    }

    async function handleTranscribe() {
        setIsLoading(true);
        const toastId = toast.loading("Preparing transcription...");
        try {
            const pending = await getLessonsToTranscribe(courseId);
            if (!pending.success) {
                toast.error(pending.error, { id: toastId });
                return;
            }
            if (pending.lessons.length === 0) {
                toast.success("All lessons are already transcribed.", { id: toastId });
                return;
            }

            // One request per lesson keeps each transcription within a single function's time limit.
            let completed = 0;
            const failures: string[] = [];
            for (const [index, lesson] of pending.lessons.entries()) {
                toast.loading(
                    `Transcribing ${index + 1} of ${pending.lessons.length}: ${lesson.title}`,
                    { id: toastId }
                );
                const result = await transcribeLesson(lesson.id, courseId);
                if (result.success) {
                    completed++;
                } else {
                    failures.push(`${lesson.title}: ${result.error}`);
                }
            }

            if (failures.length === 0) {
                toast.success(`Transcribed ${completed} lesson${completed === 1 ? "" : "s"}.`, { id: toastId });
            } else {
                toast.warning(`Transcribed ${completed}, ${failures.length} failed.`, {
                    id: toastId,
                    description: failures.slice(0, 3).join("\n"),
                });
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to transcribe the course.", { id: toastId });
        } finally {
            setIsLoading(false);
            router.refresh();
        }
    }

    return (
        <Button
            onClick={handleTranscribe}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Sparkles className="h-4 w-4 text-purple-500" />
            )}
            {isLoading ? "Transcribing..." : "Transcribe Course"}
        </Button>
    );
}
