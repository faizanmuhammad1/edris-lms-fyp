"use client";

import { useEffect, useId, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, PlusIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { createQuestion, updateQuestion } from "../actions";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

const questionFormSchema = z
  .object({
    question: z
      .string()
      .trim()
      .min(1, "Enter the question text")
      .max(2000, "Keep the question under 2,000 characters"),
    points: z
      .number({ invalid_type_error: "Enter how many points this question is worth" })
      .int("Points must be a whole number")
      .min(1, "Points must be at least 1"),
    options: z
      .array(
        z.object({
          id: z.string().optional(),
          text: z
            .string()
            .trim()
            .min(1, "Option text can't be empty")
            .max(500, "Keep each option under 500 characters"),
        })
      )
      .min(MIN_OPTIONS, `Add at least ${MIN_OPTIONS} options`)
      .max(MAX_OPTIONS, `A question can have at most ${MAX_OPTIONS} options`),
    correctIndex: z.number().int(),
  })
  .refine((v) => v.correctIndex >= 0 && v.correctIndex < v.options.length, {
    message: "Select the option that is the correct answer",
    path: ["correctIndex"],
  });

type QuestionFormValues = z.infer<typeof questionFormSchema>;

export interface EditableQuestion {
  id: string;
  question: string;
  points: number;
  options: { id: string; text: string; isCorrect: boolean; position: number }[];
}

function toFormValues(question?: EditableQuestion | null): QuestionFormValues {
  if (!question) {
    return { question: "", points: 1, options: [{ text: "" }, { text: "" }], correctIndex: 0 };
  }
  const options = [...question.options].sort((a, b) => a.position - b.position);
  return {
    question: question.question,
    points: question.points,
    // `id` is kept for existing options so they are updated in place (past attempts reference them)
    options: options.map((o) => ({ id: o.id, text: o.text })),
    correctIndex: options.findIndex((o) => o.isCorrect),
  };
}

interface QuestionFormProps {
  quizId: string;
  /** When provided the dialog edits this question; otherwise it creates a new one. */
  question?: EditableQuestion | null;
  /** Controlled open state (used for editing). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Custom trigger for create mode; defaults to an "Add question" button. */
  trigger?: ReactNode;
}

/** Dialog form for creating or editing a single-answer multiple choice question. */
export function QuestionForm({ quizId, question, open, onOpenChange, trigger }: QuestionFormProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isEdit = !!question;
  const isOpen = open ?? internalOpen;
  const baseId = useId();

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: toFormValues(question),
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" });
  const correctIndex = useWatch({ control: form.control, name: "correctIndex" });

  // Load fresh values every time the dialog opens (or switches to another question).
  useEffect(() => {
    if (isOpen) form.reset(toFormValues(question));
  }, [isOpen, question, form]);

  function setOpen(next: boolean) {
    if (pending) return;
    onOpenChange?.(next);
    if (open === undefined) setInternalOpen(next);
  }

  function handleRemoveOption(index: number) {
    if (fields.length <= MIN_OPTIONS) return;
    remove(index);
    // Keep the correct answer pointing at the same option after the list shifts.
    if (correctIndex === index) {
      form.setValue("correctIndex", -1, { shouldValidate: form.formState.isSubmitted });
    } else if (correctIndex > index) {
      form.setValue("correctIndex", correctIndex - 1);
    }
  }

  function onSubmit(values: QuestionFormValues) {
    const options = values.options.map((opt, index) => ({
      id: opt.id,
      text: opt.text.trim(),
      isCorrect: index === values.correctIndex,
    }));

    startTransition(async () => {
      try {
        const result = question
          ? await updateQuestion(question.id, { question: values.question.trim(), points: values.points, options })
          : await createQuestion(quizId, {
              question: values.question.trim(),
              points: values.points,
              options: options.map(({ text, isCorrect }) => ({ text, isCorrect })),
            });

        if (result.status === "error") {
          form.setError("root", { message: result.message });
          toast.error(result.message);
          return;
        }

        toast.success(isEdit ? "Question updated" : "Question added");
        onOpenChange?.(false);
        if (open === undefined) setInternalOpen(false);
        if (!isEdit) form.reset(toFormValues(null));
        router.refresh();
      } catch {
        const message = isEdit
          ? "Couldn't update the question. Please try again."
          : "Couldn't add the question. Please try again.";
        form.setError("root", { message });
        toast.error(message);
      }
    });
  }

  const optionsError =
    form.formState.errors.options?.root?.message ?? form.formState.errors.options?.message;
  const correctError = form.formState.errors.correctIndex?.message;
  const rootError = form.formState.errors.root?.message;
  const legendId = `${baseId}-options-legend`;
  const helpId = `${baseId}-options-help`;
  const correctErrorId = `${baseId}-correct-error`;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="h-10">
              <PlusIcon className="size-4" aria-hidden="true" />
              Add question
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit question" : "Add question"}</DialogTitle>
          <DialogDescription>
            Multiple choice with one correct answer. Students earn the points only when they pick it.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. Which keyword declares a constant in JavaScript?"
                      className="min-h-20 resize-y"
                      disabled={pending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="points"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Points</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      className="h-10 w-full sm:w-32"
                      disabled={pending}
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={Number.isNaN(field.value) ? "" : field.value}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? Number.NaN : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormDescription>Whole number, at least 1.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <fieldset className="space-y-3" aria-describedby={helpId}>
              <legend id={legendId} className="text-sm font-medium">
                Answer options
              </legend>
              <p id={helpId} className="text-sm text-muted-foreground">
                Type each option and select the radio button next to the correct answer.
              </p>

              <RadioGroup
                value={correctIndex >= 0 ? String(correctIndex) : ""}
                onValueChange={(value) =>
                  form.setValue("correctIndex", Number(value), {
                    shouldDirty: true,
                    shouldValidate: form.formState.isSubmitted,
                  })
                }
                aria-labelledby={legendId}
                aria-invalid={!!correctError}
                aria-describedby={correctError ? correctErrorId : undefined}
                className="gap-2"
                disabled={pending}
              >
                {fields.map((item, index) => {
                  const isCorrect = correctIndex === index;
                  const number = index + 1;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-start gap-1 rounded-lg border p-1.5",
                        isCorrect && "border-primary bg-primary/5"
                      )}
                    >
                      <label
                        className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-muted"
                        title={`Mark option ${number} as the correct answer`}
                      >
                        <RadioGroupItem
                          value={String(index)}
                          className="size-5"
                          aria-label={`Option ${number} is the correct answer`}
                        />
                      </label>
                      <FormField
                        control={form.control}
                        name={`options.${index}.text`}
                        render={({ field }) => (
                          <FormItem className="min-w-0 flex-1 gap-1">
                            <FormLabel className="sr-only">Option {number}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={`Option ${number}`}
                                className="h-10"
                                disabled={pending}
                                {...field}
                              />
                            </FormControl>
                            {isCorrect && (
                              <p className="flex items-center gap-1 text-xs font-medium text-primary">
                                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                                Correct answer
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-10 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveOption(index)}
                        disabled={pending || fields.length <= MIN_OPTIONS}
                        aria-label={`Remove option ${number}`}
                        title={
                          fields.length <= MIN_OPTIONS
                            ? `A question needs at least ${MIN_OPTIONS} options`
                            : `Remove option ${number}`
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  );
                })}
              </RadioGroup>

              {correctError && (
                <p id={correctErrorId} className="text-sm text-destructive" role="alert">
                  {correctError}
                </p>
              )}
              {optionsError && (
                <p className="text-sm text-destructive" role="alert">
                  {optionsError}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => append({ text: "" })}
                  disabled={pending || fields.length >= MAX_OPTIONS}
                >
                  <PlusIcon className="size-4" aria-hidden="true" />
                  Add option
                </Button>
                <span className="text-xs text-muted-foreground">
                  {fields.length} of {MAX_OPTIONS} options
                </span>
              </div>
            </fieldset>

            {rootError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                {rootError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="h-10" onClick={() => setOpen(false)} disabled={pending}>
                Cancel
              </Button>
              <Button type="submit" className="h-10" disabled={pending} aria-busy={pending}>
                {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {pending ? "Saving…" : isEdit ? "Save changes" : "Add question"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
