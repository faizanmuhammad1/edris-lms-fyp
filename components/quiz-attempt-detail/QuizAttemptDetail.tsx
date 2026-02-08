"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, ShieldAlert, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";

const VIOLATION_LABELS: Record<string, string> = {
  tab_switch: "Tab switch",
  back_navigation: "Back navigation",
  window_blur: "Window focus lost",
  fullscreen_exit: "Fullscreen exit",
  copy: "Copy attempt",
  paste: "Paste attempt",
  right_click: "Right-click",
  devtools: "DevTools / restricted key",
};

export interface QuizAttemptDetailData {
  student: { name: string; email: string; image?: string | null };
  course: { title: string };
  lesson?: { title: string };
  quiz: {
    title: string;
    passingScore: number;
    questions: Array<{
      id: string;
      question: string;
      points: number;
      position?: number;
      options: Array<{ id: string; text: string; isCorrect: boolean; position: number }>;
    }>;
  };
  score: number;
  timeSpent: number;
  startedAt: Date;
  submittedAt: Date | null;
  passed: boolean;
  tabSwitchCount: number;
  backButtonCount: number;
  windowBlurCount: number;
  visibilityChangeCount: number;
  copyAttemptCount: number;
  pasteAttemptCount: number;
  rightClickCount: number;
  devToolsAttemptCount: number;
  violationLog: Array<{ type: string; at: string }>;
  answers: Array<{ questionId: string; optionId: string | null; isCorrect: boolean | null }>;
}

function getTotalViolations(a: QuizAttemptDetailData): number {
  return (
    a.tabSwitchCount +
    a.backButtonCount +
    a.windowBlurCount +
    a.visibilityChangeCount +
    a.copyAttemptCount +
    a.pasteAttemptCount +
    a.rightClickCount +
    a.devToolsAttemptCount
  );
}

function getSeverity(total: number): "clean" | "low" | "medium" | "high" {
  if (total === 0) return "clean";
  if (total <= 2) return "low";
  if (total <= 5) return "medium";
  return "high";
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function QuizAttemptDetail({ attempt }: { attempt: QuizAttemptDetailData }) {
  const totalViolations = getTotalViolations(attempt);
  const severity = getSeverity(totalViolations);

  const integrityCounts = [
    { label: "Tab switch", value: attempt.tabSwitchCount },
    { label: "Back button", value: attempt.backButtonCount },
    { label: "Window blur", value: attempt.windowBlurCount },
    { label: "Visibility change", value: attempt.visibilityChangeCount },
    { label: "Copy attempt", value: attempt.copyAttemptCount },
    { label: "Paste attempt", value: attempt.pasteAttemptCount },
    { label: "Right-click", value: attempt.rightClickCount },
    { label: "DevTools attempt", value: attempt.devToolsAttemptCount },
  ];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={attempt.student.image ?? ""} alt={attempt.student.name} />
              <AvatarFallback>{attempt.student.name?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{attempt.student.name}</p>
              <p className="text-sm text-muted-foreground">{attempt.student.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Course</span>
            <span>{attempt.course.title}</span>
            {attempt.lesson && (
              <>
                <span className="text-muted-foreground">Lesson</span>
                <span>{attempt.lesson.title}</span>
              </>
            )}
            <span className="text-muted-foreground">Quiz</span>
            <span>{attempt.quiz.title}</span>
            <span className="text-muted-foreground">Score</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold">{attempt.score}%</span>
              {attempt.passed ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
            </span>
            <span className="text-muted-foreground">Time spent</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(attempt.timeSpent)}
            </span>
            <span className="text-muted-foreground">Started</span>
            <span>{new Date(attempt.startedAt).toLocaleString()}</span>
            <span className="text-muted-foreground">Submitted</span>
            <span>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="integrity" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integrity">Integrity</TabsTrigger>
          <TabsTrigger value="answers">Answers</TabsTrigger>
        </TabsList>
        <TabsContent value="integrity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Integrity
                </CardTitle>
                <Badge
                  variant="outline"
                  className={cn(
                    severity === "clean" && "border-green-500 text-green-600 dark:text-green-400",
                    severity === "low" && "border-amber-500 text-amber-600 dark:text-amber-400",
                    severity === "medium" && "border-orange-500 text-orange-600 dark:text-orange-400",
                    severity === "high" && "border-red-500 text-red-600 dark:text-red-400"
                  )}
                >
                  {totalViolations === 0 ? "Clean" : `${totalViolations} violation${totalViolations !== 1 ? "s" : ""}`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {integrityCounts.map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={value > 0 ? "font-medium" : ""}>{value}</span>
                  </div>
                ))}
              </div>
              {attempt.violationLog.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Timeline</p>
                  <ul className="space-y-1 text-sm border rounded-lg p-3 bg-muted/30 max-h-48 overflow-y-auto">
                    {attempt.violationLog.map((entry, i) => (
                      <li key={i} className="flex justify-between gap-2">
                        <span className="text-muted-foreground">
                          {new Date(entry.at).toLocaleTimeString()}
                        </span>
                        <span>{VIOLATION_LABELS[entry.type] ?? entry.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="answers" className="space-y-4">
          <div className="space-y-4">
            {[...attempt.quiz.questions]
              .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
              .map((q, index) => {
                const answer = attempt.answers.find((a) => a.questionId === q.id);
                const isCorrect = answer?.isCorrect ?? false;
                const selectedOptionId = answer?.optionId ?? null;

                return (
                  <Card
                    key={q.id}
                    className={cn(
                      "border-2",
                      isCorrect
                        ? "border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/10"
                        : "border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10"
                    )}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-base">
                          Question {index + 1}: {q.question}
                        </CardTitle>
                        <div className="flex items-center gap-2 shrink-0">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className="text-xs text-muted-foreground">{q.points} pt{q.points !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {q.options
                          .sort((a, b) => a.position - b.position)
                          .map((opt) => {
                            const selected = selectedOptionId === opt.id;
                            const correct = opt.isCorrect;
                            return (
                              <li
                                key={opt.id}
                                className={cn(
                                  "flex items-center gap-2 p-2 rounded-lg border",
                                  selected && correct && "border-green-500 bg-green-50 dark:bg-green-950/20",
                                  selected && !correct && "border-red-500 bg-red-50 dark:bg-red-950/20",
                                  !selected && correct && "border-green-300 bg-green-50/50 dark:bg-green-950/10",
                                  !selected && !correct && "border-transparent bg-muted/30"
                                )}
                              >
                                {selected ? (
                                  correct ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                                  )
                                ) : correct ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                ) : (
                                  <span className="w-4 shrink-0" />
                                )}
                                <span className={cn(correct && "font-medium text-green-700 dark:text-green-400")}>
                                  {opt.text}
                                </span>
                                {selected && !correct && <span className="text-xs text-muted-foreground">(selected)</span>}
                                {correct && !selected && <span className="text-xs text-muted-foreground">(correct)</span>}
                              </li>
                            );
                          })}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
