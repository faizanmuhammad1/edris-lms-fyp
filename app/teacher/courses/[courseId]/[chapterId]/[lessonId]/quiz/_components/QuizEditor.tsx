"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, ListChecks, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { TeacherQuizType } from "@/app/data/teacher/get-teacher-quiz";
import { PageHeader } from "@/components/general/PageHeader";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { EmptyState } from "@/components/general/EmptyState";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteQuiz, upsertQuiz } from "../actions";
import { AiQuestionGenerator } from "./AiQuestionGenerator";
import { QuestionForm } from "./QuestionForm";
import { QuestionList } from "./QuestionList";

const quizSettingsSchema = z.object({
  title: z.string().trim().min(1, "Enter a quiz title").max(200, "Keep the title under 200 characters"),
  description: z.string().max(2000, "Keep the description under 2,000 characters"),
  passingScore: z
    .number({ invalid_type_error: "Enter a passing score from 0 to 100" })
    .int("Passing score must be a whole number")
    .min(0, "Passing score can't be below 0")
    .max(100, "Passing score can't be above 100"),
  isPublished: z.boolean(),
});

type QuizSettingsValues = z.infer<typeof quizSettingsSchema>;

type QuizQuestions = NonNullable<TeacherQuizType>["questions"];

/** Mirrors the server's publish validation so the teacher sees why publishing is blocked. */
function getPublishBlocker(questions: QuizQuestions): string | null {
  if (questions.length === 0) {
    return "Add at least one question with a correct answer before publishing.";
  }
  const invalid = questions.filter(
    (q) => q.points < 1 || q.options.length < 2 || q.options.filter((o) => o.isCorrect).length !== 1
  ).length;
  if (invalid > 0) {
    return `${invalid} question${invalid === 1 ? " needs" : "s need"} exactly one correct answer and at least 1 point before publishing.`;
  }
  return null;
}

interface QuizEditorProps {
  lessonId: string;
  courseId: string;
  chapterId: string;
  initialData: TeacherQuizType | null;
}

export function QuizEditor({ lessonId, courseId, chapterId, initialData }: QuizEditorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lessonHref = `/teacher/courses/${courseId}/${chapterId}/${lessonId}`;
  const questions = initialData?.questions ?? [];
  const publishBlocker = getPublishBlocker(questions);

  const form = useForm<QuizSettingsValues>({
    resolver: zodResolver(quizSettingsSchema),
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      passingScore: initialData?.passingScore ?? 70,
      isPublished: initialData?.isPublished ?? false,
    },
  });

  const isPublishedValue = useWatch({ control: form.control, name: "isPublished" });

  function onSubmit(values: QuizSettingsValues) {
    if (values.isPublished && publishBlocker) {
      form.setError("isPublished", { message: publishBlocker });
      toast.error(publishBlocker);
      return;
    }

    startTransition(async () => {
      try {
        const result = await upsertQuiz(lessonId, {
          title: values.title.trim(),
          description: values.description.trim(),
          isPublished: values.isPublished,
          passingScore: values.passingScore,
        });

        if (result.status === "error") {
          if (/publish/i.test(result.message)) {
            form.setError("isPublished", { message: result.message });
          } else {
            form.setError("root", { message: result.message });
          }
          toast.error(result.message);
          return;
        }

        if (!initialData) {
          toast.success("Quiz created. Now add some questions.");
        } else if (initialData.isPublished !== values.isPublished) {
          toast.success(values.isPublished ? "Quiz published. Students can take it now." : "Quiz unpublished");
        } else {
          toast.success("Quiz saved");
        }
        form.reset(values);
        router.refresh();
      } catch {
        const message = "Couldn't save the quiz. Please try again.";
        form.setError("root", { message });
        toast.error(message);
      }
    });
  }

  async function handleDeleteQuiz() {
    try {
      const result = await deleteQuiz(lessonId);
      if (result.status === "error") {
        toast.error(result.message);
        return false;
      }
      toast.success("Quiz deleted");
      router.push(lessonHref);
      router.refresh();
    } catch {
      toast.error("Couldn't delete the quiz. Please try again.");
      return false;
    }
  }

  const rootError = form.formState.errors.root?.message;
  const questionCount = questions.length;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={lessonHref}
        backLabel="Back to lesson"
        title={<span className="break-words">{initialData?.title || "Create quiz"}</span>}
        description={
          initialData
            ? `Quiz for “${initialData.Lesson.title}”. Edit the settings, manage questions and publish when it's ready.`
            : "Set up a quiz for this lesson. Save the settings first, then add questions."
        }
        actions={
          initialData && (
            <>
              {initialData.isPublished ? (
                <Badge variant="outline" className="h-8 border-primary/50 px-2.5 text-primary">
                  <Eye aria-hidden="true" />
                  Published
                </Badge>
              ) : (
                <Badge variant="secondary" className="h-8 px-2.5">
                  <EyeOff aria-hidden="true" />
                  Draft
                </Badge>
              )}
              <ConfirmDialog
                title="Delete this quiz?"
                description={`This permanently deletes “${initialData.title}”, its ${questionCount} question${
                  questionCount === 1 ? "" : "s"
                }, and every student attempt and score for it. This can't be undone.`}
                confirmLabel="Delete quiz"
                destructive
                onConfirm={handleDeleteQuiz}
                trigger={
                  <Button
                    variant="outline"
                    className="h-10 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={pending}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete quiz
                  </Button>
                }
              />
            </>
          )
        }
      />

      <section aria-labelledby="quiz-settings-heading" className="min-w-0">
        <Card className="min-w-0">
          <CardHeader>
            <h2 id="quiz-settings-heading" className="text-lg font-semibold leading-none">
              Quiz settings
            </h2>
            <CardDescription>Title, pass mark and visibility for students.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
                <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel>Quiz title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Chapter 1 knowledge check"
                            className="h-10"
                            disabled={pending}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Shown to students above the quiz.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <FormLabel>Passing score (%)</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="numeric"
                              min={0}
                              max={100}
                              step={1}
                              className="h-10 pr-8"
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
                          <span
                            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground"
                            aria-hidden="true"
                          >
                            %
                          </span>
                        </div>
                        <FormDescription>Whole number from 0 to 100.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe what students will be tested on"
                          className="min-h-24 resize-y"
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
                  name="isPublished"
                  render={({ field }) => (
                    <FormItem className="gap-3 rounded-xl border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <FormLabel className="text-base">Publish quiz</FormLabel>
                          <FormDescription>
                            When published, enrolled students can take this quiz from the lesson page.
                            {publishBlocker && !isPublishedValue && (
                              <span className="mt-2 flex items-start gap-2">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                                {initialData
                                  ? publishBlocker
                                  : "Save the quiz and add at least one question with a correct answer before publishing."}
                              </span>
                            )}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (checked && publishBlocker) {
                                form.setError("isPublished", { message: publishBlocker });
                              } else {
                                form.clearErrors("isPublished");
                              }
                            }}
                            disabled={pending}
                            className="mt-0.5 shrink-0"
                          />
                        </FormControl>
                      </div>
                      <FormMessage role="alert" />
                    </FormItem>
                  )}
                />

                {rootError && (
                  <p
                    className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {rootError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  {form.formState.isDirty && !pending && (
                    <p className="text-sm text-muted-foreground sm:mr-auto">You have unsaved changes.</p>
                  )}
                  <Button type="submit" className="h-10 w-full sm:w-auto" disabled={pending} aria-busy={pending}>
                    {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {pending ? "Saving…" : initialData ? "Save changes" : "Create quiz"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {initialData ? (
        <>
          <AiQuestionGenerator
            quizId={initialData.id}
            lessonId={lessonId}
            lessonHref={lessonHref}
            transcriptionReady={initialData.Lesson?.transcriptionStatus === "COMPLETED"}
          />

          <section aria-labelledby="quiz-questions-heading" className="min-w-0">
            <Card className="min-w-0">
              <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <h2 id="quiz-questions-heading" className="text-lg font-semibold leading-none">
                    Questions
                  </h2>
                  <CardDescription>
                    Each question has one correct answer. Students see them in this order.
                  </CardDescription>
                </div>
                {questionCount > 0 && <QuestionForm quizId={initialData.id} />}
              </CardHeader>
              <CardContent>
                <QuestionList
                  questions={initialData.questions}
                  quizId={initialData.id}
                  isPublished={initialData.isPublished}
                  emptyAction={<QuestionForm quizId={initialData.id} />}
                />
              </CardContent>
            </Card>
          </section>
        </>
      ) : (
        <EmptyState
          icon={ListChecks}
          title="Save the quiz to add questions"
          description="Fill in the quiz settings above and select “Create quiz”. You can then write questions or generate them from the lesson transcript."
        />
      )}
    </div>
  );
}
