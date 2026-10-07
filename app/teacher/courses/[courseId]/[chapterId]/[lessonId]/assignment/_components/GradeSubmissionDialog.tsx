"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gradeSubmission } from "../actions";
import { tryCatch } from "@/hooks/try-catch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface GradeSubmissionDialogProps {
  submissionId: string;
  onClose: () => void;
  maxScore: number | null;
  initialScore?: number | null;
  initialFeedback?: string | null;
}

export function GradeSubmissionDialog({
  submissionId,
  onClose,
  maxScore,
  initialScore,
  initialFeedback,
}: GradeSubmissionDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [prevSubmissionId, setPrevSubmissionId] = useState<string | null>(null);

  if (submissionId !== prevSubmissionId) {
    setPrevSubmissionId(submissionId);
    setScore(initialScore != null ? String(initialScore) : "");
    setFeedback(initialFeedback ?? "");
  }

  function handleSubmit() {
    startTransition(async () => {
      const numScore = score === "" ? undefined : Number(score);
      const { data: result, error } = await tryCatch(
        gradeSubmission(submissionId, {
          score: numScore,
          feedback: feedback || undefined,
        })
      );
      if (error) {
        toast.error("Something went wrong");
        return;
      }
      if (result?.status === "success") {
        toast.success(result.message);
        onClose();
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to grade");
      }
    });
  }

  return (
    <Dialog open={!!submissionId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Grade submission</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Score {maxScore != null ? `(out of ${maxScore})` : ""}</Label>
            <Input
              type="number"
              min={0}
              max={maxScore ?? undefined}
              placeholder="Optional"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>
          <div>
            <Label>Feedback (optional)</Label>
            <textarea
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Write feedback for the student..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Save grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
