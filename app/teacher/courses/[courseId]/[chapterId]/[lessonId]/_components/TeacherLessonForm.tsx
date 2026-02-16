"use client";

import { TeacherLessonType } from "@/app/data/teacher/get-teacher-lesson";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { lessonSchema, lessonTypes, LessonSchemaType } from "@/lib/zodSchemas";
import { ArrowLeft, Trash, Loader2, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { useTransition, useState, useRef } from "react";
import { tryCatch } from "@/hooks/try-catch";
import { updateTeacherLesson, createLessonAttachment, deleteLessonAttachment } from "../actions";
import { VideoPlayer } from "@/components/dashboard/VideoPlayer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

function AddAttachmentButton({
  lessonId,
  onSuccess,
  onError,
  uploading,
  setUploading,
}: {
  lessonId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/s3/upload-direct", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }
      const { key } = await res.json();
      const result = await createLessonAttachment(lessonId, {
        fileKey: key,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });
      if (result.status === "success") {
        onSuccess();
      } else {
        onError(result.message);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to add attachment");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <div>
      <input
        type="file"
        accept=".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip"
        className="hidden"
        ref={inputRef}
        onChange={handleFile}
        disabled={uploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
        Add attachment
      </Button>
    </div>
  );
}

interface iAppProps {
  data: TeacherLessonType;
  chapterId: string;
  courseId: string;
}

export function TeacherLessonForm({ chapterId, data, courseId }: iAppProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const form = useForm<LessonSchemaType>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: data.title,
      chapterId: chapterId,
      courseId: courseId,
      description: data.description ?? undefined,
      lessonType: data.lessonType ?? "Video",
      videoKey: data.videoKey ?? undefined,
      thumbnailKey: data.thumbnailKey ?? undefined,
      pdfKey: data.pdfKey ?? undefined,
      pdfFileName: data.pdfFileName ?? undefined,
    },
  });
  const lessonType = form.watch("lessonType");

  // 2. Define a submit handler.
  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateTeacherLesson(values, data.id)
      );

      if (error) {
        toast.error("An unexpected error occurred. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }
  return (
    <div>
      <Link
        className={buttonVariants({ variant: "outline", className: "mb-6" })}
        href={`/teacher/courses/${courseId}/edit`}
      >
        <ArrowLeft className="size-4" />

        <span>Go Back</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Lesson Configuration</CardTitle>
          <CardDescription>
            Configure the video, PDF, resources, and description for this lesson.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Lesson title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lessonType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value ?? "Video"}
                        onValueChange={field.onChange}
                        className="flex flex-wrap gap-4"
                      >
                        {lessonTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <RadioGroupItem value={type} id={`lesson-type-${type}`} />
                            <Label htmlFor={`lesson-type-${type}`} className="font-normal cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor field={field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(lessonType === "Video" || lessonType === "Mixed") && (
                <>
                  <FormField
                    control={form.control}
                    name="thumbnailKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thumbnail image</FormLabel>
                        <FormControl>
                          <Uploader
                            fileTypeAccepted="image"
                            onChange={field.onChange}
                            value={field.value}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="videoKey"
                    render={({ field }) => {
                      const isMuxOptimized =
                        data.muxStatus === "ready" && field.value === data.videoKey;

                      return (
                        <FormItem>
                          <FormLabel>Video File</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {field.value ? (
                                <div className="rounded-md overflow-hidden border relative">
                                  <VideoPlayer
                                    lessonId={data.id}
                                    videoKey={field.value}
                                    thumbnailKey={data.thumbnailKey ?? ""}
                                    muxPlaybackId={
                                      isMuxOptimized ? data.muxPlaybackId : null
                                    }
                                    trackProgress={false}
                                  />
                                  {!isMuxOptimized && (
                                    <div className="p-2 bg-yellow-500/10 text-xs text-yellow-600 dark:text-yellow-400 text-center flex items-center justify-center gap-2">
                                      <Loader2 className="size-3 animate-spin" />
                                      Video is processing for optimized playback
                                    </div>
                                  )}

                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 z-10"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                      setIsDeleting(true);
                                      try {
                                        await fetch("/api/s3/delete", {
                                          method: "DELETE",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            key: field.value,
                                          }),
                                        });
                                        field.onChange("");
                                        toast.success("Video removed");
                                      } catch {
                                        toast.error("Failed to remove video");
                                      } finally {
                                        setIsDeleting(false);
                                      }
                                    }}
                                  >
                                    {isDeleting ? (
                                      "Removing..."
                                    ) : (
                                      <>
                                        <Trash className="size-4 mr-2" />
                                        Remove Video
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <Uploader
                                  onChange={field.onChange}
                                  value={field.value}
                                  fileTypeAccepted="video"
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="pdfKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson PDF (optional)</FormLabel>
                    <FormControl>
                      <Uploader
                        fileTypeAccepted="document"
                        onChange={(key) => {
                          field.onChange(key);
                          if (!key) {
                            form.setValue("pdfFileName", undefined);
                          }
                        }}
                        value={field.value}
                        fileName={form.watch("pdfFileName")}
                        onUploadSuccess={(data) => {
                          form.setValue("pdfFileName", data.name);
                        }}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Handout, slides, or reading material. Max 50MB.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Resources / Attachments</FormLabel>
                <p className="text-xs text-muted-foreground">
                  Add files for students to download (PDF, DOC, ZIP). Max 50MB each.
                </p>
                <ul className="space-y-2">
                  {data.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        {att.fileName}
                        <span className="text-muted-foreground">
                          ({(att.fileSize / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          const { data: res } = await tryCatch(deleteLessonAttachment(att.id));
                          if (res?.status === "success") {
                            toast.success(res.message);
                            router.refresh();
                          } else {
                            toast.error(res?.message ?? "Failed to remove");
                          }
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <AddAttachmentButton
                  lessonId={data.id}
                  onSuccess={() => {
                    toast.success("Attachment added");
                    router.refresh();
                  }}
                  onError={(msg) => toast.error(msg)}
                  uploading={attachmentUploading}
                  setUploading={setAttachmentUploading}
                />
              </div>

              <Button disabled={pending} type="submit">
                {pending ? "Saving.." : "Save Lesson"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end gap-2">
        <Link href={`/teacher/courses/${courseId}/${chapterId}/${data.id}/assignment`}>
          <Button variant="secondary" className="gap-2">
            Assignment
          </Button>
        </Link>
        <Link href={`/teacher/courses/${courseId}/${chapterId}/${data.id}/quiz`}>
          <Button variant="secondary" className="gap-2">
            Manage Quiz
          </Button>
        </Link>
      </div>
    </div>
  );
}

