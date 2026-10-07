"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { TeacherCourseSingularType } from "@/app/data/teacher/get-teacher-course";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileVideo,
  GripVertical,
  Layers,
  Loader2,
  Play,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/general/EmptyState";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tryCatch } from "@/hooks/try-catch";
import { getPublicFileUrl } from "@/lib/file-url";
import type { ApiResponse } from "@/lib/types";
import { reorderTeacherChapters, reorderTeacherLessons } from "../actions";
import { TeacherNewChapterModal } from "./TeacherNewChapterModal";
import { TeacherNewLessonModal } from "./TeacherNewLessonModal";
import { TeacherDeleteLesson } from "./TeacherDeleteLesson";
import { TeacherDeleteChapter } from "./TeacherDeleteChapter";
import { TranscribeCourseButton } from "./TranscribeCourseButton";
import { transcribeLesson } from "../../_actions/transcribe-lesson";

interface iAppProps {
  data: TeacherCourseSingularType;
}

type CourseChapter = TeacherCourseSingularType["chapter"][number];
type CourseLesson = CourseChapter["lessons"][number];
type TranscriptionStatus = CourseLesson["transcriptionStatus"];

interface LessonItem {
  id: string;
  title: string;
  order: number;
  transcriptionStatus: TranscriptionStatus;
  thumbnailKey: string | null;
  lessonType: CourseLesson["lessonType"];
  hasVideo: boolean;
}

interface ChapterItem {
  id: string;
  title: string;
  order: number;
  lessons: LessonItem[];
}

function toChapterItems(data: TeacherCourseSingularType): ChapterItem[] {
  return data.chapter.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    order: chapter.position,
    lessons: chapter.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.position,
      transcriptionStatus: lesson.transcriptionStatus,
      thumbnailKey: lesson.thumbnailKey ?? null,
      lessonType: lesson.lessonType ?? "Video",
      hasVideo: !!lesson.videoKey,
    })),
  }));
}

/**
 * Pointer sensor for mouse and pen only. Touch is handled by TouchSensor (press and hold)
 * so a quick swipe on a handle never starts a drag by accident.
 */
class MouseAndPenSensor extends PointerSensor {
  static activators = PointerSensor.activators.map((activator) => ({
    ...activator,
    handler: (event: PointerEvent, options: Parameters<typeof activator.handler>[1]) =>
      event.nativeEvent.pointerType === "touch" ? false : activator.handler(event, options),
  }));
}

const screenReaderInstructions = {
  draggable:
    "To reorder, press Space or Enter to pick up the item. Use the up and down arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.",
};

function createAnnouncements(
  noun: "chapter" | "lesson",
  items: { id: string; title: string }[]
): Announcements {
  const total = items.length;
  const title = (id: UniqueIdentifier) => items.find((item) => item.id === id)?.title ?? noun;
  const position = (id: UniqueIdentifier) => items.findIndex((item) => item.id === id) + 1;

  return {
    onDragStart: ({ active }) =>
      `Picked up ${noun} ${title(active.id)}. It is in position ${position(active.id)} of ${total}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${title(active.id)} moved to position ${position(over.id)} of ${total}.`
        : `${title(active.id)} is no longer over a valid position.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${title(active.id)} dropped at position ${position(over.id)} of ${total}.`
        : `${title(active.id)} dropped. The order did not change.`,
    onDragCancel: ({ active }) =>
      `Reordering cancelled. ${title(active.id)} returned to position ${position(active.id)} of ${total}.`,
  };
}

interface HandleProps {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNode: (element: HTMLElement | null) => void;
}

function SortableRow({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: (handle: HandleProps) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(className, isDragging && "relative z-10 shadow-lg ring-2 ring-primary/40")}
    >
      {children({ attributes, listeners, setActivatorNode: setActivatorNodeRef })}
    </li>
  );
}

function DragHandle({
  label,
  handle: { attributes, listeners, setActivatorNode },
}: {
  label: string;
  handle: HandleProps;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-10 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing md:size-9"
      {...attributes}
      {...listeners}
      ref={setActivatorNode}
      aria-label={label}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </Button>
  );
}

const LESSON_TYPE: Record<LessonItem["lessonType"], { label: string; icon: LucideIcon }> = {
  Video: { label: "Video", icon: Play },
  Reading: { label: "Reading", icon: BookOpen },
  Mixed: { label: "Video + reading", icon: FileVideo },
};

const TRANSCRIPTION_BADGE: Partial<
  Record<TranscriptionStatus, { label: string; icon: LucideIcon; className: string; spin?: boolean }>
> = {
  QUEUED: { label: "Queued", icon: Clock, className: "text-muted-foreground" },
  PROCESSING: { label: "Transcribing", icon: Loader2, className: "text-primary", spin: true },
  COMPLETED: {
    label: "Transcribed",
    icon: CheckCircle2,
    className: "border-emerald-600/30 text-emerald-700 dark:text-emerald-400",
  },
  FAILED: {
    label: "Transcription failed",
    icon: AlertCircle,
    className: "border-destructive/40 text-destructive",
  },
};

function TranscriptionBadge({ status, hasVideo }: { status: TranscriptionStatus; hasVideo: boolean }) {
  const config =
    TRANSCRIPTION_BADGE[status] ??
    (hasVideo
      ? { label: "Not transcribed", icon: Clock, className: "text-muted-foreground", spin: false }
      : null);
  if (!config) return null;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("max-w-full whitespace-normal text-left font-normal", config.className)}>
      <Icon aria-hidden="true" className={cn(config.spin && "motion-safe:animate-spin")} />
      {config.label}
    </Badge>
  );
}

export function TeacherCourseStructure({ data }: iAppProps) {
  const router = useRouter();
  const courseId = data.id;
  const [chapters, setChapters] = useState<ChapterItem[]>(() => toChapterItems(data));
  const [syncedData, setSyncedData] = useState(data);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [retrying, setRetrying] = useState<Set<string>>(() => new Set());
  // Bumped on every reorder so a late failure only rolls back its own change
  const reorderVersion = useRef(0);

  // Server data wins after each refresh/revalidation (open/closed state is kept separately)
  if (data !== syncedData) {
    setSyncedData(data);
    setChapters(toChapterItems(data));
  }

  const sensors = useSensors(
    useSensor(MouseAndPenSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function commitReorder(
    next: ChapterItem[],
    save: () => Promise<ApiResponse>,
    fallbackError: string
  ) {
    const previous = chapters;
    const version = ++reorderVersion.current;
    setChapters(next); // optimistic

    const { data: result, error } = await tryCatch(save());
    if (!error && result?.status === "success") {
      toast.success(result.message);
      return;
    }

    if (reorderVersion.current === version) {
      setChapters(previous);
    } else {
      // A newer reorder is in flight; resync with the server instead of guessing
      router.refresh();
    }
    toast.error(result?.message ?? fallbackError);
  }

  function handleChapterDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((chapter) => chapter.id === active.id);
    const newIndex = chapters.findIndex((chapter) => chapter.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(chapters, oldIndex, newIndex).map((chapter, index) => ({
      ...chapter,
      order: index + 1,
    }));

    void commitReorder(
      next,
      () =>
        reorderTeacherChapters(
          courseId,
          next.map((chapter) => ({ id: chapter.id, position: chapter.order }))
        ),
      "We couldn't save the new chapter order. Please try again."
    );
  }

  function handleLessonDragEnd(chapterId: string, { active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const chapter = chapters.find((item) => item.id === chapterId);
    if (!chapter) return;

    const oldIndex = chapter.lessons.findIndex((lesson) => lesson.id === active.id);
    const newIndex = chapter.lessons.findIndex((lesson) => lesson.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const lessons = arrayMove(chapter.lessons, oldIndex, newIndex).map((lesson, index) => ({
      ...lesson,
      order: index + 1,
    }));
    const next = chapters.map((item) => (item.id === chapterId ? { ...item, lessons } : item));

    void commitReorder(
      next,
      () =>
        reorderTeacherLessons(
          chapterId,
          lessons.map((lesson) => ({ id: lesson.id, position: lesson.order })),
          courseId
        ),
      "We couldn't save the new lesson order. Please try again."
    );
  }

  function setChapterOpen(chapterId: string, open: boolean) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (open) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  }

  async function handleRetryTranscription(lesson: LessonItem) {
    setRetrying((prev) => new Set(prev).add(lesson.id));
    const toastId = toast.loading(`Transcribing "${lesson.title}"...`);

    const { data: result, error } = await tryCatch(transcribeLesson(lesson.id, courseId));
    if (error || !result) {
      toast.error("Transcription failed. Please try again.", { id: toastId });
    } else if (result.success) {
      toast.success("Transcription complete", { id: toastId });
    } else {
      toast.error(result.error, { id: toastId });
    }

    setRetrying((prev) => {
      const next = new Set(prev);
      next.delete(lesson.id);
      return next;
    });
    router.refresh();
  }

  const lessonCount = chapters.reduce((sum, chapter) => sum + chapter.lessons.length, 0);
  const hasVideoLessons = data.chapter.some((chapter) =>
    chapter.lessons.some((lesson) => lesson.videoKey)
  );
  // Lessons that have a video but no completed transcript
  const hasUntranscribedLessons = data.chapter.some((chapter) =>
    chapter.lessons.some(
      (lesson) => lesson.videoKey && lesson.transcriptionStatus !== "COMPLETED"
    )
  );

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={Layers}
        titleAs="h3"
        title="No chapters yet"
        description="Chapters group your lessons. Create the first chapter, then add video or reading lessons to it."
        action={<TeacherNewChapterModal courseId={courseId} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">
            {chapters.length} {chapters.length === 1 ? "chapter" : "chapters"} · {lessonCount}{" "}
            {lessonCount === 1 ? "lesson" : "lessons"}
          </p>
          <p className="text-xs text-muted-foreground">
            Drag the handles to reorder. With a keyboard, focus a handle and press Space.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <TranscribeCourseButton
            courseId={courseId}
            hasUntranscribedLessons={hasUntranscribedLessons}
            hasVideoLessons={hasVideoLessons}
          />
          <TeacherNewChapterModal courseId={courseId} />
        </div>
      </div>

      <DndContext
        id={`chapters-${courseId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleChapterDragEnd}
        accessibility={{
          announcements: createAnnouncements("chapter", chapters),
          screenReaderInstructions,
        }}
      >
        <SortableContext
          items={chapters.map((chapter) => chapter.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-3" aria-label="Chapters">
            {chapters.map((chapter, chapterIndex) => {
              const isOpen = !collapsed.has(chapter.id);
              return (
                <SortableRow
                  key={chapter.id}
                  id={chapter.id}
                  className="rounded-xl border bg-card"
                >
                  {(handle) => (
                    <Collapsible
                      open={isOpen}
                      onOpenChange={(open) => setChapterOpen(chapter.id, open)}
                    >
                      <div className="flex items-start gap-1 p-2 sm:items-center">
                        <DragHandle label={`Reorder chapter ${chapter.title}`} handle={handle} />
                        <h3 className="min-w-0 flex-1">
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            >
                              <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                  "size-4 shrink-0 text-muted-foreground motion-safe:transition-transform",
                                  !isOpen && "-rotate-90"
                                )}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block break-words font-semibold">
                                  {chapter.title}
                                </span>
                                <span className="block text-xs font-normal text-muted-foreground">
                                  Chapter {chapterIndex + 1} · {chapter.lessons.length}{" "}
                                  {chapter.lessons.length === 1 ? "lesson" : "lessons"}
                                </span>
                              </span>
                            </button>
                          </CollapsibleTrigger>
                        </h3>
                        <TeacherDeleteChapter
                          chapterId={chapter.id}
                          courseId={courseId}
                          chapterTitle={chapter.title}
                          lessonCount={chapter.lessons.length}
                        />
                      </div>

                      <CollapsibleContent className="border-t">
                        <div className="space-y-2 p-2">
                          {chapter.lessons.length === 0 ? (
                            <p className="px-2 py-3 text-sm text-muted-foreground">
                              No lessons in this chapter yet.
                            </p>
                          ) : (
                            <DndContext
                              id={`lessons-${chapter.id}`}
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              modifiers={[restrictToVerticalAxis]}
                              onDragEnd={(event) => handleLessonDragEnd(chapter.id, event)}
                              accessibility={{
                                announcements: createAnnouncements("lesson", chapter.lessons),
                                screenReaderInstructions,
                              }}
                            >
                              <SortableContext
                                items={chapter.lessons.map((lesson) => lesson.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <ul
                                  className="space-y-1"
                                  aria-label={`Lessons in ${chapter.title}`}
                                >
                                  {chapter.lessons.map((lesson) => (
                                    <SortableRow
                                      key={lesson.id}
                                      id={lesson.id}
                                      className="rounded-lg bg-card hover:bg-accent/50"
                                    >
                                      {(lessonHandle) => (
                                        <LessonRow
                                          lesson={lesson}
                                          courseId={courseId}
                                          chapterId={chapter.id}
                                          handle={lessonHandle}
                                          retrying={retrying.has(lesson.id)}
                                          onRetry={() => handleRetryTranscription(lesson)}
                                        />
                                      )}
                                    </SortableRow>
                                  ))}
                                </ul>
                              </SortableContext>
                            </DndContext>
                          )}
                          <TeacherNewLessonModal
                            chapterId={chapter.id}
                            courseId={courseId}
                            chapterTitle={chapter.title}
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </SortableRow>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function LessonRow({
  lesson,
  courseId,
  chapterId,
  handle,
  retrying,
  onRetry,
}: {
  lesson: LessonItem;
  courseId: string;
  chapterId: string;
  handle: HandleProps;
  retrying: boolean;
  onRetry: () => void;
}) {
  const type = LESSON_TYPE[lesson.lessonType] ?? LESSON_TYPE.Video;
  const TypeIcon = type.icon;
  const thumbUrl = lesson.thumbnailKey ? getPublicFileUrl(lesson.thumbnailKey) : null;
  const status: TranscriptionStatus = retrying ? "PROCESSING" : lesson.transcriptionStatus;
  const canTranscribe = lesson.hasVideo && status !== "COMPLETED";
  const retryLabel =
    status === "FAILED" ? "Retry" : status === "QUEUED" || status === "PROCESSING" ? "Restart" : "Transcribe";

  return (
    <div className="flex items-start gap-2 p-1.5 sm:items-center">
      <DragHandle label={`Reorder lesson ${lesson.title}`} handle={handle} />

      <div className="relative hidden aspect-video w-20 shrink-0 overflow-hidden rounded-md border bg-muted sm:flex sm:items-center sm:justify-center">
        {thumbUrl ? (
          <Image src={thumbUrl} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <TypeIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1 py-1.5 sm:py-0">
        <Link
          href={`/teacher/courses/${courseId}/${chapterId}/${lesson.id}`}
          className="block break-words rounded-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {lesson.title}
        </Link>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <TypeIcon className="size-3.5" aria-hidden="true" />
            {type.label}
          </span>
          <TranscriptionBadge status={status} hasVideo={lesson.hasVideo} />
          {canTranscribe && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              onClick={onRetry}
              disabled={retrying}
              aria-label={`${retryLabel} transcription for ${lesson.title}`}
            >
              <RefreshCw
                className={cn("size-3.5", retrying && "motion-safe:animate-spin")}
                aria-hidden="true"
              />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>

      <TeacherDeleteLesson
        chapterId={chapterId}
        courseId={courseId}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
      />
    </div>
  );
}
