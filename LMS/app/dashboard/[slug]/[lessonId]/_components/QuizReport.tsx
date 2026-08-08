"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ExternalLink, BarChart3, ShieldAlert } from "lucide-react";
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
  };
  attempts: QuizAttempt[];
  onStartQuiz: () => void;
}

export function QuizReport({ quiz, attempts, onStartQuiz }: QuizReportProps) {
  const latestAttempt = attempts.length > 0 ? attempts[0] : null;
  const bestAttempt = attempts.reduce((best, attempt) => {
    if (!attempt.score) return best;
    if (!best || !best.score) return attempt;
    return attempt.score > best.score ? attempt : best;
  }, null as QuizAttempt | null);

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const hasIntegrityIssues = latestAttempt ? (
    latestAttempt.tabSwitchCount +
    latestAttempt.backButtonCount +
    latestAttempt.windowBlurCount +
    latestAttempt.visibilityChangeCount +
    latestAttempt.copyAttemptCount +
    latestAttempt.pasteAttemptCount +
    latestAttempt.rightClickCount +
    latestAttempt.devToolsAttemptCount > 0
  ) : false;

  const totalViolations = latestAttempt ? (
    latestAttempt.tabSwitchCount +
    latestAttempt.backButtonCount +
    latestAttempt.windowBlurCount +
    latestAttempt.visibilityChangeCount +
    latestAttempt.copyAttemptCount +
    latestAttempt.pasteAttemptCount +
    latestAttempt.rightClickCount +
    latestAttempt.devToolsAttemptCount
  ) : 0;

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            {quiz.title}
          </h2>
          {quiz.description && (
            <p className="text-muted-foreground mt-1 max-w-2xl">{quiz.description}</p>
          )}
        </div>
        <Button onClick={onStartQuiz} size="lg" className="shadow-lg hover:shadow-xl transition-all">
          <ExternalLink className="h-4 w-4 mr-2" />
          Take Quiz
        </Button>
      </div>

      <div className="space-y-8">
        {latestAttempt && latestAttempt.isCompleted ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="integrity" className="relative">
                Integrity
                {hasIntegrityIssues && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={cn(
                    "border shadow-sm overflow-hidden relative",
                    latestAttempt.score && latestAttempt.score >= quiz.passingScore
                      ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800"
                      : "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-800"
                  )}
                >
                  <div className={cn("absolute top-0 left-0 w-1 h-full", latestAttempt.score && latestAttempt.score >= quiz.passingScore ? "bg-green-500" : "bg-red-500")} />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Latest Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {latestAttempt.score && latestAttempt.score >= quiz.passingScore ? (
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                      )}
                      <div>
                        <span className="text-4xl font-bold tracking-tight">
                          {latestAttempt.score ?? 0}%
                        </span>
                        <p className="text-xs text-muted-foreground font-medium mt-1">
                          {latestAttempt.score && latestAttempt.score >= quiz.passingScore ? "Passed" : "Failed"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {bestAttempt && (
                  <Card className="border shadow-sm bg-blue-50/30 dark:bg-blue-950/5 border-blue-100 dark:border-blue-900 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Best Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">TOP</span>
                        </div>
                        <div>
                          <span className="text-4xl font-bold tracking-tight">
                            {bestAttempt.score ?? 0}%
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {bestAttempt.submittedAt && formatDistanceToNow(new Date(bestAttempt.submittedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Time Spent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-muted-foreground/50" />
                      <div>
                        <span className="text-4xl font-bold tracking-tight">
                          {formatTime(latestAttempt.timeSpent)}
                        </span>
                        {quiz.timeLimit && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Limit: {quiz.timeLimit} min
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="integrity" className="mt-6">
              <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-orange-500" />
                        Integrity Report
                      </CardTitle>
                      <CardDescription>
                        Monitoring logs from your latest attempt.
                      </CardDescription>
                    </div>
                    {totalViolations > 0 && (
                      <div className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold border border-red-200">
                        {totalViolations} Violations Detected
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <IntegrityItem label="Tab Switches" count={latestAttempt.tabSwitchCount} />
                    <IntegrityItem label="Copy Attempts" count={latestAttempt.copyAttemptCount} />
                    <IntegrityItem label="Paste Attempts" count={latestAttempt.pasteAttemptCount} />
                    <IntegrityItem label="Window Blur" count={latestAttempt.windowBlurCount} />
                    <IntegrityItem label="Right Clicks" count={latestAttempt.rightClickCount} />
                    <IntegrityItem label="DevTools" count={latestAttempt.devToolsAttemptCount} />
                    <IntegrityItem label="Visibility Change" count={latestAttempt.visibilityChangeCount} />
                    <IntegrityItem label="Back Button" count={latestAttempt.backButtonCount} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border-dashed border-2 py-12 text-center bg-muted/5">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Quiz Attempts Yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              You haven&apos;t taken this quiz yet. Click the button above to start your first attempt.
            </p>
            <Button onClick={onStartQuiz} variant="outline">
              Start Quiz
            </Button>
          </Card>
        )}

        {attempts.length > 1 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Attempt History
            </h3>
            <div className="border rounded-lg divide-y bg-card">
              {attempts.map((attempt, index) => (
                <div
                  key={attempt.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                      #{attempts.length - index}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-bold",
                          attempt.score && attempt.score >= quiz.passingScore ? "text-green-600" : "text-red-600"
                        )}>
                          {attempt.score ?? 0}%
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          • {attempt.score && attempt.score >= quiz.passingScore ? "Passed" : "Failed"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {attempt.submittedAt && formatDistanceToNow(new Date(attempt.submittedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-medium flex items-center gap-1 justify-end">
                      <Clock className="size-3 text-muted-foreground" />
                      {formatTime(attempt.timeSpent)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function IntegrityItem({ label, count }: { label: string; count: number }) {
  return (
    <div className={cn(
      "p-3 rounded-lg border flex flex-col items-center justify-center text-center gap-1",
      count > 0 ? "bg-red-50 dark:bg-red-950/10 border-red-200 dark:border-red-900" : "bg-muted/30"
    )}>
      <span className={cn("text-2xl font-bold", count > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground")}>
        {count}
      </span>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
