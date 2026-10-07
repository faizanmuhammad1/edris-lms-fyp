"use client";

import { useState, useEffect, useTransition, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ConfirmDialog } from "@/components/general/ConfirmDialog";
import { QuizTimer } from "./QuizTimer";
import { CheckCircle2, XCircle, AlertCircle, Loader2, ShieldCheck, RotateCcw, ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitQuizAttempt } from "../actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuizOption {
  id: string;
  text: string;
  position: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  position: number;
  points: number;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  timeLimit: number | null;
  passingScore: number;
  questions: QuizQuestion[];
}

type CheatingCounters = {
  tabSwitchCount: number;
  backButtonCount: number;
  windowBlurCount: number;
  visibilityChangeCount: number;
  copyAttemptCount: number;
  pasteAttemptCount: number;
  rightClickCount: number;
  devToolsAttemptCount: number;
};

interface QuizProps {
  quiz: Quiz;
  lessonId: string;
  courseSlug: string;
  onComplete?: () => void;
  /** Called when the student starts another attempt from the results screen. */
  onRetake?: () => void;
  onAnswerChange?: (hasAnswers: boolean, answers: Record<string, string>) => void;
  onSubmitRef?: (submitFn: () => void) => void;
  cheatingCountersRef?: React.MutableRefObject<CheatingCounters>;
  violationLogRef?: React.MutableRefObject<{ type: string; at: string }[]>;
  isExiting?: boolean;
}

const EMPTY_COUNTERS: CheatingCounters = {
  tabSwitchCount: 0,
  backButtonCount: 0,
  windowBlurCount: 0,
  visibilityChangeCount: 0,
  copyAttemptCount: 0,
  pasteAttemptCount: 0,
  rightClickCount: 0,
  devToolsAttemptCount: 0,
};

export function Quiz({
  quiz,
  lessonId,
  courseSlug,
  onComplete,
  onRetake,
  onAnswerChange,
  onSubmitRef,
  cheatingCountersRef,
  violationLogRef,
  isExiting,
}: QuizProps) {
  const router = useRouter();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    passed: boolean;
    answers: Record<string, { isCorrect: boolean; correctOptionId: string | null }>;
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [timeUp, setTimeUp] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [startTime, setStartTime] = useState<number>(() => Date.now());
  const [integritySnapshot, setIntegritySnapshot] = useState<
    (CheatingCounters & { screenshotCount: number; printCount: number }) | null
  >(null);
  const submitFnRef = useRef<(() => void) | null>(null);

  // Sorted copies: never mutate the props.
  const questions = useMemo(
    () =>
      [...quiz.questions]
        .sort((a, b) => a.position - b.position)
        .map((q) => ({ ...q, options: [...q.options].sort((a, b) => a.position - b.position) })),
    [quiz.questions]
  );

  const answeredCount = questions.filter((q) => selectedAnswers[q.id]).length;
  const unansweredCount = questions.length - answeredCount;

  const handleSubmit = useCallback(() => {
    if (isSubmitted || isPending) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000); // Time in seconds
    setSubmitError(false);

    startTransition(async () => {
      try {
        const response = await submitQuizAttempt({
          quizId: quiz.id,
          lessonId,
          courseSlug,
          answers: selectedAnswers,
          timeSpent: timeSpent,
          cheatingCounters: cheatingCountersRef ? { ...cheatingCountersRef.current } : undefined,
          violationLog:
            violationLogRef && (violationLogRef.current?.length ?? 0) > 0
              ? [...violationLogRef.current]
              : undefined,
        });

        if (response.status === "success" && response.data) {
          const screenshotCount = violationLogRef?.current?.filter((v) => v.type === "printscreen").length ?? 0;
          const printCount = violationLogRef?.current?.filter((v) => v.type === "print").length ?? 0;
          setResults(response.data);
          setIsSubmitted(true);
          setIntegritySnapshot({
            ...(cheatingCountersRef ? cheatingCountersRef.current : EMPTY_COUNTERS),
            screenshotCount,
            printCount,
          });

          if (response.data.passed) {
            toast.success(`Congratulations! You passed with ${response.data.score}%`);
          } else {
            toast.error(`You scored ${response.data.score}%. The pass mark is ${quiz.passingScore}%.`);
          }

          if (onComplete) {
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        } else {
          setSubmitError(true);
          toast.error(response.message || "We couldn't submit your quiz. Please try again.");
        }
      } catch {
        setSubmitError(true);
        toast.error("We couldn't submit your quiz. Check your connection and try again.");
      }
    });
  }, [
    isSubmitted,
    isPending,
    selectedAnswers,
    quiz.id,
    lessonId,
    courseSlug,
    quiz.passingScore,
    onComplete,
    startTime,
    cheatingCountersRef,
    violationLogRef,
  ]);

  const handleTimeUp = useCallback(() => {
    setTimeUp(true);
    submitFnRef.current?.();
  }, []);

  // Expose submit function to parent
  useEffect(() => {
    submitFnRef.current = handleSubmit;
    if (onSubmitRef) {
      onSubmitRef(() => {
        submitFnRef.current?.();
      });
    }
  }, [onSubmitRef, handleSubmit]);

  const handleAnswerChangeLocal = (questionId: string, optionId: string) => {
    if (isSubmitted || timeUp) return;
    const newAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(newAnswers);
    onAnswerChange?.(Object.keys(newAnswers).length > 0, newAnswers);
  };

  function requestSubmit() {
    if (unansweredCount > 0) {
      setConfirmOpen(true);
    } else {
      handleSubmit();
    }
  }

  function handleRetake() {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setResults(null);
    setTimeUp(false);
    setSubmitError(false);
    setIntegritySnapshot(null);
    setStartTime(Date.now());
    if (cheatingCountersRef) {
      cheatingCountersRef.current = { ...EMPTY_COUNTERS };
    }
    if (violationLogRef) {
      violationLogRef.current = [];
    }
    onRetake?.();
  }

  const lessonHref = `/dashboard/${courseSlug}/${lessonId}`;

  if (isSubmitted && results) {
    const totalViolations = integritySnapshot
      ? Object.values(integritySnapshot).reduce((sum, n) => sum + n, 0)
      : 0;

    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Quiz results</p>
            <h1 className="text-2xl font-bold tracking-tight break-words">{quiz.title}</h1>
          </div>
          <p
            className={cn(
              "inline-flex shrink-0 items-center gap-2 self-start rounded-lg px-4 py-2 font-semibold",
              results.passed
                ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
            )}
            role="status"
          >
            {results.passed ? (
              <CheckCircle2 className="size-5" aria-hidden="true" />
            ) : (
              <XCircle className="size-5" aria-hidden="true" />
            )}
            {results.score}% · {results.passed ? "Passed" : "Not passed"}
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-muted p-4 text-center sm:gap-4">
          <div>
            <dt className="text-xs text-muted-foreground sm:text-sm">Correct</dt>
            <dd className="text-2xl font-bold tabular-nums">{results.correctAnswers}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground sm:text-sm">Incorrect</dt>
            <dd className="text-2xl font-bold tabular-nums">{results.totalQuestions - results.correctAnswers}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground sm:text-sm">Total</dt>
            <dd className="text-2xl font-bold tabular-nums">{results.totalQuestions}</dd>
          </div>
        </dl>

        {!results.passed && (
          <p className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
            Correct answers are revealed once you pass. You need {quiz.passingScore}% to pass. Review the lesson
            and try again.
          </p>
        )}

        <ol className="space-y-4">
          {questions.map((question, index) => {
            const selectedOptionId = selectedAnswers[question.id];
            const answerResult = results.answers[question.id];
            const isCorrect = answerResult?.isCorrect ?? false;
            const correctOptionId = answerResult?.correctOptionId;

            return (
              <li key={question.id}>
                <Card
                  className={cn(
                    "gap-4 border-2 py-5",
                    isCorrect
                      ? "border-green-200 dark:border-green-900"
                      : "border-red-200 dark:border-red-900"
                  )}
                >
                  <CardContent className="space-y-3 px-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-base font-semibold break-words">
                        <span className="text-muted-foreground">Question {index + 1}.</span> {question.question}
                      </h2>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center gap-1 text-sm font-medium",
                          isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                        )}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                        ) : (
                          <XCircle className="size-4" aria-hidden="true" />
                        )}
                        {isCorrect ? "Correct" : selectedOptionId ? "Incorrect" : "Unanswered"}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {question.options.map((option) => {
                        const isSelected = selectedOptionId === option.id;
                        const isCorrectOption = option.id === correctOptionId;
                        return (
                          <li
                            key={option.id}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border-2 p-3 text-sm",
                              isSelected && isCorrectOption
                                ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                                : isSelected
                                  ? "border-red-500 bg-red-50 dark:bg-red-950/20"
                                  : isCorrectOption
                                    ? "border-green-300 bg-green-50/50 dark:bg-green-950/10"
                                    : "border-transparent bg-muted/50"
                            )}
                          >
                            <span className="min-w-0 flex-1 break-words">{option.text}</span>
                            {(isSelected || isCorrectOption) && (
                              <span className="flex shrink-0 flex-wrap justify-end gap-1 text-xs font-medium">
                                {isSelected && (
                                  <span className="rounded bg-background px-1.5 py-0.5">Your answer</span>
                                )}
                                {isCorrectOption && (
                                  <span className="inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-green-700 dark:text-green-400">
                                    <CheckCircle2 className="size-3" aria-hidden="true" />
                                    Correct answer
                                  </span>
                                )}
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    <p className="text-xs text-muted-foreground">
                      {question.points} point{question.points !== 1 ? "s" : ""}
                    </p>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>

        {integritySnapshot && (
          <div
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4",
              totalViolations === 0
                ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/10"
                : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/10"
            )}
          >
            <ShieldCheck
              className={cn(
                "mt-0.5 size-5 shrink-0",
                totalViolations === 0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
              )}
              aria-hidden="true"
            />
            <div className="text-sm">
              {totalViolations === 0 ? (
                <p className="font-medium text-green-800 dark:text-green-300">
                  Integrity: no issues recorded for this attempt.
                </p>
              ) : (
                <>
                  <p className="font-medium text-amber-800 dark:text-amber-300">
                    This attempt had {totalViolations} warning(s) recorded:
                  </p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-muted-foreground">
                    {integritySnapshot.tabSwitchCount > 0 && <li>Tab switch / visibility change</li>}
                    {integritySnapshot.backButtonCount > 0 && <li>Back navigation</li>}
                    {integritySnapshot.windowBlurCount > 0 && <li>Window focus lost</li>}
                    {integritySnapshot.visibilityChangeCount > 0 && integritySnapshot.tabSwitchCount === 0 && (
                      <li>Visibility change</li>
                    )}
                    {integritySnapshot.copyAttemptCount > 0 && <li>Copy attempt</li>}
                    {integritySnapshot.pasteAttemptCount > 0 && <li>Paste attempt</li>}
                    {integritySnapshot.rightClickCount > 0 && <li>Right-click</li>}
                    {integritySnapshot.devToolsAttemptCount > 0 && <li>Restricted key / DevTools attempt</li>}
                    {integritySnapshot.screenshotCount > 0 && (
                      <li>Screenshot attempt ({integritySnapshot.screenshotCount})</li>
                    )}
                    {integritySnapshot.printCount > 0 && <li>Print attempt ({integritySnapshot.printCount})</li>}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" size="lg" onClick={handleRetake}>
            <RotateCcw aria-hidden="true" />
            Retake quiz
          </Button>
          <Button size="lg" onClick={() => router.push(lessonHref)}>
            <ArrowLeft aria-hidden="true" />
            Back to lesson
          </Button>
        </div>
      </div>
    );
  }

  const inputsDisabled = isSubmitted || timeUp || !!isExiting || isPending;

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      {/* Sticky exam header: title, progress and timer stay visible while scrolling. */}
      <div className="sticky top-0 z-10 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold sm:text-xl" title={quiz.title}>
              {quiz.title}
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {answeredCount} of {questions.length} answered · Pass mark {quiz.passingScore}%
            </p>
          </div>
          {quiz.timeLimit && (
            <QuizTimer timeLimitMinutes={quiz.timeLimit} onTimeUp={handleTimeUp} isCompleted={isSubmitted} />
          )}
        </div>
        <Progress
          value={questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}
          className="mt-2 h-1"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-4 pt-4">
        {quiz.description && <p className="text-muted-foreground break-words">{quiz.description}</p>}

        {timeUp && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400"
          >
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">
              Time&apos;s up! {isPending ? "Submitting your answers…" : "Your answers are being submitted."}
            </span>
          </div>
        )}

        {submitError && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              Your answers haven&apos;t been submitted yet.
            </p>
            <Button size="lg" variant="outline" onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
              Retry submission
            </Button>
          </div>
        )}

        <ol className="space-y-4">
          {questions.map((question, index) => {
            const headingId = `question-${question.id}`;
            return (
              <li key={question.id}>
                <Card className="gap-4 py-5">
                  <CardContent className="space-y-4 px-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <h2 id={headingId} className="text-base font-semibold break-words sm:text-lg">
                        <span className="text-muted-foreground">Question {index + 1}.</span> {question.question}
                      </h2>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {question.points} pt{question.points !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <RadioGroup
                      aria-labelledby={headingId}
                      value={selectedAnswers[question.id] || ""}
                      onValueChange={(value) => handleAnswerChangeLocal(question.id, value)}
                      disabled={inputsDisabled}
                      className="gap-2"
                    >
                      {question.options.map((option) => {
                        const optionId = `option-${option.id}`;
                        return (
                          <Label
                            key={option.id}
                            htmlFor={optionId}
                            className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm leading-snug font-normal transition-colors select-text hover:bg-muted/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[button:disabled]:cursor-not-allowed has-[button:focus-visible]:ring-[3px] has-[button:focus-visible]:ring-ring/50 sm:text-base"
                          >
                            <RadioGroupItem value={option.id} id={optionId} className="mt-0.5 size-5" />
                            <span className="min-w-0 flex-1 break-words">{option.text}</span>
                          </Label>
                        );
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ol>

        <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {answeredCount} of {questions.length} questions answered
            {unansweredCount > 0 && ` · ${unansweredCount} left`}
          </p>
          <Button
            onClick={requestSubmit}
            disabled={isSubmitted || isPending || timeUp || !!isExiting}
            aria-busy={isPending}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {isPending ? "Submitting…" : "Submit quiz"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Submit with unanswered questions?"
        description={`You have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Unanswered questions are marked incorrect.`}
        cancelLabel="Keep answering"
        confirmLabel="Submit anyway"
        onConfirm={() => {
          handleSubmit();
        }}
      />
    </div>
  );
}
