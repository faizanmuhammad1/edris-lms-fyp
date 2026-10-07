"use client";

import { FormEvent, useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tryCatch } from "@/hooks/try-catch";
import { cn } from "@/lib/utils";
import { deleteCourse } from "../actions";

const CONFIRM_WORD = "DELETE";

export function DeleteCourseForm({
  courseId,
  courseTitle,
}: {
  courseId: string;
  courseTitle: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();

  const confirmed = confirmation.trim().toUpperCase() === CONFIRM_WORD;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || pending) return;

    setServerError(null);
    startTransition(async () => {
      const { data: result, error } = await tryCatch(deleteCourse(courseId));

      if (error) {
        const message = "Couldn't reach the server. Check your connection and try again.";
        setServerError(message);
        toast.error(message);
        return;
      }

      if (result.status === "success") {
        toast.success(`"${courseTitle}" was deleted`);
        router.replace("/admin/courses");
      } else {
        setServerError(result.message);
        toast.error(result.message);
      }
    });
  }

  return (
    <Card className="gap-4 border-destructive/40 py-4 sm:gap-6 sm:py-6">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-lg font-semibold leading-none">Confirm deletion</h2>
        <CardDescription>This can&rsquo;t be undone.</CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <form onSubmit={onSubmit} className="space-y-4" aria-busy={pending} noValidate>
          <div className="grid gap-2">
            <Label htmlFor={inputId}>
              Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
            </Label>
            <Input
              id={inputId}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={pending}
              aria-describedby={serverError ? `${hintId} ${errorId}` : hintId}
              aria-invalid={!!serverError}
            />
            <p id={hintId} className="text-sm text-muted-foreground">
              The delete button is enabled once the text matches.
            </p>
            {serverError && (
              <p id={errorId} role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/courses/${courseId}/edit`}
              className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
              aria-disabled={pending}
              tabIndex={pending ? -1 : undefined}
              onClick={(event) => pending && event.preventDefault()}
            >
              Cancel
            </Link>
            <Button
              type="submit"
              variant="destructive"
              disabled={!confirmed || pending}
              aria-busy={pending}
              className="w-full sm:w-auto"
            >
              {pending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {pending ? "Deleting course..." : "Delete course permanently"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
