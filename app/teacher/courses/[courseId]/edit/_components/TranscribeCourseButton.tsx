"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { transcribeCourse } from "../../_actions/transcribe-course";

interface TranscribeCourseButtonProps {
    courseId: string;
    hasUntranscribedLessons: boolean;
}

export function TranscribeCourseButton({ courseId, hasUntranscribedLessons }: TranscribeCourseButtonProps) {
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
        try {
            const result = await transcribeCourse(courseId);
            if (result.success) {
                if (result.failedCount && result.failedCount > 0) {
                    toast.warning(`Queued ${result.count} lessons. ${result.failedCount} failed to start.`);
                } else {
                    toast.success(`Queued ${result.count} lessons for transcription.`);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to start transcription.");
        } finally {
            setIsLoading(false);
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
            Transcribe Course
        </Button>
    );
}
