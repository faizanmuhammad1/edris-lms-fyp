"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { tryCatch } from "@/hooks/try-catch";
import { useConfetti } from "@/hooks/use-confetti";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CourseFormActions, CourseFormFields, isSlugError, useUnsavedChangesWarning } from "./course-form-fields";

interface CourseCreationFormProps {
  /** Server action; may return the new course id in `data` to continue to the course editor. */
  action: (values: CourseSchemaType) => Promise<ApiResponse<{ id: string }>>;
  /** Where Cancel goes (and where to go after creating when no id is returned). */
  backLink: string;
  /** Kept for API compatibility. */
  role?: string;
}

export function CourseCreationForm({ action, backLink }: CourseCreationFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { triggerConfetti } = useConfetti();

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      fileKey: "",
      price: undefined,
      duration: undefined,
      level: "Beginner",
      category: "Health & Fitness",
      status: "Draft",
      slug: "",
      smallDescription: "",
    },
  });

  const { isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty && !pending);

  function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(action(values));

      if (error || !result) {
        toast.error("We couldn't create the course. Please try again.");
        return;
      }

      if (result.status === "error") {
        if (isSlugError(result.message)) {
          form.setError("slug", { message: result.message }, { shouldFocus: true });
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message, {
        description: result.data?.id ? "Next, add chapters and lessons." : undefined,
      });
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) triggerConfetti();
      form.reset(values);
      router.push(result.data?.id ? `/teacher/courses/${result.data.id}/edit?tab=structure` : backLink);
    });
  }

  return (
    <Card className="py-0">
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form
            className="space-y-8"
            noValidate
            onSubmit={form.handleSubmit(onSubmit, () =>
              toast.error("Please fix the highlighted fields.")
            )}
          >
            <CourseFormFields form={form} autoSlug />
            <CourseFormActions
              cancelHref={backLink}
              isDirty={isDirty}
              pending={pending}
              submitLabel="Create course"
              pendingLabel="Creating…"
              submitIcon={<Plus aria-hidden="true" />}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
