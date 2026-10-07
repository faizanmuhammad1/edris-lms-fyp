"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminLessonType } from "@/app/data/admin/admin-get-lesson";
import { BadgeTone, StatusBadge } from "@/app/admin/_components/StatusBadge";
import { Uploader } from "@/components/file-uploader/Uploader";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { lessonSchema, LessonSchemaType } from "@/lib/zodSchemas";
import { updateLesson } from "../actions";

interface LessonFormProps {
  data: AdminLessonType;
  chapterId: string;
  courseId: string;
}

const transcriptStatus: Record<AdminLessonType["transcriptionStatus"], { tone: BadgeTone; label: string }> = {
  NOT_STARTED: { tone: "neutral", label: "Not started" },
  Pending: { tone: "info", label: "Queued" },
  QUEUED: { tone: "info", label: "Queued" },
  PROCESSING: { tone: "info", label: "Processing" },
  COMPLETED: { tone: "success", label: "Ready" },
  FAILED: { tone: "danger", label: "Failed" },
};

export function LessonForm({ chapterId, data, courseId }: LessonFormProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
    },
  });

  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(updateLesson(values, data.id));

      if (error) {
        toast.error("Couldn't reach the server. Check your connection and try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
        // Refresh server data so the saved keys passed to the uploaders are current
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onInvalid() {
    toast.error("Some fields need attention. Check the highlighted fields and try again.");
  }

  const transcript = transcriptStatus[data.transcriptionStatus] ?? transcriptStatus.NOT_STARTED;

  return (
    <Card className="gap-4 py-4 sm:gap-6 sm:py-6">
      <CardHeader className="px-4 sm:px-6">
        <h2 className="text-lg font-semibold leading-none">Lesson content</h2>
        <CardDescription>
          Edit the lesson name and description, and upload its thumbnail and video.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-6"
            aria-busy={pending}
            noValidate
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lesson name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Setting up your environment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel id="lesson-description-label">Description</FormLabel>
                  <FormControl>
                    <div role="group" aria-labelledby="lesson-description-label" className="min-w-0">
                      <RichTextEditor field={field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="thumbnailKey"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel id="lesson-thumbnail-label">Thumbnail image</FormLabel>
                    <FormControl>
                      <div role="group" aria-labelledby="lesson-thumbnail-label" className="w-full min-w-0">
                        <Uploader
                          fileTypeAccepted="image"
                          onChange={field.onChange}
                          value={field.value}
                          persistedKey={data.thumbnailKey ?? ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Optional. Used as the video&rsquo;s cover image.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoKey"
                render={({ field }) => (
                  <FormItem className="min-w-0">
                    <FormLabel id="lesson-video-label">Video</FormLabel>
                    <FormControl>
                      <div role="group" aria-labelledby="lesson-video-label" className="w-full min-w-0">
                        <Uploader
                          onChange={field.onChange}
                          value={field.value}
                          fileTypeAccepted="video"
                          persistedKey={data.videoKey ?? ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      A new video is processed and transcribed automatically after you save.
                    </FormDescription>
                    {data.videoKey && (
                      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Transcript:
                        <StatusBadge tone={transcript.tone}>{transcript.label}</StatusBadge>
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
              <Button
                type="submit"
                disabled={pending}
                aria-busy={pending}
                className="w-full sm:w-auto"
              >
                {pending ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                {pending ? "Saving..." : "Save lesson"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
