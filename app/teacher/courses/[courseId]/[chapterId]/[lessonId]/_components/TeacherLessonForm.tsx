"use client";

import { TeacherLessonType } from "@/app/data/teacher/get-teacher-lesson";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { lessonSchema, lessonTypes, LessonSchemaType } from "@/lib/zodSchemas";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Copy,
  FileText,
  FileVideo,
  Info,
  Layers,
  ListChecks,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useForm, useWatch, type ControllerRenderProps } from "react-hook-form";
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
import { RichTextEditor } from "@/components/rich-text-editor/Editor";
import { Uploader } from "@/components/file-uploader/Uploader";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { useTransition, useState, useRef, useId, type ReactNode } from "react";
import { tryCatch } from "@/hooks/try-catch";
import {
  updateTeacherLesson,
  createLessonAttachment,
  deleteLessonAttachment,
  regenerateSummary,
  generateQuizFromTranscript,
  generateLessonFlashcardsPreview,
} from "../actions";
import { transcribeLesson } from "../../../_actions/transcribe-lesson";
import { VideoPlayer } from "@/components/dashboard/VideoPlayer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const ATTACHMENT_MAX_BYTES = 50 * 1024 * 1024;
const ATTACHMENT_ACCEPT =
  ".pdf,.doc,.docx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/zip";

type LessonTypeValue = (typeof lessonTypes)[number];
type FlashcardPreview = NonNullable<
  Awaited<ReturnType<typeof generateLessonFlashcardsPreview>>["data"]
>;

const LESSON_TYPE_OPTIONS: Record<
  LessonTypeValue,
  { title: string; description: string; icon: LucideIcon }
> = {
  Video: { title: "Video", description: "A video, with optional PDF and resources", icon: Play },
  Reading: { title: "Reading", description: "Text, a PDF or attachments; no video", icon: BookOpen },
  Mixed: { title: "Mixed", description: "A video plus reading material", icon: FileVideo },
};

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Card section with a real h2 heading (CardTitle is only a div). */
function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <Card aria-labelledby={headingId} role="region" className="gap-4 py-4 sm:gap-6 sm:py-6">
      <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0 space-y-1.5">
          <h2 id={headingId} className="font-semibold leading-none">
            {title}
          </h2>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </CardHeader>
      <CardContent className="px-4 sm:px-6">{children}</CardContent>
    </Card>
  );
}

function AddAttachmentButton({
  lessonId,
  onSuccess,
}: {
  lessonId: string;
  onSuccess: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingName, setUploadingName] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > ATTACHMENT_MAX_BYTES) {
      toast.error(`"${file.name}" is too large. Attachments can be up to 50 MB.`);
      return;
    }

    setUploadingName(file.name);
    try {
      // 1. Get Presigned URL
      const presignedRes = await fetch("/api/s3/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          isImage: file.type.startsWith("image/"),
        }),
      });

      if (!presignedRes.ok) {
        if (presignedRes.status === 429) {
          toast.error("Too many uploads in a short time. Please wait a minute and try again.");
        } else {
          const err = await presignedRes.json().catch(() => null);
          toast.error(
            presignedRes.status < 500 && typeof err?.error === "string" && err.error
              ? err.error
              : "We couldn't upload the attachment. Please try again."
          );
        }
        return;
      }

      const { presignedUrl, key } = await presignedRes.json();

      // 2. Upload directly to S3 via PUT
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadRes.ok) {
        toast.error("We couldn't upload the attachment. Please try again.");
        return;
      }

      const { data: result } = await tryCatch(
        createLessonAttachment(lessonId, {
          fileKey: key,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        })
      );
      if (result?.status === "success") {
        toast.success(`Added "${file.name}"`);
        onSuccess();
      } else {
        toast.error(result?.message ?? "We couldn't add the attachment. Please try again.");
      }
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setUploadingName(null);
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        ref={inputRef}
        onChange={handleFile}
        disabled={!!uploadingName}
      />
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full sm:h-9 sm:w-auto"
        disabled={!!uploadingName}
        aria-busy={!!uploadingName}
        onClick={() => inputRef.current?.click()}
      >
        {uploadingName ? (
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="size-4" aria-hidden="true" />
        )}
        {uploadingName ? "Uploading..." : "Add attachment"}
      </Button>
      <p role="status" aria-live="polite" className="break-words text-xs text-muted-foreground">
        {uploadingName ? `Uploading "${uploadingName}"...` : ""}
      </p>
    </div>
  );
}

function VideoStatusNote({
  isSavedVideo,
  muxStatus,
  isMuxOptimized,
}: {
  isSavedVideo: boolean;
  muxStatus: string | null;
  isMuxOptimized: boolean;
}) {
  let icon: LucideIcon = Info;
  let tone = "text-muted-foreground";
  let text: string;
  let spin = false;

  if (!isSavedVideo) {
    text = "New video selected. Save the lesson to process it for streaming and transcription.";
  } else if (muxStatus === "errored") {
    icon = AlertCircle;
    tone = "text-destructive";
    text = "Streaming optimization failed. Students still get the original file; try uploading the video again if playback is slow.";
  } else if (!isMuxOptimized) {
    icon = Loader2;
    spin = true;
    text = "Processing for optimized streaming. This can take a few minutes; you can keep editing.";
  } else {
    icon = CheckCircle2;
    tone = "text-emerald-700 dark:text-emerald-400";
    text = "Ready for streaming.";
  }

  const Icon = icon;
  return (
    <p role="status" className={cn("flex items-start gap-2 text-xs", tone)}>
      <Icon
        className={cn("mt-0.5 size-3.5 shrink-0", spin && "motion-safe:animate-spin")}
        aria-hidden="true"
      />
      <span>{text}</span>
    </p>
  );
}

const TRANSCRIPT_STATUS: Record<
  string,
  { label: string; icon: LucideIcon; className: string; spin?: boolean }
> = {
  COMPLETED: {
    label: "Transcript ready",
    icon: CheckCircle2,
    className: "border-emerald-600/30 text-emerald-700 dark:text-emerald-400",
  },
  PROCESSING: { label: "Transcribing", icon: Loader2, className: "text-primary", spin: true },
  QUEUED: { label: "Queued", icon: Loader2, className: "text-muted-foreground", spin: true },
  FAILED: {
    label: "Transcription failed",
    icon: AlertCircle,
    className: "border-destructive/40 text-destructive",
  },
};

interface iAppProps {
  data: TeacherLessonType;
  chapterId: string;
  courseId: string;
}

export function TeacherLessonForm({ chapterId, data, courseId }: iAppProps) {
  const router = useRouter();
  const lessonTypeLabelId = useId();
  const [pending, startTransition] = useTransition();
  const [summaryPending, startSummaryTransition] = useTransition();
  const [quizPending, startQuizTransition] = useTransition();
  const [flashcardsPending, startFlashcardsTransition] = useTransition();
  const [transcribePending, startTranscribeTransition] = useTransition();
  const [isRemovingVideo, setIsRemovingVideo] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<FlashcardPreview | null>(null);

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
  const lessonType = useWatch({ control: form.control, name: "lessonType" });
  const pdfFileName = useWatch({ control: form.control, name: "pdfFileName" });
  const isDirty = form.formState.isDirty;

  const quizPath = `/teacher/courses/${courseId}/${chapterId}/${data.id}/quiz`;
  const hasSavedVideo = !!data.videoKey;
  const transcriptReady = data.transcriptionStatus === "COMPLETED";
  const transcriptInProgress =
    data.transcriptionStatus === "PROCESSING" || data.transcriptionStatus === "QUEUED";
  const anyAiPending = summaryPending || quizPending || flashcardsPending || transcribePending;

  function onSubmit(values: LessonSchemaType) {
    startTransition(async () => {
      const { data: result, error } = await tryCatch(
        updateTeacherLesson(values, data.id)
      );

      if (error || !result) {
        toast.error("We couldn't save the lesson. Please try again.");
        return;
      }

      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
        // Refresh server data so the saved keys / Mux status reflect this save
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function onInvalid() {
    toast.error("Please fix the highlighted fields before saving.");
  }

  async function handleRemoveVideo(field: ControllerRenderProps<LessonSchemaType, "videoKey">) {
    setIsRemovingVideo(true);
    const removingSavedVideo = field.value === data.videoKey;
    try {
      // Only delete a video uploaded in this editing session.
      // The saved video is deleted by the save action once
      // the lesson is actually saved without it.
      if (!removingSavedVideo) {
        const res = await fetch("/api/s3/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: field.value,
          }),
        });
        if (!res.ok) {
          throw new Error("Failed to remove video");
        }
      }
      field.onChange("");
      toast.success(
        removingSavedVideo ? "Video removed. Save the lesson to apply." : "Video removed"
      );
    } catch {
      toast.error("We couldn't remove the video. Please try again.");
    } finally {
      setIsRemovingVideo(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    const { data: res } = await tryCatch(deleteLessonAttachment(attachmentId));
    if (res?.status === "success") {
      toast.success(res.message);
      router.refresh();
      return true;
    }
    toast.error(res?.message ?? "We couldn't remove the attachment. Please try again.");
    return false;
  }

  function onRegenerateSummary() {
    setAiError(null);
    startSummaryTransition(async () => {
      const { data: result } = await tryCatch(regenerateSummary(data.id));
      if (result?.status === "success") {
        toast.success(result.message);
        router.refresh();
      } else {
        const message =
          result?.message ?? "We couldn't generate a summary right now. Please try again.";
        setAiError(message);
        toast.error(message);
      }
    });
  }

  function onGenerateQuiz() {
    setAiError(null);
    startQuizTransition(async () => {
      const { data: result } = await tryCatch(generateQuizFromTranscript(data.id));
      if (result?.status === "success") {
        toast.success(result.message, {
          action: { label: "Open quiz", onClick: () => router.push(quizPath) },
        });
        router.refresh();
      } else {
        const message =
          result?.message ?? "We couldn't generate a quiz right now. Please try again.";
        setAiError(message);
        toast.error(message);
      }
    });
  }

  function onPreviewFlashcards() {
    setAiError(null);
    startFlashcardsTransition(async () => {
      const { data: result } = await tryCatch(generateLessonFlashcardsPreview(data.id));
      if (result?.status === "success" && result.data) {
        setFlashcards(result.data);
      } else {
        const message =
          result?.message ?? "We couldn't generate flashcards right now. Please try again.";
        setAiError(message);
        toast.error(message);
      }
    });
  }

  function onTranscribe() {
    setAiError(null);
    startTranscribeTransition(async () => {
      const { data: result } = await tryCatch(transcribeLesson(data.id, courseId));
      if (result?.success) {
        toast.success("Transcript ready. AI tools are now available.");
      } else {
        const message =
          result && !result.success ? result.error : "Transcription failed. Please try again.";
        setAiError(message);
        toast.error(message);
      }
      router.refresh();
    });
  }

  async function copyFlashcards() {
    if (!flashcards) return;
    const text = [
      "Key takeaways",
      ...flashcards.bulletSummary.map((point) => `- ${point}`),
      "",
      "Flashcards",
      ...flashcards.flashcards.map((card, i) => `${i + 1}. ${card.front}\n   ${card.back}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed. Select the text and copy it manually.");
    }
  }

  const transcriptStatus = TRANSCRIPT_STATUS[data.transcriptionStatus];
  const TranscriptIcon = transcriptStatus?.icon;
  const aiDisabledReason = !hasSavedVideo
    ? "Upload and save a video first. AI tools work from the video's transcript."
    : transcriptInProgress
      ? "The video is being transcribed. AI tools unlock when it finishes."
      : !transcriptReady
        ? "Transcribe the video to unlock AI tools."
        : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="min-w-0 space-y-6"
          noValidate
        >
          <Section title="Lesson details" description="The title, format and description students see.">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lesson name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Introduction to variables" {...field} />
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
                    <FormLabel id={lessonTypeLabelId}>Lesson type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value ?? "Video"}
                        onValueChange={field.onChange}
                        aria-labelledby={lessonTypeLabelId}
                        className="grid gap-3 sm:grid-cols-3"
                      >
                        {lessonTypes.map((type) => {
                          const option = LESSON_TYPE_OPTIONS[type];
                          const OptionIcon = option.icon;
                          const optionId = `lesson-type-${type}`;
                          return (
                            <label
                              key={type}
                              htmlFor={optionId}
                              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
                            >
                              <RadioGroupItem value={type} id={optionId} className="mt-0.5 shrink-0" />
                              <span className="min-w-0 space-y-0.5">
                                <span className="flex items-center gap-1.5 text-sm font-medium">
                                  <OptionIcon className="size-3.5" aria-hidden="true" />
                                  {option.title}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  {option.description}
                                </span>
                              </span>
                            </label>
                          );
                        })}
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
                    <FormDescription>
                      {lessonType === "Reading"
                        ? "Reading lessons need a description, a PDF or at least one attachment."
                        : "Optional notes shown to students with the lesson."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          {(lessonType === "Video" || lessonType === "Mixed") && (
            <Section
              title="Video"
              description="Videos are optimized for streaming after you save. MP4 or WebM files up to 25 MB are also transcribed automatically for the AI tools."
            >
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="videoKey"
                  render={({ field }) => {
                    const isSavedVideo = !!field.value && field.value === data.videoKey;
                    const isMuxOptimized = data.muxStatus === "ready" && isSavedVideo;

                    return (
                      <FormItem>
                        <FormLabel>Video file</FormLabel>
                        {field.value ? (
                          <div className="space-y-3">
                            <div className="overflow-hidden rounded-lg border">
                              <VideoPlayer
                                lessonId={data.id}
                                videoKey={field.value}
                                thumbnailKey={data.thumbnailKey ?? ""}
                                muxPlaybackId={isMuxOptimized ? data.muxPlaybackId : null}
                                trackProgress={false}
                              />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <VideoStatusNote
                                isSavedVideo={isSavedVideo}
                                muxStatus={data.muxStatus}
                                isMuxOptimized={isMuxOptimized}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="h-10 shrink-0 text-destructive hover:text-destructive sm:h-9"
                                disabled={isRemovingVideo}
                                aria-busy={isRemovingVideo}
                                onClick={() => handleRemoveVideo(field)}
                              >
                                {isRemovingVideo ? (
                                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                                ) : (
                                  <Trash2 className="size-4" aria-hidden="true" />
                                )}
                                {isRemovingVideo ? "Removing..." : "Remove video"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <FormControl>
                            <Uploader
                              onChange={field.onChange}
                              value={field.value}
                              fileTypeAccepted="video"
                              persistedKey={data.videoKey ?? ""}
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

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
                          persistedKey={data.thumbnailKey ?? ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Shown before the video plays and in the course outline. A 16:9 image works best.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Section>
          )}

          <Section
            title="Lesson PDF"
            description="Optional handout, slides or reading material students can open with the lesson."
          >
            <FormField
              control={form.control}
              name="pdfKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF or document</FormLabel>
                  <FormControl>
                    <Uploader
                      fileTypeAccepted="document"
                      onChange={(key) => {
                        field.onChange(key);
                        if (!key) {
                          form.setValue("pdfFileName", undefined, { shouldDirty: true });
                        }
                      }}
                      value={field.value}
                      persistedKey={data.pdfKey ?? ""}
                      fileName={pdfFileName}
                      onUploadSuccess={(uploaded) => {
                        form.setValue("pdfFileName", uploaded.name, { shouldDirty: true });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section
            title="Resources"
            description="Files students can download, such as worksheets or source code (PDF, DOC, DOCX or ZIP, up to 50 MB each). Changes here are saved immediately."
          >
            <div className="space-y-4">
              {data.attachments.length === 0 ? (
                <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  No attachments yet.
                </p>
              ) : (
                <ul className="space-y-2" aria-label="Attachments">
                  {data.attachments.map((att) => (
                    <li
                      key={att.id}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
                    >
                      <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium" title={att.fileName}>
                          {att.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                      </div>
                      <ConfirmDialog
                        title="Remove this attachment?"
                        description={
                          <p className="break-words">
                            &quot;{att.fileName}&quot; is deleted permanently and students can no
                            longer download it. This can&apos;t be undone.
                          </p>
                        }
                        confirmLabel="Remove attachment"
                        destructive
                        onConfirm={() => handleDeleteAttachment(att.id)}
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-10 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive md:size-9"
                            aria-label={`Remove attachment ${att.fileName}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
              <AddAttachmentButton lessonId={data.id} onSuccess={() => router.refresh()} />
            </div>
          </Section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <p className="text-center text-xs text-muted-foreground sm:text-right" aria-live="polite">
              {isDirty ? "You have unsaved changes." : ""}
            </p>
            <Button
              disabled={pending}
              aria-busy={pending}
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
            >
              {pending && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
              {pending ? "Saving..." : "Save lesson"}
            </Button>
          </div>
        </form>
      </Form>

      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start" aria-label="Lesson tools">
        <Section
          title="AI tools"
          description="Generated from the lesson's video transcript."
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">Transcript</span>
              {transcriptStatus && TranscriptIcon ? (
                <Badge variant="outline" className={cn("font-normal", transcriptStatus.className)}>
                  <TranscriptIcon
                    aria-hidden="true"
                    className={cn(transcriptStatus.spin && "motion-safe:animate-spin")}
                  />
                  {transcriptStatus.label}
                </Badge>
              ) : (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  {hasSavedVideo ? "Not transcribed" : "No video"}
                </Badge>
              )}
            </div>

            {aiDisabledReason && (
              <p className="text-xs text-muted-foreground">{aiDisabledReason}</p>
            )}

            {hasSavedVideo && !transcriptReady && (
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-10 w-full justify-start whitespace-normal py-2 text-left sm:min-h-9"
                onClick={transcriptInProgress && !transcribePending ? () => router.refresh() : onTranscribe}
                disabled={transcribePending}
                aria-busy={transcribePending}
              >
                {transcribePending ? (
                  <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="size-4" aria-hidden="true" />
                )}
                {transcribePending
                  ? "Transcribing... this can take a minute"
                  : transcriptInProgress
                    ? "Refresh status"
                    : data.transcriptionStatus === "FAILED"
                      ? "Retry transcription"
                      : "Transcribe video"}
              </Button>
            )}

            <div className="space-y-3 border-t pt-4">
              <AiToolButton
                icon={Wand2}
                label="Regenerate summary"
                pendingLabel="Generating summary..."
                help="Rewrites the short summary students see on the lesson page."
                pending={summaryPending}
                disabled={!transcriptReady || anyAiPending}
                onClick={onRegenerateSummary}
              />

              {data.quiz ? (
                <div className="space-y-1">
                  <Link
                    href={quizPath}
                    className="inline-flex h-10 w-full items-center gap-2 rounded-md border px-3 text-sm font-medium outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:h-9"
                  >
                    <ListChecks className="size-4" aria-hidden="true" />
                    Open quiz editor
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    This lesson already has a {data.quiz.isPublished ? "published" : "draft"} quiz.
                  </p>
                </div>
              ) : (
                <AiToolButton
                  icon={ListChecks}
                  label="Generate draft quiz"
                  pendingLabel="Generating quiz..."
                  help="Creates an unpublished multiple-choice quiz you can review before publishing."
                  pending={quizPending}
                  disabled={!transcriptReady || anyAiPending}
                  onClick={onGenerateQuiz}
                />
              )}

              <AiToolButton
                icon={Layers}
                label="Preview flashcards"
                pendingLabel="Generating flashcards..."
                help="Shows flashcards and key takeaways to copy into your resources. Nothing is saved."
                pending={flashcardsPending}
                disabled={!transcriptReady || anyAiPending}
                onClick={onPreviewFlashcards}
              />
            </div>

            {aiError && (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="break-words">{aiError}</span>
              </p>
            )}
          </div>
        </Section>
      </aside>

      <Dialog open={!!flashcards} onOpenChange={(open) => !open && setFlashcards(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Flashcards preview</DialogTitle>
            <DialogDescription>
              Generated from the transcript of &quot;{data.title}&quot;. Nothing is saved; copy what you
              want to use.
            </DialogDescription>
          </DialogHeader>
          {flashcards && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Key takeaways</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {flashcards.bulletSummary.map((point, i) => (
                    <li key={i} className="break-words">
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">
                  Flashcards ({flashcards.flashcards.length})
                </h3>
                <ol className="grid gap-3 sm:grid-cols-2">
                  {flashcards.flashcards.map((card, i) => (
                    <li key={i} className="space-y-2 rounded-lg border p-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Front</p>
                        <p className="break-words font-medium">{card.front}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Back</p>
                        <p className="break-words">{card.back}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={copyFlashcards}>
              <Copy className="size-4" aria-hidden="true" />
              Copy as text
            </Button>
            <DialogClose asChild>
              <Button type="button">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AiToolButton({
  icon: Icon,
  label,
  pendingLabel,
  help,
  pending,
  disabled,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  pendingLabel: string;
  help: string;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const helpId = useId();
  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        className="h-auto min-h-10 w-full justify-start whitespace-normal py-2 text-left sm:min-h-9"
        onClick={onClick}
        disabled={disabled}
        aria-busy={pending}
        aria-describedby={helpId}
      >
        {pending ? (
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <Icon className="size-4" aria-hidden="true" />
        )}
        {pending ? pendingLabel : label}
      </Button>
      <p id={helpId} className="text-xs text-muted-foreground">
        {help}
      </p>
    </div>
  );
}
