"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { Plus, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tryCatch } from "@/hooks/try-catch";
import { createTeacherLesson } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TeacherNewLessonModal({
  courseId,
  chapterId,
  chapterTitle,
}: {
  courseId: string;
  chapterId: string;
  chapterTitle?: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
      chapterId: chapterId,
      description: "",
      lessonType: "Video",
      videoKey: "",
      thumbnailKey: "",
      pdfKey: "",
      pdfFileName: "",
    },
  });

  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createTeacherLesson(values));

      if (error || !result) {
        const message = "We couldn't create the lesson. Please try again.";
        form.setError("root", { message });
        toast.error(message);
        return;
      }

      if (result.status === "success") {
        const created = result.data;
        toast.success(result.message, {
          description: "Open the lesson to add its video, reading material and resources.",
          action: created
            ? {
                label: "Edit lesson",
                onClick: () =>
                  router.push(
                    `/teacher/courses/${created.courseId}/${created.chapterId}/${created.lessonId}`
                  ),
              }
            : undefined,
        });
        form.reset();
        setIsOpen(false);
      } else {
        form.setError("root", { message: result.message });
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    // Keep the dialog open while the lesson is being saved
    if (pending) return;
    if (!open) {
      form.reset();
    }
    setIsOpen(open);
  }

  const rootError = form.formState.errors.root?.message;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-center gap-2 border-dashed sm:h-9"
          aria-label={chapterTitle ? `New lesson in ${chapterTitle}` : undefined}
        >
          <Plus className="size-4" aria-hidden="true" />
          New lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new lesson</DialogTitle>
          <DialogDescription className="break-words">
            {chapterTitle
              ? `The lesson is added to the end of "${chapterTitle}". `
              : "The lesson is added to the end of this chapter. "}
            You can add its video, reading material and resources next.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Introduction to variables"
                      autoComplete="off"
                      {...field}
                      readOnly={pending}
                    />
                  </FormControl>
                  <FormDescription>At least 3 characters. Students see this title.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {rootError && (
              <p role="alert" className="text-sm text-destructive">
                {rootError}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button disabled={pending} type="submit" aria-busy={pending}>
                {pending && (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                )}
                {pending ? "Creating..." : "Create lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
