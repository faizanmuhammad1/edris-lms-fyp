"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, GripVertical, ListChecks, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { EmptyState } from "@/components/general/EmptyState";
import { cn } from "@/lib/utils";
import { deleteQuestion, updateQuestionOrder } from "../actions";
import { QuestionForm, type EditableQuestion } from "./QuestionForm";

interface Question extends EditableQuestion {
  position: number;
}

interface QuestionListProps {
  questions: Question[];
  quizId: string;
  /** Whether the quiz is published (a published quiz must keep at least one question). */
  isPublished?: boolean;
  /** Action shown in the empty state, e.g. the "Add question" dialog trigger. */
  emptyAction?: ReactNode;
}

function excerpt(text: string, max = 60) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

export function QuestionList({ questions, quizId, isPublished = false, emptyAction }: QuestionListProps) {
  const router = useRouter();
  const [items, setItems] = useState(questions);
  const [prevQuestions, setPrevQuestions] = useState(questions);
  const [editing, setEditing] = useState<Question | null>(null);
  const [reorderPending, startReorder] = useTransition();

  // Adopt fresh server data after a refresh.
  if (questions !== prevQuestions) {
    setPrevQuestions(questions);
    setItems(questions);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const positionOf = (id: string | number) => items.findIndex((q) => q.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      `Picked up question ${positionOf(active.id)}. Use the arrow keys to move it, Space to drop, Escape to cancel.`,
    onDragOver: ({ active, over }) =>
      over ? `Question ${positionOf(active.id)} is over position ${positionOf(over.id)}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `Question ${positionOf(active.id)} was dropped at position ${positionOf(over.id)}.`
        : `Question ${positionOf(active.id)} was dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. Question ${positionOf(active.id)} was not moved.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((q) => q.id === active.id);
    const newIndex = items.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previous = items;
    const next = arrayMove(items, oldIndex, newIndex).map((q, index) => ({ ...q, position: index + 1 }));
    setItems(next);

    startReorder(async () => {
      try {
        const result = await updateQuestionOrder(
          quizId,
          next.map((q) => ({ id: q.id, position: q.position }))
        );
        if (result.status === "error") {
          setItems(previous);
          toast.error(result.message);
          return;
        }
        toast.success("Question order saved");
        router.refresh();
      } catch {
        setItems(previous);
        toast.error("Couldn't save the new question order. Please try again.");
      }
    });
  }

  async function handleDelete(questionId: string) {
    try {
      const result = await deleteQuestion(questionId);
      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }
      toast.success("Question deleted");
      setItems((current) => current.filter((q) => q.id !== questionId));
      router.refresh();
    } catch {
      toast.error("Couldn't delete the question. Please try again.");
      return false;
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        titleAs="h3"
        title="No questions yet"
        description="Add your first multiple choice question, or generate questions from the lesson transcript."
        action={emptyAction}
      />
    );
  }

  const canReorder = items.length > 1;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {items.length} question{items.length === 1 ? "" : "s"} ·{" "}
          {items.reduce((sum, q) => sum + q.points, 0)} total points
        </p>
        {canReorder && (
          <p className="flex items-center gap-1.5" aria-live="polite">
            {reorderPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Saving order…
              </>
            ) : (
              "Drag the handle (or focus it and use the arrow keys) to reorder."
            )}
          </p>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements }}
      >
        <SortableContext items={items.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-3">
            {items.map((q, index) => (
              <SortableQuestionCard
                key={q.id}
                question={q}
                number={index + 1}
                canReorder={canReorder}
                reorderDisabled={reorderPending}
                isLastPublished={isPublished && items.length === 1}
                onEdit={() => setEditing(q)}
                onDelete={() => handleDelete(q.id)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <QuestionForm
        quizId={quizId}
        question={editing}
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </div>
  );
}

interface SortableQuestionCardProps {
  question: Question;
  number: number;
  canReorder: boolean;
  reorderDisabled: boolean;
  isLastPublished: boolean;
  onEdit: () => void;
  onDelete: () => Promise<boolean | void>;
}

function SortableQuestionCard({
  question,
  number,
  canReorder,
  reorderDisabled,
  isLastPublished,
  onEdit,
  onDelete,
}: SortableQuestionCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: question.id, disabled: !canReorder || reorderDisabled });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const options = [...question.options].sort((a, b) => a.position - b.position);
  const label = excerpt(question.question);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border bg-card p-3 sm:p-4",
        isDragging && "relative z-10 shadow-lg ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {canReorder && (
          <Button
            ref={setActivatorNodeRef}
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            aria-label={`Reorder question ${number}: ${label}`}
            disabled={reorderDisabled}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden="true" />
          </Button>
        )}

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" aria-hidden="true">
                  Q{number}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {question.points} point{question.points === 1 ? "" : "s"}
                </span>
              </div>
              <h3 className="font-medium break-words whitespace-pre-wrap">
                <span className="sr-only">Question {number}: </span>
                {question.question}
              </h3>
            </div>

            <div className="flex shrink-0 items-center gap-1 self-end sm:self-start">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                onClick={onEdit}
                aria-label={`Edit question ${number}`}
                title="Edit question"
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Button>
              <ConfirmDialog
                title={`Delete question ${number}?`}
                description={
                  isLastPublished
                    ? "This is the only question in a published quiz. Unpublish the quiz first, or add another question before deleting this one."
                    : "The question and its options are removed from the quiz. Past attempts keep their recorded scores. This can't be undone."
                }
                confirmLabel="Delete question"
                destructive
                onConfirm={onDelete}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete question ${number}`}
                    title="Delete question"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                }
              />
            </div>
          </div>

          <ol className="grid grid-cols-1 gap-2 md:grid-cols-2" aria-label={`Options for question ${number}`}>
            {options.map((opt, optIndex) => (
              <li
                key={opt.id}
                className={cn(
                  "flex min-w-0 items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                  opt.isCorrect ? "border-primary/50 bg-primary/5" : "border-transparent bg-muted/50"
                )}
              >
                <span className="shrink-0 font-medium text-muted-foreground" aria-hidden="true">
                  {String.fromCharCode(65 + (optIndex % 26))}.
                </span>
                <span className="min-w-0 flex-1 break-words">{opt.text}</span>
                {opt.isCorrect && (
                  <Badge variant="outline" className="shrink-0 border-primary/50 text-primary">
                    <CheckCircle2 aria-hidden="true" />
                    Correct
                  </Badge>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </li>
  );
}
