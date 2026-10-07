"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tryCatch } from "@/hooks/try-catch";
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { createLesson } from "../actions";

export function NewLessonModal({
  courseId,
  chapterId,
  chapterTitle,
}: {
  courseId: string;
  chapterId: string;
  chapterTitle: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
      chapterId: chapterId,
    },
  });

  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createLesson(values));

      if (error) {
        toast.error("Couldn't reach the server. Check your connection and try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message, {
          description: "Open the lesson to add its video and description.",
        });
        form.reset();
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    // Don't close mid-save; clear the form whenever the dialog closes
    if (pending) return;
    if (!open) form.reset();
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full border-dashed">
          <Plus aria-hidden="true" />
          New lesson
          <span className="sr-only"> in {chapterTitle}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create a lesson</DialogTitle>
          <DialogDescription className="break-words">
            Adds a lesson to the end of &ldquo;{chapterTitle}&rdquo;. You can upload its video
            afterwards.
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
                    <Input placeholder="e.g. Setting up your environment" autoComplete="off" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={pending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={pending} aria-busy={pending}>
                {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {pending ? "Creating..." : "Create lesson"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
