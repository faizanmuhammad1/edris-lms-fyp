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
import { chapterSchema, ChapterSchemaType } from "@/lib/zodSchemas";
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
import { createTeacherChapter } from "../actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function TeacherNewChapterModal({
  courseId,
  triggerClassName,
}: {
  courseId: string;
  triggerClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const form = useForm<ChapterSchemaType>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      name: "",
      courseId: courseId,
    },
  });

  function onSubmit(values: ChapterSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(createTeacherChapter(values));

      if (error || !result) {
        const message = "We couldn't create the chapter. Please try again.";
        form.setError("root", { message });
        toast.error(message);
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset();
        setIsOpen(false);
      } else {
        form.setError("root", { message: result.message });
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(open: boolean) {
    // Keep the dialog open while the chapter is being saved
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
        <Button type="button" className={cn("h-10 gap-2 sm:h-9", triggerClassName)}>
          <Plus className="size-4" aria-hidden="true" />
          New chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new chapter</DialogTitle>
          <DialogDescription>
            Chapters group related lessons. It is added to the end of the course; you can
            drag it to a new position afterwards.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chapter name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Getting started"
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
                {pending && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
                {pending ? "Creating..." : "Create chapter"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
