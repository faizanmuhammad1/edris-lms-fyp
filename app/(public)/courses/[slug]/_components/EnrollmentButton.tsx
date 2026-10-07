"use client";

import { Button } from "@/components/ui/button";
import { tryCatch } from "@/hooks/try-catch";
import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { enrollInCourseAction } from "../actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function EnrollmentButton({ courseId }: { courseId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function onSubmit() {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        enrollInCourseAction(courseId)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        const needsLogin = /log ?in/i.test(result.message);
        toast.error(result.message, needsLogin
          ? {
              action: {
                label: "Sign in",
                onClick: () => router.push(`/login?callbackURL=${encodeURIComponent(pathname)}`),
              },
            }
          : undefined);
      }
    });
  }

  return (
    <Button onClick={onSubmit} disabled={pending} size="lg" className="h-12 w-full text-base">
      {pending ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          Redirecting to checkout…
        </>
      ) : (
        "Enroll now"
      )}
    </Button>
  );
}
