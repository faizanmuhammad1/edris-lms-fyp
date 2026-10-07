"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ExternalLink, BarChart3, ShieldAlert, Trophy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QuizAttempt {
  id: string;
  score: number | null;
  timeSpent: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  isCompleted: boolean;
  tabSwitchCount: number;
  backButtonCount: number;
  windowBlurCount: number;
  visibilityChangeCount: number;
  copyAttemptCount: number;
  pasteAttemptCount: number;
  rightClickCount: number;
  devToolsAttemptCount: number;
}

interface QuizReportProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    timeLimit: number | null;
    passingScore: number;
    questionCount?: number;
  };
  attempts: QuizAttempt[];
  onStartQuiz: () => void;
}

const formatTime = (seconds: number | null) => {
  if (!seconds) return "N/A";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

function violationTotal(attempt: QuizAttempt) {
  return (
    attempt.tabSwitchCount +
    attempt.backButtonCount +
    attempt.windowBlurCount +
    attempt.visibilityChangeCount +
    attempt.copyAttemptCount +
    attempt.pasteAttemptCount +
    attempt.rightClickCount +
    attempt.devToolsAttemptCount
  );
}

export function QuizReport({ quiz, attempts, onStartQuiz }: QuizReportProps) {
  const latestAttempt = attempts.length > 0 ? attempts[0] : null;
  const bestAttempt = attempts.reduce((best, attempt) => {
    if (!attempt.score) return best;
    if (!best || !best.score) return attempt;
    return attempt.score > best.score ? attempt : best;
  }, null as QuizAttempt | null);

  const totalViolations = latestAttempt ? violationTotal(latestAttempt) : 0;
  const hasIntegrityIssues = totalViolations > 0;
  const passedEver = attempts.some((a) => a.isCompleted && (a.score ?? 0) >= quiz.passingScore);
  const isPassed = (attempt: QuizAttempt) => (attempt.score ?? 0) >= quiz.passingScore;

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="flex items-start gap-2 text-xl font-semibold break-words">
            <BarChart3 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            {quiz.title}
          </h3>
          {quiz.description && <p className="max-w-2xl text-muted-foreground break-words">{quiz.description}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {typeof quiz.questionCount === "number" && (
              <span>
                {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"}
              </span>
            )}
            <span>Pass mark: {quiz.passingScore}%</span>
            {quiz.timeLimit && <span>Time limit: {quiz.timeLimit} min</span>}
          </p>
        </div>
        <Button onClick={onStartQuiz} size="lg" className="w-full md:w-auto">
          <ExternalLink aria-hidden="true" />
          {attempts.length > 0 ? (passedEver ? "Retake quiz" : "Try again") : "Start quiz"}
          <span className="sr-only">(opens in a new window)</span>
        </Button>
      </div>

      {latestAttempt && latestAttempt.isCompleted ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-[320px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="integrity" className="gap-1.5">
              Integrity
              {hasIntegrityIssues && (
                <>
                  <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
                  <span className="sr-only">(warnings recorded)</span>
                </>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card
                className={cn(
                  "gap-2 py-5 shadow-none",
                  isPassed(latestAttempt)
                    ? "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/10"
                    : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/10"
                )}
              >
                <CardHeader className="px-5">
                  <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Latest score
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5">
                  <div className="flex items-center gap-3">
                    {isPassed(latestAttempt) ? (
                      <CheckCircle2 className="size-8 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-8 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
                    )}
                    <div>
                      <span className="text-3xl font-bold tracking-tight tabular-nums">{latestAttempt.score ?? 0}%</span>
                      <p className="mt-1 text-sm font-medium">
                        {isPassed(latestAttempt) ? "Passed" : `Not passed (needs ${quiz.passingScore}%)`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {bestAttempt && (
                <Card className="gap-2 py-5 shadow-none">
                  <CardHeader className="px-5">
                    <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                      Best score
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5">
                    <div className="flex items-center gap-3">
                      <Trophy className="size-8 shrink-0 text-primary" aria-hidden="true" />
                      <div>
                        <span className="text-3xl font-bold tracking-tight tabular-nums">{bestAttempt.score ?? 0}%</span>
                        {bestAttempt.submittedAt && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(bestAttempt.submittedAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="gap-2 py-5 shadow-none">
                <CardHeader className="px-5">
                  <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Time spent
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5">
                  <div className="flex items-center gap-3">
                    <Clock className="size-8 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <span className="text-3xl font-bold tracking-tight tabular-nums">
                        {formatTime(latestAttempt.timeSpent)}
                      </span>
                      {quiz.timeLimit && (
                        <p className="mt-1 text-sm text-muted-foreground">Limit: {quiz.timeLimit} min</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="integrity" className="mt-6">
            <Card className="shadow-none">
              <CardHeader className="border-b">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {hasIntegrityIssues ? (
                        <ShieldAlert className="size-5 text-amber-600" aria-hidden="true" />
                      ) : (
                        <ShieldCheck className="size-5 text-green-600" aria-hidden="true" />
                      )}
                      Integrity report
                    </CardTitle>
                    <CardDescription>Monitoring log from your latest attempt.</CardDescription>
                  </div>
                  <p
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      hasIntegrityIssues
                        ? "border-red-200 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                        : "border-green-200 bg-green-100 text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
                    )}
                  >
                    {hasIntegrityIssues
                      ? `${totalViolations} warning${totalViolations === 1 ? "" : "s"} recorded`
                      : "No issues recorded"}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <IntegrityItem label="Tab switches" count={latestAttempt.tabSwitchCount} />
                  <IntegrityItem label="Copy attempts" count={latestAttempt.copyAttemptCount} />
                  <IntegrityItem label="Paste attempts" count={latestAttempt.pasteAttemptCount} />
                  <IntegrityItem label="Window blur" count={latestAttempt.windowBlurCount} />
                  <IntegrityItem label="Right clicks" count={latestAttempt.rightClickCount} />
                  <IntegrityItem label="DevTools" count={latestAttempt.devToolsAttemptCount} />
                  <IntegrityItem label="Visibility change" count={latestAttempt.visibilityChangeCount} />
                  <IntegrityItem label="Back button" count={latestAttempt.backButtonCount} />
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="rounded-xl border-2 border-dashed px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="size-7 text-primary" aria-hidden="true" />
          </div>
          <h4 className="mb-2 text-lg font-semibold">No attempts yet</h4>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            The quiz opens in a focused exam window. Make sure you have time to finish before you start.
          </p>
        </div>
      )}

      {attempts.length > 1 && (
        <div>
          <h4 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Clock className="size-4 text-muted-foreground" aria-hidden="true" />
            Attempt history
          </h4>
          <ol className="divide-y rounded-lg border bg-card">
            {attempts.map((attempt, index) => (
              <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    <span className="sr-only">Attempt </span>#{attempts.length - index}
                  </span>
                  <div>
                    <p className="flex items-center gap-1.5 text-sm">
                      {isPassed(attempt) ? (
                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                      ) : (
                        <XCircle className="size-4 text-red-600 dark:text-red-400" aria-hidden="true" />
                      )}
                      <span className="font-bold tabular-nums">{attempt.score ?? 0}%</span>
                      <span className="text-muted-foreground">· {isPassed(attempt) ? "Passed" : "Not passed"}</span>
                    </p>
                    {attempt.submittedAt && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(attempt.submittedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <p className="flex items-center gap-1 text-sm font-medium tabular-nums">
                  <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Time spent: </span>
                  {formatTime(attempt.timeSpent)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function IntegrityItem({ label, count }: { label: string; count: number }) {
  return (
    <li
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border p-3 text-center",
        count > 0 ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/10" : "bg-muted/30"
      )}
    >
      <span
        className={cn(
          "text-2xl font-bold tabular-nums",
          count > 0 ? "text-red-700 dark:text-red-400" : "text-muted-foreground"
        )}
      >
        {count}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </li>
  );
}
