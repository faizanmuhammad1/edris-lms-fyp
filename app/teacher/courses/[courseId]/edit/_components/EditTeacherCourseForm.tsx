"use client";

import { TeacherCourseSingularType } from "@/app/data/teacher/get-teacher-course";
import {
  CourseFormActions,
  CourseFormFields,
  isSlugError,
  useUnsavedChangesWarning,
} from "@/components/dashboard/forms/course-form-fields";
import { Form } from "@/components/ui/form";
import { tryCatch } from "@/hooks/try-catch";
import { courseSchema, CourseSchemaType } from "@/lib/zodSchemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { editTeacherCourse } from "../actions";

interface EditTeacherCourseFormProps {
  data: TeacherCourseSingularType;
}

export function EditTeacherCourseForm({ data }: EditTeacherCourseFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // The thumbnail saved in the database; the uploader must never delete it from storage.
  const [savedFileKey, setSavedFileKey] = useState(data.fileKey);

  const form = useForm<CourseSchemaType>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: data.title,
      description: data.description,
      fileKey: data.fileKey,
      price: data.price,
      duration: data.duration,
      level: data.level,
      category: data.category as CourseSchemaType["category"],
      status: data.status,
      slug: data.slug,
      smallDescription: data.smallDescription,
    },
  });

  const { isDirty } = form.formState;
  useUnsavedChangesWarning(isDirty && !pending);

  function onSubmit(values: CourseSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(editTeacherCourse(values, data.id));

      if (error || !result) {
        toast.error("We couldn't save your changes. Please try again.");
        return;
      }

      if (result.status === "error") {
        if (isSlugError(result.message)) {
          form.setError("slug", { message: result.message }, { shouldFocus: true });
        }
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      // Keep the teacher here; the saved values become the new baseline for "unsaved changes".
      form.reset(values);
      setSavedFileKey(values.fileKey);
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form
        className="space-y-8"
        noValidate
        onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields."))}
      >
        <CourseFormFields form={form} persistedFileKey={savedFileKey} />
        <CourseFormActions
          cancelHref="/teacher/courses"
          isDirty={isDirty}
          pending={pending}
          submitDisabled={!isDirty}
          submitLabel="Save changes"
          pendingLabel="Saving…"
          submitIcon={<Save aria-hidden="true" />}
        />
      </form>
    </Form>
  );
}
