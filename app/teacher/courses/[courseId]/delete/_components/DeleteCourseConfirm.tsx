"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteTeacherCourse } from "../actions";

/** The delete page is itself the confirmation step, so this button deletes directly. */
export function DeleteCourseConfirm({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onDelete() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(deleteTeacherCourse(courseId));

      if (error || !result) {
        toast.error("We couldn't delete this course. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        router.replace("/teacher/courses");
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Link
        className={buttonVariants({ variant: "outline", className: "h-10 hover:scale-100" })}
        href={`/teacher/courses/${courseId}/edit`}
        aria-disabled={pending}
        tabIndex={pending ? -1 : undefined}
      >
        Keep course
      </Link>
      <Button variant="destructive" className="h-10 hover:scale-100" onClick={onDelete} disabled={pending} aria-busy={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        {pending ? "Deleting…" : "Delete course permanently"}
      </Button>
    </div>
  );
}
