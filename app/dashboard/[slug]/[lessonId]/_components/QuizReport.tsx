"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, ExternalLink, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface QuizAttempt {
  id: string;
  score: number | null;
  timeSpent: number | null;
  startedAt: Date;
  submittedAt: Date | null;
  isCompleted: boolean;
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

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              {quiz.title} - Report
            </CardTitle>
            {quiz.description && (
              <p className="text-muted-foreground mt-2">{quiz.description}</p>
            )}
          </div>
          <Button onClick={onStartQuiz} size="lg">
            <ExternalLink className="h-4 w-4 mr-2" />
            Take Quiz
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestAttempt && latestAttempt.isCompleted ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className={cn(
                  "border-2",
                  latestAttempt.score && latestAttempt.score >= quiz.passingScore
                    ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10"
                    : "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10"
                )}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Latest Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {latestAttempt.score && latestAttempt.score >= quiz.passingScore ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-3xl font-bold">
                      {latestAttempt.score ?? "N/A"}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {latestAttempt.submittedAt &&
                      formatDistanceToNow(new Date(latestAttempt.submittedAt), {
                        addSuffix: true,
                      })}
                  </p>
                </CardContent>
              </Card>

              {bestAttempt && bestAttempt.id !== latestAttempt.id && (
                <Card className="border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/10">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Best Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      <span className="text-3xl font-bold">
                        {bestAttempt.score ?? "N/A"}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {bestAttempt.submittedAt &&
                        formatDistanceToNow(new Date(bestAttempt.submittedAt), {
                          addSuffix: true,
                        })}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Time Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                    <span className="text-3xl font-bold">
                      {formatTime(latestAttempt.timeSpent)}
                    </span>
                  </div>
                  {quiz.timeLimit && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Time limit: {quiz.timeLimit} min
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-muted">
              <div className="flex-1">
                <p className="text-sm font-medium">Passing Score</p>
                <p className="text-xs text-muted-foreground">
                  You need {quiz.passingScore}% to pass
                </p>
              </div>
              <div
                className={cn(
                  "px-4 py-2 rounded-lg font-semibold",
                  latestAttempt.score && latestAttempt.score >= quiz.passingScore
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {latestAttempt.score && latestAttempt.score >= quiz.passingScore
                  ? "Passed"
                  : "Failed"}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No quiz attempts yet. Click "Take Quiz" to start!
            </p>
          </div>
        )}

        {attempts.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attempt History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attempts.map((attempt, index) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">Attempt #{attempts.length - index}</div>
                      {attempt.score !== null && (
                        <div
                          className={cn(
                            "px-2 py-1 rounded text-xs font-semibold",
                            attempt.score >= quiz.passingScore
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : "bg-red-500/10 text-red-600 dark:text-red-400"
                          )}
                        >
                          {attempt.score}%
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {attempt.timeSpent && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(attempt.timeSpent)}
                        </span>
                      )}
                      {attempt.submittedAt && (
                        <span>
                          {formatDistanceToNow(new Date(attempt.submittedAt), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
