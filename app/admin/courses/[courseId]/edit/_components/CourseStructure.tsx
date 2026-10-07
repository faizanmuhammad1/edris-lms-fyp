"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import {
  Announcements,
  DndContext,
  DragEndEvent,
  DraggableAttributes,
  DraggableSyntheticListeners,
  KeyboardSensor,
  PointerSensor,
  rectIntersection,
  ScreenReaderInstructions,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, FileText, GripVertical, Layers } from "lucide-react";
import { toast } from "sonner";
import { AdminCourseSingularType } from "@/app/data/admin/admin-get-course";
import { StatusBadge } from "@/app/admin/_components/StatusBadge";
import { pluralize } from "@/app/admin/_lib/format";
import { EmptyState } from "@/components/general/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { tryCatch } from "@/hooks/try-catch";
import { ApiResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import { reorderChapters, reorderLessons } from "../actions";
import { DeleteChapter } from "./DeleteChapter";
import { DeleteLesson } from "./DeleteLesson";
import { NewChapterModal } from "./NewChapterModal";
import { NewLessonModal } from "./NewLessonModal";

interface CourseStructureProps {
  data: AdminCourseSingularType;
}

type LessonItem = { id: string; title: string; order: number; hasVideo: boolean };
type ChapterItem = {
  id: string;
  title: string;
  order: number;
  isOpen: boolean;
  lessons: LessonItem[];
};

type SortableData = { type: "chapter" } | { type: "lesson"; chapterId: string };

type HandleProps = {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  setActivatorNodeRef: (element: HTMLElement | null) => void;
};

function buildItems(
  chapters: AdminCourseSingularType["chapter"],
  previous: ChapterItem[] = []
): ChapterItem[] {
  return chapters.map((chapter) => ({
    id: chapter.id,
    title: chapter.title,
    order: chapter.position,
    // Chapters start expanded; keep whatever the user toggled across refreshes
    isOpen: previous.find((item) => item.id === chapter.id)?.isOpen ?? true,
    lessons: chapter.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      order: lesson.position,
      hasVideo: !!lesson.videoKey,
    })),
  }));
}

/** A sortable list item; the drag listeners go on the handle only so the rest stays clickable/scrollable. */
function SortableItem({
  id,
  data,
  className,
  children,
}: {
  id: string;
  data: SortableData;
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
  } = useSortable({ id, data });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, isDragging && "relative z-10 shadow-lg ring-2 ring-primary/40")}
    >
      {children({ attributes, listeners, setActivatorNodeRef })}
    </li>
  );
}

function DragHandle({
  label,
  attributes,
  listeners,
  setActivatorNodeRef,
}: HandleProps & { label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={label}
      className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
    >
      <GripVertical aria-hidden="true" />
    </Button>
  );
}

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "To reorder, press Space or Enter to pick up the item, use the up and down arrow keys to move it, then press Space or Enter to drop it, or Escape to cancel.",
};

export function CourseStructure({ data }: CourseStructureProps) {
  const [items, setItems] = useState<ChapterItem[]>(() => buildItems(data.chapter));
  const [syncedChapters, setSyncedChapters] = useState(data.chapter);
  const courseId = data.id;

  // Sync with fresh server data (after create/delete/reorder revalidation)
  if (data.chapter !== syncedChapters) {
    setSyncedChapters(data.chapter);
    setItems((previous) => buildItems(data.chapter, previous));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function describe(id: UniqueIdentifier) {
    const chapter = items.find((item) => item.id === id);
    if (chapter) return `chapter "${chapter.title}"`;
    for (const item of items) {
      const lesson = item.lessons.find((l) => l.id === id);
      if (lesson) return `lesson "${lesson.title}"`;
    }
    return "item";
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${describe(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over && over.id !== active.id
        ? `${describe(active.id)} is over ${describe(over.id)}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${describe(active.id)} was dropped at ${describe(over.id)}.` : `${describe(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Reordering ${describe(active.id)} was cancelled.`,
  };

  /** Saves the new order; on failure restores the previous order and explains why. */
  async function persistOrder(
    save: () => Promise<ApiResponse>,
    previous: ChapterItem[],
    loadingMessage: string
  ) {
    const toastId = toast.loading(loadingMessage);
    const { data: result, error } = await tryCatch(save());

    if (error || result.status !== "success") {
      setItems(previous);
      toast.error(
        result?.message ?? "Couldn't save the new order. The previous order was restored.",
        { id: toastId }
      );
      return;
    }

    toast.success(result.message, { id: toastId });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;
    const activeData = active.data.current as SortableData | undefined;
    const overData = over.data.current as SortableData | undefined;
    const previousItems = items;

    // Chapter reordering (dropping on a lesson targets that lesson's chapter)
    if (activeData?.type === "chapter") {
      const targetChapterId =
        overData?.type === "chapter" ? overId : overData?.type === "lesson" ? overData.chapterId : null;

      if (!targetChapterId) return;

      const oldIndex = items.findIndex((item) => item.id === activeId);
      const newIndex = items.findIndex((item) => item.id === targetChapterId);

      if (oldIndex === -1 || newIndex === -1) {
        toast.error("Couldn't work out where to move this chapter. Please try again.");
        return;
      }
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(items, oldIndex, newIndex).map((chapter, index) => ({
        ...chapter,
        order: index + 1,
      }));
      setItems(reordered);

      void persistOrder(
        () =>
          reorderChapters(
            courseId,
            reordered.map((chapter) => ({ id: chapter.id, position: chapter.order }))
          ),
        previousItems,
        "Saving chapter order..."
      );
      return;
    }

    // Lesson reordering within a chapter
    if (activeData?.type === "lesson" && overData?.type === "lesson") {
      const chapterId = activeData.chapterId;

      if (chapterId !== overData.chapterId) {
        toast.error("Lessons can only be reordered within their own chapter.");
        return;
      }

      const chapterIndex = items.findIndex((chapter) => chapter.id === chapterId);
      if (chapterIndex === -1) {
        toast.error("Couldn't find this lesson's chapter. Please refresh and try again.");
        return;
      }

      const chapter = items[chapterIndex];
      const oldIndex = chapter.lessons.findIndex((lesson) => lesson.id === activeId);
      const newIndex = chapter.lessons.findIndex((lesson) => lesson.id === overId);

      if (oldIndex === -1 || newIndex === -1) {
        toast.error("Couldn't work out where to move this lesson. Please try again.");
        return;
      }

      const reorderedLessons = arrayMove(chapter.lessons, oldIndex, newIndex).map(
        (lesson, index) => ({ ...lesson, order: index + 1 })
      );

      const nextItems = [...items];
      nextItems[chapterIndex] = { ...chapter, lessons: reorderedLessons };
      setItems(nextItems);

      void persistOrder(
        () =>
          reorderLessons(
            chapterId,
            reorderedLessons.map((lesson) => ({ id: lesson.id, position: lesson.order })),
            courseId
          ),
        previousItems,
        "Saving lesson order..."
      );
    }
  }

  function toggleChapter(chapterId: string, open: boolean) {
    setItems((current) =>
      current.map((chapter) => (chapter.id === chapterId ? { ...chapter, isOpen: open } : chapter))
    );
  }

  const lessonTotal = items.reduce((sum, chapter) => sum + chapter.lessons.length, 0);

  return (
    <Card className="gap-4 py-4 sm:gap-6 sm:py-6">
      <CardHeader className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0 space-y-1.5">
          <h2 className="text-lg font-semibold leading-none">Course structure</h2>
          <CardDescription>
            {items.length > 0
              ? `${pluralize(items.length, "chapter")}, ${pluralize(lessonTotal, "lesson")}. Drag the handles to reorder, or focus a handle and use the keyboard.`
              : "Organise the course into chapters, then add lessons to each chapter."}
          </CardDescription>
        </div>
        {items.length > 0 && <NewChapterModal courseId={courseId} />}
      </CardHeader>

      <CardContent className="px-3 sm:px-6">
        {items.length === 0 ? (
          <EmptyState
            titleAs="h3"
            icon={Layers}
            title="No chapters yet"
            description="Add the first chapter to start building this course. You can add lessons to it right after."
            action={<NewChapterModal courseId={courseId} />}
          />
        ) : (
          <DndContext
            id={`course-structure-${courseId}`}
            collisionDetection={rectIntersection}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            modifiers={[restrictToVerticalAxis]}
            accessibility={{ announcements, screenReaderInstructions }}
          >
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <ol className="space-y-3" aria-label="Chapters">
                {items.map((item, chapterIndex) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    data={{ type: "chapter" }}
                    className="rounded-xl border bg-card"
                  >
                    {(handle) => (
                      <Collapsible
                        open={item.isOpen}
                        onOpenChange={(open) => toggleChapter(item.id, open)}
                      >
                        <div className="flex items-center gap-1 p-2 sm:gap-2 sm:p-3">
                          <DragHandle label={`Reorder chapter: ${item.title}`} {...handle} />
                          <CollapsibleTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="shrink-0"
                              aria-label={`${item.isOpen ? "Collapse" : "Expand"} chapter: ${item.title}`}
                            >
                              <ChevronDown
                                aria-hidden="true"
                                className={cn("transition-transform", !item.isOpen && "-rotate-90")}
                              />
                            </Button>
                          </CollapsibleTrigger>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate font-medium" title={item.title}>
                              {item.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Chapter {chapterIndex + 1} · {pluralize(item.lessons.length, "lesson")}
                            </p>
                          </div>

                          <DeleteChapter
                            chapterId={item.id}
                            courseId={courseId}
                            chapterTitle={item.title}
                            lessonCount={item.lessons.length}
                          />
                        </div>

                        <CollapsibleContent className="border-t">
                          <div className="space-y-2 p-2 sm:p-3">
                            {item.lessons.length === 0 ? (
                              <p className="px-2 py-3 text-sm text-muted-foreground">
                                No lessons in this chapter yet.
                              </p>
                            ) : (
                              <SortableContext
                                items={item.lessons.map((lesson) => lesson.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <ol className="space-y-1" aria-label={`Lessons in ${item.title}`}>
                                  {item.lessons.map((lesson) => (
                                    <SortableItem
                                      key={lesson.id}
                                      id={lesson.id}
                                      data={{ type: "lesson", chapterId: item.id }}
                                      className="rounded-lg bg-card"
                                    >
                                      {(lessonHandle) => (
                                        <div className="flex items-center gap-1 rounded-lg pr-1 hover:bg-accent/60 sm:gap-2">
                                          <DragHandle
                                            label={`Reorder lesson: ${lesson.title}`}
                                            {...lessonHandle}
                                          />
                                          <FileText
                                            className="hidden size-4 shrink-0 text-muted-foreground min-[400px]:block"
                                            aria-hidden="true"
                                          />
                                          <Link
                                            href={`/admin/courses/${courseId}/${item.id}/${lesson.id}`}
                                            className="min-w-0 flex-1 truncate rounded-sm py-2 text-sm font-medium hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            title={lesson.title}
                                          >
                                            {lesson.title}
                                            <span className="sr-only"> (edit lesson)</span>
                                          </Link>
                                          {!lesson.hasVideo && (
                                            <StatusBadge tone="warning" className="hidden sm:inline-flex">
                                              No video
                                            </StatusBadge>
                                          )}
                                          <DeleteLesson
                                            chapterId={item.id}
                                            courseId={courseId}
                                            lessonId={lesson.id}
                                            lessonTitle={lesson.title}
                                            hasVideo={lesson.hasVideo}
                                          />
                                        </div>
                                      )}
                                    </SortableItem>
                                  ))}
                                </ol>
                              </SortableContext>
                            )}
                            <NewLessonModal
                              chapterId={item.id}
                              courseId={courseId}
                              chapterTitle={item.title}
                            />
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </SortableItem>
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
